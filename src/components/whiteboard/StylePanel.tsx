// ============================================================
// Superboard — Style Panel (Ultra-Minimalist Bottom Bar)
// Clean pockets: Color (stroke + fill), Stroke (width + dash), Text, Opacity
// ============================================================

'use client'

import React, { useEffect, useRef, useState, useCallback, Component } from 'react'
import { ChevronUp, Palette, Minus, Type, FunctionSquare } from 'lucide-react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import './whiteboard.css'

// Vibrant palette — ordered for visual appeal, grays at end (not start)
const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#059669', '#0ea5e9', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f43f5e', '#e2e8f0', '#78716c',
  '#ffffff', '#374151', '#1e293b', '#000000',
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
  anchorRef,
}: {
  isDark: boolean
  onClose: () => void
  children: React.ReactNode
  anchorRef: React.RefObject<HTMLButtonElement | null>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const anchor = anchorRef.current
    const panel = ref.current
    if (!anchor || !panel) return

    const anchorRect = anchor.getBoundingClientRect()
    const panelWidth = panel.offsetWidth
    const panelHeight = panel.offsetHeight

    // Position above the anchor
    let left = anchorRect.left
    if (left + panelWidth > window.innerWidth - 8) {
      left = window.innerWidth - panelWidth - 8
    }
    if (left < 8) left = 8

    let top = anchorRect.top - panelHeight - 8
    if (top < 8) {
      // Not enough room above — place below
      top = anchorRect.bottom + 8
    }

    setPos({ top, left })
    // Mark as ready on next frame so initial (0,0) render is skipped
    requestAnimationFrame(() => setReady(true))
  }, [anchorRef])

  // Always render the panel div so useEffect can measure it.
  // Hide visually (not removed from DOM) until positioned.
  const isVisible = pos !== null && ready

  return (
    <>
      {/* Click-away backdrop — same pattern as LeftToolbar Flyout */}
      {isVisible && (
        <div
          className="wb-flyout-backdrop"
          onMouseDown={(e) => {
            e.stopPropagation()
            onClose()
          }}
          aria-hidden="true"
        />
      )}
      <div
        ref={ref}
        className={"wb-flyout-panel wb-flyout-panel-" + (isDark ? 'dark' : 'light')}
        role="dialog"
        aria-label="Style options"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: pos ? pos.top : 0,
          left: pos ? pos.left : 0,
          zIndex: 10001,
          padding: '10px 12px',
          visibility: isVisible ? 'visible' : 'hidden',
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
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
  ref,
}: {
  label: string
  icon: React.ReactNode
  isOpen: boolean
  isDark: boolean
  onClick: () => void
  ref?: React.RefObject<HTMLButtonElement | null>
}) {
  return (
    <button
      ref={ref}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={`${label} options`}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      className={[
        'wb-pocket-btn',
        `wb-pocket-btn-${isDark ? 'dark' : 'light'}`,
        isOpen ? `wb-pocket-btn-active wb-pocket-btn-active-${isDark ? 'dark' : 'light'}` : '',
      ].join(' ')}
    >
      {icon}
      {label}
      <ChevronUp
        size={12}
        style={{ opacity: isOpen ? 1 : 0.4, transition: 'transform 0.15s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        aria-hidden="true"
      />
    </button>
  )
}

// ---- Thin divider ----

function VDiv({ isDark }: { isDark: boolean }) {
  return <div className={`wb-sep-v wb-sep-v-${isDark ? 'dark' : 'light'}`} aria-hidden="true" />
}

// ---- Lightweight inline error boundary for popup content ----
class PopupErrorBoundary extends Component<
  { children: React.ReactNode; isDark: boolean },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null }
  static getDerivedStateFromError(err: Error) { return { hasError: true, error: err } }
  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.warn('[StylePanel Popup]', err, info.componentStack)
  }
  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '8px 12px', fontSize: 11, color: this.props.isDark ? '#f87171' : '#dc2626',
          textAlign: 'center', lineHeight: 1.4,
        }}>
          <div style={{ marginBottom: 4 }}>Something went wrong.</div>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600,
              background: this.props.isDark ? 'rgba(239,68,68,0.15)' : 'rgba(220,38,38,0.1)',
              border: '1px solid ' + (this.props.isDark ? 'rgba(239,68,68,0.3)' : 'rgba(220,38,38,0.2)'),
              color: this.props.isDark ? '#fca5a5' : '#dc2626', cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ---- Main Style Panel ----

