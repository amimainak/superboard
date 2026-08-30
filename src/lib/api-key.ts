// ============================================================
// Superboard — API Key Validation
// Validates x-api-key header for LMS integration endpoints.
// For now, reads from env var. Future: reads from User table.
// ============================================================

import crypto from 'crypto'

/**
 * Validate an API key from the x-api-key header.
 * Currently checks against SUPERBOARD_API_KEYS env var (comma-separated).
 * Returns { valid: true, userId?: string } or { valid: false, error: string }.
 */
export function validateApiKey(apiKey: string | null): {
  valid: boolean
  userId?: string
  error?: string
} {
  if (!apiKey) {
    return { valid: false, error: 'Missing x-api-key header' }
  }

  // Check env var first
  const envKeys = process.env.SUPERBOARD_API_KEYS
  if (envKeys) {
    const allowedKeys = envKeys.split(',').map(k => k.trim()).filter(Boolean)
    const isValidKey = allowedKeys.some(k => {
      if (k.length !== apiKey.length) return false
      try { return crypto.timingSafeEqual(Buffer.from(k), Buffer.from(apiKey)) } catch { return false }
    })
    if (isValidKey) {
      // API key → userId mapping. Set SUPERBOARD_API_KEY_USER_IDS env var
      // as "keyPrefix:userId,keyPrefix:userId" for per-key mappings.
      // Falls back to a configurable default or the key hash.
      const envMapping = process.env.SUPERBOARD_API_KEY_USER_IDS
      if (envMapping) {
        const mappings = envMapping.split(',').map(m => m.trim().split(':'))
        for (const [prefix, uid] of mappings) {
          if (apiKey.startsWith(prefix) && uid) {
            return { valid: true, userId: uid }
          }
        }
      }
      // Default: use first 8 chars of the key hash as a stable ID
      const hash = crypto.createHash('sha256').update(apiKey).digest('hex').slice(0, 8)
      return { valid: true, userId: 'api-key-' + hash }
    }
  }

  return { valid: false, error: 'Invalid API key' }
}

/**
 * Middleware-style helper: extract and validate API key from request.
 * Returns { valid: true } or NextResponse error.
 */
export async function requireApiKey(request: Request): Promise<
  { valid: true; userId: string } | { response: Response }
> {
  const apiKey = request.headers.get('x-api-key')
  const result = validateApiKey(apiKey)

  if (!result.valid) {
    return {
      response: new Response(
        JSON.stringify({ error: result.error }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    }
  }

  return { valid: true, userId: result.userId! }
}
