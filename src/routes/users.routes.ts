import { Router } from 'express';

import {
  emailVerifyController,
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  registerController,
  resendEmailVerifyController,
  resetPasswordTokenController,
  updateMeController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controllers';
import { filterRequestBodyMiddleware } from '~/middlewares/common.middlewares';
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  refreshTokenValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/tokens.middlewares';
import {
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
  updateMeValidator,
  verifiedUserValidator
} from '~/middlewares/users.middlewares';
import { UpdateMeRequestBody } from '~/models/requests/User.requests';
import { wrapRequestHandler } from '~/utils/handlers';

const router = Router();

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

/**
 * Description: Login user
 * Path: /login
 * Method: POST
 * Body: { email: string, password: string,
 */
router.post('/login', loginValidator, wrapRequestHandler(loginController));

/**
 * Description: Logout a user
 * Path: /logout
 * Method: POST
 * Body: { refresh_token: RefreshToken }
 * Header: { Authorization: Beared <access_token> }
 */
router.post(
  '/logout',
  accessTokenValidator,
  refreshTokenValidator,
  wrapRequestHandler(logoutController)
);

/**
 * Description: Verify email when user client click on the link in email
 * Path: /verify-email
 * Method: POST
 * Body: { verify_email_token: string }
 */
router.post(
  '/verify-email',
  emailVerifyTokenValidator,
  wrapRequestHandler(emailVerifyController)
);

/**
 * Description: Resend email verify
 * Path: /resend-email-verify
 * Method: POST
 * Header: { Authorization: Beared <access_token> }
 */
router.post(
  '/resend-email-verify',
  accessTokenValidator,
  wrapRequestHandler(resendEmailVerifyController)
);

/**
 * Description: Submit email to reset password, send email to user
 * Path: /forgot-password
 * Method: POST
 * Body: { email: string }
 */
router.post(
  '/forgot-password',
  forgotPasswordValidator,
  wrapRequestHandler(forgotPasswordController)
);

/**
 * Description: Verify forgot password token
 * Path: /verify-forgot-password
 * Method: POST
 * Body: { forgot_password_token: string }
 */
router.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordTokenController)
);

/**
 * Description: Reset password after verify forgot password token
 * Path: /reset-password
 * Method: POST
 * Body: { forgot_password_token: string, password: string, confirm_password: string }
 */
router.post(
  '/reset-password',
  resetPasswordValidator,
  wrapRequestHandler(resetPasswordTokenController)
);

/**
 * Description: Get my profile
 * Path: /me
 * Method: GET
 * Header: { Authorization: Beared <access_token> }
 * Body: { forgot_password_token: string, password: string, confirm_password: string }
 */
router.get('/me', accessTokenValidator, wrapRequestHandler(getMeController));

/**
 * Description: Update my profile
 * Path: /me
 * Method: PATCH
 * Body: UserSchema
 */
router.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterRequestBodyMiddleware<UpdateMeRequestBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  wrapRequestHandler(updateMeController)
);

export default router;
