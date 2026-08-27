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

print("=== FIXING RLS VULNERABILITIES ===\n")

# ============================================================
# 1. language_exercises
# ============================================================
print("--- language_exercises ---")
cur.execute('ALTER TABLE public.language_exercises ENABLE ROW LEVEL SECURITY;')
print("  RLS enabled")

cur.execute('DROP POLICY IF EXISTS lang_ex_public_read ON public.language_exercises;')
cur.execute('DROP POLICY IF EXISTS lang_ex_service_role ON public.language_exercises;')
cur.execute('DROP POLICY IF EXISTS lang_ex_authenticated_read ON public.language_exercises;')
cur.execute('DROP POLICY IF EXISTS lang_ex_service_role_all ON public.language_exercises;')
print("  Old policies cleared")

cur.execute('''
    CREATE POLICY lang_ex_authenticated_read ON public.language_exercises
    FOR SELECT TO authenticated
    USING (true);
''')
print("  Policy: authenticated users can READ")

cur.execute('''
    CREATE POLICY lang_ex_service_role_all ON public.language_exercises
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);
''')
print("  Policy: service_role has FULL ACCESS")

# ============================================================
# 2. vocab_cards
# ============================================================
print("\n--- vocab_cards ---")
cur.execute('ALTER TABLE public.vocab_cards ENABLE ROW LEVEL SECURITY;')
print("  RLS enabled")

cur.execute('DROP POLICY IF EXISTS vocab_public_read ON public.vocab_cards;')
cur.execute('DROP POLICY IF EXISTS vocab_service_role ON public.vocab_cards;')
cur.execute('DROP POLICY IF EXISTS vocab_authenticated_read ON public.vocab_cards;')
cur.execute('DROP POLICY IF EXISTS vocab_service_role_all ON public.vocab_cards;')
print("  Old policies cleared")

cur.execute('''
    CREATE POLICY vocab_authenticated_read ON public.vocab_cards
    FOR SELECT TO authenticated
    USING (true);
''')
print("  Policy: authenticated users can READ")

cur.execute('''
    CREATE POLICY vocab_service_role_all ON public.vocab_cards
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);
''')
print("  Policy: service_role has FULL ACCESS")

# ============================================================
# 3. session_notes — scoped to room participants only
# ============================================================
print("\n--- session_notes ---")

cur.execute('DROP POLICY IF EXISTS notes_public_delete ON public.session_notes;')
cur.execute('DROP POLICY IF EXISTS notes_public_insert ON public.session_notes;')
cur.execute('DROP POLICY IF EXISTS notes_public_read ON public.session_notes;')
cur.execute('DROP POLICY IF EXISTS notes_public_update ON public.session_notes;')
cur.execute('DROP POLICY IF EXISTS notes_service_role ON public.session_notes;')
cur.execute('DROP POLICY IF EXISTS notes_participant_read ON public.session_notes;')
cur.execute('DROP POLICY IF EXISTS notes_participant_insert ON public.session_notes;')
cur.execute('DROP POLICY IF EXISTS notes_participant_update ON public.session_notes;')
cur.execute('DROP POLICY IF EXISTS notes_participant_delete ON public.session_notes;')
cur.execute('DROP POLICY IF EXISTS notes_service_role_all ON public.session_notes;')
print("  Old policies cleared")

# Room participant subquery (reused)
room_check = '''
    "room_id" IN (
        SELECT rp.room_id FROM public."RoomParticipant" rp
        WHERE rp.user_id = auth.uid()::text
        UNION
        SELECT r.id FROM public."Room" r
        WHERE r."tutorId" = auth.uid()::text
    )
'''

cur.execute(f'''
    CREATE POLICY notes_participant_read ON public.session_notes
    FOR SELECT TO authenticated
    USING ({room_check});
''')
print("  Policy: room participants + tutor can READ")

cur.execute(f'''
    CREATE POLICY notes_participant_insert ON public.session_notes
    FOR INSERT TO authenticated
    WITH CHECK ({room_check});
''')
print("  Policy: room participants + tutor can INSERT")

cur.execute(f'''
    CREATE POLICY notes_participant_update ON public.session_notes
    FOR UPDATE TO authenticated
    USING ({room_check})
    WITH CHECK ({room_check});
''')
print("  Policy: room participants + tutor can UPDATE")

cur.execute(f'''
    CREATE POLICY notes_participant_delete ON public.session_notes
    FOR DELETE TO authenticated
    USING ({room_check});
''')
print("  Policy: room participants + tutor can DELETE")

cur.execute('''
    CREATE POLICY notes_service_role_all ON public.session_notes
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);
''')
print("  Policy: service_role has FULL ACCESS")

# ============================================================
# 4. Force RLS on all three tables
# ============================================================
print("\n--- Forcing RLS ---")
cur.execute('ALTER TABLE public.language_exercises FORCE ROW LEVEL SECURITY;')
cur.execute('ALTER TABLE public.vocab_cards FORCE ROW LEVEL SECURITY;')
cur.execute('ALTER TABLE public.session_notes FORCE ROW LEVEL SECURITY;')
print("  RLS FORCED on language_exercises, vocab_cards, session_notes")

print("\n=== ALL FIXES APPLIED SUCCESSFULLY ===")
cur.close()
conn.close()