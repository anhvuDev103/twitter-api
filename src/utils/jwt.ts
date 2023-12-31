import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { TokenPayload } from '~/models/interfaces';

interface SignTokenParams {
  payload: string | Buffer | object;
  secretOrPrivateKey: Secret;
  options?: SignOptions;
}

interface VerifyTokenParams {
  token: string;
  secretOrPrivateKey: Secret;
}

export function signToken({
  payload,
  secretOrPrivateKey,
  options = {
    algorithm: 'HS256'
  }
}: SignTokenParams) {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, secretOrPrivateKey, options, (error, token) => {
      if (error) {
        reject(error);
      }

      resolve(token as string);
    });
  });
}

export function verifyToken({ token, secretOrPrivateKey }: VerifyTokenParams) {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, secretOrPrivateKey, (error, decoded) => {
      if (error) {
        reject(error);
      }

      resolve(decoded as TokenPayload);
    });
  });
}
