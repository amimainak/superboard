// ============================================================
// Superboard — Main Whiteboard Client
// Orchestrates all components: toolbar, canvas, style panel, etc.
// React + SVG + perfect-freehand (MIT License)
// ============================================================

'use client'

import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useWidgetStore } from '@/lib/room/widget-store'
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
import { LessonBuilder } from '@/components/whiteboard/LessonBuilder'
import { LessonPlayer } from '@/components/whiteboard/LessonPlayer'
import { AccountBadge } from '@/components/whiteboard/AccountBadge'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import type { TemplateFull, LessonPlanFull } from '@/types'
import {
  exportAsPng,
  exportAsJpg,
  exportAsSvg,
  exportAsJson,
  downloadBlob,
  downloadString,
} from '@/lib/whiteboard/export'
import { getDefaultWidgetConfig, getWidgetDefaultSize, WIDGET_KIND_LABELS } from '@/components/whiteboard/CanvasWidgets'
import { generateId } from '@/lib/whiteboard/utils'
import { playClickSound } from '@/lib/whiteboard/sound'
import { UploadProgressBar, type UploadProgress } from '@/components/whiteboard/UploadProgressBar'
import { extractTemplateSnapshot } from '@/lib/template-snapshot'
import { generateHandout, downloadHandoutBlob } from '@/lib/handout-generator'

