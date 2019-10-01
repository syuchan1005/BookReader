import { promises as fs } from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

import * as Koa from 'koa';
import * as Serve from 'koa-static';
import { historyApiFallback } from 'koa2-connect-history-api-fallback';
import * as gm from 'gm';

import Graphql from './graphql';
import Database from './sequelize/models';
import { mkdirpIfNotExists } from './Util';

const im = gm.subClass({ imageMagick: true });
let useIM = false;

const app = new Koa();
const graphql = new Graphql();

app.use(Serve('storage/'));

app.use(Serve('storage/cache/'));

app.use(async (ctx, next) => {
  const { url } = ctx.req;
  const match = url.match(/^\/book\/([a-f0-9-]{36})\/(\d+)_(\d*)x(\d*)\.jpg(\?nosave)?$/);
  if (match) {
    const origImgPath = `storage/book/${match[1]}/${match[2]}.jpg`;
    const stats = await fs.stat(origImgPath);
    if (stats.isFile()) {
      try {
        const b = await new Promise((resolve, reject) => {
          const atoi = (s) => (s ? (Number(s) || null) : null);
          (useIM ? im : gm)(path.resolve(origImgPath))
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

        if (!match[5]) {
          const u = url.replace(/\?nosave$/, '');
          try {
            await fs.stat(`storage/cache${u}`);
          } catch (ignored) {
            await mkdirpIfNotExists(path.join(`storage/cache${u}`, '..'));
            await fs.writeFile(`storage/cache${u}`, b);
          }
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

app.use(async (ctx, next) => {
  const { url } = ctx.req;
  const match = url.match(/^\/book\/([a-f0-9-]{36})\/(\d+)(_(\d*)x(\d*))?\.jpg\.webp(\?nosave)?$/);
  if (match) {
    const origImgPath = `storage/book/${match[1]}/${match[2]}.jpg`;
    const stats = await fs.stat(origImgPath);
    if (stats.isFile()) {
      let command = `cwebp ${origImgPath} -quiet`;
      if (match[3]) {
        const w = Number(match[4]) || 0;
        const h = Number(match[5]) || 0;
        if (w > 0 || h > 0) {
          command += ` -resize ${w} ${h}`;
        }
      }
      const webpBuffer = await new Promise((resolve, reject) => {
        exec(`${command} -o -`, {
          encoding: 'buffer',
          maxBuffer: 1024 * 512,
        }, (err, stdout) => {
          if (err) reject(err);
          else if (stdout.length > 0) {
            resolve(stdout);
          } else {
            reject(new Error('error'));
          }
        });
      });

      if (!ctx.response.get('Last-Modified')) {
        ctx.set('Last-Modified', stats.mtime.toUTCString());
      }

      if (!match[6]) {
        const u = url.replace(/\?nosave$/, '');
        try {
          await fs.stat(`storage/cache${u}`);
        } catch (ignored) {
          await mkdirpIfNotExists(path.join(`storage/cache${u}`, '..'));
          await fs.writeFile(`storage/cache${u}`, webpBuffer);
        }
      }

      ctx.body = webpBuffer;
      ctx.type = 'image/webp';
      return;
    }
  }
  await next();
});

if (process.env.NODE_ENV === 'production') {
  app.use(Serve('dist/client'));
}

(async () => {
  useIM = await new Promise((resolve) => {
    im(100, 100)
      .stream((err, stdout, stderr) => {
        stdout.once('end', () => resolve(true));
        stderr.once('data', () => resolve(false));
      });
  });

  await Database.sequelize.sync();

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
