import { Logger } from '@map-colonies/js-logger';
import { NotFoundError } from '@map-colonies/error-types';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { TaskRepository, TASK_CUSTOM_REPOSITORY_SYMBOL } from '../../DAL/repositories/taskRepository';
import {
  CreateTasksRequest,
  CreateTasksResponse,
  GetTasksResponse,
  IAllTasksParams,
  IFindTasksRequest,
  IGetTaskResponse,
  IGetTasksStatus,
  ISpecificTaskParams,
  IUpdateTaskRequest,
} from '../../common/dataModels/tasks';
import { OperationStatus } from '../../common/dataModels/enums';
import { JobManager } from './jobManager';

@injectable()
export class TaskManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    private readonly jobManager: JobManager,
    @inject(TASK_CUSTOM_REPOSITORY_SYMBOL) private readonly repository: TaskRepository
  ) {}

  public async getAllTasks(req: IAllTasksParams): Promise<GetTasksResponse> {
    const res = await this.repository.getTasks(req);
    return res;
  }

  public async createTask(req: CreateTasksRequest): Promise<CreateTasksResponse> {
    this.logger.debug(req, 'Create-task request parameters');
    const res = await this.repository.createTask(req);
    return res;
  }

  public async getTask(req: ISpecificTaskParams): Promise<IGetTaskResponse> {
    const res = await this.repository.getTask(req);
    if (res === undefined) {
      throw new NotFoundError('Task not found');
    }
    return res;
  }

  public async findTasks(req: IFindTasksRequest): Promise<GetTasksResponse> {
    const res = await this.repository.findTasks(req);
    if (res.length === 0) {
      throw new NotFoundError('Tasks not found');
    }
    return res;
  }

  public async updateTask(req: IUpdateTaskRequest): Promise<void> {
    this.logger.debug(req, 'Update-Task request parameters');
    await this.repository.updateTask(req);
  }

  public async deleteTask(req: ISpecificTaskParams): Promise<void> {
    this.logger.info(`deleting task ${req.taskId} from job ${req.jobId}`);
    const res = await this.repository.deleteTask(req);
    return res;
  }

  public async getTaskStatus(req: IAllTasksParams): Promise<IGetTasksStatus> {
    const { version: resourceVersion, resourceId } = await this.jobManager.getJob(req, { shouldReturnTasks: false });

    this.logger.info(`Getting tasks statuses for jobId ${req.jobId}`);
    const completedTasksCount = await this.repository.getTasksCountByStatus(OperationStatus.COMPLETED, req.jobId);
    const failedTasksCount = await this.repository.getTasksCountByStatus(OperationStatus.FAILED, req.jobId);
    const allTasksCompleted = await this.repository.checkIfAllCompleted(req.jobId);

    const tasksStatus: IGetTasksStatus = {
      allTasksCompleted,
      completedTasksCount,
      failedTasksCount,
      resourceId,
      resourceVersion,
    };

    return tasksStatus;
  }
}
