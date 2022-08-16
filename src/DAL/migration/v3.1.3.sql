SET search_path TO "JobManager", public; -- CHANGE SCHEMA NAME TO MATCH ENVIRONMENT
ALTER TABLE "Job"
  ADD COLUMN "additionalIdentifiers" text COLLATE pg_catalog."default",
  DROP CONSTRAINT "UQ_uniqueness_on_active_tasks",
  ADD CONSTRAINT "UQ_uniqueness_on_active_tasks" EXCLUDE ("resourceId" with =, "version" with =, "type" with =, "additionalIdentifiers" with =) WHERE (status = 'Pending' OR status = 'In-Progress');

CREATE INDEX "additionalIdentifiersIndex"
  ON "Job" USING btree
  ("additionalIdentifiers" ASC NULLS LAST);
