'use client'

import React, { useState, useMemo, useCallback } from 'react'

// ============================================================
// Shared math helpers (no external deps — pure implementations)
// ============================================================

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

function quartiles(arr: number[]): { q1: number; q2: number; q3: number; iqr: number; min: number; max: number; outliers: number[] } {
  const s = [...arr].sort((a, b) => a - b)
  const q2 = median(s)
  const mid = Math.floor(s.length / 2)
  const lower = s.slice(0, mid)
  const upper = s.slice(mid + (s.length % 2 === 0 ? 0 : 1))
  const q1 = median(lower.length > 0 ? lower : [s[0]])
  const q3 = median(upper.length > 0 ? upper : [s[s.length - 1]])
  const iqr = q3 - q1
  const lowerFence = q1 - 1.5 * iqr
  const upperFence = q3 + 1.5 * iqr
  const nonOutlier = s.filter(v => v >= lowerFence && v <= upperFence)
  return {
    q1, q2, q3, iqr,
    min: nonOutlier.length > 0 ? nonOutlier[0] : s[0],
    max: nonOutlier.length > 0 ? nonOutlier[nonOutlier.length - 1] : s[s.length - 1],
    outliers: s.filter(v => v < lowerFence || v > upperFence),
  }
}

function linearRegression(xs: number[], ys: number[]): { slope: number; intercept: number; r: number; r2: number } {
  const n = xs.length
  if (n < 2) return { slope: 0, intercept: 0, r: 0, r2: 0 }
  const mx = mean(xs), my = mean(ys)
  let sxy = 0, sxx = 0, syy = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my
    sxy += dx * dy
    sxx += dx * dx
    syy += dy * dy
  }
  const denom = sxx * syy
  const r = denom === 0 ? 0 : sxy / Math.sqrt(denom)
  return { slope: sxx === 0 ? 0 : sxy / sxx, intercept: my - (sxx === 0 ? 0 : sxy / sxx) * mx, r, r2: r * r }
}

// Normal PDF
function normalPDF(x: number, mu: number, sigma: number): number {
  const s2 = sigma * sigma
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) ** 2) / s2)
}

// Standard normal CDF approximation (Abramowitz & Stegun)
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

// ============================================================
// Shared UI helpers
// ============================================================

interface ToolProps { isDark: boolean }

const styles = (isDark: boolean) => ({
  bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
  text: isDark ? '#94a3b8' : '#475569',
  bright: isDark ? '#e2e8f0' : '#1e293b',
  accent: '#34d399',
  accentBg: 'rgba(5,150,105,0.15)',
  accentBorder: 'rgba(5,150,105,0.3)',
  blue: '#60a5fa',
  blueBg: 'rgba(59,130,246,0.15)',
  blueBorder: 'rgba(59,130,246,0.3)',
  orange: '#fb923c',
  orangeBg: 'rgba(249,115,22,0.15)',
  red: '#f87171',
  redBg: 'rgba(248,113,113,0.15)',
  purple: '#a78bfa',
  purpleBg: 'rgba(167,139,250,0.15)',
  input: {
    padding: '3px 6px', borderRadius: 4, fontSize: 11,
    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none' as const,
  },
  btn: (active: boolean) => ({
    padding: '2px 6px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
    background: active ? 'rgba(5,150,105,0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
    border: active ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
    color: active ? '#34d399' : (isDark ? '#94a3b8' : '#475569'),
  }),
  placeBtn: {
    padding: '5px 14px', borderRadius: 5, fontSize: 11, fontWeight: 600 as const,
    background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)',
    color: '#34d399', cursor: 'pointer' as const, alignSelf: 'flex-end' as const,
  },
  statLabel: { fontSize: 10, color: isDark ? '#64748b' : '#94a3b8', minWidth: 55, textAlign: 'right' as const },
  statValue: { fontSize: 12, fontWeight: 600 as const, color: isDark ? '#e2e8f0' : '#1e293b', fontFamily: 'monospace' },
})

// ============================================================
// 1. DATA TABLE + LIVE SUMMARY STATISTICS  (Grades 6-12)
// ============================================================

