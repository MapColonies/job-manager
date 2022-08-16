SET search_path TO "JobManager", public; -- CHANGE SCHEMA NAME TO MATCH ENVIRONMENT

ALTER TABLE "Task"
    ADD COLUMN "block_duplication" boolean NOT NULL DEFAULT false;
	
ALTER TABLE "Task"
	ADD CONSTRAINT "UQ_uniqueness_on_job_and_type" EXCLUDE ("type" with =, "jobId" with =) WHERE ("block_duplication" = true);
