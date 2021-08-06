import GQLMiddleware from '@server/graphql/GQLMiddleware';

import { promises as fs } from 'fs';

import { v4 as uuidv4 } from 'uuid';
import { orderBy as naturalOrderBy } from 'natural-orderby';

import {
  BookOrder,
  MutationResolvers,
  QueryResolvers,
  BookInfo as BookInfoGQLModel,
  Resolvers,
} from '@syuchan1005/book-reader-graphql';

import Database from '@server/database/sequelize/models';
import BookInfoModel from '@server/database/sequelize/models/BookInfo';
import BookModel from '@server/database/sequelize/models/Book';
import ModelUtil from '@server/ModelUtil';
import Errors from '@server/Errors';
import { asyncForEach } from '@server/Util';
import InfoGenreModel from '@server/database/sequelize/models/InfoGenre';
import { purgeImageCache } from '@server/ImageUtil';
import { BookDataManager, maybeRequireAtLeastOne } from '@server/database/BookDataManager';

export type BookInfoResolveAttrs = 'thumbnail' | 'genres' | 'books';

class BookInfo extends GQLMiddleware {
  Query(): QueryResolvers {
    return {
      // @ts-ignore
      bookInfo: async (parent, {
        id: infoId,
      }): Promise<Omit<BookInfoGQLModel, BookInfoResolveAttrs>> => {
        const bookInfo = await BookDataManager.getBookInfo(infoId);
        return {
          ...bookInfo,
          updatedAt: `${bookInfo.updatedAt.getTime()}`,
        };
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
        const infoId = await BookDataManager.addBookInfo({
          name,
          genres: genres?.map((genre) => ({ name: genre })),
        });

        return {
          success: true,
          infoId,
        };
      },
      editBookInfo: async (parent, {
        id: infoId,
        ...value
      }) => {
        const editValue = maybeRequireAtLeastOne(value);
        if (!editValue) {
          return {
            success: false,
            code: 'QL0005',
            message: Errors.QL0005,
          };
        }
        const bookInfo = await BookDataManager.getBookInfo(infoId);
        if (!bookInfo) {
          return {
            success: false,
            code: 'QL0001',
            message: Errors.QL0001,
          };
        }
        await BookDataManager.editBookInfo(infoId, {
          ...editValue,
          genres: editValue.genres?.map((genre) => ({ name: genre })),
        });
        return { success: true };
      },
      deleteBookInfo: async (parent, { id: infoId }) => {
        const books = await BookDataManager.getBookInfoBooks(infoId);
        await BookDataManager.deleteBookInfo(infoId);

        await Promise.allSettled(books.map(({ id }) => removeBook(id)));
        purgeImageCache();

        return {
          success: true,
          books: books.map((book) => ({
            ...book,
            updatedAt: `${book.updatedAt.getTime()}`,
          })),
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

  // eslint-disable-next-line class-methods-use-this
  Resolver(): Resolvers {
    return {
      BookInfo: {
        thumbnail: async ({ id, thumbnail: t }) => {
          if (t) return t;
          const thumbnail = await BookDataManager.getBookInfoThumbnail(id);
          if (!thumbnail) {
            return undefined;
          }
          return {
            bookId: thumbnail.bookId,
            pageIndex: thumbnail.thumbnail,
            bookPageCount: thumbnail.pages,
          };
        },
        genres: ({ id, genres }) => genres || BookDataManager.getBookInfoGenres(id),
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
          return books.map((book) => ModelUtil.book(book));
        },
      },
    };
  }
}

// noinspection JSUnusedGlobalSymbols
export default BookInfo;
