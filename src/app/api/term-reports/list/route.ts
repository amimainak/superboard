// ============================================================
// API: Term Reports — List + Download
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// List all term reports for the tutor
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId

    const reports = await db.termReport.findMany({
      where: { tutorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        studentId: true,
        startDate: true,
        endDate: true,
        lessonsCount: true,
        subjectsCovered: true,
        consentRecorded: true,
        sentToParent: true,
        sentAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('[Term Reports List GET]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
