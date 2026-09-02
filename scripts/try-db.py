import psycopg2, sys
hosts = [
    'db.sjbxyxallfeyfuplacnn.pooler.supabase.com',
    'aws-0-us-west-1.pooler.supabase.com',
]
for h in hosts:
    try:
        conn = psycopg2.connect(host=h, port=5432, dbname='postgres', user='postgres.sjbxyxallfeyfuplacnn', password='Thephisics1', sslmode='require', connect_timeout=5)
        cur = conn.cursor()
        cur.execute("""SELECT tablename, relrowsecurity FROM pg_tables t JOIN pg_class c ON c.relname = t.tablename JOIN pg_namespace n ON n.oid = c.relnamespace AND nspname = 'public' WHERE t.schemaname = 'public' ORDER BY t.tablename;""")
        print(f'Connected to {h}:')
        for r in cur.fetchall():
            print(f'  {r[0]}: RLS={r[1]}')
        cur.close()
        conn.close()
        sys.exit(0)
    except Exception as e:
        print(f'{h}: {e}')
print('Could not connect to any host')
