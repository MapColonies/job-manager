import { randUuid } from '@ngneat/falso';
import { IJobAndTaskStatus } from '../../src/common/interfaces';
import { OperationStatus } from '../../src/common/dataModels/enums';

export const createUuid = (): string => {
  return randUuid();
};

export const createJobAndTaskStatus = (
  jobStatus: OperationStatus,
  taskId = createUuid(),
  jobId = createUuid(),
  taskStatus = OperationStatus.IN_PROGRESS
): IJobAndTaskStatus => {
  return {
    taskId,
    taskStatus,
    jobId,
    jobStatus,
  };
};
