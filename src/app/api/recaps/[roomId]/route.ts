// ============================================================
// API: Session Recap — Get or create draft for a lesson
// ============================================================
// GET  /api/recaps/[roomId]
//   Returns the existing recap for this room, or auto-generates a
//   draft if none exists yet. The draft is created from the board
//   content + lesson notes + (optionally) AI narrative.
//
// PATCH /api/recaps/[roomId]
//   Updates the recap (tutor edits the structured data, narrative,
//   or status). Used when the tutor reviews and approves.
//
// Access: the tutor who owns the room.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { generateRecapDraft } from '@/lib/recaps/generate-recap'
import { z } from 'zod'

type RouteContext = { params: Promise<{ roomId: string }> }

// ----------------------------------------------------------------
// GET — fetch or auto-generate recap
// ----------------------------------------------------------------
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId
    const { roomId } = await context.params

    // Verify the tutor owns this room
    const room = await db.room.findFirst({
      where: { id: roomId, tutorId: userId },
      select: { id: true, subject: true, studentName: true, durationMinutes: true, endedAt: true },
    })
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if a recap already exists
    const existing = await db.sessionRecap.findUnique({
      where: { roomId },
    })

    if (existing) {
      return NextResponse.json({ recap: existing })
    }

    // Auto-generate a draft
    try {
      const draft = await generateRecapDraft(roomId)
      // Find the studentId if we can match by name
      let studentId: string | null = null
      if (room.studentName) {
        const student = await db.student.findFirst({
          where: { agencyId: userId, name: room.studentName },
          select: { id: true },
        })
        studentId = student?.id ?? null
      }

      const recap = await db.sessionRecap.create({
        data: {
          roomId,
          tutorId: userId,
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

      return NextResponse.json({ recap, freshlyGenerated: true })
    } catch (e) {
      console.error('[Recap GET] Generation failed:', e)
      return NextResponse.json({ error: 'Failed to generate recap draft' }, { status: 500 })
    }
  } catch (error) {
    console.error('[Recap GET]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// ----------------------------------------------------------------
// PATCH — tutor edits the recap
// ----------------------------------------------------------------
const patchSchema = z.object({
  topics: z.array(z.string().max(200)).max(20).optional(),
  strengths: z.array(z.string().max(500)).max(10).optional(),
  growthAreas: z.array(z.string().max(500)).max(10).optional(),
  nextSteps: z.string().max(2000).optional().nullable(),
  narrative: z.string().max(5000).optional().nullable(),
  status: z.enum(['draft', 'approved', 'dismissed']).optional(),
})

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId
    const { roomId } = await context.params

    // Verify ownership
    const recap = await db.sessionRecap.findUnique({ where: { roomId } })
    if (!recap) {
      return NextResponse.json({ error: 'Recap not found' }, { status: 404 })
    }
    if (recap.tutorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid', details: parsed.error.flatten() }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.topics !== undefined) updateData.topics = parsed.data.topics
    if (parsed.data.strengths !== undefined) updateData.strengths = parsed.data.strengths
    if (parsed.data.growthAreas !== undefined) updateData.growthAreas = parsed.data.growthAreas
    if (parsed.data.nextSteps !== undefined) updateData.nextSteps = parsed.data.nextSteps
    if (parsed.data.narrative !== undefined) updateData.narrative = parsed.data.narrative
    if (parsed.data.status !== undefined) {
      updateData.status = parsed.data.status
      if (parsed.data.status === 'approved') {
        updateData.approvedAt = new Date()
      }
    }

    const updated = await db.sessionRecap.update({
      where: { roomId },
      data: updateData,
    })

    return NextResponse.json({ recap: updated })
  } catch (error) {
    console.error('[Recap PATCH]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
