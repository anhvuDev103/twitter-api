import { Router } from 'express';

import { loginController, registerController } from '~/controllers/users.controllers';
import { loginValidator } from '~/middlewares/users.middlewares';

const router = Router();

router.post('/login', loginValidator, loginController);
router.post('/register', registerController);

export default router;
