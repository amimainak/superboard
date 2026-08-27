const { PrismaClient } = require('@prisma/client');

// Use the correct DB URL
process.env.DATABASE_URL = 'postgresql://postgres.sjbxyxallfeyfuplacnn:Thephisics1@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

const { execSync } = require('child_process');

// Run prisma db push with the correct DATABASE_URL
try {
  const result = execSync(
    'npx prisma db push --accept-data-loss --skip-generate',
    {
      cwd: '/home/z/my-project',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      timeout: 180000,
      stdio: 'inherit',
    }
  );
  console.log('Schema push completed successfully');
} catch (e) {
  console.error('Schema push failed:', e.message);
  process.exit(1);
}
