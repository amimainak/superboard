'use client'

import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface ScienceToolkitProps {
  roomId?: string
}

export function ScienceToolkit({ roomId: _roomId }: ScienceToolkitProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const vectors = [
    { label: 'Arrow →', angle: 0 },
    { label: 'Arrow ↗', angle: 45 },
    { label: 'Arrow ↑', angle: 90 },
    { label: 'Arrow ↖', angle: 135 },
    { label: 'Arrow ←', angle: 180 },
    { label: 'Force (F)', label2: 'F' },
    { label: 'Velocity (v)', label2: 'v' },
    { label: 'Acceleration (a)', label2: 'a' },
  ]

  const elements = [
    { label: 'Beaker', icon: '🧪' },
    { label: 'Thermometer', icon: '🌡️' },
    { label: 'Magnet', icon: '🧲' },
    { label: 'Atom', icon: '⚛️' },
    { label: 'Cell', icon: '🔬' },
    { label: 'Circuit', icon: '🔌' },
  ]

  return (
    <div className="widget-content toolkit-science">
      <div className="toolkit-section">
        <div className={`toolkit-section-title ${isDark ? '' : 'toolkit-section-title-light'}`}>Vectors</div>
        <div className="toolkit-grid">
          {vectors.map((vec) => (
            <button
              key={vec.label}
              className={`toolkit-chip ${isDark ? '' : 'toolkit-chip-light'}`}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontFamily: 'monospace',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                color: isDark ? '#94a3b8' : '#475569',
                cursor: 'pointer',
              }}
            >
              {vec.label2 || vec.label}
            </button>
          ))}
        </div>
      </div>

      <div className="toolkit-section">
        <div className={`toolkit-section-title ${isDark ? '' : 'toolkit-section-title-light'}`}>Lab Equipment</div>
        <div className="toolkit-grid">
          {elements.map((el) => (
            <button
              key={el.label}
              className={`toolkit-chip ${isDark ? '' : 'toolkit-chip-light'}`}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 16,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                color: isDark ? '#94a3b8' : '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{el.icon}</span>
              <span style={{ fontSize: 11 }}>{el.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
