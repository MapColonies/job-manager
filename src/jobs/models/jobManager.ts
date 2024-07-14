import { Logger } from '@map-colonies/js-logger';
import { NotFoundError } from '@map-colonies/error-types';
import { inject, injectable } from 'tsyringe';
import { Tracer } from '@opentelemetry/api';
import { withSpanAsyncV4 } from '@map-colonies/telemetry';
import { SERVICES } from '../../common/constants';
import { ConnectionManager } from '../../DAL/connectionManager';
import {
  FindJobsResponse,
  ICreateJobBody,
  ICreateJobResponse,
  IGetJobResponse,
  IFindJobsRequest,
  IJobsParams,
  IUpdateJobRequest,
  IJobsQuery,
  IIsResettableResponse,
  IResetJobRequest,
  IAvailableActions,
  IFindJobsByCriteriaBody,
} from '../../common/dataModels/jobs';
import { JobParameters, JobRepository } from '../../DAL/repositories/jobRepository';
import { TransactionActions } from '../../DAL/repositories/transactionActions';
import { OperationStatus } from '../../common/dataModels/enums';

@injectable()
export class JobManager {
  private repository?: JobRepository;
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.TRACER) public readonly tracer: Tracer,
    private readonly connectionManager: ConnectionManager,
    private readonly transactionManager: TransactionActions
  ) {}

  @withSpanAsyncV4
  public async findJobs(req: IFindJobsRequest): Promise<FindJobsResponse> {
    const repo = await this.getRepository();

    let res = await repo.findJobs(req);

    if (req.shouldReturnAvailableActions === true) {
      if (res.length !== 0) {
        res = await Promise.all(
          res.map(async (job) => ({
            ...job,
            availableActions: await this.getAvailableActions(job),
          }))
        );
      }
    }
    return res;
  }

  @withSpanAsyncV4
  public async findJobsByCriteria(req: IFindJobsByCriteriaBody): Promise<FindJobsResponse> {
    const repo = await this.getRepository();
    let res = await repo.findJobsByCriteria(req);

    if (req.shouldReturnAvailableActions === true) {
      if (res.length !== 0) {
        res = await Promise.all(
          res.map(async (job) => ({
            ...job,
            availableActions: await this.getAvailableActions(job),
          }))
        );
      }
    }
    return res;
  }

  @withSpanAsyncV4
  public async getJobsByJobsParameters(req: JobParameters): Promise<FindJobsResponse> {
    const repo = await this.getRepository();
    const res = await repo.getJobByJobParameters(req);
    return res;
  }

  @withSpanAsyncV4
  public async createJob(req: ICreateJobBody): Promise<ICreateJobResponse> {
    this.logger.debug(req, 'Create-job parameters');
    const repo = await this.getRepository();
    const res = await repo.createJob(req);
    return res;
  }

  @withSpanAsyncV4
  public async getJob(req: IJobsParams, query: IJobsQuery): Promise<IGetJobResponse> {
    const repo = await this.getRepository();
    let res = await repo.getJob(req.jobId, query);

    if (res === undefined) {
      throw new NotFoundError('Job not found');
    }

    if (query.shouldReturnAvailableActions === true) {
      const availableActions = await this.getAvailableActions(res);
      res = { ...res, availableActions };
    }
    return res;
  }

  @withSpanAsyncV4
  public async updateJob(req: IUpdateJobRequest): Promise<void> {
    this.logger.debug(req, 'Update-job parameters');
    const repo = await this.getRepository();
    await repo.updateJob(req);
  }

  @withSpanAsyncV4
  public async deleteJob(req: IJobsParams): Promise<void> {
    this.logger.info({ jobId: req.jobId, msg: 'deleting job' });
    const repo = await this.getRepository();
    const res = await repo.deleteJob(req.jobId);
    return res;
  }

  @withSpanAsyncV4
  public async isResettable(req: IJobsParams): Promise<IIsResettableResponse> {
    const jobId = req.jobId;
    const repo = await this.getRepository();
    const isResettable = await repo.isJobResettable(jobId);
    return { jobId, isResettable };
  }

  @withSpanAsyncV4
  public async resetJob(req: IResetJobRequest): Promise<void> {
    const jobId = req.jobId;
    const newExpirationDate = req.newExpirationDate;
    this.logger.info(`reset job ${req.jobId}, newExpirationDate ${(newExpirationDate ?? 'undefiend') as string}`);
    await this.transactionManager.resetJob(jobId, newExpirationDate);
  }

  @withSpanAsyncV4
  private async getAvailableActions(job: IGetJobResponse): Promise<IAvailableActions> {
    const isResettable = (await this.isResettable({ jobId: job.id })).isResettable;
    const isAbortable = await this.isAbortable(job);
    const availableActions: IAvailableActions = {
      isResumable: isResettable,
      isAbortable: isAbortable,
    };
    return availableActions;
  }

  @withSpanAsyncV4
  private async isAbortable(job: IGetJobResponse): Promise<boolean> {
    const jobId = job.id;
    const repo = await this.getRepository();
    const hasPendingTasks = await repo.isJobHasPendingTasks(jobId);
    return hasPendingTasks && (job.status === OperationStatus.PENDING || job.status === OperationStatus.IN_PROGRESS);
  }

  private async getRepository(): Promise<JobRepository> {
    if (!this.repository) {
      if (!this.connectionManager.isConnected()) {
        await this.connectionManager.init();
      }
      this.repository = this.connectionManager.getJobRepository();
    }
    return this.repository;
  }
}
