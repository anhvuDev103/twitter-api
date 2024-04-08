import { Request } from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

import {
  getNameFile,
  handleUploadImage,
  handleUploadVideo
} from '@utils/files';
import { UPLOAD_IMAGE_DIR, isProduction } from '@constants/configs';
import { MediaType } from '@constants/enums';
import { Media } from '@models/interfaces';

class MediasService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req);

    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newFilename = getNameFile(file.newFilename);
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newFilename}.jpg`);

        sharp.cache(false);
        await sharp(file.filepath).jpeg().toFile(newPath);

        fs.unlinkSync(file.filepath);

        return {
          url: isProduction
            ? `${process.env.HOST}/static/image/${newFilename}.jpg`
            : `http://localhost:${process.env.PORT}/static/image/${newFilename}.jpg`,
          type: MediaType.Image
        };
      })
    );

    return result;
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req);
    const result = files.map((file) => {
      return {
        url: isProduction
          ? `${process.env.HOST}/static/video/${file.newFilename}`
          : `http://localhost:${process.env.PORT}/static/video/${file.newFilename}`,
        type: MediaType.Video
      };
    });

    return result;
  }
}

const mediasService = new MediasService();

export default mediasService;
