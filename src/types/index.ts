// ============================================================
// K-12 AI SUPERBOARD — Shared Types
// ============================================================

export type Tier = 'FREE' | 'PRO' | 'AGENCY';

export type Subject = 'MATH' | 'SCIENCE' | 'LANGUAGE' | 'GENERAL';

export type AIAction =
  | 'QUIZ'
  | 'WORKSHEET'
  | 'SUMMARY'
  | 'GRAMMAR'
  | 'OUTLINE'
  | 'PLOT_GRAPH'
  | 'PERFECT_SHAPE'
  | 'HANDWRITING_TO_MATH'
  | 'DIAGRAM_GENERATOR'
  | 'CHEMICAL_BALANCER'
  | 'LAB_SUMMARY'
  | 'VOCAB_QUIZ'
  | 'PHONICS_HELPER'
  | 'TIMELINE_GENERATOR'
  | 'CONCEPT_SUMMARIZER';

// Text-only actions → routed to Claude 3 Haiku
export const TEXT_AI_ACTIONS: AIAction[] = [
  'QUIZ',
  'WORKSHEET',
  'SUMMARY',
  'GRAMMAR',
  'OUTLINE',
  'VOCAB_QUIZ',
  'PHONICS_HELPER',
  'TIMELINE_GENERATOR',
  'CONCEPT_SUMMARIZER',
  'CHEMICAL_BALANCER',
  'LAB_SUMMARY',
];

// Vision actions → routed to Claude 3.5 Sonnet
export const VISION_AI_ACTIONS: AIAction[] = [
  'PLOT_GRAPH',
  'PERFECT_SHAPE',
  'HANDWRITING_TO_MATH',
  'DIAGRAM_GENERATOR',
];

export interface RoomData {
  id: string;
  tutorId: string;
  subject: Subject;
  isActive: boolean;
  brandingLogo: string | null;
  brandingColor: string | null;
  createdAt: string;
  tutor?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface Participant {
  id: string;
  name: string;
  color: string;
  isTutor: boolean;
  isConnected: boolean;
}

export interface QuizData {
  publicQuestions: QuizQuestion[];
  privateAnswerKey: QuizAnswer[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  options?: string[];
  pageIndex: number;
}

export interface QuizAnswer {
  questionId: string;
  correctAnswer: string;
  explanation?: string;
}

export interface BrandingConfig {
  logoUrl: string | null;
  color: string | null;
  agencyName: string | null;
  customDomain: string | null;
}

// ============================================================
// Pricing & Tier Configuration
// ============================================================
// FREE:   $0/mo  — Conversion funnel (1 room, 25 AI credits/week)
// PRO:    $10/mo ($96/yr) — Freelance tutors (unlimited rooms, 500 credits/mo)
// AGENCY: $39/mo base + $1.50/active student/mo — Tutoring centers
// ============================================================

export const PRICING = {
  FREE: { monthly: 0, annual: 0, label: 'Free' },
  PRO:  { monthly: 10, annual: 96, label: 'Pro Tutor' },
  AGENCY: { monthly: 39, annual: 390, label: 'Agency', perStudent: 1.50 },
} as const;

// Tier limits configuration
export const TIER_LIMITS = {
  FREE: {
    maxActiveRooms: 1,
    videoMinutesPerWeek: 120,
    aiCreditsPerWeek: 25,
    recordingsPerMonth: 0,
    features: {
      uploads: false,
      saveLoad: false,
      templates: false,
      downloadPdf: false,
      geogebra: false,
      shapePerfect: false,
      mathpix: false,
      aiTools: false,
      recordings: false,
      whiteLabel: false,
      adminDashboard: false,
    },
  },
  PRO: {
    maxActiveRooms: Infinity,
    videoMinutesPerWeek: Infinity,
    aiCreditsPerMonth: 500,
    recordingsPerMonth: 2,
    features: {
      uploads: true,
      saveLoad: true,
      templates: true,
      downloadPdf: true,
      geogebra: true,
      shapePerfect: true,
      mathpix: true,
      aiTools: true,
      recordings: true,
      whiteLabel: false,
      adminDashboard: false,
    },
  },
  AGENCY: {
    maxActiveRooms: Infinity,
    videoMinutesPerWeek: Infinity,
    aiCreditsPerMonth: 5000,
    recordingsPerMonth: Infinity,
    features: {
      uploads: true,
      saveLoad: true,
      templates: true,
      downloadPdf: true,
      geogebra: true,
      shapePerfect: true,
      mathpix: true,
      aiTools: true,
      recordings: true,
      whiteLabel: true,
      adminDashboard: true,
    },
  },
} as const;

export type FeatureFlag = keyof typeof TIER_LIMITS.FREE.features;

// ============================================================
// Dashboard Row Types
// ============================================================
export interface BoardRow {
  id: string;
  subject: string;
  isActive: boolean;
  createdAt: string;
  brandingColor: string | null;
}

export interface TemplateRow {
  id: string;
  name: string;
  subject: string;
  createdAt: string;
}

export interface SubTutorRow {
  id: string;
  email: string;
  name: string | null;
  tier: string;
  activeRooms: number;
  videoMinutesUsed: number;
  aiCreditsUsed: number;
  joinedAt: string | null;
}

export interface InviteRow {
  id: string;
  code: string;
  invitedEmail: string;
  status: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  recipient: { id: string; name: string | null; email: string | null } | null;
}
