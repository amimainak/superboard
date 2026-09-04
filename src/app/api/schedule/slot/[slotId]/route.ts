import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { slotId } = await params
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.dayOfWeek !== undefined) {
      if (body.dayOfWeek < 0 || body.dayOfWeek > 6) return NextResponse.json({ error: 'Invalid dayOfWeek (0-6)' }, { status: 400 })
      updates.dayOfWeek = body.dayOfWeek
    }
    if (body.startTime !== undefined) updates.startTime = body.startTime
    if (body.endTime !== undefined) updates.endTime = body.endTime
    if (body.timezone !== undefined) updates.timezone = body.timezone
    if (body.isActive !== undefined) updates.isActive = body.isActive

    if (updates.startTime && updates.endTime && updates.endTime <= updates.startTime) {
      return NextResponse.json({ error: 'endTime must be after startTime' }, { status: 400 })
    }

    const slot = await db.scheduleSlot.updateMany({
      where: { id: slotId, tutorId: user.id },
      data: updates,
    })
    if (slot.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await db.scheduleSlot.findUnique({ where: { id: slotId } })
    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('[PATCH /api/schedule/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { slotId } = await params
    await db.scheduleSlot.deleteMany({ where: { id: slotId, tutorId: user.id } })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[DELETE /api/schedule/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
