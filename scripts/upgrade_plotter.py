#!/usr/bin/env python3
"""Replace CanvasFunctionPlotter (lines 2812-3054) with upgraded version."""

import re

with open('/home/z/my-project/src/components/whiteboard/CanvasMathWidgets.tsx', 'r') as f:
    lines = f.readlines()

# Find start and end of CanvasFunctionPlotter
start_line = None
end_line = None
brace_depth = 0
found_start = False

for i, line in enumerate(lines):
    if 'export function CanvasFunctionPlotter' in line:
        start_line = i
        found_start = True
    if found_start:
        brace_depth += line.count('{') - line.count('}')
        if brace_depth <= 0 and i > start_line:
            end_line = i + 1
            break

print(f'Found CanvasFunctionPlotter: lines {start_line+1} to {end_line}')

NEW_PLOTTER = '''export function CanvasFunctionPlotter({ element, isDark }: CanvasWidgetProps) {
  var cfg = element.config as {
    expression?: string
    range?: number
    functions?: PlotFunction[]
    showGrid?: boolean
    xRange?: number
    yRange?: number
    panX?: number
    panY?: number
  }
  var updateConfig = useConfigUpdater(element.id)
  var s = ws(isDark)

  var functions: PlotFunction[] = useMemo(function() {
    if (cfg.functions && cfg.functions.length > 0) return cfg.functions
    return [{ id: '1', expr: cfg.expression || 'x^2', color: PLOT_COLORS[0], visible: true }]
  }, [cfg.functions, cfg.expression])

  var panX = cfg.panX ?? 0
  var panY = cfg.panY ?? 0
  var xRange = cfg.xRange ?? cfg.range ?? 10
  var yRange = cfg.yRange ?? cfg.range ?? 10

  // Auto-range: compute visible y range from actual function values
  var autoYRange = useMemo(function() {
    var yMin = Infinity, yMax = -Infinity
    var step = (xRange * 2) / 200
    for (var xi = -xRange + panX; xi <= xRange + panX; xi += step) {
      for (var fi = 0; fi < functions.length; fi++) {
        if (!functions[fi].visible || !functions[fi].expr.trim()) continue
        try {
          var y = parseExpression(functions[fi].expr)(xi)
          if (isFinite(y) && Math.abs(y) < 1e6) {
            if (y < yMin) yMin = y
            if (y > yMax) yMax = y
          }
        } catch(e) {}
      }
    }
    if (!isFinite(yMin) || !isFinite(yMax) || yMin === yMax) return yRange
    var padding = (yMax - yMin) * 0.15
    var autoR = Math.max(2, (yMax + padding - (yMin - padding)) / 2)
    return Math.min(50, Math.max(2, autoR))
  }, [functions, xRange, panX])

  var effectiveYRange = autoYRange
  var effectiveXMin = -xRange + panX
  var effectiveXMax = xRange + panX
  var effectiveYMin = -effectiveYRange + panY
  var effectiveYMax = effectiveYRange + panY

  var updateFunctions = useCallback(function(newFns: PlotFunction[]) {
    updateConfig({ functions: newFns, expression: newFns[0]?.expr || '', xRange: xRange, yRange: yRange, panX: panX, panY: panY })
  }, [updateConfig, xRange, yRange, panX, panY])

  var updateFnExpr = useCallback(function(id: string, expr: string) {
    var newFns = functions.map(function(f) { return f.id === id ? Object.assign({}, f, { expr: expr }) : f })
    updateFunctions(newFns)
  }, [functions, updateFunctions])

  var toggleFn = useCallback(function(id: string) {
    var newFns = functions.map(function(f) { return f.id === id ? Object.assign({}, f, { visible: !f.visible }) : f })
    updateFunctions(newFns)
  }, [functions, updateFunctions])

  var removeFn = useCallback(function(id: string) {
    if (functions.length <= 1) return
    var newFns = functions.filter(function(f) { return f.id !== id })
    updateFunctions(newFns)
  }, [functions, updateFunctions])

  var addFn = useCallback(function() {
    var newId = String(Date.now())
    var color = PLOT_COLORS[functions.length % PLOT_COLORS.length]
    var newFns = functions.concat([{ id: newId, expr: 'x', color: color, visible: true }])
    updateFunctions(newFns)
  }, [functions, updateFunctions])

  var setXRange = useCallback(function(r: number) {
    updateConfig({ functions: functions, expression: functions[0]?.expr || '', xRange: r, panX: 0, panY: 0 })
  }, [functions, updateConfig])

  var toggleGrid = useCallback(function() {
    updateConfig({ functions: functions, expression: functions[0]?.expr || '', xRange: xRange, yRange: yRange, panX: panX, panY: panY, showGrid: !(cfg.showGrid !== false) })
  }, [functions, xRange, yRange, panX, panY, cfg.showGrid, updateConfig])

  // Independent zoom via wheel on the graph container
  var graphContainerRef = useRef<HTMLDivElement | null>(null)
  useEffect(function() {
    var node = graphContainerRef.current
    if (!node) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      e.stopPropagation()
      var zoomFactor = e.deltaY > 0 ? 1.12 : 1 / 1.12
      var newXRange = Math.max(0.5, Math.min(100, xRange * zoomFactor))
      // Zoom toward cursor
      var rect = node.getBoundingClientRect()
      var relX = (e.clientX - rect.left) / rect.width
      var cursorX = effectiveXMin + relX * (effectiveXMax - effectiveXMin)
      var newPanX = panX + (cursorX - panX) * (1 - xRange / newXRange)
      updateConfig({
        functions: functions, expression: functions[0]?.expr || '',
        xRange: newXRange, panX: newPanX, panY: panY,
      })
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return function() { node.removeEventListener('wheel', onWheel) }
  }, [xRange, panX, panY, effectiveXMin, effectiveXMax, functions, updateConfig])

  var resetView = useCallback(function() {
    updateConfig({ functions: functions, expression: functions[0]?.expr || '', xRange: 10, panX: 0, panY: 0 })
  }, [functions, updateConfig])

  var showGrid = cfg.showGrid !== false
  var inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  var inputBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'

  var [showPresets, setShowPresets] = useState(false)
  var [presetCategory, setPresetCategory] = useState('Linear')

  // Smart tick step based on range
  var xTickStep = xRange <= 5 ? 1 : xRange <= 15 ? 2 : xRange <= 30 ? 5 : 10
  var yTickStep = effectiveYRange <= 5 ? 1 : effectiveYRange <= 15 ? 2 : effectiveYRange <= 30 ? 5 : 10

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, height: '100%', fontFamily: 'inherit', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>{'Function Plotter'}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={resetView} title='Reset view' style={smBtnStyle(undefined, isDark)}>{'\u27F2'}</button>
          <button onClick={toggleGrid} title={showGrid ? 'Hide grid' : 'Show grid'} style={smBtnStyle(showGrid ? '#059669' : undefined, isDark)}>{showGrid ? '#' : '#'}</button>
          <button onClick={addFn} title='Add function' style={smBtnStyle(undefined, isDark)}>+</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0, maxHeight: 80, overflowY: 'auto' }}>
        {functions.map(function(fn, idx) {
          return (
            <div key={fn.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={function() { toggleFn(fn.id) }}
                style={{ width: 14, height: 14, borderRadius: '50%', background: fn.visible ? fn.color : 'transparent',
                  border: '2px solid ' + fn.color, cursor: 'pointer', flexShrink: 0, padding: 0, opacity: fn.visible ? 1 : 0.4 }} />
              <span style={{ fontSize: 10, color: s.text, flexShrink: 0 }}>{'f' + String(idx + 1) + '(x)='}</span>
              <input type='text' value={fn.expr}
                onChange={function(e) { updateFnExpr(fn.id, e.target.value) }}
                placeholder='x^2, sin(x), ...'
                style={{ flex: 1, padding: '3px 6px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', border: '1px solid ' + inputBorder, background: inputBg, color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none', minWidth: 0 }} />
              {functions.length > 1 && (
                <button onClick={function() { removeFn(fn.id) }} title='Remove'
                  style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', opacity: 0.6 }}>{'\u00D7'}</button>
              )}
            </div>
          )
        })}
      </div>

      <div ref={graphContainerRef} style={{ flex: 1, minHeight: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)') }}>
        <Mafs viewBox={{ x: [effectiveXMin, effectiveXMax], y: [effectiveYMin, effectiveYMax] }} preserveAspectRatio={false}>
          <Coordinates.Cartesian
            xAxis={{
              axis: true,
              lines: showGrid ? Math.max(1, Math.round(xRange / xTickStep)) : 0,
              labels: function(v) { return Math.abs(v) < 0.001 ? '0' : String(Math.round(v / xTickStep) * xTickStep) },
            }}
            yAxis={{
              axis: true,
              lines: showGrid ? Math.max(1, Math.round(effectiveYRange / yTickStep)) : 0,
              labels: function(v) { return Math.abs(v) < 0.001 ? '0' : String(Math.round(v / yTickStep) * yTickStep) },
            }}
          />
          {functions.map(function(fn) {
            if (!fn.visible || !fn.expr.trim()) return null
            var parsed = parseExpression(fn.expr)
            return <Plot.OfX key={fn.id} y={parsed} color={fn.color} weight={2} svgPathProps={{ strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }} />
          })}
          {functions.filter(function(f) { return f.visible && f.expr.trim() }).map(function(fn, idx) {
            return (
              <MafsText key={fn.id + '-label'}
                x={effectiveXMin + (effectiveXMax - effectiveXMin) * 0.03}
                y={effectiveYMax - (effectiveYMax - effectiveYMin) * 0.08 - idx * (effectiveYMax - effectiveYMin) * 0.08}
                size={10} attach={'nw' as const} color={fn.color}>
                {'f' + String(idx + 1) + '(x) = ' + fn.expr}
              </MafsText>
            )
          })}
        </Mafs>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
        <span style={{ fontSize: 8, color: s.text, fontStyle: 'italic' }}>Scroll to zoom \u00B7 Auto Y-range</span>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9, color: s.text }}>{'X range'}</span>
          <input type='range' min={1} max={50} value={xRange} onChange={function(e) { setXRange(Number(e.target.value)) }} style={{ flex: 1, cursor: 'pointer' }} />
          <span style={{ fontSize: 9, fontWeight: 600, color: s.bright }}>{String(Math.round(xRange * 2))}</span>
        </div>
      </div>

      <button onClick={function() { setShowPresets(function(p) { return !p }) }}
        style={{ padding: '4px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer', background: showPresets ? 'rgba(5,150,105,0.12)' : inputBg, border: '1px solid ' + (showPresets ? 'rgba(5,150,105,0.3)' : inputBorder), color: showPresets ? '#34d399' : s.text, textAlign: 'left' as const, flexShrink: 0 }}>
        {showPresets ? 'Hide Presets' : 'Quick Presets'}
      </button>

      {showPresets && (
        <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: 120 }}>
          <div style={{ display: 'flex', gap: 3, marginBottom: 6, overflowX: 'auto' }}>
            {ENHANCED_PRESETS.map(function(cat) {
              var isActive = cat.category === presetCategory
              return (
                <button key={cat.category} onClick={function() { setPresetCategory(cat.category) }}
                  style={{ padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600, cursor: 'pointer', background: isActive ? 'rgba(5,150,105,0.15)' : inputBg, border: isActive ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + inputBorder, color: isActive ? '#34d399' : s.text, whiteSpace: 'nowrap' as const }}>
                  {cat.category}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' as const }}>
            {ENHANCED_PRESETS.filter(function(c) { return c.category === presetCategory })[0]?.items.map(function(p) {
              var isActive = functions.some(function(f) { return f.expr === p.expr })
              return (
                <button key={p.expr}
                  onClick={function() {
                    if (!functions[0].expr.trim()) { updateFnExpr(functions[0].id, p.expr) }
                    else { var newId = String(Date.now()); var color = PLOT_COLORS[functions.length % PLOT_COLORS.length]; updateFunctions(functions.concat([{ id: newId, expr: p.expr, color: color, visible: true }])) }
                  }}
                  style={{ padding: '2px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer', fontFamily: 'monospace', background: isActive ? 'rgba(5,150,105,0.15)' : inputBg, border: isActive ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + inputBorder, color: isActive ? '#34d399' : s.text }}>
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}'''

new_lines = lines[:start_line] + [NEW_PLOTTER + '\n'] + lines[end_line:]

with open('/home/z/my-project/src/components/whiteboard/CanvasMathWidgets.tsx', 'w') as f:
    f.writelines(new_lines)

print(f'Replaced lines {start_line+1}-{end_line} with new CanvasFunctionPlotter ({len(NEW_PLOTTER.splitlines())} lines)')
