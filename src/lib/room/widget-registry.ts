// ============================================================
// Superboard — Widget Registry & Manifest
// Replaces hardcoded AVAILABLE_WIDGETS with a rich manifest system.
// All widgets (core + marketplace) are defined here.
// ============================================================

export type GradeBand = 'K-2' | '3-5' | '6-8' | '9-12'
export type WidgetSubject = 'communication' | 'productivity' | 'math' | 'physics' | 'chemistry' | 'biology' | 'language' | 'statistics' | 'earthscience' | 'classroom' | 'other'
export type WidgetTier = 'free' | 'pro' | 'agency'
export type ToolType = 'demonstration' | 'diagnostic' | 'communication' | 'utility'
export type WidgetPhase = 1 | 2 | 3

export interface WidgetManifest {
  /** Unique identifier — maps to WidgetId for core widgets */
  id: string
  /** Display name shown in toggle bar and catalog */
  label: string
  /** Lucide icon name for rendering */
  icon: string
  /** One-liner description for catalog cards */
  description: string
  /** Detailed description for catalog detail view */
  fullDescription?: string
  /** Subject/category for filtering */
  subject: WidgetSubject
  /** Which grade bands this widget is relevant for */
  gradeBands: GradeBand[]
  /** Demonstration (real-time shared) vs Diagnostic (tutor reveals) */
  toolType: ToolType
  /** Minimum tier required — core widgets are 'free' */
  tier: WidgetTier
  /** Phase: 1 = core (always installed), 2 = high-value, 3 = nice-to-have */
  phase: WidgetPhase
  /** Widget section in toggle bar */
  section?: 'communication' | 'tools'
  /** Whether this widget requires installation (marketplace) */
  requiresInstall: boolean
  /** Status for Phase 2/3 not yet built */
  status?: 'available' | 'coming_soon'
}

// ============================================================
// CORE WIDGETS (Phase 1 — always installed, free tier)
// These are the built-in platform widgets.
// ============================================================

