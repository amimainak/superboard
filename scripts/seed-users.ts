// ============================================================
// Seed Script — Create 4 Test Accounts
// ============================================================
// Creates users in Supabase Auth + sets their tiers in PostgreSQL
// Run with: npx tsx scripts/seed-users.ts
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const prisma = new PrismaClient();

interface TestUser {
  email: string;
  password: string;
  name: string;
  tier: 'FREE' | 'PRO' | 'AGENCY';
  // For agency: extra branding fields
  brandingColor?: string;
}

const TEST_USERS: TestUser[] = [
  {
    email: 'student@test.com',
    password: 'Test1234!',
    name: 'Test Student',
    tier: 'FREE',
  },
  {
    email: 'free-tutor@test.com',
    password: 'Test1234!',
    name: 'Free Tutor',
    tier: 'FREE',
  },
  {
    email: 'pro-tutor@test.com',
    password: 'Test1234!',
    name: 'Pro Tutor',
    tier: 'PRO',
  },
  {
    email: 'agency@test.com',
    password: 'Test1234!',
    name: 'Test Agency',
    tier: 'AGENCY',
    brandingColor: '#059669',
  },
];

async function seed() {
  console.log('=== Superboard Test Account Seeding ===\n');

  for (const testUser of TEST_USERS) {
    console.log(`Creating: ${testUser.email} (${testUser.tier})`);

    // 1. Sign up via Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
    });

    if (error) {
      // If user already exists, try to sign in to get the session
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        console.log(`  → User already exists in Auth, signing in to get ID...`);
        const signInResult = await supabase.auth.signInWithPassword({
          email: testUser.email,
          password: testUser.password,
        });
        if (signInResult.error) {
          // Try without password - might need email confirmation
          console.log(`  ⚠ Could not sign in: ${signInResult.error.message}`);
          console.log(`  → Will try to find user in DB by email...`);
        } else {
          const authUserId = signInResult.data.user.id;
          await upsertDbUser(authUserId, testUser);
          continue;
        }
      } else {
        console.log(`  ✗ Auth error: ${error.message}`);
        continue;
      }
    }

    // If sign up succeeded
    if (data.user) {
      const authUserId = data.user.id;
      console.log(`  → Auth user created: ${authUserId}`);

      // If we got a session (auto-confirmation enabled), great
      if (data.session) {
        console.log(`  → Auto-confirmed, session active`);
      } else {
        console.log(`  → Email confirmation may be required`);
      }

      await upsertDbUser(authUserId, testUser);
    }
  }

  // Summary: show all users in DB
  console.log('\n=== Database Users ===');
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, tier: true, brandingColor: true },
  });
  for (const u of allUsers) {
    console.log(`  ${u.email} | ${u.tier} | ${u.brandingColor || 'no brand color'}`);
  }

  console.log('\n=== Done ===');
  await prisma.$disconnect();
}

async function upsertDbUser(authUserId: string, testUser: TestUser) {
  // Upsert: create or update the user in PostgreSQL
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
      tier: testUser.tier,
      name: testUser.name,
      brandingColor: testUser.brandingColor || null,
    },
  });
  console.log(`  → DB record: id=${dbUser.id}, tier=${dbUser.tier}`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
