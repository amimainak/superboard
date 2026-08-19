// ============================================================
// Superboard — Math Element SVG Renderers
// Renders all math-specific element types
// ============================================================

'use client'

import React, { useState, useCallback } from 'react'
import type {
  WhiteboardElement,
  FractionCircleElement,
  FractionBarElement,
  NumberLineElement,
  AngleElement,
  PolygonElement,
  CoordinatePlaneElement,
  VennElement,
  BarChartElement,
  PieChartElement,
} from '@/lib/whiteboard/types'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

const FILL_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

interface Props {
  element: WhiteboardElement
  isSelected: boolean
}

export function MathElementRenderers({ element, isSelected }: Props) {
  const updateElement = useWhiteboardStore((s) => s.updateElement)

  switch (element.type) {
    case 'math-fraction-circle':
      return <FractionCircleSvg el={element} updateElement={updateElement} isSelected={isSelected} />
    case 'math-fraction-bar':
      return <FractionBarSvg el={element} updateElement={updateElement} isSelected={isSelected} />
    case 'math-number-line':
      return <NumberLineSvg el={element} updateElement={updateElement} isSelected={isSelected} />
    case 'math-angle':
      return <AngleSvg el={element} updateElement={updateElement} isSelected={isSelected} />
    case 'math-polygon':
      return <PolygonSvg el={element} updateElement={updateElement} isSelected={isSelected} />
    case 'math-coordinate-plane':
      return <CoordinatePlaneSvg el={element} updateElement={updateElement} isSelected={isSelected} />
    case 'math-venn':
      return <VennSvg el={element} updateElement={updateElement} isSelected={isSelected} />
    case 'math-bar-chart':
      return <BarChartSvg el={element} updateElement={updateElement} isSelected={isSelected} />
    case 'math-pie-chart':
      return <PieChartSvg el={element} updateElement={updateElement} isSelected={isSelected} />
    default:
      return null
  }
}

// ---- Fraction Circle ----

function FractionCircleSvg({ el, updateElement, isSelected }: {
  el: FractionCircleElement
  updateElement: (id: string, u: Partial<WhiteboardElement>) => void
  isSelected: boolean
}) {
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2
  const r = Math.min(el.width, el.height) / 2 - 4
  const { divisions, shaded, label } = el

  const toggleSlice = (index: number) => {
    if (el.locked) return
    const newShaded = shaded.includes(index)
      ? shaded.filter((s) => s !== index)
      : [...shaded, index]
    updateElement(el.id, {
      shaded: newShaded,
      label: newShaded.length + '/' + divisions,
    } as Partial<FractionCircleElement>)
  }

  const sliceAngle = (2 * Math.PI) / divisions
  // Start from top (-PI/2)
  const startOffset = -Math.PI / 2

  return (
    <g>
      {/* Selection outline */}
      {isSelected && (
        <rect x={el.x - 2} y={el.y - 2} width={el.width + 4} height={el.height + 4}
          fill="none" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 2" rx={4} />
      )}
      {/* Slices */}
      {Array.from({ length: divisions }, (_, i) => {
        const a1 = startOffset + i * sliceAngle
        const a2 = startOffset + (i + 1) * sliceAngle
        const x1 = cx + r * Math.cos(a1)
        const y1 = cy + r * Math.sin(a1)
        const x2 = cx + r * Math.cos(a2)
        const y2 = cy + r * Math.sin(a2)
        const largeArc = sliceAngle > Math.PI ? 1 : 0
        const isShaded = shaded.includes(i)
        const d = 'M ' + cx + ',' + cy + ' L ' + x1 + ',' + y1 + ' A ' + r + ',' + r + ' 0 ' + largeArc + ',1 ' + x2 + ',' + y2 + ' Z'
        return (
          <path
            key={i}
            d={d}
            fill={isShaded ? FILL_COLORS[i % FILL_COLORS.length] : 'transparent'}
            fillOpacity={isShaded ? 0.6 : 0}
            stroke={el.strokeColor}
            strokeWidth={el.strokeWidth}
            style={{ cursor: el.locked ? 'not-allowed' : 'pointer' }}
            onClick={(e) => { e.stopPropagation(); toggleSlice(i) }}
            onPointerDown={(e) => e.stopPropagation()}
          />
        )
      })}
      {/* Label */}
      {label && (
        <text x={cx} y={el.y + el.height + 20} textAnchor="middle"
          fontSize={16} fontWeight="600" fill={el.strokeColor}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {label}
        </text>
      )}
    </g>
  )
}

