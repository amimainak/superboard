-- ============================================================
-- Superboard — Phases 3-6 Database Migration
-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Creates: ScheduledLesson, WebhookConfig tables
-- Adds: referral fields to User table, LessonStatus enum
-- ============================================================

BEGIN;

-- 1. Create LessonStatus enum
DO $$ BEGIN
    CREATE TYPE "LessonStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add referral fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredByCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCount" INTEGER NOT NULL DEFAULT 0;

-- 3. Create unique index on referralCode (after column exists)
DO $$ BEGIN
    CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode") WHERE "referralCode" IS NOT NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Create ScheduledLesson table
CREATE TABLE IF NOT EXISTS "ScheduledLesson" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" "Subject" NOT NULL DEFAULT 'GENERAL',
    "studentEmail" TEXT,
    "studentName" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "status" "LessonStatus" NOT NULL DEFAULT 'SCHEDULED',
    "roomUrl" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledLesson_pkey" PRIMARY KEY ("id")
);

-- Indexes for ScheduledLesson
CREATE INDEX IF NOT EXISTS "ScheduledLesson_tutorId_scheduledAt_idx" ON "ScheduledLesson"("tutorId", "scheduledAt");
CREATE INDEX IF NOT EXISTS "ScheduledLesson_tutorId_status_idx" ON "ScheduledLesson"("tutorId", "status");

-- Foreign key: ScheduledLesson → User
DO $$ BEGIN
    ALTER TABLE "ScheduledLesson" ADD CONSTRAINT "ScheduledLesson_tutorId_fkey" 
        FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Create WebhookConfig table
CREATE TABLE IF NOT EXISTS "WebhookConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[] NOT NULL,
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookConfig_pkey" PRIMARY KEY ("id")
);

-- Index for WebhookConfig
CREATE INDEX IF NOT EXISTS "WebhookConfig_userId_idx" ON "WebhookConfig"("userId");

-- Foreign key: WebhookConfig → User
DO $$ BEGIN
    ALTER TABLE "WebhookConfig" ADD CONSTRAINT "WebhookConfig_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMIT;
