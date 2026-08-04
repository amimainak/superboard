// ============================================================
// Authenticated Fetch Helper (Client-Side)
// ============================================================
// Wraps the native fetch() to automatically include the
// Supabase JWT Bearer token in the Authorization header.
// Use this for ALL client-to-API calls that require auth.
// ============================================================

import { createClient } from '@/lib/supabase';

/**
 * Authenticated fetch — automatically attaches the Supabase
 * access token as a Bearer header.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const supabase = createClient();

  if (!supabase) {
    console.warn('[authFetch] Supabase client not configured — sending unauthenticated request');
    return fetch(url, options);
  }

  // Get the current session — getSession() reads from the in-memory auth state
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    console.warn('[authFetch] No active session found — sending unauthenticated request to', url);
  }

  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set Content-Type for JSON bodies if not already set
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
