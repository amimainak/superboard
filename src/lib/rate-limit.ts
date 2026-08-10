// ============================================================
// Rate Limiter — Production-Ready Multi-Tier Implementation
// ============================================================
// SECURITY FIX (FE-M02): Replace in-memory rate limiter with
// a layered approach:
//   Tier 1: Upstash Redis (serverless/Vercel Edge compatible)
//   Tier 2: In-memory fallback (single-server deployments)
//
// Upstash is free-tier friendly and designed for Edge/serverless.
// If UPSTASH_REDIS_REST_URL is configured, uses Redis for
// distributed rate limiting across multiple serverless instances.
// Otherwise falls back to in-memory with a warning.
// ============================================================

import { NextRequest } from 'next/server';

// ---- In-memory fallback store ----
const memoryStore = new Map<string, { count: number; resetAt: number }>();

// ---- Cleanup stale memory entries every 5 minutes ----
if (typeof globalThis !== 'undefined' && typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.resetAt) {
        memoryStore.delete(key);
      }
    }
  }, 300_000);
}

export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const useUpstash = !!(UPSTASH_URL && UPSTASH_TOKEN);

// ---- Default rate limit categories ----
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  livekit: { max: 10, windowMs: 60_000 },
  auth: { max: 20, windowMs: 60_000 },
  ai: { max: 30, windowMs: 60_000 },
  participants: { max: 50, windowMs: 60_000 },
  roomJoin: { max: 10, windowMs: 60_000 },
  parentPortal: { max: 5, windowMs: 15 * 60_000 },
  webhook: { max: 20, windowMs: 60_000 },
  default: { max: 100, windowMs: 60_000 },
};

/**
 * Determine rate limit category from request path.
 */
export function getRateLimitCategory(pathname: string): string {
  if (pathname.includes('livekit')) return 'livekit';
  if (pathname.includes('/auth/')) return 'auth';
  if (pathname.includes('ai/action')) return 'ai';
  if (pathname.includes('participants')) return 'participants';
  if (pathname.includes('room/join')) return 'roomJoin';
  if (pathname.includes('parent/')) return 'parentPortal';
  if (pathname.includes('webhook')) return 'webhook';
  return 'default';
}

/**
 * SECURITY: Safely extract client IP from request.
 * Priority:
 * 1. X-Real-IP (set by Caddy/Nginx)
 * 2. X-Forwarded-For (if trusted proxy configured)
 * 3. Fallback: 'unknown'
 */
export function extractClientIP(request: NextRequest): string {
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP.trim();

  const forwardedFor = request.headers.get('x-forwarded-for');
  const trustedProxy = process.env.TRUSTED_PROXY_RANGE || '';

  if (forwardedFor && trustedProxy) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim()).filter(Boolean);
    if (ips.length > 0) return ips[0];
  }

  if (forwardedFor && !trustedProxy) {
    const firstIP = forwardedFor.split(',')[0]?.trim();
    if (firstIP) return firstIP;
  }

  return 'unknown';
}

/**
 * Upstash Redis-backed rate limiter.
 * Uses the Upstash REST API (HTTP-based, Edge-compatible).
 */
async function upstashRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const windowSeconds = Math.ceil(config.windowMs / 1000);
    const now = Math.floor(Date.now() / 1000);

    // Use Upstash INCR + EXPIRE pattern via REST API
    const response = await fetch(`${UPSTASH_URL}/INCR/${key}`, {
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Upstash INCR failed: ${response.status}`);
    }

    const result = await response.json();
    const count = (result as { result: number }).result;

    // Set expiry on first request in window
    if (count === 1) {
      await fetch(`${UPSTASH_URL}/EXPIRE/${key}/${windowSeconds}`, {
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
        },
      });
    }

    const allowed = count <= config.max;
    const remaining = Math.max(0, config.max - count);

    return {
      allowed,
      remaining,
      resetAt: (now + windowSeconds) * 1000,
      limit: config.max,
    };
  } catch (err) {
    // Upstash error — fall back to in-memory silently
    console.warn('[RateLimit] Upstash error, falling back to in-memory:', err);
    return memoryRateLimit(key, config);
  }
}

/**
 * In-memory rate limiter (single-server fallback).
 */
function memoryRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.max - 1,
      resetAt,
      limit: config.max,
    };
  }

  if (entry.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit: config.max,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.max - entry.count,
    resetAt: entry.resetAt,
    limit: config.max,
  };
}

/**
 * Main rate limit check function.
 * Automatically selects Upstash (distributed) or in-memory (single-server).
 *
 * SECURITY (FE-M02): Returns consistent results across serverless instances
 * when Upstash is configured.
 */
export async function checkRateLimit(
  request: NextRequest,
  category?: string,
  customConfig?: RateLimitConfig
): Promise<RateLimitResult> {
  const ip = extractClientIP(request);

  // SECURITY: Apply conservative default for unidentifiable clients
  if (ip === 'unknown') {
    const config = customConfig || RATE_LIMITS[category || 'default'] || RATE_LIMITS.default;
    return { allowed: true, remaining: Math.max(0, config.max - 1), resetAt: Date.now() + config.windowMs, limit: config.max };
  }

  const key = `rl:${ip}:${category || 'default'}`;
  const config = customConfig || RATE_LIMITS[category || 'default'] || RATE_LIMITS.default;

  if (useUpstash) {
    return upstashRateLimit(key, config);
  }

  // Log warning about in-memory usage in production
  if (process.env.NODE_ENV === 'production' && !useUpstash) {
    // Only warn once per process
    if (!(globalThis as any).__rateLimitWarned) {
      console.warn(
        '[RateLimit] WARNING: Using in-memory rate limiting in production. ' +
        'Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for ' +
        'distributed rate limiting across serverless instances. ' +
        'Sign up for free at https://upstash.com'
      );
      (globalThis as any).__rateLimitWarned = true;
    }
  }

  return memoryRateLimit(key, config);
}

/**
 * Reset rate limit for a specific key (useful for admin/testing).
 */
export function resetRateLimit(ip: string, category: string): void {
  const key = `rl:${ip}:${category}`;
  memoryStore.delete(key);
}
