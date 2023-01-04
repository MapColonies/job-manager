import * as supertest from 'supertest';

export interface SearchTasksParams {
  resourceId?: string;
  version?: string;
  isCleaned?: boolean;
  status?: string;
  type?: string;
  shouldReturnTasks?: boolean;
  availableActions?: boolean;
  fromDate?: string;
  tillDate?: string;
  internalId?: string;
}

export class JobsRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getResources(params: SearchTasksParams = {}): Promise<supertest.Response> {
    console.log('Params: ', params)
    return supertest.agent(this.app).get('/jobs').query(params).set('Content-Type', 'application/json');
  }

  public async getResource(id: string, shouldReturnTasks = true): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/jobs/${id}`).query({ shouldReturnTasks }).set('Content-Type', 'application/json');
  }

  public async updateResource(id: string, body: Record<string, unknown>): Promise<supertest.Response> {
    return supertest.agent(this.app).put(`/jobs/${id}`).set('Content-Type', 'application/json').send(body);
  }

  public async createResource(body: Record<string, unknown>): Promise<supertest.Response> {
    return supertest.agent(this.app).post(`/jobs`).set('Content-Type', 'application/json').send(body);
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
