import { Router } from 'express';

import {
  uploadImageController,
  uploadVideoController
} from '@controllers/medias.controllers';
import { wrapRequestHandler } from '@utils/handlers';
import { accessTokenValidator } from '@middlewares/tokens.middlewares';
import { verifiedUserValidator } from '@middlewares/users.middlewares';

const router = Router();

/**
 * Description: Upload image
 * Path: /upload-image
 * Method: POST
 * Body: {}
 */
router.post(
  '/upload-image',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadImageController)
);

/**
 * Description: Upload video
 * Path: /upload-video
 * Method: POST
 * Body: {}
 */
router.post(
  '/upload-video',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadVideoController)
);

export default router;
