#!/usr/bin/env python3
"""Rewrite the four measurement tools in CanvasMathWidgets.tsx to be interactive."""

import re

FILE = '/home/z/my-project/src/components/whiteboard/CanvasMathWidgets.tsx'

with open(FILE, 'r') as f:
 content = f.read()

# ============================================================
# 1. Add screenToSvg helper after the ws() function (line ~105)
# ============================================================

helper_code = '''
// ---- SVG coordinate helpers for measurement tools ----

function screenToSvgHelper(svgEl: SVGSVGElement, clientX: number, clientY: number, svgW: number, svgH: number) {
  var rect = svgEl.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 }
  return {
    x: Math.max(0, Math.min(svgW, ((clientX - rect.left) / rect.width) * svgW)),
    y: Math.max(0, Math.min(svgH, ((clientY - rect.top) / rect.height) * svgH)),
  }
}

function mBtn(isDark: boolean, active?: boolean, color?: string): React.CSSProperties {
  var c = color || '#3b82f6'
  return {
    padding: '2px 7px', borderRadius: 3, fontSize: 10, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
    background: active ? (c + '20') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
    border: active ? ('1px solid ' + c + '60') : ('1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)')),
    color: active ? c : (isDark ? '#94a3b8' : '#64748b'),
  }
}
'''

# Insert after the SHADE_COLORS block (before the Fraction Circle comment)
insert_marker = "// ============================================================\n// Fraction Circle Widget"
if insert_marker in content:
 content = content.replace(insert_marker, helper_code + '\n' + insert_marker)
 print("Added helper functions")
else:
 print("WARNING: Could not find insertion point for helpers")


# ============================================================
# 2. Replace CanvasProtractor
# ============================================================

protractor_old_start = "// ============================================================\n// Protractor Widget \u2014 Measure & draw angles\n// ============================================================"
protractor_old_end = "// ============================================================\n// Ruler Widget \u2014 Measure length & draw lines"

