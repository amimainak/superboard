// ============================================================
// Supabase Client Configuration
// ============================================================
// Provides both browser-side and server-side Supabase clients.
// In production, these connect to your Supabase project.
// ============================================================

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = supabaseUrl && supabaseAnonKey;

export function createClient() {
  if (!isConfigured) {
    // Return a no-op stub so the landing page renders without crashing.
    // Auth calls will simply fail gracefully.
    return null as unknown as ReturnType<typeof createBrowserClient>;
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Server-side Supabase client using service role key.
 * Use this in API routes / server components only.
 */
export function createServerClient() {
  if (!isConfigured) {
    return null as unknown as ReturnType<typeof createBrowserClient>;
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = isConfigured ? createClient() : null;
