// @ts-ignore
import path from 'path';
import { GraphQLUpload, graphqlUploadKoa } from 'graphql-upload';

import {
  ApolloServer,
  makeExecutableSchema,
  PubSub,
  PubSubEngine,
} from 'apollo-server-koa';
import { mergeTypeDefs } from 'graphql-tools-merge-typedefs';

// @ts-ignore
import typeDefs from '@server/schema.graphql';
import GQLMiddleware from '@server/graphql/GQLMiddleware';
import Database from '@server/sequelize/models';
import * as Util from '../Util';
import BigInt from './scalar/BigInt';
import IntRange from './scalar/IntRange';
import { InternalGQLPlugin, loadPlugins } from './GQLPlugin';
import GQLUtil from './GQLUtil';
import { convertAndSaveJpg } from '../ImageUtil';

export const SubscriptionKeys = {
  ADD_BOOK_INFO: 'ADD_BOOK_INFO',
  ADD_BOOKS: 'ADD_BOOKS',
};

export default class GraphQL {
  private readonly middlewares: { [key: string]: GQLMiddleware };

  public readonly util = { saveImage: convertAndSaveJpg };

  public readonly pubsub: PubSubEngine;

  public readonly server: ApolloServer;

  private readonly gqlKoaMiddleware; // : (ctx: any, next: Promise<any>) => any;

  private readonly plugins: InternalGQLPlugin[];

  constructor() {
    this.pubsub = new PubSub();
    this.plugins = loadPlugins();

    // @ts-ignore
    const context = require.context('./middleware', false, /\.ts$/);
    this.middlewares = {
      ...(this.plugins.reduce((obj, p) => {
        // eslint-disable-next-line no-param-reassign
        obj[p.info.name] = p.middleware;
        return obj;
      }, {})),
      ...(context.keys().reduce((obj, p) => {
        const df = context(p).default;
        if (df) {
          // eslint-disable-next-line no-param-reassign,new-cap
          obj[path.basename(p, path.extname(p))] = new df();
        }
        return obj;
      }, {})),
    };
    const util = { ...GQLUtil, ...Util };
    const middlewareOps = (key) => Object.keys(this.middlewares)
      .map((k) => {
        const fun = this.middlewares[k][key];
        return fun ? fun.bind(this)(Database, this, SubscriptionKeys, util) : {};
      }).reduce((a, o) => ({ ...a, ...o }), {});

    // eslint-disable-next-line no-underscore-dangle
    this.server = new ApolloServer({
      uploads: false,
      schema: makeExecutableSchema({
        typeDefs: mergeTypeDefs([typeDefs, ...this.plugins.map((pl) => pl.typeDefs)]),
        resolvers: {
          BigInt,
          IntRange,
          Upload: GraphQLUpload,
          /* handler(parent, args, context, info) */
          Query: {
            ...middlewareOps('Query'),
            plugins: () => this.plugins,
          },
          Mutation: middlewareOps('Mutation'),
          Subscription: middlewareOps('Subscription'),
          ...middlewareOps('Resolver'),
        },
      }),
      tracing: process.env.NODE_ENV !== 'production',
    });
    this.gqlKoaMiddleware = this.server.getMiddleware({});
  }

  static async createFolders() {
    await Util.mkdirpIfNotExists('storage/bookInfo');
    await Util.mkdirpIfNotExists('storage/book');
    await Util.mkdirpIfNotExists('storage/cache/book');
  }

  async middleware(app) {
    await GraphQL.createFolders();

    app.use(graphqlUploadKoa());
    // eslint-disable-next-line no-underscore-dangle
    app.use((ctx, next) => {
      ctx.request.socket.setTimeout(15 * 60 * 1000);
      return this.gqlKoaMiddleware(ctx, next);
    });
  }

  useSubscription(httpServer) {
    // eslint-disable-next-line no-underscore-dangle
    this.server.installSubscriptionHandlers(httpServer);
  }
}
