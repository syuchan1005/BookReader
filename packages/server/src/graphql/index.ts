import { GraphQLSchema } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLUpload, graphqlUploadKoa } from 'graphql-upload';
import { PubSub } from 'graphql-subscriptions';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

import { ApolloServer, gql } from 'apollo-server-koa';

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
import authDirective from './directive/auth';

export const SubscriptionKeys = {
  ADD_BOOKS: 'ADD_BOOKS',
};

export default class GraphQL {
  public readonly util = { saveImage: convertAndSaveJpg };

  public readonly apolloServer: ApolloServer;

  public readonly pubsub: PubSub;

  private readonly schema: GraphQLSchema;

  private readonly plugins: InternalGQLPlugin[];

  private readonly middlewares: { [key: string]: GQLMiddleware };

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

    const baseSchema = makeExecutableSchema({
      typeDefs: [
        gql(schemaString),
        ...this.plugins.map((pl) => pl.typeDefs),
      ],
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
    });
    this.schema = authDirective(baseSchema, 'auth');
    this.apolloServer = new ApolloServer({
      schema: this.schema,
      context: ({ ctx }) => ({ ctx }),
    });
  }

  async middleware(app) {
    await this.apolloServer.start();
    app
      .use(graphqlUploadKoa())
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
