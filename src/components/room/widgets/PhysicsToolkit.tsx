'use client'

import { useState, lazy, Suspense } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

// Lazy-load each tool — only parsed when the grade tab renders it
const FormulaCalcLazy = lazy(() => import('./physics/PhysicsUtilities').then(m => ({ default: m.PhysicsFormulaCalculator })))
const WaveSimLazy = lazy(() => import('./physics/PhysicsUtilities').then(m => ({ default: m.WaveSimulator })))
const PendulumSimLazy = lazy(() => import('./physics/PhysicsUtilities').then(m => ({ default: m.PendulumSimulator })))
const ConverterLazy = lazy(() => import('./physics/PhysicsUtilities').then(m => ({ default: m.ScienceUnitConverter })))
const ProjectileLazy = lazy(() => import('./physics/PhysicsUtilities').then(m => ({ default: m.ProjectileMotionSimulator })))
const OhmsLawLazy = lazy(() => import('./physics/PhysicsUtilities').then(m => ({ default: m.OhmsLawCalculator })))
const CircuitDiagramLazy = lazy(() => import('./physics/PhysicsUtilities').then(m => ({ default: m.CircuitDiagramBuilder })))
const FreeBodyDiagramLazy = lazy(() => import('./physics/PhysicsUtilities').then(m => ({ default: m.FreeBodyDiagramBuilder })))
const RayDiagramLazy = lazy(() => import('./physics/PhysicsUtilities').then(m => ({ default: m.RayDiagramOptics })))
const EnergyBarChartsLazy = lazy(() => import('./physics/PhysicsUtilities').then(m => ({ default: m.EnergyBarCharts })))
const InteractiveGraphingLazy = lazy(() => import('./physics/PhysicsUtilities').then(m => ({ default: m.InteractiveGraphingTool })))

// Stable wrapper components (no remount on re-render)
function FormulaCalcPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><FormulaCalcLazy isDark={isDark} /></Suspense>
}
function WaveSimPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><WaveSimLazy isDark={isDark} /></Suspense>
}
function PendulumSimPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><PendulumSimLazy isDark={isDark} /></Suspense>
}
function ConverterPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><ConverterLazy isDark={isDark} /></Suspense>
}
function ProjectilePanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><ProjectileLazy isDark={isDark} /></Suspense>
}
function OhmsLawPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><OhmsLawLazy isDark={isDark} /></Suspense>
}
function CircuitDiagramPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><CircuitDiagramLazy isDark={isDark} /></Suspense>
}
function FreeBodyDiagramPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><FreeBodyDiagramLazy isDark={isDark} /></Suspense>
}
function RayDiagramPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><RayDiagramLazy isDark={isDark} /></Suspense>
}
function EnergyBarChartsPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><EnergyBarChartsLazy isDark={isDark} /></Suspense>
}
function InteractiveGraphingPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><InteractiveGraphingLazy isDark={isDark} /></Suspense>
}

// ============================================================
// Types
// ============================================================

type GradeBand = 'all' | 'elementary' | 'middle' | 'highschool'

