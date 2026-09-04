import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const authCheck = await requireAuth(_request)
  if (authCheck instanceof NextResponse) return authCheck
  try {
    const { code } = await params
    const invite = await db.agencyInvite.findUnique({
      where: { code },
      select: { id: true, code: true, invitedEmail: true, status: true, expiresAt: true, createdAt: true },
    })

    if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    if (new Date(invite.expiresAt) < new Date()) return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
    if (invite.status !== 'pending') return NextResponse.json({ error: `Invite already ${invite.status}` }, { status: 400 })

    if (invite.invitedEmail && authCheck.email && authCheck.email.toLowerCase() !== invite.invitedEmail.toLowerCase()) {
      return NextResponse.json({ error: 'You do not have access to this invite' }, { status: 403 })
    }

    return NextResponse.json(invite)
  } catch (err: unknown) {
    console.error('[GET /api/agency/invite/[code]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const invite = await db.agencyInvite.findUnique({ where: { code } })
    if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    if (invite.status !== 'pending') return NextResponse.json({ error: `Invite already ${invite.status}` }, { status: 400 })
    if (new Date(invite.expiresAt) < new Date()) return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
    if (invite.invitedEmail && user.email && user.email.toLowerCase() !== invite.invitedEmail.toLowerCase()) {
      return NextResponse.json({ error: 'This invite was sent to a different email address' }, { status: 403 })
    }

    // Update user's parentAgencyId
    await db.user.update({ where: { id: user.id }, data: { parentAgencyId: invite.agencyId } })

    // Insert into AgencyMember (handle duplicate)
    try {
      await db.agencyMember.create({ data: { agencyId: invite.agencyId, tutorId: user.id } })
    } catch (e) {
      if (String(e).includes('Unique constraint')) {
        return NextResponse.json({ error: 'Already a member of this agency' }, { status: 409 })
      }
      throw e
    }

    // Update invite status
    await db.agencyInvite.update({ where: { id: invite.id }, data: { status: 'accepted', recipientId: user.id } })

    return NextResponse.json({ success: true, agencyId: invite.agencyId })
  } catch (err: unknown) {
    console.error('[POST /api/agency/invite/[code]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
