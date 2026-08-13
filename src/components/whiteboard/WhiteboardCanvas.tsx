// ============================================================
// Superboard — Main SVG Canvas
// Infinite canvas with pan/zoom, event handling, rendering
// ============================================================

'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { ElementRenderer } from './ElementRenderer'
import { SelectionHandles } from './SelectionHandles'
import { GridBackground } from './GridBackground'
import {
  screenToCanvas,
  hitTestElement,
  getFreehandPath,
  simulatePressure,
  HIGHLIGHT_OPTIONS,
  getElementBounds,
} from '@/lib/whiteboard/utils'
import type { Point, WhiteboardElement } from '@/lib/whiteboard/types'

function calcAlignGuides(
  selectedIds: string[],
  allElements: WhiteboardElement[],
  threshold: number
): { axis: 'x' | 'y'; pos: number; start: number; end: number }[] {
  const selected = allElements.filter((el) => selectedIds.includes(el.id))
  const others = allElements.filter((el) => !selectedIds.includes(el.id))
  const guides: { axis: 'x' | 'y'; pos: number; start: number; end: number }[] = []

  for (const sel of selected) {
    const sb = getElementBounds(sel)
    const scx = sb.x + sb.width / 2
    const scy = sb.y + sb.height / 2

    for (const other of others) {
      const ob = getElementBounds(other)
      const ocx = ob.x + ob.width / 2
      const ocy = ob.y + ob.height / 2

      // Center-to-center
      if (Math.abs(scx - ocx) < threshold) {
        guides.push({ axis: 'x', pos: scx, start: Math.min(sb.y, ob.y) - 50, end: Math.max(sb.y + sb.height, ob.y + ob.height) + 50 })
      }
      if (Math.abs(scy - ocy) < threshold) {
        guides.push({ axis: 'y', pos: scy, start: Math.min(sb.x, ob.x) - 50, end: Math.max(sb.x + sb.width, ob.x + ob.width) + 50 })
      }

      // Left/Right edges
      if (Math.abs(sb.x - ob.x) < threshold) {
        guides.push({ axis: 'x', pos: sb.x, start: Math.min(sb.y, ob.y) - 50, end: Math.max(sb.y + sb.height, ob.y + ob.height) + 50 })
      }
      if (Math.abs(sb.x + sb.width - (ob.x + ob.width)) < threshold) {
        guides.push({ axis: 'x', pos: sb.x + sb.width, start: Math.min(sb.y, ob.y) - 50, end: Math.max(sb.y + sb.height, ob.y + ob.height) + 50 })
      }

      // Top/Bottom edges
      if (Math.abs(sb.y - ob.y) < threshold) {
        guides.push({ axis: 'y', pos: sb.y, start: Math.min(sb.x, ob.x) - 50, end: Math.max(sb.x + sb.width, ob.x + ob.width) + 50 })
      }
      if (Math.abs(sb.y + sb.height - (ob.y + ob.height)) < threshold) {
        guides.push({ axis: 'y', pos: sb.y + sb.height, start: Math.min(sb.x, ob.x) - 50, end: Math.max(sb.x + sb.width, ob.x + ob.width) + 50 })
      }
    }
  }

  return guides
}

