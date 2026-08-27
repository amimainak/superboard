const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.sjbxyxallfeyfuplacnn:Thephisics1@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});
async function main() {
  try {
    const tables = ['Booking', 'RoomParticipant', 'ScheduleSlot', 'language_exercises', 'session_notes', 'student_mastery', 'vocab_cards', 'User'];
    for (const table of tables) {
      const { rows } = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${table}'
        ORDER BY ordinal_position
      `);
      console.log(`\n=== ${table} ===`);
      for (const c of rows) {
        console.log(`  ${c.column_name} | ${c.data_type} | nullable:${c.is_nullable} | default:${c.column_default}`);
      }
    }
  } catch(e) { console.error(e.message); }
  finally { await pool.end(); }
}
main();
