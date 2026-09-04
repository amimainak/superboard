import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createRoomSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const subject = searchParams.get('subject')

    const where: Record<string, unknown> = { tutorId: user.id }
    if (status) where.isActive = status === 'active'
    if (subject) where.subject = subject

    const rooms = await db.room.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { pages: true } } },
    })

    return NextResponse.json(rooms)
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
    const parsed = createRoomSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })

    const { subject, brandingLogo, brandingColor } = parsed.data

    // Ensure User record exists (auto-create on first room creation)
    await db.user.upsert({
      where: { id: user.id },
      create: { id: user.id, email: user.email ?? '', tier: 'FREE' },
      update: {},
    })

    // Create room + first board page in a transaction
    const room = await db.$transaction(async (tx) => {
      const r = await tx.room.create({
        data: {
          tutorId: user.id,
          subject,
          brandingLogo: brandingLogo || null,
          brandingColor: brandingColor || null,
          isActive: true,
          startedAt: new Date(),
        },
      })
      await tx.boardPage.create({
        data: {
          roomId: r.id,
          pageIndex: 0,
          snapshot: { elements: [], camera: { x: 0, y: 0, zoom: 1 } } as unknown as object,
        },
      })
      return r
    })

    return NextResponse.json(room, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/rooms]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
