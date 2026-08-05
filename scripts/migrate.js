const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.ruygzmkqtdogtencjdzg:thephisics1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

async function migrate() {
  console.log('Checking existing tables...');

  const tables = await pool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  console.log('Tables:', tables.rows.map(r => r.tablename));

  // Check what we need
  const rpCheck = await pool.query(
    "SELECT to_regclass('public.\"RoomParticipant\"') as exists"
  );
  const aiCheck = await pool.query(
    "SELECT to_regclass('public.\"AgencyInvite\"') as exists"
  );
  console.log('RoomParticipant exists:', rpCheck.rows[0].exists);
  console.log('AgencyInvite exists:', aiCheck.rows[0].exists);

  // Create RoomParticipant if missing
  if (!rpCheck.rows[0].exists) {
    console.log('\nCreating RoomParticipant table...');
    await pool.query(`
      CREATE TABLE "RoomParticipant" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "roomId" TEXT NOT NULL,
        "studentIdentity" TEXT NOT NULL,
        "studentName" TEXT,
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "RoomParticipant_roomId_studentIdentity_key" UNIQUE ("roomId", "studentIdentity"),
        CONSTRAINT "RoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    console.log('  [OK] RoomParticipant created');
  } else {
    console.log('\nRoomParticipant already exists, skipping');
  }

  // Create AgencyInvite if missing
  if (!aiCheck.rows[0].exists) {
    console.log('\nCreating AgencyInvite table...');
    await pool.query(`
      CREATE TABLE "AgencyInvite" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT NOT NULL,
        "agencyId" TEXT NOT NULL,
        "invitedEmail" TEXT NOT NULL,
        "recipientId" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "acceptedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AgencyInvite_code_key" UNIQUE ("code"),
        CONSTRAINT "AgencyInvite_recipientId_key" UNIQUE ("recipientId"),
        CONSTRAINT "AgencyInvite_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "AgencyInvite_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
    console.log('  [OK] AgencyInvite created');
  } else {
    console.log('\nAgencyInvite already exists, skipping');
  }

  // Add stripeSubscriptionId to User if missing
  try {
    await pool.query(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT`
    );
    console.log('  [OK] stripeSubscriptionId column ready');
  } catch (e) {
    console.log('  [SKIP] stripeSubscriptionId:', e.message);
  }

  console.log('\nMigration complete!');

  // Final verification
  const finalTables = await pool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  console.log('Final tables:', finalTables.rows.map(r => r.tablename));

  await pool.end();
}

migrate().catch(e => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
