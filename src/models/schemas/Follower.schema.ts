import { ObjectId } from 'mongodb';
import { PartialByKeys } from '~/utils/types';

class Follower {
  _id: ObjectId;
  user_id: ObjectId;
  followed_user_id: ObjectId;
  created_at: Date;

  constructor(refreshToken: PartialByKeys<Follower, 'created_at' | '_id'>) {
    this._id = refreshToken._id || new ObjectId();
    this.user_id = refreshToken.user_id;
    this.followed_user_id = refreshToken.followed_user_id;
    this.created_at = refreshToken.created_at || new Date();
  }
}

export default Follower;
