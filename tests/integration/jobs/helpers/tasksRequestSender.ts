import * as supertest from 'supertest';
import { IFindTasksRequest } from '../../../../src/common/dataModels/tasks';

export class TasksRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getAllResources(jobId: string, shouldExcludeParameters = false): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/jobs/${jobId}/tasks`).query({ shouldExcludeParameters }).set('Content-Type', 'application/json');
  }

  public async getResource(jobId: string, taskId: string): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/jobs/${jobId}/tasks/${taskId}`).set('Content-Type', 'application/json');
  }

  public async updateResource(jobId: string, taskId: string, body: Record<string, unknown>): Promise<supertest.Response> {
    return supertest.agent(this.app).put(`/jobs/${jobId}/tasks/${taskId}`).set('Content-Type', 'application/json').send(body);
  }

  public async createResource(jobId: string, body: Record<string, unknown> | Record<string, unknown>[] | unknown): Promise<supertest.Response> {
    return supertest
      .agent(this.app)
      .post(`/jobs/${jobId}/tasks`)
      .set('Content-Type', 'application/json')
      .send(body as Record<string, unknown>);
  }

  public async findTasks(body: IFindTasksRequest): Promise<supertest.Response> {
    return supertest.agent(this.app).post(`/tasks/find`).set('Content-Type', 'application/json').send(body);
  }

  public async deleteResource(jobId: string, taskId: string): Promise<supertest.Response> {
    return supertest.agent(this.app).delete(`/jobs/${jobId}/tasks/${taskId}`).set('Content-Type', 'application/json');
  }

  public async getTasksStatus(jobId: string): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/jobs/${jobId}/tasksStatus`).set('Content-Type', 'application/json');
  }
}
