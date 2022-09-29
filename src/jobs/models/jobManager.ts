import { Logger } from '@map-colonies/js-logger';
import { NotFoundError } from '@map-colonies/error-types';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../../common/constants';
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
} from '../../common/dataModels/jobs';
import { JobRepository, JOB_CUSTOM_REPOSITORY_SYMBOL } from '../../DAL/repositories/jobRepository';
import { TransactionActions } from '../../DAL/repositories/transactionActions';

@injectable()
export class JobManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    private readonly transactionManager: TransactionActions,
    @inject(JOB_CUSTOM_REPOSITORY_SYMBOL) private readonly repository: JobRepository
  ) {}

  public async findJobs(req: IFindJobsRequest): Promise<FindJobsResponse> {
    const res = await this.repository.findJobs(req);
    return res;
  }

  public async createJob(req: ICreateJobBody): Promise<ICreateJobResponse> {
    this.logger.debug(req, 'Create-job parameters');
    const res = await this.repository.createJob(req);
    return res;
  }

  public async getJob(req: IJobsParams, query: IJobsQuery): Promise<IGetJobResponse> {
    const res = await this.repository.getJob(req.jobId, query.shouldReturnTasks);
    if (res === undefined) {
      throw new NotFoundError('Job not found');
    }
    return res;
  }

  public async updateJob(req: IUpdateJobRequest): Promise<void> {
    this.logger.debug(req, 'Update-job parameters');
    await this.repository.updateJob(req);
  }

  public async deleteJob(req: IJobsParams): Promise<void> {
    this.logger.info({ jobId: req.jobId, msg: 'deleting job' });
    const res = await this.repository.deleteJob(req.jobId);
    return res;
  }

  public async isResettable(req: IJobsParams): Promise<IIsResettableResponse> {
    const jobId = req.jobId;
    const isResettable = await this.repository.isJobResettable(jobId);
    return { jobId, isResettable };
  }

  public async resetJob(req: IResetJobRequest): Promise<void> {
    const jobId = req.jobId;
    const newExpirationDate = req.newExpirationDate;
    this.logger.info(`reset job ${req.jobId}, newExpirationDate ${(newExpirationDate ?? 'undefiend') as string}`);
    await this.transactionManager.resetJob(jobId, newExpirationDate);
  }
}
