const path = require('path');
const Koa = require('koa');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');

const app = new Koa();
const ROOT = path.join(__dirname, 'public');

app.use(koaBody({
  multipart: true,
}));

app.use(koaStatic(ROOT));

const { Img } = require('./src/Img');

const img = new Img(ROOT);

app.use(async (ctx) => {
  let result = {
    success: true,
    data: '',
  };

  const { method } = ctx.request;

  if (method === 'GET' || method === 'POST') {
    // При GET запросе action будет в request.query, при POST - request.body
    const action = ctx.request.query.action || ctx.request.body.action;

    if (action) {
      switch (action) {
        case 'getImagesData':
          try {
            result = await img.getImagesData();
          } catch (e) {
            result.success = false;
            result.data = `(getImagesData) ${e.name} ${e.message}`;
          }
          break;

        case 'addImage':
          try {
            result = await img.add(ctx);
          } catch (e) {
            result.success = false;
            result.data = `(addImage) ${e.name} ${e.message}`;
          }
          break;

        case 'deleteImage':
          try {
            result = await img.deleteImage(ctx);
          } catch (e) {
            result.success = false;
            result.data = `(deleteImage) ${e.name} ${e.message}`;
          }
          break;

        default:
          result.success = false;
          result.data = `Unknown action '${action}' in request parameters.`;
      }
    }
  }

  try {
    ctx.body = JSON.stringify(result);
  } catch (e) {
    ctx.body = JSON.stringify({
      success: false,
      data: `Failed to process response. ${e.name} ${e.message}`,
    });
  }
});

const PORT = process.env.PORT || 3000;
// eslint-disable-next-line no-console
app.listen(PORT, () => console.log(`Koa server has been started on port ${PORT} ...`));
