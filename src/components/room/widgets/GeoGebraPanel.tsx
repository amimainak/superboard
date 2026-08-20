'use client'

import React, { useState, useMemo } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface GeoGebraPanelProps {
  roomId?: string
}

function evalExpr(expr: string, x: number): number {
  try {
    var safe = expr
      .replace(/\bsin\b/g, 'Math.sin')
      .replace(/\bcos\b/g, 'Math.cos')
      .replace(/\bsqrt\b/g, 'Math.sqrt')
      .replace(/\babs\b/g, 'Math.abs')
      .replace(/\blog\b/g, 'Math.log')
      .replace(/\bpi\b/g, 'Math.PI')
      .replace(/\be\b/g, 'Math.E')
      .replace(/\^/g, '**')
      .replace(/\bx\b/g, '(' + x + ')')
    return new Function('return ' + safe)() as number
  } catch(e) { return NaN }
}

const SVG_W = 280
const SVG_H = 200
const X_MIN = -10
const X_MAX = 10
const Y_MIN = -7
const Y_MAX = 7
const STEPS = 200

function GraphPreview({ expr, isDark }: { expr: string; isDark: boolean }) {
  const pathData = useMemo(function() {
    if (!expr.trim()) return ''
    var points: string[] = []
    for (var i = 0; i <= STEPS; i++) {
      var xVal = X_MIN + (X_MAX - X_MIN) * i / STEPS
      var yVal = evalExpr(expr, xVal)
      if (!isFinite(yVal) || Math.abs(yVal) > 100) {
        points.push('')
        continue
      }
      var px = (xVal - X_MIN) / (X_MAX - X_MIN) * SVG_W
      var py = SVG_H - (yVal - Y_MIN) / (Y_MAX - Y_MIN) * SVG_H
      points.push(px + ',' + py)
    }
    // Build path segments, breaking on NaN gaps
    var segments: string[] = []
    var current: string[] = []
    for (var j = 0; j < points.length; j++) {
      if (points[j] === '') {
        if (current.length > 1) {
          segments.push('M' + current.join(' L'))
        }
        current = []
      } else {
        current.push(points[j])
      }
    }
    if (current.length > 1) {
      segments.push('M' + current.join(' L'))
    }
    return segments.join(' ')
  }, [expr])

  var gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  var axisColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'
  var labelColor = isDark ? '#64748b' : '#94a3b8'

  // Grid lines
  var gridLines: React.ReactNode[] = []
  for (var gx = Math.ceil(X_MIN); gx <= Math.floor(X_MAX); gx++) {
    var px = (gx - X_MIN) / (X_MAX - X_MIN) * SVG_W
    gridLines.push(<line key={'gx' + gx} x1={px} y1={0} x2={px} y2={SVG_H} stroke={gridColor} strokeWidth={1} />)
  }
  for (var gy = Math.ceil(Y_MIN); gy <= Math.floor(Y_MAX); gy++) {
    var py = SVG_H - (gy - Y_MIN) / (Y_MAX - Y_MIN) * SVG_H
    gridLines.push(<line key={'gy' + gy} x1={0} y1={py} x2={SVG_W} y2={py} stroke={gridColor} strokeWidth={1} />)
  }

  // Axis tick labels
  var tickLabels: React.ReactNode[] = []
  for (var tx = Math.ceil(X_MIN); tx <= Math.floor(X_MAX); tx += 2) {
    if (tx === 0) continue
    var tpx = (tx - X_MIN) / (X_MAX - X_MIN) * SVG_W
    var tpy = SVG_H / 2
    tickLabels.push(<text key={'tl' + tx} x={tpx} y={tpy + 12} textAnchor={'middle' as const} fontSize={8} fill={labelColor}>{tx}</text>)
  }
  for (var ty = Math.ceil(Y_MIN); ty <= Math.floor(Y_MAX); ty += 2) {
    if (ty === 0) continue
    var tpx2 = SVG_W / 2
    var tpy2 = SVG_H - (ty - Y_MIN) / (Y_MAX - Y_MIN) * SVG_H
    tickLabels.push(<text key={'tt' + ty} x={tpx2 + 10} y={tpy2 + 3} textAnchor={'middle' as const} fontSize={8} fill={labelColor}>{ty}</text>)
  }

  // Axis positions
  var originX = (0 - X_MIN) / (X_MAX - X_MIN) * SVG_W
  var originY = SVG_H - (0 - Y_MIN) / (Y_MAX - Y_MIN) * SVG_H

  return (
    <svg width={SVG_W} height={SVG_H} viewBox={'0 0 ' + SVG_W + ' ' + SVG_H} style={{ display: 'block', margin: '0 auto' }}>
      {/* Grid */}
      {gridLines}
      {/* Axes */}
      <line x1={0} y1={originY} x2={SVG_W} y2={originY} stroke={axisColor} strokeWidth={1} />
      <line x1={originX} y1={0} x2={originX} y2={SVG_H} stroke={axisColor} strokeWidth={1} />
      {/* Tick labels */}
      {tickLabels}
      {/* Origin label */}
      <text x={originX + 8} y={originY + 12} fontSize={8} fill={labelColor}>0</text>
      {/* Function curve */}
      {pathData && <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap={'round' as const} strokeLinejoin={'round' as const} />}
      {/* No expression placeholder */}
      {!expr.trim() && (
        <text x={SVG_W / 2} y={SVG_H / 2} textAnchor={'middle' as const} dominantBaseline={'middle' as const} fontSize={12} fill={labelColor} opacity={0.5}>
          Type an expression above
        </text>
      )}
    </svg>
  )
}

