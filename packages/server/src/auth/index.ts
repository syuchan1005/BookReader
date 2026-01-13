import express, { type Express } from 'express';
import passport from 'passport';
import { type OIDCConfig, registerRegistry } from './registerRegistry';

const getOIDCConfig = (): OIDCConfig | undefined => {
  try {
    return JSON.parse(process.env.BOOKREADER_OIDC);
  } catch (_e) {
    return undefined;
  }
};

const oidcConfig = getOIDCConfig();

export const init = () => {
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((obj, done) => {
    done(null, obj);
  });

  registerRegistry(oidcConfig);
};

export const initRoutes = (app: Express) => {
  app.use(passport.initialize());
  app.use(passport.session());
  app.use('/auth', createAuthRouter('/auth'));
};

const createAuthRouter = (path: string) => {
  const router = express.Router();
  router.get('/', (req, res) => {
    // @ts-expect-error
    const isAuthenticated = req.session.passport !== undefined;
    if (!oidcConfig || isAuthenticated) {
      res.redirect('/');
    } else {
      res.redirect(`${path}/oidc`);
    }
  });

  router.get('/logout', (req, res) => {
    req.logout(() => {});
    res.redirect('/');
  });

  if (oidcConfig) {
    router.get(
      '/oidc',
      (req, _res, next) => {
        // @ts-expect-error
        req.session.redirectTo = req.query.r;
        return next();
      },
      passport.authenticate('openidconnect'),
    );
    router.get(
      '/oidc/callback',
      passport.authenticate('openidconnect', {
        failureRedirect: 'oidc',
        keepSessionInfo: true,
      }),
      (req, res) => {
        // @ts-expect-error
        res.redirect(req.session.redirectTo || '/');
      },
    );
  }
  return router;
};

export const isAuthenticatedMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): ReturnType<express.NextFunction> => {
  if (!oidcConfig || req.isAuthenticated()) {
    return next();
  }
  res.sendStatus(401);
  return;
};
