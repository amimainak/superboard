// ============================================================
// Superboard — Style Panel (Ultra-Minimalist Bottom Bar)
// Clean pockets: Color (stroke + fill), Stroke (width + dash), Text, Opacity
// ============================================================

'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronUp, Palette, Minus, Type } from 'lucide-react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

const COLORS = [
  '#000000', '#1e293b', '#374151', '#6b7280',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#059669', '#0ea5e9', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f43f5e', '#78716c', '#ffffff',
]

const STROKE_WIDTHS = [1, 2, 3, 5, 8, 12]

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
]

const ERASER_SIZES = [4, 8, 16, 32, 48]

// ---- Popup (fly-up from bottom bar) ----

function Popup({
  isDark,
  onClose,
  children,
}: {
  isDark: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <>
      {/* Backdrop — catches all clicks outside */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />
      <div
        ref={ref}
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: 0,
          background: isDark ? '#1e293b' : '#ffffff',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          borderRadius: 12,
          padding: '10px 12px',
          zIndex: 10001,
          boxShadow: isDark
            ? '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 12px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)',
          opacity: 1,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  )
}

// ---- Pocket Button ----

function PocketBtn({
  label,
  icon,
  isOpen,
  isDark,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  isOpen: boolean
  isDark: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!isOpen) {
          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
          e.currentTarget.style.color = isDark ? '#e2e8f0' : '#1e293b'
        }
      }}
      onMouseLeave={(e) => {
        if (!isOpen) {
          e.currentTarget.style.background = isOpen
            ? isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)'
            : 'transparent'
          e.currentTarget.style.color = isOpen
            ? '#10b981'
            : isDark ? '#64748b' : '#94a3b8'
        }
      }}
      style={{
        height: 30,
        padding: '0 10px',
        borderRadius: 8,
        border: 'none',
        background: isOpen
          ? isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)'
          : 'transparent',
        color: isOpen ? '#10b981' : isDark ? '#64748b' : '#94a3b8',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 500,
        transition: 'all 0.12s ease',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {icon}
      {label}
      <ChevronUp size={12} style={{ opacity: isOpen ? 1 : 0.4, transition: 'transform 0.15s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
    </button>
  )
}

// ---- Thin divider ----

function VDiv({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        width: 1,
        height: 20,
        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        margin: '0 4px',
        flexShrink: 0,
      }}
    />
  )
}

// ---- Main Style Panel ----

export function StylePanel() {
  const { style, setStyle, isDark, tool, eraserSize, setEraserSize } = useWhiteboardStore()
  const [openPocket, setOpenPocket] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpenPocket(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const togglePocket = useCallback((id: string) => {
    setOpenPocket((prev) => (prev === id ? null : id))
  }, [])

  const activeColor = style.strokeColor
  const activeFill = style.fillColor

  return (
    <div
      ref={panelRef}
      style={{
        height: 42,
        minHeight: 42,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 6,
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        background: isDark ? '#0f172a' : '#ffffff',
        overflowX: 'auto',
        overflowY: 'visible',
        zIndex: 200,
      }}
    >
      {/* ---- Stroke Color Pocket ---- */}
      <div style={{ position: 'relative' }}>
        <PocketBtn
          label="Color"
          isOpen={openPocket === 'color'}
          isDark={isDark}
          onClick={() => togglePocket('color')}
          icon={
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                border: `1.5px solid ${isDark ? '#475569' : '#cbd5e1'}`,
                background: activeColor,
                flexShrink: 0,
              }}
            />
          }
        />
        {openPocket === 'color' && (
          <Popup isDark={isDark} onClose={() => setOpenPocket(null)}>
            <ColorPicker
              isDark={isDark}
              strokeColor={style.strokeColor}
              fillColor={style.fillColor}
              onStrokeChange={(c) => setStyle({ strokeColor: c })}
              onFillChange={(c) => setStyle({ fillColor: c })}
            />
          </Popup>
        )}
      </div>

      <VDiv isDark={isDark} />

      {/* ---- Stroke Width + Dash Pocket ---- */}
      <div style={{ position: 'relative' }}>
        <PocketBtn
          label="Stroke"
          isOpen={openPocket === 'stroke'}
          isDark={isDark}
          onClick={() => togglePocket('stroke')}
          icon={
            <Minus size={14} style={{ strokeWidth: Math.min(style.strokeWidth, 4) }} />
          }
        />
        {openPocket === 'stroke' && (
          <Popup isDark={isDark} onClose={() => setOpenPocket(null)}>
            <StrokeOptions
              isDark={isDark}
              strokeWidth={style.strokeWidth}
              dash={style.dash}
              onWidthChange={(w) => setStyle({ strokeWidth: w })}
              onDashChange={(d) => setStyle({ dash: d })}
            />
          </Popup>
        )}
      </div>

      {/* ---- Text Pocket (only when text tool or always) ---- */}
      <div style={{ position: 'relative' }}>
        <PocketBtn
          label="Text"
          isOpen={openPocket === 'text'}
          isDark={isDark}
          onClick={() => togglePocket('text')}
          icon={
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                fontFamily: style.fontFamily,
                lineHeight: 1,
              }}
            >
              Aa
            </span>
          }
        />
        {openPocket === 'text' && (
          <Popup isDark={isDark} onClose={() => setOpenPocket(null)}>
            <TextOptions
              isDark={isDark}
              style={style}
              setStyle={setStyle}
            />
          </Popup>
        )}
      </div>

      <VDiv isDark={isDark} />

      {/* ---- Opacity — always visible (compact) ---- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: isDark ? '#475569' : '#94a3b8', fontWeight: 500 }}>
          {Math.round(style.opacity * 100)}%
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={style.opacity}
          onChange={(e) => setStyle({ opacity: parseFloat(e.target.value) })}
          style={{ width: 56, accentColor: '#10b981', height: 3 }}
        />
      </div>

      {/* ---- Eraser Size (only when eraser active) ---- */}
      {tool === 'eraser' && (
        <>
          <VDiv isDark={isDark} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: isDark ? '#475569' : '#94a3b8', fontWeight: 500 }}>
              Eraser
            </span>
            {ERASER_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setEraserSize(s)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: 'none',
                  background: eraserSize === s
                    ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
                    : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: eraserSize === s ? '#10b981' : isDark ? '#64748b' : '#94a3b8',
                }}
              >
                <svg width={14} height={14} viewBox="0 0 14 14">
                  <circle cx={7} cy={7} r={Math.min(s / 2, 5)} fill="none" stroke="currentColor" strokeWidth={1.5} />
                </svg>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ---- Sub-components for popup content ----

