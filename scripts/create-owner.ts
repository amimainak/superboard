// ============================================================
// One-time script: Create the platform owner account
// Run: npx tsx scripts/create-owner.ts
// Requires SUPABASE_SERVICE_ROLE_KEY in .env
// ============================================================

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), override: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OWNER_EMAIL = 'thephysicsmathtutor@gmail.com';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('=== Superboard Owner Account Setup ===\n');

  // 1. Check if user exists in Supabase Auth
  console.log('1. Checking Supabase Auth for ' + OWNER_EMAIL + '...');
  const { data: listData } = await supabase.auth.admin.listUsers({
    filters: 'email eq "' + OWNER_EMAIL + '"',
  });

  let userId: string;
  let isNewUser = false;

  if (listData?.users?.length > 0) {
    userId = listData.users[0].id;
    console.log('   Found existing auth user: ' + userId);
  } else {
    // 2. Create the auth user
    console.log('2. Creating new Supabase Auth user...');
    const crypto = require('crypto');
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    const password = Array.from(crypto.randomBytes(20)).map((b: number) => chars[b % chars.length]).join('');

    const { data, error } = await supabase.auth.admin.createUser({
      email: OWNER_EMAIL,
      password,
      email_confirm: true,
      user_metadata: { name: 'Superboard Owner' },
    });

    if (error) {
      console.error('   Failed to create auth user:', error.message);
      process.exit(1);
    }

    userId = data.user.id;
    isNewUser = true;
    console.log('   Created auth user: ' + userId);
    console.log('   TEMPORARY PASSWORD: ' + password);
    console.log('   (Change this after first login!)\n');
  }

  // 3. Update the User record with owner role
  console.log('3. Setting owner role in User table...');
  const { data: existingUser } = await supabase
    .from('User')
    .select('id, email, tier, role, isAdmin')
    .eq('id', userId)
    .single();

  if (existingUser) {
    const { error: updateError } = await supabase
      .from('User')
      .update({
        role: 'owner',
        isAdmin: true,
        tier: 'AGENCY',
        name: existingUser.name || 'Superboard Owner',
      })
      .eq('id', userId);

    if (updateError) {
      console.error('   Failed to update User:', updateError.message);
      process.exit(1);
    }
    console.log('   Updated existing User record to owner role');
  } else {
    const { error: insertError } = await supabase
      .from('User')
      .insert({
        id: userId,
        email: OWNER_EMAIL,
        name: 'Superboard Owner',
        tier: 'AGENCY',
        role: 'owner',
        isAdmin: true,
      });

    if (insertError) {
      console.error('   Failed to insert User:', insertError.message);
      process.exit(1);
    }
    console.log('   Created new User record with owner role');
  }

  // 4. Verify
  const { data: verify } = await supabase
    .from('User')
    .select('id, email, name, tier, role, isAdmin')
    .eq('id', userId)
    .single();

  console.log('\n=== Owner Account Ready ===');
  console.log('  ID:     ' + verify.id);
  console.log('  Email:  ' + verify.email);
  console.log('  Name:   ' + verify.name);
  console.log('  Tier:   ' + verify.tier);
  console.log('  Role:   ' + verify.role);
  console.log('  IsAdmin: ' + verify.isAdmin);
  if (isNewUser) {
    console.log('\n  IMPORTANT: Check your email for login instructions, or use the temporary password shown above.');
  }
  console.log('\n  Admin panel: /admin');
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
