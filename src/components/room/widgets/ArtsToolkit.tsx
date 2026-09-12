'use client'

import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { generateId } from '@/lib/whiteboard/utils'
import { getDefaultWidgetConfig, getWidgetDefaultSize, WIDGET_KIND_LABELS } from '@/components/whiteboard/CanvasWidgets'
import type { WidgetElement } from '@/lib/whiteboard/types'
import { WidgetSearchBar, FavoritesAndRecent } from './WidgetSearchBar'
import { useFavorites, useRecentWidgets } from './widgetFavorites'

// Reverse map: section title (lowercase) → widget kind, for the ★ favorite button.
const ARTS_LABEL_TO_KIND: Record<string, string> = {}
Object.entries(WIDGET_KIND_LABELS).forEach(([kind, label]) => {
  if (label && kind.startsWith('arts-')) ARTS_LABEL_TO_KIND[label.toLowerCase()] = kind
})

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
      {/* How It Works (dynamic) */}
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + btnBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: labelColor, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Hue = <b>{hue}</b>° ({hue < 60 ? 'red' : hue < 120 ? 'yellow' : hue < 180 ? 'green' : hue < 240 ? 'cyan' : hue < 300 ? 'blue' : 'magenta'})</div>
        <div>Step 2: Saturation = <b>{sat}%</b>, Lightness = <b>{light}%</b></div>
        <div>Step 3: Harmony: <b style={{ textTransform: 'capitalize' }}>{harmony}</b> ({harmonyHexes.length} color{harmonyHexes.length !== 1 ? 's' : ''})</div>
        <div>Step 4: Complementary hue = <b>{Math.round((hue + 180) % 360)}°</b></div>
        <div>Step 5: Current color: <b style={{ color: '#34d399' }}>{hslToHex(hue, sat, light).toUpperCase()}</b></div>
        <div>Step 6: Value scale shows lightness dark → light (9 steps)</div>
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
      {/* How It Works (dynamic) */}
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: labelColor, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: VP at (<b>{vanishingX}%</b>, <b>{vanishingY}%</b>)</div>
        <div>Step 2: Horizon at y=<b>{vanishingY}%</b> ({vanishingY < 40 ? 'looking down' : vanishingY > 60 ? 'looking up' : 'eye level'})</div>
        <div>Step 3: <b>{numLines}</b> converging line{numLines !== 1 ? 's' : ''} radiating to VP</div>
        <div>Step 4: Closer to VP = smaller (foreshortening)</div>
        <div>Step 5: Adjust VP sliders to change perspective angle</div>
      </div>
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
      {/* How It Works (dynamic) */}
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + btnBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: labelColor, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Treble clef — lines: E-G-B-D-F, spaces: F-A-C-E</div>
        <div>Step 2: <b>{notes.length}</b> note{notes.length !== 1 ? 's' : ''} on staff (max 16)</div>
        <div>Step 3: {notes.length > 0 ? <>Current: <b style={{ color: '#34d399' }}>{notes.join(' - ')}</b></> : 'Click note buttons to add notes'}</div>
        <div>Step 4: Higher on staff = higher pitch (C4 → G5)</div>
        <div>Step 5: A4 = 440 Hz (standard tuning reference)</div>
        <div>Step 6: Build melody left to right</div>
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
      {/* How It Works (dynamic) */}
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + btnBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: labelColor, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Current aspect: <b style={{ color: '#a78bfa', textTransform: 'capitalize' }}>{aspect}</b> ({aspects.indexOf(aspect) + 1}/{aspects.length})</div>
        <div>Step 2: Observe Artwork A focusing on <b>{aspect}</b></div>
        <div>Step 3: Observe Artwork B in the same aspect</div>
        <div>Step 4: Guiding prompt: <b style={{ color: '#34d399' }}>{prompts[aspect].length > 64 ? prompts[aspect].slice(0, 64) + '…' : prompts[aspect]}</b></div>
        <div>Step 5: Note similarities AND differences</div>
        <div>Step 6: Judge based on evidence, not preference</div>
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

  // ---- Fix #4/#6/#24/#25: search + favorites + recents ----
  const TOOLKIT_NAME = 'arts'
  const containerRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { favorites, isFavorite, toggleFavorite } = useFavorites(TOOLKIT_NAME)
  const { recent, addRecent } = useRecentWidgets(TOOLKIT_NAME)

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
    // Fix #24 — track in recently-used list
    addRecent({ id: widgetKind, title: WIDGET_KIND_LABELS[widgetKind] || widgetKind, toolkit: TOOLKIT_NAME })
  }, [addElement, camera, isDark, currentPageIndex, addRecent])

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

  const sectionTitle = (text: string, sectionId: string) => {
    const kind = ARTS_LABEL_TO_KIND[text.toLowerCase()]
    const fav = kind ? isFavorite(kind) : false
    return (
      <div className={'toolkit-section-title' + (isDark ? '' : ' toolkit-section-title-light')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none', gap: 6 }} onClick={() => toggleSection(sectionId)} data-search-title={text.toLowerCase()}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{text}</span>
          {kind && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite({ id: kind, title: text, toolkit: TOOLKIT_NAME }) }}
              style={{
                padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, lineHeight: 1,
                background: fav ? 'rgba(251,191,36,0.15)' : 'transparent',
                border: fav ? '1px solid rgba(251,191,36,0.3)' : '1px solid ' + dkBorder,
                color: fav ? '#fbbf24' : dkText,
                cursor: 'pointer',
              }}
              title={fav ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
            >
              {fav ? '⭐' : '☆'}
            </button>
          )}
        </span>
        <span style={{ fontSize: 10, color: dkText, transition: 'transform 0.15s', transform: collapsedSections.has(sectionId) ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
      </div>
    )
  }

  const addBoardBtn = (widgetKind: string) => (
    <button onClick={() => addToBoard(widgetKind)} className="toolkit-add-to-board-btn" style={{ padding: '5px 14px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: addBg, border: '1px solid ' + addBorder, color: addText, cursor: 'pointer', alignSelf: 'flex-end', flexShrink: 0 }}>+ Add to Board</button>
  )

  return (
    <div ref={containerRef} className="widget-content toolkit-arts" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
      {/* ---- Fix #24/#25: Favorites + Recently Used ---- */}
      <FavoritesAndRecent
        isDark={isDark}
        favorites={favorites}
        recent={recent}
        onSelect={(wk, _title) => addToBoard(wk, {})}
        onRemoveFavorite={(id) => toggleFavorite({ id, title: '', toolkit: TOOLKIT_NAME })}
        onClearRecent={() => {
          if (typeof window === 'undefined') return
          try {
            const raw = window.localStorage.getItem('superboard_recent_widgets')
            if (raw) {
              const all = JSON.parse(raw)
              const next = all.filter((e: { id: string; title: string; toolkit: string }) => e.toolkit !== TOOLKIT_NAME)
              window.localStorage.setItem('superboard_recent_widgets', JSON.stringify(next))
              window.dispatchEvent(new Event('superboard-recent-changed'))
            }
          } catch { /* ignore */ }
        }}
      />

      {/* ---- Fix #4/#6: Search Bar ---- */}
      <WidgetSearchBar
        isDark={isDark}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        containerRef={containerRef}
      />

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

              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Complementary colors stimulate different cone cells simultaneously, creating maximum visual energy. Analogous colors create calm - that is why sunsets feel peaceful.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-color-theory')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Perspective Grid', 'all-perspective')}
            {!collapsedSections.has('all-perspective') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Create one-point perspective grids. Adjust vanishing point and line count for drawing exercises.</p>
              <div style={{ padding: '0 12px 8px' }}><PerspectiveGridInline isDark={isDark} /></div>

              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Perspective works because distant objects project smaller images on your retina. Parallel lines in 3D converge in 2D.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-perspective-grid')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Staff Notation Builder', 'all-staff')}
            {!collapsedSections.has('all-staff') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Build melodies on a treble clef staff. Click notes to add them to your composition.</p>
              <div style={{ padding: '0 12px 8px' }}><StaffNotationInline isDark={isDark} /></div>

              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Music is math - every interval is a frequency ratio. Octave = 2:1, fifth = 3:2. Pythagoras discovered pleasing sounds come from simple ratios.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-staff-notation')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Artwork Comparison', 'all-compare')}
            {!collapsedSections.has('all-compare') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Compare two artworks using guided prompts for color, composition, texture, style, and meaning.</p>
              <div style={{ padding: '0 12px 8px' }}><ArtCompareInline isDark={isDark} /></div>

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

          {/* --- Phase 4 — K-5 --- */}
          <div className="toolkit-section">
            {sectionTitle('Note Duration Trainer', 'all-note-duration')}
            {!collapsedSections.has('all-note-duration') && <>
              <div style={{ padding: '0 12px 12px' }}><NoteDurationTrainer isDark={isDark} /></div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Treble Clef Trainer', 'all-treble-clef')}
            {!collapsedSections.has('all-treble-clef') && <>
              <div style={{ padding: '0 12px 12px' }}><TrebleClefTrainer isDark={isDark} /></div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Tempo Metronome', 'all-tempo-metronome')}
            {!collapsedSections.has('all-tempo-metronome') && <>
              <div style={{ padding: '0 12px 12px' }}><TempoMetronome isDark={isDark} /></div>
            </>}
          </div>
          {/* --- Phase 4 — 6-8 --- */}
          <div className="toolkit-section">
            {sectionTitle('Scale & Proportion', 'all-scale-proportion')}
            {!collapsedSections.has('all-scale-proportion') && <>
              <div style={{ padding: '0 12px 12px' }}><ScaleAndProportion isDark={isDark} /></div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Music Notation Composer', 'all-music-notation')}
            {!collapsedSections.has('all-music-notation') && <>
              <div style={{ padding: '0 12px 12px' }}><MusicNotationComposer isDark={isDark} /></div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Rhythm Composition Tool', 'all-rhythm-composition')}
            {!collapsedSections.has('all-rhythm-composition') && <>
              <div style={{ padding: '0 12px 12px' }}><RhythmCompositionTool isDark={isDark} /></div>
            </>}
          </div>
          {/* --- Phase 4 — 9-12 --- */}
          <div className="toolkit-section">
            {sectionTitle('Three-Point Perspective', 'all-three-point-persp')}
            {!collapsedSections.has('all-three-point-persp') && <>
              <div style={{ padding: '0 12px 12px' }}><ThreePointPerspective isDark={isDark} /></div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Music Theory Explorer', 'all-music-theory')}
            {!collapsedSections.has('all-music-theory') && <>
              <div style={{ padding: '0 12px 12px' }}><MusicTheoryExplorer isDark={isDark} /></div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Song Structure Analyzer', 'all-song-structure')}
            {!collapsedSections.has('all-song-structure') && <>
              <div style={{ padding: '0 12px 12px' }}><SongStructureAnalyzer isDark={isDark} /></div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Photography Composition Guide', 'all-photo-composition')}
            {!collapsedSections.has('all-photo-composition') && <>
              <div style={{ padding: '0 12px 12px' }}><PhotographyCompositionGuide isDark={isDark} /></div>
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

              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Complementary colors stimulate different cone cells simultaneously, creating maximum visual energy. Analogous colors create calm - that is why sunsets feel peaceful.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-color-theory')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Staff Notation Builder', 'k5-staff')}
            {!collapsedSections.has('k5-staff') && <>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Place notes on the staff to create simple melodies.</p>
              <div style={{ padding: '0 12px 8px' }}><StaffNotationInline isDark={isDark} /></div>

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

          {/* --- Phase 4 — K-5 --- */}
          <div className="toolkit-section">
            {sectionTitle('Note Duration Trainer', 'k5-note-duration')}
            {!collapsedSections.has('k5-note-duration') && <>
              <div style={{ padding: '0 12px 12px' }}><NoteDurationTrainer isDark={isDark} /></div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Treble Clef Trainer', 'k5-treble-clef')}
            {!collapsedSections.has('k5-treble-clef') && <>
              <div style={{ padding: '0 12px 12px' }}><TrebleClefTrainer isDark={isDark} /></div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Tempo Metronome', 'k5-tempo-metronome')}
            {!collapsedSections.has('k5-tempo-metronome') && <>
              <div style={{ padding: '0 12px 12px' }}><TempoMetronome isDark={isDark} /></div>
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

              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Complementary colors stimulate different cone cells simultaneously, creating maximum visual energy. Analogous colors create calm - that is why sunsets feel peaceful.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-color-theory')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Perspective Grid', '68-perspective')}
            {!collapsedSections.has('68-perspective') && <>
              <div style={{ padding: '0 12px 8px' }}><PerspectiveGridInline isDark={isDark} /></div>

              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Perspective works because distant objects project smaller images on your retina. Parallel lines in 3D converge in 2D.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-perspective-grid')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Staff Notation Builder', '68-staff')}
            {!collapsedSections.has('68-staff') && <>
              <div style={{ padding: '0 12px 8px' }}><StaffNotationInline isDark={isDark} /></div>

              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Music is math - every interval is a frequency ratio. Octave = 2:1, fifth = 3:2. Pythagoras discovered pleasing sounds come from simple ratios.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-staff-notation')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Artwork Comparison', '68-compare')}
            {!collapsedSections.has('68-compare') && <>
              <div style={{ padding: '0 12px 8px' }}><ArtCompareInline isDark={isDark} /></div>

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

          {/* --- Phase 4 — 6-8 --- */}
          <div className="toolkit-section">
            {sectionTitle('Scale & Proportion', '68-scale-proportion')}
            {!collapsedSections.has('68-scale-proportion') && <>
              <div style={{ padding: '0 12px 12px' }}><ScaleAndProportion isDark={isDark} /></div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Music Notation Composer', '68-music-notation')}
            {!collapsedSections.has('68-music-notation') && <>
              <div style={{ padding: '0 12px 12px' }}><MusicNotationComposer isDark={isDark} /></div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Rhythm Composition Tool', '68-rhythm-composition')}
            {!collapsedSections.has('68-rhythm-composition') && <>
              <div style={{ padding: '0 12px 12px' }}><RhythmCompositionTool isDark={isDark} /></div>
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

              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Complementary colors stimulate different cone cells simultaneously, creating maximum visual energy. Analogous colors create calm - that is why sunsets feel peaceful.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-color-theory')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Perspective Grid', '912-perspective')}
            {!collapsedSections.has('912-perspective') && <>
              <div style={{ padding: '0 12px 8px' }}><PerspectiveGridInline isDark={isDark} /></div>

              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Perspective works because distant objects project smaller images on your retina. Parallel lines in 3D converge in 2D.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-perspective-grid')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Staff Notation Builder', '912-staff')}
            {!collapsedSections.has('912-staff') && <>
              <div style={{ padding: '0 12px 8px' }}><StaffNotationInline isDark={isDark} /></div>

              <div style={{ padding: '6px 8px', margin: '0 12px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>💡 <b>Insight:</b> Music is math - every interval is a frequency ratio. Octave = 2:1, fifth = 3:2. Pythagoras discovered pleasing sounds come from simple ratios.</div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('arts-staff-notation')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Artwork Comparison', '912-compare')}
            {!collapsedSections.has('912-compare') && <>
              <div style={{ padding: '0 12px 8px' }}><ArtCompareInline isDark={isDark} /></div>

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

          {/* --- Phase 4 — 9-12 --- */}
          <div className="toolkit-section">
            {sectionTitle('Three-Point Perspective', '912-three-point-persp')}
            {!collapsedSections.has('912-three-point-persp') && <>
              <div style={{ padding: '0 12px 12px' }}><ThreePointPerspective isDark={isDark} /></div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Music Theory Explorer', '912-music-theory')}
            {!collapsedSections.has('912-music-theory') && <>
              <div style={{ padding: '0 12px 12px' }}><MusicTheoryExplorer isDark={isDark} /></div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Song Structure Analyzer', '912-song-structure')}
            {!collapsedSections.has('912-song-structure') && <>
              <div style={{ padding: '0 12px 12px' }}><SongStructureAnalyzer isDark={isDark} /></div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Photography Composition Guide', '912-photo-composition')}
            {!collapsedSections.has('912-photo-composition') && <>
              <div style={{ padding: '0 12px 12px' }}><PhotographyCompositionGuide isDark={isDark} /></div>
            </>}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// K-5 WIDGETS (Tasks 36.1 - 36.3)
// ============================================================

// ---- 36.1: Note Duration Trainer ----
export function NoteDurationTrainer({ isDark }: { isDark: boolean }) {
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'
  const bg = isDark ? '#0f172a' : '#fffef5'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const accent = '#a78bfa'
  const noteColor = isDark ? '#e2e8f0' : '#1e293b'

  type NoteType = 'whole' | 'half' | 'quarter' | 'eighth'
  const NOTE_BEATS: Record<NoteType, number> = { whole: 4, half: 2, quarter: 1, eighth: 0.5 }
  const NOTE_LABEL: Record<NoteType, string> = { whole: 'Whole (4)', half: 'Half (2)', quarter: 'Quarter (1)', eighth: 'Eighth (½)' }

  const [selected, setSelected] = useState<NoteType | null>('quarter')
  const [placed, setPlaced] = useState<{ type: NoteType; beats: number }[]>([])
  const [playing, setPlaying] = useState(false)
  const [playStep, setPlayStep] = useState(-1)
  const audioRef = useRef<AudioContext | null>(null)
  const timersRef = useRef<number[]>([])

  const totalBeats = placed.reduce((a, n) => a + n.beats, 0)
  const isFull = Math.abs(totalBeats - 4) < 0.001
  const fitsNote = selected ? totalBeats + NOTE_BEATS[selected] <= 4.001 : false

  const getCtx = (): AudioContext => {
    if (!audioRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioRef.current = new AC()
    }
    if (audioRef.current.state === 'suspended') void audioRef.current.resume()
    return audioRef.current
  }
  const playTone = (freq: number, dur: number) => {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + dur + 0.05)
  }

  const placeNote = () => {
    if (!selected || !fitsNote || isFull) return
    setPlaced([...placed, { type: selected, beats: NOTE_BEATS[selected] }])
  }

  const playRhythm = () => {
    if (!isFull || playing) return
    setPlaying(true)
    setPlayStep(-1)
    const bpm = 100
    const beatDur = 60 / bpm
    let elapsed = 0
    placed.forEach((note, i) => {
      const dur = note.beats * beatDur
      const t = window.setTimeout(() => {
        setPlayStep(i)
        playTone(523.25, Math.min(dur * 0.9, 0.6))
      }, elapsed * 1000)
      timersRef.current.push(t)
      elapsed += dur
    })
    const endT = window.setTimeout(() => {
      setPlaying(false)
      setPlayStep(-1)
    }, elapsed * 1000 + 200)
    timersRef.current.push(endT)
  }

  const clearMeasure = () => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    setPlaced([])
    setPlayStep(-1)
    setPlaying(false)
  }

  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t))
      if (audioRef.current) void audioRef.current.close()
    }
  }, [])

  const svgW = 280, svgH = 100
  const measureX = 30, measureW = 230
  const staffY = 30
  let cursor = measureX
  const noteElems = placed.map((n, i) => {
    const w = (n.beats / 4) * measureW
    const x = cursor + w / 2
    cursor += w
    const isActive = playStep === i
    return { ...n, x, w, isActive, i }
  })

  const fitCount = (t: NoteType) => Math.floor(4 / NOTE_BEATS[t])
  const noteOptions: NoteType[] = ['whole', 'half', 'quarter', 'eighth']
  const noteSym = (t: NoteType) => t === 'whole' ? '○' : t === 'half' ? '◐' : t === 'quarter' ? '♩' : '♪'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, color: labelColor }}>Pick a note type, then "Place Note" to fill the 4-beat measure.</div>
      {/* Note type selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {noteOptions.map(t => (
          <button key={t} onClick={() => setSelected(t)} style={{
            padding: '3px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600,
            background: selected === t ? 'rgba(139,92,246,0.2)' : btnBg,
            border: selected === t ? '1px solid rgba(139,92,246,0.4)' : '1px solid ' + border,
            color: selected === t ? accent : labelColor, cursor: 'pointer',
          }}>{noteSym(t)} {NOTE_LABEL[t]}</button>
        ))}
      </div>
      {/* Measure */}
      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', borderRadius: 6, border: '1px solid ' + border, background: bg }}>
        {[0, 8, 16, 24, 32].map(d => (
          <line key={d} x1={measureX} y1={staffY + d} x2={measureX + measureW} y2={staffY + d} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="0.6" />
        ))}
        <line x1={measureX} y1={staffY} x2={measureX} y2={staffY + 32} stroke={noteColor} strokeWidth="1.4" />
        <line x1={measureX + measureW} y1={staffY} x2={measureX + measureW} y2={staffY + 32} stroke={noteColor} strokeWidth="1.4" />
        {[1, 2, 3].map(b => (
          <line key={b} x1={measureX + (b / 4) * measureW} y1={staffY} x2={measureX + (b / 4) * measureW} y2={staffY + 32} stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="0.4" strokeDasharray="2 2" />
        ))}
        <text x={measureX - 22} y={staffY + 26} fontSize="26" fill={isDark ? '#94a3b8' : '#475569'} fontFamily="serif">𝄞</text>
        {noteElems.map(n => {
          const y = staffY + 16
          const col = n.isActive ? '#34d399' : noteColor
          if (n.type === 'whole') {
            return <ellipse key={n.i} cx={n.x} cy={y} rx="7" ry="5" fill="none" stroke={col} strokeWidth="1.6" />
          }
          const filled = n.type !== 'half'
          return (
            <g key={n.i}>
              <ellipse cx={n.x} cy={y} rx="5" ry="3.8" fill={filled ? col : 'none'} stroke={col} strokeWidth="1.2" transform={`rotate(-18 ${n.x} ${y})`} />
              <line x1={n.x + 4.5} y1={y - 1} x2={n.x + 4.5} y2={y - 22} stroke={col} strokeWidth="1.2" />
              {n.type === 'eighth' && <path d={`M ${n.x + 4.5} ${y - 22} q 6 4 4 12`} stroke={col} strokeWidth="1.2" fill="none" />}
            </g>
          )
        })}
        <text x={svgW / 2} y={svgH - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill={isFull ? '#34d399' : accent}>{totalBeats} / 4 beats {isFull ? '✓' : ''}</text>
      </svg>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <button onClick={placeNote} disabled={!selected || !fitsNote || isFull || playing} style={{
          padding: '4px 9px', borderRadius: 5, fontSize: 10, fontWeight: 600,
          background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
          color: accent, cursor: (!selected || !fitsNote || isFull || playing) ? 'not-allowed' : 'pointer',
          opacity: (!selected || !fitsNote || isFull || playing) ? 0.5 : 1,
        }}>+ Place</button>
        <button onClick={playRhythm} disabled={!isFull || playing} style={{
          padding: '4px 9px', borderRadius: 5, fontSize: 10, fontWeight: 600,
          background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
          color: '#34d399', cursor: (!isFull || playing) ? 'not-allowed' : 'pointer',
          opacity: (!isFull || playing) ? 0.5 : 1,
        }}>▶ Play</button>
        <button onClick={clearMeasure} style={{
          padding: '4px 9px', borderRadius: 5, fontSize: 10, fontWeight: 600,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#f87171', cursor: 'pointer',
        }}>Clear</button>
      </div>
      {/* Fit counts */}
      <div style={{ display: 'flex', gap: 8, fontSize: 9, color: labelColor, flexWrap: 'wrap' }}>
        {noteOptions.map(t => (
          <span key={t}>{fitCount(t)}× {noteSym(t)}</span>
        ))}
      </div>
      {/* How It Works */}
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + border, color: textColor }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: labelColor, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Selected note: <b style={{ color: accent }}>{selected ? NOTE_LABEL[selected] : 'none'}</b> ({selected ? NOTE_BEATS[selected] : 0} beat{selected && NOTE_BEATS[selected] !== 1 ? 's' : ''})</div>
        <div>Step 2: Measure currently has <b>{totalBeats}</b> / 4 beats filled</div>
        <div>Step 3: {selected ? (fitsNote ? `Placing adds ${NOTE_BEATS[selected]} → ${totalBeats + NOTE_BEATS[selected]} beats total` : `✗ Won't fit — needs ${NOTE_BEATS[selected]} but only ${(4 - totalBeats).toFixed(1)} left`) : 'Pick a note type first'}</div>
        <div>Step 4: {isFull ? '✓ Measure is full — ready to play!' : 'Keep adding notes until you reach 4 beats'}</div>
        <div>Step 5: One 4/4 measure holds: 1 whole, 2 halves, 4 quarters, or 8 eighths</div>
        <div>Step 6: {placed.length > 0 ? <>Current rhythm: <b style={{ color: '#34d399' }}>{placed.map(n => noteSym(n.type)).join(' ')}</b></> : 'No notes placed yet'}</div>
      </div>
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Note durations are fractions of a whole note. Each halving of duration doubles how many fit in a measure — that is why rhythms feel "binary" (2, 4, 8, 16). Musicians subdivide time the same way mathematicians subdivide numbers.
      </div>
    </div>
  )
}

// ---- 36.2: Treble Clef Trainer ----
export function TrebleClefTrainer({ isDark }: { isDark: boolean }) {
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'
  const bg = isDark ? '#0f172a' : '#fffef5'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const accent = '#a78bfa'
  const noteColor = isDark ? '#e2e8f0' : '#1e293b'

  // Treble staff: bottom line = E4, top line = F5
  // Positions from bottom to top (line/space alternating):
  // E4(line), F4(space), G4(line), A4(space), B4(line), C5(space), D5(line), E5(space), F5(line)
  const POSITIONS = [
    { name: 'E4', y: 60, freq: 329.63, kind: 'line' },
    { name: 'F4', y: 55, freq: 349.23, kind: 'space' },
    { name: 'G4', y: 50, freq: 392.00, kind: 'line' },
    { name: 'A4', y: 45, freq: 440.00, kind: 'space' },
    { name: 'B4', y: 40, freq: 493.88, kind: 'line' },
    { name: 'C5', y: 35, freq: 523.25, kind: 'space' },
    { name: 'D5', y: 30, freq: 587.33, kind: 'line' },
    { name: 'E5', y: 25, freq: 659.25, kind: 'space' },
    { name: 'F5', y: 20, freq: 698.46, kind: 'line' },
  ]
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const getLetter = (noteName: string) => noteName.charAt(0)

  const [currentIdx, setCurrentIdx] = useState(() => Math.floor(Math.random() * POSITIONS.length))
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none')
  const [lastWrong, setLastWrong] = useState<string | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const audioRef = useRef<AudioContext | null>(null)

  const current = POSITIONS[currentIdx]

  const getCtx = (): AudioContext => {
    if (!audioRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioRef.current = new AC()
    }
    if (audioRef.current.state === 'suspended') void audioRef.current.resume()
    return audioRef.current
  }
  const playTone = (freq: number, dur = 0.4) => {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + dur + 0.05)
  }

  useEffect(() => () => { if (audioRef.current) void audioRef.current.close() }, [])

  const nextNote = () => {
    let idx = Math.floor(Math.random() * POSITIONS.length)
    while (idx === currentIdx && POSITIONS.length > 1) idx = Math.floor(Math.random() * POSITIONS.length)
    setCurrentIdx(idx)
    setFeedback('none')
    setLastWrong(null)
  }

  const handleAnswer = (letter: string) => {
    if (feedback === 'correct') return
    const correctLetter = getLetter(current.name)
    if (letter === correctLetter) {
      setFeedback('correct')
      setScore(s => ({ correct: s.correct + 1, total: s.total + 1 }))
      playTone(current.freq, 0.5)
    } else {
      setFeedback('wrong')
      setLastWrong(letter)
      setScore(s => ({ correct: s.correct, total: s.total + 1 }))
      playTone(196.0, 0.25)
    }
  }

  const correctLetter = getLetter(current.name)
  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
  const noteFill = feedback === 'correct' ? '#34d399' : feedback === 'wrong' ? '#f87171' : noteColor

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, color: labelColor }}>Identify the note on the staff. Lines: E-G-B-D-F. Spaces: F-A-C-E.</div>
      <svg viewBox="0 0 280 90" style={{ width: '100%', borderRadius: 6, border: '1px solid ' + border, background: bg }}>
        {[20, 30, 40, 50, 60].map(y => (
          <line key={y} x1="10" y1={y} x2="270" y2={y} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="0.7" />
        ))}
        <text x="14" y="52" fontSize="30" fill={isDark ? '#94a3b8' : '#475569'} fontFamily="serif" fontWeight="bold">𝄞</text>
        {/* Note at current position */}
        <ellipse cx="140" cy={current.y} rx="8" ry="6" fill={noteFill} transform={`rotate(-18 140 ${current.y})`} />
        <line x1="148" y1={current.y - 1} x2="148" y2={current.y - 28} stroke={noteFill} strokeWidth="1.5" />
        {feedback === 'wrong' && (
          <text x="170" y={current.y + 4} fontSize="13" fontWeight="700" fill="#f87171">→ {correctLetter}</text>
        )}
        {feedback === 'correct' && (
          <text x="170" y={current.y + 4} fontSize="13" fontWeight="700" fill="#34d399">✓ {correctLetter}</text>
        )}
        {/* Mnemonic */}
        <text x="10" y="80" fontSize="9" fill={labelColor}>Lines: <tspan fontWeight="700" fill={accent}>E</tspan>very <tspan fontWeight="700" fill={accent}>G</tspan>ood <tspan fontWeight="700" fill={accent}>B</tspan>oy <tspan fontWeight="700" fill={accent}>D</tspan>oes <tspan fontWeight="700" fill={accent}>F</tspan>ine</text>
        <text x="10" y="85" fontSize="8" fill={labelColor} dy="0">Spaces: <tspan fontWeight="700" fill={accent}>F A C E</tspan></text>
      </svg>
      {/* Letter buttons */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        {LETTERS.map(L => {
          const isWrong = feedback === 'wrong' && lastWrong === L
          const isCorrect = feedback === 'correct' && L === correctLetter
          const isAnswer = feedback === 'wrong' && L === correctLetter
          return (
            <button key={L} onClick={() => handleAnswer(L)} style={{
              padding: '5px 11px', borderRadius: 5, fontSize: 13, fontWeight: 700, minWidth: 32,
              background: isWrong ? 'rgba(239,68,68,0.2)' : isCorrect || isAnswer ? 'rgba(52,211,153,0.2)' : btnBg,
              border: isWrong ? '1px solid rgba(239,68,68,0.4)' : (isCorrect || isAnswer) ? '1px solid rgba(52,211,153,0.4)' : '1px solid ' + border,
              color: isWrong ? '#f87171' : (isCorrect || isAnswer) ? '#34d399' : textColor, cursor: 'pointer',
            }}>{L}</button>
          )
        })}
      </div>
      {/* Score + Next */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10, color: labelColor }}>
          Score: <b style={{ color: '#34d399' }}>{score.correct}</b> / {score.total} {score.total > 0 ? `(${pct}%)` : ''}
        </div>
        <button onClick={nextNote} style={{
          padding: '4px 12px', borderRadius: 5, fontSize: 10, fontWeight: 600,
          background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
          color: accent, cursor: 'pointer',
        }}>→ Next Note</button>
      </div>
      {/* How It Works */}
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + border, color: textColor }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: labelColor, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: A note appears on the staff at position <b style={{ color: accent }}>{current.name}</b> ({current.kind})</div>
        <div>Step 2: The correct letter is <b style={{ color: feedback === 'correct' ? '#34d399' : '#fbbf24' }}>{correctLetter}</b></div>
        <div>Step 3: {feedback === 'correct' ? '✓ Correct! You picked the right letter.' : feedback === 'wrong' ? `✗ Wrong — you picked ${lastWrong}. The answer is ${correctLetter}.` : 'Pick the letter that names this note.'}</div>
        <div>Step 4: Lines bottom→top: E-G-B-D-F (mnemonic "Every Good Boy Does Fine")</div>
        <div>Step 5: Spaces bottom→top: F-A-C-E (spells "FACE")</div>
        <div>Step 6: Current score: <b>{score.correct}</b>/{score.total} correct ({pct}%)</div>
      </div>
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> The treble clef spirals around the G line (second from bottom) — that is why it is also called the "G clef." Once you know one note on the staff, you can name every other note by counting up or down the musical alphabet (A-B-C-D-E-F-G, then repeat).
      </div>
    </div>
  )
}