export const CORE_WIDGETS: WidgetManifest[] = [
  // ---- Communication ----
  {
    id: 'chat',
    label: 'Chat',
    icon: 'MessageCircle',
    description: 'Real-time text chat with your student',
    subject: 'communication',
    gradeBands: ['K-2', '3-5', '6-8', '9-12'],
    toolType: 'communication',
    tier: 'free',
    phase: 1,
    section: 'communication',
    requiresInstall: false,
  },
  {
    id: 'participants',
    label: 'Participants',
    icon: 'Users',
    description: 'See who is in the session',
    subject: 'communication',
    gradeBands: ['K-2', '3-5', '6-8', '9-12'],
    toolType: 'communication',
    tier: 'free',
    phase: 1,
    section: 'communication',
    requiresInstall: false,
  },
  {
    id: 'video',
    label: 'Video',
    icon: 'Video',
    description: 'Video call with your student',
    subject: 'communication',
    gradeBands: ['K-2', '3-5', '6-8', '9-12'],
    toolType: 'communication',
    tier: 'free',
    phase: 1,
    section: 'communication',
    requiresInstall: false,
  },
  {
    id: 'recording',
    label: 'Recording',
    icon: 'RecordCircle',
    description: 'Record the tutoring session',
    subject: 'communication',
    gradeBands: ['K-2', '3-5', '6-8', '9-12'],
    toolType: 'utility',
    tier: 'free',
    phase: 1,
    section: 'communication',
    requiresInstall: false,
  },

  // ---- Productivity ----
  {
    id: 'notes',
    label: 'Notes',
    icon: 'NotebookPen',
    description: 'Session notes and key takeaways',
    subject: 'productivity',
    gradeBands: ['K-2', '3-5', '6-8', '9-12'],
    toolType: 'utility',
    tier: 'free',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },
  {
    id: 'ai',
    label: 'AI Assistant',
    icon: 'Sparkles',
    description: 'AI-powered teaching assistant',
    subject: 'productivity',
    gradeBands: ['K-2', '3-5', '6-8', '9-12'],
    toolType: 'utility',
    tier: 'free',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: 'LayoutTemplate',
    description: 'Load and manage whiteboard templates',
    subject: 'productivity',
    gradeBands: ['K-2', '3-5', '6-8', '9-12'],
    toolType: 'utility',
    tier: 'free',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'BarChart3',
    description: 'Session usage analytics and insights',
    subject: 'productivity',
    gradeBands: ['K-2', '3-5', '6-8', '9-12'],
    toolType: 'utility',
    tier: 'free',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },
  {
    id: 'parents',
    label: 'Parent Portal',
    icon: 'UsersRound',
    description: 'Share session summaries with parents',
    subject: 'productivity',
    gradeBands: ['K-2', '3-5', '6-8', '9-12'],
    toolType: 'utility',
    tier: 'free',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },
  {
    id: 'scheduling',
    label: 'Scheduling',
    icon: 'Calendar',
    description: 'Manage your tutoring availability and bookings',
    subject: 'productivity',
    gradeBands: ['K-2', '3-5', '6-8', '9-12'],
    toolType: 'utility',
    tier: 'free',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },
  {
    id: 'agency',
    label: 'Agency',
    icon: 'Building2',
    description: 'Agency management and sub-tutor invites',
    subject: 'productivity',
    gradeBands: ['K-2', '3-5', '6-8', '9-12'],
    toolType: 'utility',
    tier: 'agency',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },
  {
    id: 'breakout',
    label: 'Breakout Rooms',
    icon: 'LayoutGrid',
    description: 'Split students into breakout rooms',
    subject: 'productivity',
    gradeBands: ['K-2', '3-5', '6-8', '9-12'],
    toolType: 'utility',
    tier: 'pro',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },

  // ---- Subject Toolkits ----
  {
    id: 'math',
    label: 'Math Tools',
    icon: 'Calculator',
    description: 'Algebra, geometry, graphing, and equation tools',
    subject: 'math',
    gradeBands: ['K-2', '3-5', '6-8', '9-12'],
    toolType: 'demonstration',
    tier: 'free',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },
  {
    id: 'physics',
    label: 'Physics',
    icon: 'Zap',
    description: 'Forces, motion, energy, and wave simulations',
    subject: 'physics',
    gradeBands: ['6-8', '9-12'],
    toolType: 'demonstration',
    tier: 'free',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },
  {
    id: 'chemistry',
    label: 'Chemistry',
    icon: 'Atom',
    description: 'Molecular models, reactions, and periodic table',
    subject: 'chemistry',
    gradeBands: ['6-8', '9-12'],
    toolType: 'demonstration',
    tier: 'free',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },
  {
    id: 'biology',
    label: 'Biology',
    icon: 'Leaf',
    description: 'Cell structures, genetics, and ecology tools',
    subject: 'biology',
    gradeBands: ['6-8', '9-12'],
    toolType: 'demonstration',
    tier: 'free',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },
  {
    id: 'language',
    label: 'Language',
    icon: 'Languages',
    description: 'Phonics, grammar, reading, and writing tools for K-12 ELA',
    fullDescription: 'Comprehensive English Language Arts toolkit with 15 tools across 3 phases. Phase 1 (core): Phonics & Decoding, Parts of Speech Tagger, Sentence Expansion, Punctuation Rules, Paragraph Organizer. Plus 5 original tools: Vocabulary Flashcards, Reading Passage Analyzer, Story Elements Map, Sentence Structure Builder, Figurative Language Finder.',
    subject: 'language',
    gradeBands: ['K-2', '3-5', '6-8', '9-12'],
    toolType: 'demonstration',
    tier: 'free',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },
  {
    id: 'statistics',
    label: 'Statistics',
    icon: 'BarChart3',
    description: 'Data analysis, probability, and statistical tools',
    subject: 'statistics',
    gradeBands: ['6-8', '9-12'],
    toolType: 'demonstration',
    tier: 'free',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },
  {
    id: 'earthscience',
    label: 'Earth Science',
    icon: 'Globe',
    description: 'Geology, weather, and astronomy tools',
    subject: 'earthscience',
    gradeBands: ['6-8', '9-12'],
    toolType: 'demonstration',
    tier: 'free',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },
  {
    id: 'classroom',
    label: 'Classroom',
    icon: 'Timer',
    description: 'Timers, random pickers, and classroom management',
    subject: 'classroom',
    gradeBands: ['K-2', '3-5', '6-8', '9-12'],
    toolType: 'utility',
    tier: 'free',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },
  {
    id: 'geogebra',
    label: 'GeoGebra',
    icon: 'Shapes',
    description: 'Interactive geometry, algebra, and calculus',
    subject: 'math',
    gradeBands: ['6-8', '9-12'],
    toolType: 'demonstration',
    tier: 'free',
    phase: 1,
    section: 'tools',
    requiresInstall: false,
  },
]

