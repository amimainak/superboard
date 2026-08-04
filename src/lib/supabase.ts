// ============================================================
// Supabase Client Configuration
// ============================================================
// Provides both browser-side and server-side Supabase clients.
// In production, these connect to your Supabase project.
// The browser client is cached as a singleton to ensure auth
// state listeners work correctly across the app.
// ============================================================

import { createBrowserClient } from '@supabase/ssr';

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
 * Server-side Supabase client using service role key.
 * Use this in API routes / server components only.
 * The service role key bypasses Row Level Security, giving
 * the server full admin access to read/write any data.
 */
export function createServerClient() {
  if (!isConfigured || !supabaseServiceRoleKey) {
    return null;
  }
  // Use the service role key for server-side operations
  // This bypasses RLS policies so the server can read/write all data
  return createBrowserClient(supabaseUrl, supabaseServiceRoleKey);
}

export const supabase = isConfigured ? createClient() : null;