// ---- 36.3: Tempo Metronome ----
export function TempoMetronome({ isDark }: { isDark: boolean }) {
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'
  const bg = isDark ? '#0f172a' : '#f8fafc'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const accent = '#a78bfa'

  const [bpm, setBpm] = useState(100)
  const [playing, setPlaying] = useState(false)
  const [sound, setSound] = useState(true)
  const [pendulumAngle, setPendulumAngle] = useState(0)
  const [beatPulse, setBeatPulse] = useState(false)
  const [tapTimes, setTapTimes] = useState<number[]>([])
  const [detectedBpm, setDetectedBpm] = useState<number | null>(null)

  const audioRef = useRef<AudioContext | null>(null)
  const animRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const lastBeatRef = useRef<number>(-1)
  const bpmRef = useRef(bpm); bpmRef.current = bpm
  const soundRef = useRef(sound); soundRef.current = sound
  const playingRef = useRef(playing); playingRef.current = playing

  const getCtx = (): AudioContext => {
    if (!audioRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioRef.current = new AC()
    }
    if (audioRef.current.state === 'suspended') void audioRef.current.resume()
    return audioRef.current
  }
  const playClick = (accented: boolean) => {
    if (!soundRef.current) return
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = accented ? 1200 : 800
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.001)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.08)
  }

  useEffect(() => {
    if (!playing) return
    startTimeRef.current = 0
    lastBeatRef.current = -1
    const tick = (t: number) => {
      if (!playingRef.current) return
      if (startTimeRef.current === 0) startTimeRef.current = t
      const elapsed = (t - startTimeRef.current) / 1000
      const period = 60 / bpmRef.current
      // Pendulum: full swing per beat (half period = one beat)
      const angle = Math.sin((elapsed / period) * Math.PI) * 35
      setPendulumAngle(angle)
      // Beat detection: when sin crosses ±1
      const beatNum = Math.floor(elapsed / period)
      if (beatNum !== lastBeatRef.current && beatNum >= 0) {
        lastBeatRef.current = beatNum
        const accented = beatNum % 4 === 0
        playClick(accented)
        setBeatPulse(true)
        window.setTimeout(() => setBeatPulse(false), 60)
      }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [playing])

  useEffect(() => () => {
    cancelAnimationFrame(animRef.current)
    if (audioRef.current) void audioRef.current.close()
  }, [])

  const getTempoName = (b: number): { name: string; color: string } => {
    if (b < 66) return { name: 'Largo', color: '#60a5fa' }
    if (b < 77) return { name: 'Adagio', color: '#3b82f6' }
    if (b < 109) return { name: 'Andante', color: '#22c55e' }
    if (b < 121) return { name: 'Moderato', color: '#eab308' }
    if (b < 169) return { name: 'Allegro', color: '#f97316' }
    return { name: 'Presto', color: '#ef4444' }
  }
  const tempo = getTempoName(bpm)

  const handleTap = () => {
    const now = performance.now()
    const recent = [...tapTimes, now].filter(t => now - t < 3000)
    if (recent.length >= 2) {
      const intervals: number[] = []
      for (let i = 1; i < recent.length; i++) intervals.push(recent[i] - recent[i - 1])
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      setDetectedBpm(Math.round(60000 / avg))
    } else {
      setDetectedBpm(null)
    }
    setTapTimes(recent)
  }

  const TEMPO_RANGES = [
    { name: 'Largo', min: 40, max: 60, color: '#60a5fa' },
    { name: 'Adagio', min: 66, max: 76, color: '#3b82f6' },
    { name: 'Andante', min: 76, max: 108, color: '#22c55e' },
    { name: 'Moderato', min: 108, max: 120, color: '#eab308' },
    { name: 'Allegro', min: 120, max: 168, color: '#f97316' },
    { name: 'Presto', min: 168, max: 208, color: '#ef4444' },
  ]

  const pivotX = 140, pivotY = 20, armLen = 70

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Pendulum SVG */}
      <svg viewBox="0 0 280 110" style={{ width: '100%', borderRadius: 6, border: '1px solid ' + border, background: bg }}>
        {/* Base */}
        <rect x={pivotX - 25} y={95} width={50} height={10} rx={2} fill={isDark ? '#475569' : '#94a3b8'} />
        <line x1={pivotX} y1={pivotY} x2={pivotX} y2={95} stroke={isDark ? '#475569' : '#cbd5e1'} strokeWidth="2" />
        {/* Beat indicator */}
        <circle cx={pivotX} cy={pivotY} r={beatPulse ? 6 : 4} fill={beatPulse ? '#34d399' : accent} />
        {/* Pendulum arm */}
        <g transform={`rotate(${pendulumAngle} ${pivotX} ${pivotY})`}>
          <line x1={pivotX} y1={pivotY} x2={pivotX} y2={pivotY + armLen} stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth="2" />
          <rect x={pivotX - 8} y={pivotY + 18} width={16} height={14} rx={2} fill={tempo.color} />
        </g>
        <text x={10} y={14} fontSize="11" fontWeight="700" fill={tempo.color}>{tempo.name}</text>
        <text x={270} y={14} textAnchor="end" fontSize="14" fontWeight="700" fill={textColor}>{bpm} BPM</text>
      </svg>
      {/* BPM Slider */}
      <div>
        <div style={{ fontSize: 9, color: labelColor, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
          <span>Tempo</span>
          <span style={{ fontFamily: 'monospace' }}>{bpm} BPM</span>
        </div>
        <input type="range" min={40} max={208} value={bpm} onChange={e => setBpm(Number(e.target.value))} style={{ width: '100%', accentColor: tempo.color, cursor: 'pointer', height: 4 }} />
      </div>
      {/* Tempo range visualization */}
      <div style={{ display: 'flex', gap: 1, fontSize: 7 }}>
        {TEMPO_RANGES.map(r => (
          <button key={r.name} onClick={() => setBpm(Math.round((r.min + r.max) / 2))} title={`${r.name} (${r.min}-${r.max})`} style={{
            flex: 1, padding: '3px 1px', fontSize: 8, fontWeight: 600,
            background: tempo.name === r.name ? r.color : 'transparent',
            border: '1px solid ' + r.color, color: tempo.name === r.name ? '#fff' : r.color,
            cursor: 'pointer', borderRadius: 3,
          }}>{r.name}</button>
        ))}
      </div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={() => setPlaying(p => !p)} style={{
          padding: '5px 14px', borderRadius: 5, fontSize: 11, fontWeight: 700,
          background: playing ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)',
          border: playing ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(52,211,153,0.3)',
          color: playing ? '#f87171' : '#34d399', cursor: 'pointer',
        }}>{playing ? '■ Stop' : '▶ Start'}</button>
        <button onClick={() => setSound(s => !s)} style={{
          padding: '5px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600,
          background: sound ? 'rgba(139,92,246,0.15)' : btnBg,
          border: sound ? '1px solid rgba(139,92,246,0.3)' : '1px solid ' + border,
          color: sound ? accent : labelColor, cursor: 'pointer',
        }}>{sound ? '🔊 Sound' : '🔇 Muted'}</button>
        <button onClick={handleTap} style={{
          padding: '5px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600,
          background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)',
          color: '#eab308', cursor: 'pointer',
        }}>👆 Tap</button>
      </div>
      {detectedBpm !== null && (
        <div style={{ fontSize: 10, color: labelColor, textAlign: 'center' }}>
          Detected tempo from taps: <b style={{ color: '#eab308' }}>{detectedBpm} BPM</b> → <b style={{ color: getTempoName(detectedBpm).color }}>{getTempoName(detectedBpm).name}</b>
          <button onClick={() => { setTapTimes([]); setDetectedBpm(null) }} style={{ marginLeft: 6, padding: '1px 6px', fontSize: 9, background: btnBg, border: '1px solid ' + border, borderRadius: 3, color: labelColor, cursor: 'pointer' }}>reset</button>
        </div>
      )}
      {/* How It Works */}
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + border, color: textColor }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: labelColor, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Current tempo: <b style={{ color: tempo.color }}>{tempo.name}</b> at <b>{bpm}</b> beats per minute</div>
        <div>Step 2: Each beat lasts <b>{(60 / bpm).toFixed(3)}</b> seconds (60 ÷ {bpm})</div>
        <div>Step 3: Pendulum swings once per beat — full cycle in {(120 / bpm).toFixed(3)}s</div>
        <div>Step 4: {playing ? '✓ Metronome running — count "1, 2, 3, 4" with each click' : 'Press Start to hear the beat'}</div>
        <div>Step 5: Tap button records your taps — detects {detectedBpm !== null ? <b style={{ color: '#eab308' }}>{detectedBpm} BPM</b> : 'no tempo yet'}</div>
        <div>Step 6: Italian terms describe feeling: slow (Largo) → fast (Presto)</div>
      </div>
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Tempo is the heartbeat of music. BPM (beats per minute) measures the same thing as your pulse — about 60–80 at rest. Italian composers gave tempos emotional names (Allegro = "cheerful", Adagio = "at ease") because speed changes how music feels.
      </div>
    </div>
  )
}

