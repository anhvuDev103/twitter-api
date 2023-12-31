import { ParamsDictionary } from 'express-serve-static-core';

export interface getProfileRequestParams extends ParamsDictionary {
  username: string;
}
