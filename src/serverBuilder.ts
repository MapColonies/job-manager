import express, { Response, Router } from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import statusCodes from 'http-status-codes';
import { LevelWithSilent } from 'pino';
import { OpenapiViewerRouter, OpenapiRouterConfig } from '@map-colonies/openapi-express-viewer';
import { getErrorHandlerMiddleware } from '@map-colonies/error-express-handler';
import { middleware as OpenApiMiddleware } from 'express-openapi-validator';
import { inject, injectable } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import httpLogger from '@map-colonies/express-access-log-middleware';
import { SERVICES } from './common/constants';
import { IConfig } from './common/interfaces';
import { JOB_ROUTER_SYMBOL } from './jobs/routes/jobRouter';
import { TASK_MANAGER_ROUTER_SYMBOL } from './taskManagement/routes/taskManagerRouter';
import { UrlQueryDecoder } from './common/middlewares/urlQueryDecoder';

@injectable()
export class ServerBuilder {
  private readonly serverInstance: express.Application;

  public constructor(
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(JOB_ROUTER_SYMBOL) private readonly jobRouter: Router,
    @inject(TASK_MANAGER_ROUTER_SYMBOL) private readonly taskManagerRouter: Router,
    private readonly queryDecoder: UrlQueryDecoder
  ) {
    this.serverInstance = express();
  }

  public build(): express.Application {
    this.registerPreRoutesMiddleware();
    this.buildRoutes();
    this.registerPostRoutesMiddleware();

    return this.serverInstance;
  }

  private buildDocsRoutes(): void {
    const openapiRouter = new OpenapiViewerRouter(this.config.get<OpenapiRouterConfig>('openapiConfig'));
    openapiRouter.setup();
    this.serverInstance.use(this.config.get<string>('openapiConfig.basePath'), openapiRouter.getRouter());
  }

  private buildRoutes(): void {
    this.serverInstance.use('/jobs', this.jobRouter);
    this.serverInstance.use('/tasks', this.taskManagerRouter);
    this.buildDocsRoutes();
  }

  private registerPreRoutesMiddleware(): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const customLogLevel = (req: object, res: { statusCode: number | undefined }, err: object | undefined): LevelWithSilent => {
      const ress = res as Response;
      return err !== undefined ||
        (res.statusCode !== undefined &&
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          res.statusCode >= 400 &&
          !(res.statusCode == statusCodes.NOT_FOUND && ress.req.url.endsWith('startPending')))
        ? 'error'
        : 'info';
    };

    this.serverInstance.use(httpLogger({ logger: this.logger, customLogLevel }));
    // this.serverInstance.use(httpLogger({ logger: this.logger }));

    this.serverInstance.use(this.queryDecoder.getUrlParamDecoderMiddleware());

    if (this.config.get<boolean>('server.response.compression.enabled')) {
      this.serverInstance.use(compression(this.config.get<compression.CompressionFilter>('server.response.compression.options')));
    }

    this.serverInstance.use(bodyParser.json(this.config.get<bodyParser.Options>('server.request.payload')));

    const ignorePathRegex = new RegExp(`^${this.config.get<string>('openapiConfig.basePath')}/.*`, 'i');
    const apiSpecPath = this.config.get<string>('openapiConfig.filePath');
    this.serverInstance.use(OpenApiMiddleware({ apiSpec: apiSpecPath, validateRequests: true, ignorePaths: ignorePathRegex }));
  }

  private registerPostRoutesMiddleware(): void {
    this.serverInstance.use(getErrorHandlerMiddleware());
  }
}
