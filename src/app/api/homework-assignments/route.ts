// ============================================================
// API: Homework Assignments — List & Create
// ============================================================
// F-05+ changes:
//   • On create, fires "assigned" notification to student/parent
//     (best-effort, idempotent).
//   • Create now accepts an optional `notify` flag (default true)
//     so the whiteboard "assign" button can suppress the email if
//     the tutor wants to copy the link manually instead.
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import crypto from 'crypto'
import { sendHomeworkNotification } from '@/lib/email/homework-notifications'

const createSchema = z.object({
  sourceRoomId: z.string().optional(),
  sourceSnapshot: z.record(z.string(), z.unknown()),
  title: z.string().min(1).max(300),
  description: z.string().max(10000).optional(),
  studentId: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  parentNotifyOnReview: z.boolean().optional(),
  notify: z.boolean().optional(), // default true — set false to skip the "assigned" email
})

function getHomeworkUrl(token: string): string {
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) return `https://${vercelUrl}/hw/${token}`
  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (publicUrl) return `${publicUrl}/hw/${token}`
  return `/hw/${token}`
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId

    const status = request.nextUrl.searchParams.get('status')
    const where: Record<string, unknown> = { tutorId: userId }
    if (status) where.status = status

    const assignments = await db.homeworkAssignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { student: true },
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('[HomeworkAssignments GET]', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const data = parsed.data
    const shouldNotify = data.notify !== false // default true

    const now = new Date()
    const dueAt = data.dueAt ? new Date(data.dueAt) : null
    const submitUntil = dueAt
      ? new Date(dueAt.getTime() + 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const viewUntil = new Date(submitUntil.getTime() + 90 * 24 * 60 * 60 * 1000)

    const token = crypto.randomBytes(32).toString('hex')

    const assignment = await db.homeworkAssignment.create({
      data: {
        tutorId: userId,
        studentId: data.studentId || null,
        sourceRoomId: data.sourceRoomId || null,
        assignmentToken: token,
        sourceSnapshot: data.sourceSnapshot as unknown as object,
        studentSnapshot: data.sourceSnapshot as unknown as object, // student starts with a copy of the source
        title: data.title,
        description: data.description || null,
        dueAt,
        submitUntil,
        viewUntil,
        parentNotifyOnReview: data.parentNotifyOnReview || false,
      },
    })

    // Fire "assigned" notification to student/parent (best-effort)
    if (shouldNotify && data.studentId) {
      const student = await db.student.findUnique({
        where: { id: data.studentId },
        select: { id: true, name: true, email: true, parentEmail: true, agencyId: true },
      })
      const tutor = await db.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      })
      if (student && tutor) {
        const tutorName = tutor.name || tutor.email || 'Your tutor'
        const studentName = student.name || student.email || 'Student'
        // Send to parent email if available, else student email
        const recipient = student.parentEmail || student.email
        sendHomeworkNotification({
          assignmentId: assignment.id,
          event: 'assigned',
          recipientEmail: recipient,
          tutorName,
          studentName,
          assignmentTitle: data.title,
          assignmentUrl: getHomeworkUrl(token),
          dueDate: dueAt?.toISOString() ?? null,
        }).catch((e) => console.error('[Notify assigned]', e))
      }
    }

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    console.error('[HomeworkAssignments POST]', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}
