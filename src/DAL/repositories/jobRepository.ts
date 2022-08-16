import { EntityRepository, FindManyOptions, LessThan, Brackets, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { container } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { SERVICES } from '../../common/constants';
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
import { DBConstraintError, EntityAlreadyExists, EntityNotFound } from '../../common/errors';
import { OperationStatus } from '../../common/dataModels/enums';
import { GeneralRepository } from './generalRepository';

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

  public async createJob(req: ICreateJobBody): Promise<ICreateJobResponse> {
    try {
      let entity = this.jobConvertor.createModelToEntity(req);
      entity = await this.save(entity);
      return {
        id: entity.id,
        taskIds: entity.tasks ? entity.tasks.map((task) => task.id) : [],
      };
    } catch (err) {
      const pgExclusionViolationErrorCode = '23P01';
      const error = err as Error & { code: string };
      if (error.code === pgExclusionViolationErrorCode) {
        if (error.message.includes('UQ_uniqueness_on_active_tasks')) {
          const message =
            `failed to create ${req.type} job  because another active job exists for resource: ${req.resourceId} ` +
            `with version: ${req.version} and identefiers:"${req.additionalIdentifiers as string}" .`;
          this.appLogger.warn(message);
          throw new EntityAlreadyExists(message);
        }
        if (error.message.includes('UQ_uniqness_on_job_and_type')) {
          const message =
            `failed to create ${req.type} job, for resource: ${req.resourceId} with version: ${req.version} ` +
            `and identefiers:"${req.additionalIdentifiers as string}", because it contains duplicate tasks.`;
          this.appLogger.warn(message);
          throw new DBConstraintError(`request contains duplicate tasks.`);
        }
      }
      throw err;
    }
  }

  public async getJob(id: string, shouldReturnTasks = true): Promise<IGetJobResponse | undefined> {
    let entity;
    if (!shouldReturnTasks) {
      entity = await this.findOne(id);
    } else {
      entity = await this.findOne(id, { relations: ['tasks'] });
    }
    const model = entity ? this.jobConvertor.entityToModel(entity) : undefined;
    return model;
  }

  public async updateJob(req: IUpdateJobRequest): Promise<void> {
    if (!(await this.exists(req.jobId))) {
      throw new EntityNotFound(` job ${req.jobId} was not found for update request`);
    }
    const entity = this.jobConvertor.updateModelToEntity(req);
    await this.save(entity);
  }

  public async exists(id: string): Promise<boolean> {
    const jobCount = await this.count({ id: id });
    return jobCount === 1;
  }

  public async deleteJob(id: string): Promise<void> {
    if (!(await this.exists(id))) {
      throw new EntityNotFound(` job ${id} was not found for delete request`);
    }
    try {
      await this.delete(id);
    } catch (err) {
      const pgForeignKeyConstraintViolationErrorCode = '23503';
      const error = err as Error & { code: string };
      if (error.code === pgForeignKeyConstraintViolationErrorCode) {
        this.appLogger.info(`failed to delete job ${id} because it have tasks`);
        throw new DBConstraintError(`job ${id} have tasks`);
      } else {
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
}
