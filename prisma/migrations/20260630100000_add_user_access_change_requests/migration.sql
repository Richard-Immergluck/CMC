CREATE TYPE "UserAccessChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "UserAccessChangeRequest" (
    "id" SERIAL NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "status" "UserAccessChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedRole" "UserRole",
    "requestedAccountStatus" "UserAccountStatus",
    "requestedUploaderStatus" "UploaderStatus",
    "reason" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "UserAccessChangeRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserAccessChangeRequest_status_createdAt_idx"
  ON "UserAccessChangeRequest"("status", "createdAt");
CREATE INDEX "UserAccessChangeRequest_targetUserId_idx"
  ON "UserAccessChangeRequest"("targetUserId");
CREATE INDEX "UserAccessChangeRequest_requestedById_idx"
  ON "UserAccessChangeRequest"("requestedById");
CREATE INDEX "UserAccessChangeRequest_reviewedById_idx"
  ON "UserAccessChangeRequest"("reviewedById");

ALTER TABLE "UserAccessChangeRequest"
  ADD CONSTRAINT "UserAccessChangeRequest_targetUserId_fkey"
  FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAccessChangeRequest"
  ADD CONSTRAINT "UserAccessChangeRequest_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserAccessChangeRequest"
  ADD CONSTRAINT "UserAccessChangeRequest_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserAccessChangeRequest" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regrole('anon') IS NOT NULL THEN
    REVOKE ALL ON TABLE "UserAccessChangeRequest" FROM anon;
    REVOKE USAGE, SELECT, UPDATE ON SEQUENCE "UserAccessChangeRequest_id_seq" FROM anon;
  END IF;

  IF to_regrole('authenticated') IS NOT NULL THEN
    REVOKE ALL ON TABLE "UserAccessChangeRequest" FROM authenticated;
    REVOKE USAGE, SELECT, UPDATE ON SEQUENCE "UserAccessChangeRequest_id_seq" FROM authenticated;
  END IF;
END $$;
