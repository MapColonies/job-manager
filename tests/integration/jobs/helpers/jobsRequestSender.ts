import * as supertest from 'supertest';
import { JobParameters } from '../../../../src/DAL/repositories/jobRepository';

export interface SearchJobsParams {
  resourceId?: string;
  version?: string;
  isCleaned?: boolean;
  status?: string;
  type?: string;
  shouldReturnTasks?: boolean;
  shouldReturnAvailableActions?: boolean;
  fromDate?: string;
  tillDate?: string;
  internalId?: string;
}

export class JobsRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getResources(params: SearchJobsParams = {}): Promise<supertest.Response> {
    return supertest.agent(this.app).get('/jobs').query(params).set('Content-Type', 'application/json');
  }

  public async getResource(id: string, shouldReturnTasks = false, shouldReturnAvailableActions = false): Promise<supertest.Response> {
    return supertest
      .agent(this.app)
      .get(`/jobs/${id}`)
      .query({ shouldReturnTasks, shouldReturnAvailableActions })
      .set('Content-Type', 'application/json');
  }

  public async getJobByJobParameters(req: JobParameters): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/jobs/parameters`).query(req).set('Content-Type', 'application/json');
  }

  public async updateResource(id: string, body: Record<string, unknown>): Promise<supertest.Response> {
    return supertest.agent(this.app).put(`/jobs/${id}`).set('Content-Type', 'application/json').send(body);
  }

  public async createResource(body: Record<string, unknown>): Promise<supertest.Response> {
    return supertest.agent(this.app).post(`/jobs`).set('Content-Type', 'application/json').send(body);
  }

  public async findJobs(body: Record<string, unknown>): Promise<supertest.Response> {
    return supertest.agent(this.app).post(`/jobs/find`).set('Content-Type', 'application/json').send(body);
  }

  public async deleteResource(id: string): Promise<supertest.Response> {
    return supertest.agent(this.app).delete(`/jobs/${id}`).set('Content-Type', 'application/json');
  }

  public async resettable(id: string): Promise<supertest.Response> {
    return supertest.agent(this.app).post(`/jobs/${id}/resettable`);
  }

  public async reset(id: string, body: Record<string, unknown>): Promise<supertest.Response> {
    return supertest.agent(this.app).post(`/jobs/${id}/reset`).set('Content-Type', 'application/json').send(body);
  }
}
