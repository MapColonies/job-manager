-- v2.0.0 db creation script --
-- please note that the update date is updated by typeOrm and not by trigger --
SET search_path TO public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

SET search_path TO "JobManager", public; -- CHANGE SCHEMA NAME TO MATCH ENVIRONMENT
CREATE TYPE "operation_status_enum" AS ENUM
    ('Pending', 'In-Progress', 'Completed', 'Failed');

CREATE TABLE "Job"
(
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "resourceId" character varying(300) COLLATE pg_catalog."default" NOT NULL,
  "version" character varying(30) COLLATE pg_catalog."default" NOT NULL,
  "type" character varying(255) COLLATE pg_catalog."default" NOT NULL,
  "description" character varying(2000) COLLATE pg_catalog."default" NOT NULL DEFAULT ''::character varying,
  "parameters" jsonb NOT NULL,
  "creationTime" timestamp without time zone NOT NULL DEFAULT now(),
  "updateTime" timestamp without time zone NOT NULL DEFAULT now(),
  "status" "operation_status_enum" NOT NULL DEFAULT 'Pending'::"operation_status_enum",
  "percentage" smallint,
  "reason" character varying(255) COLLATE pg_catalog."default" NOT NULL DEFAULT ''::character varying,
  "isCleaned" boolean NOT NULL DEFAULT false,
  CONSTRAINT "PK_job_id" PRIMARY KEY (id)
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

CREATE INDEX "jobTypeIndex"
    ON "Job" USING btree
    (type COLLATE pg_catalog."default" ASC NULLS LAST);

CREATE TABLE "Task"
(
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "type" character varying(255) COLLATE pg_catalog."default" NOT NULL,
  "description" character varying(2000) COLLATE pg_catalog."default" NOT NULL DEFAULT ''::character varying, 
  "parameters" jsonb NOT NULL,
  "creationTime" timestamp without time zone NOT NULL DEFAULT now(),
  "updateTime" timestamp without time zone NOT NULL DEFAULT now(),
  "status" "operation_status_enum" NOT NULL DEFAULT 'Pending'::"operation_status_enum",
  "percentage" smallint, 
  "reason" character varying(255) COLLATE pg_catalog."default" NOT NULL DEFAULT ''::character varying, 
  "attempts" integer NOT NULL DEFAULT 0,
  "jobId" uuid NOT NULL,
  CONSTRAINT "PK_task_id" PRIMARY KEY (id), 
  CONSTRAINT "FK_task_job_id" FOREIGN KEY ("jobId") REFERENCES "Job" (id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION
);
