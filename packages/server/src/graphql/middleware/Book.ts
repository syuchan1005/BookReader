import { promises as fs, rmSync as fsRmSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { withFilter } from 'graphql-subscriptions';
import { Op } from 'sequelize';

import {
  MutationResolvers, QueryResolvers, ResultWithBookResults, SubscriptionResolvers,
} from '@syuchan1005/book-reader-graphql';

import GQLMiddleware from '@server/graphql/GQLMiddleware';
import BookModel from '@server/database/sequelize/models/Book';
import BookInfoModel from '@server/database/sequelize/models/BookInfo';
import ModelUtil from '@server/ModelUtil';
import Errors from '@server/Errors';
import Database from '@server/database/sequelize/models';
import { SubscriptionKeys } from '@server/graphql';
import GQLUtil from '@server/graphql/GQLUtil';
import { asyncForEach, asyncMap } from '@server/Util';
import { purgeImageCache } from '@server/ImageUtil';
import { createTemporaryFolderPath } from '@server/StorageUtil';

class Book extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Query(): QueryResolvers {
    // noinspection JSUnusedGlobalSymbols
    return {
      book: async (parent, { id: bookId }) => {
        const book = await BookModel.findOne({
          where: { id: bookId },
        });
        if (book) return ModelUtil.book(book);
        return null;
      },
    };
  }

  Mutation(): MutationResolvers {
    // noinspection JSUnusedGlobalSymbols
    return {
      addBooks: async (
        parent, {
          id: infoId,
          books,
        },
      ) => asyncMap(books, async (book) => {
        const bookId = uuidv4();
        if (!await BookInfoModel.hasId(infoId)) {
          return {
            success: false,
            code: 'QL0001',
            message: Errors.QL0001,
          };
        }

        const archiveFile = await GQLUtil.saveArchiveFile(book.file, book.path);
        if (archiveFile.success !== true) {
          return archiveFile;
        }

        await this.pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
          id: infoId,
          addBooks: `Extract Book (${book.number}) ...`,
        });
        // extract
        const tempPath = createTemporaryFolderPath(bookId);
        const progressListener = (
          percent: number,
        ) => this.pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
          id: infoId,
          addBooks: `Extract Book (${book.number}) ${percent}%`,
        });
        await GQLUtil.extractCompressFile(tempPath, archiveFile.archiveFilePath, progressListener)
          .catch((err) => {
            fsRmSync(archiveFile.archiveFilePath, { force: true });
            fsRmSync(tempPath, {
              recursive: true,
              force: true,
            });
            return Promise.reject(err);
          });
        await this.pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
          id: infoId,
          addBooks: `Move Book (${book.number}) ...`,
        });
        return GQLUtil.addBookFromLocalPath(
          tempPath,
          infoId,
          bookId,
          book.number,
          async (current, total) => {
            await this.pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
              id: infoId,
              addBooks: `Move Book (${book.number}) ${current}/${total}`,
            });
          },
          () => fs.rm(tempPath, {
            recursive: true,
            force: true,
          }),
        )
          .finally(() => fs.rm(archiveFile.archiveFilePath, { force: true }));
      }),
      addCompressBook: async (parent, {
        id: infoId,
        file: compressBooks,
        path: localPath,
      }) => {
        const archiveFile = await GQLUtil.saveArchiveFile(compressBooks, localPath);
        if (archiveFile.success === false) {
          return archiveFile as unknown as ResultWithBookResults;
        }

        await this.pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
          id: infoId,
          addBooks: 'Extract Book...',
        });

        const tempPath = createTemporaryFolderPath(infoId);
        try {
          await GQLUtil.extractCompressFile(
            tempPath,
            archiveFile.archiveFilePath,
            (percent) => this.pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
              id: infoId,
              addBooks: `Extract Book ${percent}%`,
            }),
          );
        } catch (err) {
          await fs.rm(archiveFile.archiveFilePath, { force: true });
          await fs.rm(tempPath, {
            recursive: true,
            force: true,
          });
          return Promise.reject(err);
        }

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

        await this.pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
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

          await this.pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
            id: infoId,
            addBooks: `Move Book (${nums}) ...`,
          });

          addedNums.push(nums);
          return GQLUtil.addBookFromLocalPath(
            folderPath,
            infoId,
            uuidv4(),
            nums,
            (current, total) => {
              this.pubsub.publish(SubscriptionKeys.ADD_BOOKS, {
                id: infoId,
                addBooks: `Move Book (${nums}) ${current}/${total}`,
              });
            },
            () => fs.rm(folderPath, {
              recursive: true,
              force: true,
            }),
          )
            .catch((e) => {
              throw e;
            });
        });
        await fs.rm(tempPath, {
          recursive: true,
          force: true,
        });
        await fs.rm(archiveFile.archiveFilePath, { force: true });
        return {
          success: true,
          bookResults: results,
        };
      },
      editBook: async (parent, {
        id: bookId,
        number,
        thumbnail,
      }) => {
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
        const val = Object.entries({
          number,
          thumbnail,
        })
          .reduce((o, e) => {
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
      deleteBooks: async (parent, {
        infoId,
        ids: bookIds,
      }) => {
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
        await asyncForEach(bookIds, async (bookId) => {
          await fs.rm(`storage/cache/book/${bookId}`, {
            recursive: true,
            force: true,
          });
          await fs.rm(`storage/book/${bookId}`, {
            recursive: true,
            force: true,
          });
        });
        purgeImageCache();
        return {
          success: true,
        };
      },
      moveBooks: async (parent, {
        infoId,
        ids: bookIds,
      }) => {
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

  // eslint-disable-next-line class-methods-use-this
  Resolver() {
    return {
      Book: {
        info: async ({ id }) => {
          const book = await BookModel.findOne({
            where: { id },
            include: [{
              model: BookInfoModel,
              as: 'info',
            }],
          });
          if (book?.info) return ModelUtil.bookInfo(book.info);
          return undefined;
        },
      },
    };
  }
}

// noinspection JSUnusedGlobalSymbols
export default Book;
