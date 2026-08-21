'use client'

import React, { useState } from 'react'
import {
  MousePointer2, Hand, Pencil, Highlighter,
  Eraser, Type, Square, MoreHorizontal, Palette,
} from 'lucide-react'

interface MobileBottomToolbarProps {
  isDark: boolean
  currentTool: string
  onToolChange: (tool: string) => void
}

export function MobileBottomToolbar({ isDark, currentTool, onToolChange }: MobileBottomToolbarProps) {
  const [showMore, setShowMore] = useState(false)

  const coreTools = [
    { id: 'select' as const, icon: <MousePointer2 size={18} />, label: 'Select' },
    { id: 'hand' as const, icon: <Hand size={18} />, label: 'Hand' },
    { id: 'draw' as const, icon: <Pencil size={18} />, label: 'Pen' },
    { id: 'highlighter' as const, icon: <Highlighter size={18} />, label: 'Highlight' },
    { id: 'text' as const, icon: <Type size={18} />, label: 'Text' },
  ]

  const moreTools = [
    { id: 'rectangle' as const, icon: <Square size={18} />, label: 'Shapes' },
    { id: 'image' as const, icon: <MoreHorizontal size={18} />, label: 'Image' },
    { id: 'style' as const, icon: <Palette size={18} />, label: 'Style' },
  ]

  const tools = showMore ? moreTools : coreTools
  const toolbarClass = isDark ? 'wb-mobile-toolbar' : 'wb-mobile-toolbar wb-mobile-toolbar-light'

  const handleToolClick = (toolId: string, isMoreTab: boolean) => {
    if (toolId === 'style' && isMoreTab) {
      const sp = document.querySelector('.wb-style-panel') as HTMLElement
      if (sp) {
        const cur = sp.style.display
        sp.style.display = cur === 'flex' ? 'none' : 'flex'
      }
      return
    }
    onToolChange(toolId)
    setShowMore(false)
  }

  return (
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

      <button
        onClick={() => setShowMore((p) => !p)}
        className={
          showMore
            ? 'wb-mobile-tool-btn wb-mobile-tool-btn-active'
            : 'wb-mobile-tool-btn'
        }
      >
        {showMore ? <Pencil size={18} /> : <MoreHorizontal size={18} />}
        <span className="wb-mobile-tool-btn-label">{showMore ? 'Draw' : 'More'}</span>
      </button>
    </div>
  )
}
