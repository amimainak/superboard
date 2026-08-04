// ============================================================
// Supabase Client Configuration
// ============================================================
// Provides both browser-side and server-side Supabase clients.
// In production, these connect to your Supabase project.
// The browser client is cached as a singleton to ensure auth
// state listeners work correctly across the app.
// ============================================================

import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isConfigured = supabaseUrl && supabaseAnonKey;

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
  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey);
}

export const supabase = isConfigured ? createClient() : null;
