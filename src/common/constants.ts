import { readPackageJsonSync } from '@map-colonies/read-pkg';

export const SERVICE_NAME = readPackageJsonSync().name ?? 'unknown_service';
export const DEFAULT_SERVER_PORT = 80;

export const IGNORED_OUTGOING_TRACE_ROUTES = [/^.*\/v1\/metrics.*$/];
export const IGNORED_INCOMING_TRACE_ROUTES = [/^.*\/docs.*$/];

/* eslint-disable @typescript-eslint/naming-convention */
export const SERVICES: Record<string, symbol> = {
  LOGGER: Symbol('Logger'),
  CONFIG: Symbol('Config'),
  TRACER: Symbol('Tracer'),
  METER: Symbol('Meter'),
};

export enum SearchOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
export enum ResponseCodes {
  JOB_UPDATED = 'JOB_UPDATED_SUCCESSFULLY',
  JOB_DELETED = 'JOB_DELETED_SUCCESSFULLY',
  JOB_RESET = 'JOB_RESET_SUCCESSFULLY',
  JOB_ABORTED = 'JOB_ABORTED_SUCCESSFULLY',
  TASK_UPDATED = 'TASK_UPDATED_SUCCESSFULLY',
  TASK_DELETED = 'TASK_DELETED_SUCCESSFULLY',
  UPDATE_EXPIRED_STATUS = 'UPDATE_EXPIRED_STATUS_SUCCESSFULLY',
}

/* eslint-enable @typescript-eslint/naming-convention */
