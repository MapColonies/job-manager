import httpStatusCodes from 'http-status-codes';
import { getContainerConfig, resetContainer } from '../testContainerConfig';
import { JobRepository } from '../../../src/DAL/repositories/jobRepository';
import { JobEntity } from '../../../src/DAL/entity/job';
import {
  registerRepository,
  initTypeOrmMocks,
  RepositoryMocks,
  queryRunnerMocks,
  betweenMock,
  lessThanOrEqualMock,
  moreThanOrEqualMock,
} from '../../mocks/DBMock';
import { getApp } from '../../../src/app';
import { FindJobsResponse, IAvailableActions, IGetJobResponse } from '../../../src/common/dataModels/jobs';
import { TaskRepository } from '../../../src/DAL/repositories/taskRepository';
import { OperationStatus } from '../../../src/common/dataModels/enums';
import { TaskEntity } from '../../../src/DAL/entity/task';
import { ResponseCodes } from '../../../src/common/constants';
import { JobManager } from '../../../src/jobs/models/jobManager';
import { JobsRequestSender, SearchJobsParams } from './helpers/jobsRequestSender';

let jobRepositoryMocks: RepositoryMocks;
let taskRepositoryMocks: RepositoryMocks;
function createJobDataForFind(): unknown {
  const taskModel = {
    jobId: 'jobId',
    id: 'taskId',
    description: '1',
    parameters: {
      a: 2,
    },
    reason: '3',
    percentage: 4,
    type: '5',
    status: OperationStatus.IN_PROGRESS,
    created: new Date(Date.UTC(2000, 1, 2)).toISOString(),
    updated: new Date(Date.UTC(2000, 1, 2)).toISOString(),
    attempts: 0,
    resettable: true,
  };
  const jobModel = {
    id: 'jobId',
    resourceId: '11',
    version: '12',
    description: '13',
    domain: '',
    parameters: {
      d: 14,
    },
    status: OperationStatus.PENDING,
    reason: '15',
    type: '16',
    percentage: 17,
    tasks: [taskModel],
    created: new Date(Date.UTC(2000, 1, 2)).toISOString(),
    updated: new Date(Date.UTC(2000, 1, 2)).toISOString(),
    isCleaned: false,
    taskCount: 0,
    completedTasks: 0,
    failedTasks: 0,
    expiredTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    abortedTasks: 0,
    priority: 1000,
    expirationDate: new Date(Date.UTC(2000, 1, 2)).toISOString(),
    internalId: '170dd8c0-8bad-498b-bb26-671dcf19aa3c',
    producerName: 'producerName',
    productName: 'productName',
    productType: 'productType',
    additionalIdentifiers: '',
    availableActions: {
      isAbortable: true,
      isResumable: false,
    },
  };

  return jobModel;
}

function createJobDataForGetJob(): unknown {
  const taskModel = {
    jobId: '170dd8c0-8bad-498b-bb26-671dcf19aa3c',
    id: 'taskId',
    description: '1',
    parameters: {
      a: 2,
    },
    reason: '3',
    percentage: 4,
    type: '5',
    status: OperationStatus.IN_PROGRESS,
    created: new Date(Date.UTC(2000, 1, 2)).toISOString(),
    updated: new Date(Date.UTC(2000, 1, 2)).toISOString(),
    attempts: 0,
    resettable: true,
  };
  const jobModel = {
    id: '170dd8c0-8bad-498b-bb26-671dcf19aa3c',
    resourceId: '11',
    version: '12',
    description: '13',
    domain: '',
    parameters: {
      d: 14,
    },
    status: OperationStatus.PENDING,
    reason: '15',
    type: '16',
    percentage: 17,
    tasks: [taskModel],
    created: new Date(Date.UTC(2000, 1, 2)).toISOString(),
    updated: new Date(Date.UTC(2000, 1, 2)).toISOString(),
    isCleaned: false,
    taskCount: 0,
    completedTasks: 0,
    failedTasks: 0,
    expiredTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    abortedTasks: 0,
    priority: 1000,
    expirationDate: new Date(Date.UTC(2000, 1, 2)).toISOString(),
    internalId: '170dd8c0-8bad-498b-bb26-671dcf19aa3c',
    producerName: 'producerName',
    productName: 'productName',
    productType: 'productType',
    additionalIdentifiers: '',
    availableActions: {
      isAbortable: true,
      isResumable: false,
    },
  };

  return jobModel;
}

