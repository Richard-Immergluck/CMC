ALTER TABLE "TrackOwner"
  ADD COLUMN "sourceReleaseId" INTEGER,
  ADD COLUMN "sourceReleaseTitle" TEXT;

ALTER TABLE "TrackOwner"
  ADD CONSTRAINT "TrackOwner_sourceReleaseId_fkey"
  FOREIGN KEY ("sourceReleaseId")
  REFERENCES "CatalogueRelease"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE INDEX "TrackOwner_sourceReleaseId_idx" ON "TrackOwner"("sourceReleaseId");
