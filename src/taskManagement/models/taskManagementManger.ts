import { Logger } from '@map-colonies/js-logger';
import { NotFoundError } from '@map-colonies/error-types';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { TaskRepository, TASK_CUSTOM_REPOSITORY_SYMBOL } from '../../DAL/repositories/taskRepository';
import { IFindInactiveTasksRequest, IGetTaskResponse, IRetrieveAndStartRequest } from '../../common/dataModels/tasks';
import { JobRepository, JOB_CUSTOM_REPOSITORY_SYMBOL } from '../../DAL/repositories/jobRepository';
import { OperationStatus } from '../../common/dataModels/enums';
import { IJobsParams } from '../../common/dataModels/jobs';

@injectable()
export class TaskManagementManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(JOB_CUSTOM_REPOSITORY_SYMBOL) private readonly jobRepository: JobRepository,
    @inject(TASK_CUSTOM_REPOSITORY_SYMBOL) private readonly taskRepository: TaskRepository
  ) {}

  public async retrieveAndStart(req: IRetrieveAndStartRequest): Promise<IGetTaskResponse> {
    this.logger.debug(`try to start task by retrieving and updating to "In-Progress" for job type: ${req.jobType}, task type: ${req.taskType}`);
    const res = await this.taskRepository.retrieveAndUpdate(req.jobType, req.taskType);
    if (res === undefined) {
      this.logger.debug(`Pending task was not found for job type: ${req.jobType}, task type: ${req.taskType}`);
      throw new NotFoundError('Pending task was not found');
    }
    this.logger.info(`started task: ${res.id} of job: ${res.jobId}`);
    return res;
  }

  public async releaseInactive(tasks: string[]): Promise<string[]> {
    this.logger.info(`trying to release dead tasks: ${tasks.join(',')}`);
    const releasedTasks = await this.taskRepository.releaseInactiveTask(tasks);
    this.logger.info(`released dead tasks: ${releasedTasks.join(',')}`);
    return releasedTasks;
  }

  public async getInactiveTasks(req: IFindInactiveTasksRequest): Promise<string[]> {
    this.logger.info(`finding tasks inactive for longer then ${req.inactiveTimeSec} seconds, with types: ${req.types ? req.types.join() : 'any'}`);
    const res = await this.taskRepository.findInactiveTasks(req);
    return res;
  }

  public async updateExpiredJobsAndTasks(): Promise<void> {
    await this.jobRepository.updateExpiredJobs();
    await this.taskRepository.updateTasksOfExpiredJobs();
  }

  public async abortJobAndTasks(req: IJobsParams): Promise<void> {
    await this.jobRepository.updateJob({ jobId: req.jobId, status: OperationStatus.ABORTED });
    await this.taskRepository.abortJobTasks(req.jobId);
  }
}
