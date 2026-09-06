// ============================================================
// Term Report Generator — compile recaps into a polished report
// ============================================================
// Given a tutor, student, and date range:
//   1. Load all approved SessionRecaps in that range
//   2. Compile structured data (topics, strengths, growth areas)
//   3. Generate a summary narrative (Gemini AI if Pro+consent,
//      structured summary otherwise)
//   4. Render a branded PDF (using the same sharp + pdf-lib pipeline)
//
// Consent is per-report — the tutor must explicitly check "I have
// the parent's consent" before the PDF is generated.
// ============================================================

import { db } from '@/lib/db'
import { getBranding, type BrandingConfig } from '@/lib/branding'
import sharp from 'sharp'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface CompileParams {
  tutorId: string
  studentId: string
  startDate: Date
  endDate: Date
  consentRecorded: boolean
}

interface CompiledReport {
  summary: string
  lessonsCount: number
  subjectsCovered: string[]
  highlights: string[]
  pdfBuffer: Buffer
}

export async function compileTermReport(params: CompileParams): Promise<CompiledReport> {
  const { tutorId, studentId, startDate, endDate, consentRecorded } = params

  if (!consentRecorded) {
    throw new Error('Consent must be recorded before generating a term report')
  }

  // 1. Load approved recaps in the date range
  const recaps = await db.sessionRecap.findMany({
    where: {
      tutorId,
      studentId,
      status: 'approved',
      createdAt: { gte: startDate, lte: endDate },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      topics: true,
      strengths: true,
      growthAreas: true,
      nextSteps: true,
      narrative: true,
      createdAt: true,
    },
  })

  // 2. Load the student
  const student = await db.student.findFirst({
    where: { id: studentId, agencyId: tutorId },
    select: { name: true, email: true, parentEmail: true, gradeLevel: true },
  })

  if (!student) {
    throw new Error('Student not found')
  }

  // 3. Compile structured data
  const allTopics = new Set<string>()
  const allStrengths: string[] = []
  const allGrowthAreas: string[] = []
  for (const r of recaps) {
    r.topics.forEach(t => allTopics.add(t))
    allStrengths.push(...r.strengths)
    allGrowthAreas.push(...r.growthAreas)
  }

  // 4. Generate summary narrative
  let summary: string
  const tutor = await db.user.findUnique({
    where: { id: tutorId },
    select: { preferences: true, tier: true, name: true, email: true },
  })
  const isPro = tutor && ['PRO', 'AGENCY', 'AGENCY_STANDARD', 'AGENCY_PREMIUM'].includes(tutor.tier)
  const prefs = (tutor?.preferences as Record<string, unknown> | null) || {}
  const aiConsent = prefs.consentAIRecaps === true

  if (isPro && aiConsent && process.env.GEMINI_API_KEY) {
    try {
      summary = await generateAISummary(
        student.name || 'the student',
        recaps,
        [...allTopics],
        startDate,
        endDate,
      )
    } catch (e) {
      console.error('[TermReport] AI summary failed, falling back:', e)
      summary = generateStructuredSummary(student.name || 'the student', recaps.length, [...allTopics], allStrengths, allGrowthAreas)
    }
  } else {
    summary = generateStructuredSummary(student.name || 'the student', recaps.length, [...allTopics], allStrengths, allGrowthAreas)
  }

  // 5. Render branded PDF
  const branding = await getBranding(tutorId)
  const pdfBuffer = await renderTermReportPdf({
    studentName: student.name || 'Student',
    studentGrade: student.gradeLevel,
    tutorName: branding.tutorName || branding.displayName,
    tutorDisplayName: branding.displayName,
    logoUrl: branding.logoUrl,
    brandColor: branding.color,
    startDate,
    endDate,
    lessonsCount: recaps.length,
    subjectsCovered: [...allTopics],
    highlights: allStrengths.slice(0, 5),
    summary,
    isPro: branding.isPro,
  })

  return {
    summary,
    lessonsCount: recaps.length,
    subjectsCovered: [...allTopics],
    highlights: allStrengths.slice(0, 5),
    pdfBuffer,
  }
}