export function StylePanel() {
  const style = useWhiteboardStore((s) => s.style)
  const setStyle = useWhiteboardStore((s) => s.setStyle)
  const isDark = useWhiteboardStore((s) => s.isDark)
  const tool = useWhiteboardStore((s) => s.tool)
  const eraserSize = useWhiteboardStore((s) => s.eraserSize)
  const setEraserSize = useWhiteboardStore((s) => s.setEraserSize)
  const [openPocket, setOpenPocket] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const colorBtnRef = useRef<HTMLButtonElement>(null)
  const strokeBtnRef = useRef<HTMLButtonElement>(null)
  const textBtnRef = useRef<HTMLButtonElement>(null)

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
      className={`wb-style-panel wb-style-panel-${isDark ? 'dark' : 'light'}`}
      role="toolbar"
      aria-label="Style options"
    >
      {/* ---- Stroke Color Pocket ---- */}
      <div style={{ position: 'relative' }}>
        <PocketBtn
          ref={colorBtnRef}
          label="Color"
          isOpen={openPocket === 'color'}
          isDark={isDark}
          onClick={() => togglePocket('color')}
          icon={
            <div
              className={`wb-color-indicator wb-color-indicator-${isDark ? 'dark' : 'light'}`}
              style={{ background: activeColor }}
            />
          }
        />
        {openPocket === 'color' && (
          <Popup isDark={isDark} onClose={() => setOpenPocket(null)} anchorRef={colorBtnRef}>
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
          ref={strokeBtnRef}
          label="Stroke"
          isOpen={openPocket === 'stroke'}
          isDark={isDark}
          onClick={() => togglePocket('stroke')}
          icon={
            <Minus size={14} style={{ strokeWidth: Math.min(style.strokeWidth, 4) }} />
          }
        />
        {openPocket === 'stroke' && (
          <Popup isDark={isDark} onClose={() => setOpenPocket(null)} anchorRef={strokeBtnRef}>
            <StrokeOptions
              isDark={isDark}
              strokeWidth={style.strokeWidth}
              dash={style.dash || []}
              onWidthChange={(w) => setStyle({ strokeWidth: w })}
              onDashChange={(d) => setStyle({ dash: d })}
            />
          </Popup>
        )}
      </div>

      {/* ---- Text Pocket ---- */}
      <div style={{ position: 'relative' }}>
        <PocketBtn
          ref={textBtnRef}
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
          <Popup isDark={isDark} onClose={() => setOpenPocket(null)} anchorRef={textBtnRef}>
            <PopupErrorBoundary isDark={isDark}>
              <TextOptions
                isDark={isDark}
                style={{
                  fontFamily: style.fontFamily || 'inherit',
                  fontSize: style.fontSize || 20,
                  textAlign: (style.textAlign as 'left' | 'center' | 'right') || 'left',
                  fontWeight: style.fontWeight || 'normal',
                  fontStyle: style.fontStyle || 'normal',
                  // Phase 5: new text styling fields
                  textDecoration: style.textDecoration,
                  textHighlight: style.textHighlight,
                  textColor: style.textColor,
                }}
                setStyle={setStyle}
              />
              {/* fx / LaTeX equation button */}
              <InsertEquationButton isDark={isDark} />
            </PopupErrorBoundary>
          </Popup>
        )}
      </div>

      {/* ---- Standalone fx Button (always visible) ---- */}
      <FxQuickButton isDark={isDark} />

      <VDiv isDark={isDark} />

      {/* ---- Opacity — always visible (compact) ---- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span className={`wb-opacity-label wb-opacity-label-${isDark ? 'dark' : 'light'}`}>
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
          aria-label="Opacity"
        />
      </div>

      {/* ---- Eraser Size (only when eraser active) ---- */}
      {tool === 'eraser' && (
        <>
          <VDiv isDark={isDark} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} role="group" aria-label="Eraser size">
            <span className={`wb-eraser-label wb-eraser-label-${isDark ? 'dark' : 'light'}`}>
              Eraser
            </span>
            {ERASER_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setEraserSize(s)}
                aria-label={`Eraser size ${s}`}
                aria-pressed={eraserSize === s}
                className={[
                  'wb-eraser-btn',
                  `wb-eraser-btn-${isDark ? 'dark' : 'light'}`,
                  eraserSize === s ? `wb-eraser-btn-active wb-eraser-btn-active-${isDark ? 'dark' : 'light'}` : '',
                ].join(' ')}
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
        <div className={`wb-section-label wb-section-label-${isDark ? 'dark' : 'light'}`}>
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
              aria-label="Custom stroke color"
            />
            <div
              className={`wb-color-custom wb-color-custom-${isDark ? 'dark' : 'light'}`}
              style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
            />
          </label>
        </div>
      </div>
      {/* Fill color row */}
      <div>
        <div className={`wb-section-label wb-section-label-${isDark ? 'dark' : 'light'}`}>
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
            className={`wb-color-transparent wb-color-transparent-${isDark ? 'dark' : 'light'}`}
            style={{ background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50%/8px 8px' }}
            aria-label="No fill"
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
}: {
  isDark: boolean
  value: string
  onChange: (c: string) => void
  includeTransparent?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', maxWidth: 240 }} role="listbox" aria-label="Color swatches">
      {COLORS.map((c) => {
        const isActive = value === c
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            role="option"
            aria-selected={isActive}
            aria-label={`Color ${c}`}
            className={[
              'wb-swatch',
              isActive ? 'wb-swatch-active' : '',
              c === '#ffffff' ? `wb-swatch-white-${isDark ? 'dark' : 'light'}` : '',
              (c === '#000000' || c === '#1e293b' || c === '#374151') && isDark ? 'wb-swatch-dark-dark' : '',
            ].join(' ')}
            style={{ background: c }}
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
        <div className={`wb-section-label wb-section-label-${isDark ? 'dark' : 'light'}`}>
          Width
        </div>
        <div style={{ display: 'flex', gap: 3 }} role="radiogroup" aria-label="Stroke width">
          {STROKE_WIDTHS.map((w) => (
            <button
              key={w}
              onClick={() => onWidthChange(w)}
              role="radio"
              aria-checked={strokeWidth === w}
              aria-label={`Width ${w}`}
              className={[
                'wb-opt-btn',
                `wb-opt-btn-${isDark ? 'dark' : 'light'}`,
                strokeWidth === w ? `wb-opt-btn-active wb-opt-btn-active-${isDark ? 'dark' : 'light'}` : '',
              ].join(' ')}
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
        <div className={`wb-section-label wb-section-label-${isDark ? 'dark' : 'light'}`}>
          Dash Style
        </div>
        <div style={{ display: 'flex', gap: 3 }} role="radiogroup" aria-label="Dash style">
          {DASH_PATTERNS.map((p) => {
            const isActive = JSON.stringify(dash) === JSON.stringify(p.value)
            return (
              <button
                key={p.label}
                onClick={() => onDashChange(p.value)}
                title={p.label}
                role="radio"
                aria-checked={isActive}
                aria-label={p.label}
                className={[
                  'wb-opt-btn',
                  `wb-opt-btn-${isDark ? 'dark' : 'light'}`,
                  isActive ? `wb-opt-btn-active wb-opt-btn-active-${isDark ? 'dark' : 'light'}` : '',
                ].join(' ')}
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
  style: { fontFamily: string; fontSize: number; textAlign: 'left' | 'center' | 'right'; fontWeight: string; fontStyle: string; textDecoration?: string; textHighlight?: string; textColor?: string }
  setStyle: (s: Partial<{ fontFamily: string; fontSize: number; textAlign: 'left' | 'center' | 'right'; fontWeight: string; fontStyle: string; textDecoration?: string; textHighlight?: string; textColor?: string }>) => void
}) {
  const s = style

  // Phase 5: Apply formatting to both new elements (via store style) and current selection (contentEditable)
  const applyInlineFormat = (command: string, value?: string) => {
    try {
      if (command === 'bold') setStyle({ fontWeight: s.fontWeight === 'bold' ? 'normal' : 'bold' })
      else if (command === 'italic') setStyle({ fontStyle: s.fontStyle === 'italic' ? 'normal' : 'italic' })
      else if (command === 'underline') {
        // Phase 5: persist underline to style (was previously inline-only)
        const isOn = s.textDecoration?.includes('underline')
        setStyle({ textDecoration: isOn ? (s.textDecoration?.replace('underline', '').trim() || undefined) : [s.textDecoration, 'underline'].filter(Boolean).join(' ') || 'underline' })
      }
      else if (command === 'strikeThrough') {
        const isOn = s.textDecoration?.includes('line-through')
        setStyle({ textDecoration: isOn ? (s.textDecoration?.replace('line-through', '').trim() || undefined) : [s.textDecoration, 'line-through'].filter(Boolean).join(' ') || 'line-through' })
      }
      else if (command === 'foreColor') {
        // textColor handled by the color picker below
        setStyle({ textColor: value })
      }
      else if (command === 'hiliteColor') {
        setStyle({ textHighlight: value })
      }
      // Also apply to any current selection in a contentEditable
      if (command === 'foreColor' || command === 'hiliteColor') {
        document.execCommand(command, false, value || undefined)
      } else {
        document.execCommand(command, false, value || undefined)
      }
    } catch (err) {
      console.warn('[StylePanel] applyInlineFormat failed:', err)
    }
  }

  // Phase 5: Color presets for text and highlight
  const TEXT_COLORS = ['#1e293b', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#ffffff']
  const HIGHLIGHT_COLORS = ['transparent', '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa', '#ddd6fe', '#a7f3d0']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Font family + size in one row */}
      <div>
        <div className={`wb-section-label wb-section-label-${isDark ? 'dark' : 'light'}`}>
          Font
        </div>
        <div style={{ display: 'flex', gap: 3 }} role="radiogroup" aria-label="Font family">
          {FONT_FAMILIES.map((f) => (
            <button
              key={f.value}
              onClick={() => setStyle({ fontFamily: f.value })}
              title={f.label}
              role="radio"
              aria-checked={s.fontFamily === f.value}
              aria-label={f.label}
              className={[
                'wb-font-btn',
                `wb-font-btn-${isDark ? 'dark' : 'light'}`,
                s.fontFamily === f.value ? `wb-font-btn-active wb-font-btn-active-${isDark ? 'dark' : 'light'}` : '',
              ].join(' ')}
            >
              <span style={{ fontFamily: f.value }}>{f.preview}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <div className={`wb-section-label wb-section-label-${isDark ? 'dark' : 'light'}`}>
          Size
        </div>
        <div style={{ display: 'flex', gap: 3 }} role="radiogroup" aria-label="Font size">
          {[14, 20, 28, 36, 48].map((sz) => (
            <button
              key={sz}
              onClick={() => setStyle({ fontSize: sz })}
              role="radio"
              aria-checked={s.fontSize === sz}
              aria-label={`Size ${sz}`}
              className={[
                'wb-size-btn',
                `wb-size-btn-${isDark ? 'dark' : 'light'}`,
                s.fontSize === sz ? `wb-size-btn-active wb-size-btn-active-${isDark ? 'dark' : 'light'}` : '',
              ].join(' ')}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Alignment + Bold + Italic + Underline + Strikethrough */}
      <div>
        <div className={`wb-section-label wb-section-label-${isDark ? 'dark' : 'light'}`}>
          Format
        </div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }} role="group" aria-label="Text format">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setStyle({ textAlign: a })}
              role="radio"
              aria-checked={s.textAlign === a}
              aria-label={`Align ${a}`}
              className={[
                'wb-opt-btn',
                `wb-opt-btn-${isDark ? 'dark' : 'light'}`,
                s.textAlign === a ? `wb-opt-btn-active wb-opt-btn-active-${isDark ? 'dark' : 'light'}` : '',
              ].join(' ')}
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
            onClick={() => applyInlineFormat('bold')}
            role="radio"
            aria-checked={s.fontWeight === 'bold'}
            aria-label="Bold"
            className={[
              'wb-opt-btn',
              `wb-opt-btn-${isDark ? 'dark' : 'light'}`,
              s.fontWeight === 'bold' ? `wb-opt-btn-active wb-opt-btn-active-${isDark ? 'dark' : 'light'}` : '',
            ].join(' ')}
          >
            <span style={{ fontWeight: 'bold', fontSize: 13 }}>B</span>
          </button>
          <button
            onClick={() => applyInlineFormat('italic')}
            role="radio"
            aria-checked={s.fontStyle === 'italic'}
            aria-label="Italic"
            className={[
              'wb-opt-btn',
              `wb-opt-btn-${isDark ? 'dark' : 'light'}`,
              s.fontStyle === 'italic' ? `wb-opt-btn-active wb-opt-btn-active-${isDark ? 'dark' : 'light'}` : '',
            ].join(' ')}
          >
            <span style={{ fontStyle: 'italic', fontSize: 13 }}>I</span>
          </button>
          {/* Phase 5: Underline button — now persists to style.textDecoration */}
          <button
            onClick={() => applyInlineFormat('underline')}
            role="radio"
            aria-checked={!!s.textDecoration?.includes('underline')}
            aria-label="Underline"
            className={[
              'wb-opt-btn',
              `wb-opt-btn-${isDark ? 'dark' : 'light'}`,
              s.textDecoration?.includes('underline') ? `wb-opt-btn-active wb-opt-btn-active-${isDark ? 'dark' : 'light'}` : '',
            ].join(' ')}
          >
            <span style={{ textDecoration: 'underline', fontSize: 13 }}>U</span>
          </button>
          {/* Phase 5: Strikethrough button */}
          <button
            onClick={() => applyInlineFormat('strikeThrough')}
            role="radio"
            aria-checked={!!s.textDecoration?.includes('line-through')}
            aria-label="Strikethrough"
            className={[
              'wb-opt-btn',
              `wb-opt-btn-${isDark ? 'dark' : 'light'}`,
              s.textDecoration?.includes('line-through') ? `wb-opt-btn-active wb-opt-btn-active-${isDark ? 'dark' : 'light'}` : '',
            ].join(' ')}
          >
            <span style={{ textDecoration: 'line-through', fontSize: 13 }}>S</span>
          </button>
        </div>
      </div>

      {/* Phase 5: Text color picker */}
      <div>
        <div className={`wb-section-label wb-section-label-${isDark ? 'dark' : 'light'}`}>
          Text Color
        </div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => applyInlineFormat('foreColor', c)}
              aria-label={`Text color ${c}`}
              title={c}
              style={{
                width: 18, height: 18, borderRadius: '50%', cursor: 'pointer', padding: 0,
                background: c, border: s.textColor === c ? '2px solid #3b82f6' : ('1px solid ' + (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)')),
                boxShadow: s.textColor === c ? '0 0 0 2px rgba(59,130,246,0.4)' : 'none',
              }}
            />
          ))}
          {/* Reset to default (use strokeColor) */}
          <button
            onClick={() => setStyle({ textColor: undefined })}
            title="Reset text color"
            style={{
              padding: '2px 6px', borderRadius: 4, fontSize: 9, cursor: 'pointer',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
              color: isDark ? '#94a3b8' : '#64748b',
            }}
          >Reset</button>
        </div>
      </div>

      {/* Phase 5: Highlight color picker */}
      <div>
        <div className={`wb-section-label wb-section-label-${isDark ? 'dark' : 'light'}`}>
          Highlight
        </div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => applyInlineFormat('hiliteColor', c)}
              aria-label={`Highlight ${c}`}
              title={c === 'transparent' ? 'No highlight' : c}
              style={{
                width: 18, height: 18, borderRadius: '50%', cursor: 'pointer', padding: 0,
                background: c === 'transparent' ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)') : c,
                border: s.textHighlight === c ? '2px solid #3b82f6' : ('1px solid ' + (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)')),
                boxShadow: s.textHighlight === c ? '0 0 0 2px rgba(59,130,246,0.4)' : 'none',
                position: 'relative',
              }}
            >
              {c === 'transparent' && (
                <svg width="18" height="18" viewBox="0 0 18 18" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <line x1="2" y1="16" x2="16" y2="2" stroke="#ef4444" strokeWidth="1.5" />
                </svg>
              )}
            </button>
          ))}
          {/* Reset highlight */}
          <button
            onClick={() => setStyle({ textHighlight: undefined })}
            title="Reset highlight"
            style={{
              padding: '2px 6px', borderRadius: 4, fontSize: 9, cursor: 'pointer',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
              color: isDark ? '#94a3b8' : '#64748b',
            }}
          >Reset</button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Fx Quick Button — always visible in the style bar
// One-click access to insert/toggle LaTeX equations.
// ============================================================
function FxQuickButton({ isDark }: { isDark: boolean }) {
  const selectedIds = useWhiteboardStore((s) => s.selectedIds)
  const updateElement = useWhiteboardStore((s) => s.updateElement)
  const pushHistory = useWhiteboardStore((s) => s.pushHistory)
  const camera = useWhiteboardStore((s) => s.camera)
  const currentPageIndex = useWhiteboardStore((s) => s.currentPageIndex)
  const style = useWhiteboardStore((s) => s.style)
  const addElement = useWhiteboardStore((s) => s.addElement)

  const handleClick = useCallback(() => {
    try {
      if (selectedIds.length === 1) {
        const el = useWhiteboardStore.getState().elements.find(e => e.id === selectedIds[0])
        if (el && el.type === 'text') {
          pushHistory()
          const isCurrentlyLatex = (el as unknown as { isLatex?: boolean }).isLatex as boolean
          updateElement(el.id, { isLatex: !isCurrentlyLatex, width: Math.max(280, el.width || 300), height: Math.max(120, el.height || 100) })
          return
        }
      }
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800
      const cx = ((vw / 2) - 150 - camera.x) / camera.zoom
      const cy = ((vh / 2 - 60) - camera.y) / camera.zoom
      addElement({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
        type: 'text',
        x: cx, y: cy, width: 300, height: 120,
        rotation: 0, opacity: 1,
        strokeColor: style.strokeColor, fillColor: 'transparent',
        strokeWidth: 0, locked: false, pageIndex: currentPageIndex,
        text: '', fontSize: style.fontSize || 20,
        fontFamily: style.fontFamily || 'inherit',
        textAlign: style.textAlign || 'left',
        isLatex: true,
        // Phase 5: persist text styling
        textDecoration: style.textDecoration,
        textHighlight: style.textHighlight,
        textColor: style.textColor,
      } as unknown as unknown as import("@/lib/whiteboard/types").WhiteboardElement)
    } catch (err) {
      console.warn('[FxQuickButton] Failed:', err)
    }
  }, [selectedIds, updateElement, pushHistory, camera, currentPageIndex, style, addElement])

  const isActive = selectedIds.length === 1 &&
    (() => { const el = useWhiteboardStore.getState().elements.find(e => e.id === selectedIds[0]); return el?.type === 'text' && (el as unknown as { isLatex?: boolean }).isLatex })()

  return (
    <button
      onClick={handleClick}
      data-testid="fx-equation-btn"
      title={isActive ? 'Toggle off equation mode' : 'Insert equation (LaTeX)'}
      className={[
        'wb-pocket-btn',
        'wb-fx-btn',
        `wb-pocket-btn-${isDark ? 'dark' : 'light'}`,
        isActive ? 'wb-fx-btn-active' : '',
      ].join(' ')}
      style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6,
        background: isActive ? 'rgba(5,150,105,0.2)' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
        border: isActive ? '1px solid rgba(5,150,105,0.4)' : ('1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)')),
        color: isActive ? '#34d399' : (isDark ? '#a1a1aa' : '#71717a'),
        cursor: 'pointer', transition: 'all 0.15s', fontSize: 12, fontWeight: 500,
      }}
      onMouseEnter={(e) => { const t = e.currentTarget; t.style.background = isActive ? 'rgba(5,150,105,0.3)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') }}
      onMouseLeave={(e) => { const t = e.currentTarget; t.style.background = isActive ? 'rgba(5,150,105,0.2)' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)') }}
    >
      <FunctionSquare size={14} />
      <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>fx</span>
    </button>
  )
}

// ============================================================
// Insert Equation Button (inside Text pocket popup)
// Makes the LaTeX/equation feature discoverable from the
// style bar's Text pocket.
// ============================================================
function InsertEquationButton({ isDark }: { isDark: boolean }) {
  const selectedIds = useWhiteboardStore((s) => s.selectedIds)
  const updateElement = useWhiteboardStore((s) => s.updateElement)
  const pushHistory = useWhiteboardStore((s) => s.pushHistory)
  const camera = useWhiteboardStore((s) => s.camera)
  const currentPageIndex = useWhiteboardStore((s) => s.currentPageIndex)
  const style = useWhiteboardStore((s) => s.style)
  const addElement = useWhiteboardStore((s) => s.addElement)

  const handleInsert = () => {
    try {
      // If a text element is selected, toggle its LaTeX mode
      if (selectedIds.length === 1) {
        const el = useWhiteboardStore.getState().elements.find(e => e.id === selectedIds[0])
        if (el && el.type === 'text') {
          pushHistory()
          const isCurrentlyLatex = (el as { isLatex?: boolean }).isLatex
          updateElement(el.id, {
            isLatex: !isCurrentlyLatex,
            width: Math.max(280, el.width || 300),
            height: Math.max(120, el.height || 100),
          })
          return
        }
      }
      // Otherwise, create a new equation text element at viewport center
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800
      const cx = ((vw / 2) - 150 - camera.x) / camera.zoom
      const cy = ((vh / 2 - 60) - camera.y) / camera.zoom
      addElement({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
        type: 'text',
        x: cx, y: cy, width: 300, height: 120,
        rotation: 0, opacity: 1,
        strokeColor: style.strokeColor, fillColor: 'transparent',
        strokeWidth: 0, locked: false, pageIndex: currentPageIndex,
        text: '', fontSize: style.fontSize || 20,
        fontFamily: style.fontFamily || 'inherit',
        textAlign: style.textAlign || 'left',
        isLatex: true,
        // Phase 5: persist text styling
        textDecoration: style.textDecoration,
        textHighlight: style.textHighlight,
        textColor: style.textColor,
      } as unknown as unknown as import("@/lib/whiteboard/types").WhiteboardElement)
    } catch (err) {
      console.warn('[InsertEquation] Failed:', err)
    }
  }

  const hasSelectedText = selectedIds.length === 1
  const label = hasSelectedText ? 'Toggle Equation' : 'Insert Equation'

  return (
    <div style={{ marginTop: 6, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`, paddingTop: 8 }}>
      <button
        onClick={handleInsert}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          width: '100%', padding: '6px 10px', borderRadius: 6,
          background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)',
          color: '#34d399', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(5,150,105,0.2)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(5,150,105,0.1)' }}
      >
        <FunctionSquare size={14} />
        <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>fx</span>
        <span>{label}</span>
      </button>
    </div>
  )
}