protractor_new = '''// ============================================================
// Protractor Widget — Interactive angle measurement
// ============================================================

export function CanvasProtractor({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as {
    cx?: number; cy?: number;
    a1x?: number; a1y?: number;
    a2x?: number; a2y?: number;
  }
  var updateConfig = useConfigUpdater(element.id)
  var s = ws(isDark)
  var ctx: StampCtx = { ex: element.x, ey: element.y }
  var svgRef = useRef<SVGSVGElement>(null)
  var dragRef = useRef<string | null>(null)
  var [pos, setPos] = useState({
    cx: cfg.cx ?? 200, cy: cfg.cy ?? 195,
    a1x: cfg.a1x ?? 200, a1y: cfg.a1y ?? 65,
    a2x: cfg.a2x ?? 330, a2y: cfg.a2y ?? 195,
  })
  var { cx, cy, a1x, a1y, a2x, a2y } = pos

  // Sync from config when it changes externally (undo/redo)
  var cfgKey = (cfg.cx ?? 0) + ',' + (cfg.cy ?? 0) + ',' + (cfg.a1x ?? 0) + ',' + (cfg.a1y ?? 0) + ',' + (cfg.a2x ?? 0) + ',' + (cfg.a2y ?? 0)
  var lastKeyRef = useRef('')
  useEffect(function() {
    if (cfgKey !== lastKeyRef.current && !dragRef.current) {
      lastKeyRef.current = cfgKey
      setPos({
        cx: cfg.cx ?? 200, cy: cfg.cy ?? 195,
        a1x: cfg.a1x ?? 200, a1y: cfg.a1y ?? 65,
        a2x: cfg.a2x ?? 330, a2y: cfg.a2y ?? 195,
      })
    }
  })

  // Calculate angle between the two arms
  var a1Rad = Math.atan2(a1y - cy, a1x - cx)
  var a2Rad = Math.atan2(a2y - cy, a2x - cx)
  var angleRaw = Math.abs(a1Rad - a2Rad) * 180 / Math.PI
  if (angleRaw > 180) angleRaw = 360 - angleRaw
  var angleDeg = Math.round(angleRaw * 10) / 10

  // Arc path for the angle indicator
  var arcR = 28
  var cwDist = ((a2Rad - a1Rad) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
  var sweep = cwDist <= Math.PI ? 1 : 0
  var arcX1 = cx + arcR * Math.cos(a1Rad)
  var arcY1 = cy + arcR * Math.sin(a1Rad)
  var arcX2 = cx + arcR * Math.cos(a2Rad)
  var arcY2 = cy + arcR * Math.sin(a2Rad)
  var angleArcD = 'M ' + cx + ' ' + cy + ' L ' + arcX1.toFixed(1) + ' ' + arcY1.toFixed(1) +
    ' A ' + arcR + ' ' + arcR + ' 0 0 ' + sweep + ' ' + arcX2.toFixed(1) + ' ' + arcY2.toFixed(1) + ' Z'

  // Protractor scale geometry
  var svgW = 400
  var svgH = 350
  var R = 130
  var innerR = 100
  var ticks: Array<{ x1: number; y1: number; x2: number; y2: number; label: string; deg: number }> = []
  for (var deg = 0; deg <= 180; deg += 1) {
    var aRad = (deg - 90) * Math.PI / 180
    var isMajor = deg % 10 === 0
    var isMid = deg % 5 === 0
    var oR = isMajor ? R : isMid ? R - 5 : R - 2
    ticks.push({
      x1: cx + innerR * Math.cos(aRad), y1: cy + innerR * Math.sin(aRad),
      x2: cx + oR * Math.cos(aRad), y2: cy + oR * Math.sin(aRad),
      label: isMajor ? ('' + deg) : '', deg: deg,
    })
  }
  var protractorPath = 'M ' + (cx - R) + ' ' + cy + ' A ' + R + ' ' + R + ' 0 0 1 ' + (cx + R) + ' ' + cy +
    ' L ' + (cx + innerR) + ' ' + cy + ' A ' + innerR + ' ' + innerR + ' 0 0 0 ' + (cx - innerR) + ' ' + cy + ' Z'

  function handleDown(e: React.PointerEvent, id: string) {
    e.stopPropagation()
    dragRef.current = id
    try { (e.target as Element).setPointerCapture(e.pointerId) } catch(_) {}
  }
  function handleSvgMove(e: React.PointerEvent) {
    if (!dragRef.current || !svgRef.current) return
    e.stopPropagation()
    var pt = screenToSvgHelper(svgRef.current, e.clientX, e.clientY, svgW, svgH)
    setPos(function(prev) {
      if (dragRef.current === 'center') {
        var dx = pt.x - prev.cx
        var dy = pt.y - prev.cy
        return { cx: pt.x, cy: pt.y, a1x: prev.a1x + dx, a1y: prev.a1y + dy, a2x: prev.a2x + dx, a2y: prev.a2y + dy }
      }
      if (dragRef.current === 'arm1') return { ...prev, a1x: pt.x, a1y: pt.y }
      if (dragRef.current === 'arm2') return { ...prev, a2x: pt.x, a2y: pt.y }
      return prev
    })
  }
  function handleSvgUp(e: React.PointerEvent) {
    if (!dragRef.current) return
    e.stopPropagation()
    dragRef.current = null
    // Save current pos to config for persistence
    setPos(function(p) {
      updateConfig({ cx: p.cx, cy: p.cy, a1x: p.a1x, a1y: p.a1y, a2x: p.a2x, a2y: p.a2y })
      lastKeyRef.current = p.cx + ',' + p.cy + ',' + p.a1x + ',' + p.a1y + ',' + p.a2x + ',' + p.a2y
      return p
    })
  }
  function resetProtractor() {
    var defaults = { cx: 200, cy: 195, a1x: 200, a1y: 65, a2x: 330, a2y: 195 }
    setPos(defaults)
    updateConfig(defaults)
    lastKeyRef.current = '200,195,200,65,330,195'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'inherit', overflow: 'hidden' }}>
      {/* Header with angle readout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Protractor</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' as const }}>{angleDeg}<span style={{ fontSize: 12, fontWeight: 500 }}>°</span></span>
      </div>
      {/* Interactive SVG */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minHeight: 0 }}>
        <svg ref={svgRef} width="100%" height="100%" viewBox={'0 0 ' + svgW + ' ' + svgH}
          onPointerMove={handleSvgMove} onPointerUp={handleSvgUp}
          style={{ overflow: 'visible', touchAction: 'none' }}>
          {/* Protractor body - semi-transparent */}
          <path d={protractorPath}
            fill={isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.04)'}
            stroke={isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.25)'} strokeWidth={1} />
          {/* Baseline */}
          <line x1={cx - R - 5} y1={cy} x2={cx + R + 5} y2={cy}
            stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'} strokeWidth={0.5} />
          {/* Center vertical line */}
          <line x1={cx} y1={cy} x2={cx} y2={cy - R}
            stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} strokeWidth={0.5} />
          {/* Degree ticks */}
          {ticks.map(function(tick, i) {
            return (
              <g key={'pt' + i}>
                <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
                  stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
                  strokeWidth={tick.label ? 0.7 : 0.3} />
                {tick.label && (
                  <text x={cx + (R + 11) * Math.cos((tick.deg - 90) * Math.PI / 180)}
                    y={cy + (R + 11) * Math.sin((tick.deg - 90) * Math.PI / 180) + 3}
                    textAnchor={'middle'} fontSize={7} fontWeight={600}
                    fill={isDark ? 'rgba(226,232,240,0.4)' : 'rgba(30,41,59,0.4)'}>{tick.label}</text>
                )}
              </g>
            )
          })}
          {/* Angle arc fill */}
          <path d={angleArcD} fill='rgba(245,158,11,0.2)' stroke='#f59e0b' strokeWidth={1} />
          {/* Arm 1 line */}
          <line x1={cx} y1={cy} x2={a1x} y2={a1y}
            stroke='#3b82f6' strokeWidth={2} strokeLinecap='round' opacity={0.9} />
          {/* Arm 2 line */}
          <line x1={cx} y1={cy} x2={a2x} y2={a2y}
            stroke='#f59e0b' strokeWidth={2} strokeLinecap='round' opacity={0.9} />
          {/* Center handle */}
          <circle cx={cx} cy={cy} r={9}
            fill={isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)'}
            stroke='#3b82f6' strokeWidth={1.5}
            onPointerDown={function(e) { handleDown(e, 'center') }}
            style={{ cursor: 'move' }} role="slider" aria-label="Drag to move center" />
          {/* Arm 1 handle */}
          <circle cx={a1x} cy={a1y} r={7}
            fill={isDark ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.12)'}
            stroke='#3b82f6' strokeWidth={2}
            onPointerDown={function(e) { handleDown(e, 'arm1') }}
            style={{ cursor: 'crosshair' }} role="slider" aria-label="Drag arm 1" />
          {/* Arm 2 handle */}
          <circle cx={a2x} cy={a2y} r={7}
            fill={isDark ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.12)'}
            stroke='#f59e0b' strokeWidth={2}
            onPointerDown={function(e) { handleDown(e, 'arm2') }}
            style={{ cursor: 'crosshair' }} role="slider" aria-label="Drag arm 2" />
          {/* Handle labels */}
          <text x={cx + 12} y={cy + 4} fontSize={8} fontWeight={700}
            fill={isDark ? 'rgba(96,165,250,0.7)' : 'rgba(59,130,246,0.6)'}>V</text>
          <text x={a1x + (a1x > cx ? 10 : -14)} y={a1y + (a1y > cy ? 14 : -6)} fontSize={8} fontWeight={700}
            fill={isDark ? 'rgba(96,165,250,0.7)' : 'rgba(59,130,246,0.6)'}>A</text>
          <text x={a2x + (a2x > cx ? 10 : -14)} y={a2y + (a2y > cy ? 14 : -6)} fontSize={8} fontWeight={700}
            fill={isDark ? 'rgba(251,191,36,0.7)' : 'rgba(245,158,11,0.6)'}>B</text>
        </svg>
      </div>
      {/* Footer buttons */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0, padding: '2px 0' }}>
        <button onClick={resetProtractor} style={mBtn(isDark)}>Reset</button>
        <button onClick={function() {
          useWhiteboardStore.getState().pushHistory()
          useWhiteboardStore.getState().addElement({
            id: generateId(), type: 'line',
            x: ctx.ex + cx, y: ctx.ey + cy,
            x2: ctx.ex + a1x, y2: ctx.ey + a1y,
            width: 0, height: 0, rotation: 0,
            opacity: useWhiteboardStore.getState().style.opacity,
            strokeColor: '#3b82f6', fillColor: 'transparent',
            strokeWidth: 2, locked: false,
            pageIndex: useWhiteboardStore.getState().currentPageIndex,
          } as any)
          useWhiteboardStore.getState().addElement({
            id: generateId(), type: 'line',
            x: ctx.ex + cx, y: ctx.ey + cy,
            x2: ctx.ex + a2x, y2: ctx.ey + a2y,
            width: 0, height: 0, rotation: 0,
            opacity: useWhiteboardStore.getState().style.opacity,
            strokeColor: '#f59e0b', fillColor: 'transparent',
            strokeWidth: 2, locked: false,
            pageIndex: useWhiteboardStore.getState().currentPageIndex,
          } as any)
        }} style={mBtn(isDark, false, '#3b82f6')}>Draw Angle</button>
        <span style={{ fontSize: 8, color: s.text, marginLeft: 'auto', opacity: 0.7 }}>Drag V, A, B handles</span>
      </div>
    </div>
  )
}

'''

