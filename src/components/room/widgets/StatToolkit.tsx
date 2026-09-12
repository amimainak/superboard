'use client'

import { useState, lazy, Suspense, useCallback, useRef } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { getDefaultWidgetConfig, getWidgetDefaultSize, WIDGET_KIND_LABELS } from '@/components/whiteboard/CanvasWidgets'
import { generateId } from '@/lib/whiteboard/utils'
import type { WidgetElement } from '@/lib/whiteboard/types'
import { WidgetSearchBar, FavoritesAndRecent } from './WidgetSearchBar'
import { useFavorites, useRecentWidgets } from './widgetFavorites'
import { WidgetLoadingSkeleton } from './shared/WidgetLoadingSkeleton'

// Lazy-load each tool — only parsed when the grade tab renders it
const DataTableLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.DataTable })))
const HistogramLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.HistogramBuilder })))
const BoxPlotLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.BoxPlotGenerator })))
const ScatterPlotLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.ScatterPlot })))
const NormalDistLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.NormalDist })))
const ProbabilitySimLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.ProbabilitySimulator })))
// K-5 widgets
const PictographLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.PictographBuilder })))
const BarGraphLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.BarGraphMaker })))
const LinePlotLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.LinePlotFractions })))
const TallyChartLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.TallyChartConverter })))
const MeanFairShareLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.MeanAsFairShare })))
const CustomSpinnerLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.CustomSpinner })))
// 6-8 widgets
const TwoWayTableLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.TwoWayTableBuilder })))
const TreeDiagramLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.TreeDiagramProbability })))
const SampleVsPopLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.SampleVsPopulationSim })))
const MisleadingGraphsLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.MisleadingGraphsGallery })))
// 9-12 widgets
const ConfidenceIntervalLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.ConfidenceIntervalBuilder })))
const HypothesisTestLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.HypothesisTestExplorer })))
const CLTDemoLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.CentralLimitTheoremDemo })))
const ChiSquareLazy = lazy(() => import('./stat/StatUtilities').then(m => ({ default: m.ChiSquareExplorer })))