// ---- Fraction Bar ----

function FractionBarSvg({ el, updateElement, isSelected }: {
  el: FractionBarElement
  updateElement: (id: string, u: Partial<WhiteboardElement>) => void
  isSelected: boolean
})
{
  const { divisions, shaded, label, orientation } = el

  const toggleSlice = (index: number) => {
    if (el.locked) return
    const newShaded = shaded.includes(index)
      ? shaded.filter((s) => s !== index)
      : [...shaded, index]
    updateElement(el.id, {
      shaded: newShaded,
      label: newShaded.length + '/' + divisions,
    } as Partial<FractionBarElement>)
  }

  const isH = orientation === 'horizontal'
  const sliceSize = isH ? el.width / divisions : el.height / divisions

  return (
    <g>
      {isSelected && (
        <rect x={el.x - 2} y={el.y - 2} width={el.width + 4} height={el.height + 4}
          fill="none" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 2" rx={4} />
      )}
      {Array.from({ length: divisions }, (_, i) => {
        const isShaded = shaded.includes(i)
        const props = isH
          ? { x: el.x + i * sliceSize, y: el.y, width: sliceSize, height: el.height }
          : { x: el.x, y: el.y + i * sliceSize, width: el.width, height: sliceSize }
        return (
          <rect key={i} {...props}
            fill={isShaded ? FILL_COLORS[i % FILL_COLORS.length] : 'transparent'}
            fillOpacity={isShaded ? 0.6 : 0}
            stroke={el.strokeColor}
            strokeWidth={el.strokeWidth}
            style={{ cursor: el.locked ? 'not-allowed' : 'pointer' }}
            onClick={(e) => { e.stopPropagation(); toggleSlice(i) }}
            onPointerDown={(e) => e.stopPropagation()}
          />
        )
      })}
      {label && (
        <text x={el.x + el.width / 2} y={el.y + el.height + 20} textAnchor="middle"
          fontSize={16} fontWeight="600" fill={el.strokeColor}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {label}
        </text>
      )}
    </g>
  )
}

// ---- Number Line ----

