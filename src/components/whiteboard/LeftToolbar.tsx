// ============================================================
// Superboard — Left Toolbar (Minimalist Pocket Design)
// Collapsible tool groups with fly-out sub-menus
// ============================================================

'use client'

import React, { useEffect, useRef, useState } from 'react'
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
  ChevronRight,
} from 'lucide-react'
import type { ToolId } from '@/lib/whiteboard/types'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface ToolDef {
  id: ToolId
  label: string
  shortcut: string
  icon: React.ReactNode
}

interface ToolGroup {
  id: string
  tools: ToolDef[]
}

const groups: ToolGroup[] = [
  {
    id: 'nav',
    tools: [
      { id: 'select', label: 'Select', shortcut: 'V', icon: <MousePointer2 size={18} /> },
      { id: 'hand', label: 'Hand', shortcut: 'H', icon: <Hand size={18} /> },
    ],
  },
  {
    id: 'draw',
    tools: [
      { id: 'draw', label: 'Pen', shortcut: 'D', icon: <Pencil size={18} /> },
      { id: 'highlighter', label: 'Highlight', shortcut: '⇧D', icon: <Highlighter size={18} /> },
      { id: 'laser', label: 'Laser', shortcut: 'K', icon: <Zap size={18} /> },
    ],
  },
  {
    id: 'shapes',
    tools: [
      { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: <Square size={18} /> },
      { id: 'ellipse', label: 'Ellipse', shortcut: 'O', icon: <Circle size={18} /> },
      { id: 'diamond', label: 'Diamond', shortcut: '⇧R', icon: <Diamond size={18} /> },
      { id: 'triangle', label: 'Triangle', shortcut: '⇧T', icon: <Triangle size={18} /> },
      { id: 'line', label: 'Line', shortcut: 'L', icon: <Minus size={18} /> },
      { id: 'arrow', label: 'Arrow', shortcut: 'A', icon: <ArrowRight size={18} /> },
    ],
  },
  {
    id: 'content',
    tools: [
      { id: 'text', label: 'Text', shortcut: 'T', icon: <Type size={18} /> },
      { id: 'sticky', label: 'Sticky', shortcut: 'N', icon: <StickyNote size={18} /> },
      { id: 'image', label: 'Image', shortcut: '⌘U', icon: <ImagePlus size={18} /> },
      { id: 'frame', label: 'Frame', shortcut: 'F', icon: <Frame size={18} /> },
    ],
  },
  {
    id: 'erase',
    tools: [
      { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: <Eraser size={18} /> },
    ],
  },
]

