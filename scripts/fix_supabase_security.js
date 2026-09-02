const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.sjbxyxallfeyfuplacnn:Thephisics1@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  await client.query('BEGIN');

  try {
    // ==========================================================
    // PART 1: ENABLE RLS ON ALL DISABLED TABLES
    // ==========================================================
    const disabledTables = [
      'AuditLog',
      'CreditPack',
      'Homework',
      'Invoice',
      'PlatformConfig',
      'QuestionItem',
      'Recording',
      'ScheduledLesson',
      'Student',
      'Subscription',
      'WebhookConfig',
    ];

    console.log('=== PART 1: Enabling RLS on disabled tables ===');
    for (const table of disabledTables) {
      await client.query(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`  ENABLED RLS on ${table}`);
    }

    // ==========================================================
    // PART 2: ADD SERVICE_ROLE POLICIES (bypasses RLS for backend)
    // ==========================================================
    console.log('\n=== PART 2: Adding service_role policies ===');
    for (const table of disabledTables) {
      const policyName = `${table.toLowerCase()}_service_role`;
      // Drop if exists, then create
      await client.query(`DROP POLICY IF EXISTS "${policyName}" ON public."${table}"`);
      await client.query(`
        CREATE POLICY "${policyName}" ON public."${table}"
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
      `);
      console.log(`  Created policy: ${policyName} on ${table}`);
    }

    // ==========================================================
    // PART 3: TABLE-SPECIFIC POLICIES
    // ==========================================================
    console.log('\n=== PART 3: Table-specific policies ===');

    // --- AuditLog: Only admins/service_role should read ---
    await client.query(`
      CREATE POLICY auditlog_admin_read ON public."AuditLog"
      FOR SELECT TO authenticated
      USING (
        "userId" = (auth.uid())::text
        OR EXISTS (SELECT 1 FROM public."User" WHERE id = (auth.uid())::text AND "isAdmin" = true)
      );
    `);
    console.log('  Created policy: auditlog_admin_read on AuditLog');

    // --- Student: Only agency owner can read their own students ---
    await client.query(`
      CREATE POLICY student_agency_read ON public."Student"
      FOR SELECT TO authenticated
      USING ("agencyId" = (auth.uid())::text);
    `);
    await client.query(`
      CREATE POLICY student_agency_insert ON public."Student"
      FOR INSERT TO authenticated
      WITH CHECK ("agencyId" = (auth.uid())::text);
    `);
    await client.query(`
      CREATE POLICY student_agency_update ON public."Student"
      FOR UPDATE TO authenticated
      USING ("agencyId" = (auth.uid())::text)
      WITH CHECK ("agencyId" = (auth.uid())::text);
    `);
    await client.query(`
      CREATE POLICY student_agency_delete ON public."Student"
      FOR DELETE TO authenticated
      USING ("agencyId" = (auth.uid())::text);
    `);
    console.log('  Created policies: student_agency_* on Student');

    // --- Homework: Only tutor who assigned can read/manage ---
    await client.query(`
      CREATE POLICY homework_tutor_read ON public."Homework"
      FOR SELECT TO authenticated
      USING ("tutorId" = (auth.uid())::text);
    `);
    await client.query(`
      CREATE POLICY homework_tutor_insert ON public."Homework"
      FOR INSERT TO authenticated
      WITH CHECK ("tutorId" = (auth.uid())::text);
    `);
    await client.query(`
      CREATE POLICY homework_tutor_update ON public."Homework"
      FOR UPDATE TO authenticated
      USING ("tutorId" = (auth.uid())::text);
    `);
    console.log('  Created policies: homework_tutor_* on Homework');

    // --- Invoice: Only creator can read/manage ---
    await client.query(`
      CREATE POLICY invoice_creator_read ON public."Invoice"
      FOR SELECT TO authenticated
      USING ("creatorId" = (auth.uid())::text);
    `);
    await client.query(`
      CREATE POLICY invoice_creator_insert ON public."Invoice"
      FOR INSERT TO authenticated
      WITH CHECK ("creatorId" = (auth.uid())::text);
    `);
    await client.query(`
      CREATE POLICY invoice_creator_update ON public."Invoice"
      FOR UPDATE TO authenticated
      USING ("creatorId" = (auth.uid())::text);
    `);
    console.log('  Created policies: invoice_creator_* on Invoice');

    // --- Recording: Only tutor can read their recordings ---
    await client.query(`
      CREATE POLICY recording_tutor_read ON public."Recording"
      FOR SELECT TO authenticated
      USING ("tutorId" = (auth.uid())::text);
    `);
    console.log('  Created policy: recording_tutor_read on Recording');

    // --- CreditPack: Only agency owner can read ---
    await client.query(`
      CREATE POLICY creditpack_agency_read ON public."CreditPack"
      FOR SELECT TO authenticated
      USING ("agencyId" = (auth.uid())::text);
    `);
    console.log('  Created policy: creditpack_agency_read on CreditPack');

    // --- QuestionItem: Only tutor who created can read/manage ---
    await client.query(`
      CREATE POLICY questionitem_tutor_read ON public."QuestionItem"
      FOR SELECT TO authenticated
      USING ("tutorId" IS NULL OR "tutorId" = (auth.uid())::text);
    `);
    await client.query(`
      CREATE POLICY questionitem_tutor_insert ON public."QuestionItem"
      FOR INSERT TO authenticated
      WITH CHECK ("tutorId" = (auth.uid())::text);
    `);
    await client.query(`
      CREATE POLICY questionitem_tutor_update ON public."QuestionItem"
      FOR UPDATE TO authenticated
      USING ("tutorId" IS NULL OR "tutorId" = (auth.uid())::text);
    `);
    await client.query(`
      CREATE POLICY questionitem_tutor_delete ON public."QuestionItem"
      FOR DELETE TO authenticated
      USING ("tutorId" = (auth.uid())::text);
    `);
    console.log('  Created policies: questionitem_tutor_* on QuestionItem');

    // --- ScheduledLesson: Only tutor can read/manage ---
    await client.query(`
      CREATE POLICY scheduledlesson_tutor_read ON public."ScheduledLesson"
      FOR SELECT TO authenticated
      USING ("tutorId" = (auth.uid())::text);
    `);
    await client.query(`
      CREATE POLICY scheduledlesson_tutor_insert ON public."ScheduledLesson"
      FOR INSERT TO authenticated
      WITH CHECK ("tutorId" = (auth.uid())::text);
    `);
    await client.query(`
      CREATE POLICY scheduledlesson_tutor_update ON public."ScheduledLesson"
      FOR UPDATE TO authenticated
      USING ("tutorId" = (auth.uid())::text);
    `);
    await client.query(`
      CREATE POLICY scheduledlesson_tutor_delete ON public."ScheduledLesson"
      FOR DELETE TO authenticated
      USING ("tutorId" = (auth.uid())::text);
    `);
    console.log('  Created policies: scheduledlesson_tutor_* on ScheduledLesson');

    // --- Subscription: Only own subscription visible ---
    await client.query(`
      CREATE POLICY subscription_user_read ON public."Subscription"
      FOR SELECT TO authenticated
      USING ("userId" = (auth.uid())::text);
    `);
    console.log('  Created policy: subscription_user_read on Subscription');

    // --- WebhookConfig: Only owner can read/manage (secret protected) ---
    await client.query(`
      CREATE POLICY webhookconfig_user_read ON public."WebhookConfig"
      FOR SELECT TO authenticated
      USING ("userId" = (auth.uid())::text);
    `);
    await client.query(`
      CREATE POLICY webhookconfig_user_insert ON public."WebhookConfig"
      FOR INSERT TO authenticated
      WITH CHECK ("userId" = (auth.uid())::text);
    `);
    await client.query(`
      CREATE POLICY webhookconfig_user_update ON public."WebhookConfig"
      FOR UPDATE TO authenticated
      USING ("userId" = (auth.uid())::text);
    `);
    await client.query(`
      CREATE POLICY webhookconfig_user_delete ON public."WebhookConfig"
      FOR DELETE TO authenticated
      USING ("userId" = (auth.uid())::text);
    `);
    console.log('  Created policies: webhookconfig_user_* on WebhookConfig');

    // --- PlatformConfig: Only readable, not writable by non-service_role ---
    await client.query(`
      CREATE POLICY platformconfig_authenticated_read ON public."PlatformConfig"
      FOR SELECT TO authenticated
      USING (true);
    `);
    console.log('  Created policy: platformconfig_authenticated_read on PlatformConfig');

    // ==========================================================
    // PART 4: COLUMN-LEVEL SECURITY FOR SENSITIVE COLUMNS
    // ==========================================================
    console.log('\n=== PART 4: Column-level security for sensitive columns ===');

    // Prevent anon and authenticated from reading User.fingerprintHash
    await client.query(`REVOKE SELECT ("fingerprintHash") ON public."User" FROM anon, authenticated;`);
    console.log('  REVOKED SELECT on User.fingerprintHash from anon & authenticated');

    // Prevent anon and authenticated from reading Student.parentAccessToken
    await client.query(`REVOKE SELECT ("parentAccessToken") ON public."Student" FROM anon, authenticated;`);
    console.log('  REVOKED SELECT on Student.parentAccessToken from anon & authenticated');

    // Prevent anon and authenticated from reading WebhookConfig.secret
    await client.query(`REVOKE SELECT ("secret") ON public."WebhookConfig" FROM anon, authenticated;`);
    console.log('  REVOKED SELECT on WebhookConfig.secret from anon & authenticated');

    // parentEmail column doesn't exist in the live DB yet (only in Prisma schema)

    await client.query('COMMIT');
    console.log('\n=== ALL CHANGES COMMITTED SUCCESSFULLY ===');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n!!! ERROR — ROLLED BACK !!!');
    console.error(err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
