import httpStatusCodes from 'http-status-codes';
import { NotFoundError } from '@map-colonies/error-types';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import { getContainerConfig, resetContainer } from '../testContainerConfig';
import { TaskRepository } from '../../../src/DAL/repositories/taskRepository';
import { TaskEntity } from '../../../src/DAL/entity/task';
import { registerRepository, initTypeOrmMocks, RepositoryMocks } from '../../mocks/DBMock';
import { JobRepository } from '../../../src/DAL/repositories/jobRepository';
import { ICreateTaskBody, IGetTaskResponse, IGetTasksStatus } from '../../../src/common/dataModels/tasks';
import { IFindTasksRequest } from '../../../src/common/dataModels/tasks';
import { JobEntity } from '../../../src/DAL/entity/job';
import { getApp } from '../../../src/app';
import { ResponseCodes } from '../../../src/common/constants';
import { TasksRequestSender } from './helpers/tasksRequestSender';

let taskRepositoryMocks: RepositoryMocks;
const jobId = '170dd8c0-8bad-498b-bb26-671dcf19aa3c';
const taskId = 'e1b051bf-e12e-4c1f-a257-f9de2de8bbfb';

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
  let requestSender: TasksRequestSender;
  beforeEach(function () {
    initTypeOrmMocks();
    const app = getApp({
      override: [...getContainerConfig()],
      useChild: false,
    });
    taskRepositoryMocks = registerRepository(TaskRepository, new TaskRepository());
    requestSender = new TasksRequestSender(app);
  });
  afterEach(function () {
    resetContainer();
    jest.resetAllMocks();
  });

  describe('Happy Path', function () {
    it('should create task and return status code 201 and the created task id', async function () {
      const createTaskModel = {
        description: '1',
        parameters: {
          a: 2,
        },
        reason: '3',
        percentage: 4,
        type: '5',
      };
      const createTaskRes = {
        id: taskId,
      };
      const taskEntity = {
        ...createTaskModel,
        jobId: jobId,
        id: taskId,
      } as unknown as TaskEntity;

      const taskSaveMock = taskRepositoryMocks.saveMock;
      taskSaveMock.mockResolvedValue(taskEntity);

      const response = await requestSender.createResource(jobId, createTaskModel);
      // TODO: remove the test comment when the following issue will be solved: https://github.com/openapi-library/OpenAPIValidators/issues/257
      // expect(response).toSatisfyApiSpec();

      expect(response.status).toBe(httpStatusCodes.CREATED);
      expect(taskSaveMock).toHaveBeenCalledTimes(1);
      expect(taskSaveMock).toHaveBeenCalledWith({ ...createTaskModel, jobId: jobId, blockDuplication: false });

      const body = response.body as unknown;
      expect(body).toEqual(createTaskRes);
    });

    it('should create multiple tasks and return status code 201 and the created tasks ids', async function () {
      const taskId2 = '6f3669b8-8a65-4581-a127-3d26332635ed';
      const createTaskModel1: ICreateTaskBody = {
        description: '1',
        parameters: {
          a: 2,
        },
        reason: '3',
        percentage: 4,
        type: '5',
        status: OperationStatus.IN_PROGRESS,
        attempts: 0,
      };
      const createTaskModel2: ICreateTaskBody = {
        description: '6',
        parameters: {
          b: 7,
        },
        reason: '8',
        percentage: 9,
        type: '10',
        blockDuplication: true,
      };
      const createTaskRes = {
        ids: [taskId, taskId2],
      };
      const partialTaskEntities = [
        {
          ...createTaskModel1,
          jobId: jobId,
          blockDuplication: false,
        },
        {
          ...createTaskModel2,
          jobId: jobId,
        },
      ] as unknown as TaskEntity[];
      const fullTaskEntities = [
        {
          ...createTaskModel1,
          jobId: jobId,
          id: taskId,
        },
        {
          ...createTaskModel2,
          jobId: jobId,
          id: taskId2,
        },
      ] as unknown as TaskEntity[];

      const taskSaveMock = taskRepositoryMocks.saveMock;
      taskSaveMock.mockResolvedValueOnce(fullTaskEntities[0]).mockResolvedValueOnce(fullTaskEntities[1]);

      const response = await requestSender.createResource(jobId, [createTaskModel1, createTaskModel2]);
      // TODO: remove the test comment when the following issue will be solved: https://github.com/openapi-library/OpenAPIValidators/issues/257
      // expect(response).toSatisfyApiSpec();

      expect(response.status).toBe(httpStatusCodes.CREATED);
      expect(taskSaveMock).toHaveBeenCalledTimes(2);
      expect(taskSaveMock).toHaveBeenNthCalledWith(1, partialTaskEntities[0]);
      expect(taskSaveMock).toHaveBeenNthCalledWith(2, partialTaskEntities[1]);

      const body = response.body as unknown;
      expect(body).toEqual(createTaskRes);
    });

    it('should get all tasks and return 200', async function () {
      const taskEntity = {
        jobId: jobId,
        id: taskId,
        creationTime: new Date(Date.UTC(2000, 1, 2)),
        updateTime: new Date(Date.UTC(2000, 1, 2)),
        attempts: 0,
        description: '1',
        parameters: {
          a: 2,
        },
        reason: '3',
        percentage: 4,
        type: '5',
        status: OperationStatus.IN_PROGRESS,
        resettable: false,
      } as unknown as TaskEntity;

      const taskFindMock = taskRepositoryMocks.findMock;
      taskFindMock.mockResolvedValue([taskEntity]);

      const response = await requestSender.getAllResources(jobId);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(taskFindMock).toHaveBeenCalledTimes(1);
      expect(taskFindMock).toHaveBeenCalledWith({
        where: { jobId: jobId },
      });
      const tasks = response.body as IGetTaskResponse[];
      const entityFromResponse = convertTaskResponseToEntity(tasks[0]);
      expect(entityFromResponse).toEqual(entityFromResponse);

      expect(response).toSatisfyApiSpec();
    });

    it('should get all tasks without parameters and return 200', async function () {
      const taskEntity = {
        jobId: jobId,
        id: taskId,
        creationTime: new Date(Date.UTC(2000, 1, 2)),
        updateTime: new Date(Date.UTC(2000, 1, 2)),
        attempts: 0,
        description: '1',
        reason: '3',
        percentage: 4,
        type: '5',
        status: OperationStatus.IN_PROGRESS,
        resettable: false,
      } as unknown as TaskEntity;

      const taskFindMock = taskRepositoryMocks.findMock;
      taskFindMock.mockResolvedValue([taskEntity]);

      const response = await requestSender.getAllResources(jobId, true);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(taskFindMock).toHaveBeenCalledTimes(1);
      expect(taskFindMock).toHaveBeenCalledWith({
        where: { jobId: jobId },
        select: expect.not.arrayContaining(['parameters']) as string[],
      });
      const tasks = response.body as IGetTaskResponse[];
      const entityFromResponse = convertTaskResponseToEntity(tasks[0]);
      expect(entityFromResponse).not.toHaveProperty('parameters');
      expect(entityFromResponse).toEqual(entityFromResponse);

      expect(response).toSatisfyApiSpec();
    });

    it('should return 200 for job without tasks', async function () {
      const jobsFindMock = taskRepositoryMocks.findMock;
      jobsFindMock.mockResolvedValue([] as TaskEntity[]);

      const response = await requestSender.getAllResources(jobId);
      expect(response).toSatisfyApiSpec();
      expect(response.body).toEqual([]);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(jobsFindMock).toHaveBeenCalledTimes(1);
      expect(jobsFindMock).toHaveBeenCalledWith({
        where: { jobId: jobId },
      });
    });

    it('should get specific task and return 200', async function () {
      const taskEntity = {
        jobId: jobId,
        id: taskId,
        creationTime: new Date(Date.UTC(2000, 1, 2)),
        updateTime: new Date(Date.UTC(2000, 1, 2)),
        attempts: 0,
        description: '1',
        parameters: {
          a: 2,
        },
        reason: '3',
        percentage: 4,
        type: '5',
        status: OperationStatus.IN_PROGRESS,
        resettable: false,
      } as unknown as TaskEntity;

      const taskFinOneMock = taskRepositoryMocks.findOneMock;
      taskFinOneMock.mockResolvedValue(taskEntity);

      const response = await requestSender.getResource(jobId, taskId);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(taskFinOneMock).toHaveBeenCalledTimes(1);
      expect(taskFinOneMock).toHaveBeenCalledWith({
        id: taskId,
        jobId: jobId,
      });

      const taskResponse = response.body as IGetTaskResponse;
      const taskResponseEntity = convertTaskResponseToEntity(taskResponse);
      expect(taskResponseEntity).toEqual(taskEntity);

      expect(response).toSatisfyApiSpec();
    });

    it('should update task status and return 200', async function () {
      const taskCountMock = taskRepositoryMocks.countMock;
      const taskSaveMock = taskRepositoryMocks.saveMock;

      taskCountMock.mockResolvedValue(1);
      taskSaveMock.mockResolvedValue({});

      const response = await requestSender.updateResource(jobId, taskId, {
        status: 'In-Progress',
        resettable: true,
      });
      expect(response).toSatisfyApiSpec();

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toEqual({ code: ResponseCodes.TASK_UPDATED });

      expect(taskSaveMock).toHaveBeenCalledTimes(1);
      expect(taskSaveMock).toHaveBeenCalledWith({
        id: taskId,
        jobId: jobId,
        status: 'In-Progress',
        resettable: true,
      });
    });

    it('should delete task and return 200', async function () {
      const taskDeleteMock = taskRepositoryMocks.deleteMock;
      const taskCountMock = taskRepositoryMocks.countMock;
      taskDeleteMock.mockResolvedValue({});
      taskCountMock.mockResolvedValue(1);

      const response = await requestSender.deleteResource(jobId, taskId);
      expect(response).toSatisfyApiSpec();

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toEqual({ code: ResponseCodes.TASK_DELETED });

      expect(taskDeleteMock).toHaveBeenCalledTimes(1);
      expect(taskDeleteMock).toHaveBeenCalledWith({
        id: taskId,
        jobId: jobId,
      });
    });

    it('should return details about all tasks of a FAILED job', async function () {
      const jobRepositoryMocks = registerRepository(JobRepository, new JobRepository());
      const jobFindOneMock = jobRepositoryMocks.findOneMock;
      jobFindOneMock.mockResolvedValue({ version: '5.0', resourceId: 'BLUEMARBLE' });

      const countMock = taskRepositoryMocks.countMock;
      countMock.mockResolvedValueOnce(3).mockResolvedValueOnce(1).mockResolvedValueOnce(4).mockResolvedValueOnce(3);
      const response = await requestSender.getTasksStatus(jobId);
      expect(response).toSatisfyApiSpec();

      const expectedResponseBody: IGetTasksStatus = {
        allTasksCompleted: false,
        completedTasksCount: 3,
        failedTasksCount: 1,
        resourceId: 'BLUEMARBLE',
        resourceVersion: '5.0',
      };
      expect(countMock).toHaveBeenCalledTimes(4);
      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toStrictEqual(expectedResponseBody);
    });

    it('should return details about all tasks of a COMPLETED job', async function () {
      const jobRepositoryMocks = registerRepository(JobRepository, new JobRepository());
      const jobFindOneMock = jobRepositoryMocks.findOneMock;
      jobFindOneMock.mockResolvedValue({ version: '1.0', resourceId: 'BLUE_MARBLE' });

      const countMock = taskRepositoryMocks.countMock;
      countMock.mockResolvedValueOnce(4).mockResolvedValueOnce(0).mockResolvedValueOnce(4).mockResolvedValueOnce(4);
      const response = await requestSender.getTasksStatus(jobId);
      expect(response).toSatisfyApiSpec();

      const expectedResponseBody: IGetTasksStatus = {
        allTasksCompleted: true,
        completedTasksCount: 4,
        failedTasksCount: 0,
        resourceId: 'BLUE_MARBLE',
        resourceVersion: '1.0',
      };
      expect(countMock).toHaveBeenCalledTimes(4);
      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toStrictEqual(expectedResponseBody);
    });

    it('should find tasks and return 200 with tasks array', async function () {
      const taskEntity = {
        jobId: jobId,
        job: {} as JobEntity,
        id: taskId,
        creationTime: new Date(Date.UTC(2000, 1, 2)),
        updateTime: new Date(Date.UTC(2000, 1, 2)),
        attempts: 0,
        description: '1',
        parameters: {
          a: 2,
        },
        reason: '3',
        percentage: 4,
        type: '5',
        status: OperationStatus.IN_PROGRESS,
        resettable: false,
      } as unknown as TaskEntity;

      const taskfindMock = taskRepositoryMocks.findMock;
      taskfindMock.mockResolvedValue([taskEntity]);

      const findTasksBody: IFindTasksRequest = {
        jobId: taskEntity.jobId,
      };

      const response = await requestSender.findTasks(findTasksBody);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(taskfindMock).toHaveBeenCalledTimes(1);
      expect(taskfindMock).toHaveBeenCalledWith({
        where: findTasksBody,
      });

      const taskResponses = response.body as IGetTaskResponse[];
      const taskResponseEntity = convertTaskResponseToEntity(taskResponses[0]);
      expect(taskResponseEntity).toEqual(taskEntity);

      expect(response).toSatisfyApiSpec();
    });
  });

  describe('Bad Path', function () {
    it('should return status code 400 on PUT request with invalid body', async function () {
      const taskCountMock = taskRepositoryMocks.countMock;

      const response = await requestSender.updateResource(jobId, taskId, {
        invalidFiled: 'test',
      });

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(taskCountMock).toHaveBeenCalledTimes(0);
      expect(response).toSatisfyApiSpec();
    });

    it('should return status code 400 on POST request with invalid body', async function () {
      const taskCountMock = taskRepositoryMocks.countMock;
      const response = await requestSender.createResource(jobId, {
        id: 'invalidFiled',
      });

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(taskCountMock).toHaveBeenCalledTimes(0);
      expect(response).toSatisfyApiSpec();
    });

    it('should return status code 400 on POST tasks/find request with invalid body', async function () {
      const taskfindMock = taskRepositoryMocks.findMock;
      taskfindMock.mockResolvedValue([]);

      const findTasksBody = {
        fff: 'aaa',
      };
      const response = await requestSender.findTasks(findTasksBody as IFindTasksRequest);
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response).toSatisfyApiSpec();
    });
  });

  describe('Sad Path', function () {
    it('should return status code 404 on POST tasks/find request for non existing tasks', async function () {
      const taskfindMock = taskRepositoryMocks.findMock;
      taskfindMock.mockResolvedValue([]);

      const findTasksBody: IFindTasksRequest = {
        jobId: jobId,
      };
      const response = await requestSender.findTasks(findTasksBody);

      expect(taskfindMock).toHaveBeenCalledTimes(1);
      expect(taskfindMock).toHaveBeenCalledWith({
        where: findTasksBody,
      });
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response).toSatisfyApiSpec();
    });

    it('should return status code 404 on GET request for non existing task', async function () {
      const taskFindOneMock = taskRepositoryMocks.findOneMock;
      taskFindOneMock.mockResolvedValue(undefined);

      const response = await requestSender.getResource(jobId, taskId);

      expect(taskFindOneMock).toHaveBeenCalledTimes(1);
      expect(taskFindOneMock).toHaveBeenCalledWith({
        id: taskId,
        jobId: jobId,
      });
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response).toSatisfyApiSpec();
    });

    it('should return status code 404 on PUT request for non existing task', async function () {
      const taskCountMock = taskRepositoryMocks.countMock;
      const taskSaveMock = taskRepositoryMocks.saveMock;
      taskCountMock.mockResolvedValue(0);

      const response = await requestSender.updateResource(jobId, taskId, {
        status: 'Pending',
      });

      expect(taskCountMock).toHaveBeenCalledTimes(1);
      expect(taskCountMock).toHaveBeenCalledWith({
        id: taskId,
        jobId: jobId,
      });
      expect(taskSaveMock).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response).toSatisfyApiSpec();
    });

    it('should return status code 404 on DELETE request for non existing task', async function () {
      const taskCountMock = taskRepositoryMocks.countMock;
      const taskDeleteMock = taskRepositoryMocks.deleteMock;
      taskCountMock.mockResolvedValue(0);

      const response = await requestSender.deleteResource(jobId, taskId);

      expect(taskCountMock).toHaveBeenCalledTimes(1);
      expect(taskCountMock).toHaveBeenCalledWith({
        id: taskId,
        jobId: jobId,
      });
      expect(taskDeleteMock).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response).toSatisfyApiSpec();
    });

    it('should return NOT FOUND for an non-existing job', async function () {
      const jobRepositoryMocks = registerRepository(JobRepository, new JobRepository());
      const jobFindOneMock = jobRepositoryMocks.findOneMock;
      jobFindOneMock.mockImplementation(() => {
        throw new NotFoundError('not found');
      });

      const response = await requestSender.getTasksStatus(jobId);
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response).toSatisfyApiSpec();
    });

    it('should return NOT FOUND for an non-existing job id', async function () {
      const createTaskModel = {
        description: '1',
        parameters: {
          a: 2,
        },
        reason: '3',
        percentage: 4,
        type: '5',
      };

      const taskSaveMock = taskRepositoryMocks.saveMock;
      taskSaveMock.mockImplementation(() => {
        const error = new Error('FK_task_job_id');
        (error as unknown as { code: string }).code = '23503';
        throw error;
      });

      const response = await requestSender.createResource(jobId, createTaskModel);
      expect(response).toSatisfyApiSpec();

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(taskSaveMock).toHaveBeenCalledTimes(1);
      expect(taskSaveMock).toHaveBeenCalledWith({ ...createTaskModel, jobId: jobId, blockDuplication: false });
    });
  });
});
