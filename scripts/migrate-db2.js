const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.sjbxyxallfeyfuplacnn:Thephisics1@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function run(sql, name) {
  try {
    await pool.query(sql);
    console.log(`  OK: ${name}`);
    return true;
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('duplicate')) {
      console.log(`  SKIP: ${name} (exists)`);
      return true;
    }
    console.error(`  FAIL: ${name} — ${e.message.substring(0, 100)}`);
    return false;
  }
}

async function migrate() {
  console.log('=== Phase 2: RoomParticipant fixes ===');
  // Add missing columns (existing columns are snake_case)
  await run(`ALTER TABLE "RoomParticipant" ADD COLUMN IF NOT EXISTS "studentIdentity" TEXT`, 'RP.studentIdentity');
  await run(`ALTER TABLE "RoomParticipant" ADD COLUMN IF NOT EXISTS "studentName" TEXT`, 'RP.studentName');
  await run(`ALTER TABLE "RoomParticipant" ADD COLUMN IF NOT EXISTS "studentId" TEXT`, 'RP.studentId');
  await run(`ALTER TABLE "RoomParticipant" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMPTZ`, 'RP.lastActiveAt');
  await run(`ALTER TABLE "RoomParticipant" ALTER COLUMN "user_id" DROP NOT NULL`, 'RP.user_id nullable');
  await run(`CREATE UNIQUE INDEX IF NOT EXISTS "RP_roomId_studentIdentity" ON "RoomParticipant" ("room_id", "studentIdentity") WHERE "studentIdentity" IS NOT NULL`, 'RP unique index');

  console.log('\n=== Phase 3: session_notes fixes ===');
  await run(`ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS "tutorId" TEXT`, 'session_notes.tutorId');
  await run(`ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW()`, 'session_notes.createdAt');

  console.log('\n=== Phase 4: New tables ===');
  await run(`CREATE TABLE IF NOT EXISTS "Student" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "agencyId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "parentAccessToken" TEXT UNIQUE,
    "deactivatedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
  )`, 'Student table');
  await run(`CREATE UNIQUE INDEX IF NOT EXISTS "Student_agencyId_email_key" ON "Student" ("agencyId", email)`, 'Student unique');
  await run(`CREATE INDEX IF NOT EXISTS "Student_agencyId_idx" ON "Student" ("agencyId")`, 'Student.agencyId idx');
  await run(`CREATE INDEX IF NOT EXISTS "Student_email_idx" ON "Student" (email)`, 'Student.email idx');

  await run(`CREATE TABLE IF NOT EXISTS "AuditLog" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    action TEXT NOT NULL,
    target TEXT,
    details JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
  )`, 'AuditLog table');
  await run(`CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog" ("userId")`, 'AuditLog userId idx');
  await run(`CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog" (action)`, 'AuditLog action idx');
  await run(`CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt")`, 'AuditLog createdAt idx');

  await run(`CREATE TABLE IF NOT EXISTS "Recording" (
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
  )`, 'Recording table');
  await run(`CREATE INDEX IF NOT EXISTS "Recording_roomId_idx" ON "Recording" ("roomId")`, 'Recording roomId idx');
  await run(`CREATE INDEX IF NOT EXISTS "Recording_tutorId_idx" ON "Recording" ("tutorId")`, 'Recording tutorId idx');
  await run(`CREATE INDEX IF NOT EXISTS "Recording_status_idx" ON "Recording" (status)`, 'Recording status idx');

  await run(`CREATE TABLE IF NOT EXISTS "Subscription" (
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
  )`, 'Subscription table');

  await run(`CREATE TABLE IF NOT EXISTS "PlatformConfig" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
  )`, 'PlatformConfig table');

  await run(`CREATE TABLE IF NOT EXISTS "Invoice" (
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
  )`, 'Invoice table');
  await run(`CREATE INDEX IF NOT EXISTS "Invoice_creatorId_idx" ON "Invoice" ("creatorId")`, 'Invoice creatorId idx');
  await run(`CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice" (status)`, 'Invoice status idx');

  await run(`CREATE TABLE IF NOT EXISTS "ScheduledLesson" (
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
  )`, 'ScheduledLesson table');
  await run(`CREATE INDEX IF NOT EXISTS "ScheduledLesson_tutorId_idx" ON "ScheduledLesson" ("tutorId")`, 'SL tutorId idx');
  await run(`CREATE INDEX IF NOT EXISTS "ScheduledLesson_status_idx" ON "ScheduledLesson" (status)`, 'SL status idx');

  await run(`CREATE TABLE IF NOT EXISTS "CreditPack" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "agencyId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    credits INTEGER NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    status TEXT DEFAULT 'active',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
  )`, 'CreditPack table');
  await run(`CREATE INDEX IF NOT EXISTS "CreditPack_agencyId_idx" ON "CreditPack" ("agencyId")`, 'CP agencyId idx');

  await run(`CREATE TABLE IF NOT EXISTS "Homework" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tutorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "roomId" TEXT,
    title TEXT NOT NULL,
    description TEXT,
    "dueDate" TIMESTAMPTZ,
    status TEXT DEFAULT 'assigned',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
  )`, 'Homework table');
  await run(`CREATE INDEX IF NOT EXISTS "Homework_tutorId_idx" ON "Homework" ("tutorId")`, 'HW tutorId idx');
  await run(`CREATE INDEX IF NOT EXISTS "Homework_roomId_idx" ON "Homework" ("roomId")`, 'HW roomId idx');

  await run(`CREATE TABLE IF NOT EXISTS "WebhookConfig" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    secret TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
  )`, 'WebhookConfig table');
  await run(`CREATE INDEX IF NOT EXISTS "WebhookConfig_userId_idx" ON "WebhookConfig" ("userId")`, 'WC userId idx');

  await run(`CREATE TABLE IF NOT EXISTS "QuestionItem" (
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
  )`, 'QuestionItem table');
  await run(`CREATE INDEX IF NOT EXISTS "QuestionItem_tutorId_idx" ON "QuestionItem" ("tutorId")`, 'QI tutorId idx');
  await run(`CREATE INDEX IF NOT EXISTS "QuestionItem_subject_idx" ON "QuestionItem" (subject)`, 'QI subject idx');

  console.log('\n=== Migration complete ===');
  await pool.end();
}

migrate();
