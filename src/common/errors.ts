import { UnprocessableEntityError, InternalServerError } from '@map-colonies/error-types';

export class DBConnectionError extends InternalServerError {
  public constructor() {
    super('Internal Server Error');
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

export class DBConstraintError extends UnprocessableEntityError {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
  }
}
