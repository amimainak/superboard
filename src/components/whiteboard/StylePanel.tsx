// ============================================================
// Superboard — Style Panel (Minimalist Bottom Bar)
// Compact pocket-based design for colors, stroke, text, opacity
// ============================================================

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

const COLORS = [
  '#1e293b', '#374151', '#6b7280', '#9ca3af',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#059669', '#0ea5e9', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f43f5e', '#78716c', '#000000',
]

const STROKE_WIDTHS = [1, 2, 3, 4, 6, 8, 12]
const DASH_PATTERNS: { label: string; value: number[] }[] = [
  { label: 'Solid', value: [] },
  { label: 'Dashed', value: [8, 4] },
  { label: 'Dotted', value: [2, 4] },
  { label: 'Dash-dot', value: [8, 4, 2, 4] },
]

const FONT_FAMILIES = [
  { label: 'Sans', value: 'inherit', preview: 'Aa' },
  { label: 'Serif', value: 'Georgia, serif', preview: 'Aa' },
  { label: 'Mono', value: '"Courier New", monospace', preview: 'Aa' },
  { label: 'Hand', value: 'cursive', preview: 'Aa' },
]

const ERASER_SIZES = [4, 8, 12, 20, 32, 48]

// ---- Pocket: collapsible fly-out panel ----
function Pocket({
  label,
  icon,
  isDark,
  children,
  isOpen,
  onToggle,
}: {
  label: string
  icon: React.ReactNode
  isDark: boolean
  children: React.ReactNode
  isOpen: boolean
  onToggle: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={onToggle}
        style={{
          height: 28,
          padding: '0 8px',
          borderRadius: 6,
          border: 'none',
          background: isOpen
            ? isDark ? 'rgba(5,150,105,0.15)' : 'rgba(5,150,105,0.08)'
            : 'transparent',
          color: isOpen ? '#059669' : isDark ? '#9ca3af' : '#6b7280',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 11,
          fontWeight: 500,
          transition: 'all 0.1s ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
            e.currentTarget.style.color = isDark ? '#e5e7eb' : '#374151'
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = isDark ? '#9ca3af' : '#6b7280'
          }
        }}
      >
        {icon}
        {label}
      </button>
      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }} onClick={onToggle} />
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: 6,
              background: isDark ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: 10,
              padding: 10,
              zIndex: 10001,
              boxShadow: isDark
                ? '0 8px 32px rgba(0,0,0,0.5)'
                : '0 8px 24px rgba(0,0,0,0.12)',
            }}
          >
            {children}
          </div>
        </>
      )}
    </div>
  )
}

