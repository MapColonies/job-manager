import { FindManyOptions, LessThan, Brackets, Between, LessThanOrEqual, MoreThanOrEqual, DataSource } from 'typeorm';
import { FactoryFunction } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { ConflictError, NotFoundError } from '@map-colonies/error-types';
import { DBConstraintError } from '../../common/errors';
import { JobEntity } from '../entity/job';
import {
  FindJobsResponse,
  ICreateJobBody,
  ICreateJobResponse,
  IGetJobResponse,
  IFindJobsRequest,
  IUpdateJobRequest,
} from '../../common/dataModels/jobs';
import { JobModelConvertor } from '../convertors/jobModelConverter';
import { OperationStatus } from '../../common/dataModels/enums';
import { IConfig, IDbConfig } from '../../common/interfaces';
import { SERVICES } from '../../common/constants';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const getJobRepository = (db: DataSource, config: IConfig, logger: Logger, jobConvertor: JobModelConvertor) => {
  const schemaConf = config.get<IDbConfig>('typeOrm').schema;
  const schema = schemaConf == undefined || schemaConf == '' ? '' : `"${schemaConf}".`;
  return db.getRepository(JobEntity).extend({
    async findJobs(req: IFindJobsRequest): Promise<FindJobsResponse> {
      const filter: Record<string, unknown> = {
        resourceId: req.resourceId,
        version: req.version,
        isCleaned: req.isCleaned,
        status: req.status,
        type: req.type,
        productType: req.productType,
        internalId: req.internalId,
      };

      if (req.fromDate != undefined && req.tillDate != undefined) {
        filter.updateTime = Between(req.fromDate, req.tillDate);
      } else if (req.tillDate != undefined) {
        filter.updateTime = LessThanOrEqual(req.tillDate);
      } else if (req.fromDate != undefined) {
        filter.updateTime = MoreThanOrEqual(req.fromDate);
      }

      for (const key of Object.keys(filter)) {
        if (filter[key] == undefined) {
          delete filter[key];
        }
      }

      const options: FindManyOptions<JobEntity> = { where: filter };
      if (req.shouldReturnTasks !== false) {
        options.relations = ['tasks'];
      }

      const entities = await this.find(options);
      const models = entities.map((entity) => jobConvertor.entityToModel(entity));
      return models;
    },

    async createJob(req: ICreateJobBody): Promise<ICreateJobResponse> {
      logger.info({ resourceId: req.resourceId, version: req.version, type: req.type, msg: 'Start job creation ' });
      try {
        let entity = jobConvertor.createModelToEntity(req);
        entity = await this.save(entity);
        logger.info({ resourceId: entity.resourceId, version: entity.version, type: entity.type, msg: 'Job was created successfully' });
        return {
          id: entity.id,
          taskIds: entity.tasks ? entity.tasks.map((task) => task.id) : [],
        };
      } catch (err) {
        const pgExclusionViolationErrorCode = '23P01';
        const error = err as Error & { code: string };
        if (error.code === pgExclusionViolationErrorCode) {
          if (error.message.includes('UQ_uniqueness_on_active_tasks')) {
            const message = 'failed to create job because another active job exists for provided resource, version and identifiers.';
            logger.error({
              resourceId: req.resourceId,
              version: req.version,
              type: req.type,
              identifiers: req.additionalIdentifiers as string,
              msg: message,
            });
            throw new ConflictError(message);
          }
          if (error.message.includes('UQ_uniqness_on_job_and_type')) {
            const message = 'failed to create job, for provided resource:, version and identifiers, because it contains duplicate tasks.';
            logger.error({
              resourceId: req.resourceId,
              version: req.version,
              type: req.type,
              identifiers: req.additionalIdentifiers as string,
              msg: message,
            });
            throw new DBConstraintError('request contains duplicate tasks.');
          }
        }
        throw err;
      }
    },

    async getJob(id: string, shouldReturnTasks = true): Promise<IGetJobResponse | undefined> {
      let entity;
      if (!shouldReturnTasks) {
        entity = await this.findOneBy({ id });
      } else {
        entity = await this.findOne({ where: { id }, relations: ['tasks'] });
      }
      const model = entity ? jobConvertor.entityToModel(entity) : undefined;
      return model;
    },

    async updateJob(req: IUpdateJobRequest): Promise<void> {
      logger.info({ jobId: req.jobId, msg: 'start job update' });
      if (!(await this.exists(req.jobId))) {
        const message = 'job was not found for provided update request';
        logger.error({ jobId: req.jobId, msg: message });
        throw new NotFoundError(message);
      }
      const entity = jobConvertor.updateModelToEntity(req);
      await this.save(entity);
      logger.info({ jobId: req.jobId, msg: 'Job was updated successfully' });
    },

    async exists(id: string): Promise<boolean> {
      const jobCount = await this.countBy({ id: id });
      return jobCount === 1;
    },

    async deleteJob(id: string): Promise<void> {
      if (!(await this.exists(id))) {
        const message = 'job id was not found for delete request';
        logger.error({ id: id, msg: message });
        throw new NotFoundError(message);
      }
      try {
        await this.delete(id);
        logger.info({ id: id, msg: 'Finish job deletion successfully' });
      } catch (err) {
        const pgForeignKeyConstraintViolationErrorCode = '23503';
        const error = err as Error & { code: string };
        if (error.code === pgForeignKeyConstraintViolationErrorCode) {
          logger.error({ jobId: id, errorMessage: error.message, errorCode: error.code, msg: 'failed job deletion because it have tasks' });
          throw new DBConstraintError(`job ${id} have tasks`);
        } else {
          logger.error({ jobId: id, errorMessage: error.message, errorCode: error.code, msg: 'failed job deletion' });
          throw err;
        }
      }
    },

    async updateExpiredJobs(): Promise<void> {
      const now = new Date();
      const query = this.createQueryBuilder('jb')
        .update()
        .set({ status: OperationStatus.EXPIRED })
        .where({ expirationDate: LessThan(now) })
        .andWhere(
          new Brackets((qb) => {
            qb.where([{ status: OperationStatus.IN_PROGRESS }, { status: OperationStatus.PENDING }]);
          })
        );
      await query.execute();
    },

    async isJobResettable(jobId: string): Promise<boolean> {
      const query = `SELECT count(*) FILTER (WHERE tk."resettable" = FALSE) as "unResettableTasks", count(*) AS "failedTasks"
      FROM ${schema}"Job" AS jb
      INNER JOIN "Task" as tk ON tk."jobId" = jb.id
      WHERE jb.id = $1 AND 
        (jb.status = '${OperationStatus.EXPIRED}' OR jb.status = '${OperationStatus.FAILED}' OR jb.status = '${OperationStatus.ABORTED}') AND
        (tk.status = '${OperationStatus.EXPIRED}' OR tk.status = '${OperationStatus.FAILED}' OR tk.status = '${OperationStatus.ABORTED}') AND
        jb."isCleaned" = FALSE`;
      const sqlRes = (await this.query(query, [jobId])) as { unResettableTasks: string; failedTasks: string }[];
      if (sqlRes.length === 0) {
        //no matching job found. it might not exist, not have task, be cleaned or not be in failed status
        return false;
      }
      const res = sqlRes[0];
      return parseInt(res.unResettableTasks) === 0 && parseInt(res.failedTasks) > 0;
    },
  });
};

export type JobRepository = ReturnType<typeof getJobRepository>;

export const JOB_CUSTOM_REPOSITORY_SYMBOL = Symbol('JOB_CUSTOM_REPOSITORY_SYMBOL');

export const jobRepositoryFactory: FactoryFunction<JobRepository> = (depContainer) => {
  return getJobRepository(
    depContainer.resolve<DataSource>(DataSource),
    depContainer.resolve<IConfig>(SERVICES.CONFIG),
    depContainer.resolve<Logger>(SERVICES.LOGGER),
    depContainer.resolve(JobModelConvertor)
  );
};
