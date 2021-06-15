import Koa from 'koa';
import Serve from 'koa-static';
import { historyApiFallback } from 'koa2-connect-history-api-fallback';

import { getCacheOrConvertImage, obsoleteConvertImage } from './ImageUtil';
import { cacheFolderPath, createStorageFolders, storageBasePath } from './StorageUtil';
import GraphQL from './graphql/index';
import Database from './sequelize/models';
import { ImageHeader } from '@syuchan1005/book-reader-common';

const toInt = (value: string | string[]): number | undefined => {
  let numStr;
  if (Array.isArray(value)) {
    numStr = value[0];
  } else {
    numStr = value;
  }
  const num = Number(numStr);
  const intNum = parseInt(numStr);
  if (num !== intNum || !isFinite(intNum)) {
    return undefined;
  }
  return intNum;
};

(async () => {
  await createStorageFolders();

  const app = new Koa();
  const graphql = new GraphQL();

  app.use(async (ctx, next) => {
    const { url, headers } = ctx.req;
    const match = url.match(/^\/book\/([a-f0-9-]{36})\/(\d+)\.([a-z]+)$/);
    if (!match) {
      await next();
      return;
    }

    const [full, bookId, pageNum, ext] = match;
    if (!['jpg', 'webp'].includes(ext)) {
      ctx.code = 400;
      return;
    }
    // @ts-ignore
    const extension: 'jpg' | 'webp' = ext;

    const width = toInt(headers[ImageHeader.width]);
    const height = toInt(headers[ImageHeader.height]);
    const isCache = headers[ImageHeader.cache] === 'true';
    if (extension === 'jpg' && !(width || height)) {
      await next();
      return;
    }
    const result = await getCacheOrConvertImage(bookId, pageNum, extension, width, height, isCache);
    if (!result.success) {
      ctx.code = 503;
      return;
    }
    ctx.code = 200;
    ctx.vary([ImageHeader.width, ImageHeader.height].join(','));
    ctx.body = result.body;
    ctx.length = result.length;
    ctx.type = result.mimeType;
    ctx.lastModified = result.lastModified;
  });

  app.use(Serve(storageBasePath));

  app.use(Serve(cacheFolderPath));

  app.use(async (ctx, next) => {
    const { url } = ctx.req;
    const match = url.match(/^\/book\/([a-f0-9-]{36})\/(\d+)(_(\d+)x(\d+))?\.(jpg|jpg\.webp)(\?nosave)?$/);
    if (!match) {
      await next();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [full, bookId, pageNum, sizeExists, width, height, ext, isNotSave] = match;

    if (ext === 'jpg' && !sizeExists) {
      await next();
      return;
    }

    const result = await obsoleteConvertImage(
      bookId,
      pageNum,
      {
        // @ts-ignore
        ext: ext as unknown as 'jpg' | 'jpg.webp',
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

  await Database.sync();

  await graphql.middleware(app);

  app.use(historyApiFallback({}));

  const port = process.env.PORT || 8081;
  const server = app.listen(port, () => {
    /* eslint-disable no-console */
    console.log(`👔 listen  at: http://localhost:${port}`);
    console.log(`🚀 graphql at: http://localhost:${port}${graphql.server.graphqlPath}`);
  });

  graphql.useSubscription(server);
})();
