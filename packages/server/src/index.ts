import './OpenTelemetry';

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { httpInstrumentationMiddleware } from '@hono/otel';
import { BookDataManager } from '@server/database/BookDataManager';
import { searchClient } from '@server/search';
import { StorageDataManager } from '@server/storage/StorageDataManager';
import {
  availableImageExtensions,
  type availableImageExtensionWithContentType,
} from '@syuchan1005/book-reader-common';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import {
  authRoute,
  createAuth,
  createIsAuthenticatedMiddleware,
  isAuthenticated,
} from './auth';
import GraphQL from './graphql/index';
import { getOrConvertImage } from './ImageUtil';

(async () => {
  await StorageDataManager.init();
  await BookDataManager.init();
  await searchClient.init();

  const auth = createAuth();
  const isAuthenticatedMiddleware = createIsAuthenticatedMiddleware(auth);

  const app = new Hono();
  const graphql = new GraphQL();

  app.use(httpInstrumentationMiddleware());
  app.use(logger());
  app.use(cors());

  app.route('/auth/*', authRoute(auth));

  /* image serve with auth protection */
  const bookImagePathRegex = new RegExp(
    `(\\d+)(_(\\d+)x(\\d+))?\\.(${availableImageExtensions.join('|')})$`,
  );

  for (const folderPath of StorageDataManager.getStaticFolders()) {
    app.use(
      '/book/*',
      isAuthenticatedMiddleware,
      serveStatic({ root: folderPath }),
    );
  }

  app.get('/book/:bookId/:fileName', isAuthenticatedMiddleware, async (c) => {
    const { bookId, fileName } = c.req.param();
    const match = fileName.match(bookImagePathRegex);
    if (!match) {
      return c.notFound();
    }
    const [_full, pageNum, sizeExists, width, height, ext] = match;
    const isNotSave = c.req.query('nosave') === '';
    const extension =
      ext as keyof typeof availableImageExtensionWithContentType;

    const result = await getOrConvertImage(
      bookId,
      pageNum,
      {
        ext: extension,
        size: sizeExists
          ? {
              width: Number(width),
              height: Number(height),
            }
          : undefined,
      },
      !isNotSave,
    );
    if (result.success) {
      c.header('Content-Type', result.type);
      c.header('Content-Length', result.byteLength.toString());
      c.header('Last-Modified', result.lastModified.toUTCString());
      return c.body(result.body as unknown as ReadableStream);
    }
    return c.text(result.body as string, 503);
  });

  // GraphQL with auth protection
  app.on(['GET', 'POST'], '/graphql', async (c) => {
    if (!(await isAuthenticated(auth, c.req.raw.headers))) {
      return c.text('', 401);
    }
    return graphql.handle(c);
  });

  // Static files
  app.use(serveStatic({ root: './public' }));

  // SPA history API fallback
  app.get(
    '*',
    serveStatic({ root: './public', rewriteRequestPath: () => '/index.html' }),
  );

  const port = Number(process.env.PORT) || 8081;
  serve({ fetch: app.fetch, port }, () => {
    console.log(`👔 listen  at: http://localhost:${port}`);
    console.log(`🚀 graphql at: http://localhost:${port}/graphql`);
  });
})();
