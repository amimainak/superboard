'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { useCurationStore, type CurationTemplate, exportCurationForServer, initCurationFromServer } from '@/lib/room/canvas-widget-curation-store'
import { CANVAS_WIDGET_MAP, TOOLKIT_LABELS, ALL_CANVAS_WIDGETS, type ToolkitId } from '@/lib/room/canvas-widget-registry'

// ============================================================
// CurationProvider — loads/saves curation data from server
// Wrap the room page with this (or call initCuration on mount)
// ============================================================

export function CurationLoader() {
  const loaded = useCurationStore((s) => s.loaded)
  const setHiddenKinds = useCurationStore((s) => s.setHiddenKinds)
  const setTemplates = useCurationStore((s) => s.setTemplates)
  const setLoaded = useCurationStore((s) => s.setLoaded)

  useEffect(() => {
    if (loaded) return
    fetch('/api/user/widget-curation')
      .then(res => res.json())
      .then(data => {
        initCurationFromServer(data)
      })
      .catch(() => {
        // Use defaults on error
        setLoaded(true)
      })
  }, [loaded, setHiddenKinds, setTemplates, setLoaded])

  return null
}

// ============================================================
// Persist curation — auto-saves on changes (debounced)
// ============================================================

export function CurationAutoSave() {
  const hiddenWidgetKinds = useCurationStore((s) => s.hiddenWidgetKinds)
  const templates = useCurationStore((s) => s.templates)
  const loaded = useCurationStore((s) => s.loaded)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // We need a stable reference to track — use size as proxy
  const hiddenSize = hiddenWidgetKinds.size
  const tplCount = templates.length

  useEffect(() => {
    if (!loaded) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const data = exportCurationForServer()
      fetch('/api/user/widget-curation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => { /* silent */ })
    }, 1000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [hiddenSize, tplCount, loaded])

  return null
}

// ============================================================
// ToolkitSectionTitle — shared component for all toolkits
// Shows title + "Add to Board" + "Send to Library" buttons
// ============================================================

interface ToolkitSectionTitleProps {
  title: string
  widgetKind?: string
  onAddToBoard?: () => void
  isDark: boolean
}

export function ToolkitSectionTitle({ title, widgetKind, onAddToBoard, isDark }: ToolkitSectionTitleProps) {
  const hideWidgetKind = useCurationStore((s) => s.hideWidgetKind)
  const isHidden = useCurationStore((s) => s.isHidden)
  const [showConfirm, setShowConfirm] = useState(false)

  if (!widgetKind) {
    return <div className={'toolkit-section-title' + (isDark ? '' : ' toolkit-section-title-light')}>{title}</div>
  }

  const hidden = isHidden(widgetKind)
  const entry = CANVAS_WIDGET_MAP[widgetKind]
  // Only show curation button for registered canvas widgets
  const canCurate = !!entry

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 12 }}>
      <div className={'toolkit-section-title' + (isDark ? '' : ' toolkit-section-title-light')}>{title}</div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {onAddToBoard && (
          <button
            onClick={onAddToBoard}
            style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600,
              background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)',
              color: '#34d399', cursor: 'pointer' as const, whiteSpace: 'nowrap' as const,
            }}
          >
            + Board
          </button>
        )}
        {canCurate && !showConfirm && (
          <button
            onClick={() => setShowConfirm(true)}
            title="Send to Library"
            style={{
              width: 22, height: 22, borderRadius: 4, border: 'none',
              background: 'rgba(0,0,0,0.05)', color: isDark ? '#64748b' : '#94a3b8',
              cursor: 'pointer' as const, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              <path d="M12 7v6" />
              <path d="M9 10h6" />
            </svg>
          </button>
        )}
        {canCurate && showConfirm && (
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: isDark ? '#94a3b8' : '#64748b' }}>Hide?</span>
            <button
              onClick={() => { hideWidgetKind(widgetKind); setShowConfirm(false) }}
              style={{
                padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 600,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#fca5a5', cursor: 'pointer' as const,
              }}
            >Yes</button>
            <button
              onClick={() => setShowConfirm(false)}
              style={{
                padding: '1px 6px', borderRadius: 3, fontSize: 9,
                background: 'rgba(0,0,0,0.05)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer' as const,
              }}
            >No</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// useIsWidgetHidden — hook for toolkits to filter widgets
// ============================================================

export function useIsWidgetHidden(kind: string): boolean {
  return useCurationStore((s) => s.hiddenWidgetKinds.has(kind))
}

// ============================================================
// Widget Library Panel — shows hidden widgets + template mgmt
// Rendered inside the existing WidgetBrowseModal
// ============================================================

interface WidgetLibraryPanelProps {
  isDark: boolean
}

export function WidgetLibraryPanel({ isDark }: WidgetLibraryPanelProps) {
  const hiddenWidgetKinds = useCurationStore((s) => s.hiddenWidgetKinds)
  const restoreWidgetKind = useCurationStore((s) => s.restoreWidgetKind)
  const restoreAllWidgets = useCurationStore((s) => s.restoreAllWidgets)
  const templates = useCurationStore((s) => s.templates)
  const activeTemplateId = useCurationStore((s) => s.activeTemplateId)
  const saveAsTemplate = useCurationStore((s) => s.saveAsTemplate)
  const loadTemplate = useCurationStore((s) => s.loadTemplate)
  const deleteTemplate = useCurationStore((s) => s.deleteTemplate)

  const [tplName, setTplName] = useState('')
  const [tab, setTab] = useState<'hidden' | 'templates'>('hidden')

  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const muted = isDark ? '#64748b' : '#94a3b8'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : 'white'

  // Group hidden widgets by toolkit
  const hiddenEntries = Array.from(hiddenWidgetKinds)
    .map(kind => CANVAS_WIDGET_MAP[kind])
    .filter(Boolean)

  const grouped: Record<string, typeof hiddenEntries> = {}
  for (const entry of hiddenEntries) {
    if (!grouped[entry.toolkit]) grouped[entry.toolkit] = []
    grouped[entry.toolkit].push(entry)
  }

  const handleSaveTemplate = () => {
    const name = tplName.trim() || ('Template ' + (templates.length + 1))
    saveAsTemplate(name)
    setTplName('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid ' + border }}>
        <button
          onClick={() => setTab('hidden')}
          style={{
            flex: 1, padding: '8px 12px', fontSize: 11, fontWeight: tab === 'hidden' ? 600 : 500,
            color: tab === 'hidden' ? (isDark ? '#34d399' : '#059669') : muted,
            borderBottom: tab === 'hidden' ? '2px solid ' + (isDark ? '#34d399' : '#059669') : '2px solid transparent',
            background: 'none', border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid',
            borderBottomColor: tab === 'hidden' ? (isDark ? '#34d399' : '#059669') : 'transparent',
            cursor: 'pointer' as const,
          }}
        >
          Hidden ({hiddenEntries.length})
        </button>
        <button
          onClick={() => setTab('templates')}
          style={{
            flex: 1, padding: '8px 12px', fontSize: 11, fontWeight: tab === 'templates' ? 600 : 500,
            color: tab === 'templates' ? (isDark ? '#34d399' : '#059669') : muted,
            borderBottom: tab === 'templates' ? '2px solid ' + (isDark ? '#34d399' : '#059669') : '2px solid transparent',
            background: 'none', border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid',
            borderBottomColor: tab === 'templates' ? (isDark ? '#34d399' : '#059669') : 'transparent',
            cursor: 'pointer' as const,
          }}
        >
          Templates ({templates.length})
        </button>
      </div>

      {/* Hidden widgets tab */}
      {tab === 'hidden' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {hiddenEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: muted, fontSize: 12 }}>
              No widgets hidden. Click the book icon on any widget to send it here.
            </div>
          ) : (
            <>
              <button
                onClick={restoreAllWidgets}
                style={{
                  width: '100%', padding: '8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)',
                  color: isDark ? '#34d399' : '#059669', cursor: 'pointer' as const,
                  marginBottom: 12,
                }}
              >
                Restore All Widgets
              </button>
              {Object.entries(grouped).map(function([toolkit, entries]) {
                return (
                  <div key={toolkit} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: muted, marginBottom: 6, padding: '0 2px' }}>
                      {TOOLKIT_LABELS[toolkit as ToolkitId] || toolkit}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {entries.map(function(entry) {
                        return (
                          <div key={entry.kind} style={{
                            padding: '8px 10px', borderRadius: 6, background: cardBg,
                            border: '1px solid ' + border, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 500, color: text }}>{entry.label}</div>
                              <div style={{ fontSize: 9, color: muted, marginTop: 1 }}>
                                {entry.gradeBands[0]}{entry.gradeBands.length > 1 ? '-' + entry.gradeBands[entry.gradeBands.length - 1] : ''}
                              </div>
                            </div>
                            <button
                              onClick={() => restoreWidgetKind(entry.kind)}
                              style={{
                                padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                                background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)',
                                color: isDark ? '#34d399' : '#059669', cursor: 'pointer' as const,
                              }}
                            >
                              + Restore
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* Templates tab */}
      {tab === 'templates' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Save current as template */}
          <div style={{
            padding: 12, borderRadius: 8, background: cardBg,
            border: '1px solid ' + border,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: text, marginBottom: 8 }}>
              Save Current Layout as Template
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                placeholder={'Template ' + (templates.length + 1)}
                style={{
                  flex: 1, padding: '6px 10px', borderRadius: 4, fontSize: 11,
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                  border: '1px solid ' + border, color: text, outline: 'none',
                }}
              />
              <button
                onClick={handleSaveTemplate}
                style={{
                  padding: '6px 12px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                  background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)',
                  color: isDark ? '#34d399' : '#059669', cursor: 'pointer' as const,
                  whiteSpace: 'nowrap' as const,
                }}
              >
                Save
              </button>
            </div>
            <div style={{ fontSize: 9, color: muted, marginTop: 4 }}>
              Saves which widgets are currently visible/hidden
            </div>
          </div>

          {/* Template list */}
          {templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: muted, fontSize: 12 }}>
              No templates saved yet. Customize your widgets and save the layout above.
            </div>
          ) : (
            templates.map(function(tpl) {
              const isActive = activeTemplateId === tpl.id
              return (
                <div key={tpl.id} style={{
                  padding: 12, borderRadius: 8, background: cardBg,
                  border: '1px solid ' + (isActive ? 'rgba(5,150,105,0.4)' : border),
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: text }}>{tpl.name}</span>
                      {isActive && (
                        <span style={{
                          fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                          background: 'rgba(5,150,105,0.12)', color: isDark ? '#34d399' : '#059669',
                          border: '1px solid rgba(5,150,105,0.25)', textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>Active</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => loadTemplate(tpl.id)}
                        disabled={isActive}
                        style={{
                          padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                          background: isActive ? 'rgba(0,0,0,0.03)' : 'rgba(5,150,105,0.12)',
                          border: isActive ? '1px solid ' + border : '1px solid rgba(5,150,105,0.3)',
                          color: isActive ? muted : (isDark ? '#34d399' : '#059669'),
                          cursor: isActive ? 'default' : ('pointer' as const),
                        }}
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deleteTemplate(tpl.id)}
                        style={{
                          padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                          color: '#fca5a5', cursor: 'pointer' as const,
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: muted }}>
                    {tpl.hiddenKinds.length} widget{tpl.hiddenKinds.length !== 1 ? 's' : ''} hidden
                    {' · '}
                    {new Date(tpl.createdAt).toLocaleDateString()}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
