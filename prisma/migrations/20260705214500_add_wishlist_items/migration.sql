-- Persist customer wishlist intent separately from purchases.
CREATE TABLE "WishlistItem" (
    "id" SERIAL NOT NULL,
    "trackId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WishlistItem_trackId_userId_key" ON "WishlistItem"("trackId", "userId");
CREATE INDEX "WishlistItem_userId_createdAt_idx" ON "WishlistItem"("userId", "createdAt");
CREATE INDEX "WishlistItem_trackId_idx" ON "WishlistItem"("trackId");

ALTER TABLE "WishlistItem"
    ADD CONSTRAINT "WishlistItem_trackId_fkey"
    FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WishlistItem"
    ADD CONSTRAINT "WishlistItem_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WishlistItem" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regrole('anon') IS NOT NULL THEN
    REVOKE ALL ON TABLE "WishlistItem" FROM anon;
    REVOKE USAGE, SELECT ON SEQUENCE "WishlistItem_id_seq" FROM anon;
  END IF;

  IF to_regrole('authenticated') IS NOT NULL THEN
    REVOKE ALL ON TABLE "WishlistItem" FROM authenticated;
    REVOKE USAGE, SELECT ON SEQUENCE "WishlistItem_id_seq" FROM authenticated;
  END IF;
END $$;
