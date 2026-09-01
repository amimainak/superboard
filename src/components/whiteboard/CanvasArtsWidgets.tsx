'use client'

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { WidgetElement } from '@/lib/whiteboard/types'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

// ============================================================
// On-Canvas Arts & Classroom Widgets
// ============================================================

interface CanvasWidgetProps {
  element: WidgetElement
  isDark: boolean
}

/** Debounced config updater */
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

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return updateConfig
}

// ============================================================
// 1. Color Theory Canvas Widget
// ============================================================

function CanvasColorTheory({ element, isDark }: CanvasWidgetProps) {
  const config = element.config
  const [hue, setHue] = useState((config.hue as number) ?? 200)
  const [sat, setSat] = useState((config.sat as number) ?? 70)
  const [light, setLight] = useState((config.light as number) ?? 50)
  const [harmony, setHarmony] = useState<string>((config.harmony as string) ?? 'complementary')
  const updateConfig = useConfigUpdater(element.id)

  const hslToHex = (h: number, s: number, l: number) => {
    s /= 100; l /= 100
    const k = (n: number) => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
    const toH = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
    return '#' + toH(f(0)) + toH(f(8)) + toH(f(4))
  }

  const getHarmonyHues = (): number[] => {
    switch (harmony) {
      case 'complementary': return [hue, (hue + 180) % 360]
      case 'analogous': return [hue, (hue + 30) % 360, (hue + 330) % 360]
      case 'triadic': return [hue, (hue + 120) % 360, (hue + 240) % 360]
      case 'split': return [hue, (hue + 150) % 360, (hue + 210) % 360]
      default: return [hue]
    }
  }

  const mainHex = hslToHex(hue, sat, light)
  const harmonyHexes = getHarmonyHues().map(h => hslToHex(h, sat, light))
  const valueScale = Array.from({ length: 9 }, (_, i) => hslToHex(hue, sat, 10 + i * 10))
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const btnBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const harmonyTypes = ['complementary', 'analogous', 'triadic', 'split']

  const update = (patch: Record<string, unknown>) => {
    updateConfig(patch)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: 2 }}>Color Theory Explorer</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        <div style={{ width: 72, height: 56, borderRadius: 8, background: mainHex, border: '2px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'), flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace', color: isDark ? '#e2e8f0' : '#1e293b' }}>{mainHex.toUpperCase()}</div>
          <div style={{ fontSize: 10, color: labelColor }}>HSL({hue}, {sat}%, {light}%)</div>
        </div>
      </div>
      {([['Hue', 0, 360, hue], ['Sat', 0, 100, sat], ['Light', 0, 100, light]] as [string, number, number, number][]).map(([label, min, max, val]) => (
        <div key={label}>
          <div style={{ fontSize: 9, color: labelColor, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>{label}</span><span style={{ fontFamily: 'monospace' }}>{label === 'Hue' ? val + '\u00b0' : val + '%'}</span>
          </div>
          <input type="range" min={min} max={max} step={1} value={val} onChange={(e) => {
            const v = Number(e.target.value)
            if (label === 'Hue') { setHue(v); update({ hue: v }) }
            else if (label === 'Sat') { setSat(v); update({ sat: v }) }
            else { setLight(v); update({ light: v }) }
          }} style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer', height: 4 }} />
        </div>
      ))}
      <div>
        <div style={{ fontSize: 9, color: labelColor, fontWeight: 500, marginBottom: 4 }}>Harmony</div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {harmonyTypes.map(h => (
            <button key={h} onClick={() => { setHarmony(h); update({ harmony: h }) }} style={{ padding: '2px 8px', borderRadius: 5, fontSize: 9, fontWeight: 600, background: harmony === h ? 'rgba(139,92,246,0.2)' : btnBg, border: harmony === h ? '1px solid rgba(139,92,246,0.4)' : '1px solid ' + btnBorder, color: harmony === h ? '#a78bfa' : labelColor, cursor: 'pointer', textTransform: 'capitalize' }}>{h}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
          {harmonyHexes.map((hex, i) => (
            <div key={i} style={{ flex: 1, height: 28, borderRadius: 5, background: hex, border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 7, fontFamily: 'monospace', color: light > 50 ? '#000' : '#fff', fontWeight: 600 }}>{hex.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 9, color: labelColor, fontWeight: 500, marginBottom: 4 }}>Value Scale</div>
        <div style={{ display: 'flex', gap: 2 }}>
          {valueScale.map((hex, i) => (
            <div key={i} style={{ flex: 1, height: 24, borderRadius: 3, background: hex, border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') }} title={hex} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 2. Perspective Grid Canvas Widget
// ============================================================

function CanvasPerspectiveGrid({ element, isDark }: CanvasWidgetProps) {
  const config = element.config
  const [vanishingX, setVanishingX] = useState((config.vanishingX as number) ?? 50)
  const [vanishingY, setVanishingY] = useState((config.vanishingY as number) ?? 40)
  const [numLines, setNumLines] = useState((config.numLines as number) ?? 8)
  const updateConfig = useConfigUpdater(element.id)
  const labelColor = isDark ? '#94a3b8' : '#475569'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: 2 }}>Perspective Grid</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: labelColor, minWidth: 32 }}>VP X:</span>
        <input type="range" min={10} max={90} value={vanishingX} onChange={(e) => { const v = Number(e.target.value); setVanishingX(v); updateConfig({ vanishingX: v }) }} style={{ flex: 1, accentColor: '#8b5cf6', cursor: 'pointer' }} />
        <span style={{ fontSize: 9, fontFamily: 'monospace', color: labelColor, minWidth: 28 }}>{vanishingX}%</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: labelColor, minWidth: 32 }}>VP Y:</span>
        <input type="range" min={10} max={70} value={vanishingY} onChange={(e) => { const v = Number(e.target.value); setVanishingY(v); updateConfig({ vanishingY: v }) }} style={{ flex: 1, accentColor: '#8b5cf6', cursor: 'pointer' }} />
        <span style={{ fontSize: 9, fontFamily: 'monospace', color: labelColor, minWidth: 28 }}>{vanishingY}%</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: labelColor, minWidth: 32 }}>Lines:</span>
        <input type="range" min={2} max={16} value={numLines} onChange={(e) => { const v = Number(e.target.value); setNumLines(v); updateConfig({ numLines: v }) }} style={{ flex: 1, accentColor: '#8b5cf6', cursor: 'pointer' }} />
        <span style={{ fontSize: 9, fontFamily: 'monospace', color: labelColor, minWidth: 28 }}>{numLines}</span>
      </div>
      <svg viewBox="0 0 200 140" style={{ width: '100%', borderRadius: 6, border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'), background: isDark ? '#0f172a' : '#f8fafc' }}>
        <line x1="0" y1={vanishingY * 1.4} x2="200" y2={vanishingY * 1.4} stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="0.5" strokeDasharray="4 2" />
        <circle cx={vanishingX * 2} cy={vanishingY * 1.4} r="3" fill="#8b5cf6" />
        {Array.from({ length: numLines }, (_, i) => {
          const t = numLines === 1 ? 0.5 : i / (numLines - 1)
          return <line key={i} x1={vanishingX * 2} y1={vanishingY * 1.4} x2={t * 200} y2="140" stroke={isDark ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.25)'} strokeWidth="0.5" />
        })}
        {Array.from({ length: 5 }, (_, i) => {
          const t = (i + 1) / 6
          const y = vanishingY * 1.4 + (140 - vanishingY * 1.4) * t
          const spread = t
          return <line key={i} x1={vanishingX * 2 - 200 * spread} y1={y} x2={vanishingX * 2 + 200 * spread} y2={y} stroke={isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.12)'} strokeWidth="0.5" />
        })}
      </svg>
    </div>
  )
}

// ============================================================
// 3. Staff Notation Canvas Widget
// ============================================================

function CanvasStaffNotation({ element, isDark }: CanvasWidgetProps) {
  const config = element.config
  const [notes, setNotes] = useState<string[]>((config.notes as string[]) ?? ['C4', 'E4', 'G4', 'C5'])
  const updateConfig = useConfigUpdater(element.id)
  const noteOptions = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5']
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const btnBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'

  const noteToY = (note: string): number => {
    const noteMap: Record<string, number> = {
      'C4': 70, 'D4': 65, 'E4': 60, 'F4': 55, 'G4': 50, 'A4': 45, 'B4': 40, 'C5': 35, 'D5': 30, 'E5': 25, 'F5': 20, 'G5': 15,
    }
    return noteMap[note] ?? 50
  }

  const addNote = (note: string) => {
    if (notes.length < 16) {
      const next = [...notes, note]
      setNotes(next)
      updateConfig({ notes: next })
    }
  }
  const clearNotes = () => {
    setNotes([])
    updateConfig({ notes: [] })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: 2 }}>Staff Notation Builder</div>
      <svg viewBox="0 0 280 90" style={{ width: '100%', borderRadius: 6, border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'), background: isDark ? '#0f172a' : '#fffef5' }}>
        {[20, 30, 40, 50, 60].map(y => (
          <line key={y} x1="10" y1={y} x2="270" y2={y} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="0.7" />
        ))}
        <text x="14" y="52" fontSize="32" fill={isDark ? '#94a3b8' : '#475569'} fontFamily="serif" fontWeight="bold">G</text>
        {notes.map((note, i) => {
          const x = 50 + i * 22
          const y = noteToY(note)
          return (
            <g key={i}>
              <ellipse cx={x} cy={y} rx="6" ry="4.5" fill={isDark ? '#e2e8f0' : '#1e293b'} stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth="1" transform={`rotate(-15 ${x} ${y})`} />
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {noteOptions.map(n => (
          <button key={n} onClick={() => addNote(n)} style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 500, background: btnBg, border: '1px solid ' + btnBorder, color: labelColor, cursor: 'pointer' }}>{n}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={clearNotes} style={{ padding: '3px 10px', borderRadius: 5, fontSize: 9, fontWeight: 600, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>Clear</button>
        <span style={{ fontSize: 9, color: labelColor, lineHeight: '22px' }}>{notes.length}/16 notes</span>
      </div>
    </div>
  )
}

// ============================================================
// 4. Artwork Comparison Canvas Widget
// ============================================================

function CanvasArtworkCompare({ element, isDark }: CanvasWidgetProps) {
  const config = element.config
  const [aspect, setAspect] = useState((config.aspect as string) ?? 'color')
  const [textA, setTextA] = useState((config.textA as string) ?? '')
  const [textB, setTextB] = useState((config.textB as string) ?? '')
  const updateConfig = useConfigUpdater(element.id)
  const aspects = ['color', 'composition', 'texture', 'style', 'meaning']
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const btnBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'

  const prompts: Record<string, string> = {
    color: 'Compare the color palettes. What colors dominate each work? Are they warm or cool? How do the colors affect the mood?',
    composition: 'Analyze the composition. Where is the focal point? How is visual weight distributed? What guides your eye?',
    texture: 'Describe the textures you see. Are they real or implied? How does texture create depth or interest?',
    style: 'Identify the art style/period. What techniques are used? Is it realistic, abstract, or stylized?',
    meaning: 'What is the subject matter? What story or emotion does the artwork convey? What symbols are present?',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: 2 }}>Artwork Comparison</div>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {aspects.map(a => (
          <button key={a} onClick={() => { setAspect(a); updateConfig({ aspect: a }) }} style={{ padding: '3px 10px', borderRadius: 5, fontSize: 10, fontWeight: aspect === a ? 700 : 500, background: aspect === a ? 'rgba(139,92,246,0.15)' : btnBg, border: aspect === a ? '1px solid rgba(139,92,246,0.3)' : '1px solid ' + btnBorder, color: aspect === a ? '#a78bfa' : labelColor, cursor: 'pointer', textTransform: 'capitalize' }}>{a}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {['Artwork A', 'Artwork B'].map((label, idx) => (
          <div key={label} style={{ flex: 1, borderRadius: 6, border: '1px dashed ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'), padding: '8px 10px', minHeight: 60 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#a78bfa', marginBottom: 4 }}>{label}</div>
            <textarea value={idx === 0 ? textA : textB} onChange={(e) => {
              const v = e.target.value
              if (idx === 0) { setTextA(v); updateConfig({ textA: v }) }
              else { setTextB(v); updateConfig({ textB: v }) }
            }} placeholder="Type your observations..." style={{ width: '100%', minHeight: 48, fontSize: 10, color: labelColor, lineHeight: 1.5, outline: 'none', background: 'transparent', border: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: '#a78bfa', marginBottom: 3 }}>Guiding Prompt</div>
        <div style={{ fontSize: 10, color: labelColor, lineHeight: 1.5 }}>{prompts[aspect]}</div>
      </div>
    </div>
  )
}

// ============================================================
// 5. Timer / Stopwatch Canvas Widget
// ============================================================

function CanvasTimer({ element, isDark }: CanvasWidgetProps) {
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer')
  const [timerMin, setTimerMin] = useState(5)
  const [timerSec, setTimerSec] = useState(0)
  const [timerRemaining, setTimerRemaining] = useState(300000)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerDone, setTimerDone] = useState(false)
  const [swElapsed, setSwElapsed] = useState(0)
  const [swRunning, setSwRunning] = useState(false)
  const swStartRef = useRef(0)
  const swAccumRef = useRef(0)
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const brightColor = isDark ? '#e2e8f0' : '#1e293b'
  const s = (active: boolean) => ({
    padding: '2px 6px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
    background: active ? 'rgba(5,150,105,0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
    border: active ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
    color: active ? '#34d399' : labelColor,
  })

  useEffect(() => {
    if (!timerRunning) return
    const iv = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 100) { setTimerRunning(false); setTimerDone(true); return 0 }
        return prev - 100
      })
    }, 100)
    return () => clearInterval(iv)
  }, [timerRunning])

  useEffect(() => {
    if (!swRunning) return
    const iv = setInterval(() => { setSwElapsed(Date.now() - swStartRef.current + swAccumRef.current) }, 30)
    return () => clearInterval(iv)
  }, [swRunning])

  const formatMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000)
    const m = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    const cs = Math.floor((ms % 1000) / 10)
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: brightColor, marginBottom: 2 }}>Timer / Stopwatch</div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => setMode('timer')} style={s(mode === 'timer')}>Timer</button>
        <button onClick={() => setMode('stopwatch')} style={s(mode === 'stopwatch')}>Stopwatch</button>
      </div>
      {mode === 'timer' ? (
        <>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'monospace', textAlign: 'center', color: timerDone ? '#f87171' : brightColor, padding: '8px 0' }}>
            {formatMs(timerRemaining)}
          </div>
          {!timerRunning && !timerDone && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
              <input type="number" value={timerMin} onChange={e => setTimerMin(Math.max(0, Number(e.target.value)))} min={0} max={99} style={{ width: 44, padding: '3px 6px', borderRadius: 4, fontSize: 11, border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'), background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: brightColor, textAlign: 'center' }} />
              <span style={{ color: labelColor }}>min</span>
              <input type="number" value={timerSec} onChange={e => setTimerSec(Math.max(0, Math.min(59, Number(e.target.value))))} min={0} max={59} style={{ width: 44, padding: '3px 6px', borderRadius: 4, fontSize: 11, border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'), background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: brightColor, textAlign: 'center' }} />
              <span style={{ color: labelColor }}>sec</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {!timerRunning && <button onClick={() => {
              if (timerDone || timerRemaining === 0) { setTimerRemaining((timerMin * 60 + timerSec) * 1000); setTimerDone(false) }
              setTimerRunning(true)
            }} style={{ padding: '5px 16px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', cursor: 'pointer' }}>Start</button>}
            {timerRunning && <button onClick={() => setTimerRunning(false)} style={{ padding: '5px 16px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', color: '#eab308', cursor: 'pointer' }}>Pause</button>}
            <button onClick={() => { setTimerRunning(false); setTimerRemaining((timerMin * 60 + timerSec) * 1000); setTimerDone(false) }} style={{ padding: '5px 16px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>Reset</button>
          </div>
          {timerDone && <div style={{ textAlign: 'center', color: '#f87171', fontWeight: 600, fontSize: 12, padding: '4px 0' }}>⚠ Time's up!</div>}
        </>
      ) : (
        <>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'monospace', textAlign: 'center', color: brightColor, padding: '8px 0' }}>{formatMs(swElapsed)}</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {!swRunning && <button onClick={() => { swStartRef.current = Date.now(); setSwRunning(true) }} style={{ padding: '5px 16px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', cursor: 'pointer' }}>Start</button>}
            {swRunning && <button onClick={() => { swAccumRef.current += Date.now() - swStartRef.current; setSwRunning(false) }} style={{ padding: '5px 16px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', color: '#eab308', cursor: 'pointer' }}>Pause</button>}
            <button onClick={() => { setSwRunning(false); setSwElapsed(0); swAccumRef.current = 0 }} style={{ padding: '5px 16px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>Reset</button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// 6. Random Student Picker Canvas Widget
// ============================================================

function CanvasRandomPicker({ element, isDark }: CanvasWidgetProps) {
  const config = element.config
  const [names, setNames] = useState<string[]>((config.names as string[]) ?? ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan'])
  const [picked, setPicked] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const updateConfig = useConfigUpdater(element.id)
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const brightColor = isDark ? '#e2e8f0' : '#1e293b'

  const pick = () => {
    if (names.length === 0) return
    setSpinning(true)
    setPicked(null)
    let count = 0
    const iv = setInterval(() => {
      setPicked(names[Math.floor(Math.random() * names.length)])
      count++
      if (count > 15) { clearInterval(iv); setSpinning(false) }
    }, 80)
  }

  const removeName = (idx: number) => {
    const next = names.filter((_, i) => i !== idx)
    setNames(next)
    updateConfig({ names: next })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: brightColor, marginBottom: 2 }}>Random Student Picker</div>
      <div style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 8, background: isDark ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {picked ? (
          <span style={{ fontSize: 20, fontWeight: 700, color: spinning ? '#a78bfa' : brightColor }}>{picked}</span>
        ) : (
          <span style={{ color: labelColor, fontSize: 12 }}>Click Pick to select a student</span>
        )}
      </div>
      <button onClick={pick} disabled={spinning || names.length === 0} style={{ padding: '6px 16px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', cursor: spinning ? 'wait' : 'pointer' }}>{spinning ? 'Picking...' : 'Pick!'}</button>
      <div style={{ fontSize: 9, color: labelColor, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Students ({names.length})</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {names.map((name, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'), fontSize: 10, color: labelColor }}>
            {name}
            <span onClick={() => removeName(i)} style={{ cursor: 'pointer', color: '#f87171', fontWeight: 700, fontSize: 11 }}>×</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// 7. Interactive Graphing Canvas Widget
// ============================================================

function CanvasGraphingTool({ element, isDark }: CanvasWidgetProps) {
  const config = element.config
  const [expr, setExpr] = useState((config.expr as string) ?? 'x^2')
  const [range, setRange] = useState((config.range as number) ?? 10)
  const updateConfig = useConfigUpdater(element.id)
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const brightColor = isDark ? '#e2e8f0' : '#1e293b'

  const evalExpr = (x: number): number => {
    try {
      const safe = expr.replace(/\^/g, '**').replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos').replace(/tan/g, 'Math.tan').replace(/sqrt/g, 'Math.sqrt').replace(/abs/g, 'Math.abs').replace(/pi/g, 'Math.PI').replace(/e(?![a-zA-Z])/g, 'Math.E')
      return new Function('x', 'return ' + safe)(x)
    } catch { return NaN }
  }

  const w = 200, h = 160, cx = w / 2, cy = h / 2
  const points: Array<[number, number]> = []
  for (let px = 0; px <= w; px += 2) {
    const x = (px - cx) / (cx / range)
    const y = evalExpr(x)
    if (isFinite(y)) {
      const py = cy - (y / range) * cy
      if (py >= -10 && py <= h + 10) points.push([px, py])
    }
  }

  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: brightColor, marginBottom: 2 }}>Interactive Graphing</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: labelColor, minWidth: 32 }}>f(x)=</span>
        <input type="text" value={expr} onChange={e => { setExpr(e.target.value); updateConfig({ expr: e.target.value }) }} style={{ flex: 1, padding: '3px 6px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'), background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: brightColor, outline: 'none' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: labelColor, minWidth: 32 }}>Range:</span>
        <input type="range" min={1} max={20} value={range} onChange={e => { const v = Number(e.target.value); setRange(v); updateConfig({ range: v }) }} style={{ flex: 1, accentColor: '#8b5cf6', cursor: 'pointer' }} />
        <span style={{ fontSize: 9, color: labelColor, minWidth: 28 }}>+/-{range}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', borderRadius: 6, border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'), background: isDark ? '#0f172a' : '#fafafa' }}>
        {/* Grid */}
        {Array.from({ length: Math.floor(range) * 2 + 1 }, (_, i) => {
          const x = cx + (i - range) * (cx / range)
          const y = cy + (i - range) * (cy / range)
          return <g key={i}><line x1={x} y1={0} x2={x} y2={h} stroke={gridColor} strokeWidth={0.5} /><line x1={0} y1={y} x2={w} y2={y} stroke={gridColor} strokeWidth={0.5} /></g>
        })}
        <line x1={0} y1={cy} x2={w} y2={cy} stroke={axisColor} strokeWidth={1} />
        <line x1={cx} y1={0} x2={cx} y2={h} stroke={axisColor} strokeWidth={1} />
        {/* Curve */}
        {points.length > 1 && <polyline points={points.map(p => p.join(',')).join(' ')} fill="none" stroke="#8b5cf6" strokeWidth={2} />}
      </svg>
    </div>
  )
}

// ============================================================
// Exports for CanvasWidgets.tsx integration
// ============================================================

export const ARTS_WIDGET_KIND_LABELS: Record<string, string> = {
  'arts-color-theory': 'Color Theory Explorer',
  'arts-perspective-grid': 'Perspective Grid',
  'arts-staff-notation': 'Staff Notation Builder',
  'arts-compare': 'Artwork Comparison',
}

export const CLASSROOM_WIDGET_KIND_LABELS: Record<string, string> = {
  'classroom-timer': 'Timer / Stopwatch',
  'classroom-random-picker': 'Random Student Picker',
  'classroom-graphing': 'Interactive Graphing',
}

export function getArtsWidgetDefaultConfig(kind: string): Record<string, unknown> {
  switch (kind) {
    case 'arts-color-theory': return { hue: 200, sat: 70, light: 50, harmony: 'complementary' }
    case 'arts-perspective-grid': return { vanishingX: 50, vanishingY: 40, numLines: 8 }
    case 'arts-staff-notation': return { notes: ['C4', 'E4', 'G4', 'C5'] }
    case 'arts-compare': return { aspect: 'color', textA: '', textB: '' }
    default: return {}
  }
}

export function getArtsWidgetDefaultSize(kind: string): { width: number; height: number } {
  switch (kind) {
    case 'arts-color-theory': return { width: 280, height: 400 }
    case 'arts-perspective-grid': return { width: 280, height: 320 }
    case 'arts-staff-notation': return { width: 300, height: 320 }
    case 'arts-compare': return { width: 360, height: 340 }
    default: return { width: 280, height: 300 }
  }
}

export function getClassroomWidgetDefaultConfig(kind: string): Record<string, unknown> {
  switch (kind) {
    case 'classroom-timer': return {}
    case 'classroom-random-picker': return { names: ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan'] }
    case 'classroom-graphing': return { expr: 'x^2', range: 10 }
    default: return {}
  }
}

export function getClassroomWidgetDefaultSize(kind: string): { width: number; height: number } {
  switch (kind) {
    case 'classroom-timer': return { width: 220, height: 280 }
    case 'classroom-random-picker': return { width: 260, height: 320 }
    case 'classroom-graphing': return { width: 280, height: 340 }
    default: return { width: 260, height: 300 }
  }
}

// Individual component exports for WIDGET_COMPONENTS map
export { CanvasColorTheory, CanvasPerspectiveGrid, CanvasStaffNotation, CanvasArtworkCompare, CanvasTimer, CanvasRandomPicker, CanvasGraphingTool }
