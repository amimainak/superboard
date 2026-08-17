// ============================================================
// Superboard — Zustand State Store
// All whiteboard state, actions, undo/redo, multi-page
// ============================================================

import { create } from 'zustand'
import type {
  WhiteboardElement,
  Camera,
  ToolId,
  WhiteboardPage,
  HistoryEntry,
  Point,
  ElementStyle,
} from './types'
import { generateId, getElementBounds, splitFreehandAtPoint } from './utils'

// ---- Path simplification (P-03) ----

function perpendicularDist(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2)
  return Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / len
}

function simplifyPoints(
  points: Array<{ x: number; y: number }>,
  tolerance: number = 1
): Array<{ x: number; y: number }> {
  if (points.length <= 2) return points
  let maxDist = 0
  let maxIndex = 0
  const first = points[0]
  const last = points[points.length - 1]
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDist(points[i], first, last)
    if (dist > maxDist) {
      maxDist = dist
      maxIndex = i
    }
  }
  if (maxDist > tolerance) {
    const left = simplifyPoints(points.slice(0, maxIndex + 1), tolerance)
    const right = simplifyPoints(points.slice(maxIndex), tolerance)
    return [...left.slice(0, -1), ...right]
  }
  return [first, last]
}

// ---- Laser rAF tracking (P-10) ----
let laserRafId: number = 0

// ---- Default Values ----

export const DEFAULT_STYLE: ElementStyle = {
  strokeColor: '#1e293b',
  fillColor: 'transparent',
  strokeWidth: 2,
  opacity: 1,
  dash: [],
  fontSize: 20,
  fontFamily: 'inherit',
  textAlign: 'left' as const,
  fontWeight: 'normal',
  fontStyle: 'normal',
}

const DEFAULT_CAMERA: Camera = { x: 0, y: 0, zoom: 1 }

export const STICKY_COLORS = [
  '#fef08a', // yellow
  '#bbf7d0', // green
  '#bfdbfe', // blue
  '#fecaca', // red
  '#e9d5ff', // purple
  '#fed7aa', // orange
]

// ---- Store Interface ----

export interface WhiteboardStore {
  // State
  elements: WhiteboardElement[]
  camera: Camera
  tool: ToolId
  selectedIds: string[]
  style: ElementStyle
  pages: WhiteboardPage[]
  currentPageIndex: number
  isDark: boolean
  showGrid: boolean
  gridSize: number
  gridType: 'dot' | 'line'
  snapToGrid: boolean
  isDrawing: boolean
  isPanning: boolean
  isResizing: boolean
  spaceHeld: boolean
  shiftHeld: boolean
  shortcutsOpen: boolean
  isPresentationMode: boolean
  clipboard: WhiteboardElement[]
  currentPageName: string

  // Drawing state
  currentElement: WhiteboardElement | null
  drawingPoints: Point[]

  // History
  undoStack: HistoryEntry[]
  redoStack: HistoryEntry[]

  // Actions
  setTool: (tool: ToolId) => void
  setStyle: (style: Partial<ElementStyle>) => void
  setCamera: (camera: Partial<Camera>) => void
  zoomTo: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  zoomReset: () => void
  zoomToFit: () => void
  panBy: (dx: number, dy: number) => void
  setDark: (isDark: boolean) => void
  toggleDark: () => void
  toggleGrid: () => void
  toggleSnap: () => void
  setGridType: (type: 'dot' | 'line') => void
  toggleShortcuts: () => void
  setShortcutsOpen: (open: boolean) => void

  // Element actions
  addElement: (el: WhiteboardElement) => void
  updateElement: (id: string, updates: Partial<WhiteboardElement>) => void
  removeElements: (ids: string[]) => void
  selectElements: (ids: string[]) => void
  clearSelection: () => void
  selectAll: () => void
  duplicateSelected: () => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  toggleLock: () => void
  groupSelected: () => void
  ungroupSelected: () => void
  moveSelected: (dx: number, dy: number) => void
  resizeSelected: (newBounds: { x: number; y: number; width: number; height: number }) => void

