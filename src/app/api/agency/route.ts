import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get agency info
    const agencyUser = await db.user.findUnique({
      where: { id: user.id },
      select: { agencyName: true, name: true, email: true, brandingColor: true, brandingLogoUrl: true },
    })

    // Get agency members (sub-tutors)
    const members = await db.agencyMember.findMany({
      where: { agencyId: user.id },
      include: { tutor: { select: { id: true, name: true, email: true, tier: true } } },
    })

    return NextResponse.json({
      agency: agencyUser,
      members: members.map(m => ({
        id: m.id,
        tutorId: m.tutorId,
        joinedAt: m.joinedAt,
        tutor: m.tutor,
      })),
    })
  } catch (err: unknown) {
    console.error('[GET /api/agency]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
