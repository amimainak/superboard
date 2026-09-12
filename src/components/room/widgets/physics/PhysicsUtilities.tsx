'use client'

import { useState, useRef, useEffect, useMemo } from 'react'

// ============================================================
// Shared style helper — NO template literals in style objects
// ============================================================

const styles = (isDark: boolean) => ({
  bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
  text: isDark ? '#94a3b8' : '#475569',
  bright: isDark ? '#e2e8f0' : '#1e293b',
  accent: '#34d399',
  input: {
    padding: '3px 6px',
    borderRadius: 4,
    fontSize: 11,
    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    color: isDark ? '#e2e8f0' : '#1e293b',
    outline: 'none' as const,
    width: 70,
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
  select: {
    padding: '2px 4px',
    borderRadius: 3,
    fontSize: 11,
    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    color: isDark ? '#e2e8f0' : '#1e293b',
    outline: 'none' as const,
  },
})

// ============================================================
// 1. PhysicsFormulaCalculator
// ============================================================

interface FormulaVar {
  key: string
  label: string
  unit: string
}

interface FormulaDef {
  name: string
  equation: string
  variables: FormulaVar[]
  solve: (solveFor: string, vals: Record<string, number>) => number
  units?: string
  insight?: string
}

const FORMULAS: FormulaDef[] = [
  {
    name: 'F = ma',
    equation: 'F = ma',
    variables: [
      { key: 'F', label: 'Force (F)', unit: 'N' },
      { key: 'm', label: 'Mass (m)', unit: 'kg' },
      { key: 'a', label: 'Acceleration (a)', unit: 'm/s\u00B2' },
    ],
    solve: (s, v) => s === 'F' ? v.m * v.a : s === 'm' ? v.F / v.a : v.F / v.m,
  },
  {
    name: 'v = d/t',
    equation: 'v = d / t',
    variables: [
      { key: 'v', label: 'Velocity (v)', unit: 'm/s' },
      { key: 'd', label: 'Distance (d)', unit: 'm' },
      { key: 't', label: 'Time (t)', unit: 's' },
    ],
    solve: (s, v) => s === 'v' ? v.d / v.t : s === 'd' ? v.v * v.t : v.d / v.v,
  },
  {
    name: 'p = mv',
    equation: 'p = mv',
    variables: [
      { key: 'p', label: 'Momentum (p)', unit: 'kg\u00B7m/s' },
      { key: 'm', label: 'Mass (m)', unit: 'kg' },
      { key: 'v', label: 'Velocity (v)', unit: 'm/s' },
    ],
    solve: (s, v) => s === 'p' ? v.m * v.v : s === 'm' ? v.p / v.v : v.p / v.m,
  },
  {
    name: 'W = Fd',
    equation: 'W = Fd',
    variables: [
      { key: 'W', label: 'Work (W)', unit: 'J' },
      { key: 'F', label: 'Force (F)', unit: 'N' },
      { key: 'd', label: 'Distance (d)', unit: 'm' },
    ],
    solve: (s, v) => s === 'W' ? v.F * v.d : s === 'F' ? v.W / v.d : v.W / v.F,
  },
  {
    name: 'KE = 0.5mv\u00B2',
    equation: 'KE = 0.5mv\u00B2',
    variables: [
      { key: 'KE', label: 'Kinetic Energy (KE)', unit: 'J' },
      { key: 'm', label: 'Mass (m)', unit: 'kg' },
      { key: 'v', label: 'Velocity (v)', unit: 'm/s' },
    ],
    solve: (s, v) => {
      if (s === 'KE') return 0.5 * v.m * v.v * v.v
      if (s === 'm') return v.KE / (0.5 * v.v * v.v)
      return Math.sqrt(v.KE / (0.5 * v.m))
    },
  },
  {
    name: 'PE = mgh',
    equation: 'PE = mgh',
    variables: [
      { key: 'PE', label: 'Potential Energy (PE)', unit: 'J' },
      { key: 'm', label: 'Mass (m)', unit: 'kg' },
      { key: 'g', label: 'Gravity (g)', unit: 'm/s\u00B2' },
      { key: 'h', label: 'Height (h)', unit: 'm' },
    ],
    solve: (s, v) => {
      if (s === 'PE') return v.m * v.g * v.h
      if (s === 'm') return v.PE / (v.g * v.h)
      if (s === 'g') return v.PE / (v.m * v.h)
      return v.PE / (v.m * v.g)
    },
  },
  {
    name: 'a = (vf-vi)/t',
    equation: 'a = (vf - vi) / t',
    variables: [
      { key: 'a', label: 'Acceleration (a)', unit: 'm/s\u00B2' },
      { key: 'vf', label: 'Final Vel (vf)', unit: 'm/s' },
      { key: 'vi', label: 'Initial Vel (vi)', unit: 'm/s' },
      { key: 't', label: 'Time (t)', unit: 's' },
    ],
    solve: (s, v) => {
      if (s === 'a') return (v.vf - v.vi) / v.t
      if (s === 'vf') return v.a * v.t + v.vi
      if (s === 'vi') return v.vf - v.a * v.t
      return (v.vf - v.vi) / v.a
    },
  },
  {
    name: 'vf\u00B2 = vi\u00B2+2ad',
    equation: 'vf\u00B2 = vi\u00B2 + 2ad',
    variables: [
      { key: 'vf', label: 'Final Vel (vf)', unit: 'm/s' },
      { key: 'vi', label: 'Initial Vel (vi)', unit: 'm/s' },
      { key: 'a', label: 'Acceleration (a)', unit: 'm/s\u00B2' },
      { key: 'd', label: 'Distance (d)', unit: 'm' },
    ],
    solve: (s, v) => {
      if (s === 'vf') return Math.sqrt(v.vi * v.vi + 2 * v.a * v.d)
      if (s === 'vi') {
        const val = v.vf * v.vf - 2 * v.a * v.d
        return val < 0 ? NaN : Math.sqrt(val)
      }
      if (s === 'a') return (v.vf * v.vf - v.vi * v.vi) / (2 * v.d)
      return (v.vf * v.vf - v.vi * v.vi) / (2 * v.a)
    },
  },
  {
    name: 'P = W/t',
    equation: 'P = W / t',
    variables: [
      { key: 'P', label: 'Power (P)', unit: 'W' },
      { key: 'W', label: 'Work (W)', unit: 'J' },
      { key: 't', label: 'Time (t)', unit: 's' },
    ],
    solve: (s, v) => s === 'P' ? v.W / v.t : s === 'W' ? v.P * v.t : v.W / v.P,
  },
  {
    name: 'I = V/R',
    equation: 'I = V / R',
    variables: [
      { key: 'I', label: 'Current (I)', unit: 'A' },
      { key: 'V', label: 'Voltage (V)', unit: 'V' },
      { key: 'R', label: 'Resistance (R)', unit: '\u03A9' },
    ],
    solve: (s, v) => s === 'I' ? v.V / v.R : s === 'V' ? v.I * v.R : v.V / v.I,
  },
]

export function PhysicsFormulaCalculator({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [formulaIdx, setFormulaIdx] = useState(0)
  const [solveFor, setSolveFor] = useState('')
  const [values, setValues] = useState<Record<string, string>>({})
  const [result, setResult] = useState<string | null>(null)

  const formula = FORMULAS[formulaIdx]

  useEffect(() => {
    setSolveFor(formula.variables[0].key)
    setValues({})
    setResult(null)
  }, [formulaIdx])

  const handleCalc = () => {
    const nums: Record<string, number> = {}
    for (const v of formula.variables) {
      if (v.key === solveFor) continue
      const raw = values[v.key]
      if (!raw || isNaN(Number(raw))) {
        setResult('Error: Enter all required values')
        return
      }
      nums[v.key] = Number(raw)
    }
    const res = formula.solve(solveFor, nums)
    const unit = formula.variables.find(v => v.key === solveFor)
    setResult(isNaN(res) ? 'No real solution' : solveFor + ' = ' + res.toFixed(4) + ' ' + (unit ? unit.unit : ''))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: s.text, fontWeight: 600 }}>Formula:</span>
        <select
          value={formulaIdx}
          onChange={e => setFormulaIdx(Number(e.target.value))}
          style={{ ...s.select, flex: 1, minWidth: 0 }}
        >
          {FORMULAS.map((f, i) => (
            <option key={i} value={i}>{f.name}</option>
          ))}
        </select>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright, textAlign: 'center', padding: '4px 0', letterSpacing: 0.5 }}>{formula.equation}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 10, color: s.text }}>Solve for:</span>
        <select
          value={solveFor}
          onChange={e => { setSolveFor(e.target.value); setResult(null) }}
          style={s.select}
        >
          {formula.variables.map(v => (
            <option key={v.key} value={v.key}>{v.label}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {formula.variables
          .filter(v => v.key !== solveFor)
          .map(v => (
            <div key={v.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 10, color: s.text, minWidth: 90, flexShrink: 0 }}>{v.label} ({v.unit}):</label>
              <input
                style={s.input}
                aria-label={`${v.label} (${v.unit})`}
                value={values[v.key] || ''}
                onChange={e => setValues(prev => ({ ...prev, [v.key]: e.target.value }))}
                type="number"
                placeholder="0"
              />
            </div>
          ))}
      </div>
      <button onClick={handleCalc} style={{ ...s.btn(true), padding: '4px 8px', alignSelf: 'flex-start', fontWeight: 600 }}>
        Calculate
      </button>
      {result && !result.startsWith('Error') && (
        <div style={{ fontSize: 12, fontWeight: 700, color: s.accent, padding: '4px 8px', background: 'rgba(5,150,105,0.08)', borderRadius: 4, wordBreak: 'break-all' }}>
          {result}
        </div>
      )}
      {result && result.startsWith('Error') && (
        <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171', padding: '4px 8px', background: 'rgba(248,113,113,0.08)', borderRadius: 4 }}>
          {result}
        </div>
      )}
      {/* Dynamic step-by-step — updates with actual input values */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Formula: {formula.equation}</div>
        <div>Step 2: Solve for {solveFor}</div>
        {formula.variables.filter(v => v.key !== solveFor).map((v, i) => (
          <div key={i}>Step {3 + i}: {v.label.split('(')[0].trim()} = {values[v.key] || '?'} {v.unit}</div>
        ))}
        {result && !result.startsWith('Error') && (
          <div>Step {3 + formula.variables.filter(v => v.key !== solveFor).length}: {result}</div>
        )}
        {!result && <div style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Click Calculate to see the full derivation with your values</div>}
      </div>
      {/* Unit analysis */}
      {formula.units && (
        <div style={{ marginTop: 4, padding: '4px 8px', borderRadius: 4, fontSize: 11, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Unit Analysis</div>
          {formula.units}
        </div>
      )}
      {/* Instructional insight */}
      {formula.insight && (
        <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
          💡 <b>Insight:</b> {formula.insight}
        </div>
      )}
</div>
  )
}

// ============================================================
// 2. WaveSimulator
// ============================================================

export function WaveSimulator({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [frequency, setFrequency] = useState(1.5)
  const [amplitude, setAmplitude] = useState(30)
  const [wavelength, setWavelength] = useState(60)
  const [phase, setPhase] = useState(0)
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const freqRef = useRef(frequency)
  freqRef.current = frequency

  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time
      const dt = (time - lastTimeRef.current) / 1000
      lastTimeRef.current = time
      setPhase(prev => prev + 2 * Math.PI * freqRef.current * dt)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const period = 1 / frequency
  const waveSpeed = frequency * wavelength
  const svgW = 400
  const svgH = 150
  const cy = svgH / 2

  // Generate sine wave path
  const wavePath = useMemo(() => {
    const pts: string[] = []
    for (let x = 0; x <= svgW; x += 2) {
      const y = cy - amplitude * Math.sin(2 * Math.PI * x / wavelength - phase)
      pts.push(x + ',' + y.toFixed(1))
    }
    return 'M ' + pts.join(' L ')
  }, [phase, amplitude, wavelength, cy])

  // Find two consecutive peaks for lambda marker
  const lambdaMarkers = useMemo(() => {
    const baseX = wavelength / 4 + wavelength * phase / (2 * Math.PI)
    const offset = ((baseX % wavelength) + wavelength) % wavelength
    const p1 = offset
    const p2 = offset + wavelength
    if (p2 > svgW || p1 < 0) return null
    const markerY = 18
    return { x1: p1, x2: p2, y: markerY }
  }, [phase, wavelength])

  const lineColor = isDark ? '#34d399' : '#059669'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        {/* Center axis */}
        <line x1={0} y1={cy} x2={svgW} y2={cy} stroke={axisColor} strokeWidth={1} strokeDasharray={'4,4'} />
        {/* Wave */}
        <path d={wavePath} fill="none" stroke={lineColor} strokeWidth={2} />
        {/* Wavelength marker */}
        {lambdaMarkers && (
          <g>
            <line x1={lambdaMarkers.x1} y1={lambdaMarkers.y} x2={lambdaMarkers.x2} y2={lambdaMarkers.y} stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth={1.5} />
            <line x1={lambdaMarkers.x1} y1={lambdaMarkers.y - 5} x2={lambdaMarkers.x1} y2={lambdaMarkers.y + 5} stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth={1.5} />
            <line x1={lambdaMarkers.x2} y1={lambdaMarkers.y - 5} x2={lambdaMarkers.x2} y2={lambdaMarkers.y + 5} stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth={1.5} />
            {/* Arrowheads */}
            <polygon points={(lambdaMarkers.x1 + 6) + ',' + lambdaMarkers.y + ' ' + (lambdaMarkers.x1) + ',' + (lambdaMarkers.y - 3) + ' ' + (lambdaMarkers.x1) + ',' + (lambdaMarkers.y + 3)} fill={isDark ? '#fbbf24' : '#d97706'} />
            <polygon points={(lambdaMarkers.x2 - 6) + ',' + lambdaMarkers.y + ' ' + (lambdaMarkers.x2) + ',' + (lambdaMarkers.y - 3) + ' ' + (lambdaMarkers.x2) + ',' + (lambdaMarkers.y + 3)} fill={isDark ? '#fbbf24' : '#d97706'} />
            <text x={(lambdaMarkers.x1 + lambdaMarkers.x2) / 2} y={lambdaMarkers.y - 7} textAnchor="middle" fontSize={11} fontWeight={700} fill={isDark ? '#fbbf24' : '#d97706'}>{'\u03BB'}</text>
          </g>
        )}
        {/* Amplitude marker on left side */}
        <line x1={15} y1={cy} x2={15} y2={cy - amplitude} stroke={isDark ? '#818cf8' : '#6366f1'} strokeWidth={1.5} strokeDasharray={'3,2'} />
        <line x1={11} y1={cy} x2={19} y2={cy} stroke={isDark ? '#818cf8' : '#6366f1'} strokeWidth={1} />
        <line x1={11} y1={cy - amplitude} x2={19} y2={cy - amplitude} stroke={isDark ? '#818cf8' : '#6366f1'} strokeWidth={1} />
        <text x={10} y={cy - amplitude / 2} textAnchor="middle" fontSize={9} fill={isDark ? '#818cf8' : '#6366f1'} dominantBaseline={'middle'}>A</text>
      </svg>
      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Frequency:</span>
          <input type="range" aria-label="Frequency in Hertz" min={0.5} max={5} step={0.1} value={frequency} onChange={e => setFrequency(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 40, textAlign: 'right' }}>{frequency.toFixed(1)} Hz</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Amplitude:</span>
          <input type="range" aria-label="Amplitude in meters" min={10} max={50} step={1} value={amplitude} onChange={e => setAmplitude(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 40, textAlign: 'right' }}>{amplitude} m</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>{'Wavelength (\u03BB):'}</span>
          <input type="range" aria-label="Wavelength in meters" min={20} max={100} step={1} value={wavelength} onChange={e => setWavelength(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 40, textAlign: 'right' }}>{wavelength} m</span>
        </div>
      </div>
      {/* Info */}
      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: s.text }}>
        <span>T = 1/f = <b style={{ color: s.bright }}>{period.toFixed(3)} s</b></span>
        <span>v = f{'\u00B7\u03BB'} = <b style={{ color: s.bright }}>{waveSpeed.toFixed(1)} m/s</b></span>
      </div>
      {/* Dynamic step-by-step — updates with slider values */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: f = {frequency.toFixed(1)} Hz, λ = {wavelength} m</div>
        <div>Step 2: T = 1/f = 1/{frequency.toFixed(1)} = <b style={{ color: s.accent }}>{period.toFixed(3)} s</b></div>
        <div>Step 3: v = f × λ = {frequency.toFixed(1)} × {wavelength} = <b style={{ color: s.accent }}>{waveSpeed.toFixed(1)} m/s</b></div>
        <div>Step 4: Amplitude A = {amplitude} m (wave height)</div>
      </div>
      {/* Instructional insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> v = f×λ. If {frequency.toFixed(1)} waves pass per second, each {wavelength}m long, then {(frequency * wavelength).toFixed(1)}m of wave passes per second — that's velocity!
      </div>
</div>
  )
}

// ============================================================
// 3. PendulumSimulator
// ============================================================

export function PendulumSimulator({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [length, setLength] = useState(1.5)
  const [gravity, setGravity] = useState(9.8)
  const [initialAngleDeg, setInitialAngleDeg] = useState(30)
  const [running, setRunning] = useState(false)
  const [currentAngle, setCurrentAngle] = useState(30)

  const animRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const lenRef = useRef(length)
  const gravRef = useRef(gravity)
  const angRef = useRef(initialAngleDeg)
  lenRef.current = length
  gravRef.current = gravity
  angRef.current = initialAngleDeg

  const initialAngleRad = initialAngleDeg * Math.PI / 180
  const period = 2 * Math.PI * Math.sqrt(length / gravity)

  const startSim = () => {
    startTimeRef.current = 0
    setCurrentAngle(initialAngleDeg)
    setRunning(true)
  }

  const resetSim = () => {
    cancelAnimationFrame(animRef.current)
    setRunning(false)
    setCurrentAngle(initialAngleDeg)
  }

  useEffect(() => {
    if (!running) return
    const animate = (time: number) => {
      if (startTimeRef.current === 0) startTimeRef.current = time
      const elapsed = (time - startTimeRef.current) / 1000
      const theta0 = angRef.current * Math.PI / 180
      const theta = theta0 * Math.cos(Math.sqrt(gravRef.current / lenRef.current) * elapsed)
      setCurrentAngle(theta * 180 / Math.PI)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [running])

  // SVG dimensions and scaling
  const svgW = 300
  const svgH = 280
  const pivotX = svgW / 2
  const pivotY = 30
  const maxVisualLen = svgH - pivotY - 30
  const angleRad = currentAngle * Math.PI / 180
  const maxHorizDisp = pivotX - 20
  const neededScaleH = maxHorizDisp / (length * Math.sin(Math.max(initialAngleRad, 0.1)))
  const scaleV = maxVisualLen / length
  const scale = Math.min(neededScaleH, scaleV, 80)
  const visualLen = length * scale
  const bobX = pivotX + visualLen * Math.sin(angleRad)
  const bobY = pivotY + visualLen * Math.cos(angleRad)
  const bobR = 12

  const stringColor = isDark ? '#94a3b8' : '#64748b'
  const bobColor = isDark ? '#818cf8' : '#6366f1'
  const pivotColor = isDark ? '#e2e8f0' : '#1e293b'
  const trailColor = isDark ? 'rgba(129,140,248,0.15)' : 'rgba(99,102,241,0.1)'

  // Draw arc to show swing range
  const arcR = visualLen
  const startAng = -initialAngleRad
  const endAng = initialAngleRad
  const arcX1 = pivotX + arcR * Math.sin(startAng)
  const arcY1 = pivotY + arcR * Math.cos(startAng)
  const arcX2 = pivotX + arcR * Math.sin(endAng)
  const arcY2 = pivotY + arcR * Math.cos(endAng)
  const largeArc = initialAngleRad > Math.PI / 2 ? 1 : 0
  const arcPath = 'M ' + arcX1.toFixed(1) + ' ' + arcY1.toFixed(1) + ' A ' + arcR.toFixed(1) + ' ' + arcR.toFixed(1) + ' 0 ' + largeArc + ' 1 ' + arcX2.toFixed(1) + ' ' + arcY2.toFixed(1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        {/* Swing arc trail */}
        <path d={arcPath} fill="none" stroke={trailColor} strokeWidth={2} />
        {/* Pivot mount */}
        <rect x={pivotX - 20} y={pivotY - 6} width={40} height={6} rx={2} fill={isDark ? '#334155' : '#cbd5e1'} />
        {/* String */}
        <line x1={pivotX} y1={pivotY} x2={bobX} y2={bobY} stroke={stringColor} strokeWidth={2} />
        {/* Pivot dot */}
        <circle cx={pivotX} cy={pivotY} r={4} fill={pivotColor} />
        {/* Bob shadow */}
        <circle cx={bobX + 2} cy={bobY + 2} r={bobR} fill={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)'} />
        {/* Bob */}
        <circle cx={bobX} cy={bobY} r={bobR} fill={bobColor} />
        <circle cx={bobX - 3} cy={bobY - 3} r={3} fill={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.4)'} />
        {/* Angle label */}
        <text x={pivotX + 15} y={pivotY + 20} fontSize={10} fill={isDark ? '#fbbf24' : '#d97706'}>{'\u03B8 = ' + currentAngle.toFixed(1) + '\u00B0'}</text>
      </svg>
      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Length:</span>
          <input type="range" aria-label="Pendulum length in meters" min={0.5} max={3} step={0.1} value={length} onChange={e => setLength(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 40, textAlign: 'right' }}>{length.toFixed(1)} m</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Gravity:</span>
          <input type="range" aria-label="Gravity in meters per second squared" min={1} max={20} step={0.1} value={gravity} onChange={e => setGravity(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 50, textAlign: 'right' }}>{gravity.toFixed(1)} m/s{'\u00B2'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Initial angle:</span>
          <input type="range" aria-label="Initial angle in degrees" min={5} max={80} step={1} value={initialAngleDeg} onChange={e => setInitialAngleDeg(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 40, textAlign: 'right' }}>{initialAngleDeg}{'\u00B0'}</span>
        </div>
      </div>
      {/* Controls and info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={running ? resetSim : startSim} style={{ ...s.btn(!running), padding: '3px 10px', fontWeight: 600 }}>
          {running ? 'Reset' : 'Start'}
        </button>
        {running && (
          <button onClick={resetSim} style={{ ...s.btn(false), padding: '3px 10px', color: '#f87171' }}>Stop</button>
        )}
        <span style={{ fontSize: 10, color: s.text }}>
          T = 2{'\u03C0'}{'\u221A'}(L/g) = 2{'\u03C0'}{'\u221A'}({length}/{gravity}) = <b style={{ color: s.bright }}>{period.toFixed(3)} s</b>
        </span>
      </div>
      <div style={{ fontSize: 9, color: s.text, opacity: 0.7, borderTop: '1px solid ' + s.border, paddingTop: 4 }}>
        {'\u03B8'}(t) = {'\u03B8\u2080'} {'\u00B7'} cos({'\u221A'}(g/L) {'\u00B7'} t) &nbsp;|&nbsp; T = 2{'\u03C0'}{'\u221A'}(L/g)
      </div>
      {/* Dynamic step-by-step — updates with slider values */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: L = {length.toFixed(1)} m, g = {gravity.toFixed(1)} m/s²</div>
        <div>Step 2: L/g = {length.toFixed(1)}/{gravity.toFixed(1)} = {(length / gravity).toFixed(4)}</div>
        <div>Step 3: √(L/g) = √{(length / gravity).toFixed(4)} = {Math.sqrt(length / gravity).toFixed(4)}</div>
        <div>Step 4: T = 2π × {Math.sqrt(length / gravity).toFixed(4)} = <b style={{ color: s.accent }}>{period.toFixed(3)} s</b></div>
        <div>Step 5: Mass does NOT appear — period is independent of mass!</div>
      </div>
      {/* Instructional insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Period depends only on length and gravity — NOT mass. Gravity pulls harder on heavy objects, but they resist more. The effects cancel (Galileo's discovery).
      </div>
</div>
  )
}

// ============================================================
// 4. ScienceUnitConverter
// ============================================================

interface UnitCategory {
  name: string
  units: string[]
  toBase: Record<string, number> | null
  convert?: (value: number, from: string, to: string) => number
}

const UNIT_CATEGORIES: UnitCategory[] = [
  {
    name: 'Force',
    units: ['N', 'lbf', 'dyn'],
    toBase: { N: 1, lbf: 4.44822, dyn: 0.00001 },
  },
  {
    name: 'Energy',
    units: ['J', 'cal', 'kWh', 'eV'],
    toBase: { J: 1, cal: 4.184, kWh: 3600000, eV: 1.602176634e-19 },
  },
  {
    name: 'Power',
    units: ['W', 'hp', 'BTU/h'],
    toBase: { W: 1, hp: 745.7, 'BTU/h': 0.29307107 },
  },
  {
    name: 'Pressure',
    units: ['Pa', 'atm', 'mmHg', 'psi'],
    toBase: { Pa: 1, atm: 101325, mmHg: 133.322, psi: 6894.76 },
  },
  {
    name: 'Temperature',
    units: ['\u00B0C', '\u00B0F', 'K'],
    toBase: null,
    convert: (value: number, from: string, to: string): number => {
      let celsius: number
      if (from === '\u00B0C') celsius = value
      else if (from === '\u00B0F') celsius = (value - 32) * 5 / 9
      else celsius = value - 273.15
      if (to === '\u00B0C') return celsius
      if (to === '\u00B0F') return celsius * 9 / 5 + 32
      return celsius + 273.15
    },
  },
  {
    name: 'Speed',
    units: ['m/s', 'km/h', 'mph', 'ft/s'],
    toBase: { 'm/s': 1, 'km/h': 0.277778, mph: 0.44704, 'ft/s': 0.3048 },
  },
]

export function ScienceUnitConverter({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [catIdx, setCatIdx] = useState(0)
  const [fromUnit, setFromUnit] = useState('')
  const [toUnit, setToUnit] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [result, setResult] = useState<string | null>(null)

  const cat = UNIT_CATEGORIES[catIdx]

  useEffect(() => {
    setFromUnit(cat.units[0])
    setToUnit(cat.units[1] || cat.units[0])
    setInputVal('')
    setResult(null)
  }, [catIdx])

  const handleConvert = () => {
    const val = Number(inputVal)
    if (isNaN(val) || inputVal === '') {
      setResult('Enter a valid number')
      return
    }
    let converted: number
    if (cat.convert) {
      converted = cat.convert(val, fromUnit, toUnit)
    } else {
      const tb = cat.toBase as Record<string, number>
      const baseValue = val * tb[fromUnit]
      converted = baseValue / tb[toUnit]
    }
    setResult(val + ' ' + fromUnit + ' = ' + formatNum(converted) + ' ' + toUnit)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 10, color: s.text, fontWeight: 600 }}>Category:</span>
        <select value={catIdx} onChange={e => setCatIdx(Number(e.target.value))} style={{ ...s.select, flex: 1, minWidth: 0 }}>
          {UNIT_CATEGORIES.map((c, i) => (
            <option key={i} value={i}>{c.name}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
          <span style={{ fontSize: 10, color: s.text }}>From:</span>
          <select value={fromUnit} onChange={e => setFromUnit(e.target.value)} style={{ ...s.select, flex: 1, minWidth: 0 }}>
            {cat.units.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <span style={{ fontSize: 12, color: s.text }}>{'\u2192'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
          <span style={{ fontSize: 10, color: s.text }}>To:</span>
          <select value={toUnit} onChange={e => setToUnit(e.target.value)} style={{ ...s.select, flex: 1, minWidth: 0 }}>
            {cat.units.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          style={{ ...s.input, flex: 1, minWidth: 0 }}
          aria-label="Value to convert"
          type="number"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          placeholder="Enter value"
          onKeyDown={e => e.key === 'Enter' && handleConvert()}
        />
        <button onClick={handleConvert} style={{ ...s.btn(true), padding: '3px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Convert
        </button>
      </div>
      {result && (
        <div style={{ fontSize: 12, fontWeight: 700, color: s.accent, padding: '4px 8px', background: 'rgba(5,150,105,0.08)', borderRadius: 4, wordBreak: 'break-all' }}>
          {result}
        </div>
      )}
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Category: {cat.name}</div>
          <div>Step 2: Convert {inputVal || '?'} {fromUnit} → {toUnit}</div>
          <div>Step 3: Result: {result || <span style={{ color: isDark ? '#64748b' : '#94a3b8' }}>click Convert</span>}</div>
          <div>Step 4: Verify: units cancel correctly</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Dimensional analysis: multiply by fractions equal to 1. Units cancel, leaving the desired unit. Always track units to catch errors.
      </div>
</div>
  )
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 1e10 || (Math.abs(n) < 1e-6 && n !== 0)) {
    return n.toExponential(4)
  }
  if (Number.isInteger(n)) return String(n)
  return parseFloat(n.toPrecision(8)).toString()
}

// ============================================================
// 5. ProjectileMotionSimulator
// ============================================================

export function ProjectileMotionSimulator({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [velocity, setVelocity] = useState(25)
  const [angle, setAngle] = useState(45)
  const [grav, setGrav] = useState(9.8)
  const [animating, setAnimating] = useState(false)
  const [dotT, setDotT] = useState(0)

  const animRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const velRef = useRef(velocity)
  const angRef = useRef(angle)
  const gravRef = useRef(grav)
  velRef.current = velocity
  angRef.current = angle
  gravRef.current = grav

  const thetaRad = angle * Math.PI / 180
  const T_flight = 2 * velocity * Math.sin(thetaRad) / grav
  const maxH = velocity * velocity * Math.sin(thetaRad) * Math.sin(thetaRad) / (2 * grav)
  const range = velocity * velocity * Math.sin(2 * thetaRad) / grav

  // SVG layout
  const svgW = 400
  const svgH = 250
  const groundY = 230
  const launchX = 30
  const availW = svgW - launchX - 20
  const availH = groundY - 20
  const scaleX = range > 0 ? availW / range : 1
  const scaleY = maxH > 0 ? availH / maxH : 1
  const scale = Math.min(scaleX, scaleY)

  // Pre-compute trajectory path
  const trajectoryPath = useMemo(() => {
    if (range <= 0) return ''
    const steps = 80
    const pts: string[] = []
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * T_flight
      const x = velocity * Math.cos(thetaRad) * t
      const y = velocity * Math.sin(thetaRad) * t - 0.5 * grav * t * t
      const sx = launchX + x * scale
      const sy = groundY - Math.max(y, 0) * scale
      pts.push(sx.toFixed(1) + ',' + sy.toFixed(1))
    }
    return 'M ' + pts.join(' L ')
  }, [velocity, angle, grav, scale, thetaRad, T_flight, launchX, groundY])

  // Get position at time t
  const getPos = (t: number) => {
    const x = velocity * Math.cos(thetaRad) * t
    const y = velocity * Math.sin(thetaRad) * t - 0.5 * grav * t * t
    return { sx: launchX + x * scale, sy: groundY - Math.max(y, 0) * scale }
  }

  const launch = () => {
    startRef.current = 0
    setDotT(0)
    setAnimating(true)
  }

  useEffect(() => {
    if (!animating) return
    const tFlight = 2 * velRef.current * Math.sin(angRef.current * Math.PI / 180) / gravRef.current
    const animate = (time: number) => {
      if (startRef.current === 0) startRef.current = time
      const elapsed = (time - startRef.current) / 1000
      // Speed up animation: complete in 2 seconds regardless of actual flight time
      const progress = Math.min(elapsed / 2, 1)
      setDotT(progress * tFlight)
      if (progress >= 1) {
        setAnimating(false)
        return
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [animating])

  const dotPos = getPos(dotT)

  // Dashed lines for max height and range
  const apexX = launchX + (range / 2) * scale
  const apexY = groundY - maxH * scale
  const rangeEndX = launchX + range * scale

  const trajColor = isDark ? '#34d399' : '#059669'
  const dotColor = isDark ? '#f472b6' : '#db2777'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const groundColor = isDark ? '#475569' : '#94a3b8'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        {/* Ground */}
        <line x1={0} y1={groundY} x2={svgW} y2={groundY} stroke={groundColor} strokeWidth={2} />
        {/* Ground hatching */}
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={i} x1={i * 22} y1={groundY} x2={i * 22 + 10} y2={groundY + 10} stroke={gridColor} strokeWidth={1} />
        ))}
        {/* Max height dashed line */}
        {maxH > 0 && (
          <line x1={apexX} y1={groundY} x2={apexX} y2={apexY} stroke={isDark ? 'rgba(251,191,36,0.3)' : 'rgba(217,119,6,0.3)'} strokeWidth={1} strokeDasharray={'4,3'} />
        )}
        {/* Range dashed line */}
        {range > 0 && (
          <line x1={launchX} y1={groundY + 5} x2={rangeEndX} y2={groundY + 5} stroke={isDark ? 'rgba(251,191,36,0.3)' : 'rgba(217,119,6,0.3)'} strokeWidth={1} strokeDasharray={'4,3'} />
        )}
        {/* Trajectory path */}
        <path d={trajectoryPath} fill="none" stroke={trajColor} strokeWidth={2} />
        {/* Launch angle arc */}
        {angle > 0 && (
          <path
            d={'M ' + (launchX + 25) + ' ' + groundY + ' A 25 25 0 0 0 ' + (launchX + 25 * Math.cos(thetaRad)).toFixed(1) + ' ' + (groundY - 25 * Math.sin(thetaRad)).toFixed(1)}
            fill="none" stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth={1.5}
          />
        )}
        {/* Angle label */}
        <text x={launchX + 32} y={groundY - 6} fontSize={9} fill={isDark ? '#fbbf24' : '#d97706'}>{angle + '\u00B0'}</text>
        {/* Animated dot */}
        <circle cx={dotPos.sx} cy={dotPos.sy} r={5} fill={dotColor}>
          <animate attributeName="opacity" values="1;0.6;1" dur="0.5s" repeatCount="indefinite" />
        </circle>
        {/* Max height label */}
        {maxH > 0 && (
          <text x={apexX + 4} y={apexY - 4} fontSize={9} fill={isDark ? '#fbbf24' : '#d97706'}>{'H=' + maxH.toFixed(1) + 'm'}</text>
        )}
        {/* Range label */}
        {range > 0 && (
          <text x={(launchX + rangeEndX) / 2} y={groundY + 18} fontSize={9} textAnchor="middle" fill={isDark ? '#fbbf24' : '#d97706'}>{'R=' + range.toFixed(1) + 'm'}</text>
        )}
      </svg>
      {/* Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 90 }}>Initial velocity:</span>
          <input type="range" aria-label="Initial velocity in meters per second" min={5} max={50} step={1} value={velocity} onChange={e => setVelocity(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 50, textAlign: 'right' }}>{velocity} m/s</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 90 }}>Launch angle:</span>
          <input type="range" aria-label="Launch angle in degrees" min={5} max={85} step={1} value={angle} onChange={e => setAngle(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 30, textAlign: 'right' }}>{angle}{'\u00B0'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 90 }}>Gravity:</span>
          <input type="range" aria-label="Gravity in meters per second squared" min={1} max={20} step={0.1} value={grav} onChange={e => setGrav(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 55, textAlign: 'right' }}>{grav.toFixed(1)} m/s{'\u00B2'}</span>
        </div>
      </div>
      {/* Controls and stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={launch} disabled={animating} style={{ ...s.btn(true), padding: '3px 10px', fontWeight: 600, opacity: animating ? 0.5 : 1 }}>
          {animating ? 'In Flight...' : 'Launch'}
        </button>
        <span style={{ fontSize: 10, color: s.text }}>
          H = <b style={{ color: s.bright }}>{maxH.toFixed(2)} m</b>{'  '}
          R = <b style={{ color: s.bright }}>{range.toFixed(2)} m</b>{'  '}
          T = <b style={{ color: s.bright }}>{T_flight.toFixed(2)} s</b>
        </span>
      </div>
      <div style={{ fontSize: 9, color: s.text, opacity: 0.7, borderTop: '1px solid ' + s.border, paddingTop: 4 }}>
        y = v₀sin(θ)t - ½gt² &nbsp;|&nbsp; x = v₀cos(θ)t &nbsp;|&nbsp; H = v₀²sin²(θ)/2g &nbsp;|&nbsp; R = v₀²sin(2θ)/g &nbsp;|&nbsp; T = 2v₀sin(θ)/g
      </div>
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: v₀ = {velocity} m/s, θ = {angle}°</div>
          <div>Step 2: Horizontal: constant {(velocity * Math.cos(angle * Math.PI / 180)).toFixed(2)} m/s</div>
          <div>Step 3: Vertical: {(velocity * Math.sin(angle * Math.PI / 180)).toFixed(2)} m/s initial, g = 9.8 m/s²</div>
          <div>Step 4: Range = v₀² × sin(2θ) / g = {((velocity * velocity * Math.sin(2 * angle * Math.PI / 180)) / 9.8).toFixed(2)} m</div>
          <div>Step 5: {angle === 45 ? 'At 45° — maximum range!' : 'Max range at 45°'}</div>
          <div>Step 6: Horizontal and vertical are INDEPENDENT</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Horizontal and vertical motions are INDEPENDENT. Gravity only affects vertical. A bullet dropped and fired from the same height hit the ground simultaneously.
      </div>
</div>
  )
}

// ============================================================
// 6. OhmsLawCalculator
// ============================================================

export function OhmsLawCalculator({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [fields, setFields] = useState({ V: '', I: '', R: '' })
  const [calculated, setCalculated] = useState<string | null>(null)

  const handleChange = (field: string, value: string) => {
    const next = { ...fields, [field]: value }
    setCalculated(null)

    // Count valid numeric entries
    type OhmKey = 'V' | 'I' | 'R'
    const keys: OhmKey[] = ['V', 'I', 'R']
    const valid: OhmKey[] = []
    const nums: Record<OhmKey, number> = {} as Record<OhmKey, number>
    for (const k of keys) {
      if (next[k] !== '' && !isNaN(Number(next[k]))) {
        valid.push(k)
        nums[k] = Number(next[k])
      }
    }

    if (valid.length === 2) {
      const missing = keys.find(k => !valid.includes(k))!
      let result = 0
      if (missing === 'V') result = nums.I * nums.R
      else if (missing === 'I') result = nums.V / nums.R
      else result = nums.V / nums.I
      next[missing] = formatNum(result)
      setFields(next)
      setCalculated(missing)
    } else {
      setFields(next)
    }
  }

  const inputStyle = (field: string) => ({
    ...s.input,
    border: calculated === field
      ? '1px solid rgba(52,211,153,0.5)'
      : '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
    background: calculated === field
      ? 'rgba(52,211,153,0.08)'
      : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
    color: calculated === field
      ? '#34d399'
      : (isDark ? '#e2e8f0' : '#1e293b'),
  })

  const lineColor = isDark ? '#94a3b8' : '#64748b'
  const labelColor = isDark ? '#e2e8f0' : '#1e293b'
  const triColor = isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.1)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      {/* Circuit triangle SVG */}
      <svg viewBox="0 0 160 120" style={{ width: 160, height: 120 }}>
        {/* Triangle fill */}
        <polygon points="80,10 15,105 145,105" fill={triColor} stroke={lineColor} strokeWidth={1.5} strokeLinejoin="round" />
        {/* V at top */}
        <text x={80} y={8} textAnchor="middle" fontSize={13} fontWeight={700} fill={labelColor}>V</text>
        {/* I at bottom-left */}
        <text x={8} y={115} textAnchor="middle" fontSize={13} fontWeight={700} fill={labelColor}>I</text>
        {/* R at bottom-right */}
        <text x={152} y={115} textAnchor="middle" fontSize={13} fontWeight={700} fill={labelColor}>R</text>
        {/* Horizontal line V-I */}
        <text x={42} y={68} textAnchor="middle" fontSize={10} fill={lineColor} transform={'rotate(-56, 42, 68)'}>V = I {'\u00D7'} R</text>
      </svg>
      {/* Input fields */}
      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label style={{ fontSize: 10, color: s.text, fontWeight: 600 }}>Voltage (V)</label>
          <input
            style={inputStyle('V')}
            aria-label="Voltage in volts"
            type="number"
            value={fields.V}
            onChange={e => handleChange('V', e.target.value)}
            placeholder="?"
          />
          <span style={{ fontSize: 9, color: calculated === 'V' ? '#34d399' : s.text, textAlign: 'center' }}>
            {calculated === 'V' ? 'auto-calculated' : 'volts'}
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label style={{ fontSize: 10, color: s.text, fontWeight: 600 }}>Current (I)</label>
          <input
            style={inputStyle('I')}
            aria-label="Current in amps"
            type="number"
            value={fields.I}
            onChange={e => handleChange('I', e.target.value)}
            placeholder="?"
          />
          <span style={{ fontSize: 9, color: calculated === 'I' ? '#34d399' : s.text, textAlign: 'center' }}>
            {calculated === 'I' ? 'auto-calculated' : 'amps'}
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label style={{ fontSize: 10, color: s.text, fontWeight: 600 }}>{'Resistance (R)'}</label>
          <input
            style={inputStyle('R')}
            aria-label="Resistance in ohms"
            type="number"
            value={fields.R}
            onChange={e => handleChange('R', e.target.value)}
            placeholder="?"
          />
          <span style={{ fontSize: 9, color: calculated === 'R' ? '#34d399' : s.text, textAlign: 'center' }}>
            {calculated === 'R' ? 'auto-calculated' : 'ohms'}
          </span>
        </div>
      </div>
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Known values — V = {fields.V || '?'} V, I = {fields.I || '?'} A, R = {fields.R || '?'} Ω</div>
          <div>Step 2: Ohm's Law: V = I × R (voltage = current × resistance)</div>
          <div>Step 3: Rearrange to solve for the unknown ({calculated ? `solving for ${calculated}` : 'enter any two values'}):  V = I×R  |  I = V/R  |  R = V/I</div>
          <div>Step 4: {calculated === 'V' ? <>V = I × R = {fields.I} × {fields.R} = <b style={{ color: s.accent }}>{fields.V} V</b></> : calculated === 'I' ? <>I = V / R = {fields.V} / {fields.R} = <b style={{ color: s.accent }}>{fields.I} A</b></> : calculated === 'R' ? <>R = V / I = {fields.V} / {fields.I} = <b style={{ color: s.accent }}>{fields.R} Ω</b></> : <span style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Enter any two values — the third is computed automatically</span>}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> V = I×R. Like water: voltage = pressure, current = flow, resistance = pipe narrowing. Double voltage → double current.
      </div>
</div>
  )
}

// ============================================================
// 7. CircuitDiagramBuilder
// ============================================================

type CircuitComponentType = 'battery' | 'resistor' | 'led' | 'switch' | 'ammeter' | 'voltmeter' | 'capacitor' | 'wire'

interface PlacedCircuit {
  id: number
  type: CircuitComponentType
  x: number
  y: number
  value?: number
  switchClosed?: boolean
}

interface WireSegment {
  id: number
  x1: number
  y1: number
  x2: number
  y2: number
}

const CIRCUIT_PARTS: { type: CircuitComponentType; label: string }[] = [
  { type: 'battery', label: 'Battery' },
  { type: 'resistor', label: 'Resistor' },
  { type: 'led', label: 'LED' },
  { type: 'switch', label: 'Switch' },
  { type: 'ammeter', label: 'Ammeter' },
  { type: 'voltmeter', label: 'Voltmeter' },
  { type: 'capacitor', label: 'Capacitor' },
  { type: 'wire', label: 'Wire' },
]

export function CircuitDiagramBuilder({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [selectedTool, setSelectedTool] = useState<CircuitComponentType | null>(null)
  const [components, setComponents] = useState<PlacedCircuit[]>([])
  const [wires, setWires] = useState<WireSegment[]>([])
  const [wireStart, setWireStart] = useState<{ x: number; y: number } | null>(null)
  const [nextId, setNextId] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const scaleX = 280 / rect.width
    const scaleY = 180 / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    if (!selectedTool) return

    if (selectedTool === 'wire') {
      if (!wireStart) {
        setWireStart({ x, y })
      } else {
        const newWire: WireSegment = { id: nextId, x1: wireStart.x, y1: wireStart.y, x2: x, y2: y }
        setWires(prev => [...prev, newWire])
        setWireStart(null)
        setNextId(prev => prev + 1)
      }
      return
    }

    const newComp: PlacedCircuit = {
      id: nextId,
      type: selectedTool,
      x: Math.max(20, Math.min(260, x)),
      y: Math.max(15, Math.min(165, y)),
      value: selectedTool === 'battery' ? 9 : selectedTool === 'resistor' ? 100 : undefined,
      switchClosed: selectedTool === 'switch' ? false : undefined,
    }
    setComponents(prev => [...prev, newComp])
    setNextId(prev => prev + 1)
  }

  const handleClear = () => {
    setComponents([])
    setWires([])
    setWireStart(null)
    setNextId(1)
    setEditingId(null)
  }

  const updateCompValue = (id: number, val: string) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, value: parseFloat(val) || 0 } : c))
  }

  const toggleSwitch = (id: number) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, switchClosed: !c.switchClosed } : c))
  }

  const lineColor = isDark ? '#94a3b8' : '#64748b'
  const accentColor = '#34d399'

  // Series auto-calc
  const battery = components.find(c => c.type === 'battery')
  const resistors = components.filter(c => c.type === 'resistor')
  const hasWires = wires.length >= 2
  const totalR = resistors.reduce((a, c) => a + (c.value || 0), 0)
  const seriesI = battery && battery.value && totalR > 0 ? battery.value / totalR : null
  const seriesV = battery ? battery.value : null

  const drawComponent = (c: PlacedCircuit) => {
    const cx = c.x
    const cy = c.y
    switch (c.type) {
      case 'battery':
        return (
          <g key={c.id} onClick={e => { e.stopPropagation(); setEditingId(c.id) }}>
            <line x1={cx - 12} y1={cy - 8} x2={cx - 12} y2={cy + 8} stroke={accentColor} strokeWidth={2} />
            <line x1={cx - 4} y1={cy - 4} x2={cx - 4} y2={cy + 4} stroke={accentColor} strokeWidth={2} />
            <line x1={cx - 16} y1={cy} x2={cx - 12} y2={cy} stroke={lineColor} strokeWidth={1} />
            <line x1={cx - 4} y1={cy} x2={cx} y2={cy} stroke={lineColor} strokeWidth={1} />
            <text x={cx} y={cy + 3} fontSize={7} fill={isDark ? '#e2e8f0' : '#1e293b'} textAnchor="start">{(c.value || 0) + 'V'}</text>
          </g>
        )
      case 'resistor':
        return (
          <g key={c.id} onClick={e => { e.stopPropagation(); setEditingId(c.id) }}>
            <polyline
              points={(cx - 12) + ',' + cy + ' ' + (cx - 9) + ',' + (cy - 5) + ' ' + (cx - 5) + ',' + (cy + 5) + ' ' + (cx - 1) + ',' + (cy - 5) + ' ' + (cx + 3) + ',' + (cy + 5) + ' ' + (cx + 7) + ',' + (cy - 5) + ' ' + (cx + 10) + ',' + cy}
              fill="none" stroke={lineColor} strokeWidth={1.5}
            />
            <text x={cx + 12} y={cy + 3} fontSize={7} fill={isDark ? '#e2e8f0' : '#1e293b'} textAnchor="start">{(c.value || 0) + 'Ω'}</text>
          </g>
        )
      case 'led':
        return (
          <g key={c.id}>
            <polygon points={(cx - 5) + ',' + (cy - 6) + ' ' + (cx - 5) + ',' + (cy + 6) + ' ' + (cx + 5) + ',' + cy} fill="none" stroke={accentColor} strokeWidth={1.2} />
            <line x1={cx + 5} y1={cy - 6} x2={cx + 5} y2={cy + 6} stroke={accentColor} strokeWidth={1.5} />
            <line x1={cx - 8} y1={cy} x2={cx - 5} y2={cy} stroke={lineColor} strokeWidth={1} />
            <line x1={cx + 5} y1={cy} x2={cx + 8} y2={cy} stroke={lineColor} strokeWidth={1} />
          </g>
        )
      case 'switch':
        return (
          <g key={c.id} onClick={e => { e.stopPropagation(); toggleSwitch(c.id) }} style={{ cursor: 'pointer' }}>
            <circle cx={cx - 8} cy={cy} r={1.5} fill={lineColor} />
            <circle cx={cx + 8} cy={cy} r={1.5} fill={lineColor} />
            {c.switchClosed
              ? <line x1={cx - 8} y1={cy} x2={cx + 8} y2={cy} stroke={accentColor} strokeWidth={1.5} />
              : <line x1={cx - 8} y1={cy} x2={cx + 6} y2={cy - 8} stroke={lineColor} strokeWidth={1.5} />
            }
          </g>
        )
      case 'ammeter':
        return (
          <g key={c.id}>
            <circle cx={cx} cy={cy} r={8} fill="none" stroke={lineColor} strokeWidth={1.2} />
            <text x={cx} y={cy + 3} fontSize={9} fontWeight={700} fill={accentColor} textAnchor="middle">A</text>
          </g>
        )
      case 'voltmeter':
        return (
          <g key={c.id}>
            <circle cx={cx} cy={cy} r={8} fill="none" stroke={lineColor} strokeWidth={1.2} />
            <text x={cx} y={cy + 3} fontSize={9} fontWeight={700} fill={accentColor} textAnchor="middle">V</text>
          </g>
        )
      case 'capacitor':
        return (
          <g key={c.id}>
            <line x1={cx - 3} y1={cy - 7} x2={cx - 3} y2={cy + 7} stroke={lineColor} strokeWidth={2} />
            <line x1={cx + 3} y1={cy - 7} x2={cx + 3} y2={cy + 7} stroke={lineColor} strokeWidth={2} />
            <line x1={cx - 8} y1={cy} x2={cx - 3} y2={cy} stroke={lineColor} strokeWidth={1} />
            <line x1={cx + 3} y1={cy} x2={cx + 8} y2={cy} stroke={lineColor} strokeWidth={1} />
          </g>
        )
      default:
        return null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Component buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {CIRCUIT_PARTS.map(p => (
          <button key={p.type} onClick={() => { setSelectedTool(p.type); setWireStart(null) }} style={s.btn(selectedTool === p.type)}>
            {p.label}
          </button>
        ))}
        <button onClick={handleClear} style={{ ...s.btn(false), color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}>Clear</button>
      </div>
      {wireStart && <div style={{ fontSize: 9, color: accentColor }}>Wire: click second point</div>}

      {/* SVG Canvas */}
      <div style={{ fontSize: 9, color: s.text, fontStyle: 'italic', opacity: 0.7, marginBottom: 4 }}>
        Select a component above, then click on the canvas to place it. Select Wire, click two points to connect.
      </div>

      <svg viewBox="0 0 280 180" style={{ width: '100%', borderRadius: 4, border: '1px solid ' + s.border, background: s.bg, cursor: selectedTool ? 'crosshair' as const : 'default' as const }} onClick={handleCanvasClick}>
        {/* Grid dots */}
        {Array.from({ length: 15 }).map((_, i) =>
          Array.from({ length: 10 }).map((_, j) => (
            <circle key={'g' + i + '_' + j} cx={i * 20} cy={j * 20} r={0.5} fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} />
          ))
        )}
        {wires.map(w => (
          <line key={'w' + w.id} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke={lineColor} strokeWidth={1.5} />
        ))}
        {wireStart && (
          <circle cx={wireStart.x} cy={wireStart.y} r={3} fill={accentColor} />
        )}
        {components.map(c => drawComponent(c))}
      </svg>

      {/* Value editor */}
      {editingId !== null && (() => {
        const comp = components.find(c => c.id === editingId)
        if (!comp || (comp.type !== 'battery' && comp.type !== 'resistor')) return null
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
            <span style={{ color: s.text }}>{comp.type === 'battery' ? 'Voltage (V):' : 'Resistance (Ω):'}</span>
            <input style={s.input} aria-label="Component value" type="number" value={comp.value || 0} onChange={e => updateCompValue(comp.id, e.target.value)} />
            <button onClick={() => setEditingId(null)} style={s.btn(false)}>Done</button>
          </div>
        )
      })()}

      {/* Series auto-calc */}
      {seriesI !== null && (
        <div style={{ fontSize: 9, color: accentColor, padding: '2px 0', borderTop: '1px solid ' + s.border, paddingTop: 4 }}>
          Series: I = V/R = {seriesV}V / {totalR}Ω = {seriesI.toFixed(3)} A
        </div>
      )}
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Components placed: {components.length} total — {battery ? `1 battery (${battery.value} V)` : 'no battery'}, {resistors.length} resistor{resistors.length !== 1 ? 's' : ''}, {wires.length} wire{wires.length !== 1 ? 's' : ''}</div>
          <div>Step 2: Series resistance adds: R_total = {resistors.length > 0 ? resistors.map(r => (r.value || 0) + ' Ω').join(' + ') : '0 Ω'} = <b style={{ color: s.accent }}>{totalR} Ω</b></div>
          <div>Step 3: {battery ? <>Battery voltage: V = <b style={{ color: s.accent }}>{battery.value} V</b></> : 'Add a battery to supply voltage'}</div>
          <div>Step 4: Ohm's Law on total resistance: I = V / R = {seriesV ?? '?'}/{totalR} = {seriesI !== null ? <b style={{ color: s.accent }}>{seriesI.toFixed(3)} A</b> : <span style={{ color: isDark ? '#64748b' : '#94a3b8' }}>add battery + resistor + 2 wires</span>}</div>
          <div>Step 5: In a series circuit, current is the SAME through every component (no branching)</div>
          <div>Step 6: In parallel, voltage is the same across each branch — total resistance is LESS than any individual</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Series: current same everywhere, resistance adds. Parallel: voltage same, currents split. Homes use parallel so devices work independently.
      </div>
</div>
  )
}

