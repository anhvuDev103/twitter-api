import { ObjectId } from 'mongodb';
import { PartialByKeys } from '@utils/types';

class RefreshToken {
  _id: ObjectId;
  token: string;
  created_at: Date;
  user_id: ObjectId;

  constructor(refreshToken: PartialByKeys<RefreshToken, 'created_at' | '_id'>) {
    this._id = refreshToken._id || new ObjectId();
    this.token = refreshToken.token;
    this.created_at = refreshToken.created_at || new Date();
    this.user_id = refreshToken.user_id;
  }
}

export default RefreshToken;
