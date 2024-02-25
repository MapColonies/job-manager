import { Logger } from '@map-colonies/js-logger';
import { NotFoundError, BadRequestError } from '@map-colonies/error-types';
import { Tracer } from '@opentelemetry/api';
import { withSpanAsyncV4 } from '@map-colonies/telemetry';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { ConnectionManager } from '../../DAL/connectionManager';
import { TaskRepository } from '../../DAL/repositories/taskRepository';
import { IFindInactiveTasksRequest, IGetTaskResponse, IRetrieveAndStartRequest } from '../../common/dataModels/tasks';
import { JobRepository } from '../../DAL/repositories/jobRepository';
import { OperationStatus } from '../../common/dataModels/enums';
import { IJobsParams, IJobsQuery } from '../../common/dataModels/jobs';

@injectable()
export class TaskManagementManager {
  private jobRepository?: JobRepository;
  private taskRepository?: TaskRepository;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.TRACER) public readonly tracer: Tracer,
    private readonly connectionManager: ConnectionManager
  ) {}

  public async retrieveAndStart(req: IRetrieveAndStartRequest): Promise<IGetTaskResponse> {
    const repo = await this.getTaskRepository();
    this.logger.debug(`try to start task by retrieving and updating to "In-Progress" for job type: ${req.jobType}, task type: ${req.taskType}`);
    const res = await repo.retrieveAndUpdate(req.jobType, req.taskType);
    if (res === undefined) {
      this.logger.debug(`Pending task was not found for job type: ${req.jobType}, task type: ${req.taskType}`);
      throw new NotFoundError('Pending task was not found');
    }
    this.logger.info(`started task: ${res.id} of job: ${res.jobId}`);
    return res;
  }

  @withSpanAsyncV4
  public async releaseInactive(tasks: string[]): Promise<string[]> {
    const repo = await this.getTaskRepository();
    this.logger.info(`trying to release dead tasks: ${tasks.join(',')}`);
    const releasedTasks = await repo.releaseInactiveTask(tasks);
    this.logger.info(`released dead tasks: ${releasedTasks.join(',')}`);
    return releasedTasks;
  }

  @withSpanAsyncV4
  public async getInactiveTasks(req: IFindInactiveTasksRequest): Promise<string[]> {
    const repo = await this.getTaskRepository();
    this.logger.info(`finding tasks inactive for longer then ${req.inactiveTimeSec} seconds, with types: ${req.types ? req.types.join() : 'any'}`);
    const res = await repo.findInactiveTasks(req);
    return res;
  }

  @withSpanAsyncV4
  public async updateExpiredJobsAndTasks(): Promise<void> {
    const jobsRepo = await this.getJobRepository();
    await jobsRepo.updateExpiredJobs();
    const taskRepo = await this.getTaskRepository();
    await taskRepo.updateTasksOfExpiredJobs();
  }

  @withSpanAsyncV4
  public async abortJobAndTasks(req: IJobsParams, queryParams: IJobsQuery): Promise<void> {
    const jobRepo = await this.getJobRepository();
    const jobEntity = await jobRepo.getJob(req.jobId, { ...queryParams, shouldReturnTasks: false });
    if (!jobEntity) {
      const message = 'Job abort request failed, job was not found for provided update request';
      this.logger.error({ jobId: req.jobId, msg: message });
      throw new NotFoundError(message);
    }
    if ((jobEntity.status as OperationStatus) !== OperationStatus.PENDING && (jobEntity.status as OperationStatus) !== OperationStatus.IN_PROGRESS) {
      const message = 'Job abort request failed, job status should be one of: "Pending" or "In-progress"';
      this.logger.error({ jobStatus: jobEntity.status, msg: message });
      throw new BadRequestError(message);
    }
    await jobRepo.updateJob({ jobId: req.jobId, status: OperationStatus.ABORTED });
    const taskRepo = await this.getTaskRepository();
    await taskRepo.abortJobTasks(req.jobId);
  }

  private async getTaskRepository(): Promise<TaskRepository> {
    if (!this.taskRepository) {
      if (!this.connectionManager.isConnected()) {
        await this.connectionManager.init();
      }
      this.taskRepository = this.connectionManager.getTaskRepository();
    }
    return this.taskRepository;
  }

  private async getJobRepository(): Promise<JobRepository> {
    if (!this.jobRepository) {
      if (!this.connectionManager.isConnected()) {
        await this.connectionManager.init();
      }
      this.jobRepository = this.connectionManager.getJobRepository();
    }
    return this.jobRepository;
  }
}
