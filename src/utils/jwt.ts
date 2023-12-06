import jwt, { Secret, SignOptions } from 'jsonwebtoken';

interface SignTokenParams {
  payload: string | Buffer | object;
  privateKey?: Secret;
  options?: SignOptions;
}

export function signToken({
  payload,
  privateKey = process.env.JWT_SECRET as string,
  options = {
    algorithm: 'HS256'
  }
}: SignTokenParams) {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (error, token) => {
      if (error) {
        reject(error);
      }

      resolve(token as string);
    });
  });
}