interface PhysicsToolkitProps {
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

export function PhysicsToolkit({ roomId: _roomId }: PhysicsToolkitProps) {
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
    <div className="widget-content toolkit-physics" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
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
            {sectionTitle('Physics Formula Calculator')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Select a formula, choose which variable to solve for, enter the known values, and calculate.</p>
            <div style={{ padding: '0 12px 12px' }}><FormulaCalcPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Wave Simulator')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Explore transverse waves with adjustable frequency, amplitude, and wavelength.</p>
            <div style={{ padding: '0 12px 12px' }}><WaveSimPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Pendulum Simulator')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Watch a pendulum swing using real physics. Adjust length, gravity, and starting angle.</p>
            <div style={{ padding: '0 12px 12px' }}><PendulumSimPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Science Unit Converter')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Convert between physics units: force, energy, power, pressure, temperature, speed.</p>
            <div style={{ padding: '0 12px 12px' }}><ConverterPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Projectile Motion Simulator')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Launch a projectile and watch its parabolic trajectory with real kinematic equations.</p>
            <div style={{ padding: '0 12px 12px' }}><ProjectilePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle("Ohm's Law Calculator")}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Enter any two of voltage, current, and resistance to auto-calculate the third.</p>
            <div style={{ padding: '0 12px 12px' }}><OhmsLawPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Circuit Diagram Builder')}
            <div style={{ padding: '0 12px 12px' }}><CircuitDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Free Body Diagram Builder')}
            <div style={{ padding: '0 12px 12px' }}><FreeBodyDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Ray Diagram Optics')}
            <div style={{ padding: '0 12px 12px' }}><RayDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Energy Bar Charts (LOL)')}
            <div style={{ padding: '0 12px 12px' }}><EnergyBarChartsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Interactive Graphing Tool')}
            <div style={{ padding: '0 12px 12px' }}><InteractiveGraphingPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* ELEMENTARY TAB (K-5) */}
      {/* ============================================================ */}
      {activeBand === 'elementary' && (
        <>
          <div className="toolkit-section">
            {sectionTitle("Ohm's Law Calculator")}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>A simple introduction to the relationship between voltage, current, and resistance.</p>
            <div style={{ padding: '0 12px 12px' }}><OhmsLawPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* MIDDLE SCHOOL TAB (6-8) */}
      {/* ============================================================ */}
      {activeBand === 'middle' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Physics Formula Calculator')}
            <div style={{ padding: '0 12px 12px' }}><FormulaCalcPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Wave Simulator')}
            <div style={{ padding: '0 12px 12px' }}><WaveSimPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Pendulum Simulator')}
            <div style={{ padding: '0 12px 12px' }}><PendulumSimPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Science Unit Converter')}
            <div style={{ padding: '0 12px 12px' }}><ConverterPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle("Ohm's Law Calculator")}
            <div style={{ padding: '0 12px 12px' }}><OhmsLawPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Circuit Diagram Builder')}
            <div style={{ padding: '0 12px 12px' }}><CircuitDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Free Body Diagram Builder')}
            <div style={{ padding: '0 12px 12px' }}><FreeBodyDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Energy Bar Charts (LOL)')}
            <div style={{ padding: '0 12px 12px' }}><EnergyBarChartsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Interactive Graphing Tool')}
            <div style={{ padding: '0 12px 12px' }}><InteractiveGraphingPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* HIGH SCHOOL TAB (9-12) */}
      {/* ============================================================ */}
      {activeBand === 'highschool' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Physics Formula Calculator')}
            <div style={{ padding: '0 12px 12px' }}><FormulaCalcPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Wave Simulator')}
            <div style={{ padding: '0 12px 12px' }}><WaveSimPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Pendulum Simulator')}
            <div style={{ padding: '0 12px 12px' }}><PendulumSimPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Science Unit Converter')}
            <div style={{ padding: '0 12px 12px' }}><ConverterPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Projectile Motion Simulator')}
            <div style={{ padding: '0 12px 12px' }}><ProjectilePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle("Ohm's Law Calculator")}
            <div style={{ padding: '0 12px 12px' }}><OhmsLawPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Circuit Diagram Builder')}
            <div style={{ padding: '0 12px 12px' }}><CircuitDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Free Body Diagram Builder')}
            <div style={{ padding: '0 12px 12px' }}><FreeBodyDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Ray Diagram Optics')}
            <div style={{ padding: '0 12px 12px' }}><RayDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Energy Bar Charts (LOL)')}
            <div style={{ padding: '0 12px 12px' }}><EnergyBarChartsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Interactive Graphing Tool')}
            <div style={{ padding: '0 12px 12px' }}><InteractiveGraphingPanel isDark={isDark} /></div>
          </div>
        </>
      )}
    </div>
  )
}