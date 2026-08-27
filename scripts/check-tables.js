const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
    console.log(JSON.stringify(result, null, 2));
  } catch(e) { console.error(e.message); }
  finally { await prisma.$disconnect(); }
}
main();
