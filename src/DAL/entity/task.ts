import { Entity, Column, PrimaryColumn, UpdateDateColumn, Generated, CreateDateColumn, ManyToOne, JoinColumn, Exclusion, Index } from 'typeorm';
import { OperationStatus } from '../../common/dataModels/enums';
import { JobEntity } from './job';

@Entity('Task')
@Exclusion('UQ_uniqueness_on_job_and_type','EXCLUDE ("type" with =, "jobId" with =) WHERE ("block_duplication" = true)')
export class TaskEntity {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_task_id' })
  @Generated('uuid')
  public id: string;

  // add column explicitly here for type ORM bug - https://github.com/typeorm/typeorm/issues/586
  @Column({ name: 'jobId' })
  public jobId: string;

  @ManyToOne(() => JobEntity, (job) => job.tasks, { nullable: false,cascade: false })
  @JoinColumn({ name: 'jobId', foreignKeyConstraintName:'FK_task_job_id', })
  public job: JobEntity;

  @Column('varchar', { length: 255 })
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

  @Column('text', { default: '', nullable: false })
  public reason: string;

  @Column('integer', { nullable: false, default: 0 })
  public attempts: number;

  @Index('taskResettableIndex', {where:'"resettable" = FALSE'})
  @Column('boolean', { nullable: false, default: true })
  public resettable: boolean;

  @Column('boolean', { name: 'block_duplication', nullable: false, default: false })
  public blockDuplication: boolean;

  public constructor();
  public constructor(init: Partial<TaskEntity>);
  public constructor(...args: [] | [Partial<TaskEntity>]) {
    if (args.length === 1) {
      Object.assign(this, args[0]);
    }
  }
}
