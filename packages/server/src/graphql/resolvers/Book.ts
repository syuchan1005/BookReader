import path from 'path';
import { generateId } from '@server/database/models/Id';
import { Book as DBBook } from '@server/database/models/Book';
import { PubSub, withFilter } from 'graphql-subscriptions';
import throttle from 'lodash.throttle';

import {
  BookInfo as BookInfoGQLModel,
  Resolvers,
  ResultWithBookResults,
} from '@syuchan1005/book-reader-graphql';

import Errors from '@server/Errors';
import { SubscriptionKeys } from '@server/graphql';
import GQLUtil from '@server/graphql/GQLUtil';
import { asyncMap } from '@server/Util';
import { purgeImageCache } from '@server/ImageUtil';
import { BookDataManager, maybeRequireAtLeastOne } from '@server/database/BookDataManager';
import { StorageDataManager, withTemporaryFolder } from '@server/storage/StorageDataManager';
import { BookInfoResolveAttrs } from '@server/graphql/resolvers/BookInfo';

const throttleMs = 500;

const pubsub = new PubSub();

export const resolvers: Resolvers = {
  Query: {
    book: async (parent, { id: bookId }) => {
      const book = await BookDataManager.getBook(bookId);
      if (!book) {
        return undefined;
      }
      return {
        ...book,
        thumbnail: book.thumbnailPage,
        pages: book.pageCount,
        updatedAt: `${book.updatedAt.getTime()}`,
      };
    },
    books: async (parent, { ids }) => {
      const bookMap = (await BookDataManager.getBooks(ids))
        .reduce((acc, book) => {
          acc[book.id] = book;
          return acc;
        }, {} as Map<string, DBBook>);
      return ids.map((id) => {
        const book: DBBook | undefined = bookMap[id];
        if (!book) {
          return undefined;
        }
        return {
          ...book,
          thumbnail: book.thumbnailPage,
          pages: book.pageCount,
          updatedAt: `${book.updatedAt.getTime()}`,
        };
      });
    },
  },
  Mutation: {
    addBooks: async (
      parent,
      {
        id: infoId,
        books,
      },
    ) => asyncMap(books, async (book) => {
      const bookId = generateId();
      const bookInfo = await BookDataManager.getBookInfo(infoId);
      if (!bookInfo) {
        return {
          success: false,
          code: 'QL0001',
          message: Errors.QL0001,
        };
      }

      const archiveFile = await GQLUtil.getArchiveFile(book.file, book.path);
      if (archiveFile.success !== true) {
        return archiveFile;
      }

      await pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
        id: infoId,
        addBooks: `Extract Book (${book.number}) ...`,
      });
      // extract
      return withTemporaryFolder(async (_, tempPath) => {
        const progressListener = (
          percent: number,
        ) => pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
          id: infoId,
          addBooks: `Extract Book (${book.number}) ${percent}%`,
        });
        await GQLUtil.extractCompressFile(
          tempPath,
          archiveFile.data,
          throttle(progressListener, throttleMs),
        )
          .catch((err) => Promise.reject(err));
        await pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
          id: infoId,
          addBooks: `Move Book (${book.number}) ...`,
        });

        return GQLUtil.addBookFromLocalPath(
          tempPath,
          infoId,
          bookId,
          book.number,
          throttle((current, total) => {
            pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
              id: infoId,
              addBooks: `Move Book (${book.number}) ${current}/${total}`,
            });
          }, throttleMs),
        );
      });
    }),
    addCompressBook: async (
      parent,
      {
        id: infoId,
        file: compressBooks,
        path: localPath,
      },
    ) => {
      const archiveFile = await GQLUtil.getArchiveFile(compressBooks, localPath);
      if (archiveFile.success === false) {
        return archiveFile as unknown as ResultWithBookResults;
      }

      await pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
        id: infoId,
        addBooks: 'Extract Book...',
      });

      return withTemporaryFolder(async (_, tempPath) => {
        await GQLUtil.extractCompressFile(
          tempPath,
          archiveFile.data,
          throttle(
            (percent) => pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
              id: infoId,
              addBooks: `Extract Book ${percent}%`,
            }),
            throttleMs,
          ),
        );

        const {
          booksFolderPath,
          bookFolders,
        } = await GQLUtil.searchBookFolders(tempPath);
        if (bookFolders.length === 0) {
          return {
            success: false,
            code: 'QL0006',
            message: Errors.QL0006,
          };
        }

        await pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
          id: infoId,
          addBooks: 'Move Book...',
        });

        const addedNums = [];
        const results = await asyncMap(bookFolders, async (p, i) => {
          const folderPath = path.join(tempPath, booksFolderPath, p);
          let nums = p.match(/\d+/g);
          if (nums) {
            nums = Number(nums[nums.length - 1])
              .toString(10);
          } else {
            nums = `${i + 1}`;
          }

          if (addedNums.includes(nums)) {
            nums = `[DUP]${nums}: ${p}`;
          }

          await pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
            id: infoId,
            addBooks: `Move Book (${nums}) ...`,
          });

          addedNums.push(nums);
          return GQLUtil.addBookFromLocalPath(
            folderPath,
            infoId,
            generateId(),
            nums,
            throttle(
              (current, total) => {
                pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
                  id: infoId,
                  addBooks: `Move Book (${nums}) ${current}/${total}`,
                });
              },
              throttleMs,
            ),
          );
        });
        return {
          success: true,
          bookResults: results,
        };
      });
    },
    editBook: async (parent, {
      id: bookId,
      number,
      thumbnail,
    }) => {
      const editValue = maybeRequireAtLeastOne({
        number,
        thumbnailPage: thumbnail,
      });
      if (!editValue) {
        return {
          success: false,
          code: 'QL0005',
          message: Errors.QL0005,
        };
      }
      const book = await BookDataManager.getBook(bookId);
      if (!book) {
        return {
          success: false,
          code: 'QL0001',
          message: Errors.QL0001,
        };
      }
      await BookDataManager.editBook(bookId, editValue);
      return { success: true };
    },
    deleteBooks: async (parent, {
      infoId,
      ids: bookIds,
    }) => {
      await BookDataManager.deleteBooks(infoId, bookIds);
      await Promise.all(
        bookIds.map((bookId) => StorageDataManager.removeBook(bookId, false)),
      );
      purgeImageCache();
      return {
        success: true,
      };
    },
    moveBooks: async (parent, {
      infoId,
      ids: bookIds,
    }) => {
      await BookDataManager.moveBooks(bookIds, infoId);
      return {
        success: true,
      };
    },
  },
  Subscription: {
    addBooks: {
      // Ref: https://github.com/apollographql/graphql-subscriptions/pull/250#issuecomment-1351898681
      subscribe: withFilter(
        () => pubsub.asyncIterator([SubscriptionKeys.ADD_BOOKS]),
        (payload, variables) => payload.id === variables.id,
      ) as any,
    },
  },
  Book: {
    info: async ({ id: bookId }) => {
      const bookInfo = await BookDataManager.getBookInfoFromBookId(bookId);
      return {
        ...bookInfo,
        count: bookInfo.bookCount,
        updatedAt: `${bookInfo.updatedAt.getTime()}`,
      } as Omit<BookInfoGQLModel, BookInfoResolveAttrs> as BookInfoGQLModel;
    },
  },
};
