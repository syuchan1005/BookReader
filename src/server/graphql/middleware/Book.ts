import GQLMiddleware from '@server/graphql/GQLMiddleware';
import * as os from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';

import * as uuidv4 from 'uuid/v4';
import * as rimraf from 'rimraf';
import { orderBy as naturalOrderBy } from 'natural-orderby';
import { withFilter } from 'graphql-subscriptions';

import { Book as BookType, Result, ResultWithBookResults } from '@common/GraphqlTypes';

import BookModel from '@server/sequelize/models/book';
import BookInfoModel from '@server/sequelize/models/bookInfo';
import ModelUtil from '@server/ModelUtil';
import Errors from '@server/Errors';
import Database from '@server/sequelize/models';
import { SubscriptionKeys } from '@server/graphql';
import GQLUtil from '@server/graphql/GQLUtil';
import { asyncMap } from '@server/Util';

class Book extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Query() {
    return {
      books: async (parent, {
        id: infoId,
        limit,
        offset,
        order,
      }): Promise<BookType[]> => {
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
        return (order === 'DESC') ? bookModels.reverse() : bookModels;
      },
      book: async (parent, { id: bookId }): Promise<BookType> => {
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

  Mutation() {
    // noinspection JSUnusedGlobalSymbols
    return {
      addBook: async (
        parent, args, context, info,
      ): Promise<Result> => GQLUtil.Mutation.addBook(
        this.gm, this.pubsub,
        parent, args, context, info, undefined,
      ),
      addBooks: async (
        parent, args, context, info,
      ): Promise<Result[]> => GQLUtil.Mutation.addBooks(
        this.gm, this.pubsub,
        parent, args, context, info, undefined,
      ),
      addCompressBook: async (parent, {
        id: infoId,
        file: compressBooks,
      }): Promise<ResultWithBookResults> => {
        const tempPath = `${os.tmpdir()}/bookReader/${infoId}`;
        const type = await GQLUtil.checkArchiveType(compressBooks);
        if (type.success === false) {
          return type;
        }
        const { createReadStream, archiveType } = type;

        /*
        await this.pubsub.publish(
          SubscriptionKeys.ADD_BOOK_INFO,
          { name, addBookInfo: 'Extract Files...' });
        */
        await GQLUtil.extractCompressFile(tempPath, archiveType, createReadStream);
        let booksFolderPath = '/';
        let bookFolders = [];
        for (let i = 0; i < 10; i += 1) {
          const tempBooksFolder = path.join(tempPath, booksFolderPath);
          // eslint-disable-next-line no-await-in-loop
          const dirents = await fs.readdir(tempBooksFolder, { withFileTypes: true });
          const dirs = dirents.filter((d) => d.isDirectory());
          if (dirs.length > 1) {
            bookFolders = dirs.map((d) => d.name);
            break;
          } else if (dirs.length === 1) {
            booksFolderPath = path.join(booksFolderPath, dirs[0].name);
          } else {
            break;
          }
        }
        if (bookFolders.length === 0) {
          return {
            success: false,
            code: 'QL0006',
            message: Errors.QL0006,
          };
        }
        /*
        await this.pubsub.publish(
          SubscriptionKeys.ADD_BOOK_INFO,
          { name, addBookInfo: 'Move Files...' });
        */
        const results = await asyncMap(bookFolders, (p, i) => {
          const folderPath = path.join(tempPath, booksFolderPath, p);
          let nums = p.match(/\d+/g);
          if (nums) {
            nums = Number(nums[nums.length - 1]).toString(10);
          } else {
            nums = `${i + 1}`;
          }
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
          );
        });
        await new Promise((resolve) => rimraf(tempPath, resolve));
        return {
          success: true,
          bookResults: results,
        };
      },
      editBook: async (parent, { id: bookId, number, thumbnail }): Promise<Result> => {
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
      deleteBook: async (parent, { id: bookId }): Promise<Result> => {
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
        await book.destroy();
        await BookInfoModel.update({
          // @ts-ignore
          count: Database.sequelize.literal('count - 1'),
        }, {
          where: {
            id: book.infoId,
          },
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
    };
  }

  Subscription() {
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
