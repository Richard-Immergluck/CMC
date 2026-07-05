-- Link track requests to catalogue tracks so profiles can deep-link into the
-- request tab on the relevant track detail page.

ALTER TABLE "TrackRequest" ADD COLUMN "trackId" INTEGER;

ALTER TABLE "TrackRequest"
  ADD CONSTRAINT "TrackRequest_trackId_fkey"
  FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "TrackRequest_trackId_createdAt_idx" ON "TrackRequest"("trackId", "createdAt");
