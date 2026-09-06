// ============================================================
// API: Unsubscribe — confirm unsubscribe from email
// ============================================================
// POST  /api/unsubscribe
//   Body: { token: string }
//
//   Public endpoint (no auth — the token IS the auth). Looks up
//   the email by verifying the token against known addresses,
//   then adds to EmailSuppression with reason 'unsubscribe'.
//
//   This is the action behind the /unsubscribe/[token] page.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe-token'
import { suppressEmail } from '@/lib/email/suppression'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token: string = body.token
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Find the email by checking the token against known addresses
    let foundEmail: string | null = null

    // Check students (parentEmail + email)
    const students = await db.student.findMany({
      select: { email: true, parentEmail: true },
      take: 5000,
    })
    for (const s of students) {
      if (s.parentEmail && verifyUnsubscribeToken(s.parentEmail, token)) {
        foundEmail = s.parentEmail
        break
      }
      if (s.email && verifyUnsubscribeToken(s.email, token)) {
        foundEmail = s.email
        break
      }
    }

    // Check users (tutors)
    if (!foundEmail) {
      const users = await db.user.findUnique({
        where: { email: '' },  // placeholder — we'll scan if needed
        select: { email: true },
      }).catch(() => null)

      // If the simple lookup doesn't work, scan (rare case)
      if (!foundEmail) {
        const allUsers = await db.user.findMany({
          select: { email: true },
          take: 5000,
        })
        for (const u of allUsers) {
          if (u.email && verifyUnsubscribeToken(u.email, token)) {
            foundEmail = u.email
            break
          }
        }
      }
    }

    if (!foundEmail) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    // Suppress
    await suppressEmail(foundEmail, 'unsubscribe', 'unsubscribe-link')

    return NextResponse.json({ success: true, email: foundEmail })
  } catch (error) {
    console.error('[Unsubscribe POST]', error)
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}
