-- Phase 2: Template Engine - Upgrade Template table
-- Adds: description, grade_band, tags, is_public, updated_at + indexes

-- Add new columns (IF NOT EXISTS guards for safety)
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "description" VARCHAR(500);
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "grade_band" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "is_public" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Widen name column from 50 to 100
ALTER TABLE "Template" ALTER COLUMN "name" TYPE VARCHAR(100);

-- Add indexes
CREATE INDEX IF NOT EXISTS "Template_is_public_idx" ON "Template" ("is_public");
CREATE INDEX IF NOT EXISTS "Template_subject_idx" ON "Template" ("subject");
CREATE INDEX IF NOT EXISTS "Template_grade_band_idx" ON "Template" ("grade_band");

-- Add updatedAt trigger (auto-update on row change)
CREATE OR REPLACE FUNCTION update_template_updatedat()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS template_updatedat ON "Template";
CREATE TRIGGER template_updatedat
  BEFORE UPDATE ON "Template"
  FOR EACH ROW
  EXECUTE FUNCTION update_template_updatedat();
