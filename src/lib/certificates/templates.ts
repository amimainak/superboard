// ============================================================
// Certificate Templates — 5 built-in designs
// ============================================================
// Each template is an SVG string generator that takes the
// certificate data + branding and returns a printable SVG.
// The SVG is then converted to PDF via sharp + pdf-lib (same
// pipeline as data export).
// ============================================================

import type { BrandingConfig } from '@/lib/branding'

export interface CertificateData {
  studentName: string
  title: string
  subtitle: string | null
  tutorDisplayName: string
  logoUrl: string | null
  brandColor: string
  date: Date
  photoUrl?: string | null
  photoConsent: boolean
}

export interface CertificateTemplate {
  id: string
  name: string
  description: string
  defaultTitle: string
  defaultSubtitle: string
}

export const CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  {
    id: 'milestone',
    name: 'Milestone',
    description: 'For reaching a lesson count milestone (10, 25, 50, 100)',
    defaultTitle: '10-Lesson Milestone',
    defaultSubtitle: 'Awarded for completing 10 lessons',
  },
  {
    id: 'mastery',
    name: 'Subject Mastery',
    description: 'For mastering a topic or subject area',
    defaultTitle: 'Subject Mastery',
    defaultSubtitle: 'Awarded for demonstrating mastery',
  },
  {
    id: 'streak',
    name: 'Streak',
    description: 'For a consistent lesson streak',
    defaultTitle: 'Lesson Streak',
    defaultSubtitle: 'Awarded for consistent practice',
  },
  {
    id: 'improvement',
    name: 'Most Improved',
    description: 'For notable improvement over time',
    defaultTitle: 'Most Improved',
    defaultSubtitle: 'Awarded for outstanding progress',
  },
  {
    id: 'term',
    name: 'End of Term',
    description: 'For completing a term of tutoring',
    defaultTitle: 'End of Term Certificate',
    defaultSubtitle: 'Awarded for completing the term',
  },
]

/**
 * Render a certificate to SVG (for PDF conversion).
 * Landscape A4-ish: 1123 x 794 px at 96dpi.
 */