// ---- Color Grid inside pocket ----
function ColorGrid({
  value,
  onChange,
  isDark,
  includeTransparent,
}: {
  value: string
  onChange: (c: string) => void
  isDark: boolean
  includeTransparent?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Current color preview + custom picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            background: value === 'transparent'
              ? 'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50%/12px 12px'
              : value,
          }}
        />
        <label style={{ cursor: 'pointer' }}>
          <input
            type="color"
            value={value === 'transparent' ? '#000000' : value}
            onChange={(e) => onChange(e.target.value)}
            style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
          />
          <span
            style={{
              fontSize: 11,
              color: isDark ? '#6b7280' : '#9ca3af',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: 4,
              padding: '2px 8px',
            }}
          >
            Custom
          </span>
        </label>
        {includeTransparent && (
          <button
            onClick={() => onChange('transparent')}
            style={{
              fontSize: 11,
              color: isDark ? '#6b7280' : '#9ca3af',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: 4,
              padding: '2px 8px',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            None
          </button>
        )}
      </div>
      {/* Color grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 3,
        }}
      >
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              border: value === c ? '2px solid #059669' : `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              background: c,
              cursor: 'pointer',
              outline: value === c ? 'none' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function StylePanel() {
  const { style, setStyle, isDark, tool, eraserSize, setEraserSize } = useWhiteboardStore()
  const [openPocket, setOpenPocket] = useState<string | null>(null)

  // Close on outside click
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpenPocket(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const togglePocket = (id: string) => setOpenPocket(openPocket === id ? null : id)

  return (
    <div
      ref={panelRef}
      style={{
        height: 40,
        minHeight: 40,
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        gap: 4,
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        background: isDark ? '#0d1117' : '#ffffff',
        overflowX: 'auto',
        zIndex: 100,
      }}
    >
      {/* Stroke Color Pocket */}
      <Pocket
        label="Stroke"
        icon={
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              border: `1.5px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
              background: style.strokeColor,
              flexShrink: 0,
            }}
          />
        }
        isDark={isDark}
        isOpen={openPocket === 'stroke'}
        onToggle={() => togglePocket('stroke')}
      >
        <ColorGrid
          value={style.strokeColor}
          onChange={(c) => setStyle({ strokeColor: c })}
          isDark={isDark}
        />
      </Pocket>

      {/* Fill Color Pocket */}
      <Pocket
        label="Fill"
        icon={
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              border: `1.5px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
              background: style.fillColor === 'transparent'
                ? 'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50%/6px 6px'
                : style.fillColor,
              flexShrink: 0,
            }}
          />
        }
        isDark={isDark}
        isOpen={openPocket === 'fill'}
        onToggle={() => togglePocket('fill')}
      >
        <ColorGrid
          value={style.fillColor}
          onChange={(c) => setStyle({ fillColor: c })}
          isDark={isDark}
          includeTransparent
        />
      </Pocket>

      {/* Stroke Pocket (width + dash) */}
      <Pocket
        label="Stroke"
        icon={
          <svg width={14} height={14} viewBox="0 0 14 14">
            <line x1={2} y1={7} x2={12} y2={7} stroke="currentColor" strokeWidth={Math.min(style.strokeWidth, 4)} strokeLinecap="round" />
          </svg>
        }
        isDark={isDark}
        isOpen={openPocket === 'strokeStyle'}
        onToggle={() => togglePocket('strokeStyle')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Width */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#6b7280' : '#9ca3af', marginBottom: 6 }}>
              Width
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {STROKE_WIDTHS.map((w) => (
                <button
                  key={w}
                  onClick={() => setStyle({ strokeWidth: w })}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: 'none',
                    background: style.strokeWidth === w
                      ? isDark ? 'rgba(5,150,105,0.2)' : 'rgba(5,150,105,0.1)'
                      : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: style.strokeWidth === w ? '#059669' : isDark ? '#9ca3af' : '#6b7280',
                  }}
                >
                  <svg width={20} height={20} viewBox="0 0 20 20">
                    <line x1={4} y1={10} x2={16} y2={10} stroke="currentColor" strokeWidth={Math.min(w, 6)} strokeLinecap="round" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          {/* Dash */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#6b7280' : '#9ca3af', marginBottom: 6 }}>
              Style
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {DASH_PATTERNS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setStyle({ dash: p.value })}
                  title={p.label}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: 'none',
                    background: JSON.stringify(style.dash) === JSON.stringify(p.value)
                      ? isDark ? 'rgba(5,150,105,0.2)' : 'rgba(5,150,105,0.1)'
                      : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width={20} height={4} viewBox="0 0 20 4">
                    <line
                      x1={0} y1={2} x2={20} y2={2}
                      stroke={JSON.stringify(style.dash) === JSON.stringify(p.value) ? '#059669' : isDark ? '#9ca3af' : '#6b7280'}
                      strokeWidth={1.5}
                      strokeDasharray={p.value.length ? p.value.map((v) => (v * 2).toString()).join(' ') : 'none'}
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Pocket>

      {/* Text Pocket */}
      <Pocket
        label="Text"
        icon={
          <span style={{ fontSize: 13, fontWeight: 500, fontFamily: style.fontFamily, lineHeight: 1 }}>
            Aa
          </span>
        }
        isDark={isDark}
        isOpen={openPocket === 'text'}
        onToggle={() => togglePocket('text')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Font family */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#6b7280' : '#9ca3af', marginBottom: 6 }}>
              Font
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {FONT_FAMILIES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStyle({ fontFamily: f.value })}
                  title={f.label}
                  style={{
                    width: 36,
                    height: 30,
                    borderRadius: 6,
                    border: 'none',
                    background: style.fontFamily === f.value
                      ? isDark ? 'rgba(5,150,105,0.2)' : 'rgba(5,150,105,0.1)'
                      : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: style.fontFamily === f.value ? '#059669' : isDark ? '#d1d5db' : '#374151',
                  }}
                >
                  <span style={{ fontFamily: f.value, fontSize: 14, fontWeight: 500 }}>{f.preview}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Font size */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#6b7280' : '#9ca3af', marginBottom: 6 }}>
              Size
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {[14, 20, 28, 36, 48].map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle({ fontSize: s })}
                  style={{
                    width: 36,
                    height: 30,
                    borderRadius: 6,
                    border: 'none',
                    background: style.fontSize === s
                      ? isDark ? 'rgba(5,150,105,0.2)' : 'rgba(5,150,105,0.1)'
                      : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    color: style.fontSize === s ? '#059669' : isDark ? '#d1d5db' : '#374151',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {/* Alignment + Bold + Italic */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#6b7280' : '#9ca3af', marginBottom: 6 }}>
              Format
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {[
                { value: 'left', icon: 'left' },
                { value: 'center', icon: 'center' },
                { value: 'right', icon: 'right' },
              ].map((a) => (
                <button
                  key={a.value}
                  onClick={() => setStyle({ textAlign: a.value as 'left' | 'center' | 'right' })}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: 'none',
                    background: style.textAlign === a.value
                      ? isDark ? 'rgba(5,150,105,0.2)' : 'rgba(5,150,105,0.1)'
                      : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: style.textAlign === a.value ? '#059669' : isDark ? '#9ca3af' : '#6b7280',
                  }}
                >
                  <svg width={14} height={14} viewBox="0 0 14 14">
                    {a.value === 'left' && <>
                      <line x1={2} y1={3} x2={12} y2={3} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                      <line x1={2} y1={7} x2={9} y2={7} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                      <line x1={2} y1={11} x2={10} y2={11} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                    </>}
                    {a.value === 'center' && <>
                      <line x1={1} y1={3} x2={13} y2={3} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                      <line x1={3} y1={7} x2={11} y2={7} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                      <line x1={2} y1={11} x2={12} y2={11} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                    </>}
                    {a.value === 'right' && <>
                      <line x1={2} y1={3} x2={12} y2={3} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                      <line x1={5} y1={7} x2={12} y2={7} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                      <line x1={4} y1={11} x2={12} y2={11} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                    </>}
                  </svg>
                </button>
              ))}
              <button
                onClick={() => setStyle({ fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' })}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  border: 'none',
                  background: style.fontWeight === 'bold' ? isDark ? 'rgba(5,150,105,0.2)' : 'rgba(5,150,105,0.1)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: 13,
                  color: style.fontWeight === 'bold' ? '#059669' : isDark ? '#9ca3af' : '#6b7280',
                }}
              >
                B
              </button>
              <button
                onClick={() => setStyle({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' })}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  border: 'none',
                  background: style.fontStyle === 'italic' ? isDark ? 'rgba(5,150,105,0.2)' : 'rgba(5,150,105,0.1)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: style.fontStyle === 'italic' ? '#059669' : isDark ? '#9ca3af' : '#6b7280',
                }}
              >
                I
              </button>
            </div>
          </div>
        </div>
      </Pocket>

      {/* Opacity — always visible (compact) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: isDark ? '#6b7280' : '#9ca3af', fontWeight: 500 }}>
          Opacity
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={style.opacity}
          onChange={(e) => setStyle({ opacity: parseFloat(e.target.value) })}
          style={{ width: 60, accentColor: '#059669', height: 4 }}
        />
        <span style={{ fontSize: 10, color: isDark ? '#6b7280' : '#9ca3af', minWidth: 26, fontFamily: 'monospace' }}>
          {Math.round(style.opacity * 100)}%
        </span>
      </div>

      {/* Eraser Size (only when eraser is active) */}
      {tool === 'eraser' && (
        <>
          <div style={{ width: 1, height: 20, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', margin: '0 2px', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: isDark ? '#6b7280' : '#9ca3af', fontWeight: 500 }}>
              Eraser
            </span>
            {ERASER_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setEraserSize(s)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: 'none',
                  background: eraserSize === s
                    ? isDark ? 'rgba(5,150,105,0.2)' : 'rgba(5,150,105,0.1)'
                    : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: eraserSize === s ? '#059669' : isDark ? '#9ca3af' : '#6b7280',
                }}
              >
                <svg width={16} height={16} viewBox="0 0 16 16">
                  <circle cx={8} cy={8} r={Math.min(s / 2, 6)} fill="none" stroke="currentColor" strokeWidth={1.5} />
                </svg>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
