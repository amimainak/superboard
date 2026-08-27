import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH /api/schedule/[slotId] — update a schedule slot
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
      if (body.dayOfWeek < 0 || body.dayOfWeek > 6) {
        return NextResponse.json({ error: 'Invalid dayOfWeek (0-6)' }, { status: 400 })
      }
      updates.dayOfWeek = body.dayOfWeek
    }
    if (body.startTime !== undefined) updates.startTime = body.startTime
    if (body.endTime !== undefined) updates.endTime = body.endTime
    if (body.timezone !== undefined) updates.timezone = body.timezone
    if (body.isActive !== undefined) updates.isActive = body.isActive

    if (updates.startTime && updates.endTime && updates.endTime <= updates.startTime) {
      return NextResponse.json({ error: 'endTime must be after startTime' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('ScheduleSlot')
      .update(updates)
      .eq('id', slotId)
      .eq('tutorId', user.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('[PATCH /api/schedule/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/schedule/[slotId] — remove a schedule slot
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { slotId } = await params

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('ScheduleSlot')
      .delete()
      .eq('id', slotId)
      .eq('tutorId', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[DELETE /api/schedule/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
