CREATE TYPE "CatalogueType" AS ENUM (
  'SINGLE_TRACK',
  'MOVEMENT',
  'SONG_CYCLE',
  'COLLECTION',
  'LEARNING_PACK',
  'OPERA_EXCERPT',
  'COMPLETE_WORK'
);

CREATE TYPE "SaleFormat" AS ENUM (
  'INDIVIDUAL',
  'BUNDLE',
  'BOTH'
);

CREATE TYPE "PricingReviewStatus" AS ENUM (
  'AUTO_APPROVED',
  'NEEDS_REVIEW',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE "RequestPricingDecisionStatus" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'SUPERSEDED'
);

ALTER TABLE "Track"
  ADD COLUMN "catalogueType" "CatalogueType" NOT NULL DEFAULT 'SINGLE_TRACK',
  ADD COLUMN "saleFormat" "SaleFormat" NOT NULL DEFAULT 'INDIVIDUAL',
  ADD COLUMN "pricingTier" TEXT,
  ADD COLUMN "pricingReviewStatus" "PricingReviewStatus" NOT NULL DEFAULT 'AUTO_APPROVED',
  ADD COLUMN "pricingJustification" TEXT;

CREATE TABLE "CatalogueRelease" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "composer" TEXT,
  "catalogueType" "CatalogueType" NOT NULL,
  "saleFormat" "SaleFormat" NOT NULL DEFAULT 'BUNDLE',
  "pricePence" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'gbp',
  "formattedPrice" TEXT,
  "pricingReviewStatus" "PricingReviewStatus" NOT NULL DEFAULT 'AUTO_APPROVED',
  "pricingJustification" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CatalogueRelease_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CatalogueReleaseTrack" (
  "id" SERIAL NOT NULL,
  "releaseId" INTEGER NOT NULL,
  "trackId" INTEGER NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "movementNo" TEXT,
  "titleInWork" TEXT,

  CONSTRAINT "CatalogueReleaseTrack_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RequestPricingProposal" (
  "id" SERIAL NOT NULL,
  "requestId" INTEGER NOT NULL,
  "proposedById" TEXT NOT NULL,
  "pricePence" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'gbp',
  "catalogueType" "CatalogueType" NOT NULL DEFAULT 'SINGLE_TRACK',
  "saleFormat" "SaleFormat" NOT NULL DEFAULT 'INDIVIDUAL',
  "reviewStatus" "PricingReviewStatus" NOT NULL DEFAULT 'AUTO_APPROVED',
  "requesterDecision" "RequestPricingDecisionStatus" NOT NULL DEFAULT 'PENDING',
  "justification" TEXT,
  "requesterNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "requesterRespondedAt" TIMESTAMP(3),

  CONSTRAINT "RequestPricingProposal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Track_catalogueType_idx" ON "Track"("catalogueType");
CREATE INDEX "Track_pricingReviewStatus_idx" ON "Track"("pricingReviewStatus");

CREATE INDEX "CatalogueRelease_catalogueType_idx" ON "CatalogueRelease"("catalogueType");
CREATE INDEX "CatalogueRelease_saleFormat_idx" ON "CatalogueRelease"("saleFormat");
CREATE INDEX "CatalogueRelease_userId_createdAt_idx" ON "CatalogueRelease"("userId", "createdAt");
CREATE INDEX "CatalogueRelease_pricingReviewStatus_idx" ON "CatalogueRelease"("pricingReviewStatus");

CREATE UNIQUE INDEX "CatalogueReleaseTrack_releaseId_trackId_key" ON "CatalogueReleaseTrack"("releaseId", "trackId");
CREATE INDEX "CatalogueReleaseTrack_releaseId_position_idx" ON "CatalogueReleaseTrack"("releaseId", "position");
CREATE INDEX "CatalogueReleaseTrack_trackId_idx" ON "CatalogueReleaseTrack"("trackId");

CREATE INDEX "RequestPricingProposal_requestId_createdAt_idx" ON "RequestPricingProposal"("requestId", "createdAt");
CREATE INDEX "RequestPricingProposal_proposedById_createdAt_idx" ON "RequestPricingProposal"("proposedById", "createdAt");
CREATE INDEX "RequestPricingProposal_reviewStatus_createdAt_idx" ON "RequestPricingProposal"("reviewStatus", "createdAt");
CREATE INDEX "RequestPricingProposal_requesterDecision_createdAt_idx" ON "RequestPricingProposal"("requesterDecision", "createdAt");

ALTER TABLE "CatalogueRelease"
  ADD CONSTRAINT "CatalogueRelease_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CatalogueReleaseTrack"
  ADD CONSTRAINT "CatalogueReleaseTrack_releaseId_fkey"
  FOREIGN KEY ("releaseId") REFERENCES "CatalogueRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CatalogueReleaseTrack"
  ADD CONSTRAINT "CatalogueReleaseTrack_trackId_fkey"
  FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RequestPricingProposal"
  ADD CONSTRAINT "RequestPricingProposal_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "TrackRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RequestPricingProposal"
  ADD CONSTRAINT "RequestPricingProposal_proposedById_fkey"
  FOREIGN KEY ("proposedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
