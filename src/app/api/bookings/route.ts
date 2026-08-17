import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/bookings — list bookings (tutor sees own, parent sees own)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Get tutor bookings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tutorBookings, error: err1 } = await sb
      .from('Booking')
      .select('*')
      .eq('tutorId', user.id)
      .order('bookingDate', { ascending: true })
      .order('startTime', { ascending: true })

    if (err1) throw err1

    return NextResponse.json(tutorBookings)
  } catch (err: unknown) {
    console.error('[GET /api/bookings]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/bookings — create a booking
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { studentName, studentEmail, slotId, bookingDate, startTime, endTime, notes, roomId } = body

    if (!studentName || typeof studentName !== 'string' || studentName.trim().length === 0) {
      return NextResponse.json({ error: 'studentName is required' }, { status: 400 })
    }
    if (!slotId || !bookingDate || !startTime || !endTime) {
      return NextResponse.json({ error: 'slotId, bookingDate, startTime, endTime are required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('Booking')
      .insert({
        tutorId: user.id,
        studentName: studentName.trim(),
        studentEmail: studentEmail || null,
        slotId,
        bookingDate,
        startTime,
        endTime,
        notes: notes || null,
        roomId: roomId || null,
        status: 'upcoming',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/bookings]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
