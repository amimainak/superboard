// ============================================================
// API: Issue Certificate
// ============================================================
// POST  /api/certificates/issue
//   Body: { studentId, templateId, title, subtitle?, photoUrl?, photoConsent }
//
//   Creates a Certificate record, renders the PDF (branded),
//   stores it as base64. Returns the certificate ID so the tutor
//   can download or share it.
//
//   Photo consent is per-certificate — if photoUrl is provided,
//   photoConsent must be true (the tutor checked the box).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getBranding } from '@/lib/branding'
import { renderCertificateToPdfWithTemplate } from '@/lib/certificates/render'
import { CERTIFICATE_TEMPLATES } from '@/lib/certificates/templates'
import { z } from 'zod'

const issueSchema = z.object({
  studentId: z.string().optional(),
  studentName: z.string().min(1).max(200),
  templateId: z.string().min(1),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  photoConsent: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId

    const body = await request.json()
    const parsed = issueSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid', details: parsed.error.flatten() }, { status: 400 })
    }
    const data = parsed.data

    // Validate template
    const template = CERTIFICATE_TEMPLATES.find(t => t.id === data.templateId)
    if (!template) {
      return NextResponse.json({ error: 'Invalid template' }, { status: 400 })
    }

    // Photo consent check — if photo provided, consent must be true
    if (data.photoUrl && !data.photoConsent) {
      return NextResponse.json({ error: 'Photo consent required when a photo is provided' }, { status: 400 })
    }

    // Verify student ownership (if studentId provided)
    if (data.studentId) {
      const student = await db.student.findFirst({
        where: { id: data.studentId, agencyId: userId },
        select: { id: true, name: true },
      })
      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }
    }

    // Load branding
    const branding = await getBranding(userId)

    // Render PDF
    const pdfBuffer = await renderCertificateToPdfWithTemplate(data.templateId, {
      studentName: data.studentName,
      title: data.title,
      subtitle: data.subtitle ?? null,
      tutorDisplayName: branding.displayName,
      logoUrl: branding.logoUrl,
      brandColor: branding.color,
      date: new Date(),
      photoUrl: data.photoUrl ?? null,
      photoConsent: data.photoConsent,
    })

    const pdfBase64 = pdfBuffer.toString('base64')

    // Save certificate
    const certificate = await db.certificate.create({
      data: {
        tutorId: userId,
        studentId: data.studentId || null,
        studentName: data.studentName,
        templateId: data.templateId,
        title: data.title,
        subtitle: data.subtitle ?? null,
        photoUrl: data.photoUrl ?? null,
        photoConsent: data.photoConsent,
        photoConsentAt: data.photoConsent ? new Date() : null,
        pdfStorage: pdfBase64,
      },
      select: { id: true, title: true, studentName: true, issuedAt: true },
    })

    return NextResponse.json({ certificate }, { status: 201 })
  } catch (error) {
    console.error('[Certificate Issue POST]', error)
    return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 })
  }
}
