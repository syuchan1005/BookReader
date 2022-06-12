import Koa from 'koa';
import Serve from 'koa-static';
import { historyApiFallback } from 'koa2-connect-history-api-fallback';
import cors from '@koa/cors';

import { BookDataManager } from '@server/database/BookDataManager';
import { StorageDataManager } from '@server/storage/StorageDataManager';
import { convertImage } from './ImageUtil';
import GraphQL from './graphql/index';

(async () => {
  await StorageDataManager.init();

  const app = new Koa();
  const graphql = new GraphQL();

  app.use(cors());

  StorageDataManager.getStaticFolders().forEach((folderPath) => {
    app.use(Serve(folderPath));
  });

  /* image serve with options in image name */
  app.use(async (ctx, next) => {
    const { url } = ctx.req;
    const match = url.match(/^\/book\/([^/]+)\/(\d+)(_(\d+)x(\d+))?\.(jpg|jpg\.webp|webp)(\?nosave)?$/);
    if (!match) {
      await next();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    const result = await convertImage(
      bookId,
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
      ctx.status = 200;
      ctx.type = result.type;
      ctx.body = result.body;
      ctx.length = result.byteLength;
      ctx.cacheControl = 'max-age=0';

      if (result.lastModified) {
        ctx.lastModified = result.lastModified;
      }
    } else {
      ctx.status = 503;
      ctx.body = result.body;
    }
  });

  await BookDataManager.init();

  await graphql.middleware(app);

  app.use(historyApiFallback({}));

  app.use(Serve('public'));

  const port = process.env.PORT || 8081;
  const server = app.listen(port, () => {
    /* eslint-disable no-console */
    console.log(`👔 listen  at: http://localhost:${port}`);
    console.log(`🚀 graphql at: http://localhost:${port}${graphql.apolloServer.graphqlPath}`);
  });

  graphql.useSubscription(server);
})();
