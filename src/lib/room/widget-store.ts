// ============================================================
// Superboard — Widget Store (Zustand)
// Manages room-level widget state: open/close, active tab,
// panel visibility, panel mode (dock/float/minimized).
// Separated from whiteboard store.
// ============================================================

import { create } from 'zustand'

// H1 FIX: Subject-to-widget mapping for context-aware sidebar.
// Only shows relevant tools based on the session subject.
export const SUBJECT_WIDGET_MAP: Record<string, WidgetId[]> = {
  MATH: ['math', 'physics', 'statistics', 'ai', 'assessment', 'notes', 'templates', 'analytics'],
  SCIENCE: ['physics', 'chemistry', 'biology', 'earthscience', 'math', 'statistics', 'ai', 'assessment', 'notes', 'templates'],
  LANGUAGE: ['language', 'math', 'ai', 'assessment', 'notes', 'templates'],
  ART: ['arts', 'ai', 'notes', 'templates', 'math'],
  MUSIC: ['arts', 'ai', 'notes', 'templates'],
  CODING: ['ai', 'notes', 'templates', 'math'],
  TEST_PREP: ['math', 'language', 'statistics', 'ai', 'assessment', 'notes', 'templates'],
  ESL: ['language', 'ai', 'notes', 'templates'],
  GENERAL: [], // Empty = show all (default/fallback)
}

// Task 46 / Fix #1 — The 9 subject toolkits a tutor can pin to their
// toggle bar when the session subject is GENERAL (the standalone
// whiteboard default). A language tutor doesn't want Math/Physics/etc.
// cluttering their toggle bar by default.
export const SUBJECT_TOOLKIT_IDS: WidgetId[] = [
  'math',
  'physics',
  'chemistry',
  'biology',
  'language',
  'statistics',
  'earthscience',
  'arts',
  'classroom',
]

/** Sensible defaults for a brand-new tutor who hasn't customized yet. */
export const DEFAULT_INSTALLED_SUBJECTS: string[] = ['math', 'language', 'classroom']

/**
 * Get visible widget IDs filtered by subject.
 *
 * - If `subject` is set (anything other than GENERAL/unknown): returns
 *   that subject's mapped widgets (existing behavior).
 * - If `subject` is GENERAL AND `installedSubjects` is provided and
 *   non-empty: returns only the tutor's pinned subject toolkits. This
 *   is the Fix #1 path — a language tutor sees only Language + Math +
 *   Classroom (or whatever they pinned), not all 9 toolkits.
 * - If `subject` is GENERAL AND `installedSubjects` is empty/omitted:
 *   falls back to showing all tool widgets (legacy behavior).
 */
export function getWidgetsForSubject(subject: string, installedSubjects?: string[]): WidgetId[] {
  const mapped = SUBJECT_WIDGET_MAP[subject]
  if (mapped && mapped.length > 0) {
    return mapped
  }
  // GENERAL / unknown subject
  if (installedSubjects && installedSubjects.length > 0) {
    // Restrict to tutor's pinned subject toolkits. Filter to known IDs
    // so an unknown string in localStorage can't sneak through.
    const pinned = installedSubjects.filter((s): s is WidgetId =>
      (SUBJECT_TOOLKIT_IDS as string[]).includes(s)
    )
    return pinned.length > 0 ? pinned : AVAILABLE_WIDGETS.filter(w => w.section === 'tools').map(w => w.id as WidgetId)
  }
  // Fallback: show all tool widgets
  return AVAILABLE_WIDGETS.filter(w => w.section === 'tools').map(w => w.id as WidgetId)
}

export type WidgetId =
  | 'chat'
  | 'participants'
  | 'video'
  | 'recording'
  | 'notes'
  | 'ai'
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'language'
  | 'statistics'
  | 'earthscience'
  | 'arts'
  | 'classroom'
  | 'templates'
  | 'analytics'
  | 'parents'
  | 'scheduling'
  | 'agency'
  | 'breakout'
  | 'assessment'

/** Marketplace tool IDs — sub-tools installed within core widgets */
export type MarketplaceToolId = string

export type PanelMode = 'dock' | 'float' | 'minimized'

export interface WidgetDef {
  id: WidgetId
  label: string
  icon: string // icon identifier for rendering
  section?: 'communication' | 'tools'
}

export const AVAILABLE_WIDGETS: WidgetDef[] = [
  // Communication widgets
  { id: 'chat', label: 'Chat', icon: 'MessageCircle', section: 'communication' },
  { id: 'participants', label: 'Participants', icon: 'Users', section: 'communication' },
  { id: 'video', label: 'Video', icon: 'Video', section: 'communication' },
  { id: 'recording', label: 'Recording', icon: 'RecordCircle', section: 'communication' },
  { id: 'notes', label: 'Notes', icon: 'NotebookPen', section: 'tools' },
  // Tool widgets
  { id: 'ai', label: 'AI Assistant', icon: 'Sparkles', section: 'tools' },
  { id: 'math', label: 'Math Tools', icon: 'Calculator', section: 'tools' },
  { id: 'physics', label: 'Physics', icon: 'Zap', section: 'tools' },
  { id: 'chemistry', label: 'Chemistry', icon: 'Atom', section: 'tools' },
  { id: 'biology', label: 'Biology', icon: 'Leaf', section: 'tools' },
  { id: 'language', label: 'Language', icon: 'Languages', section: 'tools' },
  { id: 'statistics', label: 'Statistics', icon: 'BarChart3', section: 'tools' },
  { id: 'earthscience', label: 'Earth Science', icon: 'Globe', section: 'tools' },
  { id: 'arts', label: 'Arts & Music', icon: 'Palette', section: 'tools' },
  { id: 'classroom', label: 'Classroom', icon: 'Timer', section: 'tools' },
  { id: 'templates', label: 'Templates', icon: 'LayoutTemplate', section: 'tools' },
  // Analytics widgets
  { id: 'analytics', label: 'Analytics', icon: 'Activity', section: 'tools' },
  { id: 'parents', label: 'Parent Portal', icon: 'UsersRound', section: 'tools' },
  { id: 'scheduling', label: 'Scheduling', icon: 'Calendar', section: 'tools' },
  { id: 'agency', label: 'Agency', icon: 'Building2', section: 'tools' },
  { id: 'breakout', label: 'Breakout Rooms', icon: 'LayoutGrid', section: 'tools' },
  { id: 'assessment', label: 'Assessment', icon: 'ClipboardCheck', section: 'tools' },
]

