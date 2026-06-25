-- Add user and track lifecycle fields needed for enterprise moderation,
-- uploader onboarding, catalogue filtering, and operational review.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'UPLOADER', 'ADMIN');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserAccountStatus') THEN
    CREATE TYPE "UserAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UploaderStatus') THEN
    CREATE TYPE "UploaderStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'APPROVED', 'REJECTED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TrackModerationStatus') THEN
    CREATE TYPE "TrackModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TrackProcessingStatus') THEN
    CREATE TYPE "TrackProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');
  END IF;
END $$;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
ADD COLUMN IF NOT EXISTS "accountStatus" "UserAccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS "uploaderStatus" "UploaderStatus" NOT NULL DEFAULT 'NOT_REQUESTED';

ALTER TABLE "Track"
ADD COLUMN IF NOT EXISTS "moderationStatus" "TrackModerationStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN IF NOT EXISTS "processingStatus" "TrackProcessingStatus" NOT NULL DEFAULT 'READY',
ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "durationSeconds" INTEGER,
ADD COLUMN IF NOT EXISTS "sourceContentType" TEXT,
ADD COLUMN IF NOT EXISTS "moderationNotes" TEXT,
ADD COLUMN IF NOT EXISTS "processingError" TEXT;

UPDATE "Track"
SET
  "moderationStatus" = 'APPROVED',
  "processingStatus" = 'READY',
  "publishedAt" = COALESCE("publishedAt", "uploadedAt"),
  "reviewedAt" = COALESCE("reviewedAt", "uploadedAt")
WHERE "status" = 'PUBLISHED';

UPDATE "Track"
SET "moderationStatus" = 'REJECTED'
WHERE "status" = 'REJECTED';

UPDATE "Track"
SET "processingStatus" = 'PROCESSING'
WHERE "status" = 'PROCESSING';

CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_accountStatus_idx" ON "User"("accountStatus");
CREATE INDEX IF NOT EXISTS "User_uploaderStatus_idx" ON "User"("uploaderStatus");

CREATE INDEX IF NOT EXISTS "Track_status_moderationStatus_processingStatus_idx"
  ON "Track"("status", "moderationStatus", "processingStatus");
CREATE INDEX IF NOT EXISTS "Track_status_uploadedAt_idx" ON "Track"("status", "uploadedAt");
CREATE INDEX IF NOT EXISTS "Track_userId_status_idx" ON "Track"("userId", "status");

CREATE INDEX IF NOT EXISTS "TrackOwner_userId_purchasedAt_idx" ON "TrackOwner"("userId", "purchasedAt");
CREATE INDEX IF NOT EXISTS "TrackOwner_trackId_purchasedAt_idx" ON "TrackOwner"("trackId", "purchasedAt");

CREATE INDEX IF NOT EXISTS "Order_userId_status_createdAt_idx" ON "Order"("userId", "status", "createdAt");
