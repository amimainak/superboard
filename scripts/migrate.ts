// ============================================================
// Migration Script: Add RoomParticipant + AgencyInvite tables
// ============================================================
// Run with: npx ts-node scripts/migrate.ts
// ============================================================

import { PrismaClient } from '@prisma/client';

const DATABASE_URL = 'postgresql://postgres.ruygzmkqtdogtencjdzg:thephisics1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function migrate() {
  const prisma = new PrismaClient({ datasourceUrl: DATABASE_URL });

  try {
    console.log('Starting migration...');

    // 1. Add stripeSubscriptionId to User if missing
    try {
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT`;
      console.log('  [OK] Added stripeSubscriptionId to User');
    } catch (e: any) {
      console.log('  [SKIP] stripeSubscriptionId:', e.message?.includes('already exists') ? 'exists' : e.message);
    }

    // 2. Create RoomParticipant table
    try {
      await prisma.$queryRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RoomParticipant" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "roomId" TEXT NOT NULL,
          "studentIdentity" TEXT NOT NULL,
          "studentName" TEXT,
          "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('  [OK] Created RoomParticipant table');
    } catch (e: any) {
      console.log('  [SKIP] RoomParticipant:', e.message?.includes('already exists') ? 'exists' : e.message);
    }

    // Add unique constraint
    try {
      await prisma.$queryRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "RoomParticipant" ADD CONSTRAINT "RoomParticipant_roomId_studentIdentity_key" UNIQUE ("roomId", "studentIdentity");
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
      console.log('  [OK] RoomParticipant unique constraint');
    } catch (e: any) {
      console.log('  [SKIP] RoomParticipant constraint:', e.message);
    }

    // Add foreign key
    try {
      await prisma.$queryRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "RoomParticipant" ADD CONSTRAINT "RoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
      console.log('  [OK] RoomParticipant foreign key');
    } catch (e: any) {
      console.log('  [SKIP] RoomParticipant FK:', e.message);
    }

    // 3. Create AgencyInvite table
    try {
      await prisma.$queryRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AgencyInvite" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "code" TEXT NOT NULL,
          "agencyId" TEXT NOT NULL,
          "invitedEmail" TEXT NOT NULL,
          "recipientId" TEXT,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "acceptedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('  [OK] Created AgencyInvite table');
    } catch (e: any) {
      console.log('  [SKIP] AgencyInvite:', e.message?.includes('already exists') ? 'exists' : e.message);
    }

    // Add unique constraints
    try {
      await prisma.$queryRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "AgencyInvite" ADD CONSTRAINT "AgencyInvite_code_key" UNIQUE ("code");
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
      console.log('  [OK] AgencyInvite code unique constraint');
    } catch (e: any) {
      console.log('  [SKIP] AgencyInvite code constraint:', e.message);
    }

    try {
      await prisma.$queryRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "AgencyInvite" ADD CONSTRAINT "AgencyInvite_recipientId_key" UNIQUE ("recipientId");
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
      console.log('  [OK] AgencyInvite recipientId unique constraint');
    } catch (e: any) {
      console.log('  [SKIP] AgencyInvite recipientId constraint:', e.message);
    }

    // Add foreign keys
    try {
      await prisma.$queryRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "AgencyInvite" ADD CONSTRAINT "AgencyInvite_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
      console.log('  [OK] AgencyInvite agencyId foreign key');
    } catch (e: any) {
      console.log('  [SKIP] AgencyInvite agencyId FK:', e.message);
    }

    try {
      await prisma.$queryRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "AgencyInvite" ADD CONSTRAINT "AgencyInvite_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
      console.log('  [OK] AgencyInvite recipientId foreign key');
    } catch (e: any) {
      console.log('  [SKIP] AgencyInvite recipientId FK:', e.message);
    }

    console.log('\nMigration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
