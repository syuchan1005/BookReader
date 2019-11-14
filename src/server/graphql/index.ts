// @ts-ignore
import path from 'path';

import {
  ApolloServer,
  makeExecutableSchema,
  PubSub,
  PubSubEngine,
} from 'apollo-server-koa';
import { SubClass } from 'gm';
import { mergeTypeDefs } from 'graphql-tools-merge-typedefs';

// @ts-ignore
import typeDefs from '@server/schema.graphql';
import GQLMiddleware from '@server/graphql/GQLMiddleware';
import {
  mkdirpIfNotExists,
} from '../Util';
import BigInt from './scalar/BigInt';
import { InternalGQLPlugin, loadPlugins } from './GQLPlugin';

export const SubscriptionKeys = {
  ADD_BOOK_INFO: 'ADD_BOOK_INFO',
  ADD_BOOKS: 'ADD_BOOKS',
  ADD_BOOKS_BATCH: 'ADD_BOOKS_BATCH',
};

export default class GraphQL {
  private readonly gm: SubClass;

  private readonly useIM: boolean;

  private readonly middlewares: { [key: string]: GQLMiddleware };

  public readonly server: ApolloServer;

  private readonly gqlKoaMiddleware; // : (ctx: any, next: Promise<any>) => any;

  private readonly pubsub: PubSubEngine;

  private readonly plugins: InternalGQLPlugin[];

  constructor(gmModule, useIM) {
    this.gm = gmModule;
    this.useIM = useIM;
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
    const middlewareOps = (key) => Object.keys(this.middlewares)
      .map((k) => {
        const fun = this.middlewares[k][key];
        return fun ? fun.bind(this)() : {};
      }).reduce((a, o) => ({ ...a, ...o }), {});

    // eslint-disable-next-line no-underscore-dangle
    this.server = new ApolloServer({
      schema: makeExecutableSchema({
        typeDefs: mergeTypeDefs([typeDefs, ...this.plugins.map((pl) => pl.typeDefs)]),
        resolvers: {
          BigInt,
          /* handler(parent, args, context, info) */
          Query: middlewareOps('Query'),
          Mutation: middlewareOps('Mutation'),
          Subscription: middlewareOps('Subscription'),
        },
      }),
      tracing: process.env.NODE_ENV !== 'production',
    });
    this.gqlKoaMiddleware = this.server.getMiddleware({});
  }

  static async createFolders() {
    await mkdirpIfNotExists('storage/bookInfo');
    await mkdirpIfNotExists('storage/book');
    await mkdirpIfNotExists('storage/cache/book');
  }

  async middleware(app) {
    await GraphQL.createFolders();

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
