/**
 * Supabase Google OAuth Configuration Checker
 * 
 * Checks if Google OAuth is properly configured for a Supabase project.
 * Tries multiple API approaches since auth config is stored at different levels.
 */

const PROJECT_REF = 'sjbxyxallfeyfuplacnn';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqYnh5eGFsbGZleWZ1cGxhY25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0OTg0MDUsImV4cCI6MjA0NzA3NDQwNX0.KjasiAOX22zTLGYiNi3vMjml0Z0dopU8I4pooPNC7lw';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqYnh5eGFsbGZleWZ1cGxhY25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTQ5ODQwNSwiZXhwIjoyMDQ3MDc0NDA1fQ.FJlVDCic-YTxOdO0W6uFZt52UtjIQ3AzoH7T4XCKn4c';

const HEADERS_ANON = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
};

const HEADERS_SERVICE = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

async function fetchWithDebug(label, url, options = {}) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`PROBE: ${label}`);
  console.log(`   URL: ${url}`);
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) { /* not JSON */ }
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (json) {
      const lines = JSON.stringify(json, null, 2).split('\n');
      console.log(`   Response (JSON):`);
      lines.forEach(l => console.log(`   ${l}`));
    } else {
      console.log(`   Response (text): ${text.substring(0, 500)}`);
    }
    
    return { status: response.status, ok: response.ok, json, text, headers: response.headers };
  } catch (error) {
    console.log(`   ERROR: ${error.message}`);
    return { status: 0, ok: false, json: null, error: error.message };
  }
}

