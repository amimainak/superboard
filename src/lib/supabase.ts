// ============================================================
// Supabase Client Configuration
// ============================================================
// Provides both browser-side and server-side Supabase clients.
// In production, these connect to your Supabase project.
// ============================================================

import { createBrowserClient } from '@supabase/ssr';

// TODO: Replace with actual Supabase URL and anon key from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Server-side Supabase client using service role key.
 * Use this in API routes / server components only.
 */
export function createServerClient() {
  // TODO: In production, use @supabase/ssr createServerClient with cookies
  // For now, the browser client is used everywhere since we're wiring architecture.
  // When Supabase credentials are provided, replace this with:
  //
  // import { createServerClient } from '@supabase/ssr'
  // import { cookies } from 'next/headers'
  //
  // const cookieStore = await cookies()
  // return createServerClient(supabaseUrl, serviceRoleKey, {
  //   cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { c.forEach(({name,value,...opts}) => cookieStore.set(name,value,opts)) } }
  // })

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createClient();
