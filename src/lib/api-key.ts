// ============================================================
// Superboard — API Key Validation
// Validates x-api-key header for LMS integration endpoints.
// For now, reads from env var. Future: reads from User table.
// ============================================================

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
    if (allowedKeys.includes(apiKey)) {
      return { valid: true, userId: 'api-key-user' }
    }
  }

  // If no env keys configured, allow a default dev key
  if (!envKeys && apiKey === 'dev-api-key') {
    return { valid: true, userId: 'dev-user' }
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
