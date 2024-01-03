import { Request } from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

import { getNameFile, handleUploadImage as uploadImage } from '@utils/files';
import { UPLOAD_DIR, isProduction } from '@constants/configs';
import { MediaType } from '@constants/enums';
import { Media } from '@models/interfaces';

class MediasService {
  async handleUploadImage(req: Request) {
    const files = await uploadImage(req);

    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newFilename = getNameFile(file.newFilename);
        const newPath = path.resolve(UPLOAD_DIR, `${newFilename}.jpg`);

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
}

const mediasService = new MediasService();

export default mediasService;