// ============================================================
// MARKETPLACE WIDGETS (Phase 2 — high-value, install-required)
// ============================================================

export const MARKETPLACE_WIDGETS: WidgetManifest[] = [
  // ---- Language Phase 2 ----
  {
    id: 'lang-root-morphology',
    label: 'Root & Morphology Explorer',
    icon: 'GitBranch',
    description: 'Break down words into roots, prefixes, and suffixes with visual word trees',
    fullDescription: 'Type any word and instantly see its morphological breakdown — root origin (Latin/Greek), prefixes, suffixes, and related words. Includes common word families (port, dict, struct, ject, etc.) and a searchable database of 200+ roots. Perfect for vocabulary building across grade levels.',
    subject: 'language',
    gradeBands: ['3-5', '6-8', '9-12'],
    toolType: 'demonstration',
    tier: 'pro',
    phase: 2,
    requiresInstall: true,
    status: 'available',
  },
  {
    id: 'lang-active-passive',
    label: 'Active & Passive Voice',
    icon: 'ArrowLeftRight',
    description: 'Transform sentences between active and passive voice with step-by-step visualization',
    fullDescription: 'Enter any sentence and see it transformed between active and passive voice. Highlights the subject-verb-object shift, shows tense preservation, and explains when each voice is appropriate. Uses compromise.js for accurate POS-based analysis.',
    subject: 'language',
    gradeBands: ['6-8', '9-12'],
    toolType: 'demonstration',
    tier: 'pro',
    phase: 2,
    requiresInstall: true,
    status: 'available',
  },
  {
    id: 'lang-reading-strategies',
    label: 'Reading Comprehension Strategies',
    icon: 'BookOpen',
    description: 'Guided reading frameworks: SQ3R, 5W1H, SWBST, KWL — no auto-generation, tutor-driven',
    fullDescription: 'Four structured reading frameworks that tutors work through WITH students: SQ3R (Survey, Question, Read, Recite, Review), 5W1H (Who, What, When, Where, Why, How), SWBST (Somebody, Wanted, But, So, Then), and KWL (Know, Want to Know, Learned). Each provides a guided template — the tutor leads the thinking, not the tool.',
    subject: 'language',
    gradeBands: ['3-5', '6-8', '9-12'],
    toolType: 'demonstration',
    tier: 'pro',
    phase: 2,
    requiresInstall: true,
    status: 'available',
  },
  {
    id: 'lang-grammar-diagnostic',
    label: 'Grammar Error Diagnostic',
    icon: 'SearchCheck',
    description: 'Rule-based grammar checker with pattern matching — tutor sees errors first, then reveals',
    fullDescription: 'Paste any student writing and get a rule-based grammar analysis. Detects subject-verb agreement, tense consistency, article usage, comma splices, run-ons, and more. Uses pattern matching (no AI) — accurate for common errors but has limitations. Tutor sees results first via the reveal-on-demand pattern. Includes a disclaimer about rule-based limitations.',
    subject: 'language',
    gradeBands: ['6-8', '9-12'],
    toolType: 'diagnostic',
    tier: 'pro',
    phase: 2,
    requiresInstall: true,
    status: 'available',
  },
  {
    id: 'lang-spelling-patterns',
    label: 'Spelling Patterns',
    icon: 'Type',
    description: 'Explore English spelling rules, patterns, and exceptions interactively',
    fullDescription: 'Browse and search English spelling patterns: consonant doubling, silent letters, ie/ei rules, plural formation, -tion/-sion patterns, and grade-appropriate word lists. Tutors select a pattern and demonstrate it live — students see the pattern applied in real time.',
    subject: 'language',
    gradeBands: ['K-2', '3-5', '6-8'],
    toolType: 'demonstration',
    tier: 'pro',
    phase: 2,
    requiresInstall: true,
    status: 'available',
  },
]

