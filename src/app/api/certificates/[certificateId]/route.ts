// ============================================================
// API: Certificates — List + Download
// ============================================================
// GET  /api/certificates/list
//   Lists all certificates issued by the tutor, newest first.
//
// GET  /api/certificates/[certificateId]
//   Downloads the certificate PDF (auth-checked).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

type RouteContext = { params: Promise<{ certificateId: string }> }

// Download a specific certificate PDF
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId
    const { certificateId } = await context.params

    const cert = await db.certificate.findUnique({
      where: { id: certificateId },
      select: { id: true, tutorId: true, studentName: true, title: true, issuedAt: true, pdfStorage: true },
    })

    if (!cert) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (cert.tutorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!cert.pdfStorage) {
      return NextResponse.json({ error: 'PDF not available' }, { status: 404 })
    }

    const pdfBuffer = Buffer.from(cert.pdfStorage, 'base64')
    const filename = `${cert.studentName}-${cert.title}.pdf`.replace(/[^a-zA-Z0-9-]/g, '_')

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    })
  } catch (error) {
    console.error('[Certificate Download GET]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
