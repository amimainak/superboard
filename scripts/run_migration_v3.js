const fs = require('fs');
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: 'postgresql://postgres.sjbxyxallfeyfuplacnn:Thephisics1@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Supabase database');

  const sql = fs.readFileSync(__dirname + '/migration_v3.sql', 'utf8');

  try {
    await client.query(sql);
    console.log('Migration v3 executed successfully');
  } catch (e) {
    console.error('Migration error:', e.message);
  }

  // Verify
  try {
    const slots = await client.query('SELECT count(*) FROM "ScheduleSlot"');
    console.log('ScheduleSlot rows:', slots.rows[0].count);
    const bookings = await client.query('SELECT count(*) FROM "Booking"');
    console.log('Booking rows:', bookings.rows[0].count);

    const ssPolicies = await client.query(`SELECT policyname FROM pg_policies WHERE tablename = 'ScheduleSlot'`);
    console.log('ScheduleSlot policies:', ssPolicies.rows.map(r => r.policyname).join(', '));

    const bkPolicies = await client.query(`SELECT policyname FROM pg_policies WHERE tablename = 'Booking'`);
    console.log('Booking policies:', bkPolicies.rows.map(r => r.policyname).join(', '));
  } catch (e) {
    console.error('Verify error:', e.message);
  }

  await client.end();
  console.log('\nDone!');
}

runMigration();
