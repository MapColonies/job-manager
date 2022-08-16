import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { TaskManagementController } from '../controllers/taskManagementController';
import { TaskController } from '../../jobs/controllers/taskController';

const taskManagerRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();

  const tasksManagementController = dependencyContainer.resolve(TaskManagementController);
  const tasksController = dependencyContainer.resolve(TaskController);

  router.post('/find', tasksController.findTasks);

  router.post('/:jobType/:taskType/startPending', tasksManagementController.startPending);
  router.post('/findInactive', tasksManagementController.findInactiveTasks);
  router.post('/releaseInactive', tasksManagementController.releaseInactive);
  router.post('/updateExpiredStatus', tasksManagementController.updateExpiredStatus);
  router.post('/abort/:jobId', tasksManagementController.abort);

  return router;
};

export const TASK_MANAGER_ROUTER_SYMBOL = Symbol('taskManagerRouterFactory');

export { taskManagerRouterFactory };
