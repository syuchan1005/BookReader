import { ApolloServer, PubSubEngine } from 'apollo-server-koa';
import { Database } from '@server/database/sequelize/models';
import * as Util from '@server/Util';
import GQLUtil from '@server/graphql/GQLUtil';
import {
  QueryResolvers,
  MutationResolvers,
  SubscriptionResolvers,
  Resolvers,
} from '@syuchan1005/book-reader-graphql';
import { SubscriptionKeys } from './index';

export default class GQLMiddleware {
  readonly util: { saveImage: (dist: string, buf: Buffer) => Promise<any> };

  readonly server: ApolloServer;

  readonly pubsub: PubSubEngine;

  /* eslint-disable class-methods-use-this,@typescript-eslint/no-unused-vars */

  Query(
    db: Database,
    middleware: Pick<GQLMiddleware, 'server' | 'pubsub'>,
    subscriptionKeys: typeof SubscriptionKeys,
    util: typeof Util | typeof GQLUtil,
  ): QueryResolvers {
    return {};
  }

  Mutation(
    db: Database,
    middleware: Pick<GQLMiddleware, 'server' | 'pubsub' | 'util'>,
    subscriptionKeys: typeof SubscriptionKeys,
    util: typeof Util | typeof GQLUtil,
  ): MutationResolvers {
    return {};
  }

  Subscription(
    db: Database,
    middleware: Pick<GQLMiddleware, 'server' | 'pubsub'>,
    subscriptionKeys: typeof SubscriptionKeys,
    util: typeof Util | typeof GQLUtil,
  ): SubscriptionResolvers {
    return {};
  }

  Resolver(
    db: Database,
    middleware: Pick<GQLMiddleware, 'server' | 'pubsub' | 'util'>,
    subscriptionKeys: typeof SubscriptionKeys,
    util: typeof Util | typeof GQLUtil,
  ): Resolvers {
    return {};
  }

  /* eslint-enable class-methods-use-this,@typescript-eslint/no-unused-vars */
}
