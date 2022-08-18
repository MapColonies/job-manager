import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { ResponseCodes } from './constants';

export interface IConfig {
  get: <T>(setting: string) => T;
  has: (setting: string) => boolean;
}
export interface IDbConfig extends PostgresConnectionOptions {
  enableSslAuth: boolean;
  sslPaths: { ca: string; cert: string; key: string };
}

export interface OpenApiConfig {
  filePath: string;
  basePath: string;
  jsonPath: string;
  uiPath: string;
}

export interface IHttpResponse<T> {
  body: T;
  status: number;
}

export interface DefaultResponse {
  code: ResponseCodes;
}
