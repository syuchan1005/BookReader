import { orderBy as naturalOrderBy } from 'natural-orderby';

import {
  BookOrder,
  BookInfo as BookInfoGQLModel,
  Resolvers,
  BookInfoResolvers,
} from '@syuchan1005/book-reader-graphql';

import Errors from '@server/Errors';
import { purgeImageCache } from '@server/ImageUtil';
import { BookDataManager, maybeRequireAtLeastOne } from '@server/database/BookDataManager';
import { generateId } from '@server/database/models/Id';
import { StorageDataManager } from '@server/storage/StorageDataManager';
import { meiliSearchClient, elasticSearchClient } from '@server/search';
import { BookInfo as BookInfoDBModel } from '@server/database/models/BookInfo';
import { StrictResolver } from '@server/graphql/resolvers/ResolverUtil';

export const resolvers: Resolvers & {
  BookInfo: StrictResolver<BookInfoGQLModel, BookInfoDBModel, BookInfoResolvers>,
} = {
  Query: {
    bookInfo: (parent, { id: infoId }) => BookDataManager.getBookInfo(infoId),
    bookInfos: async (parent, {
      ids: infoIds,
    }) => {
      const bookInfos = await BookDataManager.getBookInfosFromIds(infoIds);
      const bookInfoMap = bookInfos
        .reduce((map, bookInfo) => {
          // eslint-disable-next-line no-param-reassign
          map[bookInfo.id] = bookInfo;
          return map;
        }, {} as { [key: string]: BookInfoDBModel });
      return infoIds.map((infoId) => {
        const bookInfo = bookInfoMap[infoId];
        if (!bookInfo) {
          return undefined;
        }
        return bookInfo;
      });
    },
  },
  Mutation: {
    addBookInfo: async (parent, {
      name,
      genres,
    }) => {
      const infoId = await BookDataManager.addBookInfo({
        id: generateId(),
        name,
        genres: genres?.map((genre) => ({ name: genre })),
      });
      const bookInfo = await BookDataManager.getBookInfo(infoId);
      if (!bookInfo) {
        return {
          success: false,
          code: 'QL0004',
          message: Errors.QL0004,
        };
      }
      await meiliSearchClient.addBookInfo(infoId);
      await elasticSearchClient.addBookInfo(infoId);
      return {
        success: true,
        bookInfo,
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
      const editedBookInfo = await BookDataManager.getBookInfo(infoId);
      if (!editedBookInfo) {
        return {
          success: false,
          code: 'QL0004',
          message: Errors.QL0004,
        };
      }

      await meiliSearchClient.removeBookInfo(infoId);
      await elasticSearchClient.removeBookInfo(infoId);
      await meiliSearchClient.addBookInfo(infoId);
      await elasticSearchClient.addBookInfo(infoId);

      return {
        success: true,
        bookInfo: editedBookInfo,
      };
    },
    deleteBookInfo: async (parent, { id: infoId }) => {
      const books = await BookDataManager.getBookInfoBooks(infoId, []);
      await BookDataManager.deleteBookInfo(infoId);

      await Promise.allSettled(
        books.map(({ id }) => StorageDataManager.removeBook(id, false)),
      );
      purgeImageCache();

      await meiliSearchClient.removeBookInfo(infoId);
      await elasticSearchClient.removeBookInfo(infoId);
      return {
        success: true,
        books,
      };
    },
  },
  BookInfo: {
    count: ({ bookCount }) => bookCount,
    updatedAt: ({ updatedAt }) => updatedAt.getTime()
      .toString(),
    thumbnail: async ({ id }) => {
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
    genres: ({ id }) => BookDataManager.getBookInfoGenres(id)
      .then((genres) => genres?.map((genre) => ({
        name: genre.name,
        invisible: genre.isInvisible,
      })) ?? []),
    books: async ({ id }, { order }: { order: BookOrder }) => {
      const sortNumber = order.startsWith('Number_');
      let books = await BookDataManager.getBookInfoBooks(
        id,
        sortNumber ? [] : [
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
      return books;
    },
  },
};
