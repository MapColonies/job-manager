import { singleton } from 'tsyringe';
import { DataSource } from 'typeorm';
import { BadRequestError } from '@map-colonies/error-types';
import { OperationStatus } from '../../common/dataModels/enums';
import { JobRepository } from './jobRepository';
import { TaskRepository } from './taskRepository';

@singleton()
export class TransactionActions {
  public constructor(private readonly db: DataSource, private readonly jobRepo: JobRepository, private readonly taskRepo: TaskRepository) {}

  public async resetJob(jobId: string, expirationDate?: Date): Promise<void> {
    await this.db.transaction(async (manager) => {
      const transactionJobRepo = manager.withRepository(this.jobRepo);
      if (await transactionJobRepo.isJobResettable(jobId)) {
        await transactionJobRepo.updateJob({ jobId, expirationDate, status: OperationStatus.IN_PROGRESS });
        const transactionTaskRepo = manager.withRepository(this.taskRepo);
        await transactionTaskRepo.resetJobTasks(jobId);
      } else {
        throw new BadRequestError(`job ${jobId} is not resettable.`);
      }
    });
  }
}
