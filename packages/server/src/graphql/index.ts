import { GraphQLSchema } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { ApolloServer, gql } from 'apollo-server-express';
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from 'apollo-server-core';

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
  BULK_EDIT_PAGE: 'BULK_EDIT_PAGE',
};

export default class GraphQL {
  public readonly util = { saveImage: convertAndSaveJpg };

  public readonly apolloServer: ApolloServer;

  public readonly pubsub: PubSub;

  private readonly schema: GraphQLSchema;

  private readonly plugins: InternalGQLPlugin[];

  private readonly middlewares: { [key: string]: GQLMiddleware };

  /**
   * @param httpServer
   * @param updateResolver Its workaround that import the esm module from cjs.
   */
  constructor(httpServer, updateResolver) {
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

    this.schema = makeExecutableSchema({
      typeDefs: [
        gql(schemaString),
        ...this.plugins.map((pl) => pl.typeDefs),
      ],
      resolvers: {
        BigInt,
        IntRange,
        Upload: updateResolver,
        /* handler(parent, args, context, info) */
        Query: {
          ...middlewareOps('Query'),
          plugins: () => this.plugins,
        },
        Mutation: middlewareOps('Mutation'),
        Subscription: middlewareOps('Subscription'),
        ...middlewareOps('Resolver'),
      },
    });
    this.apolloServer = new ApolloServer({
      schema: this.schema,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        ApolloServerPluginLandingPageGraphQLPlayground(),
      ],
    });
  }

  /**
   * @param app
   * @param uploadMiddleware Its workaround that import the esm module from cjs.
   */
  async middleware(app, uploadMiddleware) {
    await this.apolloServer.start();
    app
      .use(uploadMiddleware())
      .use(this.apolloServer.getMiddleware());
  }

  useSubscription(httpServer) {
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: '/graphql',
    });
    useServer({ schema: this.schema }, wsServer);

    ['SIGINT', 'SIGTERM'].forEach((signal) => {
      process.on(signal, () => wsServer.close());
    });
  }
}
