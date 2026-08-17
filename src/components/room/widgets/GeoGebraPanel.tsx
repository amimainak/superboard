'use client'

import { useState } from 'react'

export function GeoGebraPanel() {
  const [graphExpression, setGraphExpression] = useState('')

  const presets = [
    { label: 'y = x²', expr: 'x^2' },
    { label: 'y = sin(x)', expr: 'sin(x)' },
    { label: 'y = 1/x', expr: '1/x' },
    { label: 'x² + y² = 1', expr: 'x^2 + y^2 = 1' },
  ]

  return (
    <div className="widget-content widget-geogebra">
      <div className="geogebra-header">
        <span style={{ fontWeight: 600, fontSize: 13 }}>Graphing Calculator</span>
        <span style={{ fontSize: 10, color: '#64748b' }}>Powered by GeoGebra</span>
      </div>

      <div className="geogebra-input-group">
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
              className="toolkit-chip"
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontFamily: 'monospace',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Placeholder for GeoGebra iframe — will be embedded when configured */}
      <div className="geogebra-canvas-placeholder">
        <div style={{ fontSize: 48, opacity: 0.3 }}>📈</div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>
          Graph will render here
        </div>
      </div>
    </div>
  )
}
