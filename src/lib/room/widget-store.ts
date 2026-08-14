// ============================================================
// Superboard — Widget Store (Zustand)
// Manages room-level widget state: open/close, active tab,
// panel visibility. Separated from whiteboard store.
// ============================================================

import { create } from 'zustand'

export type WidgetId = 'chat' | 'participants' | 'video'

export interface WidgetDef {
  id: WidgetId
  label: string
  icon: string // lucide icon name
}

export const AVAILABLE_WIDGETS: WidgetDef[] = [
  { id: 'chat', label: 'Chat', icon: 'MessageCircle' },
  { id: 'participants', label: 'Participants', icon: 'Users' },
  { id: 'video', label: 'Video', icon: 'Video' },
]

interface WidgetStore {
  /** Which widget IDs are currently open */
  openWidgets: WidgetId[]
  /** The currently focused/visible tab when multiple are open */
  activeTab: WidgetId | null
  /** Whether the entire widget panel is visible */
  panelVisible: boolean

  // Actions
  toggleWidget: (id: WidgetId) => void
  closeWidget: (id: WidgetId) => void
  openWidget: (id: WidgetId) => void
  setActiveTab: (id: WidgetId | null) => void
  closePanel: () => void
  resetWidgets: () => void
}

export const useWidgetStore = create<WidgetStore>((set, get) => ({
  openWidgets: [],
  activeTab: null,
  panelVisible: false,

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
}))
