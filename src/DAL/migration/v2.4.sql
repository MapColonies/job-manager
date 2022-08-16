SET search_path TO "JobManager", public; -- CHANGE SCHEMA NAME TO MATCH ENVIRONMENT
ALTER TABLE "Task"
  ADD COLUMN "resettable" BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX "taskResettableIndex"
    ON "Task" ("resettable")
    WHERE "resettable" = FALSE;
