// ============================================================
// API: Term Report — Generate
// ============================================================
// POST  /api/term-reports/generate
//   Body: { studentId, startDate, endDate, consentRecorded }
//
//   Compiles approved session recaps into a branded PDF.
//   Requires explicit consent (consentRecorded: true) per report.
//   Returns the report ID for download.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { compileTermReport } from '@/lib/term-reports/compile'
import { z } from 'zod'

const generateSchema = z.object({
  studentId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  consentRecorded: z.boolean(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId

    const body = await request.json()
    const parsed = generateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid', details: parsed.error.flatten() }, { status: 400 })
    }

    if (!parsed.data.consentRecorded) {
      return NextResponse.json({
        error: 'Consent required',
        message: 'You must confirm you have the parent\'s consent to compile this report about the student.',
      }, { status: 400 })
    }

    const startDate = new Date(parsed.data.startDate)
    const endDate = new Date(parsed.data.endDate)

    if (startDate >= endDate) {
      return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 })
    }

    // Compile the report
    const compiled = await compileTermReport({
      tutorId: userId,
      studentId: parsed.data.studentId,
      startDate,
      endDate,
      consentRecorded: true,
    })

    // Get parent email for the delivery record
    const student = await db.student.findFirst({
      where: { id: parsed.data.studentId, agencyId: userId },
      select: { parentEmail: true, email: true, name: true },
    })

    // Save the report
    const report = await db.termReport.create({
      data: {
        tutorId: userId,
        studentId: parsed.data.studentId,
        startDate,
        endDate,
        summary: compiled.summary,
        lessonsCount: compiled.lessonsCount,
        subjectsCovered: compiled.subjectsCovered,
        highlights: compiled.highlights,
        consentRecorded: true,
        consentAt: new Date(),
        parentEmail: student?.parentEmail || student?.email || null,
        pdfStorage: compiled.pdfBuffer.toString('base64'),
      },
      select: { id: true, summary: true, lessonsCount: true, subjectsCovered: true, highlights: true },
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('[Term Report Generate POST]', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
