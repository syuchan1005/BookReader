import GQLMiddleware from '@server/graphql/GQLMiddleware';

import { promises as fs } from 'fs';

import * as uuidv4 from 'uuid/v4';
import * as rimraf from 'rimraf';
import { Op } from 'sequelize';
import { orderBy as naturalOrderBy } from 'natural-orderby';
import { withFilter } from 'graphql-subscriptions';

import {
  BookInfoList, BookInfo as BookInfoType, Result, BookInfoResult, ResultWithInfoId,
} from '@common/GraphqlTypes';

import Database from '@server/sequelize/models';
import BookInfoModel from '@server/sequelize/models/bookInfo';
import ModelUtil from '@server/ModelUtil';
import BookModel from '@server/sequelize/models/book';
import Errors from '@server/Errors';
import { asyncForEach } from '@server/Util';
import { SubscriptionKeys } from '@server/graphql';

class BookInfo extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Query() {
    return {
      bookInfos: async (parent, {
        limit,
        offset,
        search,
        order,
        history,
      }): Promise<BookInfoList> => {
        const where = (search) ? {
          name: {
            [Op.like]: `%${search}%`,
          },
        } : {};
        if (!history) {
          // @ts-ignore
          where.history = false;
        }
        const [infos, len] = await Database.sequelize.transaction(async (transaction) => {
          const bookInfos = await BookInfoModel.findAll({
            transaction,
            limit,
            offset,
            where,
            order: [
              [
                (order.startsWith('Add')) ? 'createdAt' : 'updatedAt',
                (order.endsWith('Newest')) ? 'desc' : 'asc',
              ],
            ],
          });
          const length = await BookInfoModel.count({
            transaction,
            where,
          });
          return [bookInfos, length];
        });

        return {
          length: len,
          infos: infos.map((info) => ModelUtil.bookInfo(info)),
        };
      },
      bookInfo: async (parent, { id: infoId }, context, info): Promise<BookInfoType> => {
        let booksField;
        info.operation.selectionSet.selections.some((section) => {
          if (section.kind !== 'Field') return false;
          return section.selectionSet.selections.some(
            (sec) => {
              const ret = sec.kind === 'Field' && sec.name.value === 'books';
              if (ret) booksField = sec;
              return ret;
            },
          );
        });
        let bookOrder;
        if (booksField && booksField.arguments.length > 0) {
          const o = booksField.arguments.find((arg) => arg.name.value === 'order');
          bookOrder = o.value.value;
        }

        const bookInfo = await BookInfoModel.findOne({
          where: { id: infoId },
          include: booksField ? [
            {
              model: BookModel,
              as: 'books',
            },
          ] : [],
        });
        if (bookInfo) {
          bookInfo.books = naturalOrderBy(
            bookInfo.books || [],
            [(v) => v.number],
          );
          if (bookOrder === 'DESC') bookInfo.books.reverse();
          return ModelUtil.bookInfo(bookInfo);
        }
        return null;
      },
    };
  }

  Mutation() {
    // noinspection JSUnusedGlobalSymbols
    return {
      addBookInfo: async (parent, {
        name,
        thumbnail,
      }): Promise<ResultWithInfoId> => {
        const infoId = uuidv4();
        let thumbnailStream;
        if (thumbnail) {
          const { createReadStream, mimetype } = await thumbnail;
          if (!mimetype.startsWith('image/jpeg')) {
            return {
              success: false,
              code: 'QL0000',
              message: Errors.QL0000,
            };
          }
          thumbnailStream = createReadStream;
        }
        await BookInfoModel.create({
          id: infoId,
          name,
          thumbnail: thumbnail ? `bookInfo/${infoId}.jpg` : null,
        });
        await this.pubsub.publish(SubscriptionKeys.ADD_BOOK_INFO, { name, addBookInfo: 'add to database' });

        if (thumbnailStream) {
          await fs.writeFile(`storage/bookInfo/${infoId}.jpg`, thumbnailStream());
          await this.pubsub.publish(SubscriptionKeys.ADD_BOOK_INFO, { name, addBookInfo: 'Thumbnail Saved' });
        }

        return {
          success: true,
          infoId,
        };
      },
      editBookInfo: async (parent, { id: infoId, name, thumbnail }): Promise<Result> => {
        if (name === undefined && thumbnail === undefined) {
          return {
            success: false,
            code: 'QL0005',
            message: Errors.QL0005,
          };
        }
        const info = await BookInfoModel.findOne({
          where: { id: infoId },
        });
        if (!info) {
          return {
            success: false,
            code: 'QL0001',
            message: Errors.QL0001,
          };
        }
        const val = Object.entries({ name, thumbnail }).reduce((o, e) => {
          if (e[1] !== undefined && info[e[0]] !== e[1]) {
            // eslint-disable-next-line no-param-reassign,prefer-destructuring
            o[e[0]] = e[1];
          }
          return o;
        }, {});
        if (Object.keys(val).length === 0) {
          return {
            success: false,
            code: 'QL0005',
            message: Errors.QL0005,
          };
        }
        await BookInfoModel.update(val, {
          where: { id: infoId },
        });
        return {
          success: true,
        };
      },
      deleteBookInfo: async (parent, { id: infoId }): Promise<BookInfoResult> => {
        const books = await BookModel.findAll({
          where: {
            infoId,
          },
        });
        await asyncForEach(books, async (book) => {
          await new Promise((resolve) => {
            rimraf(`storage/book/${book.id}`, () => {
              rimraf(`storage/cache/book/${book.id}`, () => resolve());
            });
          });
        });
        await BookModel.destroy({
          where: {
            infoId,
          },
        });
        await BookInfoModel.destroy({
          where: {
            id: infoId,
          },
        });
        return {
          success: true,
          books: books.map((b) => ModelUtil.book(b, false)),
        };
      },
      addBookInfoHistories: async (parent, { histories }) => {
        await BookInfoModel.bulkCreate(
          histories.map((h) => ({
            ...h,
            id: uuidv4(),
            history: true,
          })), {
            ignoreDuplicates: true,
          },
        );
        return {
          success: true,
        };
      },
    };
  }

  Subscription() {
    return {
      addBookInfo: {
        subscribe: withFilter(
          () => this.pubsub.asyncIterator([SubscriptionKeys.ADD_BOOK_INFO]),
          (payload, variables) => payload.name === variables.name,
        ),
      },
    };
  }
}

// noinspection JSUnusedGlobalSymbols
export default BookInfo;
