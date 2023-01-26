import './OpenTelemetrySetup';

import http from 'http';
import express from 'express';
import morgan from 'morgan';
import history from 'connect-history-api-fallback';
import cors from 'cors';
import session from 'express-session';
import connectRedis from 'connect-redis';
import Redis from 'ioredis';

import {
  availableImageExtensions,
  availableImageExtensionWithContentType
} from '@syuchan1005/book-reader-common';
import { BookDataManager } from '@server/database/BookDataManager';
import { StorageDataManager } from '@server/storage/StorageDataManager';
import { meiliSearchClient, elasticSearchClient } from '@server/search';
import { getOrConvertImage } from './ImageUtil';
import GraphQL from './graphql/index';
import { init as initAuth, initRoutes as initAuthRoutes, isAuthenticatedMiddleware } from './auth';

(async () => {
  const { default: GraphQLUpload } = await import('graphql-upload/GraphQLUpload.mjs');
  const { default: GraphQLUploadExpress } = await import('graphql-upload/graphqlUploadExpress.mjs');

  await StorageDataManager.init();
  initAuth();
  await meiliSearchClient.init();
  await elasticSearchClient.init();

  const app = express();
  const httpServer = http.createServer(app);
  const graphql = new GraphQL(httpServer, GraphQLUpload);

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

  let sessionStoreOption;
  try {
    sessionStoreOption = JSON.parse(process.env.BOOKREADER_SESSION_STORE);
  } catch (e) {
    sessionStoreOption = undefined;
  }
  let sessionStore;
  if (sessionStoreOption && sessionStoreOption.type === 'redis') {
    const RedisStore = connectRedis(session);
    const redisClient = new Redis({
      port: 6379,
      ...sessionStoreOption,
    });
    sessionStore = new RedisStore({ client: redisClient });
  }

  app.use(
    session({
      secret: process.env.BOOKREADER_SESSION_SECRET || 'book-reader',
      name: 'session',
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: 'auto',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
      store: sessionStore,
    }),
  );
  initAuthRoutes(app);

  const requireAuthRouter = express.Router();
  requireAuthRouter.use(isAuthenticatedMiddleware);
  StorageDataManager.getStaticFolders().forEach((folderPath) => {
    requireAuthRouter.use(express.static(folderPath));
  });

  /* image serve with options in image name */
  const bookImagePathRegex = new RegExp(`(\\d+)(_(\\d+)x(\\d+))?\\.(${availableImageExtensions.join('|')})$`);
  requireAuthRouter.get('/book/:bookId/:fileName', async (req, res, next) => {
    const match = req.params.fileName.match(bookImagePathRegex);
    if (!match) {
      await next();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_full, pageNum, sizeExists, width, height, ext] = match;
    const isNotSave = req.query.nosave === '';
    const extension = ext as keyof typeof availableImageExtensionWithContentType;

    const result = await getOrConvertImage(
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

  await graphql.middleware(requireAuthRouter, GraphQLUploadExpress);

  app.use(requireAuthRouter);

  app.use(history());

  app.use(express.static('public'));

  const port = process.env.PORT || 8081;
  httpServer.listen(port, () => {
    /* eslint-disable no-console */
    console.log(`👔 listen  at: http://localhost:${port}`);
    console.log(`🚀 graphql at: http://localhost:${port}/graphql`);
  });

  graphql.useSubscription(httpServer);
})();
