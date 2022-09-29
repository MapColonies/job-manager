import config from 'config';
import { logMethod } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { Metrics } from '@map-colonies/telemetry';
import { DataSource } from 'typeorm';
import { SERVICES, SERVICE_NAME } from './common/constants';
import { tracing } from './common/tracing';
import { InjectionObject, registerDependencies } from './common/dependencyRegistration';
import { jobRouterFactory, JOB_ROUTER_SYMBOL } from './jobs/routes/jobRouter';
import { taskManagerRouterFactory, TASK_MANAGER_ROUTER_SYMBOL } from './taskManagement/routes/taskManagerRouter';
import { initDataSource } from './DAL/connectionBuilder';
import { IDbConfig } from './common/interfaces';
import { jobRepositoryFactory, JOB_CUSTOM_REPOSITORY_SYMBOL } from './DAL/repositories/jobRepository';
import { taskRepositoryFactory, TASK_CUSTOM_REPOSITORY_SYMBOL } from './DAL/repositories/taskRepository';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  // @ts-expect-error the signature is wrong
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, hooks: { logMethod } });

  const metrics = new Metrics(SERVICE_NAME);
  const meter = metrics.start();

  tracing.start();
  const tracer = trace.getTracer(SERVICE_NAME);

  const db = await initDataSource(config.get<IDbConfig>('typeOrm'));

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: config } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METER, provider: { useValue: meter } },
    { token: JOB_ROUTER_SYMBOL, provider: { useFactory: jobRouterFactory } },
    { token: TASK_MANAGER_ROUTER_SYMBOL, provider: { useFactory: taskManagerRouterFactory } },
    {
      token: 'onSignal',
      provider: {
        useValue: {
          useValue: async (): Promise<void> => {
            await Promise.all([tracing.stop(), metrics.stop()]);
          },
        },
      },
    },
    { token: DataSource, provider: { useValue: db } },
    { token: JOB_CUSTOM_REPOSITORY_SYMBOL, provider: { useFactory: jobRepositoryFactory } },
    { token: TASK_CUSTOM_REPOSITORY_SYMBOL, provider: { useFactory: taskRepositoryFactory } },
  ];

  return registerDependencies(dependencies, options?.override, options?.useChild);
};
