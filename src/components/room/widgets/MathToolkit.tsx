'use client'

import { useState } from 'react'

export function MathToolkit() {
  const [equation, setEquation] = useState('')
  const [graphType, setGraphType] = useState<'none' | 'line' | 'grid'>('none')

  const mathFunctions = [
    { label: 'y = x', eq: 'x' },
    { label: 'y = x²', eq: 'x^2' },
    { label: 'y = √x', eq: 'sqrt(x)' },
    { label: 'y = 1/x', eq: '1/x' },
    { label: 'y = sin(x)', eq: 'sin(x)' },
    { label: 'y = cos(x)', eq: 'cos(x)' },
    { label: 'y = |x|', eq: 'abs(x)' },
    { label: 'y = log(x)', eq: 'log(x)' },
  ]

  const stamps = [
    { label: 'Protractor', icon: '📏' },
    { label: 'Ruler', icon: '📐' },
    { label: 'Set Square', icon: '📐' },
    { label: 'Compass', icon: '⭕' },
  ]

  return (
    <div className="widget-content toolkit-math">
      <div className="toolkit-section">
        <div className="toolkit-section-title">Quick Equations</div>
        <div className="toolkit-grid">
          {mathFunctions.map((fn) => (
            <button
              key={fn.eq}
              className="toolkit-chip"
              onClick={() => setEquation(fn.eq)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontFamily: 'monospace',
                background: equation === fn.eq ? 'rgba(5,150,105,0.15)' : 'rgba(255,255,255,0.05)',
                border: equation === fn.eq ? '1px solid rgba(5,150,105,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color: equation === fn.eq ? '#34d399' : '#94a3b8',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.1s ease',
              }}
            >
              {fn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="toolkit-section">
        <div className="toolkit-section-title">Background</div>
        <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px' }}>
          {(['none', 'grid', 'line'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setGraphType(type)}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                background: graphType === type ? 'rgba(5,150,105,0.15)' : 'rgba(255,255,255,0.05)',
                border: graphType === type ? '1px solid rgba(5,150,105,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color: graphType === type ? '#34d399' : '#94a3b8',
                cursor: 'pointer',
                textTransform: 'capitalize' as any,
              }}
            >
              {type === 'none' ? 'Blank' : type}
            </button>
          ))}
        </div>
      </div>

      <div className="toolkit-section">
        <div className="toolkit-section-title">Stamps</div>
        <div className="toolkit-grid">
          {stamps.map((stamp) => (
            <button
              key={stamp.label}
              className="toolkit-chip"
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 16,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{stamp.icon}</span>
              <span style={{ fontSize: 11 }}>{stamp.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
