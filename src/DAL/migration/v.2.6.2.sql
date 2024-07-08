SET search_path TO "JobManager", public; -- CHANGE SCHEMA NAME TO MATCH ENVIRONMENT

WITH marked_for_delete AS (
	SELECT unnest((array_agg(id))[2:]) id
	FROM "Job"
	WHERE ((status = 'Pending' OR status = 'In-Progress') AND ("additionalIdentifiers" IS NULL)) 
	GROUP BY "resourceId","version","type"
), deleteTasks as (
	DELETE FROM "Task"
	USING marked_for_delete m
	WHERE "Task"."jobId" = m.id
)
DELETE FROM "Job"
USING marked_for_delete m
WHERE "Job".id = m.id;

-- Alter the table to add the modified and new constraints

ALTER TABLE "Job" 
DROP CONSTRAINT IF EXISTS "UQ_uniqueness_on_active_tasks";

ALTER TABLE "Job"
ADD CONSTRAINT "UQ_uniqueness_on_active_tasks" EXCLUDE ("resourceId" with =, "version" with =, "type" with =, "additionalIdentifiers" with =) WHERE ((status = 'Pending' OR status = 'In-Progress') AND ("additionalIdentifiers" IS NOT NULL));

ALTER TABLE "Job"
DROP CONSTRAINT IF EXISTS "UQ_uniqueness_on_active_tasks_no_additional_identifier";

ALTER TABLE "Job"
ADD CONSTRAINT "UQ_uniqueness_on_active_tasks_no_additional_identifier" EXCLUDE ("resourceId" with =, "version" with =, "type" with =) WHERE ((status = 'Pending' OR status = 'In-Progress') AND ("additionalIdentifiers" IS NULL));
