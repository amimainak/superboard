// ============================================================
// Superboard — Math Element Factory
// Creates math-specific whiteboard elements from tool ID + config
// ============================================================

import type {
  WhiteboardElement,
  ToolId,
  Point,
  FractionCircleElement,
  FractionBarElement,
  NumberLineElement,
  AngleElement,
  PolygonElement,
  CoordinatePlaneElement,
  VennElement,
  BarChartElement,
  PieChartElement,
} from './types'
import type { MathToolConfig } from './store'

function id() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

function base(pageIndex: number, x: number, y: number): Omit<WhiteboardElement, 'type'> {
  return {
    id: id(),
    x,
    y,
    width: 0,
    height: 0,
    rotation: 0,
    opacity: 1,
    strokeColor: '#1e293b',
    fillColor: 'transparent',
    strokeWidth: 2,
    locked: false,
    pageIndex,
  }
}

export function createMathElement(
  tool: ToolId,
  point: Point,
  config: MathToolConfig,
  pageIndex: number,
  isDark = false
): WhiteboardElement | null {
  const stroke = isDark ? '#e2e8f0' : '#1e293b'
  const b = { ...base(pageIndex, point.x, point.y), strokeColor: stroke }
  const divisions = config.divisions || 4
  const shaded = config.shaded || []

  switch (tool) {
    case 'math-fraction-circle': {
      const size = 180
      const label = shaded.length + '/' + divisions
      return {
        ...b,
        x: point.x - size / 2,
        y: point.y - size / 2,
        width: size,
        height: size,
        type: 'math-fraction-circle',
        divisions,
        shaded: [...shaded],
        label,
        strokeColor: '#1e293b',
        fillColor: 'transparent',
        strokeWidth: 2,
      } as FractionCircleElement
    }

    case 'math-fraction-bar': {
      const w = 240
      const h = 60
      const label = shaded.length + '/' + divisions
      return {
        ...b,
        x: point.x - w / 2,
        y: point.y - h / 2,
        width: w,
        height: h,
        type: 'math-fraction-bar',
        divisions,
        shaded: [...shaded],
        label,
        orientation: 'horizontal',
      } as FractionBarElement
    }

    case 'math-number-line': {
      const min = config.numberLineMin ?? 0
      const max = config.numberLineMax ?? 10
      const step = config.numberLineStep ?? 1
      const ticks: number[] = []
      const labels: string[] = []
      for (let v = min; v <= max; v = Math.round((v + step) * 1000) / 1000) {
        ticks.push(v)
        labels.push(Number.isInteger(v) ? v.toString() : v.toFixed(1))
      }
      return {
        ...b,
        x: point.x - 200,
        y: point.y - 40,
        width: 400,
        height: 80,
        type: 'math-number-line',
        min,
        max,
        step,
        ticks,
        labels,
        plottedPoints: [],
        strokeWidth: 2,
      } as NumberLineElement
    }

    case 'math-angle': {
      return {
        ...b,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        type: 'math-angle',
        x2: point.x + 120,
        y2: point.y,
        degrees: 0,
        showArc: true,
        showLabel: true,
        strokeWidth: 2,
      } as AngleElement
    }

    case 'math-polygon': {
      const sides = config.sides || 6
      const size = 120
      return {
        ...b,
        x: point.x - size,
        y: point.y - size,
        width: size * 2,
        height: size * 2,
        type: 'math-polygon',
        sides,
        showAngleMeasures: true,
        showSideLengths: false,
        strokeWidth: 2,
      } as PolygonElement
    }

    case 'math-coordinate-plane': {
      const xMin = config.coordXMin ?? -10
      const xMax = config.coordXMax ?? 10
      const yMin = config.coordYMin ?? -10
      const yMax = config.coordYMax ?? 10
      const step = config.coordStep ?? 1
      const equations = config.coordEquation ? [config.coordEquation] : []
      return {
        ...b,
        x: point.x - 200,
        y: point.y - 200,
        width: 400,
        height: 400,
        type: 'math-coordinate-plane',
        xMin, xMax, yMin, yMax, step,
        plottedPoints: [],
        equations,
        strokeWidth: 1.5,
      } as CoordinatePlaneElement
    }

    case 'math-venn': {
      const circles = config.vennCircles || 2
      return {
        ...b,
        x: point.x - 180,
        y: point.y - 120,
        width: circles === 2 ? 360 : 400,
        height: 240,
        type: 'math-venn',
        circles,
        shadedRegions: [],
        labels: [],
        setLabels: circles === 2
          ? ['A', 'B']
          : ['A', 'B', 'C'] as [string, string, string],
        strokeColor: '#3b82f6',
        strokeWidth: 2,
      } as VennElement
    }

    case 'math-bar-chart': {
      const categories = config.chartCategories || ['A', 'B', 'C', 'D']
      const values = config.chartValues || [3, 7, 5, 9]
      const colors = config.chartColors || ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444']
      return {
        ...b,
        x: point.x - 180,
        y: point.y - 140,
        width: 360,
        height: 280,
        type: 'math-bar-chart',
        title: config.chartTitle || '',
        categories,
        values,
        color: colors[0],
        strokeWidth: 1.5,
      } as BarChartElement
    }

    case 'math-pie-chart': {
      const slices = (
        config.chartCategories || ['A', 'B', 'C', 'D']
      ).map((label, i) => ({
        label,
        value: (config.chartValues || [3, 7, 5, 9])[i] || 1,
        color: (config.chartColors || ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'])[i] || '#94a3b8',
      }))
      return {
        ...b,
        x: point.x - 130,
        y: point.y - 130,
        width: 260,
        height: 260,
        type: 'math-pie-chart',
        title: config.chartTitle || '',
        slices,
        strokeWidth: 2,
      } as PieChartElement
    }

    default:
      return null
  }
}
