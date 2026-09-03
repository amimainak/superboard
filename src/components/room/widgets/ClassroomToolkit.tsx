'use client'

import { useState, useCallback, lazy, Suspense } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { generateId } from '@/lib/whiteboard/utils'
import { getDefaultWidgetConfig, getWidgetDefaultSize } from '@/components/whiteboard/CanvasWidgets'
import type { WidgetElement } from '@/lib/whiteboard/types'
import { useShallow } from 'zustand/react/shallow'

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
  const addElement = useWhiteboardStore((s) => s.addElement)
  const camera = useWhiteboardStore(useShallow((s) => s.camera))
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

  // Add to Board
  const addToBoard = useCallback((widgetKind: string, overrides?: Record<string, unknown>) => {
    const size = getWidgetDefaultSize(widgetKind)
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    const cx = ((vw / 2) - 80 - camera.x) / camera.zoom
    const cy = ((vh / 2 - 44) - camera.y) / camera.zoom
    const el: WidgetElement = {
      id: generateId(), type: 'widget', widgetKind,
      config: { ...getDefaultWidgetConfig(widgetKind), ...overrides },
      x: cx - size.width / 2, y: cy - size.height / 2,
      width: size.width, height: size.height,
      rotation: 0, opacity: 1,
      strokeColor: isDark ? '#334155' : '#e2e8f0',
      fillColor: isDark ? '#0f172a' : '#ffffff',
      strokeWidth: 1, locked: false, pageIndex: currentPageIndex,
    }
    addElement(el)
  }, [addElement, camera, isDark, currentPageIndex])

  // ---- Style helpers ----
  const dkBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const dkBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const dkText = isDark ? '#94a3b8' : '#475569'
  const actBg = 'rgba(5,150,105,0.15)'
  const actBorder = 'rgba(5,150,105,0.3)'
  const actText = '#34d399'
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
    <button onClick={() => addToBoard(widgetKind)} className="toolkit-add-to-board-btn" style={{ padding: '5px 14px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: addBg, border: '1px solid ' + addBorder, color: addText, cursor: 'pointer', alignSelf: 'flex-end', flexShrink: 0 }}>+ Board</button>
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
            {sectionTitle('Timer / Stopwatch (K-12)', 'all-timer')}
            {!collapsedSections.has('all-timer') && <>
              <div style={{ padding: '0 12px 8px' }}><TimerStopwatchPanel isDark={isDark} /></div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('classroom-timer')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Interactive Graphing Tool (6-12)', 'all-graphing')}
            {!collapsedSections.has('all-graphing') && <>
              <div style={{ padding: '0 12px 8px' }}><GraphingToolPanel isDark={isDark} /></div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('classroom-graphing')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Random Student Picker (K-12)', 'all-picker')}
            {!collapsedSections.has('all-picker') && <>
              <div style={{ padding: '0 12px 8px' }}><StudentPickerPanel isDark={isDark} /></div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('classroom-random-picker')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Interactive Quiz (L3)', 'all-quiz')}
            {!collapsedSections.has('all-quiz') && (
              <div style={{ padding: '0 12px 12px' }}>
                <div style={{ fontSize: 11, color: dkText, marginBottom: 6, lineHeight: 1.4 }}>Create MC, True/False, and short answer quizzes. Students take them directly on the board.</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('classroom-quiz')}</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* ELEMENTARY TAB (K-5) — Timer, Random Picker, Quiz */}
      {/* ============================================================ */}
      {activeBand === 'elementary' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Timer / Stopwatch', 'k5-timer')}
            {!collapsedSections.has('k5-timer') && <>
              <div style={{ padding: '0 12px 8px' }}><TimerStopwatchPanel isDark={isDark} /></div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('classroom-timer')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Random Student Picker', 'k5-picker')}
            {!collapsedSections.has('k5-picker') && <>
              <div style={{ padding: '0 12px 8px' }}><StudentPickerPanel isDark={isDark} /></div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('classroom-random-picker')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Interactive Quiz (L3)', 'k5-quiz')}
            {!collapsedSections.has('k5-quiz') && (
              <div style={{ padding: '0 12px 12px' }}>
                <div style={{ fontSize: 11, color: dkText, marginBottom: 6, lineHeight: 1.4 }}>Create and take quizzes directly on the board.</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('classroom-quiz')}</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* MIDDLE SCHOOL TAB (6-8) — Timer, Graphing, Picker, Quiz */}
      {/* ============================================================ */}
      {activeBand === 'middle' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Timer / Stopwatch', '68-timer')}
            {!collapsedSections.has('68-timer') && <>
              <div style={{ padding: '0 12px 8px' }}><TimerStopwatchPanel isDark={isDark} /></div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('classroom-timer')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Interactive Graphing Tool', '68-graphing')}
            {!collapsedSections.has('68-graphing') && <>
              <div style={{ padding: '0 12px 8px' }}><GraphingToolPanel isDark={isDark} /></div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('classroom-graphing')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Random Student Picker', '68-picker')}
            {!collapsedSections.has('68-picker') && <>
              <div style={{ padding: '0 12px 8px' }}><StudentPickerPanel isDark={isDark} /></div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('classroom-random-picker')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Interactive Quiz (L3)', '68-quiz')}
            {!collapsedSections.has('68-quiz') && (
              <div style={{ padding: '0 12px 12px' }}>
                <div style={{ fontSize: 11, color: dkText, marginBottom: 6, lineHeight: 1.4 }}>Create and take quizzes directly on the board.</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('classroom-quiz')}</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* HIGH SCHOOL TAB (9-12) — Timer, Graphing, Picker, Quiz */}
      {/* ============================================================ */}
      {activeBand === 'highschool' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Timer / Stopwatch', '912-timer')}
            {!collapsedSections.has('912-timer') && <>
              <div style={{ padding: '0 12px 8px' }}><TimerStopwatchPanel isDark={isDark} /></div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('classroom-timer')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Interactive Graphing Tool', '912-graphing')}
            {!collapsedSections.has('912-graphing') && <>
              <div style={{ padding: '0 12px 8px' }}><GraphingToolPanel isDark={isDark} /></div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('classroom-graphing')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Random Student Picker', '912-picker')}
            {!collapsedSections.has('912-picker') && <>
              <div style={{ padding: '0 12px 8px' }}><StudentPickerPanel isDark={isDark} /></div>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('classroom-random-picker')}</div>
            </>}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Interactive Quiz (L3)', '912-quiz')}
            {!collapsedSections.has('912-quiz') && (
              <div style={{ padding: '0 12px 12px' }}>
                <div style={{ fontSize: 11, color: dkText, marginBottom: 6, lineHeight: 1.4 }}>Create and take quizzes directly on the board.</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{addBoardBtn('classroom-quiz')}</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}