import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import usersService from '~/services/users.services';
import { RegisterRequestBody } from '~/models/requests/User.requests';

export const loginController = (req: Request, res: Response) => {
  res.json({
    status: 'OK'
  });
};

export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res: Response) => {
  try {
    const result = await usersService.register(req.body);
    return res.json({
      status: 'OK',
      result
    });
  } catch (error) {
    return res.status(400).json({
      status: 'failed'
    });
  }
};
