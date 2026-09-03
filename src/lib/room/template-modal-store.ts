// ============================================================
// Superboard — Template Modal Store
// Tiny store that lets any component open the Phase 2 template modals
// (SaveAsTemplateModal, MyTemplatesPanel, CommunityTemplatesPanel)
// without prop-drilling through WidgetPanel.
//
// WhiteboardClient registers the openers once on mount.
// TemplatesWidget (the right-sidebar Templates tab) reads them.
// ============================================================

import { create } from 'zustand'

interface TemplateModalState {
  openSaveModal: (() => void) | null
  openMyTemplates: (() => void) | null
  openCommunityTemplates: (() => void) | null
  setOpenSaveModal: (fn: (() => void) | null) => void
  setOpenMyTemplates: (fn: (() => void) | null) => void
  setOpenCommunityTemplates: (fn: (() => void) | null) => void
}

export const useTemplateModalStore = create<TemplateModalState>((set) => ({
  openSaveModal: null,
  openMyTemplates: null,
  openCommunityTemplates: null,
  setOpenSaveModal: (fn) => set({ openSaveModal: fn }),
  setOpenMyTemplates: (fn) => set({ openMyTemplates: fn }),
  setOpenCommunityTemplates: (fn) => set({ openCommunityTemplates: fn }),
}))
