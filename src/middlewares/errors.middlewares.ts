import { NextFunction, Request, Response } from 'express';
import { omit } from 'lodash';

import HTTP_STATUS from '@constants/httpStatus';
import { EntityError, ErrorWithStatus } from '@models/Errors';

export const defaultErrorHandler = (
  err: EntityError | ErrorWithStatus | Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ErrorWithStatus) {
    return res
      .status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(omit(err, 'status'));
  }

  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true });
  });

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfo: omit(err, ['stack'])
  });
};