// ============================================================
// 6-8 WIDGETS (Tasks 36.4 - 36.6)
// ============================================================

// ---- 36.4: Scale and Proportion ----
export function ScaleAndProportion({ isDark }: { isDark: boolean }) {
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'
  const bg = isDark ? '#0f172a' : '#f8fafc'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const accent = '#a78bfa'

  const [origW, setOrigW] = useState(40)
  const [origH, setOrigH] = useState(30)
  const [scale, setScale] = useState(1)
  const scaleOptions = [0.5, 1, 2, 3]

  const scaledW = origW * scale
  const scaledH = origH * scale
  const origArea = origW * origH
  const scaledArea = scaledW * scaledH
  const areaRatio = scaledArea / origArea

  // SVG drawing: original rect outlined, scaled rect filled translucent
  const svgW = 280, svgH = 160
  // Center the scaled rect
  const cx = svgW / 2, cy = svgH / 2 + 10
  const scaledX = cx - scaledW / 2, scaledY = cy - scaledH / 2
  const origX = cx - origW / 2, origY = cy - origH / 2

  const scaleColor = '#a78bfa'
  const origColor = '#f59e0b'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, color: labelColor }}>Draw a shape, then scale it up or down. Watch how area grows by the SQUARE of the scale factor.</div>
      {/* Original shape controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div>
          <div style={{ fontSize: 9, color: labelColor, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Original width</span><span style={{ fontFamily: 'monospace' }}>{origW}</span>
          </div>
          <input type="range" min={20} max={60} value={origW} onChange={e => setOrigW(Number(e.target.value))} style={{ width: '100%', accentColor: origColor, cursor: 'pointer', height: 4 }} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: labelColor, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Original height</span><span style={{ fontFamily: 'monospace' }}>{origH}</span>
          </div>
          <input type="range" min={15} max={50} value={origH} onChange={e => setOrigH(Number(e.target.value))} style={{ width: '100%', accentColor: origColor, cursor: 'pointer', height: 4 }} />
        </div>
      </div>
      {/* Scale buttons */}
      <div>
        <div style={{ fontSize: 9, color: labelColor, marginBottom: 3 }}>Scale factor</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {scaleOptions.map(s => (
            <button key={s} onClick={() => setScale(s)} style={{
              flex: 1, padding: '4px 0', borderRadius: 5, fontSize: 11, fontWeight: 700,
              background: scale === s ? 'rgba(139,92,246,0.2)' : btnBg,
              border: scale === s ? '1px solid rgba(139,92,246,0.4)' : '1px solid ' + border,
              color: scale === s ? accent : labelColor, cursor: 'pointer',
            }}>{s}×</button>
          ))}
        </div>
      </div>
      {/* Visualization */}
      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', borderRadius: 6, border: '1px solid ' + border, background: bg }}>
        {/* Ground line for context */}
        <line x1="0" y1={cy + Math.max(scaledH, origH) / 2 + 4} x2={svgW} y2={cy + Math.max(scaledH, origH) / 2 + 4} stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="0.6" strokeDasharray="3 2" />
        {/* Scaled (filled, behind) */}
        <rect x={scaledX} y={scaledY} width={scaledW} height={scaledH} fill="rgba(167,139,250,0.25)" stroke={scaleColor} strokeWidth="1.5" />
        {/* Original (outlined, in front) */}
        <rect x={origX} y={origY} width={origW} height={origH} fill="none" stroke={origColor} strokeWidth="1.5" strokeDasharray="3 2" />
        {/* Labels */}
        <text x={origX + origW / 2} y={origY - 4} textAnchor="middle" fontSize="9" fontWeight="700" fill={origColor}>1× ({origW}×{origH})</text>
        <text x={scaledX + scaledW / 2} y={scaledY - 4} textAnchor="middle" fontSize="9" fontWeight="700" fill={scaleColor}>{scale}× ({scaledW}×{scaledH})</text>
        {/* Dimension lines */}
        <line x1={scaledX} y1={scaledY + scaledH + 8} x2={scaledX + scaledW} y2={scaledY + scaledH + 8} stroke={scaleColor} strokeWidth="0.6" />
        <text x={scaledX + scaledW / 2} y={scaledY + scaledH + 16} textAnchor="middle" fontSize="8" fill={scaleColor}>w = {scaledW}</text>
      </svg>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 10 }}>
        <div style={{ padding: '4px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ fontSize: 8, color: origColor, fontWeight: 700 }}>ORIGINAL (1×)</div>
          <div style={{ color: textColor }}>Size: {origW} × {origH}</div>
          <div style={{ color: textColor }}>Area: <b>{origArea}</b></div>
        </div>
        <div style={{ padding: '4px 6px', borderRadius: 4, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <div style={{ fontSize: 8, color: scaleColor, fontWeight: 700 }}>SCALED ({scale}×)</div>
          <div style={{ color: textColor }}>Size: {scaledW} × {scaledH}</div>
          <div style={{ color: textColor }}>Area: <b>{scaledArea}</b></div>
        </div>
      </div>
      {/* How It Works */}
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + border, color: textColor }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: labelColor, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Original shape: <b>{origW}</b> × <b>{origH}</b> (area = <b>{origArea}</b>)</div>
        <div>Step 2: Scale factor: <b style={{ color: accent }}>{scale}×</b> — multiply each dimension by {scale}</div>
        <div>Step 3: Scaled size: {origW}×{scale} = <b>{scaledW}</b>, {origH}×{scale} = <b>{scaledH}</b></div>
        <div>Step 4: Scaled area: {scaledW} × {scaledH} = <b style={{ color: '#34d399' }}>{scaledArea}</b></div>
        <div>Step 5: Area ratio = {scaledArea} ÷ {origArea} = <b style={{ color: accent }}>{areaRatio}×</b> = {scale}² (scale squared)</div>
        <div>Step 6: Linear scale ×2 = area ×4; ×3 = area ×9 — that is why scaling feels "bigger than expected"</div>
      </div>
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Artists use scale to suggest depth — closer objects appear larger, farther ones smaller. Because area scales by the SQUARE of length, doubling a shape's size takes 4× the paint. This is also why small details "pop" next to large ones: scale contrast creates visual hierarchy.
      </div>
    </div>
  )
}

// ---- 36.5: Music Notation Composer ----
export function MusicNotationComposer({ isDark }: { isDark: boolean }) {
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'
  const bg = isDark ? '#0f172a' : '#fffef5'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const accent = '#a78bfa'
  const noteColor = isDark ? '#e2e8f0' : '#1e293b'

  const NOTE_CYCLE = ['rest', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
  const NOTE_FREQ: Record<string, number> = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25,
  }
  // Y position on staff (staff lines at y=20,30,40,50,60; C4=65 below staff, B4=40, D5=30)
  const NOTE_Y: Record<string, number> = {
    C4: 75, D4: 70, E4: 60, F4: 55, G4: 50, A4: 45, B4: 40, C5: 35,
  }

  const [notes, setNotes] = useState<string[]>(['C4', 'E4', 'G4', 'C5', 'rest', 'G4', 'E4', 'C4'])
  const [timeSig, setTimeSig] = useState<'4/4' | '3/4' | '2/4'>('4/4')
  const [playing, setPlaying] = useState(false)
  const [playIdx, setPlayIdx] = useState(-1)
  const audioRef = useRef<AudioContext | null>(null)
  const timersRef = useRef<number[]>([])

  const getCtx = (): AudioContext => {
    if (!audioRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioRef.current = new AC()
    }
    if (audioRef.current.state === 'suspended') void audioRef.current.resume()
    return audioRef.current
  }
  const playTone = (freq: number, dur: number) => {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + dur + 0.05)
  }

  const cycleNote = (i: number) => {
    if (playing) return
    setNotes(prev => {
      const next = [...prev]
      const cur = next[i]
      const idx = NOTE_CYCLE.indexOf(cur)
      next[i] = NOTE_CYCLE[(idx + 1) % NOTE_CYCLE.length]
      return next
    })
  }

  const playMelody = () => {
    if (playing) return
    setPlaying(true)
    setPlayIdx(-1)
    const bpm = 120
    const beatDur = 60 / bpm
    const noteDur = beatDur * 0.5 // eighth notes
    notes.forEach((n, i) => {
      const t = window.setTimeout(() => {
        setPlayIdx(i)
        if (n !== 'rest') playTone(NOTE_FREQ[n], noteDur * 0.9)
      }, i * noteDur * 1000)
      timersRef.current.push(t)
    })
    const endT = window.setTimeout(() => {
      setPlaying(false)
      setPlayIdx(-1)
    }, notes.length * noteDur * 1000 + 200)
    timersRef.current.push(endT)
  }

  const stopMelody = () => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    setPlaying(false)
    setPlayIdx(-1)
  }

  useEffect(() => () => {
    timersRef.current.forEach(t => clearTimeout(t))
    if (audioRef.current) void audioRef.current.close()
  }, [])

  const svgW = 280
  const noteSpacing = 30
  const startX = 38

  // Beats per measure based on time sig
  const beatsPerMeasure = timeSig === '4/4' ? 4 : timeSig === '3/4' ? 3 : 2
  const measureEndX = startX + notes.length * noteSpacing

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, color: labelColor }}>Click each note slot to cycle through pitches (rest → C → D → ... → C5). Press Play to hear your melody.</div>
      {/* Time signature */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: labelColor }}>Time sig:</span>
        {(['4/4', '3/4', '2/4'] as const).map(ts => (
          <button key={ts} onClick={() => setTimeSig(ts)} disabled={playing} style={{
            padding: '3px 9px', borderRadius: 5, fontSize: 10, fontWeight: 700,
            background: timeSig === ts ? 'rgba(139,92,246,0.2)' : btnBg,
            border: timeSig === ts ? '1px solid rgba(139,92,246,0.4)' : '1px solid ' + border,
            color: timeSig === ts ? accent : labelColor, cursor: playing ? 'not-allowed' : 'pointer',
          }}>{ts}</button>
        ))}
      </div>
      {/* Staff */}
      <svg viewBox={`0 0 ${svgW} 90`} style={{ width: '100%', borderRadius: 6, border: '1px solid ' + border, background: bg }}>
        {/* Staff lines */}
        {[20, 30, 40, 50, 60].map(y => (
          <line key={y} x1="10" y1={y} x2={svgW - 10} y2={y} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="0.6" />
        ))}
        {/* Treble clef */}
        <text x="12" y="52" fontSize="28" fill={isDark ? '#94a3b8' : '#475569'} fontFamily="serif" fontWeight="bold">𝄞</text>
        {/* Time signature */}
        <text x="30" y="36" fontSize="14" fontWeight="700" fill={noteColor} fontFamily="serif">{timeSig.charAt(0)}</text>
        <text x="30" y="52" fontSize="14" fontWeight="700" fill={noteColor} fontFamily="serif">{timeSig.charAt(2)}</text>
        {/* Click targets + notes */}
        {notes.map((n, i) => {
          const x = startX + i * noteSpacing
          const isActive = playIdx === i
          const y = n === 'rest' ? 40 : NOTE_Y[n]
          const col = isActive ? '#34d399' : noteColor
          return (
            <g key={i} onClick={() => cycleNote(i)} style={{ cursor: playing ? 'not-allowed' : 'pointer' }}>
              {/* Click target */}
              <rect x={x - 12} y={10} width={24} height={70} fill="transparent" />
              {isActive && <rect x={x - 12} y={10} width={24} height={70} fill="rgba(52,211,153,0.12)" rx={2} />}
              {/* Ledger line for C4 */}
              {n === 'C4' && <line x1={x - 8} y1={75} x2={x + 8} y2={75} stroke={col} strokeWidth="0.7" />}
              {n === 'rest' ? (
                <text x={x - 3} y={50} fontSize="22" fontWeight="700" fill={col} fontFamily="serif">𝄽</text>
              ) : (
                <>
                  <ellipse cx={x} cy={y} rx="5" ry="3.8" fill={col} stroke={col} strokeWidth="1" transform={`rotate(-18 ${x} ${y})`} />
                  <line x1={x + 4.5} y1={y - 1} x2={x + 4.5} y2={y - 22} stroke={col} strokeWidth="1.2" />
                </>
              )}
            </g>
          )
        })}
        {/* Final bar line */}
        <line x1={measureEndX} y1={20} x2={measureEndX} y2={60} stroke={noteColor} strokeWidth="1.4" />
        <text x={svgW / 2} y={84} textAnchor="middle" fontSize="8" fill={labelColor}>{beatsPerMeasure} beats per measure · click a note to cycle pitches</text>
      </svg>
      {/* Play/Stop */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={playMelody} disabled={playing} style={{
          padding: '5px 12px', borderRadius: 5, fontSize: 11, fontWeight: 700,
          background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
          color: '#34d399', cursor: playing ? 'not-allowed' : 'pointer', opacity: playing ? 0.5 : 1,
        }}>▶ Play</button>
        <button onClick={stopMelody} disabled={!playing} style={{
          padding: '5px 12px', borderRadius: 5, fontSize: 11, fontWeight: 700,
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', cursor: playing ? 'pointer' : 'not-allowed', opacity: playing ? 1 : 0.5,
        }}>■ Stop</button>
        <span style={{ fontSize: 9, color: labelColor, marginLeft: 'auto' }}>{playIdx >= 0 ? `Playing note ${playIdx + 1}/${notes.length}` : 'Ready'}</span>
      </div>
      {/* How It Works */}
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + border, color: textColor }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: labelColor, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Time signature: <b style={{ color: accent }}>{timeSig}</b> — {timeSig.charAt(0)} beats per measure, quarter note gets the beat</div>
        <div>Step 2: 8 note slots in your melody (each is an eighth note)</div>
        <div>Step 3: Click any slot to cycle: rest → C → D → E → F → G → A → B → C5 → rest...</div>
        <div>Step 4: Currently playing: <b style={{ color: '#34d399' }}>{playIdx >= 0 ? notes[playIdx] : '—'}</b></div>
        <div>Step 5: Higher on staff = higher pitch (C4 = 261.6 Hz, C5 = 523.3 Hz — exactly 2× = one octave)</div>
        <div>Step 6: Notes play at 120 BPM eighth-notes (0.25s each); whole melody = {notes.length * 0.25}s</div>
      </div>
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> A melody is just a sequence of pitches over time. The same 7 letters (A-G) compose nearly all Western music — what changes is the rhythm and contour. Composing is choosing which pitches to repeat, step, or leap.
      </div>
    </div>
  )
}

