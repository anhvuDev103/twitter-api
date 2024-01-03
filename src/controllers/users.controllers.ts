import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import usersService from '@services/users.services';
import {
  ChangePasswordRequestBody,
  EmailVerifyRequestBody,
  FollowRequestBody,
  ForgotPasswordRequestBody,
  LoginRequestBody,
  LogoutRequestBody,
  RegisterRequestBody,
  ResetPasswordRequestBody,
  UpdateMeRequestBody,
  VerifyForgotPasswordRequestBody
} from '@models/requests/User.requests';
import { MESSAGE } from '@constants/messages';
import databaseService from '@services/database.services';
import HTTP_STATUS from '@constants/httpStatus';
import { UserVerifyStatus } from '@constants/enums';
import User from '@models/schemas/User.schema';
import { ErrorWithStatus } from '@models/Errors';
import {
  getProfileRequestParams,
  UnfollowRequestParams
} from '@models/params/User.params';
import { TokenPayload } from '@models/interfaces';
import { LoginWithGoogleQuery } from '@models/queries/User.queries';

export const registerController = async (
  req: Request<ParamsDictionary, unknown, RegisterRequestBody>,
  res: Response
) => {
  const result = await usersService.register(req.body);
  return res.json(result);
};

export const loginController = async (
  req: Request<ParamsDictionary, unknown, LoginRequestBody>,
  res: Response
) => {
  const user = req.user as User;
  const result = await usersService.login({
    user_id: user._id.toString(),
    verify: user.verify
  });

  return res.json({
    message: MESSAGE.LOGIN_SUCCESS,
    result
  });
};

export const loginWithGoogleController = async (
  req: Request<ParamsDictionary, unknown, unknown, LoginWithGoogleQuery>,
  res: Response
) => {
  const { code } = req.query;

  const { access_token, refresh_token } =
    await usersService.loginWithGoogle(code);

  const redirectUrl = `${process.env.CLIENT_REDIRECT_CALLBACK}?access_token=${access_token}&refresh_token=${refresh_token}`;

  return res.redirect(redirectUrl);
};

export const logoutController = async (
  req: Request<ParamsDictionary, unknown, LogoutRequestBody>,
  res: Response
) => {
  const { refresh_token } = req.body;
  const result = await usersService.logout(refresh_token);

  return res.json(result);
};

export const emailVerifyController = async (
  req: Request<ParamsDictionary, unknown, EmailVerifyRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload;
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  });

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: MESSAGE.USER_NOT_FOUND
    });
  }

  //email has verified
  if (user.email_verify_token === '') {
    return res.json({
      message: MESSAGE.EMAIL_ALREADY_VERIFIED_BEFORE
    });
  }

  const result = await usersService.verifyEmail(user_id);

  return res.json({
    message: MESSAGE.EMAIL_VERIFY_SUCCESS,
    result
  });
};

export const resendEmailVerifyController = async (
  req: Request,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  });

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: MESSAGE.USER_NOT_FOUND
    });
  }

  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: MESSAGE.EMAIL_ALREADY_VERIFIED_BEFORE
    });
  }

  const result = await usersService.resendEmailVerify(user_id);

  return res.json(result);
};

export const changePasswordController = async (
  req: Request<ParamsDictionary, unknown, ChangePasswordRequestBody>,
  res: Response
) => {
  const { user_id } = (req as Request).decoded_authorization as TokenPayload;
  const { password: newPassword } = req.body;

  const result = await usersService.changePassword(
    user_id.toString(),
    newPassword
  );

  return res.json(result);
};

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, unknown, ForgotPasswordRequestBody>,
  res: Response
) => {
  const { _id, verify } = req.user as User;
  const result = await usersService.forgotPassword({
    user_id: _id?.toString(),
    verify
  });

  return res.json(result);
};

export const verifyForgotPasswordTokenController = async (
  req: Request<ParamsDictionary, unknown, VerifyForgotPasswordRequestBody>,
  res: Response
) => {
  return res.json({
    message: MESSAGE.VERIFY_FORGOT_PASSWORD_SUCCESS
  });
};

export const resetPasswordTokenController = async (
  req: Request<ParamsDictionary, unknown, ResetPasswordRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload;
  const { password } = req.body;

  const result = await usersService.resetPassword(user_id, password);

  return res.json(result);
};

export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;

  const user = await usersService.getMe(user_id);

  return res.json({
    message: MESSAGE.GET_ME_SUCCESS,
    result: user
  });
};

export const updateMeController = async (
  req: Request<ParamsDictionary, unknown, UpdateMeRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { body } = req;

  const user = await usersService.updateMe(user_id, body);

  return res.json({
    message: MESSAGE.UPDATE_ME_SUCCESS,
    result: user
  });
};

export const getProfileController = async (
  req: Request<getProfileRequestParams>,
  res: Response
) => {
  const { username } = req.params;

  const user = await usersService.getProfile(username);

  if (user === null) {
    throw new ErrorWithStatus({
      message: MESSAGE.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    });
  }

  return res.json({
    message: MESSAGE.GET_PROFILE_SUCCESS,
    result: user
  });
};

export const followController = async (
  req: Request<ParamsDictionary, unknown, FollowRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { followed_user_id } = req.body;

  if (user_id === followed_user_id) {
    throw new ErrorWithStatus({
      message: MESSAGE.CAN_NOT_FOLLOW_YOURSELF,
      status: HTTP_STATUS.BAD_REQUEST
    });
  }

  const result = await usersService.follow(user_id, followed_user_id);

  return res.json(result);
};

export const unfollowController = async (
  req: Request<UnfollowRequestParams>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { followed_user_id } = req.params;

  if (user_id === followed_user_id) {
    throw new ErrorWithStatus({
      message: MESSAGE.CAN_NOT_UNFOLLOW_YOURSELF,
      status: HTTP_STATUS.BAD_REQUEST
    });
  }

  const result = await usersService.unfollow(user_id, followed_user_id);

  return res.json(result);
};
