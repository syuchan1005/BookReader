import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';
import { mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from '@server/graphql/resolvers';
import { schemaString } from '@syuchan1005/book-reader-graphql';
import { json } from 'body-parser';
import type { GraphQLSchema } from 'graphql';
import gql from 'graphql-tag';
import type { Disposable } from 'graphql-ws/lib/common';
import { useServer } from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';
import BigIntScalar from './scalar/BigIntScalar';
import IntRangeScalar from './scalar/IntRange';

export const SubscriptionKeys = {
  ADD_BOOKS: 'ADD_BOOKS',
  BULK_EDIT_PAGE: 'BULK_EDIT_PAGE',
};

export default class GraphQL {
  public readonly apolloServer: ApolloServer;

  private readonly schema: GraphQLSchema;

  private serverCleanup: Disposable | null = null;

  /**
   * @param httpServer
   * @param uploadResolver Its workaround that import the esm module from cjs.
   */
  constructor(httpServer, uploadResolver) {
    this.schema = makeExecutableSchema({
      typeDefs: gql(schemaString),
      resolvers: mergeResolvers([
        {
          BigInt: BigIntScalar,
          IntRange: IntRangeScalar,
          Upload: uploadResolver,
        },
        resolvers,
      ]),
    });
    const self = this;
    this.apolloServer = new ApolloServer({
      schema: this.schema,
      introspection: true,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await self.serverCleanup?.dispose();
              },
            };
          },
        },
      ],
    });
  }

  /**
   * @param app
   * @param uploadMiddleware Its workaround that import the esm module from cjs.
   */
  async middleware(app, uploadMiddleware, preMiddleware) {
    await this.apolloServer.start();
    app.use(
      '/graphql',
      preMiddleware,
      json(),
      uploadMiddleware(),
      expressMiddleware(this.apolloServer),
    );
  }

  useSubscription(httpServer) {
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: '/graphql',
    });
    this.serverCleanup = useServer({ schema: this.schema }, wsServer);

    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.on(signal, () => wsServer.close());
    }
  }
}
