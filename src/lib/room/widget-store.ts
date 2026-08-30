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
  MATH: ['math', 'ai', 'notes', 'templates', 'analytics'],
  SCIENCE: ['physics', 'chemistry', 'biology', 'earthscience', 'math', 'ai', 'notes', 'templates'],
  LANGUAGE: ['language', 'ai', 'notes', 'templates'],
  ART: ['ai', 'notes', 'templates'],
  MUSIC: ['ai', 'notes', 'templates'],
  CODING: ['ai', 'notes', 'templates'],
  TEST_PREP: ['math', 'language', 'ai', 'notes', 'templates'],
  ESL: ['language', 'ai', 'notes', 'templates'],
  GENERAL: [], // Empty = show all (default/fallback)
}

/** Get visible widget IDs filtered by subject */
export function getWidgetsForSubject(subject: string): WidgetId[] {
  const extra = SUBJECT_WIDGET_MAP[subject]
  if (!extra || extra.length === 0) {
    // GENERAL or unknown: show all tool widgets
    return AVAILABLE_WIDGETS.filter(w => w.section === 'tools').map(w => w.id as WidgetId)
  }
  return extra
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
  | 'classroom'
  | 'templates'
  | 'analytics'
  | 'parents'
  | 'scheduling'
  | 'agency'
  | 'breakout'

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
  { id: 'classroom', label: 'Classroom', icon: 'Timer', section: 'tools' },
  { id: 'templates', label: 'Templates', icon: 'LayoutTemplate', section: 'tools' },
  // Analytics widgets
  { id: 'analytics', label: 'Analytics', icon: 'Activity', section: 'tools' },
  { id: 'parents', label: 'Parent Portal', icon: 'UsersRound', section: 'tools' },
  { id: 'scheduling', label: 'Scheduling', icon: 'Calendar', section: 'tools' },
  { id: 'agency', label: 'Agency', icon: 'Building2', section: 'tools' },
  { id: 'breakout', label: 'Breakout Rooms', icon: 'LayoutGrid', section: 'tools' },
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
  setBrowseModalOpen: (open: boolean) => void
}

export const useWidgetStore = create<WidgetStore>((set, get) => ({
  openWidgets: [],
  activeTab: null,
  panelVisible: false,
  panelMode: 'dock',
  installedTools: new Set<MarketplaceToolId>(),
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
      // Open this widget
      const newOpen = [...openWidgets, id]
      set({
        openWidgets: newOpen,
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
      set({
        openWidgets: [...openWidgets, id],
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

  setBrowseModalOpen: (open) => set({ browseModalOpen: open }),
}))
