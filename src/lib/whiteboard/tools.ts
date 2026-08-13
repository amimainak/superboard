import {
  Canvas,
  Rect,
  Circle,
  Ellipse,
  Line,
  Textbox,
  FabricObject,
  Point,
  Polyline,
  Group,
  PencilBrush,
  FabricImage,
  TPointerEventInfo,
  Path,
  Triangle,
  Shadow,
} from 'fabric'
import { WhiteboardEngine } from './engine'

export type ToolId =
  | 'select'
  | 'hand'
  | 'draw'
  | 'highlighter'
  | 'eraser'
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'ellipse'
  | 'text'
  | 'note'
  | 'laser'
  | 'frame'

export interface ToolDefinition {
  id: ToolId
  label: string
  shortcut: string
  cursor: string
  onMouseDown?: (engine: WhiteboardEngine, opt: TPointerEventInfo, state: ToolState) => void
  onMouseMove?: (engine: WhiteboardEngine, opt: TPointerEventInfo, state: ToolState) => void
  onMouseUp?: (engine: WhiteboardEngine, opt: TPointerEventInfo, state: ToolState) => void
  onActivate?: (engine: WhiteboardEngine) => void
  onDeactivate?: (engine: WhiteboardEngine) => void
}

export interface ToolState {
  isDrawing: boolean
  startX: number
  startY: number
  currentObject: FabricObject | null
  tempObjects: FabricObject[]
}

export function createToolState(): ToolState {
  return {
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentObject: null,
    tempObjects: [],
  }
}

function getPointer(engine: WhiteboardEngine, e: MouseEvent | PointerEvent): { x: number; y: number } {
  const rect = engine.container.getBoundingClientRect()
 const zoom = engine.canvas.getZoom()
  const vpt = engine.canvas.viewportTransform
  return {
    x: (e.clientX - rect.left - vpt[4]) / zoom,
    y: (e.clientY - rect.top - vpt[5]) / zoom,
  }
}

// ─── Tool Definitions ───

const selectTool: ToolDefinition = {
  id: 'select',
  label: 'Select',
  shortcut: 'V',
  cursor: 'default',
  onActivate(engine) {
    engine.canvas.isDrawingMode = false
    engine.canvas.selection = true
    engine.canvas.defaultCursor = 'default'
    engine.canvas.hoverCursor = 'move'
    engine.canvas.forEachObject((obj) => {
      obj.set({ selectable: !obj.lockMovementX, evented: true })
    })
    engine.canvas.requestRenderAll()
  },
}

const handTool: ToolDefinition = {
  id: 'hand',
  label: 'Hand',
  shortcut: 'H',
  cursor: 'grab',
  onActivate(engine) {
    engine.canvas.isDrawingMode = false
    engine.canvas.selection = false
    engine.canvas.defaultCursor = 'grab'
    engine.canvas.hoverCursor = 'grab'
    engine.canvas.forEachObject((obj) => {
      obj.set({ selectable: false, evented: false })
    })
    engine.canvas.requestRenderAll()
  },
  onMouseDown(engine, opt, state) {
    const e = opt.e as MouseEvent
    state.isDrawing = true
    state.startX = e.clientX
    state.startY = e.clientY
    engine.canvas.setCursor('grabbing')
  },
  onMouseMove(engine, opt, state) {
    if (!state.isDrawing) return
    const e = opt.e as MouseEvent
    const dx = e.clientX - state.startX
    const dy = e.clientY - state.startY
    engine.canvas.relativePan(new Point(dx, dy))
    state.startX = e.clientX
    state.startY = e.clientY
    engine.renderGrid()
  },
  onMouseUp(engine, _opt, state) {
    state.isDrawing = false
    engine.canvas.setCursor('grab')
  },
  onDeactivate(engine) {
    engine.canvas.setCursor('default')
  },
}

