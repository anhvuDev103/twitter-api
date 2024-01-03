import { Request, Response } from 'express';

import mediasService from '@services/medias.services';
import { MESSAGE } from '@constants/messages';
import path from 'path';
import { UPLOAD_DIR } from '@constants/configs';

export const updateImageController = async (req: Request, res: Response) => {
  const url = await mediasService.handleUploadImage(req);

  res.json({
    message: MESSAGE.UPLOAD_SUCCESS,
    result: url
  });
};

export const serveImageController = (req: Request, res: Response) => {
  const { name } = req.params;

  const filePath = path.resolve(UPLOAD_DIR, name);

  return res.sendFile(filePath, (err) => {
    if (err) {
      res.status((err as any).status).send('Not Found');
    }
  });
};
