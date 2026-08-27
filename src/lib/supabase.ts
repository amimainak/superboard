// ============================================================
// Supabase Client Configuration
// ============================================================
// Provides both browser-side and server-side Supabase clients.
// In production, these connect to your Supabase project.
// The browser client is cached as a singleton to ensure auth
// state listeners work correctly across the app.
//
// SECURITY FIX (I-02): Added URL validation to prevent SSRF
// via manipulated NEXT_PUBLIC_SUPABASE_URL env var.
// ============================================================

import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// SECURITY (I-02): Validate Supabase URL is a legitimate Supabase project URL
function isValidSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Must be HTTPS (or http for localhost development)
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
      return false;
    }
    // Must be a known Supabase domain pattern or localhost
    const allowedPatterns = [
      /\.supabase\.co$/,
      /\.supabase\.app$/,
      /localhost/,
      /127\.0\.0\.1/,
    ];
    return allowedPatterns.some((pattern) => pattern.test(parsed.hostname));
  } catch {
    return false;
  }
}

const isConfigured = supabaseUrl && supabaseAnonKey && isValidSupabaseUrl(supabaseUrl);

if (supabaseUrl && !isValidSupabaseUrl(supabaseUrl)) {
  console.error(
    '[Supabase] WARNING: NEXT_PUBLIC_SUPABASE_URL does not match expected pattern. ' +
    'This may indicate a misconfiguration or SSRF attempt. URL: ' +
    supabaseUrl.substring(0, 50) + '...'
  );
}

// Singleton browser client — ensures auth state is shared
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!isConfigured) {
    return null;
  }
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}

/**
 * Server-side Supabase admin client using service role key.
 * Use this in API routes / server components only.
 *
 * Uses createClient from @supabase/supabase-js (NOT createBrowserClient)
 * because API routes run server-side and need:
 *  - The service role key to bypass RLS
 *  - Plain createClient for proper JWT verification via getUser(token)
 *  - No cookie handling (browser-only concern)
 */
export function createServerClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }
  // SECURITY (I-02): Also validate URL for server-side client
  if (!isValidSupabaseUrl(supabaseUrl)) {
    return null;
  }
  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey);
}

// NOTE: Removed module-level `export const supabase = createClient()` to prevent
// hydration issues — createBrowserClient accesses browser APIs at module evaluation time.
// Use createClient() function directly instead.
