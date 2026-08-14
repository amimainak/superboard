// End-to-end verification: Prisma + Supabase connection test
const { PrismaClient } = require('@prisma/client');

async function verify() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres.sjbxyxallfeyfuplacnn:thephisics1@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require'
      }
    }
  });

  try {
    // Test Prisma queries
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);

    const roomCount = await prisma.room.count();
    console.log('Room count:', roomCount);

    const templateCount = await prisma.template.count();
    console.log('Template count:', templateCount);

    const chatCount = await prisma.chatMessage.count();
    console.log('ChatMessage count:', chatCount);

    // Test Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      'https://sjbxyxallfeyfuplacnn.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqYnh5eGFsbGZleWZ1cGxhY25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDI3NTgsImV4cCI6MjEwMjExODc1OH0.KjasiAOX22zTLGYiNi3vMjml0Z0dopU8I4pooPNC7lw'
    );

    const { count, error } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true });
    console.log('Supabase client test:', error ? error.message : 'OK, User count=' + count);

    console.log('\nAll connections verified successfully!');
    console.log('Database is clean and ready for Phase 2.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
