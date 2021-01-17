/* eslint-disable max-len */
const path = require('path');
const fs = require('fs');
const { nanoid } = require('nanoid');
const { checkImgFile } = require('./checkImgFile');

class Img {
  constructor(ROOT) {
    this.imagesDataPath = path.join(__dirname, 'db', 'imagesData.json');
    this.imagesPath = path.join(ROOT, 'img');
  }

  async add(ctx) {
    const result = checkImgFile(ctx);

    if (!result.success) return result;

    try {
      const imgData = await this.getImagesData();
      if (!imgData.success) return imgData;

      const file = result.data;
      const imageFileName = nanoid() + path.extname(file.name);
      const imageName = path.parse(file.name).name;

      const reader = fs.createReadStream(file.path);
      const stream = fs.createWriteStream(path.join(this.imagesPath, imageFileName));
      reader.pipe(stream);
      // Возможно нужно предусмотреть закрытие потока, если пользователь прервал загрузку файла на сервер.
      // Подробности: https://learn.javascript.ru/screencast/nodejs#nodejs-streams-net

      const { images } = imgData.data;
      const image = { imageFileName, imageName };

      images.push(image);

      await this.updateImagesData(imgData.data);

      return {
        success: true,
        data: image,
      };
    } catch (e) {
      return {
        success: false,
        data: `Failed to save file to server. ${e.name} ${e.message}`,
      };
    }
  }

  getImagesData() {
    return new Promise((resolve) => {
      const result = {
        success: true,
        data: '',
      };
      fs.readFile(this.imagesDataPath, 'utf-8', (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            result.data = { images: [] };
          } else {
            result.success = false;
            result.data = err;
          }
        } else result.data = JSON.parse(data);

        resolve(result);
      });
    });
  }

  updateImagesData(imgData) {
    return new Promise((resolve, reject) => {
      const result = {
        success: true,
        data: 'Image database updated.',
      };

      fs.writeFile(this.imagesDataPath, JSON.stringify(imgData), (err) => {
        if (err) {
          result.success = false;
          result.data = `Failed to update the image database. ${err.name} ${err.code} ${err.message}`;
          reject(result);
        }
        resolve(result);
      });
    });
  }

  async deleteImage(ctx) {
    const { imageFileName } = ctx.request.body;

    const deleteImageFromDB = await this.deleteImageFromDB(imageFileName);
    if (!deleteImageFromDB.success) return deleteImageFromDB;

    const deleteImageFromDisk = await this.deleteImageFromDisk(imageFileName);
    if (!deleteImageFromDisk.success) return deleteImageFromDisk;

    return {
      success: true,
      data: 'Image deleted.',
    };
  }

  deleteImageFromDB(imageFileName) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      const result = {
        success: true,
        data: 'Image deleted from DB.',
      };

      const imgData = await this.getImagesData();
      if (!imgData.success) resolve(imgData);

      const { images } = imgData.data;
      const imageIndex = images.findIndex((image) => image.imageFileName === imageFileName);

      if (imageIndex === -1) {
        result.success = false;
        result.data = `There is no picture with the name '${imageFileName}' in the database`;
        resolve(result);
      }

      images.splice(imageIndex, 1);

      const updateImagesData = await this.updateImagesData(imgData.data);
      if (!updateImagesData.success) resolve(updateImagesData);

      resolve(result);
    });
  }

  deleteImageFromDisk(imageFileName) {
    return new Promise((resolve) => {
      const result = {
        success: true,
        data: 'Image from disk deleted.',
      };

      fs.unlink(path.join(this.imagesPath, imageFileName), (err) => {
        if (err) {
          result.success = false;
          result.data = `Failed to delete the image. ${err.name} ${err.code} ${err.message}`;
        }
        resolve(result);
      });
    });
  }
}

module.exports = {
  Img,
};
