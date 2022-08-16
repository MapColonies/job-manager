-- v2.1.1 db creation script --
-- please note that the update date is updated by typeOrm and not by trigger --
SET search_path TO public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

SET search_path TO "JobManager", public; -- CHANGE SCHEMA NAME TO MATCH ENVIRONMENT
CREATE TYPE "operation_status_enum" AS ENUM
    ('Pending', 'In-Progress', 'Completed', 'Failed', 'Expired', 'Aborted');

CREATE TABLE "Job"
(
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "resourceId" character varying(300) COLLATE pg_catalog."default" NOT NULL,
  "version" character varying(30) COLLATE pg_catalog."default" NOT NULL,
  "type" character varying(255) COLLATE pg_catalog."default" NOT NULL,
  "resolution" text COLLATE pg_catalog."default",
  "description" character varying(2000) COLLATE pg_catalog."default" NOT NULL DEFAULT ''::character varying,
  "parameters" jsonb NOT NULL,
  "creationTime" timestamp with time zone NOT NULL DEFAULT now(),
  "updateTime" timestamp with time zone NOT NULL DEFAULT now(),
  "status" "operation_status_enum" NOT NULL DEFAULT 'Pending'::"operation_status_enum",
  "percentage" smallint,
  "reason" text COLLATE pg_catalog."default" NOT NULL DEFAULT ''::text,
  "isCleaned" boolean NOT NULL DEFAULT false,
  "priority" int NOT NULL DEFAULT 1000,
  "expirationDate" timestamp with time zone,
  "internalId" uuid,
  "producerName" text COLLATE pg_catalog."default",
  "productName" text COLLATE pg_catalog."default",
  "productType" text COLLATE pg_catalog."default",
  "taskCount" int NOT NULL DEFAULT 0,
  "completedTasks" int NOT NULL DEFAULT 0,
  "failedTasks" int NOT NULL DEFAULT 0,
  "expiredTasks" int NOT NULL DEFAULT 0,
  "pendingTasks" int NOT NULL DEFAULT 0,
  "inProgressTasks" int NOT NULL DEFAULT 0,
  "abortedTasks" int NOT NULL DEFAULT 0,
  "additionalIdentifiers" text COLLATE pg_catalog."default",
  CONSTRAINT "PK_job_id" PRIMARY KEY (id),
  CONSTRAINT "UQ_uniqueness_on_active_tasks" EXCLUDE ("resourceId" with =, "version" with =, "type" with =, "additionalIdentifiers" with =) WHERE (status = 'Pending' OR status = 'In-Progress')
);

CREATE INDEX "jobCleanedIndex" 
  ON "Job" USING btree 
  ("isCleaned" ASC NULLS LAST);

CREATE INDEX "jobResourceIndex"
  ON "Job" USING btree
  ("resourceId" COLLATE pg_catalog."default" ASC NULLS LAST, version COLLATE pg_catalog."default" ASC NULLS LAST);

CREATE INDEX "jobStatusIndex"
  ON "Job" USING btree
  (status ASC NULLS LAST);

CREATE INDEX "additionalIdentifiersIndex"
  ON "Job" USING btree
  ("additionalIdentifiers" ASC NULLS LAST);

CREATE INDEX "jobTypeIndex"
    ON "Job" USING btree
    (type COLLATE pg_catalog."default" ASC NULLS LAST);

CREATE INDEX "jobPriorityIndex"
    ON "Job" USING btree
    (priority DESC NULLS LAST);

CREATE INDEX "jobExpirationDateIndex"
    ON "Job" USING btree
    ("expirationDate" DESC NULLS LAST);

CREATE TABLE "Task"
(
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "type" character varying(255) COLLATE pg_catalog."default" NOT NULL,
  "description" character varying(2000) COLLATE pg_catalog."default" NOT NULL DEFAULT ''::character varying, 
  "parameters" jsonb NOT NULL,
  "creationTime" timestamp with time zone NOT NULL DEFAULT now(),
  "updateTime" timestamp with time zone NOT NULL DEFAULT now(),
  "status" "operation_status_enum" NOT NULL DEFAULT 'Pending'::"operation_status_enum",
  "percentage" smallint, 
  "reason" text COLLATE pg_catalog."default" NOT NULL DEFAULT ''::text, 
  "attempts" integer NOT NULL DEFAULT 0,
  "jobId" uuid NOT NULL,
  "resettable" BOOLEAN NOT NULL DEFAULT TRUE,
  "block_duplication" boolean NOT NULL DEFAULT false,
  CONSTRAINT "PK_task_id" PRIMARY KEY (id), 
  CONSTRAINT "FK_task_job_id" FOREIGN KEY ("jobId") REFERENCES "Job" (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "UQ_uniqueness_on_job_and_type" EXCLUDE ("type" with =, "jobId" with =) WHERE ("block_duplication" = true)
);

CREATE INDEX "taskResettableIndex"
    ON "Task" ("resettable")
    WHERE "resettable" = FALSE;


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
$$;

CREATE TRIGGER update_tasks_counters_insert
    AFTER INSERT
    ON "Task"
    FOR EACH ROW
    EXECUTE PROCEDURE update_tasks_counters_insert();

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
$$;

CREATE TRIGGER update_tasks_counters_delete
    AFTER DELETE
    ON "Task"
    FOR EACH ROW
    EXECUTE PROCEDURE update_tasks_counters_delete();

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
$$;

CREATE TRIGGER update_tasks_counters_update
    AFTER UPDATE
    ON "Task"
    FOR EACH ROW
    WHEN (NEW."status" IS NOT NULL)
    EXECUTE PROCEDURE update_tasks_counters_update();

-- usage: SELECT deleteTaskAndJobsByJobId('3fa85f64-5717-4562-b3fc-2c963f66afa6')
CREATE OR REPLACE FUNCTION deleteTaskAndJobsByJobId(jobId text) RETURNS bool AS $func$

BEGIN

delete from "Task"
where "jobId" = jobId::uuid;

delete from "Job"
where "id" = jobId::uuid;

RETURN true;

END
$func$ LANGUAGE plpgsql;


-- usage: SELECT deleteTaskAndJobsByJobType('jobString')
CREATE OR REPLACE FUNCTION deleteTaskAndJobsByJobType(jobType text) RETURNS bool AS $func$

BEGIN

delete from "Task" where "jobId" in (select id from "Job" where "type" = jobType);

delete from "Job" where "type" = jobType;

RETURN true;

END
$func$ LANGUAGE plpgsql;