// ---- 36.6: Rhythm Composition Tool ----
export function RhythmCompositionTool({ isDark }: { isDark: boolean }) {
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'
  const bg = isDark ? '#0f172a' : '#0f172a'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const accent = '#a78bfa'

  const [steps, setSteps] = useState<boolean[]>(Array(16).fill(false))
  const [timeSig, setTimeSig] = useState<'4/4' | '3/4' | '2/4'>('4/4')
  const [playing, setPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const audioRef = useRef<AudioContext | null>(null)
  const timersRef = useRef<number[]>([])

  const beatsActive = timeSig === '4/4' ? 16 : timeSig === '3/4' ? 12 : 8
  const activeSteps = steps.slice(0, beatsActive)

  const getCtx = (): AudioContext => {
    if (!audioRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioRef.current = new AC()
    }
    if (audioRef.current.state === 'suspended') void audioRef.current.resume()
    return audioRef.current
  }
  const playHit = (accented: boolean) => {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = accented ? 880 : 660
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.001)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.12)
  }

  const toggleStep = (i: number) => {
    if (playing) return
    setSteps(prev => { const n = [...prev]; n[i] = !n[i]; return n })
  }

  const playRhythm = () => {
    if (playing) return
    setPlaying(true)
    setCurrentStep(-1)
    const bpm = 100
    const stepDur = (60 / bpm) / 4 // sixteenth note
    for (let i = 0; i < beatsActive; i++) {
      const t = window.setTimeout(() => {
        setCurrentStep(i)
        if (steps[i]) playHit(i % 4 === 0)
      }, i * stepDur * 1000)
      timersRef.current.push(t)
    }
    const endT = window.setTimeout(() => {
      setPlaying(false)
      setCurrentStep(-1)
    }, beatsActive * stepDur * 1000 + 200)
    timersRef.current.push(endT)
  }

  const stopRhythm = () => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    setPlaying(false)
    setCurrentStep(-1)
  }

  const clearAll = () => {
    if (playing) return
    setSteps(Array(16).fill(false))
  }

  useEffect(() => () => {
    timersRef.current.forEach(t => clearTimeout(t))
    if (audioRef.current) void audioRef.current.close()
  }, [])

  // 4 rows × 4 cols layout (each row = one beat, each col = one sixteenth subdivision)
  const rows = 4
  const cols = 4
  const activeCount = activeSteps.filter(Boolean).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, color: labelColor }}>Click cells to toggle hits. Each row = 1 beat (4 sixteenth-note subdivisions). Play to hear your pattern.</div>
      {/* Time signature */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: labelColor }}>Time sig:</span>
        {(['4/4', '3/4', '2/4'] as const).map(ts => (
          <button key={ts} onClick={() => { if (!playing) setTimeSig(ts) }} disabled={playing} style={{
            padding: '3px 9px', borderRadius: 5, fontSize: 10, fontWeight: 700,
            background: timeSig === ts ? 'rgba(139,92,246,0.2)' : btnBg,
            border: timeSig === ts ? '1px solid rgba(139,92,246,0.4)' : '1px solid ' + border,
            color: timeSig === ts ? accent : labelColor, cursor: playing ? 'not-allowed' : 'pointer',
          }}>{ts}</button>
        ))}
      </div>
      {/* Rhythm grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 8, borderRadius: 6, background: bg, border: '1px solid ' + border }}>
        {Array.from({ length: rows }, (_, r) => {
          const beatNum = r + 1
          const isActiveBeat = beatNum <= (timeSig === '4/4' ? 4 : timeSig === '3/4' ? 3 : 2)
          return (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: isActiveBeat ? 1 : 0.25 }}>
              <span style={{ fontSize: 9, color: labelColor, width: 14, textAlign: 'center', fontWeight: 700 }}>{beatNum}</span>
              <div style={{ display: 'flex', gap: 3, flex: 1 }}>
                {Array.from({ length: cols }, (_, c) => {
                  const idx = r * cols + c
                  const isOn = steps[idx]
                  const isCurrent = currentStep === idx
                  const isDownbeat = c === 0
                  return (
                    <button key={c} onClick={() => toggleStep(idx)} disabled={!isActiveBeat || playing} style={{
                      flex: 1, height: 24, borderRadius: 4,
                      background: isCurrent ? '#34d399' : isOn ? (isDownbeat ? accent : '#7c3aed') : (isDownbeat ? 'rgba(139,92,246,0.1)' : btnBg),
                      border: isOn ? '1px solid ' + accent : '1px solid ' + border,
                      cursor: !isActiveBeat || playing ? 'not-allowed' : 'pointer',
                      padding: 0,
                    }}>
                      {isOn && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>♪</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <button onClick={playRhythm} disabled={playing} style={{
          padding: '4px 11px', borderRadius: 5, fontSize: 10, fontWeight: 700,
          background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
          color: '#34d399', cursor: playing ? 'not-allowed' : 'pointer', opacity: playing ? 0.5 : 1,
        }}>▶ Play</button>
        <button onClick={stopRhythm} disabled={!playing} style={{
          padding: '4px 11px', borderRadius: 5, fontSize: 10, fontWeight: 700,
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', cursor: playing ? 'pointer' : 'not-allowed', opacity: playing ? 1 : 0.5,
        }}>■ Stop</button>
        <button onClick={clearAll} disabled={playing} style={{
          padding: '4px 11px', borderRadius: 5, fontSize: 10, fontWeight: 600,
          background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)',
          color: '#eab308', cursor: playing ? 'not-allowed' : 'pointer', opacity: playing ? 0.5 : 1,
        }}>Clear</button>
      </div>
      <div style={{ fontSize: 9, color: labelColor, textAlign: 'center' }}>
        {activeCount} hits in {beatsActive} sixteenth-note slots · {currentStep >= 0 ? `Playing step ${currentStep + 1}/${beatsActive}` : 'Ready'}
      </div>
      {/* How It Works */}
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + border, color: textColor }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: labelColor, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Time signature: <b style={{ color: accent }}>{timeSig}</b> — uses {beatsActive} of 16 grid cells</div>
        <div>Step 2: Grid is 4 rows × 4 cols = 16 sixteenth-note subdivisions (4 per beat)</div>
        <div>Step 3: Row 1 = beat 1, row 2 = beat 2, etc. — first column of each row is the downbeat</div>
        <div>Step 4: <b style={{ color: '#34d399' }}>{activeCount}</b> hits currently placed in the pattern</div>
        <div>Step 5: Playback at 100 BPM — each sixteenth = {(60 / 100 / 4 * 1000).toFixed(0)}ms; full pattern = {(beatsActive * 60 / 100 / 4).toFixed(2)}s</div>
        <div>Step 6: Downbeats (first of each beat) play brighter — that is where you tap your foot</div>
      </div>
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Rhythm lives in a grid — every beat divides into 2, 4, or 8 equal parts. Drum machines, drummers, and DAWs all think in sixteenth-note grids. The "swing" feel comes from delaying the off-beats slightly, breaking the math.
      </div>
    </div>
  )
}

