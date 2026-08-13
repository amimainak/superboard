// ============================================================
// Superboard — Element Renderer
// Renders each whiteboard element as SVG
// ============================================================

'use client'

import React, { useMemo } from 'react'
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

export function ElementRenderer({
  element,
  isSelected,
  onPointerDown,
  onDoubleClick,
  onTextChange,
  cameraZoom,
}: ElementRendererProps) {
  const tool = useWhiteboardStore((s) => s.tool)

  const commonProps = {
    opacity: element.opacity,
    stroke: element.strokeColor,
    fill: element.fillColor || 'none',
    strokeWidth: element.strokeWidth,
    strokeDasharray: element.dash?.length ? element.dash.join(' ') : undefined,
    onPointerDown: (e: React.PointerEvent) => {
      // Only stop propagation in select mode so that drawing/erasing over
      // existing elements still works.  In select mode the container's
      // hit-test handles selection, so we prevent double-handling.
      if (tool === 'select') {
        e.stopPropagation()
      }
      onPointerDown(e, element.id)
    },
    onDoubleClick: () => onDoubleClick(element.id),
    style: { cursor: element.locked ? 'not-allowed' : 'pointer' } as React.CSSProperties,
  }

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

    case 'text':
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
              color: element.strokeColor,
              outline: 'none',
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
              overflow: 'hidden',
              textAlign: ((element as { textAlign?: string }).textAlign || 'left') as React.CSSProperties['textAlign'],
            }}
            onBlur={(e) => {
              onTextChange?.(element.id, e.currentTarget.textContent || '')
            }}
            dangerouslySetInnerHTML={{ __html: element.text.replace(/\n/g, '<br>') }}
          />
        </foreignObject>
      )

    case 'sticky':
      return <StickySvg element={element} commonProps={commonProps} onTextChange={onTextChange} tool={tool} />

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
}

// ---- Sub-components ----

function FreehandSvg({ element, commonProps }: { element: FreehandElement; commonProps: Record<string, unknown> }) {
  const pathD = useMemo(() => {
    if (element.points.length < 2) return ''
    const pts = simulatePressure(element.points)
    return getFreehandPath(pts, {
      size: element.strokeWidth * 2,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    })
  }, [element.points, element.strokeWidth])

  if (!pathD) return null

  return (
    <path
      {...commonProps}
      d={pathD}
      fill={element.fillColor === 'transparent' ? 'none' : element.fillColor}
      stroke="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

function StickySvg({
  element,
  commonProps,
  onTextChange,
  tool,
}: {
  element: { id: string; x: number; y: number; width: number; height: number; noteColor: string; text: string; fontSize: number; locked: boolean }
  commonProps: Record<string, unknown>
  onTextChange?: (id: string, text: string) => void
  tool: string
}) {
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
          if (tool === 'select') e.stopPropagation()
          ;(commonProps.onPointerDown as (e: React.PointerEvent) => void)?.(e)
        }}
        style={{ cursor: element.locked ? 'not-allowed' : 'pointer' }}
      />
      {/* Text area */}
      <foreignObject
        x={element.x + 12}
        y={element.y + 12}
        width={element.width - 24}
        height={element.height - 24}
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
          dangerouslySetInnerHTML={{ __html: (element.text || '').replace(/\n/g, '<br>') }}
        />
      </foreignObject>
    </g>
  )
}

function LaserSvg({ element }: { element: { points: { x: number; y: number }[]; strokeWidth: number } }) {
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
        opacity={0.8}
      />
      {/* Glow effect */}
      <path
        d={pathD}
        fill="none"
        stroke="#ef4444"
        strokeWidth={element.strokeWidth + 6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.15}
      />
    </g>
  )
}
