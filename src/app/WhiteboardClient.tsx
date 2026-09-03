// ============================================================
// Superboard — Main Whiteboard Client
// Orchestrates all components: toolbar, canvas, style panel, etc.
// React + SVG + perfect-freehand (MIT License)
// ============================================================

'use client'

import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { TopBar } from '@/components/whiteboard/TopBar'
import { ShortcutsDialog } from '@/components/whiteboard/ShortcutsDialog'
import { LeftToolbar } from '@/components/whiteboard/LeftToolbar'
import { WhiteboardCanvas } from '@/components/whiteboard/WhiteboardCanvas'
import { StylePanel } from '@/components/whiteboard/StylePanel'
import { PageTabs } from '@/components/whiteboard/PageTabs'
import { SearchOverlay } from '@/components/whiteboard/SearchOverlay'
import { MobileBottomToolbar } from '@/components/whiteboard/MobileBottomToolbar'
import { SaveAsTemplateModal } from '@/components/whiteboard/SaveAsTemplateModal'
import { MyTemplatesPanel } from '@/components/whiteboard/MyTemplatesPanel'
import { CommunityTemplatesPanel } from '@/components/whiteboard/CommunityTemplatesPanel'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { useTemplateModalStore } from '@/lib/room/template-modal-store'
import type { TemplateFull } from '@/types'
import {
  exportAsPng,
  exportAsJpg,
  exportAsSvg,
  exportAsJson,
  downloadBlob,
  downloadString,
} from '@/lib/whiteboard/export'

