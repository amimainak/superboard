// ============================================================
// Superboard — Widget Toggle Bar
// Floating toggle buttons overlaid on the whiteboard
// ============================================================

'use client'

import { useWidgetStore, type WidgetId, AVAILABLE_WIDGETS } from '@/lib/room/widget-store'

export function WidgetToggleBar() {
  const openWidgets = useWidgetStore((s) => s.openWidgets)
  const toggleWidget = useWidgetStore((s) => s.toggleWidget)

  return (
    <div className="widget-toggle-bar" role="toolbar" aria-label="Toggle widgets">
      {AVAILABLE_WIDGETS.map((widget) => {
        const isOpen = openWidgets.includes(widget.id as WidgetId)
        return (
          <button
            key={widget.id}
            onClick={() => toggleWidget(widget.id as WidgetId)}
            title={widget.label}
            aria-pressed={isOpen}
            aria-label={widget.label}
            className={[
              'widget-toggle-btn',
              isOpen ? 'widget-toggle-btn-active' : '',
            ].join(' ')}
          >
            <WidgetIcon name={widget.icon} />
          </button>
        )
      })}
    </div>
  )
}

// Simple icon renderer using inline SVGs (no lucide dep needed)
function WidgetIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    MessageCircle: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    Users: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    Video: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15.6 11.6L22 7v10l-6.4-4.5v-1zM4 5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      </svg>
    ),
  }
  return <>{icons[name] || icons.MessageCircle}</>
}
