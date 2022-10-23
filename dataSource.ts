import config from 'config';
import { DataSource } from 'typeorm';
import { createConnectionOptions } from './src/DAL/connectionBuilder';
import { IDbConfig } from './src/common/interfaces';

const connectionOptions = config.get<IDbConfig>('typeOrm');
config.get<IDbConfig>('typeOrm');
export const appDataSource = new DataSource({
  ...createConnectionOptions(connectionOptions),
  entities: ['src/DAL/**/*.ts'],
  migrationsTableName: 'migrations_table',
  migrations: ['db/migrations/*.ts'],
});
