'use client'

import { useState, lazy, Suspense } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

// Lazy-load each tool — only parsed when the grade tab renders it
const RockCycleLazy = lazy(() => import('./earthscience/EarthScienceUtilities').then(m => ({ default: m.RockCycleDiagram })))
const PlateTectonicsLazy = lazy(() => import('./earthscience/EarthScienceUtilities').then(m => ({ default: m.PlateTectonicsMap })))
const WeatherMapLazy = lazy(() => import('./earthscience/EarthScienceUtilities').then(m => ({ default: m.WeatherMapReader })))
const WaterCarbonLazy = lazy(() => import('./earthscience/EarthScienceUtilities').then(m => ({ default: m.WaterCarbonCycle })))
const SolarSystemLazy = lazy(() => import('./earthscience/EarthScienceUtilities').then(m => ({ default: m.SolarSystemScale })))
const TopographicLazy = lazy(() => import('./earthscience/EarthScienceUtilities').then(m => ({ default: m.TopographicMapTool })))

// Stable wrapper components (no remount on re-render)
function RockCyclePanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><RockCycleLazy isDark={isDark} /></Suspense>
}
function PlateTectonicsPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><PlateTectonicsLazy isDark={isDark} /></Suspense>
}
function WeatherMapPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><WeatherMapLazy isDark={isDark} /></Suspense>
}
function WaterCarbonPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><WaterCarbonLazy isDark={isDark} /></Suspense>
}
function SolarSystemPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><SolarSystemLazy isDark={isDark} /></Suspense>
}
function TopographicPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><TopographicLazy isDark={isDark} /></Suspense>
}

// ============================================================
// Types
// ============================================================

type GradeBand = 'all' | 'elementary' | 'middle' | 'highschool'

interface EarthScienceToolkitProps {
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

export function EarthScienceToolkit({ roomId: _roomId }: EarthScienceToolkitProps) {
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
    <div className="widget-content toolkit-earthscience" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
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
      {/* ALL TAB — show all 6 */}
      {/* ============================================================ */}
      {activeBand === 'all' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Rock Cycle Diagram (Grades 4-8)')}
            <div style={{ padding: '0 12px 12px' }}><RockCyclePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Plate Tectonics Map (Grades 6-8)')}
            <div style={{ padding: '0 12px 12px' }}><PlateTectonicsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Weather Map Reader (Grades 4-8)')}
            <div style={{ padding: '0 12px 12px' }}><WeatherMapPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Water & Carbon Cycle (Grades 3-8)')}
            <div style={{ padding: '0 12px 12px' }}><WaterCarbonPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Solar System Scale (Grades 3-8)')}
            <div style={{ padding: '0 12px 12px' }}><SolarSystemPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Topographic Map Tool (Grades 6-8)')}
            <div style={{ padding: '0 12px 12px' }}><TopographicPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* K-5 TAB — WaterCarbonCycle, SolarSystemScale */}
      {/* ============================================================ */}
      {activeBand === 'elementary' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Water & Carbon Cycle (Grades 3-8)')}
            <div style={{ padding: '0 12px 12px' }}><WaterCarbonPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Solar System Scale (Grades 3-8)')}
            <div style={{ padding: '0 12px 12px' }}><SolarSystemPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 6-8 TAB — ALL 6 */}
      {/* ============================================================ */}
      {activeBand === 'middle' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Rock Cycle Diagram (Grades 4-8)')}
            <div style={{ padding: '0 12px 12px' }}><RockCyclePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Plate Tectonics Map (Grades 6-8)')}
            <div style={{ padding: '0 12px 12px' }}><PlateTectonicsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Weather Map Reader (Grades 4-8)')}
            <div style={{ padding: '0 12px 12px' }}><WeatherMapPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Water & Carbon Cycle (Grades 3-8)')}
            <div style={{ padding: '0 12px 12px' }}><WaterCarbonPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Solar System Scale (Grades 3-8)')}
            <div style={{ padding: '0 12px 12px' }}><SolarSystemPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Topographic Map Tool (Grades 6-8)')}
            <div style={{ padding: '0 12px 12px' }}><TopographicPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 9-12 TAB — ALL 6 */}
      {/* ============================================================ */}
      {activeBand === 'highschool' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Rock Cycle Diagram (Grades 4-8)')}
            <div style={{ padding: '0 12px 12px' }}><RockCyclePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Plate Tectonics Map (Grades 6-8)')}
            <div style={{ padding: '0 12px 12px' }}><PlateTectonicsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Weather Map Reader (Grades 4-8)')}
            <div style={{ padding: '0 12px 12px' }}><WeatherMapPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Water & Carbon Cycle (Grades 3-8)')}
            <div style={{ padding: '0 12px 12px' }}><WaterCarbonPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Solar System Scale (Grades 3-8)')}
            <div style={{ padding: '0 12px 12px' }}><SolarSystemPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Topographic Map Tool (Grades 6-8)')}
            <div style={{ padding: '0 12px 12px' }}><TopographicPanel isDark={isDark} /></div>
          </div>
        </>
      )}
    </div>
  )
}
