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
            padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer',
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
              style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
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
              padding: '2px 7px', borderRadius: 3, fontSize: 10, cursor: 'pointer',
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
              padding: '2px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
              background: orientation === o ? 'rgba(5,150,105,0.15)' : s.surface,
              border: orientation === o ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
              color: orientation === o ? '#34d399' : s.text,
            }}>
            {o === 'horizontal' ? 'Horizontal' : 'Vertical'}
          </button>
        ))}
        <button onClick={shaded.length === divisions ? clearAll : shadeAll}
          style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer',
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
                    style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
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
                    style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
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
              padding: '2px 7px', borderRadius: 3, fontSize: 10, cursor: 'pointer',
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
              padding: '2px 7px', borderRadius: 3, fontSize: 10, cursor: 'pointer',
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
// Registry helpers (used by CanvasWidgets.tsx)
// ============================================================

export const MATH_WIDGET_KIND_LABELS: Record<string, string> = {
  'math-fraction-circle': 'Fraction Circle',
  'math-fraction-bar': 'Fraction Bar',
  'math-angle-maker': 'Angle Maker',
}

export function getMathWidgetDefaultConfig(kind: string): Record<string, unknown> {
  switch (kind) {
    case 'math-fraction-circle': return { divisions: 4, shaded: [] }
    case 'math-fraction-bar': return { divisions: 4, shaded: [], orientation: 'horizontal' }
    case 'math-angle-maker': return { degrees: 90 }
    default: return {}
  }
}

export function getMathWidgetDefaultSize(kind: string): { width: number; height: number } {
  switch (kind) {
    case 'math-fraction-circle': return { width: 260, height: 310 }
    case 'math-fraction-bar': return { width: 340, height: 280 }
    case 'math-angle-maker': return { width: 280, height: 340 }
    default: return { width: 280, height: 300 }
  }
}
