-- Alter the table to add the modified and new constraints
ALTER TYPE "JobManager"."operation_status_enum" ADD VALUE 'Suspended';

ALTER TABLE "Job" ADD COLUMN "suspendedTasks" INT DEFAULT 0 NOT NULL;

ALTER TABLE "Job" 
DROP CONSTRAINT IF EXISTS "UQ_uniqueness_on_active_tasks";

ALTER TABLE "Job"
ADD CONSTRAINT "UQ_uniqueness_on_active_tasks" EXCLUDE ("resourceId" with =, "version" with =, "type" with =, "additionalIdentifiers" with =) WHERE ((status = 'Pending' OR status = 'In-Progress' OR status = 'Suspended') AND ("additionalIdentifiers" IS NOT NULL));

ALTER TABLE "Job"
DROP CONSTRAINT IF EXISTS "UQ_uniqueness_on_active_tasks_no_additional_identifier";

ALTER TABLE "Job"
ADD CONSTRAINT "UQ_uniqueness_on_active_tasks_no_additional_identifier" EXCLUDE ("resourceId" with =, "version" with =, "type" with =) WHERE ((status = 'Pending' OR status = 'In-Progress' OR status = 'Suspended') AND ("additionalIdentifiers" IS NULL));

CREATE OR REPLACE FUNCTION update_tasks_counters_insert() RETURNS trigger
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
    "abortedTasks" = "abortedTasks" + CASE WHEN NEW."status" = 'Aborted' THEN 1 ELSE 0 END,
    "suspendedTasks" = "suspendedTasks" + CASE WHEN NEW."status" = 'Suspended' THEN 1 ELSE 0 END
  WHERE id = NEW."jobId";
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION update_tasks_counters_delete() RETURNS trigger
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
    "abortedTasks" = "abortedTasks" - CASE WHEN OLD."status" = 'Aborted' THEN 1 ELSE 0 END,
    "suspendedTasks" = "suspendedTasks" - CASE WHEN OLD."status" = 'Suspended' THEN 1 ELSE 0 END
  WHERE id = OLD."jobId";
  RETURN NULL;
END;
$$;


CREATE OR REPLACE FUNCTION update_tasks_counters_update() RETURNS trigger
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
      "abortedTasks" = "abortedTasks" + CASE WHEN NEW."status" = 'Aborted' THEN 1 WHEN OLD."status" = 'Aborted' THEN -1 ELSE 0 END,
      "suspendedTasks" = "suspendedTasks" + CASE WHEN NEW."status" = 'Suspended' THEN 1 WHEN OLD."status" = 'Suspended' THEN -1 ELSE 0 END
    WHERE id = NEW."jobId";
  END IF;
  RETURN NULL;
END;
$$;
