import { Request, Response } from 'express';
import User from '~/models/schemas/User.schema';
import databaseService from '~/services/database.services';
import usersService from '~/services/users.services';

export const loginController = (req: Request, res: Response) => {
  res.json({
    status: 'OK'
  });
};

export const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = await usersService.register({
      email,
      password
    });
    return res.json({
      status: 'OK',
      result
    });
  } catch (error) {
    console.log('>> Check | error:', error);
    return res.status(400).json({
      status: 'failed'
    });
  }
};
