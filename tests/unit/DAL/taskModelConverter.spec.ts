import { OperationStatus } from '@map-colonies/mc-priority-queue';
import { IGetTaskResponse, IUpdateTaskRequest } from '../../../src/common/dataModels/tasks';
import { TaskModelConvertor } from '../../../src/DAL/convertors/taskModelConvertor';
import { TaskEntity } from '../../../src/DAL/entity/task';

let convertor: TaskModelConvertor;

describe('TaskModelConverter', () => {
  beforeEach(function () {
    convertor = new TaskModelConvertor();
  });

  afterEach(function () {
    jest.resetAllMocks();
  });

  describe('createModelToEntity', () => {
    it('converted entity has only all relevant filed', function () {
      const createTaskModel = {
        description: '1',
        parameters: {
          a: 2,
        },
        reason: '3',
        percentage: 4,
        type: '5',
      };

      const res = convertor.createModelToEntity(createTaskModel);

      expect(res).toEqual(createTaskModel as unknown as TaskEntity);
    });
  });
  describe('UpdateModelToEntity', function () {
    it('converted entity has only all relevant fields', function () {
      const updateTaskModel = {
        taskId: '1',
        jobId: '2',
        isCleaned: true,
        parameters: {
          a: '3',
        },
        percentage: 4,
        reason: '5',
        status: 'Pending',
        attempts: 6,
        description: '7',
      } as IUpdateTaskRequest;

      const updateTaskEntity = {
        id: '1',
        jobId: '2',
        isCleaned: true,
        parameters: {
          a: '3',
        },
        percentage: 4,
        reason: '5',
        status: 'Pending',
        attempts: 6,
        description: '7',
      } as unknown as TaskEntity;

      const res = convertor.updateModelToEntity(updateTaskModel);

      expect(res).toEqual(updateTaskEntity);
    });
  });
  describe('EntityToModel', function () {
    it('converted entity has only all relevant fields', function () {
      const taskEntity = {
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
        status: OperationStatus.IN_PROGRESS,
        type: '15',
        resettable: true,
        updateTime: new Date(2010, 5, 6),
      } as unknown as TaskEntity;

      const taskModel = {
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

      const res = convertor.entityToModel(taskEntity);

      expect(res).toEqual(taskModel);
    });
  });
});
