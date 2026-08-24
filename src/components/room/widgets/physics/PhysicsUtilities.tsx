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
          <span style={{ fontSize: 10, color: s.bright, minWidth: 40, textAlign: 'right' }}>{amplitude} m</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 80 }}>{'Wavelength (\u03BB):'}</span>
          <input type="range" min={20} max={100} step={1} value={wavelength} onChange={e => setWavelength(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: s.bright, minWidth: 40, textAlign: 'right' }}>{wavelength} m</span>
        </div>
      </div>
      {/* Info */}
      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: s.text }}>
        <span>T = 1/f = <b style={{ color: s.bright }}>{period.toFixed(3)} s</b></span>
        <span>v = f{'\u00B7\u03BB'} = <b style={{ color: s.bright }}>{waveSpeed.toFixed(1)} m/s</b></span>
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
      <div style={{ fontSize: 9, color: s.text, opacity: 0.7, borderTop: '1px solid ' + s.border, paddingTop: 4 }}>
        y = v₀sin(θ)t - ½gt² &nbsp;|&nbsp; x = v₀cos(θ)t &nbsp;|&nbsp; H = v₀²sin²(θ)/2g &nbsp;|&nbsp; R = v₀²sin(2θ)/g &nbsp;|&nbsp; T = 2v₀sin(θ)/g
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
            <input style={s.input} type="number" value={comp.value || 0} onChange={e => updateCompValue(comp.id, e.target.value)} />
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
              <input style={{ ...s.input, width: 40 }} type="number" value={mag.toFixed(1)} onChange={e => updateForceMag(f.id, parseFloat(e.target.value) || 0)} />
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
        <input style={{ ...s.input, width: 80 }} placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
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
    </div>
  )
}