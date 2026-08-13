// ============================================================
// Superboard — Left Toolbar (Ultra-Minimalist)
// Direct buttons for core tools + one "Shapes" pocket + one "More" pocket
// ============================================================

'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
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
  ChevronDown,
} from 'lucide-react'
import type { ToolId } from '@/lib/whiteboard/types'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

// ---- Tool definitions ----

interface ToolDef {
  id: ToolId
  label: string
  shortcut: string
  icon: React.ReactNode
}

const SHAPES: ToolDef[] = [
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: <Square size={16} /> },
  { id: 'ellipse', label: 'Ellipse', shortcut: 'O', icon: <Circle size={16} /> },
  { id: 'diamond', label: 'Diamond', shortcut: '⇧R', icon: <Diamond size={16} /> },
  { id: 'triangle', label: 'Triangle', shortcut: '⇧T', icon: <Triangle size={16} /> },
  { id: 'line', label: 'Line', shortcut: 'L', icon: <Minus size={16} /> },
  { id: 'arrow', label: 'Arrow', shortcut: 'A', icon: <ArrowRight size={16} /> },
  { id: 'frame', label: 'Frame', shortcut: 'F', icon: <Frame size={16} /> },
]

const MORE_TOOLS: ToolDef[] = [
  { id: 'sticky', label: 'Sticky Note', shortcut: 'N', icon: <StickyNote size={16} /> },
  { id: 'image', label: 'Image', shortcut: 'U', icon: <ImagePlus size={16} /> },
]

// ---- Flyout menu component ----

function Flyout({
  children,
  isDark,
  onClose,
}: {
  children: React.ReactNode
  isDark: boolean
  onClose: () => void
}) {
  return (
    <>
      {/* Click-away backdrop */}
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
        style={{
          position: 'absolute',
          left: 'calc(100% + 8px)',
          top: -6,
          background: isDark ? '#1e293b' : '#ffffff',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          borderRadius: 12,
          padding: '6px 4px',
          zIndex: 10001,
          boxShadow: isDark
            ? '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 12px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)',
          minWidth: 180,
          opacity: 1,
          transform: 'scale(1)',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  )
}

function FlyoutItem({
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
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '7px 12px',
        borderRadius: 8,
        border: 'none',
        background: isActive
          ? isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)'
          : 'transparent',
        color: isActive
          ? '#10b981'
          : isDark ? '#cbd5e1' : '#334155',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: isActive ? 600 : 400,
        transition: 'background 0.1s',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      <span style={{ display: 'flex', width: 20, justifyContent: 'center', opacity: isActive ? 1 : 0.6 }}>
        {tool.icon}
      </span>
      <span style={{ flex: 1 }}>{tool.label}</span>
      <span
        style={{
          fontSize: 10,
          fontFamily: 'ui-monospace, monospace',
          color: isDark ? '#475569' : '#94a3b8',
          fontWeight: 400,
        }}
      >
        {tool.shortcut}
      </span>
    </button>
  )
}

// ---- Separator ----

function Sep({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        width: 22,
        height: 1,
        margin: '4px auto',
        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        borderRadius: 1,
      }}
    />
  )
}

// ---- Main Toolbar ----

