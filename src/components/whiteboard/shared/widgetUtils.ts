// ============================================================
// Superboard — Shared Canvas Widget Hooks & Styles
// Phase 5 cleanup: extracted from 6 duplicate definitions across
// CanvasMathWidgets, CanvasScienceWidgets, CanvasLanguageWidgets,
// CanvasArtsWidgets, CanvasL3Widgets, and CanvasWidgets.
// ============================================================

'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import type { WidgetElement } from '@/lib/whiteboard/types'

// ============================================================
// useConfigUpdater — debounced config patcher for canvas widgets
// ============================================================

/**
 * Returns a function that patches a widget element's config.
 * Uses requestAnimationFrame for batching (canvas widgets) or
 * setTimeout for 150ms debouncing (language/arts widgets).
 *
 * @param elementId - The widget element's id
 * @param mode - 'raf' (default, for canvas widgets) or 'debounce' (150ms)
 */
export function useConfigUpdater(elementId: string, mode: 'raf' | 'debounce' = 'raf') {
  const updateElement = useWhiteboardStore((s) => s.updateElement)
  const pendingRef = useRef<Record<string, unknown>>({})
  const rafRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateConfig = useCallback((patch: Record<string, unknown>) => {
    Object.assign(pendingRef.current, patch)

    if (mode === 'debounce') {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        updateElement(elementId, { config: { ...pendingRef.current } } as Partial<WidgetElement>)
        pendingRef.current = {}
      }, 150)
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        updateElement(elementId, { config: { ...pendingRef.current } } as Partial<WidgetElement>)
        pendingRef.current = {}
      })
    }
  }, [updateElement, elementId, mode])

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return updateConfig
}

// ============================================================
// widgetStyles — shared dark/light color tokens for canvas widgets
// ============================================================

export interface WidgetStyle {
  bg: string
  surface: string
  border: string
  text: string
  bright: string
  accent: string
  input: React.CSSProperties
  btnSm: (color?: string, bg?: string, border?: string) => React.CSSProperties
  tabBtn: (active: boolean) => React.CSSProperties
  primaryBtn: React.CSSProperties
}

/**
 * Returns a style object with dark/light color tokens for canvas widgets.
 * Replaces the duplicated `ws()`, `langStyles()`, and `styles()` helpers
 * that were defined separately in each Canvas*Widgets file.
 */
export function widgetStyles(isDark: boolean): WidgetStyle {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const surface = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#94a3b8' : '#475569'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accent = isDark ? '#a5b4fc' : '#6366f1'

  const input: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 11,
    border: '1px solid ' + border,
    background: bg,
    color: bright,
    outline: 'none',
    fontFamily: 'inherit',
  }

  const btnSm = (color?: string, bgCol?: string, borderCol?: string): React.CSSProperties => ({
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid ' + (borderCol || border),
    background: bgCol || bg,
    color: color || text,
  })

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 10,
    cursor: 'pointer',
    fontWeight: 600,
    background: active ? 'rgba(99,102,241,0.15)' : bg,
    border: '1px solid ' + (active ? 'rgba(99,102,241,0.4)' : border),
    color: active ? '#a5b4fc' : text,
  })

  const primaryBtn: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 5,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    background: 'rgba(99,102,241,0.15)',
    border: '1px solid rgba(99,102,241,0.3)',
    color: '#a5b4fc',
  }

  return { bg, surface, border, text, bright, accent, input, btnSm, tabBtn, primaryBtn }
}
