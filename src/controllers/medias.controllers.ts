import { Request, Response } from 'express';

import mediasService from '@services/medias.services';
import { MESSAGE } from '@constants/messages';
import path from 'path';
import {
  UPLOAD_IMAGE_DIR,
  UPLOAD_VIDEO_DIR,
  UPLOAD_VIDEO_TEMP_DIR
} from '@constants/configs';

export const uploadImageController = async (req: Request, res: Response) => {
  const url = await mediasService.uploadImage(req);

  res.json({
    message: MESSAGE.UPLOAD_SUCCESS,
    result: url
  });
};

export const uploadVideoController = async (req: Request, res: Response) => {
  const url = await mediasService.uploadVideo(req);

  res.json({
    message: MESSAGE.UPLOAD_SUCCESS,
    result: url
  });
};

export const serveImageController = (req: Request, res: Response) => {
  const { name } = req.params;

  const filePath = path.resolve(UPLOAD_IMAGE_DIR, name);

  return res.sendFile(filePath, (err) => {
    if (err) {
      res.status((err as any).status).send('Not Found');
    }
  });
};

export const serveVideoController = (req: Request, res: Response) => {
  const { name } = req.params;

  const filePath = path.resolve(UPLOAD_VIDEO_DIR, name);

  return res.sendFile(filePath, (err) => {
    if (err) {
      res.status((err as any).status).send('Not Found');
    }
  });
};
