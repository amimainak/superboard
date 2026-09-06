// ============================================================
// API: Email Status — for the Settings → Notifications panel
// ============================================================
// GET  /api/user/email-status
//   Returns whether email is configured, whether we're in dev mode
//   (onboarding@resend.dev) or production mode (custom domain),
//   and the from address. Lets the UI show a status indicator.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { isEmailConfigured, isEmailInDevMode, getFromAddress } from '@/lib/email/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    return NextResponse.json({
      configured: isEmailConfigured(),
      devMode: isEmailInDevMode(),
      fromAddress: getFromAddress(),
      // Extract just the domain for display
      domain: extractDomain(getFromAddress()),
    })
  } catch (error) {
    console.error('[Email Status GET]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

function extractDomain(fromAddress: string): string {
  // Parse "Name <user@domain>" or "user@domain"
  const match = fromAddress.match(/@([^>]+)/)
  return match ? match[1] : 'unknown'
}
