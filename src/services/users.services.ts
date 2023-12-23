import User from '~/models/schemas/User.schema';
import { RegisterRequestBody } from '~/models/requests/User.requests';
import databaseService from './database.services';
import { hashPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import { TokenType } from '~/constants/enums';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import { ObjectId } from 'mongodb';
import { MESSAGE } from '~/constants/messages';

class UsersService {
  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ]);
  }

  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    });
  }

  private signRefreshToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    });
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({
      email
    });
    return Boolean(user);
  }

  async register(_payload: RegisterRequestBody) {
    const { confirm_password, ...payload } = _payload;

    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth)
      })
    );

    const user_id = result.insertedId.toString();
    const [access_token, refresh_token] =
      await this.signAccessAndRefreshToken(user_id);

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    );

    return {
      access_token,
      refresh_token
    };
  }

  async login(user_id: string) {
    const [access_token, refresh_token] =
      await this.signAccessAndRefreshToken(user_id);

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    );

    return {
      access_token,
      refresh_token
    };
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token });

    return {
      message: MESSAGE.LOGOUT_SUCCESS
    };
  }
}

const usersService = new UsersService();

export default usersService;
