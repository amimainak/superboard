// ============================================================
// Superboard — Main SVG Canvas
// Infinite canvas with pan/zoom, event handling, rendering
// ============================================================

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWhiteboardStore, STICKY_COLORS } from '@/lib/whiteboard/store'
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
import type { Point, WhiteboardElement, ToolId } from '@/lib/whiteboard/types'

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

  const tool = useWhiteboardStore((s) => s.tool)
  const camera = useWhiteboardStore((s) => s.camera)
  const elements = useWhiteboardStore((s) => s.elements)
  const selectedIds = useWhiteboardStore((s) => s.selectedIds)
  const currentElement = useWhiteboardStore((s) => s.currentElement)
  const isDrawing = useWhiteboardStore((s) => s.isDrawing)
  const isPanning = useWhiteboardStore((s) => s.isPanning)
  const spaceHeld = useWhiteboardStore((s) => s.spaceHeld)
  const showGrid = useWhiteboardStore((s) => s.showGrid)
  const gridSize = useWhiteboardStore((s) => s.gridSize)
  const gridType = useWhiteboardStore((s) => s.gridType)
  const isDark = useWhiteboardStore((s) => s.isDark)
  const snapToGrid = useWhiteboardStore((s) => s.snapToGrid)
  const currentPageIndex = useWhiteboardStore((s) => s.currentPageIndex)
  const style = useWhiteboardStore((s) => s.style)
  const eraserSize = useWhiteboardStore((s) => s.eraserSize)

  const setCamera = useWhiteboardStore((s) => s.setCamera)
  const panBy = useWhiteboardStore((s) => s.panBy)
  const zoomTo = useWhiteboardStore((s) => s.zoomTo)
  const setTool = useWhiteboardStore((s) => s.setTool)
  const selectElements = useWhiteboardStore((s) => s.selectElements)
  const clearSelection = useWhiteboardStore((s) => s.clearSelection)
  const addElement = useWhiteboardStore((s) => s.addElement)
  const updateElement = useWhiteboardStore((s) => s.updateElement)
  const startDrawing = useWhiteboardStore((s) => s.startDrawing)
  const continueDrawing = useWhiteboardStore((s) => s.continueDrawing)
  const finishDrawing = useWhiteboardStore((s) => s.finishDrawing)
  const startPanning = useWhiteboardStore((s) => s.startPanning)
  const stopPanning = useWhiteboardStore((s) => s.stopPanning)
  const setSpaceHeld = useWhiteboardStore((s) => s.setSpaceHeld)
  const setShiftHeld = useWhiteboardStore((s) => s.setShiftHeld)
  const pushHistory = useWhiteboardStore((s) => s.pushHistory)
  const moveSelected = useWhiteboardStore((s) => s.moveSelected)
  const removeElements = useWhiteboardStore((s) => s.removeElements)
  const eraseAtPoint = useWhiteboardStore((s) => s.eraseAtPoint)
  const setEraserActive = useWhiteboardStore((s) => s.setEraserActive)
  const addLaserPoint = useWhiteboardStore((s) => s.addLaserPoint)
  const clearLaser = useWhiteboardStore((s) => s.clearLaser)
  const undo = useWhiteboardStore((s) => s.undo)
  const redo = useWhiteboardStore((s) => s.redo)
  const copySelected = useWhiteboardStore((s) => s.copySelected)
  const cutSelected = useWhiteboardStore((s) => s.cutSelected)
  const pasteClipboard = useWhiteboardStore((s) => s.pasteClipboard)
  const duplicateSelected = useWhiteboardStore((s) => s.duplicateSelected)
  const selectAll = useWhiteboardStore((s) => s.selectAll)
  const setShortcutsOpen = useWhiteboardStore((s) => s.setShortcutsOpen)
  const zoomIn = useWhiteboardStore((s) => s.zoomIn)
  const zoomOut = useWhiteboardStore((s) => s.zoomOut)
  const zoomReset = useWhiteboardStore((s) => s.zoomReset)
  const zoomToFit = useWhiteboardStore((s) => s.zoomToFit)
  const bringToFront = useWhiteboardStore((s) => s.bringToFront)
  const sendToBack = useWhiteboardStore((s) => s.sendToBack)
  const toggleLock = useWhiteboardStore((s) => s.toggleLock)
  const groupSelected = useWhiteboardStore((s) => s.groupSelected)
  const ungroupSelected = useWhiteboardStore((s) => s.ungroupSelected)
  const toggleDark = useWhiteboardStore((s) => s.toggleDark)
  const toggleGrid = useWhiteboardStore((s) => s.toggleGrid)
  const toggleSnap = useWhiteboardStore((s) => s.toggleSnap)
  const togglePresentationMode = useWhiteboardStore((s) => s.togglePresentationMode)
  const deletePage = useWhiteboardStore((s) => s.deletePage)
  const switchPage = useWhiteboardStore((s) => s.switchPage)
  const addPage = useWhiteboardStore((s) => s.addPage)
  const canDraw = useWhiteboardStore((s) => s.canDraw)
  const userRole = useWhiteboardStore((s) => s.userRole)

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })
  const [alignGuides, setAlignGuides] = useState<{ axis: 'x' | 'y'; pos: number; start: number; end: number }[]>([])
  const lastPanPoint = useRef<Point | null>(null)
  const lastMovePoint = useRef<Point | null>(null)
  const boxSelectStart = useRef<Point | null>(null)
  const [eraserCursor, setEraserCursor] = useState<{ x: number; y: number } | null>(null)
  const eraserHistoryPushed = useRef(false)
  const isErasing = useRef(false)
  const [boxSelect, setBoxSelect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  // ---- rAF batching for pointer move (P-01) ----
  const pendingPointsRef = useRef<Array<{ x: number; y: number; pressure: number }>>([])
  const rafIdRef = useRef<number>(0)

  // ---- Touch / Stylus / Multi-touch state ----
  const isLaserActive = useRef(false)       // laser only draws when pointer is down
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map())  // for pinch/pan
  const pinchState = useRef<{ startDist: number; startZoom: number; startCenter: { x: number; y: number }; lastCenter: { x: number; y: number } } | null>(null)
  const prevToolRef = useRef<ToolId | null>(null) // for stylus barrel-button eraser
  const palmRejectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---- Image tool: open file picker immediately on tool select ----
  useEffect(() => {
    if (tool !== 'image') return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    let cancelled = false

    input.onchange = (ev) => {
      if (cancelled) return
      const file = (ev.target as HTMLInputElement).files?.[0]
      if (!file) {
        setTool('select')
        return
      }
      const reader = new FileReader()
      reader.onload = (re) => {
        if (cancelled) return
        const img = new Image()
        img.onload = () => {
          if (cancelled) return
          const maxW = 400
          const scale = Math.min(1, maxW / img.width)
          // Place image at center of the current viewport
          const cx = -camera.x + containerSize.width / 2 / camera.zoom
          const cy = -camera.y + containerSize.height / 2 / camera.zoom
          pushHistory()
          const el: WhiteboardElement = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: 'image',
            x: cx - (img.width * scale) / 2,
            y: cy - (img.height * scale) / 2,
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
          setTool('select')
        }
        img.src = re.target?.result as string
      }
      reader.readAsDataURL(file)
    }

    // If user cancels the file dialog (no onchange fires), still revert tool
    const onCancel = () => {
      // Small delay to let onchange fire first if a file was selected
      setTimeout(() => {
        if (!cancelled) {
          setTool('select')
        }
      }, 300)
    }
    input.addEventListener('cancel', onCancel)

    input.click()

    return () => {
      cancelled = true
      input.removeEventListener('cancel', onCancel)
    }
  }, [tool]) // intentionally minimal deps — runs once per tool switch to 'image'

  // ---- PDF tool: open file picker, render first page to image ----
  useEffect(() => {
    if (tool !== 'pdf') return

    let cancelled = false

    // Dynamic import of pdfjs-dist (client-side only)
    import('pdfjs-dist/legacy/build/pdf.mjs').then(async (pdfjsLib) => {
      if (cancelled) return

      // Set worker source to CDN
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs'

      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.pdf,application/pdf'

      input.onchange = async (ev) => {
        if (cancelled) return
        const file = (ev.target as HTMLInputElement).files?.[0]
        if (!file) {
          setTool('select')
          return
        }

        try {
          const arrayBuffer = await file.arrayBuffer()
          if (cancelled) return

          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
          if (cancelled) return

          // Render first page
          const page = await pdf.getPage(1)
          if (cancelled) return

          const viewport = page.getViewport({ scale: 2 }) // 2x for quality

          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')!

          await page.render({ canvasContext: ctx, viewport }).promise
          if (cancelled) return

          const pdfDataUrl = canvas.toDataURL('image/png')

          // Calculate placement: fit PDF to viewport with padding
          const vw = containerSize.width / camera.zoom
          const vh = containerSize.height / camera.zoom
          const pdfAspect = viewport.width / viewport.height
          const viewAspect = vw / vh

          let elWidth: number
          let elHeight: number
          if (pdfAspect > viewAspect) {
            elWidth = vw * 0.9
            elHeight = elWidth / pdfAspect
          } else {
            elHeight = vh * 0.9
            elWidth = elHeight * pdfAspect
          }

          // Center in viewport
          const cx = -camera.x + containerSize.width / 2 / camera.zoom
          const cy = -camera.y + containerSize.height / 2 / camera.zoom

          pushHistory()
          const el: WhiteboardElement = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: 'pdf',
            x: cx - elWidth / 2,
            y: cy - elHeight / 2,
            width: elWidth,
            height: elHeight,
            rotation: 0,
            opacity: 1,
            strokeColor: 'transparent',
            fillColor: 'transparent',
            strokeWidth: 0,
            locked: false,
            pageIndex: currentPageIndex,
            pdfDataUrl,
            pageNumber: 1,
            naturalWidth: viewport.width,
            naturalHeight: viewport.height,
          }
          addElement(el)
          setTool('select')
        } catch (err) {
          console.error('Failed to load PDF:', err)
          setTool('select')
        }
      }

      // If user cancels the file dialog
      const onCancel = () => {
        setTimeout(() => {
          if (!cancelled) {
            setTool('select')
          }
        }, 300)
      }
      input.addEventListener('cancel', onCancel)

      input.click()

      return () => {
        input.removeEventListener('cancel', onCancel)
      }
    }).catch((err) => {
      console.error('Failed to load pdfjs-dist:', err)
      if (!cancelled) setTool('select')
    })

    return () => {
      cancelled = true
    }
  }, [tool]) // intentionally minimal deps — runs once per tool switch to 'pdf'

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

  // Get canvas coordinates from pointer event (includes real stylus pressure)
  const getCanvasPoint = useCallback(
    (e: React.PointerEvent | PointerEvent): Point & { pressure: number } => {
      const container = containerRef.current
      if (!container) return { x: 0, y: 0, pressure: 0.5 }
      const rect = container.getBoundingClientRect()
      const point = screenToCanvas(e.clientX, e.clientY, camera, rect)
      // Mouse reports pressure as 0 or 0.5; only 0 < pressure < 1 indicates real stylus input
      const pressure = e.pressure > 0 && e.pressure < 1 ? e.pressure : 0.5
      if (snapToGrid) {
        return {
          x: Math.round(point.x / gridSize) * gridSize,
          y: Math.round(point.y / gridSize) * gridSize,
          pressure,
        }
      }
      return { ...point, pressure }
    },
    [camera, snapToGrid, gridSize]
  )

  // Filter elements for current page (P-07)
  const pageElements = useMemo(
    () => elements.filter((el) => el.pageIndex === currentPageIndex),
    [elements, currentPageIndex]
  )

  // ---- Palm / Touch Rejection ----
  // Reject non-primary touch pointers (secondary fingers, palm rests).
  // For stylus (`pointerType === 'pen'`) always allow.
  // For touch, reject if the contact area is suspiciously large (palm).
  const shouldRejectPointer = useCallback((e: React.PointerEvent | PointerEvent): boolean => {
    // Always allow mouse and pen (stylus/tablet pen)
    if (e.pointerType === 'mouse' || e.pointerType === 'pen') return false
    // Touch: reject non-primary pointers (extra fingers / palm)
    if (!e.isPrimary) return true
    // Touch: reject if contact area looks like palm (width or height > 30px)
    // PointerEvent.width/height are in CSS pixels of the contact ellipse
    if (e.width > 30 || e.height > 30) return true
    return false
  }, [])

  // ---- Pinch-to-Zoom helpers ----
  const getPinchDist = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return 0
    const [a, b] = pts
    return Math.hypot(b.x - a.x, b.y - a.y)
  }
  const getPinchCenter = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return pts[0]
    return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
  }

  // ---- Pointer Handlers ----

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // ---- Drawing permission check ----
      if (userRole === 'guest' && !canDraw && tool !== 'select' && tool !== 'hand') {
        // Brief visual feedback via a small toast
        const toast = document.getElementById('draw-permission-toast')
        if (toast) {
          toast.style.opacity = '1'
          toast.style.transform = 'translateX(-50%) translateY(0)'
          clearTimeout((toast as any)._timer)
          ;(toast as any)._timer = setTimeout(() => {
            toast.style.opacity = '0'
            toast.style.transform = 'translateX(-50%) translateY(8px)'
          }, 1500)
        }
        return
      }

      // ---- Palm rejection for touch ----
      if (shouldRejectPointer(e)) {
        e.preventDefault()
        return
      }

      // ---- Multi-touch pinch/pan detection ----
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (activePointers.current.size === 2 && e.pointerType === 'touch') {
        // Two-finger gesture: enter pinch/pan mode
        const pts = Array.from(activePointers.current.values())
        const container = containerRef.current
        if (container) {
          // Cancel any ongoing drawing
          if (isDrawing) finishDrawing()
          clearSelection()
          startPanning()
          pinchState.current = {
            startDist: getPinchDist(pts),
            startZoom: camera.zoom,
            startCenter: getPinchCenter(pts),
            lastCenter: getPinchCenter(pts),
          }
          lastPanPoint.current = getPinchCenter(pts)
        }
        e.preventDefault()
        return
      }

      const point = getCanvasPoint(e)

      // ---- Stylus barrel button (button 2 = eraser) ----
      if (e.pointerType === 'pen' && e.buttons === 2) {
        if (tool !== 'eraser') {
          prevToolRef.current = tool
          setTool('eraser')
        }
      }

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
            // Start move — don't push history until actual movement happens
            lastMovePoint.current = point
            lastPanPoint.current = { x: e.clientX, y: e.clientY }
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
        case 'frame': {
          startDrawing(point)
          break
        }
        case 'sticky': {
          // Sticky note: immediately place at click position, then revert to select
          pushHistory()
          const color = STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)]
          const el: WhiteboardElement = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: 'sticky',
            x: point.x - 100,
            y: point.y - 100,
            width: 200,
            height: 200,
            rotation: 0,
            opacity: 1,
            strokeColor: '#00000020',
            fillColor: color,
            strokeWidth: 1,
            locked: false,
            pageIndex: currentPageIndex,
            text: '',
            fontSize: 16,
            noteColor: color,
          } as WhiteboardElement
          addElement(el)
          // Select the new sticky and switch to select tool
          selectElements([el.id])
          setTool('select')
          break
        }
        case 'eraser': {
          isErasing.current = true
          // Push history once at the start of the eraser stroke (lazy — on first actual erase)
          eraseAtPoint(point, camera.zoom)
          break
        }
        case 'eraser-object': {
          // Object eraser: tap on an element to delete the whole thing
          isErasing.current = true
          if (!eraserHistoryPushed.current) {
            eraserHistoryPushed.current = true
            pushHistory()
          }
          let hitId: string | null = null
          for (let i = pageElements.length - 1; i >= 0; i--) {
            const el = pageElements[i]
            if (hitTestElement(point, el, camera.zoom)) {
              hitId = el.id
              break
            }
          }
          if (hitId) {
            removeElements([hitId])
          }
          break
        }
        case 'laser': {
          isLaserActive.current = true
          addLaserPoint(point)
          break
        }
        case 'image': {
          // Image file picker is handled by the useEffect — no-op here
          break
        }
        case 'pdf': {
          // PDF file picker is handled by the useEffect — no-op here
          break
        }
      }
    },
    [
      tool, camera, spaceHeld, pageElements, selectedIds, currentPageIndex,
      getCanvasPoint, startPanning, startDrawing, finishDrawing, clearSelection, selectElements,
      pushHistory, eraseAtPoint, addLaserPoint, addElement, shouldRejectPointer, isDrawing, setTool, removeElements,
      userRole, canDraw,
    ]
  )

  // ---- rAF flush for batched drawing points (P-01) ----
  const flushPendingPoints = useCallback(() => {
    rafIdRef.current = 0
    const pts = pendingPointsRef.current
    if (pts.length === 0) return
    pendingPointsRef.current = []

    const storeState = useWhiteboardStore.getState()
    if (!storeState.isDrawing || !storeState.currentElement) return

    if (storeState.currentElement.type === 'freehand') {
      // For freehand, apply all pending points at once via the store
      for (const pt of pts) {
        storeState.continueDrawing(pt)
      }
    } else {
      // For shapes, only the last point matters
      storeState.continueDrawing(pts[pts.length - 1])
    }
  }, [])

  // Cancel any pending rAF batch
  const cancelPendingRaf = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = 0
    }
    // Flush any remaining points before cancelling
    if (pendingPointsRef.current.length > 0) {
      const pts = pendingPointsRef.current
      pendingPointsRef.current = []
      const storeState = useWhiteboardStore.getState()
      if (storeState.isDrawing && storeState.currentElement) {
        if (storeState.currentElement.type === 'freehand') {
          for (const pt of pts) {
            storeState.continueDrawing(pt)
          }
        } else {
          storeState.continueDrawing(pts[pts.length - 1])
        }
      }
    }
  }, [])

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
      // Cancel any in-flight laser fade animation (P-10)
      useWhiteboardStore.getState()._cancelLaserRaf()
    }
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // ---- Palm rejection: skip non-primary touch moves ----
      if (e.pointerType === 'touch' && !e.isPrimary) return

      // ---- Multi-touch pinch/pan tracking ----
      if (activePointers.current.has(e.pointerId)) {
        activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      }
      if (pinchState.current && activePointers.current.size >= 2) {
        const pts = Array.from(activePointers.current.values()).slice(0, 2)
        const dist = getPinchDist(pts)
        const center = getPinchCenter(pts)
        const container = containerRef.current
        if (container) {
          const rect = container.getBoundingClientRect()
          const cx = center.x - rect.left
          const cy = center.y - rect.top
          // Pinch zoom
          const scale = dist / pinchState.current.startDist
          const newZoom = Math.max(0.1, Math.min(5, pinchState.current.startZoom * scale))
          // Pan towards pinch center
          const newCameraX = cx - (cx - camera.x) * (newZoom / camera.zoom)
          const newCameraY = cy - (cy - camera.y) * (newZoom / camera.zoom)
          setCamera({ x: newCameraX, y: newCameraY, zoom: newZoom })
        }
        return
      }

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
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
          moveSelected(dx, dy)
          lastMovePoint.current = point
          setAlignGuides(calcAlignGuides(selectedIds, pageElements, 8 / camera.zoom))
        }
        return
      }

      // Box select
      if (tool === 'select' && boxSelectStart.current) {
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

      // Drawing — batch via rAF (P-01)
      if (isDrawing) {
        pendingPointsRef.current.push({ x: point.x, y: point.y, pressure: point.pressure })
        if (!rafIdRef.current) {
          rafIdRef.current = requestAnimationFrame(flushPendingPoints)
        }
        return
      }

      // Eraser (continuous, only while button is held)
      if (tool === 'eraser' && isErasing.current) {
        eraseAtPoint(point, camera.zoom)
      }

      // Object eraser: continuously erase objects under cursor while dragging
      if (tool === 'eraser-object' && isErasing.current) {
        let hitId: string | null = null
        for (let i = pageElements.length - 1; i >= 0; i--) {
          const el = pageElements[i]
          if (hitTestElement(point, el, camera.zoom)) {
            hitId = el.id
            break
          }
        }
        if (hitId) {
          removeElements([hitId])
        }
      }

      // Custom cursor position (shown on hover too)
      if (tool === 'eraser' || tool === 'eraser-object' || tool === 'draw' || tool === 'highlighter') {
        setEraserCursor({ x: e.clientX, y: e.clientY })
      }

      // Laser — ONLY when pointer button is held down (no hover drawing)
      if (tool === 'laser' && isLaserActive.current) {
        addLaserPoint(point)
      }
    },
    [
      isPanning, isDrawing, tool, selectedIds, camera.zoom, camera.x, camera.y,
      getCanvasPoint, panBy, moveSelected, eraseAtPoint, addLaserPoint, setCamera,
      flushPendingPoints,
    ]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      // ---- Multi-touch: remove pointer, end pinch if < 2 ----
      activePointers.current.delete(e.pointerId)
      if (pinchState.current && activePointers.current.size < 2) {
        pinchState.current = null
        stopPanning()
        lastPanPoint.current = null
        return
      }

      if (isPanning) {
        stopPanning()
        lastPanPoint.current = null
        return
      }

      // Finish element move — push history only if we actually moved
      if (lastMovePoint.current) {
        // Check if we moved from the original start point
        const startClient = lastPanPoint.current
        if (startClient && (Math.abs(e.clientX - startClient.x) > 1 || Math.abs(e.clientY - startClient.y) > 1)) {
          pushHistory()
        }
        lastMovePoint.current = null
        lastPanPoint.current = null
        setAlignGuides([])
      }

      // Finish box select
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
      } else if (boxSelectStart.current) {
        // Clicked on empty space with no drag — just clear box select start
        boxSelectStart.current = null
        setBoxSelect(null)
      }

      if (isDrawing) {
        const el = finishDrawing()
        // Auto-focus text/sticky after placement
        if (el && (el.type === 'text' || el.type === 'sticky')) {
          // Use double-rAF to ensure the DOM has rendered the new element
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const groupEl = svgRef.current?.querySelector(
                `[data-element-id="${el.id}"]`
              )
              const editable = groupEl?.querySelector('[contenteditable]') as HTMLElement | null
              if (editable) {
                editable.focus()
                const range = document.createRange()
                const sel = window.getSelection()
                range.setStart(editable, 0)
                range.collapse(true)
                sel?.removeAllRanges()
                sel?.addRange(range)
              }
            })
          })
        }
      }

      // Flush any pending rAF batched points (P-01)
      cancelPendingRaf()

      // Laser: stop drawing on pointer up, trigger fade
      if (tool === 'laser' && isLaserActive.current) {
        isLaserActive.current = false
        clearLaser()
      }

      // Eraser stroke ended
      if (tool === 'eraser' || tool === 'eraser-object') {
        isErasing.current = false
        eraserHistoryPushed.current = false
        // Reset eraser history tracking for next stroke
        useWhiteboardStore.getState().setEraserActive(false)
      }

      // ---- Stylus barrel button release: restore previous tool ----
      if (e.pointerType === 'pen' && (tool === 'eraser' || tool === 'eraser-object') && prevToolRef.current) {
        setTool(prevToolRef.current)
        prevToolRef.current = null
      }
    },
    [
      isPanning, isDrawing, tool, boxSelect, pageElements,
      stopPanning, finishDrawing, clearLaser, selectElements, setTool,
      cancelPendingRaf,
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

      // Escape: exit presentation mode or clear selection
      if (e.key === 'Escape') {
        const store = useWhiteboardStore.getState()
        if (store.isPresentationMode) {
          togglePresentationMode()
          return
        }
        if (selectedIds.length) {
          clearSelection()
          return
        }
      }

      // Presentation mode shortcut (P)
      if (!ctrl && !shift && e.key.toLowerCase() === 'p') {
        togglePresentationMode()
        return
      }

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
      if (shift && e.key.toLowerCase() === 'e') {
        setTool('eraser-object'); return
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
    togglePresentationMode,
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
            : tool === 'eraser' || tool === 'eraser-object' || tool === 'draw' || tool === 'highlighter'
              ? 'none'
              : tool === 'select'
                ? 'default'
                : 'crosshair',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
      onPointerLeave={() => {
        if (tool === 'eraser' || tool === 'eraser-object' || tool === 'draw' || tool === 'highlighter') setEraserCursor(null)
        // Cancel laser on pointer leave
        if (tool === 'laser' && isLaserActive.current) {
          isLaserActive.current = false
          clearLaser()
        }
        // Finish in-progress strokes on pointer leave (P-06)
        if (isDrawing) {
          cancelPendingRaf()
          finishDrawing()
        }
        isErasing.current = false
      }}
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
            <g key={el.id} data-element-id={el.id}>
              <ElementRenderer
                element={el}
                isSelected={selectedIds.includes(el.id)}
                onPointerDown={(e, id) => {
                  if (tool === 'select') {
                    if (e.shiftKey) {
                      selectElements(
                        selectedIds.includes(id)
                          ? selectedIds.filter((sid) => sid !== id)
                          : [...selectedIds, id]
                      )
                    } else if (!selectedIds.includes(id)) {
                      selectElements([id])
                    }
                    pushHistory()
                    lastMovePoint.current = getCanvasPoint(e)
                  }
                }}
                onDoubleClick={(id) => {
                  // For text/sticky, focus the content editable div inside the foreignObject
                  const groupEl = svgRef.current?.querySelector(
                    `[data-element-id=\"${id}\"]`
                  )
                  const editable = groupEl?.querySelector('[contenteditable]') as HTMLElement | null
                  if (editable) {
                    editable.focus()
                    // Place cursor at end of text
                    const range = document.createRange()
                    const sel = window.getSelection()
                    if (editable.childNodes.length > 0) {
                      range.selectNodeContents(editable)
                      range.collapse(false)
                    } else {
                      range.setStart(editable, 0)
                      range.collapse(true)
                    }
                    sel?.removeAllRanges()
                    sel?.addRange(range)
                  }
                }}
                onTextChange={(id, text) => {
                  updateElement(id, { text } as Partial<WhiteboardElement>)
                }}
                cameraZoom={camera.zoom}
              />
            </g>
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
      {tool === 'eraser' && eraserCursor && containerRef.current && (
        <div
          style={{
            position: 'absolute',
            left: eraserCursor.x - containerRef.current.getBoundingClientRect().left - eraserSize / 2,
            top: eraserCursor.y - containerRef.current.getBoundingClientRect().top - eraserSize / 2,
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
      {/* Object eraser cursor — red circle */}
      {tool === 'eraser-object' && eraserCursor && containerRef.current && (
        <div
          style={{
            position: 'absolute',
            left: eraserCursor.x - containerRef.current.getBoundingClientRect().left - 12,
            top: eraserCursor.y - containerRef.current.getBoundingClientRect().top - 12,
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid #ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        />
      )}
      {/* Draw / Highlighter pen cursor */}
      {(tool === 'draw' || tool === 'highlighter') && eraserCursor && containerRef.current && (
        <svg
          style={{
            position: 'absolute',
            left: eraserCursor.x - containerRef.current.getBoundingClientRect().left - 6,
            top: eraserCursor.y - containerRef.current.getBoundingClientRect().top - 6,
            width: 24,
            height: 24,
            pointerEvents: 'none',
            zIndex: 1000,
            filter: isDark ? 'drop-shadow(0 0 3px rgba(52, 211, 153, 0.4))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
          }}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17 3l4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
            stroke={isDark ? '#34d399' : '#059669'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(5, 150, 105, 0.08)'}
          />
          <circle
            cx="3.25"
            cy="20.75"
            r="1.2"
            fill={isDark ? '#34d399' : '#059669'}
          />
        </svg>
      )}

      {/* Draw permission toast (for guest when drawing disabled) */}
      {userRole === 'guest' && !canDraw && (
        <div
          id="draw-permission-toast"
          style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%) translateY(8px)',
            opacity: 0,
            padding: '6px 14px',
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.9)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 500,
            pointerEvents: 'none',
            zIndex: 2000,
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          ✏️ Drawing is disabled
        </div>
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
