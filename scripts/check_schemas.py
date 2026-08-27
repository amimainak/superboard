import psycopg2

conn = psycopg2.connect(
    host="aws-0-ap-northeast-1.pooler.supabase.com",
    port=6543,
    dbname="postgres",
    user="postgres.sjbxyxallfeyfuplacnn",
    password="Thephisics1"
)
conn.autocommit = True
cur = conn.cursor()

tables_to_check = ['language_exercises', 'vocab_cards', 'session_notes', 'Room', 'RoomParticipant']

for t in tables_to_check:
    print(f"\n=== {t} COLUMNS ===")
    cur.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = %s AND table_schema = 'public'
        ORDER BY ordinal_position;
    """, (t,))
    for col in cur.fetchall():
        print(f"  {col[0]}: {col[1]} {'nullable' if col[2]=='YES' else 'NOT NULL'} default={col[3]}")

    # Check row count
    cur.execute(f'SELECT count(*) FROM "{t}"')
    count = cur.fetchone()[0]
    print(f"  -> {count} rows")

cur.close()
conn.close()
