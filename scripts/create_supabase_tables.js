// Create all Superboard tables via raw SQL (bypasses Prisma db push timeout)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.sjbxyxallfeyfuplacnn:thephisics1@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User (Tutor accounts only)
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
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
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE INDEX IF NOT EXISTS "User_parentAgencyId_idx" ON "User"("parentAgencyId");

-- AgencyMember
CREATE TABLE IF NOT EXISTS "AgencyMember" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "agencyId" TEXT NOT NULL,
  "tutorId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgencyMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgencyMember_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AgencyMember_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AgencyMember_agencyId_tutorId_key" ON "AgencyMember"("agencyId", "tutorId");
CREATE INDEX IF NOT EXISTS "AgencyMember_tutorId_idx" ON "AgencyMember"("tutorId");

-- AgencyInvite
CREATE TABLE IF NOT EXISTS "AgencyInvite" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
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
CREATE UNIQUE INDEX IF NOT EXISTS "AgencyInvite_code_key" ON "AgencyInvite"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "AgencyInvite_recipientId_key" ON "AgencyInvite"("recipientId");
CREATE INDEX IF NOT EXISTS "AgencyInvite_status_idx" ON "AgencyInvite"("status");

-- Room
CREATE TABLE IF NOT EXISTS "Room" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
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
CREATE INDEX IF NOT EXISTS "Room_tutorId_idx" ON "Room"("tutorId");
CREATE INDEX IF NOT EXISTS "Room_isActive_idx" ON "Room"("isActive");

-- BoardPage
CREATE TABLE IF NOT EXISTS "BoardPage" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "roomId" TEXT NOT NULL,
  "pageIndex" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BoardPage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BoardPage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "BoardPage_roomId_pageIndex_key" ON "BoardPage"("roomId", "pageIndex");
CREATE INDEX IF NOT EXISTS "BoardPage_roomId_idx" ON "BoardPage"("roomId");

-- Template
CREATE TABLE IF NOT EXISTS "Template" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "tutorId" TEXT NOT NULL,
  "name" VARCHAR(50) NOT NULL,
  "subject" TEXT NOT NULL DEFAULT 'GENERAL',
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Template_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Template_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Template_tutorId_idx" ON "Template"("tutorId");

-- ChatMessage
CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
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
CREATE INDEX IF NOT EXISTS "ChatMessage_roomId_createdAt_idx" ON "ChatMessage"("roomId", "createdAt");

-- UsageLog
CREATE TABLE IF NOT EXISTS "UsageLog" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "periodStartDate" DATE NOT NULL,
  "videoMinutesUsed" INTEGER NOT NULL DEFAULT 0,
  "aiCreditsUsed" INTEGER NOT NULL DEFAULT 0,
  "estimatedAiSpendCents" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "UsageLog_userId_periodStartDate_key" ON "UsageLog"("userId", "periodStartDate");
CREATE INDEX IF NOT EXISTS "UsageLog_userId_idx" ON "UsageLog"("userId");
`;

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('All tables created successfully!');

    // Verify
    const res = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;");
    console.log('Tables:', res.rows.map(r => r.tablename));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createTables();
