import { readFileSync } from 'fs';
import { DataSourceOptions, DataSource } from 'typeorm';
import { IDbConfig } from '../common/interfaces';

export const createConnectionOptions = (dbConfig: IDbConfig): DataSourceOptions => {
  const { enableSslAuth, sslPaths, ...connectionOptions } = dbConfig;
  if (enableSslAuth) {
    connectionOptions.password = undefined;
    connectionOptions.ssl = { key: readFileSync(sslPaths.key), cert: readFileSync(sslPaths.cert), ca: readFileSync(sslPaths.ca) };
  }
  return connectionOptions;
};

export const initDataSource = async (dbConfig: IDbConfig): Promise<DataSource> => {
  const connection = new DataSource(createConnectionOptions(dbConfig));
  await connection.initialize();
  return connection;
};
