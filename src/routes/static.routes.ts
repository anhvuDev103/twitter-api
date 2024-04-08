import {
  serveImageController,
  serveVideoController
} from '@controllers/medias.controllers';
import { Router } from 'express';

const router = Router();

/**
 * Description: Serve image
 * Path: /image/:name
 * Method: GET
 */
router.get('/image/:name', serveImageController);

/**
 * Description: Serve video
 * Path: /video/:name
 * Method: GET
 */
router.get('/video/:name', serveVideoController);

export default router;
