'use client'

import { useState, useCallback, lazy, Suspense } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import type { ToolId } from '@/lib/whiteboard/types'
import { generateId } from '@/lib/whiteboard/utils'
import { getDefaultWidgetConfig, getWidgetDefaultSize, WIDGET_KIND_LABELS } from '@/components/whiteboard/CanvasWidgets'
import type { WidgetElement } from '@/lib/whiteboard/types'

// Lazy-load panel utilities — only parsed when the grade tab renders them
const CalculatorLazy = lazy(() => import('./math/MathUtilities').then(m => ({ default: m.Calculator })))
const UnitConverterLazy = lazy(() => import('./math/MathUtilities').then(m => ({ default: m.UnitConverter })))
const FormulaRefLazy = lazy(() => import('./math/MathUtilities').then(m => ({ default: m.FormulaReference })))
const MultGridLazy = lazy(() => import('./math/MathUtilities').then(m => ({ default: m.MultiplicationGrid })))
const Base10Lazy = lazy(() => import('./math/MathUtilities').then(m => ({ default: m.Base10Blocks })))
const FlashcardsLazy = lazy(() => import('./math/MathUtilities').then(m => ({ default: m.Flashcards })))
const ProofBuilderLazy = lazy(() => import('./math/MathUtilities').then(m => ({ default: m.ProofBuilder })))

// Pre-built wrapper components (stable references, no remount on re-render)
function CalcPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><CalculatorLazy isDark={isDark} /></Suspense>
}
function UnitPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><UnitConverterLazy isDark={isDark} /></Suspense>
}
function FormulaPanel({ band, isDark }: { band: string; isDark: boolean }) {
  return <Suspense fallback={null}><FormulaRefLazy band={band} isDark={isDark} /></Suspense>
}
function MultGridPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><MultGridLazy isDark={isDark} /></Suspense>
}
function Base10Panel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><Base10Lazy isDark={isDark} /></Suspense>
}
function FlashcardsPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><FlashcardsLazy isDark={isDark} /></Suspense>
}
function ProofPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><ProofBuilderLazy isDark={isDark} /></Suspense>
}

interface MathToolkitProps {
  roomId?: string
}

// ---- Grade Band Config ----

type GradeBand = 'all' | 'elementary' | 'middle' | 'highschool'

const GRADE_BANDS: Array<{ id: GradeBand; label: string; icon: string }> = [
  { id: 'all', label: 'All', icon: '⚡' },
  { id: 'elementary', label: 'K-5', icon: '●' },
  { id: 'middle', label: '6-8', icon: '▲' },
  { id: 'highschool', label: '9-12', icon: '♦' },
]

// ---- Canvas Tool Definitions ----

interface CanvasTool {
  id: ToolId
  label: string
  bands: GradeBand[]
  config?: Record<string, unknown>
}

const CANVAS_TOOLS: CanvasTool[] = [
  { id: 'math-fraction-circle', label: 'Fraction Circle', bands: ['all', 'elementary'], config: { divisions: 4, shaded: [] } },
  { id: 'math-fraction-bar', label: 'Fraction Bar', bands: ['all', 'elementary'], config: { divisions: 4, shaded: [] } },
  { id: 'math-number-line', label: 'Number Line', bands: ['all', 'elementary', 'middle'], config: { numberLineMin: 0, numberLineMax: 10, numberLineStep: 1 } },
  { id: 'math-angle', label: 'Angle Maker', bands: ['all', 'middle'], config: {} },
  { id: 'math-polygon', label: 'Polygon', bands: ['all', 'middle'], config: { sides: 6 } },
  { id: 'math-coordinate-plane', label: 'Coordinate Plane', bands: ['all', 'middle', 'highschool'], config: { coordXMin: -10, coordXMax: 10, coordYMin: -10, coordYMax: 10, coordStep: 1 } },
  { id: 'math-venn', label: 'Venn Diagram', bands: ['all', 'highschool'], config: { vennCircles: 2 } },
  { id: 'math-bar-chart', label: 'Bar Chart', bands: ['all', 'elementary', 'middle'], config: { chartCategories: ['A', 'B', 'C', 'D'], chartValues: [3, 7, 5, 9] } },
  { id: 'math-pie-chart', label: 'Pie Chart', bands: ['all', 'middle', 'highschool'], config: { chartCategories: ['A', 'B', 'C', 'D'], chartValues: [30, 25, 20, 25] } },
  { id: 'math-place-value', label: 'Place Value Chart', bands: ['all', 'elementary'], config: {} },
  { id: 'math-clock', label: 'Clock', bands: ['all', 'elementary'], config: {} },
  { id: 'math-base-10', label: 'Base-10 Blocks', bands: ['all', 'elementary'], config: {} },
  { id: 'math-multiplication-array', label: 'Multiplication Array', bands: ['all', 'elementary'], config: {} },
]