  // Drawing
  startDrawing: (point: Point) => void
  continueDrawing: (point: Point) => void
  finishDrawing: () => WhiteboardElement | null
  setCurrentElement: (el: WhiteboardElement | null) => void

  // Pan/Zoom interaction
  startPanning: () => void
  stopPanning: () => void
  setSpaceHeld: (held: boolean) => void
  setShiftHeld: (held: boolean) => void

  // History
  pushHistory: () => void
  undo: () => void
  redo: () => void

  // Pages
  addPage: () => void
  deletePage: (index: number) => void
  clearCurrentPage: () => void
  switchPage: (index: number) => void
  renamePage: (index: number, name: string) => void
  getCurrentPageElements: () => WhiteboardElement[]
  setPages: (pages: WhiteboardPage[]) => void
  setCurrentPageIndex: (index: number) => void

  // Clipboard
  copySelected: () => void
  cutSelected: () => void
  pasteClipboard: () => void

  // Eraser
  eraseAtPoint: (point: Point, zoom: number) => void
  eraserSize: number
  setEraserSize: (size: number) => void
  eraserActive: boolean
  setEraserActive: (active: boolean) => void

  // Bulk
  loadState: (elements: WhiteboardElement[]) => void
  clearCanvas: () => void

  // Laser
  addLaserPoint: (point: Point) => void
  clearLaser: () => void
  _cancelLaserRaf: () => void

  // Presentation Mode
  togglePresentationMode: () => void
  setPresentationMode: (mode: boolean) => void
}

// ---- Smooth Camera Animation Helper ----

function animateCamera(
  get: () => WhiteboardStore,
  set: (partial: Partial<WhiteboardStore>) => void,
  target: Partial<Camera>,
  duration = 200
) {
  const startCam = { ...get().camera }
  const startTime = Date.now()
  const animate = () => {
    const elapsed = Date.now() - startTime
    const t = Math.min(elapsed / duration, 1)
    // Ease-out cubic
    const ease = 1 - Math.pow(1 - t, 3)
    const cam = {
      x: startCam.x + ((target.x ?? startCam.x) - startCam.x) * ease,
      y: startCam.y + ((target.y ?? startCam.y) - startCam.y) * ease,
      zoom: startCam.zoom + ((target.zoom ?? startCam.zoom) - startCam.zoom) * ease,
    }
    set({ camera: cam })
    if (t < 1) requestAnimationFrame(animate)
  }
  requestAnimationFrame(animate)
}

// ---- Create Store ----

