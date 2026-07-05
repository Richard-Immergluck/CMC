-- Add first-class track requests so member profiles can show real request activity.
-- The application continues to access data server-side through Prisma; Supabase
-- anon/authenticated roles are not granted direct table access.

CREATE TYPE "TrackRequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'FULFILLED', 'CLOSED');

CREATE TABLE "TrackRequest" (
  "id" SERIAL NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "composer" TEXT,
  "instrumentation" TEXT,
  "notes" TEXT,
  "status" "TrackRequestStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TrackRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TrackRequest"
  ADD CONSTRAINT "TrackRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "TrackRequest_userId_createdAt_idx" ON "TrackRequest"("userId", "createdAt");
CREATE INDEX "TrackRequest_status_createdAt_idx" ON "TrackRequest"("status", "createdAt");

ALTER TABLE "TrackRequest" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regrole('anon') IS NOT NULL THEN
    REVOKE ALL ON TABLE "TrackRequest" FROM anon;
    REVOKE ALL ON SEQUENCE "TrackRequest_id_seq" FROM anon;
  END IF;

  IF to_regrole('authenticated') IS NOT NULL THEN
    REVOKE ALL ON TABLE "TrackRequest" FROM authenticated;
    REVOKE ALL ON SEQUENCE "TrackRequest_id_seq" FROM authenticated;
  END IF;
END $$;
