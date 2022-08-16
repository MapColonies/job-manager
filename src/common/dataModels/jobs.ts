//requests
import { OperationStatus } from './enums';
import { GetTasksResponse, ICreateTaskBody } from './tasks';

export interface IJobsParams {
  jobId: string;
}

export interface IJobsQuery {
  shouldReturnTasks: boolean;
}

export interface IFindJobsRequest {
  resourceId?: string;
  version?: string;
  isCleaned?: boolean;
  status?: OperationStatus;
  type?: string;
  shouldReturnTasks?: boolean;
  productType?: string;
  fromDate?: string;
  tillDate?: string;
}

export interface ICreateJobBody {
  resourceId: string;
  version: string;
  parameters: Record<string, unknown>;
  type: string;
  percentage?: number;
  description?: string;
  status?: OperationStatus;
  reason?: string;
  tasks?: ICreateTaskBody[];
  priority?: number;
  internalId?: string;
  producerName?: string;
  productName?: string;
  productType?: string;
  expirationDate?: Date;
  additionalIdentifiers?: string;
}

export interface IUpdateJobBody {
  parameters?: Record<string, unknown>;
  status?: OperationStatus;
  percentage?: number;
  reason?: string;
  isCleaned?: boolean;
  priority?: number;
  internalId?: string;
  producerName?: string;
  productName?: string;
  productType?: string;
  expirationDate?: Date;
}

export interface IUpdateJobRequest extends IJobsParams, IUpdateJobBody {}

export interface IResetJobBody {
  newExpirationDate?: Date;
}

export interface IResetJobRequest extends IJobsParams, IResetJobBody {}

//responses
export type FindJobsResponse = IGetJobResponse[];

export interface IGetJobResponse {
  id: string;
  resourceId: string;
  version: string;
  type: string;
  description?: string;
  parameters: Record<string, unknown>;
  reason?: string;
  tasks?: GetTasksResponse;
  created: Date;
  updated: Date;
  status?: OperationStatus;
  percentage?: number;
  isCleaned: boolean;
  priority?: number;
  internalId?: string;
  producerName?: string;
  productName?: string;
  productType?: string;
  taskCount: number;
  completedTasks: number;
  failedTasks: number;
  expiredTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  abortedTasks: number;
  additionalIdentifiers?: string;
  expirationDate?: Date;
}

export interface ICreateJobResponse {
  id: string;
  taskIds: string[];
}

export interface IIsResettableResponse {
  jobId: string;
  isResettable: boolean;
}
