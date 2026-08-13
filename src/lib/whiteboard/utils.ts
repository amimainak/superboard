// ============================================================
// Superboard — Utility Functions
// SVG path from perfect-freehand, geometry, bounds, transforms
// ============================================================

import getStroke from 'perfect-freehand'
import type { Point, WhiteboardElement } from './types'

// ---- perfect-freehand SVG Path Conversion ----

/** Default options for drawing strokes */
export const DEFAULT_DRAW_OPTIONS = {
  size: 4,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  start: { taper: true, cap: true } as const,
  end: { taper: true, cap: true } as const,
}

/** Default options for highlighter strokes */
export const HIGHLIGHT_OPTIONS = {
  size: 20,
  thinning: 0,
  smoothing: 0.5,
  streamline: 0.5,
  start: { cap: true } as const,
  end: { cap: true } as const,
}

/** Convert perfect-freehand outline points to an SVG path `d` attribute */
export function getSvgPathFromStroke(stroke: Point[]): string {
  if (!stroke.length) return ''
  const d = stroke.reduce(
    (acc, point, i, arr) => {
      if (i === 0) {
        const next = arr[1]
        const mid = { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 }
        return `M ${point.x},${point.y} Q ${point.x},${point.y} ${mid.x},${mid.y}`
      }
      if (i === arr.length - 1) {
        return `${acc} T ${point.x},${point.y}`
      }
      const prev = arr[i - 1]
      const next = arr[i + 1]
      const mid = { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 }
      return `${acc} Q ${point.x},${point.y} ${mid.x},${mid.y}`
    },
    ''
  )
  return d
}

/** Generate smooth freehand SVG path from raw input points */
export function getFreehandPath(
  points: Point[],
  options: Record<string, unknown> = {}
): string {
  const stroke = getStroke(points, { ...DEFAULT_DRAW_OPTIONS, ...options } as Parameters<typeof getStroke>[1])
  return getSvgPathFromStroke(stroke as unknown as Point[])
}

// ---- Geometry Utilities ----

/** Distance between two points */
export function dist(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

/** Angle from point a to point b (radians) */
export function angle(a: Point, b: Point): number {
  return Math.atan2(b.y - a.y, b.x - a.x)
}

/** Midpoint between two points */
export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/** Rotate a point around an origin by angle (radians) */
export function rotatePoint(point: Point, origin: Point, angleRad: number): Point {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  const dx = point.x - origin.x
  const dy = point.y - origin.y
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  }
}

/** Normalize an angle to [-PI, PI] */
export function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI
  while (a < -Math.PI) a += 2 * Math.PI
  return a
}

// ---- Bounds ----

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/** Get axis-aligned bounding box of an element */
export function getElementBounds(el: WhiteboardElement): Bounds {
  switch (el.type) {
    case 'freehand':
    case 'laser': {
      if (!el.points.length) return { x: el.x, y: el.y, width: 0, height: 0 }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const p of el.points) {
        if (p.x < minX) minX = p.x
        if (p.y < minY) minY = p.y
        if (p.x > maxX) maxX = p.x
        if (p.y > maxY) maxY = p.y
      }
      const pad = el.strokeWidth
      return {
        x: minX - pad,
        y: minY - pad,
        width: maxX - minX + pad * 2,
        height: maxY - minY + pad * 2,
      }
    }
    case 'line':
    case 'arrow': {
      const x = Math.min(el.x, el.x2) - el.strokeWidth
      const y = Math.min(el.y, el.y2) - el.strokeWidth
      return {
        x,
        y,
        width: Math.abs(el.x2 - el.x) + el.strokeWidth * 2,
        height: Math.abs(el.y2 - el.y) + el.strokeWidth * 2,
      }
    }
    default: {
      return { x: el.x, y: el.y, width: el.width, height: el.height }
    }
  }
}

/** Check if a point is inside an element's bounds */
export function isPointInBounds(point: Point, bounds: Bounds, padding = 0): boolean {
  return (
    point.x >= bounds.x - padding &&
    point.x <= bounds.x + bounds.width + padding &&
    point.y >= bounds.y - padding &&
    point.y <= bounds.y + bounds.height + padding
  )
}

/** Get center of bounds */
export function getBoundsCenter(bounds: Bounds): Point {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  }
}

// ---- Coordinate Transforms ----

