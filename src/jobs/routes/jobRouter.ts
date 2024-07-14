import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { JobController } from '../controllers/jobController';
import { TaskController } from '../controllers/taskController';

const jobRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const jobsController = dependencyContainer.resolve(JobController);
  const tasksController = dependencyContainer.resolve(TaskController);

  router.get('/', jobsController.findResource);
  router.post('/find', jobsController.findResourceByCriteria);
  router.post('/', jobsController.createResource);
  router.get('/parameters', jobsController.getJobByJobsParameters);
  router.get('/:jobId', jobsController.getResource);
  router.put('/:jobId', jobsController.updateResource);
  router.delete('/:jobId', jobsController.deleteResource);
  router.post('/:jobId/resettable', jobsController.isResettable);
  router.post('/:jobId/reset', jobsController.resetJob);

  router.get('/:jobId/tasks', tasksController.getResources);
  router.post('/:jobId/tasks', tasksController.createResource);
  router.get('/:jobId/tasks/:taskId', tasksController.getResource);
  router.put('/:jobId/tasks/:taskId', tasksController.updateResource);
  router.delete('/:jobId/tasks/:taskId', tasksController.deleteResource);
  router.get('/:jobId/tasksStatus', tasksController.getResourcesStatus);

  return router;
};

export const JOB_ROUTER_SYMBOL = Symbol('jobRouterFactory');

export { jobRouterFactory };