export function DataTable({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [raw, setRaw] = useState('12, 15, 18, 22, 25, 14, 19, 21, 17, 30')
  const [sorted, setSorted] = useState(false)

  const data = useMemo(() => {
    const nums = raw.split(/[,\s\n]+/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
    return sorted ? [...nums].sort((a, b) => a - b) : nums
  }, [raw, sorted])

  const stats = useMemo(() => {
    if (data.length === 0) return null
    const q = quartiles(data)
    return {
      count: data.length,
      sum: data.reduce((a, b) => a + b, 0),
      mean: mean(data),
      median: median(data),
      mode: mode(data),
      range: data.length > 0 ? Math.max(...data) - Math.min(...data) : 0,
      iqr: q.iqr,
      stdev: stdev(data),
      variance: variance(data),
      min: Math.min(...data),
      max: Math.max(...data),
      q1: q.q1, q3: q.q3,
    }
  }, [data])

  const statRow = (label: string, value: string | number) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
      <span style={s.statLabel}>{label}</span>
      <span style={s.statValue}>{typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(4)) : value}</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <textarea value={raw} onChange={e => setRaw(e.target.value)} placeholder="Enter numbers separated by commas..."
        style={{ ...s.input, width: '100%', minHeight: 60, resize: 'vertical', fontFamily: 'monospace' }} />
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={() => setSorted(p => !p)} style={s.btn(sorted)}>
          {sorted ? 'Sorted' : 'Original'}
        </button>
        <span style={{ fontSize: 10, color: s.text }}>{data.length} values</span>
      </div>
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', padding: '6px 8px', borderRadius: 6, background: s.bg }}>
          {statRow('Count', stats.count)}
          {statRow('Sum', stats.sum)}
          {statRow('Mean', stats.mean)}
          {statRow('Median', stats.median)}
          {statRow('Mode', stats.mode.length > 0 ? stats.mode.join(', ') : 'None')}
          {statRow('Range', stats.range)}
          {statRow('Std Dev', stats.stdev)}
          {statRow('Variance', stats.variance)}
          {statRow('Min', stats.min)}
          {statRow('Max', stats.max)}
          {statRow('Q1', stats.q1)}
          {statRow('Q3', stats.q3)}
          {statRow('IQR', stats.iqr)}
        </div>
      )}
    </div>
  )
}

// ============================================================
// 2. HISTOGRAM BUILDER  (Grades 6-12)
// ============================================================

export function HistogramBuilder({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [raw, setRaw] = useState('72, 85, 90, 65, 78, 92, 88, 76, 95, 82, 70, 88, 91, 84, 77, 93, 80, 86, 74, 89')
  const [bins, setBins] = useState(5)

  const data = useMemo(() =>
    raw.split(/[,\s\n]+/).map(v => parseFloat(v.trim())).filter(n => !isNaN(n)),
  [raw])

  const histogram = useMemo(() => {
    if (data.length === 0) return null
    const min = Math.min(...data)
    const max = Math.max(...data)
    if (min === max) return null
    const binWidth = (max - min) / bins
    const bucketCounts = new Array(bins).fill(0) as number[]
    const bucketLabels: string[] = []
    for (let i = 0; i < bins; i++) {
      const lo = min + i * binWidth
      const hi = min + (i + 1) * binWidth
      bucketLabels.push(i === bins - 1 ? lo.toFixed(1) + '+' : lo.toFixed(1) + '-' + hi.toFixed(1))
    }
    data.forEach(v => {
      let idx = Math.floor((v - min) / binWidth)
      if (idx >= bins) idx = bins - 1
      if (idx < 0) idx = 0
      bucketCounts[idx]++
    })
    const maxCount = Math.max(...bucketCounts)
    return { bucketCounts, bucketLabels, maxCount, binWidth, min, max }
  }, [data, bins])

  const barColor = isDark ? '#34d399' : '#059669'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisColor = isDark ? '#475569' : '#94a3b8'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <textarea value={raw} onChange={e => setRaw(e.target.value)} placeholder="Enter data..."
        style={{ ...s.input, width: '100%', minHeight: 48, resize: 'vertical', fontFamily: 'monospace' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: s.text }}>Bins:</span>
        {[3, 4, 5, 6, 7, 8, 10, 12].map(n => (
          <button key={n} onClick={() => setBins(n)} style={s.btn(bins === n)}>{n}</button>
        ))}
      </div>
      {histogram && (
        <svg viewBox="0 0 280 140" style={{ width: '100%', borderRadius: 6, background: s.bg }}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(frac => (
            <line key={frac} x1={30} y1={10 + (1 - frac) * 110} x2={275} y2={10 + (1 - frac) * 110}
              stroke={gridColor} strokeWidth={0.5} />
          ))}
          {/* Y axis labels */}
          <text x={26} y={14} fontSize={7} fill={axisColor} textAnchor="end">{histogram.maxCount}</text>
          <text x={26} y={69} fontSize={7} fill={axisColor} textAnchor="end">{Math.round(histogram.maxCount / 2)}</text>
          <text x={26} y={124} fontSize={7} fill={axisColor} textAnchor="end">0</text>
          {/* Bars */}
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
          {/* Axes */}
          <line x1={30} y1={120} x2={275} y2={120} stroke={axisColor} strokeWidth={1} />
          <line x1={30} y1={10} x2={30} y2={120} stroke={axisColor} strokeWidth={1} />
        </svg>
      )}
    </div>
  )
}

