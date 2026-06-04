-- Track lifecycle and safer money storage.
CREATE TYPE "TrackStatus" AS ENUM ('DRAFT', 'PROCESSING', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

ALTER TABLE "Track"
ADD COLUMN "status" "TrackStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "pricePence" INTEGER,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'gbp';

UPDATE "Track"
SET "pricePence" = ROUND("price" * 100)::INTEGER
WHERE "price" IS NOT NULL AND "pricePence" IS NULL;

CREATE INDEX "Track_status_idx" ON "Track"("status");
CREATE INDEX "Track_userId_idx" ON "Track"("userId");
