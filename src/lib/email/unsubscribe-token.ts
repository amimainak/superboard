// ============================================================
// Unsubscribe token helpers
// ============================================================
// Generates and verifies tokens for the /unsubscribe/[token] page.
// The token is an HMAC-SHA256 of the email address using a server
// secret — so we can look up the email from the token without
// storing a separate token database, and the token can't be
// reverse-engineered to reveal the email.
// ============================================================

import crypto from 'crypto'

function getSecret(): string {
  return process.env.UNSUBSCRIBE_SECRET || process.env.RESEND_API_KEY || 'fallback-dev-secret-change-me'
}

/**
 * Generate an unsubscribe token for an email address.
 * Format: <hex-hmac>
 */
export function generateUnsubscribeToken(email: string): string {
  const normalized = email.trim().toLowerCase()
  return crypto.createHmac('sha256', getSecret()).update(normalized).digest('hex')
}

/**
 * Verify an unsubscribe token against an email address.
 * Returns true if the token matches the email.
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = generateUnsubscribeToken(email)
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== token.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  } catch {
    return false
  }
}

/**
 * Look up an email by trying to verify the token against known
 * addresses. Since the token is a deterministic HMAC, we can't
 * reverse it — we have to know the email to verify it.
 *
 * For the unsubscribe flow, we look up the email from the
 * Student or User table by checking if the token matches any
 * known address. This is done in the /unsubscribe/[token] route.
 */
export function tokenMatchesEmail(email: string, token: string): boolean {
  return verifyUnsubscribeToken(email, token)
}
