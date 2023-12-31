import { NextFunction, Request, Response } from 'express';
import { pick } from 'lodash';

export const filterRequestBodyMiddleware =
  <T>(filterKeys: Array<keyof T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys);
    next();
  };
