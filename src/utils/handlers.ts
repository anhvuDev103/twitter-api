import { NextFunction, Request, RequestHandler, Response } from 'express';

export const wrapRequestHandler = <P, ResBody, ReqBody, Q>(
  func: RequestHandler<P, ResBody, ReqBody, Q>
) => {
  return async (
    req: Request<P, ResBody, ReqBody, Q>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      await func(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