// ---- Task 42 / Fix #28 — Haptic feedback for mobile ----
// Vibrates the device (if supported) for key actions. No-op on desktop.
function hapticFeedback(pattern: number | number[] = 10) {
  if (typeof window === 'undefined') return
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }
  if (typeof nav.vibrate === 'function') {
    try {
      nav.vibrate(pattern)
    } catch {
      // Some browsers throw if the user hasn't interacted yet — ignore.
    }
  }
}

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
  const gridSize = useWhiteboardStore((s) => s.gridSize)
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

  // ---- Lesson Builder / Player State (Milestone 2) ----
  const [lessonBuilderOpen, setLessonBuilderOpen] = useState(false)
  const [lessonPlayerOpen, setLessonPlayerOpen] = useState(false)
  const [currentLesson, setCurrentLesson] = useState<LessonPlanFull | null>(null)
  const [editingLesson, setEditingLesson] = useState<LessonPlanFull | null>(null)

  // ---- Fix #5: Add-to-Board toast + canvas pulse feedback ----
  const [addToBoardToast, setAddToBoardToast] = useState<string | null>(null)
  const [canvasPulseKey, setCanvasPulseKey] = useState(0)
  const [canvasPulseVisible, setCanvasPulseVisible] = useState(false)
  const prevWidgetIdsRef = useRef<Set<string> | null>(null)

  // ---- Task 42 / Fix #30 — File upload progress ----
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)

  // ---- Milestone 2 — Pick up pending lesson from dashboard ----
  // The dashboard's LessonPlansPanel stashes a {lesson, mode} payload
  // in sessionStorage and navigates here. Read it on mount and open
  // the Lesson Builder (edit) or Lesson Player (play).
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.sessionStorage.getItem('superboard_pending_lesson')
      if (!raw) return
      window.sessionStorage.removeItem('superboard_pending_lesson')
      const parsed = JSON.parse(raw) as { lesson: LessonPlanFull; mode: 'edit' | 'play' }
      if (parsed?.lesson?.id) {
        setCurrentLesson(parsed.lesson)
        if (parsed.mode === 'play') {
          setLessonPlayerOpen(true)
        } else {
          setEditingLesson(parsed.lesson)
          setLessonBuilderOpen(true)
        }
      }
    } catch {
      // Malformed payload — silently ignore so the whiteboard still loads.
    }
  }, [])

  // Detect new widget elements added to current page → fire toast + pulse.
  // (Skips the initial sync — only fires when a NEW widget appears after mount.)
  useEffect(() => {
    const currentWidgetIds = new Set(
      elements
        .filter((el) => el.type === 'widget' && el.pageIndex === currentPageIndex)
        .map((el) => el.id)
    )
    const prev = prevWidgetIdsRef.current
    if (prev !== null) {
      let added = false
      currentWidgetIds.forEach((id) => { if (!prev.has(id)) added = true })
      if (added) {
        setAddToBoardToast('✓ Widget added to board')
        setCanvasPulseKey((k) => k + 1)
        setCanvasPulseVisible(true)
        // Task 42 / Fix #28 — haptic feedback when a widget is added
        hapticFeedback(12)
        // Task 42 / Fix #29 — subtle click sound (muted by default)
        playClickSound()
        const t1 = setTimeout(() => setAddToBoardToast(null), 2000)
        const t2 = setTimeout(() => setCanvasPulseVisible(false), 1000)
        prevWidgetIdsRef.current = currentWidgetIds
        return () => { clearTimeout(t1); clearTimeout(t2) }
      }
    }
    prevWidgetIdsRef.current = currentWidgetIds
  }, [elements, currentPageIndex])

  // ---- Fix #9: Canvas empty state watermark ----
  const pageHasContent = elements.some((el) => el.pageIndex === currentPageIndex)

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

  // ---- Task 45: Structured Handout Generator ----
  // Builds an A4 PDF with header, widget list, "What I Learned" prompts,
  // and blank practice problems. Uses pdf-lib (NOT the browser print dialog).
  const handleGenerateHandout = useCallback(async () => {
    try {
      // 1. Get the widget list from the canvas via extractTemplateSnapshot + WIDGET_KIND_LABELS
      const snapshot = extractTemplateSnapshot({
        elements,
        isDark,
        showGrid,
        gridSize,
        gridType,
        snapToGrid,
      })
      const widgetNames = snapshot.widgets.map(
        (w) => WIDGET_KIND_LABELS[w.widgetKind] || w.widgetKind
      )

      // 2. Optionally capture a canvas screenshot (PNG bytes) for the widgets section.
      //    Skipped when there are no widgets OR capture fails — the handout is still useful text-only.
      let canvasImageBytes: Uint8Array | undefined
      if (widgetNames.length > 0) {
        try {
          const container = canvasContainerRef.current
          if (container) {
            const pngBlob = await exportAsPng(
              elements,
              camera,
              container.clientWidth,
              container.clientHeight,
              isDark
            )
            canvasImageBytes = new Uint8Array(await pngBlob.arrayBuffer())
          }
        } catch (captureErr) {
          console.error('Handout canvas capture failed:', captureErr)
        }
      }

      // 3. Build the PDF and trigger a download
      const blob = await generateHandout({
        widgetNames,
        canvasImageBytes,
      })
      const stamp = new Date().toISOString().slice(0, 10)
      downloadHandoutBlob(blob, `superboard-handout-${stamp}.pdf`)
    } catch (err) {
      console.error('Handout generation failed:', err)
    }
  }, [elements, isDark, showGrid, gridSize, gridType, snapToGrid, camera])

  // ---- File Upload ----

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const reader = new FileReader()
        // Task 42 / Fix #30 — track file-read progress
        reader.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUploadProgress({ fileName: file.name, loaded: ev.loaded, total: ev.total })
          }
        }
        reader.onload = (re) => {
          setUploadProgress((p) => p ? { ...p, loaded: p.total || 1 } : p)
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
            // Clear progress after the element is added
            window.setTimeout(() => setUploadProgress(null), 250)
          }
          img.src = re.target?.result as string
        }
        reader.onerror = () => {
          setUploadProgress(null)
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

  // ---- Task 42 / Fix #28 — Haptic feedback on tool change ----
  // Light 8ms tap when the active tool changes (pen → eraser → select, etc.).
  // Skips the very first render via a ref guard so we don't buzz on mount.
  const prevToolRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevToolRef.current === null) {
      prevToolRef.current = tool
      return
    }
    if (prevToolRef.current !== tool) {
      hapticFeedback(8)
      prevToolRef.current = tool
    }
  }, [tool])

  // ---- Fix #26: "Reopen last panel" memory ----
  // Persist the name of the last-closed modal/panel so Ctrl+Shift+P
  // can bring it back. Stored in localStorage as 'superboard_last_panel'.
  const rememberLastPanel = useCallback((panel: string) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('superboard_last_panel', panel)
    } catch {
      // Ignore quota / privacy mode errors
    }
  }, [])

  // ---- Fix #14: aria-live announcements ----
  // Mirror key whiteboard state changes into the #announcements region
  // so screen readers can announce them politely.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const node = document.getElementById('announcements')
    if (!node) return
    const toolLabelMap: Record<string, string> = {
      select: 'Select tool',
      hand: 'Hand tool',
      draw: 'Pen tool',
      highlighter: 'Highlighter tool',
      eraser: 'Eraser tool',
      'eraser-object': 'Object eraser tool',
      arrow: 'Arrow tool',
      text: 'Text tool',
      sticky: 'Sticky note tool',
      image: 'Image tool',
      pdf: 'PDF tool',
      frame: 'Frame tool',
      laser: 'Laser pointer',
      line: 'Line tool',
      rectangle: 'Rectangle tool',
      ellipse: 'Ellipse tool',
      diamond: 'Diamond tool',
      triangle: 'Triangle tool',
    }
    node.textContent = toolLabelMap[tool] ? `${toolLabelMap[tool]} active` : `${tool} tool active`
  }, [tool])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const node = document.getElementById('announcements')
    if (!node) return
    node.textContent = `Now on ${currentPageName}`
  }, [currentPageName, currentPageIndex])

  // ---- Keyboard Shortcuts (Phase 2E + Task 42 / Fix #16) ----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      // Escape — close any open panel / modal (Fix #16)
      // Order: top-most overlay first. If nothing is open, do nothing
      // (let the canvas-level handler deselect / exit presentation).
      if (e.key === 'Escape' && !mod && !e.shiftKey && !e.altKey) {
        if (useWhiteboardStore.getState().shortcutsOpen) {
          e.preventDefault()
          setShortcutsOpen(false)
          return
        }
        if (lessonPlayerOpen) { e.preventDefault(); setLessonPlayerOpen(false); return }
        if (lessonBuilderOpen) { e.preventDefault(); setLessonBuilderOpen(false); setEditingLesson(null); return }
        if (saveTemplateOpen) { e.preventDefault(); setSaveTemplateOpen(false); setEditingTemplate(undefined); return }
        if (myTemplatesOpen) { e.preventDefault(); setMyTemplatesOpen(false); return }
        if (communityTemplatesOpen) { e.preventDefault(); setCommunityTemplatesOpen(false); return }
        if (searchOpen) { e.preventDefault(); setSearchKey(0); return }
        // Close any open widget panels
        const widgetState = useWidgetStore.getState()
        if (widgetState.openWidgets.length > 0) {
          e.preventDefault()
          widgetState.openWidgets.forEach((w: string) => widgetState.toggleWidget(w as any))
          return
        }
        // (Presentation mode is exited by the canvas-level Escape handler.)
      }

      if (!mod) return
      // Ctrl+K / Cmd+K — search
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        setSearchKey((k) => (k > 0 ? 0 : 1))
        return
      }
      // Ctrl+Shift+S — Save as Template
      if (e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault()
        setSaveTemplateOpen(true)
        return
      }
      // Ctrl+Shift+T — My Templates
      if (e.shiftKey && (e.key === 'T' || e.key === 't')) {
        e.preventDefault()
        setMyTemplatesOpen(true)
        return
      }
      // Ctrl+Shift+L — Lesson Builder (Milestone 2)
      if (e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault()
        setLessonBuilderOpen(true)
        return
      }
      // Ctrl+Shift+D — Toggle dark mode (Fix #16).
      // NOTE: Plain Ctrl+D is already bound to "Duplicate" in
      // WhiteboardCanvas.tsx, so we use Shift+D to avoid clobbering
      // the existing duplicate shortcut.
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault()
        toggleDark()
        return
      }
      // Ctrl+Shift+R — Add a random widget to the board (Fix #16).
      // Picks from widgets already on the board (a poor man's "recently
      // used" list). If the board has no widgets yet, does nothing.
      if (e.shiftKey && (e.key === 'R' || e.key === 'r')) {
        e.preventDefault()
        const state = useWhiteboardStore.getState()
        const widgetEls = state.elements.filter(
          (el): el is typeof el & { widgetKind: string } =>
            el.type === 'widget' && 'widgetKind' in el && el.pageIndex === state.currentPageIndex
        )
        if (widgetEls.length === 0) return
        const pick = widgetEls[Math.floor(Math.random() * widgetEls.length)]
        const wk = pick.widgetKind
        try {
          const size = getWidgetDefaultSize(wk)
          const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
          const vh = typeof window !== 'undefined' ? window.innerHeight : 800
          const cx = (vw / 2 - state.camera.x) / state.camera.zoom
          const cy = ((vh / 2 - 44) - state.camera.y) / state.camera.zoom
          state.pushHistory()
          state.addElement({
            id: `${Date.now()}-${generateId()}`,
            type: 'widget',
            widgetKind: wk,
            config: getDefaultWidgetConfig(wk),
            x: cx - size.width / 2,
            y: cy - size.height / 2,
            width: size.width,
            height: size.height,
            rotation: 0,
            opacity: 1,
            strokeColor: state.isDark ? '#334155' : '#e2e8f0',
            fillColor: state.isDark ? '#0f172a' : '#ffffff',
            strokeWidth: 1,
            locked: false,
            pageIndex: state.currentPageIndex,
          })
        } catch (err) {
          console.warn('[Ctrl+Shift+R] Could not add random widget:', err)
        }
        return
      }
      // Ctrl+Shift+P — Reopen last closed panel (Fix #26).
      if (e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault()
        const last = typeof window !== 'undefined'
          ? window.localStorage.getItem('superboard_last_panel')
          : null
        if (!last) return
        if (last === 'save-template') setSaveTemplateOpen(true)
        else if (last === 'my-templates') setMyTemplatesOpen(true)
        else if (last === 'community-templates') setCommunityTemplatesOpen(true)
        else if (last === 'lesson-builder') setLessonBuilderOpen(true)
        else if (last === 'search') setSearchKey((k) => (k > 0 ? k : 1))
        return
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    setShortcutsOpen,
    toggleDark,
    saveTemplateOpen,
    myTemplatesOpen,
    communityTemplatesOpen,
    lessonBuilderOpen,
    lessonPlayerOpen,
    searchOpen,
    setSaveTemplateOpen,
    setMyTemplatesOpen,
    setCommunityTemplatesOpen,
    setLessonBuilderOpen,
    setLessonPlayerOpen,
    setEditingTemplate,
    setEditingLesson,
  ])

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
          onGenerateHandout={handleGenerateHandout}
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
          onLessonBuilder={() => setLessonBuilderOpen(true)}
          onPlayLesson={currentLesson ? () => setLessonPlayerOpen(true) : undefined}
          accountBadge={<AccountBadge isDark={isDark} />}
        />
        </div>
      )}

      {/* Left Toolbar (hidden in presentation mode) */}
      {!isPresentationMode && <LeftToolbar />}

      {/* Fix #12 — semantic heading for screen readers */}
      <h2 className="sr-only">Canvas</h2>

      {/* Canvas Area */}
      <div
        ref={canvasContainerRef}
        id="main-canvas"
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        <WhiteboardCanvas />

        {/* Fix #9 — Canvas empty state watermark */}
        {!isPresentationMode && !pageHasContent && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              fontSize: 16,
              fontWeight: 500,
              color: isDark ? 'rgba(148,163,184,0.35)' : 'rgba(100,116,139,0.45)',
              textAlign: 'center',
              maxWidth: 420,
              lineHeight: 1.6,
              userSelect: 'none',
              zIndex: 1,
            }}
          >
            Click a tool to start drawing, or open a subject toolkit to add widgets
          </div>
        )}

        {/* Fix #5 — Canvas pulse ring when a widget is added to the board */}
        {canvasPulseVisible && (
          <div
            key={canvasPulseKey}
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 280,
              height: 280,
              borderRadius: '50%',
              border: '3px solid rgba(52,211,153,0.7)',
              boxShadow: '0 0 0 0 rgba(52,211,153,0.5)',
              pointerEvents: 'none',
              zIndex: 2,
              animation: 'superboard-canvas-pulse 1s ease-out forwards',
            }}
          />
        )}
        <style>{`@keyframes superboard-canvas-pulse { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; } }`}</style>

        {/* Task 42 / Fix #30 — file upload progress overlay */}
        <UploadProgressBar progress={uploadProgress} isDark={isDark} />

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
        onClose={() => { setSaveTemplateOpen(false); setEditingTemplate(undefined); rememberLastPanel('save-template') }}
        editTemplate={editingTemplate ? {
          id: editingTemplate.id,
          name: editingTemplate.name,
          description: editingTemplate.description ?? '',
          subject: editingTemplate.subject,
          gradeBand: editingTemplate.gradeBand,
          tags: editingTemplate.tags,
          isPublic: editingTemplate.isPublic,
        } : undefined}
        onSuccess={() => { if (myTemplatesOpen) setMyTemplatesOpen(true) }}
      />
      <MyTemplatesPanel
        open={myTemplatesOpen}
        onClose={() => { setMyTemplatesOpen(false); rememberLastPanel('my-templates') }}
        onSaveNew={() => { setMyTemplatesOpen(false); setEditingTemplate(undefined); setSaveTemplateOpen(true) }}
        onEditTemplate={(t) => { setMyTemplatesOpen(false); setEditingTemplate(t); setSaveTemplateOpen(true) }}
      />
      <CommunityTemplatesPanel
        open={communityTemplatesOpen}
        onClose={() => { setCommunityTemplatesOpen(false); rememberLastPanel('community-templates') }}
      />

      {/* Lesson Builder & Player (Milestone 2) */}
      <LessonBuilder
        open={lessonBuilderOpen}
        onClose={() => { setLessonBuilderOpen(false); setEditingLesson(null); rememberLastPanel('lesson-builder') }}
        editLesson={editingLesson}
        onSaved={(lesson) => { setCurrentLesson(lesson); setEditingLesson(lesson) }}
        onPlay={(lesson) => {
          setCurrentLesson(lesson)
          setLessonBuilderOpen(false)
          setEditingLesson(null)
          setLessonPlayerOpen(true)
        }}
      />
      <LessonPlayer
        open={lessonPlayerOpen}
        lesson={currentLesson}
        onClose={() => setLessonPlayerOpen(false)}
      />

      {/* Search Overlay */}
      {searchOpen && <SearchOverlay key={searchKey} onClose={() => { setSearchKey(0); rememberLastPanel('search') }} isDark={isDark} />}

      {/* Fix #3 — Onboarding modal is rendered at the WhiteboardApp.tsx wrapper
          layer (outside the dynamic import boundary) so first-visit users see
          onboarding even if the whiteboard chunk fails to load. */}

      {/* Fix #5 — Add-to-Board toast notification */}
      {addToBoardToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 9999,
            padding: '10px 16px',
            borderRadius: 8,
            background: 'rgba(16,185,129,0.95)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            pointerEvents: 'none',
            animation: 'superboard-toast-in 0.2s ease-out',
          }}
        >
          {addToBoardToast}
        </div>
      )}
      <style>{`@keyframes superboard-toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

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
