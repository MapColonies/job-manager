import { Logger } from '@map-colonies/js-logger';
import { NotFoundError, BadRequestError } from '@map-colonies/error-types';
import { Tracer } from '@opentelemetry/api';
import { withSpanAsyncV4 } from '@map-colonies/telemetry';
import { inject, injectable } from 'tsyringe';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import { SERVICES } from '../../common/constants';
import { ConnectionManager } from '../../DAL/connectionManager';
import { TaskRepository } from '../../DAL/repositories/taskRepository';
import { IFindInactiveTasksRequest, IGetTaskResponse, IRetrieveAndStartRequest } from '../../common/dataModels/tasks';
import { JobRepository } from '../../DAL/repositories/jobRepository';
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

  @withSpanAsyncV4
  public async releaseInactive(tasks: string[], shouldRaiseAttempts?: boolean): Promise<string[]> {
    const repo = await this.getTaskRepository();
    this.logger.info(`trying to release dead tasks: ${tasks.join(',')}`);
    const releasedTasks = await repo.releaseInactiveTask(tasks, shouldRaiseAttempts ?? true);
    this.logger.info(`released dead tasks: ${releasedTasks.join(',')}`);
    return releasedTasks;
  }

  @withSpanAsyncV4
  public async getInactiveTasks(req: IFindInactiveTasksRequest): Promise<string[]> {
    const repo = await this.getTaskRepository();

    this.logger.info(
      `finding tasks inactive for longer than ${req.inactiveTimeSec} seconds, with types:  ${
        req.types ? req.types.map((type) => `{jobType: ${type.jobType}, taskType: ${type.taskType}}`).join(', ') : 'any'
      }`
    );
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
    if ((jobEntity.status as OperationStatus) === OperationStatus.COMPLETED || (jobEntity.status as OperationStatus) === OperationStatus.ABORTED) {
      const message = 'Job abort request failed, job status cannot be one of: "Completed" or "Aborted"';
      this.logger.error({ jobStatus: jobEntity.status, msg: message });
      throw new BadRequestError(message);
    }
    await jobRepo.updateJob({ jobId: req.jobId, status: OperationStatus.ABORTED });
    const taskRepo = await this.getTaskRepository();
    await taskRepo.abortJobTasks(req.jobId);
  }

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
