'use client'

import { useState } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface GeoGebraPanelProps {
  roomId?: string
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
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Placeholder for GeoGebra iframe */}
      <div className={'geogebra-canvas-placeholder' + (isDark ? '' : ' geogebra-canvas-placeholder-light')}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>
        <span role="img" aria-label="chart">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </span>
        </div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>
          Graph will render here
        </div>
      </div>
    </div>
  )
}
