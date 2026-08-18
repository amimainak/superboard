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
    </div>
  )
}