import { BookDataManager } from '@server/database/BookDataManager';
import { INSTANCE, PrismaBookDataManager } from '@server/database/prisma';
import { betterAuth, type DBAdapterInstance } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { type GenericOAuthConfig, genericOAuth } from 'better-auth/plugins';
import { type Context, Hono, type MiddlewareHandler, type Next } from 'hono';

const getOIDCConfig = ():
  | Omit<GenericOAuthConfig, 'providerId' | 'scopes'>
  | undefined => {
  try {
    return JSON.parse(process.env.BOOKREADER_OIDC);
  } catch (_e) {
    return undefined;
  }
};

export const oidcConfig = getOIDCConfig();

export const createAuth = () => {
  let database: DBAdapterInstance;
  if (BookDataManager instanceof PrismaBookDataManager) {
    database = prismaAdapter(INSTANCE.prismaClient, { provider: 'sqlite' });
  } else {
    throw new Error('Unsupported database adapter for better-auth');
  }
  return betterAuth({
    database,
    secret: process.env.BOOKREADER_SESSION_SECRET || 'book-reader',
    baseURL: process.env.BOOKREADER_BASE_URL || 'http://localhost:8081',
    basePath: '/auth',
    plugins: [
      genericOAuth({
        config: oidcConfig
          ? [
              {
                ...oidcConfig,
                providerId: 'oidc',
                scopes: ['openid', 'profile', 'email'],
              },
            ]
          : [],
      }),
    ],
    trustedOrigins: ['*'],
  });
};

export type Auth = ReturnType<typeof createAuth>;

export const authRoute = (auth: Auth) => {
  const app = new Hono();
  app.all('*', (c) => auth.handler(c.req.raw));
  return app;
};

export const isAuthenticated = async (
  auth: Auth,
  headers: Headers,
): Promise<boolean> => {
  if (!oidcConfig) return true;
  const session = await auth.api.getSession({ headers });
  return !!session;
};

export const createIsAuthenticatedMiddleware =
  (auth: Auth): MiddlewareHandler =>
  async (c: Context, next: Next) => {
    if (await isAuthenticated(auth, c.req.raw.headers)) {
      return next();
    }
    return c.text('', 401);
  };
