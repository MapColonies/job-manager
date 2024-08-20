import { EntityRepository, FindManyOptions, LessThan, Brackets, Between, LessThanOrEqual, MoreThanOrEqual, Raw } from 'typeorm';
import { container } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { ConflictError, NotFoundError } from '@map-colonies/error-types';
import { DBConstraintError } from '../../common/errors';
import { SERVICES } from '../../common/constants';
import { JobEntity } from '../entity/job';
import { paramsQueryBuilder } from '../../common/utils';
import {
  FindJobsResponse,
  ICreateJobBody,
  ICreateJobResponse,
  IGetJobResponse,
  IFindJobsRequest,
  IUpdateJobRequest,
  IJobsQuery,
  IFindJobsByCriteriaBody,
} from '../../common/dataModels/jobs';
import { JobModelConvertor } from '../convertors/jobModelConverter';
import { OperationStatus } from '../../common/dataModels/enums';
import { GeneralRepository } from './generalRepository';

export type JobParameters = Record<string, unknown>;

@EntityRepository(JobEntity)
export class JobRepository extends GeneralRepository<JobEntity> {
  private readonly appLogger: Logger; //don't override internal repository logger.
  private readonly jobConvertor: JobModelConvertor;

  public constructor() {
    super();
    //direct injection don't work here due to being initialized by typeOrm
    this.appLogger = container.resolve(SERVICES.LOGGER);
    this.jobConvertor = container.resolve(JobModelConvertor);
  }

