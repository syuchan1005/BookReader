import { GQLMiddleware } from '@server/graphql/GQLPlugin';
import { QueryResolvers } from '@syuchan1005/book-reader-graphql';
import { getAuthInfo } from '@server/AuthRepository';

class Auth0 extends GQLMiddleware {
  Query(): QueryResolvers {
    return {
      auth0: () => {
        const authInfo = getAuthInfo();
        return authInfo ? {
          domain: authInfo.domain,
          clientId: authInfo.clientId,
        } : undefined;
      },
    };
  }
}

export default Auth0;
