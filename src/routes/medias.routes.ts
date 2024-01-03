import { Router } from 'express';

import { updateImageController } from '@controllers/medias.controllers';
import { wrapRequestHandler } from '@utils/handlers';

const router = Router();

/**
 * Description: Upload image
 * Path: /upload-image
 * Method: POST
 * Body: {}
 */
router.post('/upload-image', wrapRequestHandler(updateImageController));

export default router;
