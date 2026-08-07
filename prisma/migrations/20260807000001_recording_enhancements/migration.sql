-- ============================================================
-- Migration: Enhance Recording model
-- ============================================================
-- Adds status, duration, egressId, startedAt, endedAt fields.
-- Adds indexes for efficient queries.
-- ============================================================

-- Add new columns
ALTER TABLE "Recording" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'STOPPED';
ALTER TABLE "Recording" ADD COLUMN "duration" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Recording" ADD COLUMN "egressId" TEXT;
ALTER TABLE "Recording" ADD COLUMN "startedAt" TIMESTAMP(3);
ALTER TABLE "Recording" ADD COLUMN "endedAt" TIMESTAMP(3);

-- Add indexes
CREATE INDEX "Recording_roomId_createdAt_idx" ON "Recording" ("roomId", "createdAt");
CREATE INDEX "Recording_tutorId_createdAt_idx" ON "Recording" ("tutorId", "createdAt");
