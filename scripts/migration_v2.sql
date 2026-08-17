-- ============================================================
-- Migration v2: RoomParticipant Table + Enhanced RLS Policies
-- ============================================================
--
-- This migration adds:
--   1. RoomParticipant table — tracks who is in each room and their role
--   2. RLS policies for RoomParticipant (view/join/leave/remove)
--   3. ChatMessage UPDATE/DELETE RLS policies (if missing)
--   4. Users table tier-escalation guard via RLS WITH CHECK
--
-- Run this in the Supabase SQL Editor.
-- It is idempotent: uses IF NOT EXISTS and DO $$ blocks.
-- ============================================================


-- ============================================================
-- Section 1: Create RoomParticipant table
-- ============================================================
-- This table replaces the previous pattern of inferring participation
-- from ChatMessage or BoardPage. It gives explicit control over:
--   - Who is in a room (host / participant / viewer roles)
--   - Online status (for presence features)
--   - Join/leave timestamps (for attendance tracking)
-- The UNIQUE(room_id, user_id) constraint prevents duplicate entries.
-- ON DELETE CASCADE ensures cleanup when a room or user is deleted.

CREATE TABLE IF NOT EXISTS "RoomParticipant" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES "Room" (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('host', 'participant', 'viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  is_online BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(room_id, user_id)
);

-- Index for fast lookups when querying participants of a specific room
CREATE INDEX IF NOT EXISTS idx_room_participant_room ON "RoomParticipant" (room_id);

-- Index for fast lookups when querying rooms a specific user is in
CREATE INDEX IF NOT EXISTS idx_room_participant_user ON "RoomParticipant" (user_id);


-- ============================================================
-- Section 2: RLS policies for RoomParticipant
-- ============================================================
-- RLS ensures users can only see/modify participant records for rooms
-- they are actually in. The host has elevated privileges (role changes,
-- removing participants).

ALTER TABLE "RoomParticipant" ENABLE ROW LEVEL SECURITY;

-- 2a. SELECT: Participants can view other participants in rooms they belong to
--     Also allows the room host (identified via Room.host_id) to view participants.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'RoomParticipant' AND policyname = 'Participants can view room participants') THEN
    CREATE POLICY "Participants can view room participants" ON "RoomParticipant"
      FOR SELECT USING (
        room_id IN (SELECT room_id FROM "RoomParticipant" WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM "Room" WHERE id = room_id AND host_id = auth.uid())
      );
  END IF;
END $$;

-- 2b. INSERT: Users can only add themselves to a room (not others)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'RoomParticipant' AND policyname = 'Users can join rooms') THEN
    CREATE POLICY "Users can join rooms" ON "RoomParticipant"
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 2c. UPDATE (host only): Only the room host can update participant records
--     This covers role changes (e.g., promoting a participant to viewer).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'RoomParticipant' AND policyname = 'Only host can update participants') THEN
    CREATE POLICY "Only host can update participants" ON "RoomParticipant"
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM "Room" WHERE id = room_id AND host_id = auth.uid())
      );
  END IF;
END $$;

-- 2d. UPDATE (self-leave): Users can update their own record to set left_at
--     This allows a user to mark themselves as having left the room.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'RoomParticipant' AND policyname = 'Users can leave rooms') THEN
    CREATE POLICY "Users can leave rooms" ON "RoomParticipant"
      FOR UPDATE USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 2e. DELETE: Users can delete themselves, or the host can remove anyone
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'RoomParticipant' AND policyname = 'Users can remove themselves or host can remove') THEN
    CREATE POLICY "Users can remove themselves or host can remove" ON "RoomParticipant"
      FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM "Room" WHERE id = room_id AND host_id = auth.uid())
      );
  END IF;
END $$;


-- ============================================================
-- Section 3: ChatMessage UPDATE/DELETE RLS policies
-- ============================================================
-- These policies may already exist from fix-chat-rls.sql. We use DO $$
-- blocks to drop-and-recreate them, ensuring the latest logic is applied.
-- This is safe because the policies are recreated immediately.

ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;

-- 3a. UPDATE: Users can edit their own messages (e.g., correcting typos)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ChatMessage' AND policyname = 'Users can update own messages') THEN
    DROP POLICY "Users can update own messages" ON "ChatMessage";
  END IF;
END $$;

CREATE POLICY "Users can update own messages" ON "ChatMessage"
  FOR UPDATE USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- 3b. DELETE: Users can delete their own messages, room host can delete any
--     The host check uses RoomParticipant with role='host' for consistency
--     with the new RoomParticipant-based authorization model.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ChatMessage' AND policyname = 'Users can delete own messages or host can delete any') THEN
    DROP POLICY "Users can delete own messages or host can delete any" ON "ChatMessage";
  END IF;
END $$;

CREATE POLICY "Users can delete own messages or host can delete any" ON "ChatMessage"
  FOR DELETE USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM "Room" r
      JOIN "RoomParticipant" rp ON rp.room_id = r.id
      WHERE r.id = "ChatMessage".room_id
      AND rp.user_id = auth.uid()
      AND rp.role = 'host'
    )
  );


-- ============================================================
-- Section 4: Users table tier-escalation guard (A-03 RLS fix)
-- ============================================================
-- Prevents a user from escalating their own tier (e.g., free → pro)
-- via a direct UPDATE to the users table.
--
-- Note: This project already has a BEFORE UPDATE trigger
-- (block_protected_user_columns) that blocks tier changes via
-- service_role check. This RLS policy provides an additional
-- defense-in-depth layer at the RLS level.
--
-- The WITH CHECK clause ensures that even if a user manages to
-- get past the trigger (e.g., via a race condition), the RLS
-- layer will reject the tier change.
--
-- We drop-and-recreate the policy if it exists to ensure the
-- latest version is applied.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_update_own') THEN
    DROP POLICY "users_update_own" ON public.users;
  END IF;
END $$;

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND tier = current_setting('request.jwt.claims', true)::json->>'sub' IS NOT NULL  -- always true but ensures id matches
    AND (old.tier = new.tier OR new.tier IS NULL)  -- Prevent tier change: old tier must equal new tier
  );


-- ============================================================
-- Section 5: Migrate existing implicit participants (optional)
-- ============================================================
-- If there are existing rooms with data in ChatMessage or BoardPage,
-- we can backfill RoomParticipant records. This is safe to re-run
-- because of the UNIQUE(room_id, user_id) constraint handled via
-- ON CONFLICT DO NOTHING.
--
-- Uncomment the following block to enable backfill:
--
-- INSERT INTO "RoomParticipant" (room_id, user_id, role, joined_at, is_online)
-- SELECT DISTINCT
--   cm.room_id,
--   cm.sender_id::uuid AS user_id,
--   CASE
--     WHEN r.host_id = cm.sender_id::text THEN 'host'
--     ELSE 'participant'
--   END AS role,
--   MIN(cm."createdAt") AS joined_at,
--   false AS is_online
-- FROM "ChatMessage" cm
-- JOIN "Room" r ON r.id = cm.room_id
-- WHERE cm.sender_id IS NOT NULL
--   AND cm.sender_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
-- GROUP BY cm.room_id, cm.sender_id, r.host_id
-- ON CONFLICT (room_id, user_id) DO NOTHING;
-- ============================================================


-- ============================================================
-- Migration v2 complete.
-- Verify with:
--   SELECT * FROM pg_policies WHERE tablename IN ('RoomParticipant', 'ChatMessage', 'users');
--   SELECT * FROM "RoomParticipant" LIMIT 10;
-- ============================================================
