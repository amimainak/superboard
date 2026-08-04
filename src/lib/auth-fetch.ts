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
  const accessToken = supabase?.auth.getSession;

  // Get the current session
  const { data: { session } } = await (supabase?.auth.getSession() ?? Promise.resolve({ data: { session: null } }));
  const token = session?.access_token;

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
