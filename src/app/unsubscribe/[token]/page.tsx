// ============================================================
// /unsubscribe/[token] — public one-click unsubscribe
// ============================================================
// Looks up the email by checking the token against all known
// addresses (Student.parentEmail, Student.email, User.email).
// If found, shows a confirmation page where the recipient can
// confirm unsubscribe. On confirm, adds to EmailSuppression.
//
// Public route — no auth. The token IS the auth.
// ============================================================

import { db } from '@/lib/db'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe-token'
import UnsubscribeClient from './UnsubscribeClient'

export const dynamic = 'force-dynamic'

async function findEmailByToken(token: string): Promise<string | null> {
  // Check Student.parentEmail, Student.email, and User.email
  // We have to scan since the token is a one-way HMAC.

  // 1. Students (parentEmail + email)
  const students = await db.student.findMany({
    where: {
      OR: [
        { parentEmail: { not: null } },
        // email is required on Student, but we check anyway
      ],
    },
    select: { email: true, parentEmail: true },
    take: 5000,  // safety cap
  })
  for (const s of students) {
    if (s.parentEmail && verifyUnsubscribeToken(s.parentEmail, token)) return s.parentEmail
    if (s.email && verifyUnsubscribeToken(s.email, token)) return s.email
  }

  // 2. Users (tutors)
  const users = await db.user.findMany({
    select: { email: true },
    take: 5000,
  })
  for (const u of users) {
    if (u.email && verifyUnsubscribeToken(u.email, token)) return u.email
  }

  return null
}

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // Basic shape check — HMAC-SHA256 hex = 64 chars
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return <UnsubscribeClient status="invalid" email={null} />
  }

  const email = await findEmailByToken(token)
  if (!email) {
    return <UnsubscribeClient status="invalid" email={null} />
  }

  // Check if already suppressed
  const existing = await db.emailSuppression.findUnique({
    where: { email_reason: { email, reason: 'unsubscribe' } },
    select: { createdAt: true },
  })
  if (existing) {
    return <UnsubscribeClient status="already" email={email} />
  }

  return <UnsubscribeClient status="confirm" email={email} token={token} />
}