// ============================================================
// 8. FreeBodyDiagramBuilder
// ============================================================

interface ForceArrow {
  id: number
  label: string
  fx: number
  fy: number
  color: string
}

const FORCE_PRESETS = [
  { label: 'Weight', fx: 0, fy: 1, color: '#f87171' },
  { label: 'Normal', fx: 0, fy: -1, color: '#34d399' },
  { label: 'Friction', fx: -1, fy: 0, color: '#fbbf24' },
  { label: 'F_app', fx: 1, fy: 0, color: '#60a5fa' },
  { label: 'Tension', fx: 0, fy: -1, color: '#c084fc' },
  { label: 'F_air', fx: -1, fy: 0, color: '#fb923c' },
]

export function FreeBodyDiagramBuilder({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [forces, setForces] = useState<ForceArrow[]>([])
  const [nextId, setNextId] = useState(1)
  const [dragging, setDragging] = useState<number | null>(null)
  const [objectShape, setObjectShape] = useState<'rect' | 'circle'>('rect')
  const [balanced, setBalanced] = useState<boolean | null>(null)

  const addForce = (preset: typeof FORCE_PRESETS[0]) => {
    const newForce: ForceArrow = {
      id: nextId,
      label: preset.label,
      fx: preset.fx * 40,
      fy: preset.fy * 40,
      color: preset.color,
    }
    setForces(prev => [...prev, newForce])
    setNextId(prev => prev + 1)
    setBalanced(null)
  }

  const updateForceMag = (id: number, val: number) => {
    setForces(prev => prev.map(f => {
      if (f.id !== id) return f
      const mag = Math.max(0, val)
      const angle = Math.atan2(f.fy, f.fx)
      return { ...f, fx: mag * Math.cos(angle), fy: mag * Math.sin(angle) }
    }))
    setBalanced(null)
  }

  const removeForce = (id: number) => {
    setForces(prev => prev.filter(f => f.id !== id))
    setBalanced(null)
  }

  const handleMouseDown = (id: number) => { setDragging(id) }
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragging === null) return
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const scaleX = 280 / rect.width
    const scaleY = 220 / rect.height
    const mx = (e.clientX - rect.left) * scaleX - 140
    const my = (e.clientY - rect.top) * scaleY - 110
    setForces(prev => prev.map(f => {
      if (f.id !== dragging) return f
      const mag = Math.sqrt(mx * mx + my * my)
      const clamped = Math.min(Math.max(mag, 5), 90)
      const angle = Math.atan2(my, mx)
      return { ...f, fx: clamped * Math.cos(angle), fy: clamped * Math.sin(angle) }
    }))
    setBalanced(null)
  }
  const handleMouseUp = () => { setDragging(null) }

  const netFx = forces.reduce((a, f) => a + f.fx, 0)
  const netFy = forces.reduce((a, f) => a + f.fy, 0)
  const netMag = Math.sqrt(netFx * netFx + netFy * netFy)

  const checkBalance = () => {
    setBalanced(netMag < 2)
  }

  const cx = 140
  const cy = 110

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {FORCE_PRESETS.map(p => (
          <button key={p.label} onClick={() => addForce(p)} style={s.btn(false)}>{p.label}</button>
        ))}
        <button onClick={() => setObjectShape(objectShape === 'rect' ? 'circle' : 'rect')} style={s.btn(false)}>
          {objectShape === 'rect' ? 'Rect' : 'Circle'}
        </button>
        <button onClick={checkBalance} style={{ ...s.btn(false), color: '#34d399' }}>Check Balance</button>
        {forces.length > 0 && (
          <button onClick={() => { setForces([]); setBalanced(null) }} style={{ ...s.btn(false), color: '#f87171' }}>Clear All</button>
        )}
      </div>

      <svg viewBox="0 0 280 220" style={{ width: '100%', borderRadius: 4, border: '1px solid ' + s.border, background: s.bg }} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {/* Grid */}
        {Array.from({ length: 29 }).map((_, i) => (
          <line key={'gv' + i} x1={i * 10} y1={0} x2={i * 10} y2={220} stroke={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} strokeWidth={0.5} />
        ))}
        {Array.from({ length: 23 }).map((_, i) => (
          <line key={'gh' + i} x1={0} y1={i * 10} x2={280} y2={i * 10} stroke={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} strokeWidth={0.5} />
        ))}

        {/* Object */}
        {objectShape === 'rect'
          ? <rect x={cx - 20} y={cy - 20} width={40} height={40} fill={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={1.5} rx={3} />
          : <circle cx={cx} cy={cy} r={22} fill={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={1.5} />
        }
        <text x={cx} y={cy + 3} fontSize={10} fill={isDark ? '#e2e8f0' : '#1e293b'} textAnchor="middle" fontWeight={600}>m</text>

        {/* Force arrows */}
        {forces.map(f => {
          const endX = cx + f.fx
          const endY = cy + f.fy
          const angle = Math.atan2(f.fy, f.fx) * (180 / Math.PI)
          return (
            <g key={f.id}>
              <line x1={cx} y1={cy} x2={endX} y2={endY} stroke={f.color} strokeWidth={2} />
              <polygon
                points={endX + ',' + endY + ' ' + (endX - 8 * Math.cos((angle - 15) * Math.PI / 180)) + ',' + (endY - 8 * Math.sin((angle - 15) * Math.PI / 180)) + ' ' + (endX - 8 * Math.cos((angle + 15) * Math.PI / 180)) + ',' + (endY - 8 * Math.sin((angle + 15) * Math.PI / 180))}
                fill={f.color}
              />
              <circle cx={endX} cy={endY} r={6} fill="transparent" style={{ cursor: 'pointer' }} onMouseDown={e => { e.stopPropagation(); handleMouseDown(f.id) }} />
              <text x={(cx + endX) / 2 + (f.fy > 0 ? -10 : 10)} y={(cy + endY) / 2 + (f.fx > 0 ? -4 : 4)} fontSize={9} fill={f.color} fontWeight={600}>{f.label}</text>
            </g>
          )
        })}

        {/* Net force arrow */}
        {forces.length > 0 && (
          <g>
            <line x1={cx} y1={cy} x2={cx + netFx * 0.5} y2={cy + netFy * 0.5} stroke="white" strokeWidth={1.5} strokeDasharray="3,2" opacity={0.5} />
            <text x={cx + netFx * 0.5 + 5} y={cy + netFy * 0.5 - 5} fontSize={7} fill={isDark ? '#94a3b8' : '#475569'}>F_net</text>
          </g>
        )}
      </svg>

      {/* Force magnitudes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 80, overflowY: 'auto' }}>
        {forces.map(f => {
          const mag = Math.sqrt(f.fx * f.fx + f.fy * f.fy) / 40
          return (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
              <span style={{ color: f.color, fontWeight: 600, width: 40 }}>{f.label}:</span>
              <input style={{ ...s.input, width: 40 }} aria-label={`Force ${f.label} magnitude in Newtons`} type="number" value={mag.toFixed(1)} onChange={e => updateForceMag(f.id, parseFloat(e.target.value) || 0)} />
              <span style={{ color: s.text }}>N</span>
              <button onClick={() => removeForce(f.id)} style={{ ...s.btn(false), fontSize: 8, padding: '1px 4px', color: '#f87171' }}>x</button>
            </div>
          )
        })}
      </div>

      {/* Net force display */}
      <div style={{ display: 'flex', gap: 8, fontSize: 9, color: s.text, borderTop: '1px solid ' + s.border, paddingTop: 4 }}>
        <span>Fx = {netFx.toFixed(1)}</span>
        <span>Fy = {netFy.toFixed(1)}</span>
        <span>|F_net| = {netMag.toFixed(1)}</span>
      </div>
      {balanced !== null && (
        <div style={{ fontSize: 10, fontWeight: 600, color: balanced ? '#34d399' : '#f87171' }}>
          {balanced ? 'Equilibrium! Net force is zero.' : 'Not in equilibrium.'}
        </div>
      )}
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Isolate the object — {objectShape === 'rect' ? 'rectangle' : 'circle'} with {forces.length} force{forces.length !== 1 ? 's' : ''} acting on it</div>
          <div>Step 2: {forces.length > 0 ? `Forces drawn: ${forces.map(f => f.label).join(', ')}` : 'Click force buttons above to add forces (Weight, Normal, Friction, etc.)'}</div>
          <div>Step 3: {forces.length > 0 ? `Sum horizontal: ΣFx = ${netFx.toFixed(1)} N` : 'ΣFx will be computed once forces are added'}</div>
          <div>Step 4: {forces.length > 0 ? `Sum vertical: ΣFy = ${netFy.toFixed(1)} N` : 'ΣFy will be computed once forces are added'}</div>
          <div>Step 5: {forces.length > 0 ? <span>|F_net| = √(ΣFx² + ΣFy²) = √({netFx.toFixed(1)}² + {netFy.toFixed(1)}²) = <b style={{ color: s.accent }}>{netMag.toFixed(1)} N</b></span> : 'Net force magnitude appears here once forces exist'}</div>
          <div>Step 6: {balanced === true ? '✓ Equilibrium! ΣF = 0 → no acceleration (Newton\'s 1st Law)' : balanced === false ? 'Not in equilibrium — ΣF ≠ 0 → object accelerates' : 'Click "Check Balance" to test if the object is in equilibrium'}</div>
          <div>Step 7: If ΣF ≠ 0, use F = ma to find acceleration (Newton's 2nd Law)</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> If forces balance (net = 0), no acceleration — Newton's First Law. The diagram shows ALL forces on ONE object.
      </div>
</div>
  )
}

// ============================================================
// 9. RayDiagramOptics
// ============================================================

type OpticalType = 'convex_lens' | 'concave_lens' | 'convex_mirror' | 'concave_mirror'

const OPTICAL_TYPES: { id: OpticalType; label: string }[] = [
  { id: 'convex_lens', label: 'Convex Lens' },
  { id: 'concave_lens', label: 'Concave Lens' },
  { id: 'convex_mirror', label: 'Convex Mirror' },
  { id: 'concave_mirror', label: 'Concave Mirror' },
]

export function RayDiagramOptics({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [optType, setOptType] = useState<OpticalType>('convex_lens')
  const [focalLength, setFocalLength] = useState(5)
  const [objDist, setObjDist] = useState(8)
  const [objHeight, setObjHeight] = useState(2)

  const isMirror = optType.endsWith('_mirror')
  const isConvex = optType.startsWith('convex')
  const f = isMirror ? (isConvex ? -focalLength : focalLength) : (isConvex ? focalLength : -focalLength)

  // Thin lens/mirror equation: 1/f = 1/do + 1/di
  const denom = 1 / f - 1 / objDist
  const di = Math.abs(denom) > 1e-10 ? 1 / denom : Infinity
  const m = isFinite(di) && di !== 0 ? -di / objDist : 0
  const imgHeight = m * objHeight
  const isReal = di > 0
  const isUpright = imgHeight > 0

  // SVG coordinates: center at (140, 90), scale 12px per unit
  const scale = 12
  const originX = 140
  const originY = 90

  const toX = (physX: number) => originX + physX * scale
  const toY = (physY: number) => originY - physY * scale

  const objScreenX = toX(-objDist)
  const objScreenY = toY(objHeight)
  const objBaseY = toY(0)

  const imgScreenX = isFinite(di) ? toX(di) : null
  const imgScreenY = isFinite(di) ? toY(imgHeight) : null

  const fLeftX = toX(-focalLength)
  const fRightX = toX(focalLength)
  const f2LeftX = toX(-2 * focalLength)
  const f2RightX = toX(2 * focalLength)

  const lineColor = isDark ? '#94a3b8' : '#64748b'
  const axisColor = isDark ? '#475569' : '#94a3b8'
  const labelColor = isDark ? '#e2e8f0' : '#1e293b'
  const rayColor1 = '#f87171'
  const rayColor2 = '#34d399'
  const rayColor3 = '#60a5fa'

  const clampX = (x: number) => Math.max(-10, Math.min(290, x))
  const clampY = (y: number) => Math.max(-10, Math.min(190, y))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={optType} onChange={e => setOptType(e.target.value as OpticalType)} style={s.select}>
          {OPTICAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 10 }}>
        <label style={{ color: s.text, display: 'flex', gap: 3, alignItems: 'center' }}>
          f:
          <input style={{ ...s.input, width: 40 }} type="range" min={2} max={10} step={0.5} value={focalLength} onChange={e => setFocalLength(parseFloat(e.target.value))} />
          <span style={{ width: 24 }}>{focalLength}</span>
        </label>
        <label style={{ color: s.text, display: 'flex', gap: 3, alignItems: 'center' }}>
          do:
          <input style={{ ...s.input, width: 35 }} type="number" min={1} max={15} step={0.5} value={objDist} onChange={e => setObjDist(parseFloat(e.target.value) || 5)} />
        </label>
        <label style={{ color: s.text, display: 'flex', gap: 3, alignItems: 'center' }}>
          ho:
          <input style={{ ...s.input, width: 35 }} type="number" min={0.5} max={5} step={0.5} value={objHeight} onChange={e => setObjHeight(parseFloat(e.target.value) || 2)} />
        </label>
      </div>

      <svg viewBox="0 0 280 180" style={{ width: '100%', borderRadius: 4, border: '1px solid ' + s.border, background: s.bg }}>
        {/* Grid */}
        {Array.from({ length: 29 }).map((_, i) => (
          <line key={'v' + i} x1={i * 10} y1={0} x2={i * 10} y2={180} stroke={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} strokeWidth={0.5} />
        ))}
        {Array.from({ length: 19 }).map((_, i) => (
          <line key={'h' + i} x1={0} y1={i * 10} x2={280} y2={i * 10} stroke={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} strokeWidth={0.5} />
        ))}

        {/* Principal axis */}
        <line x1={0} y1={originY} x2={280} y2={originY} stroke={axisColor} strokeWidth={0.8} strokeDasharray="4,3" />

        {/* Optical element */}
        {isMirror ? (
          <path
            d={'M ' + originX + ' ' + (originY - 60) + ' Q ' + (originX + (isConvex ? 5 : -5)) + ' ' + originY + ' ' + originX + ' ' + (originY + 60)}
            fill="none" stroke={labelColor} strokeWidth={2}
          />
        ) : (
          <line x1={originX} y1={originY - 60} x2={originX} y2={originY + 60} stroke={labelColor} strokeWidth={2} />
        )}

        {/* Focal points and 2F markers */}
        {!isMirror || isConvex ? (
          <>
            <circle cx={fLeftX} cy={originY} r={3} fill={rayColor1} />
            <text x={fLeftX} y={originY + 14} fontSize={8} fill={rayColor1} textAnchor="middle">F</text>
            <circle cx={f2LeftX} cy={originY} r={2.5} fill={labelColor} />
            <text x={f2LeftX} y={originY + 14} fontSize={8} fill={labelColor} textAnchor="middle">2F</text>
          </>
        ) : null}
        {!isMirror || !isConvex ? (
          <>
            <circle cx={fRightX} cy={originY} r={3} fill={rayColor1} />
            <text x={fRightX} y={originY + 14} fontSize={8} fill={rayColor1} textAnchor="middle">F{'\''}</text>
            <circle cx={f2RightX} cy={originY} r={2.5} fill={labelColor} />
            <text x={f2RightX} y={originY + 14} fontSize={8} fill={labelColor} textAnchor="middle">2F{'\''}</text>
          </>
        ) : null}
        <text x={originX} y={originY + 14} fontSize={8} fill={labelColor} textAnchor="middle">O</text>

        {/* Object arrow */}
        <line x1={objScreenX} y1={objBaseY} x2={objScreenX} y2={objScreenY} stroke={labelColor} strokeWidth={2} />
        <polygon points={objScreenX + ',' + objScreenY + ' ' + (objScreenX - 3) + ',' + (objScreenY + 6) + ' ' + (objScreenX + 3) + ',' + (objScreenY + 6)} fill={labelColor} />

        {/* Principal Rays */}
        {/* Ray 1: Parallel to axis -> through focal point */}
        <line x1={objScreenX} y1={objScreenY} x2={originX} y2={objScreenY} stroke={rayColor1} strokeWidth={1} />
        {isFinite(di) && imgScreenX !== null && imgScreenY !== null && (
          <line x1={originX} y1={objScreenY} x2={clampX(imgScreenX)} y2={clampY(imgScreenY)} stroke={rayColor1} strokeWidth={1} />
        )}

        {/* Ray 2: Through optical center (straight) */}
        {isFinite(di) && imgScreenX !== null && imgScreenY !== null && (
          <line x1={objScreenX} y1={objScreenY} x2={clampX(imgScreenX)} y2={clampY(imgScreenY)} stroke={rayColor2} strokeWidth={1} />
        )}

        {/* Ray 3: Through/toward focal point -> parallel after */}
        {(() => {
          const targetFX = isConvex ? fLeftX : fRightX
          const slopeToF = (originY - objScreenY) / (targetFX - objScreenX)
          const yAtAxis = objScreenY + slopeToF * (originX - objScreenX)
          return (
            <>
              <line x1={objScreenX} y1={objScreenY} x2={originX} y2={yAtAxis} stroke={rayColor3} strokeWidth={1} />
              {isFinite(di) && imgScreenX !== null && imgScreenY !== null && (
                <line x1={originX} y1={yAtAxis} x2={clampX(imgScreenX)} y2={clampY(imgScreenY)} stroke={rayColor3} strokeWidth={1} />
              )}
            </>
          )
        })()}

        {/* Image arrow */}
        {isFinite(di) && imgScreenX !== null && imgScreenY !== null && (
          <>
            <line x1={imgScreenX} y1={objBaseY} x2={imgScreenX} y2={imgScreenY} stroke={isReal ? '#fbbf24' : '#c084fc'} strokeWidth={2} strokeDasharray={isReal ? 'none' : '4,3'} />
            <polygon
              points={imgScreenX + ',' + imgScreenY + ' ' + (imgScreenX - 3) + ',' + (imgScreenY + (imgHeight > 0 ? -6 : 6)) + ' ' + (imgScreenX + 3) + ',' + (imgScreenY + (imgHeight > 0 ? -6 : 6))}
              fill={isReal ? '#fbbf24' : '#c084fc'}
            />
          </>
        )}
      </svg>

      {/* Results */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 9, color: s.text, borderTop: '1px solid ' + s.border, paddingTop: 4 }}>
        <span>di = {isFinite(di) ? di.toFixed(2) : '∞'}</span>
        <span>hi = {imgHeight.toFixed(2)}</span>
        <span>m = {m.toFixed(2)}</span>
        <span style={{ color: isReal ? '#fbbf24' : '#c084fc', fontWeight: 600 }}>
          {isReal ? 'Real' : 'Virtual'}, {isUpright ? 'Upright' : 'Inverted'}
        </span>
      </div>
      <div style={{ fontSize: 8, color: s.text, opacity: 0.7 }}>
        1/f = 1/do + 1/di &nbsp;|&nbsp; m = -di/do
      </div>
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Setup: {optType.replace('_', ' ')}, f = {focalLength} cm, do = {objDist} cm, ho = {objHeight} cm</div>
          <div>Step 2: Thin lens equation: 1/f = 1/do + 1/di → 1/{focalLength} = 1/{objDist} + 1/di</div>
          <div>Step 3: Solve for di: 1/di = 1/f − 1/do = {denom.toFixed(4)}</div>
          <div>Step 4: di = 1/{denom.toFixed(4)} = {isFinite(di) ? <b style={{ color: s.accent }}>{di.toFixed(2)} cm</b> : <b style={{ color: s.accent }}>∞ (image at infinity)</b>}</div>
          <div>Step 5: Magnification m = −di/do = −{isFinite(di) ? di.toFixed(2) : '∞'}/{objDist} = {m.toFixed(2)} → hi = <b style={{ color: s.accent }}>{imgHeight.toFixed(2)} cm</b></div>
          <div>Step 6: Image is {isReal ? 'REAL (rays converge on the opposite side)' : 'VIRTUAL (rays appear to diverge)'}, {isUpright ? 'upright' : 'inverted'}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Reflection: angle in = angle out. Refraction: light bends entering a new medium. Lenses use refraction to focus light.
      </div>
</div>
  )
}

