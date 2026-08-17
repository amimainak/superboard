import type { Tier } from './validations'

export type FeatureName =
  | 'video_call'
  | 'video_unlimited'
  | 'ai_assistant'
  | 'ai_credits'
  | 'subject_toolkits'
  | 'file_uploads'
  | 'save_boards'
  | 'templates'
  | 'geogebra'
  | 'ai_math_ocr'
  | 'pdf_export'
  | 'pdf_branded'
  | 'white_label'
  | 'sub_tutor_invites'
  | 'ai_soft_throttle'

interface FeatureConfig {
  free: boolean
  pro: boolean
  agency: boolean
  /** For metered features: limit per period (null = unlimited) */
  freeLimit?: number
  proLimit?: number
  agencyLimit?: number
}

const FEATURES: Record<FeatureName, FeatureConfig> = {
  video_call:        { free: true,  pro: true, agency: true, freeLimit: 120 }, // minutes/week
  video_unlimited:   { free: false, pro: true, agency: true },
  ai_assistant:      { free: true,  pro: true, agency: true, freeLimit: 10 }, // credits/week
  ai_credits:        { free: false, pro: true, agency: true, proLimit: 100, agencyLimit: 100 },
  subject_toolkits:  { free: true,  pro: true, agency: true }, // free: current subject only
  file_uploads:      { free: false, pro: true, agency: true },
  save_boards:       { free: false, pro: true, agency: true },
  templates:         { free: false, pro: true, agency: true },
  geogebra:          { free: false, pro: true, agency: true },
  ai_math_ocr:       { free: false, pro: true, agency: true },
  pdf_export:        { free: false, pro: true, agency: true },
  pdf_branded:       { free: false, pro: false, agency: true },
  white_label:       { free: false, pro: false, agency: true },
  sub_tutor_invites: { free: false, pro: false, agency: true },
  ai_soft_throttle:  { free: true,  pro: true, agency: true, freeLimit: 10, proLimit: 100, agencyLimit: 100 },
}

export function hasFeature(feature: FeatureName, tier: Tier): boolean {
  const config = FEATURES[feature]
  if (!config) return false
  switch (tier) {
    case 'FREE': return config.free
    case 'PRO': return config.pro
    case 'AGENCY': return config.agency
    default: return false
  }
}

export function getFeatureLimit(feature: FeatureName, tier: Tier): number | null {
  const config = FEATURES[feature]
  if (!config) return null
  switch (tier) {
    case 'FREE': return config.freeLimit ?? null
    case 'PRO': return config.proLimit ?? null
    case 'AGENCY': return config.agencyLimit ?? null
    default: return null
  }
}

export function getTierLabel(tier: Tier): string {
  switch (tier) {
    case 'FREE': return 'Free'
    case 'PRO': return 'Pro'
    case 'AGENCY': return 'Agency'
  }
}

export function getTierPrice(tier: Tier): string {
  switch (tier) {
    case 'FREE': return '$0'
    case 'PRO': return '$19/mo'
    case 'AGENCY': return '$39/mo'
  }
}
