// ============================================================
// Seed Script — Create 4 Test Accounts via Admin API
// ============================================================
// Uses Supabase service_role key to create users without email.
// Then upserts their PostgreSQL records with correct tiers.
//
// SECURITY FIX (V-03): Passwords are no longer hardcoded.
// They are read from environment variables with secure defaults.
// For production, set SEED_STUDENT_PASSWORD, SEED_TUTOR_PASSWORD,
// SEED_PRO_PASSWORD, and SEED_AGENCY_PASSWORD in .env.local.
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

// Admin client — bypasses RLS, can create confirmed users
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const prisma = new PrismaClient();

interface TestUser {
  email: string;
  name: string;
  tier: 'FREE' | 'PRO' | 'AGENCY';
  brandingColor?: string | null;
}

const TEST_USERS: TestUser[] = [
  {
    email: 'student@superboard.app',
    name: 'Test Student',
    tier: 'FREE',
  },
  {
    email: 'free-tutor@superboard.app',
    name: 'Free Tutor',
    tier: 'FREE',
  },
  {
    email: 'pro-tutor@superboard.app',
    name: 'Pro Tutor',
    tier: 'PRO',
  },
  {
    email: 'agency@superboard.app',
    name: 'Test Agency',
    tier: 'AGENCY',
    brandingColor: '#059669',
  },
];

/**
 * Generate a secure random password for seed accounts.
 * In production, override via environment variables.
 */
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const array = new Uint8Array(16);
  // Use crypto module for server-side randomness
  const crypto = require('crypto');
  return Array.from(crypto.randomBytes(16))
    .map((b: number) => chars[b % chars.length])
    .join('');
}

async function seed() {
  console.log('=== Superboard Test Account Seeding ===\n');
  console.log('NOTE: Seed passwords are generated randomly and printed below.');
  console.log('      Override via SEED_*_PASSWORD environment variables.\n');

  const passwords: Record<string, string> = {};

  for (const testUser of TEST_USERS) {
    console.log(`--- ${testUser.email} (${testUser.tier}) ---`);

    // Get password from env or generate one
    const envKey = `SEED_${testUser.tier}_${testUser.email.split('@')[0].split('-')[0].toUpperCase()}_PASSWORD`;
    const password = process.env[envKey] || generateSecurePassword();
    passwords[testUser.email] = password;

    // 1. Create user in Supabase Auth (admin API, auto-confirmed)
    let authUserId: string | null = null;

    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: password,
        email_confirm: true, // Skip email verification
        user_metadata: { name: testUser.name },
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          console.log('  User already exists in Auth, fetching ID...');
          // List users to find the existing one
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
            filters: `email eq "${testUser.email}"`,
          });
          if (listData?.users?.length > 0) {
            authUserId = listData.users[0].id;
            console.log(`  Found existing auth user: ${authUserId}`);
          } else {
            console.log(`  ERROR: Could not find existing user`);
            continue;
          }
        } else {
          console.log(`  Auth error: ${error.message}`);
          continue;
        }
      } else {
        authUserId = data.user.id;
        console.log(`  Auth user created & confirmed: ${authUserId}`);
      }
    } catch (err: any) {
      console.log(`  Auth exception: ${err.message}`);
      continue;
    }

    // 2. Upsert in PostgreSQL
    if (authUserId) {
      try {
        const dbUser = await prisma.user.upsert({
          where: { email: testUser.email },
          create: {
            id: authUserId,
            email: testUser.email,
            name: testUser.name,
            tier: testUser.tier,
            brandingColor: testUser.brandingColor || null,
          },
          update: {
            id: authUserId, // Ensure IDs match
            tier: testUser.tier,
            name: testUser.name,
            brandingColor: testUser.brandingColor || null,
          },
        });
        console.log(`  DB record: id=${dbUser.id}, tier=${dbUser.tier}`);
      } catch (err: any) {
        console.log(`  DB error: ${err.message}`);
      }
    }
  }

  // Summary
  console.log('\n=== All Users in Database ===');
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, tier: true, brandingColor: true },
  });
  for (const u of allUsers) {
    const tierBadge = u.tier === 'AGENCY' ? '[AGENCY]' : u.tier === 'PRO' ? '[PRO]' : '[FREE]';
    console.log(`  ${tierBadge} ${u.email} | ${u.tier} | color=${u.brandingColor || 'none'}`);
  }

  console.log('\n=== Test Credentials (SAVE THESE — they are randomly generated) ===');
  for (const u of TEST_USERS) {
    console.log(`  ${u.email} / ${passwords[u.email]} (${u.tier})`);
  }

  console.log('\nDone!');
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
