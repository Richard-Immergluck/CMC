ALTER TABLE "CatalogueRelease" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CatalogueReleaseTrack" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RequestPricingProposal" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regrole('anon') IS NOT NULL THEN
    REVOKE ALL PRIVILEGES ON TABLE
      "CatalogueRelease",
      "CatalogueReleaseTrack",
      "RequestPricingProposal"
    FROM anon;

    REVOKE ALL PRIVILEGES ON SEQUENCE
      "CatalogueRelease_id_seq",
      "CatalogueReleaseTrack_id_seq",
      "RequestPricingProposal_id_seq"
    FROM anon;
  END IF;

  IF to_regrole('authenticated') IS NOT NULL THEN
    REVOKE ALL PRIVILEGES ON TABLE
      "CatalogueRelease",
      "CatalogueReleaseTrack",
      "RequestPricingProposal"
    FROM authenticated;

    REVOKE ALL PRIVILEGES ON SEQUENCE
      "CatalogueRelease_id_seq",
      "CatalogueReleaseTrack_id_seq",
      "RequestPricingProposal_id_seq"
    FROM authenticated;
  END IF;
END $$;
