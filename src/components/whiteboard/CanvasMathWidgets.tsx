'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { WidgetElement } from '@/lib/whiteboard/types'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { generateId } from '@/lib/whiteboard/utils'
import { Mafs, Coordinates, Plot, Text as MafsText } from 'mafs'
import { MultiplicationGrid, Flashcards, Calculator, UnitConverter, FormulaReference, ProofBuilder } from '@/components/room/widgets/math/MathUtilities'

// ============================================================
// On-Canvas Math Widgets — Interactive fraction & angle tools
// ============================================================

// ---- Canvas stamping helpers ----
// These let widgets draw real geometry (lines, circles) onto the
// whiteboard canvas so the teacher can draw over / annotate them.

interface StampCtx {
  ex: number  // widget element.x on canvas
  ey: number  // widget element.y on canvas
}

function useStampToCanvas(element: WidgetElement) {
  const addEl = useWhiteboardStore((s) => s.addElement)
  const pushH = useWhiteboardStore((s) => s.pushHistory)

  var stampLine = useCallback(function(ctx: StampCtx, lx1: number, ly1: number, lx2: number, ly2: number, color?: string, sw?: number) {
    var store = useWhiteboardStore.getState()
    var style = store.style
    pushH()
    addEl({
      id: generateId(), type: 'line',
      x: ctx.ex + lx1, y: ctx.ey + ly1,
      x2: ctx.ex + lx2, y2: ctx.ey + ly2,
      width: 0, height: 0, rotation: 0,
      opacity: style.opacity,
      strokeColor: color || style.strokeColor,
      fillColor: 'transparent',
      strokeWidth: sw || Math.max(style.strokeWidth, 2),
      locked: false, pageIndex: store.currentPageIndex,
    } as import('@/lib/whiteboard/types').WhiteboardElement)
  }, [addEl, pushH])

  var stampCircle = useCallback(function(ctx: StampCtx, lcx: number, lcy: number, r: number, color?: string, sw?: number) {
    var store = useWhiteboardStore.getState()
    var style = store.style
    pushH()
    addEl({
      id: generateId(), type: 'ellipse',
      x: ctx.ex + lcx - r, y: ctx.ey + lcy - r,
      width: r * 2, height: r * 2, rotation: 0,
      opacity: style.opacity,
      strokeColor: color || style.strokeColor,
      fillColor: 'transparent',
      strokeWidth: sw || Math.max(style.strokeWidth, 2),
      locked: false, pageIndex: store.currentPageIndex,
    } as import('@/lib/whiteboard/types').WhiteboardElement)
  }, [addEl, pushH])

  return { stampLine: stampLine, stampCircle: stampCircle }
}

interface CanvasWidgetProps {
  element: WidgetElement
  isDark: boolean
}

/** Immediate config updater (no debounce — click interactions need instant feedback) */
function useConfigUpdater(elementId: string) {
  const updateElement = useWhiteboardStore((s) => s.updateElement)
  const pendingRef = useRef<Record<string, unknown>>({})
  const rafRef = useRef<number>(0)

  const updateConfig = useCallback((patch: Record<string, unknown>) => {
    Object.assign(pendingRef.current, patch)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      updateElement(elementId, { config: { ...pendingRef.current } } as Partial<WidgetElement>)
      pendingRef.current = {}
    })
  }, [updateElement, elementId])

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  return updateConfig
}

// ---- Shared styles ----

const ws = (isDark: boolean) => ({
  bg: isDark ? '#0f172a' : '#ffffff',
  surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
  border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
  text: isDark ? '#94a3b8' : '#64748b',
  bright: isDark ? '#e2e8f0' : '#1e293b',
  accent: '#34d399',
  input: {
    padding: '3px 6px', borderRadius: 4, fontSize: 11,
    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'),
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none' as const,
  },
})

// ---- Color palette for shaded slices ----
const SHADE_COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
]

// ============================================================
// Fraction Circle Widget
// ============================================================

