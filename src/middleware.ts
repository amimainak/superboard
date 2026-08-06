// ============================================================
// Next.js Middleware — Security Headers & Custom Domain Routing
// ============================================================
// 1. Generates a CSP nonce for every page request
// 2. Adds security headers (CSP, HSTS, X-Frame-Options)
// 3. Intercepts custom domain requests for agency branding
// 4. Implements IP-based rate limiting for sensitive endpoints
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
// TODO: In production, this queries the database for custom domains.
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || '';

// Edge-compatible nonce generation using Web Crypto API
async function generateNonce(): Promise<string> {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

// ---- In-memory rate limiter (per IP, per endpoint family) ----
// In production, replace with Redis-backed rate limiter (Upstash)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  livekit: { max: 10, windowMs: 60_000 },       // 10/min for token generation
  auth: { max: 20, windowMs: 60_000 },           // 20/min for auth routes
  ai: { max: 30, windowMs: 60_000 },             // 30/min for AI actions
  participants: { max: 50, windowMs: 60_000 },    // 50/min for participant joins
  default: { max: 100, windowMs: 60_000 },       // 100/min default
};

function checkRateLimit(ip: string, category: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = `${ip}:${category}`;
  const config = RATE_LIMITS[category] || RATE_LIMITS.default;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1 };
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: config.max - entry.count };
}

// ---- Cleanup stale rate limit entries every 5 minutes ----
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 300_000);

// ---- Determine rate limit category from the request path ----
function getRateLimitCategory(pathname: string): string {
  if (pathname.includes('livekit')) return 'livekit';
  if (pathname.includes('auth')) return 'auth';
  if (pathname.includes('ai/action')) return 'ai';
  if (pathname.includes('participants')) return 'participants';
  return 'default';
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const pathname = request.nextUrl.pathname;

  // Remove port if present (e.g., localhost:3000 → localhost)
  const hostnameWithoutPort = hostname.split(':')[0];

  // ---- Rate limiting for API routes ----
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const category = getRateLimitCategory(pathname);
    const result = checkRateLimit(ip, category);

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // Pass rate limit info downstream
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    return response;
  }

  // ---- CSP Nonce for non-API, non-static routes ----
  const nonce = await generateNonce();

  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'nonce-${nonce}' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co https://*.superboard.app https://superboard.app https://lh3.googleusercontent.com",
    "connect-src 'self' wss://*.livekit.io https://*.supabase.co https://api.stripe.com https://api.mathpix.com https://api.anthropic.com https://*.hocuspocus.com wss://*.hocuspocus.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join('; ');

  // ---- Custom domain routing ----
  if (MAIN_DOMAIN && hostnameWithoutPort !== MAIN_DOMAIN && hostnameWithoutPort !== 'localhost') {
    url.searchParams.set('customDomain', hostnameWithoutPort);
    url.searchParams.set('isCustomDomain', 'true');

    const response = NextResponse.rewrite(url);
    response.headers.set('Content-Security-Policy', cspDirectives);
    response.headers.set('X-Nonce', nonce);
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', cspDirectives);
  response.headers.set('X-Nonce', nonce);
  // Security headers (supplementary to next.config.ts static headers)
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and _next internals
    '/((?!_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
};
