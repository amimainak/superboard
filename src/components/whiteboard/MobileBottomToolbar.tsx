'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  MousePointer2, Hand, Pencil, Highlighter,
  Eraser, Type, Square, Circle, MoreHorizontal, Palette,
  Diamond, Triangle, Minus, ArrowRight, Frame,
  StickyNote, ImagePlus, FileText, Trash2, Zap,
  LayoutGrid, X,
} from 'lucide-react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import type { ToolId } from '@/lib/whiteboard/types'

interface MobileBottomToolbarProps {
  isDark: boolean
  currentTool: string
  onToolChange: (tool: string) => void
}

// Library tools for mobile — same set as desktop
const LIBRARY_SECTIONS = [
  {
    title: 'Shapes',
    tools: [
      { id: 'diamond' as ToolId, icon: <Diamond size={18} />, label: 'Diamond' },
      { id: 'triangle' as ToolId, icon: <Triangle size={18} />, label: 'Triangle' },
      { id: 'line' as ToolId, icon: <Minus size={18} />, label: 'Line' },
      { id: 'arrow' as ToolId, icon: <ArrowRight size={18} />, label: 'Arrow' },
      { id: 'frame' as ToolId, icon: <Frame size={18} />, label: 'Frame' },
    ],
  },
  {
    title: 'Tools',
    tools: [
      { id: 'laser' as ToolId, icon: <Zap size={18} />, label: 'Laser' },
      { id: 'eraser-object' as ToolId, icon: <Trash2 size={18} />, label: 'Obj Eraser' },
    ],
  },
  {
    title: 'Insert',
    tools: [
      { id: 'sticky' as ToolId, icon: <StickyNote size={18} />, label: 'Sticky' },
      { id: 'image' as ToolId, icon: <ImagePlus size={18} />, label: 'Image' },
      { id: 'pdf' as ToolId, icon: <FileText size={18} />, label: 'PDF' },
    ],
  },
]

