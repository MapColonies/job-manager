import { randUuid } from '@ngneat/falso';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import { IJobAndTaskStatus } from '../../src/common/interfaces';

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
