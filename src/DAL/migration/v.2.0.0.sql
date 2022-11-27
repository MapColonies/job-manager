-- v1.2.0 db migration script --
SET search_path TO "JobManager", public; -- CHANGE SCHEMA NAME TO MATCH ENVIRONMENT

ALTER TABLE "Job" ADD COLUMN "domain" text COLLATE pg_catalog."default" NOT NULL DEFAULT ''::text;