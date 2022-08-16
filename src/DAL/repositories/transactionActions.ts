import { singleton } from 'tsyringe';
import { ObjectType, QueryRunner } from 'typeorm';
import { BadRequestError } from '../../common/errors';
import { OperationStatus } from '../../common/dataModels/enums';
import { ConnectionManager } from '../connectionManager';
import { JobRepository } from './jobRepository';
import { TaskRepository } from './taskRepository';

@singleton()
export class TransactionActions {
  public constructor(private readonly connectionManager: ConnectionManager) {}

  public async resetJob(jobId: string, expirationDate?: Date): Promise<void> {
    return this.handleTransaction(async (runner: QueryRunner) => {
      const jobRepo = this.getJobRepository(runner);
      if (await jobRepo.isJobResettable(jobId)) {
        await jobRepo.updateJob({ jobId, expirationDate, status: OperationStatus.IN_PROGRESS });
        const taskRepo = this.getTaskRepository(runner);
        await taskRepo.resetJobTasks(jobId);
      } else {
        throw new BadRequestError(`job ${jobId} is not resettable.`);
      }
    });
  }

  private async handleTransaction<T>(logic: (runner: QueryRunner) => Promise<T>): Promise<T> {
    const runner = await this.getTransactionRunner();
    try {
      const res = await logic(runner);
      await runner.commitTransaction();
      return res;
    } catch (err) {
      await runner.rollbackTransaction();
      throw err;
    } finally {
      await runner.release();
    }
  }

  private async getTransactionRunner(): Promise<QueryRunner> {
    if (!this.connectionManager.isConnected()) {
      await this.connectionManager.init();
    }
    const runner = await this.connectionManager.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    return runner;
  }

  private getJobRepository(queryRunner: QueryRunner): JobRepository {
    return this.getRepository(JobRepository, queryRunner);
  }

  private getTaskRepository(queryRunner: QueryRunner): TaskRepository {
    return this.getRepository(TaskRepository, queryRunner);
  }

  private getRepository<T>(repository: ObjectType<T>, queryRunner: QueryRunner): T {
    return queryRunner.manager.getCustomRepository(repository);
  }
}
