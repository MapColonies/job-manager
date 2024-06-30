-- v2.6.1 db migration script --
SET search_path TO "JobManager", public; -- CHANGE SCHEMA NAME TO MATCH ENVIRONMENT

ALTER TABLE "Job"
ALTER COLUMN "additionalIdentifiers" SET DEFAULT ''::text;

UPDATE "Job"
SET "additionalIdentifiers" = COALESCE("additionalIdentifiers", '');

ALTER TABLE "Job"
ALTER COLUMN "additionalIdentifiers" SET NOT NULL;
