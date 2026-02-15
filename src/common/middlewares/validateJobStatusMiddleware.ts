import { Request, Response, NextFunction } from 'express';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import { ConflictError } from '@map-colonies/error-types';
import { Logger } from '@map-colonies/js-logger';
import { container } from 'tsyringe';
import { SERVICES } from '../constants';
import { JobManager } from '../../jobs/models/jobManager';

export const validateJobStatusMiddleware = async (req: Request<{ jobId: string }>, res: Response, next: NextFunction): Promise<void> => {
  const jobManager = container.resolve(JobManager);
  const logger = container.resolve<Logger>(SERVICES.LOGGER);

  const finalStateStatuses: OperationStatus[] = [OperationStatus.COMPLETED, OperationStatus.ABORTED, OperationStatus.EXPIRED];
  try {
    const jobId = req.params.jobId;
    const job = await jobManager.getJob({ jobId }, { shouldReturnTasks: false, shouldReturnAvailableActions: false });

    if (finalStateStatuses.includes(job.status)) {
      const errorMessage = `Cannot perform the requested operation on job with final state status: ${job.status}`;
      logger.error({ msg: errorMessage, jobId, status: job.status });
      throw new ConflictError(errorMessage);
    }

    next();
  } catch (error) {
    next(error);
  }
};