// ============================================================
// 9-12 WIDGETS (Tasks 36.7 - 36.10)
// ============================================================

// ---- 36.7: Three-Point Perspective ----
export function ThreePointPerspective({ isDark }: { isDark: boolean }) {
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'
  const bg = isDark ? '#0f172a' : '#f8fafc'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const accent = '#a78bfa'

  const svgW = 280, svgH = 200
  const horizonY = 100

  const [vp1X, setVp1X] = useState(-30)   // off-canvas left
  const [vp2X, setVp2X] = useState(310)   // off-canvas right
  const [vp3Y, setVp3Y] = useState(280)   // below canvas (looking down)
  const [vp3Mode, setVp3Mode] = useState<'top' | 'bottom'>('bottom')

  const vp3ActualY = vp3Mode === 'bottom' ? vp3Y : -vp3Y + 200
  const vp1 = { x: vp1X, y: horizonY }
  const vp2 = { x: vp2X, y: horizonY }
  const vp3 = { x: svgW / 2, y: vp3ActualY }

  // Compute box corners using perspective construction.
  // Define front-bottom-left as starting corner, then use VP directions to find other corners.
  // Front face: 4 corners. We pick P0 near center-low. Then:
  //   P1 = along P0->VP1 (front-bottom-right)
  //   P2 = along P0->VP3 (front-top-left)
  //   P3 = intersection of P1->VP3 and P2->VP1 (front-top-right)
  // Back face: 4 corners, found by extending front-face edges toward VP2.
  const P0 = { x: svgW / 2 - 22, y: svgH / 2 + 18 }
  const t1 = 0.18  // fraction along P0->VP1
  const P1 = { x: P0.x + (vp1.x - P0.x) * t1, y: P0.y + (vp1.y - P0.y) * t1 }
  const t2 = 0.45  // fraction along P0->VP3
  const P2 = { x: P0.x + (vp3.x - P0.x) * t2, y: P0.y + (vp3.y - P0.y) * t2 }

  // Intersection of line P1->VP3 and P2->VP1
  const intersect = (a1: { x: number; y: number }, a2: { x: number; y: number }, b1: { x: number; y: number }, b2: { x: number; y: number }) => {
    const d1x = a2.x - a1.x, d1y = a2.y - a1.y
    const d2x = b2.x - b1.x, d2y = b2.y - b1.y
    const denom = d1x * d2y - d1y * d2x
    if (Math.abs(denom) < 0.001) return a1
    const t = ((b1.x - a1.x) * d2y - (b1.y - a1.y) * d2x) / denom
    return { x: a1.x + d1x * t, y: a1.y + d1y * t }
  }
  const P3 = intersect(P1, vp3, P2, vp1)

  // Back face: extend each front corner toward VP2
  const tBack = 0.22
  const P4 = { x: P0.x + (vp2.x - P0.x) * tBack, y: P0.y + (vp2.y - P0.y) * tBack }
  const P5 = intersect(P4, vp1, P1, vp2)
  const P6 = intersect(P4, vp3, P2, vp2)
  const P7 = intersect(P5, vp3, P6, vp1)

  const vp1Color = '#ef4444'
  const vp2Color = '#3b82f6'
  const vp3Color = '#22c55e'

  // Helper: extend a line from a corner through a VP to canvas edge
  const lineToVP = (p: { x: number; y: number }, vp: { x: number; y: number }) => {
    const dx = vp.x - p.x, dy = vp.y - p.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const ux = dx / len, uy = dy / len
    // Extend in both directions to svg bounds
    const far = 800
    return { x1: p.x - ux * far, y1: p.y - uy * far, x2: p.x + ux * far, y2: p.y + uy * far }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, color: labelColor }}>Three vanishing points create dramatic perspective — perfect for towering buildings or bird's-eye views. Adjust each VP to see how the box responds.</div>
      {/* VP3 mode toggle */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: labelColor }}>VP3 position:</span>
        <button onClick={() => setVp3Mode('bottom')} style={{
          padding: '3px 9px', borderRadius: 5, fontSize: 10, fontWeight: 600,
          background: vp3Mode === 'bottom' ? 'rgba(34,197,94,0.2)' : btnBg,
          border: vp3Mode === 'bottom' ? '1px solid rgba(34,197,94,0.4)' : '1px solid ' + border,
          color: vp3Mode === 'bottom' ? '#22c55e' : labelColor, cursor: 'pointer',
        }}>Below (looking down)</button>
        <button onClick={() => setVp3Mode('top')} style={{
          padding: '3px 9px', borderRadius: 5, fontSize: 10, fontWeight: 600,
          background: vp3Mode === 'top' ? 'rgba(34,197,94,0.2)' : btnBg,
          border: vp3Mode === 'top' ? '1px solid rgba(34,197,94,0.4)' : '1px solid ' + border,
          color: vp3Mode === 'top' ? '#22c55e' : labelColor, cursor: 'pointer',
        }}>Above (looking up)</button>
      </div>
      {/* VP sliders */}
      <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
        <div>
          <div style={{ fontSize: 9, color: vp1Color, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>VP1 (left) X</span><span style={{ fontFamily: 'monospace' }}>{vp1X}</span>
          </div>
          <input type="range" min={-100} max={20} value={vp1X} onChange={e => setVp1X(Number(e.target.value))} style={{ width: '100%', accentColor: vp1Color, cursor: 'pointer', height: 4 }} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: vp2Color, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>VP2 (right) X</span><span style={{ fontFamily: 'monospace' }}>{vp2X}</span>
          </div>
          <input type="range" min={260} max={400} value={vp2X} onChange={e => setVp2X(Number(e.target.value))} style={{ width: '100%', accentColor: vp2Color, cursor: 'pointer', height: 4 }} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: vp3Color, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>VP3 ({vp3Mode}) distance</span><span style={{ fontFamily: 'monospace' }}>{vp3Y}</span>
          </div>
          <input type="range" min={200} max={500} value={vp3Y} onChange={e => setVp3Y(Number(e.target.value))} style={{ width: '100%', accentColor: vp3Color, cursor: 'pointer', height: 4 }} />
        </div>
      </div>
      {/* SVG */}
      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', borderRadius: 6, border: '1px solid ' + border, background: bg }}>
        {/* Horizon line */}
        <line x1={0} y1={horizonY} x2={svgW} y2={horizonY} stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="0.6" strokeDasharray="4 3" />
        <text x={6} y={horizonY - 3} fontSize="8" fill={labelColor}>Horizon</text>

        {/* Construction lines (faint) from each VP through box corners */}
        {[P0, P1, P2, P3].map((p, i) => {
          const l1 = lineToVP(p, vp1)
          const l2 = lineToVP(p, vp2)
          const l3 = lineToVP(p, vp3)
          return (
            <g key={i}>
              <line {...l1} stroke={vp1Color} strokeWidth="0.3" opacity="0.25" />
              <line {...l2} stroke={vp2Color} strokeWidth="0.3" opacity="0.25" />
              <line {...l3} stroke={vp3Color} strokeWidth="0.3" opacity="0.25" />
            </g>
          )
        })}

        {/* Box edges — front face */}
        <polygon points={`${P0.x},${P0.y} ${P1.x},${P1.y} ${P3.x},${P3.y} ${P2.x},${P2.y}`} fill="rgba(167,139,250,0.18)" stroke={accent} strokeWidth="1.2" />
        {/* Back face outline */}
        <line x1={P0.x} y1={P0.y} x2={P4.x} y2={P4.y} stroke={accent} strokeWidth="1" />
        <line x1={P1.x} y1={P1.y} x2={P5.x} y2={P5.y} stroke={accent} strokeWidth="1" />
        <line x1={P2.x} y1={P2.y} x2={P6.x} y2={P6.y} stroke={accent} strokeWidth="1" />
        <line x1={P3.x} y1={P3.y} x2={P7.x} y2={P7.y} stroke={accent} strokeWidth="1" />
        <polygon points={`${P4.x},${P4.y} ${P5.x},${P5.y} ${P7.x},${P7.y} ${P6.x},${P6.y}`} fill="none" stroke={accent} strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />

        {/* VP markers (off-canvas shown as arrows) */}
        <line x1={0} y1={horizonY} x2={14} y2={horizonY} stroke={vp1Color} strokeWidth="1.5" />
        <text x={4} y={horizonY - 5} fontSize="8" fill={vp1Color} fontWeight="700">VP1 →</text>
        <line x1={svgW - 14} y1={horizonY} x2={svgW} y2={horizonY} stroke={vp2Color} strokeWidth="1.5" />
        <text x={svgW - 32} y={horizonY - 5} fontSize="8" fill={vp2Color} fontWeight="700">← VP2</text>
        {/* VP3 marker */}
        {vp3Mode === 'bottom' ? (
          <>
            <line x1={svgW / 2} y1={svgH - 14} x2={svgW / 2} y2={svgH} stroke={vp3Color} strokeWidth="1.5" />
            <text x={svgW / 2 + 4} y={svgH - 4} fontSize="8" fill={vp3Color} fontWeight="700">↓ VP3</text>
          </>
        ) : (
          <>
            <line x1={svgW / 2} y1={0} x2={svgW / 2} y2={14} stroke={vp3Color} strokeWidth="1.5" />
            <text x={svgW / 2 + 4} y={10} fontSize="8" fill={vp3Color} fontWeight="700">↑ VP3</text>
          </>
        )}

        {/* Corner labels */}
        <circle cx={P0.x} cy={P0.y} r="2" fill={textColor} />
        <text x={P0.x - 8} y={P0.y + 10} fontSize="7" fill={labelColor}>P0</text>
      </svg>
      {/* How It Works */}
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + border, color: textColor }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: labelColor, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: <b style={{ color: vp1Color }}>VP1 (left)</b> at x={vp1X}, <b style={{ color: vp2Color }}>VP2 (right)</b> at x={vp2X} — both on horizon (y={horizonY})</div>
        <div>Step 2: <b style={{ color: vp3Color }}>VP3</b> {vp3Mode === 'bottom' ? 'below' : 'above'} canvas — vertical lines converge here ({vp3Mode === 'bottom' ? 'looking down' : 'looking up'})</div>
        <div>Step 3: Box front face corners computed from P0 + VP1 + VP3 directions</div>
        <div>Step 4: Back face found by extending front corners toward VP2 ({Math.round(Math.abs(tBack * 100))}% along)</div>
        <div>Step 5: All 8 box edges aim at one of the 3 VPs — that is what makes it look 3D</div>
        <div>Step 6: Closer VP3 = steeper vertical convergence = more dramatic angle</div>
      </div>
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Two-point perspective assumes you are level with the horizon. Adding a third VP — above or below — tilts the camera up or down. That is why comic-book heroes and tall buildings look heroic: their vertical lines actually lean inward toward a VP high above.
      </div>
    </div>
  )
}