# Find the section between protractor and ruler markers
pattern = re.escape(protractor_old_start) + r'[\s\S]*?(?=' + re.escape(protractor_old_end) + ')'
match = re.search(pattern, content)
if match:
 content = content[:match.start()] + protractor_new + content[match.end():]
 print("Replaced CanvasProtractor")
else:
 print("WARNING: Could not find CanvasProtractor section")

# ============================================================
# 3. Replace CanvasRuler
# ============================================================

ruler_old_end = "// ============================================================\n// Set Square Widget \u2014 Draw triangles"

ruler_new = '''// ============================================================
// Ruler Widget — Interactive length measurement
// ============================================================

export function CanvasRuler({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as {
    p1x?: number; p1y?: number; p2x?: number; p2y?: number;
    unit?: string;
  }
  var updateConfig = useConfigUpdater(element.id)
  var s = ws(isDark)
  var ctx: StampCtx = { ex: element.x, ey: element.y }
  var svgRef = useRef<SVGSVGElement>(null)
  var dragRef = useRef<string | null>(null)
  var [pos, setPos] = useState({
    p1x: cfg.p1x ?? 40, p1y: cfg.p1y ?? 130,
    p2x: cfg.p2x ?? 460, p2y: cfg.p2y ?? 130,
  })
  var unit = (cfg.unit || 'cm') as string
  var { p1x, p1y, p2x, p2y } = pos

  // Sync from config
  var cfgKey = (cfg.p1x ?? 0) + ',' + (cfg.p1y ?? 0) + ',' + (cfg.p2x ?? 0) + ',' + (cfg.p2y ?? 0)
  var lastKeyRef = useRef('')
  useEffect(function() {
    if (cfgKey !== lastKeyRef.current && !dragRef.current) {
      lastKeyRef.current = cfgKey
      setPos({ p1x: cfg.p1x ?? 40, p1y: cfg.p1y ?? 130, p2x: cfg.p2x ?? 460, p2y: cfg.p2y ?? 130 })
    }
  })

  // Calculate distance
  var dx = p2x - p1x
  var dy = p2y - p1y
  var pixelLen = Math.sqrt(dx * dx + dy * dy)
  var pxPerCm = 24
  var cmVal = pixelLen / pxPerCm
  var displayVal = unit === 'inch' ? (cmVal / 2.54).toFixed(2) : cmVal.toFixed(1)
  var displayUnit = unit === 'inch' ? 'in' : 'cm'

  // Direction vectors for ruler ticks
  var len = pixelLen || 1
  var dirX = dx / len
  var dirY = dy / len
  var perpX = -dirY
  var perpY = dirX
  var rulerHW = 16

  // Build tick marks along the ruler
  var tickMarks: Array<{ x1: number; y1: number; x2: number; y2: number; label: string; major: boolean; lx: number; ly: number }> = []
  if (pixelLen > 5) {
    var maxTick = Math.floor(pixelLen / pxPerCm)
    for (var cm = 0; cm <= maxTick; cm++) {
      var t = (cm * pxPerCm) / pixelLen
      if (t > 1.001) break
      t = Math.min(t, 1)
      var tx = p1x + dx * t
      var ty = p1y + dy * t
      var isMajor = cm % 5 === 0
      var tLen = isMajor ? rulerHW : rulerHW * 0.55
      tickMarks.push({
        x1: tx + perpX * tLen, y1: ty + perpY * tLen,
        x2: tx - perpX * tLen, y2: ty - perpY * tLen,
        label: isMajor ? ('' + cm) : '', major: isMajor,
        lx: tx - perpX * (rulerHW + 8), ly: ty - perpY * (rulerHW + 8) + 3,
      })
      // Half-cm tick
      if (cm < maxTick) {
        var ht = (cm * pxPerCm + pxPerCm / 2) / pixelLen
        if (ht <= 1) {
          var htx = p1x + dx * ht
          var hty = p1y + dy * ht
          tickMarks.push({
            x1: htx + perpX * rulerHW * 0.3, y1: hty + perpY * rulerHW * 0.3,
            x2: htx - perpX * rulerHW * 0.3, y2: hty - perpY * rulerHW * 0.3,
            label: '', major: false, lx: 0, ly: 0,
          })
        }
      }
    }
  }

  var svgW = 500
  var svgH = 260

  function handleDown(e: React.PointerEvent, id: string) {
    e.stopPropagation()
    dragRef.current = id
    try { (e.target as Element).setPointerCapture(e.pointerId) } catch(_) {}
  }
  function handleSvgMove(e: React.PointerEvent) {
    if (!dragRef.current || !svgRef.current) return
    e.stopPropagation()
    var pt = screenToSvgHelper(svgRef.current, e.clientX, e.clientY, svgW, svgH)
    setPos(function(prev) {
      if (dragRef.current === 'p1') return { ...prev, p1x: pt.x, p1y: pt.y }
      if (dragRef.current === 'p2') return { ...prev, p2x: pt.x, p2y: pt.y }
      return prev
    })
  }
  function handleSvgUp(e: React.PointerEvent) {
    if (!dragRef.current) return
    e.stopPropagation()
    dragRef.current = null
    setPos(function(p) {
      updateConfig({ p1x: p.p1x, p1y: p.p1y, p2x: p.p2x, p2y: p.p2y, unit: unit })
      lastKeyRef.current = p.p1x + ',' + p.p1y + ',' + p.p2x + ',' + p.p2y
      return p
    })
  }
  function resetRuler() {
    var defaults = { p1x: 40, p1y: 130, p2x: 460, p2y: 130 }
    setPos(defaults)
    updateConfig({ ...defaults, unit: unit })
    lastKeyRef.current = '40,130,460,130'
  }

  // Midpoint for label
  var midX = (p1x + p2x) / 2
  var midY = (p1y + p2y) / 2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'inherit', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Ruler</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#eab308', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' as const }}>{displayVal}<span style={{ fontSize: 12, fontWeight: 500 }}> {displayUnit}</span></span>
        {(['cm', 'inch'] as const).map(function(u) {
          return (
            <button key={u} onClick={function() { updateConfig({ p1x: pos.p1x, p1y: pos.p1y, p2x: pos.p2x, p2y: pos.p2y, unit: u }) }}
              style={mBtn(isDark, unit === u, '#eab308')}>{u}</button>
          )
        })}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minHeight: 0 }}>
        <svg ref={svgRef} width="100%" height="100%" viewBox={'0 0 ' + svgW + ' ' + svgH}
          onPointerMove={handleSvgMove} onPointerUp={handleSvgUp}
          style={{ overflow: 'visible', touchAction: 'none' }}>
          {/* Ruler body between endpoints */}
          {pixelLen > 5 && (
            <polygon
              points={tickMarks.filter(function(t) { return t.major }).map(function(t, i) {
                if (i === 0) return t.x1 + ',' + t.y1
                if (i === tickMarks.filter(function(tt) { return tt.major }).length - 1) return t.x1 + ',' + t.y1
                return ''
              }).filter(Boolean).join(' ')}
              fill={isDark ? 'rgba(234,179,8,0.04)' : 'rgba(234,179,8,0.03)'}
              stroke={isDark ? 'rgba(234,179,8,0.25)' : 'rgba(180,130,0,0.3)'} strokeWidth={0.5} />
          )}
          {/* Tick marks */}
          {tickMarks.map(function(tick, i) {
            return (
              <g key={'rt' + i}>
                <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
                  stroke={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'}
                  strokeWidth={tick.major ? 0.8 : 0.4} />
                {tick.label && tick.major && (
                  <text x={tick.lx} y={tick.ly} textAnchor={'middle'} fontSize={7} fontWeight={600}
                    fill={isDark ? 'rgba(226,232,240,0.4)' : 'rgba(30,41,59,0.4)'}>{tick.label}</text>
                )}
              </g>
            )
          })}
          {/* Measurement line */}
          <line x1={p1x} y1={p1y} x2={p2x} y2={p2y}
            stroke='#ef4444' strokeWidth={2.5} strokeLinecap='round' opacity={0.85} />
          {/* Endpoint 1 handle */}
          <circle cx={p1x} cy={p1y} r={7}
            fill={isDark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.12)'}
            stroke='#ef4444' strokeWidth={2}
            onPointerDown={function(e) { handleDown(e, 'p1') }}
            style={{ cursor: 'crosshair' }} role="slider" aria-label="Drag endpoint 1" />
          {/* Endpoint 2 handle */}
          <circle cx={p2x} cy={p2y} r={7}
            fill={isDark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.12)'}
            stroke='#ef4444' strokeWidth={2}
            onPointerDown={function(e) { handleDown(e, 'p2') }}
            style={{ cursor: 'crosshair' }} role="slider" aria-label="Drag endpoint 2" />
          {/* Length label at midpoint */}
          <text x={midX + perpX * 22} y={midY + perpY * 22}
            textAnchor={'middle'} fontSize={11} fontWeight={700} fill='#ef4444'>{displayVal} {displayUnit}</text>
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0, padding: '2px 0' }}>
        <button onClick={resetRuler} style={mBtn(isDark)}>Reset</button>
        <button onClick={function() {
          useWhiteboardStore.getState().pushHistory()
          useWhiteboardStore.getState().addElement({
            id: generateId(), type: 'line',
            x: ctx.ex + p1x, y: ctx.ey + p1y,
            x2: ctx.ex + p2x, y2: ctx.ey + p2y,
            width: 0, height: 0, rotation: 0,
            opacity: useWhiteboardStore.getState().style.opacity,
            strokeColor: '#ef4444', fillColor: 'transparent',
            strokeWidth: 2, locked: false,
            pageIndex: useWhiteboardStore.getState().currentPageIndex,
          } as any)
        }} style={mBtn(isDark, false, '#ef4444')}>Draw Line</button>
        <span style={{ fontSize: 8, color: s.text, marginLeft: 'auto', opacity: 0.7 }}>Drag endpoints to measure</span>
      </div>
    </div>
  )
}

'''

