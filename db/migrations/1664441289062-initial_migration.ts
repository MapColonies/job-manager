import { MigrationInterface, QueryRunner } from "typeorm";

export class initialMigration1664441289062 implements MigrationInterface {
    name = 'initialMigration1664441289062'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        //status type duplication is typeorm bug https://github.com/typeorm/typeorm/issues/8136
        await queryRunner.query(`CREATE TYPE "JobManager"."Task_status_enum" AS ENUM('Pending', 'In-Progress', 'Completed', 'Failed', 'Expired', 'Aborted')`);
        await queryRunner.query(`CREATE TABLE "JobManager"."Task" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "jobId" uuid NOT NULL, "type" character varying(255) NOT NULL, "description" character varying(2000) NOT NULL DEFAULT '', "parameters" jsonb NOT NULL, "creationTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "status" "JobManager"."Task_status_enum" NOT NULL DEFAULT 'Pending', "percentage" smallint, "reason" text NOT NULL DEFAULT '', "attempts" integer NOT NULL DEFAULT '0', "resettable" boolean NOT NULL DEFAULT true, "block_duplication" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_uniqueness_on_job_and_type" EXCLUDE ("type" with =, "jobId" with =) WHERE ("block_duplication" = true), CONSTRAINT "PK_task_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "taskResettableIndex" ON "JobManager"."Task" ("resettable") WHERE "resettable" = FALSE`);
        await queryRunner.query(`CREATE TYPE "JobManager"."Job_status_enum" AS ENUM('Pending', 'In-Progress', 'Completed', 'Failed', 'Expired', 'Aborted')`);
        await queryRunner.query(`CREATE TABLE "JobManager"."Job" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "resourceId" character varying(300) NOT NULL, "version" character varying(30) NOT NULL, "type" character varying(255) NOT NULL, "description" character varying(2000) NOT NULL DEFAULT '', "parameters" jsonb NOT NULL, "creationTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "status" "JobManager"."Job_status_enum" NOT NULL DEFAULT 'Pending', "percentage" smallint, "reason" character varying NOT NULL DEFAULT '', "isCleaned" boolean NOT NULL DEFAULT false, "priority" integer NOT NULL DEFAULT '1000', "expirationDate" TIMESTAMP WITH TIME ZONE, "internalId" uuid, "producerName" text, "productName" text, "productType" text, "additionalIdentifiers" text, "taskCount" integer NOT NULL DEFAULT '0', "completedTasks" integer NOT NULL DEFAULT '0', "failedTasks" integer NOT NULL DEFAULT '0', "expiredTasks" integer NOT NULL DEFAULT '0', "pendingTasks" integer NOT NULL DEFAULT '0', "inProgressTasks" integer NOT NULL DEFAULT '0', "abortedTasks" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_uniqueness_on_active_tasks" EXCLUDE ("resourceId" with =, "version" with =, "type" with =, "additionalIdentifiers" with =) WHERE (status = 'Pending' OR status = 'In-Progress'), CONSTRAINT "PK_job_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "jobTypeIndex" ON "JobManager"."Job" ("type") `);
        await queryRunner.query(`CREATE INDEX "jobStatusIndex" ON "JobManager"."Job" ("status") `);
        await queryRunner.query(`CREATE INDEX "jobCleanedIndex" ON "JobManager"."Job" ("isCleaned") `);
        await queryRunner.query(`CREATE INDEX "jobPriorityIndex" ON "JobManager"."Job" ("priority") `);
        await queryRunner.query(`CREATE INDEX "jobExpirationDateIndex" ON "JobManager"."Job" ("expirationDate") `);
        await queryRunner.query(`CREATE INDEX "jobResourceIndex" ON "JobManager"."Job" ("resourceId", "version") `);
        await queryRunner.query(`ALTER TABLE "JobManager"."Task" ADD CONSTRAINT "FK_task_job_id" FOREIGN KEY ("jobId") REFERENCES "JobManager"."Job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`SET search_path TO "JobManager", public;
            CREATE FUNCTION update_tasks_counters_insert() RETURNS trigger
                    SET search_path FROM CURRENT
                    LANGUAGE plpgsql
                    AS $$
                BEGIN
                UPDATE "Job" 
                SET "taskCount" = "taskCount" + 1, 
                    "completedTasks" = "completedTasks" + CASE WHEN NEW."status" = 'Completed' THEN 1 ELSE 0 END,
                    "failedTasks" = "failedTasks" + CASE WHEN NEW."status" = 'Failed' THEN 1 ELSE 0 END,
                    "expiredTasks" = "expiredTasks" + CASE WHEN NEW."status" = 'Expired' THEN 1 ELSE 0 END,
                    "pendingTasks" = "pendingTasks" + CASE WHEN NEW."status" = 'Pending' THEN 1 ELSE 0 END,
                    "inProgressTasks" = "inProgressTasks" + CASE WHEN NEW."status" = 'In-Progress' THEN 1 ELSE 0 END,
                    "abortedTasks" = "abortedTasks" + CASE WHEN NEW."status" = 'Aborted' THEN 1 ELSE 0 END
                WHERE id = NEW."jobId";
                RETURN NULL;
                END;
                $$;`);
        await queryRunner.query(`SET search_path TO "JobManager", public;
            CREATE TRIGGER update_tasks_counters_insert
                AFTER INSERT
                ON "Task"
                FOR EACH ROW
                EXECUTE PROCEDURE update_tasks_counters_insert();`);
        await queryRunner.query(`SET search_path TO "JobManager", public;
            CREATE FUNCTION update_tasks_counters_delete() RETURNS trigger
                    SET search_path FROM CURRENT
                    LANGUAGE plpgsql
                    AS $$
                BEGIN
                    UPDATE "Job" 
                    SET "taskCount" = "taskCount" - 1, 
                    "completedTasks" = "completedTasks" - CASE WHEN OLD."status" = 'Completed' THEN 1 ELSE 0 END,
                    "failedTasks" = "failedTasks" - CASE WHEN OLD."status" = 'Failed' THEN 1 ELSE 0 END,
                    "expiredTasks" = "expiredTasks" - CASE WHEN OLD."status" = 'Expired' THEN 1 ELSE 0 END,
                    "pendingTasks" = "pendingTasks" - CASE WHEN OLD."status" = 'Pending' THEN 1 ELSE 0 END,
                    "inProgressTasks" = "inProgressTasks" - CASE WHEN OLD."status" = 'In-Progress' THEN 1 ELSE 0 END,
                    "abortedTasks" = "abortedTasks" - CASE WHEN OLD."status" = 'Aborted' THEN 1 ELSE 0 END
                    WHERE id = OLD."jobId";
                    RETURN NULL;
                END;
                $$;`);
        await queryRunner.query(`SET search_path TO "JobManager", public;
            CREATE TRIGGER update_tasks_counters_delete
                AFTER DELETE
                ON "Task"
                FOR EACH ROW
                EXECUTE PROCEDURE update_tasks_counters_delete();`);
        await queryRunner.query(`SET search_path TO "JobManager", public;
            CREATE FUNCTION update_tasks_counters_update() RETURNS trigger
                SET search_path FROM CURRENT
                LANGUAGE plpgsql
                AS $$
            BEGIN
                IF NEW."status" != OLD."status" THEN
                UPDATE "Job" 
                SET
                    "completedTasks" = "completedTasks" + CASE WHEN NEW."status" = 'Completed' THEN 1 WHEN OLD."status" = 'Completed' THEN -1 ELSE 0 END,
                    "failedTasks" = "failedTasks" + CASE WHEN NEW."status" = 'Failed' THEN 1 WHEN OLD."status" = 'Failed' THEN -1 ELSE 0 END,
                    "expiredTasks" = "expiredTasks" + CASE WHEN NEW."status" = 'Expired' THEN 1 WHEN OLD."status" = 'Expired' THEN -1 ELSE 0 END,
                    "pendingTasks" = "pendingTasks" + CASE WHEN NEW."status" = 'Pending' THEN 1 WHEN OLD."status" = 'Pending' THEN -1 ELSE 0 END,
                    "inProgressTasks" = "inProgressTasks" + CASE WHEN NEW."status" = 'In-Progress' THEN 1 WHEN OLD."status" = 'In-Progress' THEN -1 ELSE 0 END,
                    "abortedTasks" = "abortedTasks" + CASE WHEN NEW."status" = 'Aborted' THEN 1 WHEN OLD."status" = 'Aborted' THEN -1 ELSE 0 END
                WHERE id = NEW."jobId";
                END IF;
                RETURN NULL;
            END;
            $$;`);
        await queryRunner.query(`SET search_path TO "JobManager", public;
            CREATE TRIGGER update_tasks_counters_update
                AFTER UPDATE
                ON "Task"
                FOR EACH ROW
                WHEN (NEW."status" IS NOT NULL)
                EXECUTE PROCEDURE update_tasks_counters_update();`);
        await queryRunner.query(`CREATE OR REPLACE FUNCTION deleteTaskAndJobsByJobId(jobId text) RETURNS bool AS $func$
                BEGIN
                delete from "JobManager"."Task" where "jobId" = jobId::uuid;
                delete from "JobManager"."Job" where "id" = jobId::uuid;
                RETURN true;   
                END
                $func$ LANGUAGE plpgsql;`);
        await queryRunner.query(`CREATE OR REPLACE FUNCTION deleteTaskAndJobsByJobType(jobType text) RETURNS bool AS $func$
                BEGIN
                delete from "JobManager"."Task" where "jobId" in (select id from "Job" where "type" = jobType);
                delete from "JobManager"."Job" where "type" = jobType; 
                RETURN true;
                END
                $func$ LANGUAGE plpgsql;`);
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
        await queryRunner.query(`DROP TRIGGER "update_tasks_counters_insert" ON "JobManager"."Task"`);
        await queryRunner.query('DROP FUNCTION "JobManager".update_tasks_counters_insert()');
        await queryRunner.query(`DROP TRIGGER "update_tasks_counters_delete" ON "JobManager"."Task"`);
        await queryRunner.query('DROP FUNCTION "JobManager".update_tasks_counters_delete()');
        await queryRunner.query(`DROP TRIGGER "update_tasks_counters_update" ON "JobManager"."Task"`);
        await queryRunner.query('DROP FUNCTION "JobManager".update_tasks_counters_update()');
        await queryRunner.query('DROP FUNCTION "JobManager".deleteTaskAndJobsByJobId(text)');
        await queryRunner.query('DROP FUNCTION "JobManager".deleteTaskAndJobsByJobType(text)');
    }

}
