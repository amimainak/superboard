'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { WidgetElement } from '@/lib/whiteboard/types'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

// ============================================================
// On-Canvas Interactive Widgets
// Each widget reads initial state from element.config,
// renders interactive UI, and syncs state back via updateElement
// so changes propagate to collaborators in real-time.
// ============================================================

interface CanvasWidgetProps {
  element: WidgetElement
  isDark: boolean
}

/** Debounced config updater — avoids flooding the store on every keystroke */
function useConfigUpdater(elementId: string) {
  const updateElement = useWhiteboardStore((s) => s.updateElement)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<Record<string, unknown>>({})

  const updateConfig = useCallback((patch: Record<string, unknown>) => {
    Object.assign(pendingRef.current, patch)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      updateElement(elementId, { config: { ...pendingRef.current } } as Partial<WidgetElement>)
      pendingRef.current = {}
    }, 150)
  }, [updateElement, elementId])

  // Flush on unmount
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return updateConfig
}

// ---- Shared helpers (self-contained, no external deps) ----

function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}
function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}
function mode(arr: number[]): number[] {
  const freq = new Map<number, number>()
  arr.forEach(v => freq.set(v, (freq.get(v) || 0) + 1))
  const maxFreq = Math.max(...freq.values())
  if (maxFreq <= 1) return []
  return [...freq.entries()].filter(([, f]) => f === maxFreq).map(([v]) => v)
}
function stdev(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1))
}
function variance(arr: number[]): number {
  const s = stdev(arr)
  return s * s
}
function quartiles(arr: number[]) {
  const s = [...arr].sort((a, b) => a - b)
  const q2 = median(s)
  const mid = Math.floor(s.length / 2)
  const lower = s.slice(0, mid)
  const upper = s.slice(mid + (s.length % 2 === 0 ? 0 : 1))
  const q1 = median(lower.length > 0 ? lower : [s[0]])
  const q3 = median(upper.length > 0 ? upper : [s[s.length - 1]])
  const iqr = q3 - q1
  const lf = q1 - 1.5 * iqr
  const uf = q3 + 1.5 * iqr
  const nonOutlier = s.filter(v => v >= lf && v <= uf)
  return {
    q1, q2, q3, iqr,
    min: nonOutlier.length > 0 ? nonOutlier[0] : s[0],
    max: nonOutlier.length > 0 ? nonOutlier[nonOutlier.length - 1] : s[s.length - 1],
    outliers: s.filter(v => v < lf || v > uf),
  }
}
function linearRegression(xs: number[], ys: number[]) {
  const n = xs.length
  if (n < 2) return { slope: 0, intercept: 0, r: 0, r2: 0 }
  const mx = mean(xs), my = mean(ys)
  let sxy = 0, sxx = 0, syy = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy
  }
  const denom = sxx * syy
  const r = denom === 0 ? 0 : sxy / Math.sqrt(denom)
  return { slope: sxx === 0 ? 0 : sxy / sxx, intercept: my - (sxx === 0 ? 0 : sxy / sxx) * mx, r, r2: r * r }
}
function normalPDF(x: number, mu: number, sigma: number): number {
  const s2 = sigma * sigma
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) ** 2) / s2)
}
function normalCDF(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429
  const p = 0.3275911
  const sign = z < 0 ? -1 : 1
  const absZ = Math.abs(z)
  const t = 1 / (1 + p * absZ)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ / 2)
  return 0.5 * (1 + sign * y)
}

// ---- Shared canvas widget styles ----

const cw = (isDark: boolean) => ({
  bg: isDark ? '#0f172a' : '#ffffff',
  surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
  border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
  text: isDark ? '#94a3b8' : '#64748b',
  bright: isDark ? '#e2e8f0' : '#1e293b',
  accent: '#34d399',
  input: {
    padding: '4px 8px', borderRadius: 5, fontSize: 11,
    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'),
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none' as const,
  },
  btn: (active: boolean) => ({
    padding: '3px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer' as const,
    background: active ? 'rgba(5,150,105,0.15)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
    border: active ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
    color: active ? '#34d399' : (isDark ? '#94a3b8' : '#64748b'),
  }),
  statLabel: { fontSize: 10, color: isDark ? '#64748b' : '#94a3b8', minWidth: 55, textAlign: 'right' as const },
  statValue: { fontSize: 11, fontWeight: 600 as const, color: isDark ? '#e2e8f0' : '#1e293b', fontFamily: 'monospace' },
})

// ============================================================
// 1. DATA TABLE + SUMMARY STATS
// ============================================================

