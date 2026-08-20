'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { WidgetElement } from '@/lib/whiteboard/types'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

// ============================================================
// On-Canvas Math Widgets — Interactive fraction & angle tools
// ============================================================

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
                <text x={x} y={lineY - 16} textAnchor="middle" fontSize={10} fontWeight={600}
                  fill={SHADE_COLORS[i % SHADE_COLORS.length]}>{formatTick(v)}</text>
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

  // Grid lines
  const gridLines = useMemo(function() {
    const lines: Array<{x1: number; y1: number; x2: number; y2: number}> = []
    for (let g = -range; g <= range; g += step) {
      const gv = Math.round(g * 1000) / 1000
      const px = originX + gv * scale
      const py = originY - gv * scale
      // Vertical grid line
      lines.push({ x1: px, y1: originY - range * scale, x2: px, y2: originY + range * scale })
      // Horizontal grid line
      lines.push({ x1: originX - range * scale, y1: py, x2: originX + range * scale, y2: py })
    }
    return lines
  }, [range, step, originX, originY, scale])

  // Tick labels
  const tickLabels = useMemo(function() {
    const labels: Array<{x: number; y: number; text: string}> = []
    var labelStep = step
    if ((range * 2) / labelStep > 20) labelStep = step * Math.ceil(((range * 2) / labelStep) / 20) * labelStep
    for (let t = -range; t <= range; t += labelStep) {
      const tv = Math.round(t * 1000) / 1000
      const px = originX + tv * scale
      const py = originY - tv * scale
      if (Math.abs(tv) > 0.001) {
        labels.push({ x: px, y: originY + 14, text: formatCoord(tv) })
        labels.push({ x: originX - 10, y: py + 3, text: formatCoord(tv) })
      }
    }
    return labels
  }, [range, step, originX, originY, scale])

  const formatCoord = function(v: number) {
    if (Number.isInteger(v)) return String(v)
    return String(Math.round(v * 10) / 10)
  }

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
// Protractor Widget
// ============================================================