const drawTool: ToolDefinition = {
  id: 'draw',
  label: 'Draw',
  shortcut: 'D',
  cursor: 'crosshair',
  onActivate(engine) {
    engine.canvas.isDrawingMode = true
    engine.canvas.selection = false
    engine.canvas.defaultCursor = 'crosshair'
    engine.canvas.hoverCursor = 'crosshair'
    const brush = new PencilBrush(engine.canvas)
    brush.width = 2
    brush.color = engine.darkMode ? '#e5e7eb' : '#1a1a2e'
    engine.canvas.freeDrawingBrush = brush
    engine.canvas.forEachObject((obj) => {
      obj.set({ selectable: false, evented: false })
    })
    engine.canvas.requestRenderAll()
  },
  onDeactivate(engine) {
    engine.canvas.isDrawingMode = false
  },
}

const highlighterTool: ToolDefinition = {
  id: 'highlighter',
  label: 'Highlighter',
  shortcut: 'Shift+D',
  cursor: 'crosshair',
  onActivate(engine) {
    engine.canvas.isDrawingMode = true
    engine.canvas.selection = false
    engine.canvas.defaultCursor = 'crosshair'
    engine.canvas.hoverCursor = 'crosshair'
    const brush = new PencilBrush(engine.canvas)
    brush.width = 24
    brush.color = 'rgba(250, 204, 21, 0.4)'
    engine.canvas.freeDrawingBrush = brush
    engine.canvas.forEachObject((obj) => {
      obj.set({ selectable: false, evented: false })
    })
    engine.canvas.requestRenderAll()
  },
  onDeactivate(engine) {
    engine.canvas.isDrawingMode = false
  },
}

const eraserTool: ToolDefinition = {
  id: 'eraser',
  label: 'Eraser',
  shortcut: 'E',
  cursor: 'pointer',
  onActivate(engine) {
    engine.canvas.isDrawingMode = false
    engine.canvas.selection = false
    engine.canvas.defaultCursor = 'pointer'
    engine.canvas.hoverCursor = 'pointer'
    engine.canvas.forEachObject((obj) => {
      obj.set({ selectable: false, evented: false })
    })
    engine.canvas.requestRenderAll()
  },
  onMouseDown(engine, opt) {
    const target = opt.target as FabricObject | undefined
    if (target && target.type !== 'laser-dot') {
      engine.canvas.remove(target)
      engine.canvas.requestRenderAll()
      engine.onObjectModified?.()
    }
  },
}

const lineTool: ToolDefinition = {
  id: 'line',
  label: 'Line',
  shortcut: 'L',
  cursor: 'crosshair',
  onActivate(engine) {
    engine.canvas.isDrawingMode = false
    engine.canvas.selection = false
    engine.canvas.defaultCursor = 'crosshair'
    engine.canvas.hoverCursor = 'crosshair'
    engine.canvas.forEachObject((obj) => {
      obj.set({ selectable: false, evented: false })
    })
    engine.canvas.requestRenderAll()
  },
  onMouseDown(engine, opt, state) {
    const e = opt.e as MouseEvent
    const pointer = getPointer(engine, e)
    state.isDrawing = true
    state.startX = pointer.x
    state.startY = pointer.y
    const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
      stroke: engine.darkMode ? '#e5e7eb' : '#1a1a2e',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    })
    engine.canvas.add(line)
    state.currentObject = line
  },
  onMouseMove(engine, opt, state) {
    if (!state.isDrawing || !state.currentObject) return
    const e = opt.e as MouseEvent
    const pointer = getPointer(engine, e)
    const line = state.currentObject as Line
    line.set({ x2: pointer.x, y2: pointer.y })
    engine.canvas.requestRenderAll()
  },
  onMouseUp(engine, _opt, state) {
    if (!state.currentObject) return
    state.currentObject.set({ selectable: true, evented: true })
    engine.canvas.setActiveObject(state.currentObject)
    state.isDrawing = false
    state.currentObject = null
    engine.canvas.requestRenderAll()
    engine.onObjectModified?.()
  },
}

