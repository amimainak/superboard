// ============================================================
// Superboard — Grid Background
// Renders dot or line grid pattern in SVG
// ============================================================

'use client'

import React, { useMemo } from 'react'
import type { Camera } from '@/lib/whiteboard/types'

interface GridBackgroundProps {
  camera: Camera
  gridSize: number
  gridType: 'dot' | 'line'
  containerWidth: number
  containerHeight: number
  isDark: boolean
}

export function GridBackground({
  camera,
  gridSize,
  gridType,
  containerWidth,
  containerHeight,
  isDark,
}: GridBackgroundProps) {
  const patternId = useMemo(() => 'grid-pattern', [])

  // Calculate visible area in canvas coordinates
  const startX = Math.floor(-camera.x / camera.zoom / gridSize) * gridSize - gridSize
  const startY = Math.floor(-camera.y / camera.zoom / gridSize) * gridSize - gridSize
  const endX = startX + containerWidth / camera.zoom + gridSize * 2
  const endY = startY + containerHeight / camera.zoom + gridSize * 2

  // Limit number of dots to prevent perf issues
  const maxDots = 20000
  const cols = Math.floor((endX - startX) / gridSize)
  const rows = Math.floor((endY - startY) / gridSize)

  if (cols * rows > maxDots) {
    // Skip rendering if too many dots (zoomed out too far)
    return null
  }

  if (gridType === 'dot') {
    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <pattern
          id={patternId}
          x={0}
          y={0}
          width={gridSize * camera.zoom}
          height={gridSize * camera.zoom}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${camera.x % (gridSize * camera.zoom)}, ${camera.y % (gridSize * camera.zoom)})`}
        >
          <circle
            cx={gridSize * camera.zoom / 2}
            cy={gridSize * camera.zoom / 2}
            r={camera.zoom > 0.5 ? 1 : 0.5}
            fill={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}
          />
        </pattern>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    )
  }

  // Line grid
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <defs>
        <pattern
          id={`${patternId}-lines`}
          x={0}
          y={0}
          width={gridSize * camera.zoom}
          height={gridSize * camera.zoom}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${camera.x % (gridSize * camera.zoom)}, ${camera.y % (gridSize * camera.zoom)})`}
        >
          <path
            d={`M ${gridSize * camera.zoom} 0 L 0 0 0 ${gridSize * camera.zoom}`}
            fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
            strokeWidth={0.5}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId}-lines)`} />
    </svg>
  )
}
