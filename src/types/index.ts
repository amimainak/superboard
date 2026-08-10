// ============================================================
// K-12 AI SUPERBOARD — Shared Types
// ============================================================

export type Tier = 'FREE' | 'PRO' | 'AGENCY' | 'AGENCY_STANDARD' | 'AGENCY_PREMIUM';

/** Check if a tier is any agency tier (AGENCY, AGENCY_STANDARD, or AGENCY_PREMIUM) */
export function isAgencyTier(tier: Tier): boolean {
  return tier === 'AGENCY' || tier === 'AGENCY_STANDARD' || tier === 'AGENCY_PREMIUM';
}

export type Subject = 'MATH' | 'SCIENCE' | 'LANGUAGE' | 'GENERAL';

export type AIAction =
  // Original 14 actions
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
  | 'CONCEPT_SUMMARIZER'
  // Enhanced actions (wired from ai-enhancements.ts)
  | 'LESSON_PLAN'
  | 'DIFFERENTIATED_INSTRUCTION'
  | 'FORMATIVE_ASSESSMENT'
  | 'RUBRIC_GENERATOR'
  | 'STUDENT_FEEDBACK'
  | 'CONCEPT_EXPLAINER'
  | 'STEP_BY_STEP_SOLVER'
  | 'FLASHCARD_GENERATOR'
  | 'WORD_PROBLEM_BUILDER'
  | 'ANNOTATION_HELPER';

// Text-only actions → routed to Claude 3 Haiku (cheap, fast)
export const TEXT_AI_ACTIONS: AIAction[] = [
  // Original
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
  // Enhanced
  'LESSON_PLAN',
  'DIFFERENTIATED_INSTRUCTION',
  'FORMATIVE_ASSESSMENT',
  'RUBRIC_GENERATOR',
  'STUDENT_FEEDBACK',
  'CONCEPT_EXPLAINER',
  'STEP_BY_STEP_SOLVER',
  'FLASHCARD_GENERATOR',
  'WORD_PROBLEM_BUILDER',
  'ANNOTATION_HELPER',
];

// Vision actions → routed to Claude 3.5 Sonnet (expensive, accurate)
export const VISION_AI_ACTIONS: AIAction[] = [
  'PLOT_GRAPH',
  'PERFECT_SHAPE',
  'HANDWRITING_TO_MATH',
  'DIAGRAM_GENERATOR',
];

// ---- Variable Credit Costs per Action ----
// Text (Haiku) actions are cheap → 1-2 credits
// Vision (Sonnet) actions are expensive → 2-3 credits
// Enhanced (Pro-only) actions are premium → 5 credits

export const CREDIT_COSTS: Record<AIAction, number> = {
  // Original — cheap wow features (give to free users)
  QUIZ: 1,
  WORKSHEET: 2,
  SUMMARY: 1,
  GRAMMAR: 1,
  OUTLINE: 1,
  VOCAB_QUIZ: 1,
  PHONICS_HELPER: 1,
  TIMELINE_GENERATOR: 1,
  CONCEPT_SUMMARIZER: 1,
  CHEMICAL_BALANCER: 1,
  LAB_SUMMARY: 1,
  // Vision — higher cost, still available to free
  PLOT_GRAPH: 3,
  PERFECT_SHAPE: 2,
  HANDWRITING_TO_MATH: 3,
  DIAGRAM_GENERATOR: 3,
  // Enhanced — Pro-only, premium pricing
  LESSON_PLAN: 5,
  DIFFERENTIATED_INSTRUCTION: 5,
  FORMATIVE_ASSESSMENT: 5,
  RUBRIC_GENERATOR: 5,
  STUDENT_FEEDBACK: 3,
  CONCEPT_EXPLAINER: 3,
  STEP_BY_STEP_SOLVER: 3,
  FLASHCARD_GENERATOR: 3,
  WORD_PROBLEM_BUILDER: 5,
  ANNOTATION_HELPER: 3,
};