export default function WhiteboardClient() {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const tool = useWhiteboardStore((s) => s.tool)
  const camera = useWhiteboardStore(useShallow((s) => s.camera))
  const pages = useWhiteboardStore(useShallow((s) => s.pages))
  const currentPageIndex = useWhiteboardStore((s) => s.currentPageIndex)
  const elements = useWhiteboardStore(useShallow((s) => s.elements))
  const shortcutsOpen = useWhiteboardStore((s) => s.shortcutsOpen)
  const selectedIds = useWhiteboardStore(useShallow((s) => s.selectedIds))
  const showGrid = useWhiteboardStore((s) => s.showGrid)
  const snapToGrid = useWhiteboardStore((s) => s.snapToGrid)
  const gridType = useWhiteboardStore((s) => s.gridType)
  const isPresentationMode = useWhiteboardStore((s) => s.isPresentationMode)

  const setShortcutsOpen = useWhiteboardStore((s) => s.setShortcutsOpen)
  const zoomIn = useWhiteboardStore((s) => s.zoomIn)
  const zoomOut = useWhiteboardStore((s) => s.zoomOut)
  const zoomReset = useWhiteboardStore((s) => s.zoomReset)
  const zoomToFit = useWhiteboardStore((s) => s.zoomToFit)
  const groupSelected = useWhiteboardStore((s) => s.groupSelected)
  const ungroupSelected = useWhiteboardStore((s) => s.ungroupSelected)
  const toggleLock = useWhiteboardStore((s) => s.toggleLock)
  const selectAll = useWhiteboardStore((s) => s.selectAll)
  const bringToFront = useWhiteboardStore((s) => s.bringToFront)
  const sendToBack = useWhiteboardStore((s) => s.sendToBack)
  const addElement = useWhiteboardStore((s) => s.addElement)
  const pushHistory = useWhiteboardStore((s) => s.pushHistory)
  const toggleDark = useWhiteboardStore((s) => s.toggleDark)
  const toggleGrid = useWhiteboardStore((s) => s.toggleGrid)
  const toggleSnap = useWhiteboardStore((s) => s.toggleSnap)
  const setGridType = useWhiteboardStore((s) => s.setGridType)
  const togglePresentationMode = useWhiteboardStore((s) => s.togglePresentationMode)
  const clearCurrentPage = useWhiteboardStore((s) => s.clearCurrentPage)
  const addPage = useWhiteboardStore((s) => s.addPage)
  const undo = useWhiteboardStore((s) => s.undo)
  const redo = useWhiteboardStore((s) => s.redo)
  const undoStack = useWhiteboardStore((s) => s.undoStack)
  const redoStack = useWhiteboardStore((s) => s.redoStack)
  const setTool = useWhiteboardStore((s) => s.setTool)

  const [searchKey, setSearchKey] = useState(0)
  const searchOpen = searchKey > 0
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // ---- Template State (Phase 2) ----
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [myTemplatesOpen, setMyTemplatesOpen] = useState(false)
  const [communityTemplatesOpen, setCommunityTemplatesOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateFull | undefined>(undefined)

  // ---- Register Phase 2 modal openers in the shared store ----
  // This lets the right-sidebar TemplatesWidget (and any other component)
  // open the rich modals without prop drilling.
  const setOpenSaveModal = useTemplateModalStore((s) => s.setOpenSaveModal)
  const setOpenMyTemplates = useTemplateModalStore((s) => s.setOpenMyTemplates)
  const setOpenCommunityTemplates = useTemplateModalStore((s) => s.setOpenCommunityTemplates)
  useEffect(() => {
    setOpenSaveModal(() => () => setSaveTemplateOpen(true))
    setOpenMyTemplates(() => () => setMyTemplatesOpen(true))
    setOpenCommunityTemplates(() => () => setCommunityTemplatesOpen(true))
    return () => {
      setOpenSaveModal(null)
      setOpenMyTemplates(null)
      setOpenCommunityTemplates(null)
    }
  }, [setOpenSaveModal, setOpenMyTemplates, setOpenCommunityTemplates])

  // ---- Export Handlers ----

  const handleExportPng = useCallback(async () => {
    try {
      const container = canvasContainerRef.current
      if (!container) return
      const blob = await exportAsPng(
        elements,
        camera,
        container.clientWidth,
        container.clientHeight,
        isDark
      )
      downloadBlob(blob, `whiteboard-${Date.now()}.png`)
    } catch (err) {
      console.error('Export PNG failed:', err)
    }
  }, [elements, camera, isDark])

  const handleExportJpg = useCallback(async () => {
    try {
      const container = canvasContainerRef.current
      if (!container) return
      const blob = await exportAsJpg(
        elements,
        camera,
        container.clientWidth,
        container.clientHeight,
        isDark
      )
      downloadBlob(blob, `whiteboard-${Date.now()}.jpg`)
    } catch (err) {
      console.error('Export JPEG failed:', err)
    }
  }, [elements, camera, isDark])

  const handleExportSvg = useCallback(() => {
    const container = canvasContainerRef.current
    if (!container) return
    const svg = exportAsSvg(elements, container.clientWidth, container.clientHeight, isDark, camera)
    downloadString(svg, `whiteboard-${Date.now()}.svg`, 'image/svg+xml')
  }, [elements, camera, isDark])

  const handleExportJson = useCallback(() => {
    const json = exportAsJson(elements)
    downloadString(json, `whiteboard-${Date.now()}.json`, 'application/json')
  }, [elements])

  // ---- File Upload ----

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const reader = new FileReader()
        reader.onload = (re) => {
          const img = new Image()
          img.onload = () => {
            const maxW = 400
            const scale = Math.min(1, maxW / img.width)
            pushHistory()
            addElement({
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              type: 'image',
              x: -camera.x / camera.zoom + 100,
              y: -camera.y / camera.zoom + 100,
              width: img.width * scale,
              height: img.height * scale,
              rotation: 0,
              opacity: 1,
              strokeColor: 'transparent',
              fillColor: 'transparent',
              strokeWidth: 0,
              locked: false,
              pageIndex: currentPageIndex,
              src: re.target?.result as string,
              naturalWidth: img.width,
              naturalHeight: img.height,
            })
          }
          img.src = re.target?.result as string
        }
        reader.readAsDataURL(file)
      }
      // Reset input
      e.target.value = ''
    },
    [camera, currentPageIndex, pushHistory, addElement]
  )

  // ---- Z-Order ----

  const handleBringToFront = useCallback(() => {
    selectedIds.forEach((id) => bringToFront(id))
  }, [selectedIds, bringToFront])

  const handleSendToBack = useCallback(() => {
    selectedIds.forEach((id) => sendToBack(id))
  }, [selectedIds, sendToBack])

  const currentPageName = pages[currentPageIndex]?.name || 'Page 1'

  const handleToggleGridType = useCallback(() => {
    setGridType(gridType === 'dot' ? 'line' : 'dot')
  }, [gridType, setGridType])

  // ---- Keyboard Shortcuts (Phase 2E) ----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      // Ctrl+K / Cmd+K — search
      if (e.key === 'k') {
        e.preventDefault()
        setSearchKey((k) => (k > 0 ? 0 : 1))
      }
      // Ctrl+Shift+S — Save as Template
      if (e.shiftKey && e.key === 'S') {
        e.preventDefault()
        setSaveTemplateOpen(true)
      }
      // Ctrl+Shift+T — My Templates
      if (e.shiftKey && e.key === 'T') {
        e.preventDefault()
        setMyTemplatesOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div
      className={[
        'whiteboard-root whiteboard-grid',
        isDark ? 'wb-grid-dark' : 'wb-grid-light',
        isPresentationMode ? 'wb-grid-presentation' : '',
      ].join(' ')}
    >
      {/* Top Bar — spans full width (hidden in presentation mode) */}
      {!isPresentationMode && (
        <div style={{ gridColumn: '1 / -1' }}>
        <TopBar
          isDark={isDark}
          onUndo={undo}
          onRedo={redo}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onToggleDark={toggleDark}
          onExportPng={handleExportPng}
          onExportSvg={handleExportSvg}
          onExportJson={handleExportJson}
          onExportJpg={handleExportJpg}
          onShowShortcuts={() => setShortcutsOpen(true)}
          onGroup={groupSelected}
          onUngroup={ungroupSelected}
          onToggleLock={toggleLock}
          onSelectAll={selectAll}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomFit={zoomToFit}
          onZoomReset={zoomReset}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onFileUpload={handleFileUpload}
          onPdfUpload={() => setTool('pdf')}
          onClearPage={clearCurrentPage}
          onAddPage={addPage}
          onTogglePresentation={togglePresentationMode}
          onSearch={() => setSearchKey((k) => k + 1)}
          currentTool={tool}
          currentPage={currentPageName}
          zoom={Math.round(camera.zoom * 100)}
          showGrid={showGrid}
          snapToGrid={snapToGrid}
          gridType={gridType}
          onToggleGrid={toggleGrid}
          onToggleSnap={toggleSnap}
          onToggleGridType={handleToggleGridType}
          onSaveAsTemplate={() => setSaveTemplateOpen(true)}
          onMyTemplates={() => setMyTemplatesOpen(true)}
          onCommunityTemplates={() => setCommunityTemplatesOpen(true)}
        />
        </div>
      )}

      {/* Left Toolbar (hidden in presentation mode) */}
      {!isPresentationMode && <LeftToolbar />}

      {/* Canvas Area */}
      <div ref={canvasContainerRef} style={{ position: 'relative', overflow: 'hidden' }}>
        <WhiteboardCanvas />
        {!isPresentationMode && <PageTabs />}
      </div>

      {/* Style Panel — spans full width (hidden in presentation mode) */}
      {!isPresentationMode && (
        <div style={{ gridColumn: '1 / -1' }}>
        <StylePanel />
        </div>
      )}

      {/* Mobile Bottom Toolbar (hidden on desktop via CSS) */}
      {!isPresentationMode && (
        <MobileBottomToolbar
          isDark={isDark}
          currentTool={tool}
          onToolChange={(t) => setTool(t as any)}
        />
      )}

      {/* Shortcuts Dialog */}
      {shortcutsOpen && (
        <ShortcutsDialog onClose={() => setShortcutsOpen(false)} />
      )}

      {/* Template Modals (Phase 2) */}
      <SaveAsTemplateModal
        open={saveTemplateOpen}
        onClose={() => { setSaveTemplateOpen(false); setEditingTemplate(undefined) }}
        editTemplate={editingTemplate}
        onSuccess={() => { if (myTemplatesOpen) setMyTemplatesOpen(true) }}
      />
      <MyTemplatesPanel
        open={myTemplatesOpen}
        onClose={() => setMyTemplatesOpen(false)}
        onSaveNew={() => { setMyTemplatesOpen(false); setEditingTemplate(undefined); setSaveTemplateOpen(true) }}
        onEditTemplate={(t) => { setMyTemplatesOpen(false); setEditingTemplate(t); setSaveTemplateOpen(true) }}
      />
      <CommunityTemplatesPanel
        open={communityTemplatesOpen}
        onClose={() => setCommunityTemplatesOpen(false)}
      />

      {/* Search Overlay */}
      {searchOpen && <SearchOverlay key={searchKey} onClose={() => setSearchKey(0)} isDark={isDark} />}

      {/* Presentation Mode: floating exit button + minimal info */}
      {isPresentationMode && (
        <>
          {/* Semi-transparent overlay that fades on interaction */}
          <div
            style={{
              position: 'fixed',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10000,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              pointerEvents: 'auto',
            }}
          >
            <button
              onClick={togglePresentationMode}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'opacity 0.3s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
            >
              Exit Presentation (Esc)
            </button>
            <div
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.5)',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 11,
                fontFamily: 'monospace',
                backdropFilter: 'blur(8px)',
              }}
            >
              {Math.round(camera.zoom * 100)}% · {currentPageName}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