# Find section between ruler start and set square
ruler_start = "// ============================================================\n// Ruler Widget \u2014 Measure length & draw lines"
pattern = re.escape(ruler_start) + r'[\s\S]*?(?=' + re.escape(ruler_old_end) + ')'
match = re.search(pattern, content)
if match:
 content = content[:match.start()] + ruler_new + content[match.end():]
 print("Replaced CanvasRuler")
else:
 print("WARNING: Could not find CanvasRuler section")

# ============================================================
# 4. Replace CanvasSetSquare
# ============================================================

setsquare_old_end = "// ============================================================\n// Compass Widget \u2014 Draw circles & arcs"

setsquare_new = '''// ============================================================
// Set Square Widget — Interactive triangle overlay
// ============================================================

export function CanvasSetSquare({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { triType?: string; size?: number; rotation?: number }
  var triType = cfg.triType || '45'
  var triSize = cfg.size ?? 200
  var rotation = cfg.rotation ?? 0
  var updateConfig = useConfigUpdater(element.id)
  var s = ws(isDark)
  var ctx: StampCtx = { ex: element.x, ey: element.y }

  var svgW = 360
  var svgH = 340
  var cxC = svgW / 2
  var cyC = svgH / 2 + 10

  // Triangle vertices
  var verts: Array<{ x: number; y: number }> = []
  var angleLabels: Array<{ x: number; y: number; text: string }> = []
  var rightAnglePath = ''
  var sz = triSize

  if (triType === '30') {
    // 30-60-90: right angle at A, 30 deg at B, 60 deg at C
    var ax = cxC - sz / 2
    var ay = cyC + sz / 3
    var bx = cxC + sz / 2
    var by = cyC + sz / 3
    var hx = ax + sz * Math.cos(60 * Math.PI / 180)
    var hy = ay - sz * Math.sin(60 * Math.PI / 180)
    verts = [{ x: ax, y: ay }, { x: bx, y: by }, { x: hx, y: hy }]
    rightAnglePath = 'M ' + (ax + 14) + ' ' + ay + ' L ' + (ax + 14) + ' ' + (ay - 14) + ' L ' + ax + ' ' + (ay - 14)
    angleLabels = [
      { x: ax - 10, y: ay + 14, text: '90°' },
      { x: bx + 8, y: by + 14, text: '30°' },
      { x: hx - 16, y: hy - 8, text: '60°' },
    ]
  } else {
    // 45-45-90: right angle at A
    var a1x = cxC - sz / 2
    var a1y = cyC + sz / 3
    var b1x = cxC + sz / 2
    var b1y = cyC + sz / 3
    var c1x = cxC - sz / 2
    var c1y = cyC - sz * 2 / 3
    verts = [{ x: a1x, y: a1y }, { x: b1x, y: b1y }, { x: c1x, y: c1y }]
    rightAnglePath = 'M ' + (a1x + 16) + ' ' + a1y + ' L ' + (a1x + 16) + ' ' + (a1y - 16) + ' L ' + a1x + ' ' + (a1y - 16)
    angleLabels = [
      { x: a1x - 10, y: a1y + 14, text: '90°' },
      { x: b1x + 8, y: b1y + 14, text: '45°' },
      { x: c1x - 16, y: c1y + 4, text: '45°' },
    ]
  }

  var points = verts.map(function(v) { return v.x + ',' + v.y }).join(' ')
  var rotStr = 'rotate(' + rotation + ' ' + cxC + ' ' + cyC + ')'

  function handleWheel(e: React.WheelEvent) {
    e.stopPropagation()
    var newRot = (rotation + (e.deltaY > 0 ? 5 : -5) + 360) % 360
    updateConfig({ triType: triType, size: triSize, rotation: newRot })
  }

  var drawTriangleOnCanvas = useCallback(function() {
    var store = useWhiteboardStore.getState()
    store.pushHistory()
    for (var i = 0; i < verts.length; i++) {
      var j = (i + 1) % verts.length
      store.addElement({
        id: generateId(), type: 'line',
        x: ctx.ex + verts[i].x, y: ctx.ey + verts[i].y,
        x2: ctx.ex + verts[j].x, y2: ctx.ey + verts[j].y,
        width: 0, height: 0, rotation: 0,
        opacity: store.style.opacity,
        strokeColor: '#8b5cf6', fillColor: 'transparent',
        strokeWidth: 2, locked: false,
        pageIndex: store.currentPageIndex,
      } as any)
    }
  }, [verts, ctx])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'inherit', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 2px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Set Square</span>
        {(['45', '30'] as const).map(function(t) {
          return (
            <button key={t} onClick={function() { updateConfig({ triType: t, size: triSize, rotation: rotation }) }}
              style={mBtn(isDark, triType === t, '#8b5cf6')}>{t === '45' ? '45-45-90' : '30-60-90'}</button>
          )
        })}
        <span style={{ fontSize: 9, color: s.text }}>Size</span>
        <input type="range" min={60} max={260} value={triSize}
          onChange={function(e) { updateConfig({ triType: triType, size: Number(e.target.value), rotation: rotation }) }}
          style={{ width: 50, cursor: 'pointer' }} />
        <span style={{ fontSize: 9, color: s.text, marginLeft: 'auto' }}>Scroll to rotate</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minHeight: 0 }}>
        <svg width="100%" height="100%" viewBox={'0 0 ' + svgW + ' ' + svgH}
          onWheel={handleWheel} style={{ overflow: 'visible' }}>
          <g transform={rotStr}>
            <polygon points={points}
              fill={isDark ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.04)'}
              stroke={isDark ? 'rgba(139,92,246,0.4)' : 'rgba(109,40,217,0.35)'} strokeWidth={2} />
            <path d={rightAnglePath} fill='none'
              stroke={isDark ? 'rgba(139,92,246,0.5)' : 'rgba(109,40,217,0.4)'} strokeWidth={1} />
            {angleLabels.map(function(lbl, i) {
              return (
                <text key={'al' + i} x={lbl.x} y={lbl.y} textAnchor={'middle'}
                  fontSize={10} fontWeight={700}
                  fill={isDark ? 'rgba(196,181,253,0.7)' : 'rgba(124,58,237,0.6)'}>{lbl.text}</text>
              )
            })}
          </g>
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0, padding: '2px 0' }}>
        <button onClick={function() { updateConfig({ triType: triType, size: triSize, rotation: 0 }) }}
          style={mBtn(isDark)}>Reset Rotation</button>
        <button onClick={drawTriangleOnCanvas}
          style={{ marginLeft: 'auto', ...mBtn(isDark, false, '#8b5cf6') }}>Draw Triangle</button>
      </div>
    </div>
  )
}

'''

