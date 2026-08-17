// Run all security fix SQL migrations against Supabase
const { Client } = require('pg')
const { readFileSync } = require('fs')
const { resolve } = require('path')

// Load .env.local manually
const envFile = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8')
for (const line of envFile.split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/)
  if (match) process.env[match[1]] = match[2]
}

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
    const fullPath = resolve(__dirname, '..', file)
    console.log(`\n=== Running ${file} ===`)
    try {
      const sql = readFileSync(fullPath, 'utf8')
      await client.query(sql)
      console.log(`✅ ${file} applied successfully`)
    } catch (err) {
      console.error(`⚠️  ${file} error:`, err.message)
    }
  }

  await client.end()
  console.log('\n=== All SQL migrations complete ===')
}

run().catch(console.error)
