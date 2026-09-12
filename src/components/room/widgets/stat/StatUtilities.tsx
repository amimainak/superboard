'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'

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
                {/* Step-by-step derivation */}
      {stats && (
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Data: {data.length} values {sorted ? '(sorted)' : '(unsorted)'}</div>
          <div>Step 2: Mean = {stats.sum} ÷ {stats.count} = <b>{stats.mean.toFixed(2)}</b></div>
          <div>Step 3: Median = <b>{stats.median}</b> (middle value when sorted)</div>
          <div>Step 4: Mode = {stats.mode.length > 0 ? stats.mode.join(', ') : 'None (all unique)'}</div>
          <div>Step 5: Range = {stats.max} − {stats.min} = <b>{stats.range}</b></div>
          <div>Step 6: Std Dev = <b>{stats.stdev.toFixed(4)}</b> (spread of data)</div>
      </div>
      )}
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Mean = balance point. Median = middle. Mode = most frequent. Each tells a different story — always check all three.
      </div>
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Data: {data.length} values, range: <b>{data.length > 0 ? Math.min(...data) : '?'}</b> to <b>{data.length > 0 ? Math.max(...data) : '?'}</b></div>
          <div>Step 2: Number of bins: <b>{bins}</b></div>
          <div>Step 3: Bin width: <b>{histogram ? histogram.binWidth.toFixed(2) : '?'}</b> (= range ÷ bins)</div>
          <div>Step 4: Counts per bin: {histogram ? '[' + histogram.bucketCounts.join(', ') + ']' : '?'}</div>
          <div>Step 5: Tallest bar: <b style={{ color: s.accent }}>{histogram ? histogram.maxCount : '?'}</b> value(s) = most common range</div>
          <div>Step 6: Shape reveals distribution pattern (bell, skewed, bimodal)</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Bell-shaped = normal. Skewed = long tail. Bimodal = two peaks. The shape reveals patterns numbers hide.
      </div>
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

  // Derived values for the step-by-step derivation (null-safe fallbacks)
  const sortedData = useMemo(() => [...data].sort((a, b) => a - b), [data])
  const q1 = q ? q.q1 : 0
  const q2 = q ? q.q2 : 0
  const q3 = q ? q.q3 : 0
  const iqr = q ? q.iqr : 0
  const outliers = q ? q.outliers : []

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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Sorted: {sortedData.slice(0, 5).join(', ')}...{sortedData.length > 5 ? '(' + sortedData.length + ' values)' : ''}</div>
          <div>Step 2: Q1 = <b>{q1}</b>, Median (Q2) = <b>{q2}</b>, Q3 = <b>{q3}</b></div>
          <div>Step 3: IQR = {q3} − {q1} = <b>{iqr}</b></div>
          <div>Step 4: Lower fence = {q1} − 1.5×{iqr} = <b>{q1 - 1.5 * iqr}</b></div>
          <div>Step 5: Upper fence = {q3} + 1.5×{iqr} = <b>{q3 + 1.5 * iqr}</b></div>
          <div>Step 6: Outliers: {outliers.length > 0 ? outliers.join(', ') : 'None'}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Box = middle 50%. Line = median. Whiskers = range. Dots = outliers. One picture shows center, spread, AND outliers.
      </div>
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
          <input aria-label="X values" value={rawX} onChange={e => setRawX(e.target.value)} placeholder="1, 2, 3..."
            style={{ ...s.input, width: '100%', fontFamily: 'monospace' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: s.text, display: 'block', marginBottom: 2 }}>Y values</label>
          <input aria-label="Y values" value={rawY} onChange={e => setRawY(e.target.value)} placeholder="2, 4, 6..."
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: {n} data point(s) plotted {showRegression ? '(regression line ON)' : '(regression line OFF)'}</div>
          <div>Step 2: Correlation r = <b>{reg ? reg.r.toFixed(4) : '?'}</b> ({reg ? (reg.r > 0.7 ? 'strong positive' : reg.r > 0.3 ? 'weak positive' : reg.r < -0.7 ? 'strong negative' : reg.r < -0.3 ? 'weak negative' : 'no correlation') : '?'})</div>
          <div>Step 3: Line: y = {reg ? reg.slope.toFixed(3) : '?'}x {reg ? (reg.intercept >= 0 ? '+ ' : '− ') + Math.abs(reg.intercept).toFixed(3) : '?'}</div>
          <div>Step 4: r² = <b style={{ color: s.accent }}>{reg ? reg.r2.toFixed(4) : '?'}</b> ({reg ? (reg.r2 * 100).toFixed(1) : '?'}% of variation explained)</div>
          <div>Step 5: Correlation ≠ causation — check context</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Up-right = positive correlation. Down-right = negative. No pattern = none. But correlation ≠ causation!
      </div>
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
          <input type="range" aria-label="Mean" min={-5} max={5} step={0.1} value={mu} onChange={e => setMu(Number(e.target.value))}
            style={{ flex: 1, accentColor: curveColor }} />
          <span style={{ fontSize: 11, color: s.bright, fontFamily: 'monospace', minWidth: 30 }}>{mu.toFixed(1)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: s.text, minWidth: 45 }}>Std Dev:</span>
          <input type="range" aria-label="Standard deviation" min={0.2} max={3} step={0.1} value={sigma} onChange={e => setSigma(Number(e.target.value))}
            style={{ flex: 1, accentColor: curveColor }} />
          <span style={{ fontSize: 11, color: s.bright, fontFamily: 'monospace', minWidth: 30 }}>{sigma.toFixed(1)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setShading(p => !p)} style={s.btn(shading)}>{shading ? 'Shading On' : 'Shading Off'}</button>
        {shading && (
          <>
            <span style={{ fontSize: 10, color: s.text }}>From:</span>
            <input type="number" aria-label="Shade from value" value={shadeFrom} step={0.1} onChange={e => setShadeFrom(Number(e.target.value))} style={{ ...s.input, width: 52 }} />
            <span style={{ fontSize: 10, color: s.text }}>To:</span>
            <input type="number" aria-label="Shade to value" value={shadeTo} step={0.1} onChange={e => setShadeTo(Number(e.target.value))} style={{ ...s.input, width: 52 }} />
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: μ = <b>{mu.toFixed(1)}</b>, σ = <b>{sigma.toFixed(1)}</b></div>
          <div>Step 2: Shade region: x ∈ [<b>{clampedFrom.toFixed(2)}</b>, <b>{clampedTo.toFixed(2)}</b>] {shading ? '' : '(shading OFF)'}</div>
          <div>Step 3: z-scores: z₁ = <b>{((clampedFrom - mu) / sigma).toFixed(4)}</b>, z₂ = <b>{((clampedTo - mu) / sigma).toFixed(4)}</b></div>
          <div>Step 4: P({clampedFrom.toFixed(2)} &lt; X &lt; {clampedTo.toFixed(2)}) = <b style={{ color: s.accent }}>{area.toFixed(4)}</b> ({(area * 100).toFixed(2)}%)</div>
          <div>Step 5: 68% within 1σ, 95% within 2σ, 99.7% within 3σ</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> 68% within 1σ, 95% within 2σ, 99.7% within 3σ. Z-scores tell you how unusual a value is.
      </div>
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

  // Derived values for the step-by-step derivation
  const scenarioLabel = simType === 'coin' ? 'Coin Flip' : simType === 'dice' ? 'Dice Roll' : 'Spinner'
  const outcomes = simType === 'coin' ? ['Heads', 'Tails'] : simType === 'dice' ? ['1', '2', '3', '4', '5', '6'] : SPINNER_SEGMENTS.map(seg => seg.label)
  const favorable = 1
  const total = outcomes.length
  const probability = 1 / total
  const topResult = sortedResults.length > 0 ? sortedResults[0] : null
  const simulationResult = (totalRuns > 0 && topResult) ? { favorable: topResult[1], total: totalRuns } : null

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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Scenario: {scenarioLabel} ({outcomes.length} possible outcomes)</div>
          <div>Step 2: Favorable: {favorable}, Total: {total}</div>
          <div>Step 3: P = {favorable}/{total} = <b>{probability.toFixed(4)}</b> = <b>{(probability * 100).toFixed(2)}%</b></div>
          <div>Step 4: {simulationResult ? 'Experimental: ' + (simulationResult.favorable / simulationResult.total).toFixed(4) + ' (' + simulationResult.favorable + '/' + simulationResult.total + ')' : 'Run simulation to compare'}</div>
          <div>Step 5: More trials → closer to theoretical {probability.toFixed(4)}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Law of Large Numbers: more trials → closer to theoretical. 10 coin flips: maybe 7 heads. 10,000: very close to 5,000.
      </div>
</div>
  )
}

// ============================================================
// 7. PICTOGRAPH BUILDER  (K-5)
// ============================================================

const PICTOGRAPH_ICONS = ['🍎', '⭐', '🐶', '🚗', '🎨']

type PictoCategory = { name: string; count: number }

