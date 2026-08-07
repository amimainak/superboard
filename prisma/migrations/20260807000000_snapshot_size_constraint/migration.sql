-- ============================================================
-- Migration: Add DB-level CHECK constraints on snapshot fields
-- ============================================================
-- Prevents unbounded snapshot storage at the database level.
-- Complements the application-level Zod validation.
-- Max 5MB (5,000,000 characters) per snapshot.
-- ============================================================

-- Add CHECK constraint to BoardPage.snapshot
ALTER TABLE "BoardPage" ADD CONSTRAINT "boardpage_snapshot_max_size"
  CHECK (length("snapshot") <= 5000000);

-- Add CHECK constraint to Template.snapshot
ALTER TABLE "Template" ADD CONSTRAINT "template_snapshot_max_size"
  CHECK (length("snapshot") <= 5000000);
