-- ============================================================
-- Superboard — Enable Row-Level Security on ALL Public Tables
-- Run this in the Supabase Dashboard SQL Editor
-- ============================================================

-- 1. Enable RLS on every table that has it disabled
DO $$
DECLARE
  tbl TEXT;
  rls BOOLEAN;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    SELECT relrowsecurity INTO rls FROM pg_class WHERE relname = tbl AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    IF NOT rls THEN
      EXECUTE format('ALTER TABLE public."%I" ENABLE ROW LEVEL SECURITY', tbl);
      RAISE NOTICE 'Enabled RLS on %', tbl;
    END IF;
  END LOOP;
END $$;

-- 2. Create a service_role policy on every table (backend bypasses RLS anyway,
--    but Postgres requires at least one policy per table when RLS is on)
DO $$
DECLARE
  tbl TEXT;
  pol_exists BOOLEAN;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    SELECT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = tbl AND schemaname = 'public' AND policyname = 'service_role_all') INTO pol_exists;
    IF NOT pol_exists THEN
      EXECUTE format('CREATE POLICY service_role_all ON public."%I" FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl);
      RAISE NOTICE 'Created service_role_all policy on %', tbl;
    END IF;
  END LOOP;
END $$;

-- 3. Create restrictive anon policies — block all direct PostgREST access by default
--    The application uses server-side Supabase client (service_role) for data access,
--    NOT the anon PostgREST client. So blocking anon is safe.
DO $$
DECLARE
  tbl TEXT;
  pol_exists BOOLEAN;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    SELECT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = tbl AND schemaname = 'public' AND policyname = 'anon_block_all') INTO pol_exists;
    IF NOT pol_exists THEN
      EXECUTE format('CREATE POLICY anon_block_all ON public."%I" FOR ALL TO anon USING (false) WITH CHECK (false)', tbl);
      RAISE NOTICE 'Created anon_block_all policy on %', tbl;
    END IF;
  END LOOP;
END $$;

-- 4. Allow anon/authenticated to read from specific safe tables only
--    (needed for some real-time presence features)
CREATE POLICY IF NOT EXISTS anon_read_room_participants ON public."RoomParticipant"
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY IF NOT EXISTS anon_read_templates_public ON public."Template"
  FOR SELECT TO anon, authenticated USING ("isPublic" = true);

-- 5. Verify
SELECT tablename,
       relrowsecurity AS rls_enabled,
       (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename AND schemaname = 'public') AS policy_count
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND nspname = 'public'
WHERE t.schemaname = 'public'
ORDER BY t.tablename;