export function PictographBuilder({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [title, setTitle] = useState('Favorite Fruit')
  const [icon, setIcon] = useState('🍎')
  const [scale, setScale] = useState(1)
  const [categories, setCategories] = useState<PictoCategory[]>([
    { name: 'Apples', count: 6 },
    { name: 'Bananas', count: 4 },
    { name: 'Cherries', count: 8 },
  ])

  const updateCat = (i: number, field: 'name' | 'count', val: string) => {
    setCategories(prev => prev.map((c, idx) => {
      if (idx !== i) return c
      if (field === 'count') return { ...c, count: Math.max(0, parseInt(val) || 0) }
      return { ...c, name: val }
    }))
  }
  const addCat = () => setCategories(prev => [...prev, { name: 'New', count: 0 }])
  const removeCat = (i: number) => setCategories(prev => prev.filter((_, idx) => idx !== i))

  const total = categories.reduce((sum, c) => sum + c.count, 0)
  const maxCat = categories.length > 0 ? categories.reduce((a, b) => a.count >= b.count ? a : b) : null
  const minCat = categories.length > 0 ? categories.reduce((a, b) => a.count <= b.count ? a : b) : null
  const avg = categories.length > 0 ? total / categories.length : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input aria-label="Pictograph title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Pictograph title..." style={{ ...s.input, width: '100%' }} />
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: s.text }}>Icon:</span>
        {PICTOGRAPH_ICONS.map(ic => (
          <button key={ic} onClick={() => setIcon(ic)} style={{ ...s.btn(icon === ic), fontSize: 14, padding: '2px 8px' }}>{ic}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: s.text }}>Scale:</span>
        {[1, 2, 5, 10].map(n => (
          <button key={n} onClick={() => setScale(n)} style={s.btn(scale === n)}>1 = {n}</button>
        ))}
      </div>
      {/* Categories editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {categories.map((cat, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input aria-label={`Category ${i + 1} name`} value={cat.name} onChange={e => updateCat(i, 'name', e.target.value)} style={{ ...s.input, flex: 1 }} />
            <input type="number" aria-label={`Category ${i + 1} count`} value={cat.count} onChange={e => updateCat(i, 'count', e.target.value)} style={{ ...s.input, width: 50 }} />
            <button onClick={() => removeCat(i)} style={{ ...s.btn(false), color: '#f87171' }}>✕</button>
          </div>
        ))}
        <button onClick={addCat} style={{ ...s.btn(false), alignSelf: 'flex-start' }}>+ Add category</button>
      </div>
      {/* Pictograph */}
      <div style={{ padding: '6px 8px', borderRadius: 6, background: s.bg, border: '1px solid ' + s.border }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: s.bright, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 9, color: s.text, marginBottom: 6 }}>Each {icon} = {scale} item{scale > 1 ? 's' : ''}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {categories.map((cat, i) => {
            const iconCount = Math.ceil(cat.count / scale)
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: s.bright, marginBottom: 2 }}>
                  <span>{cat.name}</span>
                  <span style={{ fontFamily: 'monospace' }}>{cat.count} = {iconCount} {icon}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: 13, lineHeight: 1.1, letterSpacing: 0.5 }}>
                  {Array.from({ length: Math.min(iconCount, 30) }).map((_, j) => (
                    <span key={j}>{icon}</span>
                  ))}
                  {iconCount > 30 && <span style={{ fontSize: 10, color: s.text, marginLeft: 4 }}>+{iconCount - 30} more</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {/* How it works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Title: "{title}" | Icon: {icon} | Scale: 1 icon = {scale} items</div>
        <div>Step 2: {categories.length} categories:{' '}{categories.map((c, idx) => (
          <span key={idx}>{idx > 0 ? ', ' : ''}{c.name}</span>
        ))}</div>
        <div>Step 3: Most: {maxCat?.name ?? '—'} with {maxCat?.count ?? 0} items ({Math.ceil((maxCat?.count ?? 0) / scale)} icons)</div>
        <div>Step 4: Least: {minCat?.name ?? '—'} with {minCat?.count ?? 0} items ({Math.ceil((minCat?.count ?? 0) / scale)} icons)</div>
        <div>Step 5: Total items: {total} | Average: {avg.toFixed(1)} per category</div>
        <div>Step 6: Pictographs show data with pictures — each icon = {scale} items (scale helps fit large numbers)</div>
      </div>
      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Pictographs use pictures to show data. The scale (1 icon = N items) lets us display large numbers with just a few pictures — making comparisons easy to see at a glance.
      </div>
    </div>
  )
}

// ============================================================
// 8. BAR GRAPH MAKER  (K-5)
// ============================================================

const BAR_COLORS = [
  { name: 'Blue', hex: '#60a5fa' },
  { name: 'Green', hex: '#34d399' },
  { name: 'Red', hex: '#f87171' },
  { name: 'Orange', hex: '#fb923c' },
  { name: 'Purple', hex: '#a78bfa' },
]

export function BarGraphMaker({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [labels, setLabels] = useState('Mon, Tue, Wed, Thu, Fri')
  const [values, setValues] = useState('4, 7, 3, 8, 5')
  const [color, setColor] = useState(BAR_COLORS[0].hex)
  const [orientation, setOrientation] = useState<'v' | 'h'>('v')

  const cats = useMemo(() => {
    const labelsArr = labels.split(',').map(x => x.trim()).filter(Boolean)
    const valuesArr = values.split(',').map(x => parseFloat(x.trim())).filter(n => !isNaN(n))
    const n = Math.min(labelsArr.length, valuesArr.length)
    return Array.from({ length: n }, (_, i) => ({ label: labelsArr[i], value: valuesArr[i] }))
  }, [labels, values])

  const maxVal = cats.length > 0 ? Math.max(...cats.map(c => c.value)) : 0
  const minVal = cats.length > 0 ? Math.min(...cats.map(c => c.value)) : 0
  const total = cats.reduce((sum, c) => sum + c.value, 0)
  const avg = cats.length > 0 ? total / cats.length : 0
  const maxCat = cats.length > 0 ? cats.find(c => c.value === maxVal) : undefined
  const minCat = cats.length > 0 ? cats.find(c => c.value === minVal) : undefined
  const range = maxVal - minVal
  const niceMax = Math.max(1, Math.ceil(maxVal * 1.1))

  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisColor = isDark ? '#475569' : '#94a3b8'

  const svgW = 280, svgH = 130
  const padL = 30, padR = 12, padT = 10, padB = 22
  const plotW = svgW - padL - padR
  const plotH = svgH - padT - padB

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <input aria-label="Bar chart labels (comma-separated)" value={labels} onChange={e => setLabels(e.target.value)} placeholder="Labels (comma-separated)" style={{ ...s.input, width: '100%' }} />
        <input aria-label="Bar chart values (comma-separated)" value={values} onChange={e => setValues(e.target.value)} placeholder="Values (comma-separated)" style={{ ...s.input, width: '100%' }} />
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: s.text }}>Color:</span>
        {BAR_COLORS.map(c => (
          <button key={c.hex} onClick={() => setColor(c.hex)} style={{
            ...s.btn(color === c.hex),
            background: color === c.hex ? c.hex + '33' : undefined,
            border: color === c.hex ? '1px solid ' + c.hex : undefined,
          }}>
            <span style={{ color: c.hex }}>●</span> {c.name}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => setOrientation('v')} style={s.btn(orientation === 'v')}>Vertical</button>
        <button onClick={() => setOrientation('h')} style={s.btn(orientation === 'h')}>Horizontal</button>
      </div>
      {/* Bar graph SVG */}
      {cats.length > 0 && (
        <svg viewBox={"0 0 " + svgW + ' ' + svgH} style={{ width: '100%', borderRadius: 6, background: s.bg }}>
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map(f => (
            <line key={'g' + f} x1={padL} y1={padT + plotH - f * plotH} x2={svgW - padR} y2={padT + plotH - f * plotH} stroke={gridColor} strokeWidth={0.5} />
          ))}
          {/* Y axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(f => (
            <text key={'y' + f} x={padL - 3} y={padT + plotH - f * plotH + 3} fontSize={7} fill={axisColor} textAnchor="end">
              {Math.round(f * niceMax)}
            </text>
          ))}
          {orientation === 'v' ? (
            <>
              {cats.map((cat, i) => {
                const barW = plotW / cats.length
                const x = padL + i * barW
                const barH = (cat.value / niceMax) * plotH
                const y = padT + plotH - barH
                return (
                  <g key={i}>
                    <rect x={x + 2} y={y} width={barW - 4} height={barH} fill={color} rx={2} opacity={0.85} />
                    <text x={x + barW / 2} y={y - 2} fontSize={7} fill={axisColor} textAnchor="middle">{cat.value}</text>
                    <text x={x + barW / 2} y={svgH - padB + 11} fontSize={7} fill={axisColor} textAnchor="middle">{cat.label}</text>
                  </g>
                )
              })}
            </>
          ) : (
            <>
              {cats.map((cat, i) => {
                const barH = plotH / cats.length
                const y = padT + i * barH
                const barW = (cat.value / niceMax) * plotW
                return (
                  <g key={i}>
                    <rect x={padL + 1} y={y + 2} width={barW} height={barH - 4} fill={color} rx={2} opacity={0.85} />
                    <text x={padL + barW + 3} y={y + barH / 2 + 2} fontSize={7} fill={axisColor} textAnchor="start">{cat.value}</text>
                    <text x={padL - 3} y={y + barH / 2 + 2} fontSize={7} fill={axisColor} textAnchor="end">{cat.label}</text>
                  </g>
                )
              })}
            </>
          )}
          {/* Axes */}
          <line x1={padL} y1={padT + plotH} x2={svgW - padR} y2={padT + plotH} stroke={axisColor} strokeWidth={1} />
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke={axisColor} strokeWidth={1} />
        </svg>
      )}
      {/* How it works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: {cats.length} categories plotted | Max value: {maxVal}</div>
        <div>Step 2: Scale: 0 to {niceMax} (axis goes up to the largest value)</div>
        <div>Step 3: Tallest bar: {maxCat?.label ?? '—'} = {maxVal} | Shortest bar: {minCat?.label ?? '—'} = {minVal}</div>
        <div>Step 4: Range: {maxVal} − {minVal} = {range}</div>
        <div>Step 5: Total: {total} | Average: {avg.toFixed(1)}</div>
        <div>Step 6: Bar graphs make comparison easy — taller = more, shorter = less</div>
      </div>
      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Bar graphs turn numbers into pictures — your eyes can compare bar heights faster than reading a table. The axis scale is the key that unlocks the meaning of every bar.
      </div>
    </div>
  )
}

// ============================================================
// 9. LINE PLOT WITH FRACTIONS  (K-5)
// ============================================================

const LINE_PLOT_HALF_VALUES = Array.from({ length: 11 }, (_, i) => i / 2) // 0, 0.5, 1, ..., 5

export function LinePlotFractions({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [data, setData] = useState<number[]>([1, 1.5, 2, 2, 2.5])
  const [inputValue, setInputValue] = useState('')

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const svgX = (x / rect.width) * 280
    const padL = 25, padR = 15
    const plotW = 280 - padL - padR
    const val = ((svgX - padL) / plotW) * 5
    if (val < -0.25 || val > 5.25) return
    const rounded = Math.round(val * 2) / 2
    if (rounded >= 0 && rounded <= 5) {
      setData(prev => [...prev, rounded])
    }
  }

  const addValue = () => {
    const v = parseFloat(inputValue)
    if (!isNaN(v) && v >= 0 && v <= 5) {
      const rounded = Math.round(v * 2) / 2
      setData(prev => [...prev, rounded])
      setInputValue('')
    }
  }
  const removeLast = () => setData(prev => prev.slice(0, -1))
  const clearAll = () => setData([])

  const freq = useMemo(() => {
    const m = new Map<number, number>()
    LINE_PLOT_HALF_VALUES.forEach(v => m.set(v, 0))
    data.forEach(v => m.set(v, (m.get(v) || 0) + 1))
    return m
  }, [data])

  const maxFreq = Math.max(...freq.values(), 1)
  const modeEntries = useMemo(() => {
    const max = Math.max(...freq.values(), 0)
    if (max <= 1) return [] as number[]
    return [...freq.entries()].filter(([, f]) => f === max).map(([v]) => v)
  }, [freq])
  const modeCount = modeEntries.length > 0 ? Math.max(...freq.values()) : 0

  const min = data.length > 0 ? Math.min(...data) : 0
  const max = data.length > 0 ? Math.max(...data) : 0

  const formatVal = (v: number) => {
    if (Number.isInteger(v)) return String(v)
    const whole = Math.floor(v)
    return whole + '½'
  }

  const padL = 25, padR = 15, padT = 10, padB = 22
  const svgW = 280, svgH = 130
  const plotW = svgW - padL - padR
  const plotH = svgH - padT - padB
  const xForVal = (v: number) => padL + (v / 5) * plotW

  const axisColor = isDark ? '#475569' : '#94a3b8'
  const xColor = isDark ? '#f87171' : '#dc2626'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={"0 0 " + svgW + ' ' + svgH} style={{ width: '100%', borderRadius: 6, background: s.bg, cursor: 'pointer' }} onClick={handleClick}>
        {/* Grid */}
        {LINE_PLOT_HALF_VALUES.map(v => {
          const x = xForVal(v)
          return <line key={'g' + v} x1={x} y1={padT} x2={x} y2={padT + plotH} stroke={gridColor} strokeWidth={0.5} strokeDasharray={Number.isInteger(v) ? '' : '2 2'} />
        })}
        {/* X stacks */}
        {LINE_PLOT_HALF_VALUES.map(v => {
          const count = freq.get(v) || 0
          const x = xForVal(v)
          return Array.from({ length: count }).map((_, i) => {
            const y = padT + plotH - 8 - i * 9
            return (
              <text key={v + '-' + i} x={x} y={y + 4} fontSize={13} fontWeight={700} fill={xColor} textAnchor="middle">X</text>
            )
          })
        })}
        {/* Number line */}
        <line x1={padL} y1={padT + plotH} x2={svgW - padR} y2={padT + plotH} stroke={axisColor} strokeWidth={1.5} />
        {/* Tick marks and labels */}
        {LINE_PLOT_HALF_VALUES.map(v => {
          const x = xForVal(v)
          const isWhole = Number.isInteger(v)
          return (
            <g key={'t' + v}>
              <line x1={x} y1={padT + plotH} x2={x} y2={padT + plotH + (isWhole ? 5 : 3)} stroke={axisColor} strokeWidth={1} />
              {isWhole && <text x={x} y={padT + plotH + 13} fontSize={7} fill={axisColor} textAnchor="middle">{v}</text>}
            </g>
          )
        })}
        {/* ½ labels between integers */}
        {[0.5, 1.5, 2.5, 3.5, 4.5].map(v => {
          const x = xForVal(v)
          return <text key={'half' + v} x={x} y={padT + plotH + 13} fontSize={6} fill={axisColor} textAnchor="middle">½</text>
        })}
      </svg>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <input aria-label="Add dot plot value" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Add value (0, 0.5, 1, 1.5...)" style={{ ...s.input, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') addValue() }} />
        <button onClick={addValue} style={s.btn(false)}>Add</button>
        <button onClick={removeLast} style={s.btn(false)}>Undo</button>
        <button onClick={clearAll} style={{ ...s.btn(false), color: '#f87171' }}>Clear</button>
      </div>
      <div style={{ fontSize: 10, color: s.text, padding: '4px 8px', borderRadius: 6, background: s.bg }}>
        Click the number line to add an X at the nearest ½ mark. Max stack: {maxFreq}.
      </div>
      {/* How it works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: {data.length} data point(s) on the line plot</div>
        <div>Step 2: Range: {formatVal(min)} to {formatVal(max)} | Scale: ½ unit markings</div>
        <div>Step 3: Most frequent (mode): {modeEntries.length > 0 ? modeEntries.map(formatVal).join(', ') : 'None'} {modeEntries.length > 0 ? '(appears ' + modeCount + ' times)' : '(no value repeats)'}</div>
        <div>Step 4: {data.length} values placed — Xs stack vertically for repeated values</div>
        <div>Step 5: Click the number line to add a data point at that ½ mark</div>
        <div>Step 6: Line plots show how data is distributed — clusters show common values</div>
      </div>
      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> A line plot puts every data point on a number line. When the same value appears many times, the Xs stack up — so the tallest stack shows the most common value.
      </div>
    </div>
  )
}

// ============================================================
// 10. TALLY CHART CONVERTER  (K-5)
// ============================================================

type TallyCat = { name: string; count: number }

export function TallyChartConverter({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [categories, setCategories] = useState<TallyCat[]>([
    { name: 'Apples', count: 7 },
    { name: 'Bananas', count: 5 },
    { name: 'Cherries', count: 3 },
  ])
  const [showGraph, setShowGraph] = useState(false)

  const addTally = (i: number) => setCategories(prev => prev.map((c, idx) => idx === i ? { ...c, count: c.count + 1 } : c))
  const removeTally = (i: number) => setCategories(prev => prev.map((c, idx) => idx === i ? { ...c, count: Math.max(0, c.count - 1) } : c))
  const updateName = (i: number, name: string) => setCategories(prev => prev.map((c, idx) => idx === i ? { ...c, name } : c))
  const addCat = () => setCategories(prev => [...prev, { name: 'New', count: 0 }])
  const removeCat = (i: number) => setCategories(prev => prev.filter((_, idx) => idx !== i))

  const total = categories.reduce((sum, c) => sum + c.count, 0)
  const maxCat = categories.length > 0 ? categories.reduce((a, b) => a.count >= b.count ? a : b) : null
  const minCat = categories.length > 0 ? categories.reduce((a, b) => a.count <= b.count ? a : b) : null

  // Render tally marks as SVG (4 verticals + 1 diagonal slash per group of 5)
  const renderTally = (count: number) => {
    const lines: React.ReactNode[] = []
    const lineColor = isDark ? '#e2e8f0' : '#1e293b'
    const groups = Math.floor(count / 5)
    const remainder = count % 5
    const spacing = 4
    const groupSpacing = 8
    let x = 0
    for (let g = 0; g < groups; g++) {
      for (let i = 0; i < 4; i++) {
        lines.push(<line key={g + '-v' + i} x1={x + i * spacing} y1={0} x2={x + i * spacing} y2={20} stroke={lineColor} strokeWidth={1.5} />)
      }
      lines.push(<line key={g + '-d'} x1={x - 1} y1={20} x2={x + 3 * spacing + 1} y2={0} stroke={lineColor} strokeWidth={1.5} />)
      x += 4 * spacing + groupSpacing
    }
    for (let i = 0; i < remainder; i++) {
      lines.push(<line key={'r-' + i} x1={x + i * spacing} y1={0} x2={x + i * spacing} y2={20} stroke={lineColor} strokeWidth={1.5} />)
    }
    const width = Math.max(x + remainder * spacing + 2, 20)
    return { lines, width }
  }

  const maxCount = Math.max(...categories.map(c => c.count), 1)
  const barColors = ['#60a5fa', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#fb923c']
  const axisColor = isDark ? '#475569' : '#94a3b8'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Categories editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {categories.map((cat, i) => {
          const tally = renderTally(cat.count)
          return (
            <div key={i} style={{ padding: '4px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
                <input aria-label={`Tally category ${i + 1} name`} value={cat.name} onChange={e => updateName(i, e.target.value)} style={{ ...s.input, flex: 1 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: s.bright, fontFamily: 'monospace', minWidth: 24, textAlign: 'right' as const }}>{cat.count}</span>
                <button onClick={() => addTally(i)} style={{ ...s.btn(false), padding: '2px 8px', fontWeight: 700 as const }}>+</button>
                <button onClick={() => removeTally(i)} style={{ ...s.btn(false), padding: '2px 8px' }}>−</button>
                <button onClick={() => removeCat(i)} style={{ ...s.btn(false), color: '#f87171' }}>✕</button>
              </div>
              <svg viewBox={"0 0 " + tally.width + ' 22'} style={{ width: '100%', height: 22, display: 'block' }} preserveAspectRatio="xMinYMid meet">
                {tally.lines}
              </svg>
            </div>
          )
        })}
        <button onClick={addCat} style={{ ...s.btn(false), alignSelf: 'flex-start' }}>+ Add category</button>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => setShowGraph(p => !p)} style={s.btn(showGraph)}>{showGraph ? 'Hide' : 'Show'} Bar Graph</button>
      </div>
      {/* Bar graph */}
      {showGraph && categories.length > 0 && (
        <svg viewBox="0 0 280 110" style={{ width: '100%', borderRadius: 6, background: s.bg }}>
          {categories.map((cat, i) => {
            const barW = 230 / categories.length
            const x = 42 + i * barW
            const barH = (cat.count / maxCount) * 75
            const y = 80 - barH
            return (
              <g key={i}>
                <rect x={x + 1} y={y} width={barW - 2} height={barH} fill={barColors[i % barColors.length]} rx={2} opacity={0.85} />
                <text x={x + barW / 2} y={y - 3} fontSize={7} fill={axisColor} textAnchor="middle">{cat.count}</text>
                <text x={x + barW / 2} y={94} fontSize={7} fill={axisColor} textAnchor="middle">{cat.name}</text>
              </g>
            )
          })}
          <line x1={40} y1={80} x2={275} y2={80} stroke={axisColor} strokeWidth={1} />
        </svg>
      )}
      {/* How it works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: {categories.length} categories in the tally chart</div>
        <div>Step 2:{' '}{categories.map((c, idx) => (
          <span key={idx}>{idx > 0 ? ', ' : ''}{c.name}: {c.count}</span>
        ))}</div>
        <div>Step 3: Tally groups: each group of 5 = 𝍸 (slash through 4 verticals)</div>
        <div>Step 4: Most: {maxCat?.name ?? '—'} ({maxCat?.count ?? 0}) | Least: {minCat?.name ?? '—'} ({minCat?.count ?? 0})</div>
        <div>Step 5: Total: {total} | {showGraph ? 'Bar graph shown below' : 'Click "Show Bar Graph" to visualize'}</div>
        <div>Step 6: Tally marks → bar graph: same data, different picture</div>
      </div>
      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Tally marks count in groups of 5 — quick to read at a glance. The same data can be shown as tallies, a bar graph, or numbers — each form makes different patterns easy to see.
      </div>
    </div>
  )
}

// ============================================================
// 11. MEAN AS FAIR SHARE  (K-5)
// ============================================================

export function MeanAsFairShare({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [stacks, setStacks] = useState<number[]>([2, 5, 3, 6])
  const [redistributed, setRedistributed] = useState(false)
  const stacksRef = useRef<number[]>(stacks)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    stacksRef.current = stacks
  }, [stacks])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  const total = stacks.reduce((a, b) => a + b, 0)
  const mean = stacks.length > 0 ? total / stacks.length : 0
  const meanFloor = Math.floor(mean)
  const meanCeil = Math.ceil(mean)
  const meanStr = Number.isInteger(mean) ? String(mean) : mean.toFixed(2)
  const meanDisplay = meanFloor === meanCeil ? String(meanFloor) : meanFloor + ' or ' + meanCeil

  const updateStack = (i: number, delta: number) => {
    setStacks(prev => prev.map((v, idx) => idx === i ? Math.max(0, v + delta) : v))
    setRedistributed(false)
  }
  const addStack = () => {
    if (stacks.length < 8) {
      setStacks(prev => [...prev, 1])
      setRedistributed(false)
    }
  }
  const removeStack = () => {
    if (stacks.length > 2) {
      setStacks(prev => prev.slice(0, -1))
      setRedistributed(false)
    }
  }
  const reset = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setStacks([2, 5, 3, 6])
    setRedistributed(false)
  }

  const redistribute = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setRedistributed(false)
    const step = () => {
      const current = stacksRef.current
      const t = current.reduce((a, b) => a + b, 0)
      const m = t / current.length
      const floor = Math.floor(m)
      const ceil = Math.ceil(m)
      let maxIdx = -1, maxVal = -Infinity
      let minIdx = -1, minVal = Infinity
      for (let i = 0; i < current.length; i++) {
        if (current[i] > ceil && current[i] > maxVal) { maxIdx = i; maxVal = current[i] }
        if (current[i] < floor && current[i] < minVal) { minIdx = i; minVal = current[i] }
      }
      if (maxIdx === -1 || minIdx === -1) {
        setRedistributed(true)
        return
      }
      const next = [...current]
      next[maxIdx] -= 1
      next[minIdx] += 1
      stacksRef.current = next
      setStacks(next)
      timeoutRef.current = window.setTimeout(step, 450)
    }
    step()
  }

  const aboveAvg = stacks.filter(v => v > mean).length
  const belowAvg = stacks.filter(v => v < mean).length

  // SVG layout
  const svgW = 280, svgH = 130
  const stackW = 28
  const gap = stacks.length > 1 ? (svgW - 20 - stacks.length * stackW) / (stacks.length - 1) : 0
  const totalW = stacks.length * stackW + Math.max(stacks.length - 1, 0) * gap
  const startX = (svgW - totalW) / 2
  const baseY = 108
  const blockH = 8

  const blockColor = isDark ? '#34d399' : '#059669'
  const aboveColor = '#f87171'
  const meanColor = isDark ? '#fbbf24' : '#d97706'
  const axisColor = isDark ? '#475569' : '#94a3b8'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* SVG */}
      <svg viewBox={"0 0 " + svgW + ' ' + svgH} style={{ width: '100%', borderRadius: 6, background: s.bg }}>
        {/* Mean line */}
        <line x1={5} y1={baseY - mean * blockH} x2={svgW - 5} y2={baseY - mean * blockH} stroke={meanColor} strokeWidth={1} strokeDasharray="4 2" />
        <text x={svgW - 5} y={baseY - mean * blockH - 3} fontSize={8} fill={meanColor} textAnchor="end" fontWeight={700}>Mean = {meanStr}</text>
        {/* Stacks */}
        {stacks.map((count, i) => {
          const x = startX + i * (stackW + gap)
          return (
            <g key={i}>
              {Array.from({ length: count }).map((_, j) => {
                const y = baseY - (j + 1) * blockH
                const isAbove = j + 1 > mean
                const fill = isAbove && !redistributed ? aboveColor : blockColor
                return <rect key={j} x={x} y={y} width={stackW} height={blockH - 1} fill={fill} rx={1} opacity={0.85} />
              })}
              {/* Base line */}
              <line x1={x - 2} y1={baseY} x2={x + stackW + 2} y2={baseY} stroke={axisColor} strokeWidth={1} />
              {/* Label */}
              <text x={x + stackW / 2} y={baseY + 12} fontSize={8} fill={axisColor} textAnchor="middle">#{i + 1}</text>
              <text x={x + stackW / 2} y={baseY + 22} fontSize={11} fontWeight={700} fill={isDark ? '#e2e8f0' : '#1e293b'} textAnchor="middle">{count}</text>
            </g>
          )
        })}
      </svg>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={redistribute} style={{
          padding: '5px 14px', borderRadius: 5, fontSize: 11, fontWeight: 700,
          background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)',
          color: '#34d399', cursor: 'pointer',
        }}>Redistribute</button>
        <button onClick={addStack} style={s.btn(false)}>+ Stack</button>
        <button onClick={removeStack} style={s.btn(false)}>− Stack</button>
        <button onClick={reset} style={{ ...s.btn(false), color: '#f87171' }}>Reset</button>
      </div>
      {/* Per-stack +/- buttons */}
      <div style={{ display: 'flex', gap: 4 }}>
        {stacks.map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 2, flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <button onClick={() => updateStack(i, +1)} style={{ ...s.btn(false), padding: '1px 4px', fontSize: 11 }}>+</button>
            <button onClick={() => updateStack(i, -1)} style={{ ...s.btn(false), padding: '1px 4px', fontSize: 11 }}>−</button>
          </div>
        ))}
      </div>
      {/* How it works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: {stacks.length} stacks: {stacks.join(', ')} blocks each</div>
        <div>Step 2: Total blocks = {total} | Number of stacks = {stacks.length}</div>
        <div>Step 3: Mean = total ÷ stacks = {total} ÷ {stacks.length} = {meanStr}</div>
        <div>Step 4: {redistributed ? 'All stacks equalized at ' + meanDisplay + ' — that is the FAIR SHARE' : 'Click "Redistribute" to share blocks fairly'}</div>
        <div>Step 5: Above average: {aboveAvg} | Below average: {belowAvg}</div>
        <div>Step 6: The mean is the "fair share" — if you redistribute equally, everyone gets the mean</div>
      </div>
      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> The mean is the "fair share" — what each stack would have if you moved blocks around until everyone had the same amount. Total ÷ count = mean, every time.
      </div>
    </div>
  )
}

// ============================================================
// 12. CUSTOM SPINNER  (K-5)
// ============================================================

type SpinnerSection = { label: string; color: string; size: number }
const SPINNER_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#fb923c']

export function CustomSpinner({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [sections, setSections] = useState<SpinnerSection[]>([
    { label: 'Red', color: '#ef4444', size: 50 },
    { label: 'Blue', color: '#3b82f6', size: 30 },
    { label: 'Green', color: '#22c55e', size: 20 },
  ])
  const [results, setResults] = useState<Record<string, number>>({})
  const [totalSpins, setTotalSpins] = useState(0)
  const [lastResult, setLastResult] = useState<SpinnerSection | null>(null)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const rafRef = useRef<number | null>(null)
  const rotRef = useRef(0)

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const totalSize = sections.reduce((sum, sec) => sum + sec.size, 0)

  const updateSection = (i: number, field: keyof SpinnerSection, val: string | number) => {
    setSections(prev => prev.map((sec, idx) => {
      if (idx !== i) return sec
      if (field === 'size') return { ...sec, size: Math.max(1, parseInt(String(val)) || 1) }
      if (field === 'color') return { ...sec, color: String(val) }
      return { ...sec, label: String(val) }
    }))
  }
  const addSection = () => {
    if (sections.length < 6) {
      const usedColors = new Set(sections.map(sec => sec.color))
      const nextColor = SPINNER_COLORS.find(c => !usedColors.has(c)) || SPINNER_COLORS[sections.length % SPINNER_COLORS.length]
      setSections(prev => [...prev, { label: 'S' + (prev.length + 1), color: nextColor, size: 20 }])
    }
  }
  const removeSection = (i: number) => {
    if (sections.length > 2) {
      setSections(prev => prev.filter((_, idx) => idx !== i))
    }
  }

  const spin = useCallback(() => {
    if (spinning || sections.length === 0 || totalSize === 0) return
    // Pick weighted winner
    const rand = Math.random() * totalSize
    let acc = 0
    let winnerIdx = 0
    for (let i = 0; i < sections.length; i++) {
      acc += sections[i].size
      if (rand <= acc) {
        winnerIdx = i
        break
      }
    }
    const winner = sections[winnerIdx]
    // Compute winner's angle range in unrotated wheel (starts at -90 = top)
    let startAngle = -90
    for (let i = 0; i < winnerIdx; i++) {
      startAngle += (sections[i].size / totalSize) * 360
    }
    const endAngle = startAngle + (winner.size / totalSize) * 360
    const targetWithinSection = startAngle + Math.random() * (endAngle - startAngle)
    // We want this angle to be at the top (-90) after rotation
    const desiredFinalRot = -90 - targetWithinSection
    // Add 4+ full rotations for visual effect
    const minTarget = rotRef.current + 360 * 4
    let targetAngle = desiredFinalRot
    const diff = minTarget - targetAngle
    const fullTurnsToAdd = Math.ceil(diff / 360)
    targetAngle += fullTurnsToAdd * 360

    setSpinning(true)
    const startAngleAnim = rotRef.current
    const duration = 1500
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const angle = startAngleAnim + (targetAngle - startAngleAnim) * eased
      setRotation(angle)
      rotRef.current = angle
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setSpinning(false)
        setLastResult(winner)
        setResults(prev => ({ ...prev, [winner.label]: (prev[winner.label] || 0) + 1 }))
        setTotalSpins(prev => prev + 1)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
  }, [spinning, sections, totalSize])

  const reset = () => {
    setResults({})
    setTotalSpins(0)
    setLastResult(null)
  }

  // Compute section paths
  const sectionPaths = useMemo(() => {
    let startAngle = -90
    return sections.map((sec) => {
      const angleSize = (sec.size / Math.max(totalSize, 1)) * 360
      const endAngle = startAngle + angleSize
      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180
      const r = 55
      const x1 = r * Math.cos(startRad)
      const y1 = r * Math.sin(startRad)
      const x2 = r * Math.cos(endRad)
      const y2 = r * Math.sin(endRad)
      const largeArc = angleSize > 180 ? 1 : 0
      const path = 'M0,0 L' + x1.toFixed(2) + ',' + y1.toFixed(2) + ' A' + r + ',' + r + ' 0 ' + largeArc + ',1 ' + x2.toFixed(2) + ',' + y2.toFixed(2) + ' Z'
      const midAngle = (startAngle + endAngle) / 2
      const labelR = r * 0.62
      const labelX = labelR * Math.cos((midAngle * Math.PI) / 180)
      const labelY = labelR * Math.sin((midAngle * Math.PI) / 180)
      const percentage = ((sec.size / Math.max(totalSize, 1)) * 100).toFixed(0)
      startAngle = endAngle
      return { path, color: sec.color, label: sec.label, labelX, labelY, percentage }
    })
  }, [sections, totalSize])

  // Results table
  const resultsList = useMemo(() => {
    return sections.map(sec => ({
      label: sec.label,
      color: sec.color,
      theoretical: (sec.size / Math.max(totalSize, 1)) * 100,
      experimental: totalSpins > 0 ? ((results[sec.label] || 0) / totalSpins) * 100 : 0,
      count: results[sec.label] || 0,
    }))
  }, [sections, results, totalSpins, totalSize])

  const axisColor = isDark ? '#475569' : '#94a3b8'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Sections editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {sections.map((sec, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input type="color" aria-label={`Section ${i + 1} color`} value={sec.color} onChange={e => updateSection(i, 'color', e.target.value)} style={{ width: 24, height: 24, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
            <input aria-label={`Section ${i + 1} label`} value={sec.label} onChange={e => updateSection(i, 'label', e.target.value)} style={{ ...s.input, flex: 1 }} />
            <input type="number" aria-label={`Section ${i + 1} size`} value={sec.size} onChange={e => updateSection(i, 'size', e.target.value)} style={{ ...s.input, width: 45 }} />
            <span style={{ fontSize: 9, color: s.text, minWidth: 32, textAlign: 'right' as const }}>{((sec.size / Math.max(totalSize, 1)) * 100).toFixed(0)}%</span>
            <button onClick={() => removeSection(i)} style={{ ...s.btn(false), color: '#f87171' }}>✕</button>
          </div>
        ))}
        <button onClick={addSection} disabled={sections.length >= 6} style={{ ...s.btn(false), alignSelf: 'flex-start', opacity: sections.length >= 6 ? 0.5 : 1 }}>+ Add section</button>
      </div>
      {/* Spinner */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg width={140} height={140} viewBox="-70 -70 140 140">
          <g transform={'rotate(' + rotation + ')'}>
            {sectionPaths.map((sp, i) => (
              <g key={i}>
                <path d={sp.path} fill={sp.color} stroke={isDark ? '#1e293b' : '#fff'} strokeWidth={1.5} opacity={0.88} />
                <text x={sp.labelX} y={sp.labelY} fontSize={7} fill="#fff" textAnchor="middle" fontWeight={700}>{sp.label}</text>
                <text x={sp.labelX} y={sp.labelY + 8} fontSize={6} fill="#fff" textAnchor="middle">{sp.percentage}%</text>
              </g>
            ))}
          </g>
          {/* Center hub */}
          <circle cx={0} cy={0} r={4} fill={isDark ? '#1e293b' : '#fff'} stroke={axisColor} strokeWidth={1} />
          {/* Pointer at top */}
          <polygon points="0,-68 -5,-58 5,-58" fill="#f87171" stroke={isDark ? '#1e293b' : '#fff'} strokeWidth={1} />
        </svg>
      </div>
      {/* Spin button */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={spin} disabled={spinning} style={{
          padding: '5px 14px', borderRadius: 5, fontSize: 11, fontWeight: 700,
          background: spinning ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)') : 'rgba(5,150,105,0.15)',
          border: spinning ? '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)') : '1px solid rgba(5,150,105,0.3)',
          color: spinning ? (isDark ? '#64748b' : '#94a3b8') : '#34d399',
          cursor: spinning ? 'not-allowed' : 'pointer',
          opacity: spinning ? 0.6 : 1,
        }}>
          {spinning ? 'Spinning...' : 'Spin!'}
        </button>
        {lastResult && !spinning && (
          <span style={{ fontSize: 11, color: s.bright }}>
            Last: <b style={{ color: lastResult.color }}>{lastResult.label}</b>
          </span>
        )}
        <button onClick={reset} style={{ ...s.btn(false), color: '#f87171', marginLeft: 'auto' }}>Reset</button>
      </div>
      {/* Results table */}
      {totalSpins > 0 && (
        <div style={{ padding: '6px 8px', borderRadius: 6, background: s.bg, border: '1px solid ' + s.border }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '2px 6px', fontSize: 10, color: s.bright, alignItems: 'center' }}>
            <div style={{ fontWeight: 700 }}>Section</div>
            <div style={{ fontWeight: 700, textAlign: 'right' as const }}>Count</div>
            <div style={{ fontWeight: 700, textAlign: 'right' as const }}>Exp %</div>
            <div style={{ fontWeight: 700, textAlign: 'right' as const, color: isDark ? '#fbbf24' : '#d97706' }}>Theo %</div>
            {resultsList.map((r, i) => (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: r.color, display: 'inline-block' }} />
                  {r.label}
                </div>
                <div style={{ fontFamily: 'monospace', textAlign: 'right' as const }}>{r.count}</div>
                <div style={{ fontFamily: 'monospace', textAlign: 'right' as const }}>{r.experimental.toFixed(1)}</div>
                <div style={{ fontFamily: 'monospace', textAlign: 'right' as const, color: isDark ? '#fbbf24' : '#d97706' }}>{r.theoretical.toFixed(1)}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      {/* How it works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: {sections.length} sections:{' '}{sections.map((sec, idx) => (
          <span key={idx}>{idx > 0 ? ', ' : ''}{sec.label} {((sec.size / Math.max(totalSize, 1)) * 100).toFixed(0)}%</span>
        ))}</div>
        <div>Step 2: Total spins: {totalSpins}</div>
        <div>Step 3: {totalSpins > 0 ? 'Results: ' : 'Click "Spin" to start — '}{totalSpins > 0 ? resultsList.map((r, idx) => (
          <span key={idx}>{idx > 0 ? ', ' : ''}{r.label}={r.count}</span>
        )) : ''}</div>
        <div>Step 4: {totalSpins > 0 && lastResult ? 'Last spin: ' : 'Spin the wheel!'}{totalSpins > 0 && lastResult && <b style={{ color: lastResult.color }}>{lastResult.label}</b>}</div>
        <div>Step 5: {totalSpins > 5 ? 'Bigger sections land more often — experimental is approaching theoretical' : 'Spin more times to see the pattern emerge'}</div>
        <div>Step 6: Probability = size of section ÷ total size — bigger section = more likely</div>
      </div>
      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Probability is the size of the "favorable" outcome divided by the total. The more you spin, the closer your actual results get to the expected (theoretical) probability — that's the Law of Large Numbers.
      </div>
    </div>
  )
}

// ============================================================
// 13. CONFIDENCE INTERVAL BUILDER  (Grades 9-12)
// ============================================================

const CI_PRESETS = [
  { level: 90, z: 1.645 },
  { level: 95, z: 1.96 },
  { level: 99, z: 2.576 },
]

export function ConfidenceIntervalBuilder({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [mu, setMu] = useState(100)
  const [sigma, setSigma] = useState(15)
  const [n, setN] = useState(30)
  const [confIdx, setConfIdx] = useState(1)
  const [sampleMeans, setSampleMeans] = useState<number[]>([])

  const conf = CI_PRESETS[confIdx]
  const zCritical = conf.z
  const confLevel = conf.level
  const stdError = sigma / Math.sqrt(n)
  const marginOfError = zCritical * stdError
  const lowerBound = mu - marginOfError
  const upperBound = mu + marginOfError

  const totalSamples = sampleMeans.length
  const insideCount = sampleMeans.filter(m => m >= lowerBound && m <= upperBound).length
  const insidePct = totalSamples > 0 ? Math.round((insideCount / totalSamples) * 100) : 0

  // Clear samples when parameters change so inside% stays consistent with current CI
  useEffect(() => {
    setSampleMeans([])
  }, [mu, sigma, n, confIdx])

  function randNormal() {
    const u1 = Math.random() || 1e-10
    const u2 = Math.random()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }
  function drawSample() {
    const sm = mu + randNormal() * stdError
    setSampleMeans(prev => [...prev, sm].slice(-500))
  }
  function drawMany(count: number) {
    const news: number[] = []
    for (let i = 0; i < count; i++) news.push(mu + randNormal() * stdError)
    setSampleMeans(prev => [...prev, ...news].slice(-500))
  }
  function resetSamples() { setSampleMeans([]) }

  // SVG geometry — sampling distribution N(μ, SE)
  const curveColor = isDark ? '#34d399' : '#059669'
  const shadeColor = isDark ? 'rgba(52,211,153,0.22)' : 'rgba(5,150,105,0.18)'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisColor = isDark ? '#475569' : '#94a3b8'
  const meanColor = isDark ? '#fbbf24' : '#d97706'
  const boundColor = isDark ? '#60a5fa' : '#2563eb'

  const xMin = mu - 4 * stdError
  const xMax = mu + 4 * stdError
  const steps = 100
  const dxStep = (xMax - xMin) / steps
  const points: { x: number; y: number }[] = []
  let maxY = 0
  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * dxStep
    const y = normalPDF(x, mu, stdError)
    points.push({ x, y })
    if (y > maxY) maxY = y
  }
  maxY *= 1.1

  const svgW = 280, svgH = 150
  const pad = { l: 30, r: 10, t: 16, b: 28 }
  const pw = svgW - pad.l - pad.r
  const ph = svgH - pad.t - pad.b
  const sx = (v: number) => pad.l + ((v - xMin) / (xMax - xMin)) * pw
  const sy = (v: number) => pad.t + ph - (v / maxY) * ph

  // Shade CI region
  const lb = Math.max(xMin, lowerBound)
  const ub = Math.min(xMax, upperBound)
  const shadeSteps = 50
  const shadeDx = (ub - lb) / shadeSteps
  const shadePath = 'M' + sx(lb) + ',' + sy(0) +
    Array.from({ length: shadeSteps + 1 }, (_, i) => {
      const x = lb + i * shadeDx
      return ' L' + sx(x) + ',' + sy(normalPDF(x, mu, stdError))
    }).join('') +
    ' L' + sx(ub) + ',' + sy(0) + ' Z'
  const curvePath = 'M' + points.map(p => sx(p.x) + ',' + sy(p.y)).join(' L')

  const recentSamples = sampleMeans.slice(-50)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        <label style={{ fontSize: 10, color: s.text, display: 'flex', alignItems: 'center', gap: 4 }}>
          μ
          <input type="number" value={mu} step={1} onChange={e => setMu(Number(e.target.value))} style={{ ...s.input, width: 50 }} />
        </label>
        <label style={{ fontSize: 10, color: s.text, display: 'flex', alignItems: 'center', gap: 4 }}>
          σ
          <input type="number" value={sigma} step={1} min={1} onChange={e => setSigma(Number(e.target.value))} style={{ ...s.input, width: 50 }} />
        </label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: s.text, minWidth: 35 }}>n =</span>
        <input type="range" aria-label="Sample size n" min={5} max={200} step={1} value={n} onChange={e => setN(Number(e.target.value))} style={{ flex: 1, accentColor: curveColor }} />
        <span style={{ fontSize: 11, color: s.bright, fontFamily: 'monospace', minWidth: 28 }}>{n}</span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {CI_PRESETS.map((p, i) => (
          <button key={p.level} onClick={() => setConfIdx(i)} style={s.btn(confIdx === i)}>{p.level}%</button>
        ))}
      </div>
      {/* SVG */}
      <svg viewBox={"0 0 " + svgW + ' ' + svgH} style={{ width: '100%', borderRadius: 6, background: s.bg }}>
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1={pad.l} y1={sy(f * maxY)} x2={svgW - pad.r} y2={sy(f * maxY)} stroke={gridColor} strokeWidth={0.5} />
        ))}
        <path d={shadePath} fill={shadeColor} stroke="none" />
        <path d={curvePath} fill="none" stroke={curveColor} strokeWidth={1.5} />
        {/* Mean line */}
        <line x1={sx(mu)} y1={pad.t} x2={sx(mu)} y2={svgH - pad.b} stroke={meanColor} strokeWidth={1} strokeDasharray="3 3" />
        {/* Bound lines */}
        <line x1={sx(lb)} y1={pad.t} x2={sx(lb)} y2={svgH - pad.b} stroke={boundColor} strokeWidth={1} strokeDasharray="2 2" />
        <line x1={sx(ub)} y1={pad.t} x2={sx(ub)} y2={svgH - pad.b} stroke={boundColor} strokeWidth={1} strokeDasharray="2 2" />
        {/* Sample dots */}
        {recentSamples.map((m, i) => {
          if (m < xMin || m > xMax) return null
          const inside = m >= lowerBound && m <= upperBound
          return <circle key={i} cx={sx(m)} cy={svgH - pad.b - 4 - (i % 5) * 2.4} r={1.8} fill={inside ? '#22c55e' : '#ef4444'} opacity={0.75} />
        })}
        {/* Axes */}
        <line x1={pad.l} y1={svgH - pad.b} x2={svgW - pad.r} y2={svgH - pad.b} stroke={axisColor} strokeWidth={1} />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={svgH - pad.b} stroke={axisColor} strokeWidth={1} />
        {/* Tick labels */}
        <text x={sx(lb)} y={svgH - pad.b + 11} fontSize={7.5} fill={boundColor} textAnchor="middle" fontWeight={700}>{lb.toFixed(0)}</text>
        <text x={sx(mu)} y={svgH - pad.b + 11} fontSize={7.5} fill={meanColor} textAnchor="middle" fontWeight={700}>{mu.toFixed(0)}</text>
        <text x={sx(ub)} y={svgH - pad.b + 11} fontSize={7.5} fill={boundColor} textAnchor="middle" fontWeight={700}>{ub.toFixed(0)}</text>
        <text x={svgW / 2} y={pad.t - 4} fontSize={8.5} fill={curveColor} textAnchor="middle" fontWeight={700}>
          {confLevel}% CI: [{lowerBound.toFixed(1)}, {upperBound.toFixed(1)}]
        </text>
      </svg>
      {/* Stats */}
      <div style={{ padding: '6px 8px', borderRadius: 6, background: s.bg, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', fontSize: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>z*</span><span style={s.statValue}>{zCritical}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>SE</span><span style={s.statValue}>{stdError.toFixed(3)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>Margin</span><span style={s.statValue}>{marginOfError.toFixed(3)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>Inside</span><span style={s.statValue}>{insideCount}/{totalSamples}</span></div>
      </div>
      {/* Buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={drawSample} style={{ ...s.btn(true), padding: '4px 10px', fontWeight: 600 }}>Draw 1 Sample</button>
        <button onClick={() => drawMany(10)} style={{ ...s.btn(false), padding: '4px 10px' }}>Draw 10</button>
        <button onClick={resetSamples} style={{ ...s.btn(false), color: '#f87171', marginLeft: 'auto' }}>Reset</button>
      </div>
      {/* How it works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Population: μ = <b>{mu}</b>, σ = <b>{sigma}</b>, n = <b>{n}</b></div>
        <div>Step 2: Confidence level: <b>{confLevel}%</b> | z* = <b>{zCritical}</b></div>
        <div>Step 3: Standard error: σ/√n = {sigma}/√{n} = <b>{stdError.toFixed(2)}</b></div>
        <div>Step 4: Margin of error: z* × SE = {zCritical} × {stdError.toFixed(2)} = <b>{marginOfError.toFixed(2)}</b></div>
        <div>Step 5: CI: <b style={{ color: boundColor }}>{lowerBound.toFixed(1)}</b> to <b style={{ color: boundColor }}>{upperBound.toFixed(1)}</b> | Samples inside: {insideCount}/{totalSamples} ({insidePct}%)</div>
        <div>Step 6: Over many samples, ~{confLevel}% of CIs will contain μ — that's what "{confLevel}% confident" means</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> A confidence interval gives a RANGE of plausible values for the true parameter. Higher confidence means a wider net (more certainty, less precision). Larger samples shrink the standard error, making the interval narrower — that's why bigger studies give sharper estimates.
      </div>
    </div>
  )
}

// ============================================================
// 14. HYPOTHESIS TEST EXPLORER  (Grades 9-12)
// ============================================================

type AltType = 'neq' | 'gt' | 'lt'

const ALT_OPTIONS: { type: AltType; symbol: string; label: string }[] = [
  { type: 'neq', symbol: '≠', label: 'μ ≠ μ₀ (two-tailed)' },
  { type: 'gt', symbol: '>', label: 'μ > μ₀ (right-tailed)' },
  { type: 'lt', symbol: '<', label: 'μ < μ₀ (left-tailed)' },
]

// Critical z values: [α=0.05, α=0.01]
const Z_CRIT: Record<AltType, [number, number]> = {
  neq: [1.96, 2.576],
  gt: [1.645, 2.326],
  lt: [-1.645, -2.326],
}

export function HypothesisTestExplorer({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [h0Value, setH0Value] = useState(100)
  const [altType, setAltType] = useState<AltType>('neq')
  const [sampleMean, setSampleMean] = useState(105)
  const [sampleStd, setSampleStd] = useState(15)
  const [n, setN] = useState(30)
  const [alphaIdx, setAlphaIdx] = useState(0)
  const [showStep, setShowStep] = useState(1)

  const alpha = alphaIdx === 0 ? 0.05 : 0.01
  const stdError = sampleStd / Math.sqrt(n)
  const zStat = (sampleMean - h0Value) / stdError
  const absZ = Math.abs(zStat)

  const pValue = useMemo(() => {
    if (altType === 'neq') return 2 * normalCDF(-absZ, 0, 1)
    if (altType === 'gt') return normalCDF(-zStat, 0, 1)
    return normalCDF(zStat, 0, 1)
  }, [altType, zStat, absZ])

  const reject = pValue < alpha
  const zCrit = Z_CRIT[altType][alphaIdx]
  const altSymbol = ALT_OPTIONS.find(a => a.type === altType)!.symbol
  const altDescription = altType === 'neq' ? 'μ ≠ μ₀' : altType === 'gt' ? 'μ > μ₀' : 'μ < μ₀'

  // SVG: standard normal curve with rejection regions shaded
  const curveColor = isDark ? '#34d399' : '#059669'
  const rejectColor = 'rgba(248,113,113,0.35)'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisColor = isDark ? '#475569' : '#94a3b8'
  const statColor = reject ? '#f87171' : '#60a5fa'
  const critColor = isDark ? '#fbbf24' : '#d97706'

  const xMin = -4, xMax = 4
  const steps = 120
  const dxStep = (xMax - xMin) / steps
  const points: { x: number; y: number }[] = []
  let maxY = 0
  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * dxStep
    const y = normalPDF(x, 0, 1)
    points.push({ x, y })
    if (y > maxY) maxY = y
  }
  maxY *= 1.1

  const svgW = 280, svgH = 150
  const pad = { l: 24, r: 10, t: 16, b: 28 }
  const pw = svgW - pad.l - pad.r
  const ph = svgH - pad.t - pad.b
  const sx = (v: number) => pad.l + ((v - xMin) / (xMax - xMin)) * pw
  const sy = (v: number) => pad.t + ph - (v / maxY) * ph

  const curvePath = 'M' + points.map(p => sx(p.x) + ',' + sy(p.y)).join(' L')

  function shadeRegion(from: number, to: number): string {
    const f = Math.max(xMin, from), t = Math.min(xMax, to)
    if (f >= t) return ''
    const ss = 25
    const dd = (t - f) / ss
    return 'M' + sx(f) + ',' + sy(0) +
      Array.from({ length: ss + 1 }, (_, i) => {
        const x = f + i * dd
        return ' L' + sx(x) + ',' + sy(normalPDF(x, 0, 1))
      }).join('') +
      ' L' + sx(t) + ',' + sy(0) + ' Z'
  }
  const rejectPaths: string[] = []
  if (altType === 'neq') {
    rejectPaths.push(shadeRegion(xMin, -zCrit))
    rejectPaths.push(shadeRegion(zCrit, xMax))
  } else if (altType === 'gt') {
    rejectPaths.push(shadeRegion(zCrit, xMax))
  } else {
    rejectPaths.push(shadeRegion(xMin, zCrit))
  }

  const xTicks = [-3, -2, -1, 0, 1, 2, 3]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: s.text }}>H₀: μ =</span>
        <input type="number" aria-label="Null hypothesis value" value={h0Value} step={1} onChange={e => setH0Value(Number(e.target.value))} style={{ ...s.input, width: 50 }} />
        <span style={{ fontSize: 10, color: s.text, marginLeft: 6 }}>α:</span>
        <button onClick={() => setAlphaIdx(0)} style={s.btn(alphaIdx === 0)}>0.05</button>
        <button onClick={() => setAlphaIdx(1)} style={s.btn(alphaIdx === 1)}>0.01</button>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: s.text }}>H₁:</span>
        {ALT_OPTIONS.map(a => (
          <button key={a.type} onClick={() => setAltType(a.type)} style={{ ...s.btn(altType === a.type), fontSize: 13, minWidth: 30, fontWeight: 700 }}>{a.symbol}</button>
        ))}
        <span style={{ fontSize: 9, color: s.text, marginLeft: 4 }}>{ALT_OPTIONS.find(a => a.type === altType)!.label}</span>
      </div>
      {/* Step 2 reveal hint */}
      {showStep < 2 && (
        <div style={{ fontSize: 10, color: s.text, fontStyle: 'italic', opacity: 0.7 }}>
          → Next: enter sample data (advance to Step 2)
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, opacity: showStep >= 2 ? 1 : 0.3, pointerEvents: showStep >= 2 ? 'auto' : 'none' as const }}>
        <label style={{ fontSize: 10, color: s.text, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span>Sample mean (x̄)</span>
          <input type="number" value={sampleMean} step={1} onChange={e => setSampleMean(Number(e.target.value))} style={{ ...s.input, fontFamily: 'monospace' }} />
        </label>
        <label style={{ fontSize: 10, color: s.text, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span>Sample std (s)</span>
          <input type="number" value={sampleStd} step={1} min={1} onChange={e => setSampleStd(Number(e.target.value))} style={{ ...s.input, fontFamily: 'monospace' }} />
        </label>
        <label style={{ fontSize: 10, color: s.text, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span>Sample size (n)</span>
          <input type="number" value={n} step={1} min={2} onChange={e => setN(Number(e.target.value))} style={{ ...s.input, fontFamily: 'monospace' }} />
        </label>
      </div>
      {/* Step 3 reveal hint */}
      {showStep === 2 && (
        <div style={{ fontSize: 10, color: s.text, fontStyle: 'italic', opacity: 0.7 }}>
          → Next: compute the z test statistic (advance to Step 3)
        </div>
      )}
      {/* SVG — revealed at Step 3 (test statistic) */}
      <svg viewBox={"0 0 " + svgW + ' ' + svgH} style={{ width: '100%', borderRadius: 6, background: s.bg, opacity: showStep >= 3 ? 1 : 0.3, transition: 'opacity 0.2s' }}>
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1={pad.l} y1={sy(f * maxY)} x2={svgW - pad.r} y2={sy(f * maxY)} stroke={gridColor} strokeWidth={0.5} />
        ))}
        {/* Rejection regions */}
        {rejectPaths.map((p, i) => (
          <path key={i} d={p} fill={rejectColor} stroke="none" />
        ))}
        {/* Curve */}
        <path d={curvePath} fill="none" stroke={curveColor} strokeWidth={1.5} />
        {/* Critical value lines */}
        {altType === 'neq' && (
          <>
            <line x1={sx(-zCrit)} y1={pad.t} x2={sx(-zCrit)} y2={svgH - pad.b} stroke={critColor} strokeWidth={1} strokeDasharray="3 2" />
            <line x1={sx(zCrit)} y1={pad.t} x2={sx(zCrit)} y2={svgH - pad.b} stroke={critColor} strokeWidth={1} strokeDasharray="3 2" />
            <text x={sx(-zCrit)} y={svgH - pad.b + 11} fontSize={7.5} fill={critColor} textAnchor="middle" fontWeight={700}>−{zCrit}</text>
            <text x={sx(zCrit)} y={svgH - pad.b + 11} fontSize={7.5} fill={critColor} textAnchor="middle" fontWeight={700}>+{zCrit}</text>
          </>
        )}
        {altType !== 'neq' && (
          <>
            <line x1={sx(zCrit)} y1={pad.t} x2={sx(zCrit)} y2={svgH - pad.b} stroke={critColor} strokeWidth={1} strokeDasharray="3 2" />
            <text x={sx(zCrit)} y={svgH - pad.b + 11} fontSize={7.5} fill={critColor} textAnchor="middle" fontWeight={700}>{zCrit}</text>
          </>
        )}
        {/* Test statistic line */}
        {zStat >= xMin && zStat <= xMax && (
          <>
            <line x1={sx(zStat)} y1={pad.t} x2={sx(zStat)} y2={svgH - pad.b} stroke={statColor} strokeWidth={1.8} />
            <text x={sx(zStat)} y={pad.t - 4} fontSize={8} fill={statColor} textAnchor="middle" fontWeight={700}>z={zStat.toFixed(2)}</text>
          </>
        )}
        {/* Axes */}
        <line x1={pad.l} y1={svgH - pad.b} x2={svgW - pad.r} y2={svgH - pad.b} stroke={axisColor} strokeWidth={1} />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={svgH - pad.b} stroke={axisColor} strokeWidth={1} />
        {/* x-axis labels */}
        {xTicks.map(t => (
          <text key={t} x={sx(t)} y={svgH - pad.b + 21} fontSize={7} fill={axisColor} textAnchor="middle">{t}</text>
        ))}
      </svg>
      {/* Stats — revealed progressively: z-stat/SE/z-crit at Step 3, p-value at Step 4 */}
      <div style={{ padding: '6px 8px', borderRadius: 6, background: s.bg, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', fontSize: 10, opacity: showStep >= 3 ? 1 : 0.3, transition: 'opacity 0.2s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>z-stat</span><span style={s.statValue}>{zStat.toFixed(3)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', opacity: showStep >= 4 ? 1 : 0.4 }}><span style={s.statLabel}>p-value</span><span style={s.statValue}>{showStep >= 4 ? pValue.toFixed(4) : '—'}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>z-crit</span><span style={s.statValue}>{altType === 'neq' ? `±${zCrit}` : `${zCrit}`}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>SE</span><span style={s.statValue}>{stdError.toFixed(3)}</span></div>
      </div>
      {/* Step 4 reveal hint */}
      {showStep === 3 && (
        <div style={{ fontSize: 10, color: s.text, fontStyle: 'italic', opacity: 0.7 }}>
          → Next: compute the p-value and compare to α (advance to Step 4)
        </div>
      )}
      {/* Decision banner — revealed at Step 5 */}
      {showStep >= 5 ? (
        <div style={{ padding: '5px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, textAlign: 'center' as const, background: reject ? 'rgba(248,113,113,0.12)' : 'rgba(34,197,94,0.12)', border: '1px solid ' + (reject ? 'rgba(248,113,113,0.3)' : 'rgba(34,197,94,0.3)'), color: reject ? '#f87171' : '#22c55e' }}>
          {reject ? `✗ REJECT H₀ — p (${pValue.toFixed(4)}) < α (${alpha})` : `✓ FAIL TO REJECT H₀ — p (${pValue.toFixed(4)}) ≥ α (${alpha})`}
        </div>
      ) : (
        <div style={{ padding: '5px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, textAlign: 'center' as const, background: s.bg, border: '1px dashed ' + s.border, color: s.text, opacity: 0.4 }}>
          Decision: reveal at Step 5
        </div>
      )}
      {/* Step reveal controls — progressive disclosure walker */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={() => setShowStep(p => Math.max(1, p - 1))} style={s.btn(false)}>← Prev</button>
        <span style={{ fontSize: 10, color: s.text }}>Step {showStep} of 6 — {
          showStep === 1 ? 'Hypotheses' :
          showStep === 2 ? 'Sample data' :
          showStep === 3 ? 'Test statistic' :
          showStep === 4 ? 'P-value' :
          showStep === 5 ? 'Decision' : 'Interpretation'
        }</span>
        <button onClick={() => setShowStep(p => Math.min(6, p + 1))} style={s.btn(false)}>Next →</button>
        <button onClick={() => setShowStep(6)} style={{ ...s.btn(showStep === 6), marginLeft: 'auto' }}>Show All</button>
      </div>
      {/* How it works (revealed steps) */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        {showStep >= 1 && <div>Step 1: H₀: μ = <b>{h0Value}</b> | H₁: μ {altSymbol} {h0Value} | α = <b>{alpha}</b></div>}
        {showStep >= 2 && <div>Step 2: Sample: x̄ = <b>{sampleMean}</b>, s = <b>{sampleStd}</b>, n = <b>{n}</b></div>}
        {showStep >= 3 && <div>Step 3: Test statistic: z = (x̄ − μ₀)/(s/√n) = ({sampleMean} − {h0Value})/{stdError.toFixed(2)} = <b>{zStat.toFixed(3)}</b></div>}
        {showStep >= 4 && <div>Step 4: p-value = <b>{pValue.toFixed(4)}</b> | {pValue < alpha ? 'p < α → REJECT H₀' : 'p ≥ α → FAIL TO REJECT H₀'}</div>}
        {showStep >= 5 && <div>Step 5: {pValue < alpha ? `There IS sufficient evidence to support H₁ (${altDescription})` : `There is NOT sufficient evidence to support H₁ — we can't rule out H₀`}</div>}
        {showStep >= 6 && <div>Step 6: Rejecting H₀ doesn't prove H₁ — it means H₀ is unlikely given the data</div>}
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> The p-value answers: "If H₀ were true, how surprising is this data?" A small p-value means the data is rare under H₀, so we doubt H₀. A large p-value just means we don't have enough evidence — it does NOT prove H₀ is true.
      </div>
    </div>
  )
}

// ============================================================
// 15. CENTRAL LIMIT THEOREM DEMO  (Grades 9-12)
// ============================================================

type PopShape = 'uniform' | 'skewed' | 'bimodal' | 'exponential'

const POP_SHAPES: { type: PopShape; label: string }[] = [
  { type: 'uniform', label: 'Uniform' },
  { type: 'skewed', label: 'Skewed' },
  { type: 'bimodal', label: 'Bimodal' },
  { type: 'exponential', label: 'Exponential' },
]

const SAMPLE_SIZES = [1, 2, 5, 10, 30, 50]

function generatePopulation(shape: PopShape, size = 5000): number[] {
  const arr: number[] = []
  for (let i = 0; i < size; i++) {
    let v: number
    if (shape === 'uniform') {
      v = Math.random() * 100
    } else if (shape === 'skewed') {
      // Right-skewed: 100 * u^3, biased toward 0, long tail to 100
      v = 100 * Math.pow(Math.random(), 3)
    } else if (shape === 'bimodal') {
      // 50/50 mix of N(25, 7) and N(75, 7)
      const u1 = Math.random() || 1e-10
      const u2 = Math.random()
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      v = (Math.random() < 0.5 ? 25 : 75) + z * 7
    } else {
      // Exponential: -ln(1-u) * 20, mean ≈ 20
      v = -Math.log(1 - Math.random()) * 20
    }
    arr.push(Math.max(0, Math.min(100, v)))
  }
  return arr
}

export function CentralLimitTheoremDemo({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [popShape, setPopShape] = useState<PopShape>('uniform')
  const [n, setN] = useState(10)
  const [sampleMeans, setSampleMeans] = useState<number[]>([])
  const [isAuto, setIsAuto] = useState(false)

  const population = useMemo(() => generatePopulation(popShape), [popShape])
  const popMean = useMemo(() => mean(population), [population])
  const popStd = useMemo(() => stdev(population), [population])
  const theoreticalSE = popStd / Math.sqrt(n)

  // Clear samples when n or popShape changes
  useEffect(() => {
    setSampleMeans([])
    setIsAuto(false)
  }, [n, popShape])

  // Latest drawSome function via ref so the rAF loop calls the freshest closure
  const drawSomeRef = useRef<(count: number) => void>(() => {})
  drawSomeRef.current = (count: number) => {
    const news: number[] = []
    for (let i = 0; i < count; i++) {
      let sum = 0
      for (let j = 0; j < n; j++) {
        sum += population[Math.floor(Math.random() * population.length)]
      }
      news.push(sum / n)
    }
    setSampleMeans(prev => [...prev, ...news].slice(-1000))
  }

  // Auto-draw loop with cleanup
  useEffect(() => {
    if (!isAuto) return
    let raf = 0
    let last = performance.now()
    const loop = (t: number) => {
      if (t - last > 80) {
        drawSomeRef.current(2)
        last = t
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [isAuto])

  function drawManual() { drawSomeRef.current(5) }
  function draw50() { drawSomeRef.current(50) }
  function draw100() { drawSomeRef.current(100) }
  function resetSamples() { setSampleMeans([]); setIsAuto(false) }

  const sampleCount = sampleMeans.length
  const meanOfMeans = sampleCount > 0 ? mean(sampleMeans) : 0
  const observedSE = sampleCount > 1 ? stdev(sampleMeans) : 0

  // Histogram bins
  const numBins = 20
  const binDataWidth = 100 / numBins
  const popBins = new Array(numBins).fill(0)
  for (const v of population) popBins[Math.min(numBins - 1, Math.floor(v / binDataWidth))]++
  const smBins = new Array(numBins).fill(0)
  for (const m of sampleMeans) smBins[Math.min(numBins - 1, Math.floor(m / binDataWidth))]++
  const popMax = Math.max(...popBins, 1)
  const smMax = Math.max(...smBins, 1)

  // SVG geometry
  const svgW = 280, svgH = 200
  const pad = { l: 22, r: 8, t: 14, b: 16 }
  const plotH = (svgH - pad.t - pad.b - 10) / 2
  const plotW = svgW - pad.l - pad.r
  const binPxW = plotW / numBins
  const sx = (v: number) => pad.l + (v / 100) * plotW

  const popTop = pad.t
  const smTop = pad.t + plotH + 10

  // Normal overlay curve on sample means histogram
  const normalPath = (() => {
    if (sampleCount < 5 || theoreticalSE <= 0) return ''
    const ns = 80
    const dxN = 100 / ns
    const peakPdf = 1 / (theoreticalSE * Math.sqrt(2 * Math.PI))
    const yScale = (sampleCount * binDataWidth) / Math.max(smMax, 1) // count → fraction of plotH
    const pts: string[] = []
    for (let i = 0; i <= ns; i++) {
      const x = i * dxN
      const pdf = peakPdf * Math.exp(-0.5 * ((x - popMean) / theoreticalSE) ** 2)
      const expectedCount = sampleCount * binDataWidth * pdf
      const px = sx(x)
      const py = smTop + plotH - (expectedCount / Math.max(smMax, 1)) * plotH
      pts.push((i === 0 ? 'M' : ' L') + px + ',' + Math.max(smTop, py))
    }
    return pts.join('')
  })()

  const popColor = isDark ? '#60a5fa' : '#2563eb'
  const smColor = isDark ? '#a78bfa' : '#7c3aed'
  const normalColor = isDark ? '#fbbf24' : '#d97706'
  const axisColor = isDark ? '#475569' : '#94a3b8'
  const meanColor = isDark ? '#34d399' : '#059669'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Pop shape selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {POP_SHAPES.map(p => (
          <button key={p.type} onClick={() => setPopShape(p.type)} style={s.btn(popShape === p.type)}>{p.label}</button>
        ))}
      </div>
      {/* Sample size selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 10, color: s.text, minWidth: 28 }}>n =</span>
        {SAMPLE_SIZES.map(sz => (
          <button key={sz} onClick={() => setN(sz)} style={{ ...s.btn(n === sz), flex: 1, padding: '2px 0' }}>{sz}</button>
        ))}
      </div>
      {/* SVG */}
      <svg viewBox={"0 0 " + svgW + ' ' + svgH} style={{ width: '100%', borderRadius: 6, background: s.bg }}>
        {/* Population histogram */}
        <text x={pad.l} y={popTop - 3} fontSize={8} fill={popColor} fontWeight={700}>Population ({popShape}) — μ={popMean.toFixed(1)}, σ={popStd.toFixed(1)}</text>
        {popBins.map((c, i) => (
          <rect key={'p' + i} x={pad.l + i * binPxW} y={popTop + plotH - (c / popMax) * plotH} width={Math.max(0.5, binPxW - 0.5)} height={(c / popMax) * plotH} fill={popColor} opacity={0.7} />
        ))}
        <line x1={sx(popMean)} y1={popTop} x2={sx(popMean)} y2={popTop + plotH} stroke={meanColor} strokeWidth={1} strokeDasharray="3 2" />
        <line x1={pad.l} y1={popTop + plotH} x2={svgW - pad.r} y2={popTop + plotH} stroke={axisColor} strokeWidth={1} />

        {/* Sample means histogram */}
        <text x={pad.l} y={smTop - 3} fontSize={8} fill={smColor} fontWeight={700}>Sample Means (n={n}, {sampleCount} drawn){sampleCount >= 5 ? ' — normal overlay in orange' : ''}</text>
        {smBins.map((c, i) => (
          <rect key={'s' + i} x={pad.l + i * binPxW} y={smTop + plotH - (c / smMax) * plotH} width={Math.max(0.5, binPxW - 0.5)} height={(c / smMax) * plotH} fill={smColor} opacity={0.7} />
        ))}
        {sampleCount >= 5 && normalPath && (
          <path d={normalPath} fill="none" stroke={normalColor} strokeWidth={1.5} />
        )}
        <line x1={sx(popMean)} y1={smTop} x2={sx(popMean)} y2={smTop + plotH} stroke={meanColor} strokeWidth={1} strokeDasharray="3 2" />
        <line x1={pad.l} y1={smTop + plotH} x2={svgW - pad.r} y2={smTop + plotH} stroke={axisColor} strokeWidth={1} />

        {/* X-axis labels */}
        {[0, 25, 50, 75, 100].map(t => (
          <text key={t} x={sx(t)} y={svgH - 3} fontSize={7} fill={axisColor} textAnchor="middle">{t}</text>
        ))}
      </svg>
      {/* Stats */}
      <div style={{ padding: '6px 8px', borderRadius: 6, background: s.bg, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', fontSize: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>Pop μ</span><span style={s.statValue}>{popMean.toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>Pop σ</span><span style={s.statValue}>{popStd.toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>Th SE</span><span style={s.statValue}>{theoreticalSE.toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>Obs SE</span><span style={s.statValue}>{observedSE.toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>x̄ of means</span><span style={s.statValue}>{meanOfMeans.toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>Samples</span><span style={s.statValue}>{sampleCount}</span></div>
      </div>
      {/* Buttons */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button onClick={drawManual} style={{ ...s.btn(true), padding: '4px 8px', fontWeight: 600 }}>Draw 5</button>
        <button onClick={draw50} style={{ ...s.btn(true), padding: '4px 8px', fontWeight: 600, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }}>Draw 50</button>
        <button onClick={draw100} style={{ ...s.btn(true), padding: '4px 8px', fontWeight: 600, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }}>Draw 100</button>
        <button onClick={() => setIsAuto(p => !p)} style={{ ...s.btn(isAuto), padding: '4px 8px' }}>{isAuto ? '■ Stop' : '▶ Auto'}</button>
        <button onClick={resetSamples} style={{ ...s.btn(false), color: '#f87171', marginLeft: 'auto' }}>Reset</button>
      </div>
      {/* CLT rule-of-thumb note */}
      {sampleCount >= 30 && (
        <div style={{ padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textAlign: 'center' as const, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
          ✓ 30+ samples drawn — normal shape emerging!
        </div>
      )}
      {/* How it works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Population: <b>{popShape}</b> | Sample size: n = <b>{n}</b></div>
        <div>Step 2: Samples drawn: <b>{sampleCount}</b> | Mean of sample means: <b>{meanOfMeans.toFixed(2)}</b> (vs pop mean <b>{popMean.toFixed(2)}</b>)</div>
        <div>Step 3: SE (theoretical) = σ/√n = {popStd.toFixed(2)}/√{n} = <b>{theoreticalSE.toFixed(2)}</b></div>
        <div>Step 4: SE (observed) = std of sample means = <b>{observedSE.toFixed(2)}</b></div>
        <div>Step 5: {n >= 30 ? `n=${n} ≥ 30 → sample means look NORMAL regardless of population shape` : `n=${n} < 30 → need larger n for normality (try n=30)`}</div>
        <div>Step 6: The Central Limit Theorem: sample means → normal as n → ∞, no matter the population</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> No matter how weird the population shape — uniform, skewed, bimodal, exponential — the distribution of sample means APPROACHES a normal bell curve as the sample size grows. That's why the normal distribution appears everywhere in statistics.
      </div>
    </div>
  )
}

// ============================================================
// 16. CHI-SQUARE EXPLORER  (Grades 9-12)
// ============================================================

// Chi-square survival function (Wilson-Hilferty approximation)
function chiSquareP(x: number, df: number): number {
  if (df <= 0) return 1
  if (x <= 0) return 1
  const h = 2 / (9 * df)
  const z = (Math.cbrt(x / df) - (1 - h)) / Math.sqrt(h)
  return normalCDF(-z, 0, 1)
}

// Critical chi-square values: [α=0.05, α=0.01] for df=1..6
const CHI_CRIT: Record<number, [number, number]> = {
  1: [3.841, 6.635],
  2: [5.991, 9.210],
  3: [7.815, 11.345],
  4: [9.488, 13.277],
  5: [11.070, 15.086],
  6: [12.592, 16.812],
}

const DEFAULT_CHI_CATS = [
  { name: 'Red', color: '#ef4444', observed: 25 },
  { name: 'Orange', color: '#fb923c', observed: 15 },
  { name: 'Yellow', color: '#eab308', observed: 20 },
  { name: 'Green', color: '#22c55e', observed: 18 },
  { name: 'Blue', color: '#3b82f6', observed: 22 },
]

export function ChiSquareExplorer({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [cats, setCats] = useState(DEFAULT_CHI_CATS.map(c => ({ ...c })))
  const [alphaIdx, setAlphaIdx] = useState(0)

  const alpha = alphaIdx === 0 ? 0.05 : 0.01
  const k = cats.length
  const total = cats.reduce((sum, c) => sum + c.observed, 0)
  const expected = total / k

  // χ² = Σ (O−E)²/E
  const chiSquare = cats.reduce((sum, c) => {
    return sum + ((c.observed - expected) ** 2) / Math.max(expected, 0.0001)
  }, 0)
  const df = k - 1
  const pValue = chiSquareP(chiSquare, df)
  const reject = pValue < alpha
  const chiCrit = CHI_CRIT[df] ? CHI_CRIT[df][alphaIdx] : 0

  function setObserved(idx: number, val: number) {
    setCats(prev => prev.map((c, i) => i === idx ? { ...c, observed: Math.max(0, isNaN(val) ? 0 : val) } : c))
  }
  function resetCats() { setCats(DEFAULT_CHI_CATS.map(c => ({ ...c }))) }

  // SVG bar chart
  const svgW = 280, svgH = 160
  const pad = { l: 22, r: 10, t: 14, b: 26 }
  const plotW = svgW - pad.l - pad.r
  const plotH = svgH - pad.t - pad.b
  const groupW = plotW / k
  const barW = groupW * 0.34
  const maxVal = Math.max(...cats.map(c => c.observed), expected, 1) * 1.15
  const sxg = (i: number) => pad.l + i * groupW + groupW / 2
  const sy = (v: number) => pad.t + plotH - (v / maxVal) * plotH

  const axisColor = isDark ? '#475569' : '#94a3b8'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const expColor = isDark ? '#fbbf24' : '#d97706'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Observed inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {cats.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: c.color, display: 'inline-block' }} />
            <span style={{ color: s.bright, minWidth: 48 }}>{c.name}</span>
            <span style={{ color: s.text }}>Obs:</span>
            <input type="number" aria-label={`${c.name} observed count`} min={0} value={c.observed} onChange={e => setObserved(i, Number(e.target.value))} style={{ ...s.input, width: 42, fontFamily: 'monospace' }} />
            <span style={{ color: s.text, marginLeft: 'auto' }}>Exp: <b style={{ color: expColor, fontFamily: 'monospace' }}>{expected.toFixed(1)}</b></span>
          </div>
        ))}
      </div>
      {/* SVG bar chart */}
      <svg viewBox={"0 0 " + svgW + ' ' + svgH} style={{ width: '100%', borderRadius: 6, background: s.bg }}>
        {/* Grid */}
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={pad.l} y1={sy(f * maxVal)} x2={svgW - pad.r} y2={sy(f * maxVal)} stroke={gridColor} strokeWidth={0.5} />
        ))}
        {/* Expected line */}
        <line x1={pad.l} y1={sy(expected)} x2={svgW - pad.r} y2={sy(expected)} stroke={expColor} strokeWidth={1} strokeDasharray="4 2" />
        <text x={svgW - pad.r} y={sy(expected) - 2} fontSize={7.5} fill={expColor} textAnchor="end" fontWeight={700}>E={expected.toFixed(1)}</text>
        {/* Bars */}
        {cats.map((c, i) => (
          <g key={i}>
            {/* Observed bar (solid colored) */}
            <rect x={sxg(i) - barW - 1} y={sy(c.observed)} width={barW} height={Math.max(0, pad.t + plotH - sy(c.observed))} fill={c.color} opacity={0.85} />
            {/* Expected bar (outlined dashed) */}
            <rect x={sxg(i) + 1} y={sy(expected)} width={barW} height={Math.max(0, pad.t + plotH - sy(expected))} fill="none" stroke={expColor} strokeWidth={1.2} strokeDasharray="2 1" />
            {/* Category label */}
            <text x={sxg(i)} y={svgH - pad.b + 10} fontSize={7.5} fill={axisColor} textAnchor="middle">{c.name.slice(0, 3)}</text>
            {/* Observed value label */}
            <text x={sxg(i) - barW / 2 - 1} y={sy(c.observed) - 2} fontSize={7.5} fill={c.color} textAnchor="middle" fontWeight={700}>{c.observed}</text>
          </g>
        ))}
        {/* Axes */}
        <line x1={pad.l} y1={pad.t + plotH} x2={svgW - pad.r} y2={pad.t + plotH} stroke={axisColor} strokeWidth={1} />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + plotH} stroke={axisColor} strokeWidth={1} />
      </svg>
      {/* Stats */}
      <div style={{ padding: '6px 8px', borderRadius: 6, background: s.bg, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', fontSize: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>χ²</span><span style={s.statValue}>{chiSquare.toFixed(3)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>df</span><span style={s.statValue}>{df}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>p-value</span><span style={s.statValue}>{pValue.toFixed(4)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={s.statLabel}>χ²crit</span><span style={s.statValue}>{chiCrit.toFixed(3)}</span></div>
      </div>
      {/* Decision banner */}
      <div style={{ padding: '5px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, textAlign: 'center' as const, background: reject ? 'rgba(248,113,113,0.12)' : 'rgba(34,197,94,0.12)', border: '1px solid ' + (reject ? 'rgba(248,113,113,0.3)' : 'rgba(34,197,94,0.3)'), color: reject ? '#f87171' : '#22c55e' }}>
        {reject ? `✗ REJECT H₀ — χ² (${chiSquare.toFixed(2)}) > χ²crit (${chiCrit.toFixed(2)})` : `✓ FAIL TO REJECT — χ² (${chiSquare.toFixed(2)}) ≤ χ²crit (${chiCrit.toFixed(2)})`}
      </div>
      {/* Alpha toggle + reset */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: s.text }}>α:</span>
        <button onClick={() => setAlphaIdx(0)} style={s.btn(alphaIdx === 0)}>0.05</button>
        <button onClick={() => setAlphaIdx(1)} style={s.btn(alphaIdx === 1)}>0.01</button>
        <button onClick={resetCats} style={{ ...s.btn(false), color: '#f87171', marginLeft: 'auto' }}>Reset</button>
      </div>
      {/* How it works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: <b>{k}</b> categories | H₀: observed = expected (fits the model)</div>
        <div>Step 2: χ² = Σ (O−E)²/E = <b>{chiSquare.toFixed(3)}</b></div>
        <div>Step 3: Degrees of freedom: df = k − 1 = {k} − 1 = <b>{df}</b></div>
        <div>Step 4: p-value = <b>{pValue.toFixed(4)}</b> | {pValue < alpha ? 'p < α → REJECT H₀ (data does NOT fit)' : 'p ≥ α → FAIL TO REJECT (data fits the model)'}</div>
        <div>Step 5: {pValue < alpha ? 'The observed distribution is significantly different from expected' : 'The observed distribution is consistent with the expected model'}</div>
        <div>Step 6: Chi-square compares what you OBSERVED vs what you EXPECTED — used in genetics, market research, quality control</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Chi-square measures how far observed data drifts from what a model predicts. Big gaps between O and E inflate χ²; small gaps keep it near zero. It's the go-to test for "does this distribution match what I expected?" — like checking if a die is fair or if genetics follow Mendel's ratios.
      </div>
    </div>
  )
}

// ============================================================
// 17. TWO-WAY TABLE BUILDER  (Grades 6-8)
// ============================================================

export function TwoWayTableBuilder({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [rowLabels, setRowLabels] = useState<string[]>(['Boys', 'Girls'])
  const [colLabels, setColLabels] = useState<string[]>(['Like', "Don't"])
  const [counts, setCounts] = useState<number[][]>([[15, 10], [20, 10]])
  const [view, setView] = useState<'count' | 'percent'>('count')

  const updateRowLabel = (i: number, val: string) =>
    setRowLabels(prev => prev.map((l, idx) => (idx === i ? val : l)))
  const updateColLabel = (i: number, val: string) =>
    setColLabels(prev => prev.map((l, idx) => (idx === i ? val : l)))
  const updateCell = (r: number, c: number, val: number) =>
    setCounts(prev => prev.map((row, ri) => (ri === r ? row.map((v, ci) => (ci === c ? Math.max(0, val) : v)) : row)))

  const grandTotal = counts.flat().reduce((a, b) => a + b, 0)
  const rowTotals = counts.map(r => r.reduce((a, b) => a + b, 0))
  const colTotals = [0, 1].map(c => counts[0][c] + counts[1][c])

  // Conditional distribution: % in column 0 within each row
  const r0p = rowTotals[0] > 0 ? (counts[0][0] / rowTotals[0]) * 100 : 0
  const r1p = rowTotals[1] > 0 ? (counts[1][0] / rowTotals[1]) * 100 : 0
  const association = Math.abs(r0p - r1p) > 10

  // Max cell
  let maxCell = 0
  let maxCellLabel = ''
  counts.forEach((row, r) => row.forEach((v, c) => {
    if (v > maxCell) {
      maxCell = v
      maxCellLabel = rowLabels[r] + ' × ' + colLabels[c]
    }
  }))
  const maxPct = grandTotal > 0 ? Math.round((maxCell / grandTotal) * 100) : 0
  const marginSummary = rowLabels.map((l, i) =>
    l + '=' + rowTotals[i] + ' (' + (grandTotal > 0 ? Math.round((rowTotals[i] / grandTotal) * 100) : 0) + '%)'
  ).join(', ')

  const headerBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const totalBg = isDark ? 'rgba(167,139,250,0.08)' : 'rgba(167,139,250,0.06)'

  const inputStyle = {
    ...s.input, padding: '3px 4px', fontSize: 10, width: '100%', textAlign: 'center' as const, fontFamily: 'monospace',
  }
  const cellInputStyle = {
    ...s.input, padding: '3px 4px', fontSize: 11, width: '100%', textAlign: 'center' as const, fontFamily: 'monospace',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* View toggle */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: s.text }}>View:</span>
        <button onClick={() => setView('count')} style={s.btn(view === 'count')}>Counts</button>
        <button onClick={() => setView('percent')} style={s.btn(view === 'percent')}>Percents</button>
        <span style={{ fontSize: 9, color: s.text, marginLeft: 'auto' }}>Edit any label or cell</span>
      </div>

      {/* The 2x2 table */}
      <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 52px', gap: 1, fontSize: 10 }}>
        {/* Header row */}
        <div style={{ background: headerBg, padding: '4px 2px' }} />
        {colLabels.map((l, i) => (
          <div key={i} style={{ background: headerBg, padding: '2px' }}>
            <input aria-label={`Column ${i + 1} label`} value={l} onChange={e => updateColLabel(i, e.target.value)} style={inputStyle} />
          </div>
        ))}
        <div style={{ background: totalBg, padding: '4px 2px', textAlign: 'center', fontWeight: 700, color: '#a78bfa', fontSize: 9 }}>Total</div>

        {/* Row 1 */}
        <div style={{ background: headerBg, padding: '2px' }}>
          <input aria-label="Row 1 label" value={rowLabels[0]} onChange={e => updateRowLabel(0, e.target.value)} style={inputStyle} />
        </div>
        {[0, 1].map(c => (
          <div key={c} style={{ background: s.bg, padding: '2px' }}>
            <input type="number" aria-label={`Row 1 column ${c + 1} count`} value={counts[0][c]} onChange={e => updateCell(0, c, parseInt(e.target.value) || 0)} style={cellInputStyle} />
          </div>
        ))}
        <div style={{ background: totalBg, padding: '4px 2px', textAlign: 'center', fontWeight: 700, color: '#a78bfa', fontFamily: 'monospace' }}>{rowTotals[0]}</div>

        {/* Row 2 */}
        <div style={{ background: headerBg, padding: '2px' }}>
          <input aria-label="Row 2 label" value={rowLabels[1]} onChange={e => updateRowLabel(1, e.target.value)} style={inputStyle} />
        </div>
        {[0, 1].map(c => (
          <div key={c} style={{ background: s.bg, padding: '2px' }}>
            <input type="number" aria-label={`Row 2 column ${c + 1} count`} value={counts[1][c]} onChange={e => updateCell(1, c, parseInt(e.target.value) || 0)} style={cellInputStyle} />
          </div>
        ))}
        <div style={{ background: totalBg, padding: '4px 2px', textAlign: 'center', fontWeight: 700, color: '#a78bfa', fontFamily: 'monospace' }}>{rowTotals[1]}</div>

        {/* Total row */}
        <div style={{ background: totalBg, padding: '4px 2px', textAlign: 'center', fontWeight: 700, color: '#a78bfa', fontSize: 9 }}>Total</div>
        {[0, 1].map(c => (
          <div key={c} style={{ background: totalBg, padding: '4px 2px', textAlign: 'center', fontWeight: 700, color: '#a78bfa', fontFamily: 'monospace' }}>{colTotals[c]}</div>
        ))}
        <div style={{ background: totalBg, padding: '4px 2px', textAlign: 'center', fontWeight: 700, color: '#a78bfa', fontFamily: 'monospace' }}>{grandTotal}</div>
      </div>

      {/* Conditional distribution visualization */}
      <div style={{ padding: '6px 8px', borderRadius: 6, background: s.bg, border: '1px solid ' + s.border }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 4 }}>
          Conditional Distribution — % who "{colLabels[0]}"
        </div>
        {[0, 1].map(r => (
          <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: s.bright, minWidth: 40 }}>{rowLabels[r]}</span>
            <div style={{ flex: 1, height: 14, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: (r === 0 ? r0p : r1p) + '%', height: '100%', background: association ? '#f87171' : '#34d399', opacity: 0.85 }} />
            </div>
            <span style={{ fontSize: 10, color: s.bright, fontFamily: 'monospace', minWidth: 38, textAlign: 'right' as const }}>{(r === 0 ? r0p : r1p).toFixed(1)}%</span>
          </div>
        ))}
        <div style={{ fontSize: 9, color: s.text, marginTop: 3 }}>
          Δ = <b style={{ color: association ? '#f87171' : '#34d399' }}>{Math.abs(r0p - r1p).toFixed(1)}pp</b> — {association ? 'association detected (>10pp)' : 'no clear association'}
        </div>
      </div>

      {/* How it works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: 2×2 table | Grand total: <b>{grandTotal}</b> {grandTotal === 1 ? 'student' : 'students'}</div>
        <div>Step 2: {view === 'count' ? 'Showing counts' : 'Showing percentages'} | Row totals: {rowTotals.join(', ')} | Column totals: {colTotals.join(', ')}</div>
        <div>Step 3: {view === 'percent' ? maxPct + '% in the largest cell (' + maxCellLabel + ')' : 'Largest cell: ' + maxCellLabel + ' = ' + maxCell}</div>
        <div>Step 4: Marginal: {marginSummary}</div>
        <div>Step 5: {association ? 'There IS an association — ' + rowLabels[0] + ' ' + (r0p > r1p ? 'more' : 'less') + ' likely to "' + colLabels[0] + '" (Δ=' + Math.abs(r0p - r1p).toFixed(0) + 'pp)' : 'No clear association — similar proportions across groups (Δ=' + Math.abs(r0p - r1p).toFixed(0) + 'pp)'}</div>
        <div>Step 6: Compare percentages WITHIN rows (conditional distribution) to find associations</div>
      </div>
      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Two-way tables organize two categorical variables. Marginal totals show overall distribution; conditional percentages reveal associations. If percentages within rows are similar, the variables are independent.
      </div>
    </div>
  )
}

// ============================================================
// 18. TREE DIAGRAM PROBABILITY  (Grades 6-8)
// ============================================================

type TreeScenario = 'coins' | 'spinflip' | 'marbles'
type TreeBranch = { label: string; full: string; prob: number }
type TreeLeaf = {
  outcome: string
  e1Label: string
  e2Label: string
  e1Prob: number
  e2Prob: number
  totalProb: number
  e1Idx: number
  e2Idx: number
}

export function TreeDiagramProbability({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [scenario, setScenario] = useState<TreeScenario>('coins')
  const [replacement, setReplacement] = useState(true)
  const [selectedLeaf, setSelectedLeaf] = useState(0)
  const [calculated, setCalculated] = useState(false)

  const data = useMemo(() => {
    if (scenario === 'coins') {
      const e1: TreeBranch[] = [
        { label: 'H', full: 'Heads', prob: 0.5 },
        { label: 'T', full: 'Tails', prob: 0.5 },
      ]
      const e2: TreeBranch[][] = [
        [{ label: 'H', full: 'Heads', prob: 0.5 }, { label: 'T', full: 'Tails', prob: 0.5 }],
        [{ label: 'H', full: 'Heads', prob: 0.5 }, { label: 'T', full: 'Tails', prob: 0.5 }],
      ]
      return {
        name: 'Flip 2 Coins',
        e1Name: 'Coin #1',
        e2Name: 'Coin #2',
        e1, e2,
        replacement: null as boolean | null,
      }
    } else if (scenario === 'spinflip') {
      const e1: TreeBranch[] = [
        { label: 'R', full: 'Red', prob: 0.5 },
        { label: 'B', full: 'Blue', prob: 0.5 },
      ]
      const e2: TreeBranch[][] = [
        [{ label: 'H', full: 'Heads', prob: 0.5 }, { label: 'T', full: 'Tails', prob: 0.5 }],
        [{ label: 'H', full: 'Heads', prob: 0.5 }, { label: 'T', full: 'Tails', prob: 0.5 }],
      ]
      return {
        name: 'Spin then Flip',
        e1Name: 'Spinner',
        e2Name: 'Coin',
        e1, e2,
        replacement: null as boolean | null,
      }
    } else {
      const e1: TreeBranch[] = [
        { label: 'R', full: 'Red', prob: 3 / 5 },
        { label: 'B', full: 'Blue', prob: 2 / 5 },
      ]
      const e2: TreeBranch[][] = replacement
        ? [
            [{ label: 'R', full: 'Red', prob: 3 / 5 }, { label: 'B', full: 'Blue', prob: 2 / 5 }],
            [{ label: 'R', full: 'Red', prob: 3 / 5 }, { label: 'B', full: 'Blue', prob: 2 / 5 }],
          ]
        : [
            [{ label: 'R', full: 'Red', prob: 2 / 4 }, { label: 'B', full: 'Blue', prob: 2 / 4 }],
            [{ label: 'R', full: 'Red', prob: 3 / 4 }, { label: 'B', full: 'Blue', prob: 1 / 4 }],
          ]
      return {
        name: 'Draw 2 Marbles (Bag: 3R, 2B)',
        e1Name: 'Draw 1st',
        e2Name: 'Draw 2nd',
        e1, e2,
        replacement: replacement as boolean | null,
      }
    }
  }, [scenario, replacement])

  const leaves = useMemo<TreeLeaf[]>(() => {
    const result: TreeLeaf[] = []
    data.e1.forEach((b1, i) => {
      data.e2[i].forEach((b2, j) => {
        result.push({
          outcome: b1.label + b2.label,
          e1Label: b1.full,
          e2Label: b2.full,
          e1Prob: b1.prob,
          e2Prob: b2.prob,
          totalProb: b1.prob * b2.prob,
          e1Idx: i,
          e2Idx: j,
        })
      })
    })
    return result
  }, [data])

  const selected = leaves[selectedLeaf] || leaves[0]
  const totalProbSum = leaves.reduce((sum, l) => sum + l.totalProb, 0)

  // SVG coordinates
  const rootX = 18, rootY = 110
  const e1X = 100
  const e1Ys = [50, 170]
  const e2X = 190
  const e2Ys = [25, 75, 145, 195]
  const leafX = 275

  const axisColor = isDark ? '#475569' : '#94a3b8'
  const highlight = '#34d399'
  const dimStroke = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)'

  const e1PathIdx = selected.e1Idx
  const e2PathIdx = selected.e2Idx

  // Format probability as fraction
  const fmt = (p: number) => {
    if (p === 0.5) return '½'
    if (Math.abs(p - 3 / 5) < 1e-9) return '3/5'
    if (Math.abs(p - 2 / 5) < 1e-9) return '2/5'
    if (Math.abs(p - 3 / 4) < 1e-9) return '3/4'
    if (Math.abs(p - 2 / 4) < 1e-9) return '2/4'
    if (Math.abs(p - 1 / 4) < 1e-9) return '1/4'
    return p.toFixed(3)
  }
  const pct = (p: number) => (p * 100).toFixed(1) + '%'

  useEffect(() => {
    setCalculated(false)
    setSelectedLeaf(0)
  }, [scenario, replacement])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Scenario selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {([['coins', '2 Coins'], ['spinflip', 'Spin+Flip'], ['marbles', '2 Marbles']] as [TreeScenario, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setScenario(id)} style={s.btn(scenario === id)}>{label}</button>
        ))}
      </div>

      {/* Replacement toggle (only for marbles) */}
      {scenario === 'marbles' && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: s.text }}>Draw:</span>
          <button onClick={() => setReplacement(true)} style={s.btn(replacement)}>With replacement</button>
          <button onClick={() => setReplacement(false)} style={s.btn(!replacement)}>Without</button>
        </div>
      )}

      {/* Tree SVG */}
      <svg viewBox="0 0 280 210" style={{ width: '100%', borderRadius: 6, background: s.bg }}>
        {/* Column headers */}
        <text x={rootX} y={12} fontSize={8} fill={axisColor} textAnchor="middle" fontWeight={700}>Start</text>
        <text x={e1X} y={12} fontSize={8} fill={axisColor} textAnchor="middle" fontWeight={700}>Event 1</text>
        <text x={e2X} y={12} fontSize={8} fill={axisColor} textAnchor="middle" fontWeight={700}>Event 2</text>
        <text x={leafX - 5} y={12} fontSize={8} fill={axisColor} textAnchor="end" fontWeight={700}>Outcomes</text>

        {/* Event 1 branches */}
        {data.e1.map((b1, i) => {
          const isPath = calculated && i === e1PathIdx
          return (
            <g key={'e1' + i}>
              <line x1={rootX} y1={rootY} x2={e1X} y2={e1Ys[i]}
                stroke={isPath ? highlight : dimStroke}
                strokeWidth={isPath ? 2 : 1} />
              <text x={(rootX + e1X) / 2} y={(rootY + e1Ys[i]) / 2 - 4}
                fontSize={9} fill={isPath ? highlight : axisColor} textAnchor="middle" fontWeight={isPath ? 700 : 400}>
                {b1.label} ({fmt(b1.prob)})
              </text>
              <circle cx={e1X} cy={e1Ys[i]} r={6} fill={isPath ? highlight : (isDark ? '#1e293b' : '#fff')} stroke={isPath ? highlight : axisColor} strokeWidth={1.5} />
              <text x={e1X} y={e1Ys[i] + 3} fontSize={8} fill={isPath ? (isDark ? '#0f172a' : '#fff') : s.bright} textAnchor="middle" fontWeight={700}>{b1.label}</text>
            </g>
          )
        })}

        {/* Event 2 branches */}
        {data.e1.map((_, i) => {
          return data.e2[i].map((b2, j) => {
            const leafIdx = i * 2 + j
            const isPath = calculated && leafIdx === (e1PathIdx * 2 + e2PathIdx)
            const e2Y = e2Ys[leafIdx]
            return (
              <g key={'e2' + leafIdx}>
                <line x1={e1X} y1={e1Ys[i]} x2={e2X} y2={e2Y}
                  stroke={isPath ? highlight : dimStroke}
                  strokeWidth={isPath ? 2 : 1} />
                <text x={(e1X + e2X) / 2} y={(e1Ys[i] + e2Y) / 2 - 4}
                  fontSize={9} fill={isPath ? highlight : axisColor} textAnchor="middle" fontWeight={isPath ? 700 : 400}>
                  {b2.label} ({fmt(b2.prob)})
                </text>
                <circle cx={e2X} cy={e2Y} r={6} fill={isPath ? highlight : (isDark ? '#1e293b' : '#fff')} stroke={isPath ? highlight : axisColor} strokeWidth={1.5} />
                <text x={e2X} y={e2Y + 3} fontSize={8} fill={isPath ? (isDark ? '#0f172a' : '#fff') : s.bright} textAnchor="middle" fontWeight={700}>{b2.label}</text>
              </g>
            )
          })
        })}

        {/* Root node */}
        <circle cx={rootX} cy={rootY} r={6} fill={isDark ? '#1e293b' : '#fff'} stroke={axisColor} strokeWidth={1.5} />

        {/* Outcome labels (leaves) */}
        {leaves.map((l, i) => {
          const isPath = calculated && i === selectedLeaf
          return (
            <g key={'leaf' + i}>
              <line x1={e2X} y1={e2Ys[i]} x2={leafX - 5} y2={e2Ys[i]}
                stroke={isPath ? highlight : dimStroke}
                strokeWidth={isPath ? 1.5 : 0.5}
                strokeDasharray={isPath ? 'none' : '2 2'} />
              <text x={leafX - 8} y={e2Ys[i] - 2}
                fontSize={10} fontWeight={700}
                fill={isPath ? highlight : s.bright}
                textAnchor="end">{l.outcome}</text>
              <text x={leafX - 8} y={e2Ys[i] + 9}
                fontSize={8}
                fill={isPath ? highlight : axisColor}
                textAnchor="end">{pct(l.totalProb)}</text>
            </g>
          )
        })}
      </svg>

      {/* Calculate + leaf selector */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setCalculated(true)} style={{
          padding: '5px 12px', borderRadius: 5, fontSize: 11, fontWeight: 700,
          background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)',
          color: '#34d399', cursor: 'pointer',
        }}>Calculate</button>
        <span style={{ fontSize: 10, color: s.text }}>Pick:</span>
        {leaves.map((l, i) => (
          <button key={i} onClick={() => { setSelectedLeaf(i); setCalculated(true) }} style={s.btn(selectedLeaf === i && calculated)}>{l.outcome}</button>
        ))}
      </div>

      {/* How it works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Scenario: <b>{data.name}</b> | 2 sequential events</div>
        <div>Step 2: Event 1 ({data.e1Name}) → {data.e1.map(b => b.full + '=' + fmt(b.prob)).join(', ')}</div>
        <div>Step 3: Event 2 ({data.e2Name}) → {data.e2[0].map(b => b.full + '=' + fmt(b.prob)).join(', ')}</div>
        <div>Step 4: {data.replacement === null ? 'Each branch shows the probability of that outcome' : (data.replacement ? 'WITH replacement → independent events (probabilities don\'t change)' : 'WITHOUT replacement → dependent events (2nd probability changes after 1st draw)')}</div>
        <div>Step 5: {calculated ? <>P({selected.outcome}) = {fmt(selected.e1Prob)} × {fmt(selected.e2Prob)} = <b>{fmt(selected.totalProb)}</b> = {pct(selected.totalProb)}</> : 'Click "Calculate" to multiply along branches'}</div>
        <div>Step 6: All leaf probabilities sum to <b>{pct(totalProbSum)}</b> — the tree covers every possible outcome</div>
      </div>
      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Compound probability multiplies along branches: P(A and B) = P(A) × P(B|A). With replacement, events are independent; without, they're dependent — the second probability depends on what happened first.
      </div>
    </div>
  )
}

// ============================================================
// 19. SAMPLE vs POPULATION SIMULATOR  (Grades 6-8)
// ============================================================

const POP_SAMPLE_SIZES = [5, 10, 25, 50, 100, 200]

export function SampleVsPopulationSim({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [popPercent, setPopPercent] = useState(60)
  const [n, setN] = useState(10)
  const [samples, setSamples] = useState<number[]>([])
  const [lastSample, setLastSample] = useState<{ red: number; blue: number } | null>(null)
  const [drawing, setDrawing] = useState(false)
  const rafRef = useRef<number | null>(null)

  const popTotal = 1000

  useEffect(() => {
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [])

  const drawSample = () => {
    if (drawing) return
    setDrawing(true)
    const startTime = performance.now()
    const animate = (now: number) => {
      if (now - startTime < 180) {
        rafRef.current = requestAnimationFrame(animate)
        return
      }
      let redCount = 0
      for (let i = 0; i < n; i++) {
        if (Math.random() * 100 < popPercent) redCount++
      }
      const blueCount = n - redCount
      setLastSample({ red: redCount, blue: blueCount })
      const samplePct = (redCount / n) * 100
      setSamples(prev => [...prev, samplePct].slice(-30))
      setDrawing(false)
    }
    rafRef.current = requestAnimationFrame(animate)
  }

  const reset = () => {
    setSamples([])
    setLastSample(null)
  }

  const lastSamplePct = lastSample ? (lastSample.red / n) * 100 : 0
  const meanSample = samples.length > 0 ? samples.reduce((a, b) => a + b, 0) / samples.length : 0

  // Histogram of sample percentages (bins of 10%)
  const binCounts = Array.from({ length: 10 }, (_, i) => {
    if (i === 9) return samples.filter(p => p >= 90 && p <= 100).length
    return samples.filter(p => p >= i * 10 && p < (i + 1) * 10).length
  })
  const maxBin = Math.max(1, ...binCounts)

  // Population dot grid (25x40 = 1000)
  const cols = 40, rows = 25
  const dotGap = 3
  const popDots = useMemo(() => {
    const dots: boolean[] = []
    let red = Math.round(popTotal * popPercent / 100)
    let blue = popTotal - red
    for (let i = 0; i < popTotal; i++) {
      if (red > 0 && (blue === 0 || Math.random() < red / (red + blue))) {
        dots.push(true); red--
      } else {
        dots.push(false); blue--
      }
    }
    return dots
  }, [popPercent])

  const redColor = isDark ? '#f87171' : '#dc2626'
  const blueColor = isDark ? '#60a5fa' : '#3b82f6'
  const popLineColor = isDark ? '#fbbf24' : '#d97706'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Population % slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: s.text }}>
        <span style={{ minWidth: 75 }}>Pop % red:</span>
        <input type="range" aria-label="Population percent red" min={10} max={90} step={5} value={popPercent}
          onChange={e => { setPopPercent(parseInt(e.target.value)); reset() }}
          style={{ flex: 1 }} />
        <span style={{ fontFamily: 'monospace', color: s.bright, minWidth: 32, textAlign: 'right' as const }}>{popPercent}%</span>
      </div>

      {/* Population visualization */}
      <div style={{ padding: '6px 8px', borderRadius: 6, background: s.bg, border: '1px solid ' + s.border }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 4 }}>
          Population (1000 items) — <span style={{ color: redColor }}>{popPercent}% red</span>, <span style={{ color: blueColor }}>{100 - popPercent}% blue</span>
        </div>
        <svg viewBox={"0 0 " + (cols * dotGap + 2) + " " + (rows * dotGap + 2)} style={{ width: '100%', maxHeight: 78 }} preserveAspectRatio="xMidYMid meet">
          {popDots.map((isRed, i) => (
            <circle key={i} cx={1 + (i % cols) * dotGap} cy={1 + Math.floor(i / cols) * dotGap} r={1.3} fill={isRed ? redColor : blueColor} opacity={0.85} />
          ))}
        </svg>
      </div>

      {/* Sample size selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: s.text }}>n =</span>
        {POP_SAMPLE_SIZES.map(sz => (
          <button key={sz} onClick={() => { setN(sz); setLastSample(null) }} style={s.btn(n === sz)}>{sz}</button>
        ))}
      </div>

      {/* Draw Sample button */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={drawSample} disabled={drawing} style={{
          padding: '5px 14px', borderRadius: 5, fontSize: 11, fontWeight: 700,
          background: drawing ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)') : 'rgba(5,150,105,0.15)',
          border: drawing ? '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)') : '1px solid rgba(5,150,105,0.3)',
          color: drawing ? (isDark ? '#64748b' : '#94a3b8') : '#34d399',
          cursor: drawing ? 'not-allowed' : 'pointer',
        }}>{drawing ? 'Drawing...' : 'Draw Sample'}</button>
        <button onClick={reset} style={{ ...s.btn(false), color: '#f87171' }}>Reset</button>
      </div>

      {/* Last sample visualization */}
      {lastSample && (
        <div style={{ padding: '6px 8px', borderRadius: 6, background: s.bg, border: '1px solid ' + s.border }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 4 }}>
            Last sample (n={n}): {lastSample.red} red, {lastSample.blue} blue = <span style={{ color: redColor }}>{lastSamplePct.toFixed(1)}%</span> red
          </div>
          <div style={{ display: 'flex', height: 18, borderRadius: 3, overflow: 'hidden', border: '1px solid ' + s.border }}>
            <div style={{ width: lastSamplePct + '%', background: redColor, opacity: 0.85 }} />
            <div style={{ flex: 1, background: blueColor, opacity: 0.85 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: s.text, marginTop: 2 }}>
            <span style={{ color: redColor }}>Red {lastSamplePct.toFixed(0)}%</span>
            <span style={{ color: blueColor }}>Blue {(100 - lastSamplePct).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* Sample history histogram */}
      {samples.length > 0 && (
        <div style={{ padding: '6px 8px', borderRadius: 6, background: s.bg, border: '1px solid ' + s.border }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 4 }}>
            Distribution of sample % red ({samples.length} samples) — mean = <span style={{ color: s.bright }}>{meanSample.toFixed(1)}%</span>
          </div>
          <svg viewBox="0 0 280 85" style={{ width: '100%' }}>
            {/* Population % line */}
            <line x1={28 + (popPercent / 100) * 250} y1={6} x2={28 + (popPercent / 100) * 250} y2={72} stroke={popLineColor} strokeWidth={1.5} strokeDasharray="3 2" />
            <text x={28 + (popPercent / 100) * 250} y={5} fontSize={7} fill={popLineColor} textAnchor="middle" fontWeight={700}>pop {popPercent}%</text>
            {/* Bars */}
            {binCounts.map((c, i) => {
              const h = (c / maxBin) * 60
              const x = 28 + i * 25
              const y = 72 - h
              const binMidPct = i * 10 + 5
              const isNearPop = Math.abs(binMidPct - popPercent) <= 10
              return (
                <g key={i}>
                  <rect x={x + 1} y={y} width={23} height={h} fill={isNearPop ? '#34d399' : (isDark ? '#60a5fa' : '#3b82f6')} opacity={0.75} rx={1} />
                  {c > 0 && <text x={x + 12.5} y={y - 2} fontSize={7} fill={isDark ? '#94a3b8' : '#475569'} textAnchor="middle">{c}</text>}
                  <text x={x + 12.5} y={80} fontSize={6} fill={isDark ? '#64748b' : '#94a3b8'} textAnchor="middle">{i * 10}</text>
                </g>
              )
            })}
            <line x1={28} y1={72} x2={278} y2={72} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth={0.5} />
            <text x={278} y={84} fontSize={6} fill={isDark ? '#64748b' : '#94a3b8'} textAnchor="end">% red</text>
          </svg>
        </div>
      )}

      {/* How it works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Population: 1000 items, <b>{popPercent}%</b> red | Sample size: n = <b>{n}</b></div>
        <div>Step 2: Samples drawn: <b>{samples.length}</b> | Last sample: <b style={{ color: redColor }}>{lastSample ? lastSamplePct.toFixed(1) + '%' : '—'}</b> red</div>
        <div>Step 3: {samples.length > 0 ? <>Sample % history: {samples.slice(-6).map(p => p.toFixed(0) + '%').join(', ')}{samples.length > 6 ? '...' : ''}</> : 'Click "Draw Sample" to collect data'}</div>
        <div>Step 4: {samples.length > 2 ? <>Mean of samples: <b>{meanSample.toFixed(1)}%</b> (vs population {popPercent}%)</> : 'Draw more samples to see the pattern'}</div>
        <div>Step 5: {n < 25 ? 'Small sample (n=' + n + ') → high variability, samples differ a lot' : 'Larger sample (n=' + n + ') → less variability, samples cluster near ' + popPercent + '%'}</div>
        <div>Step 6: Bigger sample = more representative — this is why polls use ~1000 people, not 10</div>
      </div>
      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Larger samples better represent the population. Small samples bounce around; large samples cluster near the true value. This is the foundation of statistical inference — why pollsters trust a sample of 1000 to represent millions.
      </div>
    </div>
  )
}

// ============================================================
// 20. MISLEADING GRAPHS GALLERY  (Grades 6-8)
// ============================================================

type MisleadingTechnique = 'truncated' | 'inconsistent' | '3d' | 'cherry'

type TechniqueInfo = {
  name: string
  problem: string
  description: string
  truncatedStart: number
  amplified: number
}

const TECHNIQUES: Record<MisleadingTechnique, TechniqueInfo> = {
  truncated: {
    name: 'Truncated Y-axis',
    problem: 'Y-axis starts at 80 instead of 0, making small differences look huge',
    description: 'Bar chart of test scores: A=85, B=87, C=83. Truncating the axis exaggerates the 4-point gap.',
    truncatedStart: 80,
    amplified: 3,
  },
  inconsistent: {
    name: 'Inconsistent Scale',
    problem: 'Y-axis uses non-linear ticks (0, 10, 20, 50, 100), distorting proportions',
    description: 'Non-linear y-axis makes 100 look only ~2× taller than 20 (should be 5×).',
    truncatedStart: 0,
    amplified: 2,
  },
  '3d': {
    name: '3D Distortion',
    problem: '3D perspective makes back slices look smaller and front slices look bigger',
    description: '3D pie distorts visual angles — same data looks different depending on slice position.',
    truncatedStart: 0,
    amplified: 2,
  },
  cherry: {
    name: 'Cherry-picked Timeframe',
    problem: 'Only showing months 6-8 (a dip) hides the overall upward trend',
    description: 'Selecting a short timeframe can hide the true long-term pattern.',
    truncatedStart: 0,
    amplified: 4,
  },
}

const MONTHS_DATA = [
  { label: 'J', val: 30 },
  { label: 'F', val: 35 },
  { label: 'M', val: 42 },
  { label: 'A', val: 50 },
  { label: 'M', val: 65 },
  { label: 'J', val: 78 },
  { label: 'J', val: 72 },
  { label: 'A', val: 60 },
  { label: 'S', val: 55 },
  { label: 'O', val: 70 },
  { label: 'N', val: 85 },
  { label: 'D', val: 95 },
]

function TruncatedViz({ isDark, revealed }: { isDark: boolean; revealed: boolean }) {
  const axisColor = isDark ? '#475569' : '#94a3b8'
  const redColor = '#f87171'
  const greenColor = '#34d399'
  const barColor = isDark ? '#60a5fa' : '#3b82f6'
  const data = [{ label: 'A', val: 85 }, { label: 'B', val: 87 }, { label: 'C', val: 83 }]
  return (
    <>
      {/* Left: misleading — y-axis 80-90 */}
      <g>
        <text x={22} y={28} fontSize={6} fill={revealed ? redColor : axisColor} textAnchor="start">90</text>
        <text x={22} y={92} fontSize={6} fill={revealed ? redColor : axisColor} textAnchor="start">80</text>
        <line x1={20} y1={95} x2={130} y2={95} stroke={axisColor} strokeWidth={0.5} />
        {revealed && <text x={26} y={22} fontSize={7} fill={redColor} textAnchor="start" fontWeight={700}>✗ starts at 80</text>}
        {data.map((d, i) => {
          const x = 38 + i * 30
          const barH = ((d.val - 80) / 10) * 60
          return (
            <g key={i}>
              <rect x={x} y={95 - barH} width={20} height={barH} fill={barColor} opacity={0.85} rx={1} />
              <text x={x + 10} y={105} fontSize={7} fill={axisColor} textAnchor="middle">{d.label}</text>
              <text x={x + 10} y={95 - barH - 2} fontSize={6} fill={revealed ? redColor : axisColor} textAnchor="middle" fontWeight={revealed ? 700 : 400}>{d.val}</text>
            </g>
          )
        })}
      </g>
      {/* Right: corrected — y-axis 0-100 */}
      <g>
        <text x={152} y={22} fontSize={6} fill={revealed ? greenColor : axisColor} textAnchor="start">100</text>
        <text x={152} y={95} fontSize={6} fill={revealed ? greenColor : axisColor} textAnchor="start">0</text>
        <line x1={150} y1={95} x2={270} y2={95} stroke={axisColor} strokeWidth={0.5} />
        {revealed && <text x={156} y={16} fontSize={7} fill={greenColor} textAnchor="start" fontWeight={700}>✓ starts at 0</text>}
        {data.map((d, i) => {
          const x = 168 + i * 30
          const barH = (d.val / 100) * 70
          return (
            <g key={i}>
              <rect x={x} y={95 - barH} width={20} height={barH} fill={barColor} opacity={0.85} rx={1} />
              <text x={x + 10} y={105} fontSize={7} fill={axisColor} textAnchor="middle">{d.label}</text>
              <text x={x + 10} y={95 - barH - 2} fontSize={6} fill={revealed ? greenColor : axisColor} textAnchor="middle" fontWeight={revealed ? 700 : 400}>{d.val}</text>
            </g>
          )
        })}
      </g>
    </>
  )
}

function InconsistentViz({ isDark, revealed }: { isDark: boolean; revealed: boolean }) {
  const axisColor = isDark ? '#475569' : '#94a3b8'
  const redColor = '#f87171'
  const greenColor = '#34d399'
  const barColor = isDark ? '#60a5fa' : '#3b82f6'
  const data = [{ label: 'A', val: 10 }, { label: 'B', val: 20 }, { label: 'C', val: 50 }, { label: 'D', val: 100 }]
  // Misleading: non-linear ticks 0, 10, 20, 50, 100 placed at evenly spaced positions
  // y=95 (bottom) for 0, y=80 for 10, y=65 for 20, y=50 for 50, y=35 for 100
  const misTicks: Array<[number, number]> = [[0, 95], [10, 80], [20, 65], [50, 50], [100, 35]]
  const misYForVal = (v: number) => {
    // Linear interpolation between ticks
    for (let i = 0; i < misTicks.length - 1; i++) {
      const [v1, y1] = misTicks[i]
      const [v2, y2] = misTicks[i + 1]
      if (v >= v1 && v <= v2) return y1 + ((v - v1) / (v2 - v1)) * (y2 - y1)
    }
    return 95
  }
  return (
    <>
      {/* Left: misleading non-linear scale */}
      <g>
        {misTicks.map(([v, y]) => (
          <text key={v} x={22} y={y + 2} fontSize={6} fill={revealed ? redColor : axisColor} textAnchor="start">{v}</text>
        ))}
        <line x1={20} y1={95} x2={130} y2={95} stroke={axisColor} strokeWidth={0.5} />
        {revealed && <text x={26} y={22} fontSize={7} fill={redColor} textAnchor="start" fontWeight={700}>✗ non-linear</text>}
        {data.map((d, i) => {
          const x = 38 + i * 22
          const yTop = misYForVal(d.val)
          return (
            <g key={i}>
              <rect x={x} y={yTop} width={16} height={95 - yTop} fill={barColor} opacity={0.85} rx={1} />
              <text x={x + 8} y={105} fontSize={7} fill={axisColor} textAnchor="middle">{d.label}</text>
              <text x={x + 8} y={yTop - 2} fontSize={6} fill={revealed ? redColor : axisColor} textAnchor="middle" fontWeight={revealed ? 700 : 400}>{d.val}</text>
            </g>
          )
        })}
      </g>
      {/* Right: corrected linear 0-100 */}
      <g>
        <text x={152} y={24} fontSize={6} fill={revealed ? greenColor : axisColor} textAnchor="start">100</text>
        <text x={152} y={60} fontSize={6} fill={revealed ? greenColor : axisColor} textAnchor="start">50</text>
        <text x={152} y={95} fontSize={6} fill={revealed ? greenColor : axisColor} textAnchor="start">0</text>
        <line x1={150} y1={95} x2={270} y2={95} stroke={axisColor} strokeWidth={0.5} />
        {revealed && <text x={156} y={16} fontSize={7} fill={greenColor} textAnchor="start" fontWeight={700}>✓ linear</text>}
        {data.map((d, i) => {
          const x = 168 + i * 22
          const barH = (d.val / 100) * 70
          return (
            <g key={i}>
              <rect x={x} y={95 - barH} width={16} height={barH} fill={barColor} opacity={0.85} rx={1} />
              <text x={x + 8} y={105} fontSize={7} fill={axisColor} textAnchor="middle">{d.label}</text>
              <text x={x + 8} y={95 - barH - 2} fontSize={6} fill={revealed ? greenColor : axisColor} textAnchor="middle" fontWeight={revealed ? 700 : 400}>{d.val}</text>
            </g>
          )
        })}
      </g>
    </>
  )
}

function ThreeDViz({ isDark, revealed }: { isDark: boolean; revealed: boolean }) {
  const axisColor = isDark ? '#475569' : '#94a3b8'
  const redColor = '#f87171'
  const greenColor = '#34d399'
  // 3 slices: A=30%, B=40%, C=30% (108°, 144°, 108°)
  const slices = [
    { label: 'A', pct: 30, color: '#60a5fa', start: 0, end: 108 },
    { label: 'B', pct: 40, color: '#34d399', start: 108, end: 252 },
    { label: 'C', pct: 30, color: '#fbbf24', start: 252, end: 360 },
  ]
  // Helper: get a point on an ellipse at angle (deg, 0=top)
  const ellipsePoint = (cx: number, cy: number, rx: number, ry: number, angleDeg: number) => {
    const a = (angleDeg - 90) * Math.PI / 180
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) }
  }
  const slicePath = (cx: number, cy: number, rx: number, ry: number, startDeg: number, endDeg: number) => {
    const p1 = ellipsePoint(cx, cy, rx, ry, startDeg)
    const p2 = ellipsePoint(cx, cy, rx, ry, endDeg)
    const largeArc = endDeg - startDeg > 180 ? 1 : 0
    return 'M' + cx + ',' + cy + ' L' + p1.x.toFixed(2) + ',' + p1.y.toFixed(2) +
      ' A' + rx + ',' + ry + ' 0 ' + largeArc + ',1 ' + p2.x.toFixed(2) + ',' + p2.y.toFixed(2) + ' Z'
  }
  return (
    <>
      {/* Left: misleading 3D pie */}
      <g>
        {revealed && <text x={70} y={20} fontSize={7} fill={redColor} textAnchor="middle" fontWeight={700}>✗ 3D distorts</text>}
        {/* Side wall (darker shade) */}
        {slices.map((sl, i) => {
          // Only draw side wall for bottom half (180° to 360°, i.e., the front)
          const wallStart = Math.max(sl.start, 180)
          const wallEnd = Math.min(sl.end, 360)
          if (wallEnd <= wallStart) return null
          const p1 = ellipsePoint(70, 55, 38, 14, wallStart)
          const p2 = ellipsePoint(70, 55, 38, 14, wallEnd)
          const largeArc = wallEnd - wallStart > 180 ? 1 : 0
          return (
            <path key={'wall' + i}
              d={'M' + p1.x.toFixed(2) + ',' + p1.y.toFixed(2) +
                 ' A38,14 0 ' + largeArc + ',1 ' + p2.x.toFixed(2) + ',' + p2.y.toFixed(2) +
                 ' L' + p2.x.toFixed(2) + ',' + (p2.y + 8).toFixed(2) +
                 ' A38,14 0 ' + largeArc + ',0 ' + p1.x.toFixed(2) + ',' + (p1.y + 8).toFixed(2) + ' Z'}
              fill={sl.color} opacity={0.45} stroke={isDark ? '#1e293b' : '#fff'} strokeWidth={0.5} />
          )
        })}
        {/* Top surface (ellipse slices) */}
        {slices.map((sl, i) => (
          <path key={'top' + i} d={slicePath(70, 55, 38, 14, sl.start, sl.end)}
            fill={sl.color} opacity={0.85} stroke={isDark ? '#1e293b' : '#fff'} strokeWidth={1} />
        ))}
        {/* Labels */}
        {slices.map((sl, i) => {
          const mid = (sl.start + sl.end) / 2
          const p = ellipsePoint(70, 55, 38 * 0.6, 14 * 0.6, mid)
          return <text key={'lbl' + i} x={p.x} y={p.y + 3} fontSize={8} fill="#fff" textAnchor="middle" fontWeight={700}>{sl.label}</text>
        })}
      </g>
      {/* Right: corrected 2D pie */}
      <g>
        {revealed && <text x={210} y={20} fontSize={7} fill={greenColor} textAnchor="middle" fontWeight={700}>✓ 2D true</text>}
        {slices.map((sl, i) => (
          <path key={'c' + i} d={slicePath(210, 55, 28, 28, sl.start, sl.end)}
            fill={sl.color} opacity={0.85} stroke={isDark ? '#1e293b' : '#fff'} strokeWidth={1} />
        ))}
        {slices.map((sl, i) => {
          const mid = (sl.start + sl.end) / 2
          const p = ellipsePoint(210, 55, 28 * 0.6, 28 * 0.6, mid)
          return <text key={'cl' + i} x={p.x} y={p.y + 3} fontSize={8} fill="#fff" textAnchor="middle" fontWeight={700}>{sl.label}</text>
        })}
      </g>
    </>
  )
}

function CherryViz({ isDark, revealed }: { isDark: boolean; revealed: boolean }) {
  const axisColor = isDark ? '#475569' : '#94a3b8'
  const redColor = '#f87171'
  const greenColor = '#34d399'
  // Misleading: show only months 6-8 (Jul, Aug, Sep) = values 72, 60, 55 (a "crash")
  const misleadingData = MONTHS_DATA.slice(6, 9)
  // Corrected: all 12 months
  const allData = MONTHS_DATA
  // Y-axis scales
  const misMin = 50, misMax = 80
  const allMin = 0, allMax = 100
  const misYForVal = (v: number) => 95 - ((v - misMin) / (misMax - misMin)) * 65
  const allYForVal = (v: number) => 95 - ((v - allMin) / (allMax - allMin)) * 65
  return (
    <>
      {/* Left: misleading — only 3 months */}
      <g>
        <text x={22} y={32} fontSize={6} fill={revealed ? redColor : axisColor} textAnchor="start">80</text>
        <text x={22} y={95} fontSize={6} fill={revealed ? redColor : axisColor} textAnchor="start">50</text>
        <line x1={20} y1={95} x2={130} y2={95} stroke={axisColor} strokeWidth={0.5} />
        {revealed && <text x={26} y={22} fontSize={7} fill={redColor} textAnchor="start" fontWeight={700}>✗ only 3 months</text>}
        {/* Line connecting points */}
        <polyline
          points={misleadingData.map((d, i) => {
            const x = 38 + i * 30
            const y = misYForVal(d.val)
            return x + ',' + y
          }).join(' ')}
          fill="none" stroke={redColor} strokeWidth={1.5} />
        {/* Points */}
        {misleadingData.map((d, i) => {
          const x = 38 + i * 30
          const y = misYForVal(d.val)
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={2.5} fill={redColor} />
              <text x={x} y={105} fontSize={7} fill={axisColor} textAnchor="middle">{d.label}</text>
              <text x={x} y={y - 4} fontSize={6} fill={revealed ? redColor : axisColor} textAnchor="middle" fontWeight={revealed ? 700 : 400}>{d.val}</text>
            </g>
          )
        })}
      </g>
      {/* Right: corrected — all 12 months */}
      <g>
        <text x={152} y={32} fontSize={6} fill={revealed ? greenColor : axisColor} textAnchor="start">100</text>
        <text x={152} y={64} fontSize={6} fill={revealed ? greenColor : axisColor} textAnchor="start">50</text>
        <text x={152} y={95} fontSize={6} fill={revealed ? greenColor : axisColor} textAnchor="start">0</text>
        <line x1={150} y1={95} x2={270} y2={95} stroke={axisColor} strokeWidth={0.5} />
        {revealed && <text x={156} y={22} fontSize={7} fill={greenColor} textAnchor="start" fontWeight={700}>✓ full year</text>}
        <polyline
          points={allData.map((d, i) => {
            const x = 156 + i * 9.5
            const y = allYForVal(d.val)
            return x.toFixed(1) + ',' + y.toFixed(1)
          }).join(' ')}
          fill="none" stroke={greenColor} strokeWidth={1.5} />
        {/* Highlight the misleading window */}
        {revealed && (
          <rect x={156 + 6 * 9.5 - 1} y={28} width={3 * 9.5 + 2} height={67}
            fill="none" stroke={redColor} strokeWidth={0.8} strokeDasharray="2 1" opacity={0.7} />
        )}
        {allData.map((d, i) => {
          const x = 156 + i * 9.5
          const y = allYForVal(d.val)
          return <circle key={i} cx={x} cy={y} r={1.8} fill={greenColor} />
        })}
      </g>
    </>
  )
}

export function MisleadingGraphsGallery({ isDark }: ToolProps) {
  const s = styles(isDark)
  const [technique, setTechnique] = useState<MisleadingTechnique>('truncated')
  const [revealed, setRevealed] = useState(false)

  const axisColor = isDark ? '#475569' : '#94a3b8'
  const redColor = '#f87171'
  const greenColor = '#34d399'

  useEffect(() => { setRevealed(false) }, [technique])

  const info = TECHNIQUES[technique]

  const step3Text = (() => {
    if (!revealed) return 'Compare the misleading graph (left) with the corrected version (right)'
    switch (technique) {
      case 'truncated': return 'The y-axis starts at ' + info.truncatedStart + ' instead of 0, making the difference look ' + info.amplified + '× bigger'
      case 'inconsistent': return 'Non-linear ticks (0, 10, 20, 50, 100) make values look more similar than they really are'
      case '3d': return '3D perspective distorts slice sizes — back slices look smaller, front slices look bigger'
      case 'cherry': return 'Showing only Jul-Sep reverses the true trend — the full year shows steady growth'
    }
  })()

  const step4Text = (() => {
    if (!revealed) return 'Both graphs show the SAME data — only the presentation differs'
    switch (technique) {
      case 'truncated': return 'Corrected: y-axis starts at 0, showing the true proportional difference'
      case 'inconsistent': return 'Corrected: linear scale shows true proportions (100 is 5× taller than 20)'
      case '3d': return 'Corrected: flat 2D pie shows true slice proportions (30/40/30)'
      case 'cherry': return 'Corrected: full 12-month timeline reveals the real upward trend (30 → 95)'
    }
  })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Technique selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {(['truncated', 'inconsistent', '3d', 'cherry'] as MisleadingTechnique[]).map(t => (
          <button key={t} onClick={() => setTechnique(t)} style={s.btn(technique === t)}>{TECHNIQUES[t].name}</button>
        ))}
      </div>

      {/* Description */}
      <div style={{ padding: '6px 8px', borderRadius: 6, background: s.bg, border: '1px solid ' + s.border, fontSize: 10, color: s.bright, lineHeight: 1.5 }}>
        {info.description}
      </div>

      {/* The two SVGs side by side */}
      <svg viewBox="0 0 280 110" style={{ width: '100%', borderRadius: 6, background: s.bg }}>
        {/* Divider */}
        <line x1={140} y1={5} x2={140} y2={105} stroke={axisColor} strokeWidth={0.5} strokeDasharray="2 2" />
        {/* Labels */}
        <text x={70} y={10} fontSize={8} fill={revealed ? redColor : axisColor} textAnchor="middle" fontWeight={700}>MISLEADING</text>
        <text x={210} y={10} fontSize={8} fill={revealed ? greenColor : axisColor} textAnchor="middle" fontWeight={700}>CORRECTED</text>
        {/* Technique-specific content */}
        {technique === 'truncated' && <TruncatedViz isDark={isDark} revealed={revealed} />}
        {technique === 'inconsistent' && <InconsistentViz isDark={isDark} revealed={revealed} />}
        {technique === '3d' && <ThreeDViz isDark={isDark} revealed={revealed} />}
        {technique === 'cherry' && <CherryViz isDark={isDark} revealed={revealed} />}
      </svg>

      {/* Reveal button */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setRevealed(p => !p)} style={{
          padding: '5px 14px', borderRadius: 5, fontSize: 11, fontWeight: 700,
          background: revealed ? 'rgba(248,113,113,0.15)' : 'rgba(5,150,105,0.15)',
          border: revealed ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(5,150,105,0.3)',
          color: revealed ? redColor : '#34d399',
          cursor: 'pointer',
        }}>{revealed ? 'Hide Problem' : 'Reveal Problem'}</button>
      </div>

      {/* How it works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Misleading technique: <b>{info.name}</b></div>
        <div>Step 2: {revealed ? 'Problem: ' + info.problem : 'Click "Reveal Problem" to see what\'s wrong'}</div>
        <div>Step 3: {step3Text}</div>
        <div>Step 4: {step4Text}</div>
        <div>Step 5: {revealed ? 'Always check: Does the y-axis start at 0? Is the scale consistent? Is the timeframe complete?' : 'Look for: truncated axes, 3D effects, non-linear scales, missing context'}</div>
        <div>Step 6: Data doesn\'t lie, but graphs CAN mislead — always read the axes and scale critically</div>
      </div>
      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Graphs are interpretations of data. Always check axes, scales, sample sizes, and timeframes before drawing conclusions. Critical thinking protects against misleading visuals.
      </div>
    </div>
  )
}
