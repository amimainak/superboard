'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  MousePointer2, Hand, Pencil, Highlighter,
  Eraser, Type, Square, MoreHorizontal, Palette,
} from 'lucide-react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface MobileBottomToolbarProps {
  isDark: boolean
  currentTool: string
  onToolChange: (tool: string) => void
}

export function MobileBottomToolbar({ isDark, currentTool, onToolChange }: MobileBottomToolbarProps) {
  const [showMore, setShowMore] = useState(false)
  const [showStyle, setShowStyle] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const strokeColor = useWhiteboardStore((s) => s.strokeColor)
  const strokeWidth = useWhiteboardStore((s) => s.strokeWidth)
  const setStrokeColor = useWhiteboardStore((s) => s.setStrokeColor)
  const setStrokeWidth = useWhiteboardStore((s) => s.setStrokeWidth)

  const coreTools = [
    { id: 'select' as const, icon: <MousePointer2 size={20} />, label: 'Select' },
    { id: 'hand' as const, icon: <Hand size={20} />, label: 'Pan' },
    { id: 'draw' as const, icon: <Pencil size={20} />, label: 'Pen' },
    { id: 'highlighter' as const, icon: <Highlighter size={20} />, label: 'Highlight' },
    { id: 'eraser' as const, icon: <Eraser size={20} />, label: 'Eraser' },
  ]

  const moreTools = [
    { id: 'rectangle' as const, icon: <Square size={20} />, label: 'Shapes' },
    { id: 'text' as const, icon: <Type size={20} />, label: 'Text' },
    { id: 'image' as const, icon: <MoreHorizontal size={20} />, label: 'Image' },
  ]

  const tools = showMore ? moreTools : coreTools
  const toolbarClass = isDark ? 'wb-mobile-toolbar' : 'wb-mobile-toolbar wb-mobile-toolbar-light'

  const handleToolClick = (toolId: string, isMoreTab: boolean) => {
    if (toolId === 'style' && isMoreTab) {
      setShowStyle((p) => !p)
      return
    }
    onToolChange(toolId)
    setShowMore(false)
    setShowStyle(false)
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

  const quickColors = ['#000000', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ffffff']

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
              onClick={() => handleToolClick(t.id, showMore)}
              className={btnClass}
            >
              {t.icon}
              <span className="wb-mobile-tool-btn-label">{t.label}</span>
            </button>
          )
        })}

        {/* Style toggle button (always visible) */}
        <button
          onClick={() => { setShowStyle((p) => !p); setShowMore(false) }}
          className={showStyle
            ? 'wb-mobile-tool-btn wb-mobile-tool-btn-active'
            : 'wb-mobile-tool-btn'
        }
        >
          <Palette size={20} />
          <span className="wb-mobile-tool-btn-label">Style</span>
        </button>

        {/* More toggle */}
        {!showStyle && (
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
    </>
  )
}
