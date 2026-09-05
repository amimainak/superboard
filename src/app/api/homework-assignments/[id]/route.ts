// ============================================================
// API: Homework Assignment by ID — Get, Update, Submit, Review
// ============================================================
// F-05+ changes:
//   • First autosave now sets openedAt (if null) AND flips status
//     from 'assigned' to 'in_progress' — so we know the student
//     actually opened the link, not just received it.
//   • Status transitions fire idempotent email notifications:
//       - submit   → tutor gets "X submitted" email
//       - return   → student/parent gets "X returned" email
//       - review   → student/parent gets "X reviewed" email (if
//                    parentNotifyOnReview was set at creation time)
//   • Notifications are best-effort: if email fails, the status
//     transition still succeeds. We log to HomeworkNotification for
//     idempotency so retries don't double-send.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { sendHomeworkNotification } from '@/lib/email/homework-notifications'

type RouteContext = { params: Promise<{ id: string }> }

// ----------------------------------------------------------------
// Helper: build the public homework URL for email links.
// Uses the VERCEL_URL env var (set by Vercel automatically) or
// falls back to a configured production URL.
// ----------------------------------------------------------------
function getHomeworkUrl(token: string): string {
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) return `https://${vercelUrl}/hw/${token}`
  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (publicUrl) return `${publicUrl}/hw/${token}`
  // Last resort — relative URL won't work in email, but at least
  // the link is present and the tutor can copy-paste
  return `/hw/${token}`
}

// ----------------------------------------------------------------
// Helper: load tutor + student info needed for email notifications
// ----------------------------------------------------------------
async function loadNotificationContext(assignmentId: string) {
  const assignment = await db.homeworkAssignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      assignmentToken: true,
      title: true,
      dueAt: true,
      parentNotifyOnReview: true,
      tutor: { select: { id: true, name: true, email: true } },
      student: { select: { id: true, name: true, email: true, parentEmail: true } },
    },
  })
  if (!assignment) return null
  return assignment
}

// ----------------------------------------------------------------
// GET — tutor fetches assignment for review
// ----------------------------------------------------------------
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId
    const { id } = await context.params

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

// ----------------------------------------------------------------
// PUT — autosave student work OR submit OR tutor actions
// ----------------------------------------------------------------
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
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

      const now = new Date()
      const updateData: Record<string, unknown> = {
        studentSnapshot: body.studentSnapshot,
        updatedAt: now,
      }
      // F-05+: set openedAt on first autosave (if null)
      if (!assignment.openedAt) {
        updateData.openedAt = now
      }
      // Flip from 'assigned' to 'in_progress' on first save
      if (assignment.status === 'assigned') {
        updateData.status = 'in_progress'
      }

      const updated = await db.homeworkAssignment.update({
        where: { id },
        data: updateData,
      })
      return NextResponse.json({ saved: true, status: updated.status, openedAt: updated.openedAt })
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

      // Fire "submitted" notification to tutor (best-effort, non-blocking)
      const ctx = await loadNotificationContext(id)
      if (ctx) {
        const tutorName = ctx.tutor.name || ctx.tutor.email || 'Your tutor'
        const studentName = ctx.student?.name || ctx.student?.email || 'Student'
        // Don't await — fire and forget so the student's submit doesn't wait on email
        sendHomeworkNotification({
          assignmentId: id,
          event: 'submitted',
          recipientEmail: ctx.tutor.email,
          tutorName,
          studentName,
          assignmentTitle: ctx.title,
          assignmentUrl: getHomeworkUrl(ctx.assignmentToken),
          late,
          submittedAt: now.toISOString(),
        }).catch((e) => console.error('[Notify submitted]', e))
      }

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
          await db.homeworkAssignment.update({
            where: { id },
            data: { status: 'reviewed', updatedAt: new Date() },
          })

          // Fire "reviewed" notification to student/parent (if opted in)
          const ctx = await loadNotificationContext(id)
          if (ctx && ctx.parentNotifyOnReview) {
            const tutorName = ctx.tutor.name || ctx.tutor.email || 'Your tutor'
            const studentName = ctx.student?.name || ctx.student?.email || 'Student'
            // Prefer parent email, fall back to student email
            const recipient = ctx.student?.parentEmail || ctx.student?.email
            if (recipient) {
              sendHomeworkNotification({
                assignmentId: id,
                event: 'reviewed',
                recipientEmail: recipient,
                tutorName,
                studentName,
                assignmentTitle: ctx.title,
                assignmentUrl: getHomeworkUrl(ctx.assignmentToken),
              }).catch((e) => console.error('[Notify reviewed]', e))
            }
          }

          return NextResponse.json({ success: true, status: 'reviewed' })
        }
        case 'return': {
          await db.homeworkAssignment.update({
            where: { id },
            data: { status: 'returned', updatedAt: new Date() },
          })

          // Fire "returned" notification to student/parent
          const ctx = await loadNotificationContext(id)
          if (ctx) {
            const tutorName = ctx.tutor.name || ctx.tutor.email || 'Your tutor'
            const studentName = ctx.student?.name || ctx.student?.email || 'Student'
            const recipient = ctx.student?.parentEmail || ctx.student?.email
            if (recipient) {
              sendHomeworkNotification({
                assignmentId: id,
                event: 'returned',
                recipientEmail: recipient,
                tutorName,
                studentName,
                assignmentTitle: ctx.title,
                assignmentUrl: getHomeworkUrl(ctx.assignmentToken),
              }).catch((e) => console.error('[Notify returned]', e))
            }
          }

          return NextResponse.json({ success: true, status: 'returned' })
        }
        case 'save-feedback': {
          // Tutor saves feedback layer — no notification (the tutor
          // will explicitly review or return when ready to notify)
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

// ----------------------------------------------------------------
// DELETE — tutor deletes assignment
// ----------------------------------------------------------------
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId
    const { id } = await context.params

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