function NumberLineSvg({ el, updateElement, isSelected }: {
  el: NumberLineElement
  updateElement: (id: string, u: Partial<WhiteboardElement>) => void
  isSelected: boolean
}) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const y = el.y + el.height / 2
  const { min, max, step, ticks, labels, plottedPoints } = el
  const range = max - min || 1
  const pxPerUnit = el.width / range
  const toX = (v: number) => el.x + (v - min) * pxPerUnit

  const handleLineClick = (e: React.MouseEvent<SVGGElement>) => {
    if (el.locked) return
    const svg = (e.currentTarget as SVGGElement).closest('svg')
    if (!svg) return
    const svgRect = svg.getBoundingClientRect()
    const canvasX = e.clientX - svgRect.left
    const value = Math.round(((canvasX - el.x) / pxPerUnit + min) / step) * step
    const clampedValue = Math.max(min, Math.min(max, value))
    const newPoints = [...plottedPoints, { value: clampedValue, above: true }]
    updateElement(el.id, { plottedPoints: newPoints } as Partial<NumberLineElement>)
  }

  return (
    <g>
      {isSelected && (
        <rect x={el.x - 4} y={el.y - 4} width={el.width + 8} height={el.height + 8}
          fill="none" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 2" rx={4} />
      )}
      {/* Main line */}
      <line x1={el.x} y1={y} x2={el.x + el.width} y2={y}
        stroke={el.strokeColor} strokeWidth={el.strokeWidth} style={{ pointerEvents: 'none' }} />
      {/* Arrowheads */}
      <polygon points={el.x + el.width + 8 + ',' + y + ' ' + (el.x + el.width) + ',' + (y - 5) + ' ' + (el.x + el.width) + ',' + (y + 5)}
        fill={el.strokeColor} style={{ pointerEvents: 'none' }} />
      <polygon points={(el.x - 8) + ',' + y + ' ' + el.x + ',' + (y - 5) + ' ' + el.x + ',' + (y + 5)}
        fill={el.strokeColor} style={{ pointerEvents: 'none' }} />
      {/* Ticks and labels */}
      {ticks.map((tick, i) => {
        const tx = toX(tick)
        const isMainTick = Math.abs(tick % (step * 5)) < 0.001 || Math.abs(tick % (step * 5) - (step * 5)) < 0.001
        return (
          <g key={i} style={{ pointerEvents: 'none' }}>
            <line x1={tx} y1={y - (isMainTick ? 12 : 6)} x2={tx} y2={y + (isMainTick ? 12 : 6)}
              stroke={el.strokeColor} strokeWidth={el.strokeWidth} />
            {(isMainTick || el.width / ticks.length > 40) && (
              <text x={tx} y={y + 28} textAnchor="middle" fontSize={12}
                fill={isDark ? '#94a3b8' : '#475569'} fontFamily="inherit">
                {labels[i]}
              </text>
            )}
          </g>
        )
      })}
      {/* Plotted points */}
      {plottedPoints.map((pt, i) => {
        const px = toX(pt.value)
        const py = pt.above ? y - 20 : y + 20
        return (
          <g key={'pt-' + i}>
            <circle cx={px} cy={y} r={5} fill='#ef4444'
              style={{ cursor: el.locked ? 'not-allowed' : 'pointer' }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                if (!el.locked) {
                  updateElement(el.id, {
                    plottedPoints: plottedPoints.filter((_, j) => j !== i),
                  } as Partial<NumberLineElement>)
                }
              }}
            />
          </g>
        )
      })}
      {/* Clickable area for adding points */}
      {!el.locked && (
        <rect x={el.x} y={el.y} width={el.width} height={el.height}
          fill="transparent" stroke="none" style={{ cursor: 'crosshair' }}
          onClick={handleLineClick} onPointerDown={(e) => e.stopPropagation()} />
      )}
    </g>
  )
}

// ---- Angle ----

