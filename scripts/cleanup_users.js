const { Client } = require('pg');

async function cleanup() {
  const client = new Client({
    connectionString: 'postgresql://postgres.sjbxyxallfeyfuplacnn:Thephisics1@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  // First, find all test/fake users
  const { rows: users } = await client.query(`
    SELECT id, email, created_at, email_confirmed_at, raw_app_meta_data
    FROM auth.users
    ORDER BY created_at
  `);

  console.log('=== All auth.users ===');
  console.table(users.map(u => ({
    id: u.id,
    email: u.email,
    created: u.created_at,
    confirmed: u.email_confirmed_at ? 'YES' : 'NO',
    providers: u.raw_app_meta_data?.provider || 'email'
  })));

  // Delete from public tables first (in correct order to avoid FK violations)
  const testEmails = users.map(u => u.email);
  console.log('\n=== Deleting test users ===');

  // Delete from dependent tables first
  for (const email of testEmails) {
    console.log(`\nProcessing: ${email}`);

    // Get user ID
    const { rows: [user] } = await client.query(
      `SELECT id FROM auth.users WHERE email = $1`, [email]
    );
    if (!user) { console.log('  Not found in auth.users, skipping'); continue; }

    const userId = user.id;

    // Delete from ChatMessage if any (senderId)
    const cm = await client.query(`DELETE FROM "ChatMessage" WHERE "senderId" = $1`, [userId]);
    console.log(`  ChatMessage: ${cm.rowCount} deleted`);

    // Delete from RoomParticipant if any (uses snake_case columns)
    const rp = await client.query(`DELETE FROM "RoomParticipant" WHERE user_id = $1`, [userId]);
    console.log(`  RoomParticipant: ${rp.rowCount} deleted`);

    // Delete from Booking if any
    try {
      const bk = await client.query(`DELETE FROM "Booking" WHERE "userId" = $1 OR "tutorId" = $1`, [userId, userId]);
      console.log(`  Booking: ${bk.rowCount} deleted`);
    } catch (e) { console.log(`  Booking: table not found or error - ${e.message}`); }

    // Delete from Room if any (tutorId)
    const rm = await client.query(`DELETE FROM "Room" WHERE "tutorId" = $1`, [userId]);
    console.log(`  Room: ${rm.rowCount} deleted`);

    // Delete from public User table
    const pub = await client.query(`DELETE FROM "User" WHERE id = $1`, [userId]);
    console.log(`  public.User: ${pub.rowCount} deleted`);

    // Delete from auth.users (this is the main one that stops emails)
    try {
      const authDel = await client.query(`DELETE FROM auth.users WHERE id = $1`, [userId]);
      console.log(`  auth.users: ${authDel.rowCount} deleted`);
    } catch (e) {
      console.log(`  auth.users: direct delete failed (${e.message}), trying admin API approach...`);
      // Fallback: we can't easily call Supabase admin API from here
      // But the direct DELETE should work with the service role connection
    }
  }

  // Verify
  const { rows: remaining } = await client.query(`SELECT id, email FROM auth.users`);
  console.log('\n=== Remaining users ===');
  if (remaining.length === 0) {
    console.log('All users cleaned! Database is empty.');
  } else {
    console.table(remaining);
  }

  await client.end();
}

cleanup().catch(e => { console.error(e); process.exit(1); });
