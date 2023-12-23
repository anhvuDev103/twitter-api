import { Request } from 'express';
import { checkSchema } from 'express-validator';
import { JsonWebTokenError } from 'jsonwebtoken';
import { capitalize } from 'lodash';

import HTTP_STATUS from '~/constants/httpStatus';
import { MESSAGE } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
import databaseService from '~/services/database.services';
import { verifyToken } from '~/utils/jwt';
import { validate } from '~/utils/validation';

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        notEmpty: {
          errorMessage: MESSAGE.ACCESS_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            const [, access_token] = value.split(' ');
            if (!access_token) {
              throw new ErrorWithStatus({
                message: MESSAGE.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }

            try {
              const decoded_authorization = await verifyToken({
                token: access_token
              });

              (req as Request).decoded_authorization = decoded_authorization;
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }

            return true;
          }
        }
      }
    },
    ['headers']
  )
);

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        notEmpty: {
          errorMessage: MESSAGE.REFRESH_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value }),
                databaseService.refreshTokens.findOne({ token: value })
              ]);

              if (refresh_token === null) {
                throw new ErrorWithStatus({
                  message: MESSAGE.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                });
              }

              (req as Request).decoded_refresh_token = decoded_refresh_token;
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED
                });
              }

              throw error;
            }
            return true;
          }
        }
      }
    },
    ['body']
  )
);
