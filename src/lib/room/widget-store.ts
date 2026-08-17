// ============================================================
// Superboard — Widget Store (Zustand)
// Manages room-level widget state: open/close, active tab,
// panel visibility, panel mode (dock/float/minimized).
// Separated from whiteboard store.
// ============================================================

import { create } from 'zustand'

export type WidgetId =
  | 'chat'
  | 'participants'
  | 'video'
  | 'recording'
  | 'notes'
  | 'ai'
  | 'math'
  | 'science'
  | 'language'
  | 'geogebra'
  | 'templates'

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
  { id: 'science', label: 'Science Tools', icon: 'Atom', section: 'tools' },
  { id: 'language', label: 'Language Tools', icon: 'Languages', section: 'tools' },
  { id: 'geogebra', label: 'GeoGebra', icon: 'Shapes', section: 'tools' },
  { id: 'templates', label: 'Templates', icon: 'LayoutTemplate', section: 'tools' },
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

  // Actions
  toggleWidget: (id: WidgetId) => void
  closeWidget: (id: WidgetId) => void
  openWidget: (id: WidgetId) => void
  setActiveTab: (id: WidgetId | null) => void
  closePanel: () => void
  resetWidgets: () => void
  setPanelMode: (mode: PanelMode) => void
}

export const useWidgetStore = create<WidgetStore>((set, get) => ({
  openWidgets: [],
  activeTab: null,
  panelVisible: false,
  panelMode: 'dock',

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
}))
