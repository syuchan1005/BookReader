import './open-telemetry';

import Koa from 'koa';
import Serve from 'koa-static';
import { historyApiFallback } from 'koa2-connect-history-api-fallback';

import { BookDataManager } from '@server/database/BookDataManager';
import { obsoleteConvertImage } from './ImageUtil';
import { cacheFolderPath, createStorageFolders, storageBasePath } from './StorageUtil';
import GraphQL from './graphql/index';

(async () => {
  await createStorageFolders();

  const app = new Koa();
  const graphql = new GraphQL();

  app.use(Serve(storageBasePath));

  app.use(Serve(cacheFolderPath));

  /* image serve with options in image name */
  app.use(async (ctx, next) => {
    const { url } = ctx.req;
    const match = url.match(/^\/book\/([^/]+)\/(\d+)(_(\d+)x(\d+))?\.(jpg|jpg\.webp|webp)(\?nosave)?$/);
    if (!match) {
      await next();
      return;
    }
    const [_full, bookId, pageNum, sizeExists, width, height, ext, isNotSave] = match;
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

    const result = await obsoleteConvertImage(
      bookId,
      pageNum,
      {
        ext: extension,
        // @ts-ignore
        size: sizeExists ? { width: Number(width), height: Number(height) } : undefined,
      },
      !isNotSave,
    );
    if (result.success) {
      ctx.status = 200;
      ctx.type = result.type;
      ctx.body = result.body;

      if (!ctx.response.get('Last-Modified') && result.lastModified) {
        ctx.set('Last-Modified', result.lastModified);
      }
    } else {
      ctx.status = 503;
      ctx.body = result.body;
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(Serve('dist/client'));
  }

  await BookDataManager.init();

  await graphql.middleware(app);

  app.use(historyApiFallback({}));

  const port = process.env.PORT || 8081;
  const server = app.listen(port, () => {
    /* eslint-disable no-console */
    console.log(`👔 listen  at: http://localhost:${port}`);
    console.log(`🚀 graphql at: http://localhost:${port}${graphql.apolloServer.graphqlPath}`);
  });

  graphql.useSubscription(server);
})();
