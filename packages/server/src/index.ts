import http from 'http';
import express from 'express';
import history from 'connect-history-api-fallback';
import cors from 'cors';

import { BookDataManager } from '@server/database/BookDataManager';
import { StorageDataManager } from '@server/storage/StorageDataManager';
import { convertImage } from './ImageUtil';
import GraphQL from './graphql/index';

(async () => {
  await StorageDataManager.init();

  const app = express();
  const httpServer = http.createServer(app);
  const graphql = new GraphQL(httpServer);

  app.use(cors());

  StorageDataManager.getStaticFolders().forEach((folderPath) => {
    app.use(express.static(folderPath));
  });

  /* image serve with options in image name */
  app.get('/book/:bookId/:fileName', async (req, res, next) => {
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

  await graphql.middleware(app);

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
