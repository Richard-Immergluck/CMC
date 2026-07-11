CREATE TYPE "UploadBatchStatus" AS ENUM (
  'DRAFT',
  'UPLOADING',
  'READY_FOR_REVIEW',
  'SUBMITTED',
  'PARTIALLY_FAILED',
  'COMPLETED',
  'ARCHIVED'
);

CREATE TABLE "UploadBatch" (
  "id" SERIAL NOT NULL,
  "userId" TEXT NOT NULL,
  "label" TEXT,
  "defaultComposer" TEXT,
  "defaultInstrumentation" TEXT,
  "defaultPricePence" INTEGER,
  "status" "UploadBatchStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),

  CONSTRAINT "UploadBatch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Track"
  ADD COLUMN "uploadBatchId" INTEGER;

CREATE INDEX "UploadBatch_userId_createdAt_idx" ON "UploadBatch"("userId", "createdAt");
CREATE INDEX "UploadBatch_status_createdAt_idx" ON "UploadBatch"("status", "createdAt");
CREATE INDEX "Track_uploadBatchId_idx" ON "Track"("uploadBatchId");

ALTER TABLE "UploadBatch"
  ADD CONSTRAINT "UploadBatch_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Track"
  ADD CONSTRAINT "Track_uploadBatchId_fkey"
  FOREIGN KEY ("uploadBatchId") REFERENCES "UploadBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UploadBatch" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regrole('anon') IS NOT NULL THEN
    REVOKE ALL ON TABLE "UploadBatch" FROM anon;
    REVOKE ALL ON SEQUENCE "UploadBatch_id_seq" FROM anon;
  END IF;

  IF to_regrole('authenticated') IS NOT NULL THEN
    REVOKE ALL ON TABLE "UploadBatch" FROM authenticated;
    REVOKE ALL ON SEQUENCE "UploadBatch_id_seq" FROM authenticated;
  END IF;
END $$;
