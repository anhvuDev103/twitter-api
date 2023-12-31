import { ParamsDictionary } from 'express-serve-static-core';

export interface getProfileRequestParams extends ParamsDictionary {
  username: string;
}

export interface UnfollowRequestParams extends ParamsDictionary {
  followed_user_id: string;
}
