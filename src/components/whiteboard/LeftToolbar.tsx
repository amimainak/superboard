// ============================================================
// Superboard — Left Toolbar (Streamlined)
// Essential tools directly accessible, rest in Tool Library
// ============================================================

'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  MousePointer2,
  Hand,
  Pencil,
  Highlighter,
  Eraser,
  Trash2,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Type,
  StickyNote,
  ImagePlus,
  FileText,
  Frame,
  Diamond,
  Triangle,
  Zap,
  ChevronDown,
  LayoutGrid,
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
  category: string
}

// Essential shapes — stay in toolbar pocket
const ESSENTIAL_SHAPES: ToolDef[] = [
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: <Square size={16} />, category: 'Shapes' },
  { id: 'ellipse', label: 'Ellipse', shortcut: 'O', icon: <Circle size={16} />, category: 'Shapes' },
  { id: 'line', label: 'Line', shortcut: 'L', icon: <Minus size={16} />, category: 'Shapes' },
  { id: 'arrow', label: 'Arrow', shortcut: 'A', icon: <ArrowRight size={16} />, category: 'Shapes' },
]

// Library tools — organized by category
const LIBRARY_TOOLS: ToolDef[] = [
  // Extra shapes
  { id: 'diamond', label: 'Diamond', shortcut: '⇧R', icon: <Diamond size={16} />, category: 'Shapes' },
  { id: 'triangle', label: 'Triangle', shortcut: '⇧T', icon: <Triangle size={16} />, category: 'Shapes' },
  { id: 'frame', label: 'Frame', shortcut: 'F', icon: <Frame size={16} />, category: 'Shapes' },
  // Specialized tools
  { id: 'laser', label: 'Laser Pointer', shortcut: 'K', icon: <Zap size={16} />, category: 'Tools' },
  { id: 'eraser-object', label: 'Object Eraser', shortcut: '⇧E', icon: <Trash2 size={16} />, category: 'Tools' },
  // Insert
  { id: 'sticky', label: 'Sticky Note', shortcut: 'N', icon: <StickyNote size={16} />, category: 'Insert' },
  { id: 'image', label: 'Image', shortcut: 'U', icon: <ImagePlus size={16} />, category: 'Insert' },
  { id: 'pdf', label: 'PDF Background', shortcut: '', icon: <FileText size={16} />, category: 'Insert' },
]

const LIBRARY_CATEGORIES = ['Shapes', 'Tools', 'Insert'] as const

// ---- Flyout menu component (reused for shapes pocket) ----

function Flyout({
  children,
  isDark,
  onClose,
  anchorRef,
}: {
  children: React.ReactNode
  isDark: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLButtonElement | null>
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const anchor = anchorRef.current
    const panel = panelRef.current
    if (!anchor || !panel) return

    const anchorRect = anchor.getBoundingClientRect()
    const panelWidth = panel.offsetWidth
    const panelHeight = panel.offsetHeight

    let left = anchorRect.right + 8
    if (left + panelWidth > window.innerWidth - 8) {
      left = anchorRect.left - panelWidth - 8
    }
    let top = anchorRect.top - 6
    if (top + panelHeight > window.innerHeight - 8) {
      top = window.innerHeight - panelHeight - 8
    }
    if (top < 8) top = 8

    setPos({ top, left })
    requestAnimationFrame(() => setReady(true))
  }, [anchorRef])

  const isVisible = pos !== null && ready

  return (
    <>
      {isVisible && (
        <div
          className="wb-flyout-backdrop"
          onMouseDown={(e) => {
            e.stopPropagation()
            onClose()
          }}
          aria-hidden="true"
        />
      )}
      <div
        ref={panelRef}
        className={`wb-flyout-panel wb-flyout-panel-${isDark ? 'dark' : 'light'}`}
        role="menu"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: pos ? pos.top : 0,
          left: pos ? pos.left : 0,
          zIndex: 10001,
          visibility: isVisible ? 'visible' : 'hidden',
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
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
      onPointerDown={(e) => e.stopPropagation()}
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
      {tool.shortcut && (
        <span className={`wb-flyout-item-shortcut wb-flyout-item-shortcut-${isDark ? 'dark' : 'light'}`}>
          {tool.shortcut}
        </span>
      )}
    </button>
  )
}

// ---- Separator ----

function Sep({ isDark }: { isDark: boolean }) {
  return <div className={`wb-sep-h wb-sep-h-${isDark ? 'dark' : 'light'}`} aria-hidden="true" />
}

// ---- Tool Library Panel ----

