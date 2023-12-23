import jwt, {
  Jwt,
  JwtPayload,
  Secret,
  SignOptions,
  VerifyOptions
} from 'jsonwebtoken';
import { TokenPayload } from '~/models/requests/User.requests';

interface SignTokenParams {
  payload: string | Buffer | object;
  secretOrPrivateKey?: Secret;
  options?: SignOptions;
}

interface VerifyTokenParams {
  token: string;
  secretOrPrivateKey?: Secret;
}

export function signToken({
  payload,
  secretOrPrivateKey = process.env.JWT_SECRET as string,
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

export function verifyToken({
  token,
  secretOrPrivateKey = process.env.JWT_SECRET as string
}: VerifyTokenParams) {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, secretOrPrivateKey, (error, decoded) => {
      if (error) {
        reject(error);
      }

      resolve(decoded as TokenPayload);
    });
  });
}
