'use client'

import React, { useEffect, useRef, useCallback, useState } from 'react'
import { TopBar } from '@/components/whiteboard/TopBar'
import { ShortcutsDialog } from '@/components/whiteboard/ShortcutsDialog'
import { LeftToolbar } from '@/components/whiteboard/LeftToolbar'
import { WhiteboardCanvas } from '@/components/whiteboard/WhiteboardCanvas'
import { StylePanel } from '@/components/whiteboard/StylePanel'
import { PageTabs } from '@/components/whiteboard/PageTabs'
import { SearchOverlay } from '@/components/whiteboard/SearchOverlay'
import { useShallow } from "zustand/react/shallow"
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import {
  exportAsPng, exportAsJpg, exportAsSvg, exportAsJson,
  downloadBlob, downloadString,
} from '@/lib/whiteboard/export'
import { initRealtimeSync } from '@/lib/collab/realtime-sync'
import { hasFeature } from '@/lib/features'
import type { Tier } from '@/lib/validations'
import { MobileBottomToolbar } from '@/components/whiteboard/MobileBottomToolbar'

interface RoomWhiteboardProps {
  roomId: string
  onSaveRequest?: () => void
  saveStatus?: string
  onSaved?: (success: boolean) => void
}

// BoardPage snapshot stored in Supabase
interface PageSnapshot {
  pageIndex: number
  snapshot: {
    elements: any[] // eslint-disable-line
    camera: { x: number; y: number; zoom: number }
  }
}

