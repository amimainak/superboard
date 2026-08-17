-- ============================================================
-- SECURITY FIX: Prevent users from escalating tier/isAdmin/stripeCustomerId
-- Uses a BEFORE UPDATE trigger since RLS WITH CHECK has limited
-- support for column-level restrictions in Supabase.
-- ============================================================

-- Step 1: Create trigger function that blocks protected column changes
CREATE OR REPLACE FUNCTION "block_protected_user_columns"()
RETURNS trigger AS $$
BEGIN
  -- If any protected column is being changed to a different value, block it
  IF (
    NEW."tier" IS DISTINCT FROM OLD."tier" OR
    NEW."isAdmin" IS DISTINCT FROM OLD."isAdmin" OR
    NEW."stripeCustomerId" IS DISTINCT FROM OLD."stripeCustomerId" OR
    NEW."parentAgencyId" IS DISTINCT FROM OLD."parentAgencyId"
  ) THEN
    -- Only allow if the current user is a service_role
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
      RAISE EXCEPTION 'Cannot modify protected columns: tier, isAdmin, stripeCustomerId, parentAgencyId';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop existing trigger if it exists, then create
DROP TRIGGER IF EXISTS "user_protected_columns_trigger" ON "User";
CREATE TRIGGER "user_protected_columns_trigger"
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION "block_protected_user_columns"();
