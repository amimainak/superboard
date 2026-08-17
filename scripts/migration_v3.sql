-- Migration v3: ScheduleSlot + Booking tables for tutor scheduling
-- Idempotent: safe to re-run

-- Section 1: ScheduleSlot table
CREATE TABLE IF NOT EXISTS "ScheduleSlot" (
  id TEXT NOT NULL DEFAULT uuid_generate_v4()::text PRIMARY KEY,
  "tutorId" TEXT NOT NULL REFERENCES "User" ("id") ON DELETE CASCADE,
  "dayOfWeek" INTEGER NOT NULL CHECK ("dayOfWeek" BETWEEN 0 AND 6),
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  "isActive" BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_schedule_slot_tutor ON "ScheduleSlot" ("tutorId");

-- Section 2: Booking table
CREATE TABLE IF NOT EXISTS "Booking" (
  id TEXT NOT NULL DEFAULT uuid_generate_v4()::text PRIMARY KEY,
  "tutorId" TEXT NOT NULL REFERENCES "User" ("id") ON DELETE CASCADE,
  "studentName" TEXT NOT NULL,
  "studentEmail" TEXT,
  "parentId" TEXT REFERENCES "User" ("id") ON DELETE SET NULL,
  "slotId" TEXT NOT NULL,
  "bookingDate" DATE NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  "roomId" TEXT REFERENCES "Room" ("id") ON DELETE SET NULL,
  notes TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_tutor ON "Booking" ("tutorId");
CREATE INDEX IF NOT EXISTS idx_booking_date ON "Booking" ("bookingDate");
CREATE INDEX IF NOT EXISTS idx_booking_status ON "Booking" (status);

-- Section 3: Enable RLS
ALTER TABLE "ScheduleSlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;

-- Section 4: RLS policies for ScheduleSlot
DO $$ BEGIN
  CREATE POLICY "ss_view_own" ON "ScheduleSlot" FOR SELECT USING ("tutorId" = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "ss_insert_own" ON "ScheduleSlot" FOR INSERT WITH CHECK ("tutorId" = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "ss_update_own" ON "ScheduleSlot" FOR UPDATE USING ("tutorId" = auth.uid()::text) WITH CHECK ("tutorId" = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "ss_delete_own" ON "ScheduleSlot" FOR DELETE USING ("tutorId" = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Section 5: RLS policies for Booking
DO $$ BEGIN
  CREATE POLICY "bk_view_own" ON "Booking" FOR SELECT USING ("tutorId" = auth.uid()::text OR "parentId" = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bk_insert" ON "Booking" FOR INSERT WITH CHECK ("tutorId" = auth.uid()::text OR "parentId" = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bk_update_own" ON "Booking" FOR UPDATE USING ("tutorId" = auth.uid()::text OR "parentId" = auth.uid()::text) WITH CHECK ("tutorId" = auth.uid()::text OR "parentId" = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Verify
SELECT 'ScheduleSlot' as tbl, count(*) as rows FROM "ScheduleSlot"
UNION ALL
SELECT 'Booking', count(*) FROM "Booking";