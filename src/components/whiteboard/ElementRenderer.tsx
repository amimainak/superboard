// ============================================================
// Superboard — Element Renderer
// Renders each whiteboard element as SVG
// ============================================================

'use client'

import React, { useCallback, useMemo } from 'react'
import type { WhiteboardElement, FreehandElement, LineElement, ArrowElement } from '@/lib/whiteboard/types'
import {
  getFreehandPath,
  diamondPath,
  trianglePath,
  arrowHeadPath,
  simulatePressure,
  HIGHLIGHT_OPTIONS,
  hexToRgba,
} from '@/lib/whiteboard/utils'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

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
}: ElementRendererProps) {
  const tool = useWhiteboardStore((s) => s.tool)
  const isDark = useWhiteboardStore((s) => s.isDark)

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
            contentEditable={!element.locked}
            suppressContentEditableWarning
            style={{
              width: '100%',
              height: '100%',
              fontSize: element.fontSize,
              fontFamily: element.fontFamily,
              color: hasText ? element.strokeColor : (isDark ? '#b4c0d4' : '#4b5563'),
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
            onBlur={(e) => {
              onTextChange?.(element.id, e.currentTarget.textContent || '')
            }}
            data-placeholder="Type here..."
          >
            {hasText
              ? element.text.split('\n').map((line, i, arr) => (
                <React.Fragment key={i}>
                  {line}{i < arr.length - 1 && <br />}
                </React.Fragment>
              ))
              : null
            }
          </div>
        </foreignObject>
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

    default:
      return null
  }
})

// ---- Sub-components ----

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
