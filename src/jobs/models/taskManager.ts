import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../../common/constants';

import { ConnectionManager } from '../../DAL/connectionManager';
import { EntityNotFound } from '../../common/errors';
import { TaskRepository } from '../../DAL/repositories/taskRepository';
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
  private repository?: TaskRepository;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    private readonly connectionManager: ConnectionManager,
    private readonly jobManager: JobManager
  ) {}

  public async getAllTasks(req: IAllTasksParams): Promise<GetTasksResponse> {
    const repo = await this.getRepository();
    const res = await repo.getTasks(req);
    return res;
  }

  public async createTask(req: CreateTasksRequest): Promise<CreateTasksResponse> {
    const repo = await this.getRepository();
    const jobId = Array.isArray(req) ? req[0].jobId : req.jobId;
    this.logger.info(`creating task(s) for job ${jobId}`);
    const res = await repo.createTask(req);
    return res;
  }

  public async getTask(req: ISpecificTaskParams): Promise<IGetTaskResponse> {
    const repo = await this.getRepository();
    const res = await repo.getTask(req);
    if (res === undefined) {
      throw new EntityNotFound('Task not found');
    }
    return res;
  }

  public async findTasks(req: IFindTasksRequest): Promise<GetTasksResponse> {
    const repo = await this.getRepository();
    const res = await repo.findTasks(req);
    if (res.length === 0) {
      throw new EntityNotFound('Tasks not found');
    }
    return res;
  }

  public async updateTask(req: IUpdateTaskRequest): Promise<void> {
    const repo = await this.getRepository();
    this.logger.info(`updating task ${req.taskId} from job ${req.jobId}`);
    await repo.updateTask(req);
  }

  public async deleteTask(req: ISpecificTaskParams): Promise<void> {
    this.logger.info(`deleting task ${req.taskId} from job ${req.jobId}`);
    const repo = await this.getRepository();
    const res = await repo.deleteTask(req);
    return res;
  }

  public async getTaskStatus(req: IAllTasksParams): Promise<IGetTasksStatus> {
    const { version: resourceVersion, resourceId } = await this.jobManager.getJob(req, { shouldReturnTasks: false });
    const repo = await this.getRepository();

    this.logger.info(`Getting tasks statuses for jobId ${req.jobId}`);
    const completedTasksCount = await repo.getTasksCountByStatus(OperationStatus.COMPLETED, req.jobId);
    const failedTasksCount = await repo.getTasksCountByStatus(OperationStatus.FAILED, req.jobId);
    const allTasksCompleted = await repo.checkIfAllCompleted(req.jobId);

    const tasksStatus: IGetTasksStatus = {
      allTasksCompleted,
      completedTasksCount,
      failedTasksCount,
      resourceId,
      resourceVersion,
    };

    return tasksStatus;
  }

  private async getRepository(): Promise<TaskRepository> {
    if (!this.repository) {
      if (!this.connectionManager.isConnected()) {
        await this.connectionManager.init();
      }
      this.repository = this.connectionManager.getTaskRepository();
    }
    return this.repository;
  }
}
