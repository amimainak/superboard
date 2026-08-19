'use client'

import { useState, lazy, Suspense, useCallback } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { getDefaultWidgetConfig, getWidgetDefaultSize, WIDGET_KIND_LABELS } from '@/components/whiteboard/CanvasWidgets'
import { generateId } from '@/lib/whiteboard/utils'
import type { WidgetElement } from '@/lib/whiteboard/types'

// Lazy-load each tool — only parsed when the grade tab renders it
const DataTableLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.DataTable })))
const HistogramLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.HistogramBuilder })))
const BoxPlotLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.BoxPlotGenerator })))
const ScatterPlotLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.ScatterPlot })))
const NormalDistLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.NormalDist })))
const ProbabilitySimLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.ProbabilitySimulator })))

// Stable wrapper components (no remount on re-render)
function DataTablePanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><DataTableLazy isDark={isDark} /></Suspense>
}
function HistogramPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><HistogramLazy isDark={isDark} /></Suspense>
}
function BoxPlotPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><BoxPlotLazy isDark={isDark} /></Suspense>
}
function ScatterPlotPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><ScatterPlotLazy isDark={isDark} /></Suspense>
}
function NormalDistPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><NormalDistLazy isDark={isDark} /></Suspense>
}
function ProbabilitySimPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><ProbabilitySimLazy isDark={isDark} /></Suspense>
}

// ============================================================
// Types
// ============================================================

type GradeBand = 'all' | 'elementary' | 'middle' | 'highschool'

interface StatToolkitProps {
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

export function StatToolkit({ roomId: _roomId }: StatToolkitProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const addElement = useWhiteboardStore((s) => s.addElement)
  const camera = useWhiteboardStore((s) => s.camera)

  const [activeBand, setActiveBand] = useState<GradeBand>('all')
  const [visibleBands, setVisibleBands] = useState<Set<GradeBand>>(new Set(['all', 'elementary', 'middle', 'highschool']))

  const addToBoard = useCallback((widgetKind: string) => {
    const size = getWidgetDefaultSize(widgetKind)
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    const cx = (vw / 2 - camera.x) / camera.zoom
    const cy = ((vh / 2 - 44) - camera.y) / camera.zoom
    const el: WidgetElement = {
      id: generateId(),
      type: 'widget',
      widgetKind,
      config: getDefaultWidgetConfig(widgetKind),
      x: cx - size.width / 2,
      y: cy - size.height / 2,
      width: size.width,
      height: size.height,
      rotation: 0,
      opacity: 1,
      strokeColor: isDark ? '#334155' : '#e2e8f0',
      fillColor: isDark ? '#0f172a' : '#ffffff',
      strokeWidth: 1,
      locked: false,
      pageIndex: 0,
    }
    addElement(el)
  }, [addElement, camera, isDark])

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

  const sectionTitle = (text: string, widgetKind?: string) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 12 }}>
      <div className={'toolkit-section-title' + (isDark ? '' : ' toolkit-section-title-light')}>{text}</div>
      {widgetKind && (
        <button
          onClick={() => addToBoard(widgetKind)}
          style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600,
            background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)',
            color: '#34d399', cursor: 'pointer', whiteSpace: 'nowrap',
          }}
          title={'Place ' + (WIDGET_KIND_LABELS[widgetKind] || widgetKind) + ' on the board'}
        >
          + Add to Board
        </button>
      )}
    </div>
  )

  return (
    <div className="widget-content toolkit-stat" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
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
      {/* ALL TAB */}
      {/* ============================================================ */}
      {activeBand === 'all' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Data Table & Summary Stats', 'stat-data-table')}
            <div style={{ padding: '0 12px 12px' }}><DataTablePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Histogram', 'stat-histogram')}
            <div style={{ padding: '0 12px 12px' }}><HistogramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Box & Whisker Plot', 'stat-box-plot')}
            <div style={{ padding: '0 12px 12px' }}><BoxPlotPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Scatter Plot & Regression', 'stat-scatter')}
            <div style={{ padding: '0 12px 12px' }}><ScatterPlotPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Normal Distribution', 'stat-normal-dist')}
            <div style={{ padding: '0 12px 12px' }}><NormalDistPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Probability Simulator', 'stat-probability')}
            <div style={{ padding: '0 12px 12px' }}><ProbabilitySimPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* ELEMENTARY TAB (K-5) */}
      {/* ============================================================ */}
      {activeBand === 'elementary' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Probability Simulator', 'stat-probability')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Flip coins, roll dice, or spin to explore chance. Great for introducing probability concepts.</p>
            <div style={{ padding: '0 12px 12px' }}><ProbabilitySimPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* MIDDLE SCHOOL TAB (6-8) */}
      {/* ============================================================ */}
      {activeBand === 'middle' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Data Table & Summary Stats', 'stat-data-table')}
            <div style={{ padding: '0 12px 12px' }}><DataTablePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Histogram', 'stat-histogram')}
            <div style={{ padding: '0 12px 12px' }}><HistogramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Box & Whisker Plot', 'stat-box-plot')}
            <div style={{ padding: '0 12px 12px' }}><BoxPlotPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Probability Simulator', 'stat-probability')}
            <div style={{ padding: '0 12px 12px' }}><ProbabilitySimPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* HIGH SCHOOL TAB (9-12) */}
      {/* ============================================================ */}
      {activeBand === 'highschool' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Data Table & Summary Stats', 'stat-data-table')}
            <div style={{ padding: '0 12px 12px' }}><DataTablePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Histogram', 'stat-histogram')}
            <div style={{ padding: '0 12px 12px' }}><HistogramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Box & Whisker Plot', 'stat-box-plot')}
            <div style={{ padding: '0 12px 12px' }}><BoxPlotPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Scatter Plot & Regression', 'stat-scatter')}
            <div style={{ padding: '0 12px 12px' }}><ScatterPlotPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Normal Distribution', 'stat-normal-dist')}
            <div style={{ padding: '0 12px 12px' }}><NormalDistPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Probability Simulator', 'stat-probability')}
            <div style={{ padding: '0 12px 12px' }}><ProbabilitySimPanel isDark={isDark} /></div>
          </div>
        </>
      )}
    </div>
  )
}
