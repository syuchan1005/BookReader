import { GraphQLUpload, graphqlUploadKoa } from 'graphql-upload';

import {
  ApolloServer,
  makeExecutableSchema,
  PubSub,
  PubSubEngine,
  gql,
} from 'apollo-server-koa';
import { mergeTypeDefs } from 'graphql-tools-merge-typedefs';

// @ts-ignore
import schemaString from '@syuchan1005/book-reader-graphql/schema.graphql';
import GQLMiddleware from '@server/graphql/GQLMiddleware';
import { BookDataManager } from '@server/database/BookDataManager';
import * as Util from '../Util';
import BigInt from './scalar/BigInt';
import IntRange from './scalar/IntRange';
import { InternalGQLPlugin, loadPlugins } from './GQLPlugin';
import GQLUtil from './GQLUtil';
import { convertAndSaveJpg } from '../ImageUtil';
import internalMiddlewares from './middleware/index';

export const SubscriptionKeys = {
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

    this.middlewares = {
      ...(this.plugins.reduce((obj, p) => {
        // eslint-disable-next-line no-param-reassign
        obj[p.info.name] = p.middleware;
        return obj;
      }, {})),
      ...internalMiddlewares,
    };
    const util = { ...GQLUtil, ...Util };
    const middlewareOps = (key) => Object.keys(this.middlewares)
      .map((k) => {
        const fun = this.middlewares[k][key];
        return fun ? fun.bind(this)(BookDataManager, this, SubscriptionKeys, util) : {};
      }).reduce((a, o) => ({ ...a, ...o }), {});

    // eslint-disable-next-line no-underscore-dangle
    this.server = new ApolloServer({
      uploads: false,
      schema: makeExecutableSchema({
        typeDefs: mergeTypeDefs([
          gql(schemaString),
          ...this.plugins.map((pl) => pl.typeDefs),
        ]),
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

  async middleware(app) {
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
