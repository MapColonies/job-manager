import { container } from 'tsyringe';
import { ObjectLiteral, Repository } from 'typeorm';
import { SERVICES } from '../../common/constants';
import { IConfig, IDbConfig } from '../../common/interfaces';

export class GeneralRepository<T extends ObjectLiteral> extends Repository<T> {
  protected readonly dbConfig: IDbConfig;
  private readonly config: IConfig;

  public constructor() {
    super();
    this.config = container.resolve(SERVICES.CONFIG);
    this.dbConfig = this.config.get('typeOrm');
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public async query(query: string, parameters?: any[] | undefined): Promise<any> {
    await super.query(`SET search_path TO "${this.dbConfig.schema as string}", public`);
    return super.query(query, parameters);
  }
}
