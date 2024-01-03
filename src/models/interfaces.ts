import { JwtPayload } from 'jsonwebtoken';

import { MediaType, TokenType, UserVerifyStatus } from '@constants/enums';

export interface TokenPayload extends JwtPayload {
  user_id: string;
  token_type: TokenType;
  verify: UserVerifyStatus;
}

export interface IdTokenPayload extends JwtPayload {
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  locale: string;
}

export interface Media {
  url: string;
  type: MediaType;
}
