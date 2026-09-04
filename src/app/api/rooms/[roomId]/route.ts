import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { updateRoomSchema } from '@/lib/validations'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const room = await db.room.findUnique({ where: { id: roomId } })
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    if (room.tutorId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json(room)
  } catch (err: unknown) {
    console.error('[GET /api/rooms/[roomId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = updateRoomSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })

    // Ownership check — prevent IDOR
    const existing = await db.room.findUnique({ where: { id: roomId }, select: { tutorId: true } })
    if (!existing) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    if (existing.tutorId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const updates: Record<string, unknown> = { ...parsed.data }
    if (updates.isActive === false && !updates.endedAt) {
      updates.endedAt = new Date()
    }

    const room = await db.room.update({
      where: { id: roomId },
      data: updates,
    })
    return NextResponse.json(room)
  } catch (err: unknown) {
    console.error('[PATCH /api/rooms/[roomId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Ownership check — prevent IDOR
    const existing = await db.room.findUnique({ where: { id: roomId }, select: { tutorId: true } })
    if (!existing) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    if (existing.tutorId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await db.room.update({
      where: { id: roomId },
      data: { isActive: false, endedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[DELETE /api/rooms/[roomId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
