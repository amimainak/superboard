// ============================================================
// Comprehensive Seed Script — Users, Rooms, Templates, UsageLogs
// ============================================================
// Creates test accounts, sample rooms with pages, and templates.
// Supports two modes:
//   - With Supabase Auth: creates auth users + DB records
//   - Without Supabase Auth: creates DB-only users (dev mode)
//
// Run: npx tsx scripts/seed.ts
// ============================================================

// Load .env so Prisma Client + Supabase SDK can find their vars at runtime
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), override: true });

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const prisma = new PrismaClient();

// ---- Types ----

interface TestUser {
  email: string;
  name: string;
  tier: 'FREE' | 'PRO' | 'AGENCY';
  brandingColor?: string | null;
  isTutor?: boolean;
}

interface TestRoom {
  tutorEmail: string;
  subject: 'MATH' | 'SCIENCE' | 'LANGUAGE' | 'GENERAL';
  isActive: boolean;
  brandingColor?: string | null;
  pages?: number; // Number of blank pages to create
}

interface TestTemplate {
  tutorEmail: string;
  name: string;
  subject: 'MATH' | 'SCIENCE' | 'LANGUAGE' | 'GENERAL';
}

// ---- Seed Data ----

const TEST_USERS: TestUser[] = [
  {
    email: 'student@superboard.app',
    name: 'Test Student',
    tier: 'FREE',
    isTutor: false,
  },
  {
    email: 'free-tutor@superboard.app',
    name: 'Free Tutor',
    tier: 'FREE',
    isTutor: true,
  },
  {
    email: 'pro-tutor@superboard.app',
    name: 'Pro Tutor',
    tier: 'PRO',
    isTutor: true,
  },
  {
    email: 'agency@superboard.app',
    name: 'Test Agency',
    tier: 'AGENCY',
    brandingColor: '#059669',
    isTutor: true,
  },
];

const TEST_ROOMS: TestRoom[] = [
  { tutorEmail: 'free-tutor@superboard.app', subject: 'MATH', isActive: true, pages: 1 },
  { tutorEmail: 'pro-tutor@superboard.app', subject: 'SCIENCE', isActive: true, pages: 2 },
  { tutorEmail: 'agency@superboard.app', subject: 'LANGUAGE', isActive: true, brandingColor: '#059669', pages: 1 },
  { tutorEmail: 'pro-tutor@superboard.app', subject: 'GENERAL', isActive: false, pages: 1 },
];

const TEST_TEMPLATES: TestTemplate[] = [
  { tutorEmail: 'free-tutor@superboard.app', name: 'Math Grid Paper', subject: 'MATH' },
  { tutorEmail: 'pro-tutor@superboard.app', name: 'Science Lab Notes', subject: 'SCIENCE' },
  { tutorEmail: 'agency@superboard.app', name: 'Language Essay Planner', subject: 'LANGUAGE' },
];

// ---- Helpers ----

/** Empty snapshot for a fresh canvas page */
function emptySnapshot(): string {
  return JSON.stringify({
    store: {},
    meta: { page: {}, pageSize: { width: 1280, height: 720 } },
  });
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  return Array.from(crypto.randomBytes(16))
    .map((b: number) => chars[b % chars.length])
    .join('');
}

function generateId(): string {
  return crypto.randomUUID();
}

// ---- Auth (optional) ----

let supabaseAdmin: any = null;

async function initSupabase() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.log('  [INFO] No Supabase credentials found — running in DB-only mode.\n');
    return;
  }
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    console.log('  [INFO] Supabase Auth client initialized.\n');
  } catch (err: any) {
    console.log(`  [WARN] Failed to init Supabase client: ${err.message}\n`);
  }
}

async function createAuthUser(email: string, password: string, name: string): Promise<string | null> {
  if (!supabaseAdmin) return null;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
          filters: `email eq "${email}"`,
        });
        if (listData?.users?.length > 0) {
          return listData.users[0].id;
        }
        return null;
      }
      console.log(`    Auth error: ${error.message}`);
      return null;
    }

    return data.user.id;
  } catch (err: any) {
    console.log(`    Auth exception: ${err.message}`);
    return null;
  }
}

// ---- Seed Functions ----

async function seedUsers() {
  console.log('=== Seeding Users ===\n');
  const passwords: Record<string, string> = {};

  for (const testUser of TEST_USERS) {
    console.log(`  [${testUser.tier}] ${testUser.email}`);

    const password = generateSecurePassword();
    passwords[testUser.email] = password;

    // Try Supabase Auth first
    const authUserId = await createAuthUser(testUser.email, password, testUser.name);

    // Upsert in DB
    const userId = authUserId || generateId();

    try {
      const dbUser = await prisma.user.upsert({
        where: { email: testUser.email },
        create: {
          id: userId,
          email: testUser.email,
          name: testUser.name,
          tier: testUser.tier,
          brandingColor: testUser.brandingColor || null,
        },
        update: {
          tier: testUser.tier,
          name: testUser.name,
          brandingColor: testUser.brandingColor || null,
        },
      });
      console.log(`    DB: id=${dbUser.id.substring(0, 8)}... tier=${dbUser.tier}`);
    } catch (err: any) {
      console.log(`    DB error: ${err.message}`);
    }
  }

  return passwords;
}

