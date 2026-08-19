import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseBody, createRoomSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const subject = searchParams.get('subject')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    let query = sb
      .from('Room')
      .select('*, pages:BoardPage(count)')
      .eq('tutorId', user.id)
      .order('createdAt', { ascending: false })

    if (status) query = query.eq('isActive', status === 'active')
    if (subject) query = query.eq('subject', subject)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('[GET /api/rooms]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit: 10 room creations per minute per user
    const { allowed } = rateLimit(`rooms:${user.id}`, 10, 60_000)
    if (!allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const body = await request.json()
    const { data: parsed, error: parseError } = parseBody(createRoomSchema, body)
    if (parseError || !parsed) return NextResponse.json({ error: parseError || 'Invalid body' }, { status: 400 })

    const { subject, brandingLogo, brandingColor } = parsed

    // Ensure User record exists (auto-create on first room creation)
    // Only insert if missing — never overwrite existing tier/isAdmin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    await sb.from('User').upsert(
      { id: user.id, email: user.email ?? '' },
      { onConflict: 'id', defaultToNull: false, ignoreDuplicates: true }
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('Room')
      .insert({
        tutorId: user.id,
        subject,
        brandingLogo,
        brandingColor,
        isActive: true,
        startedAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    await (supabase as any).from('BoardPage').insert({
      roomId: data.id,
      pageIndex: 0,
      snapshot: { elements: [], camera: { x: 0, y: 0, zoom: 1 } },
    })

    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/rooms]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
