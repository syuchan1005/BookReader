import express, { Express } from 'express';
import passport from 'passport';
import { OIDCConfig, registerRegistry } from './registerRegistry';

const getOIDCConfig = (): OIDCConfig | undefined => {
  try {
    return JSON.parse(process.env.BOOKREADER_OIDC);
  } catch (e) {
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
  app.use('/auth', createAuthRouter());
};

const createAuthRouter = () => {
  const router = express.Router();
  router.get('/', (req, res) => {
    // @ts-ignore
    const isAuthenticated = req.session.passport !== undefined;
    if (!oidcConfig || isAuthenticated) {
      res.sendStatus(202);
    } else {
      res.sendStatus(401);
    }
  });

  router.get('/logout', (req, res) => {
    req.logout(() => {});
    res.sendStatus(200);
  });

  if (oidcConfig) {
    router.get(
      '/oidc',
      (req, res, next) => {
        // @ts-ignore
        req.session.redirectTo = req.query.r;
        return next();
      },
      passport.authenticate('openidconnect'),
    );
    router.get(
      '/oidc/callback',
      passport.authenticate(
        'openidconnect',
        { failureRedirect: 'oidc', keepSessionInfo: true },
      ),
      (req, res) => {
        // @ts-ignore
        res.redirect(req.session.redirectTo || '/');
      },
    );
  }
  return router;
};

export const isAuthenticatedMiddleware = (req, res, next) => {
  if (!oidcConfig || req.isAuthenticated()) {
    return next();
  }
  res.sendStatus(401);
  return undefined;
};
