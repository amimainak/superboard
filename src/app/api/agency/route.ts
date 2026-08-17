import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

// GET: List agency members (agencyId = user's id)
export async function GET(_request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Get agency name from User record
    const { data: agencyOwner } = await sb
      .from('User')
      .select('agencyName, name, email')
      .eq('id', user.id)
      .single()

    // Get members (tutors in this agency)
    const { data: members, error: membersError } = await sb
      .from('AgencyMember')
      .select(`
        id,
        tutorId,
        joinedAt,
        tutor:User!inner(id, name, email, tier, createdAt)
      `)
      .eq('agencyId', user.id)
      .order('joinedAt', { ascending: true })

    if (membersError) throw membersError

    // Count sessions per member
    const tutorIds = [user.id, ...(members || []).map((m: any) => m.tutorId)]
    const { data: sessionCounts } = await sb
      .from('Room')
      .select('tutorId')
      .in('tutorId', tutorIds)

    const countMap: Record<string, number> = {}
    for (const row of sessionCounts || []) {
      countMap[row.tutorId] = (countMap[row.tutorId] || 0) + 1
    }

    // Get pending invites
    const { data: invites, error: invitesError } = await sb
      .from('AgencyInvite')
      .select('*')
      .eq('agencyId', user.id)
      .eq('status', 'pending')
      .order('createdAt', { ascending: false })

    if (invitesError) throw invitesError

    // Build member list with owner included
    const memberList = [
      {
        id: 'owner',
        tutorId: user.id,
        name: agencyOwner?.name || agencyOwner?.email?.split('@')[0] || 'Agency Owner',
        email: agencyOwner?.email,
        role: 'Owner',
        sessions: countMap[user.id] || 0,
        joinedAt: agencyOwner?.createdAt || new Date().toISOString(),
        isActive: true,
      },
      ...(members || []).map((m: any) => ({
        id: m.id,
        tutorId: m.tutorId,
        name: m.tutor?.name || m.tutor?.email?.split('@')[0] || 'Unknown',
        email: m.tutor?.email,
        role: 'Tutor',
        sessions: countMap[m.tutorId] || 0,
        joinedAt: m.joinedAt,
        isActive: true,
      })),
    ]

    return NextResponse.json({
      agency: {
        id: user.id,
        name: agencyOwner?.agencyName || agencyOwner?.name || 'My Agency',
      },
      members: memberList,
      invites: invites || [],
    })
  } catch (err: unknown) {
    console.error('[GET /api/agency]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Invite a tutor to the agency
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit: 20 invites per hour
    const { allowed } = rateLimit(`agency-invite:${user.id}`, 20, 3600_000)
    if (!allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Check if user is agency tier
    const { data: ownerUser } = await sb
      .from('User')
      .select('tier, agencyName')
      .eq('id', user.id)
      .single()

    if (!ownerUser || ownerUser.tier !== 'AGENCY') {
      return NextResponse.json({ error: 'Agency tier required' }, { status: 403 })
    }

    // Generate a short invite code
    const code = Math.random().toString(36).substring(2, 8)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

    const { data: invite, error } = await sb
      .from('AgencyInvite')
      .insert({
        agencyId: user.id,
        code,
        invitedEmail: email,
        status: 'pending',
        expiresAt,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      ...invite,
      inviteLink: `/join/${code}`,
    }, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/agency]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove a member or revoke an invite
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const inviteId = searchParams.get('inviteId')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    if (inviteId) {
      // Revoke an invite
      const { error } = await sb
        .from('AgencyInvite')
        .update({ status: 'revoked' })
        .eq('id', inviteId)
        .eq('agencyId', user.id)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (memberId) {
      // Remove a member
      const { error } = await sb
        .from('AgencyMember')
        .delete()
        .eq('id', memberId)
        .eq('agencyId', user.id)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Provide memberId or inviteId' }, { status: 400 })
  } catch (err: unknown) {
    console.error('[DELETE /api/agency]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
