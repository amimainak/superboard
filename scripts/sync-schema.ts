// Script: Sync Prisma schema to Supabase PostgreSQL
// Applies all missing columns via ALTER TABLE statements
// Uses Supabase transaction pooler (read queries for verification, but DDL via REST)

import { Client } from 'pg';

const DB_URL = "postgresql://postgres.ruygzmkqtdogtencjdzg:thephisics1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

// All DDL statements needed to sync the schema
const MIGRATIONS: string[] = [
  // User table
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT`,
  
  // Room table
  `ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT ''`,
  
  // BoardPage table
  `ALTER TABLE "BoardPage" ADD COLUMN IF NOT EXISTS "pageNumber" INTEGER NOT NULL DEFAULT 0`,
  
  // Student table
  `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
  
  // Invoice table
  `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "tutorId" TEXT`,
  `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "amount" DECIMAL(10,2) NOT NULL DEFAULT 0`,
  
  // ResourceLibrary table
  `ALTER TABLE "ResourceLibrary" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "ResourceLibrary" ADD COLUMN IF NOT EXISTS "fileName" TEXT`,
  `ALTER TABLE "ResourceLibrary" ADD COLUMN IF NOT EXISTS "uploadedBy" TEXT`,
  
  // Subscription table
  `ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT`,
  `ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'free'`,
  
  // UsageLog table
  `ALTER TABLE "UsageLog" ADD COLUMN IF NOT EXISTS "action" TEXT`,
  `ALTER TABLE "UsageLog" ADD COLUMN IF NOT EXISTS "minutesUsed" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "UsageLog" ADD COLUMN IF NOT EXISTS "periodStart" TIMESTAMP(3)`,
  `ALTER TABLE "UsageLog" ADD COLUMN IF NOT EXISTS "periodEnd" TIMESTAMP(3)`,
  
  // WebhookConfig table
  `ALTER TABLE "WebhookConfig" ADD COLUMN IF NOT EXISTS "agencyId" TEXT`,
  `ALTER TABLE "WebhookConfig" ADD COLUMN IF NOT EXISTS "lastTriggeredAt" TIMESTAMP(3)`,
  `ALTER TABLE "WebhookConfig" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
  
  // Template table
  `ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "description" TEXT`,
  `ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "category" TEXT`,
  `ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT`,
  `ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "data" TEXT`,
  `ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "isBuiltIn" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "createdBy" TEXT`,
  
  // PlatformConfig table
  `ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "key" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "value" TEXT`,
  
  // AuditLog table
  `ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "userId" TEXT`,
  `ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "resource" TEXT`,
  `ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "details" TEXT`,
  `ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "ip" TEXT`,
  
  // AgencyInvite table
  `ALTER TABLE "AgencyInvite" ADD COLUMN IF NOT EXISTS "email" TEXT`,
  `ALTER TABLE "AgencyInvite" ADD COLUMN IF NOT EXISTS "role" TEXT`,
  `ALTER TABLE "AgencyInvite" ADD COLUMN IF NOT EXISTS "token" TEXT`,
  `ALTER TABLE "AgencyInvite" ADD COLUMN IF NOT EXISTS "invitedBy" TEXT`,
  
  // Add unique constraint on RoomParticipant (roomId, studentIdentity)
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RoomParticipant_roomId_studentIdentity_key') THEN
      ALTER TABLE "RoomParticipant" ADD CONSTRAINT "RoomParticipant_roomId_studentIdentity_key" UNIQUE ("roomId", "studentIdentity");
    END IF;
  $$`,
];

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('✅ Connected to Supabase PostgreSQL (Singapore pooler)');
  console.log(`\nApplying ${MIGRATIONS.length} schema migrations...\n`);

  let applied = 0;
  let skipped = 0;
  let errors = 0;

  for (const sql of MIGRATIONS) {
    try {
      await client.query(sql);
      applied++;
      console.log(`  ✅ ${sql.substring(0, 80)}...`);
    } catch (err: any) {
      if (err.code === '0A000' || err.message?.includes('already exists') || err.message?.includes('already exists')) {
        skipped++;
        console.log(`  ⏭️  Skipped (already exists): ${sql.substring(0, 60)}...`);
      } else {
        errors++;
        console.log(`  ❌ Error: ${err.message} — ${sql.substring(0, 60)}...`);
      }
    }
  }

  console.log(`\n--- Migration Summary ---`);
  console.log(`  Applied: ${applied}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors:  ${errors}`);

  // Verify final state
  const { rows: tables } = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`);
  console.log(`\n📊 Tables (${tables.length}): ${tables.map((t: any) => t.tablename).join(', ')}`);

  await client.end();
  console.log('\n✅ Schema sync complete');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
