'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'

// ============================================================
// Shared style helper
// ============================================================

const styles = (isDark: boolean) => ({
  bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
  text: isDark ? '#94a3b8' : '#475569',
  bright: isDark ? '#e2e8f0' : '#1e293b',
  input: {
    padding: '3px 6px',
    borderRadius: 4,
    fontSize: 11,
    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    color: isDark ? '#e2e8f0' : '#1e293b',
    outline: 'none' as const,
  },
  btn: (active: boolean) => ({
    padding: '2px 6px',
    borderRadius: 3,
    fontSize: 10,
    cursor: 'pointer' as const,
    background: active ? 'rgba(5,150,105,0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
    border: active ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
    color: active ? '#34d399' : (isDark ? '#94a3b8' : '#475569'),
  }),
})

// ============================================================
// 1. TimerStopwatch
// ============================================================

export function TimerStopwatch({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer')

  // Timer state
  const [timerMin, setTimerMin] = useState(5)
  const [timerSec, setTimerSec] = useState(0)
  const [timerTotalMs, setTimerTotalMs] = useState(300000)
  const [timerRemaining, setTimerRemaining] = useState(300000)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerDone, setTimerDone] = useState(false)
  const [flash, setFlash] = useState(false)

  // Stopwatch state
  const [swElapsed, setSwElapsed] = useState(0)
  const [swRunning, setSwRunning] = useState(false)
  const [laps, setLaps] = useState<number[]>([])
  const swStartRef = useRef(0)
  const swAccumRef = useRef(0)

  // Timer interval
  useEffect(() => {
    if (!timerRunning) return
    const iv = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 100) {
          setTimerRunning(false)
          setTimerDone(true)
          return 0
        }
        return prev - 100
      })
    }, 100)
    return () => clearInterval(iv)
  }, [timerRunning])

  // Flash effect on timer done
  useEffect(() => {
    if (!timerDone) { setFlash(false); return }
    const iv = setInterval(() => setFlash(f => !f), 500)
    return () => clearInterval(iv)
  }, [timerDone])

  // Stopwatch interval
  useEffect(() => {
    if (!swRunning) return
    const iv = setInterval(() => {
      setSwElapsed(Date.now() - swStartRef.current + swAccumRef.current)
    }, 30)
    return () => clearInterval(iv)
  }, [swRunning])

  const startTimer = () => {
    if (timerDone || timerRemaining === 0) {
      const total = (timerMin * 60 + timerSec) * 1000
      setTimerTotalMs(total)
      setTimerRemaining(total)
      setTimerDone(false)
    }
    setTimerRunning(true)
  }
  const pauseTimer = () => setTimerRunning(false)
  const resetTimer = () => {
    setTimerRunning(false)
    setTimerDone(false)
    const total = (timerMin * 60 + timerSec) * 1000
    setTimerTotalMs(total)
    setTimerRemaining(total)
  }

  const startStopwatch = () => {
    swStartRef.current = Date.now()
    setSwRunning(true)
  }
  const stopStopwatch = () => {
    swAccumRef.current = swElapsed
    setSwRunning(false)
  }
  const resetStopwatch = () => {
    setSwRunning(false)
    setSwElapsed(0)
    swAccumRef.current = 0
    setLaps([])
  }
  const addLap = () => {
    setLaps(prev => [swElapsed, ...prev].slice(0, 20))
  }

  // Format time
  const fmt = (ms: number) => {
    const totalSec = Math.floor(ms / 1000)
    const m = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    const cent = Math.floor((ms % 1000) / 10)
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0') + '.' + String(cent).padStart(2, '0')
  }

  // Timer SVG arc
  const timerFrac = timerTotalMs > 0 ? timerRemaining / timerTotalMs : 0
  const timerColor = timerRemaining > 30000 ? '#22c55e' : timerRemaining > 10000 ? '#eab308' : '#ef4444'
  const R = 70
  const C = 2 * Math.PI * R
  const dashOffset = C * (1 - timerFrac)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 4 }}>
        {(['timer', 'stopwatch'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={s.btn(mode === m)}>
            {m === 'timer' ? 'Timer' : 'Stopwatch'}
          </button>
        ))}
      </div>

      {mode === 'timer' ? (
        <>
          {/* SVG circle */}
          <div style={{ position: 'relative', width: 160, height: 160 }}>
            <svg width={160} height={160} viewBox={'0 0 160 160'}>
              {/* Background circle */}
              <circle cx={80} cy={80} r={R} fill={'none'} stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth={8} />
              {/* Progress arc */}
              <circle cx={80} cy={80} r={R} fill={'none'} stroke={timerColor} strokeWidth={8}
                strokeDasharray={C} strokeDashoffset={dashOffset}
                strokeLinecap={'round'} transform={'rotate(-90 80 80)'}
                style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s' }} />
              {/* Tick marks like clock */}
              {Array.from({ length: 12 }, (_, i) => {
                const angle = (i * 30 - 90) * Math.PI / 180
                const x1 = 80 + (R + 6) * Math.cos(angle)
                const y1 = 80 + (R + 6) * Math.sin(angle)
                const x2 = 80 + (R + 12) * Math.cos(angle)
                const y2 = 80 + (R + 12) * Math.sin(angle)
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={s.text} strokeWidth={i % 3 === 0 ? 2 : 1} opacity={0.4} />
              })}
            </svg>
            {/* Time display overlay */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: timerColor, fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>
                {fmt(timerRemaining)}
              </span>
            </div>
          </div>

          {/* Flash overlay */}
          {flash && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(239,68,68,0.08)', pointerEvents: 'none', zIndex: 9999 }} />
          )}

          {/* Input row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: s.text }}>Min</span>
            <input type="number" min={0} max={99} value={timerMin} onChange={e => { const v = Math.max(0, Math.min(99, Number(e.target.value) || 0)); setTimerMin(v); const total = (v * 60 + timerSec) * 1000; setTimerTotalMs(total); setTimerRemaining(total); setTimerDone(false) }}
              style={{ ...s.input, width: 42 }} />
            <span style={{ fontSize: 10, color: s.text }}>Sec</span>
            <input type="number" min={0} max={59} value={timerSec} onChange={e => { const v = Math.max(0, Math.min(59, Number(e.target.value) || 0)); setTimerSec(v); const total = (timerMin * 60 + v) * 1000; setTimerTotalMs(total); setTimerRemaining(total); setTimerDone(false) }}
              style={{ ...s.input, width: 42 }} />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 4 }}>
            {!timerRunning ? (
              <button onClick={startTimer} style={{ ...s.btn(false), padding: '4px 14px', fontSize: 11, fontWeight: 600, background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>Start</button>
            ) : (
              <button onClick={pauseTimer} style={{ ...s.btn(false), padding: '4px 14px', fontSize: 11, fontWeight: 600, background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', color: '#eab308' }}>Pause</button>
            )}
            <button onClick={resetTimer} style={{ ...s.btn(false), padding: '4px 14px', fontSize: 11 }}>Reset</button>
          </div>
        </>
      ) : (
        <>
          {/* Stopwatch display */}
          <div style={{ fontSize: 32, fontWeight: 700, color: s.bright, fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>
            {fmt(swElapsed)}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 4 }}>
            {!swRunning ? (
              <button onClick={startStopwatch} style={{ ...s.btn(false), padding: '4px 14px', fontSize: 11, fontWeight: 600, background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>Start</button>
            ) : (
              <button onClick={stopStopwatch} style={{ ...s.btn(false), padding: '4px 14px', fontSize: 11, fontWeight: 600, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>Stop</button>
            )}
            {swRunning && (
              <button onClick={addLap} style={{ ...s.btn(false), padding: '4px 14px', fontSize: 11, fontWeight: 600 }}>Lap</button>
            )}
            <button onClick={resetStopwatch} style={{ ...s.btn(false), padding: '4px 14px', fontSize: 11 }}>Reset</button>
          </div>

          {/* Laps */}
          {laps.length > 0 && (
            <div style={{ width: '100%', maxHeight: 120, overflowY: 'auto', borderRadius: 4, border: '1px solid ' + s.border }}>
              {laps.map((lap, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 6px', fontSize: 10, color: s.text, borderBottom: i < laps.length - 1 ? '1px solid ' + s.border : 'none' }}>
                  <span>Lap {laps.length - i}</span>
                  <span style={{ fontFamily: 'monospace' }}>{fmt(lap)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Mode: <b>{mode === 'timer' ? 'Timer' : 'Stopwatch'}</b></div>
          <div>Step 2: {mode === 'timer'
            ? <>Target: <b>{timerMin} min {timerSec} sec</b> ({fmt(timerTotalMs)})</>
            : <>Elapsed: <b style={{ color: '#34d399' }}>{fmt(swElapsed)}</b>{swRunning ? ' (running)' : ''}</>}</div>
          <div>Step 3: {mode === 'timer'
            ? <>Remaining: <b style={{ color: timerColor }}>{fmt(timerRemaining)}</b> ({(timerFrac * 100).toFixed(0)}%)</>
            : <>Laps: <b>{laps.length}</b>{laps.length > 0 ? ' — last: ' + fmt(laps[0]) : ''}</>}</div>
          <div>Step 4: Status: <b>{mode === 'timer'
            ? (timerDone ? 'Done!' : timerRunning ? 'Running' : 'Paused')
            : (swRunning ? 'Running' : 'Stopped')}</b></div>
          <div>Step 5: Pomodoro technique: 25 min focused work + 5 min break (conceptual)</div>
          <div>Step 6: After 4 cycles, take a longer break (15-30 min) (conceptual)</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Pomodoro: 25 min work, 5 min break. The brain can't sustain attention for long stretches — it needs recovery.
      </div>
</div>
  )
}

// ============================================================
// 2. InteractiveGraphingTool
// ============================================================

function linearRegression(xs: number[], ys: number[]) {
  const n = xs.length
  if (n < 2) return { slope: 0, intercept: 0, r: 0 }
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let Sxx = 0, Sxy = 0, Syy = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx
    const dy = ys[i] - my
    Sxx += dx * dx
    Sxy += dx * dy
    Syy += dy * dy
  }
  if (Sxx === 0) return { slope: 0, intercept: my, r: 0 }
  const slope = Sxy / Sxx
  const intercept = my - slope * mx
  const r = Syy === 0 ? 0 : Sxy / Math.sqrt(Sxx * Syy)
  return { slope, intercept, r }
}

function niceNum(range: number, round: boolean) {
  const exp = Math.floor(Math.log10(Math.max(range, 1e-10)))
  const frac = range / Math.pow(10, exp)
  let nice: number
  if (round) {
    if (frac < 1.5) nice = 1
    else if (frac < 3) nice = 2
    else if (frac < 7) nice = 5
    else nice = 10
  } else {
    if (frac <= 1) nice = 1
    else if (frac <= 2) nice = 2
    else if (frac <= 5) nice = 5
    else nice = 10
  }
  return nice * Math.pow(10, exp)
}

export function InteractiveGraphingTool({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [xInput, setXInput] = useState('1,2,3,4,5')
  const [yInput, setYInput] = useState('2,4,5,4,5')
  const [title, setTitle] = useState('')
  const [xLabel, setXLabel] = useState('')
  const [yLabel, setYLabel] = useState('')
  const [chartType, setChartType] = useState<'line' | 'scatter' | 'bar'>('scatter')
  const [showFit, setShowFit] = useState(false)

  const W = 280
  const H = 180
  const pad = { top: 24, right: 16, bottom: 32, left: 40 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom

  const parsed = useMemo(() => {
    const xs = xInput.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
    const ys = yInput.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
    const len = Math.min(xs.length, ys.length)
    return { xs: xs.slice(0, len), ys: ys.slice(0, len) }
  }, [xInput, yInput])

  const reg = useMemo(() => linearRegression(parsed.xs, parsed.ys), [parsed.xs, parsed.ys])

  const n = parsed.xs.length
  const xMin = n > 0 ? Math.min(...parsed.xs) : 0
  const xMax = n > 0 ? Math.max(...parsed.xs) : 10
  const yMin = n > 0 ? Math.min(...parsed.ys) : 0
  const yMax = n > 0 ? Math.max(...parsed.ys) : 10

  // Add padding to data range
  const xRange = xMax - xMin || 1
  const yRange = yMax - yMin || 1
  const xDataMin = xMin - xRange * 0.1
  const xDataMax = xMax + xRange * 0.1
  const yDataMin = yMin - yRange * 0.1
  const yDataMax = yMax + yRange * 0.1

  // Nice ticks
  const xTicks = useMemo(() => {
    const range = xDataMax - xDataMin
    const tickSpacing = niceNum(range / 5, true)
    const lo = Math.floor(xDataMin / tickSpacing) * tickSpacing
    const ticks: number[] = []
    for (let v = lo; v <= xDataMax + tickSpacing * 0.5; v += tickSpacing) {
      ticks.push(Math.round(v * 1e6) / 1e6)
    }
    return ticks.length >= 2 ? ticks : [xDataMin, xDataMax]
  }, [xDataMin, xDataMax])

  const yTicks = useMemo(() => {
    const range = yDataMax - yDataMin
    const tickSpacing = niceNum(range / 4, true)
    const lo = Math.floor(yDataMin / tickSpacing) * tickSpacing
    const ticks: number[] = []
    for (let v = lo; v <= yDataMax + tickSpacing * 0.5; v += tickSpacing) {
      ticks.push(Math.round(v * 1e6) / 1e6)
    }
    return ticks.length >= 2 ? ticks : [yDataMin, yDataMax]
  }, [yDataMin, yDataMax])

  const axXMin = xTicks[0]
  const axXMax = xTicks[xTicks.length - 1]
  const axYMin = yTicks[0]
  const axYMax = yTicks[yTicks.length - 1]
  const axXRange = axXMax - axXMin || 1
  const axYRange = axYMax - axYMin || 1

  const toSvgX = (v: number) => pad.left + ((v - axXMin) / axXRange) * plotW
  const toSvgY = (v: number) => pad.top + plotH - ((v - axYMin) / axYRange) * plotH

  const barColors = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#ec4899', '#14b8a6', '#f97316']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Inputs row */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <input placeholder="X values (comma-sep)" value={xInput} onChange={e => setXInput(e.target.value)} style={{ ...s.input, flex: '1 1 120px', minWidth: 100 }} />
        <input placeholder="Y values (comma-sep)" value={yInput} onChange={e => setYInput(e.target.value)} style={{ ...s.input, flex: '1 1 120px', minWidth: 100 }} />
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={{ ...s.input, flex: 1, minWidth: 70 }} />
        <input placeholder="X label" value={xLabel} onChange={e => setXLabel(e.target.value)} style={{ ...s.input, flex: 1, minWidth: 60 }} />
        <input placeholder="Y label" value={yLabel} onChange={e => setYLabel(e.target.value)} style={{ ...s.input, flex: 1, minWidth: 60 }} />
      </div>

      {/* Chart type toggle */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        {(['line', 'scatter', 'bar'] as const).map(t => (
          <button key={t} onClick={() => setChartType(t)} style={s.btn(chartType === t)}>
            {t === 'line' ? 'Line' : t === 'scatter' ? 'Scatter' : 'Bar'}
          </button>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: s.text, marginLeft: 'auto', cursor: 'pointer' }}>
          <input type="checkbox" checked={showFit} onChange={e => setShowFit(e.target.checked)} style={{ width: 12, height: 12, cursor: 'pointer' }} />
          Best Fit
        </label>
        <button onClick={() => { setXInput(''); setYInput(''); setTitle(''); setXLabel(''); setYLabel('') }} style={{ ...s.btn(false), color: '#ef4444' }}>Clear</button>
      </div>

      {/* SVG Plot */}
      <svg width={W} height={H} viewBox={'0 0 ' + W + ' ' + H} style={{ border: '1px solid ' + s.border, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
        {/* Grid lines */}
        {xTicks.map(t => (
          <line key={'gx' + t} x1={toSvgX(t)} y1={pad.top} x2={toSvgX(t)} y2={pad.top + plotH} stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth={0.5} />
        ))}
        {yTicks.map(t => (
          <line key={'gy' + t} x1={pad.left} y1={toSvgY(t)} x2={pad.left + plotW} y2={toSvgY(t)} stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth={0.5} />
        ))}

        {/* Axes */}
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + plotH} stroke={s.text} strokeWidth={1} />
        <line x1={pad.left} y1={pad.top + plotH} x2={pad.left + plotW} y2={pad.top + plotH} stroke={s.text} strokeWidth={1} />

        {/* X tick marks & labels */}
        {xTicks.map(t => (
          <g key={'tx' + t}>
            <line x1={toSvgX(t)} y1={pad.top + plotH} x2={toSvgX(t)} y2={pad.top + plotH + 4} stroke={s.text} strokeWidth={1} />
            <text x={toSvgX(t)} y={pad.top + plotH + 14} textAnchor={'middle'} fill={s.text} fontSize={8} fontFamily={'monospace'}>{Math.abs(t) < 0.001 && t !== 0 ? t.toExponential(0) : Number(t.toFixed(2))}</text>
          </g>
        ))}

        {/* Y tick marks & labels */}
        {yTicks.map(t => (
          <g key={'ty' + t}>
            <line x1={pad.left - 4} y1={toSvgY(t)} x2={pad.left} y2={toSvgY(t)} stroke={s.text} strokeWidth={1} />
            <text x={pad.left - 6} y={toSvgY(t) + 3} textAnchor={'end'} fill={s.text} fontSize={8} fontFamily={'monospace'}>{Math.abs(t) < 0.001 && t !== 0 ? t.toExponential(0) : Number(t.toFixed(2))}</text>
          </g>
        ))}

        {/* Title */}
        {title && <text x={W / 2} y={14} textAnchor={'middle'} fill={s.bright} fontSize={10} fontWeight={600}>{title}</text>}

        {/* X-axis label */}
        {xLabel && <text x={pad.left + plotW / 2} y={H - 2} textAnchor={'middle'} fill={s.text} fontSize={9}>{xLabel}</text>}

        {/* Y-axis label */}
        {yLabel && <text x={10} y={pad.top + plotH / 2} textAnchor={'middle'} fill={s.text} fontSize={9} transform={'rotate(-90 10 ' + (pad.top + plotH / 2) + ')'}>{yLabel}</text>}

        {/* Data */}
        {chartType === 'bar' && n > 0 && parsed.xs.map((x, i) => {
          const bw = Math.max(4, (plotW / n) * 0.6)
          const cx = toSvgX(x)
          const by = toSvgY(parsed.ys[i])
          const bh = pad.top + plotH - by
          return <rect key={i} x={cx - bw / 2} y={by} width={bw} height={bh} fill={barColors[i % barColors.length]} opacity={0.8} rx={2} />
        })}

        {chartType === 'line' && n > 0 && (
          <polyline
            fill={'none'}
            stroke={'#3b82f6'}
            strokeWidth={2}
            points={parsed.xs.map((x, i) => toSvgX(x) + ',' + toSvgY(parsed.ys[i])).join(' ')}
          />
        )}

        {chartType !== 'bar' && n > 0 && parsed.xs.map((x, i) => (
          <circle key={i} cx={toSvgX(x)} cy={toSvgY(parsed.ys[i])} r={chartType === 'scatter' ? 4 : 3.5} fill={'#3b82f6'} stroke={isDark ? '#1e293b' : '#ffffff'} strokeWidth={1.5} />
        ))}

        {/* Best fit line */}
        {showFit && n >= 2 && (
          <line
            x1={toSvgX(axXMin)}
            y1={toSvgY(reg.slope * axXMin + reg.intercept)}
            x2={toSvgX(axXMax)}
            y2={toSvgY(reg.slope * axXMax + reg.intercept)}
            stroke={'#ef4444'}
            strokeWidth={1.5}
            strokeDasharray={'6 3'}
          />
        )}
      </svg>

      {/* Best fit equation */}
      {showFit && n >= 2 && (
        <div style={{ fontSize: 10, color: s.text, fontFamily: 'monospace' }}>
          y = {reg.slope.toFixed(3)}x {reg.intercept >= 0 ? '+ ' : '- '}{Math.abs(reg.intercept).toFixed(3)} (r = {reg.r.toFixed(3)})
        </div>
      )}

      {/* Stats */}
      {n > 0 && (
        <div style={{ display: 'flex', gap: 8, fontSize: 9, color: s.text, flexWrap: 'wrap' }}>
          <span>Points: {n}</span>
          <span>X: [{xMin.toFixed(1)}, {xMax.toFixed(1)}]</span>
          <span>Y: [{yMin.toFixed(1)}, {yMax.toFixed(1)}]</span>
        </div>
      )}
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Chart type: <b>{chartType}</b> with <b>{n}</b> point{n !== 1 ? 's' : ''}{n === 0 ? ' (enter X,Y values above)' : ''}</div>
          <div>Step 2: X range: [{xMin.toFixed(1)}, {xMax.toFixed(1)}] · Y range: [{yMin.toFixed(1)}, {yMax.toFixed(1)}]</div>
          <div>Step 3: Pattern: <b>{n < 2 ? '?' : reg.r > 0.7 ? 'positive (up)' : reg.r < -0.7 ? 'negative (down)' : 'weak/no linear'}</b></div>
          <div>Step 4: {showFit && n >= 2
            ? <>Slope (m) = <b>{reg.slope.toFixed(3)}</b> (rise/run = Δy/Δx)</>
            : <>Slope = rise/run = Δy/Δx <i>(toggle Best Fit to compute)</i></>}</div>
          <div>Step 5: {showFit && n >= 2
            ? <>y-intercept (b) = <b>{reg.intercept.toFixed(3)}</b></>
            : <>y-intercept = where the line crosses the y-axis <i>(toggle Best Fit)</i></>}</div>
          <div>Step 6: {showFit && n >= 2
            ? <>Equation: <b style={{ color: '#34d399' }}>y = {reg.slope.toFixed(2)}x {reg.intercept >= 0 ? '+ ' : '− '}{Math.abs(reg.intercept).toFixed(2)}</b> (r = {reg.r.toFixed(3)})</>
            : <>Equation: y = mx + b (m = slope, b = intercept) <i>(need 2+ points + Best Fit)</i></>}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Straight line = constant rate. Curve = changing rate. Steeper slope = faster change. Graphs make relationships visible.
      </div>
</div>
  )
}

// ============================================================
// 3. RandomStudentPicker
// ============================================================

const GROUP_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16']

export function RandomStudentPicker({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [namesInput, setNamesInput] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [spinName, setSpinName] = useState('')
  const [groups, setGroups] = useState<string[][]>([])
  const [groupSize, setGroupSize] = useState(3)
  const [removePicked, setRemovePicked] = useState(false)
  const [pickedSet, setPickedSet] = useState<Set<string>>(new Set())
  const [history, setHistory] = useState<string[]>([])

  const allNames = useMemo(() =>
    namesInput.split('\n').map(n => n.trim()).filter(n => n.length > 0),
    [namesInput]
  )

  const available = useMemo(() =>
    removePicked ? allNames.filter(n => !pickedSet.has(n)) : allNames,
    [allNames, removePicked, pickedSet]
  )

  const pickOne = () => {
    if (available.length === 0) return
    setSpinning(true)
    let count = 0
    const totalSpins = 15
    const iv = setInterval(() => {
      const rnd = available[Math.floor(Math.random() * available.length)]
      setSpinName(rnd)
      count++
      if (count >= totalSpins) {
        clearInterval(iv)
        const finalPick = available[Math.floor(Math.random() * available.length)]
        setPicked(finalPick)
        setSpinName('')
        setSpinning(false)
        if (removePicked) {
          setPickedSet(prev => new Set(prev).add(finalPick))
        }
        setHistory(prev => [finalPick, ...prev].slice(0, 10))
      }
    }, 80)
  }

  const pickGroups = () => {
    const pool = [...allNames]
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp
    }
    const result: string[][] = []
    for (let i = 0; i < pool.length; i += groupSize) {
      result.push(pool.slice(i, i + groupSize))
    }
    setGroups(result)
  }

  const resetPicked = () => {
    setPickedSet(new Set())
    setPicked(null)
    setHistory([])
    setGroups([])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Names input */}
      <textarea
        placeholder={'Student names (one per line)'}
        value={namesInput}
        onChange={e => setNamesInput(e.target.value)}
        rows={4}
        style={{
          ...s.input,
          width: '100%',
          minHeight: 60,
          resize: 'vertical',
          fontFamily: 'inherit',
          lineHeight: 1.4,
        }}
      />

      {/* Pick 1 button */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={pickOne} disabled={available.length === 0} style={{
          ...s.btn(false), padding: '5px 14px', fontSize: 11, fontWeight: 600,
          background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399',
          opacity: available.length === 0 ? 0.4 : 1,
        }}>Pick 1</button>

        <span style={{ fontSize: 10, color: s.text }}>Group size:</span>
        <input type="number" min={2} max={20} value={groupSize} onChange={e => setGroupSize(Math.max(2, Math.min(20, Number(e.target.value) || 2)))}
          style={{ ...s.input, width: 36 }} />
        <button onClick={pickGroups} disabled={allNames.length < 2} style={{
          ...s.btn(false), padding: '5px 14px', fontSize: 11, fontWeight: 600,
          background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa',
          opacity: allNames.length < 2 ? 0.4 : 1,
        }}>Pick Group</button>

        <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: s.text, marginLeft: 'auto', cursor: 'pointer' }}>
          <input type="checkbox" checked={removePicked} onChange={e => setRemovePicked(e.target.checked)} style={{ width: 12, height: 12, cursor: 'pointer' }} />
          Remove Picked
        </label>
      </div>

      {/* Picked student display */}
      {(picked || spinning) && (
        <div style={{
          textAlign: 'center', padding: '10px', borderRadius: 6,
          background: isDark ? 'rgba(5,150,105,0.1)' : 'rgba(5,150,105,0.06)',
          border: '1px solid rgba(5,150,105,0.2)',
        }}>
          <span style={{
            fontSize: spinning ? 18 : 22, fontWeight: 700,
            color: spinning ? s.text : '#34d399',
            transition: 'color 0.2s',
            display: 'inline-block',
            animation: spinning ? 'spin-text 0.1s linear infinite' : 'none',
          }}>{spinning ? spinName : picked}</span>
        </div>
      )}

      {/* Remaining count */}
      {removePicked && allNames.length > 0 && (
        <div style={{ fontSize: 9, color: s.text, textAlign: 'right' }}>
          Remaining: {available.length}/{allNames.length}
        </div>
      )}

      {/* Groups display */}
      {groups.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {groups.map((g, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
              borderRadius: 4, background: GROUP_COLORS[i % GROUP_COLORS.length] + '15',
              border: '1px solid ' + GROUP_COLORS[i % GROUP_COLORS.length] + '30',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: GROUP_COLORS[i % GROUP_COLORS.length], minWidth: 16 }}>G{i + 1}</span>
              <span style={{ fontSize: 11, color: s.bright }}>{g.join(', ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: s.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recent Picks</span>
            <button onClick={resetPicked} style={{ ...s.btn(false), fontSize: 9, color: '#ef4444' }}>Reset</button>
          </div>
          {history.map((h, i) => (
            <div key={i} style={{ fontSize: 10, color: s.text, padding: '1px 4px', borderBottom: i < history.length - 1 ? '1px solid ' + s.border : 'none' }}>
              {i + 1}. {h}
            </div>
          ))}
        </div>
      )}
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Entered: <b>{allNames.length}</b> name{allNames.length !== 1 ? 's' : ''}{allNames.length === 0 ? ' (one per line above)' : ''}</div>
          <div>Step 2: {spinning
            ? <>Spinning... <b>{spinName}</b></>
            : picked
              ? <>Last picked: <b style={{ color: '#34d399' }}>{picked}</b></>
              : <>Click "Pick 1" to randomly select a student</>}</div>
          <div>Step 3: Available to pick: <b>{available.length}</b> / {allNames.length}{removePicked ? ' (remove-on-pick ON)' : ''}</div>
          <div>Step 4: {removePicked
            ? <>Already picked: <b>{pickedSet.size}</b> — these are excluded until reset</>
            : <>Remove-Picked is OFF — names can repeat (equal chance each draw)</>}</div>
          <div>Step 5: {groups.length > 0
            ? <>Groups: <b>{groups.length}</b> group{groups.length !== 1 ? 's' : ''} of ~{groupSize} ({groups.map(g => g.length).join('+')})</>
            : <>Groups: none yet (click "Pick Group" with group size = {groupSize})</>}</div>
          <div>Step 6: Recent picks: <b>{history.length > 0 ? history.slice(0, 3).join(', ') + (history.length > 3 ? ` … (+${history.length - 3} more)` : '') : 'none yet'}</b></div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Random calling ensures equitable participation. Students who rarely volunteer often have the best insights.
      </div>
</div>
  )
}

// ============================================================
// 4. GroupMaker — Random group generator with pair memory
// ============================================================

export function GroupMaker({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [namesInput, setNamesInput] = useState('Alice,Bob,Carol,Dan,Eve,Frank,Gina,Hugo,Iris,Jake')
  const [mode, setMode] = useState<'size' | 'count'>('size')
  const [target, setTarget] = useState(3)
  const [mixMode, setMixMode] = useState(false)
  const [keepMode, setKeepMode] = useState(false)
  const [groups, setGroups] = useState<string[][]>([])
  const [pairHistory, setPairHistory] = useState<Record<string, number>>({})
  const [genCount, setGenCount] = useState(0)
  const [lastScore, setLastScore] = useState(0)

  const allNames = useMemo(() =>
    namesInput.split(/[\n,]/).map(n => n.trim().replace(/^\*/, '')).filter(n => n.length > 0),
    [namesInput])

  const lockedNames = useMemo(() =>
    namesInput.split(/[\n,]/).map(n => n.trim()).filter(n => n.startsWith('*')).map(n => n.slice(1).trim()),
    [namesInput])

  const pairKey = (a: string, b: string) => [a, b].sort().join('|')

  const scoreArrangement = (arr: string[][], hist: Record<string, number>) => {
    let repeats = 0
    for (const g of arr) {
      for (let i = 0; i < g.length; i++) {
        for (let j = i + 1; j < g.length; j++) {
          repeats += hist[pairKey(g[i], g[j])] || 0
        }
      }
    }
    return repeats
  }

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const generate = () => {
    if (allNames.length === 0) return
    const numGroups = mode === 'count'
      ? Math.max(1, Math.min(10, target))
      : Math.ceil(allNames.length / Math.max(2, Math.min(6, target)))
    const attempts = mixMode ? 50 : 1
    let best: string[][] | null = null
    let bestScore = Infinity
    for (let a = 0; a < attempts; a++) {
      const pool = shuffle(allNames.filter(n => !lockedNames.includes(n)))
      const result: string[][] = Array.from({ length: numGroups }, () => [])
      for (let i = 0; i < lockedNames.length; i++) result[i % numGroups].push(lockedNames[i])
      for (const name of pool) {
        let minIdx = 0
        for (let j = 1; j < numGroups; j++) if (result[j].length < result[minIdx].length) minIdx = j
        result[minIdx].push(name)
      }
      const sc = scoreArrangement(result, pairHistory)
      if (sc < bestScore) { bestScore = sc; best = result }
    }
    if (best) {
      const newHist = { ...pairHistory }
      for (const g of best) {
        for (let i = 0; i < g.length; i++) {
          for (let j = i + 1; j < g.length; j++) {
            const k = pairKey(g[i], g[j])
            newHist[k] = (newHist[k] || 0) + 1
          }
        }
      }
      setPairHistory(newHist)
      setGroups(best)
      setGenCount(c => c + 1)
      setLastScore(bestScore)
    }
  }

  const resetHistory = () => {
    setPairHistory({})
    setGroups([])
    setGenCount(0)
    setLastScore(0)
  }

  const totalPairs = Object.values(pairHistory).reduce((a, b) => a + b, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <textarea
        placeholder={'Student names (comma or newline). Prefix * to lock.'}
        value={namesInput}
        onChange={e => setNamesInput(e.target.value)}
        rows={3}
        style={{ ...s.input, width: '100%', minHeight: 50, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.4 }}
      />
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setMode('size')} style={s.btn(mode === 'size')}>By Size</button>
        <button onClick={() => setMode('count')} style={s.btn(mode === 'count')}>By Count</button>
        <span style={{ fontSize: 10, color: s.text }}>{mode === 'size' ? 'Size' : 'Count'}</span>
        <input type="number" min={2} max={10} value={target} onChange={e => setTarget(Math.max(2, Math.min(10, Number(e.target.value) || 2)))} style={{ ...s.input, width: 36 }} />
        <button onClick={generate} disabled={allNames.length < 2} style={{ ...s.btn(false), padding: '4px 12px', fontSize: 11, fontWeight: 600, background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399', opacity: allNames.length < 2 ? 0.4 : 1 }}>Generate</button>
      </div>
      <div style={{ display: 'flex', gap: 8, fontSize: 10, color: s.text, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
          <input type="checkbox" checked={mixMode} onChange={e => setMixMode(e.target.checked)} style={{ width: 12, height: 12, cursor: 'pointer' }} />
          Mix (avoid repeats)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
          <input type="checkbox" checked={keepMode} onChange={e => setKeepMode(e.target.checked)} style={{ width: 12, height: 12, cursor: 'pointer' }} />
          Keep (* = locked)
        </label>
      </div>
      {groups.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {groups.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 4, background: GROUP_COLORS[i % GROUP_COLORS.length] + '15', border: '1px solid ' + GROUP_COLORS[i % GROUP_COLORS.length] + '30' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: GROUP_COLORS[i % GROUP_COLORS.length], minWidth: 18 }}>G{i + 1}</span>
              <span style={{ fontSize: 11, color: s.bright, flex: 1 }}>{g.join(', ')}</span>
              <span style={{ fontSize: 9, color: s.text }}>{g.length}</span>
            </div>
          ))}
        </div>
      )}
      {genCount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: s.text }}>
          <span>Runs: {genCount} · Pair memory: {totalPairs} · Last repeats: {lastScore}</span>
          <button onClick={resetHistory} style={{ ...s.btn(false), fontSize: 9, color: '#ef4444' }}>Reset</button>
        </div>
      )}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Roster: <b>{allNames.length}</b> student{allNames.length !== 1 ? 's' : ''}{keepMode && lockedNames.length > 0 ? <> ({lockedNames.length} locked)</> : null}</div>
        <div>Step 2: Mode: <b>{mode === 'size' ? 'By Size' : 'By Count'}</b> → target <b>{target}</b> {mode === 'size' ? 'per group' : 'groups'}</div>
        <div>Step 3: {mixMode ? <>Mix ON — tried 50 shuffles, kept the one with <b>{lastScore}</b> repeat pair{lastScore !== 1 ? 's' : ''}</> : <>Mix OFF — single random shuffle</>}</div>
        <div>Step 4: {keepMode ? <>Keep ON — <b>{lockedNames.length}</b> locked student{lockedNames.length !== 1 ? 's' : ''} anchored first</> : <>Keep OFF — all students freely redistributed</>}</div>
        <div>Step 5: {groups.length > 0 ? <>Last result: <b>{groups.length}</b> group{groups.length !== 1 ? 's' : ''} → [{groups.map(g => g.length).join(', ')}]</> : <>Click "Generate" to form groups</>}</div>
        <div>Step 6: Pair memory: <b>{totalPairs}</b> pairing{totalPairs !== 1 ? 's' : ''} tracked across <b>{genCount}</b> run{genCount !== 1 ? 's' : ''}</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Heterogeneous grouping broadens perspectives. Tracking pairs over time prevents the same students from always working together.
      </div>
    </div>
  )
}

// ============================================================
// 5. ExitTicket — Quick-check with 5-finger or text mode
// ============================================================

const EXIT_PRESETS = [
  'What did you learn today?',
  'What was confusing?',
  'Rate your understanding 1-5',
  'What question do you still have?',
  'How could you apply this?',
]

const FINGER_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']

export function ExitTicket({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [question, setQuestion] = useState(EXIT_PRESETS[0])
  const [mode, setMode] = useState<'fingers' | 'text'>('fingers')
  const [tally, setTally] = useState<number[]>([0, 0, 0, 0, 0])
  const [responses, setResponses] = useState<string[]>([])
  const [respInput, setRespInput] = useState('')

  const addFinger = (n: number) => setTally(prev => { const next = [...prev]; next[n - 1]++; return next })
  const addResponse = () => {
    if (respInput.trim()) {
      setResponses(prev => [...prev, respInput.trim()])
      setRespInput('')
    }
  }
  const reset = () => { setTally([0, 0, 0, 0, 0]); setResponses([]) }

  const total = tally.reduce((a, b) => a + b, 0)
  const max = Math.max(...tally, 1)
  const sum = tally.reduce((a, b, i) => a + b * (i + 1), 0)
  const avg = total > 0 ? (sum / total).toFixed(1) : '—'
  const modeIdx = total > 0 ? tally.indexOf(Math.max(...tally)) : -1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <select value={question} onChange={e => setQuestion(e.target.value)} style={{ ...s.input, width: '100%' }}>
        {EXIT_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => setMode('fingers')} style={s.btn(mode === 'fingers')}>5-Finger</button>
        <button onClick={() => setMode('text')} style={s.btn(mode === 'text')}>Text</button>
        <button onClick={reset} style={{ ...s.btn(false), color: '#ef4444', marginLeft: 'auto' }}>Reset</button>
      </div>

      {mode === 'fingers' ? (
        <>
          <svg width={280} height={130} viewBox="0 0 280 130">
            {[0, 1, 2, 3, 4].map(i => {
              const barH = (tally[i] / max) * 80
              const x = 20 + i * 52
              const y = 95 - barH
              return (
                <g key={i}>
                  <rect x={x} y={15} width={40} height={80} fill={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} rx={2} />
                  <rect x={x} y={y} width={40} height={barH} fill={FINGER_COLORS[i]} rx={2} />
                  <text x={x + 20} y={11} textAnchor="middle" fill={s.bright} fontSize={11} fontWeight={700}>{tally[i]}</text>
                  <text x={x + 20} y={110} textAnchor="middle" fill={s.text} fontSize={10} fontWeight={600}>{i + 1}</text>
                </g>
              )
            })}
            <text x={140} y={126} textAnchor="middle" fill={s.text} fontSize={8}>Finger count (1=lost → 5=got it)</text>
          </svg>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => addFinger(n)} style={{ ...s.btn(false), padding: '4px 10px', fontSize: 11, fontWeight: 600, background: FINGER_COLORS[n - 1] + '15', border: '1px solid ' + FINGER_COLORS[n - 1] + '40', color: FINGER_COLORS[n - 1] }}>+{n}</button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 4 }}>
            <input placeholder="Type a student response..." value={respInput} onChange={e => setRespInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addResponse() }} style={{ ...s.input, flex: 1 }} />
            <button onClick={addResponse} style={{ ...s.btn(false), padding: '4px 10px' }}>Add</button>
          </div>
          <div style={{ maxHeight: 120, overflowY: 'auto', borderRadius: 4, border: '1px solid ' + s.border }}>
            {responses.length === 0 ? (
              <div style={{ padding: 8, fontSize: 10, color: s.text, textAlign: 'center' }}>No responses yet. Type one above.</div>
            ) : responses.map((r, i) => (
              <div key={i} style={{ padding: '4px 8px', fontSize: 10, color: s.bright, borderBottom: i < responses.length - 1 ? '1px solid ' + s.border : 'none' }}>
                <span style={{ color: s.text, marginRight: 4 }}>{i + 1}.</span>{r}
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: s.text }}>
        <span>{mode === 'fingers' ? `Responses: ${total} · Avg: ${avg}` : `Responses: ${responses.length}`}</span>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Question: "<b>{question}</b>"</div>
        <div>Step 2: Mode: <b>{mode === 'fingers' ? '5-Finger Check' : 'Text Responses'}</b></div>
        <div>Step 3: {mode === 'fingers'
          ? <>Tally: [{tally.join(', ')}] for fingers 1-5 (1=lost, 5=got it)</>
          : <>Collected: <b>{responses.length}</b> written response{responses.length !== 1 ? 's' : ''}</>}</div>
        <div>Step 4: {mode === 'fingers'
          ? (total > 0
            ? <>Average: <b style={{ color: '#34d399' }}>{avg}</b> · Mode: <b>{modeIdx + 1}</b> finger{modeIdx !== 0 ? 's' : ''}</>
            : <>Click +1 through +5 to tally each student's self-rating</>)
          : <>Type each student's response and press Enter to log it</>}</div>
        <div>Step 5: {mode === 'fingers' && total > 0
          ? <>Distribution: {tally.map((c, i) => c > 0 ? <span key={i}>{i + 1}→{c} </span> : null)} · {total} total</>
          : <>Use data to plan reteaching: low ratings → review; high → extend</>}</div>
        <div>Step 6: Pattern check: {mode === 'fingers' && total > 0
          ? (Number(avg) >= 4 ? 'most students got it — move on' : Number(avg) <= 2 ? 'reteach needed' : 'mixed — small-group reteach')
          : 'scan responses for common confusions'}</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Exit tickets close the loop. A 30-second check beats discovering misconceptions on the unit test.
      </div>
    </div>
  )
}

// ============================================================
// 6. PomodoroTimer — 25/5 cycle with long break after 4
// ============================================================

const POM_PHASES = {
  work: { label: 'Work', color: '#ef4444', icon: '⏱' },
  break: { label: 'Break', color: '#22c55e', icon: '☕' },
  longbreak: { label: 'Long Break', color: '#3b82f6', icon: '🌟' },
} as const

export function PomodoroTimer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [phase, setPhase] = useState<'work' | 'break' | 'longbreak'>('work')
  const [cycle, setCycle] = useState(1)
  const [longMin, setLongMin] = useState(15)
  const [remaining, setRemaining] = useState(25 * 60 * 1000)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [completedCycles, setCompletedCycles] = useState(0)

  const phaseDur = phase === 'work' ? 25 * 60 * 1000 : phase === 'break' ? 5 * 60 * 1000 : longMin * 60 * 1000

  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 100))
    }, 100)
    return () => clearInterval(iv)
  }, [running])

  useEffect(() => {
    if (remaining > 0 || !running) return
    if (phase === 'work') {
      setCompletedCycles(c => c + 1)
      if (cycle >= 4) {
        setPhase('longbreak')
        setRemaining(longMin * 60 * 1000)
      } else {
        setPhase('break')
        setRemaining(5 * 60 * 1000)
      }
    } else if (phase === 'break') {
      setPhase('work')
      setCycle(c => c + 1)
      setRemaining(25 * 60 * 1000)
    } else {
      setPhase('work')
      setCycle(1)
      setRemaining(25 * 60 * 1000)
      setDone(true)
      setRunning(false)
    }
  }, [remaining, running, phase, cycle, longMin])

  const start = () => {
    if (done) { setDone(false); setCycle(1); setPhase('work'); setRemaining(25 * 60 * 1000); setCompletedCycles(0) }
    setRunning(true)
  }
  const pause = () => setRunning(false)
  const reset = () => {
    setRunning(false); setDone(false); setPhase('work'); setCycle(1)
    setRemaining(25 * 60 * 1000); setCompletedCycles(0)
  }
  const skip = () => setRemaining(0)

  const fmt = (ms: number) => {
    const tot = Math.ceil(ms / 1000)
    const m = Math.floor(tot / 60)
    const sec = tot % 60
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0')
  }

  const cur = POM_PHASES[phase]
  const R = 60, C = 2 * Math.PI * R
  const frac = phaseDur > 0 ? remaining / phaseDur : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4].map(c => (
          <div key={c} style={{
            width: 10, height: 10, borderRadius: '50%',
            background: c <= completedCycles ? '#22c55e' : 'transparent',
            border: '1px solid ' + (c <= completedCycles ? '#22c55e' : c === cycle ? cur.color : s.text),
          }} />
        ))}
      </div>

      <div style={{ position: 'relative', width: 150, height: 150 }}>
        <svg width={150} height={150} viewBox="0 0 150 150">
          <circle cx={75} cy={75} r={R} fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth={6} />
          <circle cx={75} cy={75} r={R} fill="none" stroke={cur.color} strokeWidth={6}
            strokeDasharray={C} strokeDashoffset={C * (1 - frac)}
            strokeLinecap="round" transform="rotate(-90 75 75)"
            style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, color: s.text }}>{cur.icon} {cur.label}</span>
          <span style={{ fontSize: 26, fontWeight: 700, color: cur.color, fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>{fmt(remaining)}</span>
          <span style={{ fontSize: 9, color: s.text }}>{phase === 'longbreak' ? 'Long Break' : `Cycle ${cycle}/4`}</span>
        </div>
      </div>

      {done && (
        <div style={{ padding: '4px 10px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#34d399', fontSize: 11, fontWeight: 600 }}>
          🎉 4 cycles complete! Great focus session.
        </div>
      )}

      <div style={{ display: 'flex', gap: 4 }}>
        {!running ? (
          <button onClick={start} style={{ ...s.btn(false), padding: '4px 14px', fontSize: 11, fontWeight: 600, background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>Start</button>
        ) : (
          <button onClick={pause} style={{ ...s.btn(false), padding: '4px 14px', fontSize: 11, fontWeight: 600, background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', color: '#eab308' }}>Pause</button>
        )}
        <button onClick={skip} style={{ ...s.btn(false), padding: '4px 10px', fontSize: 10 }}>Skip</button>
        <button onClick={reset} style={{ ...s.btn(false), padding: '4px 10px', fontSize: 10 }}>Reset</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 10, color: s.text }}>Long break:</span>
        {[15, 20, 25, 30].map(m => (
          <button key={m} onClick={() => { setLongMin(m); if (phase === 'longbreak' && !running) setRemaining(m * 60 * 1000) }} style={s.btn(longMin === m)}>{m}m</button>
        ))}
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b', width: '100%' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Phase: <b style={{ color: cur.color }}>{cur.icon} {cur.label}</b> · Cycle <b>{cycle}</b>/4</div>
        <div>Step 2: Duration: <b>{phase === 'work' ? 25 : phase === 'break' ? 5 : longMin}</b> min · Remaining: <b style={{ color: cur.color }}>{fmt(remaining)}</b></div>
        <div>Step 3: Progress: <b>{((1 - frac) * 100).toFixed(0)}%</b> complete · Status: <b>{running ? 'Running' : done ? 'Done' : 'Paused'}</b></div>
        <div>Step 4: {phase === 'work'
          ? <>Working → next: {cycle >= 4 ? <b>Long Break ({longMin}m)</b> : <b>Short Break (5m)</b>}</>
          : phase === 'break'
            ? <>Resting → next: <b>Work Cycle {cycle + 1}</b></>
            : <>Long rest → next: <b>Work Cycle 1</b> (session resets)</>}</div>
        <div>Step 5: Cycles completed this session: <b>{completedCycles}</b> · Total focus time: <b>{completedCycles * 25}</b> min</div>
        <div>Step 6: Rule: 4 short cycles (25/5) → 1 long break ({longMin} min) → repeat</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa', width: '100%' }}>
        💡 <b>Insight:</b> Sustained attention fatigues. Short focused sprints with breaks keep the brain fresh and motivation high.
      </div>
    </div>
  )
}

// ============================================================
// 7. VoiceLevelMeter — Visual noise-level expectation
// ============================================================

const VOICE_LEVELS = [
  { level: 0, label: 'Silence', color: '#6366f1', desc: 'No talking. Independent work.', icon: '🔇' },
  { level: 1, label: 'Whisper', color: '#3b82f6', desc: 'Only your partner hears you.', icon: '🤫' },
  { level: 2, label: 'Partner Talk', color: '#22c55e', desc: 'Voice for partner discussion.', icon: '👥' },
  { level: 3, label: 'Group Talk', color: '#eab308', desc: 'Voice for a small group.', icon: '🗣' },
  { level: 4, label: 'Presentation', color: '#ef4444', desc: 'Project to the whole room.', icon: '📢' },
]

export function VoiceLevelMeter({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [level, setLevel] = useState(2)
  const [timerMin, setTimerMin] = useState(5)
  const [remaining, setRemaining] = useState(5 * 60 * 1000)
  const [running, setRunning] = useState(false)

  const cur = VOICE_LEVELS[level]

  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 1000))
    }, 1000)
    return () => clearInterval(iv)
  }, [running])

  useEffect(() => {
    if (remaining === 0 && running) setRunning(false)
  }, [remaining, running])

  const startTimer = () => {
    if (remaining === 0) setRemaining(timerMin * 60 * 1000)
    setRunning(true)
  }
  const setTimer = (m: number) => {
    setTimerMin(m)
    setRemaining(m * 60 * 1000)
    setRunning(false)
  }

  const fmt = (ms: number) => {
    const tot = Math.ceil(ms / 1000)
    const m = Math.floor(tot / 60)
    const sec = tot % 60
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        padding: 10, borderRadius: 6, textAlign: 'center',
        background: cur.color + '15', border: '2px solid ' + cur.color,
      }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: cur.color, lineHeight: 1 }}>{cur.icon} {level}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: s.bright, marginTop: 2 }}>{cur.label}</div>
        <div style={{ fontSize: 10, color: s.text, marginTop: 2 }}>{cur.desc}</div>
      </div>

      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 60 }}>
        {VOICE_LEVELS.map(l => {
          const h = 20 + l.level * 8
          const active = l.level === level
          return (
            <button key={l.level} onClick={() => setLevel(l.level)} style={{
              flex: 1, height: h, borderRadius: 3, cursor: 'pointer',
              background: active ? l.color : l.color + '20',
              border: '1px solid ' + (active ? l.color : l.color + '40'),
              color: active ? '#fff' : l.color, fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'inherit',
            }}>{l.level}</button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: s.text }}>⏱</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: running ? cur.color : s.bright, fontFamily: 'monospace', minWidth: 40 }}>{fmt(remaining)}</span>
        {!running ? (
          <button onClick={startTimer} style={{ ...s.btn(false), padding: '3px 8px', fontSize: 10, background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>Start</button>
        ) : (
          <button onClick={() => setRunning(false)} style={{ ...s.btn(false), padding: '3px 8px', fontSize: 10, background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', color: '#eab308' }}>Pause</button>
        )}
        {[2, 5, 10, 15].map(m => (
          <button key={m} onClick={() => setTimer(m)} style={s.btn(timerMin === m)}>{m}m</button>
        ))}
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Current level: <b style={{ color: cur.color }}>{cur.icon} {level} — {cur.label}</b></div>
        <div>Step 2: Expectation: "<b>{cur.desc}</b>"</div>
        <div>Step 3: Scale: 0=Silent → 1=Whisper → 2=Partner → 3=Group → 4=Presentation</div>
        <div>Step 4: Timer: <b>{timerMin}</b> min · Remaining: <b style={{ color: running ? cur.color : s.bright }}>{fmt(remaining)}</b> · {running ? 'Running' : 'Paused'}</div>
        <div>Step 5: Click any level button (0-4) to change the expectation instantly</div>
        <div>Step 6: Set a duration to signal how long this voice level should be maintained</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Visual noise targets beat "quiet down!" Students self-regulate when the expectation is concrete and visible.
      </div>
    </div>
  )
}

// ============================================================
// 8. TokenBoard — Reward tracker with celebration
// ============================================================

const Star = ({ filled, size, color }: { filled: boolean; size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <polygon points="12,2 14.9,8.6 22,9.3 16.5,14.1 18.2,21 12,17.3 5.8,21 7.5,14.1 2,9.3 9.1,8.6"
      fill={filled ? color : 'none'} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
  </svg>
)

export function TokenBoard({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [goal, setGoal] = useState(5)
  const [tokens, setTokens] = useState(0)
  const [taskGoal, setTaskGoal] = useState('Complete 5 problems')
  const [reward, setReward] = useState('Choose a sticker')
  const [celebrate, setCelebrate] = useState(false)
  const [pulse, setPulse] = useState(false)
  const [earnedHistory, setEarnedHistory] = useState(0)

  useEffect(() => {
    if (!celebrate) return
    const iv = setInterval(() => setPulse(p => !p), 300)
    const stop = setTimeout(() => setCelebrate(false), 5000)
    return () => { clearInterval(iv); clearTimeout(stop) }
  }, [celebrate])

  const addToken = () => {
    setTokens(prev => {
      const next = Math.min(goal, prev + 1)
      if (next === goal && prev < goal) {
        setCelebrate(true)
        setEarnedHistory(h => h + 1)
      }
      return next
    })
  }
  const removeToken = () => setTokens(prev => Math.max(0, prev - 1))
  const reset = () => { setTokens(0); setCelebrate(false) }
  const changeGoal = (g: number) => { setGoal(g); setTokens(0); setCelebrate(false) }

  const color = '#fbbf24'
  const isFull = tokens >= goal
  const perRow = goal <= 5 ? goal : 5

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
      {celebrate && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 6, zIndex: 5, pointerEvents: 'none',
          background: 'rgba(251,191,36,0.15)', border: '2px solid #fbbf24',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: pulse ? 'scale(1.02)' : 'scale(0.98)', transition: 'transform 0.2s',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>🎉</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24' }}>GOAL!</div>
            <div style={{ fontSize: 10, color: s.bright }}>{reward}</div>
          </div>
        </div>
      )}

      <input placeholder="Goal (e.g., Complete 5 problems)" value={taskGoal} onChange={e => setTaskGoal(e.target.value)} style={{ ...s.input, width: '100%' }} />
      <input placeholder="Reward when full" value={reward} onChange={e => setReward(e.target.value)} style={{ ...s.input, width: '100%' }} />

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: s.text }}>Tokens:</span>
        {[3, 5, 10].map(g => (
          <button key={g} onClick={() => changeGoal(g)} style={s.btn(goal === g)}>{g}</button>
        ))}
        <span style={{ fontSize: 10, color: s.text, marginLeft: 'auto' }}>{tokens} / {goal}</span>
      </div>

      <div style={{
        padding: 10, borderRadius: 6,
        background: isDark ? 'rgba(251,191,36,0.05)' : 'rgba(251,191,36,0.04)',
        border: '1px solid ' + (isFull ? '#fbbf24' : s.border),
        display: 'grid', gridTemplateColumns: `repeat(${perRow}, 1fr)`, gap: 6, justifyContent: 'center',
      }}>
        {Array.from({ length: goal }, (_, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
            <Star filled={i < tokens} size={36} color={color} />
          </div>
        ))}
      </div>

      <div style={{ height: 6, borderRadius: 3, background: s.bg, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(tokens / goal) * 100}%`, background: color, transition: 'width 0.3s' }} />
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={addToken} disabled={isFull} style={{ ...s.btn(false), flex: 1, padding: '5px', fontSize: 11, fontWeight: 600, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', opacity: isFull ? 0.4 : 1, cursor: isFull ? 'default' : 'pointer' }}>+ Token ★</button>
        <button onClick={removeToken} style={{ ...s.btn(false), padding: '5px 10px' }}>− Undo</button>
        <button onClick={reset} style={{ ...s.btn(false), padding: '5px 10px', color: '#ef4444' }}>Reset</button>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Goal: "<b>{taskGoal}</b>" → Reward: "<b>{reward}</b>"</div>
        <div>Step 2: Token target: <b>{goal}</b> · Earned: <b style={{ color: '#fbbf24' }}>{tokens}</b> · Remaining: <b>{goal - tokens}</b></div>
        <div>Step 3: Progress: <b>{((tokens / goal) * 100).toFixed(0)}%</b> {isFull ? '✓ COMPLETE' : ''}</div>
        <div>Step 4: {isFull
          ? <>Board full! Celebrate, deliver reward, then Reset to start a new cycle.</>
          : <>Click "+ Token ★" each time the student meets the goal criterion.</>}</div>
        <div>Step 5: Boards earned this session: <b>{earnedHistory}</b></div>
        <div>Step 6: Small, frequent tokens beat rare big rewards — especially for younger or SPED learners</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Visible progress + predictable reward = motivation. Token boards make abstract expectations concrete.
      </div>
    </div>
  )
}

// ============================================================
// 9. QuickPoll — Live MC poll with reveal-correct mode
// ============================================================

const POLL_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444']

export function QuickPoll({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [question, setQuestion] = useState('Best way to start class?')
  const [options, setOptions] = useState<string[]>(['Bellringer', 'Review game', 'Direct teach'])
  const [optInput, setOptInput] = useState('')
  const [votes, setVotes] = useState<number[]>([0, 0, 0])
  const [correctIdx, setCorrectIdx] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const addOption = () => {
    if (optInput.trim() && options.length < 4) {
      setOptions(prev => [...prev, optInput.trim()])
      setVotes(prev => [...prev, 0])
      setOptInput('')
    }
  }
  const removeOption = (i: number) => {
    if (options.length <= 2) return
    setOptions(prev => prev.filter((_, idx) => idx !== i))
    setVotes(prev => prev.filter((_, idx) => idx !== i))
    if (correctIdx === i) setCorrectIdx(null)
    else if (correctIdx !== null && correctIdx > i) setCorrectIdx(correctIdx - 1)
  }
  const vote = (i: number) => setVotes(prev => { const next = [...prev]; next[i]++; return next })
  const reset = () => { setVotes(options.map(() => 0)); setRevealed(false) }

  const total = votes.reduce((a, b) => a + b, 0)
  const maxV = Math.max(...votes, 1)
  const leadingIdx = total > 0 ? votes.indexOf(Math.max(...votes)) : -1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input placeholder="Poll question..." value={question} onChange={e => setQuestion(e.target.value)} style={{ ...s.input, width: '100%', fontWeight: 600 }} />

      <div style={{ display: 'flex', gap: 4 }}>
        <input placeholder="Add option (max 4)..." value={optInput} onChange={e => setOptInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addOption() }} style={{ ...s.input, flex: 1 }} />
        <button onClick={addOption} disabled={options.length >= 4} style={{ ...s.btn(false), opacity: options.length >= 4 ? 0.4 : 1 }}>+ Add</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {options.map((opt, i) => {
          const pct = total > 0 ? (votes[i] / total) * 100 : 0
          const barW = maxV > 0 ? (votes[i] / maxV) * 100 : 0
          const isCorrect = revealed && correctIdx === i
          return (
            <div key={i} style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', border: '1px solid ' + s.border }}>
              <div style={{ position: 'absolute', inset: 0, background: POLL_COLORS[i] + (isCorrect ? '30' : '15'), width: barW + '%', transition: 'width 0.3s' }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '4px 6px', gap: 4 }}>
                <button onClick={() => vote(i)} style={{
                  flex: 1, textAlign: 'left', cursor: 'pointer', background: 'transparent', border: 'none',
                  color: s.bright, fontSize: 11, fontWeight: 600, padding: 0, fontFamily: 'inherit',
                }}>
                  {isCorrect && '✓ '}{opt}
                </button>
                <span style={{ fontSize: 10, color: s.text, minWidth: 40, textAlign: 'right' }}>{votes[i]} · {pct.toFixed(0)}%</span>
                <button onClick={() => removeOption(i)} style={{ ...s.btn(false), padding: '1px 4px', fontSize: 9, color: '#ef4444' }}>✗</button>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: s.text }}>Correct:</span>
        <button onClick={() => setCorrectIdx(null)} style={s.btn(correctIdx === null)}>None</button>
        {options.map((_, i) => (
          <button key={i} onClick={() => setCorrectIdx(i)} style={s.btn(correctIdx === i)}>{String.fromCharCode(65 + i)}</button>
        ))}
        <button onClick={() => setRevealed(r => !r)} style={{ ...s.btn(revealed), marginLeft: 'auto' }}>{revealed ? 'Hide' : 'Reveal'}</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: s.text }}>
        <span>Total responses: {total}</span>
        <button onClick={reset} style={{ ...s.btn(false), fontSize: 9, color: '#ef4444' }}>Reset Votes</button>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Question: "<b>{question}</b>"</div>
        <div>Step 2: Options: <b>{options.length}</b> ({options.map((_, i) => String.fromCharCode(65 + i)).join(', ')})</div>
        <div>Step 3: Votes: [{votes.join(', ')}] · Total: <b>{total}</b></div>
        <div>Step 4: {total > 0 && leadingIdx >= 0
          ? <>Leading: <b style={{ color: POLL_COLORS[leadingIdx] }}>{options[leadingIdx]}</b> ({((votes[leadingIdx] / total) * 100).toFixed(0)}%)</>
          : <>Click an option to tally a student response</>}</div>
        <div>Step 5: {revealed && correctIdx !== null
          ? <>Correct answer revealed: <b style={{ color: '#34d399' }}>{options[correctIdx]}</b></>
          : correctIdx !== null
            ? <>Correct answer set (hidden) — click "Reveal" to show</>
            : <>No correct answer set (poll mode, not quiz mode)</>}</div>
        <div>Step 6: Use for quick formative checks or review games — instant visual feedback</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Live polls surface misconceptions in real time. Anonymous voting gets truer answers than raised hands.
      </div>
    </div>
  )
}

// ============================================================
// 10. ThinkPairShareTimer — Structured discussion protocol
// ============================================================

const TPS_PHASES = [
  { key: 'think', label: 'Think', color: '#3b82f6', icon: '🧠', min: 1, max: 3, defaultMin: 2, instruction: 'Silent individual thinking. Jot ideas in your notes.' },
  { key: 'pair', label: 'Pair', color: '#22c55e', icon: '👥', min: 2, max: 5, defaultMin: 3, instruction: 'Discuss with your partner. Both partners share.' },
  { key: 'share', label: 'Share', color: '#eab308', icon: '🗣', min: 3, max: 5, defaultMin: 4, instruction: 'Volunteer pairs share with the whole class.' },
] as const

export function ThinkPairShareTimer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [durations, setDurations] = useState<number[]>(TPS_PHASES.map(p => p.defaultMin))
  const [remaining, setRemaining] = useState(TPS_PHASES[0].defaultMin * 60 * 1000)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const phase = TPS_PHASES[phaseIdx]
  const phaseDur = durations[phaseIdx] * 60 * 1000

  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 100))
    }, 100)
    return () => clearInterval(iv)
  }, [running])

  useEffect(() => {
    if (remaining > 0 || !running) return
    if (phaseIdx < TPS_PHASES.length - 1) {
      const next = phaseIdx + 1
      setPhaseIdx(next)
      setRemaining(durations[next] * 60 * 1000)
    } else {
      setRunning(false)
      setDone(true)
    }
  }, [remaining, running, phaseIdx, durations])

  const start = () => {
    if (done) {
      setDone(false); setPhaseIdx(0); setRemaining(durations[0] * 60 * 1000)
    }
    setRunning(true)
  }
  const pause = () => setRunning(false)
  const reset = () => {
    setRunning(false); setDone(false); setPhaseIdx(0); setRemaining(durations[0] * 60 * 1000)
  }
  const skip = () => setRemaining(0)
  const setDur = (i: number, m: number) => {
    setDurations(prev => { const next = [...prev]; next[i] = m; return next })
    if (i === phaseIdx) setRemaining(m * 60 * 1000)
  }

  const fmt = (ms: number) => {
    const tot = Math.ceil(ms / 1000)
    const m = Math.floor(tot / 60)
    const sec = tot % 60
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0')
  }

  const R = 60, C = 2 * Math.PI * R
  const frac = phaseDur > 0 ? remaining / phaseDur : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start', width: '100%' }}>
        {TPS_PHASES.map((p, i) => (
          <div key={p.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: i < phaseIdx ? p.color : i === phaseIdx ? p.color : 'transparent',
              border: '2px solid ' + p.color,
              color: i <= phaseIdx ? '#fff' : p.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
            }}>{i < phaseIdx ? '✓' : i + 1}</div>
            <span style={{ fontSize: 9, color: i === phaseIdx ? p.color : s.text, fontWeight: i === phaseIdx ? 700 : 400 }}>{p.label}</span>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width={140} height={140} viewBox="0 0 140 140">
          <circle cx={70} cy={70} r={R} fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth={6} />
          <circle cx={70} cy={70} r={R} fill="none" stroke={phase.color} strokeWidth={6}
            strokeDasharray={C} strokeDashoffset={C * (1 - frac)}
            strokeLinecap="round" transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, color: s.text }}>{phase.icon} {phase.label}</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: phase.color, fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>{fmt(remaining)}</span>
        </div>
      </div>

      <div style={{ padding: '6px 8px', borderRadius: 4, background: phase.color + '10', border: '1px solid ' + phase.color + '30', fontSize: 10, color: s.bright, textAlign: 'center', width: '100%' }}>
        {phase.instruction}
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: s.text }}>{phase.label}:</span>
        {Array.from({ length: phase.max - phase.min + 1 }, (_, i) => phase.min + i).map(m => (
          <button key={m} onClick={() => setDur(phaseIdx, m)} style={s.btn(durations[phaseIdx] === m)}>{m}m</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {!running ? (
          <button onClick={start} style={{ ...s.btn(false), padding: '4px 14px', fontSize: 11, fontWeight: 600, background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>{done ? 'Restart' : 'Start'}</button>
        ) : (
          <button onClick={pause} style={{ ...s.btn(false), padding: '4px 14px', fontSize: 11, fontWeight: 600, background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', color: '#eab308' }}>Pause</button>
        )}
        <button onClick={skip} style={{ ...s.btn(false), padding: '4px 10px', fontSize: 10 }}>Skip</button>
        <button onClick={reset} style={{ ...s.btn(false), padding: '4px 10px', fontSize: 10 }}>Reset</button>
      </div>

      {done && (
        <div style={{ padding: '4px 10px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#34d399', fontSize: 11, fontWeight: 600 }}>
          ✓ Think-Pair-Share complete!
        </div>
      )}

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b', width: '100%' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Phase: <b style={{ color: phase.color }}>{phase.icon} {phase.label}</b> ({phaseIdx + 1} of {TPS_PHASES.length})</div>
        <div>Step 2: Duration: <b>{durations[phaseIdx]}</b> min · Remaining: <b style={{ color: phase.color }}>{fmt(remaining)}</b></div>
        <div>Step 3: Instruction: "<b>{phase.instruction}</b>"</div>
        <div>Step 4: Status: <b>{done ? 'Complete' : running ? 'Running' : 'Paused'}</b> · Progress: <b>{((1 - frac) * 100).toFixed(0)}%</b></div>
        <div>Step 5: {phaseIdx < TPS_PHASES.length - 1
          ? <>Next: <b style={{ color: TPS_PHASES[phaseIdx + 1].color }}>{TPS_PHASES[phaseIdx + 1].label}</b> ({durations[phaseIdx + 1]} min)</>
          : <>Final phase — Share wraps up the protocol</>}</div>
        <div>Step 6: Total session: <b>{durations.reduce((a, b) => a + b, 0)}</b> min (Think + Pair + Share)</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa', width: '100%' }}>
        💡 <b>Insight:</b> Think-Pair-Share doubles participation: private thinking time + safe partner check before public sharing.
      </div>
    </div>
  )
}

// ============================================================
// 11. BingoCardGenerator — Review bingo 5×5 with line tracking
// ============================================================

const BINGO_PRESETS = {
  Math: ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Fraction', 'Decimal', 'Percent', 'Equation', 'Variable', 'Coefficient', 'Exponent', 'Integer', 'Prime', 'Composite', 'Area', 'Perimeter', 'Volume', 'Angle', 'Parallel', 'Perpendicular', 'Symmetry', 'Radius', 'Diameter', 'Probability'],
  Science: ['Hypothesis', 'Experiment', 'Observation', 'Conclusion', 'Variable', 'Control', 'Atom', 'Molecule', 'Cell', 'Tissue', 'Organ', 'System', 'Energy', 'Force', 'Motion', 'Gravity', 'Mass', 'Density', 'Ecosystem', 'Adaptation', 'Evolution', 'Genetics', 'Photosynthesis', 'Reaction'],
  Vocab: ['Synonym', 'Antonym', 'Metaphor', 'Simile', 'Alliteration', 'Hyperbole', 'Personification', 'Onomatopoeia', 'Idiom', 'Theme', 'Plot', 'Character', 'Setting', 'Conflict', 'Resolution', 'Narrative', 'Dialogue', 'Imagery', 'Tone', 'Mood', 'Foreshadow', 'Irony', 'Symbol', 'Climax'],
}
type BingoPresetKey = keyof typeof BINGO_PRESETS
const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']

export function BingoCardGenerator({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [preset, setPreset] = useState<BingoPresetKey>('Math')
  const [termsInput, setTermsInput] = useState(BINGO_PRESETS['Math'].join('\n'))
  const [card, setCard] = useState<string[]>([])
  const [marked, setMarked] = useState<Set<number>>(new Set([12]))

  const terms = useMemo(() =>
    termsInput.split(/[\n,]/).map(t => t.trim()).filter(t => t.length > 0).slice(0, 24),
    [termsInput])

  const generate = () => {
    const shuffled = [...terms].sort(() => Math.random() - 0.5)
    const newCard: string[] = []
    let idx = 0
    for (let i = 0; i < 25; i++) {
      if (i === 12) newCard.push('FREE')
      else newCard.push(shuffled[idx++] || `★ Slot ${i + 1}`)
    }
    setCard(newCard)
    setMarked(new Set([12]))
  }

  useEffect(() => { generate() }, [])

  const toggleMark = (i: number) => {
    if (i === 12) return
    setMarked(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const applyPreset = (p: BingoPresetKey) => {
    setPreset(p)
    setTermsInput(BINGO_PRESETS[p].join('\n'))
  }

  const completedLines = useMemo(() => {
    const lines: { name: string; cells: number[] }[] = []
    for (let r = 0; r < 5; r++) {
      const cells = [0, 1, 2, 3, 4].map(c => r * 5 + c)
      if (cells.every(i => marked.has(i))) lines.push({ name: `Row ${r + 1}`, cells })
    }
    for (let c = 0; c < 5; c++) {
      const cells = [0, 1, 2, 3, 4].map(r => r * 5 + c)
      if (cells.every(i => marked.has(i))) lines.push({ name: `Col ${c + 1}`, cells })
    }
    const d1 = [0, 6, 12, 18, 24]
    if (d1.every(i => marked.has(i))) lines.push({ name: 'Diag ↘', cells: d1 })
    const d2 = [4, 8, 12, 16, 20]
    if (d2.every(i => marked.has(i))) lines.push({ name: 'Diag ↗', cells: d2 })
    return lines
  }, [marked])

  const calledCount = marked.size - 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: s.text }}>Preset:</span>
        {(Object.keys(BINGO_PRESETS) as BingoPresetKey[]).map(p => (
          <button key={p} onClick={() => applyPreset(p)} style={s.btn(preset === p)}>{p}</button>
        ))}
      </div>

      <textarea
        placeholder={'24 terms (one per line or comma-sep)'}
        value={termsInput}
        onChange={e => setTermsInput(e.target.value)}
        rows={3}
        style={{ ...s.input, width: '100%', minHeight: 50, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.4, fontSize: 10 }}
      />

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={generate} style={{ ...s.btn(false), padding: '4px 12px', fontSize: 11, fontWeight: 600, background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>New Card</button>
        <span style={{ fontSize: 9, color: s.text }}>Terms: {terms.length}/24</span>
        <button onClick={() => setMarked(new Set([12]))} style={{ ...s.btn(false), fontSize: 9, color: '#ef4444', marginLeft: 'auto' }}>Clear Marks</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, padding: 4, background: s.bg, borderRadius: 4 }}>
        {BINGO_LETTERS.map(L => (
          <div key={L} style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#ef4444', padding: '2px 0' }}>{L}</div>
        ))}
        {card.map((term, i) => {
          const isMarked = marked.has(i)
          const isFree = i === 12
          return (
            <button key={i} onClick={() => toggleMark(i)} disabled={isFree} style={{
              height: 42, padding: 2, fontSize: 7, lineHeight: 1.1, cursor: isFree ? 'default' : 'pointer',
              background: isFree ? 'rgba(239,68,68,0.2)' : isMarked ? 'rgba(34,197,94,0.25)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
              border: '1px solid ' + (isFree ? 'rgba(239,68,68,0.5)' : isMarked ? 'rgba(34,197,94,0.5)' : s.border),
              color: isFree ? '#ef4444' : isMarked ? '#34d399' : s.bright, fontWeight: isFree ? 700 : 400,
              borderRadius: 3, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            }}>
              {isFree ? 'FREE ★' : (isMarked ? '✓ ' : '') + term}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: s.text }}>
        <span>Called: <b style={{ color: s.bright }}>{calledCount}</b>/{terms.length}</span>
        <span>Lines: <b style={{ color: completedLines.length > 0 ? '#34d399' : s.text }}>{completedLines.length}</b></span>
      </div>

      {completedLines.length > 0 && (
        <div style={{ padding: '4px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#34d399', fontSize: 10, fontWeight: 600, textAlign: 'center' }}>
          🎉 BINGO! {completedLines.map(l => l.name).join(', ')}
        </div>
      )}

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Preset: <b>{preset}</b> · Terms loaded: <b>{terms.length}</b>/24</div>
        <div>Step 2: Card: 5×5 grid (25 cells) with <b>FREE ★</b> in the center (always marked)</div>
        <div>Step 3: Called so far: <b style={{ color: '#34d399' }}>{calledCount}</b> term{calledCount !== 1 ? 's' : ''} · Click a cell to mark it called</div>
        <div>Step 4: Win lines: <b style={{ color: completedLines.length > 0 ? '#34d399' : s.bright }}>{completedLines.length}</b> {completedLines.length > 0 ? <span>({completedLines.map(l => l.name).join(', ')})</span> : <span>(need a full row, column, or diagonal)</span>}</div>
        <div>Step 5: 12 possible lines: 5 rows + 5 columns + 2 diagonals</div>
        <div>Step 6: "New Card" shuffles terms into new positions; "Clear Marks" resets called terms</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Bingo turns review into a game. Students must recognize terms (not just recall) to mark their card.
      </div>
    </div>
  )
}