'use client'

import { useState, useEffect, useCallback } from 'react'

// ============================================================
// Shared widget favorites + recently-used state.
// Used by all 9 toolkit components (Fix #24 + #25).
// ============================================================

export interface WidgetEntry {
  id: string       // widget kind, e.g. 'stat-histogram'
  title: string    // human label, e.g. 'Histogram'
  toolkit: string  // toolkit name, e.g. 'statistics'
}

const FAV_KEY = 'superboard_favorite_widgets'
const RECENT_KEY = 'superboard_recent_widgets'
export const RECENT_LIMIT = 3

function readList(key: string): WidgetEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((e) => e && typeof e.id === 'string' && typeof e.title === 'string' && typeof e.toolkit === 'string')
  } catch {
    return []
  }
}

function writeList(key: string, list: WidgetEntry[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(list))
  } catch {
    /* localStorage may be unavailable */
  }
}

// ---- Favorites hook ----
export function useFavorites(toolkit: string) {
  const [favorites, setFavorites] = useState<WidgetEntry[]>([])

  useEffect(() => {
    const refresh = () => setFavorites(readList(FAV_KEY).filter((f) => f.toolkit === toolkit))
    refresh()
    window.addEventListener('storage', refresh)
    window.addEventListener('superboard-favorites-changed', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('superboard-favorites-changed', refresh)
    }
  }, [toolkit])

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  )

  const toggleFavorite = useCallback((entry: WidgetEntry) => {
    const all = readList(FAV_KEY)
    const existing = all.findIndex((f) => f.id === entry.id)
    let next: WidgetEntry[]
    if (existing >= 0) {
      next = all.filter((f) => f.id !== entry.id)
    } else {
      next = [...all, { ...entry, toolkit: entry.toolkit || toolkit }]
    }
    writeList(FAV_KEY, next)
    window.dispatchEvent(new Event('superboard-favorites-changed'))
  }, [toolkit])

  return { favorites, isFavorite, toggleFavorite }
}

// ---- Recently-used hook ----
export function useRecentWidgets(toolkit: string) {
  const [recent, setRecent] = useState<WidgetEntry[]>([])

  useEffect(() => {
    const refresh = () => setRecent(readList(RECENT_KEY).filter((f) => f.toolkit === toolkit).slice(0, RECENT_LIMIT))
    refresh()
    window.addEventListener('storage', refresh)
    window.addEventListener('superboard-recent-changed', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('superboard-recent-changed', refresh)
    }
  }, [toolkit])

  const addRecent = useCallback((entry: WidgetEntry) => {
    const all = readList(RECENT_KEY)
    const filtered = all.filter((f) => f.id !== entry.id)
    const next = [{ ...entry, toolkit: entry.toolkit || toolkit }, ...filtered].slice(0, RECENT_LIMIT * 4)
    writeList(RECENT_KEY, next)
    window.dispatchEvent(new Event('superboard-recent-changed'))
  }, [toolkit])

  return { recent, addRecent }
}