const arrowTool: ToolDefinition = {
  id: 'arrow',
  label: 'Arrow',
  shortcut: 'A',
  cursor: 'crosshair',
  onActivate(engine) {
    engine.canvas.isDrawingMode = false
    engine.canvas.selection = false
    engine.canvas.defaultCursor = 'crosshair'
    engine.canvas.hoverCursor = 'crosshair'
    engine.canvas.forEachObject((obj) => {
      obj.set({ selectable: false, evented: false })
    })
    engine.canvas.requestRenderAll()
  },
  onMouseDown(engine, opt, state) {
    const e = opt.e as MouseEvent
    const pointer = getPointer(engine, e)
    state.isDrawing = true
    state.startX = pointer.x
    state.startY = pointer.y
    // Arrow = line + triangle head
    const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
      stroke: engine.darkMode ? '#e5e7eb' : '#1a1a2e',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    })
    engine.canvas.add(line)
    state.currentObject = line
  },
  onMouseMove(engine, opt, state) {
    if (!state.isDrawing || !state.currentObject) return
    const e = opt.e as MouseEvent
    const pointer = getPointer(engine, e)
    const line = state.currentObject as Line
    line.set({ x2: pointer.x, y2: pointer.y })

    // Remove old arrowhead
    state.tempObjects.forEach((obj) => engine.canvas.remove(obj))
    state.tempObjects = []

    // Calculate arrowhead
    const angle = Math.atan2(pointer.y - state.startY, pointer.x - state.startX)
    const headLen = 14
    const x1 = pointer.x - headLen * Math.cos(angle - Math.PI / 6)
    const y1 = pointer.y - headLen * Math.sin(angle - Math.PI / 6)
    const x2 = pointer.x - headLen * Math.cos(angle + Math.PI / 6)
    const y2 = pointer.y - headLen * Math.sin(angle + Math.PI / 6)

    const arrowHead = new Line([x1, y1, pointer.x, pointer.y, x2, y2], {
      stroke: engine.darkMode ? '#e5e7eb' : '#1a1a2e',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    })
    engine.canvas.add(arrowHead)
    state.tempObjects.push(arrowHead)
    engine.canvas.requestRenderAll()
  },
  onMouseUp(engine, _opt, state) {
    if (!state.currentObject) return
    // Group line + arrowhead
    const objects = [state.currentObject, ...state.tempObjects]
    const group = new Group(objects)
    engine.canvas.remove(...objects)
    group.set({
      selectable: true,
      evented: true,
    })
    engine.canvas.add(group)
    engine.canvas.setActiveObject(group)
    state.isDrawing = false
    state.currentObject = null
    state.tempObjects = []
    engine.canvas.requestRenderAll()
    engine.onObjectModified?.()
  },
}

const rectangleTool: ToolDefinition = {
  id: 'rectangle',
  label: 'Rectangle',
  shortcut: 'R',
  cursor: 'crosshair',
  onActivate(engine) {
    engine.canvas.isDrawingMode = false
    engine.canvas.selection = false
    engine.canvas.defaultCursor = 'crosshair'
    engine.canvas.hoverCursor = 'crosshair'
    engine.canvas.forEachObject((obj) => {
      obj.set({ selectable: false, evented: false })
    })
    engine.canvas.requestRenderAll()
  },
  onMouseDown(engine, opt, state) {
    const e = opt.e as MouseEvent
    const pointer = getPointer(engine, e)
    state.isDrawing = true
    state.startX = pointer.x
    state.startY = pointer.y
    const rect = new Rect({
      left: pointer.x,
      top: pointer.y,
      width: 0,
      height: 0,
      fill: 'transparent',
      stroke: engine.darkMode ? '#e5e7eb' : '#1a1a2e',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    })
    engine.canvas.add(rect)
    state.currentObject = rect
  },
  onMouseMove(engine, opt, state) {
    if (!state.isDrawing || !state.currentObject) return
    const e = opt.e as MouseEvent
    const pointer = getPointer(engine, e)
    const rect = state.currentObject as Rect
    const left = Math.min(state.startX, pointer.x)
    const top = Math.min(state.startY, pointer.y)
    const w = Math.abs(pointer.x - state.startX)
    const h = Math.abs(pointer.y - state.startY)
    rect.set({ left, top, width: w, height: h })
    engine.canvas.requestRenderAll()
  },
  onMouseUp(engine, _opt, state) {
    if (!state.currentObject) return
    state.currentObject.set({ selectable: true, evented: true })
    engine.canvas.setActiveObject(state.currentObject)
    state.isDrawing = false
    state.currentObject = null
    engine.canvas.requestRenderAll()
    engine.onObjectModified?.()
  },
}

