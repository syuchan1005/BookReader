import { promises as fs } from 'fs';
import * as path from 'path';

import * as Koa from 'koa';
import * as Serve from 'koa-static';
import { historyApiFallback } from 'koa2-connect-history-api-fallback';
import * as gmModule from 'gm';

import Graphql from './graphql';
import Database from './sequelize/models';

const gm = gmModule.subClass({ imageMagick: true });

const app = new Koa();
const graphql = new Graphql();

app.use(Serve('storage/'));

app.use(async (ctx, next) => {
  const { url } = ctx.req;
  const match = url.match(/^\/book\/([a-f0-9-]{36})\/(\d+)_(\d*)x(\d*)\.jpg$/);
  if (match) {
    const origImgPath = `storage/book/${match[1]}/${match[2]}.jpg`;
    const stats = await fs.stat(origImgPath);
    if (stats.isFile()) {
      try {
        const b = await new Promise((resolve, reject) => {
          const atoi = (s) => (s ? Number(s) : null);
          gm(path.resolve(origImgPath))
            .resize(atoi(match[3]), atoi(match[4]))
            .stream((err, stdout, stderr) => {
              if (err) {
                reject(err);
              } else {
                const chunks = [];
                stdout.once('error', (e) => reject(e));
                stdout.once('end', () => resolve(Buffer.concat(chunks)));
                stdout.on('data', (c) => chunks.push(c));
                stderr.once('data', (d) => reject(String(d)));
              }
            });
        });
        ctx.body = b;
        ctx.type = 'image/jpeg';
        if (!ctx.response.get('Last-Modified')) {
          ctx.set('Last-Modified', stats.mtime.toUTCString());
        }
        try {
          await fs.stat(`storage${url}`);
        } catch (ignored) {
          await fs.writeFile(`storage${url}`, b);
        }
      } catch (e) {
        ctx.body = e;
        ctx.status = 503;
      }
      return;
    }
  }
  await next();
});

if (process.env.NODE_ENV === 'production') {
  app.use(Serve('dist/client'));
}

(async () => {
  await Database.sequelize.sync();

  await graphql.middleware(app);

  app.use(historyApiFallback({}));

  const port = process.env.PORT || 8081;
  app.listen(port, () => {
    /* eslint-disable no-console */
    console.log(`👔 listen  at: http://localhost:${port}`);
    console.log(`🚀 graphql at: http://localhost:${port}${graphql.server.graphqlPath}`);
  });
})();
