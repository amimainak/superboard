'use client'

import { useState, useCallback, lazy, Suspense } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { generateId } from '@/lib/whiteboard/utils'
import { getDefaultWidgetConfig, getWidgetDefaultSize, WIDGET_KIND_LABELS } from '@/components/whiteboard/CanvasWidgets'
import type { WidgetElement } from '@/lib/whiteboard/types'

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
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><FormulaCalcLazy isDark={isDark} /></Suspense>
}
function WaveSimPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><WaveSimLazy isDark={isDark} /></Suspense>
}
function PendulumSimPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><PendulumSimLazy isDark={isDark} /></Suspense>
}
function ConverterPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><ConverterLazy isDark={isDark} /></Suspense>
}
function ProjectilePanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><ProjectileLazy isDark={isDark} /></Suspense>
}
function OhmsLawPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><OhmsLawLazy isDark={isDark} /></Suspense>
}
function CircuitDiagramPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><CircuitDiagramLazy isDark={isDark} /></Suspense>
}
function FreeBodyDiagramPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><FreeBodyDiagramLazy isDark={isDark} /></Suspense>
}
function RayDiagramPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><RayDiagramLazy isDark={isDark} /></Suspense>
}
function EnergyBarChartsPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><EnergyBarChartsLazy isDark={isDark} /></Suspense>
}
function InteractiveGraphingPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={<ToolSkeleton isDark={isDark} />}><InteractiveGraphingLazy isDark={isDark} /></Suspense>
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

  // Add to Board (same pattern as StatToolkit)
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
          className="toolkit-add-to-board-btn"
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
            {sectionTitle('Physics Formula Calculator', 'phys-formula-calc')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Select a formula, choose which variable to solve for, enter the known values, and calculate.</p>
            <div style={{ padding: '0 12px 12px' }}><FormulaCalcPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Wave Simulator', 'phys-wave-sim')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Explore transverse waves with adjustable frequency, amplitude, and wavelength.</p>
            <div style={{ padding: '0 12px 12px' }}><WaveSimPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Pendulum Simulator', 'phys-pendulum-sim')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Watch a pendulum swing using real physics. Adjust length, gravity, and starting angle.</p>
            <div style={{ padding: '0 12px 12px' }}><PendulumSimPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Science Unit Converter', 'phys-unit-converter')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Convert between physics units: force, energy, power, pressure, temperature, speed.</p>
            <div style={{ padding: '0 12px 12px' }}><ConverterPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Projectile Motion Simulator', 'phys-projectile-sim')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Launch a projectile and watch its parabolic trajectory with real kinematic equations.</p>
            <div style={{ padding: '0 12px 12px' }}><ProjectilePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle("Ohm's Law Calculator", 'phys-ohms-law')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Enter any two of voltage, current, and resistance to auto-calculate the third.</p>
            <div style={{ padding: '0 12px 12px' }}><OhmsLawPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Circuit Diagram Builder', 'phys-circuit-diagram')}
            <div style={{ padding: '0 12px 12px' }}><CircuitDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Free Body Diagram Builder', 'phys-free-body-diagram')}
            <div style={{ padding: '0 12px 12px' }}><FreeBodyDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Ray Diagram Optics', 'phys-ray-diagram')}
            <div style={{ padding: '0 12px 12px' }}><RayDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Energy Bar Charts (LOL)', 'phys-energy-bar-charts')}
            <div style={{ padding: '0 12px 12px' }}><EnergyBarChartsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Interactive Graphing Tool', 'phys-interactive-graphing')}
            <div style={{ padding: '0 12px 12px' }}><InteractiveGraphingPanel isDark={isDark} /></div>
          </div>
          {/* Phase 3 new */}
          <div className="toolkit-section">
            {sectionTitle('Magnetism Simulator', 'phys-magnetism')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Place magnets and see field lines with attract/repel visualization.</p>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Wave Interference', 'phys-wave-interference')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Two-source wave simulation showing constructive/destructive patterns.</p>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* ELEMENTARY TAB (K-5) */}
      {/* Note: Ohm's Law removed from K-5 per Phase 3 plan — inappropriate for this age band. */}
      {/* ============================================================ */}
      {activeBand === 'elementary' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Magnetism Simulator', 'phys-magnetism')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Place magnets and see field lines with attract/repel visualization. Great introduction to forces for young learners.</p>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Wave Simulator', 'phys-wave-sim')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Explore transverse waves with adjustable frequency, amplitude, and wavelength. Visual and intuitive for elementary students.</p>
            <div style={{ padding: '0 12px 12px' }}><WaveSimPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Pendulum Simulator', 'phys-pendulum-sim')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Watch a pendulum swing using real physics. Adjust length, gravity, and starting angle.</p>
            <div style={{ padding: '0 12px 12px' }}><PendulumSimPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* MIDDLE SCHOOL TAB (6-8) */}
      {/* ============================================================ */}
      {activeBand === 'middle' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Physics Formula Calculator', 'phys-formula-calc')}
            <div style={{ padding: '0 12px 12px' }}><FormulaCalcPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Wave Simulator', 'phys-wave-sim')}
            <div style={{ padding: '0 12px 12px' }}><WaveSimPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Pendulum Simulator', 'phys-pendulum-sim')}
            <div style={{ padding: '0 12px 12px' }}><PendulumSimPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Science Unit Converter', 'phys-unit-converter')}
            <div style={{ padding: '0 12px 12px' }}><ConverterPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle("Ohm's Law Calculator", 'phys-ohms-law')}
            <div style={{ padding: '0 12px 12px' }}><OhmsLawPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Circuit Diagram Builder', 'phys-circuit-diagram')}
            <div style={{ padding: '0 12px 12px' }}><CircuitDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Free Body Diagram Builder', 'phys-free-body-diagram')}
            <div style={{ padding: '0 12px 12px' }}><FreeBodyDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Energy Bar Charts (LOL)', 'phys-energy-bar-charts')}
            <div style={{ padding: '0 12px 12px' }}><EnergyBarChartsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Interactive Graphing Tool', 'phys-interactive-graphing')}
            <div style={{ padding: '0 12px 12px' }}><InteractiveGraphingPanel isDark={isDark} /></div>
          </div>
          {/* Phase 3 new */}
          <div className="toolkit-section">
            {sectionTitle('Magnetism Simulator', 'phys-magnetism')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Place magnets and see field lines with attract/repel visualization.</p>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* HIGH SCHOOL TAB (9-12) */}
      {/* ============================================================ */}
      {activeBand === 'highschool' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Physics Formula Calculator', 'phys-formula-calc')}
            <div style={{ padding: '0 12px 12px' }}><FormulaCalcPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Wave Simulator', 'phys-wave-sim')}
            <div style={{ padding: '0 12px 12px' }}><WaveSimPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Pendulum Simulator', 'phys-pendulum-sim')}
            <div style={{ padding: '0 12px 12px' }}><PendulumSimPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Science Unit Converter', 'phys-unit-converter')}
            <div style={{ padding: '0 12px 12px' }}><ConverterPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Projectile Motion Simulator', 'phys-projectile-sim')}
            <div style={{ padding: '0 12px 12px' }}><ProjectilePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle("Ohm's Law Calculator", 'phys-ohms-law')}
            <div style={{ padding: '0 12px 12px' }}><OhmsLawPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Circuit Diagram Builder', 'phys-circuit-diagram')}
            <div style={{ padding: '0 12px 12px' }}><CircuitDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Free Body Diagram Builder', 'phys-free-body-diagram')}
            <div style={{ padding: '0 12px 12px' }}><FreeBodyDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Ray Diagram Optics', 'phys-ray-diagram')}
            <div style={{ padding: '0 12px 12px' }}><RayDiagramPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Energy Bar Charts (LOL)', 'phys-energy-bar-charts')}
            <div style={{ padding: '0 12px 12px' }}><EnergyBarChartsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Interactive Graphing Tool', 'phys-interactive-graphing')}
            <div style={{ padding: '0 12px 12px' }}><InteractiveGraphingPanel isDark={isDark} /></div>
          </div>
          {/* Phase 3 new */}
          <div className="toolkit-section">
            {sectionTitle('Magnetism Simulator', 'phys-magnetism')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Place magnets and see field lines with attract/repel visualization.</p>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Wave Interference', 'phys-wave-interference')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Two-source wave simulation showing constructive/destructive patterns.</p>
          </div>
          {/* Batch 2 new */}
          <div className="toolkit-section">
            {sectionTitle('Rotational Motion', 'phys-rotational-motion')}
            <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 12px 8px' }}>Torque, angular velocity, moment of inertia with interactive sliders.</p>
          </div>
        </>
      )}
    </div>
  )
}