const ellipseTool: ToolDefinition = {
  id: 'ellipse',
  label: 'Ellipse',
  shortcut: 'O',
  cursor: 'crosshair',
  onActivate(engine) {
    engine.canvas.isDrawingMode = false
    engine.canvas.selection = false
    engine.canvas.defaultCursor = 'crosshair'
    engine.canvas.hoverCursor = 'crosshair'
    engine.canvas.forEachObject((obj) => {
      obj.set({ selectable: false, evented: false })
    })
    engine.canvas.requestRenderAll()
  },
  onMouseDown(engine, opt, state) {
    const e = opt.e as MouseEvent
    const pointer = getPointer(engine, e)
    state.isDrawing = true
    state.startX = pointer.x
    state.startY = pointer.y
    const ellipse = new Ellipse({
      left: pointer.x,
      top: pointer.y,
      rx: 0,
      ry: 0,
      fill: 'transparent',
      stroke: engine.darkMode ? '#e5e7eb' : '#1a1a2e',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    })
    engine.canvas.add(ellipse)
    state.currentObject = ellipse
  },
  onMouseMove(engine, opt, state) {
    if (!state.isDrawing || !state.currentObject) return
    const e = opt.e as MouseEvent
    const pointer = getPointer(engine, e)
    const ellipse = state.currentObject as Ellipse
    const cx = (state.startX + pointer.x) / 2
    const cy = (state.startY + pointer.y) / 2
    const rx = Math.abs(pointer.x - state.startX) / 2
    const ry = Math.abs(pointer.y - state.startY) / 2
    ellipse.set({ left: cx, top: cy, rx, ry })
    engine.canvas.requestRenderAll()
  },
  onMouseUp(engine, _opt, state) {
    if (!state.currentObject) return
    state.currentObject.set({ selectable: true, evented: true })
    engine.canvas.setActiveObject(state.currentObject)
    state.isDrawing = false
    state.currentObject = null
    engine.canvas.requestRenderAll()
    engine.onObjectModified?.()
  },
}

const textTool: ToolDefinition = {
  id: 'text',
  label: 'Text',
  shortcut: 'T',
  cursor: 'text',
  onActivate(engine) {
    engine.canvas.isDrawingMode = false
    engine.canvas.selection = false
    engine.canvas.defaultCursor = 'text'
    engine.canvas.hoverCursor = 'text'
    engine.canvas.forEachObject((obj) => {
      obj.set({ selectable: false, evented: false })
    })
    engine.canvas.requestRenderAll()
  },
  onMouseDown(engine, opt) {
    const e = opt.e as MouseEvent
    const pointer = getPointer(engine, e)
    const text = new Textbox('Type here', {
      left: pointer.x,
      top: pointer.y,
      fontSize: 20,
      fill: engine.darkMode ? '#e5e7eb' : '#1a1a2e',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      width: 200,
      selectable: true,
      evented: true,
    })
    engine.canvas.add(text)
    engine.canvas.setActiveObject(text)
    engine.canvas.requestRenderAll()
    // Enter editing mode
    text.enterEditing()
    text.selectAll()
    engine.onObjectModified?.()
  },
}

