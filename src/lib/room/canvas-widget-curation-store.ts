// ============================================================
// Superboard — Canvas Widget Curation Store (Zustand)
// Manages which individual canvas widgets are hidden/visible
// in the toolkit panels, plus template save/load.
// ============================================================

import { create } from 'zustand'
import { ALL_CANVAS_WIDGETS } from './canvas-widget-registry'

export interface CurationTemplate {
  id: string
  name: string
  /** Widget kinds that are HIDDEN in this template */
  hiddenKinds: string[]
  createdAt: number
}

interface CurationStore {
  /** Widget kinds currently hidden from panels */
  hiddenWidgetKinds: Set<string>
  /** Saved templates */
  templates: CurationTemplate[]
  /** Currently active template (null = custom/unsaved) */
  activeTemplateId: string | null
  /** Whether curation data has been loaded from server */
  loaded: boolean

  // Actions
  hideWidgetKind: (kind: string) => void
  restoreWidgetKind: (kind: string) => void
  restoreAllWidgets: () => void
  setHiddenKinds: (kinds: string[]) => void
  setTemplates: (templates: CurationTemplate[]) => void
  saveAsTemplate: (name: string) => CurationTemplate
  loadTemplate: (id: string) => void
  deleteTemplate: (id: string) => void
  setLoaded: (loaded: boolean) => void
  /** Get hidden kinds as array (for serialization) */
  getHiddenArray: () => string[]
  /** Check if a widget kind is hidden */
  isHidden: (kind: string) => boolean
}

function generateTemplateId(): string {
  return 'tpl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export const useCurationStore = create<CurationStore>((set, get) => ({
  hiddenWidgetKinds: new Set<string>(),
  templates: [],
  activeTemplateId: null,
  loaded: false,

  hideWidgetKind: (kind) => {
    set((state) => {
      const next = new Set(state.hiddenWidgetKinds)
      next.add(kind)
      return { hiddenWidgetKinds: next, activeTemplateId: null }
    })
  },

  restoreWidgetKind: (kind) => {
    set((state) => {
      const next = new Set(state.hiddenWidgetKinds)
      next.delete(kind)
      return { hiddenWidgetKinds: next, activeTemplateId: null }
    })
  },

  restoreAllWidgets: () => {
    set({ hiddenWidgetKinds: new Set<string>(), activeTemplateId: null })
  },

  setHiddenKinds: (kinds) => {
    set({ hiddenWidgetKinds: new Set(kinds), activeTemplateId: null })
  },

  setTemplates: (templates) => {
    set({ templates })
  },

  saveAsTemplate: (name) => {
    const template: CurationTemplate = {
      id: generateTemplateId(),
      name,
      hiddenKinds: Array.from(get().hiddenWidgetKinds),
      createdAt: Date.now(),
    }
    set((state) => ({
      templates: [...state.templates, template],
      activeTemplateId: template.id,
    }))
    return template
  },

  loadTemplate: (id) => {
    const tpl = get().templates.find(t => t.id === id)
    if (tpl) {
      set({
        hiddenWidgetKinds: new Set(tpl.hiddenKinds),
        activeTemplateId: id,
      })
    }
  },

  deleteTemplate: (id) => {
    set((state) => {
      const remaining = state.templates.filter(t => t.id !== id)
      return {
        templates: remaining,
        activeTemplateId: state.activeTemplateId === id ? null : state.activeTemplateId,
      }
    })
  },

  setLoaded: (loaded) => set({ loaded }),

  getHiddenArray: () => Array.from(get().hiddenWidgetKinds),

  isHidden: (kind) => get().hiddenWidgetKinds.has(kind),
}))

// ============================================================
// Persistence helpers — called from API layer
// ============================================================

/** Initialize curation from server data */
export function initCurationFromServer(data: { hiddenWidgets?: string[]; templates?: CurationTemplate[] }) {
  const allKinds = new Set(ALL_CANVAS_WIDGETS.map(w => w.kind))
  const serverHidden = new Set(data.hiddenWidgets || [])
  // Only hide widgets that exist in the registry
  const hidden = new Set<string>()
  for (const k of serverHidden) {
    if (allKinds.has(k)) {
      hidden.add(k)
    }
  }
  useCurationStore.setState({
    hiddenWidgetKinds: hidden,
    templates: data.templates || [],
    loaded: true,
  })
}

/** Export curation state for server persistence */
export function exportCurationForServer() {
  const s = useCurationStore.getState()
  return {
    hiddenWidgets: Array.from(s.hiddenWidgetKinds),
    templates: s.templates,
  }
}