// ============================================================
// 10. EnergyBarCharts (LOL Diagrams)
// ============================================================

interface EnergyState {
  ke: number
  gpe: number
  epe: number
  thermal: number
}

type ScenarioKey = 'custom' | 'falling' | 'spring' | 'friction'

const SCENARIOS: { id: ScenarioKey; label: string; initial: EnergyState; final: EnergyState }[] = [
  { id: 'falling', label: 'Falling object', initial: { ke: 0, gpe: 10, epe: 0, thermal: 0 }, final: { ke: 10, gpe: 0, epe: 0, thermal: 0 } },
  { id: 'spring', label: 'Spring launch', initial: { ke: 0, gpe: 0, epe: 10, thermal: 0 }, final: { ke: 10, gpe: 0, epe: 0, thermal: 0 } },
  { id: 'friction', label: 'Sliding with friction', initial: { ke: 10, gpe: 0, epe: 0, thermal: 0 }, final: { ke: 4, gpe: 0, epe: 0, thermal: 6 } },
]

const BAR_COLORS = ['#60a5fa', '#34d399', '#fb923c', '#f87171']
const BAR_LABELS = ['KE', 'GPE', 'EPE', 'Thermal']

export function EnergyBarCharts({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [totalEnergy, setTotalEnergy] = useState(10)
  const [initial, setInitial] = useState<EnergyState>({ ke: 0, gpe: 10, epe: 0, thermal: 0 })
  const [final, setFinal] = useState<EnergyState>({ ke: 10, gpe: 0, epe: 0, thermal: 0 })

  const initialTotal = initial.ke + initial.gpe + initial.epe + initial.thermal
  const finalTotal = final.ke + final.gpe + final.epe + final.thermal
  const initialOk = Math.abs(initialTotal - totalEnergy) < 0.01
  const finalOk = Math.abs(finalTotal - totalEnergy) < 0.01
  const conserved = Math.abs(initialTotal - finalTotal) < 0.01

  const applyScenario = (scenario: typeof SCENARIOS[0]) => {
    const te = scenario.initial.ke + scenario.initial.gpe + scenario.initial.epe + scenario.initial.thermal
    setTotalEnergy(te)
    setInitial({ ...scenario.initial })
    setFinal({ ...scenario.final })
  }

  const adjust = (state: 'initial' | 'final', key: keyof EnergyState, delta: number) => {
    const setter = state === 'initial' ? setInitial : setFinal
    const current = state === 'initial' ? initial : final
    const newVal = Math.max(0, Math.min(totalEnergy, current[key] + delta))
    setter({ ...current, [key]: newVal })
  }

  const drawBars = (eState: EnergyState, label: string, xOff: number) => {
    const vals = [eState.ke, eState.gpe, eState.epe, eState.thermal]
    const barW = 18
    const gap = 4
    const maxH = 80
    const baseY = 110
    return (
      <g>
        <text x={xOff + (barW + gap) * 2} y={8} fontSize={9} fontWeight={600} fill={isDark ? '#e2e8f0' : '#1e293b'} textAnchor="middle">{label}</text>
        <line x1={xOff - 4} y1={baseY} x2={xOff + (barW + gap) * 4} y2={baseY} stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} strokeWidth={0.8} />
        {vals.map((v, i) => {
          const h = totalEnergy > 0 ? (v / totalEnergy) * maxH : 0
          return (
            <g key={i}>
              <rect x={xOff + i * (barW + gap)} y={baseY - h} width={barW} height={h} fill={BAR_COLORS[i]} opacity={0.8} rx={2} />
              <text x={xOff + i * (barW + gap) + barW / 2} y={baseY - h - 3} fontSize={7} fill={isDark ? '#e2e8f0' : '#1e293b'} textAnchor="middle">{v.toFixed(1)}</text>
              <text x={xOff + i * (barW + gap) + barW / 2} y={baseY + 10} fontSize={7} fill={BAR_COLORS[i]} textAnchor="middle">{BAR_LABELS[i]}</text>
            </g>
          )
        })}
      </g>
    )
  }

  const makeControls = (eState: EnergyState, state: 'initial' | 'final') => {
    const keys: (keyof EnergyState)[] = ['ke', 'gpe', 'epe', 'thermal']
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        {keys.map((k, i) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 22 }}>
            <button onClick={() => adjust(state, k, 0.5)} style={{ ...s.btn(false), padding: '0 3px', fontSize: 9 }}>+</button>
            <span style={{ fontSize: 8, color: BAR_COLORS[i], fontWeight: 600 }}>{eState[k].toFixed(1)}</span>
            <button onClick={() => adjust(state, k, -0.5)} style={{ ...s.btn(false), padding: '0 3px', fontSize: 9 }}>-</button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          style={s.select}
          onChange={e => {
            const sc = SCENARIOS.find(sc => sc.id === e.target.value)
            if (sc) applyScenario(sc)
          }}
        >
          <option value="custom">Custom</option>
          {SCENARIOS.map(sc => <option key={sc.id} value={sc.id}>{sc.label}</option>)}
        </select>
        <label style={{ color: s.text, fontSize: 10, display: 'flex', gap: 3, alignItems: 'center' }}>
          Total E:
          <input style={{ ...s.input, width: 35 }} type="number" min={1} max={100} value={totalEnergy} onChange={e => setTotalEnergy(Math.max(1, parseFloat(e.target.value) || 10))} />
          J
        </label>
      </div>

      <svg viewBox="0 0 280 130" style={{ width: '100%', borderRadius: 4, border: '1px solid ' + s.border, background: s.bg }}>
        {drawBars(initial, 'Initial', 30)}
        {drawBars(final, 'Final', 160)}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 8, color: s.text, fontWeight: 600, marginBottom: 2 }}>Initial</div>
          {makeControls(initial, 'initial')}
          <div style={{ fontSize: 8, marginTop: 2, color: initialOk ? '#34d399' : '#f87171' }}>
            Sum = {initialTotal.toFixed(1)} J {initialOk ? '✓' : '≠ ' + totalEnergy + ' J'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: s.text, fontWeight: 600, marginBottom: 2 }}>Final</div>
          {makeControls(final, 'final')}
          <div style={{ fontSize: 8, marginTop: 2, color: finalOk ? '#34d399' : '#f87171' }}>
            Sum = {finalTotal.toFixed(1)} J {finalOk ? '✓' : '≠ ' + totalEnergy + ' J'}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 9, fontWeight: 600, color: conserved ? '#34d399' : '#f87171', borderTop: '1px solid ' + s.border, paddingTop: 4 }}>
        Energy Conserved: {conserved ? 'Yes! Initial = Final = ' + initialTotal.toFixed(1) + ' J' : 'No. Initial = ' + initialTotal.toFixed(1) + ' J, Final = ' + finalTotal.toFixed(1) + ' J'}
      </div>
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Total energy budget: E_total = <b style={{ color: s.accent }}>{totalEnergy.toFixed(1)} J</b></div>
          <div>Step 2: Initial state — KE={initial.ke.toFixed(1)}, GPE={initial.gpe.toFixed(1)}, EPE={initial.epe.toFixed(1)}, Thermal={initial.thermal.toFixed(1)} → Sum = <b style={{ color: initialOk ? s.accent : '#f87171' }}>{initialTotal.toFixed(1)} J {initialOk ? '✓' : '≠ E'}</b></div>
          <div>Step 3: Final state — KE={final.ke.toFixed(1)}, GPE={final.gpe.toFixed(1)}, EPE={final.epe.toFixed(1)}, Thermal={final.thermal.toFixed(1)} → Sum = <b style={{ color: finalOk ? s.accent : '#f87171' }}>{finalTotal.toFixed(1)} J {finalOk ? '✓' : '≠ E'}</b></div>
          <div>Step 4: Conservation check: E_initial ({initialTotal.toFixed(1)}) {conserved ? '=' : '≠'} E_final ({finalTotal.toFixed(1)})</div>
          <div>Step 5: {conserved ? '✓ Energy is conserved — initial and final totals match' : '⚠ Not conserved — adjust bars so both sums equal E_total'}</div>
          <div>Step 6: Total height of bars must be EQUAL — energy is never created or destroyed (1st Law of Thermodynamics)</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Energy is never created or destroyed — it transforms. PE → KE → heat. Total always stays the same (First Law of Thermodynamics).
      </div>
</div>
  )
}

// ============================================================
// 11. InteractiveGraphingTool
// ============================================================

type GraphMode = 'line' | 'scatter' | 'bar'

