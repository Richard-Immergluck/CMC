CREATE TABLE "CatalogueTag" (
  "id" SERIAL NOT NULL,
  "slug" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CatalogueTag_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogueTag_slug_format_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT "CatalogueTag_label_length_check" CHECK (char_length("label") BETWEEN 1 AND 80),
  CONSTRAINT "CatalogueTag_sort_order_check" CHECK ("sortOrder" >= 0)
);

CREATE TABLE "CatalogueReleaseTag" (
  "releaseId" INTEGER NOT NULL,
  "tagId" INTEGER NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CatalogueReleaseTag_pkey" PRIMARY KEY ("releaseId", "tagId")
);

CREATE UNIQUE INDEX "CatalogueTag_slug_key" ON "CatalogueTag"("slug");
CREATE INDEX "CatalogueTag_active_sortOrder_idx" ON "CatalogueTag"("active", "sortOrder");
CREATE INDEX "CatalogueReleaseTag_tagId_releaseId_idx" ON "CatalogueReleaseTag"("tagId", "releaseId");

ALTER TABLE "CatalogueReleaseTag"
  ADD CONSTRAINT "CatalogueReleaseTag_releaseId_fkey"
  FOREIGN KEY ("releaseId") REFERENCES "CatalogueRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CatalogueReleaseTag"
  ADD CONSTRAINT "CatalogueReleaseTag_tagId_fkey"
  FOREIGN KEY ("tagId") REFERENCES "CatalogueTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "CatalogueTag" ("slug", "label", "sortOrder", "active", "updatedAt") VALUES
  ('opera', 'Opera', 10, true, CURRENT_TIMESTAMP),
  ('arias', 'Arias', 20, true, CURRENT_TIMESTAMP),
  ('recitatives', 'Recitatives', 30, true, CURRENT_TIMESTAMP),
  ('lieder', 'Lieder', 40, true, CURRENT_TIMESTAMP),
  ('french-melodie', 'French mélodie', 50, true, CURRENT_TIMESTAMP),
  ('english-song', 'English song', 60, true, CURRENT_TIMESTAMP),
  ('oratorio', 'Oratorio', 70, true, CURRENT_TIMESTAMP),
  ('instrumental', 'Instrumental', 80, true, CURRENT_TIMESTAMP),
  ('vocal-anthologies', 'Vocal anthologies', 90, true, CURRENT_TIMESTAMP),
  ('warmups-study', 'Warmups & study', 100, true, CURRENT_TIMESTAMP);

ALTER TABLE "CatalogueTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CatalogueReleaseTag" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "CatalogueTag" FROM PUBLIC;
REVOKE ALL ON TABLE "CatalogueReleaseTag" FROM PUBLIC;
REVOKE ALL ON SEQUENCE "CatalogueTag_id_seq" FROM PUBLIC;

DO $$
BEGIN
  IF to_regrole('anon') IS NOT NULL THEN
    REVOKE ALL ON TABLE "CatalogueTag" FROM anon;
    REVOKE ALL ON TABLE "CatalogueReleaseTag" FROM anon;
    REVOKE ALL ON SEQUENCE "CatalogueTag_id_seq" FROM anon;
  END IF;

  IF to_regrole('authenticated') IS NOT NULL THEN
    REVOKE ALL ON TABLE "CatalogueTag" FROM authenticated;
    REVOKE ALL ON TABLE "CatalogueReleaseTag" FROM authenticated;
    REVOKE ALL ON SEQUENCE "CatalogueTag_id_seq" FROM authenticated;
  END IF;
END $$;
