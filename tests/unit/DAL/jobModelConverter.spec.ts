import { ICreateJobBody, IGetJobResponse, IUpdateJobRequest } from '../../../src/common/dataModels/jobs';
import { IGetTaskResponse } from '../../../src/common/dataModels/tasks';
import { JobModelConvertor } from '../../../src/DAL/convertors/jobModelConverter';
import { TaskModelConvertor } from '../../../src/DAL/convertors/taskModelConvertor';
import { JobEntity } from '../../../src/DAL/entity/job';
import { TaskEntity } from '../../../src/DAL/entity/task';

let convertor: JobModelConvertor;

const taskCreateModelToEntityMock = jest.fn();
const taskEntityToModelMock = jest.fn();
const taskConvertorMock = {
  createModelToEntity: taskCreateModelToEntityMock,
  entityToModel: taskEntityToModelMock,
} as unknown as TaskModelConvertor;

describe('JobModelConverter', () => {
  beforeEach(function () {
    convertor = new JobModelConvertor(taskConvertorMock);
  });

  afterEach(function () {
    jest.resetAllMocks();
  });

  describe('createModelToEntity', () => {
    it('converted entity has only all relevant fields', function () {
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
        tasks: [createTaskModel1, createTaskModel2],
      } as ICreateJobBody;

      taskCreateModelToEntityMock.mockReturnValueOnce(createTaskModel1).mockReturnValueOnce(createTaskModel2);
      const res = convertor.createModelToEntity(createJobModel);

      expect(res).toEqual(createJobModel as JobEntity);
      expect(taskCreateModelToEntityMock).toHaveBeenCalledTimes(2);
      expect(taskCreateModelToEntityMock).toHaveBeenCalledWith(createTaskModel1);
      expect(taskCreateModelToEntityMock).toHaveBeenCalledWith(createTaskModel2);
    });
  });
  describe('UpdateModelToEntity', function () {
    it('converted entity has only all relevant filed', function () {
      const updateJobModel = {
        jobId: '1',
        isCleaned: true,
        parameters: {
          a: '3',
        },
        percentage: 4,
        reason: '5',
        internalId: 'test id',
        producerName: 'test producer',
        productType: 'test type',
        productName: 'test product',
      } as IUpdateJobRequest;
      const updateJobEntity = {
        id: '1',
        isCleaned: true,
        parameters: {
          a: '3',
        },
        percentage: 4,
        reason: '5',
        internalId: 'test id',
        producerName: 'test producer',
        productType: 'test type',
        productName: 'test product',
      } as unknown as JobEntity;

      const res = convertor.updateModelToEntity(updateJobModel);

      expect(res).toEqual(updateJobEntity);
    });
  });
  describe('EntityToModel', function () {
    it('converted entity has only all relevant filed', function () {
      const taskEntity1 = {
        attempts: 9,
        creationTime: new Date(2000, 1, 2),
        description: '10',
        id: '11',
        jobId: '1',
        parameters: {
          b: '12',
        },
        percentage: 13,
        reason: '14',
        status: 'In-Progress',
        type: '15',
        updateTime: new Date(2010, 5, 6),
      } as unknown as TaskEntity;
      const taskEntity2 = {
        attempts: 16,
        creationTime: new Date(2015, 7, 8),
        description: '17',
        id: '18',
        jobId: '1',
        parameters: {
          b: '19',
        },
        percentage: 20,
        reason: '21',
        status: 'Pending',
        type: '22',
        updateTime: new Date(2020, 9, 10),
      } as unknown as TaskEntity;
      const jobEntity = {
        id: '1',
        domain: 'RASTER',
        creationTime: new Date(2000, 1, 2),
        description: '2',
        isCleaned: false,
        parameters: {
          a: '3',
        },
        percentage: 4,
        reason: '5',
        resourceId: '6',
        status: 'Pending',
        tasks: [taskEntity1, taskEntity2],
        type: '7',
        updateTime: new Date(2020, 3, 4),
        version: '8',
        priority: 777,
        completedTasks: 0,
        expiredTasks: 0,
        failedTasks: 0,
        inProgressTasks: 1,
        pendingTasks: 1,
        abortedTasks: 0,
        suspendedTasks: 0,
        internalId: 'test id',
        producerName: 'test producer',
        productType: 'test type',
        productName: 'test product',
        additionalIdentifiers: '',
        taskCount: 2,
      } as JobEntity;
      const taskModel1 = {
        attempts: 9,
        created: new Date(2000, 1, 2),
        description: '10',
        id: '11',
        jobId: '1',
        parameters: {
          b: '12',
        },
        percentage: 13,
        reason: '14',
        status: 'In-Progress',
        type: '15',
        updated: new Date(2010, 5, 6),
        resettable: true,
      } as IGetTaskResponse;
      const taskModel2 = {
        attempts: 16,
        created: new Date(2015, 7, 8),
        description: '17',
        id: '18',
        jobId: '1',
        parameters: {
          b: '19',
        },
        percentage: 20,
        reason: '21',
        status: 'Pending',
        type: '22',
        updated: new Date(2020, 9, 10),
        resettable: true,
      } as IGetTaskResponse;
      const jobModel = {
        id: '1',
        created: new Date(2000, 1, 2),
        description: '2',
        isCleaned: false,
        domain: 'RASTER',
        parameters: {
          a: '3',
        },
        percentage: 4,
        reason: '5',
        resourceId: '6',
        status: 'Pending',
        tasks: [taskModel1, taskModel2],
        type: '7',
        updated: new Date(2020, 3, 4),
        version: '8',
        priority: 777,
        taskCount: 2,
        completedTasks: 0,
        pendingTasks: 1,
        expiredTasks: 0,
        failedTasks: 0,
        inProgressTasks: 1,
        abortedTasks: 0,
        suspendedTasks: 0,
        internalId: 'test id',
        producerName: 'test producer',
        productType: 'test type',
        productName: 'test product',
        additionalIdentifiers: '',
      } as IGetJobResponse;

      taskEntityToModelMock.mockReturnValueOnce(taskModel1).mockReturnValueOnce(taskModel2);

      const res = convertor.entityToModel(jobEntity);

      expect(res).toEqual(jobModel);
      expect(taskEntityToModelMock).toHaveBeenCalledTimes(2);
      expect(taskEntityToModelMock).toHaveBeenCalledWith(taskEntity1);
      expect(taskEntityToModelMock).toHaveBeenCalledWith(taskEntity2);
    });
  });
});
