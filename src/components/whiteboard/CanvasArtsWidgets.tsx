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
  const [imgA, setImgA] = useState((config.imgA as string) ?? '')
  const [imgB, setImgB] = useState((config.imgB as string) ?? '')
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

  const handleImageUpload = (idx: number, file: File) => {
    if (!file) return
    // Validate type/size
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      alert('Image must be under 4 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      if (idx === 0) { setImgA(dataUrl); updateConfig({ imgA: dataUrl }) }
      else { setImgB(dataUrl); updateConfig({ imgB: dataUrl }) }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = (idx: number) => {
    if (idx === 0) { setImgA(''); updateConfig({ imgA: '' }) }
    else { setImgB(''); updateConfig({ imgB: '' }) }
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
        {['Artwork A', 'Artwork B'].map((label, idx) => {
          const img = idx === 0 ? imgA : imgB
          return (
            <div key={label} style={{ flex: 1, borderRadius: 6, border: '1px dashed ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'), padding: '8px 10px', minHeight: 60, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#a78bfa', marginBottom: 2 }}>{label}</div>
              {img ? (
                <div style={{ position: 'relative' }}>
                  <img src={img} alt={label} style={{ width: '100%', maxHeight: 120, objectFit: 'contain', borderRadius: 4, background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }} />
                  <button onClick={() => handleRemoveImage(idx)} title="Remove image" style={{ position: 'absolute', top: 4, right: 4, padding: '2px 6px', borderRadius: 4, fontSize: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', cursor: 'pointer' }}>&times;</button>
                </div>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 48, padding: '6px 8px', borderRadius: 4, border: '1px dashed ' + (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'), cursor: 'pointer', fontSize: 10, color: labelColor, gap: 4 }}>
                  <span style={{ fontSize: 14 }}>&#128247;</span> Upload image
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleImageUpload(idx, f)
                    e.target.value = ''
                  }} />
                </label>
              )}
              <textarea value={idx === 0 ? textA : textB} onChange={(e) => {
                const v = e.target.value
                if (idx === 0) { setTextA(v); updateConfig({ textA: v }) }
                else { setTextB(v); updateConfig({ textB: v }) }
              }} placeholder="Type your observations..." style={{ width: '100%', minHeight: 36, fontSize: 10, color: labelColor, lineHeight: 1.5, outline: 'none', background: 'transparent', border: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
          )
        })}
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
// Phase 4: New Arts Canvas Widgets
// ============================================================

// --- Elements of Art ---
const ART_ELEMENTS = [
  { name: 'Line', desc: 'A mark between two points. Can be thick, thin, wavy, zigzag, or curved.', color: '#ef4444', examples: 'Straight lines, curved lines, zigzag lines, spiral lines' },
  { name: 'Shape', desc: 'A 2D area enclosed by lines. Geometric or organic.', color: '#f97316', examples: 'Circles, squares, triangles, freeform shapes' },
  { name: 'Form', desc: 'A 3D shape with volume. Has height, width, and depth.', color: '#eab308', examples: 'Sphere, cube, cylinder, cone, pyramid' },
  { name: 'Space', desc: 'The area around and between objects. Positive and negative space.', color: '#22c55e', examples: 'Foreground/background, overlapping, placement' },
  { name: 'Color', desc: 'The visual quality of objects caused by light. Has hue, value, and intensity.', color: '#3b82f6', examples: 'Primary, secondary, warm, cool, complementary' },
  { name: 'Texture', desc: 'How a surface feels or looks like it would feel.', color: '#8b5cf6', examples: 'Smooth, rough, bumpy, fuzzy, glossy, matte' },
]

export function CanvasElementsOfArt({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const selected = (raw.selected as number) || 0
  const s = { bg: isDark ? '#0f172a' : '#ffffff', surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)', text: isDark ? '#94a3b8' : '#64748b', bright: isDark ? '#e2e8f0' : '#1e293b' }
  const el = ART_ELEMENTS[selected]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Elements of Art</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {ART_ELEMENTS.map((e, i) => (
          <button key={e.name} onClick={() => updateConfig({ selected: i })} style={{ padding: '4px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: '1px solid ' + (selected === i ? e.color : s.border), background: selected === i ? e.color + '18' : s.surface, color: selected === i ? e.color : s.text, transition: 'all 0.15s' }}>{e.name}</button>
        ))}
      </div>
      {el && (
        <div style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid ' + s.border, background: s.surface }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: el.color, marginBottom: 6 }}>{el.name}</div>
          <div style={{ fontSize: 11, color: s.bright, lineHeight: 1.5, marginBottom: 8 }}>{el.desc}</div>
          <div style={{ fontSize: 10, color: s.text }}><span style={{ fontWeight: 600 }}>Examples:</span> {el.examples}</div>
        </div>
      )}
    </div>
  )
}

// --- Symmetry Drawing ---
export function CanvasSymmetryDrawing({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const mode = (raw.mode as string) || 'vertical'
  const paths = (raw.paths as string[]) || []
  const currentPath = (raw.currentPath as string) || ''
  const s = { bg: isDark ? '#0f172a' : '#ffffff', surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)', text: isDark ? '#94a3b8' : '#64748b', bright: isDark ? '#e2e8f0' : '#1e293b' }

  const handlePointerUp = () => {
    if (currentPath) { updateConfig({ paths: [...paths, currentPath], currentPath: '' }) }
  }

  const mirrorPath = (p: string, w: number, h: number) => {
    const points = p.split(' ').map(s => { const [x, y] = s.split(',').map(Number); return [x, y] })
    if (mode === 'vertical') return points.map(([x, y]) => `${w - x},${y}`).join(' ')
    if (mode === 'horizontal') return points.map(([x, y]) => `${x},${h - y}`).join(' ')
    return points.map(([x, y]) => `${w - x},${h - y}`).join(' ') // 4-way uses vertical
  }

  const w = 240, h = 200
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Symmetry Drawing</span>
        <button onClick={() => updateConfig({ paths: [], currentPath: '' })} style={{ fontSize: 9, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        {['vertical', 'horizontal', '4-way'].map(m => (
          <button key={m} onClick={() => updateConfig({ mode: m })} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 600, background: mode === m ? 'rgba(139,92,246,0.15)' : s.surface, border: '1px solid ' + (mode === m ? 'rgba(139,92,246,0.3)' : s.border), color: mode === m ? '#a78bfa' : s.text }}>{m}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', borderRadius: 6, border: '1px solid ' + s.border, background: isDark ? '#0f172a' : '#fafafa', cursor: 'crosshair' }} onPointerUp={handlePointerUp}>
        {mode !== 'horizontal' && <line x1={w / 2} y1={0} x2={w / 2} y2={h} stroke={s.border} strokeWidth={1} strokeDasharray="4 4" />}
        {mode !== 'vertical' && <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke={s.border} strokeWidth={1} strokeDasharray="4 4" />}
        {[...paths, currentPath].filter(Boolean).map((p, i) => <>
          <polyline key={'o' + i} points={p} fill="none" stroke={i === paths.length ? '#8b5cf6' : '#8b5cf688'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <polyline key={'m' + i} points={mirrorPath(p, w, h)} fill="none" stroke={i === paths.length ? '#8b5cf6' : '#8b5cf688'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </>)}
      </svg>
    </div>
  )
}

// --- Rhythm Builder ---
const NOTE_TYPES = ['quarter', 'half', 'eighth', 'rest']
const NOTE_LABELS: Record<string, string> = { quarter: 'Ta', half: 'Ta-a', eighth: 'Ti-ti', rest: 'Rest' }
const NOTE_VALUES: Record<string, number> = { quarter: 1, half: 2, eighth: 0.5, rest: 0 }

export function CanvasRhythmBuilder({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const grid = (raw.grid as string[]) || Array(8).fill('quarter')
  const bpm = (raw.bpm as number) || 120
  const s = { bg: isDark ? '#0f172a' : '#ffffff', surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)', text: isDark ? '#94a3b8' : '#64748b', bright: isDark ? '#e2e8f0' : '#1e293b' }

  const setNote = (i: number, type: string) => { const g = [...grid]; g[i] = type; updateConfig({ grid: g }) }
  const totalBeats = grid.reduce((sum, n) => sum + (NOTE_VALUES[n] || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Rhythm Builder</span>
        <span style={{ fontSize: 9, color: s.text }}>{totalBeats} beats</span>
      </div>
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {NOTE_TYPES.map(t => <span key={t} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: s.surface, border: '1px solid ' + s.border, color: s.text }}>{NOTE_LABELS[t]}</span>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {grid.map((note, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, color: s.text, width: 20, textAlign: 'right' }}>{i + 1}</span>
            {NOTE_TYPES.map(t => (
              <button key={t} onClick={() => setNote(i, t)} style={{ flex: 1, padding: '6px 0', borderRadius: 4, fontSize: 10, fontWeight: 500, cursor: 'pointer', border: '1px solid ' + (note === t ? 'rgba(139,92,246,0.4)' : s.border), background: note === t ? 'rgba(139,92,246,0.12)' : s.surface, color: note === t ? '#a78bfa' : s.text }}>{NOTE_LABELS[t]}</button>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: s.text }}>BPM:</span>
        <input type="range" min={60} max={200} value={bpm} onChange={e => updateConfig({ bpm: parseInt(e.target.value) })} style={{ flex: 1, accentColor: '#8b5cf6' }} />
        <span style={{ fontSize: 9, color: s.text }}>{bpm}</span>
      </div>
    </div>
  )
}

// --- Artist Spotlight ---
const ARTISTS = [
  { name: 'Vincent van Gogh', years: '1853-1890', movement: 'Post-Impressionism', works: 'Starry Night, Sunflowers, The Bedroom', style: 'Bold color, expressive brushwork, emotional intensity' },
  { name: 'Pablo Picasso', years: '1881-1973', movement: 'Cubism', works: 'Guernica, Les Demoiselles d\'Avignon, The Weeping Woman', style: 'Geometric forms, multiple perspectives, abstract' },
  { name: 'Claude Monet', years: '1840-1926', movement: 'Impressionism', works: 'Water Lilies, Impression Sunrise, Rouen Cathedral', style: 'Light and color, outdoor scenes, visible brushstrokes' },
  { name: 'Frida Kahlo', years: '1907-1954', movement: 'Surrealism', works: 'The Two Fridas, Self-Portrait with Thorn Necklace', style: 'Symbolism, Mexican culture, self-portraiture' },
  { name: 'Leonardo da Vinci', years: '1452-1519', movement: 'Renaissance', works: 'Mona Lisa, The Last Supper, Vitruvian Man', style: 'Realism, sfumato, anatomical precision' },
  { name: 'Georgia O\'Keeffe', years: '1887-1986', movement: 'American Modernism', works: 'Jimson Weed, Red Poppy, Black Iris', style: 'Large-scale flowers, New Mexico landscapes' },
  { name: 'Katsushika Hokusai', years: '1760-1849', movement: 'Ukiyo-e', works: 'The Great Wave, Thirty-Six Views of Mt. Fuji', style: 'Japanese woodblock, wave motifs, nature' },
  { name: 'Henri Matisse', years: '1869-1954', movement: 'Fauvism', works: 'The Dance, The Joy of Life, Icarus', style: 'Bold color, simplified forms, cut-outs' },
]

export function CanvasArtistSpotlight({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const idx = (raw.idx as number) || 0
  const s = { bg: isDark ? '#0f172a' : '#ffffff', surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)', text: isDark ? '#94a3b8' : '#64748b', bright: isDark ? '#e2e8f0' : '#1e293b' }
  const a = ARTISTS[idx % ARTISTS.length]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Artist Spotlight</span>
        <span style={{ fontSize: 9, color: s.text }}>{idx + 1}/{ARTISTS.length}</span>
      </div>
      <div style={{ padding: 10, borderRadius: 8, background: s.surface, border: '1px solid ' + s.border }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: s.bright }}>{a.name}</div>
        <div style={{ fontSize: 10, color: '#8b5cf6', fontWeight: 600 }}>{a.years} · {a.movement}</div>
        <div style={{ fontSize: 10, color: s.text, marginTop: 6, lineHeight: 1.5 }}>{a.style}</div>
      </div>
      <div><div style={{ fontSize: 10, fontWeight: 700, color: s.bright, marginBottom: 3 }}>Key Works</div><div style={{ fontSize: 10, color: s.text, lineHeight: 1.5 }}>{a.works}</div></div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => updateConfig({ idx: (idx - 1 + ARTISTS.length) % ARTISTS.length })} style={{ flex: 1, padding: '6px 0', borderRadius: 5, fontSize: 11, cursor: 'pointer', background: s.surface, border: '1px solid ' + s.border, color: s.text }}>Previous</button>
        <button onClick={() => updateConfig({ idx: (idx + 1) % ARTISTS.length })} style={{ flex: 1, padding: '6px 0', borderRadius: 5, fontSize: 11, cursor: 'pointer', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>Next</button>
      </div>
    </div>
  )
}

// --- Art History Timeline ---
const ART_PERIODS = [
  { name: 'Medieval', years: '500-1400', color: '#8b5cf6', desc: 'Religious art, illuminated manuscripts, flat perspective' },
  { name: 'Renaissance', years: '1400-1600', color: '#3b82f6', desc: 'Linear perspective, human anatomy, realism, da Vinci, Michelangelo' },
  { name: 'Baroque', years: '1600-1750', color: '#f59e0b', desc: 'Drama, contrast, movement, Caravaggio, Rembrandt, Vermeer' },
  { name: 'Neoclassical', years: '1750-1850', color: '#64748b', desc: 'Order, balance, Greek/Roman influence, Jacques-Louis David' },
  { name: 'Impressionism', years: '1860-1890', color: '#34d399', desc: 'Light, color, outdoor scenes, Monet, Renoir, Degas' },
  { name: 'Post-Impressionism', years: '1880-1910', color: '#f97316', desc: 'Bold color, emotion, structure, van Gogh, Cezanne, Seurat' },
  { name: 'Cubism', years: '1907-1920', color: '#ef4444', desc: 'Geometric forms, multiple views, Picasso, Braque' },
  { name: 'Surrealism', years: '1920-1945', color: '#ec4899', desc: 'Dreams, unconscious, juxtaposition, Dali, Magritte, Ernst' },
  { name: 'Abstract Expressionism', years: '1945-1970', color: '#06b6d4', desc: 'Gesture, color field, emotion, Pollock, Rothko, de Kooning' },
  { name: 'Pop Art', years: '1955-1970', color: '#f43f5e', desc: 'Consumer culture, bold imagery, Warhol, Lichtenstein' },
  { name: 'Contemporary', years: '1970-present', color: '#a855f7', desc: 'Digital art, installation, multicultural, diverse media' },
]

export function CanvasArtHistoryTimeline({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const selected = (raw.selected as number) || -1
  const s = { bg: isDark ? '#0f172a' : '#ffffff', surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)', text: isDark ? '#94a3b8' : '#64748b', bright: isDark ? '#e2e8f0' : '#1e293b' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Art History Timeline</span>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {ART_PERIODS.map((p, i) => (
          <div key={p.name} onClick={() => updateConfig({ selected: selected === i ? -1 : i })} style={{ padding: '6px 8px', borderRadius: 6, cursor: 'pointer', border: '1px solid ' + (selected === i ? p.color + '66' : s.border), background: selected === i ? p.color + '10' : s.surface, transition: 'all 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 4, height: 24, borderRadius: 2, background: p.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: selected === i ? p.color : s.bright }}>{p.name} <span style={{ fontWeight: 400, color: s.text }}> ({p.years})</span></div>
                {selected === i && <div style={{ fontSize: 9, color: s.text, lineHeight: 1.4, marginTop: 2 }}>{p.desc}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Value/Shading Study ---
export function CanvasValueShading({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const technique = (raw.technique as string) || 'hatching'
  const s = { bg: isDark ? '#0f172a' : '#ffffff', surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)', text: isDark ? '#94a3b8' : '#64748b', bright: isDark ? '#e2e8f0' : '#1e293b' }
  const steps = Array.from({ length: 10 }, (_, i) => i)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Value Scale & Shading</span>
      </div>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>{['hatching', 'cross-hatching', 'stippling'].map(t => (
        <button key={t} onClick={() => updateConfig({ technique: t })} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 600, background: technique === t ? 'rgba(139,92,246,0.15)' : s.surface, border: '1px solid ' + (technique === t ? 'rgba(139,92,246,0.3)' : s.border), color: technique === t ? '#a78bfa' : s.text }}>{t}</button>
      ))}</div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
        {steps.map(i => {
          const gray = Math.round((i / 9) * 255)
          const hex = `#${gray.toString(16).padStart(2, '0').repeat(3)}`
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: '100%', height: 50, borderRadius: 4, background: hex, border: '1px solid ' + s.border, position: 'relative', overflow: 'hidden' }}>
                {technique === 'hatching' && <svg width="100%" height="100%"><line x1="0" y1={10 + i * 3} x2="100%" y2={10 + i * 3} stroke={i < 5 ? '#00000044' : '#ffffff44'} strokeWidth={1} /><line x1="0" y1={15 + i * 3} x2="100%" y2={15 + i * 3} stroke={i < 5 ? '#00000044' : '#ffffff44'} strokeWidth={1} /><line x1="0" y1={20 + i * 3} x2="100%" y2={20 + i * 3} stroke={i < 5 ? '#00000044' : '#ffffff44'} strokeWidth={1} /></svg>}
                {technique === 'stippling' && Array.from({ length: i * 3 + 2 }, (_, j) => <div key={j} style={{ position: 'absolute', width: 2, height: 2, borderRadius: 1, background: i < 5 ? '#00000066' : '#ffffff66', left: `${Math.random() * 95}%`, top: `${Math.random() * 90}%` }} />)}
              </div>
              <span style={{ fontSize: 8, color: s.text }}>{i + 1}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Compositional Analysis ---
export function CanvasCompositionalAnalysis({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const overlay = (raw.overlay as string) || 'thirds'
  const s = { bg: isDark ? '#0f172a' : '#ffffff', surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)', text: isDark ? '#94a3b8' : '#64748b', bright: isDark ? '#e2e8f0' : '#1e293b' }
  const w = 200, h = 200

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Compositional Analysis</span>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>{['thirds', 'golden', 'leading'].map(o => (
        <button key={o} onClick={() => updateConfig({ overlay: o })} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 600, background: overlay === o ? 'rgba(139,92,246,0.15)' : s.surface, border: '1px solid ' + (overlay === o ? 'rgba(139,92,246,0.3)' : s.border), color: overlay === o ? '#a78bfa' : s.text }}>{o === 'thirds' ? 'Rule of Thirds' : o === 'golden' ? 'Golden Ratio' : 'Leading Lines'}</button>
      ))}</div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', borderRadius: 6, border: '1px solid ' + s.border, background: isDark ? '#0f172a' : '#fafafa' }}>
        <rect x={0} y={0} width={w} height={h} fill="none" />
        {overlay === 'thirds' && <><line x1={w/3} y1={0} x2={w/3} y2={h} stroke="#a78bfa44" strokeWidth={1} /><line x1={2*w/3} y1={0} x2={2*w/3} y2={h} stroke="#a78bfa44" strokeWidth={1} /><line x1={0} y1={h/3} x2={w} y2={h/3} stroke="#a78bfa44" strokeWidth={1} /><line x1={0} y1={2*h/3} x2={w} y2={2*h/3} stroke="#a78bfa44" strokeWidth={1} /><circle cx={w/3} cy={h/3} r={4} fill="#a78bfa33" /><circle cx={2*w/3} cy={h/3} r={4} fill="#a78bfa33" /><circle cx={w/3} cy={2*h/3} r={4} fill="#a78bfa33" /><circle cx={2*w/3} cy={2*h/3} r={4} fill="#a78bfa33" /></>}
        {overlay === 'golden' && <><rect x={w*0.191} y={h*0.191} width={w*0.618} height={h*0.618} fill="none" stroke="#a78bfa44" strokeWidth={1} strokeDasharray="4 4" /><rect x={w*0.382} y={h*0.382} width={w*0.236} height={h*0.236} fill="none" stroke="#a78bfa44" strokeWidth={1} strokeDasharray="4 4" /></>}
        {overlay === 'leading' && <><line x1={0} y1={h*0.6} x2={w*0.7} y2={0} stroke="#a78bfa44" strokeWidth={1.5} strokeDasharray="6 3" /><line x1={w*0.3} y1={h} x2={w} y2={h*0.3} stroke="#a78bfa44" strokeWidth={1.5} strokeDasharray="6 3" /><line x1={w*0.1} y1={0} x2={w*0.5} y2={h} stroke="#a78bfa44" strokeWidth={1} strokeDasharray="6 3" /></>}
        <text x={w/2} y={h/2} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill={s.text}>Place artwork here</text>
      </svg>
    </div>
  )
}

// --- Art Criticism (Feldman's Method) ---
export function CanvasArtCriticism({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const describe = (raw.describe as string) || ''
  const analyze = (raw.analyze as string) || ''
  const interpret = (raw.interpret as string) || ''
  const judge = (raw.judge as string) || ''
  const s = { bg: isDark ? '#0f172a' : '#ffffff', surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)', text: isDark ? '#94a3b8' : '#64748b', bright: isDark ? '#e2e8f0' : '#1e293b', input: { padding: '4px 8px', borderRadius: 5, fontSize: 11, width: '100%', boxSizing: 'border-box' as const, border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'), background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none' } }

  const steps = [
    { label: '1. Describe', color: '#3b82f6', key: 'describe', val: describe, hint: 'What do you see? List elements, colors, subjects, materials.' },
    { label: '2. Analyze', color: '#f59e0b', key: 'analyze', val: analyze, hint: 'How is the work organized? Lines, shapes, colors, textures, principles of design.' },
    { label: '3. Interpret', color: '#8b5cf6', key: 'interpret', val: interpret, hint: 'What is the artist communicating? Mood, meaning, symbols, context.' },
    { label: '4. Judge', color: '#34d399', key: 'judge', val: judge, hint: 'Is it successful? Why? Support with evidence from Describe/Analyze.' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit', overflowY: 'auto' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Art Criticism (Feldman)</span>
      {steps.map(st => (
        <div key={st.key}>
          <div style={{ fontSize: 10, fontWeight: 700, color: st.color, marginBottom: 3 }}>{st.label}</div>
          <div style={{ fontSize: 9, color: s.text, marginBottom: 3, fontStyle: 'italic' }}>{st.hint}</div>
          <textarea value={st.val} onChange={e => updateConfig({ [st.key]: e.target.value })} rows={3} style={{ ...s.input, resize: 'vertical' as const }} />
        </div>
      ))}
    </div>
  )
}

// --- Two-Point Perspective ---
export function CanvasTwoPointPerspective({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const vp1x = (raw.vp1x as number) || 15
  const vp2x = (raw.vp2x as number) || 85
  const vpy = (raw.vpy as number) || 40
  const lines = (raw.lines as number) || 10
  const s = { bg: isDark ? '#0f172a' : '#ffffff', surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)', text: isDark ? '#94a3b8' : '#64748b', bright: isDark ? '#e2e8f0' : '#1e293b' }
  const w = 200, h = 200

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Two-Point Perspective</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, color: s.text }}>Lines:</span>
        <input type="range" min={4} max={20} value={lines} onChange={e => updateConfig({ lines: parseInt(e.target.value) })} style={{ flex: 1, accentColor: '#8b5cf6' }} />
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', borderRadius: 6, border: '1px solid ' + s.border, background: isDark ? '#0f172a' : '#fafafa' }}>
        {/* Horizon line */}
        <line x1={0} y1={vpy} x2={w} y2={vpy} stroke={s.text} strokeWidth={0.5} />
        {/* Vanishing points */}
        <circle cx={vp1x} cy={vpy} r={3} fill="#ef4444" />
        <circle cx={vp2x} cy={vpy} r={3} fill="#3b82f6" />
        {/* Lines from VP1 */}
        {Array.from({ length: lines }, (_, i) => {
          const y = vpy + (i + 1) * ((h - vpy) / (lines + 1))
          return <line key={'a' + i} x1={vp1x} y1={vpy} x2={0} y2={y} stroke="#ef444433" strokeWidth={0.5} />
        })}
        {/* Lines from VP2 */}
        {Array.from({ length: lines }, (_, i) => {
          const y = vpy + (i + 1) * ((h - vpy) / (lines + 1))
          return <line key={'b' + i} x1={vp2x} y1={vpy} x2={w} y2={y} stroke="#3b82f633" strokeWidth={0.5} />
        })}
        {/* Vertical edge lines */}
        <line x1={0} y1={vpy} x2={0} y2={h} stroke={s.text + '44'} strokeWidth={0.5} />
        <line x1={w} y1={vpy} x2={w} y2={h} stroke={s.text + '44'} strokeWidth={0.5} />
        <text x={w/2} y={h - 5} textAnchor="middle" fontSize={8} fill={s.text}>Draw over this grid</text>
      </svg>
    </div>
  )
}

// --- Chord Progression Builder ---
const CHORDS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii']
const COMMON_PROGRESSIONS = [
  { name: 'Pop', chords: ['I', 'V', 'vi', 'IV'] },
  { name: 'Classical', chords: ['I', 'IV', 'V', 'I'] },
  { name: 'Jazz ii-V-I', chords: ['ii', 'V', 'I'] },
  { name: 'Rock', chords: ['I', 'IV', 'V', 'IV'] },
  { name: 'Sad', chords: ['vi', 'IV', 'I', 'V'] },
  { name: '50s', chords: ['I', 'vi', 'IV', 'V'] },
]

export function CanvasChordProgression({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const progression = (raw.progression as string[]) || ['I', 'V', 'vi', 'IV']
  const key = (raw.key as string) || 'C'
  const s = { bg: isDark ? '#0f172a' : '#ffffff', surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)', text: isDark ? '#94a3b8' : '#64748b', bright: isDark ? '#e2e8f0' : '#1e293b' }

  const addChord = (c: string) => updateConfig({ progression: [...progression, c] })
  const removeChord = (i: number) => updateConfig({ progression: progression.filter((_, idx) => idx !== i) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Chord Progressions</span>
        <span style={{ fontSize: 9, color: s.text }}>Key: {key}</span>
      </div>
      <div style={{ fontSize: 9, color: s.text, marginBottom: 2 }}>Common progressions:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>{COMMON_PROGRESSIONS.map(p => (
        <button key={p.name} onClick={() => updateConfig({ progression: [...p.chords] })} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 9, cursor: 'pointer', background: s.surface, border: '1px solid ' + s.border, color: s.text }}>{p.name} ({p.chords.join('-')})</button>
      ))}</div>
      <div style={{ fontSize: 9, color: s.text, marginTop: 2 }}>Your progression:</div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        {progression.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', fontSize: 12, fontWeight: 600 }}>{c}</div>
            {i < progression.length - 1 && <span style={{ color: s.text, fontSize: 12 }}>→</span>}
            <button onClick={() => removeChord(i)} style={{ fontSize: 10, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 4 }}>{CHORDS.map(c => (
        <button key={c} onClick={() => addChord(c)} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer', background: s.surface, border: '1px solid ' + s.border, color: s.text }}>+ {c}</button>
      ))}</div>
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
  // Phase 4 Arts widgets
  'arts-elements-art': 'Elements of Art',
  'arts-symmetry-drawing': 'Symmetry Drawing Tool',
  'arts-rhythm-builder': 'Rhythm Builder',
  'arts-artist-spotlight': 'Artist Spotlight',
 'arts-art-timeline': 'Art History Timeline',
  'arts-value-shading': 'Value & Shading Study',
  'arts-compositional': 'Compositional Analysis',
  'arts-criticism': 'Art Criticism Framework',
  'arts-two-point-persp': 'Two-Point Perspective',
  'arts-chord-progression': 'Chord Progression Builder',
  // Phase 4 cleanup — 2 missing Arts widgets
  'arts-shape-stamps': 'Shape Stamp Library',
  'arts-portfolio': 'Portfolio Organizer',
}

// ============================================================
// Phase 4 cleanup — 2 missing Arts widgets
// ============================================================

// --- Shape Stamp Library ---
// Phase 5: Expanded with subject-categorized stamps (Math, Science, ELA, Arts, General).
// Click a shape to "stamp" it onto the canvas.
type StampDef = { id: string; name: string; render: (size: number, color: string) => React.ReactNode }
type StampCategory = { id: string; label: string; stamps: StampDef[] }

const STAMP_CATEGORIES: StampCategory[] = [
  {
    id: 'general', label: 'General',
    stamps: [
      { id: 'star', name: 'Star', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 16.5,13.5 18.5,21 12,17 5.5,21 7.5,13.5 2,9 9,9" fill={c} /></svg> },
      { id: 'check', name: 'Checkmark', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'xmark', name: 'X Mark', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" /></svg> },
      { id: 'arrow', name: 'Arrow', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M4 12h14M14 6l6 6-6 6" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'heart', name: 'Heart', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9.5C.5 6 5 2 9 4c1.5.7 2.5 2 3 3 .5-1 1.5-2.3 3-3 4-2 8.5 2 6.5 7.5C19 16.5 12 21 12 21z" fill={c} /></svg> },
      { id: 'thumbup', name: 'Thumb Up', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.3a2 2 0 0 0 2-1.7l1.4-9a2 2 0 0 0-2-2.3H14z M7 22V11" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.3" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'lightbulb', name: 'Lightbulb', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M9 21h6M10 18h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.3" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'clock', name: 'Clock', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2" fill="none" /><path d="M12 7v5l3 2" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" /></svg> },
    ],
  },
  {
    id: 'math', label: 'Math',
    stamps: [
      { id: 'circle', name: 'Circle', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.2" /></svg> },
      { id: 'square', name: 'Square', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.2" /></svg> },
      { id: 'triangle', name: 'Triangle', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><polygon points="12,3 22,21 2,21" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.2" /></svg> },
      { id: 'diamond', name: 'Diamond', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><polygon points="12,2 22,12 12,22 2,12" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.2" /></svg> },
      { id: 'plus', name: 'Plus', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke={c} strokeWidth="3" strokeLinecap="round" /></svg> },
      { id: 'minus', name: 'Minus', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M5 12h14" stroke={c} strokeWidth="3" strokeLinecap="round" /></svg> },
      { id: 'multiply', name: 'Multiply', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth="3" strokeLinecap="round" /></svg> },
      { id: 'divide', name: 'Divide', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="6" r="2" fill={c} /><path d="M5 12h14" stroke={c} strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="18" r="2" fill={c} /></svg> },
      { id: 'equals', name: 'Equals', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M5 9h14M5 15h14" stroke={c} strokeWidth="3" strokeLinecap="round" /></svg> },
      { id: 'percent', name: 'Percent', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M19 5L5 19" stroke={c} strokeWidth="2" strokeLinecap="round" /><circle cx="7" cy="7" r="2" stroke={c} strokeWidth="2" fill="none" /><circle cx="17" cy="17" r="2" stroke={c} strokeWidth="2" fill="none" /></svg> },
      { id: 'pi', name: 'Pi', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><text x="12" y="18" textAnchor="middle" fontSize="20" fontWeight="700" fill={c} fontFamily="serif">π</text></svg> },
    ],
  },
  {
    id: 'science', label: 'Science',
    stamps: [
      { id: 'beaker', name: 'Beaker', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M9 3v6l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V3M9 3h6" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.2" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'flask', name: 'Flask', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M10 3h4v4l5 12a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l5-12V3z" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.2" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'test-tube', name: 'Test Tube', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M9 3v15a3 3 0 0 0 6 0V3M9 7h6" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.2" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'thermometer', name: 'Thermometer', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M14 14V4a2 2 0 1 0-4 0v10a4 4 0 1 0 4 0z" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.3" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'magnet', name: 'Magnet', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M6 3v9a6 6 0 0 0 12 0V3M6 3h4v9a2 2 0 0 0 4 0V3h4" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'battery', name: 'Battery', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><rect x="3" y="8" width="16" height="8" rx="1" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.2" /><line x1="20" y1="11" x2="20" y2="13" stroke={c} strokeWidth="2" /><line x1="6" y1="8" x2="6" y2="16" stroke={c} strokeWidth="1" /></svg> },
      { id: 'lightbulb', name: 'Lightbulb', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M9 21h6M10 18h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.3" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'leaf', name: 'Leaf', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M20 4S8 4 4 12c-2 4 0 8 0 8s4-2 8-2c4 0 8-4 8-12 0-1 0-2 0-2z" fill={c} /></svg> },
      { id: 'dna', name: 'DNA', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M4 2c0 6 16 10 16 20M20 2c0 6-16 10-16 20M6 6h12M6 18h12M8 10h8M8 14h8" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg> },
      { id: 'wave', name: 'Wave', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0 4 4 6 0" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" /></svg> },
    ],
  },
  {
    id: 'ela', label: 'ELA',
    stamps: [
      { id: 'book', name: 'Book', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M4 19.5V4a1 1 0 0 1 1-1H19v18H5a1 1 0 0 1-1-1.5z M4 19.5a1 1 0 0 1 1-1.5H19" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.2" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'pencil', name: 'Pencil', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.3" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'speech', name: 'Speech Bubble', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-4-1L3 20l1.1-5a8.5 8.5 0 0 1 7.9-12 8.4 8.4 0 0 1 9 8.4z" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.2" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'thought', name: 'Thought Bubble', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M9 11a3 3 0 0 1 6 0 3 3 0 0 1 0 6H9a3 3 0 0 1 0-6z M7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" stroke={c} strokeWidth="1.5" fill={c} fillOpacity="0.2" /></svg> },
      { id: 'exclaim', name: 'Exclaim', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="19" r="2" fill={c} /><path d="M12 3v12" stroke={c} strokeWidth="3" strokeLinecap="round" /></svg> },
      { id: 'question', name: 'Question', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M9 9a3 3 0 1 1 4 3c-1 1-1 2-1 3" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" /><circle cx="12" cy="19" r="1.5" fill={c} /></svg> },
      { id: 'quote', name: 'Quote', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M7 7H4v6h6V7H7zM7 7c0-2 1-3 3-3M17 7h-3v6h6V7h-3zM17 7c0-2 1-3 3-3" stroke={c} strokeWidth="1.5" fill={c} fillOpacity="0.3" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'turnpage', name: 'Turn Page', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M14 3v4a1 1 0 0 0 1 1h4M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M9 13l4 4M13 13l-4 4" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.2" strokeLinecap="round" strokeLinejoin="round" /></svg> },
    ],
  },
  {
    id: 'arts', label: 'Arts',
    stamps: [
      { id: 'palette', name: 'Palette', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0 0 20c1 0 2-1 2-2 0-2-2-2-2-4 0-1 1-2 2-2h2a4 4 0 0 0 4-4 10 10 0 0 0-10-8z" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.2" /><circle cx="7" cy="11" r="1" fill={c} /><circle cx="9" cy="7" r="1" fill={c} /><circle cx="14" cy="6" r="1" fill={c} /></svg> },
      { id: 'paintbrush', name: 'Paintbrush', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M3 21c3 0 5-2 5-5 0-1-1-2-2-2-3 0-3 4-3 7zM8 16l11-11M19 5l2 2-11 11" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.3" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'note-whole', name: 'Whole Note', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="6" ry="4" stroke={c} strokeWidth="2" fill="none" /></svg> },
      { id: 'note-quarter', name: 'Quarter Note', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><ellipse cx="9" cy="17" rx="5" ry="3.5" transform="rotate(-20 9 17)" fill={c} /><path d="M14 17V4" stroke={c} strokeWidth="2" strokeLinecap="round" /></svg> },
      { id: 'treble-clef', name: 'Treble Clef', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 3a4 4 0 0 0-1 8c2 0 3-2 3-4M11 11v8a3 3 0 0 0 6 0M11 11c-2 0-4 1-4 3s2 3 4 3" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'rest', name: 'Rest', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M7 4l5 4-3 3 5 4-3 3" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg> },
      { id: 'flower', name: 'Flower', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><g fill={c}><circle cx="12" cy="6" r="4" /><circle cx="6" cy="12" r="4" /><circle cx="18" cy="12" r="4" /><circle cx="12" cy="18" r="4" /></g><circle cx="12" cy="12" r="3" fill="#fbbf24" /></svg> },
      { id: 'tree', name: 'Tree', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><polygon points="12,2 4,14 9,14 5,20 19,20 15,14 20,14" fill={c} /><rect x="11" y="20" width="2" height="3" fill="#92400e" /></svg> },
      { id: 'sun', name: 'Sun', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><g fill={c} stroke={c}><circle cx="12" cy="12" r="5" /><g strokeWidth="2" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" /><line x1="5" y1="5" x2="7" y2="7" /><line x1="17" y1="17" x2="19" y2="19" /><line x1="5" y1="19" x2="7" y2="17" /><line x1="17" y1="7" x2="19" y2="5" /></g></g></svg> },
      { id: 'moon', name: 'Moon', render: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" fill={c} /></svg> },
    ],
  },
]

// Flat lookup map for stamp rendering by id
const SHAPE_STAMPS: StampDef[] = STAMP_CATEGORIES.flatMap(cat => cat.stamps)

const STAMP_COLORS = ['#ef4444', '#f97316', '#fbbf24', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#0f172a']

export function CanvasShapeStamps({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const color = (raw.color as string) || '#ef4444'
  const size = (raw.size as number) || 48
  const placed = (raw.placed as Array<{ id: string; shape: string; x: number; y: number; color: string; size: number }>) || []
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const btnBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'

  const handleStamp = (shapeId: string) => {
    // Place at a pseudo-random position within the widget preview area
    const x = 20 + Math.random() * 60 // 20-80% of preview width
    const y = 20 + Math.random() * 60
    const newStamp = { id: `stamp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, shape: shapeId, x, y, color, size }
    updateConfig({ placed: [...placed, newStamp] })
  }

  const clearStamps = () => updateConfig({ placed: [] })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: 2 }}>Shape Stamp Library</div>
      <p style={{ fontSize: 10, color: labelColor, lineHeight: 1.4, margin: 0 }}>
        Pick a shape, then click &quot;Stamp&quot; to place it on the preview board below. Drag the widget on the canvas to reposition the whole stamp collection.
      </p>

      {/* Color picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: labelColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>Color:</span>
        {STAMP_COLORS.map(c => (
          <button
            key={c}
            onClick={() => updateConfig({ color: c })}
            style={{
              width: 18, height: 18, borderRadius: '50%', border: color === c ? '2px solid #fff' : '1px solid ' + btnBorder,
              background: c, cursor: 'pointer', padding: 0, boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
            }}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>

      {/* Size picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: labelColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>Size:</span>
        {[32, 48, 64, 80].map(sz => (
          <button
            key={sz}
            onClick={() => updateConfig({ size: sz })}
            style={{
              padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: size === sz ? 700 : 500,
              background: size === sz ? 'rgba(139,92,246,0.15)' : btnBg,
              border: size === sz ? '1px solid rgba(139,92,246,0.3)' : '1px solid ' + btnBorder,
              color: size === sz ? '#a78bfa' : labelColor, cursor: 'pointer',
            }}
          >{sz}px</button>
        ))}
      </div>

      {/* Phase 5: Shape buttons grouped by category */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto', padding: 2 }}>
        {STAMP_CATEGORIES.map(cat => (
          <div key={cat.id}>
            <div style={{ fontSize: 9, fontWeight: 700, color: labelColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, opacity: 0.7 }}>
              {cat.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3 }}>
              {cat.stamps.map(s => (
                <button
                  key={s.id + '_' + cat.id}
                  onClick={() => handleStamp(s.id)}
                  title={`Stamp: ${s.name} (${cat.label})`}
                  style={{
                    padding: 4, borderRadius: 4, fontSize: 8, fontWeight: 500, cursor: 'pointer',
                    background: btnBg, border: '1px solid ' + btnBorder, color: labelColor,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                  }}
                >
                  {s.render(18, color)}
                  <span style={{ fontSize: 7, textAlign: 'center', lineHeight: 1 }}>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Preview canvas with placed stamps */}
      <div style={{
        position: 'relative', minHeight: 140, borderRadius: 6,
        background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
        border: '1px dashed ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'),
        overflow: 'hidden',
      }}>
        {placed.length === 0 ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: labelColor, fontSize: 10 }}>
            Click a shape above to stamp it here
          </div>
        ) : (
          placed.map(stamp => {
            const shape = SHAPE_STAMPS.find(s => s.id === stamp.shape)
            if (!shape) return null
            return (
              <div key={stamp.id} style={{ position: 'absolute', left: `${stamp.x}%`, top: `${stamp.y}%`, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                {shape.render(stamp.size, stamp.color)}
              </div>
            )
          })
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: labelColor }}>{placed.length} stamp{placed.length === 1 ? '' : 's'} placed</span>
        {placed.length > 0 && (
          <button onClick={clearStamps} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', cursor: 'pointer' }}>Clear all</button>
        )}
      </div>
    </div>
  )
}

// --- Portfolio Organizer ---
// Categorize artworks by theme/medium/date; add artist statements;
// export as a simple gallery view (text-based export to clipboard).
export function CanvasPortfolioOrganizer({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const works = (raw.works as Array<{
    id: string; title: string; theme: string; medium: string; date: string; statement: string; img?: string
  }>) || []
  const sortBy = (raw.sortBy as string) || 'date' // 'date' | 'theme' | 'medium'
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const btnBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'

  const addWork = () => {
    const newWork = {
      id: `work-${Date.now()}`,
      title: 'Untitled',
      theme: '',
      medium: '',
      date: new Date().toISOString().slice(0, 10),
      statement: '',
    }
    updateConfig({ works: [...works, newWork] })
  }

  const updateWork = (id: string, patch: Partial<typeof works[number]>) => {
    updateConfig({ works: works.map(w => w.id === id ? { ...w, ...patch } : w) })
  }

  const removeWork = (id: string) => {
    updateConfig({ works: works.filter(w => w.id !== id) })
  }

  const handleImageUpload = (id: string, file: File) => {
    if (!file.type.startsWith('image/') || file.size > 4 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = () => updateWork(id, { img: reader.result as string })
    reader.readAsDataURL(file)
  }

  const sortedWorks = [...works].sort((a, b) => {
    if (sortBy === 'date') return (a.date || '').localeCompare(b.date || '')
    if (sortBy === 'theme') return (a.theme || '').localeCompare(b.theme || '')
    if (sortBy === 'medium') return (a.medium || '').localeCompare(b.medium || '')
    return 0
  })

  const exportGallery = () => {
    const lines = sortedWorks.map((w, i) => `${i + 1}. ${w.title} (${w.medium || 'unknown medium'}, ${w.date || 'undated'})\n   Theme: ${w.theme || '—'}\n   Artist statement: ${w.statement || '—'}`)
    const text = `Portfolio (${sortedWorks.length} works, sorted by ${sortBy})\n\n${lines.join('\n\n')}`
    navigator.clipboard?.writeText(text).then(() => alert('Portfolio exported to clipboard!')).catch(() => alert(text))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: isDark ? '#e2e8f0' : '#1e293b' }}>Portfolio Organizer</span>
        <span style={{ fontSize: 9, color: labelColor }}>{works.length} work{works.length === 1 ? '' : 's'}</span>
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: labelColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sort by:</span>
        {['date', 'theme', 'medium'].map(s => (
          <button key={s} onClick={() => updateConfig({ sortBy: s })} style={{
            padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: sortBy === s ? 700 : 500,
            background: sortBy === s ? 'rgba(139,92,246,0.15)' : btnBg,
            border: sortBy === s ? '1px solid rgba(139,92,246,0.3)' : '1px solid ' + btnBorder,
            color: sortBy === s ? '#a78bfa' : labelColor, cursor: 'pointer', textTransform: 'capitalize',
          }}>{s}</button>
        ))}
        <button onClick={addWork} style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399', cursor: 'pointer' }}>+ Add Work</button>
        {works.length > 0 && (
          <button onClick={exportGallery} style={{ padding: '3px 10px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: btnBg, border: '1px solid ' + btnBorder, color: labelColor, cursor: 'pointer' }}>Export</button>
        )}
      </div>

      {sortedWorks.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: labelColor, fontSize: 11, background: btnBg, borderRadius: 6, border: '1px dashed ' + btnBorder }}>
          No works yet. Click &quot;+ Add Work&quot; to begin organizing your portfolio.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 380, overflowY: 'auto' }}>
          {sortedWorks.map(w => (
            <div key={w.id} style={{ padding: 8, borderRadius: 6, border: '1px solid ' + btnBorder, background: btnBg, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                {w.img ? (
                  <img src={w.img} alt={w.title} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                ) : (
                  <label style={{ width: 50, height: 50, borderRadius: 4, border: '1px dashed ' + btnBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 9, color: labelColor, flexShrink: 0 }}>
                    +Img
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleImageUpload(w.id, f)
                      e.target.value = ''
                    }} />
                  </label>
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <input value={w.title} onChange={(e) => updateWork(w.id, { title: e.target.value })} placeholder="Title" style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b', background: 'transparent', border: 'none', borderBottom: '1px solid ' + btnBorder, outline: 'none', padding: '2px 0' }} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input value={w.theme} onChange={(e) => updateWork(w.id, { theme: e.target.value })} placeholder="Theme" style={{ flex: 1, fontSize: 9, color: labelColor, background: 'transparent', border: 'none', borderBottom: '1px solid ' + btnBorder, outline: 'none', padding: '2px 0' }} />
                    <input value={w.medium} onChange={(e) => updateWork(w.id, { medium: e.target.value })} placeholder="Medium" style={{ flex: 1, fontSize: 9, color: labelColor, background: 'transparent', border: 'none', borderBottom: '1px solid ' + btnBorder, outline: 'none', padding: '2px 0' }} />
                    <input type="date" value={w.date} onChange={(e) => updateWork(w.id, { date: e.target.value })} style={{ width: 90, fontSize: 9, color: labelColor, background: 'transparent', border: 'none', borderBottom: '1px solid ' + btnBorder, outline: 'none', padding: '2px 0' }} />
                  </div>
                </div>
                <button onClick={() => removeWork(w.id)} title="Remove" style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', flexShrink: 0 }}>&times;</button>
              </div>
              <textarea value={w.statement} onChange={(e) => updateWork(w.id, { statement: e.target.value })} placeholder="Artist statement (1-2 sentences about this piece)..." style={{ fontSize: 10, color: labelColor, background: 'transparent', border: '1px solid ' + btnBorder, borderRadius: 4, outline: 'none', padding: '4px 6px', resize: 'vertical', minHeight: 30, fontFamily: 'inherit', lineHeight: 1.4 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
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
    case 'arts-compare': return { aspect: 'color', textA: '', textB: '', imgA: '', imgB: '' }
    // Phase 4 Arts widgets
    case 'arts-elements-art': return { selected: 0 }
    case 'arts-symmetry-drawing': return { mode: 'vertical', paths: [], currentPath: '' }
    case 'arts-rhythm-builder': return { grid: Array(8).fill('quarter'), bpm: 120 }
    case 'arts-artist-spotlight': return { idx: 0 }
    case 'arts-art-timeline': return { selected: -1 }
    case 'arts-value-shading': return { technique: 'hatching' }
    case 'arts-compositional': return { overlay: 'thirds' }
    case 'arts-criticism': return { describe: '', analyze: '', interpret: '', judge: '' }
    case 'arts-two-point-persp': return { vp1x: 15, vp2x: 85, vpy: 40, lines: 10 }
    case 'arts-chord-progression': return { progression: ['I','V','vi','IV'], key: 'C' }
    // Phase 4 cleanup — 2 missing Arts widgets
    case 'arts-shape-stamps': return { color: '#ef4444', size: 48, placed: [] }
    case 'arts-portfolio': return { works: [], sortBy: 'date' }
    default: return {}
  }
}

export function getArtsWidgetDefaultSize(kind: string): { width: number; height: number } {
  switch (kind) {
    case 'arts-color-theory': return { width: 280, height: 400 }
    case 'arts-perspective-grid': return { width: 280, height: 320 }
    case 'arts-staff-notation': return { width: 300, height: 320 }
    case 'arts-compare': return { width: 420, height: 480 }
    // Phase 4 Arts widgets
    case 'arts-elements-art': return { width: 400, height: 500 }
    case 'arts-symmetry-drawing': return { width: 440, height: 500 }
    case 'arts-rhythm-builder': return { width: 440, height: 400 }
    case 'arts-artist-spotlight': return { width: 400, height: 520 }
    case 'arts-art-timeline': return { width: 460, height: 400 }
    case 'arts-value-shading': return { width: 440, height: 520 }
    case 'arts-compositional': return { width: 420, height: 420 }
    case 'arts-criticism': return { width: 420, height: 550 }
    case 'arts-two-point-persp': return { width: 460, height: 500 }
    case 'arts-chord-progression': return { width: 420, height: 480 }
    // Phase 4 cleanup — 2 missing Arts widgets
    case 'arts-shape-stamps': return { width: 360, height: 480 }
    case 'arts-portfolio': return { width: 420, height: 520 }
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
export { CanvasColorTheory, CanvasPerspectiveGrid, CanvasStaffNotation, CanvasArtworkCompare, CanvasTimer, CanvasRandomPicker, CanvasGraphingTool, CanvasElementsOfArt, CanvasSymmetryDrawing, CanvasRhythmBuilder, CanvasArtistSpotlight, CanvasArtHistoryTimeline, CanvasValueShading, CanvasCompositionalAnalysis, CanvasArtCriticism, CanvasTwoPointPerspective, CanvasChordProgression, CanvasShapeStamps, CanvasPortfolioOrganizer }
