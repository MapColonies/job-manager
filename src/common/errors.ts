import { HttpError } from '@map-colonies/error-express-handler';
import { StatusCodes } from 'http-status-codes';

export class EntityAlreadyExists extends Error implements HttpError {
  public status = StatusCodes.CONFLICT;
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, EntityAlreadyExists.prototype);
  }
}

export class EntityNotFound extends Error implements HttpError {
  public status = StatusCodes.NOT_FOUND;
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, EntityNotFound.prototype);
  }
}

export class EntityCreationError extends Error implements HttpError {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, EntityCreationError.prototype);
  }
}

export class EntityGetError extends Error implements HttpError {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, EntityGetError.prototype);
  }
}

export class EntityUpdateError extends Error implements HttpError {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, EntityUpdateError.prototype);
  }
}

export class DBConnectionError extends Error implements HttpError {
  public status = StatusCodes.INTERNAL_SERVER_ERROR;
  public constructor() {
    super('Internal Server Error');
    Object.setPrototypeOf(this, EntityAlreadyExists.prototype);
  }
}

export class DBConstraintError extends Error implements HttpError {
  public status = StatusCodes.UNPROCESSABLE_ENTITY;
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, EntityAlreadyExists.prototype);
  }
}

export class BadRequestError extends Error implements HttpError {
  public status = StatusCodes.BAD_REQUEST;
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, EntityAlreadyExists.prototype);
  }
}
