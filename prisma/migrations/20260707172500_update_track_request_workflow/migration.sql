ALTER TABLE "TrackRequest" ADD COLUMN "fulfilledByTrackId" INTEGER;

ALTER TABLE "TrackRequest"
  ADD CONSTRAINT "TrackRequest_fulfilledByTrackId_fkey"
  FOREIGN KEY ("fulfilledByTrackId")
  REFERENCES "Track"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE INDEX "TrackRequest_fulfilledByTrackId_idx" ON "TrackRequest"("fulfilledByTrackId");

ALTER TABLE "TrackRequest" ALTER COLUMN "status" DROP DEFAULT;

CREATE TYPE "TrackRequestStatus_new" AS ENUM (
  'OPEN',
  'PENDING_DECISION',
  'ACCEPTED',
  'REJECTED',
  'COMPLETED'
);

ALTER TABLE "TrackRequest"
  ALTER COLUMN "status" TYPE "TrackRequestStatus_new"
  USING (
    CASE "status"::text
      WHEN 'OPEN' THEN 'OPEN'
      WHEN 'IN_PROGRESS' THEN 'PENDING_DECISION'
      WHEN 'FULFILLED' THEN 'COMPLETED'
      WHEN 'CLOSED' THEN 'REJECTED'
      ELSE 'OPEN'
    END
  )::"TrackRequestStatus_new";

DROP TYPE "TrackRequestStatus";

ALTER TYPE "TrackRequestStatus_new" RENAME TO "TrackRequestStatus";

ALTER TABLE "TrackRequest" ALTER COLUMN "status" SET DEFAULT 'OPEN';
