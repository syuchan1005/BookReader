import './OpenTelemetrySetup';

import http from 'http';
import express from 'express';
import morgan from 'morgan';
import history from 'connect-history-api-fallback';
import cors from 'cors';
import session from 'express-session';

import { BookDataManager } from '@server/database/BookDataManager';
import { StorageDataManager } from '@server/storage/StorageDataManager';
import { convertImage } from './ImageUtil';
import GraphQL from './graphql/index';
import { init as initAuth, initRoutes as initAuthRoutes, isAuthenticatedMiddleware } from './auth';

(async () => {
  await StorageDataManager.init();
  initAuth();

  const app = express();
  const httpServer = http.createServer(app);
  const graphql = new GraphQL(httpServer);

  app.use(morgan((tokens, req, res) => {
    let severity = 'INFO';
    const status = tokens.status(req, res);

    if (status >= 500) severity = 'ERROR';
    else if (status >= 400) severity = 'WARNING';

    const httpRequest = {
      requestMethod: tokens.method(req, res),
      requestUrl: tokens.url(req, res),
      status,
      responseSize: tokens.res(req, res, 'content-length'),
      userAgent: tokens['user-agent'](req, res),
      remoteIp: tokens['remote-addr'](req, res),
      referer: tokens.referrer(req, res),
      protocol: `HTTP/${tokens['http-version'](req, res)}`,
    };

    return JSON.stringify({
      severity,
      httpRequest,
      remote_user: tokens['remote-user'](req, res),
      timestamp: tokens.date(req, res, 'iso'),
      response_time: tokens['response-time'](req, res),
      total_time: tokens['total-time'](req, res),
    });
  }));

  app.use(cors());

  app.use(
    session({
      secret: process.env.BOOKREADER_SESSION_SECRET || 'book-reader',
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: 'auto',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    }),
  );
  initAuthRoutes(app);

  const requireAuthRouter = express.Router();
  StorageDataManager.getStaticFolders().forEach((folderPath) => {
    requireAuthRouter.use(express.static(folderPath));
  });

  /* image serve with options in image name */
  requireAuthRouter.get('/book/:bookId/:fileName', async (req, res, next) => {
    const match = req.params.fileName
      .match(/(\d+)(_(\d+)x(\d+))?\.(jpg|jpg\.webp|webp)(\?nosave)?$/);
    if (!match) {
      await next();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_full, pageNum, sizeExists, width, height, ext, isNotSave] = match;
    let extension;
    if (ext === 'jpg') {
      extension = 'jpg';
    } else {
      extension = 'webp';
    }

    if (ext === 'jpg' && !sizeExists) {
      await next();
      return;
    }

    const result = await convertImage(
      req.params.bookId,
      pageNum,
      {
        ext: extension,
        // @ts-ignore
        size: sizeExists ? {
          width: Number(width),
          height: Number(height),
        } : undefined,
      },
      !isNotSave,
    );
    if (result.success) {
      res.setHeader('Content-Type', result.type);
      res.setHeader('Content-Length', result.byteLength.toString());
      res.setHeader('Last-Modified', result.lastModified.toUTCString());
      res.send(result.body);
    } else {
      res.status(503).send(result.body);
    }
  });

  await BookDataManager.init();

  await graphql.middleware(requireAuthRouter);

  app.use('/', isAuthenticatedMiddleware, requireAuthRouter);

  app.use(history());

  app.use(express.static('public'));

  const port = process.env.PORT || 8081;
  httpServer.listen(port, () => {
    /* eslint-disable no-console */
    console.log(`👔 listen  at: http://localhost:${port}`);
    console.log(`🚀 graphql at: http://localhost:${port}${graphql.apolloServer.graphqlPath}`);
  });

  graphql.useSubscription(httpServer);
})();
