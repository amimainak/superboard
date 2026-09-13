// ============================================================
// Superboard — Widget Toggle Bar
// Floating toggle buttons overlaid on the whiteboard.
// Shows icon + label for discoverability. Grouped by section.
// ============================================================

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useWidgetStore, type WidgetId, AVAILABLE_WIDGETS, getWidgetsForSubject } from '@/lib/room/widget-store'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { useAppStore } from '@/store/app-store'
import { WidgetBrowseModal } from './WidgetBrowseModal'

const SUBJECTS_STORAGE_KEY = 'superboard_installed_subjects'

export function WidgetToggleBar() {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const openWidgets = useWidgetStore((s) => s.openWidgets)
  const toggleWidget = useWidgetStore((s) => s.toggleWidget)
  const setBrowseModalOpen = useWidgetStore((s) => s.setBrowseModalOpen)
  const setInstalledTools = useWidgetStore((s) => s.setInstalledTools)
  const installedSubjects = useWidgetStore((s) => s.installedSubjects)
  const setInstalledSubjects = useWidgetStore((s) => s.setInstalledSubjects)
  const panelVisible = useWidgetStore((s) => s.panelVisible)
  // H1 FIX: Get the session subject for context-aware filtering
  const subject = useAppStore((s) => s.room.subject)

  // Track whether we're on a small screen (mobile) so we can show the
  // floating "open panel" button when the panel is closed.
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const update = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Load installed tools + installed subjects from server on mount
  useEffect(() => {
    fetch('/api/user/widgets')
      .then(res => res.json())
      .then(data => {
        if (data.installedTools) setInstalledTools(data.installedTools)
        // Server is source-of-truth for logged-in tutors. If the server
        // returns a non-empty `installedSubjects` array, it overrides the
        // localStorage default. If the server returns an empty array
        // (tutor hasn't customized yet), we fall back to localStorage /
        // DEFAULT_INSTALLED_SUBJECTS below.
        if (Array.isArray(data.installedSubjects) && data.installedSubjects.length > 0) {
          setInstalledSubjects(data.installedSubjects)
          try { localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(data.installedSubjects)) } catch {}
        }
      })
      .catch(() => { /* silently fail — will use empty set */ })
  }, [setInstalledTools, setInstalledSubjects])

  // On mount, hydrate installedSubjects from localStorage if the store
  // is still at the default. This is the guest path (no logged-in user)
  // and the logged-in-but-never-customized path.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SUBJECTS_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setInstalledSubjects(parsed.filter((s): s is string => typeof s === 'string'))
        }
      }
    } catch { /* ignore */ }
  }, [setInstalledSubjects])

  const commWidgets = AVAILABLE_WIDGETS.filter((w) => w.section === 'communication')
  // H1 FIX + Task 46 / Fix #1: Filter tool widgets based on the session
  // subject AND the tutor's pinned installedSubjects (used when subject
  // is GENERAL — the standalone whiteboard default).
  const allowedToolIds = useMemo(
    () => getWidgetsForSubject(subject, installedSubjects),
    [subject, installedSubjects]
  )
  const toolWidgets = AVAILABLE_WIDGETS.filter(
    (w) => w.section === 'tools' && allowedToolIds.includes(w.id as WidgetId)
  )

  // Show the floating "open panel" button only on mobile, when no widgets
  // are open (panel is closed). Once the tutor opens a widget, the panel
  // takes over the screen.
  const showFloatingOpen = isMobile && !panelVisible

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
          {/* Manage subjects button (Task 46 / Fix #1) — opens the
              WidgetBrowseModal which now has a "My Subjects" section at
              the top. Only shown when the session subject is GENERAL
              (the standalone whiteboard default). When a real subject
              is set, the toolkit list is dictated by SUBJECT_WIDGET_MAP
              and there's nothing to manage. */}
          {(!subject || subject === 'GENERAL') && (
            <button
              onClick={() => setBrowseModalOpen(true)}
              title="Manage which subject toolkits appear here"
              aria-label="Manage subject toolkits"
              className={[
                `widget-toggle-btn ${isDark ? '' : 'widget-toggle-btn-light'}`,
              ].join(' ')}
              style={{
                border: '1px dashed ' + (isDark ? 'rgba(168,85,247,0.4)' : 'rgba(168,85,247,0.3)'),
                background: isDark ? 'rgba(168,85,247,0.06)' : 'rgba(168,85,247,0.04)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#c084fc' : '#a855f7'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                <path d="M2 12h3" />
                <path d="M2 18h3" />
                <path d="M2 6h3" />
              </svg>
              <span className="widget-toggle-label" style={{ color: isDark ? '#c084fc' : '#a855f7' }}>Manage</span>
            </button>
          )}
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

      {/* Mobile floating "open panel" button (Task 46 / Fix #2).
          On phones the widget toggle bar lives at the top-right of the
          canvas, which is hard to discover when the panel is closed.
          This button floats above the canvas at the bottom-right, above
          the mobile toolbar, so a tutor can pop the panel back open
          with one tap. */}
      {showFloatingOpen && (
        <button
          type="button"
          aria-label="Open tools panel"
          title="Open tools panel"
          onClick={() => {
            // If a widget was previously open but the panel was closed,
            // toggleWidget will re-open it. Otherwise, open the first
            // available tool widget so the panel has content.
            if (openWidgets.length > 0) {
              toggleWidget(openWidgets[0])
            } else if (toolWidgets.length > 0) {
              toggleWidget(toolWidgets[0].id as WidgetId)
            } else if (commWidgets.length > 0) {
              toggleWidget(commWidgets[0].id as WidgetId)
            } else {
              setBrowseModalOpen(true)
            }
          }}
          className={`widget-mobile-open-fab ${isDark ? '' : 'widget-mobile-open-fab-light'}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M15 3v18" />
          </svg>
        </button>
      )}

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
    Activity: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    ClipboardCheck: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
    Palette: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
      </svg>
    ),
  }
  return <>{icons[name] || icons.MessageCircle}</>
}