export function InteractiveGraphingTool({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [xStr, setXStr] = useState('1,2,3,4,5')
  const [yStr, setYStr] = useState('2,4,5,4,5')
  const [mode, setMode] = useState<GraphMode>('line')
  const [showBestFit, setShowBestFit] = useState(false)
  const [title, setTitle] = useState('My Graph')
  const [xLabel, setXLabel] = useState('X')
  const [yLabel, setYLabel] = useState('Y')

  const parseNums = (str: string) => str.split(',').map(v => parseFloat(v.trim())).filter(n => !isNaN(n))
  const xVals = parseNums(xStr)
  const yVals = parseNums(yStr)
  const n = Math.min(xVals.length, yVals.length)
  const pts = xVals.slice(0, n).map((x, i) => ({ x, y: yVals[i] }))

  const xMin = pts.length > 0 ? Math.min(...pts.map(p => p.x)) : 0
  const xMax = pts.length > 0 ? Math.max(...pts.map(p => p.x)) : 10
  const yMin = pts.length > 0 ? Math.min(...pts.map(p => p.y)) : 0
  const yMax = pts.length > 0 ? Math.max(...pts.map(p => p.y)) : 10
  const xMean = pts.length > 0 ? pts.reduce((a, p) => a + p.x, 0) / pts.length : 0
  const yMean = pts.length > 0 ? pts.reduce((a, p) => a + p.y, 0) / pts.length : 0

  let bestFitSlope = 0
  let bestFitIntercept = 0
  if (pts.length >= 2) {
    let sxx = 0
    let sxy = 0
    for (const p of pts) {
      sxx += (p.x - xMean) * (p.x - xMean)
      sxy += (p.x - xMean) * (p.y - yMean)
    }
    if (sxx > 0) {
      bestFitSlope = sxy / sxx
      bestFitIntercept = yMean - bestFitSlope * xMean
    }
  }

  const vbW = 280
  const vbH = 180
  const padL = 30
  const padR = 10
  const padT = 15
  const padB = 25
  const plotW = vbW - padL - padR
  const plotH = vbH - padT - padB

  const rangeX = xMax - xMin || 10
  const rangeY = yMax - yMin || 10
  const dataXMin = xMin - rangeX * 0.1
  const dataXMax = xMax + rangeX * 0.1
  const dataYMin = yMin - rangeY * 0.1
  const dataYMax = yMax + rangeY * 0.1

  const toSvgX = (x: number) => padL + ((x - dataXMin) / (dataXMax - dataXMin)) * plotW
  const toSvgY = (y: number) => padT + plotH - ((y - dataYMin) / (dataYMax - dataYMin)) * plotH

  const lineColor = isDark ? '#94a3b8' : '#64748b'
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const labelColor = isDark ? '#e2e8f0' : '#1e293b'
  const accentColor = '#34d399'

  const xTicks = 5
  const yTicks = 4
  const xStep = (dataXMax - dataXMin) / xTicks
  const yStep = (dataYMax - dataYMin) / yTicks

  const handleClear = () => {
    setXStr('')
    setYStr('')
    setTitle('My Graph')
    setXLabel('X')
    setYLabel('Y')
  }

  const polyPoints = pts.map(p => toSvgX(p.x) + ',' + toSvgY(p.y)).join(' ')
  const bfY1 = bestFitSlope * dataXMin + bestFitIntercept
  const bfY2 = bestFitSlope * dataXMax + bestFitIntercept

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ ...s.input, width: 80 }} aria-label="Graph title" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <button onClick={handleClear} style={{ ...s.btn(false), color: '#f87171' }}>Clear</button>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setMode('line')} style={s.btn(mode === 'line')}>Line</button>
        <button onClick={() => setMode('scatter')} style={s.btn(mode === 'scatter')}>Scatter</button>
        <button onClick={() => setMode('bar')} style={s.btn(mode === 'bar')}>Bar</button>
        <button onClick={() => setShowBestFit(!showBestFit)} style={s.btn(showBestFit)}>Best Fit</button>
      </div>

      <svg viewBox={'0 0 ' + vbW + ' ' + vbH} style={{ width: '100%', borderRadius: 4, border: '1px solid ' + s.border, background: s.bg }}>
        {/* Grid */}
        {Array.from({ length: xTicks + 1 }).map((_, i) => {
          const x = padL + (i / xTicks) * plotW
          return <line key={'gx' + i} x1={x} y1={padT} x2={x} y2={padT + plotH} stroke={gridColor} strokeWidth={0.5} />
        })}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = padT + (i / yTicks) * plotH
          return <line key={'gy' + i} x1={padL} y1={y} x2={padL + plotW} y2={y} stroke={gridColor} strokeWidth={0.5} />
        })}

        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke={lineColor} strokeWidth={1} />
        <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke={lineColor} strokeWidth={1} />

        {/* Tick labels */}
        {Array.from({ length: xTicks + 1 }).map((_, i) => {
          const val = dataXMin + i * xStep
          const x = padL + (i / xTicks) * plotW
          return <text key={'tx' + i} x={x} y={padT + plotH + 12} fontSize={7} fill={isDark ? '#94a3b8' : '#475569'} textAnchor="middle">{val.toFixed(1)}</text>
        })}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const val = dataYMin + (yTicks - i) * yStep
          const y = padT + (i / yTicks) * plotH
          return <text key={'ty' + i} x={padL - 4} y={y + 3} fontSize={7} fill={isDark ? '#94a3b8' : '#475569'} textAnchor="end">{val.toFixed(1)}</text>
        })}

        {/* Axis labels */}
        <text x={padL + plotW / 2} y={vbH - 2} fontSize={8} fill={labelColor} textAnchor="middle">{xLabel}</text>
        <text x={6} y={padT + plotH / 2} fontSize={8} fill={labelColor} textAnchor="middle" transform={'rotate(-90, 6, ' + (padT + plotH / 2) + ')'}>{yLabel}</text>

        {/* Title */}
        <text x={vbW / 2} y={10} fontSize={9} fontWeight={600} fill={labelColor} textAnchor="middle">{title}</text>

        {/* Bar chart */}
        {mode === 'bar' && pts.map((p, i) => {
          const bw = Math.max(4, plotW / (pts.length + 1) * 0.6)
          const bx = toSvgX(p.x) - bw / 2
          const by = toSvgY(p.y)
          const bh = toSvgY(dataYMin) - toSvgY(p.y)
          return <rect key={'bar' + i} x={bx} y={by} width={bw} height={Math.max(0, bh)} fill={accentColor} opacity={0.6} rx={1} />
        })}

        {/* Line chart */}
        {mode === 'line' && pts.length > 1 && (
          <polyline points={polyPoints} fill="none" stroke={accentColor} strokeWidth={1.5} />
        )}

        {/* Best fit line */}
        {showBestFit && pts.length >= 2 && (
          <line
            x1={toSvgX(dataXMin)} y1={toSvgY(bfY1)}
            x2={toSvgX(dataXMax)} y2={toSvgY(bfY2)}
            stroke="#f87171" strokeWidth={1} strokeDasharray="4,3"
          />
        )}

        {/* Data points */}
        {pts.map((p, i) => (
          <circle key={'pt' + i} cx={toSvgX(p.x)} cy={toSvgY(p.y)} r={3} fill={mode === 'scatter' ? accentColor : (isDark ? '#e2e8f0' : '#1e293b')} stroke={accentColor} strokeWidth={1} />
        ))}
      </svg>

      {/* Data inputs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <label style={{ color: s.text, fontSize: 9, display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 100 }}>
          X values:
          <input style={{ ...s.input, width: '100%' }} value={xStr} onChange={e => setXStr(e.target.value)} placeholder="1,2,3,4" />
        </label>
        <label style={{ color: s.text, fontSize: 9, display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 100 }}>
          Y values:
          <input style={{ ...s.input, width: '100%' }} value={yStr} onChange={e => setYStr(e.target.value)} placeholder="2,4,6,8" />
        </label>
      </div>

      {/* Axis labels */}
      <div style={{ display: 'flex', gap: 6 }}>
        <label style={{ color: s.text, fontSize: 9, display: 'flex', gap: 2, alignItems: 'center' }}>
          X-axis: <input style={{ ...s.input, width: 50 }} value={xLabel} onChange={e => setXLabel(e.target.value)} />
        </label>
        <label style={{ color: s.text, fontSize: 9, display: 'flex', gap: 2, alignItems: 'center' }}>
          Y-axis: <input style={{ ...s.input, width: 50 }} value={yLabel} onChange={e => setYLabel(e.target.value)} />
        </label>
      </div>

      {/* Stats */}
      {pts.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 8, color: s.text, borderTop: '1px solid ' + s.border, paddingTop: 4 }}>
          <span>X: min={xMin.toFixed(1)} max={xMax.toFixed(1)} mean={xMean.toFixed(1)}</span>
          <span>Y: min={yMin.toFixed(1)} max={yMax.toFixed(1)} mean={yMean.toFixed(1)}</span>
          {showBestFit && pts.length >= 2 && (
            <span>y = {bestFitSlope.toFixed(2)}x + {bestFitIntercept.toFixed(2)}</span>
          )}
          <span>n = {pts.length}</span>
        </div>
      )}
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: {pts.length} data point{pts.length !== 1 ? 's' : ''} plotted{pts.length > 0 ? `: ${pts.map(p => `(${p.x}, ${p.y})`).join(', ')}` : ' — enter X and Y values above'}</div>
          <div>Step 2: X range: {xMin.toFixed(1)} to {xMax.toFixed(1)} (mean x̄ = {xMean.toFixed(1)}); Y range: {yMin.toFixed(1)} to {yMax.toFixed(1)} (mean ȳ = {yMean.toFixed(1)})</div>
          <div>Step 3: {pts.length >= 2 ? `Slope m = Σ((x−x̄)(y−ȳ)) / Σ((x−x̄)²) = ${bestFitSlope.toFixed(3)}` : 'Need ≥ 2 points to compute slope'}</div>
          <div>Step 4: {pts.length >= 2 ? `y-intercept b = ȳ − m·x̄ = ${yMean.toFixed(2)} − ${bestFitSlope.toFixed(2)} × ${xMean.toFixed(2)} = ${bestFitIntercept.toFixed(3)}` : 'Need ≥ 2 points to compute y-intercept'}</div>
          <div>Step 5: {showBestFit && pts.length >= 2 ? <span>Best-fit equation: y = <b style={{ color: s.accent }}>{bestFitSlope.toFixed(2)}x + {bestFitIntercept.toFixed(2)}</b></span> : 'Toggle "Best Fit" to display the regression line'}</div>
          <div>Step 6: Pattern: {bestFitSlope > 0.01 ? 'increasing (positive slope)' : bestFitSlope < -0.01 ? 'decreasing (negative slope)' : pts.length >= 2 ? 'flat (zero slope)' : '— (need ≥ 2 points)'}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Straight line = constant rate. Curve = changing rate. Steeper slope = faster change. Graphs make relationships visible.
      </div>
</div>
  )
}

// ============================================================
// 12. PushPullPlayground (K-5: Newton's F=ma)
// ============================================================

export function PushPullPlayground({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [force, setForce] = useState(10)
  const [mass, setMass] = useState(5)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [velocity, setVelocity] = useState(0)
  const [position, setPosition] = useState(0)
  const [isPushing, setIsPushing] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [pushElapsed, setPushElapsed] = useState(0)

  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const forceRef = useRef(force); forceRef.current = force
  const massRef = useRef(mass); massRef.current = mass
  const dirRef = useRef(direction); dirRef.current = direction

  const acceleration = force / mass

  const startPush = () => {
    setVelocity(0)
    setPosition(0)
    setPushElapsed(0)
    setIsPushing(true)
    setAnimating(true)
    lastTimeRef.current = 0
  }

  const reset = () => {
    cancelAnimationFrame(animRef.current)
    setAnimating(false)
    setIsPushing(false)
    setVelocity(0)
    setPosition(0)
    setPushElapsed(0)
  }

  useEffect(() => {
    if (!animating) return
    const local = { velocity: 0, position: 0, pushElapsed: 0, isPushing: true }
    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time
      const dt = Math.min(0.05, (time - lastTimeRef.current) / 1000)
      lastTimeRef.current = time

      if (local.isPushing) {
        local.pushElapsed += dt
        const a = forceRef.current / massRef.current
        local.velocity += a * dt * dirRef.current
        if (local.pushElapsed >= 1) {
          local.isPushing = false
          setIsPushing(false)
        }
      }

      local.position += local.velocity * dt
      if (local.position > 10) local.position = -10
      if (local.position < -10) local.position = 10

      setVelocity(local.velocity)
      setPosition(local.position)
      setPushElapsed(local.pushElapsed)

      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [animating])

  // SVG layout
  const svgW = 280, svgH = 130
  const groundY = 100
  const cartW = 50, cartH = 26
  const cartCenterX = 140 + position * 9
  const cartLeft = cartCenterX - cartW / 2
  const cartTop = groundY - cartH
  const wheelR = 5
  const wheel1X = cartLeft + 12
  const wheel2X = cartLeft + cartW - 12

  // Force arrow
  const forceArrowLen = Math.min(70, force * 3.5)
  const forceColor = '#f87171'
  const arrowMidY = groundY - cartH / 2
  let forceX1: number, forceX2: number
  if (direction === 1) {
    forceX1 = cartLeft - forceArrowLen
    forceX2 = cartLeft - 2
  } else {
    forceX1 = cartLeft + cartW + forceArrowLen
    forceX2 = cartLeft + cartW + 2
  }

  // Velocity arrow
  const velArrowLen = Math.min(60, Math.abs(velocity) * 6)
  const velColor = '#34d399'
  const velY = cartTop - 16
  const velCenterX = cartCenterX
  let velX1: number, velX2: number
  if (velocity >= 0) {
    velX1 = velCenterX - velArrowLen / 2
    velX2 = velCenterX + velArrowLen / 2
  } else {
    velX1 = velCenterX + velArrowLen / 2
    velX2 = velCenterX - velArrowLen / 2
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        {/* Ground */}
        <line x1={0} y1={groundY} x2={svgW} y2={groundY} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth={2} />
        {[20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260].map(x => (
          <line key={'h' + x} x1={x} y1={groundY} x2={x - 5} y2={groundY + 6} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth={1} />
        ))}
        {/* Force arrow (when pushing) */}
        {isPushing && (
          <g>
            <line x1={forceX1} y1={arrowMidY} x2={forceX2} y2={arrowMidY} stroke={forceColor} strokeWidth={3} />
            <polygon points={
              forceX2 + ',' + arrowMidY + ' ' +
              (direction === 1 ? forceX2 - 8 : forceX2 + 8) + ',' + (arrowMidY - 4) + ' ' +
              (direction === 1 ? forceX2 - 8 : forceX2 + 8) + ',' + (arrowMidY + 4)
            } fill={forceColor} />
            <text x={(forceX1 + forceX2) / 2} y={arrowMidY - 8} textAnchor="middle" fontSize={10} fontWeight={700} fill={forceColor}>F = {force} N</text>
          </g>
        )}
        {/* Velocity arrow (when moving) */}
        {Math.abs(velocity) > 0.05 && (
          <g>
            <line x1={velX1} y1={velY} x2={velX2} y2={velY} stroke={velColor} strokeWidth={2} />
            <polygon points={
              velX2 + ',' + velY + ' ' +
              (velocity >= 0 ? velX2 - 6 : velX2 + 6) + ',' + (velY - 3) + ' ' +
              (velocity >= 0 ? velX2 - 6 : velX2 + 6) + ',' + (velY + 3)
            } fill={velColor} />
            <text x={velCenterX} y={velY - 5} textAnchor="middle" fontSize={9} fontWeight={700} fill={velColor}>v = {velocity.toFixed(1)} m/s</text>
          </g>
        )}
        {/* Cart body */}
        <rect x={cartLeft} y={cartTop} width={cartW} height={cartH} rx={3} fill={isDark ? '#818cf8' : '#6366f1'} stroke={isDark ? '#a5b4fc' : '#4f46e5'} strokeWidth={1} />
        <rect x={cartLeft + 6} y={cartTop + 4} width={cartW - 12} height={9} fill={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)'} rx={1} />
        {/* Wheels */}
        <circle cx={wheel1X} cy={groundY} r={wheelR} fill={isDark ? '#334155' : '#475569'} stroke={isDark ? '#64748b' : '#334155'} strokeWidth={1} />
        <circle cx={wheel2X} cy={groundY} r={wheelR} fill={isDark ? '#334155' : '#475569'} stroke={isDark ? '#64748b' : '#334155'} strokeWidth={1} />
        <circle cx={wheel1X} cy={groundY} r={2} fill={isDark ? '#94a3b8' : '#cbd5e1'} />
        <circle cx={wheel2X} cy={groundY} r={2} fill={isDark ? '#94a3b8' : '#cbd5e1'} />
      </svg>
      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Force:</span>
          <input type="range" aria-label="Force in Newtons" min={1} max={20} step={1} value={force} onChange={e => setForce(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 40, textAlign: 'right' }}>{force} N</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Mass:</span>
          <input type="range" aria-label="Mass in kilograms" min={1} max={10} step={1} value={mass} onChange={e => setMass(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 40, textAlign: 'right' }}>{mass} kg</span>
        </div>
      </div>
      {/* Direction toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 10, color: s.text }}>Push direction:</span>
        <button style={s.btn(direction === -1)} onClick={() => setDirection(-1)}>← Left</button>
        <button style={s.btn(direction === 1)} onClick={() => setDirection(1)}>Right →</button>
      </div>
      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={startPush} style={{ ...s.btn(true), padding: '4px 10px', fontWeight: 600 }} disabled={animating}>Push!</button>
        <button onClick={reset} style={{ ...s.btn(false), padding: '4px 10px' }}>Reset</button>
        {!animating && (
          <span style={{ fontSize: 10, color: s.text }}>Click "Push!" — force applies for 1 second</span>
        )}
        {animating && isPushing && (
          <span style={{ fontSize: 10, color: '#f87171' }}>Pushing... {pushElapsed.toFixed(1)}s</span>
        )}
        {animating && !isPushing && (
          <span style={{ fontSize: 10, color: s.accent }}>Coasting (no force, constant v)</span>
        )}
      </div>
      {/* Live readouts */}
      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: s.text, flexWrap: 'wrap' }}>
        <span>a = F ÷ m = <b style={{ color: s.bright }}>{acceleration.toFixed(1)} m/s²</b></span>
        <span>v = <b style={{ color: s.accent }}>{velocity.toFixed(1)} m/s</b></span>
      </div>
      {/* Dynamic step-by-step */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Applied force F = <b style={{ color: '#f87171' }}>{force} N</b> to the {direction === 1 ? 'right →' : '← left'}</div>
        <div>Step 2: Cart mass m = <b style={{ color: s.bright }}>{mass} kg</b></div>
        <div>Step 3: Newton's 2nd Law: a = F ÷ m = {force} ÷ {mass} = <b style={{ color: s.accent }}>{acceleration.toFixed(1)} m/s²</b></div>
        <div>Step 4: After 1 second of pushing, v = a × t = {acceleration.toFixed(1)} × 1 = <b style={{ color: s.accent }}>{acceleration.toFixed(1)} m/s</b></div>
        <div>Step 5: {isPushing ? 'Force still applied — cart is accelerating' : animating ? "Force removed — cart coasts at constant velocity (Newton's 1st Law)" : 'Click "Push!" to start'}</div>
        <div>Step 6: Bigger force = more acceleration; bigger mass = less acceleration (F = ma)</div>
      </div>
      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Force doesn't cause velocity — it causes acceleration (a CHANGE in velocity). When the push stops, the cart keeps moving at whatever speed it reached. This is Newton's First Law: objects in motion stay in motion unless a force stops them.
      </div>
    </div>
  )
}

// ============================================================
// 13. SoundWaveMaker (K-5: Sound is vibration)
// ============================================================

export function SoundWaveMaker({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [tension, setTension] = useState(7)
  const [thickness, setThickness] = useState(2)
  const [plucked, setPlucked] = useState(false)
  const [amplitude, setAmplitude] = useState(0)
  const [phase, setPhase] = useState(0)

  const animRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const tensionRef = useRef(tension); tensionRef.current = tension
  const thicknessRef = useRef(thickness); thicknessRef.current = thickness

  const frequency = (tension / thickness) * 50
  const maxAmp = 20 + tension * 2

  let pitchLabel = 'Very low pitch'
  if (frequency >= 400) pitchLabel = 'Very high pitch'
  else if (frequency >= 300) pitchLabel = 'High pitch'
  else if (frequency >= 200) pitchLabel = 'Medium pitch'
  else if (frequency >= 100) pitchLabel = 'Low-medium pitch'
  else pitchLabel = 'Very low pitch'

  const pluck = () => {
    setPlucked(true)
    setAmplitude(maxAmp)
    startTimeRef.current = 0
    setPhase(0)
  }

  useEffect(() => {
    if (!plucked) return
    const animate = (time: number) => {
      if (startTimeRef.current === 0) startTimeRef.current = time
      const elapsed = (time - startTimeRef.current) / 1000
      const t = tensionRef.current
      const th = thicknessRef.current
      const f = (t / th) * 50
      const newPhase = 2 * Math.PI * f * elapsed
      const decay = Math.exp(-elapsed * 1.5)
      const newAmp = (20 + t * 2) * decay
      setPhase(newPhase)
      setAmplitude(newAmp)
      if (newAmp < 0.3) {
        setPlucked(false)
        setAmplitude(0)
        return
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [plucked])

  // SVG layout
  const svgW = 280, svgH = 170
  const stringY = 40
  const stringLeft = 18, stringRight = svgW - 18
  const stringLen = stringRight - stringLeft
  const oscTop = 90, oscBottom = 155
  const oscLeft = 15, oscRight = svgW - 15
  const oscMidY = (oscTop + oscBottom) / 2

  const stringPath = useMemo(() => {
    const pts: string[] = []
    const numPts = 60
    for (let i = 0; i <= numPts; i++) {
      const x = stringLeft + (i / numPts) * stringLen
      const localT = i / numPts
      const y = stringY - amplitude * Math.sin(Math.PI * localT) * Math.cos(phase)
      pts.push(x.toFixed(1) + ',' + y.toFixed(1))
    }
    return 'M ' + pts.join(' L ')
  }, [amplitude, phase, stringY, stringLeft, stringLen])

  const oscPath = useMemo(() => {
    const pts: string[] = []
    const oscW = oscRight - oscLeft
    const numPts = 100
    for (let i = 0; i <= numPts; i++) {
      const x = oscLeft + (i / numPts) * oscW
      const oscY = oscMidY - amplitude * Math.sin(phase - i * 0.3)
      pts.push(x.toFixed(1) + ',' + oscY.toFixed(1))
    }
    return 'M ' + pts.join(' L ')
  }, [amplitude, phase, oscLeft, oscRight, oscMidY])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        {/* String label */}
        <text x={svgW / 2} y={14} textAnchor="middle" fontSize={9} fill={s.text}>Vibrating String</text>
        {/* Anchor mounts */}
        <rect x={stringLeft - 9} y={stringY - 10} width={9} height={20} fill={isDark ? '#334155' : '#cbd5e1'} rx={1} />
        <rect x={stringRight} y={stringY - 10} width={9} height={20} fill={isDark ? '#334155' : '#cbd5e1'} rx={1} />
        {/* String anchors */}
        <circle cx={stringLeft} cy={stringY} r={4} fill={isDark ? '#64748b' : '#475569'} />
        <circle cx={stringRight} cy={stringY} r={4} fill={isDark ? '#64748b' : '#475569'} />
        {/* String */}
        <path d={stringPath} fill="none" stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth={2} />
        {/* String thickness indicator (visual width) */}
        <path d={'M ' + stringLeft + ' ' + (stringY + 20 + thickness) + ' L ' + stringRight + ' ' + (stringY + 20 + thickness)} fill="none" stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={thickness * 0.8} opacity={0.5} />

        {/* Oscilloscope label */}
        <text x={oscLeft + 4} y={oscTop - 4} fontSize={9} fill={s.text}>Oscilloscope (sound wave)</text>
        {/* Oscilloscope border */}
        <rect x={oscLeft} y={oscTop} width={oscRight - oscLeft} height={oscBottom - oscTop} fill={isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.04)'} stroke={s.border} strokeWidth={1} rx={2} />
        {/* Center axis */}
        <line x1={oscLeft} y1={oscMidY} x2={oscRight} y2={oscMidY} stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} strokeWidth={0.5} strokeDasharray="3,3" />
        {/* Oscilloscope wave */}
        <path d={oscPath} fill="none" stroke={isDark ? '#34d399' : '#059669'} strokeWidth={1.5} />
      </svg>
      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Tension:</span>
          <input type="range" aria-label="Tension in Newtons" min={1} max={10} step={1} value={tension} onChange={e => setTension(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 30, textAlign: 'right' }}>{tension}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Thickness:</span>
          <input type="range" aria-label="String thickness in millimeters" min={1} max={5} step={1} value={thickness} onChange={e => setThickness(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 30, textAlign: 'right' }}>{thickness}</span>
        </div>
      </div>
      {/* Pluck button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={pluck} style={{ ...s.btn(true), padding: '4px 10px', fontWeight: 600 }} disabled={plucked}>
          🎸 Pluck String
        </button>
        {plucked && <span style={{ fontSize: 10, color: s.accent }}>String vibrating...</span>}
      </div>
      {/* Readouts */}
      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: s.text, flexWrap: 'wrap' }}>
        <span>Frequency: <b style={{ color: s.accent }}>{frequency.toFixed(0)} Hz</b></span>
        <span>Pitch: <b style={{ color: s.bright }}>{pitchLabel}</b></span>
        <span>Amplitude: <b style={{ color: s.bright }}>{amplitude.toFixed(1)}</b></span>
      </div>
      {/* Dynamic step-by-step */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: String tension = <b style={{ color: s.bright }}>{tension}</b> (higher = tighter = higher pitch)</div>
        <div>Step 2: String thickness = <b style={{ color: s.bright }}>{thickness}</b> (thicker = heavier = lower pitch)</div>
        <div>Step 3: Frequency f ∝ tension ÷ thickness = {tension} ÷ {thickness} = <b style={{ color: s.accent }}>{frequency.toFixed(0)} Hz</b></div>
        <div>Step 4: This frequency is the pitch — <b style={{ color: s.bright }}>{pitchLabel}</b> ({frequency.toFixed(0)} Hz)</div>
        <div>Step 5: Amplitude = how far the string moves = loudness (current: {amplitude.toFixed(1)})</div>
        <div>Step 6: Sound = vibrating string pushes air molecules in waves to your ear</div>
      </div>
      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Sound is a vibration. Tight thin strings vibrate fast (high pitch) — that's why guitar strings for high notes are thin. Thick loose strings vibrate slowly (low pitch) — like bass strings. The vibration pushes air molecules into waves that travel to your ear.
      </div>
    </div>
  )
}

// ============================================================
// 14. LightAndShadow (K-5: Shadows and light blocking)
// ============================================================

export function LightAndShadow({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [objSize, setObjSize] = useState(3)
  const [lightHeight, setLightHeight] = useState(3)
  const [distance, setDistance] = useState(120)
  const [dragging, setDragging] = useState(false)
  const svgRef = useRef<SVGSVGElement | null>(null)

  // SVG layout
  const svgW = 280, svgH = 150
  const lightX = 35, lightY = svgH / 2
  const wallX = 255
  const wallTop = 20, wallBottom = 130
  const objCenterX = lightX + distance
  const objHalf = objSize * 5

  // Shadow geometry
  const shadowSpread = (6 - lightHeight) / 5 + 0.5
  const distToWall = wallX - objCenterX
  const shadowHalf = objHalf * (1 + distToWall / distance) * shadowSpread
  const shadowTopY = lightY - shadowHalf
  const shadowBottomY = lightY + shadowHalf

  const handlePointerDown = (e: React.PointerEvent<SVGElement>) => {
    e.preventDefault()
    setDragging(true)
  }
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const xInSvg = ((e.clientX - rect.left) / rect.width) * svgW
    const newDistance = Math.max(40, Math.min(wallX - lightX - 30, xInSvg - lightX))
    setDistance(newDistance)
  }
  const handlePointerUp = () => setDragging(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg
        ref={svgRef}
        viewBox={'0 0 ' + svgW + ' ' + svgH}
        style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border, touchAction: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Wall */}
        <rect x={wallX} y={wallTop} width={6} height={wallBottom - wallTop} fill={isDark ? '#475569' : '#cbd5e1'} />
        <text x={wallX + 3} y={wallBottom + 14} textAnchor="middle" fontSize={9} fill={s.text}>Wall</text>

        {/* Shadow on wall */}
        <rect x={wallX} y={Math.max(wallTop, shadowTopY)} width={6} height={Math.min(wallBottom, shadowBottomY) - Math.max(wallTop, shadowTopY)} fill="#1e293b" opacity={0.75} />

        {/* Light rays */}
        <line x1={lightX} y1={lightY} x2={wallX} y2={shadowTopY} stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth={0.8} strokeDasharray="3,2" opacity={0.7} />
        <line x1={lightX} y1={lightY} x2={wallX} y2={shadowBottomY} stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth={0.8} strokeDasharray="3,2" opacity={0.7} />
        <text x={(lightX + wallX) / 2} y={Math.max(15, shadowTopY - 4)} textAnchor="middle" fontSize={8} fill={isDark ? '#fbbf24' : '#d97706'}>light rays</text>

        {/* Light source — bigger glow when higher light */}
        <circle cx={lightX} cy={lightY} r={10 + lightHeight * 2} fill={isDark ? '#fde68a' : '#fbbf24'} opacity={0.2} />
        <circle cx={lightX} cy={lightY} r={7} fill={isDark ? '#fde68a' : '#fbbf24'} />
        <line x1={lightX - 8} y1={lightY} x2={lightX - 16} y2={lightY} stroke={isDark ? '#fde68a' : '#fbbf24'} strokeWidth={1.5} />
        <text x={lightX} y={lightY + 26} textAnchor="middle" fontSize={9} fill={s.text}>Light</text>

        {/* Object (draggable) */}
        <g style={{ cursor: dragging ? 'grabbing' : 'grab' }} onPointerDown={handlePointerDown}>
          <rect
            x={objCenterX - 8}
            y={lightY - objHalf}
            width={16}
            height={objHalf * 2}
            rx={2}
            fill={isDark ? '#818cf8' : '#6366f1'}
            stroke={isDark ? '#a5b4fc' : '#4f46e5'}
            strokeWidth={1.5}
          />
          <text x={objCenterX} y={lightY + objHalf + 14} textAnchor="middle" fontSize={8} fill={s.text}>drag me ↔</text>
        </g>
      </svg>
      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Object size:</span>
          <input type="range" aria-label="Object size" min={1} max={5} step={1} value={objSize} onChange={e => setObjSize(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 30, textAlign: 'right' }}>{objSize}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Light height:</span>
          <input type="range" aria-label="Light source height" min={1} max={5} step={1} value={lightHeight} onChange={e => setLightHeight(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 30, textAlign: 'right' }}>{lightHeight}</span>
        </div>
      </div>
      {/* Readouts */}
      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: s.text, flexWrap: 'wrap' }}>
        <span>Distance from light: <b style={{ color: s.bright }}>{distance.toFixed(0)}</b> units</span>
        <span>Shadow size: <b style={{ color: s.accent }}>{(shadowHalf * 2).toFixed(0)}</b> units</span>
      </div>
      {/* Dynamic step-by-step */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Light source on the left, object at distance <b style={{ color: s.bright }}>{distance.toFixed(0)}</b> from light</div>
        <div>Step 2: Object size = <b style={{ color: s.bright }}>{objSize}</b> units, light height = <b style={{ color: s.bright }}>{lightHeight}</b></div>
        <div>Step 3: Light rays travel outward — they hit the object and get blocked</div>
        <div>Step 4: Behind the object, no light reaches the wall → shadow forms</div>
        <div>Step 5: Shadow size = <b style={{ color: s.accent }}>{(shadowHalf * 2).toFixed(0)}</b> units (bigger when object is closer to light)</div>
        <div>Step 6: Closer to light = bigger shadow because light spreads more by the time it reaches the object</div>
      </div>
      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Shadows form when something blocks light. The closer an object is to the light, the bigger its shadow — because light spreads out from the source, so the object blocks a wider cone of rays. This is exactly how solar and lunar eclipses work!
      </div>
    </div>
  )
}

