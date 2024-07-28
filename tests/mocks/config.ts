import config from 'config';
import { get, has } from 'lodash';
import { IConfig } from '../../src/common/interfaces';

const getMock = jest.fn();
const hasMock = jest.fn();

const configMock = {
  get: getMock,
  has: hasMock,
} as unknown as IConfig;

const setConfigValues = (values: Record<string, unknown>): void => {
  getMock.mockImplementation((key: string) => {
    const value = get(values, key) ?? config.get(key);
    return value;
  });
  hasMock.mockImplementation((key: string) => has(values, key) || config.has(key));
};

const registerDefaultConfig = (): void => {
  const config = {
    openapiConfig: {
      filePath: './openapi3.yaml',
      basePath: '/docs',
      jsonPath: '/api.json',
      uiPath: '/api',
    },
    logger: {
      level: 'info',
    },
    server: {
      port: '8080',
    },

    externalReadinessUrl: '',
    httpRetry: {
      attempts: 5,
      delay: 'exponential',
      shouldResetTimeout: true,
    },
    typeOrm: {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      enableSslAuth: false,
      sslPaths: {
        ca: '',
        key: '',
        cert: '',
      },
      database: 'raster',
      schema: 'JobManager',
      synchronize: false,
      logging: false,
      entities: ['**/DAL/entity/**/*.js'],
      migrations: [],
      subscribers: ['**/DAL/subscriber/**/*.js'],
      cli: {
        entitiesDir: 'src/DAL/entity',
        migrationsDir: 'src/DAL/migration',
        subscribersDir: 'src/DAL/subscriber',
      },
    },
    heartbeat: {
      enabled: true,
      failedDurationMS: 1000,
      serviceUrl: 'http://heartbeaturl',
    },
  };
  setConfigValues(config);
};

export { getMock, hasMock, configMock, setConfigValues, registerDefaultConfig };
