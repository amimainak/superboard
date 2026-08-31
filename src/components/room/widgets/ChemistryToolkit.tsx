'use client'

import { useState, useCallback, lazy, Suspense } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { generateId } from '@/lib/whiteboard/utils'
import { getDefaultWidgetConfig, getWidgetDefaultSize, WIDGET_KIND_LABELS } from '@/components/whiteboard/CanvasWidgets'
import type { WidgetElement } from '@/lib/whiteboard/types'

// Lazy-load each tool — only parsed when the grade tab renders it
const PeriodicTableLazy = lazy(() => import('./chemistry/ChemistryUtilities').then(m => ({ default: m.PeriodicTableExplorer })))
const EquationBalancerLazy = lazy(() => import('./chemistry/ChemistryUtilities').then(m => ({ default: m.ChemicalEquationBalancer })))
const PhScaleLazy = lazy(() => import('./chemistry/ChemistryUtilities').then(m => ({ default: m.PhScaleVisualizer })))
const SciNotationLazy = lazy(() => import('./chemistry/ChemistryUtilities').then(m => ({ default: m.ScientificNotationConverter })))
const MolarMassLazy = lazy(() => import('./chemistry/ChemistryUtilities').then(m => ({ default: m.MolarMassCalculator })))
const LewisDotLazy = lazy(() => import('./chemistry/ChemistryUtilities').then(m => ({ default: m.LewisDotStructureBuilder })))
const VSEPRLazy = lazy(() => import('./chemistry/ChemistryUtilities').then(m => ({ default: m.MolecularGeometryVSEPR })))
const GasLawsLazy = lazy(() => import('./chemistry/ChemistryUtilities').then(m => ({ default: m.GasLawsSimulator })))
const TitrationLazy = lazy(() => import('./chemistry/ChemistryUtilities').then(m => ({ default: m.AcidBaseTitration })))
const IonFormationLazy = lazy(() => import('./chemistry/ChemistryUtilities').then(m => ({ default: m.IonFormationVisualizer })))

// Stable wrapper components (no remount on re-render)
function PeriodicTablePanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><PeriodicTableLazy isDark={isDark} /></Suspense>
}
function EquationBalancerPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><EquationBalancerLazy isDark={isDark} /></Suspense>
}
function PhScalePanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><PhScaleLazy isDark={isDark} /></Suspense>
}
function SciNotationPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><SciNotationLazy isDark={isDark} /></Suspense>
}
function MolarMassPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><MolarMassLazy isDark={isDark} /></Suspense>
}
function LewisDotPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><LewisDotLazy isDark={isDark} /></Suspense>
}
function VSEPRPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><VSEPRLazy isDark={isDark} /></Suspense>
}
function GasLawsPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><GasLawsLazy isDark={isDark} /></Suspense>
}
function TitrationPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><TitrationLazy isDark={isDark} /></Suspense>
}
function IonFormationPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><IonFormationLazy isDark={isDark} /></Suspense>
}


// Loading skeleton shown while lazy-loaded tools are loading
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

// ============================================================
// Types
// ============================================================

type GradeBand = 'all' | 'elementary' | 'middle' | 'highschool'

