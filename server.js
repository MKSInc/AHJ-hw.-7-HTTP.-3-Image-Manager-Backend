const path = require('path');
const Koa = require('koa');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');

const app = new Koa();
const dirs = {
  public: path.join(__dirname, 'public'),
  images: path.join(__dirname, 'public', 'img'),
};

app.use(koaBody({
  multipart: true,
}));

app.use(koaStatic(dirs.public));

app.use(async (ctx) => {
  const response = {
    success: true,
    data: '',
  };

  ctx.body = JSON.stringify(response);
});

const PORT = process.env.PORT || 3000;
// eslint-disable-next-line no-console
app.listen(PORT, () => console.log(`Koa server has been started on port ${PORT} ...`));
