// ============================================================
// API: Session Recaps — List
// ============================================================
// GET  /api/recaps/list
//   Returns all recaps for the authenticated tutor, newest first.
//   Optional filters: ?status=draft|approved|dismissed&studentId=X
//
// Used by the dashboard's recap review panel.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const studentId = searchParams.get('studentId')

    const where: Record<string, unknown> = { tutorId: userId }
    if (status) where.status = status
    if (studentId) where.studentId = studentId

    const recaps = await db.sessionRecap.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        roomId: true,
        studentId: true,
        topics: true,
        strengths: true,
        growthAreas: true,
        nextSteps: true,
        narrative: true,
        aiGenerated: true,
        status: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ recaps })
  } catch (error) {
    console.error('[Recaps List GET]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
