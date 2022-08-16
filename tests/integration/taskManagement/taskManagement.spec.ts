import httpStatusCodes from 'http-status-codes';
import { getContainerConfig, resetContainer } from '../testContainerConfig';
import { getApp } from '../../../src/app';
import { TaskRepository } from '../../../src/DAL/repositories/taskRepository';
import { JobRepository } from '../../../src/DAL/repositories/jobRepository';
import { registerRepository, initTypeOrmMocks, RepositoryMocks } from '../../mocks/DBMock';
import { OperationStatus } from '../../../src/common/dataModels/enums';
import { TaskEntity } from '../../../src/DAL/entity/task';
import { IGetTaskResponse } from '../../../src/common/dataModels/tasks';
import { ResponseCodes } from '../../../src/common/constants';
import { JobEntity } from '../../../src/DAL/entity/job';
import { TaskManagementRequestSender } from './helpers/taskManagementRequestSender';

let taskRepositoryMocks: RepositoryMocks;
let jobRepositoryMocks: RepositoryMocks;
const jobId = '170dd8c0-8bad-498b-bb26-671dcf19aa3c';
const taskId = 'e1b051bf-e12e-4c1f-a257-f9de2de8bbfb';
let taskRepositoryMock: TaskRepository;
let jobRepositoryMock: JobRepository;

function convertTaskResponseToEntity(response: IGetTaskResponse): TaskEntity {
  const cleanResponse = { ...response, creationTime: new Date(response.created), updateTime: new Date(response.updated) } as {
    created?: Date;
    updated?: Date;
  };
  delete cleanResponse.created;
  delete cleanResponse.updated;
  return cleanResponse as TaskEntity;
}

