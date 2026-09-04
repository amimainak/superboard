import { NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/api-key'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    const auth = await requireApiKey(request)
    if ('response' in auth) return auth.response

    const { allowed } = rateLimit(`v1:rooms:read:${auth.userId}`, 60, 60_000)
    if (!allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const subject = searchParams.get('subject')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = { tutorId: auth.userId }
    if (status === 'active') where.isActive = true
    else if (status === 'ended') where.isActive = false
    if (subject) where.subject = subject.toUpperCase()

    const rooms = await db.room.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: { id: true, tutorId: true, subject: true, isActive: true, startedAt: true, endedAt: true, durationMinutes: true, brandingLogo: true, brandingColor: true, createdAt: true },
    })

    return NextResponse.json({
      rooms,
      pagination: { limit, offset, count: rooms.length },
    })
  } catch (err: unknown) {
    console.error('[GET /api/v1/rooms]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiKey(request)
    if ('response' in auth) return auth.response

    const { allowed } = rateLimit(`v1:rooms:write:${auth.userId}`, 20, 60_000)
    if (!allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const body = await request.json()
    const { subject = 'GENERAL', brandingLogo, brandingColor, durationMinutes } = body

    const validSubjects = ['GENERAL', 'MATH', 'SCIENCE', 'LANGUAGE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'ENGLISH']
    if (!validSubjects.includes(subject)) {
      return NextResponse.json({ error: `Invalid subject. Must be one of: ${validSubjects.join(', ')}` }, { status: 400 })
    }

    if (brandingLogo !== undefined && (typeof brandingLogo !== 'string' || !brandingLogo.startsWith('https://') || brandingLogo.length > 500)) {
      return NextResponse.json({ error: 'brandingLogo must be a URL starting with https:// and max 500 chars' }, { status: 400 })
    }
    if (brandingColor !== undefined && (typeof brandingColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(brandingColor))) {
      return NextResponse.json({ error: 'brandingColor must be a hex color like #ff0000' }, { status: 400 })
    }

    const room = await db.room.create({
      data: {
        tutorId: auth.userId,
        subject,
        brandingLogo: brandingLogo || null,
        brandingColor: brandingColor || null,
        durationMinutes: durationMinutes ?? 60,
        isActive: true,
        startedAt: new Date(),
      },
    })

    await db.boardPage.create({
      data: {
        roomId: room.id,
        pageIndex: 0,
        snapshot: { elements: [], camera: { x: 0, y: 0, zoom: 1 } },
      },
    })

    return NextResponse.json({ room }, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/v1/rooms]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
