// @ts-ignore
import { promises as fs } from 'fs';
import * as os from 'os';

import { ApolloServer, makeExecutableSchema } from 'apollo-server-koa';
import * as uuidv4 from 'uuid/v4';
import * as unzipper from 'unzipper';
import * as rimraf from 'rimraf';

import { Book, BookInfo, Result } from '../common/GraphqlTypes';
import Database from './sequelize/models';
import BookInfoModel from './sequelize/models/bookInfo';
import BookModel from './sequelize/models/book';
import ModelUtil from './ModelUtil';
import {
  asyncForEach,
  readdirRecursively,
  mkdirpIfNotExists,
  renameFile,
} from './Util';
import Errors from './Errors';

// @ts-ignore
import * as typeDefs from './schema.graphql';

export default class Graphql {
  private readonly _server: ApolloServer;

  get server() {
    // eslint-disable-next-line no-underscore-dangle
    return this._server;
  }

  constructor() {
    // eslint-disable-next-line no-underscore-dangle
    this._server = new ApolloServer({
      schema: makeExecutableSchema({
        typeDefs,
        resolvers: {
          /* parent, args, context, info */
          Query: {
            bookInfos: async (parent, { limit }): Promise<BookInfo[]> => {
              const bookInfos = await BookInfoModel.findAll({
                limit,
              });
              return bookInfos.map((info) => ModelUtil.bookInfo(info));
            },
            bookInfo: async (parent, { infoId }, context, info): Promise<BookInfo> => {
              const needBook = info.operation.selectionSet.selections.some(
                (section) => section.kind === 'Field'
                  && section.selectionSet.selections.some(
                    (sec) => sec.kind === 'Field' && sec.name.value === 'books',
                  ),
              );
              const bookInfo = await BookInfoModel.findOne({
                where: { id: infoId },
                include: needBook ? [
                  {
                    model: BookModel,
                    as: 'books',
                  },
                ] : [],
              });
              if (bookInfo) return ModelUtil.bookInfo(bookInfo);
              return null;
            },
            books: async (parent, { infoId, limit }): Promise<Book[]> => {
              const where: any = {};
              if (infoId) where.infoId = infoId;
              const books = await BookModel.findAll({
                where,
                include: [
                  {
                    model: BookInfoModel,
                    as: 'info',
                  },
                ],
                limit,
              });
              return books.map((book) => ModelUtil.book(book));
            },
            book: async (parent, { bookId }): Promise<Book> => {
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
          },
          Mutation: {
            addBookInfo: async (parent, { name, thumbnail }): Promise<Result> => {
              const infoId = uuidv4();
              if (thumbnail) {
                const { stream, mimetype } = await thumbnail;
                if (!mimetype.startsWith('image/jpeg')) {
                  return {
                    success: false,
                    code: 'QL0000',
                    message: Errors.QL0000,
                  };
                }
                await fs.writeFile(`storage/bookInfo/${infoId}.jpg`, stream);
              }
              await BookInfoModel.create({
                id: infoId,
                name,
                thumbnail: thumbnail ? `bookInfo/${infoId}.jpg` : null,
              });
              return { success: true };
            },
            addBook: async (parent, { infoId, number, file }): Promise<Result> => {
              const bookId = uuidv4();
              if (!infoId || !await BookInfoModel.hasId(infoId)) {
                return {
                  success: false,
                  code: 'QL0001',
                  message: Errors.QL0001,
                };
              }
              const { createReadStream, mimetype } = await file;
              if (!['application/zip', 'application/x-zip-compressed'].includes(mimetype)) {
                return {
                  success: false,
                  code: 'QL0002',
                  message: Errors.QL0002,
                };
              }
              // unzip
              const tempPath = `${os.tmpdir()}/${bookId}`;
              await new Promise((resolve) => {
                createReadStream()
                  .pipe(unzipper.Extract({ path: tempPath }))
                  .on('close', resolve);
              });
              const files = await readdirRecursively(tempPath).then((fileList) => fileList.filter(
                (f) => /^(?!.*__MACOSX).*\.jpe?g$/.test(f),
              ));
              if (files.length <= 0) {
                return {
                  success: false,
                  code: 'QL0003',
                  message: Errors.QL0003,
                };
              }
              files.sort((a, b) => {
                const aDepth = (a.match(/\//g) || []).length;
                const bDepth = (b.match(/\//g) || []).length;
                if (aDepth !== bDepth) return aDepth - bDepth;
                return a.localeCompare(b);
              });
              const pad = files.length.toString(10).length;
              await fs.mkdir(`storage/book/${bookId}`);
              await asyncForEach(files, async (f, i) => {
                const fileName = `${i.toString().padStart(pad, '0')}.jpg`;
                await renameFile(f, `storage/book/${bookId}/${fileName}`);
              });
              await new Promise((resolve) => {
                rimraf(tempPath, () => resolve());
              });

              await BookModel.create({
                id: bookId,
                thumbnail: null,
                number,
                pages: files.length,
                infoId,
              });
              await BookInfoModel.update({
                // @ts-ignore
                count: Database.sequelize.literal('count + 1'),
              }, {
                where: {
                  id: infoId,
                },
              });
              return {
                success: true,
              };
            },
            deleteBookInfo: async (parent, { infoId }): Promise<Result> => {
              const books = await BookModel.findAll({
                where: {
                  infoId,
                },
              });
              await asyncForEach(books, async (book) => {
                await new Promise((resolve) => {
                  rimraf(`storage/book/${book.id}`, () => resolve());
                });
              });
              await BookModel.destroy({
                where: {
                  infoId,
                },
              });
              await BookInfoModel.destroy({
                where: {
                  id: infoId,
                },
              });
              return {
                success: true,
              };
            },
            deleteBook: async (parent, { bookId }): Promise<Result> => {
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
                rimraf(`storage/book/${bookId}`, () => resolve());
              });
              return {
                success: true,
              };
            },
          },
        },
      }),
    });
  }

  async middleware(app) {
    await mkdirpIfNotExists('storage/bookInfo');
    await mkdirpIfNotExists('storage/book');

    // eslint-disable-next-line no-underscore-dangle
    app.use(this._server.getMiddleware({}));
  }
}
