'use client'

import { useState, useCallback, lazy, Suspense } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { generateId } from '@/lib/whiteboard/utils'
import { getDefaultWidgetConfig, getWidgetDefaultSize, WIDGET_KIND_LABELS } from '@/components/whiteboard/CanvasWidgets'
import type { WidgetElement } from '@/lib/whiteboard/types'

function ToolSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{
          height: 28, borderRadius: 6,
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        }} />
      ))}
    </div>
  )
}

// ---- Color Theory (inline) ----
function ColorTheoryInline({ isDark }: { isDark: boolean }) {
  const [hue, setHue] = useState(200)
  const [sat, setSat] = useState(70)
  const [light, setLight] = useState(50)
  const [harmony, setHarmony] = useState<string>('complementary')

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
  const harmonyHues = getHarmonyHues()
  const harmonyHexes = harmonyHues.map(h => hslToHex(h, sat, light))
  const valueScale = Array.from({ length: 9 }, (_, i) => hslToHex(hue, sat, 10 + i * 10))

  const labelColor = isDark ? '#94a3b8' : '#475569'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const btnBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const harmonyTypes = ['complementary', 'analogous', 'triadic', 'split']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Main color + info */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        <div style={{ width: 72, height: 56, borderRadius: 8, background: mainHex, border: '2px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'), flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace', color: isDark ? '#e2e8f0' : '#1e293b' }}>{mainHex.toUpperCase()}</div>
          <div style={{ fontSize: 9, color: labelColor }}>HSL({hue}, {sat}%, {light}%)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 8, color: isDark ? '#71717a' : '#9ca3af' }}>Comp:</span>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: hslToHex((hue + 180) % 360, sat, light), border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') }} />
            <span style={{ fontSize: 8, fontFamily: 'monospace', color: labelColor }}>{hslToHex((hue + 180) % 360, sat, light).toUpperCase()}</span>
          </div>
        </div>
      </div>
      {/* Sliders */}
      {([['Hue', 0, 360, 1], ['Sat', 0, 100, 1], ['Light', 0, 100, 1]] as [string, number, number, number][]).map(([label, min, max, step]) => (
        <div key={label}>
          <div style={{ fontSize: 9, color: labelColor, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}><span>{label}</span><span style={{ fontFamily: 'monospace' }}>{label === 'Hue' ? hue + '°' : label === 'Sat' ? sat + '%' : light + '%'}</span></div>
          <input type="range" min={min} max={max} step={step} value={label === 'Hue' ? hue : label === 'Sat' ? sat : light} onChange={(e) => { const v = Number(e.target.value); if (label === 'Hue') setHue(v); else if (label === 'Sat') setSat(v); else setLight(v); }} style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer', height: 4 }} />
        </div>
      ))}
      {/* Harmony type */}
      <div>
        <div style={{ fontSize: 9, color: labelColor, fontWeight: 500, marginBottom: 4 }}>Harmony</div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {harmonyTypes.map(h => (
            <button key={h} onClick={() => setHarmony(h)} style={{ padding: '2px 8px', borderRadius: 5, fontSize: 9, fontWeight: 600, background: harmony === h ? 'rgba(139,92,246,0.2)' : btnBg, border: harmony === h ? '1px solid rgba(139,92,246,0.4)' : '1px solid ' + btnBorder, color: harmony === h ? '#a78bfa' : labelColor, cursor: 'pointer', textTransform: 'capitalize' }}>{h}</button>
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
      {/* Value scale */}
      <div>
        <div style={{ fontSize: 9, color: labelColor, fontWeight: 500, marginBottom: 4 }}>Value Scale</div>
        <div style={{ display: 'flex', gap: 2 }}>
          {valueScale.map((hex, i) => (
            <div key={i} style={{ flex: 1, height: 24, borderRadius: 3, background: hex, border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') }} title={hex} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}><span style={{ fontSize: 7, color: isDark ? '#71717a' : '#9ca3af' }}>Dark</span><span style={{ fontSize: 7, color: isDark ? '#71717a' : '#9ca3af' }}>Light</span></div>
      </div>
    </div>
  )
}

// ---- Perspective Grid (inline) ----
function PerspectiveGridInline({ isDark }: { isDark: boolean }) {
  const [vanishingX, setVanishingX] = useState(50)
  const [vanishingY, setVanishingY] = useState(40)
  const [numLines, setNumLines] = useState(8)
  const labelColor = isDark ? '#94a3b8' : '#475569'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 10, color: labelColor, lineHeight: 1.4, margin: 0 }}>Adjust the vanishing point and number of lines to create a one-point perspective grid.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div>
          <div style={{ fontSize: 9, color: labelColor, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}><span>VP X</span><span style={{ fontFamily: 'monospace' }}>{vanishingX}%</span></div>
          <input type="range" min={10} max={90} value={vanishingX} onChange={(e) => setVanishingX(Number(e.target.value))} style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer' }} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: labelColor, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}><span>VP Y</span><span style={{ fontFamily: 'monospace' }}>{vanishingY}%</span></div>
          <input type="range" min={10} max={70} value={vanishingY} onChange={(e) => setVanishingY(Number(e.target.value))} style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer' }} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: labelColor, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}><span>Lines</span><span style={{ fontFamily: 'monospace' }}>{numLines}</span></div>
          <input type="range" min={2} max={16} value={numLines} onChange={(e) => setNumLines(Number(e.target.value))} style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer' }} />
        </div>
      </div>
      {/* Preview grid */}
      <svg viewBox="0 0 200 140" style={{ width: '100%', borderRadius: 6, border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'), background: isDark ? '#0f172a' : '#f8fafc' }}>
        {/* Horizon line */}
        <line x1="0" y1={vanishingY * 1.4} x2="200" y2={vanishingY * 1.4} stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="0.5" strokeDasharray="4 2" />
        {/* Vanishing point */}
        <circle cx={vanishingX * 2} cy={vanishingY * 1.4} r="3" fill="#8b5cf6" />
        {/* Radiating lines */}
        {Array.from({ length: numLines }, (_, i) => {
          const t = numLines === 1 ? 0.5 : i / (numLines - 1)
          const bottomX = t * 200
          return <line key={i} x1={vanishingX * 2} y1={vanishingY * 1.4} x2={bottomX} y2="140" stroke={isDark ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.25)'} strokeWidth="0.5" />
        })}
        {/* Ground lines */}
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

// ---- Staff Notation (inline) ----
function StaffNotationInline({ isDark }: { isDark: boolean }) {
  const [notes, setNotes] = useState<string[]>(['C4', 'E4', 'G4', 'C5'])
  const noteOptions = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5']
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const btnBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'

  const addNote = (note: string) => {
    if (notes.length < 16) setNotes([...notes, note])
  }
  const removeNote = (idx: number) => {
    setNotes(notes.filter((_, i) => i !== idx))
  }
  const clearNotes = () => setNotes([])

  // Map note to Y position on staff
  const noteToY = (note: string): number => {
    const noteMap: Record<string, number> = {
      'C4': 70, 'D4': 65, 'E4': 60, 'F4': 55, 'G4': 50, 'A4': 45, 'B4': 40, 'C5': 35, 'D5': 30, 'E5': 25, 'F5': 20, 'G5': 15,
    }
    return noteMap[note] ?? 50
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Staff preview */}
      <svg viewBox="0 0 280 90" style={{ width: '100%', borderRadius: 6, border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'), background: isDark ? '#0f172a' : '#fffef5' }}>
        {/* Staff lines */}
        {[20, 30, 40, 50, 60].map(y => (
          <line key={y} x1="10" y1={y} x2="270" y2={y} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="0.7" />
        ))}
        {/* Treble clef (simplified G) */}
        <text x="14" y="52" fontSize="32" fill={isDark ? '#94a3b8' : '#475569'} fontFamily="serif" fontWeight="bold">G</text>
        {/* Notes */}
        {notes.map((note, i) => {
          const x = 50 + i * 22
          const y = noteToY(note)
          const isFilled = !note.includes('/')
          return (
            <g key={i}>
              <ellipse cx={x} cy={y} rx="6" ry="4.5" fill={isFilled ? (isDark ? '#e2e8f0' : '#1e293b') : 'none'} stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth="1" transform={`rotate(-15 ${x} ${y})`} />
              {note.endsWith('/') && <line x1={x} y1={y} x2={x} y2={y + 30} stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth="1" />}
            </g>
          )
        })}
      </svg>
      {/* Note buttons */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {noteOptions.map(n => (
          <button key={n} onClick={() => addNote(n)} style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 500, background: btnBg, border: '1px solid ' + btnBorder, color: labelColor, cursor: 'pointer' }}>{n}</button>
        ))}
      </div>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={clearNotes} style={{ padding: '3px 10px', borderRadius: 5, fontSize: 9, fontWeight: 600, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>Clear</button>
        <span style={{ fontSize: 9, color: labelColor, lineHeight: '22px' }}>{notes.length}/16 notes</span>
      </div>
    </div>
  )
}

// ---- Art Compare (inline) ----
function ArtCompareInline({ isDark }: { isDark: boolean }) {
  const [aspect, setAspect] = useState('color')
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 10, color: labelColor, lineHeight: 1.4, margin: 0 }}>Select an aspect to focus your comparison. Use these prompts to guide your analysis of two artworks side by side.</p>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {aspects.map(a => (
          <button key={a} onClick={() => setAspect(a)} style={{ padding: '3px 10px', borderRadius: 5, fontSize: 10, fontWeight: aspect === a ? 700 : 500, background: aspect === a ? 'rgba(139,92,246,0.15)' : btnBg, border: aspect === a ? '1px solid rgba(139,92,246,0.3)' : '1px solid ' + btnBorder, color: aspect === a ? '#a78bfa' : labelColor, cursor: 'pointer', textTransform: 'capitalize' }}>{a}</button>
        ))}
      </div>
      {/* Two-column comparison area */}
      <div style={{ display: 'flex', gap: 8 }}>
        {['Artwork A', 'Artwork B'].map(label => (
          <div key={label} style={{ flex: 1, borderRadius: 6, border: '1px dashed ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'), padding: '8px 10px', minHeight: 60 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: isDark ? '#a78bfa' : '#7c3aed', marginBottom: 4 }}>{label}</div>
            <div contentEditable suppressContentEditableWarning style={{ fontSize: 10, color: labelColor, lineHeight: 1.5, outline: 'none', minHeight: 36 }} data-placeholder="Type your observations..." />
          </div>
        ))}
      </div>
      {/* Guiding prompt */}
      <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: '#a78bfa', marginBottom: 3 }}>Guiding Prompt</div>
        <div style={{ fontSize: 10, color: labelColor, lineHeight: 1.5 }}>{prompts[aspect]}</div>
      </div>
    </div>
  )
}

// ============================================================
// Types
// ============================================================

type GradeBand = 'all' | 'elementary' | 'middle' | 'highschool'

interface ArtsToolkitProps {
  roomId: string
}

const GRADE_BANDS: { id: GradeBand; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '#' },
  { id: 'elementary', label: 'K-5', icon: '*' },
  { id: 'middle', label: '6-8', icon: '^' },
  { id: 'highschool', label: '9-12', icon: '!' },
]

// ============================================================
// Component
// ============================================================

export function ArtsToolkit({ roomId: _roomId }: ArtsToolkitProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const addElement = useWhiteboardStore((s) => s.addElement)
  const camera = useWhiteboardStore((s) => s.camera)
  const currentPageIndex = useWhiteboardStore((s) => s.currentPageIndex)

  const [activeBand, setActiveBand] = useState<GradeBand>('all')
  const [visibleBands, setVisibleBands] = useState<Set<GradeBand>>(new Set(['all', 'elementary', 'middle', 'highschool']))
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  const toggleBand = (band: GradeBand) => {
    setVisibleBands(prev => {
      const next = new Set(prev)
      if (next.has(band)) next.delete(band)
      else next.add(band)
      return next
    })
  }

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  // Add to Board — same pattern as MathToolkit
  const addToBoard = useCallback((widgetKind: string, overrides?: Record<string, unknown>) => {
    const size = getWidgetDefaultSize(widgetKind)
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    const cx = ((vw / 2) - 80 - camera.x) / camera.zoom
    const cy = ((vh / 2 - 44) - camera.y) / camera.zoom
    const el: WidgetElement = {
      id: generateId(),
      type: 'widget',
      widgetKind,
      config: { ...getDefaultWidgetConfig(widgetKind), ...overrides },
      x: cx - size.width / 2,
      y: cy - size.height / 2,
      width: size.width,
      height: size.height,
      rotation: 0, opacity: 1,
      strokeColor: isDark ? '#334155' : '#e2e8f0',
      fillColor: isDark ? '#0f172a' : '#ffffff',
      strokeWidth: 1, locked: false,
      pageIndex: currentPageIndex,
    }
    addElement(el)
  }, [addElement, camera, isDark, currentPageIndex])

  // ---- Style helpers ----
  const dkBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const dkBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const dkText = isDark ? '#94a3b8' : '#475569'
  const actBg = 'rgba(139,92,246,0.15)'
  const actBorder = 'rgba(139,92,246,0.3)'
  const actText = '#a78bfa'
  const addBg = 'rgba(5,150,105,0.15)'
  const addBorder = 'rgba(5,150,105,0.3)'
  const addText = '#34d399'

  const sectionTitle = (text: string, sectionId: string) => (
    <div className={'toolkit-section-title' + (isDark ? '' : ' toolkit-section-title-light')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }} onClick={() => toggleSection(sectionId)}>
      <span>{text}</span>
      <span style={{ fontSize: 10, color: dkText, transition: 'transform 0.15s', transform: collapsedSections.has(sectionId) ? 'rotate(-90deg)' : 'rotate(0deg)' }}>&#9660;</span>
    </div>
  )

  const addBoardBtn = (widgetKind: string) => (
    <button onClick={() => addToBoard(widgetKind)} className="toolkit-add-to-board-btn" style={{ padding: '5px 14px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: addBg, border: '1px solid ' + addBorder, color: addText, cursor: 'pointer', alignSelf: 'flex-end', flexShrink: 0 }}>+ Add to Board</button>
  )

  return (
    <div className="widget-content toolkit-arts" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
      {/* ---- Grade Band Tabs ---- */}
      <div style={{ display: 'flex', gap: 2, padding: '8px 12px 4px', flexWrap: 'wrap' }}>
        {GRADE_BANDS.filter(b => b.id === 'all' || visibleBands.has(b.id)).map((band) => {
          const active = activeBand === band.id
          return (
            <button key={band.id} onClick={() => setActiveBand(band.id)}
              style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: active ? 700 : 500, background: active ? actBg : dkBg, border: active ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: active ? actText : dkText, cursor: 'pointer', flex: '1 1 auto', textAlign: 'center', minWidth: 0 }}>
              {band.icon} {band.label}
            </button>
          )
        })}
      </div>

      {/* ---- Band Visibility Toggles ---- */}
      <div style={{ display: 'flex', gap: 4, padding: '2px 12px 8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, opacity: 0.6 }}>Show:</span>
        {GRADE_BANDS.filter(b => b.id !== 'all').map((band) => (
          <label key={band.id} style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', fontSize: 10, color: dkText }}>
            <input type="checkbox" checked={visibleBands.has(band.id)} onChange={() => toggleBand(band.id)} style={{ width: 12, height: 12, cursor: 'pointer' }} />
            {band.label}
          </label>
        ))}
      </div>

      {/* ============================================================ */}
      {/* ALL TAB — all 4 tools */}
      {/* ============================================================ */}
      {activeBand === 'all' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Color Theory Explorer', 'all-color')}
            {!collapsedSections.has('all-color') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Explore color harmonies, HSL values, and value scales. Great for teaching color theory fundamentals.</p>
              <div style={{ padding: '0 12px 8px' }}><ColorTheoryInline isDark={isDark} /></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Choose a base hue (0-360 on the color wheel)</div><div>Step 2: Adjust saturation (intensity) and lightness (brightness)</div><div>Step 3: Complementary = 180 degrees opposite (max contrast)</div><div>Step 4: Analogous = plus/minus 30 (harmonious, calm)</div><div>Step 5: Triadic = 120 apart (balanced vibrancy)</div><div>Step 6: Check the value scale - contrast in lightness matters more than hue</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Complementary colors stimulate different cone cells simultaneously, creating maximum visual energy. Analogous colors create calm - that is why sunsets feel peaceful.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-color-theory')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Perspective Grid', 'all-perspective')}
            {!collapsedSections.has('all-perspective') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Create one-point perspective grids. Adjust vanishing point and line count for drawing exercises.</p>
              <div style={{ padding: '0 12px 8px' }}><PerspectiveGridInline isDark={isDark} /></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Place the vanishing point (VP) - where the viewer looks</div><div>Step 2: Draw the horizon line through the VP (eye level)</div><div>Step 3: Draw converging lines from edges to the VP</div><div>Step 4: Objects closer to VP appear smaller (foreshortening)</div><div>Step 5: Above horizon = seen from below; below = seen from above</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Perspective works because distant objects project smaller images on your retina. Parallel lines in 3D converge in 2D.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-perspective-grid')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Staff Notation Builder', 'all-staff')}
            {!collapsedSections.has('all-staff') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Build melodies on a treble clef staff. Click notes to add them to your composition.</p>
              <div style={{ padding: '0 12px 8px' }}><StaffNotationInline isDark={isDark} /></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Identify the clef (treble = G clef, lines are E-G-B-D-F)</div><div>Step 2: Spaces are F-A-C-E (bottom to top)</div><div>Step 3: Click a note name to add it to the staff</div><div>Step 4: Notes higher on the staff = higher pitch</div><div>Step 5: Each note = a frequency (A4 = 440 Hz)</div><div>Step 6: Build a melody by sequencing notes left to right</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Music is math - every interval is a frequency ratio. Octave = 2:1, fifth = 3:2. Pythagoras discovered pleasing sounds come from simple ratios.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-staff-notation')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Artwork Comparison', 'all-compare')}
            {!collapsedSections.has('all-compare') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Compare two artworks using guided prompts for color, composition, texture, style, and meaning.</p>
              <div style={{ padding: '0 12px 8px' }}><ArtCompareInline isDark={isDark} /></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Select an aspect (Color, Composition, Texture, Style, Meaning)</div><div>Step 2: Observe Artwork A in that aspect</div><div>Step 3: Observe Artwork B in the same aspect</div><div>Step 4: Use the guiding prompt to compare</div><div>Step 5: Note similarities AND differences</div><div>Step 6: Judge based on evidence, not preference</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Formal analysis uses elements and principles as vocabulary. Systematic comparison moves beyond "I like it" to understanding WHY a work is effective.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-compare')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Elements of Art', 'all-elements-art')}
            {!collapsedSections.has('all-elements-art') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Visual reference for the seven elements of art: line, shape, form, texture, value, color, and space.</p>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Line - path of a point (horizontal = calm, diagonal = energy)</div><div>Step 2: Shape - 2D enclosed area (geometric vs organic)</div><div>Step 3: Form - 3D shape (sphere, cube, cylinder)</div><div>Step 4: Texture - how surface feels or appears to feel</div><div>Step 5: Value - lightness/darkness (creates contrast and depth)</div><div>Step 6: Color - hue, saturation, lightness (emotional impact)</div><div>Step 7: Space - positive/negative, depth, perspective</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Every artwork is built from these 7 elements. Master artists manipulate them deliberately - dark value creates mood, diagonal line creates tension.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-elements-art')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Symmetry Drawing Tool', 'all-symmetry-drawing')}
            {!collapsedSections.has('all-symmetry-drawing') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Mirror drawing tool for teaching symmetry. Your strokes are reflected in real time.</p>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Draw on one side of the mirror line</div><div>Step 2: The tool reflects your stroke to the other side</div><div>Step 3: Reflection symmetry = mirror image across a line</div><div>Step 4: Rotational symmetry = same after rotation (180 degrees)</div><div>Step 5: Point symmetry = 180 degree rotational symmetry</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Symmetry appears throughout nature - butterfly wings, human faces, snowflakes. The brain finds symmetry aesthetically pleasing because it signals order and health.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-symmetry-drawing')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Rhythm Builder', 'all-rhythm-builder')}
            {!collapsedSections.has('all-rhythm-builder') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Build and play rhythmic patterns using a step sequencer grid.</p>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Choose a time signature (4/4 = 4 beats per measure)</div><div>Step 2: Each row = a different drum sound</div><div>Step 3: Each column = one beat subdivision</div><div>Step 4: Click cells to trigger sounds on that beat</div><div>Step 5: Press play - the sequencer loops the pattern</div><div>Step 6: Experiment with syncopation (off-beat hits)</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Rhythm is organized time. The time signature tells you how time is divided. Syncopation (accenting off-beats) creates groove - it is what makes you tap your foot.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-rhythm-builder')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Artist Spotlight Cards', 'all-artist-spotlight')}
            {!collapsedSections.has('all-artist-spotlight') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Famous artist bios and works. Browse cards featuring artists from different movements.</p>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Browse artist cards by movement or era</div><div>Step 2: Read the biography - what shaped their vision?</div><div>Step 3: Examine their key works - what techniques did they use?</div><div>Step 4: Identify their signature style (brushwork, color, subject)</div><div>Step 5: Connect their work to their historical context</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Artists do not create in a vacuum - their work reflects their time, culture, and personal struggles. Understanding the artist helps you understand the art.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-artist-spotlight')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Art History Timeline', 'all-art-timeline')}
            {!collapsedSections.has('all-art-timeline') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Explore major art movements and periods from ancient to contemporary art.</p>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Start at the beginning - ancient art (cave paintings, Egypt)</div><div>Step 2: Classical (Greece/Rome - idealized forms)</div><div>Step 3: Medieval to Renaissance (rebirth of realism)</div><div>Step 4: Modern movements (Impressionism to Cubism to Abstract)</div><div>Step 5: Contemporary (digital, conceptual, installation)</div><div>Step 6: Each movement was a REACTION to what came before</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Art history is a chain of reactions. Impressionism reacted against academic painting. Cubism reacted against perspective. Each movement broke rules to find new truths.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-art-timeline')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Value & Shading Study', 'all-value-shading')}
            {!collapsedSections.has('all-value-shading') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Practice hatching, cross-hatching, and stippling shading techniques on the canvas.</p>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Hatching - parallel lines (closer = darker)</div><div>Step 2: Cross-hatching - overlapping layers at different angles</div><div>Step 3: Stippling - dots (more dots = darker)</div><div>Step 4: Light source determines where shadows fall</div><div>Step 5: Core shadow = darkest; highlight = lightest</div><div>Step 6: Cast shadow = on ground; form shadow = on object</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Shading creates the illusion of 3D on 2D paper. The brain reads value (lightness/darkness) as depth - darker = farther, lighter = closer. Master shading and drawings gain volume.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-value-shading')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Compositional Analysis', 'all-compositional')}
            {!collapsedSections.has('all-compositional') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Overlay rule of thirds, golden ratio, and other compositional guides on images.</p>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Rule of Thirds - divide frame into 3x3, place subject at intersections</div><div>Step 2: Golden Ratio - phi approx 1.618, creates spiral focal point</div><div>Step 3: Leading Lines - use lines to guide eye to subject</div><div>Step 4: Check balance - stable or dynamic?</div><div>Step 5: Rules are starting points - break them intentionally for effect</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> The golden ratio appears in nature (shells, galaxies, faces). The brain finds it "natural" because we evolved seeing it. The rule of thirds is a simplified version that is easier to apply.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-compositional')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Art Criticism Framework', 'all-criticism')}
            {!collapsedSections.has('all-criticism') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Guided framework: describe, analyze, interpret, and judge artworks systematically.</p>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Describe - what do you literally see? (no judgment)</div><div>Step 2: Analyze - how are elements arranged? (composition, balance)</div><div>Step 3: Interpret - what does it mean? (mood, message, symbolism)</div><div>Step 4: Judge - is it successful? Base on evidence from steps 1-3</div><div>Step 5: Never skip to judgment - build from observation</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Art criticism is not about liking or disliking - it is about understanding. Describe-Analyze-Interpret-Judge ensures you engage with the work before forming an opinion.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-criticism')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Two-Point Perspective', 'all-two-point-persp')}
            {!collapsedSections.has('all-two-point-persp') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Advanced two-point perspective drawing with adjustable vanishing points and guide lines.</p>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Place TWO vanishing points on the horizon line</div><div>Step 2: Draw a vertical edge between the VPs</div><div>Step 3: Connect top/bottom of edge to BOTH vanishing points</div><div>Step 4: Converging lines create the sides of the object</div><div>Step 5: Two-point = looking at a corner; one-point = looking at a face</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Two-point perspective shows depth on two sides simultaneously - it is how you see buildings from a street corner. The further apart the VPs, the less dramatic the perspective.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-two-point-persp')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Chord Progression Builder', 'all-chord-progression')}
            {!collapsedSections.has('all-chord-progression') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Build and hear chord progressions. Explore common progressions and music theory concepts.</p>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Build a scale (e.g., C Major: C-D-E-F-G-A-B)</div><div>Step 2: Number the chords (I-ii-iii-IV-V-vi-viidim)</div><div>Step 3: Common progressions: I-V-vi-IV (pop), ii-V-I (jazz)</div><div>Step 4: Each chord has a function (tonic, subdominant, dominant)</div><div>Step 5: The V chord creates tension; the I chord resolves it</div><div>Step 6: Experiment - change one chord and hear the mood shift</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Chord progressions are the emotional engine of music. The same 4 chords (I-V-vi-IV) power thousands of hit songs. Tension and release - the V makes you want resolution, the I satisfies.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-chord-progression')}</div>
            </>}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* K-5 — Color Theory + Staff Notation */}
      {/* ============================================================ */}
      {activeBand === 'elementary' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Color Theory Explorer', 'k5-color')}
            {!collapsedSections.has('k5-color') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Learn about colors! Mix hues and see harmonies.</p>
              <div style={{ padding: '0 12px 8px' }}><ColorTheoryInline isDark={isDark} /></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Choose a base hue (0-360 on the color wheel)</div><div>Step 2: Adjust saturation (intensity) and lightness (brightness)</div><div>Step 3: Complementary = 180 degrees opposite (max contrast)</div><div>Step 4: Analogous = plus/minus 30 (harmonious, calm)</div><div>Step 5: Triadic = 120 apart (balanced vibrancy)</div><div>Step 6: Check the value scale - contrast in lightness matters more than hue</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Complementary colors stimulate different cone cells simultaneously, creating maximum visual energy. Analogous colors create calm - that is why sunsets feel peaceful.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-color-theory')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Staff Notation Builder', 'k5-staff')}
            {!collapsedSections.has('k5-staff') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Place notes on the staff to create simple melodies.</p>
              <div style={{ padding: '0 12px 8px' }}><StaffNotationInline isDark={isDark} /></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Identify the clef (treble = G clef, lines are E-G-B-D-F)</div><div>Step 2: Spaces are F-A-C-E (bottom to top)</div><div>Step 3: Click a note name to add it to the staff</div><div>Step 4: Notes higher on the staff = higher pitch</div><div>Step 5: Each note = a frequency (A4 = 440 Hz)</div><div>Step 6: Build a melody by sequencing notes left to right</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Music is math - every interval is a frequency ratio. Octave = 2:1, fifth = 3:2. Pythagoras discovered pleasing sounds come from simple ratios.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-staff-notation')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Elements of Art', 'k5-elements-art')}
            {!collapsedSections.has('k5-elements-art') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Visual reference for the seven elements of art: line, shape, form, texture, value, color, and space.</p>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-elements-art')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Symmetry Drawing Tool', 'k5-symmetry-drawing')}
            {!collapsedSections.has('k5-symmetry-drawing') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Mirror drawing tool for teaching symmetry. Your strokes are reflected in real time.</p>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-symmetry-drawing')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Rhythm Builder', 'k5-rhythm-builder')}
            {!collapsedSections.has('k5-rhythm-builder') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Build and play rhythmic patterns using a step sequencer grid.</p>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-rhythm-builder')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Artist Spotlight Cards', 'k5-artist-spotlight')}
            {!collapsedSections.has('k5-artist-spotlight') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Famous artist bios and works. Browse cards featuring artists from different movements.</p>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-artist-spotlight')}</div>
            </>}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 6-8 — All 4 */}
      {/* ============================================================ */}
      {activeBand === 'middle' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Color Theory Explorer', '68-color')}
            {!collapsedSections.has('68-color') && <>
              <div style={{ padding: '0 12px 8px' }}><ColorTheoryInline isDark={isDark} /></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Choose a base hue (0-360 on the color wheel)</div><div>Step 2: Adjust saturation (intensity) and lightness (brightness)</div><div>Step 3: Complementary = 180 degrees opposite (max contrast)</div><div>Step 4: Analogous = plus/minus 30 (harmonious, calm)</div><div>Step 5: Triadic = 120 apart (balanced vibrancy)</div><div>Step 6: Check the value scale - contrast in lightness matters more than hue</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Complementary colors stimulate different cone cells simultaneously, creating maximum visual energy. Analogous colors create calm - that is why sunsets feel peaceful.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-color-theory')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Perspective Grid', '68-perspective')}
            {!collapsedSections.has('68-perspective') && <>
              <div style={{ padding: '0 12px 8px' }}><PerspectiveGridInline isDark={isDark} /></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Place the vanishing point (VP) - where the viewer looks</div><div>Step 2: Draw the horizon line through the VP (eye level)</div><div>Step 3: Draw converging lines from edges to the VP</div><div>Step 4: Objects closer to VP appear smaller (foreshortening)</div><div>Step 5: Above horizon = seen from below; below = seen from above</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Perspective works because distant objects project smaller images on your retina. Parallel lines in 3D converge in 2D.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-perspective-grid')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Staff Notation Builder', '68-staff')}
            {!collapsedSections.has('68-staff') && <>
              <div style={{ padding: '0 12px 8px' }}><StaffNotationInline isDark={isDark} /></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Identify the clef (treble = G clef, lines are E-G-B-D-F)</div><div>Step 2: Spaces are F-A-C-E (bottom to top)</div><div>Step 3: Click a note name to add it to the staff</div><div>Step 4: Notes higher on the staff = higher pitch</div><div>Step 5: Each note = a frequency (A4 = 440 Hz)</div><div>Step 6: Build a melody by sequencing notes left to right</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Music is math - every interval is a frequency ratio. Octave = 2:1, fifth = 3:2. Pythagoras discovered pleasing sounds come from simple ratios.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-staff-notation')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Artwork Comparison', '68-compare')}
            {!collapsedSections.has('68-compare') && <>
              <div style={{ padding: '0 12px 8px' }}><ArtCompareInline isDark={isDark} /></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Select an aspect (Color, Composition, Texture, Style, Meaning)</div><div>Step 2: Observe Artwork A in that aspect</div><div>Step 3: Observe Artwork B in the same aspect</div><div>Step 4: Use the guiding prompt to compare</div><div>Step 5: Note similarities AND differences</div><div>Step 6: Judge based on evidence, not preference</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Formal analysis uses elements and principles as vocabulary. Systematic comparison moves beyond "I like it" to understanding WHY a work is effective.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-compare')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Art History Timeline', '68-art-timeline')}
            {!collapsedSections.has('68-art-timeline') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Explore major art movements and periods from ancient to contemporary art.</p>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-art-timeline')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Value & Shading Study', '68-value-shading')}
            {!collapsedSections.has('68-value-shading') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Practice hatching, cross-hatching, and stippling shading techniques on the canvas.</p>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-value-shading')}</div>
            </>}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 9-12 — All 4 */}
      {/* ============================================================ */}
      {activeBand === 'highschool' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Color Theory Explorer', '912-color')}
            {!collapsedSections.has('912-color') && <>
              <div style={{ padding: '0 12px 8px' }}><ColorTheoryInline isDark={isDark} /></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Choose a base hue (0-360 on the color wheel)</div><div>Step 2: Adjust saturation (intensity) and lightness (brightness)</div><div>Step 3: Complementary = 180 degrees opposite (max contrast)</div><div>Step 4: Analogous = plus/minus 30 (harmonious, calm)</div><div>Step 5: Triadic = 120 apart (balanced vibrancy)</div><div>Step 6: Check the value scale - contrast in lightness matters more than hue</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Complementary colors stimulate different cone cells simultaneously, creating maximum visual energy. Analogous colors create calm - that is why sunsets feel peaceful.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-color-theory')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Perspective Grid', '912-perspective')}
            {!collapsedSections.has('912-perspective') && <>
              <div style={{ padding: '0 12px 8px' }}><PerspectiveGridInline isDark={isDark} /></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Place the vanishing point (VP) - where the viewer looks</div><div>Step 2: Draw the horizon line through the VP (eye level)</div><div>Step 3: Draw converging lines from edges to the VP</div><div>Step 4: Objects closer to VP appear smaller (foreshortening)</div><div>Step 5: Above horizon = seen from below; below = seen from above</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Perspective works because distant objects project smaller images on your retina. Parallel lines in 3D converge in 2D.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-perspective-grid')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Staff Notation Builder', '912-staff')}
            {!collapsedSections.has('912-staff') && <>
              <div style={{ padding: '0 12px 8px' }}><StaffNotationInline isDark={isDark} /></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Identify the clef (treble = G clef, lines are E-G-B-D-F)</div><div>Step 2: Spaces are F-A-C-E (bottom to top)</div><div>Step 3: Click a note name to add it to the staff</div><div>Step 4: Notes higher on the staff = higher pitch</div><div>Step 5: Each note = a frequency (A4 = 440 Hz)</div><div>Step 6: Build a melody by sequencing notes left to right</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Music is math - every interval is a frequency ratio. Octave = 2:1, fifth = 3:2. Pythagoras discovered pleasing sounds come from simple ratios.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-staff-notation')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Artwork Comparison', '912-compare')}
            {!collapsedSections.has('912-compare') && <>
              <div style={{ padding: '0 12px 8px' }}><ArtCompareInline isDark={isDark} /></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}><div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div><div>Step 1: Select an aspect (Color, Composition, Texture, Style, Meaning)</div><div>Step 2: Observe Artwork A in that aspect</div><div>Step 3: Observe Artwork B in the same aspect</div><div>Step 4: Use the guiding prompt to compare</div><div>Step 5: Note similarities AND differences</div><div>Step 6: Judge based on evidence, not preference</div></div>
              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Formal analysis uses elements and principles as vocabulary. Systematic comparison moves beyond "I like it" to understanding WHY a work is effective.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-compare')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Compositional Analysis', '912-compositional')}
            {!collapsedSections.has('912-compositional') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Overlay rule of thirds, golden ratio, and other compositional guides on images.</p>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-compositional')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Art Criticism Framework', '912-criticism')}
            {!collapsedSections.has('912-criticism') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Guided framework: describe, analyze, interpret, and judge artworks systematically.</p>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-criticism')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Two-Point Perspective', '912-two-point-persp')}
            {!collapsedSections.has('912-two-point-persp') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Advanced two-point perspective drawing with adjustable vanishing points and guide lines.</p>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-two-point-persp')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Chord Progression Builder', '912-chord-progression')}
            {!collapsedSections.has('912-chord-progression') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Build and hear chord progressions. Explore common progressions and music theory concepts.</p>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-chord-progression')}</div>
            </>}
          </div>
        </>
      )}
    </div>
  )
}