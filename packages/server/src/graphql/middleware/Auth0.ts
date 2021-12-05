import { GQLMiddleware } from '@server/graphql/GQLPlugin';
import { QueryResolvers } from '@syuchan1005/book-reader-graphql';

class Auth0 extends GQLMiddleware {
  Query(): QueryResolvers {
    return {
      auth0: () => {
        const domain = process.env.AUTH0_DOMAIN;
        const clientId = process.env.AUTH0_CLIENT_ID;
        if (!domain || !clientId) {
          return undefined;
        }
        return {
          domain,
          clientId,
        };
      },
    };
  }
}

export default Auth0;
