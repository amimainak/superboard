import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

// GET: Get invite details by code
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const authCheck = await requireAuth(_request)
  if (authCheck instanceof NextResponse) return authCheck
  try {
    const { code } = await params
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const { data: invite, error } = await sb
      .from('AgencyInvite')
      .select(`
        id,
        code,
        invitedEmail,
        status,
        expiresAt,
        createdAt,
        agency:User!inner(id, name, agencyName, email)
      `)
      .eq('code', code)
      .single()

    if (error || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    // Check expiry
    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
    }

    // Check status
    if (invite.status !== 'pending') {
      return NextResponse.json({ error: `Invite already ${invite.status}` }, { status: 400 })
    }

    return NextResponse.json({
      id: invite.id,
      code: invite.code,
      invitedEmail: invite.invitedEmail,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
      agency: {
        id: invite.agency?.id,
        name: invite.agency?.agencyName || invite.agency?.name || 'Unnamed Agency',
      },
    })
  } catch (err: unknown) {
    console.error('[GET /api/agency/invite/[code]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Accept invite — insert into AgencyMember, update AgencyInvite status
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Fetch the invite
    const { data: invite, error: inviteError } = await sb
      .from('AgencyInvite')
      .select('*')
      .eq('code', code)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    // Check status
    if (invite.status !== 'pending') {
      return NextResponse.json({ error: `Invite already ${invite.status}` }, { status: 400 })
    }

    // Check expiry
    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
    }

    // CRITICAL: Verify the invite was sent to this user's email
    if (invite.invitedEmail && user.email && user.email.toLowerCase() !== invite.invitedEmail.toLowerCase()) {
      return NextResponse.json({ error: 'This invite was sent to a different email address' }, { status: 403 })
    }

    // Update user's parentAgencyId
    await sb
      .from('User')
      .update({ parentAgencyId: invite.agencyId })
      .eq('id', user.id)

    // Insert into AgencyMember
    const { error: memberError } = await sb
      .from('AgencyMember')
      .insert({
        agencyId: invite.agencyId,
        tutorId: user.id,
      })

    if (memberError) {
      // Possibly already a member
      if (memberError.code === '23505') {
        return NextResponse.json({ error: 'Already a member of this agency' }, { status: 409 })
      }
      throw memberError
    }

    // Update invite status
    await sb
      .from('AgencyInvite')
      .update({ status: 'accepted', recipientId: user.id })
      .eq('id', invite.id)

    return NextResponse.json({ success: true, agencyId: invite.agencyId })
  } catch (err: unknown) {
    console.error('[POST /api/agency/invite/[code]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
