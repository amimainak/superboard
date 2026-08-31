'use client'

import { useState, useCallback, lazy, Suspense } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { generateId } from '@/lib/whiteboard/utils'
import { getDefaultWidgetConfig, getWidgetDefaultSize, WIDGET_KIND_LABELS } from '@/components/whiteboard/CanvasWidgets'
import type { WidgetElement } from '@/lib/whiteboard/types'

// ============================================================
// Inline Arts Tools — self-contained, no modal dependency
// ============================================================

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

  const [activeBand, setActiveBand] = useState<GradeBand>('all')
  const [visibleBands, setVisibleBands] = useState<Set<GradeBand>>(new Set(['all', 'elementary', 'middle', 'highschool']))

  const toggleBand = (band: GradeBand) => {
    setVisibleBands(prev => {
      const next = new Set(prev)
      if (next.has(band)) next.delete(band)
      else next.add(band)
      return next
    })
  }

  // ---- Style helpers ----
  const dkBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const dkBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const dkText = isDark ? '#94a3b8' : '#475569'
  const actBg = 'rgba(139,92,246,0.15)'
  const actBorder = 'rgba(139,92,246,0.3)'
  const actText = '#a78bfa'

  const sectionTitle = (text: string) => (
    <div className={'toolkit-section-title' + (isDark ? '' : ' toolkit-section-title-light')}>{text}</div>
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
            {sectionTitle('Color Theory Explorer')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Explore color harmonies, HSL values, and value scales. Great for teaching color theory fundamentals.</p>
            <div style={{ padding: '0 12px 12px' }}><ColorTheoryInline isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Perspective Grid')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Create one-point perspective grids. Adjust vanishing point and line count for drawing exercises.</p>
            <div style={{ padding: '0 12px 12px' }}><PerspectiveGridInline isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Staff Notation Builder')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Build melodies on a treble clef staff. Click notes to add them to your composition.</p>
            <div style={{ padding: '0 12px 12px' }}><StaffNotationInline isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Artwork Comparison')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Compare two artworks using guided prompts for color, composition, texture, style, and meaning.</p>
            <div style={{ padding: '0 12px 12px' }}><ArtCompareInline isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* K-5 — Color Theory + Staff Notation */}
      {/* ============================================================ */}
      {activeBand === 'elementary' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Color Theory Explorer')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Learn about colors! Mix hues and see harmonies.</p>
            <div style={{ padding: '0 12px 12px' }}><ColorTheoryInline isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Staff Notation Builder')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Place notes on the staff to create simple melodies.</p>
            <div style={{ padding: '0 12px 12px' }}><StaffNotationInline isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 6-8 — All 4 */}
      {/* ============================================================ */}
      {activeBand === 'middle' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Color Theory Explorer')}
            <div style={{ padding: '0 12px 12px' }}><ColorTheoryInline isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Perspective Grid')}
            <div style={{ padding: '0 12px 12px' }}><PerspectiveGridInline isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Staff Notation Builder')}
            <div style={{ padding: '0 12px 12px' }}><StaffNotationInline isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Artwork Comparison')}
            <div style={{ padding: '0 12px 12px' }}><ArtCompareInline isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 9-12 — All 4 */}
      {/* ============================================================ */}
      {activeBand === 'highschool' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Color Theory Explorer')}
            <div style={{ padding: '0 12px 12px' }}><ColorTheoryInline isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Perspective Grid')}
            <div style={{ padding: '0 12px 12px' }}><PerspectiveGridInline isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Staff Notation Builder')}
            <div style={{ padding: '0 12px 12px' }}><StaffNotationInline isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Artwork Comparison')}
            <div style={{ padding: '0 12px 12px' }}><ArtCompareInline isDark={isDark} /></div>
          </div>
        </>
      )}
    </div>
  )
}