function jobModelToEntity(jobModel: unknown): JobEntity {
  const model = jobModel as {
    created: string;
    updated: string;
    tasks: {
      created: string;
      updated: string;
    }[];
  };
  const cleanedTasks: unknown[] = [];
  model.tasks.forEach((task) => {
    const cleanTask = { ...task, creationTime: new Date(task.created), updateTime: new Date(task.updated) } as { created?: string; updated?: string };
    delete cleanTask.created;
    delete cleanTask.updated;
    cleanedTasks.push(cleanTask);
  });
  const cleanedModel = { ...model, tasks: cleanedTasks } as { created?: string; updated?: string };
  delete cleanedModel.created;
  delete cleanedModel.updated;
  const jobEntity = {
    ...(cleanedModel as unknown as JobEntity),
    creationTime: new Date(model.created),
    updateTime: new Date(model.updated),
    tasks: cleanedTasks as TaskEntity[],
  };

  return jobEntity;
}
describe('job', function () {
  let requestSender: JobsRequestSender;
  beforeEach(function () {
    initTypeOrmMocks();

    const app = getApp({
      override: [...getContainerConfig()],
      useChild: false,
    });
    jobRepositoryMocks = registerRepository(JobRepository, new JobRepository());
    taskRepositoryMocks = registerRepository(TaskRepository, new TaskRepository());
    requestSender = new JobsRequestSender(app);
  });
  afterEach(function () {
    resetContainer();
    jest.resetAllMocks();
  });

  describe('Happy Path', function () {
    describe('createJob', () => {
      it('should create job with tasks and return status code 201 and the created job and tasks ids', async function () {
        const createTaskModel1 = {
          description: '1',
          parameters: {
            a: 2,
          },
          reason: '3',
          percentage: 4,
          type: '5',
        };
        const createTaskModel2 = {
          description: '6',
          parameters: {
            b: 7,
          },
          reason: '8',
          percentage: 9,
          type: '10',
          status: 'In-Progress',
        };
        const createJobReq = {
          resourceId: '11',
          version: '12',
          description: '13',
          parameters: {
            d: 14,
          },
          status: 'Pending',
          reason: '15',
          type: '16',
          percentage: 17,
          tasks: [createTaskModel1, createTaskModel2],
        };
        const createJobModel = {
          ...createJobReq,
          tasks: [
            { ...createTaskModel1, blockDuplication: false },
            { ...createTaskModel2, blockDuplication: false },
          ],
        };
        const createJobRes = {
          id: 'jobId',
          taskIds: ['taskId1', 'taskId2'],
        };
        const jobEntity = {
          ...createJobModel,
          id: 'jobId',
          domain: '',
          tasks: [
            { ...createTaskModel1, jobId: 'jobId', id: 'taskId1', blockDuplication: false },
            { ...createTaskModel2, jobId: 'jobId', id: 'taskId2', blockDuplication: false },
          ],
        } as unknown as JobEntity;

        const jobSaveMock = jobRepositoryMocks.saveMock;
        jobSaveMock.mockResolvedValue(jobEntity);

        const response = await requestSender.createResource(createJobReq);

        expect(response.status).toBe(httpStatusCodes.CREATED);
        expect(jobSaveMock).toHaveBeenCalledTimes(1);
        expect(jobSaveMock).toHaveBeenCalledWith(createJobModel);

        const body = response.body as unknown;
        expect(body).toEqual(createJobRes);
        expect(response).toSatisfyApiSpec();
      });

      it('should create job without tasks and return status code 201 and the created job', async function () {
        const createJobModel = {
          resourceId: '11',
          version: '12',
          description: '13',
          parameters: {
            d: 14,
          },
          status: 'Pending',
          reason: '15',
          type: '16',
          percentage: 17,
          domain: '',
        };
        const createJobRes = {
          id: 'jobId',
          taskIds: [],
        };
        const jobEntity = { ...createJobModel, id: 'jobId', tasks: [] } as unknown as JobEntity;

        const jobSaveMock = jobRepositoryMocks.saveMock;
        jobSaveMock.mockResolvedValue(jobEntity);

        const response = await requestSender.createResource(createJobModel);

        expect(response.status).toBe(httpStatusCodes.CREATED);
        expect(jobSaveMock).toHaveBeenCalledTimes(1);
        expect(jobSaveMock).toHaveBeenCalledWith(createJobModel);

        const body = response.body as unknown;
        expect(body).toEqual(createJobRes);
        expect(response).toSatisfyApiSpec();
      });
    });

    describe('findJob', () => {
      it('should get all jobs and return 200 with tasks', async function () {
        const jobModel = createJobDataForFind();
        const jobEntity = jobModelToEntity(jobModel);
        const jobsFindMock = jobRepositoryMocks.findMock;
        jobsFindMock.mockResolvedValue([jobEntity]);

        const response = await requestSender.getResources();

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(jobsFindMock).toHaveBeenCalledTimes(1);
        expect(jobsFindMock).toHaveBeenCalledWith({ relations: ['tasks'], where: {} });

        const jobs = response.body as unknown;
        expect(jobs).toEqual([jobModel]);
        expect(response).toSatisfyApiSpec();
      });

      it('should get all jobs and return 200 with tasks & available actions', async function () {
        const jobModel = createJobDataForFind();
        const jobEntity = jobModelToEntity(jobModel);
        const jobsFindMock = jobRepositoryMocks.findMock;
        jobRepositoryMocks.queryMock.mockResolvedValue([{ unResettableTasks: '1', failedTasks: '3' }]);
        const findJobsSpy = jest.spyOn(JobManager.prototype, 'findJobs');
        jobsFindMock.mockResolvedValue([jobEntity]);
        const expectedAvailableActions: IAvailableActions = {
          isAbortable: true,
          isResumable: false,
        };

        const response = await requestSender.getResources({ availableActions: true });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(jobsFindMock).toHaveBeenCalledTimes(1);

        const jobs = response.body as FindJobsResponse;
        expect(jobs).toEqual([jobModel]);
        expect(findJobsSpy).toHaveBeenCalledWith({ shouldReturnTasks: true, availableActions: true });
        expect(Object.keys(jobs[0])).toContain('availableActions');
        expect(jobs[0].availableActions).toEqual(expectedAvailableActions);
        expect(response).toSatisfyApiSpec();
        findJobsSpy.mockRestore();
      });

      it('should get all jobs and return 200 without available actions', async function () {
        const jobModel = createJobDataForFind();
        const jobEntity = jobModelToEntity(jobModel);
        const jobsFindMock = jobRepositoryMocks.findMock;
        jobRepositoryMocks.queryMock.mockResolvedValue([{ unResettableTasks: '1', failedTasks: '3' }]);
        const findJobsSpy = jest.spyOn(JobManager.prototype, 'findJobs');
        jobsFindMock.mockResolvedValue([jobEntity]);

        const response = await requestSender.getResources({ availableActions: true });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(jobsFindMock).toHaveBeenCalledTimes(1);

        const jobs = response.body as FindJobsResponse;
        delete (jobModel as IGetJobResponse).availableActions;
        delete jobs[0].availableActions;
        expect(jobs).toEqual([jobModel]);
        expect(findJobsSpy).toHaveBeenCalledWith({ shouldReturnTasks: true, availableActions: true });
        expect(Object.keys(jobs[0])).not.toContain('availableActions');
        expect(response).toSatisfyApiSpec();
        findJobsSpy.mockRestore();
      });

      it('should get the job by internal id and return 200 with tasks', async function () {
        const jobModel = createJobDataForFind();
        const jobEntity = jobModelToEntity(jobModel);
        const jobsFindMock = jobRepositoryMocks.findMock;
        const parmas: SearchJobsParams = { internalId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' };
        jobsFindMock.mockResolvedValue([jobEntity]);

        const response = await requestSender.getResources({ ...parmas });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(jobsFindMock).toHaveBeenCalledTimes(1);
        expect(jobsFindMock).toHaveBeenCalledWith({ relations: ['tasks'], where: parmas });

        const jobs = response.body as unknown;
        expect(jobs).toEqual([jobModel]);
        expect(response).toSatisfyApiSpec();
      });

      it('should limit job by fromDate', async function () {
        const jobModel = createJobDataForFind();
        const jobEntity = jobModelToEntity(jobModel);

        const jobsFindMock = jobRepositoryMocks.findMock;
        moreThanOrEqualMock.mockReturnValue('moreThanOrEqualMock');
        jobsFindMock.mockResolvedValue([jobEntity]);

        const response = await requestSender.getResources({ fromDate: '2000-01-01T00:00:00Z' });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(jobsFindMock).toHaveBeenCalledTimes(1);
        expect(jobsFindMock).toHaveBeenCalledWith({
          where: { updateTime: 'moreThanOrEqualMock' },
          relations: ['tasks'],
        });
        expect(moreThanOrEqualMock).toHaveBeenCalledTimes(1);
        expect(moreThanOrEqualMock).toHaveBeenCalledWith('2000-01-01T00:00:00Z');
        expect(lessThanOrEqualMock).toHaveBeenCalledTimes(0);
        expect(betweenMock).toHaveBeenCalledTimes(0);

        const jobs = response.body as unknown;
        expect(jobs).toEqual([jobModel]);
        expect(response).toSatisfyApiSpec();
      });

      it('should limit job by tillDate', async function () {
        const jobModel = createJobDataForFind();
        const jobEntity = jobModelToEntity(jobModel);

        const jobsFindMock = jobRepositoryMocks.findMock;
        lessThanOrEqualMock.mockReturnValue('lessThanOrEqualMock');
        jobsFindMock.mockResolvedValue([jobEntity]);

        const response = await requestSender.getResources({ tillDate: '2000-01-01T00:00:00Z' });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(jobsFindMock).toHaveBeenCalledTimes(1);
        expect(jobsFindMock).toHaveBeenCalledWith({
          where: { updateTime: 'lessThanOrEqualMock' },
          relations: ['tasks'],
        });
        expect(moreThanOrEqualMock).toHaveBeenCalledTimes(0);
        expect(lessThanOrEqualMock).toHaveBeenCalledTimes(1);
        expect(lessThanOrEqualMock).toHaveBeenCalledWith('2000-01-01T00:00:00Z');
        expect(betweenMock).toHaveBeenCalledTimes(0);

        const jobs = response.body as unknown;
        expect(jobs).toEqual([jobModel]);
        expect(response).toSatisfyApiSpec();
      });

      it('should limit job by fromDate and url encoded tillDate', async function () {
        const jobModel = createJobDataForFind();
        const jobEntity = jobModelToEntity(jobModel);

        const jobsFindMock = jobRepositoryMocks.findMock;
        betweenMock.mockReturnValue('betweenMock');
        jobsFindMock.mockResolvedValue([jobEntity]);

        const response = await requestSender.getResources({ fromDate: '2000-01-01T00:00:00Z', tillDate: encodeURIComponent('2000-01-01T00:00:00Z') });
        expect(response.status).toBe(httpStatusCodes.OK);
        expect(jobsFindMock).toHaveBeenCalledTimes(1);
        expect(jobsFindMock).toHaveBeenCalledWith({
          where: { updateTime: 'betweenMock' },
          relations: ['tasks'],
        });
        expect(moreThanOrEqualMock).toHaveBeenCalledTimes(0);
        expect(lessThanOrEqualMock).toHaveBeenCalledTimes(0);
        expect(betweenMock).toHaveBeenCalledTimes(1);
        expect(betweenMock).toHaveBeenCalledWith('2000-01-01T00:00:00Z', '2000-01-01T00:00:00Z');

        const jobs = response.body as unknown;
        expect(jobs).toEqual([jobModel]);
        expect(response).toSatisfyApiSpec();
      });

      it('should not find filtered jobs and return 200', async function () {
        const filter = {
          isCleaned: true,
          resourceId: '1',
          status: 'Pending',
          type: '2',
          version: '3',
        };

        const jobsFindMock = jobRepositoryMocks.findMock;
        jobsFindMock.mockResolvedValue([] as JobEntity[]);

        const response = await requestSender.getResources(filter);
        expect(response.body).toEqual([]);
        expect(response.status).toBe(httpStatusCodes.OK);
        expect(jobsFindMock).toHaveBeenCalledTimes(1);
        expect(jobsFindMock).toHaveBeenCalledWith({ relations: ['tasks'], where: filter });
        expect(response).toSatisfyApiSpec();
      });
    });

    describe('getJob', () => {
      it('should get specific job and return 200', async function () {
        const jobModel = createJobDataForGetJob();
        const jobEntity = jobModelToEntity(jobModel);

        const jobsFinOneMock = jobRepositoryMocks.findOneMock;
        jobsFinOneMock.mockResolvedValue(jobEntity);

        const response = await requestSender.getResource('170dd8c0-8bad-498b-bb26-671dcf19aa3c');

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(jobsFinOneMock).toHaveBeenCalledTimes(1);
        expect(jobsFinOneMock).toHaveBeenCalledWith('170dd8c0-8bad-498b-bb26-671dcf19aa3c', {
          relations: ['tasks'],
        });

        const job = response.body as unknown;
        expect(job).toEqual(jobModel);
        expect(response).toSatisfyApiSpec();
      });

      it('should get specific job and return 200 No Tasks', async function () {
        const jobModel = createJobDataForGetJob();
        const jobEntity = jobModelToEntity(jobModel);
        const jobsFinOneMock = jobRepositoryMocks.findOneMock;
        delete jobEntity.tasks;
        jobsFinOneMock.mockResolvedValue(jobEntity);

        const response = await requestSender.getResource('170dd8c0-8bad-498b-bb26-671dcf19aa3c', false);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(jobsFinOneMock).toHaveBeenCalledTimes(1);
        expect(jobsFinOneMock).toHaveBeenCalledWith('170dd8c0-8bad-498b-bb26-671dcf19aa3c');

        const job = response.body as unknown;

        delete (jobModel as JobEntity).tasks;
        expect(job).toEqual(jobModel);
        expect(response).toSatisfyApiSpec();
      });

      it('should get specific job and return 200 with the available actions', async function () {
        const jobModel = createJobDataForGetJob();
        const jobEntity = jobModelToEntity(jobModel);
        const jobsFindOneMock = jobRepositoryMocks.findOneMock;
        jobRepositoryMocks.queryMock.mockResolvedValue([{ unResettableTasks: '1', failedTasks: '3' }]);
        const getJobSpy = jest.spyOn(JobManager.prototype, 'getJob');
        delete jobEntity.tasks;
        jobsFindOneMock.mockResolvedValue(jobEntity);
        const expectedAvailableActions: IAvailableActions = {
          isAbortable: true,
          isResumable: false,
        };

        const response = await requestSender.getResource('170dd8c0-8bad-498b-bb26-671dcf19aa3c', false, true);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(jobsFindOneMock).toHaveBeenCalledTimes(1);
        expect(jobsFindOneMock).toHaveBeenCalledWith('170dd8c0-8bad-498b-bb26-671dcf19aa3c');

        const job = response.body as IGetJobResponse;

        delete (jobModel as JobEntity).tasks;
        expect(job).toEqual(jobModel);
        expect(getJobSpy).toHaveBeenCalledWith(
          { jobId: '170dd8c0-8bad-498b-bb26-671dcf19aa3c' },
          { shouldReturnTasks: false, availableActions: true }
        );
        expect(Object.keys(job)).toContain('availableActions');
        expect(job.availableActions).toEqual(expectedAvailableActions);
        expect(response).toSatisfyApiSpec();
        getJobSpy.mockRestore();
      });

      it('should get specific job and return 200 without the available actions', async function () {
        const jobModel = createJobDataForGetJob();
        const jobEntity = jobModelToEntity(jobModel);
        const jobsFindOneMock = jobRepositoryMocks.findOneMock;
        jobRepositoryMocks.queryMock.mockResolvedValue([{ unResettableTasks: '1', failedTasks: '3' }]);
        const getJobSpy = jest.spyOn(JobManager.prototype, 'getJob');
        delete jobEntity.tasks;
        jobsFindOneMock.mockResolvedValue(jobEntity);

        const response = await requestSender.getResource('170dd8c0-8bad-498b-bb26-671dcf19aa3c', false, false);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(jobsFindOneMock).toHaveBeenCalledTimes(1);
        expect(jobsFindOneMock).toHaveBeenCalledWith('170dd8c0-8bad-498b-bb26-671dcf19aa3c');

        const job = response.body as IGetJobResponse;

        delete (jobModel as JobEntity).tasks;
        delete (jobModel as IGetJobResponse).availableActions;
        delete job.availableActions;
        expect(job).toEqual(jobModel);
        expect(getJobSpy).toHaveBeenCalledWith(
          { jobId: '170dd8c0-8bad-498b-bb26-671dcf19aa3c' },
          { shouldReturnTasks: false, availableActions: false }
        );
        expect(Object.keys(job)).not.toContain('availableActions');
        expect(response).toSatisfyApiSpec();
        getJobSpy.mockRestore();
      });

      it('should update job status and return 200', async function () {
        const jobCountMock = jobRepositoryMocks.countMock;
        const jobSaveMock = jobRepositoryMocks.saveMock;

        jobCountMock.mockResolvedValue(1);
        jobSaveMock.mockResolvedValue({});

        const response = await requestSender.updateResource('170dd8c0-8bad-498b-bb26-671dcf19aa3c', {
          status: 'In-Progress',
        });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toEqual({ code: ResponseCodes.JOB_UPDATED });
        expect(jobSaveMock).toHaveBeenCalledTimes(1);
        expect(jobSaveMock).toHaveBeenCalledWith({
          id: '170dd8c0-8bad-498b-bb26-671dcf19aa3c',
          status: 'In-Progress',
        });
        expect(response).toSatisfyApiSpec();
      });

      it('should delete job without tasks and return 200', async function () {
        const jobDeleteMock = jobRepositoryMocks.deleteMock;
        const jobCountMock = jobRepositoryMocks.countMock;
        jobDeleteMock.mockResolvedValue({});
        jobCountMock.mockResolvedValue(1);

        const response = await requestSender.deleteResource('170dd8c0-8bad-498b-bb26-671dcf19aa3c');
        expect(response.body).toEqual({ code: ResponseCodes.JOB_DELETED });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(jobDeleteMock).toHaveBeenCalledTimes(1);
        expect(jobDeleteMock).toHaveBeenCalledWith('170dd8c0-8bad-498b-bb26-671dcf19aa3c');
        expect(response).toSatisfyApiSpec();
      });
    });

    describe('resettable', () => {
      it('returns 200 and true when job is resettable', async () => {
        jobRepositoryMocks.queryMock.mockResolvedValue([{ unResettableTasks: '0', failedTasks: '1' }]);
        const id = 'dabf6137-8160-4b62-9110-2d1c1195398b';

        const res = await requestSender.resettable(id);
        expect(res.status).toBe(httpStatusCodes.OK);
        expect(res.body).toEqual({ jobId: id, isResettable: true });
        expect(jobRepositoryMocks.queryMock).toHaveBeenCalledTimes(1);
        expect(res).toSatisfyApiSpec();
      });

      it('returns 200 and false when job has un-resettable task', async () => {
        jobRepositoryMocks.queryMock.mockResolvedValue([{ unResettableTasks: '1', failedTasks: '1' }]);
        const id = 'dabf6137-8160-4b62-9110-2d1c1195398b';

        const res = await requestSender.resettable(id);
        expect(res.status).toBe(httpStatusCodes.OK);
        expect(res.body).toEqual({ jobId: id, isResettable: false });
        expect(jobRepositoryMocks.queryMock).toHaveBeenCalledTimes(1);
        expect(res).toSatisfyApiSpec();
      });

      it('returns 200 and false when job has no failed tasks', async () => {
        jobRepositoryMocks.queryMock.mockResolvedValue([{ unResettableTasks: '0', failedTasks: '0' }]);
        const id = 'dabf6137-8160-4b62-9110-2d1c1195398b';

        const res = await requestSender.resettable(id);
        expect(res.status).toBe(httpStatusCodes.OK);
        expect(res.body).toEqual({ jobId: id, isResettable: false });
        expect(jobRepositoryMocks.queryMock).toHaveBeenCalledTimes(1);
        expect(res).toSatisfyApiSpec();
      });

      it('returns 200 and false when no matching job is returned', async () => {
        jobRepositoryMocks.queryMock.mockResolvedValue([]);
        const id = 'dabf6137-8160-4b62-9110-2d1c1195398b';

        const res = await requestSender.resettable(id);

        expect(res.status).toBe(httpStatusCodes.OK);
        expect(res.body).toEqual({ jobId: id, isResettable: false });
        expect(jobRepositoryMocks.queryMock).toHaveBeenCalledTimes(1);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('reset', () => {
      it('returns 200 and reset job when job is resettable', async () => {
        jobRepositoryMocks.queryMock.mockResolvedValue([{ unResettableTasks: '0', failedTasks: '3' }]);
        jobRepositoryMocks.countMock.mockResolvedValue(1);
        const id = 'ebd585a2-b218-4b0f-8b58-7df27b5f5a4b';

        const body = {
          newExpirationDate: undefined,
        };
        const res = await requestSender.reset(id, body);

        expect(res.status).toBe(httpStatusCodes.OK);
        expect(res.body).toEqual({ code: ResponseCodes.JOB_RESET });

        expect(queryRunnerMocks.connect).toHaveBeenCalledTimes(1);
        expect(queryRunnerMocks.startTransaction).toHaveBeenCalledTimes(1);
        expect(queryRunnerMocks.manager.getCustomRepository).toHaveBeenCalledTimes(2);
        expect(queryRunnerMocks.commitTransaction).toHaveBeenCalledTimes(1);
        expect(queryRunnerMocks.rollbackTransaction).toHaveBeenCalledTimes(0);
        expect(queryRunnerMocks.release).toHaveBeenCalledTimes(1);
        expect(jobRepositoryMocks.queryMock).toHaveBeenCalledTimes(1);
        expect(jobRepositoryMocks.saveMock).toHaveBeenCalledTimes(1);
        expect(jobRepositoryMocks.countMock).toHaveBeenCalledTimes(1);
        expect(taskRepositoryMocks.queryBuilder.execute).toHaveBeenCalledTimes(1);
        expect(res).toSatisfyApiSpec();
      });
    });
  });

  describe('Bad Path', function () {
    it('should return status code 400 on PUT request with invalid body', async function () {
      const jobCountMock = jobRepositoryMocks.countMock;

      const response = await requestSender.updateResource('170dd8c0-8bad-498b-bb26-671dcf19aa3c', {
        invalidFiled: 'test',
      });

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(jobCountMock).toHaveBeenCalledTimes(0);
      expect(response).toSatisfyApiSpec();
    });

    it('should return status code 400 on POST request with invalid body', async function () {
      const jobCountMock = jobRepositoryMocks.countMock;
      const response = await requestSender.createResource({
        id: 'invalidFiled',
      });

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(jobCountMock).toHaveBeenCalledTimes(0);
      expect(response).toSatisfyApiSpec();
    });

    describe('reset', () => {
      it('returns 400 when job is not resettable', async () => {
        jobRepositoryMocks.queryMock.mockResolvedValue([{ unResettableTasks: '1', failedTasks: '3' }]);
        const id = 'dabf6137-8160-4b62-9110-2d1c1195398b';

        const body = {
          newExpirationDate: undefined,
        };
        const res = await requestSender.reset(id, body);

        expect(res.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(queryRunnerMocks.connect).toHaveBeenCalledTimes(1);
        expect(queryRunnerMocks.startTransaction).toHaveBeenCalledTimes(1);
        expect(queryRunnerMocks.manager.getCustomRepository).toHaveBeenCalledTimes(1);
        expect(queryRunnerMocks.commitTransaction).toHaveBeenCalledTimes(0);
        expect(queryRunnerMocks.rollbackTransaction).toHaveBeenCalledTimes(1);
        expect(queryRunnerMocks.release).toHaveBeenCalledTimes(1);
        expect(jobRepositoryMocks.queryMock).toHaveBeenCalledTimes(1);
        expect(jobRepositoryMocks.queryBuilder.execute).toHaveBeenCalledTimes(0);
        expect(taskRepositoryMocks.queryBuilder.execute).toHaveBeenCalledTimes(0);
        expect(res).toSatisfyApiSpec();
      });
    });
  });

  describe('Sad Path', function () {
    it('should return status code 404 on GET request for non existing job', async function () {
      const jobsFindOneMock = jobRepositoryMocks.findOneMock;
      jobsFindOneMock.mockResolvedValue(undefined);

      const response = await requestSender.getResource('170dd8c0-8bad-498b-bb26-671dcf19aa3c');

      expect(jobsFindOneMock).toHaveBeenCalledTimes(1);
      expect(jobsFindOneMock).toHaveBeenCalledWith('170dd8c0-8bad-498b-bb26-671dcf19aa3c', {
        relations: ['tasks'],
      });
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response).toSatisfyApiSpec();
    });

    it('should return status code 404 on PUT request for non existing job', async function () {
      const jobCountMock = jobRepositoryMocks.countMock;
      const jobSaveMock = jobRepositoryMocks.saveMock;
      jobCountMock.mockResolvedValue(0);

      const response = await requestSender.updateResource('170dd8c0-8bad-498b-bb26-671dcf19aa3c', {
        status: 'Pending',
      });

      expect(jobCountMock).toHaveBeenCalledTimes(1);
      expect(jobCountMock).toHaveBeenCalledWith({
        id: '170dd8c0-8bad-498b-bb26-671dcf19aa3c',
      });
      expect(jobSaveMock).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response).toSatisfyApiSpec();
    });

    it('should return status code 404 on DELETE request for non existing job', async function () {
      const jobCountMock = jobRepositoryMocks.countMock;
      const jobDeleteMock = jobRepositoryMocks.deleteMock;
      jobCountMock.mockResolvedValue(0);

      const response = await requestSender.deleteResource('170dd8c0-8bad-498b-bb26-671dcf19aa3c');

      expect(jobCountMock).toHaveBeenCalledTimes(1);
      expect(jobCountMock).toHaveBeenCalledWith({
        id: '170dd8c0-8bad-498b-bb26-671dcf19aa3c',
      });
      expect(jobDeleteMock).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response).toSatisfyApiSpec();
    });

    it('should return status code 422 on DELETE request for job with tasks', async function () {
      const jobCountMock = jobRepositoryMocks.countMock;
      const jobDeleteMock = jobRepositoryMocks.deleteMock;
      jobCountMock.mockResolvedValue(1);
      jobDeleteMock.mockRejectedValue({
        code: '23503',
      });

      const response = await requestSender.deleteResource('170dd8c0-8bad-498b-bb26-671dcf19aa3c');

      expect(jobCountMock).toHaveBeenCalledTimes(1);
      expect(jobCountMock).toHaveBeenCalledWith({
        id: '170dd8c0-8bad-498b-bb26-671dcf19aa3c',
      });
      expect(jobDeleteMock).toHaveBeenCalledTimes(1);
      expect(jobDeleteMock).toHaveBeenCalledWith('170dd8c0-8bad-498b-bb26-671dcf19aa3c');
      expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(response).toSatisfyApiSpec();
    });

    describe('reset', () => {
      it('rollback transaction when updating tasks throws error', async () => {
        jobRepositoryMocks.queryMock.mockResolvedValue([{ unResettableTasks: '0', failedTasks: '3' }]);
        jobRepositoryMocks.countMock.mockResolvedValue(1);
        taskRepositoryMocks.queryBuilder.execute.mockRejectedValue(new Error('db test error'));
        const id = 'dabf6137-8160-4b62-9110-2d1c1195398b';

        const body = {
          newExpirationDate: undefined,
        };
        const res = await requestSender.reset(id, body);

        expect(res.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(queryRunnerMocks.connect).toHaveBeenCalledTimes(1);
        expect(queryRunnerMocks.startTransaction).toHaveBeenCalledTimes(1);
        expect(queryRunnerMocks.manager.getCustomRepository).toHaveBeenCalledTimes(2);
        expect(queryRunnerMocks.commitTransaction).toHaveBeenCalledTimes(0);
        expect(queryRunnerMocks.rollbackTransaction).toHaveBeenCalledTimes(1);
        expect(queryRunnerMocks.release).toHaveBeenCalledTimes(1);
        expect(jobRepositoryMocks.queryMock).toHaveBeenCalledTimes(1);
        expect(jobRepositoryMocks.saveMock).toHaveBeenCalledTimes(1);
        expect(taskRepositoryMocks.queryBuilder.execute).toHaveBeenCalledTimes(1);
        expect(res).toSatisfyApiSpec();
      });
    });
  });
});
