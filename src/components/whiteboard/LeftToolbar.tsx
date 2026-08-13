// ============================================================
// Superboard — Left Toolbar
// Vertical tool palette for all drawing/editing tools
// ============================================================

'use client'

import React from 'react'
import {
  MousePointer2,
  Hand,
  Pencil,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Diamond,
  Triangle,
  Minus,
  ArrowRight,
  Type,
  StickyNote,
  ImagePlus,
  Frame,
  Zap,
} from 'lucide-react'
import type { ToolId } from '@/lib/whiteboard/types'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface ToolDef {
  id: ToolId
  label: string
  shortcut: string
  icon: React.ReactNode
}

const tools: ToolDef[] = [
  { id: 'select', label: 'Select', shortcut: 'V', icon: <MousePointer2 size={18} /> },
  { id: 'hand', label: 'Hand', shortcut: 'H', icon: <Hand size={18} /> },
  { id: 'draw', label: 'Draw', shortcut: 'D', icon: <Pencil size={18} /> },
  { id: 'highlighter', label: 'Highlight', shortcut: 'Shift+D', icon: <Highlighter size={18} /> },
  { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: <Eraser size={18} /> },
  { id: 'line', label: 'Line', shortcut: 'L', icon: <Minus size={18} /> },
  { id: 'arrow', label: 'Arrow', shortcut: 'A', icon: <ArrowRight size={18} /> },
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: <Square size={18} /> },
  { id: 'ellipse', label: 'Ellipse', shortcut: 'O', icon: <Circle size={18} /> },
  { id: 'diamond', label: 'Diamond', shortcut: 'Shift+R', icon: <Diamond size={18} /> },
  { id: 'triangle', label: 'Triangle', shortcut: 'Shift+T', icon: <Triangle size={18} /> },
  { id: 'text', label: 'Text', shortcut: 'T', icon: <Type size={18} /> },
  { id: 'sticky', label: 'Sticky Note', shortcut: 'N', icon: <StickyNote size={18} /> },
  { id: 'image', label: 'Image', shortcut: 'Ctrl+U', icon: <ImagePlus size={18} /> },
  { id: 'frame', label: 'Frame', shortcut: 'F', icon: <Frame size={18} /> },
  { id: 'laser', label: 'Laser', shortcut: 'K', icon: <Zap size={18} /> },
]

export function LeftToolbar() {
  const { tool, setTool, isDark } = useWhiteboardStore()

  return (
    <>
      <style>{`
        .wb-tooltip-btn {
          position: relative;
        }
        .wb-tooltip-btn::after {
          content: attr(data-tooltip);
          position: absolute;
          left: calc(100% + 10px);
          top: 50%;
          transform: translateY(-50%);
          background: #1e293b;
          color: #fff;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          line-height: 1.4;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
          z-index: 1000;
        }
        .wb-tooltip-btn::before {
          content: '';
          position: absolute;
          left: calc(100% + 4px);
          top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-right-color: #1e293b;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
          z-index: 1000;
        }
        .wb-tooltip-btn:hover::after {
          opacity: 1;
          transition: opacity 0.15s ease 0.6s;
        }
        .wb-tooltip-btn:hover::before {
          opacity: 1;
          transition: opacity 0.15s ease 0.6s;
        }
      `}</style>
    <div
      className="left-toolbar"
      style={{
        width: 44,
        minWidth: 44,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 4px',
        gap: 2,
        borderRight: '1px solid var(--color-border)',
        background: isDark ? '#111827' : '#ffffff',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 100,
      }}
    >
      {tools.map((t, i) => {
        const isActive = tool === t.id
        const isDivider = i === 2 || i === 4 || i === 6 || i === 11
        return (
          <React.Fragment key={t.id}>
            {isDivider && <Divider />}
            <ToolButton
              tool={t}
              isActive={isActive}
              isDark={isDark}
              onClick={() => setTool(t.id)}
            />
          </React.Fragment>
        )
      })}
    </div>
    </>
  )
}

function ToolButton({
  tool,
  isActive,
  isDark,
  onClick,
}: {
  tool: ToolDef
  isActive: boolean
  isDark: boolean
  onClick: () => void
}) {
  return (
    <button
      className="wb-tooltip-btn"
      data-tooltip={`${tool.label}  ${tool.shortcut}`}
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        border: 'none',
        background: isActive
          ? isDark
            ? 'rgba(5,150,105,0.2)'
            : 'rgba(5,150,105,0.1)'
          : 'transparent',
        color: isActive
          ? '#059669'
          : isDark
            ? '#d1d5db'
            : '#4b5563',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
        position: 'relative',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
          e.currentTarget.style.color = isDark ? '#f3f4f6' : '#111827'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = isDark ? '#d1d5db' : '#4b5563'
        }
      }}
    >
      {tool.icon}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            left: -2,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 3,
            height: 20,
            borderRadius: 2,
            background: '#059669',
          }}
        />
      )}
    </button>
  )
}

function Divider() {
  return (
    <div
      style={{
        width: 24,
        height: 1,
        background: 'var(--color-border)',
        margin: '4px 0',
        flexShrink: 0,
      }}
    />
  )
}