const noteTool: ToolDefinition = {
  id: 'note',
  label: 'Note',
  shortcut: 'N',
  cursor: 'crosshair',
  onActivate(engine) {
    engine.canvas.isDrawingMode = false
    engine.canvas.selection = false
    engine.canvas.defaultCursor = 'crosshair'
    engine.canvas.hoverCursor = 'crosshair'
    engine.canvas.forEachObject((obj) => {
      obj.set({ selectable: false, evented: false })
    })
    engine.canvas.requestRenderAll()
  },
  onMouseDown(engine, opt) {
    const e = opt.e as MouseEvent
    const pointer = getPointer(engine, e)
    const noteWidth = 180
    const noteHeight = 140

    const bg = new Rect({
      left: pointer.x,
      top: pointer.y,
      width: noteWidth,
      height: noteHeight,
      fill: '#fef08a',
      stroke: '#eab308',
      strokeWidth: 1,
      rx: 4,
      ry: 4,
      selectable: true,
      evented: true,
      shadow: new Shadow({
        color: 'rgba(0,0,0,0.1)',
        blur: 8,
        offsetX: 2,
        offsetY: 2,
      }),
    })

    const text = new Textbox('Note', {
      left: pointer.x + 8,
      top: pointer.y + 8,
      width: noteWidth - 16,
      fontSize: 14,
      fill: '#713f12',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      selectable: true,
      evented: true,
    })

    engine.canvas.add(bg)
    engine.canvas.add(text)
    const group = new Group([bg, text])
    engine.canvas.remove(bg, text)
    group.set({
      left: pointer.x,
      top: pointer.y,
      selectable: true,
      evented: true,
    })
    engine.canvas.add(group)
    engine.canvas.setActiveObject(group)
    engine.canvas.requestRenderAll()
    engine.onObjectModified?.()
  },
}

const laserTool: ToolDefinition = {
  id: 'laser',
  label: 'Laser',
  shortcut: 'K',
  cursor: 'none',
  onActivate(engine) {
    engine.canvas.isDrawingMode = false
    engine.canvas.selection = false
    engine.canvas.defaultCursor = 'none'
    engine.canvas.hoverCursor = 'none'
    engine.canvas.forEachObject((obj) => {
      obj.set({ selectable: false, evented: false })
    })
    engine.canvas.requestRenderAll()
  },
  onMouseMove(engine, opt) {
    const e = opt.e as MouseEvent
    const pointer = getPointer(engine, e)
    engine.showLaser(pointer.x, pointer.y)
  },
}

const frameTool: ToolDefinition = {
  id: 'frame',
  label: 'Frame',
  shortcut: 'F',
  cursor: 'crosshair',
  onActivate(engine) {
    engine.canvas.isDrawingMode = false
    engine.canvas.selection = false
    engine.canvas.defaultCursor = 'crosshair'
    engine.canvas.hoverCursor = 'crosshair'
    engine.canvas.forEachObject((obj) => {
      obj.set({ selectable: false, evented: false })
    })
    engine.canvas.requestRenderAll()
  },
  onMouseDown(engine, opt, state) {
    const e = opt.e as MouseEvent
    const pointer = getPointer(engine, e)
    state.isDrawing = true
    state.startX = pointer.x
    state.startY = pointer.y
    const rect = new Rect({
      left: pointer.x,
      top: pointer.y,
      width: 0,
      height: 0,
      fill: 'transparent',
      stroke: '#059669',
      strokeWidth: 2,
      strokeDashArray: [8, 4],
      selectable: false,
      evented: false,
    })
    engine.canvas.add(rect)
    state.currentObject = rect
  },
  onMouseMove(engine, opt, state) {
    if (!state.isDrawing || !state.currentObject) return
    const e = opt.e as MouseEvent
    const pointer = getPointer(engine, e)
    const rect = state.currentObject as Rect
    const left = Math.min(state.startX, pointer.x)
    const top = Math.min(state.startY, pointer.y)
    const w = Math.abs(pointer.x - state.startX)
    const h = Math.abs(pointer.y - state.startY)
    rect.set({ left, top, width: w, height: h })
    engine.canvas.requestRenderAll()
  },
  onMouseUp(engine, _opt, state) {
    if (!state.currentObject) return
    const rect = state.currentObject as Rect
    const label = new Textbox('Frame', {
      left: rect.left + 8,
      top: rect.top + 4,
      fontSize: 12,
      fill: '#059669',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      selectable: false,
      evented: false,
    })
    engine.canvas.add(label)
    const group = new Group([rect, label])
    engine.canvas.remove(rect, label)
    group.set({ selectable: true, evented: true })
    engine.canvas.add(group)
    engine.canvas.setActiveObject(group)
    state.isDrawing = false
    state.currentObject = null
    engine.canvas.requestRenderAll()
    engine.onObjectModified?.()
  },
}

