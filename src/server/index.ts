// @ts-ignore
import Koa from 'koa'; // import * as Koa ... throw exception

const app = new Koa();

app.use((ctx) => {
  ctx.status = 200;
});

const port = process.env.PORT || 8081;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 listen at: http://localhost:${port}`);
});