async function main() {
  console.log('============================================================');
  console.log('  Supabase Google OAuth Configuration Checker');
  console.log('============================================================');
  console.log(`Project Ref : ${PROJECT_REF}`);
  console.log(`Project URL : ${SUPABASE_URL}`);
  console.log(`Timestamp   : ${new Date().toISOString()}`);

  // --- APPROACH 1: GoTrue /auth/v1/settings (service_role) ---
  console.log('\n\n--- APPROACH 1: GoTrue /auth/v1/settings (service_role) ---');
  const settingsResult = await fetchWithDebug(
    'Auth settings',
    `${SUPABASE_URL}/auth/v1/settings`,
    { headers: HEADERS_SERVICE }
  );

  // --- APPROACH 2: GoTrue /auth/v1/settings (anon) ---
  console.log('\n\n--- APPROACH 2: GoTrue /auth/v1/settings (anon) ---');
  await fetchWithDebug(
    'Auth settings (anon)',
    `${SUPABASE_URL}/auth/v1/settings`,
    { headers: HEADERS_ANON }
  );

  // --- APPROACH 3: /auth/v1/providers (service_role) ---
  console.log('\n\n--- APPROACH 3: GoTrue /auth/v1/providers (service_role) ---');
  const providersResult = await fetchWithDebug(
    'Auth providers',
    `${SUPABASE_URL}/auth/v1/providers`,
    { headers: HEADERS_SERVICE }
  );

  // --- APPROACH 4: /auth/v1/providers (anon) ---
  console.log('\n\n--- APPROACH 4: GoTrue /auth/v1/providers (anon) ---');
  const providersAnonResult = await fetchWithDebug(
    'Auth providers (anon)',
    `${SUPABASE_URL}/auth/v1/providers`,
    { headers: HEADERS_ANON }
  );

  // --- APPROACH 5: /auth/v1/health ---
  console.log('\n\n--- APPROACH 5: GoTrue /auth/v1/health ---');
  await fetchWithDebug(
    'Auth health',
    `${SUPABASE_URL}/auth/v1/health`,
    { headers: HEADERS_SERVICE }
  );

  // --- APPROACH 6: Management API (with service_role, expected to fail) ---
  console.log('\n\n--- APPROACH 6: Management API (service_role key - expect 401) ---');
  await fetchWithDebug(
    'Management API auth config',
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    { headers: { 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' } }
  );

  // --- APPROACH 7: Test Google OAuth redirect ---
  console.log('\n\n--- APPROACH 7: Google OAuth initiate (redirect probe) ---');
  const oauthRedirect = await fetchWithDebug(
    'OAuth authorize redirect',
    `${SUPABASE_URL}/auth/v1/authorize?provider=google`,
    { headers: HEADERS_ANON, redirect: 'manual' }
  );

  // ============================================================
  // ANALYSIS
  // ============================================================
  console.log('\n\n============================================================');
  console.log('  ANALYSIS & FINDINGS');
  console.log('============================================================');

  let googleEnabled = false;
  let googleClientId = null;
  let googleSecretSet = false;
  let configSource = null;

  // Parse settings response
  if (settingsResult.ok && settingsResult.json) {
    const s = settingsResult.json;
    console.log('\n[OK] Retrieved auth settings from /auth/v1/settings');
    
    // Find all google-related keys
    const googleKeys = Object.keys(s).filter(k => k.toLowerCase().includes('google'));
    if (googleKeys.length > 0) {
      console.log(`  Google-related fields (${googleKeys.length}):`);
      googleKeys.forEach(k => {
        let val = s[k];
        if (typeof val === 'string' && val.length > 40) val = val.substring(0, 20) + '...[REDACTED]';
        console.log(`    ${k}: ${JSON.stringify(val)}`);
      });
    }

    // Check nested external.google
    if (s.external && typeof s.external === 'object') {
      if (s.external.google) {
        const g = s.external.google;
        googleEnabled = g.enabled !== false;
        googleClientId = g.client_id || g.clientId || null;
        googleSecretSet = !!g.secret;
        configSource = '/auth/v1/settings (external.google)';
        console.log(`\n  Google config found at external.google:`);
        console.log(`    enabled: ${googleEnabled}`);
        console.log(`    client_id: ${googleClientId || 'NOT SET'}`);
        console.log(`    secret: ${googleSecretSet ? 'SET (redacted)' : 'NOT SET'}`);
      }
      // Check if google is listed in external providers
      const extKeys = Object.keys(s.external);
      const providerKeys = extKeys.filter(k => !['captcha', 'email', 'phone', 'anonymous'].includes(k));
      if (providerKeys.length > 0) {
        console.log(`\n  All external OAuth providers in settings:`);
        providerKeys.forEach(k => {
          const provider = s.external[k];
          const enabled = provider.enabled !== false;
          const hasClientId = !!(provider.client_id || provider.clientId);
          console.log(`    ${k}: enabled=${enabled}, client_id=${hasClientId ? 'SET' : 'NOT SET'}`);
        });
      }
    }

    // Also check for external_apple, external_github etc. at top level
    const topLevelProviders = Object.keys(s).filter(k => k.startsWith('external_') && k.includes('_enabled'));
    if (topLevelProviders.length > 0) {
      console.log(`\n  Top-level provider enabled flags:`);
      topLevelProviders.forEach(k => {
        const providerName = k.replace('external_', '').replace('_enabled', '');
        console.log(`    ${providerName}: ${s[k]}`);
      });
    }
  } else {
    console.log('\n[FAIL] Could not retrieve /auth/v1/settings');
  }

  // Parse providers response
  if (providersResult.ok && providersResult.json) {
    const data = providersResult.json;
    console.log('\n[OK] Retrieved providers from /auth/v1/providers');
    const providers = Array.isArray(data) ? data : (data.providers || [data]);
    console.log(`  Total providers returned: ${providers.length}`);
    
    const googleProvider = providers.find(p => 
      (p.id || p.name || p.provider || '').toLowerCase() === 'google'
    );
    if (googleProvider) {
      console.log(`  Google provider details:`);
      Object.entries(googleProvider).forEach(([k, v]) => {
        let displayVal = v;
        if (typeof v === 'string' && v.length > 40) displayVal = v.substring(0, 20) + '...[REDACTED]';
        console.log(`    ${k}: ${JSON.stringify(displayVal)}`);
      });
      if (!configSource) {
        googleEnabled = googleProvider.enabled !== false;
        googleClientId = googleProvider.client_id || googleProvider.clientId || null;
        googleSecretSet = !!googleProvider.secret;
        configSource = '/auth/v1/providers';
      }
    } else {
      console.log('  Google provider NOT found in providers list');
    }
  } else if (providersResult.status === 404) {
    console.log('\n[INFO] /auth/v1/providers returned 404 - not a valid GoTrue endpoint');
  }

  // Check anon providers response
  if (providersAnonResult.ok && providersAnonResult.json) {
    const data = providersAnonResult.json;
    console.log('\n[OK] Anon /auth/v1/providers response available');
    const providers = Array.isArray(data) ? data : (data.providers || []);
    if (providers.length > 0) {
      console.log('  Providers visible to anon users:');
      providers.forEach(p => {
        const name = p.id || p.name || p.provider || 'unknown';
        console.log(`    - ${name}`);
      });
    }
  }

  // Check OAuth redirect behavior
  if (oauthRedirect.status === 302 || oauthRedirect.status === 301) {
    const location = oauthRedirect.headers?.get('location') || 'unknown';
    console.log(`\n[INFO] Google OAuth redirect: ${oauthRedirect.status}`);
    console.log(`  Redirect Location: ${location}`);
    if (location.includes('accounts.google.com')) {
      console.log('  => Google OAuth IS configured (redirects to Google)');
      googleEnabled = true;
      if (!configSource) configSource = 'OAuth redirect test';
    } else if (location.includes('error') || location.includes('not configured')) {
      console.log('  => Google OAuth NOT configured (error redirect)');
      googleEnabled = false;
    }
  } else if (oauthRedirect.json && oauthRedirect.json.error) {
    console.log(`\n[INFO] Google OAuth returned error: ${oauthRedirect.json.error}`);
    if (oauthRedirect.json.msg) console.log(`  Message: ${oauthRedirect.json.msg}`);
  }

  // ============================================================
  // FINAL VERDICT
  // ============================================================
  console.log('\n\n============================================================');
  console.log('  FINAL VERDICT');
  console.log('============================================================');
  console.log(`\n  Google OAuth Enabled:   ${googleEnabled ? 'YES' : 'NO'}`);
  console.log(`  Google Client ID:       ${googleClientId ? googleClientId.substring(0, 30) + '...' : 'NOT FOUND / NOT SET'}`);
  console.log(`  Google Client Secret:   ${googleSecretSet ? 'CONFIGURED' : 'NOT FOUND / NOT SET'}`);
  console.log(`  Config Source:          ${configSource || 'Could not determine from available endpoints'}`);

  if (!configSource) {
    console.log('\n  NOTE: The project-level auth API (/auth/v1/) does not expose');
    console.log('  the full provider configuration including secrets. To get');
    console.log('  complete config, use the Supabase Management API:');
    console.log('');
    console.log('  GET https://api.supabase.com/v1/projects/sjbxyxallfeyfuplacnn/config/auth');
    console.log('');
    console.log('  This requires a Management API access token (not the project keys).');
    console.log('  Generate one at: https://supabase.com/dashboard/account/tokens');
    console.log('  Required scopes: auth:read, auth_config_read');
  }
  
  if (googleEnabled && !googleClientId) {
    console.log('\n  WARNING: Google OAuth appears enabled but no Client ID was found.');
    console.log('  This may mean the provider is enabled in the dashboard but credentials');
    console.log('  are not properly configured, which will cause OAuth to fail.');
  }
  
  if (!googleEnabled) {
    console.log('\n  ACTION NEEDED: Google OAuth is NOT enabled for this project.');
    console.log('  To enable it:');
    console.log('  1. Go to https://supabase.com/dashboard/project/sjbxyxallfeyfuplacnn/auth/providers');
    console.log('  2. Find Google in the providers list');
    console.log('  3. Enable it and add your Google Client ID and Client Secret');
    console.log('  4. Or use the Management API: PATCH /v1/projects/{ref}/config/auth');
    console.log('     with {"external_google_enabled": true, "external_google_client_id": "...", "external_google_secret": "..."}');
  }

  console.log('');
}

main().catch(console.error);
