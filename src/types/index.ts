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

// Tier limits configuration
export const TIER_LIMITS = {
  FREE: {
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
      aiTools: false,
      recordings: false,
      whiteLabel: false,
      adminDashboard: false,
    },
  },
  PRO: {
    videoMinutesPerWeek: Infinity,
    aiCreditsPerMonth: 100,
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
    videoMinutesPerWeek: Infinity,
    aiCreditsPerMonth: Infinity,
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
