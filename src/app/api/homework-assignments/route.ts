// ============================================================
// API: Homework Assignments — List & Create
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import crypto from 'crypto'

const createSchema = z.object({
  sourceRoomId: z.string().optional(),
  sourceSnapshot: z.record(z.string(), z.unknown()),
  title: z.string().min(1).max(300),
  description: z.string().max(10000).optional(),
  studentId: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  parentNotifyOnReview: z.boolean().optional(),
})

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

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    console.error('[HomeworkAssignments POST]', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}
