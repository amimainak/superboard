// ============================================================
// Email Service — Resend wrapper with graceful fallback
// ============================================================
// Single sendEmail() entry point used by all notification paths.
//
// Safety checks before every send:
//   1. If RESEND_API_KEY is not set → log to console (dev mode)
//   2. If the recipient is on the EmailSuppression list → skip silently
//      (protects deliverability + legal compliance)
//
// FROM address: uses RESEND_FROM_ADDRESS env var, or falls back to
// a sensible default. The domain must be verified in Resend.
// ============================================================

import { Resend } from 'resend'
import { isSuppressed } from './suppression'

let _client: Resend | null = null

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  if (!_client) _client = new Resend(apiKey)
  return _client
}

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  replyTo?: string
  // Set to true to bypass the suppression list check (e.g., for the
  // tutor's own test email). Default false.
  bypassSuppression?: boolean
}

export interface SendEmailResult {
  sent: boolean
  id?: string
  error?: string
  // In dev mode (no API key), this is true — the email was "sent" to the log
  devMode: boolean
  // True if the recipient is suppressed (bounced/complained/unsubscribed)
  suppressed?: boolean
  suppressionReason?: string
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const from = process.env.RESEND_FROM_ADDRESS || 'Superboard <notifications@superboard.app>'

  // 1. Suppression list check (unless explicitly bypassed)
  if (!params.bypassSuppression) {
    const reason = await isSuppressed(params.to)
    if (reason) {
      console.log(`[Email] Suppressed — skipping send to ${params.to} (reason: ${reason})`)
      return { sent: false, devMode: false, suppressed: true, suppressionReason: reason }
    }
  }

  const client = getClient()
  if (!client) {
    // Dev mode — log the email instead of sending
    console.log('\n━━━ [DEV EMAIL] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`From:    ${from}`)
    console.log(`To:      ${params.to}`)
    console.log(`Subject: ${params.subject}`)
    console.log(`ReplyTo: ${params.replyTo || '(none)'}`)
    console.log('─'.repeat(50))
    // Strip HTML tags for console readability
    const text = params.html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500)
    console.log(`Body:    ${text}${text.length >= 500 ? '...' : ''}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    return { sent: true, devMode: true }
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    })

    if (error) {
      console.error('[Email] Resend error:', error)
      return { sent: false, error: error.message, devMode: false }
    }

    return { sent: true, id: data?.id, devMode: false }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown email error'
    console.error('[Email] Send failed:', msg)
    return { sent: false, error: msg, devMode: false }
  }
}

// Convenience: check if email is configured (API key present)
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

// Convenience: check if we're using the Resend onboarding domain (testing only)
// vs a real verified custom domain (production).
export function isEmailInDevMode(): boolean {
  const from = process.env.RESEND_FROM_ADDRESS || ''
  return from.includes('onboarding@resend.dev')
}

// Convenience: get the from address (for display in Settings)
export function getFromAddress(): string {
  return process.env.RESEND_FROM_ADDRESS || 'Superboard <notifications@superboard.app>'
}