interface ChemistryToolkitProps {
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

export function ChemistryToolkit({ roomId: _roomId }: ChemistryToolkitProps) {
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
    <div className="widget-content toolkit-chemistry" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
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
      {/* ALL TAB — ALL 10 tools */}
      {/* ============================================================ */}
      {activeBand === 'all' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('pH Scale Visualizer', 'chem-ph-scale')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Explore the pH scale from 0 to 14. Click the bar or examples to see acid/base classification and H+ concentration.</p>
            <div style={{ padding: '0 12px 12px' }}><PhScalePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Scientific Notation Converter', 'chem-sci-notation')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Convert between standard and scientific notation. Perform arithmetic operations with step-by-step explanations.</p>
            <div style={{ padding: '0 12px 12px' }}><SciNotationPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Periodic Table Explorer', 'chem-periodic-table')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Interactive periodic table with 118 elements. Click any element for details including electron configuration and common ion charges.</p>
            <div style={{ padding: '0 12px 12px' }}><PeriodicTablePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Chemical Equation Balancer', 'chem-equation-balancer')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Enter reactants and products to automatically balance chemical equations. Shows element counts before and after.</p>
            <div style={{ padding: '0 12px 12px' }}><EquationBalancerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Molar Mass Calculator', 'chem-molar-mass')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Enter a chemical formula to calculate its molar mass. Supports parentheses and polyatomic groups.</p>
            <div style={{ padding: '0 12px 12px' }}><MolarMassPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Lewis Dot Structure Builder', 'chem-lewis-dot')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Build Lewis dot structures for atoms and common molecules. See valence electrons, bonds, and lone pairs.</p>
            <div style={{ padding: '0 12px 12px' }}><LewisDotPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Molecular Geometry (VSEPR)', 'chem-vsepr')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Explore molecular shapes using VSEPR theory. See bond angles, hybridization, and polarity for common molecules.</p>
            <div style={{ padding: '0 12px 12px' }}><VSEPRPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Gas Laws Simulator', 'chem-gas-laws')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Simulate PV=nRT. Lock 3 variables and adjust the 4th. Includes Boyle's and Charles's Law demos.</p>
            <div style={{ padding: '0 12px 12px' }}><GasLawsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Acid-Base Titration', 'chem-titration')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Perform a virtual titration. Add base in increments and watch the pH curve and solution color change.</p>
            <div style={{ padding: '0 12px 12px' }}><TitrationPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Ion Formation Visualizer', 'chem-ion-formation')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>See how atoms gain or lose electrons to form ions. View electron shells before and after ionization.</p>
            <div style={{ padding: '0 12px 12px' }}><IonFormationPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* K-5 TAB — pH Scale + Ion Formation */}
      {/* ============================================================ */}
      {activeBand === 'elementary' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('pH Scale Visualizer', 'chem-ph-scale')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Explore acids and bases! Click the colorful bar to see if something is acidic, basic, or neutral.</p>
            <div style={{ padding: '0 12px 12px' }}><PhScalePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Ion Formation Visualizer', 'chem-ion-formation')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Watch atoms gain or lose electrons to become ions! Pick an element and see the transformation.</p>
            <div style={{ padding: '0 12px 12px' }}><IonFormationPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 6-8 TAB — pH + SciNotation + PeriodicTable + Ion + Lewis + VSEPR */}
      {/* ============================================================ */}
      {activeBand === 'middle' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('pH Scale Visualizer', 'chem-ph-scale')}
            <div style={{ padding: '0 12px 12px' }}><PhScalePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Scientific Notation Converter', 'chem-sci-notation')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Convert numbers to and from scientific notation. Great for working with very large or very small numbers in science.</p>
            <div style={{ padding: '0 12px 12px' }}><SciNotationPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Periodic Table Explorer', 'chem-periodic-table')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Explore the elements! Click any element to learn about its properties, electron configuration, and common charges.</p>
            <div style={{ padding: '0 12px 12px' }}><PeriodicTablePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Ion Formation Visualizer', 'chem-ion-formation')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>See how atoms gain or lose electrons to form ions. View electron shells before and after ionization.</p>
            <div style={{ padding: '0 12px 12px' }}><IonFormationPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Lewis Dot Structure Builder', 'chem-lewis-dot')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Build Lewis dot structures for atoms and molecules. See valence electrons, bonds, and lone pairs.</p>
            <div style={{ padding: '0 12px 12px' }}><LewisDotPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Molecular Geometry (VSEPR)', 'chem-vsepr')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Explore 3D molecular shapes using VSEPR theory. See bond angles and polarity.</p>
            <div style={{ padding: '0 12px 12px' }}><VSEPRPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 9-12 TAB — ALL 10 tools */}
      {/* ============================================================ */}
      {activeBand === 'highschool' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('pH Scale Visualizer', 'chem-ph-scale')}
            <div style={{ padding: '0 12px 12px' }}><PhScalePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Scientific Notation Converter', 'chem-sci-notation')}
            <div style={{ padding: '0 12px 12px' }}><SciNotationPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Periodic Table Explorer', 'chem-periodic-table')}
            <div style={{ padding: '0 12px 12px' }}><PeriodicTablePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Chemical Equation Balancer', 'chem-equation-balancer')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Balance chemical reactions using coefficient search. Supports complex formulas with parentheses.</p>
            <div style={{ padding: '0 12px 12px' }}><EquationBalancerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Molar Mass Calculator', 'chem-molar-mass')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Calculate molar mass from chemical formulas. Supports polyatomic ions and nested parentheses.</p>
            <div style={{ padding: '0 12px 12px' }}><MolarMassPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Lewis Dot Structure Builder', 'chem-lewis-dot')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Build Lewis dot structures for atoms and molecules. See valence electrons, bonds, and lone pairs.</p>
            <div style={{ padding: '0 12px 12px' }}><LewisDotPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Molecular Geometry (VSEPR)', 'chem-vsepr')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Explore molecular shapes using VSEPR theory. See bond angles, hybridization, and polarity.</p>
            <div style={{ padding: '0 12px 12px' }}><VSEPRPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Gas Laws Simulator', 'chem-gas-laws')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Simulate PV=nRT with interactive sliders and piston visualization. Includes Boyle's and Charles's Law demos.</p>
            <div style={{ padding: '0 12px 12px' }}><GasLawsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Acid-Base Titration', 'chem-titration')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Perform a virtual titration. Add base incrementally and watch the pH curve and solution color change.</p>
            <div style={{ padding: '0 12px 12px' }}><TitrationPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Ion Formation Visualizer', 'chem-ion-formation')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>See how atoms gain or lose electrons to form ions. View electron shells before and after.</p>
            <div style={{ padding: '0 12px 12px' }}><IonFormationPanel isDark={isDark} /></div>
          </div>
        </>
      )}
    </div>
  )
}
