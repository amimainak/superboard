const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.sjbxyxallfeyfuplacnn:Thephisics1@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function fix() {
  try {
    // Check current id type
    const { rows } = await pool.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'session_notes' AND column_name = 'id'
    `);
    console.log('Current session_notes.id type:', rows[0]?.data_type);
    
    if (rows[0]?.data_type === 'bigint') {
      console.log('Migrating session_notes.id from bigint to UUID...');
      // Drop constraints that reference the id column
      await pool.query(`ALTER TABLE session_notes DROP CONSTRAINT IF EXISTS session_notes_pkey`);
      console.log('  Dropped PK');
      
      // Add new UUID column
      await pool.query(`ALTER TABLE session_notes ADD COLUMN new_id UUID DEFAULT gen_random_uuid()`);
      console.log('  Added new_id column');
      
      // Set PK on new column
      await pool.query(`ALTER TABLE session_notes ADD PRIMARY KEY (new_id)`);
      console.log('  Set new PK');
      
      // Drop old id column
      await pool.query(`ALTER TABLE session_notes DROP COLUMN IF EXISTS id`);
      console.log('  Dropped old id');
      
      // Rename new_id to id
      await pool.query(`ALTER TABLE session_notes RENAME COLUMN new_id TO id`);
      console.log('  Renamed new_id to id');
      
      // Add room FK constraint
      await pool.query(`
        DO $$ BEGIN
          ALTER TABLE session_notes ADD CONSTRAINT "session_notes_roomId_fkey" 
          FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
      `);
      console.log('  Added FK to Room');
      
      console.log('Migration complete!');
    } else {
      console.log('session_notes.id is already UUID, no migration needed');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

fix();