function ColorPicker({
  isDark,
  strokeColor,
  fillColor,
  onStrokeChange,
  onFillChange,
}: {
  isDark: boolean
  strokeColor: string
  fillColor: string
  onStrokeChange: (c: string) => void
  onFillChange: (c: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Stroke color row */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: isDark ? '#475569' : '#94a3b8', marginBottom: 6 }}>
          Stroke
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <ColorSwatchRow
            isDark={isDark}
            value={strokeColor}
            onChange={onStrokeChange}
          />
          <label style={{ cursor: 'pointer', flexShrink: 0 }}>
            <input
              type="color"
              value={strokeColor === 'transparent' ? '#000000' : strokeColor}
              onChange={(e) => onStrokeChange(e.target.value)}
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
            />
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: `1.5px solid ${isDark ? '#475569' : '#cbd5e1'}`,
                background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                cursor: 'pointer',
              }}
            />
          </label>
        </div>
      </div>
      {/* Fill color row */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: isDark ? '#475569' : '#94a3b8', marginBottom: 6 }}>
          Fill
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <ColorSwatchRow
            isDark={isDark}
            value={fillColor}
            onChange={onFillChange}
            includeTransparent
          />
          <button
            onClick={() => onFillChange('transparent')}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: `1.5px solid ${isDark ? '#475569' : '#cbd5e1'}`,
              background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50%/8px 8px',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#64748b' : '#94a3b8',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            /0
          </button>
        </div>
      </div>
    </div>
  )
}

function ColorSwatchRow({
  isDark,
  value,
  onChange,
  includeTransparent,
}: {
  isDark: boolean
  value: string
  onChange: (c: string) => void
  includeTransparent?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', maxWidth: 240 }}>
      {COLORS.map((c) => {
        const isActive = value === c
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              border: isActive
                ? '2px solid #10b981'
                : c === '#ffffff'
                  ? `1px solid ${isDark ? '#475569' : '#cbd5e1'}`
                  : '1px solid transparent',
              background: c,
              cursor: 'pointer',
              outline: 'none',
              boxShadow: isActive ? '0 0 0 1px rgba(16,185,129,0.3)' : 'none',
            }}
          />
        )
      })}
    </div>
  )
}

