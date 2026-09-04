// ============================================================
// API: Get homework assignment by token (student access — no auth)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Rate limit: 20 requests per minute per IP (brute-force protection)
    const { allowed, response } = await checkRateLimit(request, 'hw-by-token', { max: 20, windowMs: 60_000 })
    if (!allowed) return response as unknown as NextResponse

    const { token } = await params

    const assignment = await db.homeworkAssignment.findUnique({
      where: { assignmentToken: token },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        late: true,
        dueAt: true,
        submitUntil: true,
        viewUntil: true,
        studentSnapshot: true,
        feedbackSnapshot: true,
        submittedAt: true,
        sourceSnapshot: true,
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check if view window has expired
    const now = new Date()
    if (now > assignment.viewUntil) {
      return NextResponse.json({ error: 'expired', assignment: { title: assignment.title } }, { status: 410 })
    }

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('[HomeworkByToken GET]', error)
    return NextResponse.json({ error: 'Failed to fetch assignment' }, { status: 500 })
  }
}