// Enhanced actions are Pro+ only (not available on free tier)
export const ENHANCED_ACTION_SET: ReadonlySet<AIAction> = new Set([
  'LESSON_PLAN',
  'DIFFERENTIATED_INSTRUCTION',
  'FORMATIVE_ASSESSMENT',
  'RUBRIC_GENERATOR',
  'STUDENT_FEEDBACK',
  'CONCEPT_EXPLAINER',
  'STEP_BY_STEP_SOLVER',
  'FLASHCARD_GENERATOR',
  'WORD_PROBLEM_BUILDER',
  'ANNOTATION_HELPER',
]);

// Actions available on the free tier (original 14 only, no enhanced)
export const FREE_TIER_ACTIONS: ReadonlySet<AIAction> = new Set([
  'QUIZ',
  'WORKSHEET',
  'SUMMARY',
  'GRAMMAR',
  'OUTLINE',
  'PLOT_GRAPH',
  'PERFECT_SHAPE',
  'HANDWRITING_TO_MATH',
  'DIAGRAM_GENERATOR',
  'CHEMICAL_BALANCER',
  'LAB_SUMMARY',
  'VOCAB_QUIZ',
  'PHONICS_HELPER',
  'TIMELINE_GENERATOR',
  'CONCEPT_SUMMARIZER',
]);

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
// FREE:             $0/mo  — Conversion funnel (1 room, 10 smart credits/week, AI enabled)
// PRO:              $10/mo ($96/yr) — Freelance tutors (unlimited rooms, 500 credits/mo)
// AGENCY_STANDARD:  $39/mo + $3.00/hr — Small agencies (up to 5 sub-tutors, 5000 credits/mo)
// AGENCY_PREMIUM:   $79/mo + $2.00/hr — Large agencies (unlimited sub-tutors, 5000 credits/mo)
// ============================================================

export const PRICING = {
  FREE: { monthly: 0, annual: 0, label: 'Free' },
  PRO:  { monthly: 10, annual: 96, label: 'Pro Tutor' },
  AGENCY: { monthly: 39, annual: 390, label: 'Agency', perHour: 3.00 }, // Legacy fallback
  AGENCY_STANDARD: { monthly: 39, annual: 390, label: 'Agency Standard', perHour: 3.00, maxSubTutors: 5 },
  AGENCY_PREMIUM:  { monthly: 79, annual: 790, label: 'Agency Premium', perHour: 2.00, maxSubTutors: Infinity },
} as const;

// Tier limits configuration
const AGENCY_FEATURES = {
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
};

export const TIER_LIMITS = {
  FREE: {
    maxActiveRooms: 1,
    maxSubTutors: 0,
    videoMinutesPerWeek: 120,
    aiCreditsPerWeek: 10,
    recordingsPerMonth: 0,
    features: {
      uploads: false,
      saveLoad: false,
      templates: false,
      downloadPdf: false,
      geogebra: false,
      shapePerfect: false,
      mathpix: false,
      aiTools: true,  // UNLOCKED: Give free users a taste of AI to drive conversion
      recordings: false,
      whiteLabel: false,
      adminDashboard: false,
    },
  },
  PRO: {
    maxActiveRooms: Infinity,
    maxSubTutors: 0,
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
    maxSubTutors: 5,
    videoMinutesPerWeek: Infinity,
    aiCreditsPerMonth: 5000,
    recordingsPerMonth: Infinity,
    features: AGENCY_FEATURES,
  },
  AGENCY_STANDARD: {
    maxActiveRooms: Infinity,
    maxSubTutors: 5,
    videoMinutesPerWeek: Infinity,
    aiCreditsPerMonth: 5000,
    recordingsPerMonth: Infinity,
    features: AGENCY_FEATURES,
  },
  AGENCY_PREMIUM: {
    maxActiveRooms: Infinity,
    maxSubTutors: Infinity,
    videoMinutesPerWeek: Infinity,
    aiCreditsPerMonth: 5000,
    recordingsPerMonth: Infinity,
    features: AGENCY_FEATURES,
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

export interface StudentRow {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  deactivatedAt: string | null;
  lessonsAttended?: number;
  lastSeen?: string | null;
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
