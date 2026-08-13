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
import './whiteboard.css'

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
        className="wb-flyout-backdrop"
        onMouseDown={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-hidden="true"
      />
      <div
        className={`wb-flyout-panel wb-flyout-panel-${isDark ? 'dark' : 'light'} wb-flyout-right`}
        role="menu"
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
      role="menuitem"
      aria-label={`${tool.label} (${tool.shortcut})`}
      aria-pressed={isActive}
      className={[
        'wb-flyout-item',
        `wb-flyout-item-${isDark ? 'dark' : 'light'}`,
        isActive ? `wb-flyout-item-active wb-flyout-item-active-${isDark ? 'dark' : 'light'}` : '',
      ].join(' ')}
    >
      <span className="wb-flyout-item-icon">
        {tool.icon}
      </span>
      <span style={{ flex: 1 }}>{tool.label}</span>
      <span className={`wb-flyout-item-shortcut wb-flyout-item-shortcut-${isDark ? 'dark' : 'light'}`}>
        {tool.shortcut}
      </span>
    </button>
  )
}

// ---- Separator ----

function Sep({ isDark }: { isDark: boolean }) {
  return <div className={`wb-sep-h wb-sep-h-${isDark ? 'dark' : 'light'}`} aria-hidden="true" />
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
    <nav
      ref={toolbarRef}
      className={`wb-toolbar wb-toolbar-${isDark ? 'dark' : 'light'}`}
      role="toolbar"
      aria-label="Drawing tools"
    >
      {/* ---- Core tools (always visible) ---- */}
      {directTools.map((t) => {
        const isActive = tool === t.id
        return (
          <button
            key={t.id}
            onClick={() => handleSelect(t.id)}
            title={`${t.label} (${t.shortcut})`}
            aria-label={`${t.label} (${t.shortcut})`}
            aria-pressed={isActive}
            className={[
              'wb-tool-btn',
              `wb-tool-btn-${isDark ? 'dark' : 'light'}`,
              isActive ? `wb-tool-btn-active wb-tool-btn-active-${isDark ? 'dark' : 'light'}` : '',
            ].join(' ')}
          >
            {t.icon}
            {/* Active indicator — subtle left bar */}
            {isActive && (
              <div className="wb-tool-indicator" aria-hidden="true" />
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
          title="Shapes"
          aria-label="Shapes tools"
          aria-expanded={openFlyout === 'shapes'}
          aria-haspopup="menu"
          className={[
            'wb-tool-btn',
            `wb-tool-btn-${isDark ? 'dark' : 'light'}`,
            isShapeActive ? `wb-tool-btn-active wb-tool-btn-active-${isDark ? 'dark' : 'light'}` : '',
          ].join(' ')}
          style={{
            flexDirection: 'column',
            gap: 0,
            background: isShapeActive
              ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
              : openFlyout === 'shapes'
                ? isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                : undefined,
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
            aria-hidden="true"
          />
          {/* Active indicator */}
          {isShapeActive && (
            <div className="wb-tool-indicator" aria-hidden="true" />
          )}
        </button>

        {/* Shapes flyout */}
        {openFlyout === 'shapes' && (
          <Flyout isDark={isDark} onClose={() => setOpenFlyout(null)}>
            <div className={`wb-flyout-header wb-flyout-header-${isDark ? 'dark' : 'light'}`}>
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
          title="More tools"
          aria-label="More tools"
          aria-expanded={openFlyout === 'more'}
          aria-haspopup="menu"
          className={[
            'wb-tool-btn',
            `wb-tool-btn-${isDark ? 'dark' : 'light'}`,
            isMoreActive ? `wb-tool-btn-active wb-tool-btn-active-${isDark ? 'dark' : 'light'}` : '',
          ].join(' ')}
          style={{
            flexDirection: 'column',
            gap: 0,
            background: isMoreActive
              ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
              : openFlyout === 'more'
                ? isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                : undefined,
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
            aria-hidden="true"
          />
          {isMoreActive && (
            <div className="wb-tool-indicator" aria-hidden="true" />
          )}
        </button>

        {/* More tools flyout */}
        {openFlyout === 'more' && (
          <Flyout isDark={isDark} onClose={() => setOpenFlyout(null)}>
            <div className={`wb-flyout-header wb-flyout-header-${isDark ? 'dark' : 'light'}`}>
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
    </nav>
  )
}
