import { Request, Response, NextFunction } from 'express';
import { ParamSchema, checkSchema } from 'express-validator';
import { ObjectId } from 'mongodb';
import { UserVerifyStatus } from '~/constants/enums';
import HTTP_STATUS from '~/constants/httpStatus';

import { MESSAGE } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
import { TokenPayload } from '~/models/interfaces';
import databaseService from '~/services/database.services';
import usersService from '~/services/users.services';
import { hashPassword } from '~/utils/crypto';
import {
  confirmPasswordSchema,
  dateOfBirthSchema,
  emailSchema,
  forgotPasswordTokenSchema,
  nameSchema,
  passwordSchema,
  validate,
  withOptional
} from '~/utils/validation';

export const registerValidator = validate(
  checkSchema(
    {
      name: nameSchema,
      email: {
        ...emailSchema,
        custom: {
          options: async (value) => {
            const isExistedEmail = await usersService.checkEmailExist(value);
            if (isExistedEmail) {
              throw new Error(MESSAGE.EMAIL_ALREADY_EXISTS);
            }
            return true;
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      date_of_birth: dateOfBirthSchema
    },
    ['body']
  )
);

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        ...emailSchema,
        custom: {
          options: async (value: string, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            });
            if (user === null) {
              throw new Error(MESSAGE.EMAIL_OR_PASSWORD_IS_INCORRECT);
            }

            req.user = user;

            return true;
          }
        }
      },
      password: passwordSchema
    },
    ['body']
  )
);

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        ...emailSchema,
        custom: {
          options: async (value: string, { req }) => {
            const user = await databaseService.users.findOne({
              email: value
            });
            if (user === null) {
              throw new Error(MESSAGE.USER_NOT_FOUND);
            }

            req.user = user;

            return true;
          }
        }
      }
    },
    ['body']
  )
);

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
);

export const verifiedUserValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { verify } = req.decoded_authorization as TokenPayload;

  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: MESSAGE.USER_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    );
  }

  next();
};

export const updateMeValidator = validate(
  checkSchema(
    {
      name: withOptional(nameSchema),
      email: {
        ...withOptional(emailSchema),
        custom: {
          options: async (value) => {
            const isExistedEmail = await usersService.checkEmailExist(value);
            if (isExistedEmail) {
              throw new Error(MESSAGE.EMAIL_ALREADY_EXISTS);
            }
            return true;
          }
        }
      },
      date_of_birth: withOptional(dateOfBirthSchema),
      bio: {
        isString: {
          errorMessage: MESSAGE.BIO_MUST_BE_STRING
        },
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: MESSAGE.BIO_LENGTH
        },
        trim: true,
        optional: true
      },
      location: {
        isString: {
          errorMessage: MESSAGE.LOCATION_MUST_BE_STRING
        },
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: MESSAGE.LOCATION_LENGTH
        },
        trim: true,
        optional: true
      },
      website: {
        isString: {
          errorMessage: MESSAGE.WEBSITE_MUST_BE_STRING
        },
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: MESSAGE.WEBSITE_LENGTH
        },
        trim: true,
        optional: true
      },
      username: {
        isString: {
          errorMessage: MESSAGE.USERNAME_MUST_BE_STRING
        },
        isLength: {
          options: {
            min: 1,
            max: 50
          },
          errorMessage: MESSAGE.USERNAME_MUST_BE_STRING
        },
        trim: true,
        optional: true
      },
      avatar: {
        isString: {
          errorMessage: MESSAGE.IMAGE_URL_MUST_BE_STRING
        },
        isLength: {
          options: {
            min: 1,
            max: 400
          },
          errorMessage: MESSAGE.IMAGE_URL_LENGTH
        },
        trim: true,
        optional: true
      },
      cover_photo: {
        isString: {
          errorMessage: MESSAGE.IMAGE_URL_MUST_BE_STRING
        },
        isLength: {
          options: {
            min: 1,
            max: 400
          },
          errorMessage: MESSAGE.IMAGE_URL_LENGTH
        },
        trim: true,
        optional: true
      }
    },
    ['body']
  )
);

export const followUserValidator = validate(
  checkSchema(
    {
      followed_user_id: {
        custom: {
          options: async (value: string) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: MESSAGE.INVALID_USER_ID,
                status: HTTP_STATUS.NOT_FOUND
              });
            }

            const followed_user = await databaseService.users.findOne({
              _id: new ObjectId(value)
            });

            if (followed_user === null) {
              throw new ErrorWithStatus({
                message: MESSAGE.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              });
            }

            return true;
          }
        }
      }
    },
    ['body']
  )
);