// ---- 36.8: Music Theory Explorer ----
export function MusicTheoryExplorer({ isDark }: { isDark: boolean }) {
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'
  const bg = isDark ? '#0f172a' : '#fffef5'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const accent = '#a78bfa'
  const noteColor = isDark ? '#e2e8f0' : '#1e293b'

  const [tab, setTab] = useState<'circle' | 'keys' | 'intervals'>('circle')
  const [circleKey, setCircleKey] = useState('C')
  const [sigKey, setSigKey] = useState('G')
  const [intNote1, setIntNote1] = useState('C')
  const [intNote2, setIntNote2] = useState('G')

  const audioRef = useRef<AudioContext | null>(null)
  const svgW = 280
  const getCtx = (): AudioContext => {
    if (!audioRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioRef.current = new AC()
    }
    if (audioRef.current.state === 'suspended') void audioRef.current.resume()
    return audioRef.current
  }
  const playTone = (freq: number, dur = 0.6) => {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + dur + 0.05)
  }
  useEffect(() => () => { if (audioRef.current) void audioRef.current.close() }, [])

  // Circle of Fifths: 12 keys, order = C, G, D, A, E, B, F#, C# (sharps side) then F, Bb, Eb, Ab, Db, Gb, Cb (flats side)
  const CIRCLE_MAJOR = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb']
  // Use 12-key version: C, G, D, A, E, B, Gb/F#, Db/C#, Ab, Eb, Bb, F
  const CIRCLE_12 = [
    { key: 'C', sharps: 0, flats: 0, relMin: 'Am', angle: 0 },
    { key: 'G', sharps: 1, flats: 0, relMin: 'Em', angle: 30 },
    { key: 'D', sharps: 2, flats: 0, relMin: 'Bm', angle: 60 },
    { key: 'A', sharps: 3, flats: 0, relMin: 'F#m', angle: 90 },
    { key: 'E', sharps: 4, flats: 0, relMin: 'C#m', angle: 120 },
    { key: 'B', sharps: 5, flats: 0, relMin: 'G#m', angle: 150 },
    { key: 'F#', sharps: 6, flats: 0, relMin: 'D#m', angle: 180 },
    { key: 'Eb', sharps: 0, flats: 3, relMin: 'Cm', angle: 210 },
    { key: 'Bb', sharps: 0, flats: 2, relMin: 'Gm', angle: 240 },
    { key: 'F', sharps: 0, flats: 1, relMin: 'Dm', angle: 270 },
    { key: 'Ab', sharps: 0, flats: 4, relMin: 'Fm', angle: 300 },
    { key: 'Db', sharps: 0, flats: 5, relMin: 'Bbm', angle: 330 },
  ]
  const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B']  // positions on staff (line/space names)
  const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F']

  // Key signature info
  const getKeySig = (key: string): { sharps: string[]; flats: string[] } => {
    const entry = CIRCLE_12.find(k => k.key === key)
    if (!entry) return { sharps: [], flats: [] }
    return {
      sharps: SHARP_ORDER.slice(0, entry.sharps),
      flats: FLAT_ORDER.slice(0, entry.flats),
    }
  }

  // Staff Y positions for note letters (treble clef, line/space)
  // Lines bottom to top: E G B D F (y = 60, 50, 40, 30, 20)
  // Spaces bottom to top: F A C E (y = 55, 45, 35, 25)
  const NOTE_Y_SIG: Record<string, number> = {
    'F': 20, 'E': 25, 'D': 30, 'C': 35, 'B': 40, 'A': 45, 'G': 50, 'F4': 55, 'E4': 60,
    // For higher placements
    'G5': 15, 'F5': 20, 'E5': 25, 'D5': 30, 'C5': 35, 'B4': 40, 'A4': 45, 'G4': 50, 'F4s': 55, 'E4s': 60,
  }
  // We'll use the simpler key: by note letter, we place on first occurrence from bottom
  const getSigNoteY = (letter: string, isFlat: boolean): number => {
    // For sharps: F→top line, C→3rd space, G→above top, D→4th line, A→2nd space, E→top space (E5), B→middle line
    // For flats: B→middle line, E→top space (E5), A→2nd space (A4), D→4th line (D5), G→above top (G5), C→3rd space (C5), F→top line (F5)
    const map: Record<string, number> = {
      F: 20, C: 35, G: 15, D: 30, A: 45, E: 25, B: 40,
    }
    void isFlat
    return map[letter] ?? 30
  }

  // Intervals
  const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const NOTE_FREQ_CHROM: Record<string, number> = {
    C: 261.63, 'C#': 277.18, D: 293.66, 'D#': 311.13, E: 329.63, F: 349.23,
    'F#': 369.99, G: 392.00, 'G#': 415.30, A: 440.00, 'A#': 466.16, B: 493.88,
  }
  const INTERVAL_NAMES = [
    { semis: 0, name: 'Perfect Unison (P1)' },
    { semis: 1, name: 'Minor 2nd (m2)' },
    { semis: 2, name: 'Major 2nd (M2)' },
    { semis: 3, name: 'Minor 3rd (m3)' },
    { semis: 4, name: 'Major 3rd (M3)' },
    { semis: 5, name: 'Perfect 4th (P4)' },
    { semis: 6, name: 'Tritone (Aug 4 / Dim 5)' },
    { semis: 7, name: 'Perfect 5th (P5)' },
    { semis: 8, name: 'Minor 6th (m6)' },
    { semis: 9, name: 'Major 6th (M6)' },
    { semis: 10, name: 'Minor 7th (m7)' },
    { semis: 11, name: 'Major 7th (M7)' },
    { semis: 12, name: 'Octave (P8)' },
  ]
  const intervalIdx1 = CHROMATIC.indexOf(intNote1)
  const intervalIdx2 = CHROMATIC.indexOf(intNote2)
  const semitoneDiff = Math.abs(intervalIdx2 - intervalIdx1)
  const intervalName = INTERVAL_NAMES[semitoneDiff].name

  const playInterval = (sequential: boolean) => {
    if (sequential) {
      playTone(NOTE_FREQ_CHROM[intNote1], 0.4)
      window.setTimeout(() => playTone(NOTE_FREQ_CHROM[intNote2], 0.5), 450)
    } else {
      playTone(NOTE_FREQ_CHROM[intNote1], 0.8)
      playTone(NOTE_FREQ_CHROM[intNote2], 0.8)
    }
  }

  const selectedCircle = CIRCLE_12.find(k => k.key === circleKey)!
  const sig = getKeySig(sigKey)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, color: labelColor }}>Explore three pillars of music theory: the Circle of Fifths, key signatures, and intervals.</div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        {(['circle', 'keys', 'intervals'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '4px 0', borderRadius: 5, fontSize: 10, fontWeight: 700,
            background: tab === t ? 'rgba(139,92,246,0.2)' : btnBg,
            border: tab === t ? '1px solid rgba(139,92,246,0.4)' : '1px solid ' + border,
            color: tab === t ? accent : labelColor, cursor: 'pointer', textTransform: 'capitalize',
          }}>{t === 'circle' ? 'Circle of 5ths' : t === 'keys' ? 'Key Sig' : 'Intervals'}</button>
        ))}
      </div>

      {/* TAB: Circle of Fifths */}
      {tab === 'circle' && (
        <>
          <svg viewBox="0 0 280 200" style={{ width: '100%', borderRadius: 6, border: '1px solid ' + border, background: bg }}>
            {/* Outer ring guides */}
            <circle cx={140} cy={100} r={70} fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="0.6" />
            <circle cx={140} cy={100} r={50} fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="0.4" strokeDasharray="2 2" />
            {/* Center */}
            <text x={140} y={104} textAnchor="middle" fontSize="10" fontWeight="700" fill={accent}>Circle of</text>
            <text x={140} y={116} textAnchor="middle" fontSize="10" fontWeight="700" fill={accent}>Fifths</text>
            {/* 12 keys arranged in circle */}
            {CIRCLE_12.map(k => {
              const rad = (k.angle - 90) * Math.PI / 180
              const x = 140 + Math.cos(rad) * 70
              const y = 100 + Math.sin(rad) * 70
              const isSel = circleKey === k.key
              const color = k.sharps > 0 ? '#f97316' : k.flats > 0 ? '#3b82f6' : '#22c55e'
              return (
                <g key={k.key} onClick={() => setCircleKey(k.key)} style={{ cursor: 'pointer' }}>
                  <circle cx={x} cy={y} r={isSel ? 16 : 13} fill={isSel ? color : (isDark ? '#1e293b' : '#fff')} stroke={color} strokeWidth={isSel ? 2 : 1} />
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill={isSel ? '#fff' : color}>{k.key}</text>
                  {isSel && <text x={x} y={y + 28} textAnchor="middle" fontSize="7" fill={labelColor}>{k.relMin}</text>}
                </g>
              )
            })}
            {/* Labels */}
            <text x={6} y={14} fontSize="8" fill="#f97316" fontWeight="700">♯ Sharps →</text>
            <text x={svgW - 70} y={14} fontSize="8" fill="#3b82f6" fontWeight="700">← ♭ Flats</text>
          </svg>
          <div style={{ padding: '6px 8px', borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + border, fontSize: 11, color: textColor, lineHeight: 1.5 }}>
            <b style={{ color: accent }}>{selectedCircle.key}</b> major{selectedCircle.flats > 0 ? ` has ${selectedCircle.flats} flat${selectedCircle.flats > 1 ? 's' : ''}` : selectedCircle.sharps > 0 ? ` has ${selectedCircle.sharps} sharp${selectedCircle.sharps > 1 ? 's' : ''}` : ' has no sharps or flats'}.
            <br />Relative minor: <b style={{ color: '#34d399' }}>{selectedCircle.relMin}</b>. Click any wedge to explore.
          </div>
        </>
      )}

      {/* TAB: Key Signatures */}
      {tab === 'keys' && (
        <>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {CIRCLE_12.map(k => (
              <button key={k.key} onClick={() => setSigKey(k.key)} style={{
                padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                background: sigKey === k.key ? 'rgba(139,92,246,0.2)' : btnBg,
                border: sigKey === k.key ? '1px solid rgba(139,92,246,0.4)' : '1px solid ' + border,
                color: sigKey === k.key ? accent : labelColor, cursor: 'pointer',
              }}>{k.key}</button>
            ))}
          </div>
          <svg viewBox="0 0 280 90" style={{ width: '100%', borderRadius: 6, border: '1px solid ' + border, background: bg }}>
            {[20, 30, 40, 50, 60].map(y => (
              <line key={y} x1="10" y1={y} x2="270" y2={y} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="0.6" />
            ))}
            <text x="12" y="52" fontSize="28" fill={isDark ? '#94a3b8' : '#475569'} fontFamily="serif" fontWeight="bold">𝄞</text>
            {/* Sharps/Flats */}
            {sig.sharps.map((letter, i) => {
              const x = 40 + i * 9
              const y = getSigNoteY(letter, false)
              return <text key={`s${i}`} x={x} y={y + 4} fontSize="18" fontWeight="700" fill={noteColor} fontFamily="serif">♯</text>
            })}
            {sig.flats.map((letter, i) => {
              const x = 40 + i * 9
              const y = getSigNoteY(letter, true)
              return <text key={`f${i}`} x={x} y={y + 4} fontSize="18" fontWeight="700" fill={noteColor} fontFamily="serif">♭</text>
            })}
            {/* Key note at end */}
            <ellipse cx={220} cy={sigKey === 'C' ? 50 : 35} rx="6" ry="4.5" fill={accent} transform="rotate(-18 220 40)" />
            <line x1={225} y1={39} x2={225} y2={15} stroke={accent} strokeWidth="1.2" />
            <text x={210} y={80} fontSize="10" fontWeight="700" fill={accent} textAnchor="middle">{sigKey} major</text>
          </svg>
          <div style={{ padding: '6px 8px', borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + border, fontSize: 11, color: textColor, lineHeight: 1.5 }}>
            <b style={{ color: accent }}>{sigKey}</b> major signature: {sig.sharps.length > 0 ? <>{sig.sharps.length} sharp{sig.sharps.length > 1 ? 's' : ''} ({sig.sharps.map(l => l + '♯').join(', ')})</> : sig.flats.length > 0 ? <>{sig.flats.length} flat{sig.flats.length > 1 ? 's' : ''} ({sig.flats.map(l => l + '♭').join(', ')})</> : 'no sharps or flats (C major / A minor)'}.
          </div>
        </>
      )}

      {/* TAB: Intervals */}
      {tab === 'intervals' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>
              <div style={{ fontSize: 9, color: labelColor, marginBottom: 2}}>Note 1 (lower)</div>
              <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {CHROMATIC.map(n => (
                  <button key={n} onClick={() => setIntNote1(n)} style={{
                    padding: '2px 5px', borderRadius: 3, fontSize: 9, fontWeight: 700,
                    background: intNote1 === n ? 'rgba(139,92,246,0.2)' : btnBg,
                    border: intNote1 === n ? '1px solid rgba(139,92,246,0.4)' : '1px solid ' + border,
                    color: intNote1 === n ? accent : labelColor, cursor: 'pointer',
                  }}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: labelColor, marginBottom: 2 }}>Note 2 (higher)</div>
              <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {CHROMATIC.map(n => (
                  <button key={n} onClick={() => setIntNote2(n)} style={{
                    padding: '2px 5px', borderRadius: 3, fontSize: 9, fontWeight: 700,
                    background: intNote2 === n ? 'rgba(139,92,246,0.2)' : btnBg,
                    border: intNote2 === n ? '1px solid rgba(139,92,246,0.4)' : '1px solid ' + border,
                    color: intNote2 === n ? accent : labelColor, cursor: 'pointer',
                  }}>{n}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: labelColor }}>Interval: {intNote1} → {intNote2}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: accent, marginTop: 2 }}>{intervalName}</div>
            <div style={{ fontSize: 10, color: labelColor, marginTop: 2 }}>{semitoneDiff} semitone{semitoneDiff !== 1 ? 's' : ''} apart</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => playInterval(true)} style={{
              flex: 1, padding: '5px', borderRadius: 5, fontSize: 10, fontWeight: 700,
              background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
              color: '#34d399', cursor: 'pointer',
            }}>▶ Play Sequential</button>
            <button onClick={() => playInterval(false)} style={{
              flex: 1, padding: '5px', borderRadius: 5, fontSize: 10, fontWeight: 700,
              background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
              color: accent, cursor: 'pointer',
            }}>▶ Play Together</button>
          </div>
        </>
      )}

      {/* How It Works (dynamic) */}
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + border, color: textColor }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: labelColor, marginBottom: 3 }}>How It Works</div>
        {tab === 'circle' && (
          <>
            <div>Step 1: Currently viewing key <b style={{ color: accent }}>{selectedCircle.key}</b> major on the Circle</div>
            <div>Step 2: It has <b>{selectedCircle.sharps}</b> sharp{selectedCircle.sharps !== 1 ? 's' : ''} and <b>{selectedCircle.flats}</b> flat{selectedCircle.flats !== 1 ? 's' : ''}</div>
            <div>Step 3: Relative minor: <b style={{ color: '#34d399' }}>{selectedCircle.relMin}</b> (shares the same key signature)</div>
            <div>Step 4: Moving clockwise adds 1 sharp per step (C→G→D→A...)</div>
            <div>Step 5: Moving counter-clockwise adds 1 flat per step (C→F→Bb→Eb...)</div>
            <div>Step 6: Adjacent keys on the circle sound similar — that's why modulations between them feel smooth</div>
          </>
        )}
        {tab === 'keys' && (
          <>
            <div>Step 1: Selected key: <b style={{ color: accent }}>{sigKey}</b> major</div>
            <div>Step 2: Sharps in order: F♯, C♯, G♯, D♯, A♯, E♯, B♯ (mnemonic "Father Charles Goes Down And Ends Battle")</div>
            <div>Step 3: Flats in order: B♭, E♭, A♭, D♭, G♭, C♭, F♭ (mnemonic "Battle Ends And Down Goes Charles' Father")</div>
            <div>Step 4: This key has {sig.sharps.length > 0 ? <b>{sig.sharps.length} sharp{sig.sharps.length !== 1 ? 's' : ''}</b> : sig.flats.length > 0 ? <b>{sig.flats.length} flat{sig.flats.length !== 1 ? 's' : ''}</b> : <b>no accidentals</b>}</div>
            <div>Step 5: Sharps/flats appear in the same order in every key signature — just different counts</div>
            <div>Step 6: The last sharp in the sig names the major key (one half-step up); the second-to-last flat names the major key</div>
          </>
        )}
        {tab === 'intervals' && (
          <>
            <div>Step 1: Note 1 = <b style={{ color: accent }}>{intNote1}</b> ({NOTE_FREQ_CHROM[intNote1].toFixed(1)} Hz), Note 2 = <b style={{ color: accent }}>{intNote2}</b> ({NOTE_FREQ_CHROM[intNote2].toFixed(1)} Hz)</div>
            <div>Step 2: Semitone distance = |{intervalIdx2} − {intervalIdx1}| = <b>{semitoneDiff}</b> semitones</div>
            <div>Step 3: Interval name: <b style={{ color: '#34d399' }}>{intervalName}</b></div>
            <div>Step 4: Frequency ratio = {NOTE_FREQ_CHROM[intNote2].toFixed(2)} ÷ {NOTE_FREQ_CHROM[intNote1].toFixed(2)} = <b>{(NOTE_FREQ_CHROM[intNote2] / NOTE_FREQ_CHROM[intNote1]).toFixed(3)}</b></div>
            <div>Step 5: Perfect intervals (P1, P4, P5, P8) sound "stable" — they appear in the overtone series</div>
            <div>Step 6: The tritone (6 semitones) was historically called "the devil in music" for its tension</div>
          </>
        )}
      </div>
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> The Circle of Fifths is a map of musical relationships. Each step clockwise multiplies a frequency by 3/2 (a perfect fifth) — and after 12 steps you arrive back where you started (the "circle" closes). Western tuning slightly fudges this with equal temperament, but the math of pure fifths built the entire system.
      </div>
    </div>
  )
}

