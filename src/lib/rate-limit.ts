// ============================================================
// Rate Limiting — In-memory for single-instance, extended interface
// ============================================================
// NOTE: In-memory rate limiting is ineffective in serverless
// environments (Vercel) where each request may run in a new process.
// For production-scale rate limiting, use Upstash Redis or similar.
//
// The `rateLimit()` sync function works reliably for single-process
// deployments (local dev, Docker, VPS). The async `checkRateLimit()`
// wraps it for API route convenience.
// ============================================================

const attempts = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
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

/**
 * Async rate-limit helper for API routes.
 * Now accepts optional overrides for maxRequests and windowMs.
 * Returns `resetAt` so callers can set accurate Retry-After headers.
 */
export async function checkRateLimit(
  request: Request,
  key: string,
  options?: { max?: number; windowMs?: number }
): Promise<{ allowed: boolean; response: Response | null; resetAt: number }> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const result = rateLimit(
    ip + ':' + key,
    options?.max ?? 30,
    options?.windowMs ?? 60_000
  )
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
