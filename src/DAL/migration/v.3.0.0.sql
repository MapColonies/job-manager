SET search_path TO "JobManager", public; -- CHANGE SCHEMA NAME TO MATCH ENVIRONMENT

-- Update existing null values to 0 in Job table
UPDATE "Job"
SET "percentage" = 0
WHERE "percentage" IS NULL;

-- Update existing null values to 0 in Task table
UPDATE "Task"
SET "percentage" = 0
WHERE "percentage" IS NULL;

-- Modify Job table column
ALTER TABLE "Job"
ALTER COLUMN "percentage" SET DEFAULT 0,
ALTER COLUMN "percentage" SET NOT NULL;

-- Modify Task table column
ALTER TABLE "Task"
ALTER COLUMN "percentage" SET DEFAULT 0,
ALTER COLUMN "percentage" SET NOT NULL;

COMMENT ON COLUMN "Job"."percentage" IS 'Percentage of job completion (0-100). Default is 0.';
COMMENT ON COLUMN "Task"."percentage" IS 'Percentage of task completion (0-100). Default is 0.';