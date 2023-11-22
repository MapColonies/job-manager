CREATE INDEX "jobParametersIndex"
  ON "JobManager"."Job" USING btree
  (parameters ASC NULLS LAST);
