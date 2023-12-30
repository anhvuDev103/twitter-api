import { ObjectId } from 'mongodb';
import { NextFunction, Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import usersService from '~/services/users.services';
import {
  EmailVerifyRequestBody,
  ForgotPasswordRequestBody,
  LoginRequestBody,
  LogoutRequestBody,
  RegisterRequestBody,
  ResetPasswordRequestBody,
  TokenPayload,
  VerifyForgotPasswordRequestBody
} from '~/models/requests/User.requests';
import { MESSAGE } from '~/constants/messages';
import databaseService from '~/services/database.services';
import HTTP_STATUS from '~/constants/httpStatus';
import { UserVerifyStatus } from '~/constants/enums';
import User from '~/models/schemas/User.schema';

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterRequestBody>,
  res: Response
) => {
  const result = await usersService.register(req.body);
  return res.json({
    status: 'OK',
    result
  });
};

export const loginController = async (
  req: Request<ParamsDictionary, any, LoginRequestBody>,
  res: Response
) => {
  const { user } = req;
  const result = await usersService.login(user!._id!.toString());

  return res.json({
    message: MESSAGE.LOGIN_SUCCESS,
    result
  });
};

export const logoutController = async (
  req: Request<ParamsDictionary, any, LogoutRequestBody>,
  res: Response
) => {
  const { refresh_token } = req.body;
  const result = await usersService.logout(refresh_token);

  return res.json(result);
};

export const emailVerifyController = async (
  req: Request<ParamsDictionary, any, EmailVerifyRequestBody>,
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

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordRequestBody>,
  res: Response
) => {
  const { _id } = req.user as User;
  const result = await usersService.forgotPassword(_id?.toString());

  return res.json(result);
};

export const verifyForgotPasswordTokenController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordRequestBody>,
  res: Response
) => {
  return res.json({
    message: MESSAGE.VERIFY_FORGOT_PASSWORD_SUCCESS
  });
};

export const resetPasswordTokenController = async (
  req: Request<ParamsDictionary, any, ResetPasswordRequestBody>,
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