// ============================================================
// Component
// ============================================================

export function MathToolkit({ roomId: _roomId }: MathToolkitProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const setTool = useWhiteboardStore((s) => s.setTool)
  const setMathToolConfig = useWhiteboardStore((s) => s.setMathToolConfig)
  const pushHistory = useWhiteboardStore((s) => s.pushHistory)
  const addElement = useWhiteboardStore((s) => s.addElement)
  const camera = useWhiteboardStore((s) => s.camera)
  const currentPageIndex = useWhiteboardStore((s) => s.currentPageIndex)
  const showGrid = useWhiteboardStore((s) => s.showGrid)
  const setGridType = useWhiteboardStore((s) => s.setGridType)
  const toggleGrid = useWhiteboardStore((s) => s.toggleGrid)

  // Active grade tab
  const [activeBand, setActiveBand] = useState<GradeBand>('all')
  // Which grade bands are visible (toggled by tutor)
  const [visibleBands, setVisibleBands] = useState<Set<GradeBand>>(new Set(['all', 'elementary', 'middle', 'highschool']))

  // Fraction Circle config (separate from bar)
  const [circleDivisions, setCircleDivisions] = useState(4)
  const [circleShaded, setCircleShaded] = useState<number[]>([])
  // Fraction Bar config (separate from circle)
  const [barDivisions, setBarDivisions] = useState(4)
  const [barShaded, setBarShaded] = useState<number[]>([])
  const [barOrientation, setBarOrientation] = useState<'horizontal' | 'vertical'>('horizontal')
  // Polygon config
  const [polySides, setPolySides] = useState(6)
  // Angle config
  const [anglePreset, setAnglePreset] = useState<number | null>(null)
  const [angleCustomDeg, setAngleCustomDeg] = useState(90)
  // Number line config
  const [nlMin, setNlMin] = useState(0)
  const [nlMax, setNlMax] = useState(10)
  const [nlStep, setNlStep] = useState(1)
  // Coordinate plane config
  const [cpRange, setCpRange] = useState(10)
  const [cpStep, setCpStep] = useState(1)
  // Venn circles
  const [vennCount, setVennCount] = useState<2 | 3>(2)
  // Chart data
  const [chartCategories, setChartCategories] = useState('A,B,C,D')
  const [chartValues, setChartValues] = useState('3,7,5,9')

  // Quick Equations: active equation tracking
  const [activeEquation, setActiveEquation] = useState('')

  // Widget size preset
  const [sizePreset, setSizePreset] = useState<'small' | 'medium' | 'large'>('medium')
  const SIZE_MULTIPLIER: Record<'small' | 'medium' | 'large', number> = { small: 0.7, medium: 1.0, large: 1.3 }

  // Background grid type tracking (synced from store on click)
  const [activeBg, setActiveBg] = useState<'none' | 'line' | 'grid'>(() => {
    const s = useWhiteboardStore.getState()
    if (!s.showGrid) return 'none'
    return s.gridType === 'dot' ? 'grid' : 'line'
  })

  const handleBackground = useCallback((type: 'none' | 'line' | 'grid') => {
    setActiveBg(type)
    if (type === 'none') {
      if (showGrid) toggleGrid()
    } else {
      if (!showGrid) toggleGrid()
      setGridType(type === 'grid' ? 'dot' : 'line')
    }
  }, [showGrid, toggleGrid, setGridType])

  // Stamps: place a sticky note at viewport center
  const placeStamp = useCallback((icon: string, label: string) => {
    pushHistory()
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    const cx = ((vw / 2) - 80 - camera.x) / camera.zoom
    const cy = ((vh / 2 - 44) - camera.y) / camera.zoom
    addElement({
      id: generateId(),
      type: 'sticky',
      x: cx - 60,
      y: cy - 30,
      width: 120,
      height: 60,
      rotation: 0,
      opacity: 1,
      strokeColor: 'transparent',
      fillColor: '#dbeafe',
      strokeWidth: 0,
      locked: false,
      pageIndex: currentPageIndex,
      text: icon + ' ' + label,
      fontSize: 16,
      noteColor: '#dbeafe',
    })
  }, [pushHistory, addElement, camera, currentPageIndex])

  const toggleBand = (band: GradeBand) => {
    setVisibleBands(prev => {
      const next = new Set(prev)
      if (next.has(band)) next.delete(band)
      else next.add(band)
      return next
    })
  }

  const activateCanvasTool = useCallback((toolDef: CanvasTool) => {
    setMathToolConfig(toolDef.config || {})
    setTool(toolDef.id)
  }, [setMathToolConfig, setTool])

  // Add interactive widget to board (same pattern as StatToolkit)
  const addToBoard = useCallback((widgetKind: string, overrides?: Record<string, unknown>) => {
    const size = getWidgetDefaultSize(widgetKind)
    const mult = SIZE_MULTIPLIER[sizePreset]
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    const cx = ((vw / 2) - 80 - camera.x) / camera.zoom
    const cy = ((vh / 2 - 44) - camera.y) / camera.zoom
    const el: WidgetElement = {
      id: generateId(),
      type: 'widget',
      widgetKind,
      config: { ...getDefaultWidgetConfig(widgetKind), ...overrides },
      x: cx - (size.width * mult) / 2,
      y: cy - (size.height * mult) / 2,
      width: size.width * mult,
      height: size.height * mult,
      rotation: 0,
      opacity: 1,
      strokeColor: isDark ? '#334155' : '#e2e8f0',
      fillColor: isDark ? '#0f172a' : '#ffffff',
      strokeWidth: 1,
      locked: false,
      pageIndex: currentPageIndex,
    }
    addElement(el)
  }, [addElement, camera, isDark, currentPageIndex, sizePreset])

  // Shared "Add to Board" button for math widgets
  const addBoardBtn = (label: string, onClick: () => void) => (
    <button onClick={onClick} style={{ padding: '5px 14px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: actBg, border: '1px solid ' + actBorder, color: actText, cursor: 'pointer', alignSelf: 'flex-end' }}>+ {label}</button>
  )

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

  const numInput = (value: number, onChange: (v: number) => void, min: number, max: number, step: number, w?: number) => (
    <input type="number" value={value} min={min} max={max} step={step}
      onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
      style={{ width: w || 52, padding: '3px 6px', borderRadius: 4, fontSize: 11, border: '1px solid ' + dkBorder, background: dkBg, color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none' }}
    />
  )

  const textInput = (value: string, onChange: (v: string) => void, placeholder: string, w?: number) => (
    <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
      style={{ width: w || 120, padding: '3px 6px', borderRadius: 4, fontSize: 11, border: '1px solid ' + dkBorder, background: dkBg, color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none' }}
    />
  )

  const placeBtn = (label: string, onClick: () => void) => (
    <button onClick={onClick} style={{ padding: '5px 14px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: actBg, border: '1px solid ' + actBorder, color: actText, cursor: 'pointer', alignSelf: 'flex-end' }}>{label}</button>
  )

  const quickBtn = (label: string, active: boolean, onClick: () => void) => (
    <button onClick={onClick} style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, background: active ? actBg : dkBg, border: active ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: active ? actText : dkText, cursor: 'pointer' }}>{label}</button>
  )

  // Filter tools for current band (or show all if 'all')
  const getToolsForBand = (band: GradeBand) => CANVAS_TOOLS.filter(t => t.bands.includes(band))

  // ---- Quick Equations (existing feature) ----
  const mathFunctions = [
    { label: 'y = x', eq: 'x' }, { label: 'y = x^2', eq: 'x^2' }, { label: 'y = sqrt(x)', eq: 'sqrt(x)' },
    { label: 'y = 1/x', eq: '1/x' }, { label: 'y = sin(x)', eq: 'sin(x)' }, { label: 'y = cos(x)', eq: 'cos(x)' },
    { label: 'y = |x|', eq: 'abs(x)' }, { label: 'y = log(x)', eq: 'log(x)' },
  ]

  const ANGLE_PRESETS = [30, 45, 60, 90, 120, 135, 150, 180]

  const measurementTools = [
    { label: 'Protractor', icon: '⚖', kind: 'math-protractor' },
    { label: 'Ruler', icon: '⚔', kind: 'math-ruler' },
    { label: 'Set Square', icon: '▣', kind: 'math-set-square' },
    { label: 'Compass', icon: '⊙', kind: 'math-compass' },
  ]

  return (
    <div className="widget-content toolkit-math" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
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
          {/* Size Preset Buttons */}
          <div style={{ display: 'flex', gap: 4, padding: '4px 12px 8px', alignItems: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, opacity: 0.6, marginRight: 4 }}>Size:</span>
            {(['small', 'medium', 'large'] as const).map(function(sz) {
              var labels: Record<'small' | 'medium' | 'large', string> = { small: 'S', medium: 'M', large: 'L' }
              var isActive = sizePreset === sz
              return (
                <button key={sz} onClick={function() { setSizePreset(sz) }}
                  style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: isActive ? 700 : 500, background: isActive ? actBg : dkBg, border: isActive ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: isActive ? actText : dkText, cursor: 'pointer' as const, minWidth: 28, textAlign: 'center' as const }}>
                  {labels[sz]}
                </button>
              )
            })}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Quick Equations')}
            <div className="toolkit-grid">
              {mathFunctions.map((fn) => (
                <button key={fn.eq} className={'toolkit-chip' + (isDark ? '' : ' toolkit-chip-light')}
                  onClick={() => {
                    setActiveEquation(fn.eq)
                    addToBoard('math-coordinate-plane', { range: 10, step: 1 })
                  }}
                  style={{ padding: '6px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'monospace', background: activeEquation === fn.eq ? actBg : dkBg, border: activeEquation === fn.eq ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: activeEquation === fn.eq ? actText : dkText, cursor: 'pointer' as const, textAlign: 'left' as const }}>
                  {fn.label}
                </button>
              ))}
            </div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Background')}
            <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px' }}>
              {(['none', 'grid', 'line'] as const).map((type) => (
                <button key={type} onClick={() => handleBackground(type)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 11, fontWeight: 500, background: activeBg === type ? actBg : dkBg, border: activeBg === type ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: activeBg === type ? actText : dkText, cursor: 'pointer' as const }}>
                  {type === 'none' ? 'Blank' : type}
                </button>
              ))}
            </div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Measurement Tools')}
            <div className="toolkit-grid">
              {measurementTools.map(function(mt) {
                return (
                  <button key={mt.kind} className={'toolkit-chip' + (isDark ? '' : ' toolkit-chip-light')}
                    onClick={function() { addToBoard(mt.kind, {}) }}
                    style={{ padding: '8px 12px', borderRadius: 6, fontSize: 16, background: dkBg, border: '1px solid ' + dkBorder, color: dkText, cursor: 'pointer' as const, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{mt.icon}</span><span style={{ fontSize: 11 }}>{mt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          {/* Interactive board widgets for all bands */}
          <div className="toolkit-section">
            {sectionTitle('Math Tools')}
            <div className="toolkit-grid">
              {CANVAS_TOOLS.map((tool) => {
                var widgetKind = tool.id === 'math-angle' ? 'math-angle-maker' : tool.id === 'math-venn' ? 'math-venn-diagram' : tool.id
                return (
                  <button key={tool.id} className={'toolkit-chip' + (isDark ? '' : ' toolkit-chip-light')}
                    onClick={function() { addToBoard(widgetKind, tool.config || {}) }}
                    style={{ padding: '6px 10px', borderRadius: 6, fontSize: 11, background: dkBg, border: '1px solid ' + dkBorder, color: dkText, cursor: 'pointer' as const, textAlign: 'left' as const }}>
                    {tool.label}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* ELEMENTARY TAB */}
      {/* ============================================================ */}
      {activeBand === 'elementary' && (
        <>
          {/* Fraction Circle Config */}
          <div className="toolkit-section">
            {sectionTitle('Fraction Circle')}
            <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: dkText, minWidth: 60 }}>Parts:</span>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                    <button key={n} onClick={() => { setCircleDivisions(n); setCircleShaded([]) }} style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, background: circleDivisions === n ? actBg : dkBg, border: circleDivisions === n ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: circleDivisions === n ? actText : dkText, cursor: 'pointer' }}>{n}</button>
                  ))}
                </div>
                <span style={{ fontSize: 10, color: dkText }}>or</span>
                {numInput(circleDivisions, (v) => { setCircleDivisions(v); setCircleShaded([]) }, 2, 36, 1, 48)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: dkText, minWidth: 60 }}>Shade:</span>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {Array.from({ length: Math.min(circleDivisions, 20) }, (_, i) => (
                    <button key={i} onClick={() => setCircleShaded(prev => prev.includes(i) ? prev.filter(s => s !== i) : [...prev, i])}
                      style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600, background: circleShaded.includes(i) ? 'rgba(59,130,246,0.25)' : dkBg, border: circleShaded.includes(i) ? '1px solid rgba(59,130,246,0.5)' : '1px solid ' + dkBorder, color: circleShaded.includes(i) ? '#60a5fa' : dkText, cursor: 'pointer' }}>{i + 1}</button>
                  ))}
                  {circleDivisions > 20 && <span style={{ fontSize: 10, color: dkText, fontStyle: 'italic' }}>+{circleDivisions - 20} more (click on canvas to shade)</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setCircleShaded(circleDivisions > 0 ? Array.from({ length: circleDivisions }, (_, i) => i) : [])} style={{ padding: '2px 8px', borderRadius: 3, fontSize: 10, background: circleShaded.length === circleDivisions ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', border: circleShaded.length === circleDivisions ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(59,130,246,0.3)', color: circleShaded.length === circleDivisions ? '#fca5a5' : '#60a5fa', cursor: 'pointer' }}>
                  {circleShaded.length === circleDivisions ? 'Clear all' : 'Shade all'}
                </button>
                <span style={{ fontSize: 12, fontWeight: 700, color: actText }}>{circleShaded.length}/{circleDivisions}</span>
              </div>
              {addBoardBtn('Add to Board', () => addToBoard('math-fraction-circle', { divisions: circleDivisions, shaded: circleShaded }))}
            </div>
          </div>

          {/* Fraction Bar Config */}
          <div className="toolkit-section">
            {sectionTitle('Fraction Bar')}
            <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: dkText, minWidth: 60 }}>Parts:</span>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                    <button key={n} onClick={() => { setBarDivisions(n); setBarShaded([]) }} style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, background: barDivisions === n ? actBg : dkBg, border: barDivisions === n ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: barDivisions === n ? actText : dkText, cursor: 'pointer' }}>{n}</button>
                  ))}
                </div>
                <span style={{ fontSize: 10, color: dkText }}>or</span>
                {numInput(barDivisions, (v) => { setBarDivisions(v); setBarShaded([]) }, 2, 36, 1, 48)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: dkText, minWidth: 60 }}>Shade:</span>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {Array.from({ length: Math.min(barDivisions, 20) }, (_, i) => (
                    <button key={i} onClick={() => setBarShaded(prev => prev.includes(i) ? prev.filter(s => s !== i) : [...prev, i])}
                      style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600, background: barShaded.includes(i) ? 'rgba(59,130,246,0.25)' : dkBg, border: barShaded.includes(i) ? '1px solid rgba(59,130,246,0.5)' : '1px solid ' + dkBorder, color: barShaded.includes(i) ? '#60a5fa' : dkText, cursor: 'pointer' }}>{i + 1}</button>
                  ))}
                  {barDivisions > 20 && <span style={{ fontSize: 10, color: dkText, fontStyle: 'italic' }}>+{barDivisions - 20} more (click on canvas)</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setBarShaded(barDivisions > 0 ? Array.from({ length: barDivisions }, (_, i) => i) : [])} style={{ padding: '2px 8px', borderRadius: 3, fontSize: 10, background: barShaded.length === barDivisions ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', border: barShaded.length === barDivisions ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(59,130,246,0.3)', color: barShaded.length === barDivisions ? '#fca5a5' : '#60a5fa', cursor: 'pointer' }}>
                  {barShaded.length === barDivisions ? 'Clear all' : 'Shade all'}
                </button>
                <span style={{ fontSize: 12, fontWeight: 700, color: actText }}>{barShaded.length}/{barDivisions}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: dkText }}>Orientation:</span>
                {(['horizontal', 'vertical'] as const).map(o => (
                  <button key={o} onClick={() => setBarOrientation(o)} style={{ padding: '2px 8px', borderRadius: 3, fontSize: 10, background: barOrientation === o ? actBg : dkBg, border: barOrientation === o ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: barOrientation === o ? actText : dkText, cursor: 'pointer' }}>{o}</button>
                ))}
              </div>
              {addBoardBtn('Add to Board', () => addToBoard('math-fraction-bar', { divisions: barDivisions, shaded: barShaded, orientation: barOrientation }))}
            </div>
          </div>

          {/* Multiplication Grid */}
          <div className="toolkit-section">{sectionTitle('Multiplication Grid')}<MultGridPanel isDark={isDark} /></div>

          {/* Base-10 Blocks */}
          <div className="toolkit-section">{sectionTitle('Base-10 Blocks')}<Base10Panel isDark={isDark} /></div>

          {/* Flashcards */}
          <div className="toolkit-section">{sectionTitle('Flashcards')}<FlashcardsPanel isDark={isDark} /></div>


        </>
      )}

      {/* ============================================================ */}
      {/* MIDDLE SCHOOL TAB */}
      {/* ============================================================ */}
      {activeBand === 'middle' && (
        <>
          {/* Number Line */}
          <div className="toolkit-section">
            {sectionTitle('Number Line')}
            <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: dkText }}>Min:</span>{numInput(nlMin, setNlMin, -100, 0, 1, 48)}
                <span style={{ fontSize: 11, color: dkText }}>Max:</span>{numInput(nlMax, setNlMax, 1, 100, 1, 48)}
                <span style={{ fontSize: 11, color: dkText }}>Step:</span>{numInput(nlStep, setNlStep, 0.1, 10, 0.1, 48)}
              </div>
              {addBoardBtn('Add to Board', () => addToBoard('math-number-line', { min: nlMin, max: nlMax, step: nlStep }))}
            </div>
          </div>

          {/* Angle Maker */}
          <div className="toolkit-section">
            {sectionTitle('Angle Maker')}
            <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: dkText, minWidth: 44 }}>Preset:</span>
                {ANGLE_PRESETS.map(deg => (
                  <button key={deg} onClick={() => setAnglePreset(deg)} style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, background: anglePreset === deg ? actBg : dkBg, border: anglePreset === deg ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: anglePreset === deg ? actText : dkText, cursor: 'pointer' }}>{deg}°</button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: dkText, minWidth: 44 }}>Custom:</span>
                {numInput(angleCustomDeg, setAngleCustomDeg, 1, 359, 1, 52)}
                <span style={{ fontSize: 11, color: dkText }}>°</span>
              </div>
              {addBoardBtn('Add to Board', () => addToBoard('math-angle-maker', { degrees: anglePreset !== null ? anglePreset : angleCustomDeg }))}
            </div>
          </div>

          {/* Polygon */}
          <div className="toolkit-section">
            {sectionTitle('Regular Polygon')}
            <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: dkText }}>Sides:</span>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {[3, 4, 5, 6, 7, 8, 9, 10, 12].map(n => (
                    <button key={n} onClick={() => setPolySides(n)} style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, background: polySides === n ? actBg : dkBg, border: polySides === n ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: polySides === n ? actText : dkText, cursor: 'pointer' }}>{n}</button>
                  ))}
                </div>
              </div>
              {addBoardBtn('Add to Board', () => addToBoard('math-polygon', { sides: polySides }))}
            </div>
          </div>

          {/* Measurement Tools */}
          <div className="toolkit-section">
            {sectionTitle('Measurement Tools')}
            <div className="toolkit-grid">
              {measurementTools.map(function(mt) {
                return (
                  <button key={mt.kind} className={'toolkit-chip' + (isDark ? '' : ' toolkit-chip-light')}
                    onClick={function() { addToBoard(mt.kind, {}) }}
                    style={{ padding: '8px 12px', borderRadius: 6, fontSize: 16, background: dkBg, border: '1px solid ' + dkBorder, color: dkText, cursor: 'pointer' as const, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{mt.icon}</span><span style={{ fontSize: 11 }}>{mt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Calculator */}
          <div className="toolkit-section">{sectionTitle('Scientific Calculator')}<CalcPanel isDark={isDark} /></div>

          {/* Unit Converter */}
          <div className="toolkit-section">{sectionTitle('Unit Converter')}<UnitPanel isDark={isDark} /></div>

          {/* Formula Reference */}
          <div className="toolkit-section">{sectionTitle('Formula Reference')}<FormulaPanel band="middle" isDark={isDark} /></div>


        </>
      )}

      {/* ============================================================ */}
      {/* HIGH SCHOOL TAB */}
      {/* ============================================================ */}
      {activeBand === 'highschool' && (
        <>
          {/* Coordinate Plane */}
          <div className="toolkit-section">
            {sectionTitle('Coordinate Plane')}
            <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: dkText }}>Range:</span>{numInput(cpRange, setCpRange, 1, 50, 1, 48)}
                <span style={{ fontSize: 11, color: dkText }}>Step:</span>{numInput(cpStep, setCpStep, 0.5, 10, 0.5, 48)}
              </div>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: 0 }}>Click on the plane to plot points.</p>
              {addBoardBtn('Add to Board', () => addToBoard('math-coordinate-plane', { range: cpRange, step: cpStep }))}
            </div>
          </div>

          {/* Venn Diagram */}
          <div className="toolkit-section">
            {sectionTitle('Venn Diagram')}
            <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: dkText }}>Circles:</span>
                {[2, 3].map(n => (
                  <button key={n} onClick={() => setVennCount(n as 2 | 3)} style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, background: vennCount === n ? actBg : dkBg, border: vennCount === n ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: vennCount === n ? actText : dkText, cursor: 'pointer' }}>{n}</button>
                ))}
              </div>
              {addBoardBtn('Add to Board', () => addToBoard('math-venn-diagram', { circleCount: vennCount }))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="toolkit-section">
            {sectionTitle('Bar Chart')}
            <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: dkText }}>Labels:</span>{textInput(chartCategories, setChartCategories, 'A,B,C,D')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: dkText }}>Values:</span>{textInput(chartValues, setChartValues, '3,7,5,9')}
              </div>
              {addBoardBtn('Add to Board', () => addToBoard('math-bar-chart', { categories: chartCategories.split(',').map(function(s) { return s.trim() }).filter(Boolean), values: chartValues.split(',').map(function(s) { return parseFloat(s.trim()) }).filter(function(n) { return !isNaN(n) }) }))}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="toolkit-section">
            {sectionTitle('Pie Chart')}
            <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: dkText }}>Labels:</span>{textInput(chartCategories, setChartCategories, 'A,B,C,D')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: dkText }}>Values:</span>{textInput(chartValues, setChartValues, '30,25,20,25')}
              </div>
              {addBoardBtn('Add to Board', () => addToBoard('math-pie-chart', { categories: chartCategories.split(',').map(function(s) { return s.trim() }).filter(Boolean), values: chartValues.split(',').map(function(s) { return parseFloat(s.trim()) }).filter(function(n) { return !isNaN(n) }) }))}
            </div>
          </div>

          {/* Formula Reference */}
          <div className="toolkit-section">{sectionTitle('Formula Reference')}<FormulaPanel band="highschool" isDark={isDark} /></div>

          {/* Proof Builder */}
          <div className="toolkit-section">{sectionTitle('Proof Builder')}<ProofPanel isDark={isDark} /></div>


        </>
      )}
    </div>
  )
}
