// Uses DATABASE_URL env var. Set it in .env.local or your environment.
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const CREATE_TABLES = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "tier" TEXT NOT NULL DEFAULT 'FREE',
  "isAdmin" BOOLEAN NOT NULL DEFAULT false,
  "stripeCustomerId" TEXT,
  "fingerprintHash" TEXT,
  "parentAgencyId" TEXT,
  "brandingLogoUrl" TEXT,
  "brandingColor" TEXT,
  "agencyName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgencyMember" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
  "agencyId" TEXT NOT NULL,
  "tutorId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgencyMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgencyMember_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AgencyMember_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AgencyInvite" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
  "agencyId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "invitedEmail" TEXT,
  "recipientId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgencyInvite_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgencyInvite_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Room" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
  "tutorId" TEXT NOT NULL,
  "subject" TEXT NOT NULL DEFAULT 'GENERAL',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "durationMinutes" INTEGER NOT NULL DEFAULT 0,
  "brandingLogo" TEXT,
  "brandingColor" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Room_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Room_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "BoardPage" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
  "roomId" TEXT NOT NULL,
  "pageIndex" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BoardPage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BoardPage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Template" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
  "tutorId" TEXT NOT NULL,
  "name" VARCHAR(50) NOT NULL,
  "subject" TEXT NOT NULL DEFAULT 'GENERAL',
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Template_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Template_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
  "roomId" TEXT NOT NULL,
  "senderId" TEXT,
  "senderLabel" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "fileUrl" TEXT,
  "fileName" TEXT,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "UsageLog" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
  "userId" TEXT NOT NULL,
  "periodStartDate" DATE NOT NULL,
  "videoMinutesUsed" INTEGER NOT NULL DEFAULT 0,
  "aiCreditsUsed" INTEGER NOT NULL DEFAULT 0,
  "estimatedAiSpendCents" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
`;

const CREATE_INDEXES = `
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE INDEX IF NOT EXISTS "User_parentAgencyId_idx" ON "User"("parentAgencyId");

CREATE UNIQUE INDEX IF NOT EXISTS "AgencyMember_agencyId_tutorId_key" ON "AgencyMember"("agencyId", "tutorId");
CREATE INDEX IF NOT EXISTS "AgencyMember_tutorId_idx" ON "AgencyMember"("tutorId");

CREATE UNIQUE INDEX IF NOT EXISTS "AgencyInvite_code_key" ON "AgencyInvite"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "AgencyInvite_recipientId_key" ON "AgencyInvite"("recipientId");
CREATE INDEX IF NOT EXISTS "AgencyInvite_status_idx" ON "AgencyInvite"("status");

CREATE INDEX IF NOT EXISTS "Room_tutorId_idx" ON "Room"("tutorId");
CREATE INDEX IF NOT EXISTS "Room_isActive_idx" ON "Room"("isActive");

CREATE UNIQUE INDEX IF NOT EXISTS "BoardPage_roomId_pageIndex_key" ON "BoardPage"("roomId", "pageIndex");
CREATE INDEX IF NOT EXISTS "BoardPage_roomId_idx" ON "BoardPage"("roomId");

CREATE INDEX IF NOT EXISTS "Template_tutorId_idx" ON "Template"("tutorId");

CREATE INDEX IF NOT EXISTS "ChatMessage_roomId_createdAt_idx" ON "ChatMessage"("roomId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "UsageLog_userId_periodStartDate_key" ON "UsageLog"("userId", "periodStartDate");
CREATE INDEX IF NOT EXISTS "UsageLog_userId_idx" ON "UsageLog"("userId");
`;

// RLS policies use auth.uid()::text for TEXT PK comparison
const CREATE_RLS = `
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own" ON "User" FOR SELECT USING ("id" = auth.uid()::text);
CREATE POLICY "users_update_own" ON "User" FOR UPDATE USING ("id" = auth.uid()::text);
CREATE POLICY "users_service_role" ON "User" FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE "AgencyMember" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agency_member_read" ON "AgencyMember" FOR SELECT USING ("agencyId" = auth.uid()::text OR "tutorId" = auth.uid()::text);
CREATE POLICY "agency_member_service_role" ON "AgencyMember" FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE "AgencyInvite" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agency_invite_read" ON "AgencyInvite" FOR SELECT USING ("agencyId" = auth.uid()::text);
CREATE POLICY "agency_invite_service_role" ON "AgencyInvite" FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE "Room" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_tutor_read" ON "Room" FOR SELECT USING ("tutorId" = auth.uid()::text);
CREATE POLICY "room_tutor_insert" ON "Room" FOR INSERT WITH CHECK ("tutorId" = auth.uid()::text);
CREATE POLICY "room_tutor_update" ON "Room" FOR UPDATE USING ("tutorId" = auth.uid()::text);
CREATE POLICY "room_public_read" ON "Room" FOR SELECT USING ("isActive" = true);
CREATE POLICY "room_service_role" ON "Room" FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE "BoardPage" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boardpage_room_read" ON "BoardPage" FOR SELECT USING (
  EXISTS (SELECT 1 FROM "Room" WHERE "Room"."id" = "BoardPage"."roomId" AND ("Room"."tutorId" = auth.uid()::text OR "Room"."isActive" = true))
);
CREATE POLICY "boardpage_tutor_all" ON "BoardPage" FOR ALL USING (
  EXISTS (SELECT 1 FROM "Room" WHERE "Room"."id" = "BoardPage"."roomId" AND "Room"."tutorId" = auth.uid()::text)
);
CREATE POLICY "boardpage_service_role" ON "BoardPage" FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE "Template" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "template_tutor_all" ON "Template" FOR ALL USING ("tutorId" = auth.uid()::text);
CREATE POLICY "template_service_role" ON "Template" FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_room_read" ON "ChatMessage" FOR SELECT USING (
  EXISTS (SELECT 1 FROM "Room" WHERE "Room"."id" = "ChatMessage"."roomId" AND ("Room"."tutorId" = auth.uid()::text OR "Room"."isActive" = true))
);
CREATE POLICY "chat_room_insert" ON "ChatMessage" FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM "Room" WHERE "Room"."id" = "ChatMessage"."roomId" AND "Room"."isActive" = true)
);
CREATE POLICY "chat_service_role" ON "ChatMessage" FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE "UsageLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_user_read" ON "UsageLog" FOR SELECT USING ("userId" = auth.uid()::text);
CREATE POLICY "usage_service_role" ON "UsageLog" FOR ALL USING (auth.role() = 'service_role');
`;

async function setup() {
  const client = await pool.connect();
  try {
    console.log('1/3 Creating tables...');
    await client.query(CREATE_TABLES);
    
    console.log('2/3 Creating indexes...');
    await client.query(CREATE_INDEXES);
    
    console.log('3/3 Creating RLS policies...');
    await client.query(CREATE_RLS);
    
    // Verify
    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;");
    console.log('\n✅ Tables:', tables.rows.map(r => r.tablename).join(', '));
    
    const policies = await client.query("SELECT count(*)::int as cnt FROM pg_policies WHERE schemaname = 'public';");
    console.log('✅ RLS policies:', policies.rows[0].cnt);
    
    console.log('\n🎉 Supabase Phase 2 schema deployed successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
