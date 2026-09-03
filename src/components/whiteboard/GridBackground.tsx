// ============================================================
// Superboard — Grid Background
// Renders dot, line, isometric, lined, or music-staff grid patterns in SVG
// ============================================================

'use client'

import React, { useMemo } from 'react'
import type { Camera } from '@/lib/whiteboard/types'

interface GridBackgroundProps {
  camera: Camera
  gridSize: number
  gridType: 'dot' | 'line' | 'isometric' | 'lined' | 'music-staff'
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

  const strokeBase = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const strokeStrong = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const dotColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'

  // ---- DOT grid ----
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
            fill={dotColor}
          />
        </pattern>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    )
  }

  // ---- LINE grid (square grid) ----
  if (gridType === 'line') {
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
              stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}
              strokeWidth={0.5}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId}-lines)`} />
      </svg>
    )
  }

  // ---- ISOMETRIC grid ----
  // Triangular grid that creates 60° rhombuses for isometric drawing.
  if (gridType === 'isometric') {
    const tileW = gridSize * camera.zoom
    const tileH = (gridSize * camera.zoom) * Math.sqrt(3) / 2 // 60° rhombus height
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
            id={`${patternId}-iso`}
            x={0}
            y={0}
            width={tileW}
            height={tileH * 2}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${camera.x % tileW}, ${camera.y % (tileH * 2)})`}
          >
            {/* Two triangles per tile */}
            <path
              d={`M 0 0 L ${tileW / 2} ${tileH} L ${tileW} 0 M ${tileW / 2} ${tileH} L ${tileW / 2} ${tileH * 2} L 0 ${tileH * 2} M ${tileW / 2} ${tileH} L ${tileW / 2} ${tileH * 2} L ${tileW} ${tileH * 2}`}
              fill="none"
              stroke={strokeBase}
              strokeWidth={0.5}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId}-iso)`} />
      </svg>
    )
  }

  // ---- LINED (notebook) grid ----
  // Horizontal lines only, like ruled notebook paper.
  if (gridType === 'lined') {
    const lineH = gridSize * camera.zoom * 1.4 // slightly taller for readability
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
            id={`${patternId}-lined`}
            x={0}
            y={0}
            width={4}
            height={lineH}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(0, ${camera.y % lineH})`}
          >
            <line x1={0} y1={lineH} x2="100%" y2={lineH} stroke={strokeBase} strokeWidth={0.6} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId}-lined)`} />
        {/* Red margin line */}
        <line
          x1={(60 + camera.x % 60)}
          y1={0}
          x2={(60 + camera.x % 60)}
          y2="100%"
          stroke={isDark ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.22)'}
          strokeWidth={0.8}
        />
      </svg>
    )
  }

  // ---- MUSIC STAFF grid ----
  // 5 evenly-spaced horizontal lines grouped into staves (music notation paper).
  if (gridType === 'music-staff') {
    const staffGap = gridSize * camera.zoom * 6 // space between staves
    const lineGap = staffGap / 5
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
            id={`${patternId}-staff`}
            x={0}
            y={0}
            width={4}
            height={staffGap + lineGap * 5}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(0, ${camera.y % (staffGap + lineGap * 5)})`}
          >
            {/* 5 staff lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1={0}
                y1={i * lineGap}
                x2="100%"
                y2={i * lineGap}
                stroke={strokeStrong}
                strokeWidth={0.6}
              />
            ))}
            {/* gap (staffGap) before next staff */}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId}-staff)`} />
      </svg>
    )
  }

  return null
}
