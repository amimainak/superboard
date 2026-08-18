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
      {result && (
        <div style={{ fontSize: 12, fontWeight: 700, color: s.accent, padding: '4px 8px', background: 'rgba(5,150,105,0.08)', borderRadius: 4, wordBreak: 'break-all' }}>
          {result}
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
          <input type="range" min={0.5} max={5} step={0.1} value={frequency} onChange={e => setFrequency(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 40, textAlign: 'right' }}>{frequency.toFixed(1)} Hz</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Amplitude:</span>
          <input type="range" min={10} max={50} step={1} value={amplitude} onChange={e => setAmplitude(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 40, textAlign: 'right' }}>{amplitude}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>{'Wavelength (\u03BB):'}</span>
          <input type="range" min={20} max={100} step={1} value={wavelength} onChange={e => setWavelength(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 40, textAlign: 'right' }}>{wavelength}</span>
        </div>
      </div>
      {/* Info */}
      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: s.text }}>
        <span>T = 1/f = <b style={{ color: s.bright }}>{period.toFixed(3)} s</b></span>
        <span>v = f{'\u00B7\u03BB'} = <b style={{ color: s.bright }}>{waveSpeed.toFixed(1)} px/s</b></span>
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
          <input type="range" min={0.5} max={3} step={0.1} value={length} onChange={e => setLength(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 40, textAlign: 'right' }}>{length.toFixed(1)} m</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Gravity:</span>
          <input type="range" min={1} max={20} step={0.1} value={gravity} onChange={e => setGravity(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 50, textAlign: 'right' }}>{gravity.toFixed(1)} m/s{'\u00B2'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>Initial angle:</span>
          <input type="range" min={5} max={80} step={1} value={initialAngleDeg} onChange={e => setInitialAngleDeg(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 40, textAlign: 'right' }}>{initialAngleDeg}{'\u00B0'}</span>
        </div>
      </div>
      {/* Controls and info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={running ? resetSim : startSim} style={{ ...s.btn(!running), padding: '3px 10px', fontWeight: 600 }}>
          {running ? 'Reset' : 'Start'}
        </button>
        <span style={{ fontSize: 10, color: s.text }}>
          T = 2{'\u03C0'}{'\u221A'}(L/g) = <b style={{ color: s.bright }}>{period.toFixed(3)} s</b>
        </span>
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
          <input type="range" min={5} max={50} step={1} value={velocity} onChange={e => setVelocity(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 50, textAlign: 'right' }}>{velocity} m/s</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 90 }}>Launch angle:</span>
          <input type="range" min={5} max={85} step={1} value={angle} onChange={e => setAngle(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 30, textAlign: 'right' }}>{angle}{'\u00B0'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 90 }}>Gravity:</span>
          <input type="range" min={1} max={20} step={0.1} value={grav} onChange={e => setGrav(Number(e.target.value))} style={{ flex: 1 }} />
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
    </div>
  )
}