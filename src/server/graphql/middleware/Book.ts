import GQLMiddleware from '@server/graphql/GQLMiddleware';
import os from 'os';
import path from 'path';

import uuidv4 from 'uuid/v4';
import rimraf from 'rimraf';
import { orderBy as naturalOrderBy } from 'natural-orderby';
import { withFilter } from 'graphql-subscriptions';

import {
  BookOrder, MutationResolvers, QueryResolvers, SubscriptionResolvers,
} from '@common/GQLTypes';

import BookModel from '@server/sequelize/models/Book';
import BookInfoModel from '@server/sequelize/models/BookInfo';
import ModelUtil from '@server/ModelUtil';
import Errors from '@server/Errors';
import Database from '@server/sequelize/models';
import { SubscriptionKeys } from '@server/graphql';
import GQLUtil from '@server/graphql/GQLUtil';
import { asyncForEach, asyncMap } from '@server/Util';
import { Op } from 'sequelize';

class Book extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Query(): QueryResolvers {
    // noinspection JSUnusedGlobalSymbols
    return {
      books: async (parent, {
        id: infoId,
        limit,
        offset,
        order,
      }) => {
        const where: any = {};
        if (infoId) where.infoId = infoId;
        const books = await BookModel.findAll({
          where,
          include: [{ model: BookInfoModel, as: 'info' }],
          limit,
          offset,
          order: [
            ['infoId', 'desc'],
          ],
        });
        const bookModels = naturalOrderBy(
          books,
          [(v) => v.infoId, (v) => v.number],
        ).map((book) => ModelUtil.book(book));
        return (order === BookOrder.Desc) ? bookModels.reverse() : bookModels;
      },
      book: async (parent, { id: bookId }) => {
        const book = await BookModel.findOne({
          where: { id: bookId },
          include: [
            {
              model: BookInfoModel,
              as: 'info',
            },
          ],
        });
        if (book) return ModelUtil.book(book);
        return null;
      },
    };
  }

  Mutation(): MutationResolvers {
    // noinspection JSUnusedGlobalSymbols
    return {
      addBook: async (
        parent, args, context, info,
      ) => GQLUtil.Mutation.addBook(
        this.gm, this.pubsub,
        parent, args, context, info, undefined,
      ),
      addBooks: async (
        parent, args, context, info,
      ) => GQLUtil.Mutation.addBooks(
        this.gm, this.pubsub,
        parent, args, context, info, undefined,
      ),
      addCompressBook: async (parent, {
        id: infoId,
        file: compressBooks,
      }) => {
        const tempPath = `${os.tmpdir()}/bookReader/${infoId}`;
        const type = await GQLUtil.checkArchiveType(compressBooks);
        if (type.success === false) {
          return type;
        }
        const { createReadStream, archiveType } = type;

        await this.pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
          id: infoId,
          addBooks: 'Extract Book...',
        });

        await GQLUtil.extractCompressFile(tempPath, archiveType, createReadStream);

        const { booksFolderPath, bookFolders } = await GQLUtil.searchBookFolders(tempPath);
        if (bookFolders.length === 0) {
          return {
            success: false,
            code: 'QL0006',
            message: Errors.QL0006,
          };
        }

        await this.pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
          id: infoId,
          addBooks: 'Move Book...',
        });

        const results = await asyncMap(bookFolders, async (p, i) => {
          const folderPath = path.join(tempPath, booksFolderPath, p);
          let nums = p.match(/\d+/g);
          if (nums) {
            nums = Number(nums[nums.length - 1]).toString(10);
          } else {
            nums = `${i + 1}`;
          }

          await this.pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
            id: infoId,
            addBooks: `Move Book (${nums}) ...`,
          });

          return GQLUtil.addBookFromLocalPath(
            this.gm,
            folderPath,
            infoId,
            uuidv4(),
            nums,
            undefined,
            (resolve) => {
              rimraf(folderPath, () => resolve());
            },
          ).catch((e) => {
            throw e;
          });
        });
        await new Promise((resolve) => rimraf(tempPath, resolve));
        return {
          success: true,
          bookResults: results,
        };
      },
      editBook: async (parent, { id: bookId, number, thumbnail }) => {
        if (number === undefined && thumbnail === undefined) {
          return {
            success: false,
            code: 'QL0005',
            message: Errors.QL0005,
          };
        }
        const book = await BookModel.findOne({
          where: { id: bookId },
        });
        if (!book) {
          return {
            success: false,
            code: 'QL0001',
            message: Errors.QL0001,
          };
        }
        const val = Object.entries({ number, thumbnail }).reduce((o, e) => {
          if (e[1] !== undefined && book[e[0]] !== e[1]) {
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
        await BookModel.update(val, {
          where: { id: bookId },
        });
        return {
          success: true,
        };
      },
      deleteBook: async (parent, { id: bookId }) => {
        const book = await BookModel.findOne({
          where: {
            id: bookId,
          },
        });
        if (!book) {
          return {
            success: false,
            code: 'QL0004',
            message: Errors.QL0004,
          };
        }
        await Database.sequelize.transaction(async (transaction) => {
          await book.destroy({ transaction });
          await BookInfoModel.update({
            // @ts-ignore
            count: Database.sequelize.literal('count - 1'),
          }, {
            where: {
              id: book.infoId,
            },
            transaction,
          });
        });
        await new Promise((resolve) => {
          rimraf(`storage/book/${bookId}`, () => {
            rimraf(`storage/cache/book/${bookId}`, () => resolve());
          });
        });
        return {
          success: true,
        };
      },
      deleteBooks: async (parent, { infoId, ids: bookIds }) => {
        await Database.sequelize.transaction(async (transaction) => {
          const count = await BookModel.destroy({
            where: {
              id: { [Op.in]: bookIds },
              infoId,
            },
            transaction,
          });
          await BookInfoModel.update({
            // @ts-ignore
            count: Database.sequelize.literal(`count - ${count}`),
          }, {
            where: { id: infoId },
            transaction,
          });
        });
        await asyncForEach(bookIds, (bookId) => new Promise((resolve) => {
          rimraf(`storage/book/${bookId}`, () => {
            rimraf(`storage/cache/book/${bookId}`, () => resolve());
          });
        }));
        return {
          success: true,
        };
      },
      moveBooks: async (parent, { infoId, ids: bookIds }) => {
        await BookModel.update({ infoId }, {
          where: {
            id: { [Op.in]: bookIds },
          },
        });
        return {
          success: true,
        };
      },
    };
  }

  Subscription(): SubscriptionResolvers {
    // noinspection JSUnusedGlobalSymbols
    return {
      addBooks: {
        subscribe: withFilter(
          () => this.pubsub.asyncIterator([SubscriptionKeys.ADD_BOOKS]),
          (payload, variables) => payload.id === variables.id,
        ),
      },
    };
  }
}

// noinspection JSUnusedGlobalSymbols
export default Book;
