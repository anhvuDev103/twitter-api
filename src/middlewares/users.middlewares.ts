import { ParamSchema, checkSchema } from 'express-validator';

import { MESSAGE } from '~/constants/messages';
import databaseService from '~/services/database.services';
import usersService from '~/services/users.services';
import { hashPassword } from '~/utils/crypto';
import { forgotPasswordTokenSchema, validate } from '~/utils/validation';

const passwordSchema: ParamSchema = {
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

const confirmPasswordsSchema: ParamSchema = {
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

export const registerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: MESSAGE.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: MESSAGE.NAME_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            min: 1,
            max: 100
          },
          errorMessage: MESSAGE.NAME_LENGTH_MUST_BE_FROM_1_TO_100
        },
        trim: true
      },
      email: {
        notEmpty: {
          errorMessage: MESSAGE.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: MESSAGE.EMAIL_IS_INVALID
        },
        trim: true,
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
      confirm_password: confirmPasswordsSchema,
      date_of_birth: {
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true
          },
          errorMessage: MESSAGE.DATE_OF_BIRTH_MUST_BE_ISO8601
        }
      }
    },
    ['body']
  )
);

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: MESSAGE.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: MESSAGE.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
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
        notEmpty: {
          errorMessage: MESSAGE.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: MESSAGE.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
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
      confirm_password: confirmPasswordsSchema,
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
);
