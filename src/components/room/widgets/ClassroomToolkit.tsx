'use client'

import { useState, lazy, Suspense } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

// Lazy-load panel utilities — only parsed when the grade tab renders them
const TimerStopwatchLazy = lazy(() => import('./classroom/ClassroomUtilities').then(m => ({ default: m.TimerStopwatch })))
const GraphingToolLazy = lazy(() => import('./classroom/ClassroomUtilities').then(m => ({ default: m.InteractiveGraphingTool })))
const StudentPickerLazy = lazy(() => import('./classroom/ClassroomUtilities').then(m => ({ default: m.RandomStudentPicker })))

// Stable wrapper components (no remount on re-render)
function TimerStopwatchPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><TimerStopwatchLazy isDark={isDark} /></Suspense>
}
function GraphingToolPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><GraphingToolLazy isDark={isDark} /></Suspense>
}
function StudentPickerPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><StudentPickerLazy isDark={isDark} /></Suspense>
}

// ============================================================
// Types
// ============================================================

type GradeBand = 'all' | 'elementary' | 'middle' | 'highschool'

interface ClassroomToolkitProps {
  roomId: string
}

const GRADE_BANDS: { id: GradeBand; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '!' },
  { id: 'elementary', label: 'K-5', icon: '*' },
  { id: 'middle', label: '6-8', icon: '^' },
  { id: 'highschool', label: '9-12', icon: '#' },
]

// ============================================================
// Component
// ============================================================

export function ClassroomToolkit({ roomId: _roomId }: ClassroomToolkitProps) {
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
  const actBg = 'rgba(5,150,105,0.15)'
  const actBorder = 'rgba(5,150,105,0.3)'
  const actText = '#34d399'

  const sectionTitle = (text: string) => (
    <div className={'toolkit-section-title' + (isDark ? '' : ' toolkit-section-title-light')}>{text}</div>
  )

  return (
    <div className="widget-content toolkit-classroom" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
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
      {/* ALL TAB — all 3 tools */}
      {/* ============================================================ */}
      {activeBand === 'all' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Timer / Stopwatch (K-12)')}
            <div style={{ padding: '0 12px 12px' }}><TimerStopwatchPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Interactive Graphing Tool (6-12)')}
            <div style={{ padding: '0 12px 12px' }}><GraphingToolPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Random Student Picker (K-12)')}
            <div style={{ padding: '0 12px 12px' }}><StudentPickerPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* ELEMENTARY TAB (K-5) — Timer, Random Picker */}
      {/* ============================================================ */}
      {activeBand === 'elementary' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Timer / Stopwatch')}
            <div style={{ padding: '0 12px 12px' }}><TimerStopwatchPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Random Student Picker')}
            <div style={{ padding: '0 12px 12px' }}><StudentPickerPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* MIDDLE SCHOOL TAB (6-8) — all 3 tools */}
      {/* ============================================================ */}
      {activeBand === 'middle' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Timer / Stopwatch')}
            <div style={{ padding: '0 12px 12px' }}><TimerStopwatchPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Interactive Graphing Tool')}
            <div style={{ padding: '0 12px 12px' }}><GraphingToolPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Random Student Picker')}
            <div style={{ padding: '0 12px 12px' }}><StudentPickerPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* HIGH SCHOOL TAB (9-12) — all 3 tools */}
      {/* ============================================================ */}
      {activeBand === 'highschool' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Timer / Stopwatch')}
            <div style={{ padding: '0 12px 12px' }}><TimerStopwatchPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Interactive Graphing Tool')}
            <div style={{ padding: '0 12px 12px' }}><GraphingToolPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Random Student Picker')}
            <div style={{ padding: '0 12px 12px' }}><StudentPickerPanel isDark={isDark} /></div>
          </div>
        </>
      )}
    </div>
  )
}