// ============================================================
// /join/[token] — Student join page (server component)
// ============================================================
// Validates the token exists and the student is active, then
// renders the client component which:
//   • Calls POST /api/room/join-by-token
//   • On success → redirects to /room/[roomId]
//   • On NO_ACTIVE_LESSON → shows waiting screen with retry
//   • On INVALID_LINK / ACCOUNT_PAUSED → shows the matching error
//
// F-09: Loads the tutor's branding (logo, display name, color) so
// the join page shows the tutor's brand, not generic Superboard.
//
// The token is checked once on the server (so we can render a
// proper error page for bots and curl), then again on the client
// when the student clicks "Try again" or the auto-retry fires.
// ============================================================

import { db } from '@/lib/db'
import { getBranding, type BrandingConfig } from '@/lib/branding'
import JoinClient from './JoinClient'

export const dynamic = 'force-dynamic'

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // Basic shape check — token is 64 hex chars
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return <JoinClient initialStatus="INVALID_LINK" studentName={null} branding={null} />
  }

  const student = await db.student.findUnique({
    where: { joinToken: token },
    select: { id: true, name: true, isActive: true, agencyId: true },
  })

  if (!student) {
    return <JoinClient initialStatus="INVALID_LINK" studentName={null} branding={null} />
  }

  if (!student.isActive) {
    const branding = await getBranding(student.agencyId)
    return <JoinClient initialStatus="ACCOUNT_PAUSED" studentName={student.name} branding={branding} />
  }

  // Load branding for the tutor who owns this student
  const branding = await getBranding(student.agencyId)

  // Token is valid and student is active — the client component
  // will attempt the room join and either redirect or show the
  // waiting screen.
  return <JoinClient initialStatus="LINK_VALID" studentName={student.name} token={token} branding={branding} />
}

