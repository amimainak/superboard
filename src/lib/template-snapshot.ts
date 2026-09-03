// ============================================================
// Template Snapshot Extraction (Phase 2C)
// ============================================================
// Extracts only widget elements + canvas settings from the
// whiteboard store. Does NOT save freehand drawings, text,
// sticky notes, or images — only the structured widget layouts.
// ============================================================

import type { WhiteboardElement, WidgetElement } from '@/lib/whiteboard/types'

export interface TemplateSnapshot {
  /** Widget elements placed on the canvas */
  widgets: Array<{
    id: string
    widgetKind: string
    x: number
    y: number
    width: number
    height: number
    config: Record<string, unknown>
  }>
  /** Canvas settings */
  canvas: {
    isDark: boolean
    showGrid: boolean
    gridSize: number
    gridType: 'dot' | 'line' | 'isometric' | 'lined' | 'music-staff'
    snapToGrid: boolean
  }
  /** Which subject filter is active (if any) */
  subject?: string
}

/**
 * Extract a template snapshot from the current whiteboard state.
 * Filters out everything except widget elements.
 */
export function extractTemplateSnapshot(options: {
  elements: WhiteboardElement[]
  isDark: boolean
  showGrid: boolean
  gridSize: number
  gridType: 'dot' | 'line' | 'isometric' | 'lined' | 'music-staff'
  snapToGrid: boolean
  activeSubject?: string
}): TemplateSnapshot {
  const { elements, isDark, showGrid, gridSize, gridType, snapToGrid, activeSubject } = options

  const widgets = elements
    .filter((el): el is WidgetElement => el.type === 'widget')
    .map((el) => ({
      id: el.id,
      widgetKind: el.widgetKind,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      config: { ...el.config }, // shallow copy of config
    }))

  return {
    widgets,
    canvas: {
      isDark,
      showGrid,
      gridSize,
      gridType,
      snapToGrid,
    },
    ...(activeSubject ? { subject: activeSubject } : {}),
  }
}

/**
 * Convert a template snapshot into WhiteboardElements that can be
 * loaded into the store via `loadState()` or `addElement()`.
 */
export function snapshotToElements(
  snapshot: TemplateSnapshot
): WhiteboardElement[] {
  return snapshot.widgets.map((w) => ({
    id: w.id,
    type: 'widget' as const,
    widgetKind: w.widgetKind,
    x: w.x,
    y: w.y,
    width: w.width,
    height: w.height,
    rotation: 0,
    opacity: 1,
    strokeColor: 'transparent',
    fillColor: 'transparent',
    strokeWidth: 0,
    locked: false,
    pageIndex: 0,
    config: w.config,
  }))
}

/**
 * Generate new unique IDs for widget elements (to avoid ID collisions
 * when loading a template into an existing canvas).
 */
export function snapshotWithNewIds(
  snapshot: TemplateSnapshot
): TemplateSnapshot {
  return {
    ...snapshot,
    widgets: snapshot.widgets.map((w) => ({
      ...w,
      id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    })),
  }
}