function CanvasDataTable({ element, isDark }: CanvasWidgetProps) {
  const s = cw(isDark)
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const [raw, setRaw] = useState((cfg.raw as string) || '12, 15, 18, 22, 25, 14, 19, 21, 17, 30')
  const [sorted, setSorted] = useState((cfg.sorted as boolean) || false)

  const data = useMemo(() => {
    const nums = raw.split(/[,\s\n]+/).map(v => parseFloat(v.trim())).filter(n => !isNaN(n))
    return sorted ? [...nums].sort((a, b) => a - b) : nums
  }, [raw, sorted])

  const stats = useMemo(() => {
    if (data.length === 0) return null
    const q = quartiles(data)
    return { count: data.length, sum: data.reduce((a, b) => a + b, 0), mean: mean(data), median: median(data), mode: mode(data), range: data.length > 0 ? Math.max(...data) - Math.min(...data) : 0, iqr: q.iqr, stdev: stdev(data), variance: variance(data), min: Math.min(...data), max: Math.max(...data), q1: q.q1, q3: q.q3 }
  }, [data])

  const handleChange = (v: string) => { setRaw(v); updateConfig({ raw: v }) }
  const handleSort = () => { const n = !sorted; setSorted(n); updateConfig({ sorted: n }) }

  const statRow = (label: string, value: string | number) => (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1px 0' }}>
      <span style={s.statLabel}>{label}</span>
      <span style={s.statValue}>{typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(3)) : value}</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'inherit' }}>
      <textarea value={raw} onChange={e => handleChange(e.target.value)} placeholder="Enter numbers..."
        style={{ ...s.input, width: '100%', minHeight: 44, resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }} />
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={handleSort} style={s.btn(sorted)}>{sorted ? 'Sorted' : 'Original'}</button>
        <span style={{ fontSize: 10, color: s.text }}>{data.length} values</span>
      </div>
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 12px', padding: '5px 8px', borderRadius: 6, background: s.surface }}>
          {statRow('Count', stats.count)}{statRow('Mean', stats.mean)}
          {statRow('Median', stats.median)}{statRow('Mode', stats.mode.length > 0 ? stats.mode.join(', ') : 'None')}
          {statRow('Std Dev', stats.stdev)}{statRow('Range', stats.range)}
          {statRow('Min', stats.min)}{statRow('Max', stats.max)}
          {statRow('Q1', stats.q1)}{statRow('Q3', stats.q3)}
        </div>
      )}
    </div>
  )
}

// ============================================================
// 2. HISTOGRAM BUILDER
// ============================================================

function CanvasHistogram({ element, isDark }: CanvasWidgetProps) {
  const s = cw(isDark)
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const [raw, setRaw] = useState((cfg.raw as string) || '72, 85, 90, 65, 78, 92, 88, 76, 95, 82, 70, 88, 91, 84, 77, 93, 80, 86, 74, 89')
  const [bins, setBins] = useState((cfg.bins as number) || 5)

  const data = useMemo(() => raw.split(/[,\s\n]+/).map(v => parseFloat(v.trim())).filter(n => !isNaN(n)), [raw])

  const histogram = useMemo(() => {
    if (data.length === 0) return null
    const mn = Math.min(...data), mx = Math.max(...data)
    if (mn === mx) return null
    const binWidth = (mx - mn) / bins
    const bucketCounts = new Array(bins).fill(0) as number[]
    const bucketLabels: string[] = []
    for (let i = 0; i < bins; i++) {
      const lo = mn + i * binWidth
      const hi = mn + (i + 1) * binWidth
      bucketLabels.push(i === bins - 1 ? lo.toFixed(1) + '+' : lo.toFixed(1) + '-' + hi.toFixed(1))
    }
    data.forEach(v => { let idx = Math.floor((v - mn) / binWidth); if (idx >= bins) idx = bins - 1; if (idx < 0) idx = 0; bucketCounts[idx]++ })
    const maxCount = Math.max(...bucketCounts)
    return { bucketCounts, bucketLabels, maxCount, binWidth, min: mn, max: mx }
  }, [data, bins])

  const barColor = isDark ? '#34d399' : '#059669'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisColor = isDark ? '#475569' : '#94a3b8'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'inherit' }}>
      <textarea value={raw} onChange={e => { setRaw(e.target.value); updateConfig({ raw: e.target.value }) }} placeholder="Enter data..."
        style={{ ...s.input, width: '100%', minHeight: 36, resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: s.text }}>Bins:</span>
        {[3, 4, 5, 6, 7, 8, 10].map(n => (
          <button key={n} onClick={() => { setBins(n); updateConfig({ bins: n }) }} style={s.btn(bins === n)}>{n}</button>
        ))}
      </div>
      {histogram && (
        <svg viewBox="0 0 280 140" style={{ width: '100%', borderRadius: 6, background: s.surface }}>
          {[0.25, 0.5, 0.75].map(f => (
            <line key={f} x1={30} y1={10 + (1 - f) * 110} x2={275} y2={10 + (1 - f) * 110} stroke={gridColor} strokeWidth={0.5} />
          ))}
          <text x={26} y={14} fontSize={7} fill={axisColor} textAnchor="end">{histogram.maxCount}</text>
          <text x={26} y={69} fontSize={7} fill={axisColor} textAnchor="end">{Math.round(histogram.maxCount / 2)}</text>
          <text x={26} y={124} fontSize={7} fill={axisColor} textAnchor="end">0</text>
          {histogram.bucketCounts.map((count, i) => {
            const barH = histogram.maxCount > 0 ? (count / histogram.maxCount) * 110 : 0
            const barW = 240 / histogram.bucketCounts.length
            const x = 32 + i * barW
            const y = 120 - barH
            return (
              <g key={i}>
                <rect x={x + 1} y={y} width={barW - 2} height={barH} fill={barColor} rx={2} opacity={0.85} />
                {count > 0 && <text x={x + barW / 2} y={y - 3} fontSize={7} fill={axisColor} textAnchor="middle">{count}</text>}
                <text x={x + barW / 2} y={134} fontSize={6} fill={axisColor} textAnchor="middle"
                  transform={"rotate(-35," + (x + barW / 2) + ',134)'}>{histogram.bucketLabels[i]}</text>
              </g>
            )
          })}
          <line x1={30} y1={120} x2={275} y2={120} stroke={axisColor} strokeWidth={1} />
          <line x1={30} y1={10} x2={30} y2={120} stroke={axisColor} strokeWidth={1} />
        </svg>
      )}
    </div>
  )
}

