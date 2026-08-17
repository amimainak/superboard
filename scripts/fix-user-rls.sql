-- Prevent users from escalating tier, isAdmin, stripeCustomerId via RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = '"User"' AND policyname = 'users_update_own') THEN
    DROP POLICY "users_update_own" ON "User";
  END IF;
END $$;

CREATE POLICY "users_update_own" ON "User" FOR UPDATE
  USING ("id" = auth.uid()::text)
  WITH CHECK (
    "id" = auth.uid()::text
    AND "tier" IS DISTINCT FROM NEW."tier"
    AND "isAdmin" IS DISTINCT FROM NEW."isAdmin"
    AND "stripeCustomerId" IS DISTINCT FROM NEW."stripeCustomerId"
    AND "parentAgencyId" IS DISTINCT FROM NEW."parentAgencyId"
  );
