import * as Koa from 'koa';
import * as Serve from 'koa-static';
import { historyApiFallback } from 'koa2-connect-history-api-fallback';
import Graphql from './graphql';
import Database from './sequelize/models';

const app = new Koa();
const graphql = new Graphql();

app.use(historyApiFallback({ whiteList: ['/home'] }));

app.use(Serve('storage/'));

if (process.env.NODE_ENV === 'production') {
  app.use(Serve('dist/client'));
}

(async () => {
  await Database.sequelize.sync();

  await graphql.middleware(app);

  const port = process.env.PORT || 8081;
  app.listen(port, () => {
    /* eslint-disable no-console */
    console.log(`👔 listen  at: http://localhost:${port}`);
    console.log(`🚀 graphql at: http://localhost:${port}${graphql.server.graphqlPath}`);
  });
})();
