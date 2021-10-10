import GQLMiddleware from '@server/graphql/GQLMiddleware';

import { orderBy as naturalOrderBy } from 'natural-orderby';

import {
  BookOrder,
  MutationResolvers,
  QueryResolvers,
  BookInfo as BookInfoGQLModel,
  Resolvers,
} from '@syuchan1005/book-reader-graphql';

import Errors from '@server/Errors';
import { purgeImageCache } from '@server/ImageUtil';
import { BookDataManager, maybeRequireAtLeastOne } from '@server/database/BookDataManager';
import { removeBook } from '@server/StorageUtil';
import { generateId } from '@server/database/models/Id';

export type BookInfoResolveAttrs = 'thumbnail' | 'genres' | 'books';

class BookInfo extends GQLMiddleware {
  Query(): QueryResolvers {
    return {
      // @ts-ignore
      bookInfo: async (parent, {
        id: infoId,
      }): Promise<Omit<BookInfoGQLModel, BookInfoResolveAttrs>> => {
        const bookInfo = await BookDataManager.getBookInfo(infoId);
        if (!bookInfo) {
          return undefined;
        }
        return {
          ...bookInfo,
          count: bookInfo.bookCount,
          history: bookInfo.isHistory,
          updatedAt: `${bookInfo.updatedAt.getTime()}`,
        };
      },
    };
  }

  Mutation(): MutationResolvers {
    return {
      addBookInfo: async (parent, {
        name,
        genres,
      }) => {
        const infoId = await BookDataManager.addBookInfo({
          id: generateId(),
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
            pages: book.thumbnailPage,
            updatedAt: `${book.updatedAt.getTime()}`,
          })),
        };
      },
      addBookInfoHistories: async (parent, { histories }) => {
        await BookDataManager.addBookHistories(histories.map((history) => ({
          name: history.name,
          bookCount: history.count,
        })));
        return {
          success: true,
        };
      },
    };
  }

  Resolver(): Resolvers {
    return {
      BookInfo: {
        thumbnail: async ({
          id,
          thumbnail: t,
        }) => {
          if (t && typeof t === 'object') {
            return t;
          }
          const thumbnail = await BookDataManager.getBookInfoThumbnail(id);
          if (!thumbnail) {
            return undefined;
          }
          return {
            bookId: thumbnail.bookId,
            pageIndex: thumbnail.thumbnailPage,
            bookPageCount: thumbnail.pageCount,
          };
        },
        genres: ({
          id,
          genres: argGenres,
        }) => argGenres || BookDataManager.getBookInfoGenres(id)
          .then((genres) => genres?.map((genre) => ({
            name: genre.name,
            invisible: genre.isInvisible,
          })) ?? []),
        books: async ({ id }, { order }: { order: BookOrder }) => {
          const sortNumber = order.startsWith('Number_');
          let books = await BookDataManager.getBookInfoBooks(
            id,
            sortNumber ? undefined : [
              ['updatedAt', order === BookOrder.UpdateNewest ? 'asc' : 'desc'],
            ],
          );
          if (sortNumber) {
            books = naturalOrderBy(
              books || [],
              [(v) => v.number],
            );
            if (order === BookOrder.NumberDesc) books.reverse();
          }
          return books.map((book) => ({
            ...book,
            pages: book.pageCount,
            thumbnail: book.thumbnailPage,
            updatedAt: `${book.updatedAt.getTime()}`,
          }));
        },
      },
    };
  }
}

// noinspection JSUnusedGlobalSymbols
export default BookInfo;