function StrokeOptions({
  isDark,
  strokeWidth,
  dash,
  onWidthChange,
  onDashChange,
}: {
  isDark: boolean
  strokeWidth: number
  dash: number[]
  onWidthChange: (w: number) => void
  onDashChange: (d: number[]) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Width */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: isDark ? '#475569' : '#94a3b8', marginBottom: 6 }}>
          Width
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {STROKE_WIDTHS.map((w) => (
            <button
              key={w}
              onClick={() => onWidthChange(w)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                background: strokeWidth === w
                  ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
                  : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: strokeWidth === w ? '#10b981' : isDark ? '#64748b' : '#94a3b8',
              }}
            >
              <svg width={20} height={20} viewBox="0 0 20 20">
                <line x1={3} y1={10} x2={17} y2={10} stroke="currentColor" strokeWidth={Math.min(w, 6)} strokeLinecap="round" />
              </svg>
            </button>
          ))}
        </div>
      </div>
      {/* Dash pattern */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: isDark ? '#475569' : '#94a3b8', marginBottom: 6 }}>
          Dash Style
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {DASH_PATTERNS.map((p) => {
            const isActive = JSON.stringify(dash) === JSON.stringify(p.value)
            return (
              <button
                key={p.label}
                onClick={() => onDashChange(p.value)}
                title={p.label}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  background: isActive
                    ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
                    : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width={22} height={4} viewBox="0 0 22 4">
                  <line
                    x1={0} y1={2} x2={22} y2={2}
                    stroke={isActive ? '#10b981' : isDark ? '#64748b' : '#94a3b8'}
                    strokeWidth={1.5}
                    strokeDasharray={p.value.length ? p.value.map((v) => (v * 2).toString()).join(' ') : 'none'}
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TextOptions({
  isDark,
  style,
  setStyle,
}: {
  isDark: boolean
  style: Record<string, unknown>
  setStyle: (s: Record<string, unknown>) => void
}) {
  const s = style as {
    fontFamily: string
    fontSize: number
    textAlign: 'left' | 'center' | 'right'
    fontWeight: string
    fontStyle: string
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Font family + size in one row */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: isDark ? '#475569' : '#94a3b8', marginBottom: 6 }}>
          Font
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {FONT_FAMILIES.map((f) => (
            <button
              key={f.value}
              onClick={() => setStyle({ fontFamily: f.value })}
              title={f.label}
              style={{
                width: 40,
                height: 32,
                borderRadius: 8,
                border: 'none',
                background: s.fontFamily === f.value
                  ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
                  : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: s.fontFamily === f.value ? '#10b981' : isDark ? '#cbd5e1' : '#334155',
              }}
            >
              <span style={{ fontFamily: f.value, fontSize: 14, fontWeight: 500 }}>{f.preview}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: isDark ? '#475569' : '#94a3b8', marginBottom: 6 }}>
          Size
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {[14, 20, 28, 36, 48].map((sz) => (
            <button
              key={sz}
              onClick={() => setStyle({ fontSize: sz })}
              style={{
                width: 40,
                height: 32,
                borderRadius: 8,
                border: 'none',
                background: s.fontSize === sz
                  ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
                  : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 500,
                color: s.fontSize === sz ? '#10b981' : isDark ? '#cbd5e1' : '#334155',
              }}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Alignment + Bold + Italic */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: isDark ? '#475569' : '#94a3b8', marginBottom: 6 }}>
          Format
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setStyle({ textAlign: a })}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                background: s.textAlign === a
                  ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
                  : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: s.textAlign === a ? '#10b981' : isDark ? '#64748b' : '#94a3b8',
              }}
            >
              <svg width={14} height={14} viewBox="0 0 14 14">
                {a === 'left' && <>
                  <line x1={2} y1={3} x2={12} y2={3} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                  <line x1={2} y1={7} x2={9} y2={7} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                  <line x1={2} y1={11} x2={10} y2={11} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                </>}
                {a === 'center' && <>
                  <line x1={1} y1={3} x2={13} y2={3} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                  <line x1={3} y1={7} x2={11} y2={7} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                  <line x1={2} y1={11} x2={12} y2={11} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                </>}
                {a === 'right' && <>
                  <line x1={2} y1={3} x2={12} y2={3} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                  <line x1={5} y1={7} x2={12} y2={7} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                  <line x1={4} y1={11} x2={12} y2={11} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                </>}
              </svg>
            </button>
          ))}
          <button
            onClick={() => setStyle({ fontWeight: s.fontWeight === 'bold' ? 'normal' : 'bold' })}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: s.fontWeight === 'bold' ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 13,
              color: s.fontWeight === 'bold' ? '#10b981' : isDark ? '#64748b' : '#94a3b8',
            }}
          >
            B
          </button>
          <button
            onClick={() => setStyle({ fontStyle: s.fontStyle === 'italic' ? 'normal' : 'italic' })}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: s.fontStyle === 'italic' ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontStyle: 'italic',
              fontSize: 13,
              color: s.fontStyle === 'italic' ? '#10b981' : isDark ? '#64748b' : '#94a3b8',
            }}
          >
            I
          </button>
        </div>
      </div>
    </div>
  )
}
