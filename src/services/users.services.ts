import { ObjectId } from 'mongodb';
import axios from 'axios';
import jwt from 'jsonwebtoken';

import User from '@models/schemas/User.schema';
import {
  RegisterRequestBody,
  UpdateMeRequestBody
} from '@models/requests/User.requests';
import { hashPassword } from '@utils/crypto';
import { decodeToken, signToken, verifyToken } from '@utils/jwt';
import { TokenType, UserVerifyStatus } from '@constants/enums';
import RefreshToken from '@models/schemas/RefreshToken.schema';
import { MESSAGE } from '@constants/messages';
import Follower from '@models/schemas/Follower.schema';
import { ErrorWithStatus } from '@models/Errors';
import HTTP_STATUS from '@constants/httpStatus';
import { GoogleOauthTokenResponse } from '@models/responses/User.responses';
import databaseService from './database.services';

interface SignTokenParams {
  user_id: string;
  verify: UserVerifyStatus;
}

interface LoginParams {
  user_id: string;
  verify: UserVerifyStatus;
}

interface ForgotPasswordParams {
  user_id: string;
  verify: UserVerifyStatus;
}

interface RegisterOptions {
  signVerifyEmailToken?: boolean;
}

class UsersService {
  private signAccessAndRefreshToken({ user_id, verify }: SignTokenParams) {
    return Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify })
    ]);
  }

  private signAccessToken({ user_id, verify }: SignTokenParams) {
    return signToken({
      payload: {
        user_id,
        verify,
        token_type: TokenType.AccessToken
      },
      secretOrPrivateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    });
  }

  private signRefreshToken({ user_id, verify }: SignTokenParams) {
    return signToken({
      payload: {
        user_id,
        verify,
        token_type: TokenType.RefreshToken
      },
      secretOrPrivateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    });
  }

  private signEmailVerifyToken({ user_id, verify }: SignTokenParams) {
    return signToken({
      payload: {
        user_id,
        verify,
        token_type: TokenType.EmailVerifyToken
      },
      secretOrPrivateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN
      }
    });
  }

  private signForgotPasswordToken({ user_id, verify }: SignTokenParams) {
    return signToken({
      payload: {
        user_id,
        verify,

        token_type: TokenType.ForgotPasswordToken
      },
      secretOrPrivateKey: process.env
        .JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
      }
    });
  }

  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    };

    const { data } = await axios.post<GoogleOauthTokenResponse>(
      'https://oauth2.googleapis.com/token',
      body,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return data;
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({
      email
    });
    return Boolean(user);
  }

  async register(
    payload: Omit<RegisterRequestBody, 'confirm_password'>,
    options?: RegisterOptions
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { signVerifyEmailToken = true } = options || {};

    const user_id = new ObjectId();

    let email_verify_token = '';
    if (signVerifyEmailToken) {
      email_verify_token = await this.signEmailVerifyToken({
        user_id: user_id.toString(),
        verify: UserVerifyStatus.Unverified
      });
    }

    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth as string),
        username: `user${user_id.toString()}`
      })
    );

    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    });

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

  async login({ user_id, verify }: LoginParams) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify
    });

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

  async loginWithGoogle(code: string) {
    const { id_token } = await this.getOauthGoogleToken(code);

    const userInfo = decodeToken({
      token: id_token
    });

    if (!userInfo.email_verified) {
      throw new ErrorWithStatus({
        message: MESSAGE.GMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    const user = await databaseService.users.findOne({
      email: userInfo.email
    });

    //If email already existed in DB, let user login to the app
    if (user) {
      const result = await this.login({
        user_id: user._id.toString(),
        verify: user.verify
      });

      return result;
    }

    const registerUserPayload = {
      name: userInfo.name,
      email: userInfo.email,
      password: userInfo.at_hash,
      date_of_birth: null
    };

    const result = await this.register(registerUserPayload, {
      signVerifyEmailToken: false
    });

    return result;
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token });

    return {
      message: MESSAGE.LOGOUT_SUCCESS
    };
  }

  async verifyEmail(user_id: string) {
    const [tokens] = await Promise.all([
      this.signAccessAndRefreshToken({
        user_id,
        verify: UserVerifyStatus.Verified
      }),
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

  async resendEmailVerify(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({
      user_id,
      verify: UserVerifyStatus.Unverified
    });
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

  async changePassword(user_id: string, newPassword: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hashPassword(newPassword)
        },
        $currentDate: {
          updated_at: true
        }
      }
    );

    return {
      message: MESSAGE.CHANGE_PASSWORD_SUCCESS
    };
  }

  async forgotPassword({ user_id, verify }: ForgotPasswordParams) {
    const forgot_password_token = await this.signForgotPasswordToken({
      user_id,
      verify
    });

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

  async resetPassword(user_id: string, password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          forgot_password_token: '',
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    );

    return {
      message: MESSAGE.RESET_PASSWORD_SUCCESS
    };
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        projection: {
          password: false,
          email_verify_token: false,
          forgot_password_token: false
        }
      }
    );

    return user;
  }

  async updateMe(user_id: string, payload: UpdateMeRequestBody) {
    const { date_of_birth, ..._payload } = payload;

    const updatedUser = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          ..._payload,
          ...(date_of_birth && {
            date_of_birth: new Date(date_of_birth)
          })
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: false,
          email_verify_token: false,
          forgot_password_token: false
        }
      }
    );

    return updatedUser;
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      {
        username
      },
      {
        projection: {
          password: false,
          email_verify_token: false,
          forgot_password_token: false,
          verify: false,
          created_at: false,
          updated_at: false
        }
      }
    );

    return user;
  }

  async follow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });

    if (follower === null) {
      await databaseService.followers.insertOne(
        new Follower({
          user_id: new ObjectId(user_id),
          followed_user_id: new ObjectId(followed_user_id)
        })
      );

      return {
        message: MESSAGE.FOLLOW_SUCCESS
      };
    }

    throw new ErrorWithStatus({
      message: MESSAGE.ALREADY_FOLLOWED,
      status: HTTP_STATUS.BAD_REQUEST
    });
  }

  async unfollow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });

    if (follower === null) {
      throw new ErrorWithStatus({
        message: MESSAGE.ALREADY_UNFOLLOWED,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });

    return {
      message: MESSAGE.UNFOLLOW_SUCCESS
    };
  }
}

const usersService = new UsersService();

export default usersService;
