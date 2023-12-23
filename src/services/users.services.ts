import User from '~/models/schemas/User.schema';
import { RegisterRequestBody } from '~/models/requests/User.requests';
import databaseService from './database.services';
import { hashPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import { TokenType, UserVerifyStatus } from '~/constants/enums';
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
      secretOrPrivateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
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
      secretOrPrivateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    });
  }

  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken
      },
      secretOrPrivateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN
      }
    });
  }

  private signForgotPasswordToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken
      },
      secretOrPrivateKey: process.env
        .JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
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

    const user_id = new ObjectId();
    const email_verify_token = await this.signEmailVerifyToken(
      user_id.toString()
    );

    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth)
      })
    );

    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(
      user_id.toString()
    );

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    );

    console.log('>> Check | email_verify_token:', email_verify_token);

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

  async verifyEmail(user_id: string) {
    const [tokens] = await Promise.all([
      this.signAccessAndRefreshToken(user_id),
      databaseService.users.updateOne(
        {
          _id: new ObjectId(user_id)
        },
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
    ]);

    const [access_token, refresh_token] = tokens;

    return {
      access_token,
      refresh_token
    };
  }

  async resendEmailVerify(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken(user_id);
    //Action gửi email
    console.log('Resend Email');

    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          email_verify_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    );

    return {
      message: MESSAGE.RESEND_VERIFY_EMAIL_SUCCESS
    };
  }

  async forgotPassword(user_id: string) {
    const forgot_password_token = await this.signForgotPasswordToken(user_id);

    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    );

    //Send email with link reset password
    console.log('>> Check | forgot_password_token:', forgot_password_token);

    return {
      message: MESSAGE.CHECK_EMAIL_TO_RESET_PASSWORD
    };
  }
}

const usersService = new UsersService();

export default usersService;
