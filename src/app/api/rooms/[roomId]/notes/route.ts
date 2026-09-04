import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { roomId } = await params
    const hasAccess = await checkRoomAccess(auth.userId, roomId)
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const note = await db.lessonNote.findFirst({
      where: { roomId },
    })

    return NextResponse.json({
      content: note?.content || '',
      updatedAt: note?.updatedAt?.toISOString() || null,
    })
  } catch (err: unknown) {
    console.error('[GET /api/rooms/[roomId]/notes]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { roomId } = await params
    const hasAccess = await checkRoomAccess(auth.userId, roomId)
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { content } = body

    if (typeof content !== 'string') return NextResponse.json({ error: 'Content must be a string' }, { status: 400 })
    if (content.length > 500_000) return NextResponse.json({ error: 'Content too large' }, { status: 413 })

    const existing = await db.lessonNote.findFirst({ where: { roomId } })
    const now = new Date()

    if (existing) {
      await db.lessonNote.update({ where: { id: existing.id }, data: { content, updatedAt: now } })
    } else {
      await db.lessonNote.create({ data: { roomId, content, tutorId: auth.userId } })
    }

    return NextResponse.json({ success: true, updatedAt: now.toISOString() })
  } catch (err: unknown) {
    console.error('[PUT /api/rooms/[roomId]/notes]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function checkRoomAccess(userId: string, roomId: string): Promise<boolean> {
  const room = await db.room.findUnique({ where: { id: roomId }, select: { tutorId: true, isActive: true } })
  if (!room || !room.isActive) return false
  if (room.tutorId === userId) return true
  const participant = await db.roomParticipant.findUnique({
    where: { roomId_studentIdentity: { roomId, studentIdentity: userId } },
  }).catch(() => null)
  if (participant) return true
  const tutor = await db.user.findUnique({ where: { id: room.tutorId }, select: { parentAgencyId: true } })
  if (tutor?.parentAgencyId === userId) return true
  return false
}
