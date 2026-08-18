'use client'

import { useState, lazy, Suspense } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

// Lazy-load each tool — only parsed when the grade tab renders it
const PeriodicTableLazy = lazy(() => import('./chemistry/ChemistryUtilities').then(m => ({ default: m.PeriodicTableExplorer })))
const EquationBalancerLazy = lazy(() => import('./chemistry/ChemistryUtilities').then(m => ({ default: m.ChemicalEquationBalancer })))
const PhScaleLazy = lazy(() => import('./chemistry/ChemistryUtilities').then(m => ({ default: m.PhScaleVisualizer })))
const SciNotationLazy = lazy(() => import('./chemistry/ChemistryUtilities').then(m => ({ default: m.ScientificNotationConverter })))
const MolarMassLazy = lazy(() => import('./chemistry/ChemistryUtilities').then(m => ({ default: m.MolarMassCalculator })))

// Stable wrapper components (no remount on re-render)
function PeriodicTablePanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><PeriodicTableLazy isDark={isDark} /></Suspense>
}
function EquationBalancerPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><EquationBalancerLazy isDark={isDark} /></Suspense>
}
function PhScalePanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><PhScaleLazy isDark={isDark} /></Suspense>
}
function SciNotationPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><SciNotationLazy isDark={isDark} /></Suspense>
}
function MolarMassPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><MolarMassLazy isDark={isDark} /></Suspense>
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
      {/* ALL TAB — ALL 5 tools */}
      {/* ============================================================ */}
      {activeBand === 'all' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('pH Scale Visualizer')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Explore the pH scale from 0 to 14. Click the bar or examples to see acid/base classification and H+ concentration.</p>
            <div style={{ padding: '0 12px 12px' }}><PhScalePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Scientific Notation Converter')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Convert between standard and scientific notation. Perform arithmetic operations with step-by-step explanations.</p>
            <div style={{ padding: '0 12px 12px' }}><SciNotationPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Periodic Table Explorer')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Interactive periodic table with 118 elements. Click any element for details including electron configuration and common ion charges.</p>
            <div style={{ padding: '0 12px 12px' }}><PeriodicTablePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Chemical Equation Balancer')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Enter reactants and products to automatically balance chemical equations. Shows element counts before and after.</p>
            <div style={{ padding: '0 12px 12px' }}><EquationBalancerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Molar Mass Calculator')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Enter a chemical formula to calculate its molar mass. Supports parentheses and polyatomic groups.</p>
            <div style={{ padding: '0 12px 12px' }}><MolarMassPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* K-5 TAB — pH Scale Visualizer only */}
      {/* ============================================================ */}
      {activeBand === 'elementary' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('pH Scale Visualizer')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Explore acids and bases! Click the colorful bar to see if something is acidic, basic, or neutral.</p>
            <div style={{ padding: '0 12px 12px' }}><PhScalePanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 6-8 TAB — pH Scale + Scientific Notation + Periodic Table */}
      {/* ============================================================ */}
      {activeBand === 'middle' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('pH Scale Visualizer')}
            <div style={{ padding: '0 12px 12px' }}><PhScalePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Scientific Notation Converter')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Convert numbers to and from scientific notation. Great for working with very large or very small numbers in science.</p>
            <div style={{ padding: '0 12px 12px' }}><SciNotationPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Periodic Table Explorer')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Explore the elements! Click any element to learn about its properties, electron configuration, and common charges.</p>
            <div style={{ padding: '0 12px 12px' }}><PeriodicTablePanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 9-12 TAB — ALL 5 tools */}
      {/* ============================================================ */}
      {activeBand === 'highschool' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('pH Scale Visualizer')}
            <div style={{ padding: '0 12px 12px' }}><PhScalePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Scientific Notation Converter')}
            <div style={{ padding: '0 12px 12px' }}><SciNotationPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Periodic Table Explorer')}
            <div style={{ padding: '0 12px 12px' }}><PeriodicTablePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Chemical Equation Balancer')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Balance chemical reactions using coefficient search. Supports complex formulas with parentheses.</p>
            <div style={{ padding: '0 12px 12px' }}><EquationBalancerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Molar Mass Calculator')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Calculate molar mass from chemical formulas. Supports polyatomic ions and nested parentheses.</p>
            <div style={{ padding: '0 12px 12px' }}><MolarMassPanel isDark={isDark} /></div>
          </div>
        </>
      )}
    </div>
  )
}
