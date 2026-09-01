"""Run Phase 2 Template migration against Supabase."""

import psycopg2
import urllib.parse
import sys

# Connection details from user
DB_HOST = "aws-0-ap-northeast-1.pooler.supabase.com"
DB_NAME = "postgres"
DB_USER = "postgres.sjbxyxallfeyfuplacnn"
DB_PASS = "thephisics1"

MIGRATION_SQL = """
-- Phase 2: Template Engine - Upgrade Template table
-- Adds: description, grade_band, tags, is_public, updated_at + indexes

-- First, check if the Template table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Template') THEN
    RAISE NOTICE 'Template table does not exist. It may be named differently or not yet created.';
  END IF;
END $$;

-- List all columns in Template table (for debugging)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Template'
ORDER BY ordinal_position;
"""

ALTER_SQL = """
-- Add new columns (IF NOT EXISTS guards for safety)
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "description" VARCHAR(500);
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "grade_band" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "is_public" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Widen name column from 50 to 100
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Template' AND column_name = 'name' AND character_maximum_length < 100) THEN
    ALTER TABLE "Template" ALTER COLUMN "name" TYPE VARCHAR(100);
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS "Template_is_public_idx" ON "Template" ("is_public");
CREATE INDEX IF NOT EXISTS "Template_subject_idx" ON "Template" ("subject");
CREATE INDEX IF NOT EXISTS "Template_grade_band_idx" ON "Template" ("grade_band");

-- Add updatedAt trigger (auto-update on row change)
CREATE OR REPLACE FUNCTION update_template_updatedat()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS template_updatedat ON "Template";
CREATE TRIGGER template_updatedat
  BEFORE UPDATE ON "Template"
  FOR EACH ROW
  EXECUTE FUNCTION update_template_updatedat();
"""


def try_connect(host, port, label):
    """Try connecting with the given host/port, return conn or None."""
    conn_str = f"postgresql://{DB_USER}:{DB_PASS}@{host}:{port}/{DB_NAME}"
    print(f"  Trying {label} ({host}:{port})...")
    try:
        conn = psycopg2.connect(conn_str, connect_timeout=10)
        conn.autocommit = True
        print(f"  Connected via {label}!")
        return conn
    except Exception as e:
        print(f"  Failed: {e}")
        return None


def main():
    # Try multiple connection approaches
    ports_to_try = [
        (DB_HOST, 6543, "Transaction Pooler"),
        (DB_HOST, 5432, "Session Pooler (5432)"),
        ("aws-0-ap-northeast-1.supabase.co", 5432, "Direct Connection"),
    ]

    conn = None
    for host, port, label in ports_to_try:
        conn = try_connect(host, port, label)
        if conn:
            break

    if not conn:
        print("\nAll connection attempts failed!")
        print("The password 'thephisics1' appears to be your Supabase ACCOUNT password.")
        print("The DATABASE password is different. You can find it in:")
        print("  Supabase Dashboard → Settings → Database → Database password")
        print("  OR: Project Settings → Database → Connection string → URI")
        sys.exit(1)

    cur = conn.cursor()

    # Step 1: Check current state of Template table
    print("\n=== Checking current Template table schema ===")
    try:
        cur.execute(MIGRATION_SQL)
        rows = cur.fetchall()
        if rows:
            print(f"{'Column':<15} {'Type':<20} {'Nullable':<10} {'Default'}")
            print("-" * 70)
            for row in rows:
                col_name, data_type, is_nullable, col_default = row
                print(f"{col_name:<15} {data_type:<20} {is_nullable:<10} {col_default}")
        else:
            print("Template table not found! Will need to create it.")
    except Exception as e:
        print(f"Error checking table: {e}")

    # Step 2: Run ALTER statements
    print("\n=== Running migration ALTER statements ===")
    try:
        cur.execute(ALTER_SQL)
        print("Migration SQL executed successfully!")
    except Exception as e:
        print(f"Migration error: {e}")

    # Step 3: Verify final state
    print("\n=== Verifying final Template table schema ===")
    cur.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'Template'
        ORDER BY ordinal_position;
    """)
    rows = cur.fetchall()
    if rows:
        print(f"{'Column':<15} {'Type':<20} {'Nullable':<10} {'Default'}")
        print("-" * 70)
        for row in rows:
            col_name, data_type, is_nullable, col_default = row
            print(f"{col_name:<15} {data_type:<20} {is_nullable:<10} {col_default}")

    # Step 4: Check indexes
    print("\n=== Checking indexes ===")
    cur.execute("""
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'Template'
        ORDER BY indexname;
    """)
    indexes = cur.fetchall()
    for idx in indexes:
        print(f"  {idx[0]}: {idx[1]}")

    # Step 5: Check trigger
    print("\n=== Checking triggers ===")
    cur.execute("""
        SELECT trigger_name, event_manipulation, action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'Template';
    """)
    triggers = cur.fetchall()
    for t in triggers:
        print(f"  {t[0]}: {t[1]} → {t[2]}")

    cur.close()
    conn.close()
    print("\nDone! Connection closed.")


if __name__ == "__main__":
    main()