export function MobileBottomToolbar({ isDark, currentTool, onToolChange }: MobileBottomToolbarProps) {
  const [showMore, setShowMore] = useState(false)
  const [showStyle, setShowStyle] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const libraryRef = useRef<HTMLDivElement>(null)
  const strokeColor = useWhiteboardStore((s) => s.style.strokeColor)
  const strokeWidth = useWhiteboardStore((s) => s.style.strokeWidth)
  const setStyle = useWhiteboardStore((s) => s.setStyle)
  const setStrokeColor = useCallback((color: string) => setStyle({ strokeColor: color }), [setStyle])
  const setStrokeWidth = useCallback((width: number) => setStyle({ strokeWidth: width }), [setStyle])

  // Core tools — only the essentials
  const coreTools = [
    { id: 'select' as const, icon: <MousePointer2 size={20} />, label: 'Select' },
    { id: 'hand' as const, icon: <Hand size={20} />, label: 'Pan' },
    { id: 'draw' as const, icon: <Pencil size={20} />, label: 'Pen' },
    { id: 'highlighter' as const, icon: <Highlighter size={20} />, label: 'Highlight' },
    { id: 'eraser' as const, icon: <Eraser size={20} />, label: 'Eraser' },
  ]

  // More tab — shapes + text (commonly needed but not primary)
  const moreTools = [
    { id: 'rectangle' as const, icon: <Square size={20} />, label: 'Rect' },
    { id: 'ellipse' as const, icon: <Circle size={20} />, label: 'Circle' },
    { id: 'text' as const, icon: <Type size={20} />, label: 'Text' },
  ]

  const tools = showMore ? moreTools : coreTools
  const toolbarClass = isDark ? 'wb-mobile-toolbar' : 'wb-mobile-toolbar wb-mobile-toolbar-light'

  const handleToolClick = (toolId: string) => {
    onToolChange(toolId)
    setShowMore(false)
    setShowStyle(false)
    setShowLibrary(false)
  }

  const handleLibraryToolClick = (toolId: ToolId) => {
    onToolChange(toolId)
    setShowLibrary(false)
  }

  // Close style popover on outside tap
  useEffect(() => {
    if (!showStyle) return
    const handler = (e: TouchEvent | MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowStyle(false)
      }
    }
    document.addEventListener('touchstart', handler, { passive: true })
    document.addEventListener('mousedown', handler)
    return () => {
      document.removeEventListener('touchstart', handler)
      document.removeEventListener('mousedown', handler)
    }
  }, [showStyle])

  // Close library on Escape
  useEffect(() => {
    if (!showLibrary) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLibrary(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showLibrary])

  const quickColors = ['#000000', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ffffff']

  const isLibraryToolActive = LIBRARY_SECTIONS.some((sec) =>
    sec.tools.some((t) => t.id === currentTool)
  )

  return (
    <>
      <div className={toolbarClass}>
        {tools.map((t) => {
          const isActive = currentTool === t.id
          const btnClass = isActive
            ? 'wb-mobile-tool-btn wb-mobile-tool-btn-active'
            : 'wb-mobile-tool-btn'
          return (
            <button
              key={t.id}
              onClick={() => handleToolClick(t.id)}
              className={btnClass}
            >
              {t.icon}
              <span className="wb-mobile-tool-btn-label">{t.label}</span>
            </button>
          )
        })}

        {/* Style toggle button (always visible) */}
        <button
          onClick={() => { setShowStyle((p) => !p); setShowMore(false); setShowLibrary(false) }}
          className={showStyle
            ? 'wb-mobile-tool-btn wb-mobile-tool-btn-active'
            : 'wb-mobile-tool-btn'
          }
        >
          <Palette size={20} />
          <span className="wb-mobile-tool-btn-label">Style</span>
        </button>

        {/* Library toggle */}
        <button
          onClick={() => { setShowLibrary((p) => !p); setShowMore(false); setShowStyle(false) }}
          className={showLibrary || isLibraryToolActive
            ? 'wb-mobile-tool-btn wb-mobile-tool-btn-active'
            : 'wb-mobile-tool-btn'
          }
        >
          <LayoutGrid size={20} />
          <span className="wb-mobile-tool-btn-label">Library</span>
        </button>

        {/* More toggle (draw shapes/text) */}
        {!showStyle && !showLibrary && (
          <button
            onClick={() => { setShowMore((p) => !p); setShowStyle(false) }}
            className={showMore
              ? 'wb-mobile-tool-btn wb-mobile-tool-btn-active'
              : 'wb-mobile-tool-btn'
            }
          >
            {showMore ? <Pencil size={20} /> : <MoreHorizontal size={20} />}
            <span className="wb-mobile-tool-btn-label">{showMore ? 'Draw' : 'More'}</span>
          </button>
        )}
      </div>

      {/* Style popover */}
      {showStyle && (
        <div
          ref={popoverRef}
          className={isDark ? 'wb-mobile-style-popover' : 'wb-mobile-style-popover wb-mobile-style-popover-light'}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {quickColors.map((c) => (
              <button
                key={c}
                onClick={() => setStrokeColor(c)}
                style={{
                  width: 28, height: 28, borderRadius: 8, border: strokeColor === c ? '2px solid #34d399' : '2px solid transparent',
                  background: c, cursor: 'pointer', flexShrink: 0,
                  boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.15)' : undefined,
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap' }}>Size</span>
            <input
              type="range"
              min={1}
              max={20}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              style={{ flex: 1, height: 4, accentColor: '#34d399' }}
            />
            <span style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', minWidth: 20, textAlign: 'right' }}>{strokeWidth}</span>
          </div>
        </div>
      )}

      {/* Library bottom sheet */}
      {showLibrary && (
        <>
          <div
            className="wb-lib-backdrop"
            onClick={() => setShowLibrary(false)}
            aria-hidden="true"
          />
          <div
            ref={libraryRef}
            className={`wb-lib-mobile-sheet wb-lib-mobile-sheet-${isDark ? 'dark' : 'light'}`}
          >
            {/* Drag handle */}
            <div className="wb-lib-mobile-handle" aria-hidden="true" />

            {/* Header */}
            <div className="wb-lib-mobile-header">
              <span className={`wb-lib-mobile-title wb-lib-mobile-title-${isDark ? 'dark' : 'light'}`}>
                Tool Library
              </span>
              <button
                className={`wb-lib-mobile-close wb-lib-mobile-close-${isDark ? 'dark' : 'light'}`}
                onClick={() => setShowLibrary(false)}
                aria-label="Close library"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tool grid */}
            <div className="wb-lib-mobile-body">
              {LIBRARY_SECTIONS.map((sec) => (
                <div key={sec.title}>
                  <div className={`wb-lib-category wb-lib-category-${isDark ? 'dark' : 'light'}`}>
                    {sec.title}
                  </div>
                  <div className="wb-lib-mobile-grid">
                    {sec.tools.map((t) => {
                      const isActive = currentTool === t.id
                      return (
                        <button
                          key={t.id}
                          onClick={() => handleLibraryToolClick(t.id)}
                          className={[
                            'wb-lib-mobile-item',
                            `wb-lib-mobile-item-${isDark ? 'dark' : 'light'}`,
                            isActive ? 'wb-lib-mobile-item-active' : '',
                          ].join(' ')}
                        >
                          {t.icon}
                          <span className="wb-lib-mobile-item-label">{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}