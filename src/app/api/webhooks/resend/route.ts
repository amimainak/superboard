// ============================================================
// API: Resend Webhook — bounce + complaint processing
// ============================================================
// POST  /api/webhooks/resend
//   Receives Resend webhook events for email delivery failures.
//   Adds bounced/complained addresses to EmailSuppression so we
//   never send to them again.
//
//   Security: protected by RESEND_WEBHOOK_SECRET — Resend sends this
//   in the authorization header. Without it, the endpoint rejects.
//
//   Events we handle:
//     • email.bounced → suppress (reason: bounce)
//     • email.complained → suppress (reason: complaint)
//     • email.delivered → log only (no action)
//     • email.sent → log only
//
//   We don't handle soft bounces — Resend retries those automatically.
//   Only hard bounces (permanent failures) trigger the webhook.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { suppressEmail } from '@/lib/email/suppression'

export async function POST(request: NextRequest) {
  // Auth: secret header
  const authHeader = request.headers.get('authorization')
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Resend Webhook] RESEND_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }
  const provided = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  if (provided !== webhookSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    // Resend webhook payload shape:
    // {
    //   "type": "email.bounced" | "email.complained" | "email.delivered" | ...,
    //   "data": {
    //     "email_id": "...",
    //     "to": ["recipient@example.com"],
    //     ...
    //   }
    // }
    const eventType: string = body.type || ''
    const data = body.data || {}
    const recipients: string[] = data.to || (data.email ? [data.email] : [])

    console.log(`[Resend Webhook] Event: ${eventType}, recipients: ${recipients.join(', ')}`)

    if (eventType === 'email.bounced') {
      for (const email of recipients) {
        await suppressEmail(email, 'bounce', 'resend', body)
      }
      console.log(`[Resend Webhook] Suppressed ${recipients.length} address(es) for bounce`)
    } else if (eventType === 'email.complained') {
      for (const email of recipients) {
        await suppressEmail(email, 'complaint', 'resend', body)
      }
      console.log(`[Resend Webhook] Suppressed ${recipients.length} address(es) for complaint`)
    }
    // Other events (delivered, sent, opened, clicked) — no action needed

    return NextResponse.json({ received: true, eventType })
  } catch (error) {
    console.error('[Resend Webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// GET — health check (so Vercel's cron doesn't flag it as dead)
export async function GET() {
  return NextResponse.json({ ok: true, service: 'resend-webhook' })
}
