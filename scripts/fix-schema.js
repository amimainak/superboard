const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function fix() {
  try {
    await p.$executeRawUnsafe(`DROP INDEX IF EXISTS "User_referralCode_key"`);
    console.log("Dropped User_referralCode_key");
  } catch (e) {
    console.error("Drop index error:", e.message);
  }
  await p.$disconnect();
}

fix();
