import { MigrationInterface, QueryRunner } from "typeorm";

export class initaialMigration1663845942790 implements MigrationInterface {
    name = 'initaialMigration1663845942790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        //TODO: fix task type name and remove its duplication
        await queryRunner.query(`CREATE TYPE "JobManager"."Task_status_enum" AS ENUM('Pending', 'In-Progress', 'Completed', 'Failed', 'Expired', 'Aborted')`);
        await queryRunner.query(`CREATE TABLE "JobManager"."Task" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "jobId" uuid NOT NULL, "type" character varying(255) NOT NULL, "description" character varying(2000) NOT NULL DEFAULT '', "parameters" jsonb NOT NULL, "creationTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "status" "JobManager"."Task_status_enum" NOT NULL DEFAULT 'Pending', "percentage" smallint, "reason" character varying NOT NULL DEFAULT '', "attempts" integer NOT NULL DEFAULT '0', "resettable" boolean NOT NULL DEFAULT true, "block_duplication" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_uniqueness_on_job_and_type" EXCLUDE EXCLUDE ("type" with =, "jobId" with =) WHERE ("block_duplication" = true, CONSTRAINT "PK_task_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "taskResettableIndex" ON "JobManager"."Task" ("resettable") WHERE "resettable" = FALSE`);
        await queryRunner.query(`CREATE TYPE "JobManager"."Job_status_enum" AS ENUM('Pending', 'In-Progress', 'Completed', 'Failed', 'Expired', 'Aborted')`);
        await queryRunner.query(`CREATE TABLE "JobManager"."Job" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "resourceId" character varying(300) NOT NULL, "version" character varying(30) NOT NULL, "type" character varying(255) NOT NULL, "description" character varying(2000) NOT NULL DEFAULT '', "parameters" jsonb NOT NULL, "creationTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "status" "JobManager"."Job_status_enum" NOT NULL DEFAULT 'Pending', "percentage" smallint, "reason" character varying NOT NULL DEFAULT '', "isCleaned" boolean NOT NULL DEFAULT false, "priority" integer NOT NULL DEFAULT '1000', "expirationDate" TIMESTAMP WITH TIME ZONE, "internalId" uuid, "producerName" text, "productName" text, "productType" text, "additionalIdentifiers" text, "taskCount" integer NOT NULL DEFAULT '0', "completedTasks" integer NOT NULL DEFAULT '0', "failedTasks" integer NOT NULL DEFAULT '0', "expiredTasks" integer NOT NULL DEFAULT '0', "pendingTasks" integer NOT NULL DEFAULT '0', "inProgressTasks" integer NOT NULL DEFAULT '0', "abortedTasks" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_uniqueness_on_active_tasks" EXCLUDE EXCLUDE ("resourceId" with =, "version" with =, "type" with =, "additionalIdentifiers" with =) WHERE (status = 'Pending' OR status = 'In-Progress'), CONSTRAINT "PK_job_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "jobTypeIndex" ON "JobManager"."Job" ("type") `);
        await queryRunner.query(`CREATE INDEX "jobStatusIndex" ON "JobManager"."Job" ("status") `);
        await queryRunner.query(`CREATE INDEX "jobCleanedIndex" ON "JobManager"."Job" ("isCleaned") `);
        await queryRunner.query(`CREATE INDEX "jobPriorityIndex" ON "JobManager"."Job" ("priority") `);
        await queryRunner.query(`CREATE INDEX "jobExpirationDateIndex" ON "JobManager"."Job" ("expirationDate") `);
        await queryRunner.query(`CREATE INDEX "jobResourceIndex" ON "JobManager"."Job" ("resourceId", "version") `);
        await queryRunner.query(`ALTER TABLE "JobManager"."Task" ADD CONSTRAINT "FK_task_job_id" FOREIGN KEY ("jobId") REFERENCES "JobManager"."Job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "JobManager"."Task" DROP CONSTRAINT "FK_task_job_id"`);
        await queryRunner.query(`DROP INDEX "JobManager"."jobResourceIndex"`);
        await queryRunner.query(`DROP INDEX "JobManager"."jobExpirationDateIndex"`);
        await queryRunner.query(`DROP INDEX "JobManager"."jobPriorityIndex"`);
        await queryRunner.query(`DROP INDEX "JobManager"."jobCleanedIndex"`);
        await queryRunner.query(`DROP INDEX "JobManager"."jobStatusIndex"`);
        await queryRunner.query(`DROP INDEX "JobManager"."jobTypeIndex"`);
        await queryRunner.query(`DROP TABLE "JobManager"."Job"`);
        await queryRunner.query(`DROP TYPE "JobManager"."Job_status_enum"`);
        await queryRunner.query(`DROP INDEX "JobManager"."taskResettableIndex"`);
        await queryRunner.query(`DROP TABLE "JobManager"."Task"`);
        await queryRunner.query(`DROP TYPE "JobManager"."Task_status_enum"`);
    }

}