// ─── Tool Registry ───

export const tools: Record<ToolId, ToolDefinition> = {
  select: selectTool,
  hand: handTool,
  draw: drawTool,
  highlighter: highlighterTool,
  eraser: eraserTool,
  line: lineTool,
  arrow: arrowTool,
  rectangle: rectangleTool,
  ellipse: ellipseTool,
  text: textTool,
  note: noteTool,
  laser: laserTool,
  frame: frameTool,
}

export const toolList: ToolDefinition[] = [
  tools.select,
  tools.hand,
  tools.draw,
  tools.highlighter,
  tools.eraser,
  tools.line,
  tools.arrow,
  tools.rectangle,
  tools.ellipse,
  tools.text,
  tools.note,
  tools.laser,
  tools.frame,
]

export class ToolManager {
  engine: WhiteboardEngine
  currentTool: ToolId = 'select'
  state: ToolState = createToolState()

  private mouseDownHandler: ((opt: TPointerEventInfo) => void) | null = null
  private mouseMoveHandler: ((opt: TPointerEventInfo) => void) | null = null
  private mouseUpHandler: ((opt: TPointerEventInfo) => void) | null = null

  constructor(engine: WhiteboardEngine) {
    this.engine = engine
  }

  setTool(toolId: ToolId) {
    const prevTool = tools[this.currentTool]
    prevTool.onDeactivate?.(this.engine)

    this.currentTool = toolId
    this.state = createToolState()

    const tool = tools[toolId]
    tool.onActivate?.(this.engine)

    // Re-bind mouse events for non-select tools
    this.unbindEvents()
    if (toolId !== 'select') {
      this.bindEvents(tool)
    } else {
      // Re-enable selection
      this.engine.canvas.forEachObject((obj) => {
        obj.set({ selectable: !obj.lockMovementX, evented: true })
      })
      this.engine.canvas.requestRenderAll()
    }
  }

  private bindEvents(tool: ToolDefinition) {
    const canvas = this.engine.canvas

    this.mouseDownHandler = (opt: TPointerEventInfo) => {
      // Don't interfere with spacebar panning
      const e = opt.e as MouseEvent
      if (e.button === 1 || this.engine.spacePressed) return
      tool.onMouseDown?.(this.engine, opt, this.state)
    }

    this.mouseMoveHandler = (opt: TPointerEventInfo) => {
      tool.onMouseMove?.(this.engine, opt, this.state)
    }

    this.mouseUpHandler = (opt: TPointerEventInfo) => {
      tool.onMouseUp?.(this.engine, opt, this.state)
    }

    canvas.on('mouse:down', this.mouseDownHandler)
    canvas.on('mouse:move', this.mouseMoveHandler)
    canvas.on('mouse:up', this.mouseUpHandler)
  }

  private unbindEvents() {
    const canvas = this.engine.canvas
    if (this.mouseDownHandler) {
      canvas.off('mouse:down', this.mouseDownHandler)
      this.mouseDownHandler = null
    }
    if (this.mouseMoveHandler) {
      canvas.off('mouse:move', this.mouseMoveHandler)
      this.mouseMoveHandler = null
    }
    if (this.mouseUpHandler) {
      canvas.off('mouse:up', this.mouseUpHandler)
      this.mouseUpHandler = null
    }
  }

  dispose() {
    this.unbindEvents()
  }
}
