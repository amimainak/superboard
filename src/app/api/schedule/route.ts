import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const slots = await db.scheduleSlot.findMany({
      where: { tutorId: user.id, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
    })
    return NextResponse.json(slots)
  } catch (err: unknown) {
    console.error('[GET /api/schedule]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const slot = await db.scheduleSlot.create({
      data: {
        tutorId: user.id,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        timezone: body.timezone || 'UTC',
        isActive: true,
      },
    })
    return NextResponse.json(slot, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/schedule]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
