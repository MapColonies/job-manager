import { singleton } from 'tsyringe';
import { ICreateJobBody, IGetJobResponse, IUpdateJobRequest } from '../../common/dataModels/jobs';
import { JobEntity } from '../entity/job';
import { TaskModelConvertor } from './taskModelConvertor';

@singleton()
export class JobModelConvertor {
  public constructor(private readonly taskConvertor: TaskModelConvertor) {}

  public createModelToEntity(model: ICreateJobBody): JobEntity {
    const entity = new JobEntity();
    const tasks = model.tasks?.map((taskModel) => this.taskConvertor.createModelToEntity(taskModel));
    Object.assign(entity, { ...model, tasks: tasks });
    return entity;
  }

  public updateModelToEntity(model: IUpdateJobRequest): JobEntity {
    const entity = new JobEntity();
    Object.assign(entity, { ...model, id: model.jobId, jobId: undefined });
    return entity;
  }

  public entityToModel(entity: JobEntity): IGetJobResponse {
    const tasks = entity.tasks?.map((task) => this.taskConvertor.entityToModel(task));
    const model = { ...entity, created: entity.creationTime, updated: entity.updateTime, tasks: tasks } as { creationTime?: Date; updateTime?: Date };
    delete model.creationTime;
    delete model.updateTime;
    return model as IGetJobResponse;
  }
}
