import { NextFunction, Request, RequestHandler, Response } from 'express';

export const wrapRequestHandler = (func: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  return res.status(400).json({
    message: err.message
  });
};
