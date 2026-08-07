// ============================================================
// Script: Set a user as admin in the database
// ============================================================

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env'), override: true });

async function main() {
  const db = new PrismaClient();
  try {
    // Find the agency@superboard.app user (likely the owner) and make them admin
    const email = process.argv[2] || 'agency@superboard.app';
    
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`User "${email}" not found. Listing all users:`);
      const allUsers = await db.user.findMany({ select: { id: true, email: true, tier: true } });
      allUsers.forEach(u => console.log(`  ${u.email} (${u.tier})`));
      process.exit(1);
    }
    
    const updated = await db.user.update({
      where: { email },
      data: { isAdmin: true },
    });
    
    console.log(`✓ User "${email}" is now admin!`);
    console.log(`  ID: ${updated.id}`);
    console.log(`  Tier: ${updated.tier}`);
    console.log(`  IsAdmin: ${updated.isAdmin}`);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
