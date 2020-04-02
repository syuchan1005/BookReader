import { SubClass } from 'gm';
import { ApolloServer, PubSubEngine } from 'apollo-server-koa';
import { Database } from '@server/sequelize/models';
import * as Util from '@server/Util';
import GQLUtil from '@server/graphql/GQLUtil';
import {
  QueryResolvers,
  MutationResolvers,
  SubscriptionResolvers,
} from '@common/GQLTypes';
import { SubscriptionKeys } from './index';

export default class GQLMiddleware {
  readonly gm: SubClass;

  readonly server: ApolloServer;

  readonly pubsub: PubSubEngine;

  /* eslint-disable class-methods-use-this,@typescript-eslint/no-unused-vars */

  Query(
    db: Database,
    middleware: Pick<GQLMiddleware, 'gm' | 'server' | 'pubsub'>,
    subscriptionKeys: typeof SubscriptionKeys,
    util: typeof Util | typeof GQLUtil,
  ): QueryResolvers {
    return {};
  }

  Mutation(
    db: Database,
    middleware: Pick<GQLMiddleware, 'gm' | 'server' | 'pubsub'>,
    subscriptionKeys: typeof SubscriptionKeys,
    util: typeof Util | typeof GQLUtil,
  ): MutationResolvers {
    return {};
  }

  Subscription(
    db: Database,
    middleware: Pick<GQLMiddleware, 'gm' | 'server' | 'pubsub'>,
    subscriptionKeys: typeof SubscriptionKeys,
    util: typeof Util | typeof GQLUtil,
  ): SubscriptionResolvers {
    return {};
  }

  Resolver(
    db: Database,
    middleware: Pick<GQLMiddleware, 'gm' | 'server' | 'pubsub'>,
    subscriptionKeys: typeof SubscriptionKeys,
    util: typeof Util | typeof GQLUtil,
  ): { [key: string]: object } {
    return {};
  }

  /* eslint-enable class-methods-use-this,@typescript-eslint/no-unused-vars */
}
