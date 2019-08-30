// @ts-ignore
import Koa from 'koa'; // import * as Koa ... throw exception
import Graphql from './graphql';
import Database from './sequelize/models';

const app = new Koa();
const graphql = new Graphql();

(async () => {
  await Database.sequelize.sync();

  graphql.middleware(app);

  const port = process.env.PORT || 8081;
  app.listen(port, () => {
    /* eslint-disable no-console */
    console.log(`👔 listen  at: http://localhost:${port}`);
    console.log(`🚀 graphql at: http://localhost:${port}${graphql.server.graphqlPath}`);
  });

})();
