import { singleton } from 'tsyringe';
import { ICreateTaskBody, ICreateTaskRequest, IFindTasksRequest, IGetTaskResponse, IUpdateTaskRequest } from '../../common/dataModels/tasks';
import { TaskEntity } from '../entity/task';

interface ITaskModel extends ICreateTaskBody {
  jobId?: string;
}

@singleton()
export class TaskModelConvertor {
  public createModelToEntity(model: ICreateTaskBody): TaskEntity;
  public createModelToEntity(model: ICreateTaskRequest): TaskEntity;
  public createModelToEntity(model: IFindTasksRequest): TaskEntity;
  public createModelToEntity(model: ITaskModel): TaskEntity {
    const entity = new TaskEntity();
    Object.assign(entity, model);
    return entity;
  }

  public updateModelToEntity(model: IUpdateTaskRequest): TaskEntity {
    const cleanModel = { ...model, id: model.taskId, taskId: undefined };
    const entity = new TaskEntity();
    Object.assign(entity, cleanModel);
    return entity;
  }

  public entityToModel(entity: TaskEntity): IGetTaskResponse {
    const model = { ...entity, created: entity.creationTime, updated: entity.updateTime } as { creationTime?: Date; updateTime?: Date };
    delete model.creationTime;
    delete model.updateTime;
    return model as IGetTaskResponse;
  }
}
