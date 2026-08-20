const { Pool } = require('pg');

// Connection string from env or hardcoded
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.sjbxyxallfeyfuplacnn:PASSWORD@db.sjbxyxallfeyfuplacnn.supabase.co:5432/postgres';

const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
  });

  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migration-language-tables.sql'), 'utf8');

    console.log('Running language tables migration...');
    await client.query(sql);

    // Verify
    const tables = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('language_exercises','vocab_cards','student_mastery','session_notes') ORDER BY tablename;"
    );
    console.log('Created tables:', tables.rows.map(r => r.tablename).join(', '));

    console.log('Migration complete! Now run: npx tsx scripts/seed-language-data.ts');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