function AngleSvg({ el, updateElement, isSelected }: {
  el: AngleElement
  updateElement: (id: string, u: Partial<WhiteboardElement>) => void
  isSelected: boolean
}) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const { x, y, x2, y2, showArc, showLabel, degrees } = el

  const handleDrag = useCallback((e: React.PointerEvent) => {
    if (el.locked) return
    e.stopPropagation()
    // Simple angle update on drag — compute angle from vertex to pointer
    const svg = (e.currentTarget as SVGElement).closest('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const angle = Math.atan2(-(py - y), px - x) * (180 / Math.PI)
    const len = 120
    const rad = angle * (Math.PI / 180)
    updateElement(el.id, {
      x2: x + len * Math.cos(rad),
      y2: y - len * Math.sin(rad),
      degrees: Math.round(angle * 10) / 10,
    } as Partial<AngleElement>)
  }, [el, x, y, updateElement])

  const angleDeg = degrees || 0
  const angleRad = angleDeg * (Math.PI / 180)
  const arcR = 30

  // Arc path
  const ax = x + arcR * Math.cos(-angleRad)
  const ay = y + arcR * Math.sin(-angleRad)
  const largeArc = Math.abs(angleDeg) > 180 ? 1 : 0
  const sweep = angleDeg >= 0 ? 1 : 0
  const arcD = angleDeg !== 0
      ? 'M ' + (x + arcR) + ',' + y + ' A ' + arcR + ',' + arcR + ' 0 ' + largeArc + ',' + sweep + ' ' + ax + ',' + ay
      : ''

  return (
    <g>
      {isSelected && (
        <circle cx={x} cy={y} r={8} fill="#3b82f6" opacity={0.3} />
      )}
      {/* Base ray (horizontal) */}
      <line x1={x} y1={y} x2={x + 150} y2={y}
        stroke={el.strokeColor} strokeWidth={el.strokeWidth} style={{ pointerEvents: 'none' }} />
      {/* Second ray */}
      <line x1={x} y1={y} x2={x2} y2={y2}
        stroke={el.strokeColor} strokeWidth={el.strokeWidth} style={{ pointerEvents: 'none' }} />
      {/* Drag handle at end of second ray */}
      {!el.locked && (
        <circle cx={x2} cy={y2} r={6} fill="#3b82f6" opacity={0.6}
          style={{ cursor: 'grab' }}
          onPointerDown={handleDrag} />
      )}
      {/* Arc */}
      {showArc && arcD && (
        <path d={arcD} fill="none" stroke="#f59e0b" strokeWidth={1.5} style={{ pointerEvents: 'none' }} />
      )}
      {/* Degree label */}
      {showLabel && angleDeg !== 0 && (
        <text x={x + (arcR + 16) * Math.cos(-angleRad / 2)}
          y={y + (arcR + 16) * Math.sin(-angleRad / 2) + 4}
          textAnchor="middle" fontSize={13} fontWeight="600" fill="#f59e0b"
          style={{ pointerEvents: 'none', userSelect: 'none' }}>
          {Math.abs(angleDeg).toFixed(0)}°
        </text>
      )}
      {/* Vertex dot */}
      <circle cx={x} cy={y} r={3} fill={el.strokeColor} style={{ pointerEvents: 'none' }} />
    </g>
  )
}

// ---- Polygon ----

function PolygonSvg({ el, updateElement, isSelected }: {
  el: PolygonElement
  updateElement: (id: string, u: Partial<WhiteboardElement>) => void
  isSelected: boolean
}) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2
  const r = Math.min(el.width, el.height) / 2 - 10
  const { sides, showAngleMeasures } = el

  const vertices: Array<{ x: number; y: number }> = []
  const interiorAngle = ((sides - 2) * 180) / sides
  const centralAngle = 360 / sides

  for (let i = 0; i < sides; i++) {
    const a = (-90 + i * centralAngle) * (Math.PI / 180)
    vertices.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
  }

  const pathD = vertices.map((v, i) => (i === 0 ? 'M ' : 'L ') + v.x + ',' + v.y).join(' ') + ' Z'

  return (
    <g>
      {isSelected && (
        <rect x={el.x - 2} y={el.y - 2} width={el.width + 4} height={el.height + 4}
          fill="none" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 2" rx={4} />
      )}
      <path d={pathD} fill={el.fillColor} stroke={el.strokeColor} strokeWidth={el.strokeWidth}
        style={{ pointerEvents: 'none' }} />
      {/* Vertex dots */}
      {vertices.map((v, i) => (
        <circle key={i} cx={v.x} cy={v.y} r={3} fill={el.strokeColor} style={{ pointerEvents: 'none' }} />
      ))}
      {/* Angle measures */}
      {showAngleMeasures && vertices.map((v, i) => {
        const prev = vertices[(i - 1 + sides) % sides]
        const next = vertices[(i + 1) % sides]
        const labelR = 20
        const midAngle = Math.atan2(
          (prev.y - v.y) + (next.y - v.y),
          (prev.x - v.x) + (next.x - v.x)
        )
        return (
          <text key={'ang-' + i}
            x={v.x + labelR * Math.cos(midAngle)}
            y={v.y + labelR * Math.sin(midAngle) + 4}
            textAnchor="middle" fontSize={11} fill="#f59e0b"
            style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {Math.round(interiorAngle * 10) / 10}°
          </text>
        )
      })}
    </g>
  )
}

