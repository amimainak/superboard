// Uses DATABASE_URL env var. Set it in .env.local or your environment.
// Script: Push Prisma schema to Supabase PostgreSQL
// Uses the Supabase Session Pooler (port 6543) for DDL operations

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL (Singapore pooler)');

    // Check existing tables
    const { rows: existingTables } = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    console.log(`\nExisting tables (${existingTables.length}):`);
    existingTables.forEach((t: any) => console.log(`  - ${t.tablename}`));

    // Check existing enums
    const { rows: existingEnums } = await client.query(`
      SELECT t.typname, e.enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      ORDER BY t.typname, e.enumsortorder
    `);
    const enumTypes = new Map<string, string[]>();
    existingEnums.forEach((e: any) => {
      if (!enumTypes.has(e.typname)) enumTypes.set(e.typname, []);
      enumTypes.get(e.typname)!.push(e.enumlabel);
    });
    console.log(`\nExisting enum types (${enumTypes.size}):`);
    enumTypes.forEach((labels, name) => console.log(`  - ${name}: [${labels.join(', ')}]`));

    console.log('\n--- Schema check complete ---');
  } catch (err) {
    console.error('❌ Connection error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
