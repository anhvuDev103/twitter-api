import { NextFunction, Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import usersService from '~/services/users.services';
import {
  LogoutRequestBody,
  RegisterRequestBody
} from '~/models/requests/User.requests';
import { MESSAGE } from '~/constants/messages';

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await usersService.register(req.body);
  return res.json({
    status: 'OK',
    result
  });
};

export const loginController = async (req: Request, res: Response) => {
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
