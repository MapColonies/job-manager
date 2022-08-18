import * as supertest from 'supertest';

export class TaskManagementRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async retrieveAndStart(jobType: string, taskType: string): Promise<supertest.Response> {
    return supertest.agent(this.app).post(`/tasks/${jobType}/${taskType}/startPending`).set('Content-Type', 'application/json');
  }

  public async findInactive(body: Record<string, unknown>): Promise<supertest.Response> {
    return supertest.agent(this.app).post(`/tasks/findInactive`).set('Content-Type', 'application/json').send(body);
  }

  public async releaseInactive(body: Record<string, unknown> | string[]): Promise<supertest.Response> {
    return supertest.agent(this.app).post(`/tasks/releaseInactive`).set('Content-Type', 'application/json').send(body);
  }

  public async updateExpiredStatus(): Promise<supertest.Response> {
    return supertest.agent(this.app).post('/tasks/updateExpiredStatus').send();
  }

  public async abortJobAndTasks(jobId: string): Promise<supertest.Response> {
    return supertest.agent(this.app).post(`/tasks/abort/${jobId}`).send();
  }
}
