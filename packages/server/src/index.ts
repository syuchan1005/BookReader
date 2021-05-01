import Koa from 'koa';
import Serve from 'koa-static';
import { historyApiFallback } from 'koa2-connect-history-api-fallback';

import { convertImage } from './ImageUtil';
import GraphQL from './graphql/index';
import Database from './sequelize/models';
import { mkdirpIfNotExists } from './Util';

(async () => {
  const app = new Koa();
  const graphql = new GraphQL();

  await mkdirpIfNotExists('downloads');

  app.use(Serve('storage/'));

  app.use(Serve('storage/cache/'));

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

    const result = await convertImage(
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
