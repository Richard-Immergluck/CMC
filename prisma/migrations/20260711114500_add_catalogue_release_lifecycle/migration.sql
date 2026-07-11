CREATE TYPE "CatalogueReleaseStatus" AS ENUM (
  'PUBLISHED',
  'ARCHIVED'
);

ALTER TABLE "CatalogueRelease"
  ADD COLUMN "status" "CatalogueReleaseStatus" NOT NULL DEFAULT 'PUBLISHED';

CREATE INDEX "CatalogueRelease_status_idx" ON "CatalogueRelease"("status");
CREATE INDEX "CatalogueRelease_status_pricingReviewStatus_idx" ON "CatalogueRelease"("status", "pricingReviewStatus");
