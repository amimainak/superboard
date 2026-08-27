import psycopg2
import os

conn = psycopg2.connect(
    host="aws-0-ap-northeast-1.pooler.supabase.com",
    port=6543,
    dbname="postgres",
    user="postgres.sjbxyxallfeyfuplacnn",
    password="Thephisics1"
)
conn.autocommit = True
cur = conn.cursor()

# 1. List all tables in public schema
print("=== ALL PUBLIC TABLES ===")
cur.execute("""
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
""")
tables = [r[0] for r in cur.fetchall()]
print(f"Tables found: {tables}")

# 2. Check RLS status for each table
print("\n=== RLS STATUS ===")
for t in tables:
    cur.execute(f"SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = %s", (t,))
    row = cur.fetchone()
    if row:
        rls_enabled = row[1]
        rls_forced = row[2]
        print(f"  {t}: RLS enabled={rls_enabled}, RLS forced={rls_forced}")

# 3. Check existing policies
print("\n=== EXISTING POLICIES ===")
for t in tables:
    cur.execute("""
        SELECT policyname, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename = %s;
    """, (t,))
    policies = cur.fetchall()
    if policies:
        print(f"  {t}:")
        for p in policies:
            print(f"    - {p[0]}: cmd={p[1]}")
    else:
        print(f"  {t}: NO POLICIES")

cur.close()
conn.close()
