// ============================================================
// Superboard — Widget Panel (Right Side)
// Tabbed panel that hosts active widgets
// ============================================================

'use client'

import { useWidgetStore, type WidgetId, AVAILABLE_WIDGETS } from '@/lib/room/widget-store'
import { ChatWidget } from './ChatWidget'
import { ParticipantsWidget } from './ParticipantsWidget'
import { VideoWidget } from './VideoWidget'

interface WidgetPanelProps {
  roomId: string
}

export function WidgetPanel({ roomId }: WidgetPanelProps) {
  const panelVisible = useWidgetStore((s) => s.panelVisible)
  const openWidgets = useWidgetStore((s) => s.openWidgets)
  const activeTab = useWidgetStore((s) => s.activeTab)
  const setActiveTab = useWidgetStore((s) => s.setActiveTab)
  const closeWidget = useWidgetStore((s) => s.closeWidget)

  if (!panelVisible || openWidgets.length === 0) return null

  const tabs = AVAILABLE_WIDGETS.filter((w) =>
    openWidgets.includes(w.id as WidgetId)
  )

  return (
    <div className="widget-panel">
      {/* Tab bar */}
      <div className="widget-tab-bar" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as WidgetId)}
            className={[
              'widget-tab',
              activeTab === tab.id ? 'widget-tab-active' : '',
            ].join(' ')}
          >
            <span className="widget-tab-label">{tab.label}</span>
            <button
              className="widget-tab-close"
              onClick={(e) => {
                e.stopPropagation()
                closeWidget(tab.id as WidgetId)
              }}
              aria-label={`Close ${tab.label}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </button>
        ))}
      </div>

      {/* Active widget content */}
      <div className="widget-panel-body" role="tabpanel">
        {activeTab === 'chat' && <ChatWidget roomId={roomId} />}
        {activeTab === 'participants' && <ParticipantsWidget roomId={roomId} isTutor={true} />}
        {activeTab === 'video' && <VideoWidget roomId={roomId} />}
      </div>
    </div>
  )
}
