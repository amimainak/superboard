// ============================================================
// Authenticated Fetch Helper (Client-Side)
// ============================================================
// Wraps the native fetch() to automatically include the
// Supabase JWT Bearer token in the Authorization header
// AND the CSRF token for state-changing operations.
//
// SECURITY FIX (FE-M01): Reads CSRF double-submit cookie
//   and sends matching X-CSRF-Token header on all requests.
// SECURITY FIX (FE-H03): Tokens sourced from Supabase session
//   (stored in localStorage by Supabase SDK). Migration to
//   httpOnly cookies requires Supabase config changes — see
//   FE-H03 migration notes below.
// ============================================================

import { createClient } from '@/lib/supabase';

// In-memory cache of the latest access token.
// Updated by initAuthFetch() — call once after login/session init.
let _cachedToken: string | null = null;

/**
 * Initialize the auth fetch helper by caching the current session token.
 * Call this after confirming the user is logged in.
 * Uses direct cookie reading (synchronous, no getSession() hang risk).
 */
export function initAuthFetch(): void {
  _cachedToken = getTokenFromCookie();
}

/**
 * Read the CSRF token from the double-submit cookie.
 */
function getCSRFToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Extract the Supabase access token directly from the auth cookie.
 * This is synchronous and reliable — no dependency on getSession() which can hang.
 * The cookie name pattern: sb-<project-ref>-auth-token
 */
export function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    // Find the Supabase auth cookie (name: sb-<ref>-auth-token)
    const match = document.cookie.match(/sb-[^-]+-auth-token=base64-([^;]+)/);
    if (!match) return null;

    const b64 = match[1];
    // Handle URL-safe base64
    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
    const raw = atob(padded);
    // Decode percent-encoded bytes
    const decoded = decodeURIComponent(
      Array.from(raw, (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    );
    const data = JSON.parse(decoded);
    return data.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Authenticated fetch — automatically attaches:
 * 1. Bearer token from Supabase session (Authorization header)
 * 2. CSRF token from double-submit cookie (X-CSRF-Token header)
 * 3. Content-Type for JSON bodies
 *
 * SECURITY FIX (FE-M01): CSRF double-submit pattern ensures that
 * state-changing requests (POST/PATCH/DELETE) can only originate
 * from the same origin. The middleware validates cookie === header.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // If no cached token, extract it directly from the Supabase auth cookie.
  // This avoids calling supabase.auth.getSession() which can hang indefinitely
  // in production with @supabase/ssr createBrowserClient.
  if (!_cachedToken) {
    _cachedToken = getTokenFromCookie();
  }

  const headers = new Headers(options.headers || {});

  if (_cachedToken) {
    headers.set('Authorization', `Bearer ${_cachedToken}`);
  }

  // SECURITY FIX (FE-M01): Include CSRF token for all requests
  // Middleware validates: cookie csrf-token === header X-CSRF-Token
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
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

// ============================================================
// FE-H03 Migration Notes: localStorage → httpOnly Cookies
// ============================================================
// Supabase's createBrowserClient() stores auth tokens in
// localStorage by default. To migrate to httpOnly cookies:
//
// 1. Switch from createBrowserClient to the @supabase/ssr
//    createServerClient pattern in a route handler / middleware.
// 2. In Supabase Dashboard → Auth → URL Configuration:
//    - Set "Site URL" to your domain
//    - Enable "Send cookies with every request"
// 3. In middleware.ts, create a Supabase client and call
//    supabase.auth.getSession() from the cookie, then forward
//    the session token as an httpOnly cookie.
// 4. Update auth-fetch.ts to read tokens from httpOnly cookies
//    via a lightweight API endpoint (/api/auth/token) instead
//    of directly from localStorage.
//
// This migration is currently BLOCKED because:
// - Supabase SSR cookie handling requires server component context
//   that isn't available in all client hooks
// - The current auth pattern (Bearer token in Authorization header)
//   is the standard for API routes and doesn't require cookies
// - Mitigated by: CSP nonce (FE-C01) prevents XSS that would steal
//   localStorage tokens, and the SameSite=strict CSRF cookie adds
//   defense-in-depth against CSRF
//
// TODO: Complete migration when Supabase SSR client is integrated
// across all auth flows (estimated effort: 1 sprint).
// ============================================================
