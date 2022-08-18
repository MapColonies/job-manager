import { ObjectType, ObjectLiteral } from 'typeorm';
import { GeneralRepository } from '../../src/DAL/repositories/generalRepository';

//functions
const getCustomRepositoryMock = jest.fn();
const createConnection = jest.fn();
const inMock = jest.fn();
const lessThanMock = jest.fn();
const bracketsMock = jest.fn();
const createQueryRunnerMock = jest.fn();
const betweenMock = jest.fn();
const lessThanOrEqualMock = jest.fn();
const moreThanOrEqualMock = jest.fn();

const queryRunnerMocks = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    getCustomRepository: getCustomRepositoryMock,
  },
};

let repositories: {
  [key: string]: unknown;
};

const initTypeOrmMocks = (): void => {
  repositories = {};
  getCustomRepositoryMock.mockImplementation(<T>(key: ObjectType<T>) => {
    return repositories[key.name];
  });
  initQueryRunnerMocks();
  createConnection.mockReturnValue({
    getCustomRepository: getCustomRepositoryMock,
    createQueryRunner: createQueryRunnerMock,
  });
};

const initQueryRunnerMocks = (): void => {
  createQueryRunnerMock.mockResolvedValue(queryRunnerMocks);
  queryRunnerMocks.connect.mockReturnThis();
  queryRunnerMocks.startTransaction.mockReturnThis();
  queryRunnerMocks.commitTransaction.mockReturnThis();
  queryRunnerMocks.rollbackTransaction.mockReturnThis();
  queryRunnerMocks.release.mockReturnThis();
};

interface QueryBuilder {
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  getMany: jest.Mock;
  update: jest.Mock;
  set: jest.Mock;
  returning: jest.Mock;
  updateEntity: jest.Mock;
  execute: jest.Mock;
}

interface RepositoryMocks {
  findOneMock: jest.Mock;
  findMock: jest.Mock;
  saveMock: jest.Mock;
  deleteMock: jest.Mock;
  countMock: jest.Mock;
  queryBuilderMock: jest.Mock;
  queryBuilder: QueryBuilder;
  queryMock: jest.Mock;
  updateMock: jest.Mock;
}

const registerRepository = <T>(key: ObjectType<T>, instance: T): RepositoryMocks => {
  const repo = instance as unknown as GeneralRepository<ObjectLiteral>;
  const mocks = {
    findOneMock: jest.fn(),
    findMock: jest.fn(),
    saveMock: jest.fn(),
    deleteMock: jest.fn(),
    countMock: jest.fn(),
    queryBuilderMock: jest.fn(),
    queryBuilder: {
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      getMany: jest.fn(),
      update: jest.fn(),
      set: jest.fn(),
      returning: jest.fn(),
      updateEntity: jest.fn(),
      execute: jest.fn(),
    },
    queryMock: jest.fn(),
    updateMock: jest.fn(),
  };
  repo.findOne = mocks.findOneMock;
  repo.find = mocks.findMock;
  repo.save = mocks.saveMock;
  repo.delete = mocks.deleteMock;
  repo.count = mocks.countMock;
  (repo.createQueryBuilder as unknown) = mocks.queryBuilderMock;
  repo.query = mocks.queryMock;
  repo.update = mocks.updateMock;

  // Set query builder mocks
  mocks.queryBuilderMock.mockImplementation(() => mocks.queryBuilder);
  mocks.queryBuilder.where.mockImplementation(() => mocks.queryBuilder);
  mocks.queryBuilder.andWhere.mockImplementation(() => mocks.queryBuilder);
  mocks.queryBuilder.orderBy.mockImplementation(() => mocks.queryBuilder);
  mocks.queryBuilder.update.mockImplementation(() => mocks.queryBuilder);
  mocks.queryBuilder.set.mockImplementation(() => mocks.queryBuilder);
  mocks.queryBuilder.returning.mockImplementation(() => mocks.queryBuilder);
  mocks.queryBuilder.updateEntity.mockImplementation(() => mocks.queryBuilder);

  repositories[key.name] = repo;
  return mocks;
};

//decorator mocks
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
const Generated = () => jest.fn();

//interfaces
export { RepositoryMocks };
//initializers
export { registerRepository, initTypeOrmMocks };
//mocks
export {
  createConnection,
  inMock as In,
  inMock,
  lessThanMock as LessThan,
  lessThanMock,
  lessThanOrEqualMock as LessThanOrEqual,
  lessThanOrEqualMock,
  moreThanOrEqualMock as MoreThanOrEqual,
  moreThanOrEqualMock,
  betweenMock as Between,
  betweenMock,
  bracketsMock as Brackets,
  bracketsMock,
  queryRunnerMocks,
  createQueryRunnerMock,
};
//decorator mocks
export { Generated };
