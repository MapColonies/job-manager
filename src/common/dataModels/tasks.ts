import { OperationStatus } from './enums';

//requests
export interface IAllTasksParams {
  jobId: string;
}

export interface ISpecificTaskParams extends IAllTasksParams {
  taskId: string;
}

export interface ICreateTaskBody {
  description?: string;
  parameters: Record<string, unknown>;
  reason?: string;
  type?: string;
  status?: OperationStatus;
  attempts?: number;
  percentage?: number;
  blockDuplication?: boolean;
}

export type CreateTasksBody = ICreateTaskBody | ICreateTaskBody[];

export interface ICreateTaskRequest extends IAllTasksParams, ICreateTaskBody {}

export type CreateTasksRequest = ICreateTaskRequest | ICreateTaskRequest[];

export interface IUpdateTaskBody {
  description?: string;
  parameters?: Record<string, unknown>;
  status: OperationStatus;
  percentage?: number;
  reason?: string;
  attempts?: number;
}

export interface IUpdateTaskRequest extends ISpecificTaskParams, IUpdateTaskBody {}

export interface ITaskType {
  jobType: string;
  taskType: string;
}

export interface IRetrieveAndStartRequest extends ITaskType {}

export interface IFindInactiveTasksRequest {
  inactiveTimeSec: number;
  types?: ITaskType[];
  ignoreTypes?: ITaskType[];
}

//responses
export interface IGetTaskResponse {
  id: string;
  jobId: string;
  description?: string;
  parameters?: Record<string, unknown>;
  created: Date;
  updated: Date;
  type: string;
  status: OperationStatus;
  percentage?: number;
  reason?: string;
  attempts: number;
  resettable: boolean;
}

export type GetTasksResponse = IGetTaskResponse[];

export interface ICreateTaskResponse {
  id: string;
}
export interface ICreateTasksResponse {
  ids: string[];
  errors?: string[];
}

export interface IGetTasksStatus {
  allTasksCompleted: boolean;
  failedTasksCount: number;
  completedTasksCount: number;
  resourceId: string;
  resourceVersion: string;
}

export type CreateTasksResponse = ICreateTaskResponse | ICreateTasksResponse;

export interface IFindTasksRequest extends Partial<ICreateTaskBody> {
  jobId?: string;
  id?: string;
  percentage?: number;
  creationTime?: Date;
  updateTime?: Date;
}