async function seedRooms() {
  console.log('\n=== Seeding Rooms ===\n');

  for (const room of TEST_ROOMS) {
    const tutor = await prisma.user.findUnique({ where: { email: room.tutorEmail } });
    if (!tutor) {
      console.log(`  SKIP ${room.subject} room — tutor ${room.tutorEmail} not found`);
      continue;
    }

    const roomId = generateId();
    try {
      const createdRoom = await prisma.room.create({
        data: {
          id: roomId,
          tutorId: tutor.id,
          subject: room.subject,
          isActive: room.isActive,
          brandingColor: room.brandingColor || tutor.brandingColor || null,
          pages: {
            create: Array.from({ length: room.pages || 1 }, (_, i) => ({
              pageIndex: i,
              snapshot: emptySnapshot(),
            })),
          },
        },
        include: { pages: true },
      });
      console.log(`  Created: ${createdRoom.id.substring(0, 8)}... [${room.subject}] by ${tutor.email} (${createdRoom.pages.length} page${createdRoom.pages.length > 1 ? 's' : ''})`);
    } catch (err: any) {
      console.log(`  Error: ${err.message}`);
    }
  }
}

async function seedTemplates() {
  console.log('\n=== Seeding Templates ===\n');

  for (const tpl of TEST_TEMPLATES) {
    const tutor = await prisma.user.findUnique({ where: { email: tpl.tutorEmail } });
    if (!tutor) {
      console.log(`  SKIP "${tpl.name}" — tutor ${tpl.tutorEmail} not found`);
      continue;
    }

    try {
      const created = await prisma.template.create({
        data: {
          tutorId: tutor.id,
          name: tpl.name,
          subject: tpl.subject,
          snapshot: emptySnapshot(),
        },
      });
      console.log(`  Created: "${tpl.name}" [${tpl.subject}] by ${tutor.email}`);
    } catch (err: any) {
      console.log(`  Error: ${err.message}`);
    }
  }
}

async function seedUsageLogs() {
  console.log('\n=== Seeding Usage Logs ===\n');

  // Create a usage log for the pro tutor (simulate some usage)
  const proTutor = await prisma.user.findUnique({ where: { email: 'pro-tutor@superboard.app' } });
  if (proTutor) {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodStart.getDay() + 1); // Monday
    periodStart.setHours(0, 0, 0, 0);

    try {
      await prisma.usageLog.upsert({
        where: {
          userId_periodStartDate: {
            userId: proTutor.id,
            periodStartDate: periodStart,
          },
        },
        create: {
          userId: proTutor.id,
          periodStartDate: periodStart,
          videoMinutesUsed: 45,
          aiCreditsUsed: 12,
          recordingsUsed: 2,
        },
        update: {},
      });
      console.log(`  Pro usage log: 45 min video, 12 AI credits, 2 recordings`);
    } catch (err: any) {
      console.log(`  Error: ${err.message}`);
    }
  }
}

async function printSummary(passwords: Record<string, string>) {
  console.log('\n========================================================');
  console.log('  SUPERBOARD — SEED COMPLETE');
  console.log('========================================================\n');

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, tier: true, brandingColor: true },
    orderBy: { tier: 'asc' },
  });
  console.log('  USERS:');
  for (const u of users) {
    const badge = u.tier === 'AGENCY' ? 'AGENCY' : u.tier === 'PRO' ? 'PRO  ' : 'FREE ';
    console.log(`    [${badge}] ${u.email} — ${u.name}`);
  }

  const rooms = await prisma.room.findMany({
    select: { id: true, subject: true, isActive: true, tutor: { select: { email: true } }, _count: { select: { pages: true } } },
  });
  console.log(`\n  ROOMS: ${rooms.length}`);
  for (const r of rooms) {
    const status = r.isActive ? 'ACTIVE' : 'CLOSED';
    console.log(`    [${status}] ${r.id.substring(0, 8)}... ${r.subject} by ${r.tutor.email} (${r._count.pages} page${r._count.pages > 1 ? 's' : ''})`);
  }

  const templates = await prisma.template.findMany({
    select: { id: true, name: true, subject: true, tutor: { select: { email: true } } },
  });
  console.log(`\n  TEMPLATES: ${templates.length}`);
  for (const t of templates) {
    console.log(`    "${t.name}" [${t.subject}] by ${t.tutor.email}`);
  }

  if (Object.keys(passwords).length > 0 && supabaseAdmin) {
    console.log('\n  CREDENTIALS (save these — randomly generated):');
    for (const u of TEST_USERS) {
      console.log(`    ${u.email} / ${passwords[u.email]}`);
    }
  } else if (!supabaseAdmin) {
    console.log('\n  NOTE: Running in DB-only mode (no Supabase Auth).');
    console.log('  Users exist in DB but cannot log in without Supabase Auth accounts.');
    console.log('  Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable.');
  }

  console.log('\n========================================================\n');
}

// ---- Main ----

async function main() {
  console.log('\n=== Superboard Database Seeding ===\n');
  await initSupabase();

  const passwords = await seedUsers();
  await seedRooms();
  await seedTemplates();
  await seedUsageLogs();
  await printSummary(passwords);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
