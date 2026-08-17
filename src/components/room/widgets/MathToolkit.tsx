'use client'

import { useState, useCallback } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import type { ToolId } from '@/lib/whiteboard/types'
import {
  Calculator,
  UnitConverter,
  FormulaReference,
  MultiplicationGrid,
  Base10Blocks,
  Flashcards,
  ProofBuilder,
} from './math/MathUtilities'

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
]

// ============================================================
// Component
// ============================================================

export function MathToolkit({ roomId: _roomId }: MathToolkitProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const setTool = useWhiteboardStore((s) => s.setTool)
  const setMathToolConfig = useWhiteboardStore((s) => s.setMathToolConfig)

  // Active grade tab
  const [activeBand, setActiveBand] = useState<GradeBand>('all')
  // Which grade bands are visible (toggled by tutor)
  const [visibleBands, setVisibleBands] = useState<Set<GradeBand>>(new Set(['all', 'elementary', 'middle', 'highschool']))

  // Fraction config
  const [fracDivisions, setFracDivisions] = useState(4)
  const [fracShaded, setFracShaded] = useState<number[]>([])
  // Polygon config
  const [polySides, setPolySides] = useState(6)
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

  // Existing state
  const [equation, setEquation] = useState('')
  const [graphType, setGraphType] = useState<'none' | 'line' | 'grid'>('none')

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

  const stamps = [
    { label: 'Protractor', icon: '⚖' }, { label: 'Ruler', icon: '⚔' }, { label: 'Set Square', icon: '▣' }, { label: 'Compass', icon: '⊙' },
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
          <div className="toolkit-section">
            {sectionTitle('Quick Equations')}
            <div className="toolkit-grid">
              {mathFunctions.map((fn) => (
                <button key={fn.eq} className={'toolkit-chip' + (isDark ? '' : ' toolkit-chip-light')}
                  onClick={() => setEquation(fn.eq)}
                  style={{ padding: '6px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'monospace', background: equation === fn.eq ? actBg : dkBg, border: equation === fn.eq ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: equation === fn.eq ? actText : dkText, cursor: 'pointer', textAlign: 'left' }}>
                  {fn.label}
                </button>
              ))}
            </div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Background')}
            <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px' }}>
              {(['none', 'grid', 'line'] as const).map((type) => (
                <button key={type} onClick={() => setGraphType(type)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 11, fontWeight: 500, background: graphType === type ? actBg : dkBg, border: graphType === type ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: graphType === type ? actText : dkText, cursor: 'pointer' }}>
                  {type === 'none' ? 'Blank' : type}
                </button>
              ))}
            </div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Stamps')}
            <div className="toolkit-grid">
              {stamps.map((stamp) => (
                <button key={stamp.label} className={'toolkit-chip' + (isDark ? '' : ' toolkit-chip-light')}
                  style={{ padding: '8px 12px', borderRadius: 6, fontSize: 16, background: dkBg, border: '1px solid ' + dkBorder, color: dkText, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{stamp.icon}</span><span style={{ fontSize: 11 }}>{stamp.label}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Canvas tools for all bands */}
          <div className="toolkit-section">
            {sectionTitle('Canvas Tools')}
            <div className="toolkit-grid">
              {CANVAS_TOOLS.map((tool) => (
                <button key={tool.id} className={'toolkit-chip' + (isDark ? '' : ' toolkit-chip-light')}
                  onClick={() => activateCanvasTool(tool)}
                  style={{ padding: '6px 10px', borderRadius: 6, fontSize: 11, background: dkBg, border: '1px solid ' + dkBorder, color: dkText, cursor: 'pointer', textAlign: 'left' }}>
                  {tool.label}
                </button>
              ))}
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
                    <button key={n} onClick={() => { setFracDivisions(n); setFracShaded([]) }} style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, background: fracDivisions === n ? actBg : dkBg, border: fracDivisions === n ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: fracDivisions === n ? actText : dkText, cursor: 'pointer' }}>{n}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: dkText, minWidth: 60 }}>Shade:</span>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {Array.from({ length: fracDivisions }, (_, i) => (
                    <button key={i} onClick={() => setFracShaded(prev => prev.includes(i) ? prev.filter(s => s !== i) : [...prev, i])}
                      style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600, background: fracShaded.includes(i) ? 'rgba(59,130,246,0.25)' : dkBg, border: fracShaded.includes(i) ? '1px solid rgba(59,130,246,0.5)' : '1px solid ' + dkBorder, color: fracShaded.includes(i) ? '#60a5fa' : dkText, cursor: 'pointer' }}>{i + 1}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: actText }}>{fracShaded.length}/{fracDivisions}</span>
                {placeBtn('Place on Canvas', () => { setMathToolConfig({ divisions: fracDivisions, shaded: fracShaded }); setTool('math-fraction-circle') })}
              </div>
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
                    <button key={n} onClick={() => { setFracDivisions(n); setFracShaded([]) }} style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, background: fracDivisions === n ? actBg : dkBg, border: fracDivisions === n ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: fracDivisions === n ? actText : dkText, cursor: 'pointer' }}>{n}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: actText }}>{fracShaded.length}/{fracDivisions}</span>
                {placeBtn('Place on Canvas', () => { setMathToolConfig({ divisions: fracDivisions, shaded: fracShaded }); setTool('math-fraction-bar') })}
              </div>
            </div>
          </div>

          {/* Multiplication Grid */}
          <div className="toolkit-section">{sectionTitle('Multiplication Grid')}<MultiplicationGrid isDark={isDark} /></div>

          {/* Base-10 Blocks */}
          <div className="toolkit-section">{sectionTitle('Base-10 Blocks')}<Base10Blocks isDark={isDark} /></div>

          {/* Flashcards */}
          <div className="toolkit-section">{sectionTitle('Flashcards')}<Flashcards isDark={isDark} /></div>

          {/* Canvas tools for elementary */}
          <div className="toolkit-section">
            {sectionTitle('Quick Canvas Tools')}
            <div className="toolkit-grid">
              {getToolsForBand('elementary').map(tool => (
                <button key={tool.id} className={'toolkit-chip' + (isDark ? '' : ' toolkit-chip-light')}
                  onClick={() => activateCanvasTool(tool)} style={{ padding: '6px 10px', borderRadius: 6, fontSize: 11, background: dkBg, border: '1px solid ' + dkBorder, color: dkText, cursor: 'pointer', textAlign: 'left' }}>{tool.label}</button>
              ))}
            </div>
          </div>
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
              {placeBtn('Place on Canvas', () => { setMathToolConfig({ numberLineMin: nlMin, numberLineMax: nlMax, numberLineStep: nlStep }); setTool('math-number-line') })}
            </div>
          </div>

          {/* Angle Maker */}
          <div className="toolkit-section">
            {sectionTitle('Angle Maker')}
            <div style={{ padding: '4px 16px 12px' }}>
              <p style={{ fontSize: 10, color: dkText, lineHeight: 1.4, margin: '0 0 8px' }}>Click &quot;Place&quot; then drag the blue handle to set the angle.</p>
              {placeBtn('Place on Canvas', () => { setMathToolConfig({}); setTool('math-angle') })}
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
              {placeBtn('Place on Canvas', () => { setMathToolConfig({ sides: polySides }); setTool('math-polygon') })}
            </div>
          </div>

          {/* Calculator */}
          <div className="toolkit-section">{sectionTitle('Scientific Calculator')}<Calculator isDark={isDark} /></div>

          {/* Unit Converter */}
          <div className="toolkit-section">{sectionTitle('Unit Converter')}<UnitConverter isDark={isDark} /></div>

          {/* Formula Reference */}
          <div className="toolkit-section">{sectionTitle('Formula Reference')}<FormulaReference band="middle" isDark={isDark} /></div>

          {/* Canvas tools for middle */}
          <div className="toolkit-section">
            {sectionTitle('Quick Canvas Tools')}
            <div className="toolkit-grid">
              {getToolsForBand('middle').filter(t => !['math-fraction-circle', 'math-fraction-bar'].includes(t.id)).map(tool => (
                <button key={tool.id} className={'toolkit-chip' + (isDark ? '' : ' toolkit-chip-light')}
                  onClick={() => activateCanvasTool(tool)} style={{ padding: '6px 10px', borderRadius: 6, fontSize: 11, background: dkBg, border: '1px solid ' + dkBorder, color: dkText, cursor: 'pointer', textAlign: 'left' }}>{tool.label}</button>
              ))}
            </div>
          </div>
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
              {placeBtn('Place on Canvas', () => { setMathToolConfig({ coordXMin: -cpRange, coordXMax: cpRange, coordYMin: -cpRange, coordYMax: cpRange, coordStep: cpStep }); setTool('math-coordinate-plane') })}
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
              {placeBtn('Place on Canvas', () => { setMathToolConfig({ vennCircles: vennCount }); setTool('math-venn') })}
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
              {placeBtn('Place on Canvas', () => { setMathToolConfig({ chartCategories: chartCategories.split(',').map(s => s.trim()).filter(Boolean), chartValues: chartValues.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n)) }); setTool('math-bar-chart') })}
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
              {placeBtn('Place on Canvas', () => { setMathToolConfig({ chartCategories: chartCategories.split(',').map(s => s.trim()).filter(Boolean), chartValues: chartValues.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n)) }); setTool('math-pie-chart') })}
            </div>
          </div>

          {/* Formula Reference */}
          <div className="toolkit-section">{sectionTitle('Formula Reference')}<FormulaReference band="highschool" isDark={isDark} /></div>

          {/* Proof Builder */}
          <div className="toolkit-section">{sectionTitle('Proof Builder')}<ProofBuilder isDark={isDark} /></div>

          {/* Canvas tools for HS */}
          <div className="toolkit-section">
            {sectionTitle('Quick Canvas Tools')}
            <div className="toolkit-grid">
              {getToolsForBand('highschool').map(tool => (
                <button key={tool.id} className={'toolkit-chip' + (isDark ? '' : ' toolkit-chip-light')}
                  onClick={() => activateCanvasTool(tool)} style={{ padding: '6px 10px', borderRadius: 6, fontSize: 11, background: dkBg, border: '1px solid ' + dkBorder, color: dkText, cursor: 'pointer', textAlign: 'left' }}>{tool.label}</button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