// ============================================================
// 3. BOX & WHISKER PLOT
// ============================================================

function CanvasBoxPlot({ element, isDark }: CanvasWidgetProps) {
  const s = cw(isDark)
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const [raw, setRaw] = useState((cfg.raw as string) || '12, 15, 18, 22, 25, 14, 19, 21, 17, 30, 45, 8')

  const data = useMemo(() => raw.split(/[,\s\n]+/).map(v => parseFloat(v.trim())).filter(n => !isNaN(n)), [raw])
  const q = useMemo(() => data.length >= 4 ? quartiles(data) : null, [data])

  const boxColor = isDark ? '#34d399' : '#059669'
  const boxFill = isDark ? 'rgba(52,211,153,0.15)' : 'rgba(5,150,105,0.1)'
  const axisColor = isDark ? '#475569' : '#94a3b8'

  const scaleToX = (val: number, min: number, max: number) => {
    if (max === min) return 150
    return 30 + ((val - min) / (max - min)) * 240
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'inherit' }}>
      <textarea value={raw} onChange={e => { setRaw(e.target.value); updateConfig({ raw: e.target.value }) }} placeholder="Enter data (4+ values)..."
        style={{ ...s.input, width: '100%', minHeight: 36, resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }} />
      {q && (
        <>
          <svg viewBox="0 0 280 90" style={{ width: '100%', borderRadius: 6, background: s.surface }}>
            {(() => {
              const allVals = [...data, ...q.outliers]
              const lo = Math.min(...allVals), hi = Math.max(...allVals)
              const pad = (hi - lo) * 0.1 || 1
              const x = (v: number) => scaleToX(v, lo - pad, hi + pad)
              return (
                <>
                  <line x1={x(q.min)} y1={35} x2={x(q.max)} y2={35} stroke={axisColor} strokeWidth={1} />
                  <line x1={x(q.min)} y1={28} x2={x(q.min)} y2={42} stroke={axisColor} strokeWidth={1.5} />
                  <line x1={x(q.max)} y1={28} x2={x(q.max)} y2={42} stroke={axisColor} strokeWidth={1.5} />
                  <rect x={x(q.q1)} y={20} width={x(q.q3) - x(q.q1)} height={30} fill={boxFill} stroke={boxColor} strokeWidth={1.5} rx={3} />
                  <line x1={x(q.q2)} y1={20} x2={x(q.q2)} y2={50} stroke={boxColor} strokeWidth={2} />
                  <polygon
                    points={x(mean(data)) + ',35 ' + (x(mean(data)) - 4) + ',29 ' + (x(mean(data))) + ',23 ' + (x(mean(data)) + 4) + ',29'}
                    fill={isDark ? '#a78bfa' : '#7c3aed'} stroke="none" opacity={0.7} />
                  {q.outliers.map((o, i) => (
                    <circle key={i} cx={x(o)} cy={35} r={3} fill='#f87171' opacity={0.8} />
                  ))}
                  <text x={x(q.min)} y={60} fontSize={7} fill={axisColor} textAnchor="middle">{q.min.toFixed(1)}</text>
                  <text x={x(q.q1)} y={16} fontSize={7} fill={boxColor} textAnchor="middle">Q1:{q.q1.toFixed(1)}</text>
                  <text x={x(q.q2)} y={16} fontSize={7} fill={boxColor} textAnchor="middle">Med:{q.q2.toFixed(1)}</text>
                  <text x={x(q.q3)} y={16} fontSize={7} fill={boxColor} textAnchor="middle">Q3:{q.q3.toFixed(1)}</text>
                  <text x={x(q.max)} y={60} fontSize={7} fill={axisColor} textAnchor="middle">{q.max.toFixed(1)}</text>
                </>
              )
            })()}
          </svg>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 12px', padding: '4px 8px', borderRadius: 6, background: s.surface }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>IQR</span><span style={s.statValue}>{q.iqr.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>Mean</span><span style={s.statValue}>{mean(data).toFixed(2)}</span></div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// 4. SCATTER PLOT + REGRESSION
// ============================================================

function CanvasScatterPlot({ element, isDark }: CanvasWidgetProps) {
  const s = cw(isDark)
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const [rawX, setRawX] = useState((cfg.rawX as string) || '1, 2, 3, 4, 5, 6, 7, 8')
  const [rawY, setRawY] = useState((cfg.rawY as string) || '2.1, 3.8, 6.5, 7.2, 9.8, 11.3, 14.1, 15.6')
  const [showReg, setShowReg] = useState((cfg.showRegression as boolean) !== false)

  const xs = useMemo(() => rawX.split(/[,\s]+/).map(v => parseFloat(v.trim())).filter(n => !isNaN(n)), [rawX])
  const ys = useMemo(() => rawY.split(/[,\s]+/).map(v => parseFloat(v.trim())).filter(n => !isNaN(n)), [rawY])
  const n = Math.min(xs.length, ys.length)
  const pxs = xs.slice(0, n), pys = ys.slice(0, n)
  const reg = useMemo(() => n >= 2 ? linearRegression(pxs, pys) : null, [pxs, pys, n])

  const dotColor = isDark ? '#60a5fa' : '#2563eb'
  const lineColor = isDark ? '#f87171' : '#dc2626'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisColor = isDark ? '#475569' : '#94a3b8'

  const padX = 35, padY = 10, padR = 10, padB = 25
  const svgW = 280, svgH = 150
  const plotW = svgW - padX - padR, plotH = svgH - padY - padB

  const allX = [...pxs], allY = [...pys]
  if (reg && showReg) {
    allX.push(pxs[0], pxs[pxs.length - 1])
    allY.push(reg.intercept + reg.slope * pxs[0], reg.intercept + reg.slope * pxs[pxs.length - 1])
  }
  const xMin = Math.min(...allX) - 0.5, xMax = Math.max(...allX) + 0.5
  const yMin = Math.min(...allY) - 1, yMax = Math.max(...allY) + 1
  const sx = (v: number) => padX + ((v - xMin) / (xMax - xMin)) * plotW
  const sy = (v: number) => padY + plotH - ((v - yMin) / (yMax - yMin)) * plotH

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: s.text, display: 'block', marginBottom: 2 }}>X values</label>
          <input value={rawX} onChange={e => { setRawX(e.target.value); updateConfig({ rawX: e.target.value }) }}
            style={{ ...s.input, width: '100%', fontFamily: 'monospace', fontSize: 11 }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: s.text, display: 'block', marginBottom: 2 }}>Y values</label>
          <input value={rawY} onChange={e => { setRawY(e.target.value); updateConfig({ rawY: e.target.value }) }}
            style={{ ...s.input, width: '100%', fontFamily: 'monospace', fontSize: 11 }} />
        </div>
      </div>
      <button onClick={() => { const v = !showReg; setShowReg(v); updateConfig({ showRegression: v }) }} style={s.btn(showReg)}>
        {showReg ? 'Hide' : 'Show'} Regression Line
      </button>
      {n >= 2 && (
        <>
          <svg viewBox={"0 0 " + svgW + ' ' + svgH} style={{ width: '100%', borderRadius: 6, background: s.surface }}>
            {[0.25, 0.5, 0.75].map(f => (
              <line key={'h' + f} x1={padX} y1={sy(yMin + f * (yMax - yMin))} x2={svgW - padR} y2={sy(yMin + f * (yMax - yMin))} stroke={gridColor} strokeWidth={0.5} />
            ))}
            {showReg && reg && (
              <line x1={sx(xMin)} y1={sy(reg.intercept + reg.slope * xMin)}
                x2={sx(xMax)} y2={sy(reg.intercept + reg.slope * xMax)}
                stroke={lineColor} strokeWidth={1.5} strokeDasharray="4 2" />
            )}
            {pxs.map((x, i) => (
              <circle key={i} cx={sx(x)} cy={sy(pys[i])} r={3.5} fill={dotColor} opacity={0.85} />
            ))}
            <line x1={padX} y1={svgH - padB} x2={svgW - padR} y2={svgH - padB} stroke={axisColor} strokeWidth={1} />
            <line x1={padX} y1={padY} x2={padX} y2={svgH - padB} stroke={axisColor} strokeWidth={1} />
          </svg>
          {reg && (
            <div style={{ padding: '4px 8px', borderRadius: 6, background: s.surface, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={s.statLabel}>Equation</span>
                <span style={{ ...s.statValue, fontSize: 10, color: lineColor }}>
                  y = {reg.slope.toFixed(3)}x {reg.intercept >= 0 ? '+ ' : '- '}{Math.abs(reg.intercept).toFixed(3)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>r</span><span style={s.statValue}>{reg.r.toFixed(4)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>r-squared</span><span style={s.statValue}>{reg.r2.toFixed(4)}</span></div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ============================================================
// 5. NORMAL DISTRIBUTION VISUALIZER
// ============================================================

function CanvasNormalDist({ element, isDark }: CanvasWidgetProps) {
  const s = cw(isDark)
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const [mu, setMu] = useState((cfg.mu as number) ?? 0)
  const [sigma, setSigma] = useState((cfg.sigma as number) ?? 1)
  const [shadeFrom, setShadeFrom] = useState((cfg.shadeFrom as number) ?? -1)
  const [shadeTo, setShadeTo] = useState((cfg.shadeTo as number) ?? 1)
  const [shading, setShading] = useState((cfg.shading as boolean) !== false)

  const curveColor = isDark ? '#34d399' : '#059669'
  const shadeColor = isDark ? 'rgba(52,211,153,0.25)' : 'rgba(5,150,105,0.18)'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisColor = isDark ? '#475569' : '#94a3b8'

  const xMin = mu - 4 * sigma, xMax = mu + 4 * sigma
  const steps = 100, dx = (xMax - xMin) / steps
  const points: { x: number; y: number }[] = []
  let maxY = 0
  for (let i = 0; i <= steps; i++) { const x = xMin + i * dx; const y = normalPDF(x, mu, sigma); points.push({ x, y }); if (y > maxY) maxY = y }
  maxY *= 1.1

  const svgW = 280, svgH = 130
  const pad = { l: 30, r: 10, t: 10, b: 22 }
  const pw = svgW - pad.l - pad.r, ph = svgH - pad.t - pad.b
  const sx = (v: number) => pad.l + ((v - xMin) / (xMax - xMin)) * pw
  const sy = (v: number) => pad.t + ph - (v / maxY) * ph

  const clampedFrom = Math.max(xMin, Math.min(xMax, shadeFrom))
  const clampedTo = Math.max(xMin, Math.min(xMax, shadeTo))
  const shadeSteps = 50, shadeDx = (clampedTo - clampedFrom) / shadeSteps
  const shadePath = shading
    ? 'M' + sx(clampedFrom) + ',' + sy(0) +
      Array.from({ length: shadeSteps + 1 }, (_, i) => {
        const x = clampedFrom + i * shadeDx
        return ' L' + sx(x) + ',' + sy(normalPDF(x, mu, sigma))
      }).join('') +
      ' L' + sx(clampedTo) + ',' + sy(0) + ' Z'
    : ''

  const curvePath = 'M' + points.map(p => sx(p.x) + ',' + sy(p.y)).join(' L')
  const area = normalCDF(clampedTo, mu, sigma) - normalCDF(clampedFrom, mu, sigma)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: s.text, minWidth: 40 }}>Mean:</span>
        <input type="range" min={-5} max={5} step={0.1} value={mu} onChange={e => { const v = Number(e.target.value); setMu(v); updateConfig({ mu: v }) }} style={{ flex: 1, accentColor: curveColor }} />
        <span style={{ fontSize: 10, color: s.bright, fontFamily: 'monospace', minWidth: 28 }}>{mu.toFixed(1)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: s.text, minWidth: 40 }}>SD:</span>
        <input type="range" min={0.2} max={3} step={0.1} value={sigma} onChange={e => { const v = Number(e.target.value); setSigma(v); updateConfig({ sigma: v }) }} style={{ flex: 1, accentColor: curveColor }} />
        <span style={{ fontSize: 10, color: s.bright, fontFamily: 'monospace', minWidth: 28 }}>{sigma.toFixed(1)}</span>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {[
          { label: '68%', from: -1, to: 1 }, { label: '95%', from: -2, to: 2 },
          { label: '99.7%', from: -3, to: 3 },
        ].map(p => (
          <button key={p.label} onClick={() => { setShading(true); setShadeFrom(p.from); setShadeTo(p.to); updateConfig({ shading: true, shadeFrom: p.from, shadeTo: p.to }) }}
            style={{ ...s.btn(false), fontSize: 9 }}>{p.label}</button>
        ))}
      </div>
      <svg viewBox={"0 0 " + svgW + ' ' + svgH} style={{ width: '100%', borderRadius: 6, background: s.surface }}>
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1={pad.l} y1={sy(f * maxY)} x2={svgW - pad.r} y2={sy(f * maxY)} stroke={gridColor} strokeWidth={0.5} />
        ))}
        {shadePath && <path d={shadePath} fill={shadeColor} stroke="none" />}
        <path d={curvePath} fill="none" stroke={curveColor} strokeWidth={1.5} />
        <line x1={sx(mu)} y1={pad.t} x2={sx(mu)} y2={svgH - pad.b} stroke={axisColor} strokeWidth={0.5} strokeDasharray="3 3" />
        <line x1={pad.l} y1={svgH - pad.b} x2={svgW - pad.r} y2={svgH - pad.b} stroke={axisColor} strokeWidth={1} />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={svgH - pad.b} stroke={axisColor} strokeWidth={1} />
        {shading && (
          <text x={svgW / 2} y={pad.t + 12} fontSize={9} fill={curveColor} textAnchor="middle" fontWeight={600}>
            P = {area.toFixed(4)} ({(area * 100).toFixed(1)}%)
          </text>
        )}
      </svg>
    </div>
  )
}

// ============================================================
// 6. PROBABILITY SIMULATOR
// ============================================================

const SPINNER_SEGS = [
  { label: 'Red', color: '#ef4444' }, { label: 'Blue', color: '#3b82f6' },
  { label: 'Green', color: '#22c55e' }, { label: 'Yellow', color: '#eab308' },
]

type SimType = 'coin' | 'dice' | 'spinner'

function CanvasProbabilitySim({ element, isDark }: CanvasWidgetProps) {
  const s = cw(isDark)
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const [simType, setSimType] = useState<SimType>((cfg.simType as SimType) || 'coin')
  const [results, setResults] = useState<Map<string, number>>(new Map(Object.entries((cfg.results as Record<string, number>) || {})))
  const [totalRuns, setTotalRuns] = useState((cfg.totalRuns as number) || 0)
  const [spinning, setSpinning] = useState(false)
  const [spinAngle, setSpinAngle] = useState(0)

  const runSim = useCallback((n: number) => {
    const res = new Map<string, number>()
    if (simType === 'coin') {
      let heads = 0, tails = 0
      for (let i = 0; i < n; i++) { if (Math.random() < 0.5) heads++; else tails++ }
      res.set('Heads', heads); res.set('Tails', tails)
    } else if (simType === 'dice') {
      for (let i = 1; i <= 6; i++) res.set(String(i), 0)
      for (let i = 0; i < n; i++) { const f = Math.floor(Math.random() * 6) + 1; res.set(String(f), (res.get(String(f)) || 0) + 1) }
    } else {
      SPINNER_SEGS.forEach(seg => res.set(seg.label, 0))
      for (let i = 0; i < n; i++) { const idx = Math.floor(Math.random() * SPINNER_SEGS.length); res.set(SPINNER_SEGS[idx].label, (res.get(SPINNER_SEGS[idx].label) || 0) + 1) }
    }
    if (simType === 'spinner') { setSpinning(true); setSpinAngle(prev => prev + 360 + Math.random() * 720); setTimeout(() => setSpinning(false), 800) }
    setResults(res)
    const newTotal = totalRuns + n
    setTotalRuns(newTotal)
    const resultsObj: Record<string, number> = {}
    res.forEach((v, k) => { resultsObj[k] = v })
    updateConfig({ results: resultsObj, totalRuns: newTotal, simType })
  }, [simType, totalRuns, updateConfig])

  const resetSim = () => { setResults(new Map()); setTotalRuns(0); updateConfig({ results: {}, totalRuns: 0 }) }

  const barColors = ['#60a5fa', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#fb923c']
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisColor = isDark ? '#475569' : '#94a3b8'

  const sortedResults = useMemo(() => results.size === 0 ? [] : [...results.entries()].sort((a, b) => b[1] - a[1]), [results])
  const maxCount = sortedResults.length > 0 ? sortedResults[0][1] : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {([['coin', 'Coin'], ['dice', 'Dice'], ['spinner', 'Spinner']] as [SimType, string][]).map(([id, label]) => (
          <button key={id} onClick={() => { setSimType(id); resetSim() }} style={s.btn(simType === id)}>{label}</button>
        ))}
      </div>
      {simType === 'spinner' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg width={90} height={90} viewBox="-50 -50 100 100" style={{ transition: spinning ? 'transform 0.8s cubic-bezier(0.2,0.8,0.3,1)' : 'none', transform: 'rotate(' + spinAngle + 'deg)' }}>
            {SPINNER_SEGS.map((seg, i) => {
              const startAngle = (i * 360) / SPINNER_SEGS.length - 90
              const endAngle = ((i + 1) * 360) / SPINNER_SEGS.length - 90
              const r = 40
              const x1 = r * Math.cos((startAngle * Math.PI) / 180)
              const y1 = r * Math.sin((startAngle * Math.PI) / 180)
              const x2 = r * Math.cos((endAngle * Math.PI) / 180)
              const y2 = r * Math.sin((endAngle * Math.PI) / 180)
              const largeArc = endAngle - startAngle > 180 ? 1 : 0
              return (
                <path key={i} d={"M0,0 L" + x1 + ',' + y1 + ' A' + r + ',' + r + ' 0 ' + largeArc + ',1 ' + x2 + ',' + y2 + ' Z'}
                  fill={seg.color} stroke={isDark ? '#1e293b' : '#fff'} strokeWidth={2} opacity={0.85} />
              )
            })}
            <circle cx={0} cy={0} r={3} fill={isDark ? '#1e293b' : '#fff'} />
          </svg>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: s.text }}>Trials:</span>
        {[10, 100, 1000].map(n => (
          <button key={n} onClick={() => runSim(n)} style={s.btn(false)}>{n}</button>
        ))}
        <button onClick={resetSim} style={{ ...s.btn(false), color: '#f87171' }}>Reset</button>
      </div>
      {totalRuns > 0 && (
        <>
          <svg viewBox="0 0 280 80" style={{ width: '100%', borderRadius: 6, background: s.surface }}>
            {sortedResults.map(([label, count], i) => {
              const barH = maxCount > 0 ? (count / maxCount) * 55 : 0
              const barW = 230 / sortedResults.length
              const x = 42 + i * barW
              const y = 60 - barH
              const freq = count / totalRuns
              return (
                <g key={label}>
                  <rect x={x + 1} y={y} width={barW - 2} height={barH} fill={barColors[i % barColors.length]} rx={2} opacity={0.85} />
                  <text x={x + barW / 2} y={y - 2} fontSize={7} fill={axisColor} textAnchor="middle">{(freq * 100).toFixed(1)}%</text>
                  <text x={x + barW / 2} y={74} fontSize={7} fill={axisColor} textAnchor="middle">{label}</text>
                </g>
              )
            })}
            <line x1={40} y1={60} x2={275} y2={60} stroke={axisColor} strokeWidth={1} />
          </svg>
          <div style={{ fontSize: 10, color: s.text, padding: '3px 8px', borderRadius: 6, background: s.surface }}>
            Total: <span style={{ fontWeight: 600, color: s.bright }}>{totalRuns.toLocaleString()}</span> trials
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// WIDGET REGISTRY & ROUTER
// ============================================================

import {
  CanvasLanguageWidgetRenderer,
  getLangWidgetDefaultConfig,
  getLangWidgetDefaultSize,
  LANG_WIDGET_KIND_LABELS,
} from './CanvasLanguageWidgets'
import {
  CanvasFractionCircle,
  CanvasFractionBar,
  CanvasAngleMaker,
  CanvasNumberLine,
  CanvasPolygon,
  CanvasCoordinatePlane,
  CanvasVennDiagram,
  CanvasBarChart,
  CanvasPieChart,
  getMathWidgetDefaultConfig,
  getMathWidgetDefaultSize,
  MATH_WIDGET_KIND_LABELS,
} from './CanvasMathWidgets'

const WIDGET_COMPONENTS: Record<string, React.ComponentType<CanvasWidgetProps>> = {
  // Statistics widgets
  'stat-data-table': CanvasDataTable,
  'stat-histogram': CanvasHistogram,
  'stat-box-plot': CanvasBoxPlot,
  'stat-scatter': CanvasScatterPlot,
  'stat-normal-dist': CanvasNormalDist,
  'stat-probability': CanvasProbabilitySim,
  // Math widgets
  'math-fraction-circle': CanvasFractionCircle,
  'math-fraction-bar': CanvasFractionBar,
  'math-angle-maker': CanvasAngleMaker,
  'math-number-line': CanvasNumberLine,
  'math-polygon': CanvasPolygon,
  'math-coordinate-plane': CanvasCoordinatePlane,
  'math-venn-diagram': CanvasVennDiagram,
  'math-bar-chart': CanvasBarChart,
  'math-pie-chart': CanvasPieChart,
  // Language widgets
  'lang-pos-tagger': CanvasLanguageWidgetRenderer as unknown as React.ComponentType<CanvasWidgetProps>,
  'lang-sentence-structure': CanvasLanguageWidgetRenderer as unknown as React.ComponentType<CanvasWidgetProps>,
  'lang-story-elements': CanvasLanguageWidgetRenderer as unknown as React.ComponentType<CanvasWidgetProps>,
  'lang-paragraph-organizer': CanvasLanguageWidgetRenderer as unknown as React.ComponentType<CanvasWidgetProps>,
  'lang-vocab-flashcards': CanvasLanguageWidgetRenderer as unknown as React.ComponentType<CanvasWidgetProps>,
  'lang-figurative-language': CanvasLanguageWidgetRenderer as unknown as React.ComponentType<CanvasWidgetProps>,
  'lang-punctuation': CanvasLanguageWidgetRenderer as unknown as React.ComponentType<CanvasWidgetProps>,
  'lang-phonics': CanvasLanguageWidgetRenderer as unknown as React.ComponentType<CanvasWidgetProps>,
  'lang-sentence-expansion': CanvasLanguageWidgetRenderer as unknown as React.ComponentType<CanvasWidgetProps>,
}

export function CanvasWidgetRenderer({ element, isDark }: CanvasWidgetProps) {
  // Language widgets go through their own renderer (avoids double-wrapping)
  const isLangWidget = element.widgetKind.startsWith('lang-')
  if (isLangWidget) {
    return <CanvasLanguageWidgetRenderer element={element} isDark={isDark} />
  }
  const Component = WIDGET_COMPONENTS[element.widgetKind]
  if (!Component) {
    // Fallback: try MathElementRenderers for legacy math-* element types
    if (element.widgetKind.startsWith('math-')) {
      return <div style={{ padding: 12, color: isDark ? '#fbbf24' : '#d97706', fontSize: 11 }}>
        This tool is now available as an interactive board widget. Use &quot;Add to Board&quot; in the Math toolkit panel.
      </div>
    }
    return <div style={{ padding: 12, color: '#f87171', fontSize: 12 }}>Unknown widget: {element.widgetKind}</div>
  }
  return <Component element={element} isDark={isDark} />
}

/** Get default config for a widget kind (used when placing on board) */
export function getDefaultWidgetConfig(kind: string): Record<string, unknown> {
  switch (kind) {
    case 'stat-data-table': return { raw: '12, 15, 18, 22, 25, 14, 19, 21, 17, 30', sorted: false }
    case 'stat-histogram': return { raw: '72, 85, 90, 65, 78, 92, 88, 76, 95, 82, 70, 88, 91, 84, 77, 93, 80, 86, 74, 89', bins: 5 }
    case 'stat-box-plot': return { raw: '12, 15, 18, 22, 25, 14, 19, 21, 17, 30, 45, 8' }
    case 'stat-scatter': return { rawX: '1, 2, 3, 4, 5, 6, 7, 8', rawY: '2.1, 3.8, 6.5, 7.2, 9.8, 11.3, 14.1, 15.6', showRegression: true }
    case 'stat-normal-dist': return { mu: 0, sigma: 1, shadeFrom: -1, shadeTo: 1, shading: true }
    case 'stat-probability': return { simType: 'coin', results: {}, totalRuns: 0 }
    // Math widgets
    case 'math-fraction-circle': return getMathWidgetDefaultConfig('math-fraction-circle')
    case 'math-fraction-bar': return getMathWidgetDefaultConfig('math-fraction-bar')
    case 'math-angle-maker': return getMathWidgetDefaultConfig('math-angle-maker')
    case 'math-number-line': return getMathWidgetDefaultConfig('math-number-line')
    case 'math-polygon': return getMathWidgetDefaultConfig('math-polygon')
    case 'math-coordinate-plane': return getMathWidgetDefaultConfig('math-coordinate-plane')
    case 'math-venn-diagram': return getMathWidgetDefaultConfig('math-venn-diagram')
    case 'math-bar-chart': return getMathWidgetDefaultConfig('math-bar-chart')
    case 'math-pie-chart': return getMathWidgetDefaultConfig('math-pie-chart')
    // Language widgets
    case 'lang-pos-tagger': return getLangWidgetDefaultConfig('lang-pos-tagger')
    case 'lang-sentence-structure': return getLangWidgetDefaultConfig('lang-sentence-structure')
    case 'lang-story-elements': return getLangWidgetDefaultConfig('lang-story-elements')
    case 'lang-paragraph-organizer': return getLangWidgetDefaultConfig('lang-paragraph-organizer')
    case 'lang-vocab-flashcards': return getLangWidgetDefaultConfig('lang-vocab-flashcards')
    case 'lang-figurative-language': return getLangWidgetDefaultConfig('lang-figurative-language')
    case 'lang-punctuation': return getLangWidgetDefaultConfig('lang-punctuation')
    case 'lang-phonics': return getLangWidgetDefaultConfig('lang-phonics')
    case 'lang-sentence-expansion': return getLangWidgetDefaultConfig('lang-sentence-expansion')
    default: return {}
  }
}

/** Get default size for a widget kind */
export function getWidgetDefaultSize(kind: string): { width: number; height: number } {
  switch (kind) {
    case 'stat-data-table': return { width: 320, height: 380 }
    case 'stat-histogram': return { width: 320, height: 400 }
    case 'stat-box-plot': return { width: 320, height: 320 }
    case 'stat-scatter': return { width: 340, height: 420 }
    case 'stat-normal-dist': return { width: 320, height: 380 }
    case 'stat-probability': return { width: 320, height: 420 }
    // Math widgets
    case 'math-fraction-circle': return getMathWidgetDefaultSize('math-fraction-circle')
    case 'math-fraction-bar': return getMathWidgetDefaultSize('math-fraction-bar')
    case 'math-angle-maker': return getMathWidgetDefaultSize('math-angle-maker')
    case 'math-number-line': return getMathWidgetDefaultSize('math-number-line')
    case 'math-polygon': return getMathWidgetDefaultSize('math-polygon')
    case 'math-coordinate-plane': return getMathWidgetDefaultSize('math-coordinate-plane')
    case 'math-venn-diagram': return getMathWidgetDefaultSize('math-venn-diagram')
    case 'math-bar-chart': return getMathWidgetDefaultSize('math-bar-chart')
    case 'math-pie-chart': return getMathWidgetDefaultSize('math-pie-chart')
    // Language widgets
    case 'lang-pos-tagger': return getLangWidgetDefaultSize('lang-pos-tagger')
    case 'lang-sentence-structure': return getLangWidgetDefaultSize('lang-sentence-structure')
    case 'lang-story-elements': return getLangWidgetDefaultSize('lang-story-elements')
    case 'lang-paragraph-organizer': return getLangWidgetDefaultSize('lang-paragraph-organizer')
    case 'lang-vocab-flashcards': return getLangWidgetDefaultSize('lang-vocab-flashcards')
    case 'lang-figurative-language': return getLangWidgetDefaultSize('lang-figurative-language')
    case 'lang-punctuation': return getLangWidgetDefaultSize('lang-punctuation')
    case 'lang-phonics': return getLangWidgetDefaultSize('lang-phonics')
    case 'lang-sentence-expansion': return getLangWidgetDefaultSize('lang-sentence-expansion')
    default: return { width: 300, height: 300 }
  }
}

/** Human-readable labels for widget kinds */
export const WIDGET_KIND_LABELS: Record<string, string> = {
  'stat-data-table': 'Data Table & Statistics',
  'stat-histogram': 'Histogram Builder',
  'stat-box-plot': 'Box & Whisker Plot',
  'stat-scatter': 'Scatter Plot & Regression',
  'stat-normal-dist': 'Normal Distribution',
  'stat-probability': 'Probability Simulator',
  // Math widgets
  ...MATH_WIDGET_KIND_LABELS,
  // Language widgets
  ...LANG_WIDGET_KIND_LABELS,
}
