// ============================================================
// Superboard — Selection Handles
// Resize/rotate handles for selected elements
// ============================================================

'use client'

import React, { useCallback, useRef, useState } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { getElementBounds, getBoundsCenter, type Bounds } from '@/lib/whiteboard/utils'
import type { WhiteboardElement } from '@/lib/whiteboard/types'

interface SelectionHandlesProps {
  containerRef: React.RefObject<HTMLDivElement | null>
}

const HANDLE_SIZE = 8

export function SelectionHandles({ containerRef }: SelectionHandlesProps) {
  const elements = useWhiteboardStore((s) => s.elements)
  const selectedIds = useWhiteboardStore((s) => s.selectedIds)
  const camera = useWhiteboardStore((s) => s.camera)
  const updateElement = useWhiteboardStore((s) => s.updateElement)
  const removeElements = useWhiteboardStore((s) => s.removeElements)
  const pushHistory = useWhiteboardStore((s) => s.pushHistory)
  const isDark = useWhiteboardStore((s) => s.isDark)

  const [dragInfo, setDragInfo] = useState<{
    type: 'move' | 'resize'
    handle?: string
    startMouse: { x: number; y: number }
    startBounds: Bounds
    elementIds: string[]
  } | null>(null)

  const selectedElements = elements.filter((e) => selectedIds.includes(e.id))

  if (selectedElements.length === 0) return null

  // For single selection, show resize handles
  if (selectedElements.length === 1) {
    const el = selectedElements[0]
    if (el.type === 'freehand' || el.type === 'laser' || el.type === 'line' || el.type === 'arrow') {
      // Just show outline, no resize handles for freehand
      return (
        <SelectionOutline
          bounds={getElementBounds(el)}
          camera={camera}
          isDark={isDark}
          isLocked={el.locked}
        />
      )
    }
    const bounds = getElementBounds(el)
    return (
      <SingleElementHandles
        element={el}
        bounds={bounds}
        camera={camera}
        containerRef={containerRef}
        isDark={isDark}
        onResize={(newBounds) => {
          pushHistory()
          updateElement(el.id, {
            x: newBounds.x,
            y: newBounds.y,
            width: Math.max(5, newBounds.width),
            height: Math.max(5, newBounds.height),
          })
        }}
        onMoveStart={() => pushHistory()}
      />
    )
  }

  // For multi-selection, show bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const el of selectedElements) {
    const b = getElementBounds(el)
    if (b.x < minX) minX = b.x
    if (b.y < minY) minY = b.y
    if (b.x + b.width > maxX) maxX = b.x + b.width
    if (b.y + b.height > maxY) maxY = b.y + b.height
  }

  const multiBounds: Bounds = {
    x: minX - 4,
    y: minY - 4,
    width: maxX - minX + 8,
    height: maxY - minY + 8,
  }

  return <SelectionOutline bounds={multiBounds} camera={camera} isDark={isDark} />
}

function SelectionOutline({
  bounds,
  camera,
  isDark,
  isLocked,
}: {
  bounds: Bounds
  camera: { zoom: number; x: number; y: number }
  isDark: boolean
  isLocked?: boolean
}) {
  const strokeColor = isLocked ? '#f59e0b' : '#059669'
  return (
    <rect
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      fill="none"
      stroke={strokeColor}
      strokeWidth={1.5 / camera.zoom}
      strokeDasharray={isLocked ? `${4 / camera.zoom}` : undefined}
      pointerEvents="none"
      rx={2 / camera.zoom}
    />
  )
}

function SingleElementHandles({
  element,
  bounds,
  camera,
  containerRef,
  isDark,
  onResize,
  onMoveStart,
}: {
  element: WhiteboardElement
  bounds: Bounds
  camera: { zoom: number; x: number; y: number }
  containerRef: React.RefObject<HTMLDivElement | null>
  isDark: boolean
  onResize: (newBounds: Bounds) => void
  onMoveStart: () => void
}) {
  const dragRef = useRef<{
    handle: string
    startMouse: { x: number; y: number }
    startBounds: Bounds
  } | null>(null)

  const hs = HANDLE_SIZE / camera.zoom

  const handles = [
    { id: 'nw', x: bounds.x, y: bounds.y, cursor: 'nwse-resize' },
    { id: 'n', x: bounds.x + bounds.width / 2, y: bounds.y, cursor: 'ns-resize' },
    { id: 'ne', x: bounds.x + bounds.width, y: bounds.y, cursor: 'nesw-resize' },
    { id: 'e', x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2, cursor: 'ew-resize' },
    { id: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height, cursor: 'nwse-resize' },
    { id: 's', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height, cursor: 'ns-resize' },
    { id: 'sw', x: bounds.x, y: bounds.y + bounds.height, cursor: 'nesw-resize' },
    { id: 'w', x: bounds.x, y: bounds.y + bounds.height / 2, cursor: 'ew-resize' },
  ]

  const handlePointerDown = useCallback(
    (handleId: string, e: React.PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      dragRef.current = {
        handle: handleId,
        startMouse: { x: mouseX, y: mouseY },
        startBounds: { ...bounds },
      }
      onMoveStart()

      const handleMove = (ev: PointerEvent) => {
        if (!dragRef.current || !container) return
        const dx = (ev.clientX - rect.left - dragRef.current.startMouse.x) / camera.zoom
        const dy = (ev.clientY - rect.top - dragRef.current.startMouse.y) / camera.zoom
        const sb = dragRef.current.startBounds
        const h = dragRef.current.handle

        let newBounds = { ...sb }

        if (h.includes('w')) {
          newBounds.x = sb.x + dx
          newBounds.width = sb.width - dx
        }
        if (h.includes('e')) {
          newBounds.width = sb.width + dx
        }
        if (h.includes('n')) {
          newBounds.y = sb.y + dy
          newBounds.height = sb.height - dy
        }
        if (h.includes('s')) {
          newBounds.height = sb.height + dy
        }

        // Prevent negative size
        if (newBounds.width < 5) {
          if (h.includes('w')) newBounds.x = sb.x + sb.width - 5
          newBounds.width = 5
        }
        if (newBounds.height < 5) {
          if (h.includes('n')) newBounds.y = sb.y + sb.height - 5
          newBounds.height = 5
        }

        onResize(newBounds)
      }

      const handleUp = () => {
        dragRef.current = null
        document.removeEventListener('pointermove', handleMove)
        document.removeEventListener('pointerup', handleUp)
      }

      document.addEventListener('pointermove', handleMove)
      document.addEventListener('pointerup', handleUp)
    },
    [bounds, camera.zoom, containerRef, onResize, onMoveStart]
  )

  const strokeColor = element.locked ? '#f59e0b' : '#059669'

  return (
    <g>
      {/* Outline */}
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5 / camera.zoom}
        pointerEvents="none"
        rx={2 / camera.zoom}
      />
      {/* Handles */}
      {handles.map((h) => (
        <rect
          key={h.id}
          x={h.x - hs / 2}
          y={h.y - hs / 2}
          width={hs}
          height={hs}
          rx={1.5 / camera.zoom}
          fill="#ffffff"
          stroke={strokeColor}
          strokeWidth={1.5 / camera.zoom}
          style={{ cursor: h.cursor }}
          onPointerDown={(e) => handlePointerDown(h.id, e)}
        />
      ))}
    </g>
  )
}
