// ============================================================
// API: Send Test Email — lets the tutor verify email is working
// ============================================================
// POST  /api/user/test-email
//   Sends a test email to the tutor's own address. Bypasses the
//   suppression list (so the tutor can test even if they previously
//   unsubscribed). Rate-limited to 1 per minute.
//
//   Used by the Settings → Notifications panel so the tutor can
//   confirm the moment their custom domain goes live.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { sendEmail, isEmailInDevMode, getFromAddress } from '@/lib/email/client'
import { testEmail } from '@/lib/email/templates'

// In-memory rate limit (per user, 1/min) — simple and sufficient
const _lastSent = new Map<string, number>()

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId

    // Rate limit
    const now = Date.now()
    const last = _lastSent.get(userId) ?? 0
    if (now - last < 60_000) {
      return NextResponse.json(
        { error: 'Please wait a minute before sending another test email.' },
        { status: 429 }
      )
    }
    _lastSent.set(userId, now)

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    })
    if (!user?.email) {
      return NextResponse.json({ error: 'No email on file' }, { status: 400 })
    }

    const content = testEmail({
      tutorName: user.name || user.email,
      recipientEmail: user.email,
    })

    const result = await sendEmail({
      to: user.email,
      subject: content.subject,
      html: content.html,
      bypassSuppression: true,  // tutor can test even if suppressed
    })

    if (!result.sent) {
      return NextResponse.json({
        error: 'Failed to send',
        details: result.error,
        devMode: result.devMode,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sentTo: user.email,
      devMode: result.devMode,
      fromAddress: getFromAddress(),
      isDevMode: isEmailInDevMode(),
    })
  } catch (error) {
    console.error('[Test Email POST]', error)
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 })
  }
}
