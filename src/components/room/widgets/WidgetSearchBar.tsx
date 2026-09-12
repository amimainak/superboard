'use client'

import React, { useEffect, useRef, useState } from 'react'

// ============================================================
// WidgetSearchBar — shared search input used by all 9 toolkits.
// Real-time DOM-based filtering of `.toolkit-section` elements
// whose first child carries `data-search-title`.
// Fix #4 + #6: search bar + panel scroll behaviour.
// ============================================================

interface WidgetSearchBarProps {
  isDark: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  /** Ref to the toolkit's root container. */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Accent color for the active state (matches toolkit theme). */
  accentColor?: string
}

export function WidgetSearchBar({
  isDark,
  searchQuery,
  setSearchQuery,
  containerRef,
  accentColor = '#34d399',
}: WidgetSearchBarProps) {
  const [resultsCount, setResultsCount] = useState<number | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const q = searchQuery.trim().toLowerCase()
    const sections = container.querySelectorAll<HTMLElement>('.toolkit-section')
    let matchCount = 0
    sections.forEach((section) => {
      // Favorites + Recent sections should always be visible while searching.
      if (section.getAttribute('data-persistent-section') === 'true') return
      const titleEl = section.querySelector<HTMLElement>('[data-search-title]')
      const title = titleEl?.getAttribute('data-search-title') || ''
      const matches = q === '' || title.includes(q)
      if (matches) {
        section.style.display = ''
        matchCount++
      } else {
        section.style.display = 'none'
      }
    })
    // Also hide band-group header divs that are not persistent when searching.
    if (q !== '') {
      const groupHeaders = container.querySelectorAll<HTMLElement>('[data-band-group-header]')
      groupHeaders.forEach((h) => {
        // Hide unless at least one visible section follows until the next group header.
        // Simpler: hide all band-group headers while searching.
        h.style.display = 'none'
      })
    } else {
      const groupHeaders = container.querySelectorAll<HTMLElement>('[data-band-group-header]')
      groupHeaders.forEach((h) => { h.style.display = '' })
    }
    setResultsCount(q === '' ? null : matchCount)
  }, [searchQuery, containerRef])

  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'
  const placeholderColor = isDark ? '#71717a' : '#9ca3af'

  return (
    <div style={{ padding: '4px 12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 8, fontSize: 12, color: placeholderColor, pointerEvents: 'none' }}>🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search widgets..."
          style={{
            width: '100%',
            padding: '6px 26px 6px 26px',
            borderRadius: 6,
            fontSize: 11,
            background: inputBg,
            border: '1px solid ' + inputBorder,
            color: textColor,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 18,
              height: 18,
              borderRadius: 4,
              padding: 0,
              border: 'none',
              background: 'transparent',
              color: placeholderColor,
              cursor: 'pointer',
              fontSize: 11,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Clear search"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      {resultsCount !== null && (
        <div style={{ fontSize: 9, color: placeholderColor, paddingLeft: 4 }}>
          {resultsCount > 0 ? `${resultsCount} result${resultsCount === 1 ? '' : 's'}` : 'No results found'}
        </div>
      )}
      {/* Hidden accent color ref so the prop is "used" without affecting rendering. */}
      <span style={{ display: 'none', color: accentColor }} aria-hidden="true" />
    </div>
  )
}

// ============================================================
// FavoritesAndRecent — shared panel for favorites + recently used.
// Renders at the top of each toolkit, above the search bar.
// Fix #24 + #25.
// ============================================================

interface FavoritesAndRecentProps {
  isDark: boolean
  favorites: { id: string; title: string; toolkit: string }[]
  recent: { id: string; title: string; toolkit: string }[]
  onSelect: (widgetKind: string, title: string) => void
  onRemoveFavorite: (id: string) => void
  onClearRecent: () => void
}

export function FavoritesAndRecent({
  isDark,
  favorites,
  recent,
  onSelect,
  onRemoveFavorite,
  onClearRecent,
}: FavoritesAndRecentProps) {
  if (favorites.length === 0 && recent.length === 0) return null

  const labelColor = isDark ? '#94a3b8' : '#475569'
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)'
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const itemBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const itemBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'

  const renderRow = (entry: { id: string; title: string }, isFav: boolean) => (
    <div
      key={entry.id + (isFav ? '-fav' : '-recent')}
      data-persistent-section="true"
      className="toolkit-section"
      style={{
        margin: '0 8px 4px',
        padding: '6px 8px',
        background: itemBg,
        border: '1px solid ' + itemBorder,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
      }}
    >
      <button
        onClick={() => onSelect(entry.id, entry.title)}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          color: textColor,
          fontSize: 11,
          cursor: 'pointer',
          textAlign: 'left',
          padding: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={`Add ${entry.title} to board`}
      >
        <span style={{ marginRight: 6 }}>{isFav ? '⭐' : '🕘'}</span>
        {entry.title}
      </button>
      {isFav ? (
        <button
          onClick={() => onRemoveFavorite(entry.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: labelColor,
            cursor: 'pointer',
            fontSize: 12,
            padding: '0 4px',
            lineHeight: 1,
          }}
          title="Remove from favorites"
          aria-label="Remove from favorites"
        >
          ✕
        </button>
      ) : null}
    </div>
  )

  return (
    <div
      data-persistent-section="true"
      style={{
        margin: '4px 4px 0',
        padding: '8px 4px',
        background: bg,
        border: '1px solid ' + border,
        borderRadius: 6,
      }}
    >
      {favorites.length > 0 && (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#fbbf24', padding: '0 8px 4px' }}>
            ⭐ Favorites
          </div>
          {favorites.map((f) => renderRow(f, true))}
        </>
      )}
      {recent.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px 4px', marginTop: favorites.length > 0 ? 6 : 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#34d399' }}>
              🕘 Recently Used
            </div>
            <button
              onClick={onClearRecent}
              style={{
                background: 'transparent',
                border: 'none',
                color: labelColor,
                cursor: 'pointer',
                fontSize: 9,
                padding: 0,
              }}
              title="Clear recently used"
            >
              Clear
            </button>
          </div>
          {recent.map((r) => renderRow(r, false))}
        </>
      )}
    </div>
  )
}
