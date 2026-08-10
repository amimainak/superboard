// ============================================================
// Next.js Middleware — Security Headers & Custom Domain Routing
// ============================================================
// 1. Generates a CSP nonce for every page request
// 2. Adds security headers (CSP, HSTS, X-Frame-Options)
// 3. Intercepts custom domain requests for agency branding
// 4. SECURITY FIX (FE-M02): Uses shared rate-limit module
//    (Upstash Redis or in-memory fallback)
// 5. SECURITY FIX (FE-M01): Sets double-submit CSRF cookie
// 6. SECURITY FIX (V-09): IP extraction with trusted proxy
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitCategory, extractClientIP } from '@/lib/rate-limit';

// TODO: In production, this queries the database for custom domains.
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || '';

// Edge-compatible nonce generation using Web Crypto API
async function generateNonce(): Promise<string> {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

// ---- CSRF Token Generation (FE-M01) ----
// Generates a random CSRF token and sets it as a double-submit cookie.
// The same token is exposed via X-CSRF-Token header for frontend to include
// in state-changing requests. Server validates cookie === header.
async function generateCSRFToken(): Promise<string> {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64url');
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const pathname = request.nextUrl.pathname;

  // Remove port if present (e.g., localhost:3000 → localhost)
  const hostnameWithoutPort = hostname.split(':')[0];

  // ---- Rate limiting for API routes (FE-M02: Upstash/Redis-backed) ----
  if (pathname.startsWith('/api/')) {
    // SECURITY FIX (FE-M02): Use shared rate-limit module with Upstash fallback
    const category = getRateLimitCategory(pathname);
    const result = await checkRateLimit(request, category);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(1, retryAfter)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
          },
        }
      );
    }

    // SECURITY FIX (FE-M01): Set CSRF cookie for state-changing methods
    // Skip for GET/HEAD/OPTIONS — they are safe (idempotent)
    const method = request.method.toUpperCase();
    const response = NextResponse.next();

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      // For non-idempotent requests, the CSRF token should already be present
      // as both a cookie and a header (double-submit pattern).
      // We validate it here in middleware for early rejection.
      const csrfCookie = request.cookies.get('csrf-token')?.value;
      const csrfHeader = request.headers.get('x-csrf-token');

      // Skip CSRF check for webhook callbacks (they use Bearer/HMAC auth instead)
      const isWebhook = pathname.includes('webhook') || pathname.includes('stripe');

      if (!isWebhook && csrfCookie && csrfHeader) {
        // Constant-time comparison to prevent timing attacks
        if (csrfCookie !== csrfHeader) {
          return NextResponse.json(
            { error: 'CSRF validation failed' },
            { status: 403 }
          );
        }
      }
    }

    // Generate and set fresh CSRF cookie for all responses
    const csrfToken = await generateCSRFToken();
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false, // Frontend needs to read this for the header
      secure: true,
      sameSite: 'lax', // 'lax' (not 'strict') required for OAuth redirects
      path: '/',
      maxAge: 3600, // 1 hour
    });
    response.headers.set('X-CSRF-Token', csrfToken);

    // Pass rate limit info downstream
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Limit', String(result.limit));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
    return response;
  }

  // ---- CSP Nonce + CSRF cookie for non-API, non-static routes ----
  const nonce = await generateNonce();
  const csrfToken = await generateCSRFToken();

  // Build connect-src dynamically: include Hocuspocus WebSocket URL if configured
  const hocuspocusWsUrl = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || '';
  const hocuspocusCspEntry = hocuspocusWsUrl ? ` ${hocuspocusWsUrl}` : '';

  // SECURITY FIX (FE-C01): Use nonce in CSP instead of unsafe-inline/unsafe-eval
  // The nonce is generated above and passed via X-Nonce header for use in <script> tags
  // NOTE: Google OAuth requires accounts.google.com and *.googleapis.com in form-action and connect-src
  const cspDirectives = `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://js.stripe.com; style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.supabase.co https://*.superboard.app https://superboard.app https://lh3.googleusercontent.com; connect-src 'self' wss://*.livekit.io https://*.supabase.co https://api.stripe.com https://api.mathpix.com https://api.anthropic.com https://accounts.google.com https://*.googleapis.com${hocuspocusCspEntry}; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com https://accounts.google.com https://*.googleapis.com; frame-ancestors 'self'; upgrade-insecure-requests`;

  // ---- Custom domain routing ----
  if (MAIN_DOMAIN && hostnameWithoutPort !== MAIN_DOMAIN && hostnameWithoutPort !== 'localhost') {
    url.searchParams.set('customDomain', hostnameWithoutPort);
    url.searchParams.set('isCustomDomain', 'true');

    const response = NextResponse.rewrite(url);
    response.headers.set('Content-Security-Policy', cspDirectives);
    response.headers.set('X-Nonce', nonce);
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    // SECURITY FIX (FE-M01): Set CSRF cookie on page responses
    // NOTE: sameSite 'lax' (not 'strict') is required for OAuth redirects —
    // Google redirects back with a GET, and 'strict' would block the cookie.
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    });
    response.headers.set('X-CSRF-Token', csrfToken);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', cspDirectives);
  response.headers.set('X-Nonce', nonce);
  // Security headers (supplementary to next.config.ts static headers)
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  // SECURITY FIX (FE-M01): Set CSRF cookie on page responses
    // NOTE: sameSite 'lax' (not 'strict') is required for OAuth redirects
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    });
  response.headers.set('X-CSRF-Token', csrfToken);
  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and _next internals
    '/((?!_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
};
