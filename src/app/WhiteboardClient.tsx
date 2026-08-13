// ============================================================
// Superboard — Main Whiteboard Client
// Orchestrates all components: toolbar, canvas, style panel, etc.
// React + SVG + perfect-freehand (MIT License)
// ============================================================

'use client'

import React, { useCallback, useRef, useState } from 'react'
import { TopBar } from '@/components/whiteboard/TopBar'
import { ShortcutsDialog } from '@/components/whiteboard/ShortcutsDialog'
import { LeftToolbar } from '@/components/whiteboard/LeftToolbar'
import { WhiteboardCanvas } from '@/components/whiteboard/WhiteboardCanvas'
import { StylePanel } from '@/components/whiteboard/StylePanel'
import { PageTabs } from '@/components/whiteboard/PageTabs'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import {
  exportAsPng,
  exportAsJpg,
  exportAsSvg,
  exportAsJson,
  downloadBlob,
  downloadString,
} from '@/lib/whiteboard/export'

export default function WhiteboardClient() {
  // Debug: verify mount
  const [mounted, setMounted] = useState(false)
  React.useEffect(() => { setMounted(true) }, [])

  const {
    isDark,
    tool,
    camera,
    pages,
    currentPageIndex,
    elements,
    shortcutsOpen,
    selectedIds,
    setShortcutsOpen,
    zoomIn,
    zoomOut,
    zoomReset,
    zoomToFit,
    groupSelected,
    ungroupSelected,
    toggleLock,
    selectAll,
    bringToFront,
    sendToBack,
    addElement,
    pushHistory,
    toggleDark,
    toggleGrid,
    toggleSnap,
    undo,
    redo,
  } = useWhiteboardStore()

  const canvasContainerRef = useRef<HTMLDivElement>(null)

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
    const svg = exportAsSvg(elements, container.clientWidth, container.clientHeight, isDark)
    downloadString(svg, `whiteboard-${Date.now()}.svg`, 'image/svg+xml')
  }, [elements, isDark])

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

  return (
    <div
      className="whiteboard-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: isDark ? '#0f172a' : '#f8fafc',
        color: isDark ? '#e5e7eb' : '#111827',
      }}
    >
      {/* Top Bar */}
      <TopBar
        isDark={isDark}
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
        currentTool={tool}
        currentPage={currentPageName}
        zoom={Math.round(camera.zoom * 100)}
      />

      {/* Main Area */}
      <div
        ref={canvasContainerRef}
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          position: 'relative',
        }}
      >
        {/* Left Toolbar */}
        <LeftToolbar />

        {/* Canvas Area */}
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <WhiteboardCanvas />
          <PageTabs />
        </div>
      </div>

      {/* Style Panel (Bottom Bar) */}
      <StylePanel />

      {/* Shortcuts Dialog */}
      {shortcutsOpen && (
        <ShortcutsDialog onClose={() => setShortcutsOpen(false)} />
      )}

      {/* Debug indicator */}
      {!mounted && (
        <div style={{
          position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
          background: '#fef3c7', color: '#92400e', padding: '8px 16px',
          borderRadius: 8, fontSize: 13, zIndex: 9999,
        }}>
          ⏳ Hydrating...
        </div>
      )}
    </div>
  )
}
