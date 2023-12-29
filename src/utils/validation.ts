import { NextFunction, Request, Response } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

import {
  ParamSchema,
  RunnableValidationChains
} from 'express-validator/src/middlewares/schema';
import HTTP_STATUS from '~/constants/httpStatus';
import { MESSAGE } from '~/constants/messages';
import { EntityError, ErrorWithStatus } from '~/models/Errors';
import { verifyToken } from './jwt';
import databaseService from '~/services/database.services';
import { ObjectId } from 'mongodb';
import { JsonWebTokenError } from 'jsonwebtoken';
import { capitalize } from 'lodash';

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (
  validation: RunnableValidationChains<ValidationChain>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req);
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    const errorsObject = errors.mapped();
    const entityError = new EntityError({ errors: {} });
    for (const key in errorsObject) {
      const { msg } = errorsObject[key];
      if (
        msg instanceof ErrorWithStatus &&
        msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY
      ) {
        return next(msg);
      }

      entityError.errors[key] = errorsObject[key];
    }

    next(entityError);
  };
};

export const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: MESSAGE.PASSWORD_IS_REQUIRED
  },
  isString: true,
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: MESSAGE.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: MESSAGE.PASSWORD_MUST_BE_STRONG
  }
};

export const confirmPasswordsSchema: ParamSchema = {
  ...passwordSchema,
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(MESSAGE.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD);
      }

      return true;
    }
  }
};

export const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          message: MESSAGE.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        });
      }
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOrPrivateKey: process.env
            .JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
        });

        const { user_id } = decoded_forgot_password_token;

        const user = await databaseService.users.findOne({
          _id: new ObjectId(user_id)
        });

        if (user === null) {
          throw new ErrorWithStatus({
            message: MESSAGE.USER_NOT_FOUND,
            status: HTTP_STATUS.NOT_FOUND
          });
        }

        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: MESSAGE.INVALID_FORGOT_PASSWORD_TOKEN,
            status: HTTP_STATUS.UNAUTHORIZED
          });
        }

        (req as Request).decoded_forgot_password_token =
          decoded_forgot_password_token;
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: capitalize(error.message),
            status: HTTP_STATUS.UNAUTHORIZED
          });
        }
      }

      return true;
    }
  }
};
