// ============================================================
// API: Schedule — List + Create Scheduled Lessons
// ============================================================
// GET  /api/schedule?tutorId=X
//   Returns ScheduledLessons for the tutor (upcoming + recent past).
// POST /api/schedule
//   Creates a new ScheduledLesson with student link + timezone +
//   reminder settings for the Pro-tier reminder system.
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const tutorId = searchParams.get('tutorId') || user.id

    // Return ScheduledLessons (one-off lessons), not ScheduleSlots
    const lessons = await db.scheduledLesson.findMany({
      where: { tutorId },
      orderBy: { startTime: 'desc' },
      take: 100,
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ lessons })
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

    // Create a ScheduledLesson (one-off lesson with reminder support)
    const lesson = await db.scheduledLesson.create({
      data: {
        tutorId: user.id,
        studentId: body.studentId || null,
        studentName: body.studentName || body.title || null,
        studentEmail: body.studentEmail || null,
        subject: body.subject || 'GENERAL',
        startTime: new Date(body.scheduledAt || body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : null,
        status: 'scheduled',
        notes: body.notes || null,
        timezone: body.timezone || 'UTC',
        remindersEnabled: body.remindersEnabled !== false, // default true
      },
    })

    return NextResponse.json(lesson, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/schedule]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
