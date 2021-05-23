import GQLMiddleware from '@server/graphql/GQLMiddleware';

import { promises as fs } from 'fs';

import { v4 as uuidv4 } from 'uuid';
import Sequelize, { Op } from 'sequelize';
import { orderBy as naturalOrderBy } from 'natural-orderby';
import { withFilter } from 'graphql-subscriptions';

import {
  BookOrder,
  MutationResolvers,
  QueryResolvers,
  SubscriptionResolvers,
} from '@syuchan1005/book-reader-graphql';

import Database from '@server/sequelize/models';
import BookInfoModel from '@server/sequelize/models/BookInfo';
import BookModel from '@server/sequelize/models/Book';
import GenreModel from '@server/sequelize/models/Genre';
import ModelUtil from '@server/ModelUtil';
import Errors from '@server/Errors';
import GQLUtil from '@server/graphql/GQLUtil';
import { asyncForEach } from '@server/Util';
import { SubscriptionKeys } from '@server/graphql';
import InfoGenreModel from '@server/sequelize/models/InfoGenre';
import { purgeImageCache } from '@server/ImageUtil';

class BookInfo extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Query(): QueryResolvers {
    return {
      bookInfos: async (parent, {
        offset,
        length,
        search,
        genres,
        history,
        order,
      }) => {
        const infos = await BookInfoModel.findAll({
          offset,
          limit: length + 1,
          order: [GQLUtil.bookInfoOrderToOrderBy(order)],
          where: Object.fromEntries(Object.entries({
            history,
            id: genres.length === 0
              ? {
                [Op.notIn]: Sequelize.literal('('
                  + 'SELECT DISTINCT infoId FROM infoGenres INNER JOIN genres g on infoGenres.genreId = g.id WHERE invisible == 1'
                  + ')'),
              }
              : {
                [Op.in]: Sequelize.literal('('
                  // @ts-ignore
                  + `SELECT DISTINCT infoId FROM infoGenres INNER JOIN genres g on infoGenres.genreId = g.id WHERE name in (${genres.map((g) => `'${g}'`).join(', ')})` // TODO: escape
                  + ')'),
              },
            name: search ? {
              [Op.like]: `%${search}%`,
            } : undefined,
          }).filter((e) => e[1] !== undefined)),
          include: [
            {
              model: GenreModel,
              as: 'genres',
            },
            {
              model: BookModel,
              as: 'thumbnailBook'
            }
          ],
        });

        return {
          hasNext: infos.length === length + 1,
          infos: infos.slice(0, length).map((info) => ModelUtil.bookInfo(info)),
        };
      },
      bookInfo: async (parent, { id: infoId }) => {
        const bookInfo = await BookInfoModel.findOne({
          where: { id: infoId },
        });
        if (bookInfo) {
          return ModelUtil.bookInfo(bookInfo);
        }
        return null;
      },
    };
  }

  Mutation(): MutationResolvers {
    // noinspection JSUnusedGlobalSymbols
    return {
      addBookInfo: async (parent, {
        name,
        genres,
      }) => {
        const infoId = uuidv4();
        await BookInfoModel.create({
          id: infoId,
          name,
        });
        if (genres && genres.length >= 1) {
          await GQLUtil.linkGenres(infoId, genres);
        }
        await this.pubsub.publish(SubscriptionKeys.ADD_BOOK_INFO, { name, addBookInfo: 'add to database' });

        return {
          success: true,
          infoId,
        };
      },
      editBookInfo: async (parent, {
        id: infoId,
        name,
        thumbnail,
        genres,
      }) => {
        if (![name, thumbnail, genres].some((v) => v !== undefined)) {
          return {
            success: false,
            code: 'QL0005',
            message: Errors.QL0005,
          };
        }
        let info = await BookInfoModel.findOne({
          where: { id: infoId },
          include: [{
            model: GenreModel,
            as: 'genres',
          }],
        });
        if (!info) {
          return {
            success: false,
            code: 'QL0001',
            message: Errors.QL0001,
          };
        }
        info = {
          // @ts-ignore
          ...info.dataValues,
          genres: info.genres.map((g) => g.name),
        };
        const val: { [key: string]: any } = Object.entries({
          name,
          thumbnail,
          genres,
        }).reduce((o, e) => {
          if (e[1] !== undefined) {
            if (Array.isArray(e[1])) {
              if (e[1].filter((a) => !info[e[0]].includes(a)).length !== 0
                || info[e[0]].filter((a) => !e[1].includes(a)).length !== 0) {
                // eslint-disable-next-line no-param-reassign,prefer-destructuring
                o[e[0]] = e[1];
              }
            } else if (info[e[0]] !== e[1]) {
              // eslint-disable-next-line no-param-reassign,prefer-destructuring
              o[e[0]] = e[1];
            }
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
        if (val.genres) {
          await GQLUtil.linkGenres(infoId, val.genres);
          delete val.genres;
        }
        await BookInfoModel.update(val, {
          where: { id: infoId },
        });
        return {
          success: true,
        };
      },
      deleteBookInfo: async (parent, { id: infoId }) => {
        const books = await BookModel.findAll({
          where: {
            infoId,
          },
        });

        await Database.sequelize.transaction(async (transaction) => {
          await BookModel.destroy({
            where: {
              infoId,
            },
            transaction,
          });
          await InfoGenreModel.destroy({
            where: {
              infoId,
            },
            transaction,
          });
          await BookInfoModel.destroy({
            where: {
              id: infoId,
            },
            transaction,
          });
        });

        await asyncForEach(books, async (book) => {
          await fs.rm(`storage/cache/book/${book.id}`, { recursive: true, force: true });
          await fs.rm(`storage/book/${book.id}`, { recursive: true, force: true });
        });
        purgeImageCache();

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

  Subscription(): SubscriptionResolvers {
    return {
      addBookInfo: {
        subscribe: withFilter(
          () => this.pubsub.asyncIterator([SubscriptionKeys.ADD_BOOK_INFO]),
          (payload, variables) => payload.name === variables.name,
        ),
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  Resolver() {
    return {
      BookInfo: {
        books: async ({ id }, { order }: { order: BookOrder }) => {
          const sortNumber = order.startsWith('Number_');
          let books = await BookModel.findAll({
            where: { infoId: id },
            order: sortNumber ? undefined : [
              ['updatedAt', order === BookOrder.UpdateNewest ? 'asc' : 'desc'],
            ],
          });
          if (sortNumber) {
            books = naturalOrderBy(
              books || [],
              [(v) => v.number],
            );
            if (order === BookOrder.NumberDesc) books.reverse();
          }
          return books.map((book) => ModelUtil.book(book, false, id));
        },
      },
    };
  }
}

// noinspection JSUnusedGlobalSymbols
export default BookInfo;
