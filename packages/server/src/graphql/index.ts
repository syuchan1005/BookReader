import { GraphQLSchema } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { ApolloServer, gql } from 'apollo-server-express';
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from 'apollo-server-core';

// @ts-ignore
import schemaString from '@syuchan1005/book-reader-graphql/schema.graphql';
import { BookDataManager } from '@server/database/BookDataManager';
import * as Util from '../Util';
import BigInt from './scalar/BigInt';
import IntRange from './scalar/IntRange';
import GQLUtil from './GQLUtil';
import internalMiddlewares from './middleware/index';

export const SubscriptionKeys = {
  ADD_BOOKS: 'ADD_BOOKS',
  BULK_EDIT_PAGE: 'BULK_EDIT_PAGE',
};

export default class GraphQL {
  public readonly apolloServer: ApolloServer;

  private readonly schema: GraphQLSchema;

  /**
   * @param httpServer
   * @param updateResolver Its workaround that import the esm module from cjs.
   */
  constructor(httpServer, updateResolver) {
    const middlewares = internalMiddlewares;
    const util = { ...GQLUtil, ...Util };
    const middlewareOps = (key) => Object.keys(middlewares)
      .map((k) => {
        const fun = middlewares[k][key];
        return fun ? fun.bind(this)(BookDataManager, this, SubscriptionKeys, util) : {};
      }).reduce((a, o) => ({ ...a, ...o }), {});

    this.schema = makeExecutableSchema({
      typeDefs: gql(schemaString),
      resolvers: {
        BigInt,
        IntRange,
        Upload: updateResolver,
        /* handler(parent, args, context, info) */
        Query: {
          ...middlewareOps('Query'),
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
