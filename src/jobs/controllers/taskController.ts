import { ErrorResponse } from '@map-colonies/error-express-handler';
import { Logger } from '@map-colonies/js-logger';
import { Meter } from '@map-colonies/telemetry';
import { BoundCounter } from '@opentelemetry/api-metrics';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { ResponseCodes, SERVICES } from '../../common/constants';
import {
  GetTasksResponse,
  IAllTasksParams,
  CreateTasksResponse,
  IGetTaskResponse,
  ISpecificTaskParams,
  IUpdateTaskBody,
  IUpdateTaskRequest,
  CreateTasksBody,
  CreateTasksRequest,
  IFindTasksRequest,
  IGetTasksStatus,
} from '../../common/dataModels/tasks';
import { DefaultResponse } from '../../common/interfaces';
import { TaskManager } from '../models/taskManager';
import { EntityNotFound } from '../../common/errors';

type CreateResourceHandler = RequestHandler<IAllTasksParams, CreateTasksResponse, CreateTasksBody>;
type GetResourcesHandler = RequestHandler<IAllTasksParams, GetTasksResponse>;
type GetResourceHandler = RequestHandler<ISpecificTaskParams, IGetTaskResponse>;
type DeleteResourceHandler = RequestHandler<ISpecificTaskParams, DefaultResponse>;
type UpdateResourceHandler = RequestHandler<ISpecificTaskParams, DefaultResponse, IUpdateTaskBody>;
type GetResourcesStatusHandler = RequestHandler<IAllTasksParams, IGetTasksStatus>;
type FindResourceHandler = RequestHandler<undefined, GetTasksResponse | ErrorResponse, IFindTasksRequest>;

@injectable()
export class TaskController {
  private readonly createdResourceCounter: BoundCounter;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(TaskManager) private readonly manager: TaskManager,
    @inject(SERVICES.METER) private readonly meter: Meter
  ) {
    this.createdResourceCounter = meter.createCounter('created_resource');
  }
  public createResource: CreateResourceHandler = async (req, res, next) => {
    try {
      let tasksReq: CreateTasksRequest;
      if (Array.isArray(req.body)) {
        tasksReq = req.body.map((createBody) => {
          return { ...createBody, ...req.params };
        });
      } else {
        tasksReq = { ...req.body, ...req.params };
      }
      const task = await this.manager.createTask(tasksReq);
      return res.status(httpStatus.CREATED).json(task);
    } catch (err) {
      return next(err);
    }
  };

  public findTasks: FindResourceHandler = async (req, res, next) => {
    try {
      const tasksRes = await this.manager.findTasks(req.body);
      return res.status(httpStatus.OK).json(tasksRes);
    } catch (err) {
      if (err instanceof EntityNotFound) {
        this.logger.warn(`findTasks found nothing on ${JSON.stringify(req.body)}`);
        return res.status(httpStatus.NOT_FOUND).json({ message: err.message });
      }
      return next(err);
    }
  };
  public getResources: GetResourcesHandler = async (req, res, next) => {
    try {
      const tasksRes = await this.manager.getAllTasks(req.params);
      return res.status(httpStatus.OK).json(tasksRes);
    } catch (err) {
      return next(err);
    }
  };

  public getResource: GetResourceHandler = async (req, res, next) => {
    try {
      const job = await this.manager.getTask(req.params);
      return res.status(httpStatus.OK).json(job);
    } catch (err) {
      return next(err);
    }
  };

  public updateResource: UpdateResourceHandler = async (req, res, next) => {
    try {
      const taskUpdateReq: IUpdateTaskRequest = { ...req.body, ...req.params };
      await this.manager.updateTask(taskUpdateReq);
      return res.status(httpStatus.OK).json({ code: ResponseCodes.TASK_UPDATED });
    } catch (err) {
      return next(err);
    }
  };

  public deleteResource: DeleteResourceHandler = async (req, res, next) => {
    try {
      await this.manager.deleteTask(req.params);
      return res.status(httpStatus.OK).json({ code: ResponseCodes.TASK_DELETED });
    } catch (err) {
      return next(err);
    }
  };

  public getResourcesStatus: GetResourcesStatusHandler = async (req, res, next) => {
    try {
      const status = await this.manager.getTaskStatus(req.params);
      return res.status(httpStatus.OK).json(status);
    } catch (err) {
      return next(err);
    }
  };
}
