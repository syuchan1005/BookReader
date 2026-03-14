import { mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from '@server/graphql/resolvers';
import { schemaString } from '@syuchan1005/book-reader-graphql';
import { GraphQLScalarType, type GraphQLSchema } from 'graphql';
import { createYoga } from 'graphql-yoga';
import type { Disposable } from 'graphql-ws/lib/common';
import { useServer } from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';
import BigIntScalar from './scalar/BigIntScalar';
import IntRangeScalar from './scalar/IntRange';

export const SubscriptionKeys = {
  ADD_BOOKS: 'ADD_BOOKS',
  BULK_EDIT_PAGE: 'BULK_EDIT_PAGE',
};

const UploadScalar = new GraphQLScalarType({
  name: 'Upload',
  description: 'File upload scalar type (handled natively by GraphQL Yoga)',
  parseValue: (value) => value,
  parseLiteral() {
    throw new Error('Upload literal is not supported');
  },
  serialize() {
    throw new Error('Upload serialization is not supported');
  },
});

export default class GraphQL {
  public readonly yoga: ReturnType<typeof createYoga>;

  private readonly schema: GraphQLSchema;

  private serverCleanup: Disposable | null = null;

  constructor() {
    this.schema = makeExecutableSchema({
      typeDefs: schemaString,
      resolvers: mergeResolvers([
        {
          BigInt: BigIntScalar,
          IntRange: IntRangeScalar,
          Upload: UploadScalar,
        },
        resolvers,
      ]),
    });

    this.yoga = createYoga({
      schema: this.schema,
      graphqlEndpoint: '/graphql',
      maskedErrors: false,
      landingPage: false,
      graphiql: {
        subscriptionsProtocol: 'WS',
      },
    });
  }

  applyMiddleware(app, preMiddleware) {
    app.use(this.yoga.graphqlEndpoint, preMiddleware, this.yoga);
  }

  useSubscription(httpServer) {
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: this.yoga.graphqlEndpoint,
    });
    this.serverCleanup = useServer(
      {
        execute: (args: any) => args.rootValue.execute(args),
        subscribe: (args: any) => args.rootValue.subscribe(args),
        onSubscribe: async (ctx, message) => {
          const params = message.payload;
          const {
            schema,
            execute,
            subscribe,
            contextFactory,
            parse,
            validate,
          } = this.yoga.getEnveloped({
            ...ctx,
            req: ctx.extra.request,
            socket: ctx.extra.socket,
            params,
          });

          const args = {
            schema,
            operationName: params.operationName,
            document: parse(params.query),
            variableValues: params.variables,
            contextValue: await contextFactory(),
            rootValue: {
              execute,
              subscribe,
            },
          };

          const errors = validate(args.schema, args.document);
          if (errors.length) return errors;
          return args;
        },
      },
      wsServer,
    );

    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.on(signal, () => {
        wsServer.close();
        this.serverCleanup?.dispose();
      });
    }
  }
}