// ============================================================
// Phase 3 placeholders (coming soon)
// ============================================================

export const COMING_SOON_WIDGETS: WidgetManifest[] = [
  {
    id: 'lang-vocabulary-depth',
    label: 'Vocabulary Depth Analyzer',
    icon: 'BookMarked',
    description: 'Analyze word choice, connotation, and vocabulary sophistication in student writing',
    subject: 'language',
    gradeBands: ['6-8', '9-12'],
    toolType: 'diagnostic',
    tier: 'pro',
    phase: 3,
    requiresInstall: true,
    status: 'coming_soon',
  },
  {
    id: 'lang-text-structure',
    label: 'Text Structure Identifier',
    icon: 'ListTree',
    description: 'Identify and teach text structures: cause/effect, compare/contrast, problem/solution, sequence',
    subject: 'language',
    gradeBands: ['3-5', '6-8', '9-12'],
    toolType: 'demonstration',
    tier: 'pro',
    phase: 3,
    requiresInstall: true,
    status: 'coming_soon',
  },
  {
    id: 'lang-poetry-analysis',
    label: 'Poetry Analysis',
    icon: 'Feather',
    description: 'Analyze rhyme scheme, meter, figurative language, and poetic devices',
    subject: 'language',
    gradeBands: ['6-8', '9-12'],
    toolType: 'demonstration',
    tier: 'pro',
    phase: 3,
    requiresInstall: true,
    status: 'coming_soon',
  },
  {
    id: 'lang-thesis-builder',
    label: 'Thesis Statement Builder',
    icon: 'Target',
    description: 'Step-by-step thesis construction for argumentative and analytical essays',
    subject: 'language',
    gradeBands: ['6-8', '9-12'],
    toolType: 'demonstration',
    tier: 'pro',
    phase: 3,
    requiresInstall: true,
    status: 'coming_soon',
  },
  {
    id: 'lang-citation-integrator',
    label: 'Citation Integrator',
    icon: 'Quote',
    description: 'MLA and APA citation formatting with in-text citation guidance',
    subject: 'language',
    gradeBands: ['6-8', '9-12'],
    toolType: 'demonstration',
    tier: 'pro',
    phase: 3,
    requiresInstall: true,
    status: 'coming_soon',
  },
]

// ============================================================
// Helper functions
// ============================================================

/** All widgets combined */
export const ALL_WIDGETS: WidgetManifest[] = [
  ...CORE_WIDGETS,
  ...MARKETPLACE_WIDGETS,
  ...COMING_SOON_WIDGETS,
]

/** Get manifest by ID */
export function getWidgetManifest(id: string): WidgetManifest | undefined {
  return ALL_WIDGETS.find((w) => w.id === id)
}

/** Get widgets available for a given tier */
export function getWidgetsForTier(tier: WidgetTier): WidgetManifest[] {
  const tierOrder: WidgetTier[] = ['free', 'pro', 'agency']
  const tierIdx = tierOrder.indexOf(tier)
  return ALL_WIDGETS.filter((w) => {
    const wIdx = tierOrder.indexOf(w.tier)
    return wIdx <= tierIdx
  })
}

/** Get marketplace widgets (those requiring installation) */
export function getMarketplaceWidgets(): WidgetManifest[] {
  return ALL_WIDGETS.filter((w) => w.requiresInstall)
}

/** Get widgets by subject */
export function getWidgetsBySubject(subject: WidgetSubject): WidgetManifest[] {
  return ALL_WIDGETS.filter((w) => w.subject === subject)
}

// ============================================================
// Backward-compatible AVAILABLE_WIDGETS for existing code
// ============================================================

// Re-export the type so downstream imports work
import type { WidgetId } from './widget-store'

export const AVAILABLE_WIDGETS = CORE_WIDGETS.filter(w => !w.requiresInstall).map((w) => ({
  id: w.id as WidgetId,
  label: w.label,
  icon: w.icon,
  section: w.section as 'communication' | 'tools' | undefined,
}))
