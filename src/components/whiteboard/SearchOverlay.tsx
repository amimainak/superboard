// ============================================================
// Superboard — Board Search Overlay
// Search across text, sticky notes, frames, and page names.
// Opens via Ctrl/Cmd+K or search icon in TopBar.
// Parent controls visibility by mounting/unmounting via `key`.
// ============================================================

'use client'

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import type { TextElement, StickyElement, FrameElement } from '@/lib/whiteboard/types'

export type SearchFilter = 'all' | 'text' | 'sticky' | 'pages'

interface SearchResult {
  id: string
  type: 'text' | 'sticky' | 'frame' | 'page'
  label: string
  snippet: string
  pageIndex: number
  elementId?: string
  x?: number
  y?: number
}

interface SearchOverlayProps {
  onClose: () => void
}

const FILTER_OPTIONS: { value: SearchFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'text', label: 'Text' },
  { value: 'sticky', label: 'Sticky' },
  { value: 'pages', label: 'Pages' },
]

const TYPE_ICONS: Record<string, string> = {
  text: '📝',
  sticky: '📌',
  frame: '🖼️',
  page: '📄',
}

const TYPE_LABELS: Record<string, string> = {
  text: 'Text element',
  sticky: 'Sticky note',
  frame: 'Frame',
  page: 'Page',
}

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<SearchFilter>('all')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const elements = useWhiteboardStore((s) => s.elements)
  const pages = useWhiteboardStore((s) => s.pages)
  const currentPageIndex = useWhiteboardStore((s) => s.currentPageIndex)
  const setCurrentPageIndex = useWhiteboardStore((s) => s.setCurrentPageIndex)
  const setCamera = useWhiteboardStore((s) => s.setCamera)
  const selectElements = useWhiteboardStore((s) => s.selectElements)
  const updateElement = useWhiteboardStore((s) => s.updateElement)

  // Auto-focus input on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
    return () => cancelAnimationFrame(t)
  }, [])

  // Escape key handler — re-register when onClose changes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [onClose])

  // Search logic
  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase().trim()
    const found: SearchResult[] = []

    if (filter === 'all' || filter === 'text') {
      elements.forEach((el) => {
        if (el.type === 'text') {
          const textEl = el as TextElement
          if (textEl.text && textEl.text.toLowerCase().includes(q)) {
            found.push({
              id: `text-${el.id}`,
              type: 'text',
              label: truncate(textEl.text, 80, q),
              snippet: `Page ${el.pageIndex + 1} · Text element`,
              pageIndex: el.pageIndex,
              elementId: el.id,
              x: el.x,
              y: el.y,
            })
          }
        }
      })
    }

    if (filter === 'all' || filter === 'sticky') {
      elements.forEach((el) => {
        if (el.type === 'sticky') {
          const stickyEl = el as StickyElement
          if (stickyEl.text && stickyEl.text.toLowerCase().includes(q)) {
            found.push({
              id: `sticky-${el.id}`,
              type: 'sticky',
              label: truncate(stickyEl.text, 80, q),
              snippet: `Page ${el.pageIndex + 1} · Sticky note`,
              pageIndex: el.pageIndex,
              elementId: el.id,
              x: el.x,
              y: el.y,
            })
          }
        }
      })
    }

    if (filter === 'all' || filter === 'pages') {
      pages.forEach((page) => {
        if (page.name && page.name.toLowerCase().includes(q)) {
          found.push({
            id: `page-${page.index}`,
            type: 'page',
            label: page.name,
            snippet: `Page ${page.index + 1}`,
            pageIndex: page.index,
          })
        }
      })
    }

    if (filter === 'all') {
      elements.forEach((el) => {
        if (el.type === 'frame') {
          const frameEl = el as FrameElement
          if (frameEl.name && frameEl.name.toLowerCase().includes(q)) {
            found.push({
              id: `frame-${el.id}`,
              type: 'frame',
              label: frameEl.name,
              snippet: `Page ${el.pageIndex + 1} · Frame`,
              pageIndex: el.pageIndex,
              elementId: el.id,
              x: el.x,
              y: el.y,
            })
          }
        }
      })
    }

    return found
  }, [query, filter, elements, pages])

  // Clamp selected index to valid range
  const safeSelectedIndex = Math.min(selectedIndex, Math.max(0, results.length - 1))

  // Flash element opacity briefly
  const flashElement = useCallback((elementId: string) => {
    const el = elements.find((e) => e.id === elementId)
    if (!el) return
    const originalOpacity = el.opacity
    updateElement(elementId, { opacity: 0.3 })
    setTimeout(() => {
      updateElement(elementId, { opacity: 1 })
      setTimeout(() => {
        updateElement(elementId, { opacity: originalOpacity })
      }, 300)
    }, 300)
  }, [elements, updateElement])

  // Navigate to result
  const handleSelectResult = useCallback((result: SearchResult) => {
    if (result.pageIndex !== currentPageIndex) {
      setCurrentPageIndex(result.pageIndex)
    }

    if (result.elementId && result.x !== undefined && result.y !== undefined) {
      const el = elements.find((e) => e.id === result.elementId)
      if (el) {
        const cx = el.x + el.width / 2
        const cy = el.y + el.height / 2
        setCamera({
          x: -cx + window.innerWidth / 2,
          y: -cy + window.innerHeight / 2,
          zoom: 1.5,
        })
        selectElements([result.elementId])
        flashElement(result.elementId)
      }
    }

    onClose()
  }, [currentPageIndex, elements, setCurrentPageIndex, setCamera, selectElements, flashElement, onClose])

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[safeSelectedIndex]) {
      e.preventDefault()
      handleSelectResult(results[safeSelectedIndex])
    }
  }, [results, safeSelectedIndex, handleSelectResult])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
      onClose()
    }
  }, [onClose])

  const handleFilterChange = useCallback((f: SearchFilter) => {
    setFilter(f)
    setSelectedIndex(0)
  }, [])

  return (
    <div
      className="search-overlay-backdrop"
      onClick={handleBackdropClick}
      aria-label="Search overlay"
    >
      <div ref={overlayRef} className="search-overlay-panel" role="dialog" aria-label="Search board">
        <div className="search-overlay-input-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-overlay-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-overlay-input"
            placeholder="Search board..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            onKeyDown={handleInputKeyDown}
            aria-label="Search query"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="search-overlay-kbd">Esc</kbd>
        </div>

        <div className="search-overlay-filters" role="tablist">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={filter === opt.value}
              onClick={() => handleFilterChange(opt.value)}
              className={[
                'search-filter-btn',
                filter === opt.value ? 'search-filter-btn-active' : '',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="search-overlay-results">
          {query.trim() === '' ? (
            <div className="search-overlay-empty">
              <p>Type to search text, sticky notes, frames, and page names</p>
              <p className="search-overlay-hint">Ctrl+K to toggle · Esc to close</p>
            </div>
          ) : results.length === 0 ? (
            <div className="search-overlay-empty">
              <p>No results found for &quot;{query}&quot;</p>
            </div>
          ) : (
            <>
              <div className="search-overlay-results-header">
                Results ({results.length} found)
              </div>
              {results.map((result, idx) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={[
                    'search-overlay-result-item',
                    idx === safeSelectedIndex ? 'search-overlay-result-selected' : '',
                  ].join(' ')}
                  aria-label={`${TYPE_LABELS[result.type]}: ${result.label}`}
                >
                  <div className="search-result-row">
                    <span className="search-result-icon">{TYPE_ICONS[result.type]}</span>
                    <div className="search-result-content">
                      <span className="search-result-label">{highlightMatch(result.label, query)}</span>
                      <span className="search-result-meta">{result.snippet}</span>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function truncate(text: string, maxLen: number, query: string): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
  const start = Math.max(0, idx - 20)
  const end = Math.min(text.length, idx + query.length + 40)
  let result = ''
  if (start > 0) result += '…'
  result += text.slice(start, end)
  if (end < text.length) result += '…'
  return result
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight-mark">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}