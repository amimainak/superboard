'use client'

import { memo, useCallback } from 'react'
import type { ToolId, ToolDefinition } from '@/lib/whiteboard/tools'
import { toolList } from '@/lib/whiteboard/tools'

interface ToolbarProps {
  activeTool: ToolId
  onToolChange: (tool: ToolId) => void
  darkMode: boolean
}

// Inline SVG icons for each tool
const toolIcons: Record<ToolId, (active: boolean) => React.ReactNode> = {
  select: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 2l6 14 2-5 5-2L3 2z" fill={active ? '#fff' : 'currentColor'} stroke={active ? '#fff' : 'currentColor'} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
  hand: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M7 8V3.5a1 1 0 012 0V8M9 8V2.5a1 1 0 012 0V8M11 8V4.5a1 1 0 012 0V12a5 5 0 01-5 5H7.5a5 5 0 01-3.5-1.5L2 13.5V7a1 1 0 012 0v1" stroke={active ? '#fff' : 'currentColor'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  draw: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 15l1.5-4 8-8 2.5 2.5-8 8L3 15z" stroke={active ? '#fff' : 'currentColor'} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M10 6.5l2.5 2.5" stroke={active ? '#fff' : 'currentColor'} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  highlighter: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="9" width="11" height="6" rx="1" transform="rotate(-45 3 9)" fill={active ? 'rgba(255,255,255,0.5)' : 'rgba(250,204,21,0.4)'} stroke={active ? '#fff' : '#eab308'} strokeWidth="1.2" />
    </svg>
  ),
  eraser: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4 14h10M6.5 10.5l-2.5-2.5 5-5 5 5-5 5h-3l-1-1 1.5-1.5z" stroke={active ? '#fff' : 'currentColor'} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  ),
  line: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <line x1="3" y1="15" x2="15" y2="3" stroke={active ? '#fff' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  arrow: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <line x1="3" y1="15" x2="15" y2="3" stroke={active ? '#fff' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="9,3 15,3 15,9" fill="none" stroke={active ? '#fff' : 'currentColor'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  rectangle: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="3" width="14" height="12" rx="1" stroke={active ? '#fff' : 'currentColor'} strokeWidth="1.2" fill="none" />
    </svg>
  ),
  ellipse: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <ellipse cx="9" cy="9" rx="7" ry="5" stroke={active ? '#fff' : 'currentColor'} strokeWidth="1.2" fill="none" />
    </svg>
  ),
  text: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M5 4h8M9 4v10" stroke={active ? '#fff' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 14h4" stroke={active ? '#fff' : 'currentColor'} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  note: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="14" height="14" rx="2" fill={active ? 'rgba(255,255,255,0.3)' : '#fef08a'} stroke={active ? '#fff' : '#eab308'} strokeWidth="1.1" />
      <path d="M6 6h6M6 9h6M6 12h3" stroke={active ? '#fff' : '#a16207'} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  ),
  laser: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="4" fill={active ? 'rgba(255,255,255,0.8)' : 'rgba(255,50,50,0.8)'} stroke={active ? '#fff' : '#ef4444'} strokeWidth="1" />
      <circle cx="9" cy="9" r="7" stroke={active ? 'rgba(255,255,255,0.3)' : 'rgba(255,50,50,0.2)'} strokeWidth="0.8" strokeDasharray="2 2" />
    </svg>
  ),
  frame: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="14" height="14" rx="1" stroke={active ? '#fff' : '#059669'} strokeWidth="1.2" strokeDasharray="3 2" fill="none" />
      <path d="M5 6h5" stroke={active ? '#fff' : '#059669'} strokeWidth="1" strokeLinecap="round" />
    </svg>
  ),
}

function Toolbar({ activeTool, onToolChange, darkMode }: ToolbarProps) {
  const bg = darkMode ? '#2d2d3d' : '#ffffff'
  const border = darkMode ? '#3d3d4d' : '#e5e7eb'
  const textMuted = darkMode ? '#9ca3af' : '#6b7280'

  return (
    <div
      className="toolbar"
      style={{
        position: 'absolute',
        left: 8,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: 4,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 10,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
    >
      {toolList.map((tool) => {
        const isActive = tool.id === activeTool
        return (
          <button
            key={tool.id}
            title={`${tool.label} (${tool.shortcut})`}
            onClick={() => onToolChange(tool.id)}
            data-tool={tool.id}
            className="tool-btn"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: 'none',
              background: isActive ? '#059669' : 'transparent',
              color: isActive ? '#ffffff' : textMuted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s, transform 0.1s',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            {toolIcons[tool.id](isActive)}
          </button>
        )
      })}
    </div>
  )
}

export default memo(Toolbar)
