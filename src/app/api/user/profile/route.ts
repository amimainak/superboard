import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, email: true, name: true, tier: true, isAdmin: true,
        brandingLogoUrl: true, brandingColor: true, agencyName: true,
        parentAgencyId: true, installedWidgets: true,
      },
    })

    if (!profile) {
      // Auto-create profile if missing
      const created = await db.user.create({
        data: { id: user.id, email: user.email ?? '', tier: 'FREE' },
      })
      return NextResponse.json(created)
    }

    return NextResponse.json(profile)
  } catch (err: unknown) {
    console.error('[GET /api/user/profile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    // Whitelist allowed fields
    const allowedFields = ['name', 'brandingLogoUrl', 'brandingColor', 'agencyName', 'displayName']
    const updates: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: updates,
    })
    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('[PATCH /api/user/profile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
