SET search_path TO "JobManager", public; -- CHANGE SCHEMA NAME TO MATCH ENVIRONMENT

ALTER TYPE "JobManager"."operation_status_enum" ADD VALUE 'Suspended';

ALTER TABLE "Job" 
DROP CONSTRAINT IF EXISTS "UQ_uniqueness_on_active_tasks";

ALTER TABLE "Job"
ADD CONSTRAINT "UQ_uniqueness_on_active_tasks" EXCLUDE ("resourceId" with =, "version" with =, "type" with =, "additionalIdentifiers" with =) WHERE ((status = 'Pending' OR status = 'In-Progress' OR status = 'Suspended') AND ("additionalIdentifiers" IS NOT NULL));

ALTER TABLE "Job"
DROP CONSTRAINT IF EXISTS "UQ_uniqueness_on_active_tasks_no_additional_identifier";

ALTER TABLE "Job"
ADD CONSTRAINT "UQ_uniqueness_on_active_tasks_no_additional_identifier" EXCLUDE ("resourceId" with =, "version" with =, "type" with =) WHERE ((status = 'Pending' OR status = 'In-Progress' OR status = 'Suspended') AND ("additionalIdentifiers" IS NULL));