// ============================================================
// API: Board Events — log + fetch for replay (F-13)
// ============================================================
// POST  /api/rooms/[roomId]/events
//   Body: { events: [{ pageIndex, eventType, elementId, elementData? }] }
//   Batch-logs board events for replay. Called by the whiteboard
//   client on every element add/update/remove (debounced).
//
// GET   /api/rooms/[roomId]/events?since=<iso>
//   Returns all events for this room since the given timestamp
//   (or all events if no `since` param). Used by the replay component.
//
// Access: room tutor or participant.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

type RouteContext = { params: Promise<{ roomId: string }> }

const batchSchema = z.object({
  events: z.array(z.object({
    pageIndex: z.number().int().min(0),
    eventType: z.enum(['add', 'update', 'remove']),
    elementId: z.string().min(1),
    elementData: z.unknown().optional(),
  })).max(500),  // cap per batch
})

// ----------------------------------------------------------------
// POST — log events
// ----------------------------------------------------------------
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId
    const { roomId } = await context.params

    // Verify access — tutor or participant
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { tutorId: true },
    })
    if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isOwner = room.tutorId === userId
    const isParticipant = !isOwner && await db.roomParticipant.findFirst({
      where: { roomId, studentId: userId },
    }).then(p => !!p)

    if (!isOwner && !isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = batchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid', details: parsed.error.flatten() }, { status: 400 })
    }

    // Batch insert — cast to any because Prisma's JsonValue typing
    // doesn't accept our zod-validated `unknown` without explicit casts
    const now = new Date()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records = parsed.data.events.map(e => ({
      roomId,
      pageIndex: e.pageIndex,
      eventType: e.eventType,
      elementId: e.elementId,
      elementData: e.elementData ?? null,
      timestamp: now,
    })) as any[]

    await db.boardEvent.createMany({ data: records })

    return NextResponse.json({ logged: parsed.data.events.length })
  } catch (error) {
    console.error('[Board Events POST]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// ----------------------------------------------------------------
// GET — fetch events for replay
// ----------------------------------------------------------------
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId
    const { roomId } = await context.params

    // Verify access
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { tutorId: true },
    })
    if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isOwner = room.tutorId === userId
    const isParticipant = !isOwner && await db.roomParticipant.findFirst({
      where: { roomId, studentId: userId },
    }).then(p => !!p)

    if (!isOwner && !isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Optional `since` filter
    const since = new URL(request.url).searchParams.get('since')
    const where: Record<string, unknown> = { roomId }
    if (since) {
      where.timestamp = { gt: new Date(since) }
    }

    const events = await db.boardEvent.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: 5000,  // cap
      select: {
        id: true,
        pageIndex: true,
        eventType: true,
        elementId: true,
        elementData: true,
        timestamp: true,
      },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('[Board Events GET]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
