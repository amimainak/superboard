// ============================================================
// Superboard — Style Panel (Bottom Bar)
// Color, stroke, fill, opacity, dash controls
// ============================================================

'use client'

import React, { useState } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

const COLORS = [
  '#1e293b', '#374151', '#6b7280', '#9ca3af',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#059669', '#0ea5e9', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f43f5e', '#78716c', '#000000',
  '#ffffff', 'transparent',
]

const STROKE_WIDTHS = [1, 2, 3, 4, 6, 8, 12]
const DASH_PATTERNS: { label: string; value: number[] }[] = [
  { label: 'Solid', value: [] },
  { label: 'Dashed', value: [8, 4] },
  { label: 'Dotted', value: [2, 4] },
  { label: 'Dash-dot', value: [8, 4, 2, 4] },
]

export function StylePanel() {
  const { style, setStyle, isDark, selectedIds } = useWhiteboardStore()
  const [activeSection, setActiveSection] = useState<string>('color')

  return (
    <div
      className="style-panel"
      style={{
        height: 44,
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 8,
        borderTop: '1px solid var(--color-border)',
        background: isDark ? '#111827' : '#ffffff',
        overflowX: 'auto',
        zIndex: 100,
      }}
    >
      {/* Stroke Color */}
      <ColorSwatches
        label="Stroke"
        value={style.strokeColor}
        colors={COLORS}
        onChange={(c) => setStyle({ strokeColor: c })}
        isDark={isDark}
      />

      <Divider />

      {/* Fill Color */}
      <ColorSwatches
        label="Fill"
        value={style.fillColor}
        colors={COLORS}
        onChange={(c) => setStyle({ fillColor: c })}
        isDark={isDark}
        showTransparency
      />

      <Divider />

      {/* Stroke Width */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#6b7280', fontWeight: 500 }}>
          Width
        </span>
        {STROKE_WIDTHS.map((w) => (
          <button
            key={w}
            onClick={() => setStyle({ strokeWidth: w })}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              background:
                style.strokeWidth === w
                  ? isDark
                    ? 'rgba(5,150,105,0.2)'
                    : 'rgba(5,150,105,0.1)'
                  : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: style.strokeWidth === w ? '#059669' : isDark ? '#d1d5db' : '#4b5563',
            }}
          >
            <svg width={20} height={20} viewBox="0 0 20 20">
              <line
                x1={4}
                y1={10}
                x2={16}
                y2={10}
                stroke="currentColor"
                strokeWidth={Math.min(w, 6)}
                strokeLinecap="round"
              />
            </svg>
          </button>
        ))}
      </div>

      <Divider />

      {/* Dash Pattern */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#6b7280', fontWeight: 500 }}>
          Style
        </span>
        {DASH_PATTERNS.map((p) => (
          <button
            key={p.label}
            onClick={() => setStyle({ dash: p.value })}
            title={p.label}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              background:
                JSON.stringify(style.dash) === JSON.stringify(p.value)
                  ? isDark
                    ? 'rgba(5,150,105,0.2)'
                    : 'rgba(5,150,105,0.1)'
                  : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width={20} height={4} viewBox="0 0 20 4">
              <line
                x1={0}
                y1={2}
                x2={20}
                y2={2}
                stroke={isDark ? '#d1d5db' : '#4b5563'}
                strokeWidth={1.5}
                strokeDasharray={
                  p.value.length
                    ? p.value.map((v) => (v * 2).toString()).join(' ')
                    : 'none'
                }
                strokeLinecap="round"
              />
            </svg>
          </button>
        ))}
      </div>

      <Divider />

      {/* Opacity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#6b7280', fontWeight: 500 }}>
          Opacity
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={style.opacity}
          onChange={(e) => setStyle({ opacity: parseFloat(e.target.value) })}
          style={{ width: 80, accentColor: '#059669' }}
        />
        <span style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#6b7280', minWidth: 28 }}>
          {Math.round(style.opacity * 100)}%
        </span>
      </div>
    </div>
  )
}

// ---- Color Swatches ----

function ColorSwatches({
  label,
  value,
  colors,
  onChange,
  isDark,
  showTransparency,
}: {
  label: string
  value: string
  colors: string[]
  onChange: (c: string) => void
  isDark: boolean
  showTransparency?: boolean
}) {
  const [open, setOpen] = useState(false)
  const displayColors = colors.slice(0, 8)

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#6b7280', fontWeight: 500 }}>
        {label}
      </span>
      {/* Active color indicator */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
          background: value === 'transparent'
            ? 'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50%/12px 12px'
            : value,
          cursor: 'pointer',
          position: 'relative',
          flexShrink: 0,
        }}
      />
      {/* Quick swatches */}
      {displayColors.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          title={c}
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            background: c === 'transparent'
              ? 'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50%/8px 8px'
              : c,
            cursor: 'pointer',
            outline: value === c ? '2px solid #059669' : 'none',
            outlineOffset: '1px',
            flexShrink: 0,
          }}
        />
      ))}

      {/* Full color picker dropdown */}
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 8,
              background: isDark ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: 8,
              padding: 8,
              zIndex: 1001,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 4,
              minWidth: 180,
            }}
          >
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  onChange(c)
                  setOpen(false)
                }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border: value === c ? '2px solid #059669' : '1px solid #e5e7eb',
                  background: c === 'transparent'
                    ? 'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50%/8px 8px'
                    : c,
                  cursor: 'pointer',
                }}
              />
            ))}
            {/* Custom color */}
            <label style={{ position: 'relative' }}>
              <input
                type="color"
                value={value === 'transparent' ? '#000000' : value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border: '1px dashed #9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  color: '#6b7280',
                }}
              >
                +
              </div>
            </label>
            {showTransparency && (
              <button
                onClick={() => {
                  onChange('transparent')
                  setOpen(false)
                }}
                title="No fill"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border: '1px solid #e5e7eb',
                  background: 'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50%/8px 8px',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: 2,
                    background: 'red',
                    transform: 'rotate(-45deg)',
                  }}
                />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 24,
        background: 'var(--color-border)',
        flexShrink: 0,
      }}
    />
  )
}