interface WidgetStore {
  /** Which widget IDs are currently open */
  openWidgets: WidgetId[]
  /** The currently focused/visible tab when multiple are open */
  activeTab: WidgetId | null
  /** Whether the entire widget panel is visible */
  panelVisible: boolean
  /** Panel display mode: dock (right sidebar), float (floating window), minimized (tab bar only) */
  panelMode: PanelMode
  /** Installed marketplace tools (persisted to Supabase) */
  installedTools: Set<MarketplaceToolId>
  /** Task 46 / Fix #1 — Subject toolkits the tutor has pinned for GENERAL sessions.
   *  Persisted to localStorage for guests and to the User model for logged-in tutors. */
  installedSubjects: string[]
  /** Whether the browse modal is open */
  browseModalOpen: boolean

  // Actions
  toggleWidget: (id: WidgetId) => void
  closeWidget: (id: WidgetId) => void
  openWidget: (id: WidgetId) => void
  setActiveTab: (id: WidgetId | null) => void
  closePanel: () => void
  resetWidgets: () => void
  setPanelMode: (mode: PanelMode) => void
  installTool: (id: MarketplaceToolId) => void
  uninstallTool: (id: MarketplaceToolId) => void
  isToolInstalled: (id: MarketplaceToolId) => boolean
  setInstalledTools: (ids: MarketplaceToolId[]) => void
  setInstalledSubjects: (subjects: string[]) => void
  setBrowseModalOpen: (open: boolean) => void
}

export const useWidgetStore = create<WidgetStore>((set, get) => ({
  openWidgets: [],
  activeTab: null,
  panelVisible: false,
  panelMode: 'dock',
  installedTools: new Set<MarketplaceToolId>(),
  installedSubjects: [...DEFAULT_INSTALLED_SUBJECTS],
  browseModalOpen: false,

  toggleWidget: (id) => {
    const { openWidgets, activeTab } = get()
    if (openWidgets.includes(id)) {
      // Close this widget
      const remaining = openWidgets.filter((w) => w !== id)
      const newTab = activeTab === id
        ? (remaining.length > 0 ? remaining[remaining.length - 1] : null)
        : activeTab
      set({
        openWidgets: remaining,
        activeTab: newTab,
        panelVisible: remaining.length > 0,
      })
    } else {
      // Fix #15 — Opening a new panel closes any previously-open panels
      // so only one subject panel renders at a time.
      set({
        openWidgets: [id],
        activeTab: id,
        panelVisible: true,
      })
    }
  },

  closeWidget: (id) => {
    const { openWidgets, activeTab } = get()
    const remaining = openWidgets.filter((w) => w !== id)
    const newTab = activeTab === id
      ? (remaining.length > 0 ? remaining[remaining.length - 1] : null)
      : activeTab
    set({
      openWidgets: remaining,
      activeTab: newTab,
      panelVisible: remaining.length > 0,
    })
  },

  openWidget: (id) => {
    const { openWidgets } = get()
    if (!openWidgets.includes(id)) {
      // Fix #15 — Opening a new panel closes any previously-open panels
      // so only one subject panel renders at a time.
      set({
        openWidgets: [id],
        activeTab: id,
        panelVisible: true,
      })
    } else {
      set({ activeTab: id, panelVisible: true })
    }
  },

  setActiveTab: (id) => set({ activeTab: id }),

  closePanel: () => get().resetWidgets(),

  resetWidgets: () => set({
    openWidgets: [],
    activeTab: null,
    panelVisible: false,
  }),

  setPanelMode: (mode) => set({ panelMode: mode }),

  installTool: (id) => set((state) => {
    if (state.installedTools.has(id)) return {} // No-op if already installed
    const next = new Set(state.installedTools)
    next.add(id)
    return { installedTools: next }
  }),

  uninstallTool: (id) => set((state) => {
    if (!state.installedTools.has(id)) return {} // No-op if not installed
    const next = new Set(state.installedTools)
    next.delete(id)
    return { installedTools: next }
  }),

  isToolInstalled: (id) => get().installedTools.has(id),

  setInstalledTools: (ids) => set({ installedTools: new Set(ids) }),

  setInstalledSubjects: (subjects) => set({ installedSubjects: subjects }),

  setBrowseModalOpen: (open) => set({ browseModalOpen: open }),
}))
