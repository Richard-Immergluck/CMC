ALTER TABLE "User" ADD COLUMN "sessionRevokedBefore" TIMESTAMP(3);

CREATE INDEX "User_sessionRevokedBefore_idx" ON "User"("sessionRevokedBefore");
