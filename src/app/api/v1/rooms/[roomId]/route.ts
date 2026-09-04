import { NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/api-key'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await requireApiKey(_request)
    if ('response' in auth) return auth.response

    const { allowed } = rateLimit(`v1:room:read:${auth.userId}`, 60, 60_000)
    if (!allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const { roomId } = await params
    const room = await db.room.findFirst({
      where: { id: roomId, tutorId: auth.userId },
      select: { id: true, tutorId: true, subject: true, isActive: true, startedAt: true, endedAt: true, durationMinutes: true, brandingLogo: true, brandingColor: true, createdAt: true },
    })

    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    const pageCount = await db.boardPage.count({ where: { roomId } })

    return NextResponse.json({
      ...room,
      pageCount,
      whiteboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://superboard.app'}/room/${roomId}`,
    })
  } catch (err: unknown) {
    console.error('[GET /api/v1/rooms/[roomId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await requireApiKey(request)
    if ('response' in auth) return auth.response

    const { allowed } = rateLimit(`v1:room:write:${auth.userId}`, 20, 60_000)
    if (!allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const { roomId } = await params
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.subject !== undefined) {
      const validSubjects = ['GENERAL', 'MATH', 'SCIENCE', 'LANGUAGE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'ENGLISH']
      if (!validSubjects.includes(body.subject)) return NextResponse.json({ error: `Invalid subject: ${body.subject}` }, { status: 400 })
      updates.subject = body.subject
    }
    if (body.isActive !== undefined) {
      updates.isActive = body.isActive
      if (body.isActive === false) updates.endedAt = new Date()
    }
    if (body.durationMinutes !== undefined) {
      const mins = Number(body.durationMinutes)
      if (!Number.isInteger(mins) || mins < 0 || mins > 480) return NextResponse.json({ error: 'durationMinutes must be 0-480' }, { status: 400 })
      updates.durationMinutes = mins
    }
    if (body.brandingColor !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(body.brandingColor)) return NextResponse.json({ error: 'Invalid color' }, { status: 400 })
      updates.brandingColor = body.brandingColor
    }
    if (body.brandingLogo !== undefined) updates.brandingLogo = body.brandingLogo

    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })

    const result = await db.room.updateMany({ where: { id: roomId, tutorId: auth.userId }, data: updates })
    if (result.count === 0) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    const room = await db.room.findUnique({ where: { id: roomId } })
    return NextResponse.json({ room })
  } catch (err: unknown) {
    console.error('[PATCH /api/v1/rooms/[roomId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
