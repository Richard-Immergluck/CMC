ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "sourceReleaseId" INTEGER,
  ADD COLUMN IF NOT EXISTS "sourceReleaseTitle" TEXT;

CREATE INDEX IF NOT EXISTS "OrderItem_sourceReleaseId_idx" ON "OrderItem"("sourceReleaseId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'OrderItem_sourceReleaseId_fkey'
  ) THEN
    ALTER TABLE "OrderItem"
      ADD CONSTRAINT "OrderItem_sourceReleaseId_fkey"
      FOREIGN KEY ("sourceReleaseId") REFERENCES "CatalogueRelease"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
