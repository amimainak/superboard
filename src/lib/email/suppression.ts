// ============================================================
// Email Suppression — check + add addresses to the do-not-send list
// ============================================================
// Used by:
//   • sendEmail() — checks before every send, skips if suppressed
//   • /api/webhooks/resend — adds bounces + complaints
//   • /unsubscribe/[token] — adds manual unsubscribes
//   • Tutor settings — can manually suppress their own address
// ============================================================

import { db } from '@/lib/db'

export type SuppressionReason = 'bounce' | 'complaint' | 'unsubscribe'

/**
 * Check if an email address is suppressed (should not receive email).
 * Returns the reason if suppressed, null if safe to send.
 */
export async function isSuppressed(email: string): Promise<SuppressionReason | null> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null

  const entry = await db.emailSuppression.findFirst({
    where: { email: normalized },
    select: { reason: true },
  })
  return (entry?.reason as SuppressionReason | undefined) ?? null
}

/**
 * Add an email to the suppression list. Idempotent — if already
 * suppressed for this reason, does nothing.
 */
export async function suppressEmail(
  email: string,
  reason: SuppressionReason,
  source: string = 'manual',
  eventDetails?: unknown,
): Promise<void> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return

  try {
    await db.emailSuppression.upsert({
      where: {
        email_reason: { email: normalized, reason },
      },
      update: {
        source,
        ...(eventDetails ? { eventDetails: eventDetails as object } : {}),
      },
      create: {
        email: normalized,
        reason,
        source,
        ...(eventDetails ? { eventDetails: eventDetails as object } : {}),
      },
    })
  } catch (e) {
    // Race condition (concurrent upserts) — the unique constraint catches
    // it. Already suppressed, which is what we wanted.
    console.warn('[suppressEmail] upsert race (likely fine):', e instanceof Error ? e.message : e)
  }
}

/**
 * Remove an email from the suppression list (for a specific reason or all).
 * Used when a tutor manually re-enables notifications, or when a bounce
 * was temporary and the parent confirms their address is fixed.
 */
export async function unsuppressEmail(email: string, reason?: SuppressionReason): Promise<void> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return

  if (reason) {
    await db.emailSuppression.deleteMany({
      where: { email: normalized, reason },
    })
  } else {
    await db.emailSuppression.deleteMany({
      where: { email: normalized },
    })
  }
}
