// ============================================================
// Superboard — Custom Whiteboard Element Types
// MIT License · SVG + perfect-freehand architecture
// ============================================================

/** 2D point with optional pressure for stylus input */
export interface Point {
  x: number
  y: number
  pressure?: number
}

/** Camera state for infinite canvas pan/zoom */
export interface Camera {
  x: number
  y: number
  zoom: number
}

/** Style properties shared by most elements */
export interface ElementStyle {
  strokeColor: string
  fillColor: string
  strokeWidth: number
  opacity: number
  dash?: number[] // e.g. [8, 4] for dashed
  fontSize?: number
  fontFamily?: string
}

/** Tool identifiers */
export type ToolId =
  | 'select'
  | 'hand'
  | 'draw'
  | 'highlighter'
  | 'eraser'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'triangle'
  | 'line'
  | 'arrow'
  | 'text'
  | 'sticky'
  | 'image'
  | 'frame'
  | 'laser'

// ---- Element Types ----

interface BaseElement {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  strokeColor: string
  fillColor: string
  strokeWidth: number
  dash?: number[]
  locked: boolean
  groupId?: string
  pageIndex: number
  name?: string
}

export interface FreehandElement extends BaseElement {
  type: 'freehand'
  points: Point[]
  isHighlighter?: boolean
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle'
}

export interface EllipseElement extends BaseElement {
  type: 'ellipse'
}

export interface LineElement extends BaseElement {
  type: 'line'
  x2: number
  y2: number
}

export interface ArrowElement extends BaseElement {
  type: 'arrow'
  x2: number
  y2: number
  arrowHead: 'arrow' | 'none' | 'both'
}

export interface DiamondElement extends BaseElement {
  type: 'diamond'
}

export interface TriangleElement extends BaseElement {
  type: 'triangle'
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  textAlign: 'left' | 'center' | 'right'
  autoSize: boolean
}

export interface StickyElement extends BaseElement {
  type: 'sticky'
  text: string
  fontSize: number
  noteColor: string
}

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string // data URL or blob URL
  naturalWidth: number
  naturalHeight: number
}

export interface FrameElement extends BaseElement {
  type: 'frame'
  name: string
}

export interface LaserElement extends BaseElement {
  type: 'laser'
  points: Point[]
}

export type WhiteboardElement =
  | FreehandElement
  | RectangleElement
  | EllipseElement
  | LineElement
  | ArrowElement
  | DiamondElement
  | TriangleElement
  | TextElement
  | StickyElement
  | ImageElement
  | FrameElement
  | LaserElement

/** A page in the whiteboard */
export interface WhiteboardPage {
  id: string
  name: string
  index: number
}

/** History entry for undo/redo */
export interface HistoryEntry {
  elements: WhiteboardElement[]
  timestamp: number
}
