// ============================================================
// API: Term Report by ID — Download PDF
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

type RouteContext = { params: Promise<{ reportId: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId
    const { reportId } = await context.params

    const report = await db.termReport.findUnique({
      where: { id: reportId },
      select: { id: true, tutorId: true, studentId: true, startDate: true, endDate: true, pdfStorage: true },
    })

    if (!report) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (report.tutorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!report.pdfStorage) {
      return NextResponse.json({ error: 'PDF not available' }, { status: 404 })
    }

    const pdfBuffer = Buffer.from(report.pdfStorage, 'base64')
    const dateStr = report.startDate.toISOString().split('T')[0]
    const filename = `term-report-${dateStr}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    })
  } catch (error) {
    console.error('[Term Report Download GET]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