// ============================================================
// 15. GravityDrop (K-5: Galileo's falling objects)
// ============================================================

interface DropObject {
  id: string
  label: string
  mass: number
  dragCoef: number
  color: string
  radius: number
}

const DROP_OBJECTS: DropObject[] = [
  { id: 'feather', label: 'Feather', mass: 0.01, dragCoef: 0.7, color: '#fbbf24', radius: 8 },
  { id: 'tennis', label: 'Tennis Ball', mass: 0.058, dragCoef: 0.2, color: '#a3e635', radius: 12 },
  { id: 'bowling', label: 'Bowling Ball', mass: 7, dragCoef: 0.03, color: '#6366f1', radius: 16 },
  { id: 'same', label: 'Same Mass', mass: 1, dragCoef: 0.1, color: '#f87171', radius: 12 },
]

export function GravityDrop({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [obj1Id, setObj1Id] = useState('feather')
  const [obj2Id, setObj2Id] = useState('bowling')
  const [airOn, setAirOn] = useState(false)
  const [dropping, setDropping] = useState(false)
  const [ball1Y, setBall1Y] = useState(0)
  const [ball2Y, setBall2Y] = useState(0)
  const [landed1, setLanded1] = useState(false)
  const [landed2, setLanded2] = useState(false)
  const [landed1Time, setLanded1Time] = useState(0)
  const [landed2Time, setLanded2Time] = useState(0)

  const animRef = useRef<number>(0)
  const obj1Ref = useRef(obj1Id); obj1Ref.current = obj1Id
  const obj2Ref = useRef(obj2Id); obj2Ref.current = obj2Id
  const airRef = useRef(airOn); airRef.current = airOn

  const obj1 = DROP_OBJECTS.find(o => o.id === obj1Id)!
  const obj2 = DROP_OBJECTS.find(o => o.id === obj2Id)!

  // SVG layout
  const svgW = 280, svgH = 180
  const groundY = 155
  const startY = 18
  const ball1X = 90
  const ball2X = 190
  const fallDist = groundY - startY

  const startDrop = () => {
    setBall1Y(0)
    setBall2Y(0)
    setLanded1(false)
    setLanded2(false)
    setLanded1Time(0)
    setLanded2Time(0)
    setDropping(true)
  }

  const reset = () => {
    cancelAnimationFrame(animRef.current)
    setDropping(false)
    setBall1Y(0)
    setBall2Y(0)
    setLanded1(false)
    setLanded2(false)
    setLanded1Time(0)
    setLanded2Time(0)
  }

  useEffect(() => {
    if (!dropping) return
    const o1 = DROP_OBJECTS.find(o => o.id === obj1Ref.current)!
    const o2 = DROP_OBJECTS.find(o => o.id === obj2Ref.current)!
    const air = airRef.current
    const a1 = 9.8 * (air ? (1 - o1.dragCoef) : 1) // m/s²
    const a2 = 9.8 * (air ? (1 - o2.dragCoef) : 1)
    const scale = fallDist / 5 // pixels per meter (5m fall)
    const a1Px = a1 * scale
    const a2Px = a2 * scale

    let startT = 0
    let l1 = false, l2 = false

    const animate = (time: number) => {
      if (startT === 0) startT = time
      const elapsed = (time - startT) / 1000

      const p1 = Math.min(fallDist, 0.5 * a1Px * elapsed * elapsed)
      const p2 = Math.min(fallDist, 0.5 * a2Px * elapsed * elapsed)
      setBall1Y(p1)
      setBall2Y(p2)

      if (p1 >= fallDist && !l1) {
        l1 = true
        setLanded1(true)
        setLanded1Time(elapsed)
      }
      if (p2 >= fallDist && !l2) {
        l2 = true
        setLanded2(true)
        setLanded2Time(elapsed)
      }

      if (l1 && l2) {
        setTimeout(() => setDropping(false), 400)
        return
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [dropping, fallDist])

  // Result message
  let resultMsg = ''
  if (landed1 && landed2) {
    if (Math.abs(landed1Time - landed2Time) < 0.05) {
      resultMsg = '✓ Both landed at the SAME time (' + landed1Time.toFixed(2) + 's)'
    } else if (landed1Time < landed2Time) {
      resultMsg = obj1.label + ' landed first (' + landed1Time.toFixed(2) + 's), ' + obj2.label + ' later (' + landed2Time.toFixed(2) + 's)'
    } else {
      resultMsg = obj2.label + ' landed first (' + landed2Time.toFixed(2) + 's), ' + obj1.label + ' later (' + landed1Time.toFixed(2) + 's)'
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        {/* Vacuum / air indicator background */}
        <rect x={0} y={0} width={svgW} height={svgH} fill={airOn ? 'rgba(147,197,253,0.05)' : 'rgba(0,0,0,0)'} />
        {/* Ground */}
        <line x1={0} y1={groundY} x2={svgW} y2={groundY} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth={2} />
        {[20, 60, 100, 140, 180, 220, 260].map(x => (
          <line key={'h' + x} x1={x} y1={groundY} x2={x - 5} y2={groundY + 6} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth={1} />
        ))}
        {/* Starting line */}
        <line x1={20} y1={startY} x2={svgW - 20} y2={startY} stroke={isDark ? '#64748b' : '#cbd5e1'} strokeWidth={1} strokeDasharray="3,3" />
        <text x={22} y={startY - 3} fontSize={8} fill={s.text}>drop line</text>

        {/* Ball 1 */}
        <circle cx={ball1X} cy={startY + ball1Y + obj1.radius} r={obj1.radius} fill={obj1.color} stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'} strokeWidth={1} />
        <text x={ball1X} y={groundY + 14} textAnchor="middle" fontSize={9} fill={s.bright} fontWeight={600}>{obj1.label}</text>

        {/* Ball 2 */}
        <circle cx={ball2X} cy={startY + ball2Y + obj2.radius} r={obj2.radius} fill={obj2.color} stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'} strokeWidth={1} />
        <text x={ball2X} y={groundY + 14} textAnchor="middle" fontSize={9} fill={s.bright} fontWeight={600}>{obj2.label}</text>

        {/* Landing checkmarks */}
        {landed1 && <text x={ball1X} y={startY - 3} textAnchor="middle" fontSize={14} fill={s.accent}>✓</text>}
        {landed2 && <text x={ball2X} y={startY - 3} textAnchor="middle" fontSize={14} fill={s.accent}>✓</text>}

        {/* Environment label */}
        <text x={svgW - 8} y={14} textAnchor="end" fontSize={9} fill={airOn ? '#60a5fa' : s.text} fontWeight={600}>
          {airOn ? '☁ Air ON' : '◯ Vacuum'}
        </text>
      </svg>
      {/* Object selectors */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 100 }}>
          <span style={{ fontSize: 10, color: s.text }}>Object 1:</span>
          <select value={obj1Id} onChange={e => setObj1Id(e.target.value)} style={s.select} disabled={dropping}>
            {DROP_OBJECTS.map(o => <option key={o.id} value={o.id}>{o.label} ({o.mass} kg)</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 100 }}>
          <span style={{ fontSize: 10, color: s.text }}>Object 2:</span>
          <select value={obj2Id} onChange={e => setObj2Id(e.target.value)} style={s.select} disabled={dropping}>
            {DROP_OBJECTS.map(o => <option key={o.id} value={o.id}>{o.label} ({o.mass} kg)</option>)}
          </select>
        </label>
      </div>
      {/* Air toggle and buttons */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button style={s.btn(!airOn)} onClick={() => setAirOn(false)} disabled={dropping}>◯ Vacuum</button>
        <button style={s.btn(airOn)} onClick={() => setAirOn(true)} disabled={dropping}>☁ Air</button>
        <button onClick={startDrop} style={{ ...s.btn(true), padding: '4px 10px', fontWeight: 600 }} disabled={dropping}>Drop!</button>
        <button onClick={reset} style={{ ...s.btn(false), padding: '4px 10px' }}>Reset</button>
      </div>
      {/* Result message */}
      {resultMsg && (
        <div style={{ fontSize: 11, fontWeight: 700, color: Math.abs(landed1Time - landed2Time) < 0.05 ? s.accent : '#fbbf24', padding: '4px 8px', background: 'rgba(5,150,105,0.08)', borderRadius: 4 }}>
          {resultMsg}
        </div>
      )}
      {/* Dynamic step-by-step */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Objects: <b style={{ color: s.bright }}>{obj1.label}</b> ({obj1.mass} kg) and <b style={{ color: s.bright }}>{obj2.label}</b> ({obj2.mass} kg)</div>
        <div>Step 2: Environment: <b style={{ color: airOn ? '#60a5fa' : s.bright }}>{airOn ? 'With air resistance' : 'Vacuum (no air)'}</b></div>
        <div>Step 3: Gravity accelerates both at g = <b style={{ color: s.bright }}>9.8 m/s²</b> (same for ALL masses)</div>
        <div>Step 4: {airOn ? 'Air pushes up on objects, slowing them down — more drag = more slowing' : 'No air = nothing slows either object'}</div>
        <div>Step 5: {airOn
          ? (Math.abs(obj1.dragCoef - obj2.dragCoef) < 0.001
            ? 'Same drag = both fall at the same rate'
            : (obj1.dragCoef > obj2.dragCoef
              ? obj1.label + ' falls slower (more air resistance)'
              : obj2.label + ' falls slower (more air resistance)'))
          : 'Both hit the ground at the SAME time'}</div>
        <div>Step 6: Galileo discovered: mass doesn't affect falling speed in vacuum (confirmed on the Moon, 1971)</div>
      </div>
      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Gravity pulls ALL objects down at the same rate — no matter how heavy! A feather and a bowling ball fall together in a vacuum. On Earth, air slows down light things (like feathers) so they seem to fall slower. In 1971, astronaut David Scott dropped a hammer and feather on the Moon (no air) — they hit the ground together!
      </div>
    </div>
  )
}

// ============================================================
// 16. FrictionRamp (K-5: Friction and sliding)
// ============================================================

interface Surface {
  id: string
  label: string
  mu: number
  color: string
}

const SURFACES: Surface[] = [
  { id: 'ice', label: 'Ice', mu: 0.05, color: '#bae6fd' },
  { id: 'wood', label: 'Wood', mu: 0.3, color: '#d4a574' },
  { id: 'carpet', label: 'Carpet', mu: 0.5, color: '#f9a8d4' },
  { id: 'rubber', label: 'Rubber', mu: 0.8, color: '#1f2937' },
]

export function FrictionRamp({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [angle, setAngle] = useState(20)
  const [surfaceId, setSurfaceId] = useState('wood')
  const [released, setReleased] = useState(false)
  const [puckPos, setPuckPos] = useState(1)
  const [animating, setAnimating] = useState(false)
  const [puckShake, setPuckShake] = useState(0)

  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const angleRef = useRef(angle); angleRef.current = angle
  const surfaceRef = useRef(surfaceId); surfaceRef.current = surfaceId

  const surface = SURFACES.find(sf => sf.id === surfaceId)!
  const mu = surface.mu
  const angleRad = angle * Math.PI / 180
  const slides = Math.tan(angleRad) > mu
  const gravComponent = Math.sin(angleRad)
  const frictionComponent = mu * Math.cos(angleRad)

  const release = () => {
    setReleased(true)
    setPuckPos(1)
    setPuckShake(0)
    if (slides) {
      setAnimating(true)
      lastTimeRef.current = 0
    } else {
      // Shake puck briefly to show it tried to move but friction held it
      let shakeCount = 0
      const shake = () => {
        setPuckShake(shakeCount % 2 === 0 ? 2 : -2)
        shakeCount++
        if (shakeCount < 6) {
          setTimeout(shake, 80)
        } else {
          setPuckShake(0)
        }
      }
      shake()
    }
  }

  const reset = () => {
    cancelAnimationFrame(animRef.current)
    setAnimating(false)
    setReleased(false)
    setPuckPos(1)
    setPuckShake(0)
  }

  useEffect(() => {
    if (!animating) return
    const local = { puckPos: 1, puckVel: 0 }
    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time
      const dt = Math.min(0.04, (time - lastTimeRef.current) / 1000)
      lastTimeRef.current = time

      const ang = angleRef.current * Math.PI / 180
      const sf = SURFACES.find(s2 => s2.id === surfaceRef.current)!
      const mu2 = sf.mu
      const a = (Math.sin(ang) - mu2 * Math.cos(ang)) * 9.8 // m/s² along ramp
      const aScale = 0.5 // visualization scale (puckPos per (m/s²·s²))
      local.puckVel += a * aScale * dt
      local.puckPos = Math.max(0, local.puckPos - local.puckVel * dt)
      setPuckPos(local.puckPos)
      if (local.puckPos <= 0) {
        setAnimating(false)
        return
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [animating])

  // SVG layout
  const svgW = 280, svgH = 180
  const groundY = 160
  const pivotX = 40, pivotY = groundY
  const rampLen = 180
  const rampEndX = pivotX + rampLen * Math.cos(angleRad)
  const rampEndY = pivotY - rampLen * Math.sin(angleRad)
  // Puck position on ramp
  const puckSize = 12
  const puckDist = puckPos * (rampLen - 20)
  const puckCenterX = pivotX + puckDist * Math.cos(angleRad) + puckSize * Math.sin(angleRad)
  const puckCenterY = pivotY - puckDist * Math.sin(angleRad) - puckSize * Math.cos(angleRad)
  const shakeOffset = puckShake
  const puckDisplayX = puckCenterX + shakeOffset * Math.sin(angleRad)
  const puckDisplayY = puckCenterY - shakeOffset * Math.cos(angleRad)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        {/* Ground */}
        <line x1={0} y1={groundY} x2={svgW} y2={groundY} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth={2} />
        {[20, 60, 100, 140, 180, 220, 260].map(x => (
          <line key={'h' + x} x1={x} y1={groundY} x2={x - 5} y2={groundY + 6} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth={1} />
        ))}
        {/* Ramp (filled triangle) */}
        <polygon
          points={pivotX + ',' + pivotY + ' ' + rampEndX.toFixed(1) + ',' + rampEndY.toFixed(1) + ' ' + rampEndX.toFixed(1) + ',' + pivotY}
          fill={surface.color}
          opacity={isDark ? 0.5 : 0.7}
          stroke={isDark ? '#94a3b8' : '#475569'}
          strokeWidth={1.5}
        />
        {/* Angle indicator arc */}
        {angle > 2 && (
          <>
            <path
              d={'M ' + (pivotX + 28) + ' ' + pivotY + ' A 28 28 0 0 0 ' + (pivotX + 28 * Math.cos(angleRad)).toFixed(1) + ' ' + (pivotY - 28 * Math.sin(angleRad)).toFixed(1)}
              fill="none"
              stroke={isDark ? '#fbbf24' : '#d97706'}
              strokeWidth={1.5}
            />
            <text x={pivotX + 32} y={pivotY - 8} fontSize={10} fontWeight={700} fill={isDark ? '#fbbf24' : '#d97706'}>{angle}°</text>
          </>
        )}
        {/* Puck */}
        <circle cx={puckDisplayX.toFixed(1)} cy={puckDisplayY.toFixed(1)} r={puckSize} fill={isDark ? '#818cf8' : '#6366f1'} stroke={isDark ? '#a5b4fc' : '#4f46e5'} strokeWidth={1.5} />
        <text x={puckDisplayX.toFixed(1)} y={(puckDisplayY + 3).toFixed(1)} textAnchor="middle" fontSize={9} fontWeight={700} fill="white">P</text>
        {/* Surface label on ramp */}
        <text x={((pivotX + rampEndX) / 2).toFixed(1)} y={(pivotY - 6).toFixed(1)} textAnchor="middle" fontSize={9} fill={isDark ? '#e2e8f0' : '#1e293b'} fontWeight={600}>{surface.label}</text>
      </svg>
      {/* Angle slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Ramp angle:</span>
        <input type="range" aria-label="Incline angle in degrees" min={0} max={45} step={1} value={angle} onChange={e => { setAngle(Number(e.target.value)); reset() }} style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: s.bright, minWidth: 40, textAlign: 'right' }}>{angle}°</span>
      </div>
      {/* Surface type buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: s.text }}>Surface:</span>
        {SURFACES.map(surf => (
          <button key={surf.id} style={s.btn(surfaceId === surf.id)} onClick={() => { setSurfaceId(surf.id); reset() }}>
            {surf.label}
          </button>
        ))}
      </div>
      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={release} style={{ ...s.btn(true), padding: '4px 10px', fontWeight: 600 }} disabled={released && (animating || puckShake !== 0)}>Release!</button>
        <button onClick={reset} style={{ ...s.btn(false), padding: '4px 10px' }}>Reset</button>
      </div>
      {/* Readouts */}
      <div style={{ display: 'flex', gap: 10, fontSize: 10, color: s.text, flexWrap: 'wrap' }}>
        <span>μ = <b style={{ color: s.bright }}>{mu}</b></span>
        <span>sin({angle}°) = <b style={{ color: '#f87171' }}>{gravComponent.toFixed(2)}</b></span>
        <span>μ·cos({angle}°) = <b style={{ color: s.accent }}>{frictionComponent.toFixed(2)}</b></span>
      </div>
      {released && (
        <div style={{ fontSize: 11, fontWeight: 700, color: slides ? s.accent : '#f87171', padding: '4px 8px', background: slides ? 'rgba(5,150,105,0.08)' : 'rgba(248,113,113,0.08)', borderRadius: 4 }}>
          {slides ? (animating ? 'Sliding...' : '✓ Puck slid down the ramp!') : '✓ Puck stayed put — friction holds!'}
        </div>
      )}
      {/* Dynamic step-by-step */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Ramp angle = <b style={{ color: s.bright }}>{angle}°</b>, surface = <b style={{ color: s.bright }}>{surface.label}</b></div>
        <div>Step 2: Friction coefficient μ = <b style={{ color: s.bright }}>{mu}</b> (higher = more grip)</div>
        <div>Step 3: Gravity pulls puck down ramp with force ∝ sin({angle}°) = <b style={{ color: '#f87171' }}>{gravComponent.toFixed(2)}</b></div>
        <div>Step 4: Friction holds puck with force ∝ μ × cos({angle}°) = <b style={{ color: s.accent }}>{frictionComponent.toFixed(2)}</b></div>
        <div>Step 5: {slides
          ? <span style={{ color: s.accent, fontWeight: 600 }}>Gravity wins — puck slides down!</span>
          : <span style={{ color: '#f87171', fontWeight: 600 }}>Friction wins — puck stays put!</span>}</div>
        <div>Step 6: Steeper angle or lower friction = more likely to slide</div>
      </div>
      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Friction is a force that opposes motion. Rough surfaces (rubber, carpet) have lots of friction; smooth surfaces (ice) have little. Steeper ramps make gravity pull harder along the slope, so things slide more easily. The "tipping point" is when gravity overcomes friction.
      </div>
    </div>
  )
}

// ============================================================
// 12. MomentumCollisionsExplorer (HS Physics)
// ============================================================

export function MomentumCollisionsExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [m1, setM1] = useState(2)
  const [m2, setM2] = useState(3)
  const [v1, setV1] = useState(5)
  const [v2, setV2] = useState(-2)
  const [elastic, setElastic] = useState(true)
  const [animTime, setAnimTime] = useState(0)
  const [running, setRunning] = useState(false)

  const animRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const m1Ref = useRef(m1); m1Ref.current = m1
  const m2Ref = useRef(m2); m2Ref.current = m2
  const v1Ref = useRef(v1); v1Ref.current = v1
  const v2Ref = useRef(v2); v2Ref.current = v2
  const elasticRef = useRef(elastic); elasticRef.current = elastic

  // Conservation math (live values)
  const pBefore = m1 * v1 + m2 * v2
  const keBefore = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2
  let v1f = 0, v2f = 0
  if (elastic) {
    v1f = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2)
    v2f = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2)
  } else {
    const vf = (m1 * v1 + m2 * v2) / (m1 + m2)
    v1f = vf
    v2f = vf
  }
  const pAfter = m1 * v1f + m2 * v2f
  const keAfter = 0.5 * m1 * v1f * v1f + 0.5 * m2 * v2f * v2f

  // SVG layout
  const svgW = 280
  const svgH = 130
  const trackY = 80
  const x1Init = 50
  const x2Init = 230
  const r1 = 7 + m1 * 1.3
  const r2 = 7 + m2 * 1.3
  const vScale = 6

  // Collision time
  let tCollision = Infinity
  if (v1 > v2) {
    const dx = x2Init - x1Init - r1 - r2
    if (dx > 0) tCollision = dx / ((v1 - v2) * vScale)
  }

  // Positions at current animTime
  let x1Pos = x1Init, x2Pos = x2Init
  const hasCollided = animTime >= tCollision && isFinite(tCollision)
  if (animTime > 0) {
    if (!hasCollided) {
      x1Pos = x1Init + v1 * animTime * vScale
      x2Pos = x2Init + v2 * animTime * vScale
    } else {
      const x1c = x1Init + v1 * tCollision * vScale
      const x2c = x2Init + v2 * tCollision * vScale
      x1Pos = x1c + v1f * (animTime - tCollision) * vScale
      x2Pos = x2c + v2f * (animTime - tCollision) * vScale
    }
  }

  const run = () => {
    setAnimTime(0)
    startTimeRef.current = 0
    setRunning(true)
  }
  const reset = () => {
    setRunning(false)
    setAnimTime(0)
  }

  useEffect(() => {
    if (!running) return
    const animate = (time: number) => {
      if (startTimeRef.current === 0) startTimeRef.current = time
      const elapsed = (time - startTimeRef.current) / 1000
      const _m1 = m1Ref.current, _m2 = m2Ref.current
      const _v1 = v1Ref.current, _v2 = v2Ref.current
      const _elastic = elasticRef.current
      const _r1 = 7 + _m1 * 1.3, _r2 = 7 + _m2 * 1.3
      let _v1f = 0, _v2f = 0
      if (_elastic) {
        _v1f = ((_m1 - _m2) * _v1 + 2 * _m2 * _v2) / (_m1 + _m2)
        _v2f = ((_m2 - _m1) * _v2 + 2 * _m1 * _v1) / (_m1 + _m2)
      } else {
        const _vf = (_m1 * _v1 + _m2 * _v2) / (_m1 + _m2)
        _v1f = _vf; _v2f = _vf
      }
      let _tCol = Infinity
      if (_v1 > _v2) {
        const dx = x2Init - x1Init - _r1 - _r2
        if (dx > 0) _tCol = dx / ((_v1 - _v2) * vScale)
      }
      let x1Now: number, x2Now: number
      if (elapsed >= _tCol && isFinite(_tCol)) {
        const x1c = x1Init + _v1 * _tCol * vScale
        const x2c = x2Init + _v2 * _tCol * vScale
        x1Now = x1c + _v1f * (elapsed - _tCol) * vScale
        x2Now = x2c + _v2f * (elapsed - _tCol) * vScale
      } else {
        x1Now = x1Init + _v1 * elapsed * vScale
        x2Now = x2Init + _v2 * elapsed * vScale
      }
      if (elapsed > 3 || x1Now < -30 || x2Now > svgW + 30) {
        setRunning(false)
        return
      }
      setAnimTime(elapsed)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [running])

  const ball1Color = isDark ? '#60a5fa' : '#3b82f6'
  const ball2Color = isDark ? '#f472b6' : '#ec4899'
  const trackColor = isDark ? '#334155' : '#cbd5e1'
  const maxR = Math.max(r1, r2)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        <line x1={10} y1={trackY + maxR + 4} x2={svgW - 10} y2={trackY + maxR + 4} stroke={trackColor} strokeWidth={2} />
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1={15 + i * 19} y1={trackY + maxR + 4} x2={10 + i * 19} y2={trackY + maxR + 12} stroke={trackColor} strokeWidth={1} />
        ))}
        <circle cx={x1Pos + 1} cy={trackY + 1} r={r1} fill={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'} />
        <circle cx={x1Pos} cy={trackY} r={r1} fill={ball1Color} />
        <text x={x1Pos} y={trackY + 3} textAnchor="middle" fontSize={9} fontWeight={700} fill="white">{m1}</text>
        <circle cx={x2Pos + 1} cy={trackY + 1} r={r2} fill={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'} />
        <circle cx={x2Pos} cy={trackY} r={r2} fill={ball2Color} />
        <text x={x2Pos} y={trackY + 3} textAnchor="middle" fontSize={9} fontWeight={700} fill="white">{m2}</text>
        <text x={10} y={14} fontSize={9} fill={isDark ? '#94a3b8' : '#475569'}>m₁ (blue)</text>
        <text x={svgW - 60} y={14} fontSize={9} fill={isDark ? '#94a3b8' : '#475569'}>m₂ (pink)</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 70 }}>Mass m₁:</span>
          <input type="range" aria-label="Mass 1 in kilograms" min={1} max={10} step={0.5} value={m1} onChange={e => setM1(Number(e.target.value))} style={{ flex: 1 }} disabled={running} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{m1} kg</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 70 }}>Velocity v₁:</span>
          <input type="range" aria-label="Velocity 1 in meters per second" min={-10} max={10} step={0.5} value={v1} onChange={e => setV1(Number(e.target.value))} style={{ flex: 1 }} disabled={running} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{v1} m/s</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 70 }}>Mass m₂:</span>
          <input type="range" aria-label="Mass 2 in kilograms" min={1} max={10} step={0.5} value={m2} onChange={e => setM2(Number(e.target.value))} style={{ flex: 1 }} disabled={running} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{m2} kg</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 70 }}>Velocity v₂:</span>
          <input type="range" aria-label="Velocity 2 in meters per second" min={-10} max={10} step={0.5} value={v2} onChange={e => setV2(Number(e.target.value))} style={{ flex: 1 }} disabled={running} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{v2} m/s</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <button onClick={() => setElastic(true)} style={s.btn(elastic)} disabled={running}>Elastic</button>
        <button onClick={() => setElastic(false)} style={s.btn(!elastic)} disabled={running}>Inelastic</button>
        <button onClick={run} disabled={running} style={{ ...s.btn(true), padding: '3px 10px', fontWeight: 600, opacity: running ? 0.5 : 1 }}>
          {running ? 'Running...' : 'Run Collision'}
        </button>
        <button onClick={reset} style={{ ...s.btn(false), padding: '3px 8px' }}>Reset</button>
      </div>
      <div style={{ display: 'flex', gap: 8, fontSize: 9, flexWrap: 'wrap', borderTop: '1px solid ' + s.border, paddingTop: 4 }}>
        <div style={{ color: s.text }}>
          <div style={{ fontWeight: 600 }}>Before:</div>
          <div>p = <b style={{ color: s.bright }}>{pBefore.toFixed(1)}</b> kg·m/s</div>
          <div>KE = <b style={{ color: s.bright }}>{keBefore.toFixed(1)}</b> J</div>
        </div>
        <div style={{ color: s.text }}>
          <div style={{ fontWeight: 600 }}>After:</div>
          <div>p = <b style={{ color: s.bright }}>{pAfter.toFixed(1)}</b> kg·m/s {Math.abs(pBefore - pAfter) < 0.01 ? '✓' : '✗'}</div>
          <div>KE = <b style={{ color: elastic ? s.bright : '#f87171' }}>{keAfter.toFixed(1)}</b> J {elastic ? '✓' : `(-${(keBefore - keAfter).toFixed(1)})`}</div>
        </div>
        <div style={{ color: s.text }}>
          <div style={{ fontWeight: 600 }}>Final vel:</div>
          <div>v₁' = <b style={{ color: ball1Color }}>{v1f.toFixed(2)}</b> m/s</div>
          <div>v₂' = <b style={{ color: ball2Color }}>{v2f.toFixed(2)}</b> m/s</div>
        </div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Before collision: m₁={m1} kg at v₁={v1} m/s, m₂={m2} kg at v₂={v2} m/s</div>
        <div>Step 2: Total momentum before: p = m₁v₁ + m₂v₂ = {(m1 * v1).toFixed(1)} + {(m2 * v2).toFixed(1)} = <b style={{ color: s.accent }}>{pBefore.toFixed(1)} kg·m/s</b></div>
        <div>Step 3: Total KE before: KE = ½m₁v₁² + ½m₂v₂² = <b style={{ color: s.accent }}>{keBefore.toFixed(1)} J</b></div>
        <div>Step 4: Collision type: <b>{elastic ? 'Elastic (KE conserved)' : 'Inelastic (KE not conserved)'}</b></div>
        <div>Step 5: After: v₁'=<b style={{ color: ball1Color }}>{v1f.toFixed(2)}</b> m/s, v₂'=<b style={{ color: ball2Color }}>{v2f.toFixed(2)}</b> m/s | p_after = <b style={{ color: s.accent }}>{pAfter.toFixed(1)} kg·m/s</b> ✓</div>
        <div>Step 6: Momentum conserved ({pBefore.toFixed(1)} = {pAfter.toFixed(1)}); KE {elastic ? 'also conserved' : 'decreased (lost to heat/deformation)'}</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Momentum is ALWAYS conserved in collisions (Newton's 3rd Law: equal and opposite impulses over the same time interval). Kinetic energy is conserved ONLY in perfectly elastic collisions — in real collisions, some KE becomes heat, sound, or permanent deformation.
      </div>
    </div>
  )
}

