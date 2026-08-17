-- ============================================================
-- SECURITY FIX (A-14): Enable RLS on migration tables missing it
-- ============================================================
-- These tables were created in phases 3-6 and agency-feature migrations
-- but lacked Row Level Security policies.
-- Run this in Supabase Dashboard → SQL Editor.
-- ============================================================

BEGIN;

-- Enable RLS on tables that are missing it
ALTER TABLE "ScheduledLesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WebhookConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Homework" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LessonNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ResourceLibrary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Policies
-- ============================================================
-- Column names match the actual migration SQL files:
--   ScheduledLesson  → tutorId
--   WebhookConfig    → userId  (original col from migration-phase3-6.sql)
--   Homework         → tutorId
--   LessonNote       → tutorId
--   ResourceLibrary  → agencyId
--   Invoice          → agencyId
-- ============================================================

-- ScheduledLesson: tutor can manage their own lessons
CREATE POLICY "lesson_tutor_all" ON "ScheduledLesson"
  FOR ALL USING ("tutorId" = auth.uid()::text);

-- WebhookConfig: owner can manage their own webhook configs
CREATE POLICY "webhook_owner_all" ON "WebhookConfig"
  FOR ALL USING ("userId" = auth.uid()::text);

-- Homework: tutor can manage their own homework
CREATE POLICY "hw_tutor_all" ON "Homework"
  FOR ALL USING ("tutorId" = auth.uid()::text);

-- LessonNote: tutor can manage their own notes
CREATE POLICY "note_tutor_all" ON "LessonNote"
  FOR ALL USING ("tutorId" = auth.uid()::text);

-- ResourceLibrary: agency members can access their agency resources
CREATE POLICY "resource_agency_all" ON "ResourceLibrary"
  FOR ALL USING (
    "agencyId" IN (SELECT "id" FROM "Agency" WHERE "ownerId" = auth.uid()::text)
  );

-- Invoice: agency members can access their agency invoices
CREATE POLICY "invoice_agency_all" ON "Invoice"
  FOR ALL USING (
    "agencyId" IN (SELECT "id" FROM "Agency" WHERE "ownerId" = auth.uid()::text)
  );

-- Service role bypass for all tables
CREATE POLICY "scheduledlesson_service_role" ON "ScheduledLesson"
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "webhookconfig_service_role" ON "WebhookConfig"
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "homework_service_role" ON "Homework"
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "lessonnote_service_role" ON "LessonNote"
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "resourcelibrary_service_role" ON "ResourceLibrary"
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "invoice_service_role" ON "Invoice"
  FOR ALL USING (auth.role() = 'service_role');

COMMIT;
