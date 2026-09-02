import psycopg2
import sys

conn = psycopg2.connect(
    host='aws-0-ap-northeast-1.pooler.supabase.com',
    port=6543,
    dbname='postgres',
    user='postgres.sjbxyxallfeyfuplacnn',
    password='Thephisics1',
    sslmode='require'
)
conn.set_session(autocommit=True)
cur = conn.cursor()

print('=== RLS STATUS ON ALL PUBLIC TABLES ===')
cur.execute("""
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
""")
for row in cur.fetchall():
    status = 'ENABLED' if row[1] else 'DISABLED'
    print(f'  {row[0]:30s} RLS: {status}')

print()
print('=== EXISTING RLS POLICIES ===')
cur.execute("""
    SELECT schemaname, tablename, policyname, cmd, qual, with_check
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
""")
policies = cur.fetchall()
if not policies:
    print('  (no policies found)')
else:
    for row in policies:
        print(f'  {row[1]}.{row[2]} | cmd={row[3]} | qual={row[4]} | with_check={row[5]}')

print()
print('=== CHECK FOR SENSITIVE COLUMNS ===')
# Check tables that might have sensitive data
cur.execute("""
    SELECT column_name, table_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name ILIKE ANY(ARRAY['%password%', '%secret%', '%token%', '%hash%', '%key%'])
    ORDER BY table_name, column_name;
""")
sensitive = cur.fetchall()
if not sensitive:
    print('  (no obviously sensitive columns found by name)')
else:
    for row in sensitive:
        print(f'  {row[1]}.{row[0]} ({row[2]})')

cur.close()
conn.close()
