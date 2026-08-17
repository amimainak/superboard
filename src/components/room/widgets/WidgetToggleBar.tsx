// ============================================================
// Superboard — Widget Toggle Bar
// Floating toggle buttons overlaid on the whiteboard.
// Shows icon + label for discoverability. Grouped by section.
// ============================================================

'use client'

import { useWidgetStore, type WidgetId, AVAILABLE_WIDGETS } from '@/lib/room/widget-store'

export function WidgetToggleBar() {
  const openWidgets = useWidgetStore((s) => s.openWidgets)
  const toggleWidget = useWidgetStore((s) => s.toggleWidget)

  const commWidgets = AVAILABLE_WIDGETS.filter((w) => w.section === 'communication')
  const toolWidgets = AVAILABLE_WIDGETS.filter((w) => w.section === 'tools')

  return (
    <div className="widget-toggle-bar" role="toolbar" aria-label="Toggle widgets">
      {/* Communication section */}
      <div className="widget-toggle-group">
        <span className="widget-toggle-group-label">Collaborate</span>
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
        <span className="widget-toggle-group-label">Tools</span>
        {toolWidgets.map((widget) => (
          <ToggleBtn
            key={widget.id}
            widget={widget}
            isOpen={openWidgets.includes(widget.id as WidgetId)}
            onToggle={() => toggleWidget(widget.id as WidgetId)}
          />
        ))}
      </div>
    </div>
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
  return (
    <button
      onClick={onToggle}
      title={widget.label}
      aria-pressed={isOpen}
      aria-label={widget.label}
      className={[
        'widget-toggle-btn',
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
    Shapes: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7.5" cy="7.5" r="4" />
        <rect x="13.5" y="3" width="8" height="9" rx="1" />
        <path d="M7 14l-4 8 8-2Z" />
      </svg>
    ),
  }
  return <>{icons[name] || icons.MessageCircle}</>
}
