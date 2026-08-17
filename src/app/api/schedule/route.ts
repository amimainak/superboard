import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/schedule — list tutor's schedule slots
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('ScheduleSlot')
      .select('*')
      .eq('tutorId', user.id)
      .order('dayOfWeek', { ascending: true })
      .order('startTime', { ascending: true })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('[GET /api/schedule]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/schedule — create a schedule slot
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { dayOfWeek, startTime, endTime, timezone } = body

    if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({ error: 'Invalid dayOfWeek (0-6)' }, { status: 400 })
    }
    if (!startTime || !endTime || typeof startTime !== 'string' || typeof endTime !== 'string') {
      return NextResponse.json({ error: 'startTime and endTime required (HH:MM)' }, { status: 400 })
    }
    if (endTime <= startTime) {
      return NextResponse.json({ error: 'endTime must be after startTime' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('ScheduleSlot')
      .insert({
        tutorId: user.id,
        dayOfWeek,
        startTime,
        endTime,
        timezone: timezone || 'UTC',
        isActive: true,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/schedule]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}