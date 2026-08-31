// ============================================================
// Superboard — Element Renderer
// Renders each whiteboard element as SVG
// ============================================================

'use client'

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import type { WhiteboardElement, FreehandElement, LineElement, ArrowElement } from '@/lib/whiteboard/types'
import {
  getFreehandPath,
  diamondPath,
  trianglePath,
  arrowHeadPath,
  simulatePressure,
  HIGHLIGHT_OPTIONS,
  hexToRgba,
  generateId,
} from '@/lib/whiteboard/utils'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { mathToLatex, EQUATION_LIBRARY, EQUATION_CATEGORIES } from '@/lib/whiteboard/math-input-parser'
import dynamic from 'next/dynamic'

// Lazy-load math renderers — 27.7 KB only loads when math elements exist on canvas (L-02 fix)
const LazyMathRenderers = dynamic(
  () => import('./MathElementRenderers').then(m => ({ default: m.MathElementRenderers })),
  { ssr: false, loading: () => null }
)

// Lazy-load canvas widget renderers
const LazyCanvasWidgets = dynamic(
  () => import('./CanvasWidgets').then(m => ({ default: m.CanvasWidgetRenderer })),
  { ssr: false, loading: () => null }
)

// Load KaTeX CSS (client-only)
if (typeof window !== 'undefined') {
  import('katex/dist/katex.min.css')
}

interface ElementRendererProps {
  element: WhiteboardElement
  isSelected: boolean
  onPointerDown: (e: React.PointerEvent, id: string) => void
  onDoubleClick: (id: string) => void
  onTextChange?: (id: string, text: string) => void
  cameraZoom: number
}