export function CanvasProtractor({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { rotation?: number; measureAngle?: number }
  var rotation = cfg.rotation ?? 0
  var measureAngle = cfg.measureAngle ?? 45
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  const setRotation = useCallback(function(r: number) {
    var norm = ((r % 360) + 360) % 360
    updateConfig({ rotation: norm, measureAngle: measureAngle })
  }, [measureAngle, updateConfig])

  const setMeasureAngle = useCallback(function(a: number) {
    var clamped = Math.max(0, Math.min(180, Math.round(a)))
    updateConfig({ rotation: rotation, measureAngle: clamped })
  }, [rotation, updateConfig])

  // Drag-to-rotate handler
  var handlePointerDown = useCallback(function(e: React.PointerEvent) {
    dragging.current = true
    ;(e.target as SVGElement).setPointerCapture(e.pointerId)
  }, [])

  var handlePointerMove = useCallback(function(e: React.PointerEvent) {
    if (!dragging.current || !svgRef.current) return
    var rect = svgRef.current.getBoundingClientRect()
    var cx = rect.left + rect.width / 2
    var cy = rect.top + rect.height * 0.6
    var angle = Math.atan2(-(e.clientY - cy), e.clientX - cx) * 180 / Math.PI
    var norm = ((angle + 90) % 360 + 360) % 360
    setRotation(norm)
  }, [setRotation])

  var handlePointerUp = useCallback(function() {
    dragging.current = false
  }, [])

  // SVG geometry
  var svgW = 320
  var svgH = 200
  var cx = svgW / 2
  var cy = svgH * 0.6
  var R = 140
  var innerR = 110
  var rotRad = (rotation - 90) * Math.PI / 180

  // Build degree tick marks
  var ticks: Array<{ x1: number; y1: number; x2: number; y2: number; label: string; major: boolean }> = []
  for (var deg = 0; deg <= 180; deg += 1) {
    var aRad = (deg - 90) * Math.PI / 180
    var isMajor = deg % 10 === 0
    var isMid = deg % 5 === 0
    var outerR = isMajor ? R : isMid ? R - 6 : R - 3
    var labelR = isMajor ? R + 14 : 0
    ticks.push({
      x1: cx + innerR * Math.cos(aRad),
      y1: cy + innerR * Math.sin(aRad),
      x2: cx + outerR * Math.cos(aRad),
      y2: cy + outerR * Math.sin(aRad),
      label: isMajor ? (deg === 0 || deg === 180 ? '' + deg : '' + deg) : '',
      major: isMajor,
    })
  }

  // Measure angle needle
  var needleRad = (measureAngle - 90) * Math.PI / 180
  var needleX = cx + (R + 20) * Math.cos(needleRad)
  var needleY = cy + (R + 20) * Math.sin(needleRad)

  // Outer scale (180 to 0, reversed)
  var outerTicks: Array<{ x1: number; y1: number; x2: number; y2: number; label: string }> = []
  for (var d = 0; d <= 180; d += 10) {
    var a = (d - 90) * Math.PI / 180
    outerTicks.push({
      x1: cx + (R + 2) * Math.cos(a),
      y1: cy + (R + 2) * Math.sin(a),
      x2: cx + (R + 8) * Math.cos(a),
      y2: cy + (R + 8) * Math.sin(a),
      label: '' + (180 - d),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Protractor</span>
        <span style={{ fontSize: 10, color: s.text }}>Measure:</span>
        <input type="range" min={0} max={180} value={measureAngle}
          onChange={function(e) { setMeasureAngle(Number(e.target.value)) }}
          style={{ width: 80, cursor: 'pointer' as const }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: s.accent }}>{measureAngle} deg</span>
        <button onClick={function() { setRotation(0); setMeasureAngle(0) }}
          style={{
            padding: '2px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer' as const,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginLeft: 'auto',
          }}>Reset</button>
      </div>

      {/* Protractor SVG */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg ref={svgRef} width={svgW} height={svgH}
          viewBox={'0 0 ' + svgW + ' ' + svgH}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ cursor: 'grab' as const, userSelect: 'none' as const }}>
          <g transform={'rotate(' + rotation + ' ' + cx + ' ' + cy + ')'}>
            {/* Protractor body */}
            <path
              d={'M ' + (cx - R) + ' ' + cy + ' A ' + R + ' ' + R + ' 0 0 1 ' + (cx + R) + ' ' + cy + ' L ' + (cx + innerR) + ' ' + cy + ' A ' + innerR + ' ' + innerR + ' 0 0 0 ' + (cx - innerR) + ' ' + cy + ' Z'}
              fill={isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.05)'}
              stroke={isDark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.6)'}
              strokeWidth={1.5}
            />
            {/* Center line */}
            <line x1={cx} y1={cy} x2={cx} y2={cy - R}
              stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} strokeWidth={0.5} />
            {/* Inner ticks and labels */}
            {ticks.map(function(tick, i) {
              return (
                <g key={'t' + i}>
                  <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
                    stroke={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                    strokeWidth={tick.major ? 1 : 0.5} />
                  {tick.label && (
                    <text x={cx + (R + 12) * Math.cos((i - 90) * Math.PI / 180)}
                      y={cy + (R + 12) * Math.sin((i - 90) * Math.PI / 180) + 3}
                      textAnchor={'middle' as const} fontSize={8}
                      fill={isDark ? '#94a3b8' : '#475569'}>{tick.label}</text>
                  )}
                </g>
              )
            })}
            {/* Outer reversed scale */}
            {outerTicks.map(function(tick, i) {
              return (
                <g key={'o' + i}>
                  <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
                    stroke={isDark ? 'rgba(248,113,113,0.3)' : 'rgba(239,68,68,0.25)'}
                    strokeWidth={0.5} />
                  <text x={cx + (R + 24) * Math.cos((i * 10 - 90) * Math.PI / 180)}
                    y={cy + (R + 24) * Math.sin((i * 10 - 90) * Math.PI / 180) + 3}
                    textAnchor={'middle' as const} fontSize={7}
                    fill={isDark ? 'rgba(248,113,113,0.7)' : 'rgba(239,68,68,0.6)'}>{tick.label}</text>
                </g>
              )
            })}
            {/* Baseline */}
            <line x1={cx - R - 10} y1={cy} x2={cx + R + 10} y2={cy}
              stroke={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'} strokeWidth={1} />
            {/* Center dot */}
            <circle cx={cx} cy={cy} r={3} fill={isDark ? '#60a5fa' : '#3b82f6'} />
          </g>
          {/* Measure angle needle (not rotated with protractor) */}
          <line x1={cx} y1={cy} x2={cx + (R + 20) * Math.cos((measureAngle - 90) * Math.PI / 180)}
            y2={cy + (R + 20) * Math.sin((measureAngle - 90) * Math.PI / 180)}
            stroke='#f59e0b' strokeWidth={2} strokeDasharray='4 2' opacity={0.8} />
          {/* Angle arc indicator */}
          <path d={'M ' + cx + ' ' + cy + ' L ' + (cx + 35) + ' ' + cy + ' A 35 35 0 ' + (measureAngle > 180 ? 1 : 0) + ' 0 ' + (cx + 35 * Math.cos((measureAngle - 90) * Math.PI / 180)) + ' ' + (cy + 35 * Math.sin((measureAngle - 90) * Math.PI / 180)) + ' Z'}
            fill='rgba(245,158,11,0.15)' stroke='#f59e0b' strokeWidth={1} />
        </svg>
      </div>

      {/* Quick angle presets */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[30, 45, 60, 90, 120, 135, 150, 180].map(function(a) {
          return (
            <button key={a} onClick={function() { setMeasureAngle(a) }}
              style={{
                padding: '2px 7px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
                background: measureAngle === a ? 'rgba(245,158,11,0.15)' : s.surface,
                border: measureAngle === a ? '1px solid rgba(245,158,11,0.4)' : '1px solid ' + s.border,
                color: measureAngle === a ? '#f59e0b' : s.text,
              }}>{a} deg</button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Ruler Widget
// ============================================================

export function CanvasRuler({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { rotation?: number; unit?: string; showInches?: boolean }
  var rotation = cfg.rotation ?? 0
  var unit = cfg.unit || 'cm'
  var showInches = cfg.showInches ?? false
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  var setRotation = useCallback(function(r: number) {
    var norm = ((r % 360) + 360) % 360
    updateConfig({ rotation: norm, unit: unit, showInches: showInches })
  }, [unit, showInches, updateConfig])

  var setUnit = useCallback(function(u: string) {
    updateConfig({ rotation: rotation, unit: u, showInches: u === 'both' ? true : showInches })
  }, [rotation, showInches, updateConfig])

  // Drag to rotate
  var handlePointerDown = useCallback(function(e: React.PointerEvent) {
    dragging.current = true
    ;(e.target as SVGElement).setPointerCapture(e.pointerId)
  }, [])

  var handlePointerMove = useCallback(function(e: React.PointerEvent) {
    if (!dragging.current || !svgRef.current) return
    var rect = svgRef.current.getBoundingClientRect()
    var cxR = rect.left + rect.width / 2
    var cyR = rect.top + rect.height / 2
    var angle = Math.atan2(e.clientY - cyR, e.clientX - cxR) * 180 / Math.PI
    setRotation(angle + 90)
  }, [setRotation])

  var handlePointerUp = useCallback(function() {
    dragging.current = false
  }, [])

  // Ruler geometry
  var rulerLen = 360
  var rulerH = 56
  var svgW = rulerLen + 40
  var svgH = rulerH + 40
  var ox = 20
  var oy = 20
  var maxCm = 15
  var maxIn = 6

  // CM ticks
  var cmTicks: Array<{ x: number; h: number; label: string; major: boolean }> = []
  for (var cm = 0; cm <= maxCm; cm++) {
    var x = ox + (cm / maxCm) * rulerLen
    cmTicks.push({ x: x, h: cm % 5 === 0 ? 20 : 14, label: '' + cm, major: cm % 5 === 0 })
    // Half-cm tick
    if (cm < maxCm) {
      cmTicks.push({ x: x + rulerLen / maxCm / 2, h: 8, label: '', major: false })
    }
  }

  // Inch ticks
  var inTicks: Array<{ x: number; h: number; label: string }> = []
  for (var inch = 0; inch <= maxIn; inch++) {
    var xIn = ox + (inch / maxIn) * rulerLen
    inTicks.push({ x: xIn, h: 16, label: '' + inch })
    if (inch < maxIn) {
      // Quarter inch
      for (var q = 1; q <= 3; q++) {
        inTicks.push({ x: xIn + (q / 4 / maxIn) * rulerLen, h: q === 2 ? 10 : 6, label: '' })
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Ruler</span>
        <span style={{ fontSize: 10, color: s.text }}>Unit:</span>
        {(['cm', 'inch', 'both'] as const).map(function(u) {
          return (
            <button key={u} onClick={function() { setUnit(u) }}
              style={{
                padding: '2px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer' as const,
                background: unit === u ? 'rgba(5,150,105,0.15)' : s.surface,
                border: unit === u ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
                color: unit === u ? '#34d399' : s.text,
              }}>{u === 'cm' ? 'Centimeters' : u === 'inch' ? 'Inches' : 'Both'}</button>
          )
        })}
        <button onClick={function() { setRotation(0) }}
          style={{
            padding: '2px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer' as const,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginLeft: 'auto',
          }}>Reset</button>
      </div>

      {/* Ruler SVG */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg ref={svgRef} width={svgW} height={svgH}
          viewBox={'0 0 ' + svgW + ' ' + svgH}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ cursor: 'grab' as const, userSelect: 'none' as const }}>
          <g transform={'rotate(' + rotation + ' ' + svgW / 2 + ' ' + svgH / 2 + ')'}>
            {/* Ruler body */}
            <rect x={ox} y={oy} width={rulerLen} height={rulerH} rx={3}
              fill={isDark ? 'rgba(234,179,8,0.08)' : 'rgba(234,179,8,0.06)'}
              stroke={isDark ? 'rgba(234,179,8,0.4)' : 'rgba(180,130,0,0.5)'}
              strokeWidth={1.5} />
            {/* Top edge */}
            <line x1={ox} y1={oy} x2={ox + rulerLen} y2={oy}
              stroke={isDark ? 'rgba(234,179,8,0.5)' : 'rgba(180,130,0,0.6)'} strokeWidth={2} />
            {/* CM scale on top */}
            {(unit === 'cm' || unit === 'both') && cmTicks.map(function(tick, i) {
              return (
                <g key={'cm' + i}>
                  <line x1={tick.x} y1={oy} x2={tick.x} y2={oy + tick.h}
                    stroke={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                    strokeWidth={tick.major ? 1 : 0.5} />
                  {tick.label && tick.major && (
                    <text x={tick.x} y={oy + tick.h + 10} textAnchor={'middle' as const} fontSize={7}
                      fill={isDark ? '#94a3b8' : '#475569'}>{tick.label}</text>
                  )}
                </g>
              )
            })}
            {/* Inch scale on bottom */}
            {(unit === 'inch' || unit === 'both') && inTicks.map(function(tick, i) {
              return (
                <g key={'in' + i}>
                  <line x1={tick.x} y1={oy + rulerH} x2={tick.x} y2={oy + rulerH - tick.h}
                    stroke={isDark ? 'rgba(248,113,113,0.4)' : 'rgba(220,38,38,0.35)'}
                    strokeWidth={tick.label ? 1 : 0.5} />
                  {tick.label && (
                    <text x={tick.x} y={oy + rulerH - tick.h - 3} textAnchor={'middle' as const} fontSize={7}
                      fill={isDark ? 'rgba(248,113,113,0.8)' : 'rgba(220,38,38,0.7)'}>{tick.label}</text>
                  )}
                </g>
              )
            })}
            {/* Unit labels */}
            {unit === 'both' && (
              <text x={ox + 4} y={oy + 14} fontSize={7} fill={isDark ? '#60a5fa' : '#3b82f6'}>cm</text>
            )}
            {unit === 'both' && (
              <text x={ox + 4} y={oy + rulerH - 6} fontSize={7} fill={isDark ? 'rgba(248,113,113,0.8)' : 'rgba(220,38,38,0.7)'}>in</text>
            )}
          </g>
        </svg>
      </div>

      <div style={{ fontSize: 9, color: s.text, textAlign: 'center' as const }}>
        Drag to rotate {unit === 'both' ? '(cm top, inches bottom)' : ''}
      </div>
    </div>
  )
}

// ============================================================
// Set Square Widget
// ============================================================

export function CanvasSetSquare({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { rotation?: number; triangleType?: string; showAngles?: boolean }
  var rotation = cfg.rotation ?? 0
  var triangleType = cfg.triangleType || '45'
  var showAngles = cfg.showAngles ?? true
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  var setRotation = useCallback(function(r: number) {
    var norm = ((r % 360) + 360) % 360
    updateConfig({ rotation: norm, triangleType: triangleType, showAngles: showAngles })
  }, [triangleType, showAngles, updateConfig])

  var setTriangleType = useCallback(function(t: string) {
    updateConfig({ rotation: rotation, triangleType: t, showAngles: showAngles })
  }, [rotation, showAngles, updateConfig])

  var toggleAngles = useCallback(function() {
    updateConfig({ rotation: rotation, triangleType: triangleType, showAngles: !showAngles })
  }, [rotation, triangleType, showAngles, updateConfig])

  // Drag to rotate
  var handlePointerDown = useCallback(function(e: React.PointerEvent) {
    dragging.current = true
    ;(e.target as SVGElement).setPointerCapture(e.pointerId)
  }, [])

  var handlePointerMove = useCallback(function(e: React.PointerEvent) {
    if (!dragging.current || !svgRef.current) return
    var rect = svgRef.current.getBoundingClientRect()
    var cxS = rect.left + rect.width / 2
    var cyS = rect.top + rect.height / 2
    var angle = Math.atan2(e.clientY - cyS, e.clientX - cxS) * 180 / Math.PI
    setRotation(angle + 90)
  }, [setRotation])

  var handlePointerUp = useCallback(function() {
    dragging.current = false
  }, [])

  // Triangle geometry
  var svgW = 300
  var svgH = 280
  var cxS = svgW / 2
  var cyS = svgH / 2
  var size = 200

  // Points depend on triangle type
  var points: string
  var angleLabels: Array<{ x: number; y: number; text: string }> = []
  var rightAngleCorner: string

  if (triangleType === '30') {
    // 30-60-90 triangle: vertices at right angles
    var ax = cxS - size / 2
    var ay = cyS + size / 2
    var bx = cxS + size / 2
    var by = cyS + size / 2
    // Hypotenuse slopes up
    var hx = cxS - size / 2 + size * Math.cos(60 * Math.PI / 180)
    var hy = cyS + size / 2 - size * Math.sin(60 * Math.PI / 180)
    points = ax + ',' + ay + ' ' + bx + ',' + by + ' ' + hx + ',' + hy
    rightAngleCorner = 'M ' + ax + ' ' + ay + ' L ' + (ax + 15) + ' ' + ay + ' L ' + (ax + 15) + ' ' + (ay - 15) + ' L ' + ax + ' ' + (ay - 15)
    angleLabels = [
      { x: ax - 12, y: ay - 8, text: '90' },
      { x: bx + 6, y: by - 8, text: '30' },
      { x: hx - 14, y: hy - 10, text: '60' },
    ]
  } else {
    // 45-45-90 triangle (default)
    var a1x = cxS - size / 2
    var a1y = cyS + size / 2
    var b1x = cxS + size / 2
    var b1y = cyS + size / 2
    var c1x = cxS - size / 2
    var c1y = cyS - size / 2
    points = a1x + ',' + a1y + ' ' + b1x + ',' + b1y + ' ' + c1x + ',' + c1y
    rightAngleCorner = 'M ' + a1x + ' ' + a1y + ' L ' + (a1x + 18) + ' ' + a1y + ' L ' + (a1x + 18) + ' ' + (a1y - 18) + ' L ' + a1x + ' ' + (a1y - 18)
    angleLabels = [
      { x: a1x - 12, y: a1y - 8, text: '90' },
      { x: b1x + 6, y: b1y - 8, text: '45' },
      { x: c1x - 16, y: c1y + 4, text: '45' },
    ]
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Set Square</span>
        <span style={{ fontSize: 10, color: s.text }}>Type:</span>
        {(['45', '30'] as const).map(function(t) {
          return (
            <button key={t} onClick={function() { setTriangleType(t) }}
              style={{
                padding: '2px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer' as const,
                background: triangleType === t ? 'rgba(5,150,105,0.15)' : s.surface,
                border: triangleType === t ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
                color: triangleType === t ? '#34d399' : s.text,
              }}>{t === '45' ? '45-45-90' : '30-60-90'}</button>
          )
        })}
        <button onClick={toggleAngles}
          style={{
            padding: '2px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer' as const,
            background: showAngles ? 'rgba(59,130,246,0.12)' : s.surface,
            border: showAngles ? '1px solid rgba(59,130,246,0.3)' : '1px solid ' + s.border,
            color: showAngles ? '#60a5fa' : s.text,
          }}>Angles</button>
        <button onClick={function() { setRotation(0) }}
          style={{
            padding: '2px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer' as const,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginLeft: 'auto',
          }}>Reset</button>
      </div>

      {/* Set Square SVG */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg ref={svgRef} width={svgW} height={svgH}
          viewBox={'0 0 ' + svgW + ' ' + svgH}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ cursor: 'grab' as const, userSelect: 'none' as const }}>
          <g transform={'rotate(' + rotation + ' ' + cxS + ' ' + cyS + ')'}>
            {/* Triangle body (transparent) */}
            <polygon points={points}
              fill={isDark ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.04)'}
              stroke={isDark ? 'rgba(139,92,246,0.5)' : 'rgba(109,40,217,0.5)'}
              strokeWidth={2} />
            {/* Right angle indicator */}
            <path d={rightAngleCorner} fill='none'
              stroke={isDark ? 'rgba(139,92,246,0.6)' : 'rgba(109,40,217,0.5)'}
              strokeWidth={1} />
            {/* Cutout hole in center */}
            <circle cx={cxS} cy={cyS} r={18}
              fill={isDark ? '#0f172a' : '#ffffff'}
              stroke={isDark ? 'rgba(139,92,246,0.3)' : 'rgba(109,40,217,0.25)'}
              strokeWidth={1} />
            {/* Angle labels */}
            {showAngles && angleLabels.map(function(lbl, i) {
              return (
                <text key={'al' + i} x={lbl.x} y={lbl.y}
                  textAnchor={'middle' as const} fontSize={10} fontWeight={600}
                  fill={isDark ? '#c4b5fd' : '#7c3aed'}>{lbl.text + ' deg'}</text>
              )
            })}
            {/* Edge labels */}
            <text x={cxS} y={cyS + size / 2 + 18} textAnchor={'middle' as const} fontSize={8}
              fill={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'}>
              {triangleType === '45' ? 'a = b' : 'a : b : c = 1 : sqrt(3) : 2'}
            </text>
          </g>
        </svg>
      </div>

      <div style={{ fontSize: 9, color: s.text, textAlign: 'center' as const }}>
        Drag to rotate the set square
      </div>
    </div>
  )
}

// ============================================================
// Compass Widget
// ============================================================

export function CanvasCompass({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { radius?: number; rotation?: number; showCircle?: boolean; arcStart?: number; arcEnd?: number }
  var radius = cfg.radius ?? 100
  var rotation = cfg.rotation ?? 0
  var showCircle = cfg.showCircle ?? true
  var arcStart = cfg.arcStart ?? 0
  var arcEnd = cfg.arcEnd ?? 360
  const updateConfig = useConfigUpdater(element.id)
  const s = ws(isDark)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  var setRadius = useCallback(function(r: number) {
    var clamped = Math.max(20, Math.min(160, Math.round(r)))
    updateConfig({ radius: clamped, rotation: rotation, showCircle: showCircle, arcStart: arcStart, arcEnd: arcEnd })
  }, [rotation, showCircle, arcStart, arcEnd, updateConfig])

  var setRotation = useCallback(function(r: number) {
    var norm = ((r % 360) + 360) % 360
    updateConfig({ radius: radius, rotation: norm, showCircle: showCircle, arcStart: arcStart, arcEnd: arcEnd })
  }, [radius, showCircle, arcStart, arcEnd, updateConfig])

  var toggleCircle = useCallback(function() {
    updateConfig({ radius: radius, rotation: rotation, showCircle: !showCircle, arcStart: arcStart, arcEnd: arcEnd })
  }, [radius, rotation, showCircle, arcStart, arcEnd, updateConfig])

  var setArcStart = useCallback(function(a: number) {
    updateConfig({ radius: radius, rotation: rotation, showCircle: showCircle, arcStart: a, arcEnd: arcEnd })
  }, [radius, rotation, showCircle, arcEnd, updateConfig])

  var setArcEnd = useCallback(function(a: number) {
    updateConfig({ radius: radius, rotation: rotation, showCircle: showCircle, arcStart: arcStart, arcEnd: a })
  }, [radius, rotation, showCircle, arcStart, updateConfig])

  // Drag to rotate
  var handlePointerDown = useCallback(function(e: React.PointerEvent) {
    dragging.current = true
    ;(e.target as SVGElement).setPointerCapture(e.pointerId)
  }, [])

  var handlePointerMove = useCallback(function(e: React.PointerEvent) {
    if (!dragging.current || !svgRef.current) return
    var rect = svgRef.current.getBoundingClientRect()
    var cxC = rect.left + rect.width / 2
    var cyC = rect.top + rect.height / 2
    var angle = Math.atan2(e.clientY - cyC, e.clientX - cxC) * 180 / Math.PI
    setRotation(angle + 90)
  }, [setRotation])

  var handlePointerUp = useCallback(function() {
    dragging.current = false
  }, [])

  // SVG geometry
  var svgW = 340
  var svgH = 320
  var cxC = svgW / 2
  var cyC = svgH / 2 + 10
  var armLen = 140
  var pivotX = cxC
  var pivotY = cyC + 50

  // Compass arm endpoints
  var rad1 = ((rotation - 90 - 12) * Math.PI) / 180
  var rad2 = ((rotation - 90 + 12) * Math.PI) / 180
  var endX1 = pivotX + armLen * Math.cos(rad1)
  var endY1 = pivotY + armLen * Math.sin(rad1)
  var endX2 = pivotX + armLen * Math.cos(rad2)
  var endY2 = pivotY + armLen * Math.sin(rad2)

  // Needle point (bottom)
  var needleX = pivotX + 20 * Math.sin(rotation * Math.PI / 180)
  var needleY = pivotY + 20 * Math.cos(rotation * Math.PI / 180)

  // Drawn circle/arc
  var arcStartRad = (arcStart - 90) * Math.PI / 180
  var arcEndRad = (arcEnd - 90) * Math.PI / 180
  var circleX = cxC + radius * Math.cos(arcStartRad)
  var circleY = cyC + radius * Math.sin(arcStartRad)
  var circleX2 = cxC + radius * Math.cos(arcEndRad)
  var circleY2 = cyC + radius * Math.sin(arcEndRad)
  var largeArc = (arcEnd - arcStart) > 180 ? 1 : 0
  var arcPath = 'M ' + circleX + ' ' + circleY + ' A ' + radius + ' ' + radius + ' 0 ' + largeArc + ' 1 ' + circleX2 + ' ' + circleY2

  // If full circle
  var isFullCircle = Math.abs(arcEnd - arcStart) >= 360
  var fullCirclePath = isFullCircle
      ? 'M ' + (cxC + radius) + ' ' + cyC + ' A ' + radius + ' ' + radius + ' 1 1 ' + (cxC - radius) + ' ' + cyC + ' A ' + radius + ' ' + radius + ' 1 1 ' + (cxC + radius) + ' ' + cyC
      : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Compass</span>
        <span style={{ fontSize: 10, color: s.text }}>Radius:</span>
        <input type="range" min={20} max={160} value={radius}
          onChange={function(e) { setRadius(Number(e.target.value)) }}
          style={{ width: 70, cursor: 'pointer' as const }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: s.accent }}>{radius}</span>
        <button onClick={toggleCircle}
          style={{
            padding: '2px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer' as const,
            background: showCircle ? 'rgba(59,130,246,0.12)' : s.surface,
            border: showCircle ? '1px solid rgba(59,130,246,0.3)' : '1px solid ' + s.border,
            color: showCircle ? '#60a5fa' : s.text,
          }}>{showCircle ? 'Hide' : 'Show'} Circle</button>
        <button onClick={function() { setRotation(0) }}
          style={{
            padding: '2px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer' as const,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginLeft: 'auto',
          }}>Reset</button>
      </div>

      {/* Arc range controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 9, color: s.text }}>Arc:</span>
        <input type="range" min={0} max={360} value={arcStart}
          onChange={function(e) { setArcStart(Number(e.target.value)) }}
          style={{ width: 50, cursor: 'pointer' as const }} />
        <span style={{ fontSize: 9, color: s.text }}>to</span>
        <input type="range" min={0} max={360} value={arcEnd}
          onChange={function(e) { setArcEnd(Number(e.target.value)) }}
          style={{ width: 50, cursor: 'pointer' as const }} />
        <span style={{ fontSize: 9, fontWeight: 600, color: s.accent }}>{arcStart} - {arcEnd} deg</span>
        <button onClick={function() { setArcStart(0); setArcEnd(360) }}
          style={{
            padding: '1px 5px', borderRadius: 3, fontSize: 8, cursor: 'pointer' as const,
            background: s.surface, border: '1px solid ' + s.border, color: s.text,
          }}>Full</button>
      </div>

      {/* Compass SVG */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg ref={svgRef} width={svgW} height={svgH}
          viewBox={'0 0 ' + svgW + ' ' + svgH}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ cursor: 'grab' as const, userSelect: 'none' as const }}>
          {/* Drawn circle/arc (appears at center top) */}
          {showCircle && isFullCircle && (
            <circle cx={cxC} cy={cyC} r={radius}
              fill='none' stroke={isDark ? 'rgba(52,211,153,0.5)' : 'rgba(5,150,105,0.5)'}
              strokeWidth={1.5} strokeDasharray='4 2' />
          )}
          {showCircle && !isFullCircle && (
            <path d={arcPath} fill='none'
              stroke={isDark ? 'rgba(52,211,153,0.5)' : 'rgba(5,150,105,0.5)'}
              strokeWidth={1.5} strokeDasharray='4 2' />
          )}
          {/* Radius line */}
          {showCircle && (
            <line x1={cxC} y1={cyC} x2={cxC + radius} y2={cyC}
              stroke={isDark ? 'rgba(52,211,153,0.3)' : 'rgba(5,150,105,0.3)'}
              strokeWidth={1} strokeDasharray='3 3' />
          )}
          {showCircle && (
            <text x={cxC + radius / 2} y={cyC - 6} textAnchor={'middle' as const} fontSize={9}
              fill={isDark ? '#34d399' : '#059669'}>r = {radius}</text>
          )}
          {/* Center dot of drawn circle */}
          {showCircle && (
            <circle cx={cxC} cy={cyC} r={2.5} fill={isDark ? '#34d399' : '#059669'} />
          )}

          {/* Compass tool (two arms + pivot) */}
          {/* Arm 1 */}
          <line x1={pivotX} y1={pivotY} x2={endX1} y2={endY1}
            stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={3} strokeLinecap='round' />
          {/* Arm 2 */}
          <line x1={pivotX} y1={pivotY} x2={endX2} y2={endY2}
            stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={3} strokeLinecap='round' />
          {/* Top hinge */}
          <circle cx={pivotX} y={pivotY} r={5} fill={isDark ? '#475569' : '#94a3b8'} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1.5} />
          {/* Needle tip */}
          <circle cx={needleX} cy={needleY} r={2} fill={isDark ? '#f87171' : '#ef4444'} />
          {/* Pencil tip indicator */}
          <circle cx={endX1} cy={endY1} r={2.5} fill={isDark ? '#34d399' : '#059669'} />
          {/* Metal arc at top */}
          <path d={'M ' + (pivotX - 10) + ' ' + (pivotY - 2) + ' A 10 10 0 0 1 ' + (pivotX + 10) + ' ' + (pivotY - 2)}
            fill='none' stroke={isDark ? '#64748b' : '#64748b'} strokeWidth={2} />
        </svg>
      </div>

      <div style={{ fontSize: 9, color: s.text, textAlign: 'center' as const }}>
        Drag to rotate | Adjust radius and arc with sliders
      </div>
    </div>
  )
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
    case 'math-ruler': return { rotation: 0, unit: 'cm', showInches: false }
    case 'math-set-square': return { rotation: 0, triangleType: '45', showAngles: true }
    case 'math-compass': return { radius: 100, rotation: 0, showCircle: true, arcStart: 0, arcEnd: 360 }
    default: return {}
  }
}

export function getMathWidgetDefaultSize(kind: string): { width: number; height: number } {
  switch (kind) {
    case 'math-fraction-circle': return { width: 260, height: 310 }
    case 'math-fraction-bar': return { width: 340, height: 280 }
    case 'math-angle-maker': return { width: 280, height: 340 }
    case 'math-number-line': return { width: 420, height: 220 }
    case 'math-polygon': return { width: 300, height: 320 }
    case 'math-coordinate-plane': return { width: 380, height: 380 }
    case 'math-venn-diagram': return { width: 340, height: 320 }
    case 'math-bar-chart': return { width: 380, height: 340 }
    case 'math-pie-chart': return { width: 340, height: 400 }
    case 'math-protractor': return { width: 360, height: 340 }
    case 'math-ruler': return { width: 440, height: 200 }
    case 'math-set-square': return { width: 340, height: 360 }
    case 'math-compass': return { width: 380, height: 400 }
    default: return { width: 280, height: 300 }
  }
}
