CREATE TYPE "TrackRequestResponseStatus" AS ENUM (
  'ACCEPTED',
  'DECLINED',
  'COMPLETED',
  'WITHDRAWN'
);

ALTER TABLE "TrackRequest" ADD COLUMN "expiresAt" TIMESTAMP(3);

UPDATE "TrackRequest"
SET "expiresAt" = "createdAt" + INTERVAL '2 months'
WHERE "expiresAt" IS NULL;

CREATE TABLE "TrackRequestResponse" (
  "id" SERIAL NOT NULL,
  "requestId" INTEGER NOT NULL,
  "respondedById" TEXT NOT NULL,
  "fulfilledByTrackId" INTEGER,
  "status" "TrackRequestResponseStatus" NOT NULL DEFAULT 'ACCEPTED',
  "pricePence" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'gbp',
  "catalogueType" "CatalogueType" NOT NULL DEFAULT 'SINGLE_TRACK',
  "saleFormat" "SaleFormat" NOT NULL DEFAULT 'INDIVIDUAL',
  "pricingReviewStatus" "PricingReviewStatus" NOT NULL DEFAULT 'AUTO_APPROVED',
  "pricingJustification" TEXT,
  "responseNote" TEXT,
  "rejectionReason" TEXT,
  "rejectionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),

  CONSTRAINT "TrackRequestResponse_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TrackRequestResponse"
  ADD CONSTRAINT "TrackRequestResponse_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "TrackRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrackRequestResponse"
  ADD CONSTRAINT "TrackRequestResponse_respondedById_fkey"
  FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrackRequestResponse"
  ADD CONSTRAINT "TrackRequestResponse_fulfilledByTrackId_fkey"
  FOREIGN KEY ("fulfilledByTrackId") REFERENCES "Track"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "TrackRequestResponse_requestId_respondedById_key"
  ON "TrackRequestResponse"("requestId", "respondedById");

CREATE INDEX "TrackRequestResponse_requestId_status_idx"
  ON "TrackRequestResponse"("requestId", "status");

CREATE INDEX "TrackRequestResponse_respondedById_createdAt_idx"
  ON "TrackRequestResponse"("respondedById", "createdAt");

CREATE INDEX "TrackRequestResponse_fulfilledByTrackId_idx"
  ON "TrackRequestResponse"("fulfilledByTrackId");

CREATE INDEX "TrackRequestResponse_pricingReviewStatus_createdAt_idx"
  ON "TrackRequestResponse"("pricingReviewStatus", "createdAt");

CREATE INDEX "TrackRequest_expiresAt_idx" ON "TrackRequest"("expiresAt");

INSERT INTO "TrackRequestResponse" (
  "requestId",
  "respondedById",
  "fulfilledByTrackId",
  "status",
  "pricePence",
  "currency",
  "catalogueType",
  "saleFormat",
  "pricingReviewStatus",
  "pricingJustification",
  "createdAt",
  "updatedAt",
  "completedAt"
)
SELECT DISTINCT ON (proposal."requestId", proposal."proposedById")
  proposal."requestId",
  proposal."proposedById",
  request."fulfilledByTrackId",
  CASE
    WHEN request."status" = 'COMPLETED' THEN 'COMPLETED'::"TrackRequestResponseStatus"
    ELSE 'ACCEPTED'::"TrackRequestResponseStatus"
  END,
  proposal."pricePence",
  proposal."currency",
  proposal."catalogueType",
  proposal."saleFormat",
  proposal."reviewStatus",
  proposal."justification",
  proposal."createdAt",
  proposal."updatedAt",
  CASE
    WHEN request."status" = 'COMPLETED' THEN request."updatedAt"
    ELSE NULL
  END
FROM "RequestPricingProposal" proposal
JOIN "TrackRequest" request ON request."id" = proposal."requestId"
ORDER BY proposal."requestId", proposal."proposedById", proposal."createdAt" DESC
ON CONFLICT ("requestId", "respondedById") DO NOTHING;

INSERT INTO "TrackRequestResponse" (
  "requestId",
  "respondedById",
  "fulfilledByTrackId",
  "status",
  "createdAt",
  "updatedAt",
  "completedAt"
)
SELECT
  request."id",
  track."userId",
  request."fulfilledByTrackId",
  CASE
    WHEN request."status" = 'COMPLETED' THEN 'COMPLETED'::"TrackRequestResponseStatus"
    ELSE 'ACCEPTED'::"TrackRequestResponseStatus"
  END,
  request."updatedAt",
  request."updatedAt",
  CASE
    WHEN request."status" = 'COMPLETED' THEN request."updatedAt"
    ELSE NULL
  END
FROM "TrackRequest" request
JOIN "Track" track ON track."id" = request."trackId"
WHERE request."status" IN ('ACCEPTED', 'COMPLETED')
ON CONFLICT ("requestId", "respondedById") DO NOTHING;

ALTER TABLE "TrackRequestResponse" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "TrackRequestResponse" FROM anon;
    REVOKE ALL ON SEQUENCE "TrackRequestResponse_id_seq" FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "TrackRequestResponse" FROM authenticated;
    REVOKE ALL ON SEQUENCE "TrackRequestResponse_id_seq" FROM authenticated;
  END IF;
END $$;
