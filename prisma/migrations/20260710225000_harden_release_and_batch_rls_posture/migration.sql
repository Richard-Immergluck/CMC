ALTER TABLE "CatalogueRelease" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CatalogueReleaseTrack" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RequestPricingProposal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UploadBatch" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regrole('anon') IS NOT NULL THEN
    REVOKE ALL ON TABLE "CatalogueRelease" FROM anon;
    REVOKE ALL ON TABLE "CatalogueReleaseTrack" FROM anon;
    REVOKE ALL ON TABLE "RequestPricingProposal" FROM anon;
    REVOKE ALL ON TABLE "UploadBatch" FROM anon;

    REVOKE ALL ON SEQUENCE "CatalogueRelease_id_seq" FROM anon;
    REVOKE ALL ON SEQUENCE "CatalogueReleaseTrack_id_seq" FROM anon;
    REVOKE ALL ON SEQUENCE "RequestPricingProposal_id_seq" FROM anon;
    REVOKE ALL ON SEQUENCE "UploadBatch_id_seq" FROM anon;
  END IF;

  IF to_regrole('authenticated') IS NOT NULL THEN
    REVOKE ALL ON TABLE "CatalogueRelease" FROM authenticated;
    REVOKE ALL ON TABLE "CatalogueReleaseTrack" FROM authenticated;
    REVOKE ALL ON TABLE "RequestPricingProposal" FROM authenticated;
    REVOKE ALL ON TABLE "UploadBatch" FROM authenticated;

    REVOKE ALL ON SEQUENCE "CatalogueRelease_id_seq" FROM authenticated;
    REVOKE ALL ON SEQUENCE "CatalogueReleaseTrack_id_seq" FROM authenticated;
    REVOKE ALL ON SEQUENCE "RequestPricingProposal_id_seq" FROM authenticated;
    REVOKE ALL ON SEQUENCE "UploadBatch_id_seq" FROM authenticated;
  END IF;
END $$;
