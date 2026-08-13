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
  const {
    isDark,
    tool,
    camera,
    pages,
    currentPageIndex,
    elements,
    shortcutsOpen,
    selectedIds,
    showGrid,
    snapToGrid,
    gridType,
    isPresentationMode,
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
    setGridType,
    togglePresentationMode,
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

  const handleToggleGridType = useCallback(() => {
    setGridType(gridType === 'dot' ? 'line' : 'dot')
  }, [gridType, setGridType])

  return (
    <div
      className="whiteboard-root"
      style={{
        display: 'grid',
        gridTemplateRows: isPresentationMode ? '1fr' : '44px 1fr 44px',
        gridTemplateColumns: isPresentationMode ? '1fr' : '44px 1fr',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: isDark ? '#0f172a' : '#f8fafc',
        color: isDark ? '#e5e7eb' : '#111827',
      }}
    >
      {/* Top Bar — spans full width (hidden in presentation mode) */}
      {!isPresentationMode && (
        <div style={{ gridColumn: '1 / -1' }}>
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
          onTogglePresentation={togglePresentationMode}
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

      {/* Shortcuts Dialog */}
      {shortcutsOpen && (
        <ShortcutsDialog onClose={() => setShortcutsOpen(false)} />
      )}

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
