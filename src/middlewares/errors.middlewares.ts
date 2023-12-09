import { NextFunction, Request, Response } from 'express';
import { omit } from 'lodash';

import HTTP_STATUS from '~/constants/httpStatus';
import { EntityError, ErrorWithStatus } from '~/models/Errors';

export const defaultErrorHandler = (
  err: EntityError | ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return res
    .status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json(omit(err, 'status'));
};
