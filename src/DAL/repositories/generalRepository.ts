import { ObjectLiteral, Repository } from 'typeorm';
import { IConfig, IDbConfig } from '../../common/interfaces';

export abstract class GeneralRepository<T extends ObjectLiteral> {
  protected readonly dbConfig: IDbConfig;

  protected metadata = this.repository.metadata;
  protected manager = this.repository.manager;
  protected queryRunner = this.repository.queryRunner;

  protected constructor(private readonly repository: Repository<T>, protected readonly config: IConfig) {
    this.dbConfig = this.config.get('typeOrm');
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  protected async query(query: string, parameters?: any[] | undefined): Promise<any> {
    await this.repository.query(`SET search_path TO "${this.dbConfig.schema as string}", public`);
    return this.repository.query(query, parameters);
  }

  /* eslint-disable @typescript-eslint/member-ordering */
  protected createQueryBuilder = this.repository.createQueryBuilder.bind(this.repository);
  protected count = this.repository.count.bind(this.repository);
  protected countBy = this.repository.countBy.bind(this.repository);
  protected create = this.repository.create.bind(this.repository);
  protected decrement = this.repository.decrement.bind(this.repository);
  protected delete = this.repository.delete.bind(this.repository);
  protected find = this.repository.find.bind(this.repository);
  protected findAndCount = this.repository.findAndCount.bind(this.repository);
  protected findAndCountBy = this.repository.findAndCountBy.bind(this.repository);
  protected findBy = this.repository.findBy.bind(this.repository);
  protected findOne = this.repository.findOne.bind(this.repository);
  protected findOneBy = this.repository.findOneBy.bind(this.repository);
  protected findOneByOrFail = this.repository.findOneByOrFail.bind(this.repository);
  protected findOneOrFail = this.repository.findOneOrFail.bind(this.repository);
  protected getId = this.repository.getId.bind(this.repository);
  protected hasId = this.repository.hasId.bind(this.repository);
  protected increment = this.repository.increment.bind(this.repository);
  protected insert = this.repository.insert.bind(this.repository);
  protected merge = this.repository.merge.bind(this.repository);
  protected preload = this.repository.preload.bind(this.repository);
  protected recover = this.repository.recover.bind(this.repository);
  protected remove = this.repository.remove.bind(this.repository);
  protected restore = this.repository.restore.bind(this.repository);
  protected save = this.repository.save.bind(this.repository);
  protected softDelete = this.repository.softDelete.bind(this.repository);
  protected softRemove = this.repository.softRemove.bind(this.repository);
  protected update = this.repository.update.bind(this.repository);
  protected upsert = this.repository.upsert.bind(this.repository);
}
