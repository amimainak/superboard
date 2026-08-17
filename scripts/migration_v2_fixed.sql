-- ============================================================
-- Migration v2 (FINAL): RoomParticipant + Enhanced RLS
-- Adapted for TEXT IDs and existing policy names
-- ============================================================

-- ============================================================
-- Section 1: Create RoomParticipant table
-- ============================================================

CREATE TABLE IF NOT EXISTS "RoomParticipant" (
  id TEXT NOT NULL DEFAULT uuid_generate_v4()::text PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES "Room" (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('host', 'participant', 'viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  is_online BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_participant_room ON "RoomParticipant" (room_id);
CREATE INDEX IF NOT EXISTS idx_room_participant_user ON "RoomParticipant" (user_id);


-- ============================================================
-- Section 2: RLS policies for RoomParticipant
-- ============================================================

ALTER TABLE "RoomParticipant" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'RoomParticipant' AND policyname = 'rp_view') THEN
    CREATE POLICY "rp_view" ON "RoomParticipant"
      FOR SELECT USING (
        room_id IN (SELECT room_id FROM "RoomParticipant" WHERE user_id = auth.uid()::text)
        OR EXISTS (SELECT 1 FROM "Room" WHERE id = room_id AND "tutorId" = auth.uid()::text)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'RoomParticipant' AND policyname = 'rp_join') THEN
    CREATE POLICY "rp_join" ON "RoomParticipant"
      FOR INSERT WITH CHECK (user_id = auth.uid()::text);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'RoomParticipant' AND policyname = 'rp_host_update') THEN
    CREATE POLICY "rp_host_update" ON "RoomParticipant"
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM "Room" WHERE id = room_id AND "tutorId" = auth.uid()::text)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'RoomParticipant' AND policyname = 'rp_self_leave') THEN
    CREATE POLICY "rp_self_leave" ON "RoomParticipant"
      FOR UPDATE USING (user_id = auth.uid()::text)
      WITH CHECK (user_id = auth.uid()::text);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'RoomParticipant' AND policyname = 'rp_remove') THEN
    CREATE POLICY "rp_remove" ON "RoomParticipant"
      FOR DELETE USING (
        user_id = auth.uid()::text
        OR EXISTS (SELECT 1 FROM "Room" WHERE id = room_id AND "tutorId" = auth.uid()::text)
      );
  END IF;
END $$;


-- ============================================================
-- Section 3: Tier-escalation guard via trigger (not RLS)
-- RLS cannot use OLD/NEW; triggers can.
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'block_tier_escalation') THEN
    CREATE OR REPLACE FUNCTION block_tier_change()
    RETURNS TRIGGER AS $$
    BEGIN
      IF OLD."tier" IS DISTINCT FROM NEW."tier" AND current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
        NEW."tier" = OLD."tier"; -- Revert tier change
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    CREATE TRIGGER block_tier_escalation
      BEFORE UPDATE ON "User"
      FOR EACH ROW
      EXECUTE FUNCTION block_tier_change();
  END IF;
END $$;
