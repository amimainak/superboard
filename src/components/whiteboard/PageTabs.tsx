// ============================================================
// Superboard — Page Tabs
// Multi-page navigation tabs at bottom of canvas
// ============================================================

'use client'

import React from 'react'
import { Plus, X } from 'lucide-react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import './whiteboard.css'

export function PageTabs() {
  const pages = useWhiteboardStore((s) => s.pages)
  const currentPageIndex = useWhiteboardStore((s) => s.currentPageIndex)
  const isDark = useWhiteboardStore((s) => s.isDark)
  const switchPage = useWhiteboardStore((s) => s.switchPage)
  const addPage = useWhiteboardStore((s) => s.addPage)
  const deletePage = useWhiteboardStore((s) => s.deletePage)
  const renamePage = useWhiteboardStore((s) => s.renamePage)

  // Always show the tab bar so users can always add pages
  const d = isDark ? 'dark' : 'light'

  return (
    <div
      className={`wb-page-tabs wb-page-tabs-${d}`}
      role="tablist"
      aria-label="Whiteboard pages"
    >
      {pages.map((page, i) => (
        <button
          key={page.id}
          onClick={() => switchPage(i)}
          onDoubleClick={() => {
            const name = prompt('Page name:', page.name)
            if (name) renamePage(i, name)
          }}
          role="tab"
          aria-selected={i === currentPageIndex}
          aria-label={`${page.name}${i === currentPageIndex ? ' (active)' : ''}`}
          className={[
            'wb-page-tab',
            `wb-page-tab-${d}`,
            i === currentPageIndex ? `wb-page-tab-active wb-page-tab-active-${d}` : '',
          ].join(' ')}
        >
          <span>{page.name}</span>
          {pages.length > 1 && i === currentPageIndex && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                deletePage(i)
              }}
              style={{ display: 'flex', alignItems: 'center' }}
              role="button"
              aria-label={`Delete page ${page.name}`}
              tabIndex={0}
            >
              <X size={12} />
            </span>
          )}
        </button>
      ))}
      <button
        onClick={addPage}
        title="Add page"
        aria-label="Add new page"
        className={`wb-page-add-btn wb-page-add-btn-${d}`}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