// ============================================================
// 13. SHMSpringExplorer (Simple Harmonic Motion)
// ============================================================

export function SHMSpringExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [mass, setMass] = useState(1)
  const [k, setK] = useState(25)
  const [x0, setX0] = useState(0.3)
  const [animTime, setAnimTime] = useState(0)
  const [running, setRunning] = useState(false)

  const animRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const massRef = useRef(mass); massRef.current = mass
  const kRef = useRef(k); kRef.current = k

  const omega = Math.sqrt(k / mass)
  const period = 2 * Math.PI / omega
  const freq = 1 / period
  const amplitude = Math.abs(x0)
  const vmax = amplitude * omega
  const amax = amplitude * omega * omega
  const totalE = 0.5 * k * amplitude * amplitude

  // Current displacement (signed): x(t) = x0 * cos(ωt)
  const currentX = x0 * Math.cos(omega * animTime)
  const KE_now = totalE * Math.pow(Math.sin(omega * animTime), 2)
  const PE_now = totalE * Math.pow(Math.cos(omega * animTime), 2)

  // SVG layout: vertical spring
  const svgW = 200
  const svgH = 240
  const cx = svgW / 2
  const topY = 20
  const eqY = 130
  const scale = 50  // 1 m = 50 px
  const massH = 22
  const massW = 30 + mass * 4
  const massY = eqY + currentX * scale  // positive x = down (stretched)
  const springBottomY = massY - massH / 2

  // Draw spring as a smooth sine wave
  const drawSpring = () => {
    const coils = 8
    const totalLen = springBottomY - topY
    if (totalLen < 10) return `M ${cx} ${topY} L ${cx} ${Math.max(springBottomY, topY + 10)}`
    const width = 11
    const straightTop = 4
    const straightBot = 4
    const springStart = topY + straightTop
    const springEnd = springBottomY - straightBot
    const springLen = springEnd - springStart
    const steps = coils * 8
    const pts: string[] = [`M ${cx} ${topY}`]
    pts.push(`L ${cx} ${springStart}`)
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const y = springStart + t * springLen
      const x = cx + width * Math.sin(t * coils * 2 * Math.PI)
      pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`)
    }
    pts.push(`L ${cx} ${springBottomY}`)
    return pts.join(' ')
  }

  const run = () => {
    setAnimTime(0)
    startTimeRef.current = 0
    setRunning(true)
  }
  const reset = () => {
    setRunning(false)
    setAnimTime(0)
  }

  useEffect(() => {
    if (!running) return
    const animate = (time: number) => {
      if (startTimeRef.current === 0) startTimeRef.current = time
      const elapsed = (time - startTimeRef.current) / 1000
      const _omega = Math.sqrt(kRef.current / massRef.current)
      const _period = 2 * Math.PI / _omega
      if (elapsed > 3 * _period) {
        setRunning(false)
        return
      }
      setAnimTime(elapsed)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [running])

  const springColor = isDark ? '#94a3b8' : '#64748b'
  const massColor = isDark ? '#f59e0b' : '#d97706'
  const eqColor = isDark ? 'rgba(52,211,153,0.4)' : 'rgba(16,185,129,0.5)'

  const maxE = totalE > 0 ? totalE : 1
  const keBarPct = (KE_now / maxE) * 100
  const peBarPct = (PE_now / maxE) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        <rect x={cx - 30} y={topY - 8} width={60} height={6} rx={2} fill={isDark ? '#334155' : '#cbd5e1'} />
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1={cx - 25 + i * 8} y1={topY - 2} x2={cx - 28 + i * 8} y2={topY + 2} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth={1} />
        ))}
        <line x1={cx - 55} y1={eqY} x2={cx + 55} y2={eqY} stroke={eqColor} strokeWidth={1} strokeDasharray="4,3" />
        <text x={cx + 58} y={eqY + 3} fontSize={9} fill={isDark ? '#64748b' : '#94a3b8'}>x=0</text>
        <path d={drawSpring()} fill="none" stroke={springColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <rect x={cx - massW / 2} y={massY - massH / 2} width={massW} height={massH} rx={3} fill={massColor} />
        <text x={cx} y={massY + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="white">{mass}kg</text>
        <line x1={cx + 40} y1={eqY} x2={cx + 40} y2={massY} stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth={1.5} />
        <line x1={cx + 37} y1={eqY} x2={cx + 43} y2={eqY} stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth={1} />
        <line x1={cx + 37} y1={massY} x2={cx + 43} y2={massY} stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth={1} />
        <text x={cx + 48} y={(eqY + massY) / 2 + 3} fontSize={9} fill={isDark ? '#fbbf24' : '#d97706'}>x={currentX.toFixed(2)}m</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Mass (m):</span>
          <input type="range" aria-label="Mass in kilograms" min={0.1} max={5} step={0.1} value={mass} onChange={e => setMass(Number(e.target.value))} style={{ flex: 1 }} disabled={running} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{mass.toFixed(1)} kg</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Spring (k):</span>
          <input type="range" aria-label="Spring constant k" min={1} max={100} step={1} value={k} onChange={e => setK(Number(e.target.value))} style={{ flex: 1 }} disabled={running} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{k} N/m</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Initial disp:</span>
          <input type="range" aria-label="Initial displacement" min={-1} max={1} step={0.05} value={x0} onChange={e => setX0(Number(e.target.value))} style={{ flex: 1 }} disabled={running} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{x0.toFixed(2)} m</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={run} disabled={running} style={{ ...s.btn(true), padding: '3px 10px', fontWeight: 600, opacity: running ? 0.5 : 1 }}>
          {running ? 'Oscillating...' : 'Start'}
        </button>
        <button onClick={reset} style={{ ...s.btn(false), padding: '3px 8px' }}>Reset</button>
      </div>
      <div style={{ display: 'flex', gap: 8, fontSize: 9, flexWrap: 'wrap', borderTop: '1px solid ' + s.border, paddingTop: 4, color: s.text }}>
        <span>T = <b style={{ color: s.bright }}>{period.toFixed(3)} s</b></span>
        <span>f = <b style={{ color: s.bright }}>{freq.toFixed(3)} Hz</b></span>
        <span>v_max = <b style={{ color: s.bright }}>{vmax.toFixed(2)} m/s</b></span>
        <span>a_max = <b style={{ color: s.bright }}>{amax.toFixed(2)} m/s²</b></span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: s.text }}>
          <span style={{ minWidth: 38 }}>KE:</span>
          <div style={{ flex: 1, height: 10, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${keBarPct}%`, height: '100%', background: '#f87171', transition: 'width 0.05s linear' }} />
          </div>
          <span style={{ minWidth: 45, textAlign: 'right', color: s.bright }}>{KE_now.toFixed(2)} J</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: s.text }}>
          <span style={{ minWidth: 38 }}>PE:</span>
          <div style={{ flex: 1, height: 10, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${peBarPct}%`, height: '100%', background: '#60a5fa', transition: 'width 0.05s linear' }} />
          </div>
          <span style={{ minWidth: 45, textAlign: 'right', color: s.bright }}>{PE_now.toFixed(2)} J</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: s.text }}>
          <span style={{ minWidth: 38 }}>Total:</span>
          <div style={{ flex: 1, height: 10, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: '#34d399' }} />
          </div>
          <span style={{ minWidth: 45, textAlign: 'right', color: s.bright }}>{totalE.toFixed(2)} J</span>
        </div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Mass m = {mass} kg, Spring constant k = {k} N/m, Displacement x = {x0.toFixed(2)} m</div>
        <div>Step 2: Hooke's Law: F = −kx = −{k}×{x0.toFixed(2)} = <b style={{ color: s.accent }}>{(-k * x0).toFixed(2)} N</b> (restoring force, opposite to displacement)</div>
        <div>Step 3: Period T = 2π√(m/k) = 2π√({mass}/{k}) = 2π×{Math.sqrt(mass / k).toFixed(3)} = <b style={{ color: s.accent }}>{period.toFixed(3)} s</b></div>
        <div>Step 4: Frequency f = 1/T = <b style={{ color: s.accent }}>{freq.toFixed(3)} Hz</b></div>
        <div>Step 5: Max velocity v_max = A√(k/m) = {amplitude.toFixed(2)}×√({k}/{mass}) = <b style={{ color: s.accent }}>{vmax.toFixed(2)} m/s</b> (at equilibrium)</div>
        <div>Step 6: Period is INDEPENDENT of amplitude — same T whether you pull 0.1m or 0.5m (isochronism)</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> A spring-mass system is "isochronous" — its period depends only on m and k, not on amplitude. Energy continuously oscillates between kinetic (max at equilibrium, where speed is highest) and potential (max at extremes, where the spring is most stretched or compressed). The total mechanical energy stays constant.
      </div>
    </div>
  )
}

// ============================================================
// 14. ElectricFieldExplorer
// ============================================================

interface EFieldCharge {
  id: number
  x: number
  y: number
  q: number
}

export function ElectricFieldExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [charges, setCharges] = useState<EFieldCharge[]>([
    { id: 1, x: 90, y: 90, q: 1 },
    { id: 2, x: 190, y: 90, q: -1 },
  ])
  const [nextId, setNextId] = useState(3)
  const [addMode, setAddMode] = useState<1 | -1>(1)
  const [showField, setShowField] = useState(true)
  const [testX, setTestX] = useState(140)
  const [testY, setTestY] = useState(40)
  const [dragging, setDragging] = useState(false)

  const svgW = 280
  const svgH = 180

  const toSVGCoords = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (svgW / rect.width),
      y: (e.clientY - rect.top) * (svgH / rect.height),
    }
  }

  const handleSVGMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target !== e.currentTarget) return
    const { x, y } = toSVGCoords(e)
    setCharges(prev => [...prev, { id: nextId, x, y, q: addMode }])
    setNextId(prev => prev + 1)
  }

  const handleTestMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDragging(true)
  }

  const handleSVGMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return
    const { x, y } = toSVGCoords(e)
    setTestX(Math.max(8, Math.min(svgW - 8, x)))
    setTestY(Math.max(8, Math.min(svgH - 8, y)))
  }

  const handleSVGMouseUp = () => setDragging(false)

  // Compute E at any point
  const computeE = (px: number, py: number) => {
    let Ex = 0, Ey = 0
    for (const c of charges) {
      const dx = px - c.x
      const dy = py - c.y
      const r2 = dx * dx + dy * dy
      const r = Math.sqrt(r2)
      if (r < 8) continue
      const k = 800
      const Emag = k * c.q / r2
      Ex += Emag * dx / r
      Ey += Emag * dy / r
    }
    return { Ex, Ey }
  }

  const { Ex: testEx, Ey: testEy } = computeE(testX, testY)
  const testEmag = Math.sqrt(testEx * testEx + testEy * testEy)

  const gridArrows = useMemo(() => {
    const arrows: { x: number, y: number, dx: number, dy: number }[] = []
    const step = 28
    for (let gx = step / 2; gx < svgW; gx += step) {
      for (let gy = step / 2; gy < svgH; gy += step) {
        let Ex = 0, Ey = 0
        for (const c of charges) {
          const dx = gx - c.x
          const dy = gy - c.y
          const r2 = dx * dx + dy * dy
          const r = Math.sqrt(r2)
          if (r < 8) continue
          const Emag = 800 * c.q / r2
          Ex += Emag * dx / r
          Ey += Emag * dy / r
        }
        const mag = Math.sqrt(Ex * Ex + Ey * Ey)
        if (mag < 0.05) continue
        const len = Math.min(mag * 7, 9)
        arrows.push({ x: gx, y: gy, dx: Ex / mag * len, dy: Ey / mag * len })
      }
    }
    return arrows
  }, [charges])

  const posColor = '#ef4444'
  const negColor = '#3b82f6'
  const testColor = isDark ? '#fbbf24' : '#d97706'
  const arrowColor = isDark ? 'rgba(167,139,250,0.45)' : 'rgba(139,92,246,0.35)'

  const testArrowScale = Math.min(testEmag * 5, 24)
  const testDx = testEmag > 0.01 ? testEx / testEmag * testArrowScale : 0
  const testDy = testEmag > 0.01 ? testEy / testEmag * testArrowScale : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`}
           style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border, cursor: dragging ? 'grabbing' : 'crosshair' }}
           onMouseDown={handleSVGMouseDown}
           onMouseMove={handleSVGMouseMove}
           onMouseUp={handleSVGMouseUp}
           onMouseLeave={handleSVGMouseUp}>
        {showField && gridArrows.map((a, i) => (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={a.x + a.dx} y2={a.y + a.dy} stroke={arrowColor} strokeWidth={1} />
            <circle cx={a.x + a.dx} cy={a.y + a.dy} r={1.6} fill={arrowColor} />
          </g>
        ))}
        {charges.map(c => (
          <g key={c.id} onClick={(e) => { e.stopPropagation(); setCharges(prev => prev.filter(x => x.id !== c.id)) }} style={{ cursor: 'pointer' }}>
            <circle cx={c.x} cy={c.y} r={9} fill={c.q > 0 ? posColor : negColor} stroke="white" strokeWidth={1.5} />
            <text x={c.x} y={c.y + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="white">{c.q > 0 ? '+' : '−'}</text>
          </g>
        ))}
        <g onMouseDown={handleTestMouseDown} style={{ cursor: 'grab' }}>
          <circle cx={testX} cy={testY} r={8} fill="none" stroke={testColor} strokeWidth={2} />
          <circle cx={testX} cy={testY} r={2} fill={testColor} />
        </g>
        {testEmag > 0.05 && (
          <g>
            <line x1={testX} y1={testY} x2={testX + testDx} y2={testY + testDy} stroke={testColor} strokeWidth={2.5} />
            <polygon points={`${testX + testDx},${testY + testDy} ${testX + testDx * 0.6 - testDy * 0.3},${testY + testDy * 0.6 + testDx * 0.3} ${testX + testDx * 0.6 + testDy * 0.3},${testY + testDy * 0.6 - testDx * 0.3}`} fill={testColor} />
          </g>
        )}
        <text x={5} y={12} fontSize={9} fill={isDark ? '#94a3b8' : '#475569'}>Click bg to add · Click charge to remove · Drag test (○)</text>
      </svg>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setAddMode(1)} style={s.btn(addMode === 1)}>Add +1</button>
        <button onClick={() => setAddMode(-1)} style={s.btn(addMode === -1)}>Add −1</button>
        <button onClick={() => setShowField(!showField)} style={s.btn(showField)}>Field Lines</button>
        <button onClick={() => setCharges([])} style={{ ...s.btn(false), color: '#f87171' }}>Clear</button>
      </div>
      <div style={{ fontSize: 9, color: s.text, borderTop: '1px solid ' + s.border, paddingTop: 4 }}>
        Test at ({testX.toFixed(0)}, {testY.toFixed(0)}) → E = ({testEx.toFixed(2)}, {testEy.toFixed(2)}) N/C, |E| = <b style={{ color: s.bright }}>{testEmag.toFixed(2)} N/C</b>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: {charges.length} charges placed: {charges.filter(c => c.q > 0).length} positive, {charges.filter(c => c.q < 0).length} negative</div>
        <div>Step 2: Test charge at ({testX.toFixed(0)}, {testY.toFixed(0)})</div>
        <div>Step 3: Field from each charge: E = kq/r² (vector sum over all charges)</div>
        <div>Step 4: Net field at test charge: E = ({testEx.toFixed(2)}, {testEy.toFixed(2)}) N/C, magnitude = <b style={{ color: s.accent }}>{testEmag.toFixed(2)} N/C</b></div>
        <div>Step 5: Force on test charge q=+1: F = qE = ({testEx.toFixed(2)}, {testEy.toFixed(2)}) N</div>
        <div>Step 6: Field lines point away from + charges, toward − charges (direction a positive test charge moves)</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> The electric field is a vector field — at every point in space, it has a magnitude and direction. Coulomb's inverse-square law (1/r²) means field strength drops rapidly with distance. Like charges repel, opposite charges attract, but the FIELD exists everywhere, even in empty space — it's the "ripple" each charge creates in space.
      </div>
    </div>
  )
}

// ============================================================
// 15. MagneticFieldExplorer (Right-Hand Rule)
// ============================================================