export default function RoomWhiteboard({ roomId, onSaveRequest, saveStatus, onSaved }: RoomWhiteboardProps) {
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
  const setTool = useWhiteboardStore((s) => s.setTool)
  const loadState = useWhiteboardStore((s) => s.loadState)
  const setPages = useWhiteboardStore((s) => s.setPages)
  const setCurrentPageIndex = useWhiteboardStore((s) => s.setCurrentPageIndex)

  const [searchKey, setSearchKey] = useState(0)
  const searchOpen = searchKey > 0
  const [userTier, setUserTier] = useState<Tier>('FREE')
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadedRef = useRef(false)
  const saveRequestRef = useRef(false)
  const realtimeCleanupRef = useRef<(() => void) | null>(null)

  // Fetch user tier for feature gating
  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => { if (p?.tier) setUserTier(p.tier as Tier) })
      .catch(() => { /* not logged in */ })
  }, [])

  const canExport = hasFeature('pdf_export', userTier)

  // Load board pages from Supabase on mount
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    const loadPages = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/pages`)
        const data: PageSnapshot[] = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          // The store has pages as WhiteboardPage { id, name, index }
          // and elements globally filtered by pageIndex
          // Build the full elements array from all page snapshots
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const allElements: any[] = []
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const storePages = data.map((p) => ({
            id: `page-${p.pageIndex}`,
            name: `Page ${p.pageIndex + 1}`,
            index: p.pageIndex,
          }))

          // Tag elements with their pageIndex
          for (const p of data) {
            const pageElements = (p.snapshot?.elements || []).map((el: any) => ({
              ...el,
              pageIndex: p.pageIndex,
            }))
            allElements.push(...pageElements)
          }

          // Set up multi-page state properly
          setPages(storePages)
          loadState(allElements)
        }
      } catch (err) {
        console.error('Failed to load pages:', err)
      }
    }
    loadPages()
  }, [roomId, loadState, setPages])

  // Initialize Supabase Realtime Broadcast sync
  useEffect(() => {
    // Small delay to let the store initialize after page load
    const timer = setTimeout(() => {
      const store = useWhiteboardStore.getState()
      realtimeCleanupRef.current = initRealtimeSync(roomId, {
        elements: store.elements,
        camera: store.camera,
        pages: store.pages,
        currentPageIndex: store.currentPageIndex,
        addElement: store.addElement,
        updateElement: store.updateElement,
        removeElements: store.removeElements,
        setCamera: store.setCamera,
        loadState: store.loadState,
        setPages: store.setPages,
        setCurrentPageIndex: store.setCurrentPageIndex,
      })
    }, 500)

    return () => {
      clearTimeout(timer)
      if (realtimeCleanupRef.current) {
        realtimeCleanupRef.current()
        realtimeCleanupRef.current = null
      }
    }
  }, [roomId])

  // Auto-save to Supabase (debounced 3s)
  const saveToSupabase = useCallback(async () => {
    try {
      // Collect elements per page
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pagesToSave: PageSnapshot[] = pages.map((page, index) => {
        const pageElements = elements.filter((el) => el.pageIndex === index)
        return {
          pageIndex: index,
          snapshot: {
            elements: pageElements,
            camera: { x: 0, y: 0, zoom: 1 },
          },
        }
      })

      await fetch(`/api/rooms/${roomId}/pages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: pagesToSave }),
      })
    } catch (err) {
      console.error('Auto-save failed:', err)
    }
  }, [elements, pages, roomId])

  // Debounced auto-save
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(saveToSupabase, 3000)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [elements, pages, saveToSupabase])

  // Immediate save when parent requests it
  useEffect(() => {
    if (saveRequestRef.current) {
      saveRequestRef.current = false
      let cancelled = false
      saveToSupabase().then(() => {
        if (!cancelled) onSaved?.(true)
      }).catch(() => {
        if (!cancelled) onSaved?.(false)
      })
      return () => { cancelled = true }
    }
  }, [elements, pages, saveToSupabase, onSaved])

  // Listen for save requests from parent
  useEffect(() => {
    if (onSaveRequest) {
      saveRequestRef.current = true
    }
  }, [onSaveRequest])

  // ---- Export Handlers ----
  const handleExportPng = useCallback(async () => {
    try {
      const container = canvasContainerRef.current
      if (!container) return
      const blob = await exportAsPng(elements, camera, container.clientWidth, container.clientHeight, isDark)
      downloadBlob(blob, `superboard-${Date.now()}.png`)
    } catch (err) { console.error('Export PNG failed:', err) }
  }, [elements, camera, isDark])

  const handleExportJpg = useCallback(async () => {
    try {
      const container = canvasContainerRef.current
      if (!container) return
      const blob = await exportAsJpg(elements, camera, container.clientWidth, container.clientHeight, isDark)
      downloadBlob(blob, `superboard-${Date.now()}.jpg`)
    } catch (err) { console.error('Export JPEG failed:', err) }
  }, [elements, camera, isDark])

  const handleExportSvg = useCallback(() => {
    const container = canvasContainerRef.current
    if (!container) return
    const svg = exportAsSvg(elements, container.clientWidth, container.clientHeight, isDark, camera)
    downloadString(svg, `superboard-${Date.now()}.svg`, 'image/svg+xml')
  }, [elements, camera, isDark])

  const handleExportJson = useCallback(() => {
    const json = exportAsJson(elements)
    downloadString(json, `superboard-${Date.now()}.json`, 'application/json')
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
              rotation: 0, opacity: 1,
              strokeColor: 'transparent', fillColor: 'transparent', strokeWidth: 0,
              locked: false, pageIndex: currentPageIndex,
              src: re.target?.result as string,
              naturalWidth: img.width, naturalHeight: img.height,
            })
          }
          img.src = re.target?.result as string
        }
        reader.readAsDataURL(file)
      }
      e.target.value = ''
    },
    [camera, currentPageIndex, pushHistory, addElement]
  )

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

  // Save as template
  const handleSaveAsTemplate = useCallback(async () => {
    const name = prompt('Template name:')
    if (!name) return
    const subject = prompt('Subject (GENERAL, MATH, SCIENCE, etc.):', 'GENERAL') || 'GENERAL'
    try {
      const pagesToSave = pages.map((page, index) => {
        const pageElements = elements.filter((el) => el.pageIndex === index)
        return {
          pageIndex: index,
          elements: pageElements,
        }
      })
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.slice(0, 50),
          subject,
          snapshot: { pages: pagesToSave },
        }),
      })
      alert('Template saved!')
    } catch (err) {
      console.error('Failed to save template:', err)
    }
  }, [pages, elements])

  // Ctrl+K / Cmd+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchKey((k) => (k > 0 ? 0 : 1))
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
      {/* Top Bar */}
      {!isPresentationMode && (
        <div style={{ gridColumn: '1 / -1' }}>
          <TopBar
            isDark={isDark}
            onUndo={undo}
            onRedo={redo}
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
            canExport={canExport}
            currentTool={tool}
            currentPage={currentPageName}
            zoom={Math.round(camera.zoom * 100)}
            showGrid={showGrid}
            snapToGrid={snapToGrid}
            gridType={gridType}
            onToggleGrid={toggleGrid}
            onToggleSnap={toggleSnap}
            onToggleGridType={handleToggleGridType}
          />
        </div>
      )}

      {/* Left Toolbar */}
      {!isPresentationMode && <LeftToolbar />}

      {/* Canvas Area */}
      <div ref={canvasContainerRef} style={{ position: 'relative', overflow: 'hidden' }}>
        <WhiteboardCanvas />
        {!isPresentationMode && (
          <>
            <PageTabs />
            <div style={{
              position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)',
              zIndex: 100, display: 'flex', gap: 4,
            }}>
              <button
                onClick={() => { saveRequestRef.current = true }}
                title="Save now"
                style={{
                  padding: '4px 10px', borderRadius: 4,
                  background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)',
                  color: '#34d399', fontSize: 11, cursor: 'pointer',
                }}
              >
                {saveStatus || 'Save'}
              </button>
              <button
                onClick={handleSaveAsTemplate}
                title="Save as template"
                style={{
                  padding: '4px 10px', borderRadius: 4,
                  background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)',
                  color: '#38bdf8', fontSize: 11, cursor: 'pointer',
                }}
              >
                Save as Template
              </button>
            </div>
          </>
        )}
      </div>

      {/* Style Panel */}
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

      {/* Search Overlay */}
      {searchOpen && <SearchOverlay key={searchKey} onClose={() => setSearchKey(0)} />}

      {/* Presentation Mode */}
      {isPresentationMode && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10000, display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <button
            onClick={togglePresentationMode}
            style={{
              padding: '8px 18px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.6)', color: '#fff',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            Exit Presentation (Esc)
          </button>
          <div style={{
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.6)',
            fontSize: 11, fontFamily: 'monospace', backdropFilter: 'blur(8px)',
          }}>
            {Math.round(camera.zoom * 100)}% &middot; {currentPageName}
          </div>
        </div>
      )}
    </div>
  )
}