// ---- 36.9: Song Structure Analyzer ----
export function SongStructureAnalyzer({ isDark }: { isDark: boolean }) {
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'
  const bg = isDark ? '#0f172a' : '#f8fafc'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const accent = '#a78bfa'

  type SectionType = 'Intro' | 'Verse' | 'Pre-Chorus' | 'Chorus' | 'Bridge' | 'Outro'
  interface Section { type: SectionType; bars: number }
  const SECTION_INFO: Record<SectionType, { color: string; function: string }> = {
    Intro: { color: '#64748b', function: 'Set the mood' },
    Verse: { color: '#3b82f6', function: 'Tell the story' },
    'Pre-Chorus': { color: '#06b6d4', function: 'Build tension' },
    Chorus: { color: '#ef4444', function: 'The hook — main message' },
    Bridge: { color: '#a855f7', function: 'Contrast — new idea' },
    Outro: { color: '#64748b', function: 'Fade out / resolve' },
  }
  const SECTION_TYPES: SectionType[] = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro']

  const [sections, setSections] = useState<Section[]>([
    { type: 'Verse', bars: 4 }, { type: 'Chorus', bars: 4 }, { type: 'Verse', bars: 4 },
    { type: 'Chorus', bars: 4 }, { type: 'Bridge', bars: 4 }, { type: 'Chorus', bars: 4 },
    { type: 'Outro', bars: 4 },
  ])
  const [newBars, setNewBars] = useState(4)

  const PRESETS: Record<string, Section[]> = {
    'Verse-Chorus-Bridge': [
      { type: 'Verse', bars: 4 }, { type: 'Chorus', bars: 4 }, { type: 'Verse', bars: 4 },
      { type: 'Chorus', bars: 4 }, { type: 'Bridge', bars: 4 }, { type: 'Chorus', bars: 4 }, { type: 'Outro', bars: 4 },
    ],
    AABA: [
      { type: 'Verse', bars: 8 }, { type: 'Verse', bars: 8 }, { type: 'Bridge', bars: 8 }, { type: 'Verse', bars: 8 },
    ],
    Rondo: [
      { type: 'Chorus', bars: 4 }, { type: 'Verse', bars: 4 }, { type: 'Chorus', bars: 4 },
      { type: 'Bridge', bars: 4 }, { type: 'Chorus', bars: 4 },
    ],
    Strophic: [
      { type: 'Verse', bars: 4 }, { type: 'Verse', bars: 4 }, { type: 'Verse', bars: 4 }, { type: 'Verse', bars: 4 },
    ],
  }

  const addSection = (type: SectionType) => {
    setSections([...sections, { type, bars: newBars }])
  }
  const removeSection = (i: number) => {
    setSections(sections.filter((_, idx) => idx !== i))
  }
  const applyPreset = (name: string) => {
    setSections([...PRESETS[name]])
  }
  const clearAll = () => setSections([])

  const totalBars = sections.reduce((a, s) => a + s.bars, 0)
  const svgW = 280, svgH = 70
  const tlX = 10, tlW = svgW - 20

  // Timeline render
  let cursor = tlX
  const sectionElems = sections.map((s, i) => {
    const w = (s.bars / totalBars) * tlW
    const x = cursor
    cursor += w
    return { ...s, x, w, i }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, color: labelColor }}>Pick a song structure preset or build your own by adding sections. Each section type plays a different role.</div>
      {/* Presets */}
      <div>
        <div style={{ fontSize: 9, color: labelColor, marginBottom: 3 }}>Presets</div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {Object.keys(PRESETS).map(p => (
            <button key={p} onClick={() => applyPreset(p)} style={{
              padding: '3px 8px', borderRadius: 5, fontSize: 9, fontWeight: 600,
              background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
              color: accent, cursor: 'pointer',
            }}>{p}</button>
          ))}
          <button onClick={clearAll} style={{
            padding: '3px 8px', borderRadius: 5, fontSize: 9, fontWeight: 600,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171', cursor: 'pointer',
          }}>Clear</button>
        </div>
      </div>
      {/* Timeline */}
      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', borderRadius: 6, border: '1px solid ' + border, background: bg }}>
        {/* Time axis */}
        <line x1={tlX} y1={svgH - 12} x2={tlX + tlW} y2={svgH - 12} stroke={isDark ? '#475569' : '#cbd5e1'} strokeWidth="0.6" />
        {sectionElems.length === 0 ? (
          <text x={svgW / 2} y={svgH / 2} textAnchor="middle" fontSize="11" fill={labelColor}>Add sections below or pick a preset ↑</text>
        ) : (
          <>
            {sectionElems.map(s => {
              const info = SECTION_INFO[s.type]
              return (
                <g key={s.i}>
                  <rect x={s.x} y={15} width={s.w - 1} height={30} fill={info.color} opacity="0.85" rx={2} />
                  {s.w > 22 && <text x={s.x + s.w / 2} y={30} textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff">{s.type}</text>}
                  {s.w > 22 && <text x={s.x + s.w / 2} y={40} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.85)">{s.bars} bars</text>}
                  {/* Remove handle */}
                  <text x={s.x + s.w - 5} y={12} textAnchor="middle" fontSize="9" fill={labelColor} style={{ cursor: 'pointer' }} onClick={() => removeSection(s.i)}>×</text>
                </g>
              )
            })}
            {/* Bar markers */}
            {sectionElems.map((s, i) => (
              <text key={i} x={s.x} y={svgH - 3} fontSize="7" fill={labelColor}>{i === 0 ? '0' : ''}</text>
            ))}
            <text x={svgW - 10} y={svgH - 3} textAnchor="end" fontSize="7" fill={labelColor}>{totalBars}</text>
          </>
        )}
      </svg>
      {/* Total */}
      <div style={{ fontSize: 10, color: labelColor, textAlign: 'center' }}>
        {sections.length} section{sections.length !== 1 ? 's' : ''} · <b style={{ color: accent }}>{totalBars}</b> bars total
      </div>
      {/* Build your own */}
      <div style={{ borderTop: '1px solid ' + border, paddingTop: 6 }}>
        <div style={{ fontSize: 9, color: labelColor, marginBottom: 4, fontWeight: 700 }}>Build your own</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: labelColor }}>Bars:</span>
          <input type="number" min={1} max={16} value={newBars} onChange={e => setNewBars(Math.max(1, Math.min(16, Number(e.target.value) || 1)))} style={{ width: 36, padding: '2px 4px', fontSize: 10, background: btnBg, border: '1px solid ' + border, borderRadius: 3, color: textColor }} />
        </div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {SECTION_TYPES.map(t => (
            <button key={t} onClick={() => addSection(t)} style={{
              padding: '3px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600,
              background: SECTION_INFO[t].color + '20', border: '1px solid ' + SECTION_INFO[t].color + '60',
              color: SECTION_INFO[t].color, cursor: 'pointer',
            }}>+ {t}</button>
          ))}
        </div>
      </div>
      {/* Section function legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 9 }}>
        {SECTION_TYPES.map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: SECTION_INFO[t].color }} />
            <span style={{ fontWeight: 700, color: textColor, minWidth: 60 }}>{t}</span>
            <span style={{ color: labelColor }}>— {SECTION_INFO[t].function}</span>
          </div>
        ))}
      </div>
      {/* How It Works */}
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + border, color: textColor }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: labelColor, marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Current structure: <b>{sections.length}</b> section{sections.length !== 1 ? 's' : ''}, <b style={{ color: accent }}>{totalBars}</b> bars total</div>
        <div>Step 2: Sequence: {sections.length > 0 ? <b style={{ color: '#34d399' }}>{sections.map(s => s.type.charAt(0)).join(' → ')}</b> : 'empty — add sections above'}</div>
        <div>Step 3: Each section type has a job: {sections.length > 0 ? <>first section = <b>{sections[0].type}</b> ({SECTION_INFO[sections[0].type].function})</> : 'add a section to see'}</div>
        <div>Step 4: Repetition (Chorus returning) creates familiarity; contrast (Bridge) keeps it interesting</div>
        <div>Step 5: Average section length here: {sections.length > 0 ? <b>{(totalBars / sections.length).toFixed(1)} bars</b> : '—'}</div>
        <div>Step 6: Presets: VCB = pop song form; AABA = jazz standard (32-bar); Rondo = classical (ABACA); Strophic = folk (same music, new lyrics)</div>
      </div>
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Song form is the architecture of memory. Listeners unconsciously learn the pattern — when the Chorus returns, they sing along; when the Bridge arrives, they perk up. A great structure balances repetition (familiarity) with variation (surprise), the same way a good story has rhythms of tension and release.
      </div>
    </div>
  )
}

