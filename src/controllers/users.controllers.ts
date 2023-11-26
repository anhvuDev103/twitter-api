import { Request, Response } from 'express';

export const loginController = (req: Request, res: Response) => {
  res.json({
    status: 'OK'
  });
};