// Stable wrapper components (no remount on re-render)
function DataTablePanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><DataTableLazy isDark={isDark} /></Suspense>
}
function HistogramPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><HistogramLazy isDark={isDark} /></Suspense>
}
function BoxPlotPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><BoxPlotLazy isDark={isDark} /></Suspense>
}
function ScatterPlotPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><ScatterPlotLazy isDark={isDark} /></Suspense>
}
function NormalDistPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><NormalDistLazy isDark={isDark} /></Suspense>
}
function ProbabilitySimPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><ProbabilitySimLazy isDark={isDark} /></Suspense>
}
// K-5 panels
function PictographPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><PictographLazy isDark={isDark} /></Suspense>
}
function BarGraphPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><BarGraphLazy isDark={isDark} /></Suspense>
}
function LinePlotPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><LinePlotLazy isDark={isDark} /></Suspense>
}
function TallyChartPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><TallyChartLazy isDark={isDark} /></Suspense>
}
function MeanFairSharePanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><MeanFairShareLazy isDark={isDark} /></Suspense>
}
function CustomSpinnerPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><CustomSpinnerLazy isDark={isDark} /></Suspense>
}
// 6-8 panels
function TwoWayTablePanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><TwoWayTableLazy isDark={isDark} /></Suspense>
}
function TreeDiagramPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><TreeDiagramLazy isDark={isDark} /></Suspense>
}
function SampleVsPopPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><SampleVsPopLazy isDark={isDark} /></Suspense>
}
function MisleadingGraphsPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><MisleadingGraphsLazy isDark={isDark} /></Suspense>
}
// 9-12 panels
function ConfidenceIntervalPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><ConfidenceIntervalLazy isDark={isDark} /></Suspense>
}
function HypothesisTestPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><HypothesisTestLazy isDark={isDark} /></Suspense>
}
function CLTDemoPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><CLTDemoLazy isDark={isDark} /></Suspense>
}
function ChiSquarePanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}><ChiSquareLazy isDark={isDark} /></Suspense>
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

  // ---- Fix #4/#6/#24/#25: search + favorites + recents ----
  const TOOLKIT_NAME = 'statistics'
  const containerRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { favorites, isFavorite, toggleFavorite } = useFavorites(TOOLKIT_NAME)
  const { recent, addRecent } = useRecentWidgets(TOOLKIT_NAME)

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

  // Wrap addToBoard so we also record the widget in the recents list (Fix #24)
  const handleAddToBoard = useCallback((widgetKind: string, title: string) => {
    addToBoard(widgetKind)
    addRecent({ id: widgetKind, title, toolkit: TOOLKIT_NAME })
  }, [addToBoard, addRecent])

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 12 }} data-search-title={text.toLowerCase()}>
      <div className={'toolkit-section-title' + (isDark ? '' : ' toolkit-section-title-light')}>{text}</div>
      {widgetKind && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => toggleFavorite({ id: widgetKind, title: text, toolkit: TOOLKIT_NAME })}
            style={{
              padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600,
              background: isFavorite(widgetKind) ? 'rgba(251,191,36,0.15)' : 'transparent',
              border: isFavorite(widgetKind) ? '1px solid rgba(251,191,36,0.3)' : '1px solid ' + dkBorder,
              color: isFavorite(widgetKind) ? '#fbbf24' : dkText,
              cursor: 'pointer', lineHeight: 1,
            }}
            title={isFavorite(widgetKind) ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={isFavorite(widgetKind) ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite(widgetKind) ? '⭐' : '☆'}
          </button>
          <button
            onClick={() => handleAddToBoard(widgetKind, text)}
            style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600,
              background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)',
              color: '#34d399', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
            title={'Place ' + (WIDGET_KIND_LABELS[widgetKind] || widgetKind) + ' on the board'}
          >
            + Add to Board
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div ref={containerRef} className="widget-content toolkit-stat" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
      {/* ---- Fix #24/#25: Favorites + Recently Used ---- */}
      <FavoritesAndRecent
        isDark={isDark}
        favorites={favorites}
        recent={recent}
        onSelect={(wk, title) => handleAddToBoard(wk, title)}
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

          {/* NEW K-5 Interactive Manipulatives */}
          <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            K-5 Interactive Manipulatives
          </div>
          <div className="toolkit-section">
            {sectionTitle('📊 Pictograph Builder', 'stat-pictograph')}
            <div style={{ padding: '0 12px 12px' }}><PictographPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('📈 Bar Graph Maker', 'stat-bar-graph')}
            <div style={{ padding: '0 12px 12px' }}><BarGraphPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('📍 Line Plot with Fractions', 'stat-line-plot')}
            <div style={{ padding: '0 12px 12px' }}><LinePlotPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('🤚 Tally Chart Converter', 'stat-tally')}
            <div style={{ padding: '0 12px 12px' }}><TallyChartPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('⚖️ Mean as Fair Share', 'stat-mean-fair')}
            <div style={{ padding: '0 12px 12px' }}><MeanFairSharePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('🎡 Custom Spinner', 'stat-spinner')}
            <div style={{ padding: '0 12px 12px' }}><CustomSpinnerPanel isDark={isDark} /></div>
          </div>

          {/* NEW 6-8 Interactive Manipulatives */}
          <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            6-8 Interactive Manipulatives
          </div>
          <div className="toolkit-section">
            {sectionTitle('📊 Two-Way Table Builder', 'stat-two-way-table')}
            <div style={{ padding: '0 12px 12px' }}><TwoWayTablePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('🌳 Tree Diagram & Probability', 'stat-tree-diagram')}
            <div style={{ padding: '0 12px 12px' }}><TreeDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('🎯 Sample vs Population', 'stat-sample-pop')}
            <div style={{ padding: '0 12px 12px' }}><SampleVsPopPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('⚠️ Misleading Graphs Gallery', 'stat-misleading-graphs')}
            <div style={{ padding: '0 12px 12px' }}><MisleadingGraphsPanel isDark={isDark} /></div>
          </div>

          {/* NEW 9-12 Interactive Manipulatives */}
          <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            9-12 Interactive Manipulatives
          </div>
          <div className="toolkit-section">
            {sectionTitle('📐 Confidence Interval Builder', 'stat-confidence-interval')}
            <div style={{ padding: '0 12px 12px' }}><ConfidenceIntervalPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('🧪 Hypothesis Test Explorer', 'stat-hypothesis-test')}
            <div style={{ padding: '0 12px 12px' }}><HypothesisTestPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('📊 Central Limit Theorem Demo', 'stat-clt-demo')}
            <div style={{ padding: '0 12px 12px' }}><CLTDemoPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('χ² Chi-Square Explorer', 'stat-chi-square')}
            <div style={{ padding: '0 12px 12px' }}><ChiSquarePanel isDark={isDark} /></div>
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

          {/* NEW K-5 Interactive Manipulatives */}
          <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Interactive Manipulatives
          </div>
          <div className="toolkit-section">
            {sectionTitle('📊 Pictograph Builder', 'stat-pictograph')}
            <div style={{ padding: '0 12px 12px' }}><PictographPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('📈 Bar Graph Maker', 'stat-bar-graph')}
            <div style={{ padding: '0 12px 12px' }}><BarGraphPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('📍 Line Plot with Fractions', 'stat-line-plot')}
            <div style={{ padding: '0 12px 12px' }}><LinePlotPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('🤚 Tally Chart Converter', 'stat-tally')}
            <div style={{ padding: '0 12px 12px' }}><TallyChartPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('⚖️ Mean as Fair Share', 'stat-mean-fair')}
            <div style={{ padding: '0 12px 12px' }}><MeanFairSharePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('🎡 Custom Spinner', 'stat-spinner')}
            <div style={{ padding: '0 12px 12px' }}><CustomSpinnerPanel isDark={isDark} /></div>
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

          {/* NEW 6-8 Interactive Manipulatives */}
          <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            6-8 Interactive Manipulatives
          </div>
          <div className="toolkit-section">
            {sectionTitle('📊 Two-Way Table Builder', 'stat-two-way-table')}
            <div style={{ padding: '0 12px 12px' }}><TwoWayTablePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('🌳 Tree Diagram & Probability', 'stat-tree-diagram')}
            <div style={{ padding: '0 12px 12px' }}><TreeDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('🎯 Sample vs Population', 'stat-sample-pop')}
            <div style={{ padding: '0 12px 12px' }}><SampleVsPopPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('⚠️ Misleading Graphs Gallery', 'stat-misleading-graphs')}
            <div style={{ padding: '0 12px 12px' }}><MisleadingGraphsPanel isDark={isDark} /></div>
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

          {/* NEW 9-12 Interactive Manipulatives */}
          <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            9-12 Interactive Manipulatives
          </div>
          <div className="toolkit-section">
            {sectionTitle('📐 Confidence Interval Builder', 'stat-confidence-interval')}
            <div style={{ padding: '0 12px 12px' }}><ConfidenceIntervalPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('🧪 Hypothesis Test Explorer', 'stat-hypothesis-test')}
            <div style={{ padding: '0 12px 12px' }}><HypothesisTestPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('📊 Central Limit Theorem Demo', 'stat-clt-demo')}
            <div style={{ padding: '0 12px 12px' }}><CLTDemoPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('χ² Chi-Square Explorer', 'stat-chi-square')}
            <div style={{ padding: '0 12px 12px' }}><ChiSquarePanel isDark={isDark} /></div>
          </div>
        </>
      )}
    </div>
  )
}
