SET search_path TO "JobManager", public; -- CHANGE SCHEMA NAME TO MATCH ENVIRONMENT
ALTER TABLE "Job"
  ADD COLUMN  "internalId" uuid,
  ADD COLUMN "producerName" text COLLATE pg_catalog."default",
  ADD COLUMN "productName" text COLLATE pg_catalog."default",
  ADD COLUMN "productType" text COLLATE pg_catalog."default",
  ADD COLUMN "taskCount" int NOT NULL DEFAULT 0,
  ADD COLUMN "completedTasks" int NOT NULL DEFAULT 0,
  ADD COLUMN "failedTasks" int NOT NULL DEFAULT 0,
  ADD COLUMN "expiredTasks" int NOT NULL DEFAULT 0,
  ADD COLUMN "pendingTasks" int NOT NULL DEFAULT 0,
  ADD COLUMN "inProgressTasks" int NOT NULL DEFAULT 0;

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
    "inProgressTasks" = "inProgressTasks" + CASE WHEN NEW."status" = 'In-Progress' THEN 1 ELSE 0 END
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
    "inProgressTasks" = "inProgressTasks" - CASE WHEN OLD."status" = 'In-Progress' THEN 1 ELSE 0 END
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
      "inProgressTasks" = "inProgressTasks" + CASE WHEN NEW."status" = 'In-Progress' THEN 1 WHEN OLD."status" = 'In-Progress' THEN -1 ELSE 0 END
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


Update "Job"
  SET "taskCount" = tc."taskCount",
    "completedTasks" = tc."completedTasks",
    "failedTasks" = tc."failedTasks",
    "expiredTasks" = tc."expiredTasks",
    "pendingTasks" = tc."pendingTasks",
    "inProgressTasks" = tc."inProgressTasks" 
  FROM(
    SELECT "jobId", count(*) AS "taskCount", 
    count(*) FILTER (WHERE tk."status" = 'Completed' ) AS "completedTasks",
    count(*) FILTER (WHERE tk."status" = 'Failed' ) AS "failedTasks",
    count(*) FILTER (WHERE tk."status" = 'Expired' ) AS "expiredTasks",
    count(*) FILTER (WHERE tk."status" = 'Pending' ) AS "pendingTasks",
    count(*) FILTER (WHERE tk."status" = 'In-Progress' ) AS "inProgressTasks"
    FROM "Task" AS tk
    GROUP BY tk."jobId"
  ) AS tc
  WHERE "Job".id = tc."jobId";