  public async findJobs(req: IFindJobsRequest): Promise<FindJobsResponse> {
    const filter: Record<string, unknown> = {
      resourceId: req.resourceId,
      version: req.version,
      isCleaned: req.isCleaned,
      status: req.status,
      type: req.type,
      productType: req.productType,
      internalId: req.internalId,
      domain: req.domain,
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
    const models = entities.map((entity) => this.jobConvertor.entityToModel(entity));
    return models;
  }

  public async findJobsByCriteria(req: IFindJobsByCriteriaBody): Promise<FindJobsResponse> {
    const filter: Record<string, unknown> = {
      resourceId: req.resourceId,
      version: req.version,
      isCleaned: req.isCleaned,
      productType: req.productType,
      internalId: req.internalId,
      domain: req.domain,
    };

    if (req.fromDate !== undefined && req.tillDate !== undefined) {
      filter.updateTime = Between(req.fromDate, req.tillDate);
    } else if (req.tillDate !== undefined) {
      filter.updateTime = LessThanOrEqual(req.tillDate);
    } else if (req.fromDate !== undefined) {
      filter.updateTime = MoreThanOrEqual(req.fromDate);
    }

    for (const key of Object.keys(filter)) {
      if (filter[key] === undefined) {
        delete filter[key];
      }
    }
    if (req.shouldReturnTasks !== false) {
      filter.relations = ['tasks'];
    }
    const queryBuilder = this.createQueryBuilder('job').select().where(filter);
    if ((req.types?.length ?? 0) > 0) {
      queryBuilder.andWhere('job.type IN (:...types)', { types: req.types });
    }
    if ((req.statuses?.length ?? 0) > 0) {
      queryBuilder.andWhere('job.status IN (:...statuses)', { statuses: req.statuses });
    }

    if (req.taskType !== undefined) {
      queryBuilder.innerJoin('job.tasks', 'task');
      queryBuilder
        .addSelect(`CAST(COUNT(CASE WHEN task.type = '${req.taskType}' THEN 1 ELSE NULL END) as integer)`, 'job_taskCount')
        .addSelect(`CAST(SUM(CASE WHEN task.status = '${OperationStatus.COMPLETED}' THEN 1 ELSE 0 END) as integer)`, 'job_completedTasks')
        .addSelect(`CAST(SUM(CASE WHEN task.status = '${OperationStatus.IN_PROGRESS}' THEN 1 ELSE 0 END) as integer)`, 'job_inProgressTasks')
        .addSelect(`CAST(SUM(CASE WHEN task.status = '${OperationStatus.PENDING}' THEN 1 ELSE 0 END) as integer)`, 'job_pendingTasks')
        .addSelect(`CAST(SUM(CASE WHEN task.status = '${OperationStatus.ABORTED}' THEN 1 ELSE 0 END) as integer)`, 'job_abortedTasks')
        .addSelect(`CAST(SUM(CASE WHEN task.status = '${OperationStatus.FAILED}' THEN 1 ELSE 0 END) as integer)`, 'job_failedTasks')
        .andWhere(`task.type  = '${req.taskType}'`)
        .groupBy('job.id');
    }
    const entities = await queryBuilder.getMany();

    const models = entities.map((entity) => this.jobConvertor.entityToModel(entity));
    return models;
  }

  public async getJobByJobParameters(parameters: JobParameters): Promise<FindJobsResponse> {
    this.appLogger.info({ parameters }, 'Getting jobs by jobs parameters');
    try {
      const entities = await this.createQueryBuilder()
        .select('job')
        .from(JobEntity, 'job')
        .where({ parameters: Raw(() => paramsQueryBuilder(parameters), parameters) })
        .getMany();

      const models = entities.map((entity) => this.jobConvertor.entityToModel(entity));
      return models;
    } catch (error) {
      this.appLogger.error({ parameters, msg: `Failed to get jobs by jobs parameters, error: ${(error as Error).message}` });
      throw error;
    }
  }

  public async createJob(req: ICreateJobBody): Promise<ICreateJobResponse> {
    this.appLogger.info({ resourceId: req.resourceId, version: req.version, type: req.type, msg: 'Start job creation ' });
    try {
      let entity = this.jobConvertor.createModelToEntity(req);
      entity = await this.save(entity);
      this.appLogger.info({ resourceId: entity.resourceId, version: entity.version, type: entity.type, msg: 'Job was created successfully' });
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
          this.appLogger.error({
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
          this.appLogger.error({
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
  }

  public async getJob(id: string, query: IJobsQuery): Promise<IGetJobResponse | undefined> {
    let entity;
    if (query.shouldReturnTasks === true) {
      entity = await this.findOne(id, { relations: ['tasks'] });
    } else {
      entity = await this.findOne(id);
    }

    const model = entity ? this.jobConvertor.entityToModel(entity) : undefined;
    return model;
  }

  public async updateJob(req: IUpdateJobRequest): Promise<void> {
    this.appLogger.info({ jobId: req.jobId, msg: 'start job update' });
    if (!(await this.exists(req.jobId))) {
      const message = 'job was not found for provided update request';
      this.appLogger.error({ jobId: req.jobId, msg: message });
      throw new NotFoundError(message);
    }
    const entity = this.jobConvertor.updateModelToEntity(req);
    await this.save(entity);
    this.appLogger.info({ jobId: req.jobId, msg: 'Job was updated successfully' });
  }

  public async exists(id: string): Promise<boolean> {
    const jobCount = await this.count({ id: id });
    return jobCount === 1;
  }

  public async deleteJob(id: string): Promise<void> {
    if (!(await this.exists(id))) {
      const message = 'job id was not found for delete request';
      this.appLogger.error({ id: id, msg: message });
      throw new NotFoundError(message);
    }
    try {
      await this.delete(id);
      this.appLogger.info({ id: id, msg: 'Finish job deletion successfully' });
    } catch (err) {
      const pgForeignKeyConstraintViolationErrorCode = '23503';
      const error = err as Error & { code: string };
      if (error.code === pgForeignKeyConstraintViolationErrorCode) {
        this.appLogger.error({ jobId: id, errorMessage: error.message, errorCode: error.code, msg: 'failed job deletion because it have tasks' });
        throw new DBConstraintError(`job ${id} have tasks`);
      } else {
        this.appLogger.error({ jobId: id, errorMessage: error.message, errorCode: error.code, msg: 'failed job deletion' });
        throw err;
      }
    }
  }

  public async updateExpiredJobs(): Promise<void> {
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
  }

  public async isJobResettable(jobId: string): Promise<boolean> {
    const query = `SELECT count(*) FILTER (WHERE tk."resettable" = FALSE) as "unResettableTasks", count(*) AS "failedTasks"
      FROM "Job" AS jb
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
  }

  public async isJobHasPendingTasks(jobId: string): Promise<boolean> {
    const pendingTasksCount = await this.createQueryBuilder('job')
      .leftJoinAndSelect('job.tasks', 'task')
      .where('job.id = :jobId', { jobId })
      .andWhere('task.status = :status', { status: OperationStatus.PENDING })
      .getCount();

    return pendingTasksCount > 0;
  }
}
