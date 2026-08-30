// ============================================================
// Rate Limiting — Upstash Redis (serverless) with in-memory fallback
// ============================================================
// In Vercel serverless, each request may run in a separate process,
// making in-memory rate limiting useless. This module uses Upstash Redis
// (HTTP-based, works in Edge Runtime) when UPSTASH_REDIS_REST_URL is set.
// Falls back to in-memory for local dev.
//
// SETUP: Create a free Upstash Redis database at https://upstash.com,
// then set these env vars:
//   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
//   UPSTASH_REDIS_REST_TOKEN=xxx
// ============================================================

const attempts = new Map<string, { count: number; resetAt: number }>()

// --- In-memory fallback (for local dev without Upstash) ---

function inMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number; resetAt: number } {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    attempts.set(key, { count: 1, resetAt })
    return { allowed: true, retryAfterMs: 0, resetAt }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, retryAfterMs: 0, resetAt: entry.resetAt }
}

// Cleanup stale entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of attempts) {
      if (now > entry.resetAt) attempts.delete(key)
    }
  }, 5 * 60 * 1000)
}

// --- Upstash Redis rate limiter ---

let redis: import('@upstash/redis').Redis | null = null
let redisInitialized = false

function getRedis(): import('@upstash/redis').Redis | null {
  if (redisInitialized) return redis
  redisInitialized = true

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  try {
    // Dynamic import to avoid bundling Upstash when not configured
    const { Redis } = require('@upstash/redis')
    redis = new Redis({ url, token })
    console.log('[RateLimit] Upstash Redis connected')
  } catch (err) {
    console.error('[RateLimit] Failed to initialize Upstash Redis:', err)
  }
  return redis
}

/**
 * Synchronous rate limit using in-memory store.
 * Works reliably for single-process deployments (local dev, Docker, VPS).
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number; resetAt: number } {
  return inMemoryRateLimit(key, maxRequests, windowMs)
}

/**
 * Async rate-limit helper for API routes.
 * Uses Upstash Redis in production (when env vars are set),
 * falls back to in-memory for local development.
 *
 * Returns `resetAt` so callers can set accurate Retry-After headers.
 */
export async function checkRateLimit(
  request: Request,
  key: string,
  options?: { max?: number; windowMs?: number }
): Promise<{ allowed: boolean; response: Response | null; resetAt: number }> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const fullKey = ip + ':' + key
  const maxRequests = options?.max ?? 30
  const windowSec = Math.ceil((options?.windowMs ?? 60_000) / 1000)

  // Try Upstash Redis first
  const r = getRedis()
  if (r) {
    try {
      // INCR returns the new count. If this is the first request in the window,
      // set the expiry.
      const pipeline = r.pipeline()
      pipeline.incr(fullKey)
      pipeline.expire(fullKey, windowSec)
      const [count] = await pipeline.exec()

      if (count > maxRequests) {
        const ttl = await r.ttl(fullKey)
        const retryAfterSec = Math.max(1, typeof ttl === 'number' ? ttl : windowSec)
        const res = new Response(
          JSON.stringify({ error: 'Rate limited' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfterSec),
            },
          }
        )
        return {
          allowed: false,
          response: res,
          resetAt: Date.now() + retryAfterSec * 1000,
        }
      }

      return { allowed: true, response: null, resetAt: Date.now() + windowSec * 1000 }
    } catch (err) {
      // Redis error — fall through to in-memory
      console.error('[RateLimit] Redis error, falling back to in-memory:', err)
    }
  }

  // In-memory fallback
  const result = inMemoryRateLimit(fullKey, maxRequests, windowSec * 1000)
  if (!result.allowed) {
    const res = new Response(
      JSON.stringify({ error: 'Rate limited' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)),
        },
      }
    )
    return { allowed: false, response: res, resetAt: result.resetAt }
  }
  return { allowed: true, response: null, resetAt: result.resetAt }
}

/** Extract client IP from x-forwarded-for (first entry = real client behind proxies) */
export function extractClientIP(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}