export function renderCertificateSvg(templateId: string, data: CertificateData): string {
  const width = 1123
  const height = 794
  const { brandColor, tutorDisplayName, logoUrl, studentName, title, subtitle, date, photoUrl, photoConsent } = data

  const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const logoMarkup = logoUrl
    ? `<image href="${escapeXml(logoUrl)}" x="80" y="60" width="60" height="60" preserveAspectRatio="xMidYMid slice" clip-path="url(#logoClip)" />`
    : `<circle cx="110" cy="90" r="30" fill="${brandColor}" /><text x="110" y="100" text-anchor="middle" fill="white" font-size="28" font-weight="800" font-family="Georgia, serif">${escapeXml(tutorDisplayName.charAt(0).toUpperCase())}</text>`

  const photoMarkup = (photoUrl && photoConsent)
    ? `<image href="${escapeXml(photoUrl)}" x="${width / 2 - 50}" y="180" width="100" height="100" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClip)" />`
    : `<circle cx="${width / 2}" cy="230" r="50" fill="${brandColor}40" /><text x="${width / 2}" y="245" text-anchor="middle" fill="${brandColor}" font-size="40" font-weight="700" font-family="Georgia, serif">${escapeXml(studentName.charAt(0).toUpperCase())}</text>`

  // Different decorative borders per template
  const border = getBorder(templateId, brandColor, width, height)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <clipPath id="logoClip"><circle cx="110" cy="90" r="30" /></clipPath>
    <clipPath id="photoClip"><circle cx="${width / 2}" cy="230" r="50" /></clipPath>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- Decorative border -->
  ${border}

  <!-- Logo + tutor name (top left) -->
  ${logoMarkup}
  <text x="155" y="85" fill="#1e293b" font-size="18" font-weight="700" font-family="Georgia, serif">${escapeXml(tutorDisplayName)}</text>
  <text x="155" y="105" fill="#64748b" font-size="11" font-family="sans-serif">Certified Tutor</text>

  <!-- "Certificate of" header -->
  <text x="${width / 2}" y="160" text-anchor="middle" fill="#64748b" font-size="14" font-family="sans-serif" letter-spacing="4">CERTIFICATE OF ACHIEVEMENT</text>

  <!-- Student photo or initials -->
  ${photoMarkup}

  <!-- "This is to certify that" -->
  <text x="${width / 2}" y="320" text-anchor="middle" fill="#64748b" font-size="13" font-family="sans-serif">This is to certify that</text>

  <!-- Student name -->
  <text x="${width / 2}" y="370" text-anchor="middle" fill="#0f172a" font-size="36" font-weight="700" font-family="Georgia, serif">${escapeXml(studentName)}</text>

  <!-- Decorative line -->
  <line x1="${width / 2 - 100}" y1="390" x2="${width / 2 + 100}" y2="390" stroke="${brandColor}" stroke-width="2" />

  <!-- Title -->
  <text x="${width / 2}" y="440" text-anchor="middle" fill="${brandColor}" font-size="24" font-weight="700" font-family="Georgia, serif">${escapeXml(title)}</text>

  <!-- Subtitle -->
  ${subtitle ? `<text x="${width / 2}" y="470" text-anchor="middle" fill="#475569" font-size="14" font-family="sans-serif">${escapeXml(subtitle)}</text>` : ''}

  <!-- Date -->
  <text x="${width / 2}" y="520" text-anchor="middle" fill="#64748b" font-size="13" font-family="sans-serif">Awarded on ${dateStr}</text>

  <!-- Signature line + tutor name -->
  <line x1="120" y1="680" x2="320" y2="680" stroke="#94a3b8" stroke-width="1" />
  <text x="220" y="705" text-anchor="middle" fill="#1e293b" font-size="14" font-weight="600" font-family="Georgia, serif">${escapeXml(tutorDisplayName)}</text>
  <text x="220" y="722" text-anchor="middle" fill="#64748b" font-size="11" font-family="sans-serif">Tutor</text>

  <!-- Seal (bottom right) -->
  <circle cx="${width - 140}" cy="690" r="40" fill="none" stroke="${brandColor}" stroke-width="2" />
  <circle cx="${width - 140}" cy="690" r="32" fill="${brandColor}" opacity="0.1" />
  <text x="${width - 140}" y="685" text-anchor="middle" fill="${brandColor}" font-size="10" font-weight="700" font-family="sans-serif">CERTIFIED</text>
  <text x="${width - 140}" y="700" text-anchor="middle" fill="${brandColor}" font-size="9" font-family="sans-serif">${date.getFullYear()}</text>
</svg>`
}

function getBorder(templateId: string, color: string, width: number, height: number): string {
  // All templates share a similar border with slight variations
  const base = `<rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="none" stroke="${color}" stroke-width="2" rx="8" />`
  const inner = `<rect x="30" y="30" width="${width - 60}" height="${height - 60}" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.5" rx="4" />`

  switch (templateId) {
    case 'milestone':
      // Double border with corner accents
      return `${base}${inner}
        <circle cx="40" cy="40" r="6" fill="${color}" />
        <circle cx="${width - 40}" cy="40" r="6" fill="${color}" />
        <circle cx="40" cy="${height - 40}" r="6" fill="${color}" />
        <circle cx="${width - 40}" cy="${height - 40}" r="6" fill="${color}" />`
    case 'mastery':
      // Ornate corners
      return `${base}
        <path d="M 30 60 L 30 30 L 60 30" fill="none" stroke="${color}" stroke-width="3" />
        <path d="M ${width - 60} 30 L ${width - 30} 30 L ${width - 30} 60" fill="none" stroke="${color}" stroke-width="3" />
        <path d="M 30 ${height - 60} L 30 ${height - 30} L 60 ${height - 30}" fill="none" stroke="${color}" stroke-width="3" />
        <path d="M ${width - 60} ${height - 30} L ${width - 30} ${height - 30} L ${width - 30} ${height - 60}" fill="none" stroke="${color}" stroke-width="3" />`
    case 'streak':
      // Flame accent at top
      return `${base}${inner}`
    case 'improvement':
      // Upward arrow accent
      return `${base}${inner}`
    case 'term':
      // Classic formal border
      return `${base}${inner}`
    default:
      return base
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}
