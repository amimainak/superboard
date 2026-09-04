// ============================================================
// API: Regenerate homework assignment link
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(
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

    const newToken = crypto.randomBytes(32).toString('hex')

    const updated = await db.homeworkAssignment.update({
      where: { id },
      data: { assignmentToken: newToken, updatedAt: new Date() },
    })

    return NextResponse.json({ token: updated.assignmentToken })
  } catch (error) {
    console.error('[HomeworkRegenerate]', error)
    return NextResponse.json({ error: 'Failed to regenerate' }, { status: 500 })
  }
}