export function WhiteboardCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const {
    camera,
    tool,
    elements,
    selectedIds,
    currentElement,
    isDrawing,
    isPanning,
    spaceHeld,
    showGrid,
    gridSize,
    gridType,
    isDark,
    snapToGrid,
    currentPageIndex,
    style,
    // Actions
    setCamera,
    panBy,
    zoomTo,
    setTool,
    selectElements,
    clearSelection,
    addElement,
    updateElement,
    startDrawing,
    continueDrawing,
    finishDrawing,
    startPanning,
    stopPanning,
    setSpaceHeld,
    setShiftHeld,
    pushHistory,
    moveSelected,
    removeElements,
    eraseAtPoint,
    eraserSize,
    setEraserActive,
    addLaserPoint,
    clearLaser,
    undo,
    redo,
    copySelected,
    cutSelected,
    pasteClipboard,
    duplicateSelected,
    selectAll,
    setShortcutsOpen,
    zoomIn,
    zoomOut,
    zoomReset,
    zoomToFit,
    bringToFront,
    sendToBack,
    toggleLock,
    groupSelected,
    ungroupSelected,
    toggleDark,
    toggleGrid,
    toggleSnap,
    deletePage,
    switchPage,
    addPage,
  } = useWhiteboardStore()

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })
  const [alignGuides, setAlignGuides] = useState<{ axis: 'x' | 'y'; pos: number; start: number; end: number }[]>([])
  const lastPanPoint = useRef<Point | null>(null)
  const lastMovePoint = useRef<Point | null>(null)
  const boxSelectStart = useRef<Point | null>(null)
  const [eraserCursor, setEraserCursor] = useState<{ x: number; y: number } | null>(null)
  const eraserHistoryPushed = useRef(false)
  const isErasing = useRef(false)
  const [boxSelect, setBoxSelect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  // Observe container size
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Get canvas coordinates from pointer event
  const getCanvasPoint = useCallback(
    (e: React.PointerEvent | PointerEvent): Point => {
      const container = containerRef.current
      if (!container) return { x: 0, y: 0 }
      const rect = container.getBoundingClientRect()
      const point = screenToCanvas(e.clientX, e.clientY, camera, rect)
      if (snapToGrid) {
        return {
          x: Math.round(point.x / gridSize) * gridSize,
          y: Math.round(point.y / gridSize) * gridSize,
        }
      }
      return point
    },
    [camera, snapToGrid, gridSize]
  )

  // Filter elements for current page
  const pageElements = elements.filter((el) => el.pageIndex === currentPageIndex)

  // ---- Pointer Handlers ----

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const point = getCanvasPoint(e)

      // Middle mouse or Space+click => pan
      if (e.button === 1 || spaceHeld) {
        startPanning()
        lastPanPoint.current = { x: e.clientX, y: e.clientY }
        e.preventDefault()
        return
      }

      // Right click => ignore
      if (e.button === 2) return

      const container = containerRef.current
      if (!container) return

      switch (tool) {
        case 'select': {
          // Hit test
          let hitId: string | null = null
          for (let i = pageElements.length - 1; i >= 0; i--) {
            const el = pageElements[i]
            if (hitTestElement(point, el, camera.zoom)) {
              hitId = el.id
              break
            }
          }
          if (hitId) {
            if (e.shiftKey) {
              selectElements(
                selectedIds.includes(hitId)
                  ? selectedIds.filter((id) => id !== hitId)
                  : [...selectedIds, hitId]
              )
            } else if (!selectedIds.includes(hitId)) {
              selectElements([hitId])
            }
            // Start move
            pushHistory()
            lastMovePoint.current = point
          } else if (!e.shiftKey) {
            clearSelection()
            // Start box select
            boxSelectStart.current = point
            setBoxSelect(null)
          }
          break
        }
        case 'hand': {
          startPanning()
          lastPanPoint.current = { x: e.clientX, y: e.clientY }
          break
        }
        case 'draw':
        case 'highlighter':
        case 'rectangle':
        case 'ellipse':
        case 'diamond':
        case 'triangle':
        case 'line':
        case 'arrow':
        case 'text':
        case 'sticky':
        case 'frame': {
          startDrawing(point)
          break
        }
        case 'eraser': {
          isErasing.current = true
          // Push history once at the start of the eraser stroke
          if (!eraserHistoryPushed.current) {
            pushHistory()
            eraserHistoryPushed.current = true
          }
          eraseAtPoint(point, camera.zoom)
          break
        }
        case 'laser': {
          addLaserPoint(point)
          break
        }
        case 'image': {
          // Image tool: trigger file input
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = 'image/*'
          input.onchange = (ev) => {
            const file = (ev.target as HTMLInputElement).files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = (re) => {
              const img = new Image()
              img.onload = () => {
                const maxW = 400
                const scale = Math.min(1, maxW / img.width)
                pushHistory()
                const el: WhiteboardElement = {
                  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  type: 'image',
                  x: point.x,
                  y: point.y,
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
                }
                addElement(el)
              }
              img.src = re.target?.result as string
            }
            reader.readAsDataURL(file)
          }
          input.click()
          break
        }
      }
    },
    [
      tool, camera, spaceHeld, pageElements, selectedIds, currentPageIndex,
      getCanvasPoint, startPanning, startDrawing, clearSelection, selectElements,
      pushHistory, eraseAtPoint, addLaserPoint, addElement,
    ]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Pan
      if (isPanning && lastPanPoint.current) {
        const dx = e.clientX - lastPanPoint.current.x
        const dy = e.clientY - lastPanPoint.current.y
        panBy(dx, dy)
        lastPanPoint.current = { x: e.clientX, y: e.clientY }
        return
      }

      const point = getCanvasPoint(e)

      // Move selected elements
      if (tool === 'select' && lastMovePoint.current && selectedIds.length) {
        const dx = point.x - lastMovePoint.current.x
        const dy = point.y - lastMovePoint.current.y
        moveSelected(dx, dy)
        lastMovePoint.current = point
        setAlignGuides(calcAlignGuides(selectedIds, pageElements, 8 / camera.zoom))
        return
      }

      // Box select
      if (tool === 'select' && boxSelectStart.current && !selectedIds.length) {
        const sx = boxSelectStart.current.x
        const sy = boxSelectStart.current.y
        setBoxSelect({
          x: Math.min(sx, point.x),
          y: Math.min(sy, point.y),
          w: Math.abs(point.x - sx),
          h: Math.abs(point.y - sy),
        })
        return
      }

      // Drawing
      if (isDrawing) {
        continueDrawing(point)
      }

      // Eraser (continuous, only while button is held)
      if (tool === 'eraser' && isErasing.current) {
        eraseAtPoint(point, camera.zoom)
      }

      // Eraser cursor position (shown on hover too)
      if (tool === 'eraser') {
        setEraserCursor({ x: e.clientX, y: e.clientY })
      }

      // Laser
      if (tool === 'laser') {
        addLaserPoint(point)
      }
    },
    [
      isPanning, isDrawing, tool, selectedIds, camera.zoom,
      getCanvasPoint, panBy, moveSelected, continueDrawing, eraseAtPoint, addLaserPoint,
    ]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning) {
        stopPanning()
        lastPanPoint.current = null
        return
      }

      if (lastMovePoint.current) {
        lastMovePoint.current = null
        setAlignGuides([])
      }

      if (boxSelectStart.current && boxSelect) {
        // Select elements within box
        const ids: string[] = []
        for (const el of pageElements) {
          const b = getElementBounds(el)
          const inX = b.x >= boxSelect.x && b.x + b.width <= boxSelect.x + boxSelect.w
          const inY = b.y >= boxSelect.y && b.y + b.height <= boxSelect.y + boxSelect.h
          if (inX && inY) ids.push(el.id)
        }
        if (ids.length) selectElements(ids)
        boxSelectStart.current = null
        setBoxSelect(null)
      }

      if (isDrawing) {
        finishDrawing()
      }

      if (tool === 'laser') {
        clearLaser()
      }

      // Eraser stroke ended
      if (tool === 'eraser') {
        isErasing.current = false
        eraserHistoryPushed.current = false
      }
    },
    [
      isPanning, isDrawing, tool, boxSelect, pageElements,
      stopPanning, finishDrawing, clearLaser, selectElements,
    ]
  )

  // ---- Wheel (Zoom) ----
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        // Zoom towards cursor
        const container = containerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08
        const newZoom = Math.max(0.1, Math.min(5, camera.zoom * zoomFactor))

        // Zoom towards cursor position
        const newCameraX = mouseX - (mouseX - camera.x) * (newZoom / camera.zoom)
        const newCameraY = mouseY - (mouseY - camera.y) * (newZoom / camera.zoom)

        setCamera({ x: newCameraX, y: newCameraY, zoom: newZoom })
      } else {
        // Pan
        panBy(-e.deltaX, -e.deltaY)
      }
    },
    [camera, setCamera, panBy]
  )

  // ---- Keyboard Shortcuts ----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when editing text
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey

      // Tool shortcuts
      if (!ctrl && !shift) {
        switch (e.key.toLowerCase()) {
          case 'v': setTool('select'); return
          case 'h': setTool('hand'); return
          case 'd': setTool('draw'); return
          case 'e': setTool('eraser'); return
          case 'a': setTool('arrow'); return
          case 'l': setTool('line'); return
          case 't': setTool('text'); return
          case 'n': setTool('sticky'); return
          case 'r': setTool('rectangle'); return
          case 'o': setTool('ellipse'); return
          case 'f': setTool('frame'); return
          case 'k': setTool('laser'); return
        }
      }
      if (shift && e.key.toLowerCase() === 'd') {
        setTool('highlighter'); return
      }
      if (shift && e.key.toLowerCase() === 'r') {
        setTool('diamond'); return
      }

      // Actions
      if (ctrl && e.key === 'z' && !shift) { e.preventDefault(); undo(); return }
      if (ctrl && e.key === 'z' && shift) { e.preventDefault(); redo(); return }
      if (ctrl && e.key === 'Z') { e.preventDefault(); redo(); return }
      if (ctrl && e.key === 'a') { e.preventDefault(); selectAll(); return }
      if (ctrl && e.key === 'c') { e.preventDefault(); copySelected(); return }
      if (ctrl && e.key === 'x') { e.preventDefault(); cutSelected(); return }
      if (ctrl && e.key === 'v') { e.preventDefault(); pasteClipboard(); return }
      if (ctrl && e.key === 'd') { e.preventDefault(); duplicateSelected(); return }
      if (ctrl && e.key === 'g' && !shift) { e.preventDefault(); groupSelected(); return }
      if (ctrl && e.key === 'g' && shift) { e.preventDefault(); ungroupSelected(); return }
      if (ctrl && e.key === '=') { e.preventDefault(); zoomIn(); return }
      if (ctrl && e.key === '-') { e.preventDefault(); zoomOut(); return }
      if (ctrl && e.key === '/') { e.preventDefault(); setShortcutsOpen(true); return }
      if (shift && e.key === '0') { zoomReset(); return }
      if (shift && e.key === '1') { zoomToFit(); return }
      if (shift && e.key === 'L') { toggleLock(); return }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length) {
          e.preventDefault()
          pushHistory()
          removeElements(selectedIds)
          clearSelection()
        }
        return
      }

      // Z-order
      if (e.key === ']') {
        selectedIds.forEach((id) => bringToFront(id))
        return
      }
      if (e.key === '[') {
        selectedIds.forEach((id) => sendToBack(id))
        return
      }

      // Space for pan
      if (e.key === ' ' && !spaceHeld) {
        e.preventDefault()
        setSpaceHeld(true)
      }

      // Shift for aspect-ratio lock
      if (e.key === 'Shift') {
        setShiftHeld(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setSpaceHeld(false)
      }
      if (e.key === 'Shift') {
        setShiftHeld(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [
    selectedIds, spaceHeld,
    setTool, undo, redo, selectAll, copySelected, cutSelected, pasteClipboard,
    duplicateSelected, groupSelected, ungroupSelected, zoomIn, zoomOut,
    zoomReset, zoomToFit, toggleLock, bringToFront, sendToBack,
    pushHistory, removeElements, clearSelection, setSpaceHeld, setShiftHeld, setShortcutsOpen,
  ])

  // Prevent context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => e.preventDefault(), [])

  // ---- Render ----

  // Build current element preview
  const renderCurrentElement = () => {
    if (!currentElement) return null
    return (
      <ElementRenderer
        element={currentElement}
        isSelected={false}
        onPointerDown={() => {}}
        onDoubleClick={() => {}}
        cameraZoom={camera.zoom}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: isDark ? '#0f172a' : '#f8fafc',
        cursor:
          spaceHeld || tool === 'hand'
            ? isPanning
              ? 'grabbing'
              : 'grab'
            : tool === 'eraser'
              ? 'none'
              : tool === 'select'
                ? 'default'
                : 'crosshair',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
      onPointerLeave={() => tool === 'eraser' && setEraserCursor(null)}
    >
      {/* Grid Background */}
      {showGrid && (
        <GridBackground
          camera={camera}
          gridSize={gridSize}
          gridType={gridType}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          isDark={isDark}
        />
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
      >
        <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}>
          {/* Page elements */}
          {pageElements.map((el) => (
            <ElementRenderer
              key={el.id}
              element={el}
              isSelected={selectedIds.includes(el.id)}
              onPointerDown={() => {}}
              onDoubleClick={(id) => {
                // For text/sticky, focus the content editable
                const svgEl = svgRef.current?.querySelector(
                  `[data-element-id="${id}"]`
                )
                const editable = svgEl?.querySelector('[contenteditable]')
                if (editable) {
                  ;(editable as HTMLElement).focus()
                }
              }}
              onTextChange={(id, text) => {
                updateElement(id, { text } as Partial<WhiteboardElement>)
              }}
              cameraZoom={camera.zoom}
            />
          ))}

          {/* Current drawing preview */}
          {renderCurrentElement()}

          {/* Selection handles */}
          <SelectionHandles containerRef={containerRef} />

          {/* Alignment guides */}
          {alignGuides.map((g, i) => (
            <line
              key={i}
              x1={g.axis === 'x' ? g.pos : g.start}
              y1={g.axis === 'y' ? g.pos : g.start}
              x2={g.axis === 'x' ? g.pos : g.end}
              y2={g.axis === 'y' ? g.pos : g.end}
              stroke="#059669"
              strokeWidth={1 / camera.zoom}
              strokeDasharray={`${4 / camera.zoom} ${4 / camera.zoom}`}
              pointerEvents="none"
              opacity={0.7}
            />
          ))}

          {/* Box select rectangle */}
          {boxSelect && (
            <rect
              x={boxSelect.x}
              y={boxSelect.y}
              width={boxSelect.w}
              height={boxSelect.h}
              fill="rgba(5,150,105,0.05)"
              stroke="#059669"
              strokeWidth={1.5 / camera.zoom}
              strokeDasharray={`${4 / camera.zoom}`}
              rx={2 / camera.zoom}
              pointerEvents="none"
            />
          )}
        </g>
      </svg>

      {/* Eraser cursor visual */}
      {tool === 'eraser' && eraserCursor && (
        <div
          style={{
            position: 'absolute',
            left: eraserCursor.x - containerRef.current!.getBoundingClientRect().left - eraserSize / 2,
            top: eraserCursor.y - containerRef.current!.getBoundingClientRect().top - eraserSize / 2,
            width: eraserSize,
            height: eraserSize,
            borderRadius: '50%',
            border: '2px solid #059669',
            backgroundColor: 'rgba(5, 150, 105, 0.08)',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        />
      )}

      {/* Zoom indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 56,
          right: 12,
          fontSize: 11,
          color: isDark ? '#6b7280' : '#9ca3af',
          fontFamily: 'monospace',
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        {Math.round(camera.zoom * 100)}%
      </div>
    </div>
  )
}