export const ElementRenderer = React.memo(function ElementRenderer({
  element,
  isSelected,
  onPointerDown,
  onDoubleClick,
  onTextChange,
  cameraZoom,
  tool,
  isDark,
}: ElementRendererProps & { tool: string; isDark: boolean }) {

  // Stabilize callbacks so they don't defeat React.memo (P-02)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only stop propagation in select mode so that drawing/erasing over
    // existing elements still works.  In select mode the container's
    // hit-test handles selection, so we prevent double-handling.
    if (tool === 'select') {
      e.stopPropagation()
    }
    onPointerDown(e, element.id)
  }, [tool, onPointerDown, element.id])

  const handleDoubleClick = useCallback(() => {
    onDoubleClick(element.id)
  }, [onDoubleClick, element.id])

  const commonProps = useMemo(() => ({
    opacity: element.opacity,
    stroke: element.strokeColor,
    fill: element.fillColor || 'none',
    strokeWidth: element.strokeWidth,
    strokeDasharray: element.dash?.length ? element.dash.join(' ') : undefined,
    onPointerDown: handlePointerDown,
    onDoubleClick: handleDoubleClick,
    style: { cursor: element.locked ? 'not-allowed' : 'pointer' } as React.CSSProperties,
  }), [element.opacity, element.strokeColor, element.fillColor, element.strokeWidth, element.dash, element.locked, handlePointerDown, handleDoubleClick])

  switch (element.type) {
    case 'freehand':
      return <FreehandSvg element={element} commonProps={commonProps} />

    case 'rectangle':
      return (
        <rect
          {...commonProps}
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          rx={2}
          ry={2}
        />
      )

    case 'ellipse':
      return (
        <ellipse
          {...commonProps}
          cx={element.x + element.width / 2}
          cy={element.y + element.height / 2}
          rx={element.width / 2}
          ry={element.height / 2}
        />
      )

    case 'diamond':
      return (
        <path
          {...commonProps}
          d={diamondPath(element.x, element.y, element.width, element.height)}
        />
      )

    case 'triangle':
      return (
        <path
          {...commonProps}
          d={trianglePath(element.x, element.y, element.width, element.height)}
        />
      )

    case 'line':
      return (
        <line
          {...commonProps}
          x1={element.x}
          y1={element.y}
          x2={element.x2}
          y2={element.y2}
          strokeLinecap="round"
        />
      )

    case 'arrow': {
      const pathD = arrowHeadPath(
        { x: element.x, y: element.y },
        { x: element.x2, y: element.y2 },
        10 + element.strokeWidth
      )
      return (
        <g>
          <line
            {...commonProps}
            x1={element.x}
            y1={element.y}
            x2={element.x2}
            y2={element.y2}
            strokeLinecap="round"
          />
          <path d={pathD} fill={element.strokeColor} opacity={element.opacity} />
        </g>
      )
    }

    case 'text': {
      const hasText = !!element.text
      const isLatex = (element as { isLatex?: boolean }).isLatex
      const textColor = hasText ? element.strokeColor : (isDark ? '#b4c0d4' : '#4b5563')

      // ---- LaTeX text element ----
      if (isLatex) {
        return <LatexTextElement element={element} isDark={isDark} textColor={textColor} onPointerDown={onPointerDown} onDoubleClick={onDoubleClick} onTextChange={onTextChange} tool={tool} />
      }

      // ---- Plain text element ----
      // B2 FIX: Extracted to PlainTextElement to prevent text duplication.
      // The old inline contentEditable re-rendered React children on top of
      // browser-managed DOM, causing text to duplicate on blur commits.
      return (
        <PlainTextElement
          element={element}
          isDark={isDark}
          textColor={textColor}
          hasText={hasText}
          onPointerDown={onPointerDown}
          onDoubleClick={onDoubleClick}
          onTextChange={onTextChange}
          tool={tool}
        />
      )
    }

    case 'sticky':
      return <StickySvg element={element} commonProps={commonProps} onTextChange={onTextChange} tool={tool} isSelected={isSelected} />

    case 'image':
      return (
        <foreignObject
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          opacity={element.opacity}
          onPointerDown={(e) => {
            if (tool === 'select') e.stopPropagation()
            onPointerDown(e, element.id)
          }}
          style={{ cursor: element.locked ? 'not-allowed' : 'pointer' }}
        >
          <img
            src={element.src}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            draggable={false}
          />
        </foreignObject>
      )

    case 'pdf':
      return (
        <foreignObject
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          opacity={element.opacity}
          onPointerDown={(e) => {
            if (tool === 'select') e.stopPropagation()
            onPointerDown(e, element.id)
          }}
          style={{ cursor: element.locked ? 'not-allowed' : 'pointer' }}
        >
          <img
            src={(element as { pdfDataUrl: string }).pdfDataUrl}
            alt={`PDF page ${(element as { pageNumber: number }).pageNumber}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              pointerEvents: 'none',
              userSelect: 'none',
              display: 'block',
            }}
            draggable={false}
          />
        </foreignObject>
      )

    case 'frame':
      return (
        <g>
          <rect
            {...commonProps}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            rx={8}
            ry={8}
            fill="none"
          />
          <text
            x={element.x + 8}
            y={element.y - 6}
            fontSize={12}
            fill={element.strokeColor}
            fontFamily="inherit"
            opacity={0.6}
          >
            {element.name || 'Frame'}
          </text>
        </g>
      )

    case 'laser':
      return <LaserSvg element={element} />

    // Math element types
    case 'math-fraction-circle':
    case 'math-fraction-bar':
    case 'math-number-line':
    case 'math-angle':
    case 'math-polygon':
    case 'math-coordinate-plane':
    case 'math-venn':
    case 'math-bar-chart':
    case 'math-pie-chart':
      return <LazyMathRenderers element={element} isSelected={isSelected} />

    case 'widget': {
      // In non-select modes (draw, highlighter, eraser, etc.), make the widget
      // completely transparent to pointer events so the user can draw/write
      // over it.  In select mode the widget is interactive (draggable, controls).
      var widgetPointerEvents = tool === 'select' ? 'auto' : 'none' as React.CSSProperties['pointerEvents']
      // Helper: detect if the pointer landed on an interactive control inside
      // the widget (button, slider, input, etc.).  If so we select the widget
      // but do NOT start a drag — the control itself needs the pointer.
      function isWidgetInteractive(e: React.PointerEvent): boolean {
        var t = e.target as HTMLElement
        if (!t) return false
        var tag = t.tagName
        if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return true
        if (t.isContentEditable) return true
        if (t.closest('button, input, select, textarea, label, a, [role="slider"], [role="button"]')) return true
        return false
      }
      var closeBtnCx = element.x + element.width - 14
      var closeBtnCy = element.y + 14
      var dupBtnCx = element.x + 14
      var dupBtnCy = element.y + 14
      var btnR = 11
      var btnBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
      var btnColor = '#94a3b8'
      // Grade-band color coding for widget border
      var gradeBorder = '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
      var gradeBorderTop = 'none'
      var wk = (element as import('@/lib/whiteboard/types').WidgetElement).widgetKind || ''
      if (wk.startsWith('math-fraction') || wk.startsWith('math-number-line') || wk.startsWith('math-bar-chart') || wk.startsWith('math-pie-chart') || wk === 'math-place-value' || wk === 'math-clock' || wk === 'math-base-10' || wk === 'math-multiplication-array') {
        gradeBorderTop = '3px solid #22c55e'
      } else if (wk.startsWith('math-') || wk === 'math-place-value' || wk === 'math-clock' || wk === 'math-base-10' || wk === 'math-multiplication-array') {
        gradeBorderTop = '3px solid #3b82f6'
      } else if (wk.startsWith('stat-')) {
        gradeBorderTop = '3px solid #a855f7'
      } else if (wk.startsWith('arts-')) {
        gradeBorderTop = '3px solid #8b5cf6'
      } else if (wk.startsWith('classroom-')) {
        gradeBorderTop = '3px solid #059669'
      }
      return (
        <g>
          <foreignObject
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            opacity={element.opacity}
            style={{
              cursor: element.locked ? 'not-allowed' : (tool === 'select' ? 'pointer' : 'none'),
              pointerEvents: widgetPointerEvents as React.CSSProperties['pointerEvents'],
            }}
            onPointerDown={(e) => {
              if (tool === 'select') {
                e.stopPropagation()
                if (!isWidgetInteractive(e)) {
                  // Click on widget background → select + enable drag
                  onPointerDown(e, element.id)
                } else {
                  // Click on interactive control (slider, button, input)
                  // → select widget but do NOT start drag
                  useWhiteboardStore.getState().selectElements([element.id])
                }
              }
              // In non-select modes pointerEvents is 'none' so this never fires
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: '100%', boxSizing: 'border-box' }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: isDark ? '#111113' : '#ffffff',
                  border: gradeBorder,
                  borderTop: gradeBorderTop,
                  borderRadius: 8,
                  padding: '10px 12px',
                  overflow: 'auto',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  transform: 'scale(1.3)',
                  transformOrigin: 'top left' as const,
                }}
              >
                <LazyCanvasWidgets element={element as import('@/lib/whiteboard/types').WidgetElement} isDark={isDark} />
              </div>
            </div>
          </foreignObject>
          {/* Action buttons — SVG, always has pointer events regardless of tool mode */}
          {/* Close (x) button — top right */}
          <g
            style={{ cursor: 'pointer' as const }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              var store = useWhiteboardStore.getState()
              store.pushHistory()
              store.removeElements([element.id])
              store.clearSelection()
            }}
            opacity={0.5}
            onMouseOver={(e) => { e.currentTarget.setAttribute('opacity', '1') }}
            onMouseOut={(e) => { e.currentTarget.setAttribute('opacity', '0.5') }}
          >
            <circle cx={closeBtnCx} cy={closeBtnCy} r={btnR} fill={btnBg} />
            <text x={closeBtnCx} y={closeBtnCy + 1} textAnchor='middle' dominantBaseline='central' fontSize={12} fill={btnColor} style={{ pointerEvents: 'none' as const, userSelect: 'none' as const }}>x</text>
          </g>
          {/* Duplicate (⯑) button — top left */}
          <g
            style={{ cursor: 'pointer' as const }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              var store = useWhiteboardStore.getState()
              store.pushHistory()
              var clone: WhiteboardElement = {
                ...element,
                id: generateId(),
                x: element.x + 20, y: element.y + 20,
              }
              store.addElement(clone)
              store.selectElements([clone.id])
            }}
            opacity={0.5}
            onMouseOver={(e) => { e.currentTarget.setAttribute('opacity', '1') }}
            onMouseOut={(e) => { e.currentTarget.setAttribute('opacity', '0.5') }}
          >
            <circle cx={dupBtnCx} cy={dupBtnCy} r={btnR} fill={btnBg} />
            <text x={dupBtnCx} y={dupBtnCy + 1} textAnchor='middle' dominantBaseline='central' fontSize={11} fill={btnColor} style={{ pointerEvents: 'none' as const, userSelect: 'none' as const }}>⯑</text>
          </g>
          {/* Lock/Unlock (🔒/🔓) button — below close, top right */}
          <g
            style={{ cursor: 'pointer' as const }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              var store = useWhiteboardStore.getState()
              store.pushHistory()
              store.updateElement(element.id, { locked: !element.locked } as Partial<WhiteboardElement>)
            }}
            opacity={element.locked ? 1 : 0.5}
            onMouseOver={(e) => { e.currentTarget.setAttribute('opacity', '1') }}
            onMouseOut={(e) => { e.currentTarget.setAttribute('opacity', String(element.locked ? 1 : 0.5)) }}
          >
            <circle cx={element.x + element.width - 14} cy={element.y + 40} r={btnR} fill={element.locked ? 'rgba(239,68,68,0.15)' : btnBg} />
            <text x={element.x + element.width - 14} y={41} textAnchor='middle' dominantBaseline='central' fontSize={10} fill={element.locked ? '#f87171' : btnColor} style={{ pointerEvents: 'none' as const, userSelect: 'none' as const }}>{element.locked ? '🔒' : '🔓'}</text>
          </g>
          {/* Bring to Front (↑) button — below duplicate, top left */}
          <g
            style={{ cursor: 'pointer' as const }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              var store = useWhiteboardStore.getState()
              store.pushHistory()
              store.bringToFront(element.id)
            }}
            opacity={0.5}
            onMouseOver={(e) => { e.currentTarget.setAttribute('opacity', '1') }}
            onMouseOut={(e) => { e.currentTarget.setAttribute('opacity', '0.5') }}
          >
            <circle cx={element.x + 14} cy={element.y + 40} r={btnR} fill={btnBg} />
            <text x={element.x + 14} y={41} textAnchor='middle' dominantBaseline='central' fontSize={12} fill={btnColor} style={{ pointerEvents: 'none' as const, userSelect: 'none' as const }}>↑</text>
          </g>
        </g>
      )
    }

    default:
      return null
  }
})

// ---- Sub-components ----

// ---- Category button style helper ----
function catBtnStyle(active: boolean, dk: boolean, accent: string): React.CSSProperties {
  return {
    background: active ? accent : (dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
    color: active ? '#fff' : (dk ? '#94a3b8' : '#64748b'),
    border: 'none',
    borderRadius: 5,
    padding: '3px 8px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  }
}

// ---- LaTeX Text Element ----
// Renders KaTeX when viewing, smart input + equation library when editing
function LatexTextElement({ element, isDark, textColor, onPointerDown, onDoubleClick, onTextChange, tool }: {
  element: WhiteboardElement
  isDark: boolean
  textColor: string
  onPointerDown: (e: React.PointerEvent, id: string) => void
  onDoubleClick: (id: string) => void
  onTextChange?: (id: string, text: string) => void
  tool: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(element.text || '')
  const [showLibrary, setShowLibrary] = useState(false)
  const [librarySearch, setLibrarySearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const libRef = useRef<HTMLDivElement>(null)

  // Convert stored text (which is plain-text input) to LaTeX for rendering
  const renderedHtml = useMemo(() => {
    if (!element.text) return ''
    try {
      const katex = require('katex')
      const latex = mathToLatex(element.text)
      return katex.renderToString(latex || element.text, {
        displayMode: true,
        throwOnError: false,
        output: 'html',
      })
    } catch {
      return '<span>' + element.text.replace(/</g, '&lt;') + '</span>'
    }
  }, [element.text])

  // Live preview of current input as user types
  const previewHtml = useMemo(() => {
    if (!editValue) return ''
    try {
      const katex = require('katex')
      const latex = mathToLatex(editValue)
      return katex.renderToString(latex || editValue, {
        displayMode: true,
        throwOnError: false,
        output: 'html',
      })
    } catch {
      return ''
    }
  }, [editValue])

  // Sync edit value when element text changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(element.text || '')
    }
  }, [element.text, isEditing])

  const startEdit = useCallback(() => {
    setEditValue(element.text || '')
    setIsEditing(true)
    setShowLibrary(false)
  }, [element.text])

  const commitEdit = useCallback(() => {
    onTextChange?.(element.id, editValue)
    setIsEditing(false)
    setShowLibrary(false)
  }, [element.id, editValue, onTextChange])

  const cancelEdit = useCallback(() => {
    setEditValue(element.text || '')
    setIsEditing(false)
    setShowLibrary(false)
  }, [element.text])

  const insertEquation = useCallback((latex: string) => {
    // Store the raw LaTeX directly (advanced users or library inserts)
    onTextChange?.(element.id, latex)
    setEditValue(latex)
  }, [element.id, onTextChange])

  // Auto-focus textarea when editing
  useEffect(() => {
    if (isEditing && textareaRef.current && !showLibrary) {
      textareaRef.current.focus()
    }
  }, [isEditing, showLibrary])

  // Filter equations by search and category
  const filteredEquations = useMemo(() => {
    let eqs = EQUATION_LIBRARY
    if (activeCategory !== 'all') {
      eqs = eqs.filter(e => e.category === activeCategory)
    }
    if (librarySearch.trim()) {
      const q = librarySearch.toLowerCase()
      eqs = eqs.filter(e =>
        e.label.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.latex.toLowerCase().includes(q)
      )
    }
    return eqs
  }, [activeCategory, librarySearch, EQUATION_LIBRARY])

  // Render a single equation card in the library
  const renderEquationCard = useCallback((eq: { label: string; latex: string; category: string }) => {
    let cardHtml = ''
    try {
      const katex = require('katex')
      cardHtml = katex.renderToString(eq.latex, {
        displayMode: true,
        throwOnError: false,
        output: 'html',
      })
    } catch { /* skip */ }
    const bg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
    const bgHover = isDark ? 'rgba(52,211,153,0.1)' : 'rgba(5,150,105,0.06)'
    return (
      <div
        key={eq.label}
        className={'wb-eq-card'}
        style={{
          background: bg,
          borderRadius: 8,
          padding: '8px 10px',
          cursor: 'pointer',
          transition: 'background 0.15s',
          border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
        }}
        onPointerDown={(e) => { e.stopPropagation() }}
        onClick={(e) => {
          e.stopPropagation()
          insertEquation(eq.latex)
          setShowLibrary(false)
          setTimeout(() => textareaRef.current?.focus(), 50)
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = bgHover }}
        onMouseLeave={(e) => { e.currentTarget.style.background = bg }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: isDark ? '#94a3b8' : '#64748b',
            marginBottom: 4,
          }}
        >{eq.label}</div>
        <div
          dangerouslySetInnerHTML={{ __html: cardHtml }}
          style={{ minHeight: 24, display: 'flex', alignItems: 'center', color: textColor }}
        />
      </div>
    )
  }, [isDark, textColor, insertEquation])

  const dk = isDark
  const bgColor = dk ? 'rgba(14,14,16,0.96)' : 'rgba(255,255,255,0.98)'
  const borderColor = dk ? 'rgba(52,211,153,0.4)' : 'rgba(5,150,105,0.3)'
  const inputBg = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'
  const labelColor = dk ? '#94a3b8' : '#64748b'
  const accentColor = dk ? '#34d399' : '#059669'
  const hintColor = dk ? '#475569' : '#94a3b8'

  return (
    <foreignObject
      x={element.x}
      y={element.y}
      width={element.width || 300}
      height={element.height || 100}
      opacity={element.opacity}
      onPointerDown={(e) => {
        if (tool === 'select') e.stopPropagation()
        onPointerDown(e, element.id)
      }}
      onDoubleClick={() => {
        if (!element.locked) startEdit()
      }}
      style={{ cursor: element.locked ? 'not-allowed' : (isEditing ? 'text' : 'pointer') }}
    >
      {isEditing ? (
        <div
          ref={libRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: bgColor,
            border: '1.5px dashed ' + borderColor,
            borderRadius: 8,
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Top bar: input + buttons */}
          <div style={{ display: 'flex', gap: 6, padding: '6px 8px 4px', alignItems: 'center' }}>
            <input
              ref={textareaRef as unknown as React.RefObject<HTMLInputElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') cancelEdit()
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  commitEdit()
                }
              }}
              onBlur={commitEdit}
              style={{
                flex: 1,
                fontSize: Math.max(12, element.fontSize - 2),
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                color: textColor,
                background: inputBg,
                border: '1px solid ' + (dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                borderRadius: 6,
                padding: '5px 8px',
                outline: 'none',
                minWidth: 0,
              }}
              placeholder="x^2 + 1/2 + sqrt(4)"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowLibrary(prev => !prev)
              }}
              style={{
                background: showLibrary ? accentColor : (dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                color: showLibrary ? '#fff' : (dk ? '#94a3b8' : '#64748b'),
                border: 'none',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}
            >
              {'Equations'}
            </button>
          </div>

          {/* Live preview */}
          <div
            style={{
              minHeight: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 12px 6px',
              borderBottom: showLibrary ? ('1px solid ' + (dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')) : 'none',
            }}
          >
            {previewHtml ? (
              <div
                dangerouslySetInnerHTML={{ __html: previewHtml }}
                style={{ color: textColor, fontSize: Math.max(14, element.fontSize) }}
              />
            ) : (
              <span style={{ color: hintColor, fontSize: 12 }}>
                {'Type math above — previews here live'}
              </span>
            )}
          </div>

          {/* Equation library panel */}
          {showLibrary && (
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '6px 8px',
            }}>
              {/* Category tabs */}
              <div style={{
                display: 'flex',
                gap: 4,
                marginBottom: 8,
                overflowX: 'auto',
                flexShrink: 0,
              }}>
                <button
                  onClick={() => setActiveCategory('all')}
                  style={catBtnStyle(activeCategory === 'all', dk, accentColor)}
                >All</button>
                {EQUATION_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={catBtnStyle(activeCategory === cat, dk, accentColor)}
                  >{cat}</button>
                ))}
              </div>
              {/* Search */}
              <input
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder={'Search equations...'}
                style={{
                  width: '100%',
                  fontSize: 12,
                  background: inputBg,
                  color: textColor,
                  border: '1px solid ' + (dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                  borderRadius: 6,
                  padding: '4px 8px',
                  outline: 'none',
                  marginBottom: 8,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
              {/* Equation grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 6,
              }}>
                {filteredEquations.map(renderEquationCard)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 8px',
            overflow: 'auto',
            boxSizing: 'border-box',
          }}
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
          data-placeholder={'Double-click to edit equation...'}
        />
      )}
    </foreignObject>
  )
}

function FreehandSvg({ element, commonProps }: { element: FreehandElement; commonProps: Record<string, unknown> }) {
  const isHighlighter = !!element.isHighlighter

  const pathD = useMemo(() => {
    if (element.points.length < 2) return ''
    // Highlighter always uses flat pressure
    if (isHighlighter) {
      const pts = element.points.map(p => ({ ...p, pressure: 0.5 }))
      return getFreehandPath(pts, {
        size: 16,
        thinning: 0,
        smoothing: 0.5,
        streamline: 0.5,
        start: { cap: true } as const,
        end: { cap: true } as const,
      })
    }
    // Pen: detect real stylus pressure for adaptive thinning.
    // Mouse users get all-0.5 pressure → thinning=0 (consistent lines).
    // Stylus users get real varying pressure → thinning=0.3 (subtle natural variation).
    const hasRealPressure = element.points.some(p => p.pressure && p.pressure !== 0.5)
    const pts = hasRealPressure
      ? element.points.map(p => ({ ...p, pressure: p.pressure || 0.5 }))
      : element.points.map(p => ({ ...p, pressure: 0.5 }))
    return getFreehandPath(pts, {
      size: element.strokeWidth * 2,
      thinning: hasRealPressure ? 0.3 : 0,
      smoothing: 0.5,
      streamline: 0.5,
      start: { cap: true } as const,
      end: { cap: true } as const,
    })
  }, [element.points, element.strokeWidth, isHighlighter])

  if (!pathD) return null

  if (isHighlighter) {
    return (
      <path
        {...commonProps}
        d={pathD}
        fill={hexToRgba(element.strokeColor, 0.4)}
        stroke="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={1}
        style={{ mixBlendMode: 'multiply' } as React.CSSProperties}
      />
    )
  }

  return (
    <path
      {...commonProps}
      d={pathD}
      fill={element.strokeColor}
      stroke="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

const STICKY_COLOR_OPTIONS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa']

function StickySvg({
  element,
  commonProps,
  onTextChange,
  tool,
  isSelected,
}: {
  element: { id: string; x: number; y: number; width: number; height: number; noteColor: string; text: string; fontSize: number; locked: boolean }
  commonProps: Record<string, unknown>
  onTextChange?: (id: string, text: string) => void
  tool: string
  isSelected: boolean
}) {
  const updateElement = useWhiteboardStore((s) => s.updateElement)
  const removeElements = useWhiteboardStore((s) => s.removeElements)
  const pushHistory = useWhiteboardStore((s) => s.pushHistory)

  return (
    <g>
      {/* Shadow */}
      <rect
        x={element.x + 2}
        y={element.y + 2}
        width={element.width}
        height={element.height}
        rx={4}
        fill="rgba(0,0,0,0.08)"
      />
      {/* Main body */}
      <rect
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rx={4}
        fill={element.noteColor}
        stroke={commonProps.stroke as string || '#00000020'}
        strokeWidth={1}
        onPointerDown={(e: React.PointerEvent) => {
          // Always stop propagation on sticky body to prevent creating new stickies
          e.stopPropagation()
          ;(commonProps.onPointerDown as (e: React.PointerEvent) => void)?.(e)
        }}
        style={{ cursor: element.locked ? 'not-allowed' : 'pointer' }}
      />
      {/* Close button — visible when selected */}
      {isSelected && !element.locked && (
        <g
          style={{ cursor: 'pointer' }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            pushHistory()
            removeElements([element.id])
          }}
        >
          <circle
            cx={element.x + element.width - 12}
            cy={element.y + 12}
            r={8}
            fill="#ef4444"
            opacity={0.85}
          />
          {/* × icon */}
          <line
            x1={element.x + element.width - 15}
            y1={element.y + 9}
            x2={element.x + element.width - 9}
            y2={element.y + 15}
            stroke="white"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <line
            x1={element.x + element.width - 9}
            y1={element.y + 9}
            x2={element.x + element.width - 15}
            y2={element.y + 15}
            stroke="white"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </g>
      )}
      {/* Color picker dots */}
      {!element.locked && (
        <g style={{ cursor: 'pointer' }}>
          {STICKY_COLOR_OPTIONS.map((color, i) => (
            <circle
              key={color}
              cx={element.x + element.width - 12 - (STICKY_COLOR_OPTIONS.length - 1 - i) * 16}
              cy={isSelected ? element.y + 28 : element.y + 12}
              r={5}
              fill={color}
              stroke="#00000020"
              strokeWidth={0.5}
              onClick={(e) => {
                e.stopPropagation()
                updateElement(element.id, { noteColor: color, fillColor: color } as Partial<WhiteboardElement>)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              style={{ opacity: 0.6 }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '0.6')}
            />
          ))}
        </g>
      )}
      {/* Text area */}
      <foreignObject
        x={element.x + 12}
        y={element.y + (isSelected ? 28 : 12)}
        width={element.width - 24}
        height={element.height - (isSelected ? 40 : 24)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          contentEditable={!element.locked}
          suppressContentEditableWarning
          style={{
            width: '100%',
            height: '100%',
            fontSize: element.fontSize,
            fontFamily: 'inherit',
            outline: 'none',
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
            color: '#1e293b',
          }}
          onPaste={(e) => {
            e.preventDefault()
            const text = e.clipboardData.getData('text/plain')
            document.execCommand('insertText', false, text)
          }}
          onBlur={(e) => {
            onTextChange?.(element.id, e.currentTarget.textContent || '')
          }}
          aria-label="Sticky note text"
        >
          {(element.text || '').split('\n').map((line, i, arr) => (
            <React.Fragment key={i}>
              {line}{i < arr.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      </foreignObject>
    </g>
  )
}

function LaserSvg({ element }: { element: { points: { x: number; y: number }[]; strokeWidth: number; opacity: number } }) {
  if (element.points.length < 2) return null

  const pathD = element.points
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(' ')

  return (
    <g>
      <path
        d={pathD}
        fill="none"
        stroke="#ef4444"
        strokeWidth={element.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={element.opacity}
      />
      {/* Glow effect */}
      <path
        d={pathD}
        fill="none"
        stroke="#ef4444"
        strokeWidth={element.strokeWidth + 6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={element.opacity * 0.19}
      />
    </g>
  )
}

// ============================================================
// B2 FIX: PlainTextElement — prevents text duplication bug
// ============================================================
// Problem: React re-rendering JSX children into a contentEditable div
// conflicts with browser-managed DOM, causing text to duplicate when
// onBlur commits text back to the store (which triggers a re-render).
// Fix: Track focus state via a ref. When focused, let the browser own
// the DOM and do NOT render React children. Only set innerHTML from
// element.text when the div is not focused (initial render or after blur).
// ============================================================

function PlainTextElement({
  element,
  isDark,
  textColor,
  hasText,
  onPointerDown,
  onDoubleClick,
  onTextChange,
  tool,
}: {
  element: WhiteboardElement
  isDark: boolean
  textColor: string
  hasText: boolean
  onPointerDown: (e: React.PointerEvent, id: string) => void
  onDoubleClick: (id: string) => void
  onTextChange?: (id: string, text: string) => void
  tool: string
}) {
  const divRef = useRef<HTMLDivElement>(null)
  const isFocusedRef = useRef(false)
  // Track the last text we set into the DOM to avoid redundant updates
  const lastSetTextRef = useRef<string | null>(null)

  const elText = element.text || ''

  // Set DOM content only when NOT focused and text differs from what we last set
  useEffect(() => {
    const div = divRef.current
    if (!div || isFocusedRef.current) return
    // Only update if text changed from outside (e.g., undo/redo, collaboration)
    if (elText !== lastSetTextRef.current) {
      if (elText) {
        div.innerHTML = elText.split('\n').map(escapeHtml).join('<br/>')
      } else {
        div.innerHTML = ''
      }
      lastSetTextRef.current = elText
    }
  }, [elText])

  return (
    <foreignObject
      x={element.x}
      y={element.y}
      width={element.width || 300}
      height={element.height || 100}
      opacity={element.opacity}
      onPointerDown={(e) => {
        if (tool === 'select') e.stopPropagation()
        onPointerDown(e, element.id)
      }}
      onDoubleClick={() => onDoubleClick(element.id)}
      style={{ cursor: element.locked ? 'not-allowed' : 'text' }}
    >
      <div
        ref={divRef}
        contentEditable={!element.locked}
        suppressContentEditableWarning
        style={{
          width: '100%',
          height: '100%',
          fontSize: element.fontSize,
          fontFamily: element.fontFamily,
          color: textColor,
          outline: 'none',
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textAlign: element.textAlign || 'left',
          fontWeight: (element as { fontWeight?: string }).fontWeight || 'normal',
          fontStyle: (element as { fontStyle?: string }).fontStyle || 'normal',
          cursor: 'text',
          caretColor: element.strokeColor,
        }}
        onPaste={(e) => {
          e.preventDefault()
          const pastedText = e.clipboardData.getData('text/plain')
          document.execCommand('insertText', false, pastedText)
        }}
        onFocus={() => {
          isFocusedRef.current = true
        }}
        onBlur={(e) => {
          isFocusedRef.current = false
          const text = e.currentTarget.textContent || ''
          lastSetTextRef.current = text
          onTextChange?.(element.id, text)
        }}
        data-placeholder="Type here..."
      />
    </foreignObject>
  )
}

/** Minimal HTML escaping for setting text content via innerHTML */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

