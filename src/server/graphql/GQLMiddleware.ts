import { SubClass } from 'gm';
import { ApolloServer, PubSubEngine } from 'apollo-server-koa';

export default abstract class GQLMiddleware {
  protected readonly gm: SubClass;

  protected readonly server: ApolloServer;

  protected readonly pubsub: PubSubEngine;

  /* eslint-disable class-methods-use-this */

  Query(): { [key: string]: (parent, param, ctx, info) => Promise<any> | any | null | undefined } {
    return {};
  }

  Mutation() { return {}; }

  Subscription() { return {}; }

  /* eslint-enable class-methods-use-this */
}
