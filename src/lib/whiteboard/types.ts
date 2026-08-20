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
  textAlign?: 'left' | 'center' | 'right'
  fontWeight?: string
  fontStyle?: string
}

/** Tool identifiers */
export type ToolId =
  | 'select'
  | 'hand'
  | 'draw'
  | 'highlighter'
  | 'eraser'
  | 'eraser-object'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'triangle'
  | 'line'
  | 'arrow'
  | 'text'
  | 'sticky'
  | 'image'
  | 'pdf'
  | 'frame'
  | 'laser'
  // Math toolkit canvas tools
  | 'math-fraction-circle'
  | 'math-fraction-bar'
  | 'math-number-line'
  | 'math-angle'
  | 'math-polygon'
  | 'math-coordinate-plane'
  | 'math-venn'
  | 'math-measure'
  | 'math-ruler'
  | 'math-protractor'
  | 'math-bar-chart'
  | 'math-pie-chart'
  | 'math-place-value'
  | 'math-clock'
  | 'math-base-10'
  | 'math-multiplication-array'

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
  fontWeight?: string
  fontStyle?: string
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

export interface PdfBackgroundElement extends BaseElement {
  type: 'pdf'
  pdfDataUrl: string // rendered page as data URL (image)
  pageNumber: number // 1-based page number from the PDF
  naturalWidth: number // original PDF page width in pts
  naturalHeight: number // original PDF page height in pts
}

export interface FrameElement extends BaseElement {
  type: 'frame'
  name: string
}

export interface LaserElement extends BaseElement {
  type: 'laser'
  points: Point[]
}

// ---- Math Element Types ----

export interface FractionCircleElement extends BaseElement {
  type: 'math-fraction-circle'
  divisions: number
  shaded: number[]
  label: string
}

export interface FractionBarElement extends BaseElement {
  type: 'math-fraction-bar'
  divisions: number
  shaded: number[]
  label: string
  orientation: 'horizontal' | 'vertical'
}

export interface NumberLineElement extends BaseElement {
  type: 'math-number-line'
  min: number
  max: number
  step: number
  ticks: number[]
  labels: string[]
  plottedPoints: Array<{ value: number; label?: string; above: boolean }>
}

export interface AngleElement extends BaseElement {
  type: 'math-angle'
  x2: number
  y2: number
  degrees: number
  showArc: boolean
  showLabel: boolean
}

export interface PolygonElement extends BaseElement {
  type: 'math-polygon'
  sides: number
  showAngleMeasures: boolean
  showSideLengths: boolean
}

export interface CoordinatePlaneElement extends BaseElement {
  type: 'math-coordinate-plane'
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  step: number
  plottedPoints: Array<{ x: number; y: number; label?: string }>
  equations?: string[]
}

export interface VennElement extends BaseElement {
  type: 'math-venn'
  circles: 2 | 3
  shadedRegions: number[]
  labels: string[]
  setLabels: [string, string] | [string, string, string]
}

export interface MeasureElement extends BaseElement {
  type: 'math-measure'
  measureType: 'length' | 'angle' | 'area'
  x2: number
  y2: number
  value: number
  unit: string
}

export interface BarChartElement extends BaseElement {
  type: 'math-bar-chart'
  title: string
  categories: string[]
  values: number[]
  color: string
}

export interface PieChartElement extends BaseElement {
  type: 'math-pie-chart'
  title: string
  slices: Array<{ label: string; value: number; color: string }>
}

// ---- On-Canvas Interactive Widget Element ----

export interface WidgetElement extends BaseElement {
  type: 'widget'
  widgetKind: string // e.g. 'stat-data-table', 'stat-histogram', 'stat-scatter', 'stat-box-plot', 'stat-normal-dist', 'stat-probability'
  config: Record<string, unknown> // widget-specific live state (data, settings, etc.)
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
  | PdfBackgroundElement
  | FrameElement
  | LaserElement
  | FractionCircleElement
  | FractionBarElement
  | NumberLineElement
  | AngleElement
  | PolygonElement
  | CoordinatePlaneElement
  | VennElement
  | MeasureElement
  | BarChartElement
  | PieChartElement
  | WidgetElement

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
  pageIndex: number // which page this snapshot belongs to
}