ss_start = "// ============================================================\n// Set Square Widget \u2014 Draw triangles"
pattern = re.escape(ss_start) + r'[\s\S]*?(?=' + re.escape(setsquare_old_end) + ')'
match = re.search(pattern, content)
if match:
 content = content[:match.start()] + setsquare_new + content[match.end():]
 print("Replaced CanvasSetSquare")
else:
 print("WARNING: Could not find CanvasSetSquare section")

# ============================================================
# 5. Replace CanvasCompass
# ============================================================

compass_old_end = "// ============================================================\n// Place Value Chart Widget"

compass_new = '''// ============================================================
// Compass Widget — Interactive circle/arc drawing
// ============================================================

export function CanvasCompass({ element, isDark }: CanvasWidgetProps) {
  const cfg = element.config as { ccx?: number; ccy?: number; radius?: number; arcStart?: number; arcEnd?: number }
  var updateConfig = useConfigUpdater(element.id)
  var s = ws(isDark)
  var ctx: StampCtx = { ex: element.x, ey: element.y }
  var svgRef = useRef<SVGSVGElement>(null)
  var dragRef = useRef<string | null>(null)
  var svgW = 380
  var svgH = 360
  var [pos, setPos] = useState({
    ccx: cfg.ccx ?? 190, ccy: cfg.ccy ?? 190, radius: cfg.radius ?? 100,
  })
  var arcStart = cfg.arcStart ?? 0
  var arcEnd = cfg.arcEnd ?? 360
  var { ccx, ccy, radius } = pos

  // Sync from config
  var cfgKey = (cfg.ccx ?? 0) + ',' + (cfg.ccy ?? 0) + ',' + (cfg.radius ?? 0)
  var lastKeyRef = useRef('')
  useEffect(function() {
    if (cfgKey !== lastKeyRef.current && !dragRef.current) {
      lastKeyRef.current = cfgKey
      setPos({ ccx: cfg.ccx ?? 190, ccy: cfg.ccy ?? 190, radius: cfg.radius ?? 100 })
    }
  })

  var isFullCircle = Math.abs(arcEnd - arcStart) >= 360
  var arcStartRad = (arcStart - 90) * Math.PI / 180
  var arcEndRad = (arcEnd - 90) * Math.PI / 180
  var largeArc = (arcEnd - arcStart) > 180 ? 1 : 0
  var circleX1 = ccx + radius * Math.cos(arcStartRad)
  var circleY1 = ccy + radius * Math.sin(arcStartRad)
  var circleX2 = ccx + radius * Math.cos(arcEndRad)
  var circleY2 = ccy + radius * Math.sin(arcEndRad)
  var arcPath = 'M ' + circleX1.toFixed(1) + ' ' + circleY1.toFixed(1) + ' A ' + radius + ' ' + radius + ' 0 ' + largeArc + ' 1 ' + circleX2.toFixed(1) + ' ' + circleY2.toFixed(1)

  function handleDown(e: React.PointerEvent, id: string) {
    e.stopPropagation()
    dragRef.current = id
    try { (e.target as Element).setPointerCapture(e.pointerId) } catch(_) {}
  }
  function handleSvgMove(e: React.PointerEvent) {
    if (!dragRef.current || !svgRef.current) return
    e.stopPropagation()
    var pt = screenToSvgHelper(svgRef.current, e.clientX, e.clientY, svgW, svgH)
    setPos(function(prev) {
      if (dragRef.current === 'center') {
        return { ccx: pt.x, ccy: pt.y, radius: prev.radius }
      }
      if (dragRef.current === 'radius') {
        var dx = pt.x - prev.ccx
        var dy = pt.y - prev.ccy
        var r = Math.max(20, Math.min(160, Math.round(Math.sqrt(dx * dx + dy * dy))))
        return { ...prev, radius: r }
      }
      return prev
    })
  }
  function handleSvgUp(e: React.PointerEvent) {
    if (!dragRef.current) return
    e.stopPropagation()
    dragRef.current = null
    setPos(function(p) {
      updateConfig({ ccx: p.ccx, ccy: p.ccy, radius: p.radius, arcStart: arcStart, arcEnd: arcEnd })
      lastKeyRef.current = p.ccx + ',' + p.ccy + ',' + p.radius
      return p
    })
  }

  function drawCircleOnCanvas() {
    var store = useWhiteboardStore.getState()
    store.pushHistory()
    if (isFullCircle) {
      store.addElement({
        id: generateId(), type: 'ellipse',
        x: ctx.ex + ccx - radius, y: ctx.ey + ccy - radius,
        width: radius * 2, height: radius * 2, rotation: 0,
        opacity: store.style.opacity,
        strokeColor: '#059669', fillColor: 'transparent',
        strokeWidth: 2, locked: false,
        pageIndex: store.currentPageIndex,
      } as any)
    } else {
      var steps = Math.max(8, Math.round(Math.abs(arcEnd - arcStart) / 3))
      for (var i = 0; i < steps; i++) {
        var a1 = ((arcStart + (arcEnd - arcStart) * i / steps) - 90) * Math.PI / 180
        var a2 = ((arcStart + (arcEnd - arcStart) * (i + 1) / steps) - 90) * Math.PI / 180
        store.addElement({
          id: generateId(), type: 'line',
          x: ctx.ex + ccx + radius * Math.cos(a1),
          y: ctx.ey + ccy + radius * Math.sin(a1),
          x2: ctx.ex + ccx + radius * Math.cos(a2),
          y2: ctx.ey + ccy + radius * Math.sin(a2),
          width: 0, height: 0, rotation: 0,
          opacity: store.style.opacity,
          strokeColor: '#059669', fillColor: 'transparent',
          strokeWidth: 2, locked: false,
          pageIndex: store.currentPageIndex,
        } as any)
      }
    }
  }

  // Radius handle position
  var rhx = ccx + radius
  var rhy = ccy

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'inherit', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 2px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Compass</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: s.accent }}>r = {radius}</span>
        <span style={{ fontSize: 9, color: s.text }}>Arc</span>
        <input type="range" min={0} max={360} value={arcStart}
          onChange={function(e) { updateConfig({ ccx: pos.ccx, ccy: pos.ccy, radius: pos.radius, arcStart: Number(e.target.value), arcEnd: arcEnd }) }}
          style={{ width: 40, cursor: 'pointer' }} />
        <span style={{ fontSize: 8, color: s.text }}>to</span>
        <input type="range" min={0} max={360} value={arcEnd}
          onChange={function(e) { updateConfig({ ccx: pos.ccx, ccy: pos.ccy, radius: pos.radius, arcStart: arcStart, arcEnd: Number(e.target.value) }) }}
          style={{ width: 40, cursor: 'pointer' }} />
        <span style={{ fontSize: 9, fontWeight: 600, color: s.accent }}>{arcStart}-{arcEnd}°</span>
        <button onClick={function() { updateConfig({ ccx: pos.ccx, ccy: pos.ccy, radius: pos.radius, arcStart: 0, arcEnd: 360 }) }}
          style={mBtn(isDark)}>Full</button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minHeight: 0 }}>
        <svg ref={svgRef} width="100%" height="100%" viewBox={'0 0 ' + svgW + ' ' + svgH}
          onPointerMove={handleSvgMove} onPointerUp={handleSvgUp}
          style={{ overflow: 'visible', touchAction: 'none' }}>
          {/* Circle/arc preview */}
          {isFullCircle && (
            <circle cx={ccx} cy={ccy} r={radius} fill='none'
              stroke={isDark ? 'rgba(52,211,153,0.4)' : 'rgba(5,150,105,0.4)'}
              strokeWidth={1.5} strokeDasharray='5 3' />
          )}
          {!isFullCircle && (
            <path d={arcPath} fill='none'
              stroke={isDark ? 'rgba(52,211,153,0.4)' : 'rgba(5,150,105,0.4)'}
              strokeWidth={1.5} strokeDasharray='5 3' />
          )}
          {/* Radius line */}
          <line x1={ccx} y1={ccy} x2={rhx} y2={rhy}
            stroke={isDark ? 'rgba(52,211,153,0.3)' : 'rgba(5,150,105,0.3)'} strokeWidth={1} strokeDasharray='3 3' />
          {/* Compass arms decorative */}
          <line x1={ccx} y1={ccy + 50} x2={ccx - 12} y2={ccy - 45}
            stroke={isDark ? 'rgba(148,163,184,0.4)' : 'rgba(71,85,105,0.3)'} strokeWidth={2.5} strokeLinecap='round' />
          <line x1={ccx} y1={ccy + 50} x2={ccx + 12} y2={ccy - 45}
            stroke={isDark ? 'rgba(148,163,184,0.4)' : 'rgba(71,85,105,0.3)'} strokeWidth={2.5} strokeLinecap='round' />
          {/* Center handle */}
          <circle cx={ccx} cy={ccy} r={8}
            fill={isDark ? 'rgba(5,150,105,0.15)' : 'rgba(5,150,105,0.08)'}
            stroke='#059669' strokeWidth={1.5}
            onPointerDown={function(e) { handleDown(e, 'center') }}
            style={{ cursor: 'move' }} role="slider" aria-label="Drag to move center" />
          {/* Radius handle */}
          <circle cx={rhx} cy={rhy} r={7}
            fill={isDark ? 'rgba(52,211,153,0.25)' : 'rgba(52,211,153,0.12)'}
            stroke='#059669' strokeWidth={2}
            onPointerDown={function(e) { handleDown(e, 'radius') }}
            style={{ cursor: 'crosshair' }} role="slider" aria-label="Drag to set radius" />
          <text x={ccx + radius / 2} y={ccy - 6} textAnchor={'middle'} fontSize={9} fontWeight={600}
            fill={isDark ? '#34d399' : '#059669'}>r={radius}</text>
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0, padding: '2px 0' }}>
        {[40, 60, 80, 100, 120].map(function(r) {
          return (
            <button key={r} onClick={function() { setPos({ ccx: ccx, ccy: ccy, radius: r }); updateConfig({ ccx: ccx, ccy: ccy, radius: r, arcStart: arcStart, arcEnd: arcEnd }) }}
              style={mBtn(isDark, radius === r, '#059669')}>r={r}</button>
          )
        })}
        <button onClick={drawCircleOnCanvas}
          style={{ marginLeft: 'auto', ...mBtn(isDark, false, '#059669') }}>{isFullCircle ? 'Draw Circle' : 'Draw Arc'}</button>
      </div>
    </div>
  )
}

'''

