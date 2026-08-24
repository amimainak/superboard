'use client'

import { useState, useCallback, lazy, Suspense } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { generateId } from '@/lib/whiteboard/utils'
import { getDefaultWidgetConfig, getWidgetDefaultSize, WIDGET_KIND_LABELS } from '@/components/whiteboard/CanvasWidgets'
import type { WidgetElement } from '@/lib/whiteboard/types'

// Lazy-load each tool — only parsed when the grade tab renders it
const PunnettSquareLazy = lazy(() => import('./biology/BiologyUtilities').then(m => ({ default: m.PunnettSquareCalculator })))
const CellDiagramLazy = lazy(() => import('./biology/BiologyUtilities').then(m => ({ default: m.CellDiagramExplorer })))
const TaxonomyLazy = lazy(() => import('./biology/BiologyUtilities').then(m => ({ default: m.TaxonomyClassifier })))
const BodySystemsLazy = lazy(() => import('./biology/BiologyUtilities').then(m => ({ default: m.BodySystemsExplorer })))
const FoodWebLazy = lazy(() => import('./biology/BiologyUtilities').then(m => ({ default: m.EcologyFoodWeb })))
const DNAStructureLazy = lazy(() => import('./biology/BiologyUtilities').then(m => ({ default: m.DNAStructureViewer })))
const NaturalSelectionLazy = lazy(() => import('./biology/BiologyUtilities').then(m => ({ default: m.NaturalSelectionSim })))
const CellDivisionLazy = lazy(() => import('./biology/BiologyUtilities').then(m => ({ default: m.CellDivisionAnimator })))
const PhotoRespLazy = lazy(() => import('./biology/BiologyUtilities').then(m => ({ default: m.PhotosynthesisRespiration })))
const HumanBodyInterLazy = lazy(() => import('./biology/BiologyUtilities').then(m => ({ default: m.HumanBodyInteractive })))

// Stable wrapper components (no remount on re-render)
function PunnettSquarePanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><PunnettSquareLazy isDark={isDark} /></Suspense>
}
function CellDiagramPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><CellDiagramLazy isDark={isDark} /></Suspense>
}
function TaxonomyPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><TaxonomyLazy isDark={isDark} /></Suspense>
}
function BodySystemsPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><BodySystemsLazy isDark={isDark} /></Suspense>
}
function FoodWebPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><FoodWebLazy isDark={isDark} /></Suspense>
}
function DNAStructurePanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><DNAStructureLazy isDark={isDark} /></Suspense>
}
function NaturalSelectionPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><NaturalSelectionLazy isDark={isDark} /></Suspense>
}
function CellDivisionPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><CellDivisionLazy isDark={isDark} /></Suspense>
}
function PhotoRespPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><PhotoRespLazy isDark={isDark} /></Suspense>
}
function HumanBodyInterPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><HumanBodyInterLazy isDark={isDark} /></Suspense>
}

// ============================================================
// Types
// ============================================================

type GradeBand = 'all' | 'elementary' | 'middle' | 'highschool'

