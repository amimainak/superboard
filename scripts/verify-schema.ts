// Script: Compare Prisma schema with Supabase DB and apply missing changes
// Uses session-mode pooler for DDL compatibility

import { Client } from 'pg';
import { readFileSync } from 'fs';

const DB_URL = "postgresql://postgres.ruygzmkqtdogtencjdzg:thephisics1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

async function getColumnDefs(client: Client, tableName: string) {
  const { rows } = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);
  return rows;
}

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('✅ Connected to Supabase PostgreSQL');

  // Check for any missing columns by comparing schema.sql expectations
  // against what exists in the database
  
  // Our schema expects these tables and key columns:
  const expectedSchema: Record<string, string[]> = {
    'User': ['id', 'email', 'name', 'tier', 'isAdmin', 'isActive', 'avatarUrl', 'parentAgencyId', 'agencyName', 'createdAt', 'updatedAt'],
    'Room': ['id', 'tutorId', 'title', 'subject', 'isActive', 'endedAt', 'createdAt', 'updatedAt'],
    'RoomParticipant': ['id', 'roomId', 'studentId', 'studentIdentity', 'joinedAt'],
    'BoardPage': ['id', 'roomId', 'pageNumber', 'snapshot', 'createdAt', 'updatedAt'],
    'ScheduledLesson': ['id', 'tutorId', 'studentEmail', 'title', 'subject', 'scheduledAt', 'durationMinutes', 'timeZone', 'status', 'isGroup', 'maxStudents'],
    'Homework': ['id', 'roomId', 'studentId', 'title', 'description', 'subject', 'dueDate', 'status', 'tutorFeedback', 'grade', 'createdAt', 'updatedAt'],
    'LessonNote': ['id', 'roomId', 'studentId', 'tutorId', 'content', 'tutorFeedback', 'topicsForNext', 'rating', 'createdAt'],
    'Student': ['id', 'email', 'name', 'agencyId', 'grade', 'phone', 'parentName', 'parentEmail', 'parentAccessToken', 'notes', 'isActive', 'createdAt', 'updatedAt'],
    'Invoice': ['id', 'agencyId', 'studentId', 'tutorId', 'invoiceNumber', 'amount', 'status', 'dueDate', 'paidAt', 'notes', 'createdAt', 'updatedAt'],
    'ResourceLibrary': ['id', 'agencyId', 'title', 'description', 'category', 'subject', 'fileUrl', 'fileName', 'uploadedBy', 'downloadCount', 'createdAt'],
    'Recording': ['id', 'roomId', 'tutorId', 'url', 'status', 'egressId', 'duration', 'startedAt', 'endedAt', 'createdAt'],
    'Subscription': ['id', 'userId', 'stripeCustomerId', 'stripeSubscriptionId', 'plan', 'status', 'currentPeriodEnd', 'cancelAtPeriodEnd', 'createdAt', 'updatedAt'],
    'UsageLog': ['id', 'userId', 'action', 'minutesUsed', 'recordingsUsed', 'periodStart', 'periodEnd'],
    'WebhookConfig': ['id', 'agencyId', 'url', 'secret', 'events', 'isActive', 'lastTriggeredAt', 'createdAt', 'updatedAt'],
    'Template': ['id', 'title', 'description', 'subject', 'category', 'thumbnailUrl', 'data', 'isBuiltIn', 'createdBy'],
    'PlatformConfig': ['id', 'key', 'value', 'updatedAt'],
    'AuditLog': ['id', 'userId', 'action', 'resource', 'details', 'ip', 'createdAt'],
    'AgencyInvite': ['id', 'agencyId', 'email', 'role', 'status', 'token', 'expiresAt', 'invitedBy', 'acceptedAt', 'createdAt', 'updatedAt'],
  };

  const { rows: tables } = await client.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `);
  const tableNames = tables.map((t: any) => t.tablename);

  let missingColumns = 0;
  let allGood = true;

  for (const [table, expectedCols] of Object.entries(expectedSchema)) {
    if (!tableNames.includes(table)) {
      console.log(`❌ Missing table: ${table}`);
      allGood = false;
      continue;
    }
    
    const columns = await getColumnDefs(client, table);
    const colNames = columns.map((c: any) => c.column_name);
    
    const missing = expectedCols.filter(c => !colNames.includes(c));
    if (missing.length > 0) {
      console.log(`⚠️  ${table}: missing columns: ${missing.join(', ')}`);
      missingColumns += missing.length;
    }
  }

  // Check for the unique constraint on RoomParticipant
  const { rows: rpConstraints } = await client.query(`
    SELECT constraint_name FROM pg_constraints 
    WHERE table_name = 'RoomParticipant' AND constraint_type = 'u'
  `);
  if (rpConstraints.length === 0) {
    console.log('⚠️  RoomParticipant: missing unique constraint on (roomId, studentIdentity)');
  }

  // Check for indexes
  const { rows: indexes } = await client.query(`
    SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `);
  console.log(`\n📊 Indexes (${indexes.length}):`);
  indexes.forEach((i: any) => console.log(`  ${i.tablename}.${i.indexname}`));

  if (allGood && missingColumns === 0) {
    console.log('\n✅ Schema is fully synced with Supabase PostgreSQL!');
  } else {
    console.log(`\n⚠️  Found ${missingColumns} missing columns across tables`);
  }

  await client.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
