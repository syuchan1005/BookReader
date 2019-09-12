// @ts-ignore
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';

import { ApolloServer, makeExecutableSchema } from 'apollo-server-koa';
import * as uuidv4 from 'uuid/v4';
import * as unzipper from 'unzipper';
import { createExtractorFromData } from 'node-unrar-js';
import * as rimraf from 'rimraf';

import { archiveTypes } from '../common/Common';
import { Book, BookInfo, Result } from '../common/GraphqlTypes';
import Database from './sequelize/models';
import BookInfoModel from './sequelize/models/bookInfo';
import BookModel from './sequelize/models/book';
import ModelUtil from './ModelUtil';
import {
  asyncForEach, mkdirpIfNotExists, readdirRecursively, renameFile,
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
            editBookInfo: async (parent, { infoId, name, thumbnail }): Promise<Result> => {
              if (name === undefined && thumbnail === undefined) {
                return {
                  success: false,
                  code: 'QL0005',
                  message: Errors.QL0005,
                };
              }
              const info = await BookInfoModel.findOne({
                where: { id: infoId },
              });
              if (!info) {
                return {
                  success: false,
                  code: 'QL0001',
                  message: Errors.QL0001,
                };
              }
              const val = Object.entries({ name, thumbnail }).reduce((o, e) => {
                if (e[1] !== undefined && info[e[0]] !== e[1]) {
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
              await BookInfoModel.update(val, {
                where: { id: infoId },
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
            addBook: async (parent, {
              infoId,
              number,
              file,
              thumbnail,
            }): Promise<Result> => {
              const bookId = uuidv4();
              if (!await BookInfoModel.hasId(infoId)) {
                return {
                  success: false,
                  code: 'QL0001',
                  message: Errors.QL0001,
                };
              }
              let argThumbnail;
              if (thumbnail) {
                const { stream, mimetype } = await thumbnail;
                if (!mimetype.startsWith('image/jpeg')) {
                  return {
                    success: false,
                    code: 'QL0000',
                    message: Errors.QL0000,
                  };
                }
                await fs.writeFile(`storage/book/${bookId}/thumbnail.jpg`, stream);
                argThumbnail = `/book/${bookId}/thumbnail.jpg`;
              }
              const { createReadStream, mimetype, filename } = await file;
              let archiveType = archiveTypes[mimetype];
              if (!archiveType) {
                archiveType = [...new Set(Object.values(archiveTypes))].find((ext) => filename.endsWith(`.${ext}`));
              }
              if (!archiveType) {
                return {
                  success: false,
                  code: 'QL0002',
                  message: Errors.QL0002,
                };
              }
              // extract
              const tempPath = `${os.tmpdir()}/bookReader/${bookId}`;
              if (archiveType === 'zip') {
                await new Promise((resolve) => {
                  createReadStream()
                    .pipe(unzipper.Extract({ path: tempPath }))
                    .on('close', resolve);
                });
              } else if (archiveType === 'rar') {
                const readStream = createReadStream();
                const buffer: Buffer = await new Promise((resolve, reject) => {
                  const chunks = [];
                  readStream.once('error', (err) => reject(err));
                  readStream.once('end', () => resolve(Buffer.concat(chunks)));
                  readStream.on('data', (c) => chunks.push(c));
                });

                await new Promise((resolve, reject) => {
                  const extractor = createExtractorFromData(buffer);
                  // eslint-disable-next-line camelcase
                  const [obj_state, obj_header] = extractor.extractAll();
                  if (obj_state.state !== 'SUCCESS') {
                    reject(new Error('Unrar failed'));
                  }
                  // eslint-disable-next-line camelcase
                  asyncForEach(obj_header.files, async (f) => {
                    if (f.fileHeader.flags.directory) return;
                    await mkdirpIfNotExists(path.join(tempPath, f.fileHeader.name, '..'));
                    await fs.writeFile(path.join(tempPath, f.fileHeader.name), f.extract[1]);
                  }).then(resolve);
                });
              }
              const deleteTempFolder = (resolve) => {
                rimraf(tempPath, () => resolve());
              };
              const files = await readdirRecursively(tempPath).then((fileList) => fileList.filter(
                (f) => /^(?!.*__MACOSX).*\.jpe?g$/.test(f),
              ));
              if (files.length <= 0) {
                await new Promise(deleteTempFolder);
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
                const length = a.length - b.length;
                if (length !== 0) return length;
                return a.localeCompare(b);
              });
              const pad = files.length.toString(10).length;
              await fs.mkdir(`storage/book/${bookId}`);
              await asyncForEach(files, async (f, i) => {
                const fileName = `${i.toString().padStart(pad, '0')}.jpg`;
                await renameFile(f, `storage/book/${bookId}/${fileName}`);
              });
              await new Promise(deleteTempFolder);

              const bThumbnail = `/book/${bookId}/${'0'.padStart(pad, '0')}.jpg`;
              await Database.sequelize.transaction(async (transaction) => {
                await BookModel.create({
                  id: bookId,
                  thumbnail: argThumbnail || bThumbnail,
                  number,
                  pages: files.length,
                  infoId,
                }, {
                  transaction,
                });
                await BookInfoModel.update({
                  // @ts-ignore
                  count: Database.sequelize.literal('count + 1'),
                }, {
                  where: {
                    id: infoId,
                  },
                  transaction,
                });
                await BookInfoModel.update({
                  thumbnail: argThumbnail || bThumbnail,
                }, {
                  where: {
                    id: infoId,
                    thumbnail: null,
                  },
                  transaction,
                });
              });
              return {
                success: true,
              };
            },
            editBook: async (parent, { bookId, number, thumbnail }): Promise<Result> => {
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
