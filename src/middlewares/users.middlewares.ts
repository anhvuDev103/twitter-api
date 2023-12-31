import { Request, Response, NextFunction } from 'express';
import { checkSchema } from 'express-validator';
import { ObjectId } from 'mongodb';
import { UserVerifyStatus } from '@constants/enums';
import HTTP_STATUS from '@constants/httpStatus';

import { MESSAGE } from '@constants/messages';
import { REGEX_USERNAME } from '@constants/regexs';
import { ErrorWithStatus } from '@models/Errors';
import { TokenPayload } from '@models/interfaces';
import databaseService from '@services/database.services';
import usersService from '@services/users.services';
import { hashPassword } from '@utils/crypto';
import {
  confirmPasswordSchema,
  dateOfBirthSchema,
  emailSchema,
  forgotPasswordTokenSchema,
  nameSchema,
  passwordSchema,
  userIdSchema,
  validate,
  withOptional
} from '@utils/validation';

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
              throw new ErrorWithStatus({
                message: MESSAGE.EMAIL_ALREADY_EXISTS,
                status: HTTP_STATUS.CONFLICT
              });
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

            (req as Request).user = user;

            return true;
          }
        }
      },
      password: passwordSchema
    },
    ['body']
  )
);

export const changePasswordValidator = validate(
  checkSchema(
    {
      current_password: {
        ...passwordSchema,
        custom: {
          options: async (value: string, { req }) => {
            const { user_id } = (req as Request)
              .decoded_authorization as TokenPayload;

            const user = await databaseService.users.findOne({
              _id: new ObjectId(user_id)
            });

            if (user === null) {
              throw new ErrorWithStatus({
                message: MESSAGE.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              });
            }

            const isMatchPassword = hashPassword(value) === user.password;

            if (!isMatchPassword) {
              throw new ErrorWithStatus({
                message: MESSAGE.OLD_PASSWORD_NOT_MATCH,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }

            return true;
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
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

            (req as Request).user = user;

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
              throw new ErrorWithStatus({
                message: MESSAGE.EMAIL_ALREADY_EXISTS,
                status: HTTP_STATUS.CONFLICT
              });
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
        custom: {
          options: async (value) => {
            if (!REGEX_USERNAME.test(value)) {
              throw new Error(MESSAGE.USERNAME_INVALID);
            }

            const user = await databaseService.users.findOne({
              username: value
            });

            if (user !== null) {
              throw new ErrorWithStatus({
                message: MESSAGE.USERNAME_EXISTED,
                status: HTTP_STATUS.CONFLICT
              });
            }

            return true;
          }
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
      followed_user_id: userIdSchema
    },
    ['body']
  )
);

export const unfollowUserValidator = validate(
  checkSchema(
    {
      followed_user_id: userIdSchema
    },
    ['params']
  )
);
