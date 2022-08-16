SET search_path TO "JobManager", public; -- CHANGE SCHEMA NAME TO MATCH ENVIRONMENT
ALTER TABLE "Job"
  ADD COLUMN "expirationDate" timestamp with time zone;

CREATE INDEX "jobExpirationDateIndex"
    ON "Job" USING btree
    ("expirationDate" DESC NULLS LAST);

ALTER TYPE operation_status_enum ADD VALUE 'Expired';
