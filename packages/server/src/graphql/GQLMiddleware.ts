import { PubSub } from 'graphql-subscriptions';
import { ApolloServer } from 'apollo-server-koa';
import * as Util from '@server/Util';
import GQLUtil from '@server/graphql/GQLUtil';
import {
  QueryResolvers,
  MutationResolvers,
  SubscriptionResolvers,
  Resolvers,
} from '@syuchan1005/book-reader-graphql';
import { IBookDataManager } from '@server/database/BookDataManager';
import { SubscriptionKeys } from './index';

export default class GQLMiddleware {
  readonly util: { saveImage: (dist: string, buf: Buffer) => Promise<any> };

  readonly server: ApolloServer;

  readonly pubsub: PubSub;

  /* eslint-disable class-methods-use-this,@typescript-eslint/no-unused-vars */

  Query(
    bookDataManager: IBookDataManager,
    middleware: Pick<GQLMiddleware, 'server' | 'pubsub'>,
    subscriptionKeys: typeof SubscriptionKeys,
    util: typeof Util | typeof GQLUtil,
  ): QueryResolvers {
    return {};
  }

  Mutation(
    bookDataManager: IBookDataManager,
    middleware: Pick<GQLMiddleware, 'server' | 'pubsub' | 'util'>,
    subscriptionKeys: typeof SubscriptionKeys,
    util: typeof Util | typeof GQLUtil,
  ): MutationResolvers {
    return {};
  }

  Subscription(
    bookDataManager: IBookDataManager,
    middleware: Pick<GQLMiddleware, 'server' | 'pubsub'>,
    subscriptionKeys: typeof SubscriptionKeys,
    util: typeof Util | typeof GQLUtil,
  ): SubscriptionResolvers {
    return {};
  }

  Resolver(
    bookDataManager: IBookDataManager,
    middleware: Pick<GQLMiddleware, 'server' | 'pubsub' | 'util'>,
    subscriptionKeys: typeof SubscriptionKeys,
    util: typeof Util | typeof GQLUtil,
  ): Resolvers {
    return {};
  }

  /* eslint-enable class-methods-use-this,@typescript-eslint/no-unused-vars */
}
