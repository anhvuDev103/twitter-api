import { serveImageController } from '@controllers/medias.controllers';
import { Router } from 'express';

const router = Router();

/**
 * Description: Serve image
 * Path: /image/:name
 * Method: GET
 */
router.get('/image/:name', serveImageController);

export default router;
