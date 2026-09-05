// ============================================================
// API: Homework Assignment by ID — Get, Update, Submit, Review
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import crypto from 'crypto'

// GET — tutor fetches assignment for review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId
    const { id } = await params

    const assignment = await db.homeworkAssignment.findUnique({
      where: { id },
      include: { student: true },
    })
    if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (assignment.tutorId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('[HomeworkAssignment GET]', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// PUT — autosave student work OR update feedback OR change status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // --- Autosave student work (no auth — token-based) ---
    if (body.studentSnapshot !== undefined && body.token) {
      const assignment = await db.homeworkAssignment.findUnique({ where: { id } })
      if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (assignment.assignmentToken !== body.token) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
      }
      // Can only edit if not submitted
      if (assignment.status === 'submitted' || assignment.status === 'reviewed') {
        return NextResponse.json({ error: 'Assignment is locked' }, { status: 403 })
      }
      // Check submit deadline
      if (new Date() > assignment.submitUntil) {
        return NextResponse.json({ error: 'Submission window closed' }, { status: 403 })
      }

      const updateData: Record<string, unknown> = {
        studentSnapshot: body.studentSnapshot,
        updatedAt: new Date(),
      }
      // Flip from 'assigned' to 'in_progress' on first save
      if (assignment.status === 'assigned') {
        updateData.status = 'in_progress'
      }

      const updated = await db.homeworkAssignment.update({
        where: { id },
        data: updateData,
      })
      return NextResponse.json({ saved: true, status: updated.status })
    }

    // --- Student submit (token-based, no auth required) ---
    if (body.action === 'submit' && body.token) {
      const assignment = await db.homeworkAssignment.findUnique({ where: { id } })
      if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (assignment.assignmentToken !== body.token) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
      }
      // Can only submit from in_progress or returned
      if (assignment.status !== 'in_progress' && assignment.status !== 'returned') {
        return NextResponse.json({ error: 'Assignment is not in a submittable state' }, { status: 403 })
      }
      const now = new Date()
      // Check hard deadline (submitUntil)
      if (now > assignment.submitUntil) {
        return NextResponse.json({ error: 'Submission window closed' }, { status: 403 })
      }
      const late = assignment.dueAt ? now > assignment.dueAt : false
      const updated = await db.homeworkAssignment.update({
        where: { id },
        data: {
          status: 'submitted',
          submittedAt: now,
          late,
          studentSnapshot: body.studentSnapshot || assignment.studentSnapshot,
          updatedAt: now,
        },
      })
      return NextResponse.json({ success: true, submittedAt: updated.submittedAt, late: updated.late })
    }

    // --- Tutor actions (auth required) ---
    if (body.action) {
      const auth = await requireAuth(request)
      if (auth instanceof NextResponse) return auth
      const userId = (auth as { userId: string }).userId

      const assignment = await db.homeworkAssignment.findUnique({ where: { id } })
      if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (assignment.tutorId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

      switch (body.action) {
        case 'review': {
          // Tutor marks as reviewed
          await db.homeworkAssignment.update({
            where: { id },
            data: { status: 'reviewed', updatedAt: new Date() },
          })
          return NextResponse.json({ success: true, status: 'reviewed' })
        }
        case 'return': {
          // Tutor returns for edits
          await db.homeworkAssignment.update({
            where: { id },
            data: { status: 'returned', updatedAt: new Date() },
          })
          return NextResponse.json({ success: true, status: 'returned' })
        }
        case 'save-feedback': {
          // Tutor saves feedback layer
          await db.homeworkAssignment.update({
            where: { id },
            data: { feedbackSnapshot: body.feedbackSnapshot, updatedAt: new Date() },
          })
          return NextResponse.json({ saved: true })
        }
        default:
          return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'No action specified' }, { status: 400 })
  } catch (error) {
    console.error('[HomeworkAssignment PUT]', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE — tutor deletes assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId
    const { id } = await params

    const assignment = await db.homeworkAssignment.findUnique({ where: { id } })
    if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (assignment.tutorId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await db.homeworkAssignment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[HomeworkAssignment DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