/** Convert screen coordinates to canvas coordinates */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  camera: { x: number; y: number; zoom: number },
  containerRect: DOMRect
): Point {
  return {
    x: (screenX - containerRect.left - camera.x) / camera.zoom,
    y: (screenY - containerRect.top - camera.y) / camera.zoom,
  }
}

/** Convert canvas coordinates to screen coordinates */
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  camera: { x: number; y: number; zoom: number },
  containerRect: DOMRect
): Point {
  return {
    x: canvasX * camera.zoom + camera.x + containerRect.left,
    y: canvasY * camera.zoom + camera.y + containerRect.top,
  }
}

// ---- Hit Testing ----

/** Check if a point is near a line segment */
export function isPointNearLine(
  point: Point,
  lineStart: Point,
  lineEnd: Point,
  threshold: number
): boolean {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return dist(point, lineStart) <= threshold

  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))

  const proj = { x: lineStart.x + t * dx, y: lineStart.y + t * dy }
  return dist(point, proj) <= threshold
}

/** Check if a point is near a freehand path */
export function isPointNearFreehand(
  point: Point,
  points: Point[],
  threshold: number
): boolean {
  if (points.length < 2) return dist(point, points[0] || point) <= threshold
  for (let i = 1; i < points.length; i++) {
    if (isPointNearLine(point, points[i - 1], points[i], threshold)) return true
  }
  return false
}

/** Check if a point is inside an element (for selection) */
export function hitTestElement(
  point: Point,
  el: WhiteboardElement,
  cameraZoom: number
): boolean {
  const threshold = 8 / cameraZoom // 8px on screen

  switch (el.type) {
    case 'freehand':
    case 'laser':
      return isPointNearFreehand(point, el.points, threshold)
    case 'line':
    case 'arrow':
      return isPointNearLine(point, { x: el.x, y: el.y }, { x: el.x2, y: el.y2 }, threshold)
    case 'rectangle':
    case 'diamond':
    case 'triangle':
    case 'sticky':
    case 'frame':
    case 'image': {
      const b = getElementBounds(el)
      return isPointInBounds(point, b, threshold)
    }
    case 'ellipse': {
      const cx = el.x + el.width / 2
      const cy = el.y + el.height / 2
      const rx = el.width / 2 + threshold
      const ry = el.height / 2 + threshold
      const dx = point.x - cx
      const dy = point.y - cy
      return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1
    }
    case 'text': {
      const b = getElementBounds(el)
      return isPointInBounds(point, b, threshold)
    }
    default:
      return false
  }
}

// ---- SVG Shape Paths ----

/** SVG path for diamond shape */
export function diamondPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2
  const cy = y + h / 2
  return `M ${cx} ${y} L ${x + w} ${cy} L ${cx} ${y + h} L ${x} ${cy} Z`
}

/** SVG path for triangle shape */
export function trianglePath(x: number, y: number, w: number, h: number): string {
  return `M ${x + w / 2} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`
}

/** SVG path for arrowhead at a point */
export function arrowHeadPath(
  from: Point,
  to: Point,
  size: number = 12
): string {
  const a = angle(from, to)
  const p1 = { x: to.x, y: to.y }
  const p2 = rotatePoint(
    { x: to.x - size, y: to.y },
    to,
    a + Math.PI / 6
  )
  const p3 = rotatePoint(
    { x: to.x - size, y: to.y },
    to,
    a - Math.PI / 6
  )
  return `M ${p1.x},${p1.y} L ${p2.x},${p2.y} L ${p3.x},${p3.y} Z`
}

// ---- UUID ----

let idCounter = 0
export function generateId(): string {
  return `${Date.now().toString(36)}-${(idCounter++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// ---- Pressure Simulation ----

/** Simulate pressure from speed for mouse input (no real pressure) */
export function simulatePressure(points: Point[]): Point[] {
  if (points.length < 3) return points.map(p => ({ ...p, pressure: 0.5 }))

  return points.map((p, i) => {
    if (i === 0 || i === points.length - 1) return { ...p, pressure: 0.2 }
    const prev = points[i - 1]
    const d = dist(p, prev)
    // Fast movement = thin, slow = thick
    const speed = Math.min(d / 10, 1)
    const pressure = 0.3 + (1 - speed) * 0.7
    return { ...p, pressure }
  })
}

// ---- Color Utilities ----

/** Convert hex color to rgba string */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
