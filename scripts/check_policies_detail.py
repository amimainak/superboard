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

# Check detailed policy definitions for concerning tables
concerning_tables = [
    'language_exercises', 'vocab_cards',  # RLS disabled
    'session_notes',  # has "public" policies
    'Room',  # has public_read
    'Template',  # tutor_all
]

for t in concerning_tables:
    print(f"\n=== {t} POLICIES (DETAILED) ===")
    cur.execute("""
        SELECT policyname, cmd, qual, with_check, roles
        FROM pg_policies 
        WHERE tablename = %s;
    """, (t,))
    for p in cur.fetchall():
        print(f"  Policy: {p[0]}")
        print(f"    Command: {p[1]}")
        print(f"    USING (qual): {p[2]}")
        print(f"    WITH CHECK: {p[3]}")
        print(f"    Roles: {p[4]}")
        print()

# Also check if anon or authenticated roles exist
print("\n=== ROLES ===")
cur.execute("""
    SELECT rolname, rolsuper, rolcanlogin 
    FROM pg_roles 
    WHERE rolname IN ('anon', 'authenticated', 'postgres', 'service_role')
    OR rolname LIKE 'postgres.%';
""")
for r in cur.fetchall():
    print(f"  {r[0]}: super={r[1]}, can_login={r[2]}")

cur.close()
conn.close()
