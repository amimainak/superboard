import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const bookings = await db.booking.findMany({
      where: { tutorId: user.id },
      orderBy: { bookingDate: 'desc' },
    })
    return NextResponse.json(bookings)
  } catch (err: unknown) {
    console.error('[GET /api/bookings]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const booking = await db.booking.create({
      data: {
        tutorId: user.id,
        studentName: body.studentName || '',
        studentEmail: body.studentEmail || null,
        slotId: body.slotId,
        bookingDate: new Date(body.bookingDate),
        startTime: body.startTime,
        endTime: body.endTime,
        status: body.status || 'pending',
        notes: body.notes || null,
      },
    })
    return NextResponse.json(booking, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/bookings]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
