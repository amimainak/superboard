import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseBody, updateRoomSchema } from '@/lib/validations'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('Room')
      .select('*')
      .eq('id', roomId)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    if (data.tutorId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json(data)
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
    const { data: parsed, error: parseError } = parseBody(updateRoomSchema, body)
    if (parseError || !parsed) return NextResponse.json({ error: parseError || 'Invalid body' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = { ...parsed }
    if (updates.isActive === false && !updates.endedAt) {
      updates.endedAt = new Date().toISOString()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('Room')
      .update(updates)
      .eq('id', roomId)
      .eq('tutorId', user.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
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

    await (supabase as any)
      .from('Room')
      .update({ isActive: false, endedAt: new Date().toISOString() })
      .eq('id', roomId)
      .eq('tutorId', user.id)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[DELETE /api/rooms/[roomId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
