// ============================================================
// Superboard — Widget Toggle Bar
// Floating toggle buttons overlaid on the whiteboard.
// Shows icon + label for discoverability. Grouped by section.
// ============================================================

'use client'

import { useEffect } from 'react'
import { useWidgetStore, type WidgetId, AVAILABLE_WIDGETS } from '@/lib/room/widget-store'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { WidgetBrowseModal } from './WidgetBrowseModal'

export function WidgetToggleBar() {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const openWidgets = useWidgetStore((s) => s.openWidgets)
  const toggleWidget = useWidgetStore((s) => s.toggleWidget)
  const setBrowseModalOpen = useWidgetStore((s) => s.setBrowseModalOpen)
  const setInstalledTools = useWidgetStore((s) => s.setInstalledTools)

  // Load installed tools from server on mount
  useEffect(() => {
    fetch('/api/user/widgets')
      .then(res => res.json())
      .then(data => {
        if (data.installedTools) setInstalledTools(data.installedTools)
      })
      .catch(() => { /* silently fail — will use empty set */ })
  }, [setInstalledTools])

  const commWidgets = AVAILABLE_WIDGETS.filter((w) => w.section === 'communication')
  const toolWidgets = AVAILABLE_WIDGETS.filter((w) => w.section === 'tools')

  return (
    <>
      <div className={`widget-toggle-bar ${isDark ? '' : 'widget-toggle-bar-light'}`} role="toolbar" aria-label="Toggle widgets">
        {/* Communication section */}
        <div className="widget-toggle-group">
          <span className={`widget-toggle-group-label ${isDark ? '' : 'widget-toggle-group-label-light'}`}>Collaborate</span>
          {commWidgets.map((widget) => (
            <ToggleBtn
              key={widget.id}
              widget={widget}
              isOpen={openWidgets.includes(widget.id as WidgetId)}
              onToggle={() => toggleWidget(widget.id as WidgetId)}
            />
          ))}
        </div>
        {/* Tools section */}
        <div className="widget-toggle-group">
          <span className={`widget-toggle-group-label ${isDark ? '' : 'widget-toggle-group-label-light'}`}>Tools</span>
          {toolWidgets.map((widget) => (
            <ToggleBtn
              key={widget.id}
              widget={widget}
              isOpen={openWidgets.includes(widget.id as WidgetId)}
              onToggle={() => toggleWidget(widget.id as WidgetId)}
            />
          ))}
          {/* Marketplace browse button */}
          <button
            onClick={() => setBrowseModalOpen(true)}
            title="Browse Widget Library"
            className={[
              `widget-toggle-btn ${isDark ? '' : 'widget-toggle-btn-light'}`,
            ].join(' ')}
            style={{
              border: '1px dashed ' + (isDark ? 'rgba(168,85,247,0.4)' : 'rgba(168,85,247,0.3)'),
              background: isDark ? 'rgba(168,85,247,0.06)' : 'rgba(168,85,247,0.04)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#c084fc' : '#a855f7'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span className="widget-toggle-label" style={{ color: isDark ? '#c084fc' : '#a855f7' }}>Library</span>
          </button>
        </div>
      </div>
      <WidgetBrowseModal />
    </>
  )
}

function ToggleBtn({
  widget,
  isOpen,
  onToggle,
}: {
  widget: (typeof AVAILABLE_WIDGETS)[number]
  isOpen: boolean
  onToggle: () => void
}) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  return (
    <button
      onClick={onToggle}
      title={widget.label}
      aria-pressed={isOpen}
      aria-label={widget.label}
      className={[
        `widget-toggle-btn ${isDark ? '' : 'widget-toggle-btn-light'}`,
        isOpen ? 'widget-toggle-btn-active' : '',
      ].join(' ')}
    >
      <WidgetIcon name={widget.icon} />
      <span className="widget-toggle-label">{widget.label}</span>
    </button>
  )
}

// Icon renderer using inline SVGs
function WidgetIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    MessageCircle: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    Users: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    Video: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15.6 11.6L22 7v10l-6.4-4.5v-1zM4 5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      </svg>
    ),
    RecordCircle: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    ),
    Sparkles: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
        <path d="M18 13l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
        <path d="M7 17l.5 1.5L9 19l-1.5.5L7 21l-.5-1.5L5 19l1.5-.5L7 17z" />
      </svg>
    ),
    Calculator: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="10" y2="10" />
        <line x1="14" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="10" y2="14" />
        <line x1="14" y1="14" x2="16" y2="14" />
        <line x1="8" y1="18" x2="10" y2="18" />
        <line x1="14" y1="18" x2="16" y2="18" />
      </svg>
    ),
    Atom: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2" />
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
      </svg>
    ),
    Languages: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 8l6 6" />
        <path d="M4 14l6-6 2-3" />
        <path d="M2 5h12" />
        <path d="M7 2h1" />
        <path d="M22 22l-5-10-5 10" />
        <path d="M14 18h6" />
      </svg>
    ),
    Zap: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    Leaf: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
    Globe: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    Timer: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="10" y1="2" x2="14" y2="2" />
        <line x1="12" y1="14" x2="12" y2="8" />
        <circle cx="12" cy="14" r="8" />
      </svg>
    ),
    Shapes: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7.5" cy="7.5" r="4" />
        <rect x="13.5" y="3" width="8" height="9" rx="1" />
        <path d="M7 14l-4 8 8-2Z" />
      </svg>
    ),
    NotebookPen: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 4v16" />
        <path d="M17 4v16" />
        <path d="M13 4h4" />
        <path d="M17 20H9.5a4.5 4.5 0 0 1 0-9H13" />
        <path d="M8 2h8" />
      </svg>
    ),
    LayoutTemplate: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
    BarChart3: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </svg>
    ),
    UsersRound: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 21a8 8 0 0 0-16 0" />
        <circle cx="10" cy="8" r="5" />
        <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
      </svg>
    ),
    Calendar: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    Building2: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
      </svg>
    ),
    LayoutGrid: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  }
  return <>{icons[name] || icons.MessageCircle}</>
}