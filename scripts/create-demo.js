// Create demo agency account via Supabase Admin API + Prisma
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const SUPABASE_URL = 'https://ruygzmkqtdogtencjdzg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eWd6bWtxdGRvZ3RlbmNqZHpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTczMDE0NSwiZXhwIjoyMTAxMzA2MTQ1fQ.h-mUtzE5jT4oiubTAhKROP1b0Z0UzykEI3trhkvyFls';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const prisma = new PrismaClient();

async function main() {
  console.log('=== Creating Demo Agency Account ===\n');
  let userId;

  // Step 1: Find or create user in Supabase Auth
  try {
    // Try to find existing user first
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list.users.find(u => u.email === 'demo@superboard.io');

    if (existing) {
      userId = existing.id;
      console.log('Found existing auth user:', userId);
    } else {
      // Create new user
      const { data, error } = await supabase.auth.admin.createUser({
        email: 'demo@superboard.io',
        password: 'Demo2024!',
        email_confirm: true,
        user_metadata: { name: 'Demo Agency Admin', role: 'agency' }
      });
      if (error) throw error;
      userId = data.user.id;
      console.log('Created new auth user:', userId);
    }
  } catch (err) {
    console.error('Supabase error:', err.message);
    process.exit(1);
  }

  // Step 2: Upsert in Prisma User table with AGENCY tier
  try {
    const user = await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: 'demo@superboard.io',
        name: 'Demo Agency Admin',
        tier: 'AGENCY',
        brandingColor: '#6366f1',
        customDomain: 'demo.superboard.io',
      },
      update: {
        tier: 'AGENCY',
        name: 'Demo Agency Admin',
        brandingColor: '#6366f1',
        customDomain: 'demo.superboard.io',
      },
    });
    console.log('Prisma user upserted:', user.id, '| tier:', user.tier);
  } catch (err) {
    console.error('Prisma error:', err.message);
    process.exit(1);
  }

  // Step 3: Create demo templates
  const templates = [
    { name: 'Math - Fractions 101', subject: 'MATH', snapshot: { pages: 1, desc: 'Basic fractions' } },
    { name: 'Science - Periodic Table', subject: 'SCIENCE', snapshot: { pages: 1, desc: 'Element overview' } },
    { name: 'Language - Essay Outline', subject: 'LANGUAGE', snapshot: { pages: 1, desc: 'Essay planning' } },
    { name: 'General - Brainstorm', subject: 'GENERAL', snapshot: { pages: 1, desc: 'Open brainstorm' } },
  ];

  let tplCount = 0;
  for (const tpl of templates) {
    try {
      await prisma.template.upsert({
        where: { id: `${userId}-${tpl.subject}` },
        create: { id: `${userId}-${tpl.subject}`, tutorId: userId, ...tpl },
        update: { name: tpl.name, snapshot: tpl.snapshot },
      });
      tplCount++;
    } catch {
      // skip duplicates
    }
  }
  console.log('Templates seeded:', tplCount);

  // Step 4: Create a demo room
  const demoRoom = await prisma.room.create({
    data: {
      tutorId: userId,
      subject: 'MATH',
      isActive: true,
      brandingColor: '#6366f1',
    },
  });
  await prisma.boardPage.create({
    data: { roomId: demoRoom.id, pageIndex: 0, snapshot: '{}' },
  });
  console.log('Demo room created:', demoRoom.id);

  console.log('\n=== DONE ===');
  console.log('Email:    demo@superboard.io');
  console.log('Password: Demo2024!');
  console.log('Tier:     AGENCY');
  console.log('Room:     /room/' + demoRoom.id);
}

main()
  .catch(err => { console.error('FATAL:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
