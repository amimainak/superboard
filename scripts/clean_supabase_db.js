// Script to clean all tables from the Supabase database
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres.sjbxyxallfeyfuplacnn:thephisics1@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres",
});

async function cleanDatabase() {
  const client = await pool.connect();
  try {
    // List all user tables
    const res = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    const tables = res.rows.map(r => r.tablename);
    console.log(`Found ${tables.length} tables:`, tables);

    if (tables.length === 0) {
      console.log('Database is already clean.');
      return;
    }

    // Drop all tables (cascade to handle foreign keys)
    for (const table of tables) {
      // Skip internal supabase tables
      if (table.startsWith('_')) continue;
      await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
      console.log(`Dropped: ${table}`);
    }

    // Verify clean
    const verify = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public';
    `);
    const remaining = verify.rows.filter(r => !r.tablename.startsWith('_'));
    console.log(`\nRemaining tables: ${remaining.length}`, remaining.map(r => r.tablename));
    console.log('Database is clean!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanDatabase();
