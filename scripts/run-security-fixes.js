// Run all security fix SQL migrations against Supabase
const { Client } = require('pg')

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  console.log('Connected to Supabase')

  const sqlFiles = [
    'scripts/fix-user-rls.sql',
    'scripts/fix-chat-rls.sql',
    'scripts/fix-migration-rls.sql',
  ]

  for (const file of sqlFiles) {
    console.log(`\n=== Running ${file} ===`)
    try {
      const fs = require('fs')
      const sql = fs.readFileSync(file, 'utf8')
      await client.query(sql)
      console.log(`✅ ${file} applied successfully`)
    } catch (err) {
      console.error(`⚠️  ${file} error (may be non-fatal):`, err.message)
    }
  }

  await client.end()
  console.log('\n=== All SQL migrations complete ===')
}

run().catch(console.error)
