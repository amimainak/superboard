// ============================================================
// Branding Helper — get tutor's branding config
// ============================================================
// Returns the tutor's branding (logo, display name, color) plus
// whether they're on Pro tier (which removes the "Powered by"
// footer from parent-facing artifacts).
//
// Used by all parent-facing surfaces: waiting room, join page,
// homework page, recap PDFs, certificates, reminder emails.
// ============================================================

import { db } from '@/lib/db'
import { Tier } from '@/types'

export interface BrandingConfig {
  displayName: string       // "Sarah's Tutoring" or fallback to name/email
  logoUrl: string | null    // branded logo, null = use initials
  color: string             // brand color (hex), default emerald
  isPro: boolean            // Pro tier = no "Powered by" footer
  tutorName: string | null  // the tutor's actual name (for "with [name]")
  tutorEmail: string
}

const DEFAULT_COLOR = '#059669'

/**
 * Get branding config for a tutor by their user ID.
 * Falls back gracefully: if no displayName, uses name; if no name,
 * uses email; if no logo, returns null (caller shows initials).
 */
export async function getBranding(userId: string): Promise<BrandingConfig> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      displayName: true,
      name: true,
      email: true,
      brandingLogoUrl: true,
      brandingColor: true,
      tier: true,
    },
  })

  if (!user) {
    return {
      displayName: 'Your Tutor',
      logoUrl: null,
      color: DEFAULT_COLOR,
      isPro: false,
      tutorName: null,
      tutorEmail: '',
    }
  }

  const isPro = user.tier === 'PRO' || user.tier === 'AGENCY' || user.tier === 'AGENCY_STANDARD' || user.tier === 'AGENCY_PREMIUM'

  return {
    displayName: user.displayName || user.name || user.email,
    logoUrl: user.brandingLogoUrl,
    color: user.brandingColor || DEFAULT_COLOR,
    isPro,
    tutorName: user.name,
    tutorEmail: user.email,
  }
}

/**
 * Get branding config for a room (by roomId) — looks up the tutor.
 * Used by parent-facing pages that have a roomId but not a userId.
 */
export async function getBrandingForRoom(roomId: string): Promise<BrandingConfig | null> {
  const room = await db.room.findUnique({
    where: { id: roomId },
    select: { tutorId: true },
  })
  if (!room) return null
  return getBranding(room.tutorId)
}

/**
 * Get branding config for a student (by studentId) — looks up the tutor.
 * Used by student-facing pages.
 */
export async function getBrandingForStudent(studentId: string): Promise<BrandingConfig | null> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { agencyId: true },
  })
  if (!student) return null
  return getBranding(student.agencyId)
}