c_start = "// ============================================================\n// Compass Widget \u2014 Draw circles & arcs"
pattern = re.escape(c_start) + r'[\s\S]*?(?=' + re.escape(compass_old_end) + ')'
match = re.search(pattern, content)
if match:
 content = content[:match.start()] + compass_new + content[match.end():]
 print("Replaced CanvasCompass")
else:
 print("WARNING: Could not find CanvasCompass section")

# ============================================================
# 6. Update default configs
# ============================================================

old_configs = "    case 'math-protractor': return { rotation: 0, measureAngle: 45 }\n    case 'math-ruler': return { unit: 'cm', lineLen: 10, lineAngle: 0 }\n    case 'math-set-square': return { triangleType: '45', showAngles: true, size: 200 }\n    case 'math-compass': return { radius: 100, showCircle: true, arcStart: 0, arcEnd: 360 }"
new_configs = "    case 'math-protractor': return { cx: 200, cy: 195, a1x: 200, a1y: 65, a2x: 330, a2y: 195 }\n    case 'math-ruler': return { p1x: 40, p1y: 130, p2x: 460, p2y: 130, unit: 'cm' }\n    case 'math-set-square': return { triType: '45', size: 200, rotation: 0 }\n    case 'math-compass': return { ccx: 190, ccy: 190, radius: 100, arcStart: 0, arcEnd: 360 }"

if old_configs in content:
 content = content.replace(old_configs, new_configs)
 print("Updated default configs")
else:
 print("WARNING: Could not find default configs to update")

# ============================================================
# 7. Update default sizes (make them a bit larger for measurement)
# ============================================================

old_sizes = "    case 'math-protractor': return { width: 470, height: 440 }\n    case 'math-ruler': return { width: 570, height: 260 }\n    case 'math-set-square': return { width: 440, height: 470 }\n    case 'math-compass': return { width: 490, height: 520 }"
new_sizes = "    case 'math-protractor': return { width: 420, height: 420 }\n    case 'math-ruler': return { width: 560, height: 280 }\n    case 'math-set-square': return { width: 400, height: 420 }\n    case 'math-compass': return { width: 400, height: 440 }"

if old_sizes in content:
 content = content.replace(old_sizes, new_sizes)
 print("Updated default sizes")
else:
 print("WARNING: Could not find default sizes to update")

# ============================================================
# Write the file
# ============================================================

with open(FILE, 'w') as f:
 f.write(content)

print("\nDone! All measurement tools rewritten.")
