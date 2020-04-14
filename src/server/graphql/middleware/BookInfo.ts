import GQLMiddleware from '@server/graphql/GQLMiddleware';

import { promises as fs } from 'fs';

import { v4 as uuidv4 } from 'uuid';
import rimraf from 'rimraf';
import { col, fn, Op } from 'sequelize';
import { orderBy as naturalOrderBy } from 'natural-orderby';
import { withFilter } from 'graphql-subscriptions';

import {
  BookOrder,
  MutationResolvers,
  QueryResolvers,
  SubscriptionResolvers,
} from '@common/GQLTypes';

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

class BookInfo extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Query(): QueryResolvers {
    return {
      bookInfos: async (parent, {
        limit,
        offset,
        search,
        order,
        genres = [],
        history,
      }) => {
        if (!history && (!genres || genres.length === 0)) return { length: 0, infos: [] };
        const where: { [key: string]: any } = {};
        if (search) {
          where.name = {
            [Op.like]: `%${search}%`,
          };
        } else {
          where.history = history;
          if (!history) {
            const genresWithOutNoGenre = genres.filter((g) => g !== 'NO_GENRE');
            const inGenreInfoIds = [];
            if (genresWithOutNoGenre.length > 0) {
              const genreIds = (await GenreModel.findAll({
                attributes: ['id'],
                where: {
                  name: {
                    [Op.in]: genresWithOutNoGenre,
                  },
                },
              })).map(({ id }) => id);
              if (genreIds.length > 0) {
                inGenreInfoIds.push(...(await InfoGenreModel.findAll({
                  attributes: ['infoId'],
                  where: (genreIds.length > 1 ? {
                    genreId: {
                      [Op.in]: genreIds,
                    },
                  } : {
                    genreId: genreIds[0],
                  }),
                })).map(({ infoId }) => infoId));
              }
            }
            if (genres.includes('NO_GENRE')) {
              const hasGenreIds = await InfoGenreModel.findAll({
                attributes: [[fn('DISTINCT', col('infoId')), 'infoId']],
              });
              const ids = await BookInfoModel.findAll({
                attributes: ['id'],
                where: {
                  id: {
                    [Op.notIn]: hasGenreIds.map(({ infoId }) => infoId),
                  },
                },
              });
              inGenreInfoIds.push(...(ids.map(({ id }) => id)));
            }
            if (inGenreInfoIds.length === 0) return { length: 0, infos: [] };
            where.id = {
              [Op.in]: inGenreInfoIds,
            };
          } else if (genres.includes('NO_GENRE')) delete where.history;
        }
        const bookInfos = await BookInfoModel.findAll({
          limit,
          offset,
          where,
          // @ts-ignore
          order: [GQLUtil.bookInfoOrderToOrderBy(order)],
          include: [{
            model: GenreModel,
            as: 'genres',
          }],
        });
        const length = await BookInfoModel.count({
          where,
        });
        return {
          length,
          infos: bookInfos.map((info) => ModelUtil.bookInfo(info)),
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
        thumbnail,
        genres,
      }) => {
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
        if (genres && genres.length >= 1) {
          await GQLUtil.linkGenres(infoId, genres);
        }
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
          await new Promise((resolve) => {
            rimraf(`storage/book/${book.id}`, () => {
              rimraf(`storage/cache/book/${book.id}`, () => resolve());
            });
          });
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