export function LeftToolbar() {
  const tool = useWhiteboardStore((s) => s.tool)
  const setTool = useWhiteboardStore((s) => s.setTool)
  const isDark = useWhiteboardStore((s) => s.isDark)
  const [openFlyout, setOpenFlyout] = useState<'shapes' | 'more' | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Close flyout on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenFlyout(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = useCallback(
    (toolId: ToolId) => {
      setTool(toolId)
      setOpenFlyout(null)
    },
    [setTool]
  )

  const toggleFlyout = useCallback((id: 'shapes' | 'more') => {
    setOpenFlyout((prev) => (prev === id ? null : id))
  }, [])

  // Find the currently active shape icon for the shapes pocket button
  const activeShape = SHAPES.find((s) => s.id === tool)
  const isShapeActive = !!activeShape
  const isMoreActive = MORE_TOOLS.some((t) => t.id === tool)

  // Core direct tools (always visible)
  const directTools: ToolDef[] = [
    { id: 'select', label: 'Select', shortcut: 'V', icon: <MousePointer2 size={18} /> },
    { id: 'hand', label: 'Hand', shortcut: 'H', icon: <Hand size={18} /> },
    { id: 'draw', label: 'Pen', shortcut: 'D', icon: <Pencil size={18} /> },
    { id: 'highlighter', label: 'Highlighter', shortcut: '⇧D', icon: <Highlighter size={18} /> },
    { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: <Eraser size={18} /> },
    { id: 'laser', label: 'Laser', shortcut: 'K', icon: <Zap size={18} /> },
    { id: 'text', label: 'Text', shortcut: 'T', icon: <Type size={18} /> },
  ]

  return (
    <div
      ref={toolbarRef}
      style={{
        width: 48,
        minWidth: 48,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 6px',
        gap: 2,
        borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        background: isDark ? '#0f172a' : '#ffffff',
        overflowY: 'auto',
        overflowX: 'visible',
        zIndex: 200,
      }}
    >
      {/* ---- Core tools (always visible) ---- */}
      {directTools.map((t) => {
        const isActive = tool === t.id
        return (
          <button
            key={t.id}
            onClick={() => handleSelect(t.id)}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
                e.currentTarget.style.color = isDark ? '#e2e8f0' : '#1e293b'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = isDark ? '#64748b' : '#94a3b8'
              }
            }}
            title={`${t.label} (${t.shortcut})`}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: 'none',
              background: isActive
                ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
                : 'transparent',
              color: isActive
                ? '#10b981'
                : isDark ? '#64748b' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {t.icon}
            {/* Active indicator — subtle left bar */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  left: -1,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 16,
                  borderRadius: 2,
                  background: '#10b981',
                }}
              />
            )}
          </button>
        )
      })}

      {/* ---- Separator ---- */}
      <Sep isDark={isDark} />

      {/* ---- Shapes Pocket ---- */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => toggleFlyout('shapes')}
          onMouseEnter={(e) => {
            if (!isShapeActive && !openFlyout) {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isShapeActive && !openFlyout) {
              e.currentTarget.style.background = isDark
                ? isShapeActive ? 'rgba(16,185,129,0.15)' : 'transparent'
                : isShapeActive ? 'rgba(16,185,129,0.1)' : 'transparent'
            }
          }}
          title="Shapes"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: 'none',
            background: isShapeActive
              ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
              : openFlyout === 'shapes'
                ? isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                : 'transparent',
            color: isShapeActive
              ? '#10b981'
              : isDark ? '#64748b' : '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            position: 'relative',
            flexShrink: 0,
            gap: 0,
          }}
        >
          {/* Show active shape icon, or default shapes icon */}
          <span style={{ lineHeight: 1, display: 'flex' }}>
            {activeShape ? activeShape.icon : <Square size={16} />}
          </span>
          {/* Tiny chevron to indicate expandable */}
          <ChevronDown
            size={8}
            style={{
              marginTop: -1,
              opacity: 0.5,
            }}
          />
          {/* Active indicator */}
          {isShapeActive && (
            <div
              style={{
                position: 'absolute',
                left: -1,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 3,
                height: 16,
                borderRadius: 2,
                background: '#10b981',
              }}
            />
          )}
        </button>

        {/* Shapes flyout */}
        {openFlyout === 'shapes' && (
          <Flyout isDark={isDark} onClose={() => setOpenFlyout(null)}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: isDark ? '#475569' : '#94a3b8',
                padding: '4px 12px 6px',
              }}
            >
              Shapes
            </div>
            {SHAPES.map((t) => (
              <FlyoutItem
                key={t.id}
                tool={t}
                isActive={tool === t.id}
                isDark={isDark}
                onClick={() => handleSelect(t.id)}
              />
            ))}
          </Flyout>
        )}
      </div>

      {/* ---- More Tools Pocket ---- */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => toggleFlyout('more')}
          onMouseEnter={(e) => {
            if (!isMoreActive && !openFlyout) {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isMoreActive && !openFlyout) {
              e.currentTarget.style.background = isDark
                ? isMoreActive ? 'rgba(16,185,129,0.15)' : 'transparent'
                : isMoreActive ? 'rgba(16,185,129,0.1)' : 'transparent'
            }
          }}
          title="More tools"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: 'none',
            background: isMoreActive
              ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
              : openFlyout === 'more'
                ? isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                : 'transparent',
            color: isMoreActive
              ? '#10b981'
              : isDark ? '#64748b' : '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            position: 'relative',
            flexShrink: 0,
            gap: 0,
          }}
        >
          <span style={{ lineHeight: 1, display: 'flex' }}>
            <StickyNote size={16} />
          </span>
          <ChevronDown
            size={8}
            style={{
              marginTop: -1,
              opacity: 0.5,
            }}
          />
          {isMoreActive && (
            <div
              style={{
                position: 'absolute',
                left: -1,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 3,
                height: 16,
                borderRadius: 2,
                background: '#10b981',
              }}
            />
          )}
        </button>

        {/* More tools flyout */}
        {openFlyout === 'more' && (
          <Flyout isDark={isDark} onClose={() => setOpenFlyout(null)}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: isDark ? '#475569' : '#94a3b8',
                padding: '4px 12px 6px',
              }}
            >
              More
            </div>
            {MORE_TOOLS.map((t) => (
              <FlyoutItem
                key={t.id}
                tool={t}
                isActive={tool === t.id}
                isDark={isDark}
                onClick={() => handleSelect(t.id)}
              />
            ))}
          </Flyout>
        )}
      </div>

      {/* Bottom spacer */}
      <div style={{ flex: 1 }} />
    </div>
  )
}
