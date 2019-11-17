import { SubClass } from 'gm';
import { ApolloServer, PubSubEngine } from 'apollo-server-koa';
import { Database } from '@server/sequelize/models';

export default abstract class GQLMiddleware {
  readonly gm: SubClass;

  readonly useIM: boolean;

  readonly server: ApolloServer;

  readonly pubsub: PubSubEngine;

  /* eslint-disable class-methods-use-this,@typescript-eslint/no-unused-vars */

  Query(db: Database, middleware: Pick<GQLMiddleware, 'gm' | 'useIM' | 'server' | 'pubsub'>): {
    [key: string]: (parent, param, ctx, info) => Promise<any> | any | null | undefined;
  } {
    return {};
  }

  Mutation(db: Database, middleware: Pick<GQLMiddleware, 'gm' | 'useIM' | 'server' | 'pubsub'>): {
    [key: string]: (parent, param, ctx, info) => Promise<any> | any | null | undefined;
  } {
    return {};
  }

  Subscription(db: Database, middleware: Pick<GQLMiddleware, 'gm' | 'useIM' | 'server' | 'pubsub'>) {
    return {};
  }

  /* eslint-enable class-methods-use-this,@typescript-eslint/no-unused-vars */
}