// ----------------------------------------------------------------
// Structured summary (no AI)
// ----------------------------------------------------------------
function generateStructuredSummary(
  studentName: string,
  lessonsCount: number,
  topics: string[],
  strengths: string[],
  growthAreas: string[],
): string {
  const topicStr = topics.length > 0
    ? `Topics covered include: ${topics.join(', ')}.`
    : 'A variety of topics were explored.'

  const strengthStr = strengths.length > 0
    ? ` Key strengths observed: ${strengths.slice(0, 3).join('; ')}.`
    : ''

  const growthStr = growthAreas.length > 0
    ? ` Areas for continued growth: ${growthAreas.slice(0, 2).join('; ')}.`
    : ''

  return `Over ${lessonsCount} lesson${lessonsCount !== 1 ? 's' : ''}, ${studentName} has made steady progress. ${topicStr}${strengthStr}${growthStr} Consistent practice and engagement will continue to build on this foundation.`
}

// ----------------------------------------------------------------
// AI summary (Gemini)
// ----------------------------------------------------------------
async function generateAISummary(
  studentName: string,
  recaps: Array<{ topics: string[]; strengths: string[]; growthAreas: string[]; narrative: string | null; createdAt: Date }>,
  topics: string[],
  startDate: Date,
  endDate: Date,
): Promise<string> {
  const recapSummaries = recaps.map((r, i) =>
    `Lesson ${i + 1} (${r.createdAt.toLocaleDateString()}): topics=${r.topics.join(', ')}, strengths=${r.strengths.join('; ')}, growth=${r.growthAreas.join('; ')}`
  ).join('\n')

  const prompt = `Write a professional term report summary for ${studentName}.

Date range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}
Number of lessons: ${recaps.length}
Topics covered: ${topics.join(', ')}

Lesson-by-lesson summaries:
${recapSummaries}

Write a 3-paragraph summary:
1. Overall progress and engagement during the term
2. Key strengths and achievements
3. Areas for continued growth and recommendations for next term

Keep it under 250 words. Professional, warm tone. Be specific — reference actual topics and strengths. This will be read by the parent.`

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
    }),
  })
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty Gemini response')
  return text.trim()
}

