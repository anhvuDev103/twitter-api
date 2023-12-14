import { checkSchema } from 'express-validator';
import HTTP_STATUS from '~/constants/httpStatus';
import { MESSAGE } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
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

            const decoded_authorization = await verifyToken({
              token: access_token
            });
            req.decoded_authorization = decoded_authorization;

            return true;
          }
        }
      }
    },
    ['headers']
  )
);
