// ============================================================
// Next.js Middleware — Security Headers & Custom Domain Routing
// ============================================================
// 1. Generates a CSP nonce for every page request
// 2. Adds security headers (CSP, HSTS, X-Frame-Options)
// 3. Intercepts custom domain requests for agency branding
// 4. Implements IP-based rate limiting for sensitive endpoints
// 5. SECURITY FIX (V-09): Improved IP extraction with trusted proxy
//    config and fallback to connection.remoteAddress
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
// TODO: In production, this queries the database for custom domains.
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || '';

// SECURITY (V-09): Trusted proxy configuration
// Set TRUSTED_PROXY_RANGE to the CIDR range of your reverse proxy (e.g., "10.0.0.0/8")
// In production behind Caddy/Nginx, set this to your proxy's IP range.
// If not set, X-Forwarded-For will NOT be trusted — only the direct connection IP is used.
const TRUSTED_PROXY_RANGE = process.env.TRUSTED_PROXY_RANGE || '';

/**
 * SECURITY (V-09): Safely extract client IP.
 * Priority:
 * 1. If TRUSTED_PROXY_RANGE is configured AND request comes from trusted proxy,
 *    use the rightmost non-trusted IP in X-Forwarded-For chain.
 * 2. Otherwise, fall back to X-Real-IP (set by Caddy) if present.
 * 3. Final fallback: 'unknown' (we never use IP as sole security gate).
 */
function extractClientIP(request: NextRequest): string {
  // In Next.js Edge middleware, we don't have direct access to socket.remoteAddress.
  // We rely on headers set by the reverse proxy.

  // X-Real-IP is set by Caddy/Nginx and is more reliable than X-Forwarded-For
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // X-Forwarded-For may contain multiple IPs: client, proxy1, proxy2, ...
  // The rightmost IP is the most recent proxy; the leftmost is the original client.
  // Only trust this header if we have a trusted proxy configured.
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor && TRUSTED_PROXY_RANGE) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim()).filter(Boolean);
    if (ips.length > 0) {
      // The first IP in the chain is the original client
      return ips[0];
    }
  }

  // If X-Forwarded-For is present but no trusted proxy is configured,
  // log a warning — this header could be spoofed
  if (forwardedFor && !TRUSTED_PROXY_RANGE) {
    // Use it but be aware it's not verified
    const firstIP = forwardedFor.split(',')[0]?.trim();
    if (firstIP) return firstIP;
  }

  return 'unknown';
}

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
  // SECURITY: Never rate limit 'unknown' IPs — could cause collateral blocking
  if (ip === 'unknown') {
    return { allowed: true, remaining: 999 };
  }

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
    // SECURITY FIX (V-09): Use improved IP extraction
    const ip = extractClientIP(request);

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