// ---- 36.10: Photography Composition Guide ----
export function PhotographyCompositionGuide({ isDark }: { isDark: boolean }) {
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'
  const bg = isDark ? '#0f172a' : '#1e293b'  // dark photo backdrop
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const accent = '#a78bfa'

  const [rule, setRule] = useState<'thirds' | 'lines' | 'golden' | 'framing' | 'symmetry'>('thirds')
  // Rule of Thirds
  const [subjectX, setSubjectX] = useState(33)
  const [subjectY, setSubjectY] = useState(33)
  // Leading lines
  const [lineAngle, setLineAngle] = useState(40)
  // Golden ratio
  const [goldenX, setGoldenX] = useState(38)
  // Framing
  const [frameSize, setFrameSize] = useState(40)
  // Symmetry
  const [symOffset, setSymOffset] = useState(0)

  const RULES = [
    { id: 'thirds', name: 'Rule of Thirds' },
    { id: 'lines', name: 'Leading Lines' },
    { id: 'golden', name: 'Golden Ratio' },
    { id: 'framing', name: 'Framing' },
    { id: 'symmetry', name: 'Symmetry' },
  ] as const

  const svgW = 280, svgH = 180

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, color: labelColor }}>Pick a composition rule, then adjust the subject/lines to see how each rule guides the eye.</div>
      {/* Rule selector */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {RULES.map(r => (
          <button key={r.id} onClick={() => setRule(r.id)} style={{
            padding: '3px 8px', borderRadius: 5, fontSize: 9, fontWeight: 700,
            background: rule === r.id ? 'rgba(139,92,246,0.2)' : btnBg,
            border: rule === r.id ? '1px solid rgba(139,92,246,0.4)' : '1px solid ' + border,
            color: rule === r.id ? accent : labelColor, cursor: 'pointer',
          }}>{r.name}</button>
        ))}
      </div>
      {/* SVG demo */}
      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', borderRadius: 6, border: '1px solid ' + border, background: bg }}>
        {/* "Photo" backdrop */}
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="60%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={svgW} height={svgH * 0.7} fill="url(#sky)" />
        <rect x={0} y={svgH * 0.7} width={svgW} height={svgH * 0.3} fill="#1e293b" />
        {/* Horizon line */}
        <line x1={0} y1={svgH * 0.7} x2={svgW} y2={svgH * 0.7} stroke="#0f172a" strokeWidth="0.8" />

        {/* Rule overlays */}
        {rule === 'thirds' && (
          <>
            <line x1={svgW / 3} y1={0} x2={svgW / 3} y2={svgH} stroke={accent} strokeWidth="0.7" opacity="0.7" />
            <line x1={svgW * 2 / 3} y1={0} x2={svgW * 2 / 3} y2={svgH} stroke={accent} strokeWidth="0.7" opacity="0.7" />
            <line x1={0} y1={svgH / 3} x2={svgW} y2={svgH / 3} stroke={accent} strokeWidth="0.7" opacity="0.7" />
            <line x1={0} y1={svgH * 2 / 3} x2={svgW} y2={svgH * 2 / 3} stroke={accent} strokeWidth="0.7" opacity="0.7" />
            {/* Intersection dots */}
            {[[svgW / 3, svgH / 3], [svgW * 2 / 3, svgH / 3], [svgW / 3, svgH * 2 / 3], [svgW * 2 / 3, svgH * 2 / 3]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={3} fill="none" stroke={accent} strokeWidth="0.7" opacity="0.5" />
            ))}
          </>
        )}
        {rule === 'lines' && (
          <>
            {/* Converging lines from bottom to vanishing point at top */}
            {[-40, -20, 0, 20, 40].map(off => (
              <line key={off} x1={svgW / 2 + off} y1={svgH} x2={svgW / 2} y2={svgH * 0.2} stroke={accent} strokeWidth="0.9" opacity="0.7" transform={`rotate(${lineAngle - 90} ${svgW / 2} ${svgH / 2})`} />
            ))}
            <circle cx={svgW / 2} cy={svgH * 0.2} r={4} fill={accent} opacity="0.8" />
          </>
        )}
        {rule === 'golden' && (
          <>
            {/* Golden spiral approximation with rectangles */}
            <rect x={0} y={0} width={svgW * 0.618} height={svgH} fill="none" stroke={accent} strokeWidth="0.5" opacity="0.5" />
            <rect x={svgW * 0.618} y={0} width={svgW * 0.382} height={svgH * 0.618} fill="none" stroke={accent} strokeWidth="0.5" opacity="0.5" />
            <rect x={svgW * 0.618} y={svgH * 0.618} width={svgW * 0.382} height={svgH * 0.382} fill="none" stroke={accent} strokeWidth="0.5" opacity="0.5" />
            {/* Spiral arc */}
            <path d={`M 0 0 Q ${svgW * 0.618} 0 ${svgW * 0.618} ${svgH * 0.618} Q ${svgW * 0.618} ${svgH} ${svgW} ${svgH}`} stroke={accent} strokeWidth="1" fill="none" opacity="0.8" />
            <circle cx={svgW * 0.618} cy={svgH * 0.618} r={4} fill={accent} />
          </>
        )}
        {rule === 'framing' && (
          <>
            {/* Arch frame */}
            <path d={`M ${frameSize} ${svgH} L ${frameSize} ${frameSize + 40} Q ${frameSize} ${frameSize} ${svgW / 2} ${frameSize} Q ${svgW - frameSize} ${frameSize} ${svgW - frameSize} ${frameSize + 40} L ${svgW - frameSize} ${svgH} Z`} fill="rgba(0,0,0,0.55)" />
            <path d={`M ${frameSize} ${svgH} L ${frameSize} ${frameSize + 40} Q ${frameSize} ${frameSize} ${svgW / 2} ${frameSize} Q ${svgW - frameSize} ${frameSize} ${svgW - frameSize} ${frameSize + 40} L ${svgW - frameSize} ${svgH}`} stroke={accent} strokeWidth="0.9" fill="none" opacity="0.8" />
          </>
        )}
        {rule === 'symmetry' && (
          <>
            <line x1={svgW / 2 + symOffset} y1={0} x2={svgW / 2 + symOffset} y2={svgH} stroke={accent} strokeWidth="0.8" strokeDasharray="4 3" opacity="0.9" />
            {/* Mirror markers */}
            <circle cx={svgW / 2 + symOffset - 30} cy={svgH / 2} r={5} fill={accent} opacity="0.8" />
            <circle cx={svgW / 2 + symOffset + 30} cy={svgH / 2} r={5} fill={accent} opacity="0.8" />
          </>
        )}

        {/* Subject */}
        {rule === 'thirds' && (
          <g>
            <circle cx={subjectX * svgW / 100} cy={subjectY * svgH / 100} r={8} fill="#fff" stroke="#1e293b" strokeWidth="1" />
            <text x={subjectX * svgW / 100} y={subjectY * svgH / 100 + 3} textAnchor="middle" fontSize="9" fontWeight="700" fill="#1e293b">★</text>
          </g>
        )}
        {rule === 'golden' && (
          <g>
            <circle cx={goldenX * svgW / 100} cy={svgH * 0.618} r={8} fill="#fff" stroke="#1e293b" strokeWidth="1" />
            <text x={goldenX * svgW / 100} y={svgH * 0.618 + 3} textAnchor="middle" fontSize="9" fontWeight="700" fill="#1e293b">★</text>
          </g>
        )}
      </svg>
      {/* Rule-specific controls */}
      {rule === 'thirds' && (
        <>
          <div>
            <div style={{ fontSize: 9, color: labelColor, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
              <span>Subject X</span><span style={{ fontFamily: 'monospace' }}>{subjectX}%</span>
            </div>
            <input type="range" min={5} max={95} value={subjectX} onChange={e => setSubjectX(Number(e.target.value))} style={{ width: '100%', accentColor: accent, cursor: 'pointer', height: 4 }} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: labelColor, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
              <span>Subject Y</span><span style={{ fontFamily: 'monospace' }}>{subjectY}%</span>
            </div>
            <input type="range" min={5} max={95} value={subjectY} onChange={e => setSubjectY(Number(e.target.value))} style={{ width: '100%', accentColor: accent, cursor: 'pointer', height: 4 }} />
          </div>
        </>
      )}
      {rule === 'lines' && (
        <div>
          <div style={{ fontSize: 9, color: labelColor, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Line convergence angle</span><span style={{ fontFamily: 'monospace' }}>{lineAngle}°</span>
          </div>
          <input type="range" min={20} max={80} value={lineAngle} onChange={e => setLineAngle(Number(e.target.value))} style={{ width: '100%', accentColor: accent, cursor: 'pointer', height: 4 }} />
        </div>
      )}
      {rule === 'golden' && (
        <div>
          <div style={{ fontSize: 9, color: labelColor, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Subject X (spiral focus)</span><span style={{ fontFamily: 'monospace' }}>{goldenX}%</span>
          </div>
          <input type="range" min={20} max={75} value={goldenX} onChange={e => setGoldenX(Number(e.target.value))} style={{ width: '100%', accentColor: accent, cursor: 'pointer', height: 4 }} />
        </div>
      )}
      {rule === 'framing' && (
        <div>
          <div style={{ fontSize: 9, color: labelColor, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Frame opening</span><span style={{ fontFamily: 'monospace' }}>{frameSize}%</span>
          </div>
          <input type="range" min={20} max={90} value={frameSize} onChange={e => setFrameSize(Number(e.target.value))} style={{ width: '100%', accentColor: accent, cursor: 'pointer', height: 4 }} />
        </div>
      )}
      {rule === 'symmetry' && (
        <div>
          <div style={{ fontSize: 9, color: labelColor, marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Symmetry axis offset</span><span style={{ fontFamily: 'monospace' }}>{symOffset}px {symOffset === 0 ? '(perfect)' : '(off-axis)'}</span>
          </div>
          <input type="range" min={-30} max={30} value={symOffset} onChange={e => setSymOffset(Number(e.target.value))} style={{ width: '100%', accentColor: accent, cursor: 'pointer', height: 4 }} />
        </div>
      )}
      {/* How It Works */}
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + border, color: textColor }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: labelColor, marginBottom: 3 }}>How It Works</div>
        {rule === 'thirds' && (
          <>
            <div>Step 1: Image divided into 9 equal cells (3×3 grid)</div>
            <div>Step 2: Subject at ({subjectX}%, {subjectY}%) — {subjectX < 40 ? 'left third' : subjectX > 60 ? 'right third' : 'middle column'}</div>
            <div>Step 3: 4 "power points" where lines intersect — these are the strongest placements</div>
            <div>Step 4: {subjectX % 33 < 5 && subjectY % 33 < 5 ? '✓ Subject near a power point — strong composition!' : 'Move subject to a power point (33% or 66%) for the rule'}</div>
            <div>Step 5: Avoid centering — off-center creates dynamic balance</div>
            <div>Step 6: Horizon on upper or lower third line — never through the middle</div>
          </>
        )}
        {rule === 'lines' && (
          <>
            <div>Step 1: Convergence angle: <b style={{ color: accent }}>{lineAngle}°</b></div>
            <div>Step 2: Lines all aim at one vanishing point — they "lead" the eye there</div>
            <div>Step 3: Place your subject AT the vanishing point for maximum impact</div>
            <div>Step 4: Common leading lines: roads, fences, rivers, hallways, shadows</div>
            <div>Step 5: Steeper angle ({lineAngle > 60 ? 'currently strong' : 'try 70°+'}) = more dramatic depth</div>
            <div>Step 6: Lines can also "lead away" to suggest a journey or story</div>
          </>
        )}
        {rule === 'golden' && (
          <>
            <div>Step 1: Golden ratio φ = 1.618... — found in shells, flowers, galaxies</div>
            <div>Step 2: Subject at x={goldenX}% (spiral focus point)</div>
            <div>Step 3: Spiral curves inward — eye follows it to the focal point</div>
            <div>Step 4: Rectangles subdivide by φ: 0.618 + 0.382 = 1</div>
            <div>Step 5: {Math.abs(goldenX - 62) < 5 ? '✓ Subject near golden focus (62%) — natural harmony' : 'Move subject to ~62% for the golden focus'}</div>
            <div>Step 6: Used by Renaissance masters and modern designers alike</div>
          </>
        )}
        {rule === 'framing' && (
          <>
            <div>Step 1: Frame opening: <b style={{ color: accent }}>{frameSize}%</b> from edges</div>
            <div>Step 2: Frame elements: archways, windows, tree branches, doorways</div>
            <div>Step 3: Frame adds depth — viewer looks "through" something</div>
            <div>Step 4: Smaller opening = more intimate / focused subject</div>
            <div>Step 5: Frame creates a "second border" — strengthens central subject</div>
            <div>Step 6: Dark frame around bright subject = high contrast, dramatic</div>
          </>
        )}
        {rule === 'symmetry' && (
          <>
            <div>Step 1: Axis offset: <b style={{ color: accent }}>{symOffset}px</b> {symOffset === 0 ? '(perfect symmetry)' : '(asymmetrical)'}</div>
            <div>Step 2: Symmetry creates calm, order, formality — perfect for architecture</div>
            <div>Step 3: Reflections (water, mirrors) double the impact</div>
            <div>Step 4: {symOffset === 0 ? 'Currently perfect — serene and balanced' : 'Even small asymmetry creates tension — use deliberately'}</div>
            <div>Step 5: Vertical axis (left-right) most common; horizontal for reflections</div>
            <div>Step 6: Breaking symmetry deliberately draws attention to the "break"</div>
          </>
        )}
      </div>
      <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Composition rules are not laws — they are tools. Each one manipulates how the eye moves through an image: thirds create balance, lines create depth, framing creates focus, symmetry creates calm, golden ratio creates harmony. The best photographers know the rules, then break them on purpose for effect.
      </div>
    </div>
  )
}