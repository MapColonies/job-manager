import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../common/constants';
import { IConfig } from '../common/interfaces';
import { HttpClient, IHttpRetryConfig } from './HttpClient';

@injectable()
export class HeartbeatClient extends HttpClient {
  private readonly failedHeartbeatDuration: string;
  private readonly baseUrl: string;

  public constructor(@inject(SERVICES.CONFIG) config: IConfig, @inject(SERVICES.LOGGER) logger: Logger) {
    const retryConfig = HeartbeatClient.parseConfig(config.get<IHttpRetryConfig>('httpRetry'));
    super(logger, retryConfig);
    this.targetService = 'Heartbeat';
    this.failedHeartbeatDuration = config.get('heartbeat.failedDurationMS');
    this.baseUrl = config.get('heartbeat.serviceUrl');
  }

  public async getHeartbeat(id: string): Promise<string | undefined> {
    const url = `${this.baseUrl}/heartbeat/${id}`;
    return this.get<string>(url);
  }
}
