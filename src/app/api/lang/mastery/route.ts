import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const widgetKind = searchParams.get('widgetKind')

    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId is required' },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // IDOR: verify user is the room tutor or a participant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: room } = await (supabase as any)
      .from('Room')
      .select('tutorId')
      .eq('id', roomId)
      .single()
    const isTutor = room && room.tutorId === auth.userId
    if (!isTutor) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase as any)
        .from('RoomParticipant')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .eq('user_id', auth.userId)
      if (!count) {
        return NextResponse.json({ error: 'You do not have access to this room' }, { status: 403 })
      }
    }

    let query = (supabase as any)
      .from('student_mastery')
      .select('*')
      .eq('room_id', roomId)

    if (widgetKind) {
      query = query.eq('widget_kind', widgetKind)
    }

    const { data, error } = await query

    if (error) throw error

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mastery = (data || []).map(function (row: any) {
      return {
        ...row,
        correct: row.correct_count,
        total: row.total_count,
        lastCorrect: row.last_correct,
        lastSeen: row.last_seen ? new Date(row.last_seen).getTime() : null,
      }
    })

    return NextResponse.json({ mastery: mastery })
  } catch (err: unknown) {
    console.error('[GET /api/lang/mastery]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY FIX: Require auth for writing mastery data
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { roomId, widgetKind, exerciseId, correct, userId } = body

    if (!roomId || !widgetKind || exerciseId === undefined || correct === undefined) {
      return NextResponse.json(
        { error: 'roomId, widgetKind, exerciseId, and correct are required' },
        { status: 400 },
      )
    }

    // Validate types
    if (typeof correct !== 'boolean') {
      return NextResponse.json({ error: 'correct must be a boolean' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if record exists
    const { data: existing } = await (supabase as any)
      .from('student_mastery')
      .select('*')
      .eq('room_id', roomId)
      .eq('widget_kind', widgetKind)
      .eq('exercise_id', exerciseId)
      .maybeSingle()

    if (existing) {
      const newCorrectCount = existing.correct_count + (correct ? 1 : 0)
      const newTotalCount = existing.total_count + 1
      const { error } = await (supabase as any)
        .from('student_mastery')
        .update({
          correct_count: newCorrectCount,
          total_count: newTotalCount,
          last_seen: new Date().toISOString(),
          last_correct: correct,
        })
        .eq('room_id', roomId)
        .eq('widget_kind', widgetKind)
        .eq('exercise_id', exerciseId)

      if (error) throw error
    } else {
      const insertRow: Record<string, unknown> = {
        room_id: roomId,
        widget_kind: widgetKind,
        exercise_id: exerciseId,
        correct_count: correct ? 1 : 0,
        total_count: 1,
        last_seen: new Date().toISOString(),
        last_correct: correct,
      }
      // Use authenticated user's ID, not client-provided userId
      insertRow.user_id = auth.userId
      const { error } = await (supabase as any)
        .from('student_mastery')
        .insert(insertRow)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[POST /api/lang/mastery]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // SECURITY FIX: Require auth for deleting mastery data
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')

    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId is required' },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // IDOR: verify user is the room tutor or a participant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: room } = await (supabase as any)
      .from('Room')
      .select('tutorId')
      .eq('id', roomId)
      .single()
    const isTutor = room && room.tutorId === auth.userId
    if (!isTutor) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase as any)
        .from('RoomParticipant')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .eq('user_id', auth.userId)
      if (!count) {
        return NextResponse.json({ error: 'You do not have access to this room' }, { status: 403 })
      }
    }

    const { error } = await (supabase as any)
      .from('student_mastery')
      .delete()
      .eq('room_id', roomId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[DELETE /api/lang/mastery]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
