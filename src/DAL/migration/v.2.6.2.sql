SET search_path TO "JobManager", public; -- CHANGE SCHEMA NAME TO MATCH ENVIRONMENT

-- Remove duplication if exists before migration

WITH marked_for_delete AS (
  SELECT *,
         ROW_NUMBER() OVER (PARTITION BY "additionalIdentifiers", "resourceId", "version", "type" ORDER BY id) AS rn
  FROM "Job"
  WHERE ("additionalIdentifiers" IS NULL AND "resourceId" IS NOT NULL AND "version" IS NOT NULL AND "type" IS NOT NULL) OR
        ("additionalIdentifiers" IS NOT NULL AND "resourceId" IS NOT NULL AND "version" IS NOT NULL AND "type" IS NOT NULL)
)

DELETE FROM "Task"
USING marked_for_delete m
WHERE "Task"."jobId" = m.id AND m.rn > 1;

WITH marked_for_delete AS (
  SELECT *,
         ROW_NUMBER() OVER (PARTITION BY "additionalIdentifiers", "resourceId", "version", "type" ORDER BY id) AS rn
  FROM "Job"
  WHERE ("additionalIdentifiers" IS NULL AND "resourceId" IS NOT NULL AND "version" IS NOT NULL AND "type" IS NOT NULL) OR
        ("additionalIdentifiers" IS NOT NULL AND "resourceId" IS NOT NULL AND "version" IS NOT NULL AND "type" IS NOT NULL)
)

DELETE FROM "Job"
USING marked_for_delete m
WHERE "Job".id = m.id AND m.rn > 1;

-- add the new constraint update

ALTER TABLE "Job" 
DROP CONSTRAINT IF EXISTS "UQ_uniqueness_on_active_tasks";

-- Alter the table to add the modified and new constraints
ALTER TABLE "Job"
ADD CONSTRAINT "UQ_uniqueness_on_active_tasks" EXCLUDE ("resourceId" with =, "version" with =, "type" with =, "additionalIdentifiers" with =) WHERE ((status = 'Pending' OR status = 'In-Progress') AND ("additionalIdentifiers" IS NOT NULL));

ALTER TABLE "Job"
ADD CONSTRAINT "UQ_uniqueness_on_active_tasks_no_additional_identifier" EXCLUDE ("resourceId" with =, "version" with =, "type" with =) WHERE ((status = 'Pending' OR status = 'In-Progress') AND ("additionalIdentifiers" IS NULL));
