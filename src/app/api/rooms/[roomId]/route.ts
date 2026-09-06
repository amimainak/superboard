import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { updateRoomSchema } from '@/lib/validations'
import { generateRecapDraft } from '@/lib/recaps/generate-recap'

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
    const existing = await db.room.findUnique({ where: { id: roomId }, select: { tutorId: true, isActive: true } })
    if (!existing) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    if (existing.tutorId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const updates: Record<string, unknown> = { ...parsed.data }
    const isEndingLesson = updates.isActive === false && !updates.endedAt
    if (isEndingLesson) {
      updates.endedAt = new Date()
    }

    const room = await db.room.update({
      where: { id: roomId },
      data: updates,
    })

    // F5: Auto-generate a session recap draft when the lesson ends.
    // Best-effort — if it fails, the tutor can still generate one
    // manually from the Recaps tab.
    if (isEndingLesson && existing.isActive) {
      try {
        // Check if a recap already exists (avoid duplicates)
        const existingRecap = await db.sessionRecap.findUnique({
          where: { roomId },
          select: { id: true },
        })
        if (!existingRecap) {
          const draft = await generateRecapDraft(roomId)
          // Find studentId by matching studentName
          let studentId: string | null = null
          if (room.studentName) {
            const student = await db.student.findFirst({
              where: { agencyId: user.id, name: room.studentName },
              select: { id: true },
            })
            studentId = student?.id ?? null
          }
          await db.sessionRecap.create({
            data: {
              roomId,
              tutorId: user.id,
              studentId,
              topics: draft.topics,
              strengths: draft.strengths,
              growthAreas: draft.growthAreas,
              nextSteps: draft.nextSteps,
              narrative: draft.narrative,
              aiGenerated: draft.aiGenerated,
              status: 'draft',
            },
          })
          console.log(`[F5] Auto-generated recap for room ${roomId}`)
        }
      } catch (e) {
        // Non-fatal — the tutor can generate manually
        console.error('[F5] Auto-recap generation failed:', e)
      }
    }

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
