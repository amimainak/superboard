'use client'

import { useState } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface LanguageToolkitProps {
  roomId?: string
}

export function LanguageToolkit({ roomId: _roomId }: LanguageToolkitProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const [highlightColor, setHighlightColor] = useState('#fef08a')

  const highlighters = [
    { label: 'Yellow', color: '#fef08a' },
    { label: 'Green', color: '#bbf7d0' },
    { label: 'Blue', color: '#bfdbfe' },
    { label: 'Pink', color: '#fecaca' },
  ]

  const tools = [
    { label: 'Mind Map', icon: '🧠' },
    { label: 'Vocabulary Card', icon: '📝' },
    { label: 'Reading Marker', icon: '📖' },
    { label: 'Grammar Check', icon: '✅' },
  ]

  return (
    <div className="widget-content toolkit-language">
      <div className="toolkit-section">
        <div className={`toolkit-section-title ${isDark ? '' : 'toolkit-section-title-light'}`}>Highlighters</div>
        <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px' }}>
          {highlighters.map((h) => (
            <button
              key={h.color}
              onClick={() => setHighlightColor(h.color)}
              style={{
                width: 32, height: 32,
                borderRadius: 6,
                background: h.color,
                border: highlightColor === h.color ? '2px solid #fff' : '2px solid transparent',
                cursor: 'pointer',
                opacity: highlightColor === h.color ? 1 : 0.5,
                transition: 'all 0.1s ease',
              }}
              title={h.label}
            />
          ))}
        </div>
      </div>

      <div className="toolkit-section">
        <div className={`toolkit-section-title ${isDark ? '' : 'toolkit-section-title-light'}`}>Tools</div>
        <div className="toolkit-grid">
          {tools.map((tool) => (
            <button
              key={tool.label}
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
              <span>{tool.icon}</span>
              <span style={{ fontSize: 11 }}>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
