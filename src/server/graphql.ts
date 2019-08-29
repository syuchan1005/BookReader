// @ts-ignore
import { promises as fs } from 'fs';

import { ApolloServer, makeExecutableSchema } from 'apollo-server-koa';
import uuidv4 from 'uuid/v4';
// @ts-ignore
import typeDefs from './schema.graphql';
import { Book, BookInfo, Result } from '../common/GraphqlTypes';
import { BookInfo as BookInfoModel } from './models/BookInfo';
import { Book as BookModel } from './models/Book';
import ModelUtil from './ModelUtil';

export default class Graphql {
  private _server: ApolloServer;

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
            bookInfos: async (): Promise<BookInfo[]> => {
              const bookInfos = await BookInfoModel.find();
              return bookInfos.map((info) => ModelUtil.bookInfo(info));
            },
            books: async (parent, { infoId }): Promise<Book[]> => {
              const books = await BookModel.find({
                where: { info: { id: infoId } },
              });
              return books.map((book) => ModelUtil.book(book));
            },
          },
          Mutation: {
            addBookInfo: async (parent, { name, thumbnail }): Promise<Result> => {
              const infoId = uuidv4();
              if (thumbnail) {
                const { stream, mimetype } = await thumbnail;
                if (!mimetype.startsWith('image/jpeg')) {
                  throw new Error('Thumbnail must be image');
                }
                await fs.writeFile(`storage/bookInfo/${infoId}.jpg`, stream);
              }
              await BookInfoModel.newInstance(
                infoId,
                name,
                thumbnail ? `bookInfo/${infoId}.jpg` : undefined,
              ).save();
              return { success: true };
            },
            addBook: async (parent, { name, number, file }): Promise<Result> => {
              return {
                success: true,
              };
            },
          },
        },
      }),
    });
  }

  middleware(app) {
    // eslint-disable-next-line no-underscore-dangle
    this._server.applyMiddleware({ app });
  }
}
