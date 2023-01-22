import { GraphQLSchema } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { ApolloServer, gql } from 'apollo-server-express';
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from 'apollo-server-core';
import { mergeResolvers } from '@graphql-tools/merge';

import { schemaString } from '@syuchan1005/book-reader-graphql';
import { resolvers } from '@server/graphql/resolvers';
import BigInt from './scalar/BigInt';
import IntRange from './scalar/IntRange';

export const SubscriptionKeys = {
  ADD_BOOKS: 'ADD_BOOKS',
  BULK_EDIT_PAGE: 'BULK_EDIT_PAGE',
};

export default class GraphQL {
  public readonly apolloServer: ApolloServer;

  private readonly schema: GraphQLSchema;

  /**
   * @param httpServer
   * @param uploadResolver Its workaround that import the esm module from cjs.
   */
  constructor(httpServer, uploadResolver) {
    this.schema = makeExecutableSchema({
      typeDefs: gql(schemaString),
      resolvers: mergeResolvers([
        {
          BigInt,
          IntRange,
          Upload: uploadResolver,
        },
        resolvers,
      ]),
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
