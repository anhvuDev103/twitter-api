import { Router } from 'express';

import {
  loginController,
  registerController
} from '~/controllers/users.controllers';
import {
  loginValidator,
  registerValidator
} from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const router = Router();

router.post('/login', loginValidator, loginController);

/**
 * Description: Register a new user
 * Path: /register
 * Method: POST
 * Body: { name: string, email: string, password: string,
 * confirm_password: string, date_of_birth: ISO8601 }
 */
router.post(
  '/register',
  registerValidator,
  wrapRequestHandler(registerController)
);

export default router;
