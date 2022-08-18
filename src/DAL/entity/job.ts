import { Entity, Column, PrimaryColumn, Index, UpdateDateColumn, Generated, CreateDateColumn, OneToMany } from 'typeorm';
import { OperationStatus } from '../../common/dataModels/enums';
import { TaskEntity } from './task';

@Entity('Job')
@Index('jobResourceIndex', ['resourceId', 'version'], { unique: false })
@Index('jobStatusIndex', ['status'], { unique: false })
@Index('jobTypeIndex', ['type'], { unique: false })
@Index('jobCleanedIndex', ['isCleaned'], { unique: false })
@Index('additionalIdentifiersIndex', ['additionalIdentifiers'], { unique: false })
export class JobEntity {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  public id: string;

  @Column('varchar', { length: 300, nullable: false })
  public resourceId: string;

  @Column('varchar', { length: 30, nullable: false })
  public version: string;

  @Column('varchar', { length: 255, nullable: false })
  public type: string;

  @Column('varchar', { length: 2000, default: '', nullable: false })
  public description: string;

  @Column('jsonb', { nullable: false })
  public parameters: Record<string, unknown>;

  @CreateDateColumn({
    type: 'timestamp with time zone',
  })
  public creationTime: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
  })
  public updateTime: Date;

  @Column({ type: 'enum', enum: OperationStatus, default: OperationStatus.PENDING, nullable: false })
  public status: OperationStatus;

  @Column('smallint', { nullable: true })
  public percentage: number;

  @Column('varchar', { default: '', nullable: false })
  public reason: string;

  @Column('boolean', { default: false, nullable: false })
  public isCleaned: boolean;

  @Column('int', { default: 1000, nullable: false })
  public priority: number;

  @Column('timestamp with time zone', { nullable: true })
  public expirationDate?: Date;

  @Column('uuid', { nullable: true })
  public internalId: string;

  @Column('text', { nullable: true })
  public producerName: string;

  @Column('text', { nullable: true })
  public productName: string;

  @Column('text', { nullable: true })
  public productType: string;

  @Column('text', { nullable: true })
  public additionalIdentifiers: string | undefined;

  @Column('int', { nullable: false, default: 0 })
  public taskCount: number;

  @Column('int', { nullable: false, default: 0 })
  public completedTasks: number;

  @Column('int', { nullable: false, default: 0 })
  public failedTasks: number;

  @Column('int', { nullable: false, default: 0 })
  public expiredTasks: number;

  @Column('int', { nullable: false, default: 0 })
  public pendingTasks: number;

  @Column('int', { nullable: false, default: 0 })
  public inProgressTasks: number;

  @Column('int', { nullable: false, default: 0 })
  public abortedTasks: number;

  @OneToMany(() => TaskEntity, (task) => task.job, {
    cascade: true,
  })
  public tasks?: TaskEntity[];

  public constructor();
  public constructor(init: Partial<JobEntity>);
  public constructor(...args: [] | [Partial<JobEntity>]) {
    if (args.length === 1) {
      Object.assign(this, args[0]);
    }
  }
}
