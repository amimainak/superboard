const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres.sjbxyxallfeyfuplacnn:Thephisics1@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to Supabase.\n');

  // ── 1. Count totals ──
  const countRes = await client.query(`
    SELECT
      count(*) AS total_users,
      count(*) FILTER (WHERE email_confirmed_at IS NULL) AS unconfirmed,
      count(*) FILTER (WHERE email_confirmed_at IS NOT NULL) AS confirmed,
      count(*) FILTER (WHERE banned_until IS NOT NULL AND banned_until > now()) AS currently_banned
    FROM auth.users
  `);
  console.log('=== USER COUNTS ===');
  console.log(countRes.rows[0]);
  console.log('');

  // ── 2. List ALL auth.users ──
  const usersRes = await client.query(`
    SELECT
      id,
      email,
      raw_user_meta_data->>'full_name'  AS full_name,
      created_at,
      email_confirmed_at,
      last_sign_in_at,
      banned_until,
      deleted_at,
      raw_user_meta_data->>'role'       AS role,
      raw_user_meta_data->>'agency_id'  AS agency_id,
      raw_user_meta_data->>'plan'       AS plan,
      raw_user_meta_data->>'stripe_customer_id' AS stripe_customer_id,
      raw_user_meta_data->>'invited_by' AS invited_by
    FROM auth.users
    ORDER BY created_at DESC
  `);

  console.log(`=== ALL auth.users (${usersRes.rows.length} rows) ===`);
  console.log('');
  console.log(
    ['ID (truncated)', 'EMAIL', 'FULL NAME', 'CREATED AT', 'EMAIL CONFIRMED AT', 'LAST SIGN IN', 'BANNED UNTIL', 'DELETED AT', 'ROLE', 'PLAN']
      .map(h => h.padEnd(24))
      .join(' | ')
  );
  console.log('-'.repeat(260));

  for (const u of usersRes.rows) {
    const row = [
      u.id?.substring(0, 8) + '...',
      u.email || '(null)',
      u.full_name || '(none)',
      u.created_at || '(null)',
      u.email_confirmed_at || 'UNCONFIRMED',
      u.last_sign_in_at || 'NEVER',
      u.banned_until || '(none)',
      u.deleted_at || '(none)',
      u.role || '(none)',
      u.plan || '(none)',
    ];
    console.log(
      row.map(v => String(v).padEnd(24)).join(' | ')
    );
  }
  console.log('');

  // ── 3. Check public."User" table ──
  let hasUserTable = true;
  try {
    const userTableCount = await client.query(`SELECT count(*)::int AS cnt FROM public."User"`);
    console.log(`=== public."User" table: ${userTableCount.rows[0].cnt} rows ===`);
    console.log('');

    if (userTableCount.rows[0].cnt > 0) {
      const userTableRes = await client.query(`
        SELECT * FROM public."User" ORDER BY "createdAt" DESC
      `);
      console.log('Columns:', Object.keys(userTableRes.rows[0] || {}));
      console.log('');

      for (const u of userTableRes.rows) {
        console.log(JSON.stringify(u, null, 2));
      }
    }

    // Find orphaned public.User rows (no matching auth.users entry)
    const orphanRes = await client.query(`
      SELECT u.id, u.email, u."createdAt"
      FROM public."User" u
      LEFT JOIN auth.users a ON a.id = u.id
      WHERE a.id IS NULL
    `);
    console.log('\n=== Orphaned public."User" rows (no auth.users match) ===');
    console.log(`Count: ${orphanRes.rows.length}`);
    if (orphanRes.rows.length > 0) {
      for (const o of orphanRes.rows) {
        console.log(`  ID: ${o.id}  Email: ${o.email}  Created: ${o.createdAt}`);
      }
    } else {
      console.log('  (none)');
    }

  } catch (err) {
    if (err.message.includes('does not exist')) {
      console.log('=== public."User" table does NOT exist ===');
      hasUserTable = false;
    } else {
      throw err;
    }
  }

  // ── 4. Check for other public tables that might reference user IDs ──
  if (!hasUserTable) {
    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log('\n=== Public tables (no User table found) ===');
    for (const t of tablesRes.rows) {
      console.log(' ', t.table_name);
    }
  }

  // ── 5. Users with raw_user_meta_data that look like test/fake ──
  const suspectRes = await client.query(`
    SELECT id, email, created_at, raw_user_meta_data
    FROM auth.users
    WHERE email ILIKE '%test%'
       OR email ILIKE '%fake%'
       OR email ILIKE '%example%'
       OR email ILIKE '%admin%'
       OR email ILIKE '%seed%'
       OR email ILIKE '%demo%'
       OR email ILIKE '%junk%'
       OR email ILIKE '%dummy%'
       OR email ILIKE '%temp%'
       OR email ILIKE '%foo%'
       OR email ILIKE '%bar%'
       OR email ILIKE '%asdf%'
       OR email ILIKE '%xyz%'
       OR email ILIKE '%noreply%'
    ORDER BY created_at DESC
  `);
  console.log('\n=== Potentially fake/test users (by email pattern) ===');
  console.log(`Count: ${suspectRes.rows.length}`);
  for (const s of suspectRes.rows) {
    const meta = s.raw_user_meta_data || {};
    console.log(`  ID: ${s.id.substring(0,8)}...  Email: ${s.email}  Created: ${s.created_at}  Name: ${meta.full_name || '(none)'}`);
  }

  await client.end();
}

main().catch(err => {
  console.error('ERROR:', err.message || err);
  process.exit(1);
});
