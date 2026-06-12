-- Enable RLS for application tables exposed through Supabase's public schema.
-- The Next.js app uses server-side Prisma through DATABASE_URL, so browser-side
-- Supabase anon/authenticated roles should not receive direct table access.

ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Track" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrackOwner" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regrole('anon') IS NOT NULL THEN
    REVOKE ALL ON TABLE
      "Account",
      "Session",
      "User",
      "VerificationToken",
      "Track",
      "TrackOwner",
      "Comment",
      "Order",
      "OrderItem",
      "PaymentEvent",
      "_prisma_migrations"
    FROM anon;
  END IF;

  IF to_regrole('authenticated') IS NOT NULL THEN
    REVOKE ALL ON TABLE
      "Account",
      "Session",
      "User",
      "VerificationToken",
      "Track",
      "TrackOwner",
      "Comment",
      "Order",
      "OrderItem",
      "PaymentEvent",
      "_prisma_migrations"
    FROM authenticated;
  END IF;
END $$;
