const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: 'postgresql://postgres.sjbxyxallfeyfuplacnn:Thephisics1@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Supabase database');

  // Section 1: Create table
  console.log('\n--- Section 1: Create RoomParticipant table ---');
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS "RoomParticipant" (
  id TEXT NOT NULL DEFAULT uuid_generate_v4()::text PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES "Room" (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('host', 'participant', 'viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  is_online BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(room_id, user_id)
)`);
    console.log('Table created successfully');
  } catch (e) { console.error('Table error:', e.message); }

  try {
    await client.query(`CREATE INDEX IF NOT EXISTS idx_room_participant_room ON "RoomParticipant" (room_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_room_participant_user ON "RoomParticipant" (user_id)`);
    console.log('Indexes created');
  } catch (e) { console.error('Index error:', e.message); }

  // Section 2: Enable RLS + policies
  console.log('\n--- Section 2: RLS policies ---');
  try {
    await client.query(`ALTER TABLE "RoomParticipant" ENABLE ROW LEVEL SECURITY`);
    console.log('RLS enabled');
  } catch (e) { console.error('RLS enable error:', e.message); }

  const policies = [
    `CREATE POLICY "rp_view" ON "RoomParticipant" FOR SELECT USING (room_id IN (SELECT room_id FROM "RoomParticipant" WHERE user_id = auth.uid()::text) OR EXISTS (SELECT 1 FROM "Room" WHERE id = room_id AND "tutorId" = auth.uid()::text))`,
    `CREATE POLICY "rp_join" ON "RoomParticipant" FOR INSERT WITH CHECK (user_id = auth.uid()::text)`,
    `CREATE POLICY "rp_host_update" ON "RoomParticipant" FOR UPDATE USING (EXISTS (SELECT 1 FROM "Room" WHERE id = room_id AND "tutorId" = auth.uid()::text))`,
    `CREATE POLICY "rp_self_leave" ON "RoomParticipant" FOR UPDATE USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text)`,
    `CREATE POLICY "rp_remove" ON "RoomParticipant" FOR DELETE USING (user_id = auth.uid()::text OR EXISTS (SELECT 1 FROM "Room" WHERE id = room_id AND "tutorId" = auth.uid()::text))`
  ];

  for (const sql of policies) {
    try {
      await client.query(sql);
      console.log('Policy created');
    } catch (e) {
      console.log('Policy (may already exist):', e.message.split('\n')[0].substring(0, 80));
    }
  }

  // Section 3: Tier trigger
  console.log('\n--- Section 3: Tier escalation guard ---');
  try {
    await client.query(`CREATE OR REPLACE FUNCTION block_tier_change() RETURNS TRIGGER AS $$ BEGIN IF OLD."tier" IS DISTINCT FROM NEW."tier" AND current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN NEW."tier" = OLD."tier"; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER`);
    console.log('Function created');
  } catch (e) { console.error('Function error:', e.message); }

  try {
    await client.query(`DROP TRIGGER IF EXISTS block_tier_escalation ON "User"`);
    await client.query(`CREATE TRIGGER block_tier_escalation BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION block_tier_change()`);
    console.log('Trigger created');
  } catch (e) { console.error('Trigger error:', e.message); }

  // Verify
  console.log('\n--- Verification ---');
  const tables = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'RoomParticipant'`);
  console.log('RoomParticipant table exists:', tables.rows.length > 0);

  const rpPolicies = await client.query(`SELECT policyname FROM pg_policies WHERE tablename = 'RoomParticipant'`);
  console.log('RoomParticipant policies:', rpPolicies.rows.map(r => r.policyname).join(', '));

  const triggers = await client.query(`SELECT tgname FROM pg_trigger WHERE tgname = 'block_tier_escalation'`);
  console.log('Tier guard trigger exists:', triggers.rows.length > 0);

  await client.end();
  console.log('\nDone!');
}

runMigration();
