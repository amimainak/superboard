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
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Pictograph title..." style={{ ...s.input, width: '100%' }} />
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
            <input value={cat.name} onChange={e => updateCat(i, 'name', e.target.value)} style={{ ...s.input, flex: 1 }} />
            <input type="number" value={cat.count} onChange={e => updateCat(i, 'count', e.target.value)} style={{ ...s.input, width: 50 }} />
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
        <input value={labels} onChange={e => setLabels(e.target.value)} placeholder="Labels (comma-separated)" style={{ ...s.input, width: '100%' }} />
        <input value={values} onChange={e => setValues(e.target.value)} placeholder="Values (comma-separated)" style={{ ...s.input, width: '100%' }} />
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
        <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Add value (0, 0.5, 1, 1.5...)" style={{ ...s.input, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') addValue() }} />
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
                <input value={cat.name} onChange={e => updateName(i, e.target.value)} style={{ ...s.input, flex: 1 }} />
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
            <input type="color" value={sec.color} onChange={e => updateSection(i, 'color', e.target.value)} style={{ width: 24, height: 24, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
            <input value={sec.label} onChange={e => updateSection(i, 'label', e.target.value)} style={{ ...s.input, flex: 1 }} />
            <input type="number" value={sec.size} onChange={e => updateSection(i, 'size', e.target.value)} style={{ ...s.input, width: 45 }} />
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
