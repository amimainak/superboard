const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.sjbxyxallfeyfuplacnn:Thephisics1@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Add missing columns to User table ──
    const userCols = [
      ['status', 'TEXT DEFAULT \'ACTIVE\''],
      ['stripeSubscriptionId', 'TEXT UNIQUE'],
      ['customDomain', 'TEXT UNIQUE'],
      ['parentEmail', 'TEXT'],
      ['under13', 'BOOLEAN DEFAULT false'],
      ['dataDeletedAt', 'TIMESTAMPTZ'],
      ['gracePeriodEndsAt', 'TIMESTAMPTZ'],
      ['referralCode', 'TEXT UNIQUE'],
      ['referralCount', 'INTEGER DEFAULT 0'],
      ['referralRewardClaimed', 'BOOLEAN DEFAULT false'],
      ['referredByCode', 'TEXT'],
      ['installedWidgets', 'JSONB'],
    ];

    for (const [col, def] of userCols) {
      try {
        await client.query(`ALTER TABLE "User" ADD COLUMN "${col}" ${def}`);
        console.log(`  Added User.${col}`);
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log(`  Skipped User.${col} (exists)`);
        } else {
          console.error(`  Failed User.${col}: ${e.message}`);
        }
      }
    }

    // ── Add missing columns to RoomParticipant ──
    const rpCols = [
      ['studentIdentity', 'TEXT'],
      ['studentName', 'TEXT'],
      ['studentId', 'TEXT'],
      ['lastActiveAt', 'TIMESTAMPTZ'],
    ];

    for (const [col, def] of rpCols) {
      try {
        await client.query(`ALTER TABLE "RoomParticipant" ADD COLUMN "${col}" ${def}`);
        console.log(`  Added RoomParticipant.${col}`);
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log(`  Skipped RoomParticipant.${col} (exists)`);
        } else {
          console.error(`  Failed RoomParticipant.${col}: ${e.message}`);
        }
      }
    }

    // Add unique constraint for (roomId, studentIdentity) on RoomParticipant
    try {
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "RoomParticipant_roomId_studentIdentity_key" 
        ON "RoomParticipant" ("roomId", "studentIdentity") 
        WHERE "studentIdentity" IS NOT NULL
      `);
      console.log('  Added RoomParticipant unique index on (roomId, studentIdentity)');
    } catch (e) {
      console.error(`  Failed RP index: ${e.message}`);
    }

    // Make userId nullable on RoomParticipant
    try {
      await client.query(`ALTER TABLE "RoomParticipant" ALTER COLUMN "user_id" DROP NOT NULL`);
      console.log('  Made RoomParticipant.user_id nullable');
    } catch (e) {
      console.log(`  Skipped RoomParticipant.user_id nullable: ${e.message.substring(0, 80)}`);
    }

    // Add roomId FK to RoomParticipant
    try {
      await client.query(`
        DO $$ BEGIN
          ALTER TABLE "RoomParticipant" ADD CONSTRAINT "RoomParticipant_roomId_fkey" 
          FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
      `);
      console.log('  Added RoomParticipant -> Room FK');
    } catch (e) {
      console.log(`  Skipped RP FK: ${e.message.substring(0, 80)}`);
    }

    // ── Add missing columns to session_notes ──
    const snCols = [
      ['tutorId', 'TEXT'],
      ['createdAt', 'TIMESTAMPTZ DEFAULT NOW()'],
    ];
    for (const [col, def] of snCols) {
      try {
        await client.query(`ALTER TABLE session_notes ADD COLUMN "${col}" ${def}`);
        console.log(`  Added session_notes.${col}`);
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log(`  Skipped session_notes.${col} (exists)`);
        } else {
          console.error(`  Failed session_notes.${col}: ${e.message}`);
        }
      }
    }

    // Change session_notes.id from bigint to uuid (if needed)
    try {
      const { rows } = await client.query(`SELECT data_type FROM information_schema.columns WHERE table_name = 'session_notes' AND column_name = 'id'`);
      if (rows[0] && rows[0].data_type === 'bigint') {
        // Drop old PK, add new uuid column, set it as PK
        await client.query(`ALTER TABLE session_notes DROP CONSTRAINT IF EXISTS session_notes_pkey`);
        await client.query(`ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS new_id UUID DEFAULT gen_random_uuid()`);
        await client.query(`UPDATE session_notes SET new_id = gen_random_uuid() WHERE new_id IS NULL`);
        await client.query(`ALTER TABLE session_notes DROP COLUMN IF EXISTS id`);
        await client.query(`ALTER TABLE session_notes RENAME COLUMN new_id TO id`);
        await client.query(`ALTER TABLE session_notes ADD PRIMARY KEY (id)`);
        console.log('  Migrated session_notes.id from bigint to UUID');
      } else {
        console.log('  session_notes.id already UUID, skipped migration');
      }
    } catch (e) {
      console.error(`  Failed session_notes id migration: ${e.message}`);
    }

    // ── Create new tables ──
    const newTables = [
      `CREATE TABLE IF NOT EXISTS "Student" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agencyId TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        email TEXT NOT NULL,
        name TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "parentAccessToken" TEXT UNIQUE,
        "deactivatedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT "Student_agencyId_email_key" UNIQUE ("agencyId", email)
      )`,
      `CREATE TABLE IF NOT EXISTS "AuditLog" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
        action TEXT NOT NULL,
        target TEXT,
        details JSONB,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS "Recording" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "roomId" TEXT NOT NULL REFERENCES "Room"("id") ON DELETE CASCADE,
        "tutorId" TEXT NOT NULL,
        "startedAt" TIMESTAMPTZ,
        "endedAt" TIMESTAMPTZ,
        "durationSec" INTEGER DEFAULT 0,
        status TEXT DEFAULT 'recording',
        "storageUrl" TEXT,
        "thumbnailUrl" TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS "Subscription" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
        "stripeSubscriptionId" TEXT UNIQUE,
        "stripePriceId" TEXT,
        status TEXT DEFAULT 'active',
        "currentPeriodStart" TIMESTAMPTZ,
        "currentPeriodEnd" TIMESTAMPTZ,
        "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS "PlatformConfig" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT NOT NULL UNIQUE,
        value JSONB,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS "Invoice" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "creatorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "studentName" TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        currency TEXT DEFAULT 'usd',
        status TEXT DEFAULT 'draft',
        "dueDate" TIMESTAMPTZ,
        "paidAt" TIMESTAMPTZ,
        items JSONB,
        notes TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS "ScheduledLesson" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tutorId" TEXT NOT NULL,
        "studentName" TEXT,
        "studentEmail" TEXT,
        subject TEXT DEFAULT 'GENERAL',
        "startTime" TIMESTAMPTZ NOT NULL,
        "endTime" TIMESTAMPTZ,
        status TEXT DEFAULT 'scheduled',
        "roomId" TEXT,
        notes TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS "CreditPack" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "agencyId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        credits INTEGER NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        status TEXT DEFAULT 'active',
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS "Homework" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tutorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "roomId" TEXT,
        title TEXT NOT NULL,
        description TEXT,
        "dueDate" TIMESTAMPTZ,
        status TEXT DEFAULT 'assigned',
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS "WebhookConfig" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT NOT NULL,
        url TEXT NOT NULL,
        events TEXT[] NOT NULL DEFAULT '{}',
        secret TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS "QuestionItem" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tutorId" TEXT,
        type TEXT DEFAULT 'multiple_choice',
        subject TEXT DEFAULT 'GENERAL',
        difficulty TEXT DEFAULT 'medium',
        question TEXT NOT NULL,
        options JSONB,
        "correctAnswer" TEXT,
        explanation TEXT,
        tags TEXT[] DEFAULT '{}',
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )`,
    ];

    for (const sql of newTables) {
      const match = sql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/);
      const name = match ? match[1] : 'unknown';
      try {
        await client.query(sql);
        console.log(`  Created table ${name}`);
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log(`  Skipped ${name} (exists)`);
        } else {
          console.error(`  Failed ${name}: ${e.message.substring(0, 120)}`);
        }
      }
    }

    // ── Create indexes ──
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog" ("userId")',
      'CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog" (action)',
      'CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt")',
      'CREATE INDEX IF NOT EXISTS "Recording_roomId_idx" ON "Recording" ("roomId")',
      'CREATE INDEX IF NOT EXISTS "Recording_tutorId_idx" ON "Recording" ("tutorId")',
      'CREATE INDEX IF NOT EXISTS "Recording_status_idx" ON "Recording" (status)',
      'CREATE INDEX IF NOT EXISTS "Student_agencyId_idx" ON "Student" ("agencyId")',
      'CREATE INDEX IF NOT EXISTS "Student_email_idx" ON "Student" (email)',
      'CREATE INDEX IF NOT EXISTS "Invoice_creatorId_idx" ON "Invoice" ("creatorId")',
      'CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice" (status)',
      'CREATE INDEX IF NOT EXISTS "ScheduledLesson_tutorId_idx" ON "ScheduledLesson" ("tutorId")',
      'CREATE INDEX IF NOT EXISTS "ScheduledLesson_status_idx" ON "ScheduledLesson" (status)',
      'CREATE INDEX IF NOT EXISTS "Homework_tutorId_idx" ON "Homework" ("tutorId")',
      'CREATE INDEX IF NOT EXISTS "Homework_roomId_idx" ON "Homework" ("roomId")',
      'CREATE INDEX IF NOT EXISTS "CreditPack_agencyId_idx" ON "CreditPack" ("agencyId")',
      'CREATE INDEX IF NOT EXISTS "QuestionItem_tutorId_idx" ON "QuestionItem" ("tutorId")',
      'CREATE INDEX IF NOT EXISTS "QuestionItem_subject_idx" ON "QuestionItem" (subject)',
      'CREATE INDEX IF NOT EXISTS "WebhookConfig_userId_idx" ON "WebhookConfig" ("userId")',
      'CREATE INDEX IF NOT EXISTS "RoomParticipant_userId_idx" ON "RoomParticipant" ("user_id")',
      'CREATE INDEX IF NOT EXISTS "RoomParticipant_roomId_idx" ON "RoomParticipant" ("roomId")',
    ];

    for (const idx of indexes) {
      try {
        await client.query(idx);
      } catch (e) {
        // Ignore index creation errors (already exists, etc.)
      }
    }
    console.log('  Created indexes');

    await client.query('COMMIT');
    console.log('\n=== Migration completed successfully ===');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n=== Migration FAILED ===');
    console.error(e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
