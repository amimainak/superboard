import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const widgetKind = searchParams.get('widgetKind')

    if (!roomId) return NextResponse.json({ error: 'roomId is required' }, { status: 400 })

    // Verify room access
    const room = await db.room.findUnique({ where: { id: roomId }, select: { tutorId: true } })
    const isTutor = room?.tutorId === auth.userId
    if (!isTutor) {
      const participant = await db.roomParticipant.findFirst({
        where: { roomId, userId: auth.userId },
      }).catch(() => null)
      if (!participant) return NextResponse.json({ error: 'You do not have access to this room' }, { status: 403 })
    }

    const where: Record<string, unknown> = { roomId }
    if (widgetKind) where.widgetKind = widgetKind

    const mastery = await db.studentMastery.findMany({ where })
    return NextResponse.json({ mastery })
  } catch (err: unknown) {
    console.error('[GET /api/lang/mastery]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { roomId, widgetKind, questionId, correct } = body

    if (!roomId || !widgetKind || correct === undefined) {
      return NextResponse.json({ error: 'roomId, widgetKind, and correct are required' }, { status: 400 })
    }
    if (typeof correct !== 'boolean') return NextResponse.json({ error: 'correct must be a boolean' }, { status: 400 })

    await db.studentMastery.create({
      data: {
        userId: auth.userId,
        roomId,
        widgetKind,
        questionId: questionId || null,
        correct,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[POST /api/lang/mastery]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    if (!roomId) return NextResponse.json({ error: 'roomId is required' }, { status: 400 })

    // Verify room access
    const room = await db.room.findUnique({ where: { id: roomId }, select: { tutorId: true } })
    const isTutor = room?.tutorId === auth.userId
    if (!isTutor) {
      const participant = await db.roomParticipant.findFirst({
        where: { roomId, userId: auth.userId },
      }).catch(() => null)
      if (!participant) return NextResponse.json({ error: 'You do not have access to this room' }, { status: 403 })
    }

    await db.studentMastery.deleteMany({ where: { roomId } })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[DELETE /api/lang/mastery]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