// ============================================================
// 3. BOX & WHISKER PLOT GENERATOR  (Grades 6-12)
// ============================================================

export function BoxPlotGenerator({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [raw, setRaw] = useState('12, 15, 18, 22, 25, 14, 19, 21, 17, 30, 45, 8')

  const data = useMemo(() =>
    raw.split(/[,\s\n]+/).map(v => parseFloat(v.trim())).filter(n => !isNaN(n)),
  [raw])

  const q = useMemo(() => data.length >= 4 ? quartiles(data) : null, [data])

  const boxColor = isDark ? '#34d399' : '#059669'
  const boxFill = isDark ? 'rgba(52,211,153,0.15)' : 'rgba(5,150,105,0.1)'
  const axisColor = isDark ? '#475569' : '#94a3b8'
  const outlierColor = '#f87171'

  const scaleToX = (val: number, min: number, max: number) => {
    if (max === min) return 150
    return 30 + ((val - min) / (max - min)) * 240
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <textarea value={raw} onChange={e => setRaw(e.target.value)} placeholder="Enter data (need 4+ values)..."
        style={{ ...s.input, width: '100%', minHeight: 48, resize: 'vertical', fontFamily: 'monospace' }} />
      {q && (
        <>
          <svg viewBox="0 0 280 100" style={{ width: '100%', borderRadius: 6, background: s.bg }}>
            {(() => {
              const allVals = [...data, ...q.outliers]
              const lo = Math.min(...allVals)
              const hi = Math.max(...allVals)
              const pad = (hi - lo) * 0.1 || 1
              const rangeMin = lo - pad
              const rangeMax = hi + pad
              const x = (v: number) => scaleToX(v, rangeMin, rangeMax)
              return (
                <>
                  {/* Whisker line (min to max) */}
                  <line x1={x(q.min)} y1={40} x2={x(q.max)} y2={40} stroke={axisColor} strokeWidth={1} />
                  {/* Left whisker cap */}
                  <line x1={x(q.min)} y1={32} x2={x(q.min)} y2={48} stroke={axisColor} strokeWidth={1.5} />
                  {/* Right whisker cap */}
                  <line x1={x(q.max)} y1={32} x2={x(q.max)} y2={48} stroke={axisColor} strokeWidth={1.5} />
                  {/* IQR Box */}
                  <rect x={x(q.q1)} y={24} width={x(q.q3) - x(q.q1)} height={32} fill={boxFill} stroke={boxColor} strokeWidth={1.5} rx={3} />
                  {/* Median line */}
                  <line x1={x(q.q2)} y1={24} x2={x(q.q2)} y2={56} stroke={boxColor} strokeWidth={2} />
                  {/* Mean diamond */}
                  <polygon
                    points={x(mean(data)) + ',40 ' + (x(mean(data)) - 4) + ',34 ' + (x(mean(data))) + ',28 ' + (x(mean(data)) + 4) + ',34'}
                    fill={isDark ? '#a78bfa' : '#7c3aed'} stroke="none" opacity={0.7}
                  />
                  {/* Outliers */}
                  {q.outliers.map((o, i) => (
                    <circle key={i} cx={x(o)} cy={40} r={3} fill={outlierColor} opacity={0.8} />
                  ))}
                  {/* Labels */}
                  <text x={x(q.min)} y={68} fontSize={7} fill={axisColor} textAnchor="middle">{q.min.toFixed(1)}</text>
                  <text x={x(q.q1)} y={18} fontSize={7} fill={boxColor} textAnchor="middle">Q1: {q.q1.toFixed(1)}</text>
                  <text x={x(q.q2)} y={18} fontSize={7} fill={boxColor} textAnchor="middle">Med: {q.q2.toFixed(1)}</text>
                  <text x={x(q.q3)} y={18} fontSize={7} fill={boxColor} textAnchor="middle">Q3: {q.q3.toFixed(1)}</text>
                  <text x={x(q.max)} y={68} fontSize={7} fill={axisColor} textAnchor="middle">{q.max.toFixed(1)}</text>
                  {/* Axis */}
                  <line x1={25} y1={75} x2={275} y2={75} stroke={axisColor} strokeWidth={0.5} />
                </>
              )
            })()}
          </svg>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', padding: '6px 8px', borderRadius: 6, background: s.bg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>IQR</span><span style={s.statValue}>{q.iqr.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>Outliers</span><span style={s.statValue}>{q.outliers.length}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>Mean</span><span style={s.statValue}>{mean(data).toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>Std Dev</span><span style={s.statValue}>{stdev(data).toFixed(2)}</span></div>
          </div>
        </>
      )}
      {data.length > 0 && data.length < 4 && (
        <p style={{ fontSize: 10, color: s.text, opacity: 0.7 }}>Enter at least 4 data points to generate a box plot.</p>
      )}
    </div>
  )
}

// ============================================================
// 4. SCATTER PLOT + REGRESSION LINE  (Grades 8-12)
// ============================================================

export function ScatterPlot({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [rawX, setRawX] = useState('1, 2, 3, 4, 5, 6, 7, 8')
  const [rawY, setRawY] = useState('2.1, 3.8, 6.5, 7.2, 9.8, 11.3, 14.1, 15.6')
  const [showRegression, setShowRegression] = useState(true)

  const xs = useMemo(() => rawX.split(/[,\s]+/).map(v => parseFloat(v.trim())).filter(n => !isNaN(n)), [rawX])
  const ys = useMemo(() => rawY.split(/[,\s]+/).map(v => parseFloat(v.trim())).filter(n => !isNaN(n)), [rawY])

  const n = Math.min(xs.length, ys.length)
  const pxs = xs.slice(0, n)
  const pys = ys.slice(0, n)

  const reg = useMemo(() => n >= 2 ? linearRegression(pxs, pys) : null, [pxs, pys, n])

  const dotColor = isDark ? '#60a5fa' : '#2563eb'
  const lineColor = isDark ? '#f87171' : '#dc2626'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisColor = isDark ? '#475569' : '#94a3b8'

  const padX = 35, padY = 10, padR = 10, padB = 25
  const svgW = 280, svgH = 160
  const plotW = svgW - padX - padR
  const plotH = svgH - padY - padB

  const allX = [...pxs], allY = [...pys]
  if (reg && showRegression) {
    allX.push(pxs[0], pxs[pxs.length - 1])
    allY.push(reg.intercept + reg.slope * pxs[0], reg.intercept + reg.slope * pxs[pxs.length - 1])
  }
  const xMin = Math.min(...allX) - 0.5
  const xMax = Math.max(...allX) + 0.5
  const yMin = Math.min(...allY) - 1
  const yMax = Math.max(...allY) + 1
  const sx = (v: number) => padX + ((v - xMin) / (xMax - xMin)) * plotW
  const sy = (v: number) => padY + plotH - ((v - yMin) / (yMax - yMin)) * plotH

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: s.text, display: 'block', marginBottom: 2 }}>X values</label>
          <input value={rawX} onChange={e => setRawX(e.target.value)} placeholder="1, 2, 3..."
            style={{ ...s.input, width: '100%', fontFamily: 'monospace' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: s.text, display: 'block', marginBottom: 2 }}>Y values</label>
          <input value={rawY} onChange={e => setRawY(e.target.value)} placeholder="2, 4, 6..."
            style={{ ...s.input, width: '100%', fontFamily: 'monospace' }} />
        </div>
      </div>
      <button onClick={() => setShowRegression(p => !p)} style={s.btn(showRegression)}>
        {showRegression ? 'Hide' : 'Show'} Regression Line
      </button>
      {n >= 2 && (
        <>
          <svg viewBox={"0 0 " + svgW + ' ' + svgH} style={{ width: '100%', borderRadius: 6, background: s.bg }}>
            {/* Grid */}
            {[0.25, 0.5, 0.75].map(f => (
              <line key={'h' + f} x1={padX} y1={sy(yMin + f * (yMax - yMin))} x2={svgW - padR} y2={sy(yMin + f * (yMax - yMin))} stroke={gridColor} strokeWidth={0.5} />
            ))}
            {[0.25, 0.5, 0.75].map(f => (
              <line key={'v' + f} x1={sx(xMin + f * (xMax - xMin))} y1={padY} x2={sx(xMin + f * (xMax - xMin))} y2={svgH - padB} stroke={gridColor} strokeWidth={0.5} />
            ))}
            {/* Regression line */}
            {showRegression && reg && (
              <line x1={sx(xMin)} y1={sy(reg.intercept + reg.slope * xMin)}
                x2={sx(xMax)} y2={sy(reg.intercept + reg.slope * xMax)}
                stroke={lineColor} strokeWidth={1.5} strokeDasharray="4 2" />
            )}
            {/* Data points */}
            {pxs.map((x, i) => (
              <circle key={i} cx={sx(x)} cy={sy(pys[i])} r={3.5} fill={dotColor} opacity={0.85} />
            ))}
            {/* Axes */}
            <line x1={padX} y1={svgH - padB} x2={svgW - padR} y2={svgH - padB} stroke={axisColor} strokeWidth={1} />
            <line x1={padX} y1={padY} x2={padX} y2={svgH - padB} stroke={axisColor} strokeWidth={1} />
            <text x={svgW / 2} y={svgH - 2} fontSize={7} fill={axisColor} textAnchor="middle">x</text>
            <text x={8} y={svgH / 2} fontSize={7} fill={axisColor} textAnchor="middle">y</text>
          </svg>
          {reg && (
            <div style={{ padding: '6px 8px', borderRadius: 6, background: s.bg, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={s.statLabel}>Equation</span>
                <span style={{ ...s.statValue, fontSize: 11, color: lineColor }}>
                  y = {reg.slope.toFixed(3)}x {reg.intercept >= 0 ? '+ ' : '- '}{Math.abs(reg.intercept).toFixed(3)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={s.statLabel}>r</span><span style={s.statValue}>{reg.r.toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={s.statLabel}>r-squared</span><span style={s.statValue}>{reg.r2.toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={s.statLabel}>Points</span><span style={s.statValue}>{n}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ============================================================
// 5. NORMAL DISTRIBUTION VISUALIZER  (Grades 9-12)
// ============================================================

export function NormalDist({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [mu, setMu] = useState(0)
  const [sigma, setSigma] = useState(1)
  const [shadeFrom, setShadeFrom] = useState(-1)
  const [shadeTo, setShadeTo] = useState(1)
  const [shading, setShading] = useState(true)

  const curveColor = isDark ? '#34d399' : '#059669'
  const shadeColor = isDark ? 'rgba(52,211,153,0.25)' : 'rgba(5,150,105,0.18)'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisColor = isDark ? '#475569' : '#94a3b8'

  const xMin = mu - 4 * sigma
  const xMax = mu + 4 * sigma
  const steps = 120
  const dx = (xMax - xMin) / steps

  const points: { x: number; y: number }[] = []
  let maxY = 0
  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * dx
    const y = normalPDF(x, mu, sigma)
    points.push({ x, y })
    if (y > maxY) maxY = y
  }
  maxY *= 1.1

  const svgW = 280, svgH = 150
  const pad = { l: 30, r: 10, t: 10, b: 25 }
  const pw = svgW - pad.l - pad.r
  const ph = svgH - pad.t - pad.b
  const sx = (v: number) => pad.l + ((v - xMin) / (xMax - xMin)) * pw
  const sy = (v: number) => pad.t + ph - (v / maxY) * ph

  // Build shade path
  const clampedFrom = Math.max(xMin, Math.min(xMax, shadeFrom))
  const clampedTo = Math.max(xMin, Math.min(xMax, shadeTo))
  const shadeSteps = 60
  const shadeDx = (clampedTo - clampedFrom) / shadeSteps
  const shadePath = shading
    ? 'M' + sx(clampedFrom) + ',' + sy(0) +
      Array.from({ length: shadeSteps + 1 }, (_, i) => {
        const x = clampedFrom + i * shadeDx
        return ' L' + sx(x) + ',' + sy(normalPDF(x, mu, sigma))
      }).join('') +
      ' L' + sx(clampedTo) + ',' + sy(0) + ' Z'
    : ''

  // Curve path
  const curvePath = 'M' + points.map(p => sx(p.x) + ',' + sy(p.y)).join(' L')

  const area = normalCDF(clampedTo, mu, sigma) - normalCDF(clampedFrom, mu, sigma)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: s.text, minWidth: 45 }}>Mean:</span>
          <input type="range" min={-5} max={5} step={0.1} value={mu} onChange={e => setMu(Number(e.target.value))}
            style={{ flex: 1, accentColor: curveColor }} />
          <span style={{ fontSize: 11, color: s.bright, fontFamily: 'monospace', minWidth: 30 }}>{mu.toFixed(1)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: s.text, minWidth: 45 }}>Std Dev:</span>
          <input type="range" min={0.2} max={3} step={0.1} value={sigma} onChange={e => setSigma(Number(e.target.value))}
            style={{ flex: 1, accentColor: curveColor }} />
          <span style={{ fontSize: 11, color: s.bright, fontFamily: 'monospace', minWidth: 30 }}>{sigma.toFixed(1)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setShading(p => !p)} style={s.btn(shading)}>{shading ? 'Shading On' : 'Shading Off'}</button>
        {shading && (
          <>
            <span style={{ fontSize: 10, color: s.text }}>From:</span>
            <input type="number" value={shadeFrom} step={0.1} onChange={e => setShadeFrom(Number(e.target.value))} style={{ ...s.input, width: 52 }} />
            <span style={{ fontSize: 10, color: s.text }}>To:</span>
            <input type="number" value={shadeTo} step={0.1} onChange={e => setShadeTo(Number(e.target.value))} style={{ ...s.input, width: 52 }} />
          </>
        )}
      </div>
      {/* Quick presets */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {[
          { label: '68%', from: -1, to: 1 }, { label: '95%', from: -2, to: 2 },
          { label: '99.7%', from: -3, to: 3 }, { label: 'Above 0', from: 0, to: 4 },
          { label: 'Below 0', from: -4, to: 0 },
        ].map(p => (
          <button key={p.label} onClick={() => { setShading(true); setShadeFrom(p.from); setShadeTo(p.to) }}
            style={{ ...s.btn(false), fontSize: 9 }}>{p.label}</button>
        ))}
      </div>
      {/* SVG */}
      <svg viewBox={"0 0 " + svgW + ' ' + svgH} style={{ width: '100%', borderRadius: 6, background: s.bg }}>
        {/* Grid */}
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1={pad.l} y1={sy(f * maxY)} x2={svgW - pad.r} y2={sy(f * maxY)} stroke={gridColor} strokeWidth={0.5} />
        ))}
        {/* Shaded area */}
        {shadePath && <path d={shadePath} fill={shadeColor} stroke="none" />}
        {/* Curve */}
        <path d={curvePath} fill="none" stroke={curveColor} strokeWidth={1.5} />
        {/* Mean line */}
        <line x1={sx(mu)} y1={pad.t} x2={sx(mu)} y2={svgH - pad.b} stroke={axisColor} strokeWidth={0.5} strokeDasharray="3 3" />
        {/* Sigma markers */}
        {[-3, -2, -1, 1, 2, 3].map(n => {
          const x = mu + n * sigma
          if (x < xMin || x > xMax) return null
          return <line key={n} x1={sx(x)} y1={svgH - pad.b} x2={sx(x)} y2={svgH - pad.b + 4} stroke={axisColor} strokeWidth={0.5} />
        })}
        {/* Axes */}
        <line x1={pad.l} y1={svgH - pad.b} x2={svgW - pad.r} y2={svgH - pad.b} stroke={axisColor} strokeWidth={1} />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={svgH - pad.b} stroke={axisColor} strokeWidth={1} />
        {/* Area label */}
        {shading && (
          <text x={svgW / 2} y={pad.t + 14} fontSize={10} fill={curveColor} textAnchor="middle" fontWeight={600}>
            P = {area.toFixed(4)} ({(area * 100).toFixed(2)}%)
          </text>
        )}
      </svg>
    </div>
  )
}

// ============================================================
// 6. PROBABILITY SIMULATOR  (Grades 6-12)
// ============================================================

type SimType = 'coin' | 'dice' | 'spinner'

const SPINNER_SEGMENTS = [
  { label: 'Red', color: '#ef4444' }, { label: 'Blue', color: '#3b82f6' },
  { label: 'Green', color: '#22c55e' }, { label: 'Yellow', color: '#eab308' },
]

export function ProbabilitySimulator({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [simType, setSimType] = useState<SimType>('coin')
  const [count, setCount] = useState(100)
  const [results, setResults] = useState<Map<string, number>>(new Map())
  const [totalRuns, setTotalRuns] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [spinAngle, setSpinAngle] = useState(0)

  const runSim = useCallback((n: number) => {
    const res = new Map<string, number>()
    if (simType === 'coin') {
      let heads = 0, tails = 0
      for (let i = 0; i < n; i++) {
        if (Math.random() < 0.5) heads++
        else tails++
      }
      res.set('Heads', heads)
      res.set('Tails', tails)
    } else if (simType === 'dice') {
      for (let i = 1; i <= 6; i++) res.set(String(i), 0)
      for (let i = 0; i < n; i++) {
        const face = Math.floor(Math.random() * 6) + 1
        res.set(String(face), (res.get(String(face)) || 0) + 1)
      }
    } else {
      SPINNER_SEGMENTS.forEach(seg => res.set(seg.label, 0))
      for (let i = 0; i < n; i++) {
        const idx = Math.floor(Math.random() * SPINNER_SEGMENTS.length)
        const label = SPINNER_SEGMENTS[idx].label
        res.set(label, (res.get(label) || 0) + 1)
      }
    }
    // Spin animation
    if (simType === 'spinner') {
      setSpinning(true)
      setSpinAngle(prev => prev + 360 + Math.random() * 720)
      setTimeout(() => setSpinning(false), 800)
    }
    setResults(res)
    setTotalRuns(prev => prev + n)
  }, [simType])

  const resetSim = () => { setResults(new Map()); setTotalRuns(0) }

  const barColors = ['#60a5fa', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#fb923c']
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisColor = isDark ? '#475569' : '#94a3b8'

  const sortedResults = useMemo(() => {
    if (results.size === 0) return []
    return [...results.entries()].sort((a, b) => b[1] - a[1])
  }, [results])

  const maxCount = sortedResults.length > 0 ? sortedResults[0][1] : 1
  const theoretical: Record<string, number> = {}
  if (simType === 'coin') { theoretical['Heads'] = 0.5; theoretical['Tails'] = 0.5 }
  else if (simType === 'dice') { for (let i = 1; i <= 6; i++) theoretical[String(i)] = 1 / 6 }
  else { SPINNER_SEGMENTS.forEach(seg => theoretical[seg.label] = 1 / SPINNER_SEGMENTS.length) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Sim type selector */}
      <div style={{ display: 'flex', gap: 4 }}>
        {([['coin', 'Coin'], ['dice', 'Dice'], ['spinner', 'Spinner']] as [SimType, string][]).map(([id, label]) => (
          <button key={id} onClick={() => { setSimType(id); resetSim() }} style={s.btn(simType === id)}>{label}</button>
        ))}
      </div>

      {/* Spinner visual */}
      {simType === 'spinner' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg width={120} height={120} viewBox="-60 -60 120 120" style={{ transition: spinning ? 'transform 0.8s cubic-bezier(0.2,0.8,0.3,1)' : 'none', transform: 'rotate(' + spinAngle + 'deg)' }}>
            {SPINNER_SEGMENTS.map((seg, i) => {
              const startAngle = (i * 360) / SPINNER_SEGMENTS.length - 90
              const endAngle = ((i + 1) * 360) / SPINNER_SEGMENTS.length - 90
              const r = 50
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
            <circle cx={0} cy={0} r={4} fill={isDark ? '#1e293b' : '#fff'} />
          </svg>
        </div>
      )}

      {/* Count + buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: s.text }}>Trials:</span>
        {[10, 100, 1000, 10000].map(n => (
          <button key={n} onClick={() => runSim(n)} style={s.btn(false)}>{n.toLocaleString()}</button>
        ))}
        <button onClick={resetSim} style={{ ...s.btn(false), color: '#f87171' }}>Reset</button>
      </div>

      {totalRuns > 0 && (
        <>
          {/* Bar chart */}
          <svg viewBox="0 0 280 100" style={{ width: '100%', borderRadius: 6, background: s.bg }}>
            {[0.25, 0.5, 0.75].map(f => (
              <line key={f} x1={40} y1={5 + (1 - f) * 75} x2={275} y2={5 + (1 - f) * 75} stroke={gridColor} strokeWidth={0.5} />
            ))}
            {sortedResults.map(([label, count], i) => {
              const barH = maxCount > 0 ? (count / maxCount) * 75 : 0
              const barW = 230 / sortedResults.length
              const x = 42 + i * barW
              const y = 80 - barH
              const freq = count / totalRuns
              return (
                <g key={label}>
                  <rect x={x + 1} y={y} width={barW - 2} height={barH} fill={barColors[i % barColors.length]} rx={2} opacity={0.85} />
                  <text x={x + barW / 2} y={y - 3} fontSize={7} fill={axisColor} textAnchor="middle">{(freq * 100).toFixed(1)}%</text>
                  <text x={x + barW / 2} y={94} fontSize={7} fill={axisColor} textAnchor="middle">{label}</text>
                  {/* Theoretical line */}
                  <line x1={x + 1} y1={80 - (theoretical[label] / (sortedResults[0][1] / totalRuns)) * 75}
                    x2={x + barW - 1} y2={80 - (theoretical[label] / (sortedResults[0][1] / totalRuns)) * 75}
                    stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth={1} strokeDasharray="2 2" />
                </g>
              )
            })}
            <line x1={40} y1={80} x2={275} y2={80} stroke={axisColor} strokeWidth={1} />
            <text x={270} y={5} fontSize={6} fill={isDark ? '#fbbf24' : '#d97706'} textAnchor="end">--- theoretical</text>
          </svg>

          {/* Summary */}
          <div style={{ fontSize: 10, color: s.text, padding: '4px 8px', borderRadius: 6, background: s.bg }}>
            Total trials: <span style={{ fontWeight: 600, color: s.bright }}>{totalRuns.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  )
}