interface BiologyToolkitProps {
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

export function BiologyToolkit({ roomId: _roomId }: BiologyToolkitProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const addElement = useWhiteboardStore((s) => s.addElement)
  const camera = useWhiteboardStore((s) => s.camera)

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

  // Add to Board
  const addToBoard = useCallback((widgetKind: string) => {
    const size = getWidgetDefaultSize(widgetKind)
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    const cx = (vw / 2 - 80 - camera.x) / camera.zoom
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
    <div className="widget-content toolkit-biology" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
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
      {/* ALL TAB — all 10 tools */}
      {/* ============================================================ */}
      {activeBand === 'all' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Punnett Square Calculator', 'bio-punnett-square')}
            <div style={{ padding: '0 12px 12px' }}><PunnettSquarePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Cell Diagram Explorer', 'bio-cell-diagram')}
            <div style={{ padding: '0 12px 12px' }}><CellDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Taxonomy Classifier', 'bio-taxonomy')}
            <div style={{ padding: '0 12px 12px' }}><TaxonomyPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Body Systems Explorer', 'bio-body-systems')}
            <div style={{ padding: '0 12px 12px' }}><BodySystemsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Ecology Food Web', 'bio-food-web')}
            <div style={{ padding: '0 12px 12px' }}><FoodWebPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('DNA Structure Viewer', 'bio-dna-structure')}
            <div style={{ padding: '0 12px 12px' }}><DNAStructurePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Natural Selection Sim', 'bio-natural-selection')}
            <div style={{ padding: '0 12px 12px' }}><NaturalSelectionPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Cell Division Animator', 'bio-cell-division')}
            <div style={{ padding: '0 12px 12px' }}><CellDivisionPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Photosynthesis & Respiration', 'bio-photosynthesis-resp')}
            <div style={{ padding: '0 12px 12px' }}><PhotoRespPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Human Body Interactive', 'bio-human-body')}
            <div style={{ padding: '0 12px 12px' }}><HumanBodyInterPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* ELEMENTARY TAB (K-5) — Human Body Interactive only */}
      {/* ============================================================ */}
      {activeBand === 'elementary' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Human Body Interactive', 'bio-human-body')}
            <div style={{ padding: '0 12px 12px' }}><HumanBodyInterPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* MIDDLE SCHOOL TAB (6-8) — Cell, Taxonomy, Body Systems, Food Web */}
      {/* ============================================================ */}
      {activeBand === 'middle' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Cell Diagram Explorer', 'bio-cell-diagram')}
            <div style={{ padding: '0 12px 12px' }}><CellDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Taxonomy Classifier', 'bio-taxonomy')}
            <div style={{ padding: '0 12px 12px' }}><TaxonomyPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Body Systems Explorer', 'bio-body-systems')}
            <div style={{ padding: '0 12px 12px' }}><BodySystemsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Ecology Food Web', 'bio-food-web')}
            <div style={{ padding: '0 12px 12px' }}><FoodWebPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('DNA Structure Viewer', 'bio-dna-structure')}
            <div style={{ padding: '0 12px 12px' }}><DNAStructurePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Natural Selection Sim', 'bio-natural-selection')}
            <div style={{ padding: '0 12px 12px' }}><NaturalSelectionPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Cell Division Animator', 'bio-cell-division')}
            <div style={{ padding: '0 12px 12px' }}><CellDivisionPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Photosynthesis & Respiration', 'bio-photosynthesis-resp')}
            <div style={{ padding: '0 12px 12px' }}><PhotoRespPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Human Body Interactive', 'bio-human-body')}
            <div style={{ padding: '0 12px 12px' }}><HumanBodyInterPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* HIGH SCHOOL TAB (9-12) — ALL tools */}
      {/* ============================================================ */}
      {activeBand === 'highschool' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Punnett Square Calculator', 'bio-punnett-square')}
            <div style={{ padding: '0 12px 12px' }}><PunnettSquarePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Cell Diagram Explorer', 'bio-cell-diagram')}
            <div style={{ padding: '0 12px 12px' }}><CellDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Taxonomy Classifier', 'bio-taxonomy')}
            <div style={{ padding: '0 12px 12px' }}><TaxonomyPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Body Systems Explorer', 'bio-body-systems')}
            <div style={{ padding: '0 12px 12px' }}><BodySystemsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Ecology Food Web', 'bio-food-web')}
            <div style={{ padding: '0 12px 12px' }}><FoodWebPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('DNA Structure Viewer', 'bio-dna-structure')}
            <div style={{ padding: '0 12px 12px' }}><DNAStructurePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Natural Selection Sim', 'bio-natural-selection')}
            <div style={{ padding: '0 12px 12px' }}><NaturalSelectionPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Cell Division Animator', 'bio-cell-division')}
            <div style={{ padding: '0 12px 12px' }}><CellDivisionPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Photosynthesis & Respiration', 'bio-photosynthesis-resp')}
            <div style={{ padding: '0 12px 12px' }}><PhotoRespPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Human Body Interactive', 'bio-human-body')}
            <div style={{ padding: '0 12px 12px' }}><HumanBodyInterPanel isDark={isDark} /></div>
          </div>
        </>
      )}
    </div>
  )
}
