import HTTP_STATUS from '~/constants/httpStatus';
import { MESSAGE } from '~/constants/messages';
import { AtLeast } from '~/utils/types';

type ErrorType = Record<
  string,
  {
    msg: string;
    [key: string]: any;
  }
>;

export class ErrorWithStatus {
  message: string;
  status: number;

  constructor({ message, status }: ErrorWithStatus) {
    this.message = message;
    this.status = status;
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorType;

  constructor({
    message = MESSAGE.VALIDATION_ERROR,
    errors
  }: AtLeast<Omit<EntityError, 'status'>, 'errors'>) {
    super({
      message,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY
    });

    this.errors = errors;
  }
}