// ----------------------------------------------------------------
// PDF rendering — branded term report
// ----------------------------------------------------------------
async function renderTermReportPdf(data: {
  studentName: string
  studentGrade: string | null
  tutorName: string
  tutorDisplayName: string
  logoUrl: string | null
  brandColor: string
  startDate: Date
  endDate: Date
  lessonsCount: number
  subjectsCovered: string[]
  highlights: string[]
  summary: string
  isPro: boolean
}): Promise<Buffer> {
  // Build SVG for the report (portrait A4-ish)
  const width = 794   // A4 width at 96dpi
  const height = 1123 // A4 height at 96dpi
  const { brandColor, tutorDisplayName, logoUrl, studentName, studentGrade, startDate, endDate, lessonsCount, subjectsCovered, highlights, summary, isPro } = data

  const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const logoMarkup = logoUrl
    ? `<image href="${escapeXml(logoUrl)}" x="60" y="50" width="50" height="50" preserveAspectRatio="xMidYMid slice" clip-path="url(#logoClip)" />`
    : `<circle cx="85" cy="75" r="25" fill="${brandColor}" /><text x="85" y="84" text-anchor="middle" fill="white" font-size="22" font-weight="800" font-family="Georgia, serif">${escapeXml(tutorDisplayName.charAt(0).toUpperCase())}</text>`

  // Split summary into lines (approximate — SVG doesn't auto-wrap)
  const summaryLines = wrapText(summary, 85)
  const summaryY = 420
  const summaryMarkup = summaryLines.map((line, i) =>
    `<text x="60" y="${summaryY + i * 18}" fill="#334155" font-size="12" font-family="sans-serif">${escapeXml(line)}</text>`
  ).join('')

  const highlightsMarkup = highlights.length > 0
    ? highlights.map((h, i) => `<text x="60" y="${680 + i * 22}" fill="#475569" font-size="12" font-family="sans-serif">• ${escapeXml(h.slice(0, 100))}</text>`).join('')
    : '<text x="60" y="680" fill="#94a3b8" font-size="12" font-family="sans-serif">No specific highlights recorded</text>'

  const subjectsMarkup = subjectsCovered.length > 0
    ? subjectsCovered.slice(0, 8).map((s, i) =>
        `<rect x="${60 + (i % 4) * 170}" y="${560 + Math.floor(i / 4) * 30}" width="160" height="22" rx="11" fill="${brandColor}15" /><text x="${140 + (i % 4) * 170}" y="${575 + Math.floor(i / 4) * 30}" text-anchor="middle" fill="${brandColor}" font-size="10" font-weight="600" font-family="sans-serif">${escapeXml(s)}</text>`
      ).join('')
    : '<text x="60" y="575" fill="#94a3b8" font-size="12" font-family="sans-serif">No topics recorded</text>'

  const poweredByFooter = !isPro
    ? `<text x="${width / 2}" y="${height - 30}" text-anchor="middle" fill="#cbd5e1" font-size="10" font-family="sans-serif">Powered by <tspan font-weight="600" fill="#94a3b8">Superboard</tspan></text>`
    : ''

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <clipPath id="logoClip"><circle cx="85" cy="75" r="25" /></clipPath>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="white" />

  <!-- Top brand bar -->
  <rect x="0" y="0" width="${width}" height="130" fill="${brandColor}" />
  ${logoMarkup}
  <text x="125" y="72" fill="white" font-size="20" font-weight="700" font-family="Georgia, serif">${escapeXml(tutorDisplayName)}</text>
  <text x="125" y="92" fill="rgba(255,255,255,0.8)" font-size="12" font-family="sans-serif">Term Report</text>

  <!-- Student name -->
  <text x="60" y="200" fill="#64748b" font-size="13" font-family="sans-serif">STUDENT</text>
  <text x="60" y="230" fill="#0f172a" font-size="28" font-weight="700" font-family="Georgia, serif">${escapeXml(studentName)}</text>
  ${studentGrade ? `<text x="60" y="255" fill="#64748b" font-size="13" font-family="sans-serif">${escapeXml(studentGrade)}</text>` : ''}

  <!-- Date range -->
  <text x="${width - 60}" y="200" text-anchor="end" fill="#64748b" font-size="13" font-family="sans-serif">REPORTING PERIOD</text>
  <text x="${width - 60}" y="230" text-anchor="end" fill="#0f172a" font-size="16" font-weight="600" font-family="sans-serif">${escapeXml(dateRange)}</text>
  <text x="${width - 60}" y="255" text-anchor="end" fill="#64748b" font-size="13" font-family="sans-serif">${lessonsCount} lesson${lessonsCount !== 1 ? 's' : ''}</text>

  <!-- Divider -->
  <line x1="60" y1="290" x2="${width - 60}" y2="290" stroke="#e2e8f0" stroke-width="1" />

  <!-- Summary -->
  <text x="60" y="330" fill="${brandColor}" font-size="14" font-weight="700" font-family="sans-serif">PROGRESS SUMMARY</text>
  ${summaryMarkup}

  <!-- Topics covered -->
  <text x="60" y="${summaryLines.length * 18 + summaryY + 50}" fill="${brandColor}" font-size="14" font-weight="700" font-family="sans-serif">TOPICS COVERED</text>
  ${subjectsMarkup}

  <!-- Highlights -->
  <text x="60" y="650" fill="${brandColor}" font-size="14" font-weight="700" font-family="sans-serif">KEY HIGHLIGHTS</text>
  ${highlightsMarkup}

  <!-- Signature -->
  <line x1="60" y1="${height - 100}" x2="260" y2="${height - 100}" stroke="#94a3b8" stroke-width="1" />
  <text x="160" y="${height - 80}" text-anchor="middle" fill="#1e293b" font-size="13" font-weight="600" font-family="Georgia, serif">${escapeXml(tutorDisplayName)}</text>
  <text x="160" y="${height - 65}" text-anchor="middle" fill="#64748b" font-size="11" font-family="sans-serif">Tutor</text>

  ${poweredByFooter}
</svg>`

  // SVG → PNG → PDF
  const pngBuffer = await sharp(Buffer.from(svg))
    .resize(width * 2, height * 2, { fit: 'fill' })
    .png()
    .toBuffer()

  const pdfDoc = await PDFDocument.create()
  const pngImage = await pdfDoc.embedPng(pngBuffer)
  const page = pdfDoc.addPage([pngImage.width, pngImage.height])
  page.drawImage(pngImage, { x: 0, y: 0, width: pngImage.width, height: pngImage.height })
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).length > maxChars) {
      if (current) lines.push(current)
      current = word
    } else {
      current = current ? current + ' ' + word : word
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 15) // cap at 15 lines
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}