// ---- Coordinate Plane ----

// Simple equation evaluator for coordinate plane curves
function evalEquation(eq: string, x: number): number | null {
  try {
    const safe = eq
      .replace(/\^/g, '**')
      .replace(/sqrt\s*\(/g, 'Math.sqrt(')
      .replace(/abs\s*\(/g, 'Math.abs(')
      .replace(/sin\s*\(/g, 'Math.sin(')
      .replace(/cos\s*\(/g, 'Math.cos(')
      .replace(/tan\s*\(/g, 'Math.tan(')
      .replace(/log\s*\(/g, 'Math.log(')
      .replace(/pi/gi, 'Math.PI')
    const fn = new Function('x', 'return ' + safe)
    const y = fn(x)
    return typeof y === 'number' && isFinite(y) ? y : null
  } catch {
    return null
  }
}

function buildEquationPath(
  eq: string, xMin: number, xMax: number, yMin: number, yMax: number,
  toSvgX: (v: number) => number, toSvgY: (v: number) => number,
  width: number
): string {
  const samples = Math.max(200, Math.round(width * 2))
  const dx = (xMax - xMin) / samples
  const segments: string[] = []
  let currentPath = ''
  for (let i = 0; i <= samples; i++) {
    const x = xMin + i * dx
    const y = evalEquation(eq, x)
    if (y === null || y < yMin * 3 || y > yMax * 3) {
      if (currentPath) { segments.push(currentPath); currentPath = '' }
      continue
    }
    const sx = toSvgX(x)
    const sy = toSvgY(y)
    currentPath += (currentPath ? ' L ' : 'M ') + sx.toFixed(1) + ',' + sy.toFixed(1)
  }
  if (currentPath) segments.push(currentPath)
  return segments.join(' ')
}

function CoordinatePlaneSvg({ el, updateElement, isSelected }: {
  el: CoordinatePlaneElement
  updateElement: (id: string, u: Partial<WhiteboardElement>) => void
  isSelected: boolean
}) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const { xMin, xMax, yMin, yMax, step, plottedPoints, equations } = el
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2
  const xRange = xMax - xMin
  const yRange = yMax - yMin
  const pxPerUnitX = el.width / xRange
  const pxPerUnitY = el.height / yRange

  const toSvgX = (v: number) => cx + (v - 0) * pxPerUnitX
  const toSvgY = (v: number) => cy - (v - 0) * pxPerUnitY

  const curveColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']

  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisColor = isDark ? '#64748b' : '#94a3b8'
  const textColor = isDark ? '#94a3b8' : '#64748b'

  const [newPt, setNewPt] = useState<{ x: number; y: number } | null>(null)

  const handleClick = (e: React.MouseEvent<SVGGElement>) => {
    if (el.locked) return
    const rect = (e.currentTarget as SVGGElement).getBoundingClientRect()
    const relX = e.clientX - rect.left
    const relY = e.clientY - rect.top
    const mathX = Math.round(((relX - cx) / pxPerUnitX) / step) * step
    const mathY = Math.round(((cy - relY) / pxPerUnitY) / step) * step
    const clampedX = Math.max(xMin, Math.min(xMax, mathX))
    const clampedY = Math.max(yMin, Math.min(yMax, mathY))
    updateElement(el.id, {
      plottedPoints: [...plottedPoints, { x: clampedX, y: clampedY }],
    } as Partial<CoordinatePlaneElement>)
  }

  return (
    <g>
      {isSelected && (
        <rect x={el.x - 2} y={el.y - 2} width={el.width + 4} height={el.height + 4}
          fill="none" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 2" rx={4} />
      )}
      {/* Background */}
      <rect x={el.x} y={el.y} width={el.width} height={el.height}
        fill={isDark ? 'rgba(15,23,42,0.4)' : 'rgba(255,255,255,0.9)'} stroke={el.strokeColor}
        strokeWidth={el.strokeWidth} rx={2} />
      {/* Grid lines */}
      {Array.from({ length: Math.floor(xRange / step) + 1 }, (_, i) => {
        const v = xMin + i * step
        if (Math.abs(v) < 0.001) return null
        const sx = toSvgX(v)
        return <line key={'gv-' + i} x1={sx} y1={el.y} x2={sx} y2={el.y + el.height}
          stroke={gridColor} strokeWidth={0.5} style={{ pointerEvents: 'none' }} />
      })}
      {Array.from({ length: Math.floor(yRange / step) + 1 }, (_, i) => {
        const v = yMin + i * step
        if (Math.abs(v) < 0.001) return null
        const sy = toSvgY(v)
        return <line key={'gh-' + i} x1={el.x} y1={sy} x2={el.x + el.width} y2={sy}
          stroke={gridColor} strokeWidth={0.5} style={{ pointerEvents: 'none' }} />
      })}
      {/* Axes */}
      <line x1={el.x} y1={cy} x2={el.x + el.width} y2={cy}
        stroke={axisColor} strokeWidth={1.5} style={{ pointerEvents: 'none' }} />
      <line x1={cx} y1={el.y} x2={cx} y2={el.y + el.height}
        stroke={axisColor} strokeWidth={1.5} style={{ pointerEvents: 'none' }} />
      {/* Axis labels */}
      <text x={el.x + el.width - 14} y={cy - 6} fontSize={12} fill={textColor}
        textAnchor="end" style={{ pointerEvents: 'none', userSelect: 'none' }}>x</text>
      <text x={cx + 8} y={el.y + 14} fontSize={12} fill={textColor}
        style={{ pointerEvents: 'none', userSelect: 'none' }}>y</text>
      {/* Tick labels */}
      {Array.from({ length: Math.floor(xRange / step) + 1 }, (_, i) => {
        const v = xMin + i * step
        if (Math.abs(v) < 0.001) return null
        if (i % 2 !== 0 && xRange / step > 10) return null
        const sx = toSvgX(v)
        return <text key={'xl-' + i} x={sx} y={cy + 16} textAnchor="middle" fontSize={10}
          fill={textColor} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          {Number.isInteger(v) ? v : v.toFixed(1)}
        </text>
      })}
      {Array.from({ length: Math.floor(yRange / step) + 1 }, (_, i) => {
        const v = yMin + i * step
        if (Math.abs(v) < 0.001) return null
        if (i % 2 !== 0 && yRange / step > 10) return null
        const sy = toSvgY(v)
        return <text key={'yl-' + i} x={cx - 8} y={sy + 4} textAnchor="end" fontSize={10}
          fill={textColor} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          {Number.isInteger(v) ? v : v.toFixed(1)}
        </text>
      })}
      {/* Equation curves */}
      {equations && equations.map((eq, i) => {
        const d = buildEquationPath(eq, xMin, xMax, yMin, yMax, toSvgX, toSvgY, el.width)
        if (!d) return null
        return <path key={'eq-' + i} d={d} fill="none"
          stroke={curveColors[i % curveColors.length]} strokeWidth={2}
          style={{ pointerEvents: 'none' }} />
      })}
      {/* Plotted points */}
      {plottedPoints.map((pt, i) => {
        const sx = toSvgX(pt.x)
        const sy = toSvgY(pt.y)
        return (
          <g key={'pp-' + i}>
            <circle cx={sx} cy={sy} r={5} fill="#ef4444"
              style={{ pointerEvents: 'none' }} />
            <text x={sx} y={sy - 10} textAnchor="middle" fontSize={11}
              fill={el.strokeColor} fontWeight="600"
              style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {pt.label || '(' + pt.x + ',' + pt.y + ')'}
            </text>
          </g>
        )
      })}
      {/* Click area */}
      {!el.locked && (
        <rect x={el.x} y={el.y} width={el.width} height={el.height}
          fill="transparent" stroke="none" style={{ cursor: 'crosshair' }}
          onClick={handleClick} onPointerDown={(e) => e.stopPropagation()} />
      )}
    </g>
  )
}

// ---- Venn Diagram ----

function VennSvg({ el, updateElement, isSelected }: {
  el: VennElement
  updateElement: (id: string, u: Partial<WhiteboardElement>) => void
  isSelected: boolean
}) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const { circles, shadedRegions, setLabels } = el
  const w = el.width
  const h = el.height

  // Circle positions
  const r = Math.min(w, h) * 0.35
  const positions = circles === 2
    ? [
        { cx: el.x + w * 0.38, cy: el.y + h * 0.5 },
        { cx: el.x + w * 0.62, cy: el.y + h * 0.5 },
      ]
    : [
        { cx: el.x + w * 0.5, cy: el.y + h * 0.35 },
        { cx: el.x + w * 0.3, cy: el.y + h * 0.65 },
        { cx: el.x + w * 0.7, cy: el.y + h * 0.65 },
      ]

  const circleColors = ['#3b82f6', '#22c55e', '#f59e0b']

  return (
    <g>
      {isSelected && (
        <rect x={el.x - 2} y={el.y - 2} width={el.width + 4} height={el.height + 4}
          fill="none" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 2" rx={4} />
      )}
      {/* Circles */}
      {positions.map((pos, i) => (
        <circle key={i} cx={pos.cx} cy={pos.cy} r={r}
          fill={circleColors[i]} fillOpacity={0.08}
          stroke={circleColors[i]} strokeWidth={el.strokeWidth}
          style={{ pointerEvents: 'none' }} />
      ))}
      {/* Set labels */}
      {setLabels.map((label, i) => {
        const labelPos = circles === 2
          ? (i === 0 ? { x: positions[0].cx - r * 0.5, y: positions[0].cy - r - 8 }
            : { x: positions[1].cx + r * 0.5, y: positions[1].cy - r - 8 })
          : [{ x: positions[0].cx, y: positions[0].cy - r - 8 },
              { x: positions[1].cx - r * 0.6, y: positions[1].cy + r + 16 },
              { x: positions[2].cx + r * 0.6, y: positions[2].cy + r + 16 }][i]
        return (
          <text key={i} x={labelPos.x} y={labelPos.y} textAnchor="middle" fontSize={14}
            fontWeight="700" fill={circleColors[i]}
            style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {label}
          </text>
        )
      })}
    </g>
  )
}

// ---- Bar Chart ----

function BarChartSvg({ el, updateElement, isSelected }: {
  el: BarChartElement
  updateElement: (id: string, u: Partial<WhiteboardElement>) => void
  isSelected: boolean
}) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const { categories, values, title, color } = el
  const maxVal = Math.max(...values, 1)
  const barW = (el.width - 40) / categories.length - 8
  const chartH = el.height - 50

  return (
    <g>
      {isSelected && (
        <rect x={el.x - 2} y={el.y - 2} width={el.width + 4} height={el.height + 4}
          fill="none" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 2" rx={4} />
      )}
      {/* Background */}
      <rect x={el.x} y={el.y} width={el.width} height={el.height}
        fill={isDark ? 'rgba(15,23,42,0.4)' : 'rgba(255,255,255,0.9)'}
        stroke={el.strokeColor} strokeWidth={el.strokeWidth} rx={4} />
      {/* Title */}
      {title && (
        <text x={el.x + el.width / 2} y={el.y + 20} textAnchor="middle" fontSize={13} fontWeight="600"
          fill={el.strokeColor} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          {title}
        </text>
      )}
      {/* Baseline */}
      <line x1={el.x + 30} y1={el.y + chartH + 10} x2={el.x + el.width - 10} y2={el.y + chartH + 10}
        stroke={isDark ? '#475569' : '#cbd5e1'} strokeWidth={1} style={{ pointerEvents: 'none' }} />
      {/* Bars */}
      {values.map((val, i) => {
        const barH = (val / maxVal) * (chartH - 30)
        const bx = el.x + 35 + i * ((el.width - 40) / categories.length)
        const by = el.y + chartH + 10 - barH
        return (
          <g key={i} style={{ pointerEvents: 'none' }}>
            <rect x={bx} y={by} width={barW} height={barH}
              fill={FILL_COLORS[i % FILL_COLORS.length]} rx={2} opacity={0.8} />
            <text x={bx + barW / 2} y={by - 6} textAnchor="middle" fontSize={11}
              fontWeight="600" fill={el.strokeColor}>
              {val}
            </text>
            <text x={bx + barW / 2} y={el.y + el.height - 6} textAnchor="middle" fontSize={11}
              fill={isDark ? '#94a3b8' : '#64748b'}>
              {categories[i]}
            </text>
          </g>
        )
      })}
    </g>
  )
}

// ---- Pie Chart ----

function PieChartSvg({ el, updateElement, isSelected }: {
  el: PieChartElement
  updateElement: (id: string, u: Partial<WhiteboardElement>) => void
  isSelected: boolean
}) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const { slices, title } = el
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2
  const r = Math.min(el.width, el.height) / 2 - 20
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1

  let currentAngle = -Math.PI / 2

  return (
    <g>
      {isSelected && (
        <rect x={el.x - 2} y={el.y - 2} width={el.width + 4} height={el.height + 4}
          fill="none" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 2" rx={4} />
      )}
      {/* Slices */}
      {slices.map((slice, i) => {
        const sliceAngle = (slice.value / total) * 2 * Math.PI
        const a1 = currentAngle
        const a2 = currentAngle + sliceAngle
        const x1 = cx + r * Math.cos(a1)
        const y1 = cy + r * Math.sin(a1)
        const x2 = cx + r * Math.cos(a2)
        const y2 = cy + r * Math.sin(a2)
        const largeArc = sliceAngle > Math.PI ? 1 : 0
        const d = 'M ' + cx + ',' + cy + ' L ' + x1 + ',' + y1 + ' A ' + r + ',' + r + ' 0 ' + largeArc + ',1 ' + x2 + ',' + y2 + ' Z'
        // Label position at midpoint of arc
        const midAngle = (a1 + a2) / 2
        const labelR = r * 0.65
        const lx = cx + labelR * Math.cos(midAngle)
        const ly = cy + labelR * Math.sin(midAngle)
        const pct = Math.round((slice.value / total) * 100)
        currentAngle = a2
        return (
          <g key={i} style={{ pointerEvents: 'none' }}>
            <path d={d} fill={slice.color} stroke={isDark ? '#1e293b' : '#ffffff'} strokeWidth={2} />
            {pct > 5 && (
              <text x={lx} y={ly + 4} textAnchor="middle" fontSize={12} fontWeight="600"
                fill={isDark ? '#e2e8f0' : '#1e293b'}>
                {pct}%
              </text>
            )}
          </g>
        )
      })}
      {/* Legend */}
      {title && (
        <text x={cx} y={el.y + el.height + 4} textAnchor="middle" fontSize={12} fontWeight="600"
          fill={el.strokeColor} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          {title}
        </text>
      )}
      {/* Slice labels outside */}
      {slices.map((slice, i) => {
        const sliceAngle = (slice.value / total) * 2 * Math.PI
        const midAngle = -Math.PI / 2 + slices.slice(0, i).reduce((s, sl) => s + (sl.value / total) * 2 * Math.PI, 0) + sliceAngle / 2
        const lx = cx + (r + 16) * Math.cos(midAngle)
        const ly = cy + (r + 16) * Math.sin(midAngle)
        return (
          <text key={'leg-' + i} x={lx} y={ly + 4} textAnchor="middle" fontSize={10}
            fill={isDark ? '#94a3b8' : '#64748b'}
            style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {slice.label}
          </text>
        )
      })}
    </g>
  )
}
