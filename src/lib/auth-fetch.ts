// ============================================================
// Authenticated Fetch Helper (Client-Side)
// ============================================================
// Wraps the native fetch() to automatically include the
// Supabase JWT Bearer token in the Authorization header.
// Use this for ALL client-to-API calls that require auth.
// ============================================================

import { createClient } from '@/lib/supabase';

// In-memory cache of the latest access token.
// Updated by initAuthFetch() — call once after login/session init.
let _cachedToken: string | null = null;

/**
 * Initialize the auth fetch helper by caching the current session token.
 * Call this after confirming the user is logged in (e.g., in onAuthStateChange).
 * The token is kept in memory and refreshed on each auth state change.
 */
export function initAuthFetch(): void {
  const supabase = createClient();
  if (!supabase) return;

  supabase.auth.getSession().then(({ data: { session } }) => {
    _cachedToken = session?.access_token ?? null;
  });

  // Keep token fresh — update on any auth state change
  supabase.auth.onAuthStateChange((_event, session) => {
    _cachedToken = session?.access_token ?? null;
  });
}

/**
 * Authenticated fetch — automatically attaches the cached Supabase
 * access token as a Bearer header.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // If no cached token, try to get it from the session directly
  if (!_cachedToken) {
    const supabase = createClient();
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      _cachedToken = session?.access_token ?? null;
    }
  }

  const headers = new Headers(options.headers || {});

  if (_cachedToken) {
    headers.set('Authorization', `Bearer ${_cachedToken}`);
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
