import { Logger } from '@map-colonies/js-logger';
import { NotFoundError } from '@map-colonies/error-types';
import { Tracer } from '@opentelemetry/api';
import { withSpanAsyncV4 } from '@map-colonies/telemetry';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { ConnectionManager } from '../../DAL/connectionManager';
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
    @inject(SERVICES.TRACER) public readonly tracer: Tracer,
    private readonly connectionManager: ConnectionManager,
    private readonly jobManager: JobManager
  ) {}

  @withSpanAsyncV4
  public async getAllTasks(req: IAllTasksParams): Promise<GetTasksResponse> {
    const repo = await this.getRepository();
    const res = await repo.getTasks(req);
    return res;
  }

  @withSpanAsyncV4
  public async createTask(req: CreateTasksRequest): Promise<CreateTasksResponse> {
    this.logger.debug(req, 'Create-task request parameters');
    const repo = await this.getRepository();
    const res = await repo.createTask(req);
    return res;
  }

  @withSpanAsyncV4
  public async getTask(req: ISpecificTaskParams): Promise<IGetTaskResponse> {
    const repo = await this.getRepository();
    const res = await repo.getTask(req);
    if (res === undefined) {
      throw new NotFoundError('Task not found');
    }
    return res;
  }

  @withSpanAsyncV4
  public async findTasks(req: IFindTasksRequest): Promise<GetTasksResponse> {
    const repo = await this.getRepository();
    const res = await repo.findTasks(req);
    if (res.length === 0) {
      throw new NotFoundError('Tasks not found');
    }
    return res;
  }

  @withSpanAsyncV4
  public async updateTask(req: IUpdateTaskRequest): Promise<void> {
    this.logger.debug(req, 'Update-Task request parameters');
    const repo = await this.getRepository();
    await repo.updateTask(req);
  }

  @withSpanAsyncV4
  public async deleteTask(req: ISpecificTaskParams): Promise<void> {
    this.logger.info(`deleting task ${req.taskId} from job ${req.jobId}`);
    const repo = await this.getRepository();
    const res = await repo.deleteTask(req);
    return res;
  }

  @withSpanAsyncV4
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
