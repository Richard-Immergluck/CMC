-- Ensure Supabase Data API roles have no direct access to public sequences.
-- The application uses server-side Prisma, so browser-facing database roles
-- should not receive sequence privileges even when RLS protects tables.
DO $$
BEGIN
  IF to_regrole('anon') IS NOT NULL THEN
    REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;
  END IF;

  IF to_regrole('authenticated') IS NOT NULL THEN
    REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
  END IF;
END $$;