export function GeoGebraPanel({ roomId: _roomId }: GeoGebraPanelProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const [graphExpression, setGraphExpression] = useState('')

  const presets = [
    { label: 'y = x\u00B2', expr: 'x^2' },
    { label: 'y = sin(x)', expr: 'sin(x)' },
    { label: 'y = 1/x', expr: '1/x' },
    { label: 'x\u00B2 + y\u00B2 = 1', expr: 'x^2 + y^2 = 1' },
  ]

  return (
    <div className="widget-content widget-geogebra">
      <div className={'geogebra-header' + (isDark ? '' : ' geogebra-header-light')}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Graphing Calculator</span>
        <span style={{ fontSize: 10, color: '#64748b' }}>Powered by GeoGebra</span>
      </div>

      <div className={'geogebra-input-group' + (isDark ? '' : ' geogebra-input-group-light')}>
        <input
          value={graphExpression}
          onChange={(e) => setGraphExpression(e.target.value)}
          placeholder="f(x) = ..."
          className="chat-input"
          style={{ fontFamily: 'monospace', fontSize: 14 }}
        />
        <button className="chat-send-btn" disabled={!graphExpression.trim()}>
          Plot
        </button>
      </div>

      <div className="geogebra-presets">
        <div style={{ fontSize: 10, color: '#64748b', padding: '8px 16px 4px', fontWeight: 600 }}>
          Presets
        </div>
        <div className="toolkit-grid" style={{ padding: '0 12px 12px' }}>
          {presets.map((p) => (
            <button
              key={p.expr}
              onClick={() => setGraphExpression(p.expr)}
              className={'toolkit-chip' + (isDark ? '' : ' toolkit-chip-light')}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontFamily: 'monospace',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                color: isDark ? '#94a3b8' : '#475569',
                cursor: 'pointer' as const,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live SVG Graph Preview */}
      <div className={'geogebra-canvas-placeholder' + (isDark ? '' : ' geogebra-canvas-placeholder-light')} style={{ padding: '8px' }}>
        <GraphPreview expr={graphExpression} isDark={isDark} />
      </div>
    </div>
  )
}
