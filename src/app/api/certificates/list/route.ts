// ============================================================
// API: Certificates — List
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId

    const certificates = await db.certificate.findMany({
      where: { tutorId: userId },
      orderBy: { issuedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        studentId: true,
        studentName: true,
        templateId: true,
        title: true,
        subtitle: true,
        issuedAt: true,
      },
    })

    return NextResponse.json({ certificates })
  } catch (error) {
    console.error('[Certificates List GET]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