export const useWhiteboardStore = create<WhiteboardStore>((set, get) => {
  function currentPageId() {
    const pages = get().pages
    return pages[get().currentPageIndex]?.id
  }

  return {
    // Initial State
    elements: [],
    camera: DEFAULT_CAMERA,
    tool: 'draw',
    selectedIds: [],
    style: { ...DEFAULT_STYLE },
    pages: [{ id: generateId(), name: 'Page 1', index: 0 }],
    currentPageIndex: 0,
    isDark: typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
    showGrid: true,
    gridSize: 20,
    gridType: 'dot',
    snapToGrid: false,
    isDrawing: false,
    isPanning: false,
    isResizing: false,
    spaceHeld: false,
    shiftHeld: false,
    shortcutsOpen: false,
    isPresentationMode: false,
    clipboard: [],
    currentPageName: 'Page 1',

    currentElement: null,
    drawingPoints: [],

    undoStack: [],
    redoStack: [],

    // ---- Tool & Style ----
    setTool: (tool) => set({ tool }),

    setStyle: (style) => set((s) => ({ style: { ...s.style, ...style } })),

    setCamera: (camera) =>
      set((s) => ({ camera: { ...s.camera, ...camera } })),

    zoomTo: (zoom) =>
      set((s) => ({ camera: { ...s.camera, zoom: Math.max(0.1, Math.min(5, zoom)) } })),

    zoomIn: () => {
      const target = { ...get().camera, zoom: Math.min(5, get().camera.zoom * 1.2) }
      animateCamera(get, set, target)
    },

    zoomOut: () => {
      const target = { ...get().camera, zoom: Math.max(0.1, get().camera.zoom / 1.2) }
      animateCamera(get, set, target)
    },

    zoomReset: () => animateCamera(get, set, { ...DEFAULT_CAMERA }),

    zoomToFit: () => {
      const elements = get().getCurrentPageElements()
      if (!elements.length) {
        animateCamera(get, set, { ...DEFAULT_CAMERA })
        return
      }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const el of elements) {
        const b = getElementBounds(el)
        if (b.x < minX) minX = b.x
        if (b.y < minY) minY = b.y
        if (b.x + b.width > maxX) maxX = b.x + b.width
        if (b.y + b.height > maxY) maxY = b.y + b.height
      }
      const padding = 60
      const contentW = maxX - minX + padding * 2
      const contentH = maxY - minY + padding * 2
      // Assume viewport is ~window size
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
      const vh = typeof window !== 'undefined' ? window.innerHeight - 44 : 800
      const zoom = Math.min(vw / contentW, vh / contentH, 2)
      animateCamera(get, set, {
        x: vw / 2 - (minX + (maxX - minX) / 2) * zoom,
        y: (vh / 2 + 22) - (minY + (maxY - minY) / 2) * zoom,
        zoom,
      })
    },

    panBy: (dx, dy) =>
      set((s) => ({ camera: { ...s.camera, x: s.camera.x + dx, y: s.camera.y + dy } })),

    setDark: (isDark) => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', isDark)
      }
      set({ isDark })
    },

    toggleDark: () => get().setDark(!get().isDark),

    toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
    toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
    setGridType: (type) => set({ gridType: type }),
    toggleShortcuts: () => set((s) => ({ shortcutsOpen: !s.shortcutsOpen })),
    setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
    togglePresentationMode: () => set((s) => ({ isPresentationMode: !s.isPresentationMode })),
    setPresentationMode: (mode) => set({ isPresentationMode: mode }),

    // ---- Elements ----
    addElement: (el) => set((s) => ({ elements: [...s.elements, el] })),

    updateElement: (id, updates) =>
      set((s) => ({
        elements: s.elements.map((el) =>
          el.id === id ? ({ ...el, ...updates } as WhiteboardElement) : el
        ),
      })),

    removeElements: (ids) => {
      const idSet = new Set(ids)
      set((s) => ({ elements: s.elements.filter((el) => !idSet.has(el.id)) }))
    },

    selectElements: (ids) => set({ selectedIds: ids }),
    clearSelection: () => set({ selectedIds: [] }),

    selectAll: () => {
      const elements = get().getCurrentPageElements()
      set({ selectedIds: elements.filter(e => !e.locked).map(e => e.id) })
    },

    duplicateSelected: () => {
      const { elements, selectedIds } = get()
      const selected = elements.filter((e) => selectedIds.includes(e.id))
      if (!selected.length) return
      const newIds: string[] = []
      const newElements = selected.map((el) => {
        const newEl = {
          ...el,
          id: generateId(),
          x: el.x + 20,
          y: el.y + 20,
        } as WhiteboardElement
        newIds.push(newEl.id)
        return newEl
      })
      get().pushHistory()
      set((s) => ({ elements: [...s.elements, ...newElements], selectedIds: newIds }))
    },

    bringToFront: (id) => {
      const el = get().elements.find((e) => e.id === id)
      if (!el) return
      get().pushHistory()
      set((s) => {
        const others = s.elements.filter((e) => e.id !== id)
        return { elements: [...others, el] }
      })
    },

    sendToBack: (id) => {
      const el = get().elements.find((e) => e.id === id)
      if (!el) return
      get().pushHistory()
      set((s) => {
        const others = s.elements.filter((e) => e.id !== id)
        return { elements: [el, ...others] }
      })
    },

    toggleLock: () => {
      const { elements, selectedIds } = get()
      const ids = selectedIds.length ? selectedIds : []
      if (!ids.length) return
      get().pushHistory()
      set({
        elements: elements.map((el) =>
          ids.includes(el.id) ? { ...el, locked: !el.locked } : el
        ),
      })
    },

    groupSelected: () => {
      const { elements, selectedIds } = get()
      if (selectedIds.length < 2) return
      get().pushHistory()
      const groupId = generateId()
      set({
        elements: elements.map((el) =>
          selectedIds.includes(el.id) ? { ...el, groupId } : el
        ),
      })
    },

    ungroupSelected: () => {
      const { elements, selectedIds } = get()
      if (!selectedIds.length) return
      get().pushHistory()
      set({
        elements: elements.map((el) =>
          selectedIds.includes(el.id) ? { ...el, groupId: undefined } : el
        ),
      })
    },

    moveSelected: (dx, dy) =>
      set((s) => ({
        elements: s.elements.map((el) =>
          s.selectedIds.includes(el.id) && !el.locked
            ? ({
                ...el,
                x: el.x + dx,
                y: el.y + dy,
                // For line/arrow, also move the end point
                ...(el.type === 'line' || el.type === 'arrow'
                  ? {
                      x2: (el as { x2: number }).x2 + dx,
                      y2: (el as { y2: number }).y2 + dy,
                    }
                  : {}),
              } as WhiteboardElement)
            : el
        ),
      })),

    resizeSelected: (newBounds) =>
      set((s) => ({
        elements: s.elements.map((el) =>
          s.selectedIds.includes(el.id) && !el.locked
            ? ({
                ...el,
                x: newBounds.x,
                y: newBounds.y,
                width: newBounds.width,
                height: newBounds.height,
              } as WhiteboardElement)
            : el
        ),
      })),

    // ---- Drawing ----
    startDrawing: (point) => {
      const { tool, style, pages, currentPageIndex } = get()
      const pageId = pages[currentPageIndex].id
      const id = generateId()

      const base = {
        id,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        rotation: 0,
        opacity: style.opacity,
        strokeColor: style.strokeColor,
        fillColor: style.fillColor,
        strokeWidth: style.strokeWidth,
        dash: style.dash,
        locked: false,
        pageIndex: currentPageIndex,
      }

      switch (tool) {
        case 'draw': {
          const el: WhiteboardElement = {
            ...base,
            type: 'freehand',
            points: [{ ...point, pressure: point.pressure || 0.5 }],
            x: point.x,
            y: point.y,
            width: 0,
            height: 0,
            isHighlighter: false,
          }
          set({ isDrawing: true, currentElement: el, drawingPoints: [{ ...point, pressure: point.pressure || 0.5 }] })
          break
        }
        case 'highlighter': {
          const el: WhiteboardElement = {
            ...base,
            type: 'freehand',
            points: [{ ...point, pressure: point.pressure || 0.5 }],
            x: point.x,
            y: point.y,
            width: 0,
            height: 0,
            isHighlighter: true,
          }
          set({ isDrawing: true, currentElement: el, drawingPoints: [{ ...point, pressure: point.pressure || 0.5 }] })
          break
        }
        case 'rectangle': {
          const el: WhiteboardElement = {
            ...base,
            type: 'rectangle',
            x: point.x,
            y: point.y,
          }
          set({ isDrawing: true, currentElement: el, drawingPoints: [] })
          break
        }
        case 'ellipse': {
          const el: WhiteboardElement = {
            ...base,
            type: 'ellipse',
            x: point.x,
            y: point.y,
          }
          set({ isDrawing: true, currentElement: el, drawingPoints: [] })
          break
        }
        case 'diamond': {
          const el: WhiteboardElement = {
            ...base,
            type: 'diamond',
            x: point.x,
            y: point.y,
          }
          set({ isDrawing: true, currentElement: el, drawingPoints: [] })
          break
        }
        case 'triangle': {
          const el: WhiteboardElement = {
            ...base,
            type: 'triangle',
            x: point.x,
            y: point.y,
          }
          set({ isDrawing: true, currentElement: el, drawingPoints: [] })
          break
        }
        case 'line': {
          const el: WhiteboardElement = {
            ...base,
            type: 'line',
            x: point.x,
            y: point.y,
            x2: point.x,
            y2: point.y,
          } as WhiteboardElement
          set({ isDrawing: true, currentElement: el, drawingPoints: [] })
          break
        }
        case 'arrow': {
          const el: WhiteboardElement = {
            ...base,
            type: 'arrow',
            x: point.x,
            y: point.y,
            x2: point.x,
            y2: point.y,
            arrowHead: 'arrow',
          } as WhiteboardElement
          set({ isDrawing: true, currentElement: el, drawingPoints: [] })
          break
        }
        case 'text': {
          const el: WhiteboardElement = {
            ...base,
            type: 'text',
            x: point.x,
            y: point.y,
            width: 200,
            height: 40,
            text: '',
            fontSize: style.fontSize || 20,
            fontFamily: style.fontFamily || 'inherit',
            textAlign: style.textAlign || 'left',
            fontWeight: style.fontWeight || 'normal',
            fontStyle: style.fontStyle || 'normal',
            autoSize: true,
          } as WhiteboardElement
          set({ isDrawing: true, currentElement: el, drawingPoints: [] })
          break
        }
        case 'sticky': {
          // Sticky notes are now handled directly in handlePointerDown — no drawing flow needed
          break
        }
        case 'frame': {
          const el: WhiteboardElement = {
            ...base,
            type: 'frame',
            x: point.x,
            y: point.y,
            width: 400,
            height: 300,
            name: `Frame ${get().elements.filter(e => e.type === 'frame').length + 1}`,
            fillColor: 'transparent',
            strokeColor: '#94a3b8',
            strokeWidth: 1,
            dash: [4, 4],
          } as WhiteboardElement
          set({
            isDrawing: false,
            currentElement: null,
            elements: [...get().elements, el],
          })
          break
        }
        default:
          break
      }
    },

    continueDrawing: (point) => {
      const { currentElement, tool, isDrawing } = get()
      if (!isDrawing || !currentElement) return

      switch (currentElement.type) {
        case 'freehand': {
          const pts = [...get().drawingPoints, { ...point, pressure: point.pressure || 0.5 }]
          set({
            currentElement: {
              ...currentElement,
              points: pts,
            },
            drawingPoints: pts,
          })
          break
        }
        case 'rectangle':
        case 'ellipse':
        case 'diamond':
        case 'triangle':
        case 'frame': {
          const rawDx = point.x - currentElement.x
          const rawDy = point.y - currentElement.y
          let w = Math.abs(rawDx)
          let h = Math.abs(rawDy)
          if (get().shiftHeld) {
            const side = Math.max(w, h)
            w = side
            h = side
          }
          const x = rawDx >= 0 ? currentElement.x : currentElement.x - w
          const y = rawDy >= 0 ? currentElement.y : currentElement.y - h
          set({
            currentElement: { ...currentElement, x, y, width: w, height: h },
          })
          break
        }
        case 'line':
        case 'arrow': {
          set({
            currentElement: {
              ...currentElement,
              x2: point.x,
              y2: point.y,
            } as WhiteboardElement,
          })
          break
        }
        default:
          break
      }
    },

    finishDrawing: (): WhiteboardElement | null => {
      const { currentElement, isDrawing } = get()
      if (!isDrawing || !currentElement) return null

      // Don't add empty elements
      let shouldAdd = true
      if (currentElement.type === 'freehand' && currentElement.points.length < 2) {
        shouldAdd = false
      }
      if (
        ['rectangle', 'ellipse', 'diamond', 'triangle'].includes(currentElement.type) &&
        currentElement.width < 2 &&
        currentElement.height < 2
      ) {
        shouldAdd = false
      }
      if (currentElement.type === 'line' || currentElement.type === 'arrow') {
        const dx = Math.abs((currentElement as { x2: number }).x2 - currentElement.x)
        const dy = Math.abs((currentElement as { y2: number }).y2 - currentElement.y)
        if (dx < 2 && dy < 2) shouldAdd = false
      }

      let addedElement: WhiteboardElement | null = null
      if (shouldAdd) {
        // For freehand, compute bounding box
        if (currentElement.type === 'freehand' && currentElement.points.length > 0) {
          // Apply Ramer-Douglas-Peucker simplification (P-03)
          const drawingPts = get().drawingPoints
          const simplifiedPoints = simplifyPoints(drawingPts)
          // Build a pressure lookup since RDP preserves original points
          const pressureMap = new Map<string, number>()
          for (const p of drawingPts) {
            pressureMap.set(`${p.x.toFixed(2)},${p.y.toFixed(2)}`, p.pressure || 0.5)
          }
          const pointsToUse = simplifiedPoints.map(p => ({
            ...p,
            pressure: pressureMap.get(`${p.x.toFixed(2)},${p.y.toFixed(2)}`) ?? 0.5
          }))

          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
          for (const p of pointsToUse) {
            if (p.x < minX) minX = p.x
            if (p.y < minY) minY = p.y
            if (p.x > maxX) maxX = p.x
            if (p.y > maxY) maxY = p.y
          }
          // Use visual stroke size for padding (highlighter renders at 16px)
          const pad = currentElement.isHighlighter ? 8 : currentElement.strokeWidth
          const finalEl = {
            ...currentElement,
            points: pointsToUse,
            x: minX - pad,
            y: minY - pad,
            width: maxX - minX + pad * 2,
            height: maxY - minY + pad * 2,
          }
          get().pushHistory()
          set((s) => ({
            elements: [...s.elements, finalEl],
          }))
          addedElement = finalEl
        } else {
          get().pushHistory()
          set((s) => ({
            elements: [...s.elements, currentElement],
          }))
          addedElement = currentElement
        }
      }

      set({ isDrawing: false, currentElement: null, drawingPoints: [] })
      return addedElement
    },

    setCurrentElement: (el) => set({ currentElement: el }),

    // ---- Pan ----
    startPanning: () => set({ isPanning: true }),
    stopPanning: () => set({ isPanning: false }),
    setSpaceHeld: (held) => set({ spaceHeld: held }),
    setShiftHeld: (held) => set({ shiftHeld: held }),

    // ---- History ----
    pushHistory: () => {
      const { elements, undoStack } = get()
      const entry: HistoryEntry = {
        elements: JSON.parse(JSON.stringify(elements)),
        timestamp: Date.now(),
      }
      // Cap total history memory to 20 entries (P-04)
      if (undoStack.length >= 20) {
        const trimmed = undoStack.slice(-19)
        const newStack = [...trimmed, entry]
        set({ undoStack: newStack, redoStack: [] })
        return
      }
      const newStack = [...undoStack, entry]
      set({ undoStack: newStack, redoStack: [] })
    },

    undo: () => {
      const { undoStack, elements, redoStack } = get()
      if (!undoStack.length) return
      const prev = undoStack[undoStack.length - 1]
      const currentEntry: HistoryEntry = {
        elements: JSON.parse(JSON.stringify(elements)),
        timestamp: Date.now(),
      }
      set({
        elements: prev.elements,
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, currentEntry],
        selectedIds: [],
      })
    },

    redo: () => {
      const { redoStack, elements, undoStack } = get()
      if (!redoStack.length) return
      const next = redoStack[redoStack.length - 1]
      const currentEntry: HistoryEntry = {
        elements: JSON.parse(JSON.stringify(elements)),
        timestamp: Date.now(),
      }
      set({
        elements: next.elements,
        redoStack: redoStack.slice(0, -1),
        undoStack: [...undoStack, currentEntry],
        selectedIds: [],
      })
    },

    // ---- Pages ----
    addPage: () => {
      const { pages } = get()
      const newPage: WhiteboardPage = {
        id: generateId(),
        name: `Page ${pages.length + 1}`,
        index: pages.length,
      }
      set({
        pages: [...pages, newPage],
        currentPageIndex: pages.length,
      })
    },

    deletePage: (index) => {
      const { pages, currentPageIndex, elements } = get()
      if (pages.length <= 1) return
      const newPages = pages.filter((_, i) => i !== index).map((p, i) => ({ ...p, index: i }))
      const newIndex = Math.min(currentPageIndex, newPages.length - 1)
      // Remove orphaned elements that belonged to the deleted page
      const deletedPageIndex = index
      const survivingElements = elements.filter((el) => el.pageIndex !== deletedPageIndex)
      // Re-index elements: elements on pages after the deleted one shift down by 1
      const reIndexedElements = survivingElements.map((el) =>
        el.pageIndex > deletedPageIndex ? { ...el, pageIndex: el.pageIndex - 1 } : el
      )
      set({
        pages: newPages,
        currentPageIndex: newIndex,
        elements: reIndexedElements,
        selectedIds: [],
      })
    },

    clearCurrentPage: () => {
      const { currentPageIndex, elements } = get()
      get().pushHistory()
      set({
        elements: elements.filter((el) => el.pageIndex !== currentPageIndex),
        selectedIds: [],
      })
    },

    switchPage: (index) => {
      const { pages } = get()
      if (index < 0 || index >= pages.length) return
      set({ currentPageIndex: index, selectedIds: [] })
    },

    renamePage: (index, name) =>
      set((s) => ({
        pages: s.pages.map((p, i) => (i === index ? { ...p, name } : p)),
      })),

    getCurrentPageElements: () => {
      const { elements, pages, currentPageIndex } = get()
      const pageId = pages[currentPageIndex]?.id
      return elements.filter((el) => el.pageIndex === currentPageIndex)
    },

    setPages: (newPages) => {
      // WhiteboardPage only has { id, name, index } — elements are global
      set({
        pages: newPages,
        currentPageIndex: 0,
        selectedIds: [],
        undoStack: [],
        redoStack: [],
      })
    },

    setCurrentPageIndex: (index) => {
      set({ currentPageIndex: index, selectedIds: [] })
    },

    // ---- Clipboard ----
    copySelected: () => {
      const { elements, selectedIds } = get()
      const selected = elements.filter((e) => selectedIds.includes(e.id))
      set({ clipboard: JSON.parse(JSON.stringify(selected)) })
    },

    cutSelected: () => {
      const { elements, selectedIds } = get()
      const selected = elements.filter((e) => selectedIds.includes(e.id))
      if (!selected.length) return
      get().pushHistory()
      set({
        clipboard: JSON.parse(JSON.stringify(selected)),
        elements: elements.filter((e) => !selectedIds.includes(e.id)),
        selectedIds: [],
      })
    },

    pasteClipboard: () => {
      const { clipboard } = get()
      if (!clipboard.length) return
      const newIds: string[] = []
      const newElements = clipboard.map((el) => {
        const newEl = {
          ...el,
          id: generateId(),
          x: el.x + 30,
          y: el.y + 30,
        }
        newIds.push(newEl.id)
        return newEl
      })
      get().pushHistory()
      set((s) => ({
        elements: [...s.elements, ...newElements],
        selectedIds: newIds,
      }))
    },

    // ---- Eraser ----
    eraserSize: 10,
    eraserActive: false,

    setEraserSize: (size) => set({ eraserSize: size }),

    setEraserActive: (active) => set({ eraserActive: active }),

    eraseAtPoint: (point, zoom) => {
      const eraserRadius = (get().eraserSize / 2) / zoom
      const { elements, currentPageIndex } = get()
      let changed = false
      const updatedElements: WhiteboardElement[] = []
      const removedIds: string[] = []

      for (const el of elements) {
        if (el.locked || el.pageIndex !== currentPageIndex) {
          updatedElements.push(el)
          continue
        }

        if (el.type === 'freehand') {
          // Split freehand: remove points near the eraser circle
          const remaining = splitFreehandAtPoint(el, point, eraserRadius)
          if (remaining.length === 0) {
            // Entire stroke erased
            removedIds.push(el.id)
            changed = true
          } else if (remaining.length === 1) {
            // Stroke modified but not split
            updatedElements.push(remaining[0])
            changed = true
          } else {
            // Stroke split into multiple segments
            for (const seg of remaining) {
              updatedElements.push(seg)
            }
            changed = true
          }
        } else {
          // For non-freehand elements, check actual hit
          const threshold = eraserRadius
          const b = getElementBounds(el)
          const inX = point.x >= b.x - threshold && point.x <= b.x + b.width + threshold
          const inY = point.y >= b.y - threshold && point.y <= b.y + b.height + threshold
          if (inX && inY) {
            removedIds.push(el.id)
            changed = true
          } else {
            updatedElements.push(el)
          }
        }
      }

      if (changed) {
        if (!get().eraserActive) {
          // First actual erase in this stroke — push history
          get().pushHistory()
          set({ eraserActive: true })
        }
        set({ elements: updatedElements })
        return true
      }
      return false
    },

    // ---- Bulk ----
    loadState: (elements) => set({ elements }),
    clearCanvas: () => {
      get().pushHistory()
      set({ elements: [] })
    },

    // ---- Laser ----
    addLaserPoint: (point) => {
      const { currentElement } = get()
      if (currentElement?.type === 'laser') {
        set({
          currentElement: {
            ...currentElement,
            points: [...currentElement.points, point],
          },
        })
      } else {
        const el: WhiteboardElement = {
          id: generateId(),
          type: 'laser',
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
          rotation: 0,
          opacity: 0.8,
          strokeColor: '#ef4444',
          fillColor: 'transparent',
          strokeWidth: 3,
          locked: false,
          pageIndex: get().currentPageIndex,
          points: [point],
        }
        set({ currentElement: el })
      }
    },
    clearLaser: () => {
      const { currentElement } = get()
      if (!currentElement) return
      // Cancel any in-flight laser fade rAF (P-10)
      if (laserRafId) {
        cancelAnimationFrame(laserRafId)
        laserRafId = 0
      }
      // Fade out by animating opacity
      const start = Date.now()
      const duration = 800
      const fade = () => {
        const elapsed = Date.now() - start
        const t = Math.min(elapsed / duration, 1)
        const opacity = 0.8 * (1 - t * t) // ease-out quadratic
        if (t >= 1) {
          laserRafId = 0
          set({ currentElement: null })
          return
        }
        const el = get().currentElement
        // Guard: only update if the laser element is still the same (P-10)
        if (el && el.type === 'laser') {
          set({ currentElement: { ...el, opacity } as WhiteboardElement })
          laserRafId = requestAnimationFrame(fade)
        } else {
          laserRafId = 0
        }
      }
      laserRafId = requestAnimationFrame(fade)
    },

    // Cancel laser animation on unmount / cleanup (P-10)
    _cancelLaserRaf: () => {
      if (laserRafId) {
        cancelAnimationFrame(laserRafId)
        laserRafId = 0
      }
    },
  }
})
