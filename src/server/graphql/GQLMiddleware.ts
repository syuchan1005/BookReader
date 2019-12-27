import { SubClass } from 'gm';
import { ApolloServer, PubSubEngine } from 'apollo-server-koa';
import { Database } from '@server/sequelize/models';
import { SubscriptionKeys } from './index';
import {
  QueryResolvers,
  MutationResolvers,
  SubscriptionResolvers,
} from "@common/GQLTypes";

export default class GQLMiddleware {
  readonly gm: SubClass;

  readonly useIM: boolean;

  readonly server: ApolloServer;

  readonly pubsub: PubSubEngine;

  /* eslint-disable class-methods-use-this,@typescript-eslint/no-unused-vars */

  Query(
    db: Database,
    middleware: Pick<GQLMiddleware, 'gm' | 'useIM' | 'server' | 'pubsub'>,
    subscriptionKeys: typeof SubscriptionKeys,
  ): QueryResolvers {
    return {};
  }

  Mutation(
    db: Database,
    middleware: Pick<GQLMiddleware, 'gm' | 'useIM' | 'server' | 'pubsub'>,
    subscriptionKeys: typeof SubscriptionKeys,
  ): MutationResolvers {
    return {};
  }

  Subscription(
    db: Database,
    middleware: Pick<GQLMiddleware, 'gm' | 'useIM' | 'server' | 'pubsub'>,
    subscriptionKeys: typeof SubscriptionKeys,
  ): SubscriptionResolvers {
    return {};
  }

  /* eslint-enable class-methods-use-this,@typescript-eslint/no-unused-vars */
}