export function LeftToolbar() {
  const { tool, setTool, isDark } = useWhiteboardStore()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Close flyout on outside click or backdrop click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenGroup(null)
      }
    }
    // Use capture phase to catch before any button click
    document.addEventListener('mousedown', handler, true)
    return () => document.removeEventListener('mousedown', handler, true)
  }, [])

  // Auto-close flyout after selecting a tool (small delay so click registers)
  const handleToolClick = (groupId: string, toolId: ToolId) => {
    setTool(toolId)
    setTimeout(() => setOpenGroup(null), 150)
  }

  // Find which group contains the active tool
  const activeGroup = groups.find((g) => g.tools.some((t) => t.id === tool))
  const activeTool = activeGroup?.tools.find((t) => t.id === tool)

  return (
    <div
      ref={toolbarRef}
      style={{
        width: 44,
        minWidth: 44,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px 4px',
        gap: 2,
        borderRight: '1px solid var(--color-border)',
        background: isDark ? '#111827' : '#ffffff',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 100,
      }}
    >
      {groups.map((group) => {
        const isOpen = openGroup === group.id
        const isActiveInGroup = group.tools.some((t) => t.id === tool)

        // For single-tool groups (eraser), just render a direct button
        if (group.tools.length === 1) {
          const t = group.tools[0]
          return (
            <button
              key={group.id}
              onClick={() => setTool(t.id)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: 'none',
                background: tool === t.id
                  ? isDark ? 'rgba(5,150,105,0.2)' : 'rgba(5,150,105,0.1)'
                  : 'transparent',
                color: tool === t.id
                  ? '#059669'
                  : isDark ? '#9ca3af' : '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.12s ease',
                position: 'relative',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (tool !== t.id) {
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
                  e.currentTarget.style.color = isDark ? '#e5e7eb' : '#374151'
                }
              }}
              onMouseLeave={(e) => {
                if (tool !== t.id) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = isDark ? '#9ca3af' : '#6b7280'
                }
              }}
              title={`${t.label} (${t.shortcut})`}
            >
              {t.icon}
              {tool === t.id && (
                <div
                  style={{
                    position: 'absolute',
                    left: -2,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 18,
                    borderRadius: 2,
                    background: '#059669',
                  }}
                />
              )}
            </button>
          )
        }

        // Multi-tool group: show as pocket
        return (
          <div key={group.id} style={{ position: 'relative' }}>
            {/* Pocket button — shows the active tool's icon, or first tool */}
            <button
              onClick={() => setOpenGroup(isOpen ? null : group.id)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: 'none',
                background: isActiveInGroup
                  ? isDark ? 'rgba(5,150,105,0.2)' : 'rgba(5,150,105,0.1)'
                  : isOpen
                    ? isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
                    : 'transparent',
                color: isActiveInGroup
                  ? '#059669'
                  : isDark ? '#9ca3af' : '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.12s ease',
                position: 'relative',
                flexShrink: 0,
                gap: 0,
              }}
              onMouseEnter={(e) => {
                if (!isActiveInGroup && !isOpen) {
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
                  e.currentTarget.style.color = isDark ? '#e5e7eb' : '#374151'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActiveInGroup && !isOpen) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = isDark ? '#9ca3af' : '#6b7280'
                }
              }}
            >
              {activeTool ? activeTool.icon : group.tools[0].icon}
              {/* Active indicator bar */}
              {isActiveInGroup && (
                <div
                  style={{
                    position: 'absolute',
                    left: -2,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 18,
                    borderRadius: 2,
                    background: '#059669',
                  }}
                />
              )}
            </button>

            {/* Fly-out sub-menu */}
            {isOpen && (
              <>
                {/* Invisible backdrop to catch outside clicks */}
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 10000,
                  }}
                  onClick={() => setOpenGroup(null)}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '100%',
                    top: -4,
                    marginLeft: 6,
                    background: isDark ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: 10,
                    padding: 4,
                    zIndex: 10001,
                    boxShadow: isDark
                      ? '0 8px 32px rgba(0,0,0,0.4)'
                      : '0 8px 32px rgba(0,0,0,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    minWidth: 160,
                  }}
                >
                  {/* Group label */}
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: isDark ? '#6b7280' : '#9ca3af',
                      padding: '6px 10px 4px',
                    }}
                  >
                    {group.id === 'nav' ? 'Navigate' : group.id === 'draw' ? 'Draw' : group.id === 'shapes' ? 'Shapes' : 'Content'}
                  </div>
                  {group.tools.map((t) => {
                    const active = tool === t.id
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleToolClick(group.id, t.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: 'none',
                          background: active
                            ? isDark ? 'rgba(5,150,105,0.15)' : 'rgba(5,150,105,0.08)'
                            : 'transparent',
                          color: active
                            ? '#059669'
                            : isDark ? '#d1d5db' : '#374151',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: active ? 600 : 400,
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = 'transparent'
                          }
                        }}
                      >
                        <span style={{ display: 'flex', width: 20, justifyContent: 'center' }}>{t.icon}</span>
                        <span style={{ flex: 1, textAlign: 'left' }}>{t.label}</span>
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: 'monospace',
                            color: isDark ? '#4b5563' : '#9ca3af',
                            fontWeight: 400,
                          }}
                        >
                          {t.shortcut}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )
      })}

      {/* Bottom spacer */}
      <div style={{ flex: 1 }} />
    </div>
  )
}
