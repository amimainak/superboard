// ============================================================
// Superboard — Page Tabs
// Multi-page navigation tabs at bottom of canvas
// ============================================================

'use client'

import React from 'react'
import { Plus, X } from 'lucide-react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

export function PageTabs() {
  const {
    pages,
    currentPageIndex,
    isDark,
    switchPage,
    addPage,
    deletePage,
    renamePage,
  } = useWhiteboardStore()

  if (pages.length <= 1) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 48,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '4px',
        borderRadius: 10,
        background: isDark ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.9)',
        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        backdropFilter: 'blur(8px)',
        zIndex: 50,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      {pages.map((page, i) => (
        <button
          key={page.id}
          onClick={() => switchPage(i)}
          onDoubleClick={() => {
            const name = prompt('Page name:', page.name)
            if (name) renamePage(i, name)
          }}
          style={{
            padding: '4px 14px',
            borderRadius: 6,
            border: 'none',
            background:
              i === currentPageIndex
                ? isDark
                  ? 'rgba(5,150,105,0.15)'
                  : 'rgba(5,150,105,0.08)'
                : 'transparent',
            color:
              i === currentPageIndex
                ? '#059669'
                : isDark
                  ? '#9ca3af'
                  : '#6b7280',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: i === currentPageIndex ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s',
          }}
        >
          <span>{page.name}</span>
          {pages.length > 1 && i === currentPageIndex && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                deletePage(i)
              }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <X size={12} />
            </span>
          )}
        </button>
      ))}
      <button
        onClick={addPage}
        title="Add page"
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          border: 'none',
          background: 'transparent',
          color: isDark ? '#6b7280' : '#9ca3af',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