describe('tasks', function () {
  let requestSender: TaskManagementRequestSender;
  beforeEach(function () {
    initTypeOrmMocks();

    const app = getApp({
      override: [...getContainerConfig()],
      useChild: false,
    });
    taskRepositoryMock = new TaskRepository();
    taskRepositoryMocks = registerRepository(TaskRepository, taskRepositoryMock);
    jobRepositoryMock = new JobRepository();
    jobRepositoryMocks = registerRepository(JobRepository, jobRepositoryMock);
    requestSender = new TaskManagementRequestSender(app);
  });
  afterEach(function () {
    resetContainer();
    jest.resetAllMocks();
  });

  describe('start pending', () => {
    describe('Happy Path', () => {
      it('should return started task and status 200', async function () {
        const taskEntity = {
          jobId: jobId,
          job: {} as JobEntity,
          id: taskId,
          description: '1',
          parameters: {
            a: 2,
          },
          reason: '3',
          percentage: 4,
          type: '5',
          status: OperationStatus.IN_PROGRESS,
          creationTime: new Date(Date.UTC(2000, 1, 2)),
          updateTime: new Date(Date.UTC(2000, 1, 2)),
          attempts: 0,
          resettable: true,
        } as unknown as TaskEntity;

        taskRepositoryMocks.queryMock.mockResolvedValue([[taskEntity], 1]);

        const response = await requestSender.retrieveAndStart('testType', '5');

        expect(taskRepositoryMocks.queryMock).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(httpStatusCodes.OK);

        const taskResponse = convertTaskResponseToEntity(response.body as IGetTaskResponse);
        expect(taskResponse).toEqual(taskEntity);
        expect(response).toSatisfyApiSpec();
      });
    });

    describe('Sad Path', () => {
      it('should return status 404 when no pending tasks are available', async function () {
        taskRepositoryMocks.queryMock.mockResolvedValue([[], 0]);

        const response = await requestSender.retrieveAndStart('testType', '5');

        expect(taskRepositoryMocks.queryMock).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
        expect(response).toSatisfyApiSpec();
      });
    });
  });

  describe('find inactive tasks', () => {
    describe('Happy Path', () => {
      it('should return list of inactive task - without types', async function () {
        const req = {
          inactiveTimeSec: 500,
        };
        const taskIds = ['6716ddc8-40fb-41b2-bf1d-5c433fe4728f'];
        const dbFindInactiveTasks = jest.fn();
        taskRepositoryMock.findInactiveTasks = dbFindInactiveTasks;
        dbFindInactiveTasks.mockResolvedValue(taskIds);

        const response = await requestSender.findInactive(req);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toEqual(taskIds);
        expect(dbFindInactiveTasks).toHaveBeenCalledTimes(1);
        expect(dbFindInactiveTasks).toHaveBeenCalledWith(req);
        expect(response).toSatisfyApiSpec();
      });

      it('should return list of inactive task - with types', async function () {
        const req = {
          inactiveTimeSec: 500,
          types: [
            {
              jodType: 'jbType',
              taskType: 'tkType',
            },
          ],
        };
        const taskIds = ['6716ddc8-40fb-41b2-bf1d-5c433fe4728f'];
        const dbFindInactiveTasks = jest.fn();
        taskRepositoryMock.findInactiveTasks = dbFindInactiveTasks;
        dbFindInactiveTasks.mockResolvedValue(taskIds);

        const response = await requestSender.findInactive(req);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toEqual(taskIds);
        expect(dbFindInactiveTasks).toHaveBeenCalledTimes(1);
        expect(dbFindInactiveTasks).toHaveBeenCalledWith(req);
        expect(response).toSatisfyApiSpec();
      });

      it('should return list of inactive task - with ignored types', async function () {
        const req = {
          inactiveTimeSec: 500,
          ignoredTypes: [
            {
              jodType: 'jbType',
              taskType: 'tkType',
            },
          ],
        };
        const taskIds = ['6716ddc8-40fb-41b2-bf1d-5c433fe4728f'];
        const dbFindInactiveTasks = jest.fn();
        taskRepositoryMock.findInactiveTasks = dbFindInactiveTasks;
        dbFindInactiveTasks.mockResolvedValue(taskIds);

        const response = await requestSender.findInactive(req);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toEqual(taskIds);
        expect(dbFindInactiveTasks).toHaveBeenCalledTimes(1);
        expect(dbFindInactiveTasks).toHaveBeenCalledWith(req);
        expect(response).toSatisfyApiSpec();
      });

      it('should return list of inactive task - with types and ignored types', async function () {
        const req = {
          inactiveTimeSec: 500,
          ignoredTypes: [
            {
              jodType: 'jbType',
              taskType: 'tkType',
            },
          ],
          types: [
            {
              jodType: 'jbType2',
              taskType: 'tkType2',
            },
          ],
        };
        const taskIds = ['6716ddc8-40fb-41b2-bf1d-5c433fe4728f'];
        const dbFindInactiveTasks = jest.fn();
        taskRepositoryMock.findInactiveTasks = dbFindInactiveTasks;
        dbFindInactiveTasks.mockResolvedValue(taskIds);

        const response = await requestSender.findInactive(req);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toEqual(taskIds);
        expect(dbFindInactiveTasks).toHaveBeenCalledTimes(1);
        expect(dbFindInactiveTasks).toHaveBeenCalledWith(req);
        expect(response).toSatisfyApiSpec();
      });
    });
  });

  describe('release inactive tasks', () => {
    describe('Happy Path', () => {
      it('should release inactive tasks', async function () {
        const req = ['6716ddc8-40fb-41b2-bf1d-5c433fe4728f', '2f2ca364-6ce7-4154-a07a-af9ba3970ddf'];
        taskRepositoryMocks.queryBuilder.execute.mockResolvedValue({
          raw: [
            {
              id: '6716ddc8-40fb-41b2-bf1d-5c433fe4728f',
            },
          ],
        });

        const response = await requestSender.releaseInactive(req);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toEqual(['6716ddc8-40fb-41b2-bf1d-5c433fe4728f']);
        expect(taskRepositoryMocks.queryBuilder.execute).toHaveBeenCalledTimes(1);
        expect(response).toSatisfyApiSpec();
      });
    });

    describe('Bad Path', () => {
      it('find inactive tasks with invalid body returns 400', async function () {
        const dbFindInactiveTasks = jest.fn();
        taskRepositoryMock.findInactiveTasks = dbFindInactiveTasks;
        const req = {
          a: 'test',
        };
        const response = await requestSender.findInactive(req);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(dbFindInactiveTasks).toHaveBeenCalledTimes(0);
        expect(response).toSatisfyApiSpec();
      });
    });
  });

  describe('update expired status', () => {
    describe('Happy Path', () => {
      it('should set expired tasks status to expired', async function () {
        const response = await requestSender.updateExpiredStatus();

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(taskRepositoryMocks.queryBuilder.execute).toHaveBeenCalledTimes(1);
        expect(jobRepositoryMocks.queryBuilder.execute).toHaveBeenCalledTimes(1);
        expect(response).toSatisfyApiSpec();
        expect(response.body).toEqual({ code: ResponseCodes.UPDATE_EXPIRED_STATUS });
      });
    });
    describe('Bad Path', () => {
      it('release inactive tasks with invalid body returns 400', async function () {
        const req = {
          a: 'test',
        };
        const response = await requestSender.releaseInactive(req);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(taskRepositoryMocks.queryBuilder.execute).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('abort job and tasks', () => {
    describe('Happy Path', () => {
      it('update job and pending tasks to "Aborted" status', async () => {
        jobRepositoryMocks.countMock.mockResolvedValue(1);

        const response = await requestSender.abortJobAndTasks(jobId);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(jobRepositoryMocks.saveMock).toHaveBeenCalledTimes(1);
        expect(jobRepositoryMocks.saveMock).toHaveBeenCalledWith({ id: jobId, status: OperationStatus.ABORTED });
        expect(taskRepositoryMocks.updateMock).toHaveBeenCalledTimes(1);
        expect(taskRepositoryMocks.updateMock).toHaveBeenCalledWith(
          { jobId: jobId, status: OperationStatus.PENDING },
          { status: OperationStatus.ABORTED }
        );
        expect(response).toSatisfyApiSpec();
        expect(response.body).toEqual({ code: ResponseCodes.JOB_ABORTED });
      });
    });

    describe('Sad Path', () => {
      it('return 404 when job dont exists', async () => {
        jobRepositoryMocks.countMock.mockResolvedValue(0);
        const response = await requestSender.abortJobAndTasks(jobId);

        expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
        expect(jobRepositoryMocks.saveMock).toHaveBeenCalledTimes(0);
        expect(taskRepositoryMocks.updateMock).toHaveBeenCalledTimes(0);
        expect(response).toSatisfyApiSpec();
      });
    });
  });
});