export function MagneticFieldExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [current, setCurrent] = useState(10)
  const [direction, setDirection] = useState<'up' | 'down'>('up')
  const [compassX, setCompassX] = useState(200)
  const [compassY, setCompassY] = useState(90)
  const [dragging, setDragging] = useState(false)

  const svgW = 280
  const svgH = 180
  const wireX = svgW / 2
  const wireY = svgH / 2

  const dx = compassX - wireX
  const dy = compassY - wireY
  const r_pixels = Math.sqrt(dx * dx + dy * dy)
  const r_meters = Math.max(r_pixels / 20, 0.25)

  // B = μ₀I/(2πr) = 2×10⁻⁷ × I / r
  const B = 2e-7 * current / r_meters

  // Field direction (tangent to circle). For "up" (out of page, ⊙): CCW field.
  // In SVG coords: B_dir = (dy, -dx) / r for CCW (current up).
  // For "down" (into page, ⊗): reversed.
  const r_safe = Math.max(r_pixels, 1)
  const tx = direction === 'up' ? dy / r_safe : -dy / r_safe
  const ty = direction === 'up' ? -dx / r_safe : dx / r_safe

  let compassDir = ''
  if (Math.abs(tx) > Math.abs(ty)) {
    compassDir = tx > 0 ? 'east (→)' : 'west (←)'
  } else {
    compassDir = ty > 0 ? 'south (↓)' : 'north (↑)'
  }

  const toSVGCoords = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (svgW / rect.width),
      y: (e.clientY - rect.top) * (svgH / rect.height),
    }
  }

  const handleSVGMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return
    const { x, y } = toSVGCoords(e)
    const ddx = x - wireX
    const ddy = y - wireY
    const dist = Math.sqrt(ddx * ddx + ddy * ddy)
    if (dist < 22) {
      const scale = 22 / Math.max(dist, 0.01)
      setCompassX(wireX + ddx * scale)
      setCompassY(wireY + ddy * scale)
    } else {
      setCompassX(x)
      setCompassY(y)
    }
  }

  const handleCompassMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDragging(true)
  }
  const handleSVGMouseUp = () => setDragging(false)

  const fieldCircles = [22, 44, 66, 88]
  const wireColor = isDark ? '#fbbf24' : '#d97706'
  const fieldColor = isDark ? 'rgba(167,139,250,0.5)' : 'rgba(139,92,246,0.4)'
  const compassColor = isDark ? '#ef4444' : '#dc2626'
  const compassFill = isDark ? '#1e293b' : '#fff'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`}
           style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border, cursor: dragging ? 'grabbing' : 'default' }}
           onMouseMove={handleSVGMouseMove}
           onMouseUp={handleSVGMouseUp}
           onMouseLeave={handleSVGMouseUp}>
        {fieldCircles.map(r => {
          const ax = wireX
          const ay = wireY - r
          const tdx = direction === 'up' ? -1 : 1
          const arrowLen = 6
          const tipX = ax + tdx * arrowLen / 2
          return (
            <g key={r}>
              <circle cx={wireX} cy={wireY} r={r} fill="none" stroke={fieldColor} strokeWidth={1.2} strokeDasharray="3,2" />
              <line x1={ax - tdx * arrowLen / 2} y1={ay} x2={tipX} y2={ay} stroke={fieldColor} strokeWidth={1.8} />
              <polygon points={`${tipX},${ay} ${tipX - tdx * 3},${ay - 2.5} ${tipX - tdx * 3},${ay + 2.5}`} fill={fieldColor} />
            </g>
          )
        })}
        <circle cx={wireX} cy={wireY} r={9} fill={wireColor} stroke="white" strokeWidth={1.5} />
        {direction === 'up' ? (
          <circle cx={wireX} cy={wireY} r={3.5} fill="none" stroke="white" strokeWidth={1.5} />
        ) : (
          <>
            <line x1={wireX - 3.5} y1={wireY - 3.5} x2={wireX + 3.5} y2={wireY + 3.5} stroke="white" strokeWidth={1.5} />
            <line x1={wireX - 3.5} y1={wireY + 3.5} x2={wireX + 3.5} y2={wireY - 3.5} stroke="white" strokeWidth={1.5} />
          </>
        )}
        <g onMouseDown={handleCompassMouseDown} style={{ cursor: 'grab' }}>
          <circle cx={compassX} cy={compassY} r={14} fill={compassFill} stroke={compassColor} strokeWidth={1.5} opacity={0.95} />
          <line x1={compassX - tx * 11} y1={compassY - ty * 11} x2={compassX + tx * 11} y2={compassY + ty * 11} stroke={compassColor} strokeWidth={2} />
          <polygon points={`${compassX + tx * 11},${compassY + ty * 11} ${compassX + tx * 6 - ty * 3},${compassY + ty * 6 + tx * 3} ${compassX + tx * 6 + ty * 3},${compassY + ty * 6 - tx * 3}`} fill={compassColor} />
          <circle cx={compassX} cy={compassY} r={2} fill={compassColor} />
        </g>
        <text x={5} y={12} fontSize={9} fill={isDark ? '#94a3b8' : '#475569'}>Top-down view · Drag compass · Wire at center</text>
        <text x={wireX - 18} y={wireY + 22} fontSize={9} fontWeight={600} fill={isDark ? '#fbbf24' : '#d97706'}>{direction === 'up' ? 'I (out)' : 'I (in)'}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 70 }}>Current (I):</span>
          <input type="range" aria-label="Current in amps" min={1} max={20} step={0.5} value={current} onChange={e => setCurrent(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{current} A</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={() => setDirection('up')} style={s.btn(direction === 'up')}>↑ Up (⊙ out)</button>
        <button onClick={() => setDirection('down')} style={s.btn(direction === 'down')}>↓ Down (⊗ in)</button>
      </div>
      <div style={{ fontSize: 9, color: s.text, borderTop: '1px solid ' + s.border, paddingTop: 4 }}>
        r = <b style={{ color: s.bright }}>{r_meters.toFixed(2)} m</b> | B = μ₀I/(2πr) = <b style={{ color: s.bright }}>{B.toExponential(2)} T</b> | Compass: <b style={{ color: compassColor }}>{compassDir}</b>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Current I = {current} A, direction: <b>{direction}</b></div>
        <div>Step 2: Compass at distance r = {r_meters.toFixed(2)} m from wire</div>
        <div>Step 3: Magnetic field B = μ₀I/(2πr) = (4π×10⁻⁷×{current})/(2π×{r_meters.toFixed(2)}) = <b style={{ color: s.accent }}>{B.toExponential(2)} T</b></div>
        <div>Step 4: Right-hand rule: thumb points {direction}, fingers curl in field direction</div>
        <div>Step 5: Compass needle aligns with B — pointing <b style={{ color: s.accent }}>{compassDir}</b></div>
        <div>Step 6: Field circles the wire; stronger near wire (1/r falloff, not 1/r²)</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> A current-carrying wire creates a circular magnetic field around it (Oersted's 1820 discovery). The right-hand rule gives direction: thumb along current, fingers curl along B. Unlike the electric field from a point charge (1/r²), the magnetic field from a long wire falls off as 1/r — adding a dimension "spreads" the field more slowly.
      </div>
    </div>
  )
}

// ============================================================
// 16. QuantumExplorer (Double Slit + Photoelectric)
// ============================================================

export function QuantumExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [tab, setTab] = useState<'slit' | 'photo'>('slit')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => setTab('slit')} style={s.btn(tab === 'slit')}>Double Slit</button>
        <button onClick={() => setTab('photo')} style={s.btn(tab === 'photo')}>Photoelectric</button>
      </div>
      {tab === 'slit' ? <DoubleSlitPanel isDark={isDark} /> : <PhotoelectricPanel isDark={isDark} />}
    </div>
  )
}

function DoubleSlitPanel({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [mode, setMode] = useState<'wave' | 'particle'>('wave')
  const [hits, setHits] = useState<number[]>([])
  const [running, setRunning] = useState(false)

  const svgW = 280
  const svgH = 180
  const sourceX = 28
  const barrierX = 110
  const screenX = 250
  const slit1Y = 72
  const slit2Y = 108

  useEffect(() => {
    if (!running) return
    const tick = () => {
      let y: number
      if (mode === 'wave') {
        const fringeWidth = 18
        let attempts = 0
        let yFound = svgH / 2
        while (attempts < 30) {
          const yTry = 18 + Math.random() * (svgH - 36)
          const p = Math.cos(Math.PI * (yTry - svgH / 2) / fringeWidth) ** 2
          if (Math.random() < p) { yFound = yTry; break }
          attempts++
        }
        y = yFound
      } else {
        const targetY = Math.random() < 0.5 ? slit1Y : slit2Y
        y = targetY + (Math.random() + Math.random() + Math.random() - 1.5) * 12
        y = Math.max(15, Math.min(svgH - 15, y))
      }
      setHits(prev => [...prev, y])
    }
    const interval = setInterval(tick, 60)
    return () => clearInterval(interval)
  }, [running, mode])

  const clear = () => {
    setRunning(false)
    setHits([])
  }

  const histogram = useMemo(() => {
    const bins = 30
    const counts = new Array(bins).fill(0)
    const yMin = 15, yMax = svgH - 15
    for (const y of hits) {
      const binIdx = Math.floor((y - yMin) / (yMax - yMin) * bins)
      if (binIdx >= 0 && binIdx < bins) counts[binIdx]++
    }
    const maxCount = Math.max(...counts, 1)
    return counts.map((c, i) => ({
      y: yMin + (i + 0.5) * (yMax - yMin) / bins,
      count: c,
      height: (c / maxCount) * 28,
    }))
  }, [hits])

  const sourceColor = isDark ? '#60a5fa' : '#3b82f6'
  const barrierColor = isDark ? '#94a3b8' : '#475569'
  const screenColor = isDark ? '#1e293b' : '#cbd5e1'
  const hitColor = isDark ? '#34d399' : '#059669'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        <circle cx={sourceX} cy={svgH / 2} r={9} fill={sourceColor} opacity={0.3} />
        <circle cx={sourceX} cy={svgH / 2} r={5} fill={sourceColor} />
        <text x={sourceX} y={svgH / 2 + 22} textAnchor="middle" fontSize={8} fill={isDark ? '#94a3b8' : '#475569'}>e⁻ source</text>
        {running && (
          <line x1={sourceX + 9} y1={svgH / 2} x2={barrierX - 4} y2={svgH / 2} stroke={sourceColor} strokeWidth={1} opacity={0.3} strokeDasharray="2,2" />
        )}
        <rect x={barrierX - 4} y={0} width={8} height={slit1Y - 8} fill={barrierColor} />
        <rect x={barrierX - 4} y={slit1Y + 8} width={8} height={slit2Y - slit1Y - 16} fill={barrierColor} />
        <rect x={barrierX - 4} y={slit2Y + 8} width={8} height={svgH - slit2Y - 8} fill={barrierColor} />
        {mode === 'wave' && (
          <g opacity={0.18}>
            {Array.from({ length: 22 }).map((_, i) => {
              const y = 18 + i * 7
              const p = Math.cos(Math.PI * (y - svgH / 2) / 18) ** 2
              return <line key={i} x1={barrierX + 6} y1={y} x2={screenX - 2} y2={y} stroke={hitColor} strokeWidth={1} opacity={p} />
            })}
          </g>
        )}
        <line x1={screenX} y1={0} x2={screenX} y2={svgH} stroke={screenColor} strokeWidth={3} />
        {hits.map((y, i) => (
          <circle key={i} cx={screenX - 1} cy={y} r={1.5} fill={hitColor} opacity={0.7} />
        ))}
        {histogram.map((h, i) => (
          h.count > 0 && <rect key={'h' + i} x={screenX + 4} y={h.y - 2.5} width={h.height} height={5} fill={hitColor} opacity={0.6} />
        ))}
        <text x={5} y={12} fontSize={9} fill={isDark ? '#94a3b8' : '#475569'}>{mode === 'wave' ? 'Wave mode' : 'Particle mode'}</text>
      </svg>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { setMode('wave'); setHits([]); }} style={s.btn(mode === 'wave')}>Wave</button>
        <button onClick={() => { setMode('particle'); setHits([]); }} style={s.btn(mode === 'particle')}>Particle</button>
        <button onClick={() => setRunning(!running)} style={{ ...s.btn(true), padding: '3px 8px' }}>{running ? 'Pause' : 'Emit'}</button>
        <button onClick={clear} style={{ ...s.btn(false), color: '#f87171' }}>Clear</button>
      </div>
      <div style={{ fontSize: 9, color: s.text }}>Electrons emitted: <b style={{ color: s.bright }}>{hits.length}</b></div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Experiment: Double Slit | Mode: <b>{mode === 'wave' ? 'Wave (quantum)' : 'Particle (classical)'}</b></div>
        <div>Step 2: Source emits electrons toward barrier with 2 slits</div>
        <div>Step 3: {mode === 'wave' ? 'Each electron acts as a wave — passes through BOTH slits simultaneously' : 'Each electron is a particle — goes through one slit only'}</div>
        <div>Step 4: {mode === 'wave' ? 'Wave interferes with itself → bright and dark fringes on screen' : 'No interference — just two bands behind the slits'}</div>
        <div>Step 5: Pattern on screen: <b style={{ color: s.accent }}>{mode === 'wave' ? 'interference fringes (bright/dark/bright...)' : 'two clusters (no fringes)'}</b> ({hits.length} hits so far)</div>
        <div>Step 6: Even single electrons interfere with themselves — particles have wave nature (de Broglie)</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> The double-slit experiment is the central mystery of quantum mechanics. Particles (electrons, atoms, even molecules) create interference patterns normally associated with waves — even when sent one at a time. This reveals that matter has both particle AND wave nature (wave-particle duality), and that quantum objects exist in superposition until measured.
      </div>
    </div>
  )
}

function PhotoelectricPanel({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [freq, setFreq] = useState(1.2)
  const [intensity, setIntensity] = useState(80)
  const phi = 0.5

  const photonEnergy = 0.6626 * freq
  const ejected = photonEnergy > phi
  const KE = ejected ? photonEnergy - phi : 0
  const thresholdFreq = phi / 0.6626

  const [animPhase, setAnimPhase] = useState(0)
  const animRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const animate = (time: number) => {
      if (startTimeRef.current === 0) startTimeRef.current = time
      const elapsed = (time - startTimeRef.current) / 1000
      setAnimPhase(elapsed % 2)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const photons = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75].map(offset => {
    const t = (animPhase + offset) % 2
    const visible = t <= 1
    return {
      x: 30 + Math.min(t, 1) * 95,
      y: 50 + (offset * 17) % 80,
      opacity: visible ? (1 - t * 0.3) * (intensity / 100) : 0,
    }
  })

  const electrons = ejected ? [0, 0.4, 0.8, 1.2, 1.6].map(offset => {
    const t = (animPhase + offset) % 2
    const visible = t <= 1.5
    return {
      x: 145 + Math.min(t, 1.5) * 50,
      y: 50 + (offset * 19) % 80,
      opacity: visible ? 1 - t * 0.4 : 0,
    }
  }) : []

  const photonColor = (() => {
    if (freq < 0.65) return '#ef4444'
    if (freq < 0.85) return '#f97316'
    if (freq < 1.05) return '#eab308'
    if (freq < 1.25) return '#22c55e'
    if (freq < 1.5) return '#3b82f6'
    if (freq < 1.8) return '#8b5cf6'
    return '#a855f7'
  })()

  const svgW = 280
  const svgH = 180
  const plateX = 138
  const sourceX = 28

  const electronColor = '#34d399'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        <circle cx={sourceX} cy={svgH / 2} r={13} fill={photonColor} opacity={0.25} />
        <circle cx={sourceX} cy={svgH / 2} r={8} fill={photonColor} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
          const rad = deg * Math.PI / 180
          return <line key={deg} x1={sourceX + 10 * Math.cos(rad)} y1={svgH / 2 + 10 * Math.sin(rad)} x2={sourceX + 15 * Math.cos(rad)} y2={svgH / 2 + 15 * Math.sin(rad)} stroke={photonColor} strokeWidth={1.5} />
        })}
        <text x={sourceX} y={svgH - 5} textAnchor="middle" fontSize={8} fill={isDark ? '#94a3b8' : '#475569'}>light</text>
        {photons.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={photonColor} opacity={p.opacity} />
        ))}
        <rect x={plateX} y={20} width={8} height={svgH - 40} fill={isDark ? '#475569' : '#94a3b8'} stroke={isDark ? '#64748b' : '#64748b'} strokeWidth={1} />
        <text x={plateX + 4} y={svgH - 5} textAnchor="middle" fontSize={8} fill={isDark ? '#94a3b8' : '#475569'}>metal (φ={phi} aJ)</text>
        {electrons.map((e, i) => (
          <g key={i} opacity={e.opacity}>
            <circle cx={e.x} cy={e.y} r={4} fill={electronColor} />
            <text x={e.x} y={e.y + 2} textAnchor="middle" fontSize={6} fontWeight={700} fill="white">e⁻</text>
            <line x1={e.x + 5} y1={e.y} x2={e.x + 9 + KE * 8} y2={e.y} stroke={electronColor} strokeWidth={1} />
          </g>
        ))}
        <text x={svgW - 5} y={14} textAnchor="end" fontSize={11} fontWeight={700} fill={ejected ? '#34d399' : '#f87171'}>
          {ejected ? '✓ EMISSION' : '✗ NO EMISSION'}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Frequency:</span>
          <input type="range" aria-label="Frequency in Hertz" min={0.4} max={2.5} step={0.05} value={freq} onChange={e => setFreq(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 45, textAlign: 'right' }}>{freq.toFixed(2)} PHz</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Intensity:</span>
          <input type="range" aria-label="Sound intensity" min={10} max={100} step={5} value={intensity} onChange={e => setIntensity(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 45, textAlign: 'right' }}>{intensity}%</span>
        </div>
      </div>
      <div style={{ fontSize: 9, color: s.text, borderTop: '1px solid ' + s.border, paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div>Photon energy E = hf = <b style={{ color: s.bright }}>{photonEnergy.toFixed(3)} aJ</b> | Work function φ = <b style={{ color: s.bright }}>{phi.toFixed(2)} aJ</b></div>
        <div>Threshold frequency: f₀ = φ/h = <b style={{ color: s.bright }}>{thresholdFreq.toFixed(2)} PHz</b></div>
        <div>{ejected ? <span style={{ color: '#34d399' }}>Electrons ejected! KE = <b>{KE.toFixed(3)} aJ</b></span> : <span style={{ color: '#f87171' }}>f &lt; f₀ — NO electrons ejected (regardless of intensity)</span>}</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Light frequency f = {freq.toFixed(2)} PHz, intensity = {intensity}%</div>
        <div>Step 2: Metal work function φ = {phi.toFixed(2)} aJ (energy to free one electron)</div>
        <div>Step 3: Photon energy E = hf = <b style={{ color: s.accent }}>{photonEnergy.toFixed(3)} aJ</b></div>
        <div>Step 4: {ejected ? <>E &gt; φ → electrons ejected! KE = E − φ = <b style={{ color: s.accent }}>{KE.toFixed(3)} aJ</b></> : <span style={{ color: '#f87171' }}>E &lt; φ → NO electrons ejected (below threshold frequency)</span>}</div>
        <div>Step 5: {ejected ? 'Intensity affects NUMBER of electrons, not their KE' : 'Increasing intensity won\'t help — need higher FREQUENCY'}</div>
        <div>Step 6: Light is quantized — each photon carries energy hf (Einstein, 1905)</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> The photoelectric effect shattered classical wave theory of light. Classical waves predict that ANY frequency should eject electrons (given enough intensity), but experiments show a sharp threshold. Einstein explained this by treating light as particles (photons), each carrying a quantum of energy hf. This discovery won him the 1921 Nobel Prize and launched quantum physics.
      </div>
    </div>
  )
}


// ============================================================
// 17. SpeedVelocityAcceleration (Middle School 6-8)
// ============================================================

export function SpeedVelocityAcceleration({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [v0, setV0] = useState(5)
  const [a, setA] = useState(2)
  const [running, setRunning] = useState(false)
  const [t, setT] = useState(0)
  const animRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const v0Ref = useRef(v0)
  const aRef = useRef(a)
  v0Ref.current = v0
  aRef.current = a

  const maxT = 8
  const svgW = 280
  const svgH = 130

  const start = () => {
    setT(0)
    startTimeRef.current = 0
    setRunning(true)
  }
  const stop = () => setRunning(false)
  const reset = () => {
    setRunning(false)
    setT(0)
  }

  useEffect(() => {
    if (!running) return
    const animate = (time: number) => {
      if (startTimeRef.current === 0) startTimeRef.current = time
      const elapsed = (time - startTimeRef.current) / 1000
      const tt = Math.min(elapsed, maxT)
      setT(tt)
      if (tt >= maxT) {
        setRunning(false)
        return
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [running])

  const currentV = Math.max(0, v0 + a * t)
  const distance = v0 * t + 0.5 * a * t * t

  // Graph scales
  const vMax = Math.max(20, v0 + Math.max(0, a) * maxT, currentV + 1, 10)
  const graphX0 = 30
  const graphY0 = 12
  const graphW = svgW - graphX0 - 10
  const graphH = svgH - graphY0 - 22

  const xEnd = Math.min(t, maxT)
  const vEnd = Math.max(0, v0 + a * xEnd)
  const lineX1 = graphX0
  const lineY1 = graphY0 + graphH - (v0 / vMax) * graphH
  const lineX2 = graphX0 + (xEnd / maxT) * graphW
  const lineY2 = graphY0 + graphH - (vEnd / vMax) * graphH

  // Car SVG
  const carSvgW = 280
  const carSvgH = 70
  const roadY = 42
  const trackLen = carSvgW - 50
  const distForScale = Math.max(80, v0 * maxT + Math.abs(0.5 * a * maxT * maxT), distance + 5)
  const carX = 20 + (distance / distForScale) * trackLen
  const tickVals = [0, Math.round(distForScale * 0.25), Math.round(distForScale * 0.5), Math.round(distForScale * 0.75), Math.round(distForScale)]

  const carColor = isDark ? '#34d399' : '#059669'
  const roadColor = isDark ? '#475569' : '#94a3b8'
  const graphColor = isDark ? '#60a5fa' : '#3b82f6'

  const step4Text = a > 0.01 ? 'Speeding up (a > 0) — velocity increasing' : a < -0.01 ? 'Slowing down (a < 0) — velocity decreasing' : 'Constant speed (a = 0) — uniform motion'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={'0 0 ' + carSvgW + ' ' + carSvgH} style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        <line x1={0} y1={roadY + 14} x2={carSvgW} y2={roadY + 14} stroke={roadColor} strokeWidth={2} />
        {tickVals.map((tk, i) => {
          const tx = 20 + (i / 4) * trackLen
          return (
            <g key={i}>
              <line x1={tx} y1={roadY + 14} x2={tx} y2={roadY + 19} stroke={roadColor} strokeWidth={1} />
              <text x={tx} y={roadY + 29} textAnchor="middle" fontSize={7} fill={isDark ? '#94a3b8' : '#475569'}>{tk}m</text>
            </g>
          )
        })}
        <g transform={'translate(' + (carX - 15) + ',' + (roadY - 12) + ')'}>
          <rect x={0} y={4} width={30} height={10} rx={2} fill={carColor} />
          <rect x={6} y={0} width={18} height={6} rx={1} fill={carColor} opacity={0.8} />
          <circle cx={7} cy={16} r={3} fill="#1e293b" />
          <circle cx={23} cy={16} r={3} fill="#1e293b" />
          <text x={15} y={-3} textAnchor="middle" fontSize={8} fontWeight={700} fill={carColor}>{currentV.toFixed(1)} m/s</text>
        </g>
      </svg>

      <svg viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        <line x1={graphX0} y1={graphY0} x2={graphX0} y2={graphY0 + graphH} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1} />
        <line x1={graphX0} y1={graphY0 + graphH} x2={graphX0 + graphW} y2={graphY0 + graphH} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1} />
        {[0.25, 0.5, 0.75].map(p => (
          <line key={p} x1={graphX0} y1={graphY0 + p * graphH} x2={graphX0 + graphW} y2={graphY0 + p * graphH} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} strokeWidth={0.5} />
        ))}
        <text x={graphX0 - 4} y={graphY0 + 6} textAnchor="end" fontSize={8} fill={isDark ? '#94a3b8' : '#475569'}>{vMax.toFixed(0)}</text>
        <text x={graphX0 - 4} y={graphY0 + graphH + 3} textAnchor="end" fontSize={8} fill={isDark ? '#94a3b8' : '#475569'}>0</text>
        <text x={graphX0 + graphW} y={graphY0 + graphH + 12} textAnchor="end" fontSize={8} fill={isDark ? '#94a3b8' : '#475569'}>{maxT}s</text>
        <text x={5} y={graphY0 + graphH / 2} textAnchor="middle" fontSize={8} fill={isDark ? '#94a3b8' : '#475569'} transform={'rotate(-90,5,' + (graphY0 + graphH / 2) + ')'}>v (m/s)</text>
        <text x={graphX0 + graphW / 2} y={svgH - 3} textAnchor="middle" fontSize={8} fill={isDark ? '#94a3b8' : '#475569'}>t (s)</text>
        <line
          x1={graphX0}
          y1={graphY0 + graphH - (v0 / vMax) * graphH}
          x2={graphX0 + graphW}
          y2={graphY0 + graphH - (Math.max(0, v0 + a * maxT) / vMax) * graphH}
          stroke={graphColor}
          strokeWidth={1}
          strokeDasharray="3,3"
          opacity={0.3}
        />
        <line x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2} stroke={graphColor} strokeWidth={2} />
        {t > 0 && (
          <polygon
            points={graphX0 + ',' + (graphY0 + graphH) + ' ' + graphX0 + ',' + lineY1 + ' ' + lineX2 + ',' + lineY2 + ' ' + lineX2 + ',' + (graphY0 + graphH)}
            fill={graphColor}
            opacity={0.15}
          />
        )}
        {t > 0 && (
          <circle cx={lineX2} cy={lineY2} r={3} fill={graphColor} stroke="white" strokeWidth={0.5} />
        )}
        <text x={svgW - 5} y={12} textAnchor="end" fontSize={8} fill={isDark ? '#94a3b8' : '#475569'}>slope = a = {a.toFixed(1)}</text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 100 }}>Initial speed v₀:</span>
          <input type="range" aria-label="Initial velocity in meters per second" min={0} max={20} step={0.5} value={v0} onChange={e => setV0(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 50, textAlign: 'right' }}>{v0.toFixed(1)} m/s</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 100 }}>Acceleration a:</span>
          <input type="range" aria-label="Acceleration in meters per second squared" min={-5} max={5} step={0.5} value={a} onChange={e => setA(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 50, textAlign: 'right' }}>{a.toFixed(1)} m/s²</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        {!running ? (
          <button onClick={start} style={{ ...s.btn(true), padding: '3px 10px', fontWeight: 600 }}>Start</button>
        ) : (
          <button onClick={stop} style={{ ...s.btn(false), padding: '3px 10px', color: '#f87171' }}>Stop</button>
        )}
        <button onClick={reset} style={{ ...s.btn(false), padding: '3px 10px' }}>Reset</button>
      </div>

      <div style={{ fontSize: 10, color: s.text, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>Time: <b style={{ color: s.bright }}>{t.toFixed(2)} s</b></span>
        <span>Speed: <b style={{ color: s.bright }}>{currentV.toFixed(2)} m/s</b></span>
        <span>Distance: <b style={{ color: s.bright }}>{distance.toFixed(2)} m</b></span>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Initial speed v₀ = {v0.toFixed(1)} m/s, acceleration a = {a.toFixed(1)} m/s²</div>
        <div>Step 2: At t = {t.toFixed(1)} s, v = v₀ + a×t = {v0.toFixed(1)} + ({a.toFixed(1)})×({t.toFixed(1)}) = <b style={{ color: s.accent }}>{currentV.toFixed(2)} m/s</b></div>
        <div>Step 3: Distance d = v₀t + ½at² = {v0.toFixed(1)}×{t.toFixed(1)} + ½×{a.toFixed(1)}×({t.toFixed(1)})² = <b style={{ color: s.accent }}>{distance.toFixed(2)} m</b></div>
        <div>Step 4: {step4Text}</div>
        <div>Step 5: Speed-time graph is a {a !== 0 ? 'straight line (slope = a)' : 'horizontal line (slope = 0)'}</div>
        <div>Step 6: Shaded area under the graph = total distance traveled</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Acceleration is the RATE at which velocity changes. On a speed-time graph, the SLOPE of the line equals acceleration, and the AREA under the line equals distance traveled. This dual meaning — slope and area — is the heart of calculus: rate of change (derivative) and accumulation (integral).
      </div>
    </div>
  )
}

// ============================================================
// 18. DensityExplorer (Middle School 6-8)
// ============================================================

const DENSITY_MATERIALS = [
  { key: 'wood', label: 'Wood', density: 0.7, color: '#a16207' },
  { key: 'ice', label: 'Ice', density: 0.92, color: '#bae6fd' },
  { key: 'oil', label: 'Oil', density: 0.9, color: '#fde68a' },
  { key: 'rubber', label: 'Rubber', density: 1.2, color: '#1e293b' },
  { key: 'iron', label: 'Iron', density: 7.87, color: '#94a3b8' },
  { key: 'gold', label: 'Gold', density: 19.3, color: '#fbbf24' },
]

export function DensityExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [matKey, setMatKey] = useState('wood')
  const [liquidDensity, setLiquidDensity] = useState(1.0)

  const material = DENSITY_MATERIALS.find(m => m.key === matKey) || DENSITY_MATERIALS[0]
  const objDensity = material.density
  const floats = objDensity < liquidDensity
  const equal = Math.abs(objDensity - liquidDensity) < 0.01
  const comparison = equal ? '=' : (objDensity < liquidDensity ? '<' : '>')

  const svgW = 280
  const svgH = 220
  const cylX = 95
  const cylW = 80
  const cylTopY = 18
  const cylBotY = 195
  const waterTopY = 40
  const liquidColor = liquidDensity < 0.9 ? '#fde68a' : liquidDensity < 1.1 ? '#60a5fa' : liquidDensity > 10 ? '#cbd5e1' : '#7dd3fc'

  const objSize = 22
  let objY: number
  if (equal) {
    objY = waterTopY + (cylBotY - waterTopY) / 2 - objSize / 2
  } else if (floats) {
    const ratio = objDensity / liquidDensity
    objY = waterTopY - objSize * (1 - ratio) - 1
  } else {
    objY = cylBotY - objSize - 4
  }

  const liquidLabel = liquidDensity < 0.9 ? 'Oil-like' : liquidDensity < 1.1 ? 'Water-like' : liquidDensity > 10 ? 'Mercury-like' : 'Dense liquid'
  const ticks = [0, 50, 100, 150, 200, 250]
  const labelColor = (material.color === '#1e293b' || material.color === '#a16207') ? '#fde68a' : '#1e293b'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        <ellipse cx={cylX} cy={cylTopY} rx={cylW / 2} ry={6} fill="none" stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1.5} />
        <line x1={cylX - cylW / 2} y1={cylTopY} x2={cylX - cylW / 2} y2={cylBotY} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1.5} />
        <line x1={cylX + cylW / 2} y1={cylTopY} x2={cylX + cylW / 2} y2={cylBotY} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1.5} />
        <path d={'M ' + (cylX - cylW / 2) + ' ' + cylBotY + ' A ' + (cylW / 2) + ' 6 0 0 0 ' + (cylX + cylW / 2) + ' ' + cylBotY} fill="none" stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1.5} />
        <ellipse cx={cylX} cy={waterTopY} rx={cylW / 2 - 1} ry={5} fill={liquidColor} opacity={0.9} />
        <rect x={cylX - cylW / 2 + 1} y={waterTopY} width={cylW - 2} height={cylBotY - waterTopY} fill={liquidColor} opacity={0.55} />
        <ellipse cx={cylX} cy={cylBotY} rx={cylW / 2 - 1} ry={5} fill={liquidColor} opacity={0.55} />
        {ticks.map((tk, i) => {
          const ty = waterTopY + (i / 5) * (cylBotY - waterTopY)
          return (
            <g key={i}>
              <line x1={cylX - cylW / 2 - 4} y1={ty} x2={cylX - cylW / 2} y2={ty} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={0.8} />
              <text x={cylX - cylW / 2 - 6} y={ty + 3} textAnchor="end" fontSize={7} fill={isDark ? '#94a3b8' : '#475569'}>{tk}</text>
            </g>
          )
        })}
        <rect x={cylX - objSize / 2} y={objY} width={objSize} height={objSize} rx={3} fill={material.color} stroke={isDark ? '#1e293b' : '#475569'} strokeWidth={0.5} />
        <text x={cylX} y={objY + objSize / 2 + 3} textAnchor="middle" fontSize={8} fontWeight={700} fill={labelColor}>{material.label}</text>
        <text x={svgW - 5} y={15} textAnchor="end" fontSize={11} fontWeight={700} fill={equal ? '#fbbf24' : (floats ? '#34d399' : '#f87171')}>{equal ? 'NEUTRAL' : (floats ? 'FLOATS' : 'SINKS')}</text>
        <text x={cylX + cylW / 2 + 5} y={waterTopY + 3} fontSize={7} fill={isDark ? '#94a3b8' : '#475569'}>liquid</text>
        <g transform={'translate(' + (svgW - 90) + ',40)'}>
          <text x={0} y={0} fontSize={8} fill={isDark ? '#94a3b8' : '#475569'}>Densities:</text>
          <text x={0} y={12} fontSize={8} fill={isDark ? '#fbbf24' : '#d97706'}>Obj: {objDensity.toFixed(2)}</text>
          <text x={0} y={24} fontSize={8} fill={isDark ? '#60a5fa' : '#3b82f6'}>Liq: {liquidDensity.toFixed(2)}</text>
          <text x={0} y={40} fontSize={11} fontWeight={700} fill={equal ? '#fbbf24' : (floats ? '#34d399' : '#f87171')}>{comparison}</text>
        </g>
      </svg>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: s.text }}>Material:</span>
        {DENSITY_MATERIALS.map(m => (
          <button key={m.key} onClick={() => setMatKey(m.key)} style={s.btn(matKey === m.key)}>{m.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: s.text, minWidth: 100 }}>Liquid density:</span>
        <input type="range" aria-label="Liquid density in grams per cubic centimeter" min={0.5} max={13} step={0.1} value={liquidDensity} onChange={e => setLiquidDensity(Number(e.target.value))} style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: s.bright, minWidth: 60, textAlign: 'right' }}>{liquidDensity.toFixed(2)} g/cm³</span>
      </div>
      <div style={{ fontSize: 9, color: s.text }}>Liquid type guess: <b style={{ color: s.bright }}>{liquidLabel}</b> (1.0=water, 13.5=mercury)</div>

      <div style={{ fontSize: 10, color: s.text, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>Object: <b style={{ color: s.bright }}>{objDensity.toFixed(2)} g/cm³</b></span>
        <span>Liquid: <b style={{ color: s.bright }}>{liquidDensity.toFixed(2)} g/cm³</b></span>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Object: {material.label} (density = {objDensity.toFixed(2)} g/cm³)</div>
        <div>Step 2: Liquid density = {liquidDensity.toFixed(2)} g/cm³</div>
        <div>Step 3: Compare: {objDensity.toFixed(2)} {comparison} {liquidDensity.toFixed(2)}</div>
        <div>Step 4: {equal ? 'EQUAL densities → object stays suspended (neutral buoyancy)' : (floats ? 'Object is LESS dense → FLOATS (partially submerged)' : 'Object is MORE dense → SINKS to bottom')}</div>
        <div>Step 5: Buoyant force = weight of liquid displaced (Archimedes' principle)</div>
        <div>Step 6: Density = mass ÷ volume — a property of the MATERIAL, not size</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Whether something floats depends ONLY on density comparison — not on size or weight! A massive steel ship floats because its hull encloses lots of air (low average density), while a tiny steel ball sinks. Archimedes discovered this in his bathtub over 2,200 years ago — and shouted "Eureka!"
      </div>
    </div>
  )
}

// ============================================================
// 19. HeatTransferExplorer (Middle School 6-8)
// ============================================================

export function HeatTransferExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [mode, setMode] = useState<'conduction' | 'convection' | 'radiation'>('conduction')
  const [temp, setTemp] = useState(80)
  const [animPhase, setAnimPhase] = useState(0)
  const animRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    const animate = (time: number) => {
      if (startRef.current === 0) startRef.current = time
      const elapsed = (time - startRef.current) / 1000
      setAnimPhase(elapsed)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const modeLabel = mode === 'conduction' ? 'Conduction' : mode === 'convection' ? 'Convection' : 'Radiation'
  const svgW = 280
  const svgH = 160
  const heatColor = temp > 70 ? '#ef4444' : temp > 40 ? '#f97316' : temp > 20 ? '#eab308' : '#38bdf8'
  const heatIntensity = Math.min(1, temp / 100)
  const t = animPhase
  const flameFlicker = 1 + 0.2 * Math.sin(t * 8)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => setMode('conduction')} style={s.btn(mode === 'conduction')}>Conduction</button>
        <button onClick={() => setMode('convection')} style={s.btn(mode === 'convection')}>Convection</button>
        <button onClick={() => setMode('radiation')} style={s.btn(mode === 'radiation')}>Radiation</button>
      </div>

      <svg viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        {mode === 'conduction' && (
          <g>
            <ellipse cx={35} cy={125} rx={14} ry={(heatIntensity * 10 + 5) * flameFlicker} fill={heatColor} opacity={0.85} />
            <ellipse cx={35} cy={128} rx={8} ry={heatIntensity * 6 + 3} fill="#fde68a" opacity={0.9} />
            <text x={35} y={152} textAnchor="middle" fontSize={8} fill={isDark ? '#94a3b8' : '#475569'}>Heat source</text>
            <rect x={50} y={100} width={180} height={14} fill={isDark ? '#64748b' : '#94a3b8'} stroke={isDark ? '#475569' : '#64748b'} strokeWidth={0.5} />
            {Array.from({ length: 18 }).map((_, i) => {
              const frac = i / 17
              const opacity = (1 - frac) * heatIntensity * 0.6
              return <rect key={i} x={50 + i * 10} y={100} width={10} height={14} fill={heatColor} opacity={opacity} />
            })}
            {Array.from({ length: 5 }).map((_, i) => {
              const phase = (t * 0.6 + i * 0.2) % 1
              const px = 50 + phase * 180
              return <circle key={i} cx={px} cy={107} r={3} fill={heatColor} opacity={(1 - phase) * 0.8} />
            })}
            <circle cx={245} cy={107} r={14} fill={isDark ? '#fbbf24' : '#fde68a'} opacity={0.9} />
            <text x={245} y={140} textAnchor="middle" fontSize={8} fill={isDark ? '#94a3b8' : '#475569'}>Hand</text>
            <text x={140} y={85} textAnchor="middle" fontSize={9} fill={isDark ? '#fbbf24' : '#d97706'}>Heat flows: HOT → COLD</text>
          </g>
        )}

        {mode === 'convection' && (
          <g>
            <path d={'M 50 45 L 50 140 Q 50 150 60 150 L 220 150 Q 230 150 230 140 L 230 45'} fill="none" stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={2} />
            <rect x={52} y={65} width={176} height={83} fill={isDark ? '#1e40af' : '#3b82f6'} opacity={0.4} />
            <line x1={52} y1={65} x2={228} y2={65} stroke={isDark ? '#60a5fa' : '#1d4ed8'} strokeWidth={1} opacity={0.6} />
            <ellipse cx={140} cy={165} rx={45} ry={5} fill={heatColor} opacity={0.8} />
            {Array.from({ length: 6 }).map((_, i) => (
              <path key={'flame' + i} d={'M ' + (110 + i * 12) + ' 165 Q ' + (114 + i * 12) + ' ' + (155 - heatIntensity * 6) + ' ' + (118 + i * 12) + ' 165'} fill={heatColor} opacity={0.6} />
            ))}
            <text x={140} y={20} textAnchor="middle" fontSize={9} fill={isDark ? '#fbbf24' : '#d97706'}>Warm rises ↑, Cool sinks ↓</text>
            <path d={'M 200 140 Q 215 100 200 65 Q 180 90 165 65 Q 145 100 165 140'} fill="none" stroke="#fbbf24" strokeWidth={1.5} opacity={0.6} strokeDasharray="3,3" />
            <path d={'M 80 140 Q 65 100 80 65 Q 100 90 115 65 Q 135 100 115 140'} fill="none" stroke="#fbbf24" strokeWidth={1.5} opacity={0.6} strokeDasharray="3,3" />
            {Array.from({ length: 8 }).map((_, i) => {
              const phase = (t * 0.4 + i / 8) % 1
              const side = i % 2 === 0 ? 1 : -1
              const baseX = 140 + side * 55
              const px = side === 1 ? baseX - phase * 50 : baseX + phase * 50
              const py = 140 - Math.sin(phase * Math.PI) * 70
              const opacity = heatIntensity * (1 - Math.abs(phase - 0.5) * 0.5)
              return <circle key={i} cx={px} cy={py} r={3} fill={heatColor} opacity={opacity} />
            })}
          </g>
        )}

        {mode === 'radiation' && (
          <g>
            <circle cx={50} cy={80} r={26} fill="#fbbf24" opacity={0.95} />
            <circle cx={50} cy={80} r={30} fill="#fbbf24" opacity={0.2} />
            {Array.from({ length: 12 }).map((_, i) => {
              const ang = i * 30 * Math.PI / 180
              const x1 = 50 + 30 * Math.cos(ang)
              const y1 = 80 + 30 * Math.sin(ang)
              const x2 = 50 + 40 * Math.cos(ang)
              const y2 = 80 + 40 * Math.sin(ang)
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fbbf24" strokeWidth={2} opacity={0.7} />
            })}
            <text x={50} y={130} textAnchor="middle" fontSize={9} fill={isDark ? '#fbbf24' : '#d97706'}>Sun (5778 K)</text>
            <circle cx={230} cy={85} r={16} fill="#3b82f6" />
            <ellipse cx={230} cy={85} rx={18} ry={4} fill="#10b981" opacity={0.4} />
            <text x={230} y={120} textAnchor="middle" fontSize={9} fill={isDark ? '#60a5fa' : '#1d4ed8'}>Earth</text>
            <rect x={85} y={70} width={125} height={30} fill="none" stroke={isDark ? '#475569' : '#94a3b8'} strokeDasharray="2,4" strokeWidth={0.5} />
            <text x={147} y={62} textAnchor="middle" fontSize={8} fill={isDark ? '#94a3b8' : '#475569'}>VACUUM (no medium)</text>
            {Array.from({ length: 5 }).map((_, i) => {
              const phase = (t * 0.5 + i / 5) % 1
              const px = 80 + phase * 130
              const opacity = (1 - phase) * 0.9
              return (
                <g key={i} opacity={opacity}>
                  <path d={'M ' + (px - 6) + ' 85 Q ' + (px - 3) + ' 80 ' + px + ' 85 Q ' + (px + 3) + ' 90 ' + (px + 6) + ' 85'} fill="none" stroke="#fbbf24" strokeWidth={1.5} />
                </g>
              )
            })}
            <text x={147} y={145} textAnchor="middle" fontSize={9} fill={isDark ? '#fbbf24' : '#d97706'}>Infrared radiation →</text>
          </g>
        )}
      </svg>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: s.text, minWidth: 100 }}>Temperature:</span>
        <input type="range" aria-label="Temperature in degrees Celsius" min={5} max={100} step={1} value={temp} onChange={e => setTemp(Number(e.target.value))} style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: s.bright, minWidth: 50, textAlign: 'right' }}>{temp}°C</span>
      </div>

      <div style={{ fontSize: 10, color: s.text, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>Mode: <b style={{ color: s.bright }}>{modeLabel}</b></span>
        <span>Heat source: <b style={{ color: s.bright }}>{temp}°C</b></span>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Mode: {modeLabel} | Heat source temp = {temp}°C</div>
        <div>Step 2: Conduction = heat through SOLID (direct contact); Convection = through FLUID (moving liquid/gas); Radiation = through SPACE (no medium needed)</div>
        {mode === 'conduction' && <div>Step 3: Hot atoms at the flame vibrate fast → bump neighbors → transfer kinetic energy</div>}
        {mode === 'conduction' && <div>Step 4: Energy travels down the rod atom-by-atom — no atoms move, only energy</div>}
        {mode === 'convection' && <div>Step 3: Heat at bottom warms water → it EXPANDS and becomes LESS dense → rises</div>}
        {mode === 'convection' && <div>Step 4: Warm water cools at top → becomes denser → sinks → cycle repeats (convection cell)</div>}
        {mode === 'radiation' && <div>Step 3: Hot sun emits electromagnetic waves (infrared, visible light) — no particles needed</div>}
        {mode === 'radiation' && <div>Step 4: Waves travel through vacuum at speed of light (300,000 km/s) → absorbed by Earth</div>}
        <div>Step 5: In all three modes, heat always flows from HOT (high temp) → COLD (low temp)</div>
        <div>Step 6: The 2nd Law of Thermodynamics: heat NEVER flows cold → hot on its own</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Heat transfer is energy in motion. Conduction needs touch (solids), convection needs flow (fluids), radiation needs nothing (works in vacuum — that's how the Sun's heat reaches Earth across 150 million km of empty space). The 2nd Law of Thermodynamics guarantees heat always flows hot → cold; the reverse requires external work (like a refrigerator).
      </div>
    </div>
  )
}

// ============================================================
// 20. LightColorMixing (Middle School 6-8)
// ============================================================

export function LightColorMixing({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [r, setR] = useState(80)
  const [g, setG] = useState(80)
  const [b, setB] = useState(0)
  const [additive, setAdditive] = useState(true)

  const svgW = 280
  const svgH = 150
  const cx1 = svgW / 2 - 25
  const cx2 = svgW / 2 + 25
  const cx3 = svgW / 2
  const cy1 = svgH / 2 - 18
  const cy2 = svgH / 2 - 18
  const cy3 = svgH / 2 + 20
  const rad = 38

  let resultR: number, resultG: number, resultB: number
  if (additive) {
    resultR = Math.round(r * 2.55)
    resultG = Math.round(g * 2.55)
    resultB = Math.round(b * 2.55)
  } else {
    resultR = 255 - Math.round(r * 2.55)
    resultG = 255 - Math.round(g * 2.55)
    resultB = 255 - Math.round(b * 2.55)
  }
  const mixedColor = 'rgb(' + resultR + ',' + resultG + ',' + resultB + ')'

  const rOn = r >= 50, gOn = g >= 50, bOn = b >= 50
  let mixName = ''
  if (additive) {
    if (rOn && gOn && bOn) mixName = 'White'
    else if (rOn && gOn) mixName = 'Yellow'
    else if (rOn && bOn) mixName = 'Magenta'
    else if (gOn && bOn) mixName = 'Cyan'
    else if (rOn) mixName = 'Red'
    else if (gOn) mixName = 'Green'
    else if (bOn) mixName = 'Blue'
    else mixName = 'Black (no light)'
  } else {
    if (rOn && gOn && bOn) mixName = 'Black (all absorbed)'
    else if (rOn && gOn) mixName = 'Blue'
    else if (rOn && bOn) mixName = 'Green'
    else if (gOn && bOn) mixName = 'Red'
    else if (rOn) mixName = 'Cyan'
    else if (gOn) mixName = 'Magenta'
    else if (bOn) mixName = 'Yellow'
    else mixName = 'White (no ink)'
  }

  const c1Color = additive ? 'rgb(255,0,0)' : 'rgb(0,255,255)'
  const c2Color = additive ? 'rgb(0,255,0)' : 'rgb(255,0,255)'
  const c3Color = additive ? 'rgb(0,0,255)' : 'rgb(255,255,0)'
  const c1Opacity = r / 100
  const c2Opacity = g / 100
  const c3Opacity = b / 100
  const c1Label = additive ? 'R' : 'C'
  const c2Label = additive ? 'G' : 'M'
  const c3Label = additive ? 'B' : 'Y'
  const blendMode: 'screen' | 'multiply' = additive ? 'screen' : 'multiply'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ width: '100%', height: 'auto', borderRadius: 4, background: additive ? '#000' : '#fff', border: '1px solid ' + s.border }}>
        <g>
          <circle cx={cx1} cy={cy1} r={rad} fill={c1Color} opacity={c1Opacity} style={{ mixBlendMode: blendMode }} />
          <circle cx={cx2} cy={cy2} r={rad} fill={c2Color} opacity={c2Opacity} style={{ mixBlendMode: blendMode }} />
          <circle cx={cx3} cy={cy3} r={rad} fill={c3Color} opacity={c3Opacity} style={{ mixBlendMode: blendMode }} />
        </g>
        <circle cx={cx1} cy={cy1} r={rad} fill="none" stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} strokeWidth={0.5} strokeDasharray="2,2" />
        <circle cx={cx2} cy={cy2} r={rad} fill="none" stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} strokeWidth={0.5} strokeDasharray="2,2" />
        <circle cx={cx3} cy={cy3} r={rad} fill="none" stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} strokeWidth={0.5} strokeDasharray="2,2" />
        <text x={cx1} y={cy1 - rad - 4} textAnchor="middle" fontSize={9} fontWeight={700} fill={additive ? '#f87171' : '#06b6d4'}>{c1Label} {r}%</text>
        <text x={cx2} y={cy2 - rad - 4} textAnchor="middle" fontSize={9} fontWeight={700} fill={additive ? '#34d399' : '#ec4899'}>{c2Label} {g}%</text>
        <text x={cx3} y={cy3 + rad + 12} textAnchor="middle" fontSize={9} fontWeight={700} fill={additive ? '#60a5fa' : '#eab308'}>{c3Label} {b}%</text>
        <rect x={svgW - 60} y={10} width={50} height={16} fill={mixedColor} stroke={isDark ? '#475569' : '#cbd5e1'} strokeWidth={0.5} />
        <text x={svgW - 35} y={42} textAnchor="middle" fontSize={9} fontWeight={700} fill={isDark ? '#fbbf24' : '#d97706'}>{mixName}</text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 30 }}>{c1Label}:</span>
          <input type="range" aria-label="Red color value" min={0} max={100} step={1} value={r} onChange={e => setR(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{r}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 30 }}>{c2Label}:</span>
          <input type="range" aria-label="Green color value" min={0} max={100} step={1} value={g} onChange={e => setG(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{g}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 30 }}>{c3Label}:</span>
          <input type="range" aria-label="Blue color value" min={0} max={100} step={1} value={b} onChange={e => setB(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{b}%</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => setAdditive(true)} style={s.btn(additive)}>Additive (RGB)</button>
        <button onClick={() => setAdditive(false)} style={s.btn(!additive)}>Subtractive (CMY)</button>
      </div>

      <div style={{ fontSize: 10, color: s.text }}>
        Result: <b style={{ color: s.bright }}>{mixName}</b> — RGB ({resultR}, {resultG}, {resultB})
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Mode: {additive ? 'Additive (RGB light)' : 'Subtractive (CMY pigments)'}</div>
        <div>Step 2: {c1Label}={r}%, {c2Label}={g}%, {c3Label}={b}%</div>
        <div>Step 3: Mixing rules — {additive ? 'R+G=Yellow, R+B=Magenta, G+B=Cyan, R+G+B=White' : 'C+M=Blue, C+Y=Green, M+Y=Red, C+M+Y=Black'}</div>
        <div>Step 4: Current mix: <b style={{ color: s.accent }}>{mixName}</b></div>
        <div>Step 5: More colors = {additive ? 'MORE light (toward white) — adding photons' : 'LESS light (toward black) — more pigments absorb'}</div>
        <div>Step 6: {additive ? 'Screens EMIT light (RGB primaries) — used by phones, TVs' : 'Paint/ink ABSORBS light (CMY primaries) — used by printers, crayons'}</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Additive mixing starts with darkness and ADDS light — used by every screen you look at. Subtractive mixing starts with white light and REMOVES wavelengths — used by paint, ink, and filters. They are mirror images: the primary colors of one are the secondary colors of the other (RGB ↔ CMY).
      </div>
    </div>
  )
}

// ============================================================
// 21. SimpleMachinesExplorer (Middle School 6-8)
// ============================================================

export function SimpleMachinesExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [machine, setMachine] = useState<'lever' | 'pulley' | 'incline' | 'wheel'>('lever')

  const [effortArm, setEffortArm] = useState(4)
  const [loadArm, setLoadArm] = useState(1)
  const [strands, setStrands] = useState(3)
  const [rampLen, setRampLen] = useState(5)
  const [rampHeight, setRampHeight] = useState(1)
  const [wheelR, setWheelR] = useState(4)
  const [axleR, setAxleR] = useState(1)

  const LOAD = 100

  const ma = useMemo(() => {
    if (machine === 'lever') return effortArm / loadArm
    if (machine === 'pulley') return strands
    if (machine === 'incline') return rampLen / rampHeight
    return wheelR / axleR
  }, [machine, effortArm, loadArm, strands, rampLen, rampHeight, wheelR, axleR])

  const effort = LOAD / ma

  const machineLabel = machine === 'lever' ? 'Lever' : machine === 'pulley' ? 'Pulley' : machine === 'incline' ? 'Inclined Plane' : 'Wheel & Axle'
  const svgW = 280
  const svgH = 160

  // Lever geometry
  const leverBaseY = 110
  const leverFulcrumX = svgW / 2
  const leverScale = 16
  const leverLeftEnd = leverFulcrumX - effortArm * leverScale
  const leverRightEnd = leverFulcrumX + loadArm * leverScale

  // Pulley geometry
  const pulleyCx = svgW / 2
  const pulleyTopY = 30
  const pulleyBlockY = 95
  const pulleyLoadY = 130
  const ropeSpacing = 12
  const pulleyStartX = pulleyCx - (strands - 1) * ropeSpacing / 2

  // Incline geometry
  const incBaseX = 30
  const incBaseY = 140
  const incRampW = Math.min(rampLen * 18, 200)
  const incRampH = Math.min(rampHeight * 18, 90)
  const incTopX = incBaseX + incRampW
  const incTopY = incBaseY - incRampH
  const incMidX = (incBaseX + incTopX) / 2
  const incMidY = (incBaseY + incTopY) / 2
  const incAng = Math.atan2(incTopY - incBaseY, incTopX - incBaseX) * 180 / Math.PI

  // Wheel geometry
  const wheelCx = svgW / 2
  const wheelCy = svgH / 2 - 5
  const wheelVisR = Math.min(wheelR * 12, 70)
  const axleVisR = Math.max(axleR * 5, 8)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button onClick={() => setMachine('lever')} style={s.btn(machine === 'lever')}>Lever</button>
        <button onClick={() => setMachine('pulley')} style={s.btn(machine === 'pulley')}>Pulley</button>
        <button onClick={() => setMachine('incline')} style={s.btn(machine === 'incline')}>Incline</button>
        <button onClick={() => setMachine('wheel')} style={s.btn(machine === 'wheel')}>Wheel & Axle</button>
      </div>

      <svg viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ width: '100%', height: 'auto', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        {machine === 'lever' && (
          <g>
            <polygon points={(leverFulcrumX - 10) + ',' + leverBaseY + ' ' + (leverFulcrumX + 10) + ',' + leverBaseY + ' ' + leverFulcrumX + ',' + (leverBaseY + 18)} fill={isDark ? '#fbbf24' : '#d97706'} />
            <line x1={leverLeftEnd} y1={leverBaseY} x2={leverRightEnd} y2={leverBaseY} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={3} />
            <g>
              <text x={leverLeftEnd + 15} y={leverBaseY - 25} textAnchor="middle" fontSize={8} fill={isDark ? '#34d399' : '#059669'}>{effort.toFixed(1)}N ↓</text>
              <line x1={leverLeftEnd + 15} y1={leverBaseY - 22} x2={leverLeftEnd + 15} y2={leverBaseY - 5} stroke={isDark ? '#34d399' : '#059669'} strokeWidth={1.5} />
              <polygon points={(leverLeftEnd + 12) + ',' + (leverBaseY - 8) + ' ' + (leverLeftEnd + 15) + ',' + (leverBaseY - 3) + ' ' + (leverLeftEnd + 18) + ',' + (leverBaseY - 8)} fill={isDark ? '#34d399' : '#059669'} />
            </g>
            <g transform={'translate(' + (leverRightEnd - 12) + ',' + (leverBaseY - 22) + ')'}>
              <rect x={0} y={0} width={24} height={22} fill="#ef4444" />
              <text x={12} y={14} textAnchor="middle" fontSize={9} fontWeight={700} fill="white">100N</text>
            </g>
            <text x={(leverFulcrumX + leverLeftEnd) / 2} y={leverBaseY + 35} textAnchor="middle" fontSize={8} fill={isDark ? '#60a5fa' : '#3b82f6'}>effort arm = {effortArm}m</text>
            <text x={(leverFulcrumX + leverRightEnd) / 2} y={leverBaseY + 35} textAnchor="middle" fontSize={8} fill={isDark ? '#f87171' : '#dc2626'}>load arm = {loadArm}m</text>
          </g>
        )}

        {machine === 'pulley' && (
          <g>
            <line x1={20} y1={20} x2={svgW - 20} y2={20} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={3} />
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={i} x1={30 + i * 30} y1={20} x2={36 + i * 30} y2={28} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={0.5} />
            ))}
            <circle cx={pulleyCx} cy={pulleyTopY + 10} r={10} fill="none" stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={2} />
            <circle cx={pulleyCx} cy={pulleyTopY + 10} r={2} fill={isDark ? '#94a3b8' : '#475569'} />
            <rect x={pulleyCx - 25} y={pulleyBlockY} width={50} height={15} fill={isDark ? '#475569' : '#94a3b8'} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1} />
            {Array.from({ length: strands }).map((_, i) => {
              const x = pulleyStartX + i * ropeSpacing
              return <line key={i} x1={x} y1={pulleyTopY + 10} x2={x} y2={pulleyBlockY} stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth={1} />
            })}
            <line x1={pulleyCx} y1={pulleyBlockY + 15} x2={pulleyCx} y2={pulleyLoadY} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1} />
            <rect x={pulleyCx - 20} y={pulleyLoadY} width={40} height={22} fill="#ef4444" />
            <text x={pulleyCx} y={pulleyLoadY + 14} textAnchor="middle" fontSize={9} fontWeight={700} fill="white">100N</text>
            <g transform={'translate(' + pulleyStartX + ',' + (pulleyTopY + 10) + ')'}>
              <text x={-15} y={20} textAnchor="middle" fontSize={8} fill={isDark ? '#34d399' : '#059669'}>{effort.toFixed(1)}N</text>
              <line x1={0} y1={0} x2={-12} y2={15} stroke={isDark ? '#34d399' : '#059669'} strokeWidth={1.5} />
              <polygon points="-10,12 -14,17 -8,17" fill={isDark ? '#34d399' : '#059669'} />
            </g>
            <text x={pulleyCx} y={pulleyLoadY + 32} textAnchor="middle" fontSize={8} fill={isDark ? '#94a3b8' : '#475569'}>{strands} supporting strands → MA = {strands}</text>
          </g>
        )}

        {machine === 'incline' && (
          <g>
            <polygon points={incBaseX + ',' + incBaseY + ' ' + incTopX + ',' + incBaseY + ' ' + incTopX + ',' + incTopY} fill={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1.5} />
            <g transform={'translate(' + incMidX + ',' + incMidY + ') rotate(' + incAng + ') translate(-12,-22)'}>
              <rect x={0} y={0} width={24} height={20} fill="#ef4444" />
              <text x={12} y={13} textAnchor="middle" fontSize={8} fontWeight={700} fill="white">100N</text>
            </g>
            <g>
              <line x1={incBaseX + 18} y1={incBaseY - 6} x2={incBaseX + 48} y2={incBaseY - 6 - (incRampH / incRampW) * 30} stroke={isDark ? '#34d399' : '#059669'} strokeWidth={1.5} />
              <text x={incBaseX + 25} y={incBaseY - 18} fontSize={8} fill={isDark ? '#34d399' : '#059669'}>{effort.toFixed(1)}N</text>
            </g>
            <text x={(incBaseX + incTopX) / 2} y={incBaseY + 13} textAnchor="middle" fontSize={8} fill={isDark ? '#60a5fa' : '#3b82f6'}>L = {rampLen}m</text>
            <text x={incTopX + 5} y={(incTopY + incBaseY) / 2} fontSize={8} fill={isDark ? '#f87171' : '#dc2626'}>h = {rampHeight}m</text>
          </g>
        )}

        {machine === 'wheel' && (
          <g>
            <circle cx={wheelCx} cy={wheelCy} r={wheelVisR} fill={isDark ? 'rgba(96,165,250,0.1)' : 'rgba(59,130,246,0.1)'} stroke={isDark ? '#60a5fa' : '#3b82f6'} strokeWidth={3} />
            {Array.from({ length: 8 }).map((_, i) => {
              const ang = i * 45 * Math.PI / 180
              const x1 = wheelCx + axleVisR * Math.cos(ang)
              const y1 = wheelCy + axleVisR * Math.sin(ang)
              const x2 = wheelCx + wheelVisR * Math.cos(ang)
              const y2 = wheelCy + wheelVisR * Math.sin(ang)
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={0.5} />
            })}
            <circle cx={wheelCx} cy={wheelCy} r={axleVisR} fill={isDark ? '#fbbf24' : '#d97706'} opacity={0.8} />
            <circle cx={wheelCx} cy={wheelCy} r={2} fill={isDark ? '#1e293b' : '#475569'} />
            <line x1={wheelCx} y1={wheelCy + axleVisR} x2={wheelCx} y2={svgH - 25} stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth={1} />
            <rect x={wheelCx - 18} y={svgH - 25} width={36} height={20} fill="#ef4444" />
            <text x={wheelCx} y={svgH - 11} textAnchor="middle" fontSize={9} fontWeight={700} fill="white">100N</text>
            <g transform={'translate(' + (wheelCx - wheelVisR - 18) + ',' + (wheelCy - 5) + ')'}>
              <text x={0} y={-2} textAnchor="middle" fontSize={8} fill={isDark ? '#34d399' : '#059669'}>{effort.toFixed(1)}N</text>
              <line x1={0} y1={0} x2={12} y2={0} stroke={isDark ? '#34d399' : '#059669'} strokeWidth={1.5} />
              <polygon points="10,-3 15,0 10,3" fill={isDark ? '#34d399' : '#059669'} />
            </g>
            <text x={wheelCx} y={20} textAnchor="middle" fontSize={8} fill={isDark ? '#60a5fa' : '#3b82f6'}>Wheel R = {wheelR}</text>
            <text x={wheelCx} y={wheelCy + 20} textAnchor="middle" fontSize={8} fill={isDark ? '#fbbf24' : '#d97706'}>Axle r = {axleR}</text>
          </g>
        )}
      </svg>

      {machine === 'lever' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: s.text, minWidth: 100 }}>Effort arm:</span>
            <input type="range" aria-label="Effort arm length" min={1} max={6} step={0.5} value={effortArm} onChange={e => setEffortArm(Number(e.target.value))} style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{effortArm}m</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: s.text, minWidth: 100 }}>Load arm:</span>
            <input type="range" aria-label="Load arm length" min={0.5} max={3} step={0.5} value={loadArm} onChange={e => setLoadArm(Number(e.target.value))} style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{loadArm}m</span>
          </div>
        </div>
      )}
      {machine === 'pulley' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 100 }}>Supporting strands:</span>
          <input type="range" aria-label="Number of supporting strands" min={1} max={6} step={1} value={strands} onChange={e => setStrands(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{strands}</span>
        </div>
      )}
      {machine === 'incline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: s.text, minWidth: 100 }}>Ramp length:</span>
            <input type="range" aria-label="Ramp length" min={2} max={10} step={0.5} value={rampLen} onChange={e => setRampLen(Number(e.target.value))} style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{rampLen}m</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: s.text, minWidth: 100 }}>Ramp height:</span>
            <input type="range" aria-label="Ramp height" min={0.5} max={4} step={0.5} value={rampHeight} onChange={e => setRampHeight(Number(e.target.value))} style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{rampHeight}m</span>
          </div>
        </div>
      )}
      {machine === 'wheel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: s.text, minWidth: 100 }}>Wheel radius:</span>
            <input type="range" aria-label="Wheel radius" min={2} max={6} step={0.5} value={wheelR} onChange={e => setWheelR(Number(e.target.value))} style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{wheelR}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: s.text, minWidth: 100 }}>Axle radius:</span>
            <input type="range" aria-label="Axle radius" min={0.5} max={3} step={0.5} value={axleR} onChange={e => setAxleR(Number(e.target.value))} style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: s.bright, minWidth: 35, textAlign: 'right' }}>{axleR}</span>
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: s.text, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>MA: <b style={{ color: s.bright }}>{ma.toFixed(2)}</b></span>
        <span>Load: <b style={{ color: s.bright }}>100 N</b></span>
        <span>Effort: <b style={{ color: '#34d399' }}>{effort.toFixed(2)} N</b></span>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Machine: <b>{machineLabel}</b></div>
        <div>Step 2: {machine === 'lever' ? 'Effort arm = ' + effortArm + 'm, Load arm = ' + loadArm + 'm' : machine === 'pulley' ? 'Supporting rope strands = ' + strands : machine === 'incline' ? 'Ramp length L = ' + rampLen + 'm, height h = ' + rampHeight + 'm' : 'Wheel radius = ' + wheelR + ', axle radius = ' + axleR}</div>
        <div>Step 3: MA = {machine === 'lever' ? 'effort arm ÷ load arm = ' + effortArm + ' ÷ ' + loadArm : machine === 'pulley' ? 'number of supporting strands = ' + strands : machine === 'incline' ? 'L ÷ h = ' + rampLen + ' ÷ ' + rampHeight : 'R ÷ r = ' + wheelR + ' ÷ ' + axleR} = <b style={{ color: s.accent }}>{ma.toFixed(2)}</b></div>
        <div>Step 4: Effort = Load ÷ MA = 100 ÷ {ma.toFixed(2)} = <b style={{ color: s.accent }}>{effort.toFixed(2)} N</b></div>
        <div>Step 5: To increase MA: {machine === 'lever' ? 'longer effort arm or shorter load arm' : machine === 'pulley' ? 'add more supporting rope strands (more pulleys)' : machine === 'incline' ? 'longer ramp or shorter height (gentler slope)' : 'larger wheel or smaller axle'}</div>
        <div>Step 6: Trade distance for force — Work = F × d stays constant (energy conserved)</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Simple machines DON'T create energy — they trade distance for force. You can lift a 100 N load with 20 N of effort, but you must pull 5× farther than the load moves. The product (force × distance) — the WORK — is conserved. This is the Conservation of Energy in disguise: you can never get more OUT than you put IN.
      </div>
    </div>
  )
}
