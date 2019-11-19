import { promises as fs, createReadStream } from 'fs';
import path from 'path';

import Koa from 'koa';
import Serve from 'koa-static';
import { historyApiFallback } from 'koa2-connect-history-api-fallback';
import gm from 'gm';
import execa from 'execa';

import GraphQL from './graphql';
import Database from './sequelize/models';
import { mkdirpIfNotExists } from './Util';

const im = gm.subClass({ imageMagick: true });
let useIM = true;

(async () => {
  useIM = await new Promise((resolve) => {
    im(10, 10)
      .stream((err, stdout, stderr) => {
        if (err) resolve(false);
        stderr.once('data', () => resolve(false));
        stdout.once('error', () => resolve(false));
        stdout.once('end', () => resolve(true));
      });
  });
})();

const app = new Koa();
const graphql = new GraphQL((useIM ? im : gm), useIM);

app.use(Serve('storage/'));

app.use(Serve('storage/cache/'));

const getSize = (p): Promise<{
  width: number,
  height: number,
}> => new Promise((resolve, reject) => {
  (useIM ? im : gm)(p)
    .size((err, value) => {
      if (err) reject(err);
      else resolve(value);
    });
});

app.use(async (ctx, next) => {
  const { url } = ctx.req;
  const match = url.match(/^\/book\/([a-f0-9-]{36})\/(\d+)_(\d+)x(\d+)\.jpg(\?nosave)?$/);
  if (match) {
    const origImgPath = `storage/book/${match[1]}/${match[2]}.jpg`;
    const atoi = (s) => (s ? (Number(s) || null) : null);

    const sizes = { width: atoi(match[3]), height: atoi(match[4]) };

    const stats = await fs.stat(origImgPath);
    if (stats.isFile()) {
      const imageSize = await getSize(origImgPath);
      if (sizes.width >= imageSize.width || sizes.height >= imageSize.height) {
        ctx.body = createReadStream(origImgPath);
        ctx.type = 'image/jpeg';
        return;
      }

      try {
        const b = await new Promise((resolve, reject) => {
          (useIM ? im : gm)(path.resolve(origImgPath))
            .resize(sizes.width, sizes.height)
            .quality(70)
            .interlace('Line')
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
          try {
            await fs.stat(`storage/cache${url}`);
          } catch (ignored) {
            await mkdirpIfNotExists(path.join(`storage/cache${url}`, '..'));
            await fs.writeFile(`storage/cache${url}`, b);
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
  const match = url.match(/^\/book\/([a-f0-9-]{36})\/(\d+)(_(\d+)x(\d+))?\.jpg\.webp(\?nosave)?$/);
  if (match) {
    const origImgPath = `storage/book/${match[1]}/${match[2]}.jpg`;
    const stats = await fs.stat(origImgPath);

    if (stats.isFile()) {
      const command = 'cwebp';
      const args = [origImgPath, '-quiet'];
      if (match[3]) {
        const w = Number(match[4]) || 0;
        const h = Number(match[5]) || 0;

        const imageSize = await getSize(origImgPath);
        if (!(w >= imageSize.width || h >= imageSize.height)
          && (w > 0 || h > 0)) {
          args.push('-resize', w.toString(10), h.toString(10));
        }
      }

      if (!ctx.response.get('Last-Modified')) {
        ctx.set('Last-Modified', stats.mtime.toUTCString());
      }

      if (!match[6]) {
        try {
          await fs.stat(`storage/cache${url}`);
        } catch (ignored) {
          await mkdirpIfNotExists(path.join(`storage/cache${url}`, '..'));
          await execa(command, [...args, '-o', `storage/cache${url}`]);
          // await fs.writeFile(`storage/cache${url}`, webpBuffer);
        }
        ctx.body = createReadStream(`storage/cache${url}`);
      } else {
        const cwebpExec = await execa(command, [...args, '-o', '-'])
          .catch((e) => {
            throw e;
          });
        ctx.body = cwebpExec.stdout;
      }

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
