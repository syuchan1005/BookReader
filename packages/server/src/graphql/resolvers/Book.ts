/* eslint no-underscore-dangle: ["error", { "allow": ["__resolveType"] }] */
import path from 'path';
import { generateId } from '@server/database/models/Id';
import { Book as BookDBModel } from '@server/database/models/Book';
import { PubSub, withFilter } from 'graphql-subscriptions';
import throttle from 'lodash.throttle';

import {
  Book as BookGQLModel,
  Resolvers,
  ResultWithBookResults,
  BookResolvers,
  AddBooksSubscriptionType,
  ResolversParentTypes,
} from '@syuchan1005/book-reader-graphql';

import Errors from '@server/Errors';
import { SubscriptionKeys } from '@server/graphql';
import GQLUtil from '@server/graphql/GQLUtil';
import { asyncMap } from '@server/Util';
import { purgeImageCache } from '@server/ImageUtil';
import { BookDataManager, maybeRequireAtLeastOne } from '@server/database/BookDataManager';
import { StorageDataManager, withTemporaryFolder } from '@server/storage/StorageDataManager';
import { StrictResolver } from '@server/graphql/resolvers/ResolverUtil';

type StrictAddBooksSubscriptionResult<
  EnumType = typeof AddBooksSubscriptionType,
  ResolversType extends Record<string, unknown> = ResolversParentTypes,
  ResultTypeName extends keyof ResolversType = 'AddBooksSubscriptionResult',
> = {
  [K in keyof EnumType]: K extends string ? ResultTypeName extends string
    ? {
    type: EnumType[K];
  } & (
    ResolversType[ResultTypeName] extends infer U
      ? U extends { __typename?: `${K}${ResultTypeName}` }
        ? { type: EnumType[K] } & U
        : never
      : never
    )
    : never : never;
}[keyof EnumType];

const throttleMs = 500;

const pubsub = new PubSub();
const publishAddBooksSubscription = (
  infoId: string,
  result: StrictAddBooksSubscriptionResult,
) => pubsub.publish(SubscriptionKeys.ADD_BOOKS, { id: infoId, addBooks: result });

export const resolvers: Resolvers & {
  Book: StrictResolver<BookGQLModel, BookDBModel, BookResolvers>
} = {
  Query: {
    book: async (parent, { id: bookId }) => {
      const book = await BookDataManager.getBook(bookId);
      if (!book) {
        return undefined;
      }
      return book;
    },
    books: async (parent, { ids }) => {
      const bookMap = (await BookDataManager.getBooks(ids))
        .reduce((acc, book) => {
          acc[book.id] = book;
          return acc;
        }, {} as Map<string, BookDBModel>);
      return ids.map((id) => {
        const book: BookDBModel | undefined = bookMap[id];
        if (!book) {
          return undefined;
        }
        return book;
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
      const publishAddBooksSubscriptionThrottle = throttle(publishAddBooksSubscription, throttleMs);
      const bookId = generateId();
      const bookInfo = await BookDataManager.getBookInfo(infoId);
      if (!bookInfo) {
        return {
          success: false,
          code: 'QL0001',
          message: Errors.QL0001,
        };
      }

      await publishAddBooksSubscriptionThrottle(infoId, {
        type: AddBooksSubscriptionType.Uploading,
        bookNumber: book.number,
        downloadedBytes: 0,
      });
      const archiveFile = await GQLUtil.getArchiveFile(
        (bytes) => publishAddBooksSubscriptionThrottle(infoId, {
          type: AddBooksSubscriptionType.Uploading,
          bookNumber: book.number,
          downloadedBytes: bytes,
        }),
        book.file,
        book.path,
      );
      if (archiveFile.success !== true) {
        return archiveFile;
      }

      await publishAddBooksSubscriptionThrottle(infoId, {
        type: AddBooksSubscriptionType.Extracting,
        bookNumber: book.number,
        progressPercent: 0,
      });
      // extract
      return withTemporaryFolder(async (_, tempPath) => {
        await GQLUtil.extractCompressFile(
          tempPath,
          archiveFile.data,
          (percent: number) => publishAddBooksSubscriptionThrottle(infoId, {
            type: AddBooksSubscriptionType.Extracting,
            bookNumber: book.number,
            progressPercent: percent,
          }),
        )
          .catch((err) => Promise.reject(err));
        await publishAddBooksSubscriptionThrottle(infoId, {
          type: AddBooksSubscriptionType.Moving,
          bookNumber: book.number,
          movedPageCount: 0,
          totalPageCount: 0,
        });

        return GQLUtil.addBookFromLocalPath(
          tempPath,
          infoId,
          bookId,
          book.number,
          (current, total) => publishAddBooksSubscriptionThrottle(infoId, {
            type: AddBooksSubscriptionType.Moving,
            bookNumber: book.number,
            movedPageCount: current,
            totalPageCount: total,
          }),
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
      const publishAddBooksSubscriptionThrottle = throttle(publishAddBooksSubscription, throttleMs);
      await publishAddBooksSubscriptionThrottle(infoId, {
        type: AddBooksSubscriptionType.Uploading,
        downloadedBytes: 0,
      });
      const archiveFile = await GQLUtil.getArchiveFile(
        (bytes) => publishAddBooksSubscriptionThrottle(infoId, {
          type: AddBooksSubscriptionType.Uploading,
          downloadedBytes: bytes,
        }),
        compressBooks,
        localPath,
      );
      if (archiveFile.success === false) {
        return archiveFile as unknown as ResultWithBookResults;
      }

      await publishAddBooksSubscriptionThrottle(infoId, {
        type: AddBooksSubscriptionType.Extracting,
        progressPercent: 0,
      });

      return withTemporaryFolder(async (_, tempPath) => {
        await GQLUtil.extractCompressFile(
          tempPath,
          archiveFile.data,
          (percent) => publishAddBooksSubscriptionThrottle(infoId, {
            type: AddBooksSubscriptionType.Extracting,
            progressPercent: percent,
          }),
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

        await publishAddBooksSubscriptionThrottle(infoId, {
          type: AddBooksSubscriptionType.Moving,
          movedPageCount: 0,
          totalPageCount: 0,
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

          await publishAddBooksSubscriptionThrottle(infoId, {
            type: AddBooksSubscriptionType.Moving,
            bookNumber: nums,
            movedPageCount: 0,
            totalPageCount: 0,
          });

          addedNums.push(nums);
          return GQLUtil.addBookFromLocalPath(
            folderPath,
            infoId,
            generateId(),
            nums,
            (current, total) => {
              publishAddBooksSubscriptionThrottle(infoId, {
                type: AddBooksSubscriptionType.Moving,
                bookNumber: nums,
                movedPageCount: current,
                totalPageCount: total,
              });
            },
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
    pages: ({ pageCount }) => pageCount,
    thumbnail: ({ thumbnailPage }) => thumbnailPage,
    updatedAt: ({ updatedAt }) => `${updatedAt.getTime()}`,
    info: async ({ id: bookId }) => BookDataManager.getBookInfoFromBookId(bookId),
  },
  AddBooksSubscriptionResult: {
    __resolveType(result) {
      switch (result.type) {
        case 'Extracting':
          return 'ExtractingAddBooksSubscriptionResult';
        case 'Moving':
          return 'MovingAddBooksSubscriptionResult';
        case 'Uploading':
          return 'UploadingAddBooksSubscriptionResult';
        default:
          return null;
      }
    },
  },
};
