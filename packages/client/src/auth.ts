import { createAuthClient } from 'better-auth/client';
import { genericOAuthClient } from 'better-auth/client/plugins';

const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: '/auth',
  plugins: [genericOAuthClient()],
});

let isJumped = false;
export const goToAuthPage = async () => {
  if (!isJumped) {
    isJumped = true;
    await authClient.signIn.oauth2({
      providerId: 'oidc',
      callbackURL: location.pathname,
    });
  }
};