export function CanvasFractionCircle({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { divisions?: number; shaded?: number[] }
  const divisions = (cfg.divisions || 4)
  const shaded = (cfg.shaded || []) as number[]
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)

  const toggleSlice = useCallback((index: number) => {
    const next = shaded.includes(index)
      ? shaded.filter(i => i !== index)
      : [...shaded, index]
    updateConfig({ shaded: next, divisions: divisions })
  }, [shaded, divisions, updateConfig])

  const setDivisions = useCallback((n: number) => {
    const clamped = Math.max(2, Math.min(36, n))
    updateConfig({ divisions: clamped, shaded: [] })
  }, [updateConfig])

  const shadeAll = useCallback(() => {
    const all = Array.from({ length: divisions }, (_, i) => i)
    updateConfig({ shaded: all, divisions: divisions })
  }, [divisions, updateConfig])

  const clearAll = useCallback(() => {
    updateConfig({ shaded: [], divisions: divisions })
  }, [divisions, updateConfig])

  // SVG geometry
  const size = 180
  const cx = size / 2
  const cy = size / 2
  const r = 78

  const slices = useMemo(() => {
    const result: Array<{ d: string; color: string; index: number }> = []
    for (let i = 0; i < divisions; i++) {
      const startAngle = (2 * Math.PI * i) / divisions - Math.PI / 2
      const endAngle = (2 * Math.PI * (i + 1)) / divisions - Math.PI / 2
      const x1 = cx + r * Math.cos(startAngle)
      const y1 = cy + r * Math.sin(startAngle)
      const x2 = cx + r * Math.cos(endAngle)
      const y2 = cy + r * Math.sin(endAngle)
      const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0
      const d = 'M ' + cx + ' ' + cy + ' L ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + ' Z'
      const isShaded = shaded.includes(i)
      const color = isShaded ? SHADE_COLORS[i % SHADE_COLORS.length] : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')
      result.push({ d, color, index: i })
    }
    return result
  }, [divisions, shaded, cx, cy, r, isDark])

  const fractionLabel = shaded.length > 0
    ? (shaded.length === divisions ? '1 (whole)' : shaded.length + '/' + divisions)
    : '0'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Fraction Circle</span>
        <span style={{ fontSize: 10, color: s.text }}>Parts:</span>
        <input
          type="number" value={divisions} min={2} max={36} step={1}
          onChange={(e) => setDivisions(Number(e.target.value))}
          style={{ ...s.input, width: 46 }}
        />
        <button onClick={shaded.length === divisions ? clearAll : shadeAll}
          style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' as const,
            background: shaded.length === divisions ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
            border: shaded.length === divisions ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(59,130,246,0.3)',
            color: shaded.length === divisions ? '#fca5a5' : '#60a5fa',
          }}>
          {shaded.length === divisions ? 'Clear all' : 'Shade all'}
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: s.accent, marginLeft: 'auto' }}>{fractionLabel}</span>
      </div>

      {/* Interactive SVG Circle */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size}>
          {slices.map((slice) => (
            <path
              key={slice.index}
              d={slice.d}
              fill={slice.color}
              stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
              strokeWidth={1}
              style={{ cursor: 'pointer' as const, transition: 'opacity 0.15s' }}
              onClick={() => toggleSlice(slice.index)}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            />
          ))}
          {/* Center label */}
          {divisions <= 12 && shaded.length > 0 && (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
              fontSize={divisions <= 6 ? 18 : 14} fontWeight={700}
              fill={isDark ? '#e2e8f0' : '#1e293b'}>
              {shaded.length}/{divisions}
            </text>
          )}
        </svg>
      </div>

      {/* Quick-select common divisions */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
          <button key={n} onClick={() => setDivisions(n)}
            style={{
              padding: '2px 7px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
              background: divisions === n ? 'rgba(5,150,105,0.15)' : s.surface,
              border: divisions === n ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
              color: divisions === n ? '#34d399' : s.text,
            }}>
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Fraction Bar Widget
// ============================================================

export function CanvasFractionBar({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { divisions?: number; shaded?: number[]; orientation?: 'horizontal' | 'vertical' }
  const divisions = cfg.divisions || 4
  const shaded = (cfg.shaded || []) as number[]
  const orientation = cfg.orientation || 'horizontal'
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)

  const toggleSegment = useCallback((index: number) => {
    const next = shaded.includes(index)
      ? shaded.filter(i => i !== index)
      : [...shaded, index]
    updateConfig({ shaded: next, divisions: divisions, orientation: orientation })
  }, [shaded, divisions, orientation, updateConfig])

  const setDivisions = useCallback((n: number) => {
    const clamped = Math.max(2, Math.min(36, n))
    updateConfig({ divisions: clamped, shaded: [], orientation: orientation })
  }, [orientation, updateConfig])

  const setOrientation = useCallback((o: 'horizontal' | 'vertical') => {
    updateConfig({ divisions: divisions, shaded: shaded, orientation: o })
  }, [divisions, shaded, updateConfig])

  const shadeAll = useCallback(() => {
    updateConfig({ shaded: Array.from({ length: divisions }, (_, i) => i), divisions: divisions, orientation: orientation })
  }, [divisions, orientation, updateConfig])

  const clearAll = useCallback(() => {
    updateConfig({ shaded: [], divisions: divisions, orientation: orientation })
  }, [divisions, orientation, updateConfig])

  const fractionLabel = shaded.length > 0
    ? (shaded.length === divisions ? '1 (whole)' : shaded.length + '/' + divisions)
    : '0'

  const barWidth = 280
  const barHeight = 48
  const gap = 2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Fraction Bar</span>
        <span style={{ fontSize: 10, color: s.text }}>Parts:</span>
        <input
          type="number" value={divisions} min={2} max={36} step={1}
          onChange={(e) => setDivisions(Number(e.target.value))}
          style={{ ...s.input, width: 46 }}
        />
        {(['horizontal', 'vertical'] as const).map(o => (
          <button key={o} onClick={() => setOrientation(o)}
            style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer' as const,
              background: orientation === o ? 'rgba(5,150,105,0.15)' : s.surface,
              border: orientation === o ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
              color: orientation === o ? '#34d399' : s.text,
            }}>
            {o === 'horizontal' ? 'Horizontal' : 'Vertical'}
          </button>
        ))}
        <button onClick={shaded.length === divisions ? clearAll : shadeAll}
          style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' as const,
            background: shaded.length === divisions ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
            border: shaded.length === divisions ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(59,130,246,0.3)',
            color: shaded.length === divisions ? '#fca5a5' : '#60a5fa',
          }}>
          {shaded.length === divisions ? 'Clear' : 'Fill all'}
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: s.accent, marginLeft: 'auto' }}>{fractionLabel}</span>
      </div>

      {/* Interactive Bar */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {orientation === 'horizontal' ? (
          <svg width={barWidth} height={barHeight + 20} viewBox={'0 0 ' + barWidth + ' ' + (barHeight + 20)}>
            {Array.from({ length: divisions }, (_, i) => {
              const segW = (barWidth - (divisions - 1) * gap) / divisions
              const x = i * (segW + gap)
              const isShaded = shaded.includes(i)
              return (
                <g key={i}>
                  <rect
                    x={x} y={0} width={segW} height={barHeight}
                    rx={3} fill={isShaded ? SHADE_COLORS[i % SHADE_COLORS.length] : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')}
                    stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'} strokeWidth={1}
                    style={{ cursor: 'pointer' as const, transition: 'opacity 0.15s' }}
                    onClick={() => toggleSegment(i)}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                  />
                  {divisions <= 16 && (
                    <text x={x + segW / 2} y={barHeight + 14} textAnchor="middle" fontSize={9}
                      fill={isDark ? '#94a3b8' : '#64748b'}>{i + 1}</text>
                  )}
                </g>
              )
            })}
          </svg>
        ) : (
          <svg width={barHeight + 20} height={barWidth} viewBox={'0 0 ' + (barHeight + 20) + ' ' + barWidth}>
            {Array.from({ length: divisions }, (_, i) => {
              const segH = (barWidth - (divisions - 1) * gap) / divisions
              const y = i * (segH + gap)
              const isShaded = shaded.includes(i)
              return (
                <g key={i}>
                  <rect
                    x={0} y={y} width={barHeight} height={segH}
                    rx={3} fill={isShaded ? SHADE_COLORS[i % SHADE_COLORS.length] : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')}
                    stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'} strokeWidth={1}
                    style={{ cursor: 'pointer' as const, transition: 'opacity 0.15s' }}
                    onClick={() => toggleSegment(i)}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                  />
                  {divisions <= 16 && (
                    <text x={barHeight + 12} y={y + segH / 2 + 3} textAnchor="middle" fontSize={9}
                      fill={isDark ? '#94a3b8' : '#64748b'}>{i + 1}</text>
                  )}
                </g>
              )
            })}
          </svg>
        )}
      </div>

      {/* Quick divisions */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
          <button key={n} onClick={() => setDivisions(n)}
            style={{
              padding: '2px 7px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
              background: divisions === n ? 'rgba(5,150,105,0.15)' : s.surface,
              border: divisions === n ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
              color: divisions === n ? '#34d399' : s.text,
            }}>
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Angle Maker Widget
// ============================================================

const ANGLE_PRESETS = [30, 45, 60, 90, 120, 135, 150, 180]

export function CanvasAngleMaker({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { degrees?: number }
  const degrees = cfg.degrees ?? 90
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)

  const setDegrees = useCallback((d: number) => {
    const clamped = Math.max(1, Math.min(359, Math.round(d)))
    updateConfig({ degrees: clamped })
  }, [updateConfig])

  // SVG geometry
  const size = 200
  const cx = 40
  const cy = 160
  const armLen = 140
  const arcR = 50

  const rad = (degrees * Math.PI) / 180
  const endX = cx + armLen * Math.cos(-rad)
  const endY = cy + armLen * Math.sin(-rad)

  // Arc path
  const arcStartX = cx + arcR
  const arcStartY = cy
  const arcEndX = cx + arcR * Math.cos(-rad)
  const arcEndY = cy + arcR * Math.sin(-rad)
  const largeArc = degrees > 180 ? 1 : 0
  const arcPath = 'M ' + arcStartX + ' ' + arcStartY + ' A ' + arcR + ' ' + arcR + ' 0 ' + largeArc + ' 0 ' + arcEndX + ' ' + arcEndY

  // Fill arc (sector)
  const sectorPath = 'M ' + cx + ' ' + cy + ' L ' + arcStartX + ' ' + arcStartY + ' A ' + arcR + ' ' + arcR + ' 0 ' + largeArc + ' 0 ' + arcEndX + ' ' + arcEndY + ' Z'

  // Determine angle classification
  const angleType = degrees < 90 ? 'Acute' : degrees === 90 ? 'Right' : degrees < 180 ? 'Obtuse' : degrees === 180 ? 'Straight' : 'Reflex'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Angle Maker</span>
        <span style={{ fontSize: 10, color: s.text }}>(</span>
        <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>{angleType}</span>
        <span style={{ fontSize: 10, color: s.text }}>)</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: s.accent, marginLeft: 'auto' }}>{degrees} deg</span>
      </div>

      {/* Angle display */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size}>
          {/* Angle sector fill */}
          <path d={sectorPath} fill={isDark ? 'rgba(52,211,153,0.12)' : 'rgba(5,150,105,0.08)'} />
          {/* Arc line */}
          <path d={arcPath} fill="none" stroke="#34d399" strokeWidth={2} />
          {/* Base arm (horizontal, pointing right) */}
          <line x1={cx} y1={cy} x2={cx + armLen} y2={cy}
            stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={2.5} strokeLinecap="round" />
          {/* Angle arm */}
          <line x1={cx} y1={cy} x2={endX} y2={endY}
            stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={2.5} strokeLinecap="round" />
          {/* Vertex dot */}
          <circle cx={cx} cy={cy} r={4} fill="#34d399" />
          {/* Degree label at arc midpoint */}
          <text
            x={cx + (arcR + 16) * Math.cos(-rad / 2)}
            y={cy + (arcR + 16) * Math.sin(-rad / 2)}
            textAnchor="middle" dominantBaseline="central"
            fontSize={13} fontWeight={700} fill="#34d399"
          >
            {degrees} deg
          </text>
          {/* Right angle square for 90 deg */}
          {degrees === 90 && (
            <rect x={cx} y={cy - 16} width={16} height={16}
              fill="none" stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} strokeWidth={1} />
          )}
        </svg>
      </div>

      {/* Slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
        <span style={{ fontSize: 10, color: s.text }}>1 deg</span>
        <input
          type="range" min={1} max={359} step={1} value={degrees}
          onChange={(e) => setDegrees(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#34d399', height: 4 }}
        />
        <span style={{ fontSize: 10, color: s.text }}>359 deg</span>
      </div>

      {/* Preset buttons */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {ANGLE_PRESETS.map(deg => (
          <button key={deg} onClick={() => setDegrees(deg)}
            style={{
              padding: '2px 7px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
              background: degrees === deg ? 'rgba(5,150,105,0.15)' : s.surface,
              border: degrees === deg ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
              color: degrees === deg ? '#34d399' : s.text,
            }}>
            {deg} deg
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Number Line Widget
// ============================================================

export function CanvasNumberLine({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { min?: number; max?: number; step?: number; plottedPoints?: number[] }
  const min = cfg.min ?? 0
  const max = cfg.max ?? 10
  const step = cfg.step ?? 1
  const plottedPoints = (cfg.plottedPoints || []) as number[]
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)
  const svgRef = useRef<SVGSVGElement>(null)

  const setMin = useCallback((v: number) => {
    updateConfig({ min: v, max: max, step: step, plottedPoints: plottedPoints })
  }, [max, step, plottedPoints, updateConfig])

  const setMax = useCallback((v: number) => {
    updateConfig({ min: min, max: v, step: step, plottedPoints: plottedPoints })
  }, [min, step, plottedPoints, updateConfig])

  const setStep = useCallback((v: number) => {
    const clamped = Math.max(0.1, v)
    updateConfig({ min: min, max: max, step: clamped, plottedPoints: plottedPoints })
  }, [min, max, plottedPoints, updateConfig])

  const clearPoints = useCallback(() => {
    updateConfig({ min: min, max: max, step: step, plottedPoints: [] })
  }, [min, max, step, updateConfig])

  const togglePoint = useCallback((value: number) => {
    const exists = plottedPoints.some(function(p) { return Math.abs(p - value) < 0.0001 })
    const next = exists
      ? plottedPoints.filter(function(p) { return Math.abs(p - value) >= 0.0001 })
      : plottedPoints.concat([value]).sort(function(a, b) { return a - b })
    updateConfig({ min: min, max: max, step: step, plottedPoints: next })
  }, [min, max, step, plottedPoints, updateConfig])

  // SVG geometry
  const svgW = 380
  const svgH = 100
  const padX = 30
  const lineY = svgH / 2 + 8
  const lineStartX = padX
  const lineEndX = svgW - padX
  const lineLen = lineEndX - lineStartX

  const handleSvgClick = useCallback(function(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const svgX = (e.clientX - ctm.e) / ctm.a
    const svgY = (e.clientY - ctm.f) / ctm.d
    if (Math.abs(svgY - lineY) > 22) return
    const ratio = (svgX - lineStartX) / lineLen
    if (ratio < -0.02 || ratio > 1.02) return
    const rawVal = min + ratio * (max - min)
    const snapped = Math.round(rawVal / step) * step
    const rounded = Math.round(snapped * 10000) / 10000
    if (rounded < min - 0.0001 || rounded > max + 0.0001) return
    togglePoint(rounded)
  }, [min, max, step, lineStartX, lineLen, lineY, togglePoint])

  // Generate tick marks
  const ticks: number[] = []
  const effectiveStep = step > 0 ? step : 1
  const safeMax = max >= min ? max : min + 10
  for (let v = min; v <= safeMax + effectiveStep * 0.001; v += effectiveStep) {
    const rv = Math.round(v * 10000) / 10000
    ticks.push(rv)
    if (ticks.length > 500) break
  }

  const formatTick = function(v: number) {
    if (Number.isInteger(v)) return String(v)
 const s = String(Math.round(v * 100) / 100)
    return s
  }

  const toSvgX = function(v: number) {
    const range = max - min
    if (range === 0) return lineStartX + lineLen / 2
    return lineStartX + (v - min) / range * lineLen
  }

  let showEvery = 1
  if (ticks.length > 20) showEvery = Math.ceil(ticks.length / 20)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Number Line</span>
        <span style={{ fontSize: 10, color: s.text }}>Min:</span>
        <input type="number" value={min} step={1} onChange={function(e) { setMin(Number(e.target.value)) }} style={{ ...s.input, width: 42 }} />
        <span style={{ fontSize: 10, color: s.text }}>Max:</span>
        <input type="number" value={max} step={1} onChange={function(e) { setMax(Number(e.target.value)) }} style={{ ...s.input, width: 42 }} />
        <span style={{ fontSize: 10, color: s.text }}>Step:</span>
        <input type="number" value={step} min={0.1} step={0.1} onChange={function(e) { setStep(Number(e.target.value)) }} style={{ ...s.input, width: 42 }} />
        <button onClick={clearPoints} style={{
          padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' as const,
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5',
        }}>Clear</button>
      </div>

      {/* SVG */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg ref={svgRef} width={svgW} height={svgH} viewBox={'0 0 ' + svgW + ' ' + svgH}
          onClick={handleSvgClick} style={{ cursor: 'crosshair' as const }}>
          {/* Main line */}
          <line x1={lineStartX} y1={lineY} x2={lineEndX} y2={lineY}
            stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={2} />
          {/* Arrow */}
          <polygon points={'' + (lineEndX + 8) + ',' + lineY + ' ' + lineEndX + ',' + (lineY - 4) + ' ' + lineEndX + ',' + (lineY + 4)}
            fill={isDark ? '#e2e8f0' : '#1e293b'} />
          {/* Ticks and labels */}
          {ticks.map(function(v, i) {
            const x = toSvgX(v)
            const isMajor = i % showEvery === 0
            return (
              <g key={i}>
                <line x1={x} y1={lineY - (isMajor ? 10 : 5)} x2={x} y2={lineY + (isMajor ? 10 : 5)}
                  stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} strokeWidth={1} />
                {isMajor && (
                  <text x={x} y={lineY + 24} textAnchor="middle" fontSize={9}
                    fill={isDark ? '#94a3b8' : '#64748b'}>{formatTick(v)}</text>
                )}
              </g>
            )
          })}
          {/* Plotted points */}
          {plottedPoints.map(function(v, i) {
            const x = toSvgX(v)
            return (
              <g key={'p' + i}>
                <circle cx={x} cy={lineY} r={7}
                  fill={SHADE_COLORS[i % SHADE_COLORS.length]} opacity={0.85}
                  style={{ cursor: 'pointer' as const }}
                  onClick={function(e) { e.stopPropagation(); togglePoint(v) }} />
                <rect x={x - 14} y={lineY - 30} width={28} height={14} rx={3}
                  fill={isDark ? '#1e293b' : '#ffffff'} opacity={0.85} />
                <text x={x} y={lineY - 18} textAnchor={'middle' as const} fontSize={11} fontWeight={700}
                  fill={isDark ? '#fbbf24' : '#b45309'}>{formatTick(v)}</text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Quick step select */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[0.5, 1, 2, 5, 10].map(function(st) {
          return (
            <button key={st} onClick={function() { setStep(st) }}
              style={{
                padding: '2px 7px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
                background: step === st ? 'rgba(5,150,105,0.15)' : s.surface,
                border: step === st ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
                color: step === st ? '#34d399' : s.text,
              }}>{st}</button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Polygon Widget
// ============================================================

export function CanvasPolygon({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { sides?: number; showLabels?: boolean; showAngles?: boolean }
  const sides = cfg.sides || 5
  const showLabels = cfg.showLabels !== false
  const showAngles = cfg.showAngles === true
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)

  const setSides = useCallback(function(n: number) {
    const clamped = Math.max(3, Math.min(12, n))
    updateConfig({ sides: clamped, showLabels: showLabels, showAngles: showAngles })
  }, [showLabels, showAngles, updateConfig])

  const toggleLabels = useCallback(function() {
    updateConfig({ sides: sides, showLabels: !showLabels, showAngles: showAngles })
  }, [sides, showLabels, showAngles, updateConfig])

  const toggleAngles = useCallback(function() {
    updateConfig({ sides: sides, showLabels: showLabels, showAngles: !showAngles })
  }, [sides, showLabels, showAngles, updateConfig])

  // SVG geometry
  const svgSize = 220
  const cx = svgSize / 2
  const cy = svgSize / 2 + 10
  const r = 85

  // Compute vertices
  const vertices = useMemo(function() {
    const result: Array<{x: number; y: number; label: string}> = []
    for (let i = 0; i < sides; i++) {
      const angle = (2 * Math.PI * i) / sides - Math.PI / 2
      result.push({
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        label: String.fromCharCode(65 + i),
      })
    }
    return result
  }, [sides, cx, cy, r])

  // Interior angle of a regular n-gon: ((n-2) * 180) / n
  const interiorAngle = Math.round(((sides - 2) * 180) / sides * 10) / 10

  // Perimeter and area for regular polygon with circumradius r
  const sideLength = 2 * r * Math.sin(Math.PI / sides)
  const perimeter = sides * sideLength
  const area = 0.5 * sides * r * r * Math.sin(2 * Math.PI / sides)

  // Build polygon path
  const polyPath = useMemo(function() {
    if (vertices.length < 3) return ''
    let d = 'M ' + vertices[0].x + ' ' + vertices[0].y
    for (let i = 1; i < vertices.length; i++) {
      d = d + ' L ' + vertices[i].x + ' ' + vertices[i].y
    }
    return d + ' Z'
  }, [vertices])

  // Label offset positions (slightly outside the polygon)
  const labelPositions = useMemo(function() {
    return vertices.map(function(v) {
      const dx = v.x - cx
      const dy = v.y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist === 0) return { x: v.x, y: v.y - 18 }
      return { x: v.x + (dx / dist) * 18, y: v.y + (dy / dist) * 18 }
    })
  }, [vertices, cx, cy])

  // Angle label positions (slightly inside the polygon near each vertex)
  const anglePositions = useMemo(function() {
    return vertices.map(function(v, i) {
      const prev = vertices[(i + sides - 1) % sides]
      const next = vertices[(i + 1) % sides]
      // Direction from vertex toward centroid
      const dx = cx - v.x
      const dy = cy - v.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist === 0) return { x: v.x, y: v.y + 20 }
      const offset = 22
      return { x: v.x + (dx / dist) * offset, y: v.y + (dy / dist) * offset }
    })
  }, [vertices, cx, cy, sides])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Polygon</span>
        <button onClick={function() { toggleLabels() }} style={{
          padding: '2px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer' as const,
          background: showLabels ? 'rgba(5,150,105,0.15)' : s.surface,
          border: showLabels ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
          color: showLabels ? '#34d399' : s.text,
        }}>Labels</button>
        <button onClick={function() { toggleAngles() }} style={{
          padding: '2px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer' as const,
          background: showAngles ? 'rgba(5,150,105,0.15)' : s.surface,
          border: showAngles ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
          color: showAngles ? '#34d399' : s.text,
        }}>Angles</button>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.accent, marginLeft: 'auto' }}>{interiorAngle} deg</span>
        <span style={{ fontSize: 10, color: s.text }}>P: {perimeter.toFixed(1)}  A: {area.toFixed(1)}</span>
      </div>

      {/* SVG */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={svgSize} height={svgSize} viewBox={'0 0 ' + svgSize + ' ' + svgSize}>
          {/* Polygon fill */}
          <path d={polyPath}
            fill={isDark ? 'rgba(52,211,153,0.06)' : 'rgba(5,150,105,0.04)'}
            stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={2} />
          {/* Vertex dots */}
          {vertices.map(function(v, i) {
            return <circle key={i} cx={v.x} cy={v.y} r={4} fill="#34d399" />
          })}
          {/* Vertex labels */}
          {showLabels && labelPositions.map(function(pos, i) {
            return (
              <text key={'lbl' + i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                fontSize={12} fontWeight={600} fill={isDark ? '#e2e8f0' : '#1e293b'}>
                {vertices[i].label}
              </text>
            )
          })}
          {/* Angle labels */}
          {showAngles && anglePositions.map(function(pos, i) {
            return (
              <text key={'ang' + i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                fontSize={9} fill="#f59e0b" fontWeight={600}>
                {interiorAngle}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Quick sides select */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function(n) {
          return (
            <button key={n} onClick={function() { setSides(n) }}
              style={{
                padding: '2px 7px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
                background: sides === n ? 'rgba(5,150,105,0.15)' : s.surface,
                border: sides === n ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
                color: sides === n ? '#34d399' : s.text,
              }}>{n}</button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Coordinate Plane Widget
// ============================================================

export function CanvasCoordinatePlane({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { range?: number; step?: number; points?: Array<{x: number; y: number}> }
  const range = cfg.range ?? 10
  const step = cfg.step ?? 1
  const points = (cfg.points || []) as Array<{x: number; y: number}>
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)
  const svgRef = useRef<SVGSVGElement>(null)

  const setRange = useCallback(function(v: number) {
    const clamped = Math.max(1, Math.min(50, v))
    updateConfig({ range: clamped, step: step, points: points })
  }, [step, points, updateConfig])

  const setStep = useCallback(function(v: number) {
    const clamped = Math.max(0.5, Math.min(5, v))
    updateConfig({ range: range, step: clamped, points: points })
  }, [range, points, updateConfig])

  const clearPoints = useCallback(function() {
    updateConfig({ range: range, step: step, points: [] })
  }, [range, step, updateConfig])

  const addPoint = useCallback(function(px: number, py: number) {
    // Check if point exists
    const exists = points.some(function(p) { return p.x === px && p.y === py })
    var next: Array<{x: number; y: number}>
    if (exists) {
      next = points.filter(function(p) { return !(p.x === px && p.y === py) })
    } else {
      next = points.concat([{ x: px, y: py }])
    }
    updateConfig({ range: range, step: step, points: next })
  }, [range, step, points, updateConfig])

  // SVG geometry
  const svgSize = 260
  const pad = 28
  const originX = svgSize / 2
  const originY = svgSize / 2
  const scale = (svgSize / 2 - pad) / range

  const handleSvgClick = useCallback(function(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const svgX = (e.clientX - ctm.e) / ctm.a
    const svgY = (e.clientY - ctm.f) / ctm.d
    // Convert to math coordinates
    const mathX = (svgX - originX) / scale
    const mathY = (originY - svgY) / scale
    // Snap to step
    var snappedX = Math.round(mathX / step) * step
    var snappedY = Math.round(mathY / step) * step
    snappedX = Math.round(snappedX * 1000) / 1000
    snappedY = Math.round(snappedY * 1000) / 1000
    if (Math.abs(snappedX) > range || Math.abs(snappedY) > range) return
    addPoint(snappedX, snappedY)
  }, [originX, originY, scale, step, range, addPoint])

  // Helper — defined before useMemo to avoid TDZ crash
  function formatCoord(v: number) {
    if (Number.isInteger(v)) return String(v)
    return String(Math.round(v * 10) / 10)
  }

  // Grid lines
  const gridLines = useMemo(function() {
    const lines: Array<{x1: number; y1: number; x2: number; y2: number}> = []
    for (var g = -range; g <= range; g += step) {
      var gv = Math.round(g * 1000) / 1000
      var px = originX + gv * scale
      var py = originY - gv * scale
      lines.push({ x1: px, y1: originY - range * scale, x2: px, y2: originY + range * scale })
      lines.push({ x1: originX - range * scale, y1: py, x2: originX + range * scale, y2: py })
    }
    return lines
  }, [range, step, originX, originY, scale])

  // Tick labels
  const tickLabels = useMemo(function() {
    const labels: Array<{x: number; y: number; text: string}> = []
    var labelStep = step
    if ((range * 2) / labelStep > 20) labelStep = step * Math.ceil(((range * 2) / labelStep) / 20) * labelStep
    for (var t = -range; t <= range; t += labelStep) {
      var tv = Math.round(t * 1000) / 1000
      var px = originX + tv * scale
      var py = originY - tv * scale
      if (Math.abs(tv) > 0.001) {
        labels.push({ x: px, y: originY + 14, text: formatCoord(tv) })
        labels.push({ x: originX - 10, y: py + 3, text: formatCoord(tv) })
      }
    }
    return labels
  }, [range, step, originX, originY, scale])

  const axisColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const tickColor = isDark ? '#94a3b8' : '#64748b'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Coordinate Plane</span>
        <span style={{ fontSize: 10, color: s.text }}>Range:</span>
        <input type="number" value={range} min={1} max={50} step={1} onChange={function(e) { setRange(Number(e.target.value)) }} style={{ ...s.input, width: 42 }} />
        <span style={{ fontSize: 10, color: s.text }}>Step:</span>
        <input type="number" value={step} min={0.5} max={5} step={0.5} onChange={function(e) { setStep(Number(e.target.value)) }} style={{ ...s.input, width: 42 }} />
        <button onClick={clearPoints} style={{
          padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' as const,
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5',
        }}>Clear</button>
        <span style={{ fontSize: 10, color: s.text, marginLeft: 'auto' }}>{points.length} pts</span>
      </div>

      {/* SVG */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg ref={svgRef} width={svgSize} height={svgSize} viewBox={'0 0 ' + svgSize + ' ' + svgSize}
          onClick={handleSvgClick} style={{ cursor: 'crosshair' as const }}>
          {/* Grid */}
          {gridLines.map(function(l, i) {
            return <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={gridColor} strokeWidth={1} />
          })}
          {/* Axes */}
          <line x1={0} y1={originY} x2={svgSize} y2={originY} stroke={axisColor} strokeWidth={1.5} />
          <line x1={originX} y1={0} x2={originX} y2={svgSize} stroke={axisColor} strokeWidth={1.5} />
          {/* Tick labels */}
          {tickLabels.map(function(lbl, i) {
            return (
              <text key={i} x={lbl.x} y={lbl.y} textAnchor={i % 2 === 0 ? "middle" : "end"}
                fontSize={8} fill={tickColor}>{lbl.text}</text>
            )
          })}
          {/* Origin label */}
          <text x={originX - 8} y={originY + 14} textAnchor="end" fontSize={8} fill={tickColor}>0</text>
          {/* Points */}
          {points.map(function(p, i) {
            const px = originX + p.x * scale
            const py = originY - p.y * scale
            return (
              <g key={'pt' + i}>
                <circle cx={px} cy={py} r={6}
                  fill={SHADE_COLORS[i % SHADE_COLORS.length]} opacity={0.9}
                  style={{ cursor: 'pointer' as const }}
                  onClick={function(e) { e.stopPropagation(); addPoint(p.x, p.y) }} />
                <text x={px + 9} y={py - 5} fontSize={8} fontWeight={600}
                  fill={isDark ? '#e2e8f0' : '#1e293b'}>
                  {'(' + formatCoord(p.x) + ', ' + formatCoord(p.y) + ')'}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Quick range select */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[5, 10, 20, 50].map(function(r) {
          return (
            <button key={r} onClick={function() { setRange(r) }}
              style={{
                padding: '2px 7px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
                background: range === r ? 'rgba(5,150,105,0.15)' : s.surface,
                border: range === r ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
                color: range === r ? '#34d399' : s.text,
              }}>{'+/-' + r}</button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Venn Diagram Widget
// ============================================================

export function CanvasVennDiagram({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { circleCount?: 2 | 3; labels?: string[]; regionText?: Record<string, string> }
  const circleCount = cfg.circleCount || 2
  const labels = (cfg.labels || (circleCount === 2 ? ['A', 'B'] : ['A', 'B', 'C'])) as string[]
  const regionText = (cfg.regionText || {}) as Record<string, string>
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)
  const svgRef = useRef<SVGSVGElement>(null)

  const selectedRegion = useState<string | null>(null)
  const selRegion = selectedRegion[0]
  const setSelRegion = selectedRegion[1]

  const setCircleCount = useCallback(function(n: 2 | 3) {
    updateConfig({ circleCount: n, labels: labels, regionText: regionText })
    setSelRegion(null)
  }, [labels, regionText, updateConfig, setSelRegion])

  const setLabel = useCallback(function(idx: number, val: string) {
    const next = labels.slice()
    next[idx] = val
    updateConfig({ circleCount: circleCount, labels: next, regionText: regionText })
  }, [circleCount, labels, regionText, updateConfig])

  const setRegionText = useCallback(function(region: string, text: string) {
    const next = Object.assign({}, regionText)
    if (text) {
      next[region] = text
    } else {
      delete next[region]
    }
    updateConfig({ circleCount: circleCount, labels: labels, regionText: next })
  }, [circleCount, labels, regionText, updateConfig])

  // SVG geometry
  const svgW = circleCount === 3 ? 300 : 260
  const svgH = circleCount === 3 ? 280 : 220
  const cxSvg = svgW / 2
  const cySvg = svgH / 2
  const radius = circleCount === 3 ? 72 : 72

  // Circle positions
  const centers = useMemo(function() {
    if (circleCount === 2) {
      const offset = radius * 0.6
      return [
        { x: cxSvg - offset, y: cySvg, key: 'A' },
        { x: cxSvg + offset, y: cySvg, key: 'B' },
      ]
    }
    // 3 circles in equilateral triangle
    const triR = radius * 0.62
    const sin60 = 0.866
    const cos60 = 0.5
    return [
      { x: cxSvg, y: cySvg - triR, key: 'A' },
      { x: cxSvg - triR * sin60, y: cySvg + triR * cos60, key: 'B' },
      { x: cxSvg + triR * sin60, y: cySvg + triR * cos60, key: 'C' },
    ]
  }, [circleCount, cxSvg, cySvg, radius])

  // Region text positions
  const regionTextPos = useMemo(function() {
    const pos: Record<string, {x: number; y: number}> = {}
    if (circleCount === 2) {
      const offset = radius * 0.6
      pos['A'] = { x: cxSvg - offset - radius * 0.35, y: cySvg }
      pos['B'] = { x: cxSvg + offset + radius * 0.35, y: cySvg }
      pos['AB'] = { x: cxSvg, y: cySvg }
    } else {
      const triR = radius * 0.62
      const sin60 = 0.866
      const cos60 = 0.5
      // Only regions
      pos['A'] = { x: cxSvg, y: cySvg - triR - radius * 0.15 }
      pos['B'] = { x: cxSvg - triR * sin60 - radius * 0.2, y: cySvg + triR * cos60 + radius * 0.18 }
      pos['C'] = { x: cxSvg + triR * sin60 + radius * 0.2, y: cySvg + triR * cos60 + radius * 0.18 }
      // Pair intersections
      pos['AB'] = { x: cxSvg - triR * sin60 * 0.5, y: cySvg - triR * 0.15 }
      pos['AC'] = { x: cxSvg + triR * sin60 * 0.5, y: cySvg - triR * 0.15 }
      pos['BC'] = { x: cxSvg, y: cySvg + triR * cos60 * 0.7 }
      // Triple intersection
      pos['ABC'] = { x: cxSvg, y: cySvg + triR * 0.05 }
    }
    return pos
  }, [circleCount, cxSvg, cySvg, radius])

  // Hit test: determine region from SVG coordinates
  const detectRegion = useCallback(function(svgX: number, svgY: number): string | null {
    const inCircles: string[] = []
    for (let i = 0; i < centers.length; i++) {
      const c = centers[i]
      const dx = svgX - c.x
      const dy = svgY - c.y
      if (dx * dx + dy * dy <= radius * radius) {
        inCircles.push(c.key)
      }
    }
    if (inCircles.length === 0) return null
    inCircles.sort()
    return inCircles.join('')
  }, [centers, radius])

  const handleSvgClick = useCallback(function(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const svgX = (e.clientX - ctm.e) / ctm.a
    const svgY = (e.clientY - ctm.f) / ctm.d
    const region = detectRegion(svgX, svgY)
    setSelRegion(region)
  }, [detectRegion, setSelRegion])

  const fillA = isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.15)'
  const fillB = isDark ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.15)'
  const fillC = isDark ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.15)'
  const strokeColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.2)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Venn Diagram</span>
        {([2, 3] as const).map(function(n) {
          return (
            <button key={n} onClick={function() { setCircleCount(n) }} style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer' as const,
              background: circleCount === n ? 'rgba(5,150,105,0.15)' : s.surface,
              border: circleCount === n ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
              color: circleCount === n ? '#34d399' : s.text,
            }}>{n} circles</button>
          )
        })}
        {/* Label inputs */}
        {labels.map(function(lbl, i) {
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <input value={lbl} onChange={function(e) { setLabel(i, e.target.value) }}
                style={{ ...s.input, width: 24, fontSize: 10, textAlign: 'center' as const }} />
            </span>
          )
        })}
      </div>

      {/* Region text input */}
      {selRegion && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.accent, fontWeight: 600 }}>
            {selRegion.split('').join(' \u2229 ')}
          </span>
          <input
            value={regionText[selRegion] || ''}
            onChange={function(e) { setRegionText(selRegion, e.target.value) }}
            placeholder="Type here..."
            style={{ ...s.input, flex: 1, fontSize: 10, minWidth: 80 }}
          />
          <button onClick={function() { setSelRegion(null) }} style={{
            padding: '1px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer' as const,
            background: s.surface, border: '1px solid ' + s.border, color: s.text,
          }}>x</button>
        </div>
      )}

      {/* SVG */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg ref={svgRef} width={svgW} height={svgH} viewBox={'0 0 ' + svgW + ' ' + svgH}
          onClick={handleSvgClick} style={{ cursor: 'pointer' as const }}>
          {/* Circles */}
          {centers.map(function(c, i) {
            const fill = i === 0 ? fillA : i === 1 ? fillB : fillC
            return <circle key={i} cx={c.x} cy={c.y} r={radius} fill={fill} stroke={strokeColor} strokeWidth={1.5} />
          })}
          {/* Circle labels */}
          {centers.map(function(c, i) {
            const labelY = c.y - radius - 8
            return (
              <text key={'clbl' + i} x={c.x} y={labelY} textAnchor="middle" fontSize={12}
                fontWeight={600} fill={isDark ? '#e2e8f0' : '#1e293b'}>{labels[i] || c.key}</text>
            )
          })}
          {/* Region text */}
          {Object.keys(regionTextPos).map(function(region) {
            const text = regionText[region]
            if (!text) return null
            const pos = regionTextPos[region]
            if (!pos) return null
            return (
              <text key={region} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                fontSize={10} fontWeight={500} fill={isDark ? '#e2e8f0' : '#1e293b'}>
                {text}
              </text>
            )
          })}
          {/* Selection highlight */}
          {selRegion && regionTextPos[selRegion] && (
            <circle
              cx={regionTextPos[selRegion].x} cy={regionTextPos[selRegion].y} r={18}
              fill="none" stroke="#34d399" strokeWidth={1} strokeDasharray="3 2" opacity={0.6}
            />
          )}
        </svg>
      </div>

      {/* Info */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontSize: 9, color: s.text }}>Click a region to add text</span>
      </div>
    </div>
  )
}

// ============================================================
// Bar Chart Widget
// ============================================================

export function CanvasBarChart({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { categories?: string[]; values?: number[]; title?: string }
  const categories = (cfg.categories || ['A', 'B', 'C', 'D']) as string[]
  const values = (cfg.values || [3, 7, 5, 9]) as number[]
  const title = cfg.title || ''
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)

  const setTitle = useCallback(function(t: string) {
    updateConfig({ categories: categories, values: values, title: t })
  }, [categories, values, updateConfig])

  const setCategory = useCallback(function(idx: number, val: string) {
    const next = categories.slice()
    next[idx] = val
    updateConfig({ categories: next, values: values, title: title })
  }, [categories, values, title, updateConfig])

  const setValue = useCallback(function(idx: number, val: number) {
    const next = values.slice()
    next[idx] = val
    updateConfig({ categories: categories, values: next, title: title })
  }, [categories, values, title, updateConfig])

  const addCategory = useCallback(function() {
    const next = categories.concat(['Item ' + (categories.length + 1)])
    const nextV = values.concat([5])
    updateConfig({ categories: next, values: nextV, title: title })
  }, [categories, values, title, updateConfig])

  const removeCategory = useCallback(function(idx: number) {
    if (categories.length <= 1) return
    const next = categories.filter(function(_, i) { return i !== idx })
    const nextV = values.filter(function(_, i) { return i !== idx })
    updateConfig({ categories: next, values: nextV, title: title })
  }, [categories, values, title, updateConfig])

  // Chart geometry
  const chartW = 300
  const chartH = 170
  const padLeft = 40
  const padBottom = 28
  const padTop = 22
  const plotW = chartW - padLeft - 10
  const plotH = chartH - padBottom - padTop

  // Auto-scale Y axis
  const maxVal = values.reduce(function(a, b) { return Math.max(a, b) }, 0)
  const yScale = useMemo(function() {
    if (maxVal <= 0) return { max: 10, step: 2 }
    const rough = maxVal * 1.15
    const mag = Math.pow(10, Math.floor(Math.log10(rough)))
    const norm = rough / mag
    var niceNorm: number
    if (norm <= 1.5) niceNorm = 2
    else if (norm <= 3) niceNorm = 3
    else if (norm <= 5) niceNorm = 5
    else if (norm <= 7.5) niceNorm = 8
    else niceNorm = 10
    const niceMax = niceNorm * mag
    const tickStep = niceMax / 5
    return { max: niceMax, step: tickStep }
  }, [maxVal])

  const barW = Math.max(12, Math.min(40, (plotW / categories.length) * 0.6))
  const barGap = (plotW - barW * categories.length) / (categories.length + 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Bar Chart</span>
        <input value={title} onChange={function(e) { setTitle(e.target.value) }}
          placeholder="Title..." style={{ ...s.input, width: 80, fontSize: 10 }} />
        <button onClick={addCategory} style={{
          padding: '2px 6px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
          background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa',
        }}>+</button>
      </div>

      {/* Category editors */}
      <div style={{ display: 'flex', gap: 3, overflowX: 'auto', maxHeight: 52, flexWrap: 'wrap' }}>
        {categories.map(function(cat, i) {
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              <input value={cat} onChange={function(e) { setCategory(i, e.target.value) }}
                style={{ ...s.input, width: 44, fontSize: 9, padding: '2px 4px' }} />
              <input type="number" value={values[i]} min={0}
                onChange={function(e) { setValue(i, Math.max(0, Number(e.target.value))) }}
                style={{ ...s.input, width: 36, fontSize: 9, padding: '2px 4px' }} />
              <button onClick={function() { removeCategory(i) }} style={{
                padding: '0 3px', fontSize: 9, cursor: 'pointer' as const,
                background: 'transparent', border: 'none', color: '#f87171', lineHeight: '16px',
              }}>x</button>
            </div>
          )
        })}
      </div>

      {/* SVG Chart */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={chartW} height={chartH} viewBox={'0 0 ' + chartW + ' ' + chartH}>
          {/* Title */}
          {title && (
            <text x={chartW / 2} y={14} textAnchor="middle" fontSize={11} fontWeight={600}
              fill={isDark ? '#e2e8f0' : '#1e293b'}>{title}</text>
          )}
          {/* Y-axis gridlines and labels */}
          {Array.from({ length: 6 }, function(_, i) {
            const val = yScale.step * i
            const y = padTop + plotH - (val / yScale.max) * plotH
            return (
              <g key={'yt' + i}>
                <line x1={padLeft} y1={y} x2={chartW - 10} y2={y}
                  stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth={1} />
                <text x={padLeft - 5} y={y + 3} textAnchor="end" fontSize={8}
                  fill={isDark ? '#94a3b8' : '#64748b'}>{Math.round(val)}</text>
              </g>
            )
          })}
          {/* X-axis line */}
          <line x1={padLeft} y1={padTop + plotH} x2={chartW - 10} y2={padTop + plotH}
            stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} strokeWidth={1} />
          {/* Bars */}
          {categories.map(function(cat, i) {
            const x = padLeft + barGap + i * (barW + barGap)
            const barH = yScale.max > 0 ? (values[i] / yScale.max) * plotH : 0
            const y = padTop + plotH - barH
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={barH} rx={2}
                  fill={SHADE_COLORS[i % SHADE_COLORS.length]} opacity={0.85} />
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={8} fontWeight={600}
                  fill={isDark ? '#e2e8f0' : '#1e293b'}>{values[i]}</text>
                <text x={x + barW / 2} y={padTop + plotH + 14} textAnchor="middle" fontSize={8}
                  fill={isDark ? '#94a3b8' : '#64748b'}>{cat}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ============================================================
// Pie Chart Widget
// ============================================================

export function CanvasPieChart({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { categories?: string[]; values?: number[]; title?: string }
  const categories = (cfg.categories || ['A', 'B', 'C', 'D']) as string[]
  const values = (cfg.values || [3, 7, 5, 9]) as number[]
  const title = cfg.title || ''
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)

  const setTitle = useCallback(function(t: string) {
    updateConfig({ categories: categories, values: values, title: t })
  }, [categories, values, updateConfig])

  const setCategory = useCallback(function(idx: number, val: string) {
    const next = categories.slice()
    next[idx] = val
    updateConfig({ categories: next, values: values, title: title })
  }, [categories, values, title, updateConfig])

  const setValue = useCallback(function(idx: number, val: number) {
    const next = values.slice()
    next[idx] = val
    updateConfig({ categories: categories, values: next, title: title })
  }, [categories, values, title, updateConfig])

  const addCategory = useCallback(function() {
    const next = categories.concat(['Item ' + (categories.length + 1)])
    const nextV = values.concat([5])
    updateConfig({ categories: next, values: nextV, title: title })
  }, [categories, values, title, updateConfig])

  const removeCategory = useCallback(function(idx: number) {
    if (categories.length <= 1) return
    const next = categories.filter(function(_, i) { return i !== idx })
    const nextV = values.filter(function(_, i) { return i !== idx })
    updateConfig({ categories: next, values: nextV, title: title })
  }, [categories, values, title, updateConfig])

  // Chart geometry
  const svgW = 240
  const svgH = 200
  const cx = svgW / 2
  const cy = svgH / 2
  const r = 75

  const total = values.reduce(function(a, b) { return a + b }, 0)

  // Compute slices
  const slices = useMemo(function() {
    if (total <= 0) return []
    const result: Array<{d: string; color: string; midAngle: number; pct: string; label: string}> = []
    var currentAngle = -Math.PI / 2
    for (let i = 0; i < values.length; i++) {
      const val = values[i]
      const sliceAngle = (val / total) * 2 * Math.PI
      const endAngle = currentAngle + sliceAngle
      const x1 = cx + r * Math.cos(currentAngle)
      const y1 = cy + r * Math.sin(currentAngle)
      const x2 = cx + r * Math.cos(endAngle)
      const y2 = cy + r * Math.sin(endAngle)
      const largeArc = sliceAngle > Math.PI ? 1 : 0
      const d = 'M ' + cx + ' ' + cy + ' L ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + ' Z'
      const midAngle = currentAngle + sliceAngle / 2
      const pct = Math.round((val / total) * 100) + '%'
      result.push({ d: d, color: SHADE_COLORS[i % SHADE_COLORS.length], midAngle: midAngle, pct: pct, label: categories[i] })
      currentAngle = endAngle
    }
    return result
  }, [values, total, cx, cy, r, categories])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Pie Chart</span>
        <input value={title} onChange={function(e) { setTitle(e.target.value) }}
          placeholder="Title..." style={{ ...s.input, width: 80, fontSize: 10 }} />
        <button onClick={addCategory} style={{
          padding: '2px 6px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
          background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa',
        }}>+</button>
      </div>

      {/* Category editors */}
      <div style={{ display: 'flex', gap: 3, overflowX: 'auto', maxHeight: 52, flexWrap: 'wrap' }}>
        {categories.map(function(cat, i) {
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              <input value={cat} onChange={function(e) { setCategory(i, e.target.value) }}
                style={{ ...s.input, width: 44, fontSize: 9, padding: '2px 4px' }} />
              <input type="number" value={values[i]} min={0}
                onChange={function(e) { setValue(i, Math.max(0, Number(e.target.value))) }}
                style={{ ...s.input, width: 36, fontSize: 9, padding: '2px 4px' }} />
              <button onClick={function() { removeCategory(i) }} style={{
                padding: '0 3px', fontSize: 9, cursor: 'pointer' as const,
                background: 'transparent', border: 'none', color: '#f87171', lineHeight: '16px',
              }}>x</button>
            </div>
          )
        })}
      </div>

      {/* SVG Chart */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={svgW} height={svgH} viewBox={'0 0 ' + svgW + ' ' + svgH}>
          {/* Title */}
          {title && (
            <text x={cx} y={14} textAnchor="middle" fontSize={11} fontWeight={600}
              fill={isDark ? '#e2e8f0' : '#1e293b'}>{title}</text>
          )}
          {slices.map(function(slice, i) {
            const labelR = r * 0.62
            const lx = cx + labelR * Math.cos(slice.midAngle)
            const ly = cy + labelR * Math.sin(slice.midAngle)
            return (
              <g key={i}>
                <path d={slice.d} fill={slice.color} opacity={0.85}
                  stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} strokeWidth={1} />
                {slice.pct !== '0%' && (
                  <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
                    fontSize={9} fontWeight={600} fill={isDark ? '#e2e8f0' : '#1e293b'}>
                    {slice.pct}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {categories.map(function(cat, i) {
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: SHADE_COLORS[i % SHADE_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: s.text }}>{cat}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Protractor Widget — Measure & draw angles
// ============================================================

export function CanvasProtractor({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { rotation?: number; measureAngle?: number }
  var rotation = cfg.rotation ?? 0
  var measureAngle = cfg.measureAngle ?? 45
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)
  const { stampLine } = useStampToCanvas(element)
  var ctx: StampCtx = { ex: element.x, ey: element.y }

  const setMeasureAngle = useCallback(function(a: number) {
    var clamped = Math.max(0, Math.min(180, Math.round(a)))
    updateConfig({ rotation: rotation, measureAngle: clamped })
  }, [rotation, updateConfig])

  // SVG geometry
  var svgW = 320
  var svgH = 200
  var cx = svgW / 2
  var cy = svgH * 0.6
  var R = 140
  var innerR = 110

  // Draw angle arms on canvas
  var drawAngleOnCanvas = useCallback(function() {
    var armLen = 120
    var rad0 = -Math.PI / 2
    var radA = (measureAngle - 90) * Math.PI / 180
    stampLine(ctx, cx, cy, cx + armLen * Math.cos(rad0), cy + armLen * Math.sin(rad0), '#3b82f6', 2)
    stampLine(ctx, cx, cy, cx + armLen * Math.cos(radA), cy + armLen * Math.sin(radA), '#3b82f6', 2)
  }, [stampLine, ctx, cx, cy, measureAngle])

  // Build degree ticks
  var ticks: Array<{ x1: number; y1: number; x2: number; y2: number; label: string; major: boolean }> = []
  for (var deg = 0; deg <= 180; deg += 1) {
    var aRad = (deg - 90) * Math.PI / 180
    var isMajor = deg % 10 === 0
    var isMid = deg % 5 === 0
    var outerR = isMajor ? R : isMid ? R - 6 : R - 3
    ticks.push({
      x1: cx + innerR * Math.cos(aRad), y1: cy + innerR * Math.sin(aRad),
      x2: cx + outerR * Math.cos(aRad), y2: cy + outerR * Math.sin(aRad),
      label: isMajor ? '' + deg : '', major: isMajor,
    })
  }

  // Outer scale (180 to 0, reversed)
  var outerTicks: Array<{ x1: number; y1: number; x2: number; y2: number; label: string }> = []
  for (var d = 0; d <= 180; d += 10) {
    var a = (d - 90) * Math.PI / 180
    outerTicks.push({
      x1: cx + (R + 2) * Math.cos(a), y1: cy + (R + 2) * Math.sin(a),
      x2: cx + (R + 8) * Math.cos(a), y2: cy + (R + 8) * Math.sin(a),
      label: '' + (180 - d),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Protractor</span>
        <input type="range" min={0} max={180} value={measureAngle}
          onChange={function(e) { setMeasureAngle(Number(e.target.value)) }}
          style={{ width: 70, cursor: 'pointer' as const }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: s.accent }}>{measureAngle} deg</span>
      </div>
      {/* Protractor SVG */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <svg width={svgW} height={svgH} viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ overflow: 'hidden' as const }}>
          <g transform={'rotate(' + rotation + ' ' + cx + ' ' + cy + ')'}>
            <path
              d={'M ' + (cx - R) + ' ' + cy + ' A ' + R + ' ' + R + ' 0 0 1 ' + (cx + R) + ' ' + cy + ' L ' + (cx + innerR) + ' ' + cy + ' A ' + innerR + ' ' + innerR + ' 0 0 0 ' + (cx - innerR) + ' ' + cy + ' Z'}
              fill={isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.05)'}
              stroke={isDark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.6)'} strokeWidth={1.5} />
            <line x1={cx} y1={cy} x2={cx} y2={cy - R}
              stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} strokeWidth={0.5} />
            {ticks.map(function(tick, i) {
              return (
                <g key={'t' + i}>
                  <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
                    stroke={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                    strokeWidth={tick.major ? 1 : 0.5} />
                  {tick.label && (
                    <text x={cx + (R + 12) * Math.cos((i - 90) * Math.PI / 180)}
                      y={cy + (R + 12) * Math.sin((i - 90) * Math.PI / 180) + 3}
                      textAnchor={'middle' as const} fontSize={10} fontWeight={600}
                      fill={isDark ? '#e2e8f0' : '#1e293b'}>{tick.label}</text>
                  )}
                </g>
              )
            })}
            {outerTicks.map(function(tick, i) {
              return (
                <g key={'o' + i}>
                  <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
                    stroke={isDark ? 'rgba(248,113,113,0.3)' : 'rgba(239,68,68,0.25)'} strokeWidth={0.5} />
                  <text x={cx + (R + 24) * Math.cos((i * 10 - 90) * Math.PI / 180)}
                    y={cy + (R + 24) * Math.sin((i * 10 - 90) * Math.PI / 180) + 3}
                    textAnchor={'middle' as const} fontSize={9} fontWeight={600}
                    fill={isDark ? '#fca5a5' : '#dc2626'}>{tick.label}</text>
                </g>
              )
            })}
            <line x1={cx - R - 10} y1={cy} x2={cx + R + 10} y2={cy}
              stroke={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'} strokeWidth={1} />
            <circle cx={cx} cy={cy} r={3} fill={isDark ? '#60a5fa' : '#3b82f6'} />
          </g>
          {/* Angle needle */}
          <line x1={cx} y1={cy}
            x2={cx + (R + 20) * Math.cos((measureAngle - 90) * Math.PI / 180)}
            y2={cy + (R + 20) * Math.sin((measureAngle - 90) * Math.PI / 180)}
            stroke='#f59e0b' strokeWidth={2} strokeDasharray='4 2' opacity={0.8} />
          <path d={'M ' + cx + ' ' + cy + ' L ' + (cx + 35) + ' ' + cy + ' A 35 35 0 ' + (measureAngle > 180 ? 1 : 0) + ' 0 ' + (cx + 35 * Math.cos((measureAngle - 90) * Math.PI / 180)) + ' ' + (cy + 35 * Math.sin((measureAngle - 90) * Math.PI / 180)) + ' Z'}
            fill='rgba(245,158,11,0.15)' stroke='#f59e0b' strokeWidth={1} />
        </svg>
      </div>
      {/* Presets + Draw button */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        {[30, 45, 60, 90, 120, 135, 150, 180].map(function(a) {
          return (
            <button key={a} onClick={function() { setMeasureAngle(a) }}
              style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
                background: measureAngle === a ? 'rgba(245,158,11,0.15)' : s.surface,
                border: measureAngle === a ? '1px solid rgba(245,158,11,0.4)' : '1px solid ' + s.border,
                color: measureAngle === a ? '#f59e0b' : s.text }}>{a} deg</button>
          )
        })}
        <button onClick={drawAngleOnCanvas}
          style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600,
            cursor: 'pointer' as const, background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.4)', color: '#60a5fa' }}>Draw Angle</button>
      </div>
    </div>
  )
}

// ============================================================
// Ruler Widget — Measure length & draw lines
// ============================================================

export function CanvasRuler({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { unit?: string; lineLen?: number; lineAngle?: number }
  var unit = cfg.unit || 'cm'
  var lineLen = cfg.lineLen ?? 10
  var lineAngle = cfg.lineAngle ?? 0
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)
  const { stampLine } = useStampToCanvas(element)
  var ctx: StampCtx = { ex: element.x, ey: element.y }

  var setLineLen = useCallback(function(v: number) {
    updateConfig({ unit: unit, lineLen: Math.max(1, Math.min(30, v)), lineAngle: lineAngle })
  }, [unit, lineAngle, updateConfig])

  var setLineAngle = useCallback(function(v: number) {
    updateConfig({ unit: unit, lineLen: lineLen, lineAngle: v })
  }, [unit, lineLen, updateConfig])

  var setUnit = useCallback(function(u: string) {
    updateConfig({ unit: u, lineLen: lineLen, lineAngle: lineAngle })
  }, [lineLen, lineAngle, updateConfig])

  // Ruler SVG geometry
  var rulerW = 360
  var rulerH = 56
  var svgW = rulerW + 40
  var svgH = rulerH + 70
  var ox = 20
  var oy = 10
  var maxCm = 15
  var maxIn = 6

  // Measurement line overlaid on the ruler
  var linePixelLen = (lineLen / maxCm) * rulerW
  var lineRad = (lineAngle - 90) * Math.PI / 180
  var lineCx = ox + rulerW / 2
  var lineCy = oy + rulerH / 2
  var lx1 = lineCx - (linePixelLen / 2) * Math.cos(lineRad)
  var ly1 = lineCy - (linePixelLen / 2) * Math.sin(lineRad)
  var lx2 = lineCx + (linePixelLen / 2) * Math.cos(lineRad)
  var ly2 = lineCy + (linePixelLen / 2) * Math.sin(lineRad)

  // Draw line on canvas
  var drawLineOnCanvas = useCallback(function() {
    stampLine(ctx, lx1, ly1, lx2, ly2, '#eab308', 2)
  }, [stampLine, ctx, lx1, ly1, lx2, ly2])

  // Build cm ticks
  var cmTicks: Array<{ x: number; h: number; label: string; major: boolean }> = []
  for (var cm = 0; cm <= maxCm; cm++) {
    var x = ox + (cm / maxCm) * rulerW
    cmTicks.push({ x: x, h: cm % 5 === 0 ? 20 : 14, label: '' + cm, major: cm % 5 === 0 })
    if (cm < maxCm) cmTicks.push({ x: x + rulerW / maxCm / 2, h: 8, label: '', major: false })
  }
  // Inch ticks
  var inTicks: Array<{ x: number; h: number; label: string }> = []
  for (var inch = 0; inch <= maxIn; inch++) {
    var xIn = ox + (inch / maxIn) * rulerW
    inTicks.push({ x: xIn, h: 16, label: '' + inch })
    if (inch < maxIn) {
      for (var q = 1; q <= 3; q++) inTicks.push({ x: xIn + (q / 4 / maxIn) * rulerW, h: q === 2 ? 10 : 6, label: '' })
    }
  }

  // Measurement display
  var displayVal = unit === 'inch' ? (lineLen / 2.54).toFixed(2) : lineLen.toFixed(1)
  var displayUnit = unit === 'inch' ? 'in' : 'cm'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Ruler</span>
        <span style={{ fontSize: 10, color: s.text }}>Length:</span>
        <input type="range" min={1} max={30} step={0.5} value={lineLen}
          onChange={function(e) { setLineLen(Number(e.target.value)) }}
          style={{ width: 60, cursor: 'pointer' as const }} />
        <span style={{ fontSize: 10, color: s.text }}>Angle:</span>
        <input type="range" min={0} max={180} value={lineAngle}
          onChange={function(e) { setLineAngle(Number(e.target.value)) }}
          style={{ width: 50, cursor: 'pointer' as const }} />
        {(['cm', 'inch'] as const).map(function(u) {
          return (
            <button key={u} onClick={function() { setUnit(u) }}
              style={{ padding: '1px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer' as const,
                background: unit === u ? 'rgba(5,150,105,0.15)' : s.surface,
                border: unit === u ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
                color: unit === u ? '#34d399' : s.text }}>{u}</button>
          )
        })}
      </div>
      {/* Measurement display */}
      <div style={{ textAlign: 'center' as const }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#eab308' }}>{displayVal}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: s.text, marginLeft: 4 }}>{displayUnit}</span>
      </div>
      {/* Ruler SVG with measurement line */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <svg width={svgW} height={svgH} viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ overflow: 'hidden' as const }}>
          <g>
            <rect x={ox} y={oy} width={rulerW} height={rulerH} rx={3}
              fill={isDark ? 'rgba(234,179,8,0.08)' : 'rgba(234,179,8,0.06)'}
              stroke={isDark ? 'rgba(234,179,8,0.4)' : 'rgba(180,130,0,0.5)'} strokeWidth={1.5} />
            <line x1={ox} y1={oy} x2={ox + rulerW} y2={oy}
              stroke={isDark ? 'rgba(234,179,8,0.5)' : 'rgba(180,130,0,0.6)'} strokeWidth={2} />
            {cmTicks.map(function(tick, i) {
              return (
                <g key={'cm' + i}>
                  <line x1={tick.x} y1={oy} x2={tick.x} y2={oy + tick.h}
                    stroke={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                    strokeWidth={tick.major ? 1 : 0.5} />
                  {tick.label && tick.major && (
                    <text x={tick.x} y={oy + tick.h + 10} textAnchor={'middle' as const} fontSize={9} fontWeight={600}
                      fill={isDark ? '#e2e8f0' : '#1e293b'}>{tick.label}</text>
                  )}
                </g>
              )
            })}
            {inTicks.map(function(tick, i) {
              return (
                <g key={'in' + i}>
                  <line x1={tick.x} y1={oy + rulerH} x2={tick.x} y2={oy + rulerH - tick.h}
                    stroke={isDark ? 'rgba(248,113,113,0.4)' : 'rgba(220,38,38,0.35)'}
                    strokeWidth={tick.label ? 1 : 0.5} />
                  {tick.label && (
                    <text x={tick.x} y={oy + rulerH - tick.h - 3} textAnchor={'middle' as const} fontSize={9} fontWeight={600}
                      fill={isDark ? '#fca5a5' : '#dc2626'}>{tick.label}</text>
                  )}
                </g>
              )
            })}
          </g>
          {/* Measurement line overlay */}
          <line x1={lx1} y1={ly1} x2={lx2} y2={ly2}
            stroke='#ef4444' strokeWidth={3} strokeLinecap='round' opacity={0.9} />
          <circle cx={lx1} cy={ly1} r={5} fill='#ef4444' stroke={isDark ? '#0f172a' : '#ffffff'} strokeWidth={1.5} />
          <circle cx={lx2} cy={ly2} r={5} fill='#ef4444' stroke={isDark ? '#0f172a' : '#ffffff'} strokeWidth={1.5} />
          {/* Length label on the line */}
          <text x={(lx1 + lx2) / 2} y={(ly1 + ly2) / 2 - 10} textAnchor={'middle' as const}
            fontSize={11} fontWeight={700} fill='#ef4444'>{displayVal} {displayUnit}</text>
        </svg>
      </div>
      {/* Draw button + quick lengths */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        {[2, 5, 10, 15, 20].map(function(l) {
          return (
            <button key={l} onClick={function() { setLineLen(l) }}
              style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
                background: lineLen === l ? 'rgba(234,179,8,0.15)' : s.surface,
                border: lineLen === l ? '1px solid rgba(234,179,8,0.4)' : '1px solid ' + s.border,
                color: lineLen === l ? '#eab308' : s.text }}>{l}{unit}</button>
          )
        })}
        <button onClick={drawLineOnCanvas}
          style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600,
            cursor: 'pointer' as const, background: 'rgba(234,179,8,0.15)',
            border: '1px solid rgba(234,179,8,0.4)', color: '#eab308' }}>Draw Line</button>
      </div>
    </div>
  )
}

// ============================================================
// Set Square Widget — Draw triangles
// ============================================================

export function CanvasSetSquare({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { triangleType?: string; showAngles?: boolean; size?: number }
  var triangleType = cfg.triangleType || '45'
  var showAngles = cfg.showAngles ?? true
  var triSize = cfg.size ?? 200
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)
  const { stampLine } = useStampToCanvas(element)
  var ctx: StampCtx = { ex: element.x, ey: element.y }

  var setTriangleType = useCallback(function(t: string) {
    updateConfig({ triangleType: t, showAngles: showAngles, size: triSize })
  }, [showAngles, triSize, updateConfig])

  var toggleAngles = useCallback(function() {
    updateConfig({ triangleType: triangleType, showAngles: !showAngles, size: triSize })
  }, [triangleType, triSize, updateConfig])

  var setSize = useCallback(function(sz: number) {
    updateConfig({ triangleType: triangleType, showAngles: showAngles, size: Math.max(60, Math.min(280, sz)) })
  }, [triangleType, showAngles, updateConfig])

  // Triangle geometry
  var svgW = 300
  var svgH = 280
  var cxS = svgW / 2
  var cyS = svgH / 2
  var size = triSize

  // Compute triangle vertices
  var verts: Array<{ x: number; y: number }> = []
  var rightAngleCorner = ''
  var angleLabels: Array<{ x: number; y: number; text: string }> = []

  if (triangleType === '30') {
    var ax = cxS - size / 2
    var ay = cyS + size / 2
    var bx = cxS + size / 2
    var by = cyS + size / 2
    var hx = cxS - size / 2 + size * Math.cos(60 * Math.PI / 180)
    var hy = cyS + size / 2 - size * Math.sin(60 * Math.PI / 180)
    verts = [{ x: ax, y: ay }, { x: bx, y: by }, { x: hx, y: hy }]
    rightAngleCorner = 'M ' + ax + ' ' + ay + ' L ' + (ax + 15) + ' ' + ay + ' L ' + (ax + 15) + ' ' + (ay - 15) + ' L ' + ax + ' ' + (ay - 15)
    angleLabels = [
      { x: ax - 14, y: ay - 10, text: '90 deg' },
      { x: bx + 8, y: by - 10, text: '30 deg' },
      { x: hx - 18, y: hy - 12, text: '60 deg' },
    ]
  } else {
    var a1x = cxS - size / 2
    var a1y = cyS + size / 2
    var b1x = cxS + size / 2
    var b1y = cyS + size / 2
    var c1x = cxS - size / 2
    var c1y = cyS - size / 2
    verts = [{ x: a1x, y: a1y }, { x: b1x, y: b1y }, { x: c1x, y: c1y }]
    rightAngleCorner = 'M ' + a1x + ' ' + a1y + ' L ' + (a1x + 18) + ' ' + a1y + ' L ' + (a1x + 18) + ' ' + (a1y - 18) + ' L ' + a1x + ' ' + (a1y - 18)
    angleLabels = [
      { x: a1x - 14, y: a1y - 10, text: '90 deg' },
      { x: b1x + 8, y: b1y - 10, text: '45 deg' },
      { x: c1x - 18, y: c1y + 4, text: '45 deg' },
    ]
  }

  var points = verts.map(function(v) { return v.x + ',' + v.y }).join(' ')

  // Draw triangle on canvas
  var drawTriangleOnCanvas = useCallback(function() {
    for (var i = 0; i < verts.length; i++) {
      var j = (i + 1) % verts.length
      stampLine(ctx, verts[i].x, verts[i].y, verts[j].x, verts[j].y, '#8b5cf6', 2)
    }
  }, [stampLine, ctx, verts])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Set Square</span>
        {(['45', '30'] as const).map(function(t) {
          return (
            <button key={t} onClick={function() { setTriangleType(t) }}
              style={{ padding: '2px 7px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
                background: triangleType === t ? 'rgba(5,150,105,0.15)' : s.surface,
                border: triangleType === t ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
                color: triangleType === t ? '#34d399' : s.text }}>{t === '45' ? '45-45-90' : '30-60-90'}</button>
          )
        })}
        <button onClick={toggleAngles}
          style={{ padding: '2px 5px', borderRadius: 3, fontSize: 9, cursor: 'pointer' as const,
            background: showAngles ? 'rgba(59,130,246,0.12)' : s.surface,
            border: showAngles ? '1px solid rgba(59,130,246,0.3)' : '1px solid ' + s.border,
            color: showAngles ? '#60a5fa' : s.text }}>Angles</button>
        <span style={{ fontSize: 10, color: s.text }}>Size:</span>
        <input type="range" min={60} max={280} value={triSize}
          onChange={function(e) { setSize(Number(e.target.value)) }}
          style={{ width: 50, cursor: 'pointer' as const }} />
      </div>
      {/* Triangle SVG */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <svg width={svgW} height={svgH} viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ overflow: 'hidden' as const }}>
          <polygon points={points}
            fill={isDark ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.04)'}
            stroke={isDark ? 'rgba(139,92,246,0.5)' : 'rgba(109,40,217,0.5)'} strokeWidth={2} />
          <path d={rightAngleCorner} fill='none'
            stroke={isDark ? 'rgba(139,92,246,0.6)' : 'rgba(109,40,217,0.5)'} strokeWidth={1} />
          <circle cx={cxS} cy={cyS} r={18}
            fill={isDark ? '#0f172a' : '#ffffff'}
            stroke={isDark ? 'rgba(139,92,246,0.3)' : 'rgba(109,40,217,0.25)'} strokeWidth={1} />
          {showAngles && angleLabels.map(function(lbl, i) {
            return (
              <text key={'al' + i} x={lbl.x} y={lbl.y} textAnchor={'middle' as const}
                fontSize={9} fontWeight={600} fill={isDark ? '#c4b5fd' : '#7c3aed'}>{lbl.text}</text>
            )
          })}
        </svg>
      </div>
      {/* Draw button */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={drawTriangleOnCanvas}
          style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600,
            cursor: 'pointer' as const, background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa' }}>Draw Triangle</button>
      </div>
    </div>
  )
}

// ============================================================
// Compass Widget — Draw circles & arcs
// ============================================================

export function CanvasCompass({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { radius?: number; showCircle?: boolean; arcStart?: number; arcEnd?: number }
  var radius = cfg.radius ?? 100
  var showCircle = cfg.showCircle ?? true
  var arcStart = cfg.arcStart ?? 0
  var arcEnd = cfg.arcEnd ?? 360
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)
  const { stampCircle, stampLine } = useStampToCanvas(element)
  var ctx: StampCtx = { ex: element.x, ey: element.y }

  var setRadius = useCallback(function(r: number) {
    updateConfig({ radius: Math.max(20, Math.min(160, Math.round(r))), showCircle: showCircle, arcStart: arcStart, arcEnd: arcEnd })
  }, [showCircle, arcStart, arcEnd, updateConfig])

  var toggleCircle = useCallback(function() {
    updateConfig({ radius: radius, showCircle: !showCircle, arcStart: arcStart, arcEnd: arcEnd })
  }, [radius, showCircle, arcStart, arcEnd, updateConfig])

  var setArcStart = useCallback(function(a: number) {
    updateConfig({ radius: radius, showCircle: showCircle, arcStart: a, arcEnd: arcEnd })
  }, [radius, showCircle, arcEnd, updateConfig])

  var setArcEnd = useCallback(function(a: number) {
    updateConfig({ radius: radius, showCircle: showCircle, arcStart: arcStart, arcEnd: a })
  }, [radius, showCircle, arcStart, updateConfig])

  // SVG geometry
  var svgW = 340
  var svgH = 280
  var cxC = svgW / 2
  var cyC = svgH / 2

  // Drawn circle/arc
  var isFullCircle = Math.abs(arcEnd - arcStart) >= 360
  var arcStartRad = (arcStart - 90) * Math.PI / 180
  var arcEndRad = (arcEnd - 90) * Math.PI / 180
  var largeArc = (arcEnd - arcStart) > 180 ? 1 : 0
  var circleX = cxC + radius * Math.cos(arcStartRad)
  var circleY = cyC + radius * Math.sin(arcStartRad)
  var circleX2 = cxC + radius * Math.cos(arcEndRad)
  var circleY2 = cyC + radius * Math.sin(arcEndRad)
  var arcPath = 'M ' + circleX + ' ' + circleY + ' A ' + radius + ' ' + radius + ' 0 ' + largeArc + ' 1 ' + circleX2 + ' ' + circleY2

  // Draw circle/arc on canvas
  var drawCircleOnCanvas = useCallback(function() {
    if (isFullCircle) {
      stampCircle(ctx, cxC, cyC, radius, '#059669', 2)
    } else {
      // Approximate arc with line segments
      var steps = Math.max(8, Math.round(Math.abs(arcEnd - arcStart) / 3))
      for (var i = 0; i < steps; i++) {
        var a1 = ((arcStart + (arcEnd - arcStart) * i / steps) - 90) * Math.PI / 180
        var a2 = ((arcStart + (arcEnd - arcStart) * (i + 1) / steps) - 90) * Math.PI / 180
        stampLine(ctx, cxC + radius * Math.cos(a1), cyC + radius * Math.sin(a1),
          cxC + radius * Math.cos(a2), cyC + radius * Math.sin(a2), '#059669', 2)
      }
    }
  }, [stampCircle, stampLine, ctx, cxC, cyC, radius, arcStart, arcEnd, isFullCircle])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Compass</span>
        <span style={{ fontSize: 10, color: s.text }}>Radius:</span>
        <input type="range" min={20} max={160} value={radius}
          onChange={function(e) { setRadius(Number(e.target.value)) }}
          style={{ width: 60, cursor: 'pointer' as const }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: s.accent }}>{radius}</span>
        <button onClick={toggleCircle}
          style={{ padding: '2px 5px', borderRadius: 3, fontSize: 9, cursor: 'pointer' as const,
            background: showCircle ? 'rgba(59,130,246,0.12)' : s.surface,
            border: showCircle ? '1px solid rgba(59,130,246,0.3)' : '1px solid ' + s.border,
            color: showCircle ? '#60a5fa' : s.text }}>{showCircle ? 'Hide' : 'Show'} Preview</button>
      </div>
      {/* Arc range */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 9, color: s.text }}>Arc:</span>
        <input type="range" min={0} max={360} value={arcStart}
          onChange={function(e) { setArcStart(Number(e.target.value)) }}
          style={{ width: 45, cursor: 'pointer' as const }} />
        <span style={{ fontSize: 9, color: s.text }}>to</span>
        <input type="range" min={0} max={360} value={arcEnd}
          onChange={function(e) { setArcEnd(Number(e.target.value)) }}
          style={{ width: 45, cursor: 'pointer' as const }} />
        <span style={{ fontSize: 9, fontWeight: 600, color: s.accent }}>{arcStart}-{arcEnd} deg</span>
        <button onClick={function() { setArcStart(0); setArcEnd(360) }}
          style={{ padding: '1px 5px', borderRadius: 3, fontSize: 8, cursor: 'pointer' as const,
            background: s.surface, border: '1px solid ' + s.border, color: s.text }}>Full</button>
      </div>
      {/* Circle/compass SVG */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <svg width={svgW} height={svgH} viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ overflow: 'hidden' as const }}>
          {showCircle && isFullCircle && (
            <circle cx={cxC} cy={cyC} r={radius} fill='none'
              stroke={isDark ? 'rgba(52,211,153,0.5)' : 'rgba(5,150,105,0.5)'}
              strokeWidth={1.5} strokeDasharray='4 2' />
          )}
          {showCircle && !isFullCircle && (
            <path d={arcPath} fill='none'
              stroke={isDark ? 'rgba(52,211,153,0.5)' : 'rgba(5,150,105,0.5)'}
              strokeWidth={1.5} strokeDasharray='4 2' />
          )}
          {showCircle && (
            <line x1={cxC} y1={cyC} x2={cxC + radius} y2={cyC}
              stroke={isDark ? 'rgba(52,211,153,0.3)' : 'rgba(5,150,105,0.3)'} strokeWidth={1} strokeDasharray='3 3' />
          )}
          {showCircle && (
            <text x={cxC + radius / 2} y={cyC - 6} textAnchor={'middle' as const} fontSize={10}
              fill={isDark ? '#34d399' : '#059669'}>r = {radius}</text>
          )}
          {showCircle && <circle cx={cxC} cy={cyC} r={2.5} fill={isDark ? '#34d399' : '#059669'} />}
          {/* Compass arms */}
          <line x1={cxC} y1={cyC + 60} x2={cxC - 15} y2={cyC - 50}
            stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={3} strokeLinecap='round' />
          <line x1={cxC} y1={cyC + 60} x2={cxC + 15} y2={cyC - 50}
            stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={3} strokeLinecap='round' />
          <circle cx={cxC} y1={cyC + 60} r={5} fill={isDark ? '#475569' : '#94a3b8'} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1.5} />
          <circle cx={cxC - 15} cy={cyC - 50} r={2.5} fill={isDark ? '#f87171' : '#ef4444'} />
          <circle cx={cxC + 15} cy={cyC - 50} r={2.5} fill={isDark ? '#34d399' : '#059669'} />
        </svg>
      </div>
      {/* Draw button */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        {[40, 60, 80, 100, 120].map(function(r) {
          return (
            <button key={r} onClick={function() { setRadius(r) }}
              style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
                background: radius === r ? 'rgba(5,150,105,0.15)' : s.surface,
                border: radius === r ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
                color: radius === r ? '#34d399' : s.text }}>r={r}</button>
          )
        })}
        <button onClick={drawCircleOnCanvas}
          style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600,
            cursor: 'pointer' as const, background: 'rgba(5,150,105,0.15)',
            border: '1px solid rgba(5,150,105,0.4)', color: '#34d399' }}>{isFullCircle ? 'Draw Circle' : 'Draw Arc'}</button>
      </div>
    </div>
  )
}

// ============================================================
// Place Value Chart Widget
// ============================================================

export function CanvasPlaceValueChart({ element, isDark }: CanvasWidgetProps) {
  var cfg = element.config as { columns?: string[]; digits?: string[] }
  var columns = (cfg.columns || ['Ones', 'Tens', 'Hundreds', 'Thousands']) as string[]
  var digits = (cfg.digits || ['0', '0', '0', '0']) as string[]
  var updateConfig = useConfigUpdater(element.id)
  var s = ws(isDark)

  var setDigit = useCallback(function(index: number, value: string) {
    var ch = value.slice(-1)
    var d = /^[0-9]$/.test(ch) ? ch : '0'
    var next = digits.slice()
    next[index] = d
    updateConfig({ digits: next, columns: columns })
  }, [digits, columns, updateConfig])

  var clearAll = useCallback(function() {
    updateConfig({ digits: columns.map(function() { return '0' }), columns: columns })
  }, [columns, updateConfig])

  var randomNum = useCallback(function() {
    var len = 1 + Math.floor(Math.random() * 4)
    var num = Math.floor(Math.random() * Math.pow(10, len))
    var str = num.toString().padStart(4, '0')
    updateConfig({ digits: [str[3], str[2], str[1], str[0]], columns: columns })
  }, [columns, updateConfig])

  var fullNumber = digits.slice().reverse().join('')
  var formattedNumber = parseInt(fullNumber, 10).toLocaleString()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Place Value</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {columns.map(function(col, i) {
            return (
              <div key={i} style={{ width: 50, textAlign: 'center' as const, fontSize: 10, color: s.text, fontWeight: 600 }}>
                {col}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {columns.map(function(col, i) {
            return (
              <input key={i} type="text" value={digits[i] || '0'} maxLength={1}
                onChange={function(e) { setDigit(i, e.target.value) }}
                style={{ width: 50, height: 44, fontSize: 28, textAlign: 'center' as const,
                  padding: '3px 6px', borderRadius: 4,
                  border: '1px solid ' + s.border,
                  background: s.input.background, color: s.input.color, outline: 'none' as const }} />
            )
          })}
        </div>
      </div>
      <div style={{ textAlign: 'center' as const, fontSize: 18, fontWeight: 700, color: s.accent }}>
        {formattedNumber}
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' as const }}>
        <button onClick={clearAll}
          style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, cursor: 'pointer' as const,
            background: s.surface, border: '1px solid ' + s.border, color: s.text }}>Clear All</button>
        <button onClick={randomNum}
          style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, cursor: 'pointer' as const,
            background: s.surface, border: '1px solid ' + s.border, color: s.text }}>Random</button>
      </div>
    </div>
  )
}

// ============================================================
// Clock Widget
// ============================================================

export function CanvasClock({ element, isDark }: CanvasWidgetProps) {
  var cfg = element.config as { hours?: number; minutes?: number; showDigital?: boolean }
  var hours = cfg.hours ?? 10
  var minutes = cfg.minutes ?? 30
  var showDigital = cfg.showDigital !== false
  var updateConfig = useConfigUpdater(element.id)
  var s = ws(isDark)

  var setHours = useCallback(function(h: number) {
    updateConfig({ hours: h, minutes: minutes, showDigital: showDigital })
  }, [minutes, showDigital, updateConfig])

  var setMinutes = useCallback(function(m: number) {
    updateConfig({ hours: hours, minutes: m, showDigital: showDigital })
  }, [hours, showDigital, updateConfig])

  var toggleDigital = useCallback(function() {
    updateConfig({ hours: hours, minutes: minutes, showDigital: !showDigital })
  }, [hours, minutes, showDigital, updateConfig])

  var cxC = 100
  var cyC = 100
  var rad = 85
  var minuteAngle = (minutes / 60) * 360 - 90
  var hourAngle = ((hours % 12) / 12) * 360 + (minutes / 60) * 30 - 90
  var minuteRad = minuteAngle * Math.PI / 180
  var hourRad = hourAngle * Math.PI / 180
  var minHandLen = 62
  var hourHandLen = 42
  var minX = cxC + minHandLen * Math.cos(minuteRad)
  var minY = cyC + minHandLen * Math.sin(minuteRad)
  var hourX = cxC + hourHandLen * Math.cos(hourRad)
  var hourY = cyC + hourHandLen * Math.sin(hourRad)

  var timeStr = String(hours) + ':' + (minutes < 10 ? '0' : '') + String(minutes)

  var hourMarks: Array<{ x1: number; y1: number; x2: number; y2: number; major: boolean; num: number }> = []
  for (var hi = 1; hi <= 12; hi++) {
    var hAngle = (hi / 12) * 360 - 90
    var hRad = hAngle * Math.PI / 180
    var isMajor = (hi % 3 === 0)
    var innerR = isMajor ? rad - 10 : rad - 6
    hourMarks.push({
      x1: cxC + innerR * Math.cos(hRad), y1: cyC + innerR * Math.sin(hRad),
      x2: cxC + rad * Math.cos(hRad), y2: cyC + rad * Math.sin(hRad),
      major: isMajor, num: hi
    })
  }

  var minuteTicks: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  for (var mi = 0; mi < 60; mi++) {
    if (mi % 5 !== 0) {
      var mAngle = (mi / 60) * 360 - 90
      var mRad = mAngle * Math.PI / 180
      minuteTicks.push({
        x1: cxC + (rad - 4) * Math.cos(mRad), y1: cyC + (rad - 4) * Math.sin(mRad),
        x2: cxC + rad * Math.cos(mRad), y2: cyC + rad * Math.sin(mRad),
      })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Clock</span>
        {showDigital && (
          <span style={{ fontSize: 14, fontWeight: 700, color: s.accent }}>{timeStr}</span>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' as const }}>
        <svg width={200} height={200} viewBox={'0 0 200 200'}>
          <circle cx={cxC} cy={cyC} r={rad} fill={s.surface} stroke={s.border} strokeWidth={2} />
          {minuteTicks.map(function(m, i) {
            return <line key={'mt' + i} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2}
              stroke={s.text} strokeWidth={0.5} />
          })}
          {hourMarks.map(function(m) {
            var numAngle = (m.num / 12) * 360 - 90
            var numRad = numAngle * Math.PI / 180
            var numR = rad - 20
            return (
              <g key={'hm' + m.num}>
                <line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2}
                  stroke={s.bright} strokeWidth={m.major ? 2.5 : 1.5} />
                <text x={cxC + numR * Math.cos(numRad)}
                  y={cyC + numR * Math.sin(numRad) + 3}
                  textAnchor={'middle' as const} fontSize={m.major ? 13 : 10} fontWeight={m.major ? 700 : 400}
                  fill={s.bright}>{m.num}</text>
              </g>
            )
          })}
          <line x1={cxC} y1={cyC} x2={hourX} y2={hourY} stroke={s.bright} strokeWidth={4} strokeLinecap='round' />
          <line x1={cxC} y1={cyC} x2={minX} y2={minY} stroke={s.accent} strokeWidth={2.5} strokeLinecap='round' />
          <circle cx={cxC} cy={cyC} r={3} fill={s.bright} />
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: s.text }}>Hour</span>
          <input type="range" min={0} max={11} value={hours}
            onChange={function(e) { setHours(Number(e.target.value)) }}
            style={{ flex: 1, cursor: 'pointer' as const }} />
          <span style={{ fontSize: 9, fontWeight: 600, color: s.bright }}>{hours}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: s.text }}>Min</span>
          <input type="range" min={0} max={59} value={minutes}
            onChange={function(e) { setMinutes(Number(e.target.value)) }}
            style={{ flex: 1, cursor: 'pointer' as const }} />
          <span style={{ fontSize: 9, fontWeight: 600, color: s.bright }}>{minutes}</span>
        </div>
        <button onClick={toggleDigital}
          style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer' as const,
            background: s.surface, border: '1px solid ' + s.border, color: s.text, alignSelf: 'center' as const }}>
          {showDigital ? 'Hide Digital' : 'Show Digital'}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Base-10 Blocks Widget
// ============================================================

export function CanvasBase10Blocks({ element, isDark }: CanvasWidgetProps) {
  var cfg = element.config as { ones?: number; tens?: number; hundreds?: number; thousands?: number }
  var ones = cfg.ones ?? 0
  var tens = cfg.tens ?? 0
  var hundreds = cfg.hundreds ?? 0
  var thousands = cfg.thousands ?? 0
  var updateConfig = useConfigUpdater(element.id)
  var s = ws(isDark)

  var setOnes = useCallback(function(v: number) {
    updateConfig({ ones: Math.max(0, Math.min(9, v)), tens: tens, hundreds: hundreds, thousands: thousands })
  }, [tens, hundreds, thousands, updateConfig])

  var setTens = useCallback(function(v: number) {
    updateConfig({ ones: ones, tens: Math.max(0, Math.min(9, v)), hundreds: hundreds, thousands: thousands })
  }, [ones, hundreds, thousands, updateConfig])

  var setHundreds = useCallback(function(v: number) {
    updateConfig({ ones: ones, tens: tens, hundreds: Math.max(0, Math.min(9, v)), thousands: thousands })
  }, [ones, tens, thousands, updateConfig])

  var setThousands = useCallback(function(v: number) {
    updateConfig({ ones: ones, tens: tens, hundreds: hundreds, thousands: Math.max(0, Math.min(9, v)) })
  }, [ones, tens, hundreds, updateConfig])

  var clearAll = useCallback(function() {
    updateConfig({ ones: 0, tens: 0, hundreds: 0, thousands: 0 })
  }, [updateConfig])

  var total = thousands * 1000 + hundreds * 100 + tens * 10 + ones
  var totalStr = total.toLocaleString()

  var blockStroke = isDark ? 'rgba(52,211,153,0.6)' : 'rgba(5,150,105,0.6)'
  var blockFill = isDark ? 'rgba(52,211,153,0.2)' : 'rgba(5,150,105,0.15)'

  function btnStyle() {
    return { padding: '1px 6px' as const, borderRadius: 3, fontSize: 12, cursor: 'pointer' as const,
      background: s.surface, border: '1px solid ' + s.border, color: s.text, fontWeight: 700, lineHeight: '16px' as const }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Base-10 Blocks</span>
      </div>

      {/* Thousands row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, color: s.text, width: 60, flexShrink: 0 }}>Thousands</span>
        <svg width={70} height={70} style={{ flexShrink: 0 }}>
          <polygon points={'60,5 65,0 65,65 60,70'} fill={isDark ? 'rgba(52,211,153,0.12)' : 'rgba(5,150,105,0.1)'} stroke={blockStroke} strokeWidth={0.5} />
          <polygon points={'5,5 10,0 65,0 60,5'} fill={isDark ? 'rgba(52,211,153,0.18)' : 'rgba(5,150,105,0.15)'} stroke={blockStroke} strokeWidth={0.5} />
          <rect x={5} y={5} width={55} height={55} fill={thousands > 0 ? blockFill : s.surface} stroke={blockStroke} strokeWidth={1} />
          {Array.from({ length: 10 }, function(_, row) {
            return Array.from({ length: 10 }, function(_, col) {
              return <rect key={'t' + row + '-' + col} x={5 + col * 5.5} y={5 + row * 5.5} width={5.5} height={5.5}
                fill={thousands > 0 ? blockFill : 'transparent'} stroke={blockStroke} strokeWidth={0.3} />
            })
          })}
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <button onClick={function() { setThousands(thousands - 1) }} style={btnStyle()}>-</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: s.accent, width: 20, textAlign: 'center' as const }}>{thousands}</span>
          <button onClick={function() { setThousands(thousands + 1) }} style={btnStyle()}>+</button>
        </div>
      </div>

      {/* Hundreds row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, color: s.text, width: 60, flexShrink: 0 }}>Hundreds</span>
        <svg width={70} height={70} style={{ flexShrink: 0 }}>
          <rect x={5} y={5} width={60} height={60} fill={hundreds > 0 ? blockFill : s.surface} stroke={blockStroke} strokeWidth={1} />
          {Array.from({ length: 10 }, function(_, row) {
            return Array.from({ length: 10 }, function(_, col) {
              return <rect key={'h' + row + '-' + col} x={5 + col * 6} y={5 + row * 6} width={6} height={6}
                fill={hundreds > 0 ? blockFill : 'transparent'} stroke={blockStroke} strokeWidth={0.3} />
            })
          })}
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <button onClick={function() { setHundreds(hundreds - 1) }} style={btnStyle()}>-</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: s.accent, width: 20, textAlign: 'center' as const }}>{hundreds}</span>
          <button onClick={function() { setHundreds(hundreds + 1) }} style={btnStyle()}>+</button>
        </div>
      </div>

      {/* Tens row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, color: s.text, width: 60, flexShrink: 0 }}>Tens</span>
        <svg width={110} height={24} style={{ flexShrink: 0 }}>
          <rect x={0} y={0} width={100} height={20} fill={tens > 0 ? blockFill : s.surface} stroke={blockStroke} strokeWidth={1} />
          {Array.from({ length: 10 }, function(_, i) {
            return <rect key={'ten' + i} x={i * 10} y={0} width={10} height={20}
              fill={tens > 0 ? blockFill : 'transparent'} stroke={blockStroke} strokeWidth={0.5} />
          })}
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <button onClick={function() { setTens(tens - 1) }} style={btnStyle()}>-</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: s.accent, width: 20, textAlign: 'center' as const }}>{tens}</span>
          <button onClick={function() { setTens(tens + 1) }} style={btnStyle()}>+</button>
        </div>
      </div>

      {/* Ones row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, color: s.text, width: 60, flexShrink: 0 }}>Ones</span>
        <svg width={200} height={24} style={{ flexShrink: 0 }}>
          {Array.from({ length: ones }, function(_, i) {
            return <rect key={'one' + i} x={i * 22} y={2} width={20} height={20}
              fill={blockFill} stroke={blockStroke} strokeWidth={1} rx={2} />
          })}
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <button onClick={function() { setOnes(ones - 1) }} style={btnStyle()}>-</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: s.accent, width: 20, textAlign: 'center' as const }}>{ones}</span>
          <button onClick={function() { setOnes(ones + 1) }} style={btnStyle()}>+</button>
        </div>
      </div>

      {/* Total */}
      <div style={{ textAlign: 'center' as const, fontSize: 16, fontWeight: 700, color: s.accent, marginTop: 2 }}>
        {'Total: ' + totalStr}
      </div>
      <button onClick={clearAll}
        style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, cursor: 'pointer' as const,
          background: s.surface, border: '1px solid ' + s.border, color: s.text, alignSelf: 'center' as const }}>Clear</button>
    </div>
  )
}

// ============================================================
// Pass-through wrappers for MathUtilities components
// These are self-contained utilities that manage their own state.
// ============================================================

export function CanvasMultiplicationGrid({ element, isDark }: CanvasWidgetProps) {
  return <MultiplicationGrid isDark={isDark} />
}
export function CanvasCalculator({ element, isDark }: CanvasWidgetProps) {
  return <Calculator isDark={isDark} />
}
export function CanvasUnitConverter({ element, isDark }: CanvasWidgetProps) {
  return <UnitConverter isDark={isDark} />
}
export function CanvasFormulaReference({ element, isDark }: CanvasWidgetProps) {
  return <FormulaReference band={'all'} isDark={isDark} />
}
export function CanvasProofBuilder({ element, isDark }: CanvasWidgetProps) {
  return <ProofBuilder isDark={isDark} />
}
export function CanvasFlashcards({ element, isDark }: CanvasWidgetProps) {
  return <Flashcards isDark={isDark} />
}

// ============================================================
// Multiplication Array Widget
// ============================================================

export function CanvasMultiplicationArray({ element, isDark }: CanvasWidgetProps) {
  var cfg = element.config as { rows?: number; columns?: number }
  var rows = cfg.rows ?? 3
  var columns = cfg.columns ?? 4
  var updateConfig = useConfigUpdater(element.id)
  var s = ws(isDark)

  var setRows = useCallback(function(r: number) {
    updateConfig({ rows: r, columns: columns })
  }, [columns, updateConfig])

  var setColumns = useCallback(function(c: number) {
    updateConfig({ rows: rows, columns: c })
  }, [rows, updateConfig])

  var product = rows * columns
  var svgW = 240
  var svgH = 200
  var cellSize = Math.min(180 / columns, 150 / rows)
  var gridW = cellSize * columns
  var gridH = cellSize * rows
  var offsetX = (svgW - gridW) / 2 + 15
  var offsetY = (svgH - gridH) / 2 + 12

  var quickFacts: Array<[number, number]> = [[2, 3], [3, 4], [5, 5], [6, 7], [8, 8], [9, 9], [10, 10], [12, 12]]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Multiplication Array</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
          <span style={{ fontSize: 9, color: s.text }}>Rows</span>
          <input type="range" min={1} max={12} value={rows}
            onChange={function(e) { setRows(Number(e.target.value)) }}
            style={{ flex: 1, cursor: 'pointer' as const }} />
          <span style={{ fontSize: 9, fontWeight: 600, color: s.bright }}>{rows}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
          <span style={{ fontSize: 9, color: s.text }}>Cols</span>
          <input type="range" min={1} max={12} value={columns}
            onChange={function(e) { setColumns(Number(e.target.value)) }}
            style={{ flex: 1, cursor: 'pointer' as const }} />
          <span style={{ fontSize: 9, fontWeight: 600, color: s.bright }}>{columns}</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' as const, fontSize: 20, fontWeight: 700, color: s.accent }}>
        {String(rows) + ' \u00D7 ' + String(columns) + ' = ' + String(product)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' as const }}>
        <svg width={svgW} height={svgH} viewBox={'0 0 ' + svgW + ' ' + svgH}>
          <text x={offsetX + gridW / 2} y={offsetY - 2} textAnchor={'middle' as const} fontSize={9} fill={s.text}>
            {String(columns) + ' columns'}
          </text>
          <text x={offsetX - 4} y={offsetY + gridH / 2} textAnchor={'end' as const} fontSize={9} fill={s.text}
            transform={'rotate(-90 ' + String(offsetX - 4) + ' ' + String(offsetY + gridH / 2) + ')'}>
            {String(rows) + ' rows'}
          </text>
          {Array.from({ length: rows }, function(_, r) {
            return Array.from({ length: columns }, function(_, c) {
              var color = SHADE_COLORS[r % SHADE_COLORS.length]
              return <rect key={'a' + r + '-' + c}
                x={offsetX + c * cellSize} y={offsetY + r * cellSize}
                width={cellSize - 1} height={cellSize - 1} rx={2}
                fill={isDark ? color + '33' : color + '44'}
                stroke={isDark ? color + '66' : color + '88'}
                strokeWidth={0.5} />
            })
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' as const, justifyContent: 'center' as const }}>
        {quickFacts.map(function(pair) {
          var isActive = pair[0] === rows && pair[1] === columns
          return (
            <button key={String(pair[0]) + 'x' + String(pair[1])}
              onClick={function() { setRows(pair[0]); setColumns(pair[1]) }}
              style={{ padding: '2px 5px', borderRadius: 3, fontSize: 9, cursor: 'pointer' as const,
                background: isActive ? 'rgba(5,150,105,0.15)' : s.surface,
                border: isActive ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
                color: isActive ? '#34d399' : s.text }}>
              {String(pair[0]) + '\u00D7' + String(pair[1])}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Function Plotter Widget (Mafs-powered, Enhanced)
// Multi-function, categorized presets, grid control
// ============================================================

function parseExpression(expr: string): (x: number) => number {
  try {
    var safe = expr
      .replace(/\bsin\b/g, 'Math.sin')
      .replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan')
      .replace(/\bsqrt\b/g, 'Math.sqrt')
      .replace(/\babs\b/g, 'Math.abs')
      .replace(/\blog\b/g, 'Math.log')
      .replace(/\bln\b/g, 'Math.log')
      .replace(/\bexp\b/g, 'Math.exp')
      .replace(/\bpi\b/g, 'Math.PI')
      .replace(/\be\b/g, 'Math.E')
      .replace(/\^/g, '**')
    var fn = new Function('x', 'return ' + safe) as (x: number) => number
    fn(0)
    return fn
  } catch(e) {
    return function() { return NaN }
  }
}

var PLOT_COLORS = ['#34d399', '#f97316', '#3b82f6', '#ec4899', '#a855f7', '#eab308']

interface PlotFunction {
  id: string
  expr: string
  color: string
  visible: boolean
}

var ENHANCED_PRESETS: { category: string; items: { label: string; expr: string }[] }[] = [
  { category: 'Linear', items: [
    { label: 'y = x', expr: 'x' },
    { label: 'y = 2x + 1', expr: '2*x+1' },
    { label: 'y = -x + 3', expr: '-x+3' },
    { label: 'y = 0.5x', expr: '0.5*x' },
  ]},
  { category: 'Quadratic', items: [
    { label: 'y = x²', expr: 'x^2' },
    { label: 'y = -x²+4', expr: '-x^2+4' },
    { label: 'y = (x-1)²', expr: '(x-1)^2' },
    { label: 'y = 2x²-3', expr: '2*x^2-3' },
  ]},
  { category: 'Cubic', items: [
    { label: 'y = x³', expr: 'x^3' },
    { label: 'y = x³-x', expr: 'x^3-x' },
  ]},
  { category: 'Roots', items: [
    { label: 'y = √x', expr: 'sqrt(x)' },
    { label: 'y = 1/x', expr: '1/x' },
    { label: 'y = |x|', expr: 'abs(x)' },
  ]},
  { category: 'Trig', items: [
    { label: 'y = sin(x)', expr: 'sin(x)' },
    { label: 'y = cos(x)', expr: 'cos(x)' },
    { label: 'y = tan(x)', expr: 'tan(x)' },
  ]},
  { category: 'Exponential/Log', items: [
    { label: 'y = e^x', expr: 'exp(x)' },
    { label: 'y = ln(x)', expr: 'ln(x)' },
    { label: 'y = 2^x', expr: '2^x' },
  ]},
]

export function CanvasFunctionPlotter({ element, isDark }: CanvasWidgetProps) {
  var cfg = element.config as {
    expression?: string
    range?: number
    functions?: PlotFunction[]
    showGrid?: boolean
    xRange?: number
    yRange?: number
  }
  var updateConfig = useConfigUpdater(element.id)
  var s = ws(isDark)

  // Initialize functions array from legacy config or default
  var functions: PlotFunction[] = useMemo(function() {
    if (cfg.functions && cfg.functions.length > 0) return cfg.functions
    // Migrate from legacy single-expression config
    return [{ id: '1', expr: cfg.expression || 'x^2', color: PLOT_COLORS[0], visible: true }]
  }, [cfg.functions, cfg.expression])

  var xRange = cfg.xRange ?? cfg.range ?? 10
  var yRange = cfg.yRange ?? cfg.range ?? 10
  var showGrid = cfg.showGrid !== false

  var updateFunctions = useCallback(function(newFns: PlotFunction[]) {
    updateConfig({ functions: newFns, expression: newFns[0]?.expr || '', range: xRange, xRange: xRange, yRange: yRange, showGrid: showGrid })
  }, [updateConfig, xRange, yRange, showGrid])

  var updateFnExpr = useCallback(function(id: string, expr: string) {
    var newFns = functions.map(function(f) { return f.id === id ? Object.assign({}, f, { expr: expr }) : f })
    updateFunctions(newFns)
  }, [functions, updateFunctions])

  var toggleFn = useCallback(function(id: string) {
    var newFns = functions.map(function(f) { return f.id === id ? Object.assign({}, f, { visible: !f.visible }) : f })
    updateFunctions(newFns)
  }, [functions, updateFunctions])

  var removeFn = useCallback(function(id: string) {
    if (functions.length <= 1) return
    var newFns = functions.filter(function(f) { return f.id !== id })
    updateFunctions(newFns)
  }, [functions, updateFunctions])

  var addFn = useCallback(function() {
    var newId = String(Date.now())
    var color = PLOT_COLORS[functions.length % PLOT_COLORS.length]
    var newFns = functions.concat([{ id: newId, expr: 'x', color: color, visible: true }])
    updateFunctions(newFns)
  }, [functions, updateFunctions])

  var setXRange = useCallback(function(r: number) {
    updateConfig({ functions: functions, expression: functions[0]?.expr || '', range: r, xRange: r, yRange: yRange, showGrid: showGrid })
  }, [functions, yRange, showGrid, updateConfig])

  var setYRange = useCallback(function(r: number) {
    updateConfig({ functions: functions, expression: functions[0]?.expr || '', range: xRange, xRange: xRange, yRange: r, showGrid: showGrid })
  }, [functions, xRange, showGrid, updateConfig])

  var toggleGrid = useCallback(function() {
    updateConfig({ functions: functions, expression: functions[0]?.expr || '', range: xRange, xRange: xRange, yRange: yRange, showGrid: !showGrid })
  }, [functions, xRange, yRange, showGrid, updateConfig])

  var inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  var inputBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'
  var gridColor = isDark ? '#334155' : '#e2e8f0'
  var axisColor = isDark ? '#64748b' : '#94a3b8'

  var [showPresets, setShowPresets] = useState(false)
  var [presetCategory, setPresetCategory] = useState('Linear')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, height: '100%', fontFamily: 'inherit', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>{'Function Plotter'}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={toggleGrid} title={showGrid ? 'Hide grid' : 'Show grid'}
            style={smBtnStyle(showGrid ? '#059669' : undefined, isDark)}>
            {showGrid ? '#' : '#'}
          </button>
          <button onClick={addFn} title="Add function"
            style={smBtnStyle(undefined, isDark)}>+</button>
        </div>
      </div>

      {/* Function inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0, maxHeight: 80, overflowY: 'auto' }}>
        {functions.map(function(fn, idx) {
          return (
            <div key={fn.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Color dot + visibility toggle */}
              <button onClick={function() { toggleFn(fn.id) }}
                style={{ width: 14, height: 14, borderRadius: '50%', background: fn.visible ? fn.color : 'transparent',
                  border: '2px solid ' + fn.color, cursor: 'pointer', flexShrink: 0, padding: 0, opacity: fn.visible ? 1 : 0.4 }} />
              <span style={{ fontSize: 10, color: s.text, flexShrink: 0 }}>{'f' + String(idx + 1) + '(x)='}</span>
              <input type="text" value={fn.expr}
                onChange={function(e) { updateFnExpr(fn.id, e.target.value) }}
                placeholder="x^2, sin(x), ..."
                style={{ flex: 1, padding: '3px 6px', borderRadius: 4, fontSize: 11,
                  fontFamily: 'monospace', border: '1px solid ' + inputBorder,
                  background: inputBg, color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none', minWidth: 0 }} />
              {functions.length > 1 && (
                <button onClick={function() { removeFn(fn.id) }} title="Remove"
                  style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', opacity: 0.6 }}>
                  {'\u00D7'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Mafs graph */}
      <div style={{ flex: 1, minHeight: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)') }}>
        <Mafs
          viewBox={{ x: [-xRange, xRange], y: [-yRange, yRange] }}
          preserveAspectRatio={false}
        >
          {showGrid && (
            <Coordinates.Cartesian
              xAxis={{
                axis: true,
                lines: 1,
                labels: function(v) { return Math.abs(v) < 0.001 ? '0' : String(Math.round(v)) },
              }}
              yAxis={{
                axis: true,
                lines: 1,
                labels: function(v) { return Math.abs(v) < 0.001 ? '0' : String(Math.round(v)) },
              }}
            />
          )}
          {!showGrid && (
            <Coordinates.Cartesian
              xAxis={{ axis: true, lines: 0, labels: function(v) { return Math.abs(v) < 0.001 ? '0' : String(Math.round(v)) } }}
              yAxis={{ axis: true, lines: 0, labels: function(v) { return Math.abs(v) < 0.001 ? '0' : String(Math.round(v)) } }}
            />
          )}
          {functions.map(function(fn) {
            if (!fn.visible || !fn.expr.trim()) return null
            var parsed = parseExpression(fn.expr)
            return (
              <Plot.OfX key={fn.id} y={parsed} color={fn.color} weight={2}
                svgPathProps={{ strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }} />
            )
          })}
          {/* Equation labels */}
          {functions.filter(function(f) { return f.visible && f.expr.trim() }).map(function(fn, idx) {
            return (
              <MafsText key={fn.id + '-label'}
                x={-xRange + 0.5}
                y={yRange - 0.8 - idx * 0.6}
                size={10}
                attach={'nw' as const}
                color={fn.color}
              >
                {'f' + String(idx + 1) + '(x) = ' + fn.expr}
              </MafsText>
            )
          })}
        </Mafs>
      </div>

      {/* Range controls */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9, color: s.text }}>{'X'}</span>
          <input type="range" min={2} max={25} value={xRange}
            onChange={function(e) { setXRange(Number(e.target.value)) }}
            style={{ flex: 1, cursor: 'pointer' }} />
          <span style={{ fontSize: 9, fontWeight: 600, color: s.bright }}>{String(xRange)}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9, color: s.text }}>{'Y'}</span>
          <input type="range" min={2} max={25} value={yRange}
            onChange={function(e) { setYRange(Number(e.target.value)) }}
            style={{ flex: 1, cursor: 'pointer' }} />
          <span style={{ fontSize: 9, fontWeight: 600, color: s.bright }}>{String(yRange)}</span>
        </div>
      </div>

      {/* Presets toggle */}
      <button onClick={function() { setShowPresets(function(p) { return !p }) }}
        style={{
          padding: '4px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer',
          background: showPresets ? 'rgba(5,150,105,0.12)' : inputBg,
          border: '1px solid ' + (showPresets ? 'rgba(5,150,105,0.3)' : inputBorder),
          color: showPresets ? '#34d399' : s.text, textAlign: 'left' as const, flexShrink: 0,
        }}>
        {showPresets ? 'Hide Presets' : 'Quick Presets'}
      </button>

      {/* Preset panel */}
      {showPresets && (
        <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: 120 }}>
          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 6, overflowX: 'auto' }}>
            {ENHANCED_PRESETS.map(function(cat) {
              var isActive = cat.category === presetCategory
              return (
                <button key={cat.category} onClick={function() { setPresetCategory(cat.category) }}
                  style={{ padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600, cursor: 'pointer',
                    background: isActive ? 'rgba(5,150,105,0.15)' : inputBg,
                    border: isActive ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + inputBorder,
                    color: isActive ? '#34d399' : s.text, whiteSpace: 'nowrap' as const }}>
                  {cat.category}
                </button>
              )
            })}
          </div>
          {/* Preset buttons */}
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' as const }}>
            {ENHANCED_PRESETS.filter(function(c) { return c.category === presetCategory })[0]?.items.map(function(p) {
              var isActive = functions.some(function(f) { return f.expr === p.expr })
              return (
                <button key={p.expr}
                  onClick={function() {
                    // If first function is empty or matches, update it; otherwise add new
                    if (!functions[0].expr.trim()) {
                      updateFnExpr(functions[0].id, p.expr)
                    } else {
                      var newId = String(Date.now())
                      var color = PLOT_COLORS[functions.length % PLOT_COLORS.length]
                      updateFunctions(functions.concat([{ id: newId, expr: p.expr, color: color, visible: true }]))
                    }
                  }}
                  style={{
                    padding: '2px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer',
                    fontFamily: 'monospace',
                    background: isActive ? 'rgba(5,150,105,0.15)' : inputBg,
                    border: isActive ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + inputBorder,
                    color: isActive ? '#34d399' : s.text,
                  }}>
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function smBtnStyle(activeColor: string | undefined, isDark: boolean): React.CSSProperties {
  return {
    width: 22, height: 22, borderRadius: 4, fontSize: 13, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', border: 'none', padding: 0,
    background: activeColor || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
    color: activeColor ? '#fff' : (isDark ? '#94a3b8' : '#64748b'),
  }
}

// ============================================================
// Registry helpers (used by CanvasWidgets.tsx)
// ============================================================

export const MATH_WIDGET_KIND_LABELS: Record<string, string> = {
  'math-fraction-circle': 'Fraction Circle',
  'math-fraction-bar': 'Fraction Bar',
  'math-angle-maker': 'Angle Maker',
  'math-number-line': 'Number Line',
  'math-polygon': 'Polygon',
  'math-coordinate-plane': 'Coordinate Plane',
  'math-venn-diagram': 'Venn Diagram',
  'math-bar-chart': 'Bar Chart',
  'math-pie-chart': 'Pie Chart',
  'math-protractor': 'Protractor',
  'math-ruler': 'Ruler',
  'math-set-square': 'Set Square',
  'math-compass': 'Compass',
  'math-place-value': 'Place Value Chart',
  'math-clock': 'Clock',
  'math-base-10': 'Base-10 Blocks',
  'math-multiplication-array': 'Multiplication Array',
  'math-function-plotter': 'Function Plotter',
  'math-multiplication-grid': 'Multiplication Grid',
  'math-flashcards': 'Math Flashcards',
  'math-calculator': 'Scientific Calculator',
  'math-unit-converter': 'Unit Converter',
  'math-formula-reference': 'Formula Reference',
  'math-proof-builder': 'Proof Builder',
}

export function getMathWidgetDefaultConfig(kind: string): Record<string, unknown> {
  switch (kind) {
    case 'math-fraction-circle': return { divisions: 4, shaded: [] }
    case 'math-fraction-bar': return { divisions: 4, shaded: [], orientation: 'horizontal' }
    case 'math-angle-maker': return { degrees: 90 }
    case 'math-number-line': return { min: 0, max: 10, step: 1, plottedPoints: [] }
    case 'math-polygon': return { sides: 5, showLabels: true, showAngles: false }
    case 'math-coordinate-plane': return { range: 10, step: 1, points: [] }
    case 'math-venn-diagram': return { circleCount: 2, labels: ['A', 'B'], regionText: {} }
    case 'math-bar-chart': return { categories: ['A', 'B', 'C', 'D'], values: [3, 7, 5, 9], title: '' }
    case 'math-pie-chart': return { categories: ['A', 'B', 'C', 'D'], values: [3, 7, 5, 9], title: '' }
    case 'math-protractor': return { rotation: 0, measureAngle: 45 }
    case 'math-ruler': return { unit: 'cm', lineLen: 10, lineAngle: 0 }
    case 'math-set-square': return { triangleType: '45', showAngles: true, size: 200 }
    case 'math-compass': return { radius: 100, showCircle: true, arcStart: 0, arcEnd: 360 }
    case 'math-place-value': return { columns: ['Ones', 'Tens', 'Hundreds', 'Thousands'], digits: ['0', '0', '0', '0'] }
    case 'math-clock': return { hours: 10, minutes: 30, showDigital: true }
    case 'math-base-10': return { ones: 0, tens: 0, hundreds: 0, thousands: 0 }
    case 'math-multiplication-array': return { rows: 3, columns: 4 }
    case 'math-function-plotter': return { expression: 'x^2', range: 10 }
    case 'math-multiplication-grid': return {}
    case 'math-flashcards': return {}
    case 'math-calculator': return {}
    case 'math-unit-converter': return {}
    case 'math-formula-reference': return {}
    case 'math-proof-builder': return {}
    default: return {}
  }
}

export function getMathWidgetDefaultSize(kind: string): { width: number; height: number } {
  switch (kind) {
    case 'math-fraction-circle': return { width: 340, height: 400 }
    case 'math-fraction-bar': return { width: 440, height: 360 }
    case 'math-angle-maker': return { width: 360, height: 440 }
    case 'math-number-line': return { width: 550, height: 290 }
    case 'math-polygon': return { width: 390, height: 420 }
    case 'math-coordinate-plane': return { width: 490, height: 490 }
    case 'math-venn-diagram': return { width: 440, height: 420 }
    case 'math-bar-chart': return { width: 490, height: 440 }
    case 'math-pie-chart': return { width: 440, height: 520 }
    case 'math-protractor': return { width: 470, height: 440 }
    case 'math-ruler': return { width: 570, height: 260 }
    case 'math-set-square': return { width: 440, height: 470 }
    case 'math-compass': return { width: 490, height: 520 }
    case 'math-place-value': return { width: 470, height: 360 }
    case 'math-clock': return { width: 360, height: 470 }
    case 'math-base-10': return { width: 440, height: 550 }
    case 'math-multiplication-array': return { width: 420, height: 490 }
    case 'math-function-plotter': return { width: 470, height: 550 }
    case 'math-multiplication-grid': return { width: 440, height: 520 }
    case 'math-flashcards': return { width: 420, height: 520 }
    case 'math-calculator': return { width: 360, height: 550 }
    case 'math-unit-converter': return { width: 420, height: 490 }
    case 'math-formula-reference': return { width: 470, height: 620 }
    case 'math-proof-builder': return { width: 490, height: 680 }
    default: return { width: 360, height: 390 }
  }
}