function ToolLibrary({
  isDark,
  onClose,
  isOpen,
}: {
  isDark: boolean
  onClose: () => void
  isOpen: boolean
}) {
  const tool = useWhiteboardStore((s) => s.tool)
  const setTool = useWhiteboardStore((s) => s.setTool)
  const panelRef = useRef<HTMLDivElement>(null)

  const handleSelect = useCallback(
    (toolId: ToolId) => {
      setTool(toolId)
      onClose()
    },
    [setTool, onClose]
  )

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return (
    <>
      {isOpen && (
        <div
          className="wb-lib-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        ref={panelRef}
        className={`wb-lib-panel wb-lib-panel-${isDark ? 'dark' : 'light'} ${isOpen ? 'wb-lib-panel-open' : ''}`}
        role="dialog"
        aria-label="Tool Library"
      >
        {/* Header */}
        <div className="wb-lib-header">
          <div className={`wb-lib-title wb-lib-title-${isDark ? 'dark' : 'light'}`}>
            <LayoutGrid size={14} style={{ marginRight: 6, opacity: 0.7 }} />
            Tool Library
          </div>
          <button
            className={`wb-lib-close wb-lib-close-${isDark ? 'dark' : 'light'}`}
            onClick={onClose}
            aria-label="Close library"
          >
            <ChevronDown size={14} style={{ transform: 'rotate(90deg)' }} />
          </button>
        </div>

        {/* Tool grid by category */}
        <div className="wb-lib-body">
          {LIBRARY_CATEGORIES.map((cat) => {
            const items = LIBRARY_TOOLS.filter((t) => t.category === cat)
            return (
              <div key={cat}>
                <div className={`wb-lib-category wb-lib-category-${isDark ? 'dark' : 'light'}`}>
                  {cat}
                </div>
                <div className="wb-lib-grid">
                  {items.map((t) => {
                    const isActive = tool === t.id
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelect(t.id)}
                        title={`${t.label}${t.shortcut ? ' (' + t.shortcut + ')' : ''}`}
                        aria-label={t.label}
                        className={[
                          'wb-lib-item',
                          `wb-lib-item-${isDark ? 'dark' : 'light'}`,
                          isActive ? `wb-lib-item-active wb-lib-item-active-${isDark ? 'dark' : 'light'}` : '',
                        ].join(' ')}
                      >
                        <span className="wb-lib-item-icon">{t.icon}</span>
                        <span className={`wb-lib-item-label wb-lib-item-label-${isDark ? 'dark' : 'light'}`}>
                          {t.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer hint */}
        <div className={`wb-lib-footer wb-lib-footer-${isDark ? 'dark' : 'light'}`}>
          Press a shortcut key to select any tool directly
        </div>
      </div>
    </>
  )
}

// ---- Main Toolbar ----

export function LeftToolbar() {
  const tool = useWhiteboardStore((s) => s.tool)
  const setTool = useWhiteboardStore((s) => s.setTool)
  const isDark = useWhiteboardStore((s) => s.isDark)
  const [openFlyout, setOpenFlyout] = useState<'shapes' | null>(null)
  const [showLibrary, setShowLibrary] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const shapesBtnRef = useRef<HTMLButtonElement>(null)

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

  const isShapeActive = ESSENTIAL_SHAPES.some((s) => s.id === tool)
  const activeShape = ESSENTIAL_SHAPES.find((s) => s.id === tool)
  const isLibraryToolActive = LIBRARY_TOOLS.some((t) => t.id === tool)

  // Core direct tools — only the essentials
  const directTools: ToolDef[] = [
    { id: 'select', label: 'Select', shortcut: 'V', icon: <MousePointer2 size={18} />, category: '' },
    { id: 'hand', label: 'Hand', shortcut: 'H', icon: <Hand size={18} />, category: '' },
    { id: 'draw', label: 'Pen', shortcut: 'D', icon: <Pencil size={18} />, category: '' },
    { id: 'highlighter', label: 'Highlighter', shortcut: '⇧D', icon: <Highlighter size={18} />, category: '' },
    { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: <Eraser size={18} />, category: '' },
    { id: 'text', label: 'Text', shortcut: 'T', icon: <Type size={18} />, category: '' },
  ]

  return (
    <>
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
              onPointerDown={(e) => e.stopPropagation()}
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
              {isActive && (
                <div className="wb-tool-indicator" aria-hidden="true" />
              )}
            </button>
          )
        })}

        {/* ---- Separator ---- */}
        <Sep isDark={isDark} />

        {/* ---- Shapes Pocket (essential shapes only) ---- */}
        <div style={{ position: 'relative' }}>
          <button
            ref={shapesBtnRef}
            onClick={() => setOpenFlyout((prev) => (prev === 'shapes' ? null : 'shapes'))}
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
            <span style={{ lineHeight: 1, display: 'flex' }}>
              {activeShape ? activeShape.icon : <Square size={16} />}
            </span>
            <ChevronDown
              size={8}
              style={{ marginTop: -1, opacity: 0.5 }}
              aria-hidden="true"
            />
            {isShapeActive && (
              <div className="wb-tool-indicator" aria-hidden="true" />
            )}
          </button>

          {openFlyout === 'shapes' && (
            <Flyout isDark={isDark} onClose={() => setOpenFlyout(null)} anchorRef={shapesBtnRef}>
              <div className={`wb-flyout-header wb-flyout-header-${isDark ? 'dark' : 'light'}`}>
                Shapes
              </div>
              {ESSENTIAL_SHAPES.map((t) => (
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

        {/* ---- Separator ---- */}
        <Sep isDark={isDark} />

        {/* ---- Library Button ---- */}
        <button
          onClick={() => setShowLibrary(true)}
          title="Tool Library"
          aria-label="Open tool library"
          className={[
            'wb-tool-btn',
            `wb-tool-btn-${isDark ? 'dark' : 'light'}`,
            isLibraryToolActive ? `wb-tool-btn-active wb-tool-btn-active-${isDark ? 'dark' : 'light'}` : '',
          ].join(' ')}
          style={{
            background: isLibraryToolActive
              ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
              : undefined,
          }}
        >
          <LayoutGrid size={16} />
          {isLibraryToolActive && (
            <div className="wb-tool-indicator" aria-hidden="true" />
          )}
        </button>

        {/* Bottom spacer */}
        <div style={{ flex: 1 }} />
      </nav>

      {/* ---- Tool Library Panel ---- */}
      <ToolLibrary
        isDark={isDark}
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
      />
    </>
  )
}
