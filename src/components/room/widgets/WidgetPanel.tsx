// ============================================================
// Superboard — Widget Panel (Right Side)
// Tabbed panel that hosts active widgets
// Supports dock, float, and minimized modes
// ============================================================

'use client'

import dynamic from 'next/dynamic'
import { useWidgetStore, type WidgetId, type PanelMode, AVAILABLE_WIDGETS } from '@/lib/room/widget-store'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { ChatWidget } from './ChatWidget'
import { ParticipantsWidget } from './ParticipantsWidget'
import { VideoWidget } from './VideoWidget'
import { RecordingWidget } from './RecordingWidget'
import { TemplatesWidget } from './TemplatesWidget'
import { SessionNotesWidget } from './SessionNotesWidget'
import { AnalyticsWidget } from './AnalyticsWidget'
import { ParentPortalWidget } from './ParentPortalWidget'
import { SchedulingWidget } from './SchedulingWidget'
const AgencyWidget = dynamic(() => import('./AgencyWidget').then((m) => ({ default: m.AgencyWidget })), { ssr: false })
const BreakoutRoomsWidget = dynamic(() => import('./BreakoutRoomsWidget').then((m) => ({ default: m.BreakoutRoomsWidget })), { ssr: false })

// Lazy-load tool widgets to reduce initial bundle
const AIAssistantWidget = dynamic(() => import('./AIAssistantWidget').then((m) => ({ default: m.AIAssistantWidget })), { ssr: false })
const MathToolkit = dynamic(() => import('./MathToolkit').then((m) => ({ default: m.MathToolkit })), { ssr: false })
const ScienceToolkit = dynamic(() => import('./ScienceToolkit').then((m) => ({ default: m.ScienceToolkit })), { ssr: false })
const LanguageToolkit = dynamic(() => import('./LanguageToolkit').then((m) => ({ default: m.LanguageToolkit })), { ssr: false })
const GeoGebraPanel = dynamic(() => import('./GeoGebraPanel').then((m) => ({ default: m.GeoGebraPanel })), { ssr: false })

interface WidgetPanelProps {
  roomId: string
}

const MODE_CYCLE: PanelMode[] = ['dock', 'float', 'minimized']

export function WidgetPanel({ roomId }: WidgetPanelProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const panelVisible = useWidgetStore((s) => s.panelVisible)
  const openWidgets = useWidgetStore((s) => s.openWidgets)
  const activeTab = useWidgetStore((s) => s.activeTab)
  const panelMode = useWidgetStore((s) => s.panelMode)
  const setActiveTab = useWidgetStore((s) => s.setActiveTab)
  const closeWidget = useWidgetStore((s) => s.closeWidget)
  const setPanelMode = useWidgetStore((s) => s.setPanelMode)

  if (!panelVisible || openWidgets.length === 0) return null

  const tabs = AVAILABLE_WIDGETS.filter((w) =>
    openWidgets.includes(w.id as WidgetId)
  )

  const isMinimized = panelMode === 'minimized'
  const isFloat = panelMode === 'float'

  const panelClassName = [
    `widget-panel ${isDark ? '' : 'widget-panel-light'}`,
    isFloat ? 'widget-panel-float' : '',
    isMinimized ? 'widget-panel-minimized' : '',
  ].filter(Boolean).join(' ')

  const handleModeToggle = () => {
    const currentIdx = MODE_CYCLE.indexOf(panelMode)
    const nextIdx = (currentIdx + 1) % MODE_CYCLE.length
    setPanelMode(MODE_CYCLE[nextIdx])
  }

  const renderWidget = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatWidget roomId={roomId} />
      case 'participants':
        return <ParticipantsWidget roomId={roomId} isTutor={true} />
      case 'video':
        return <VideoWidget roomId={roomId} />
      case 'recording':
        return <RecordingWidget roomId={roomId} />
      case 'notes':
        return <SessionNotesWidget roomId={roomId} />
      case 'ai':
        return <AIAssistantWidget roomId={roomId} />
      case 'math':
        return <MathToolkit roomId={roomId} />
      case 'science':
        return <ScienceToolkit roomId={roomId} />
      case 'language':
        return <LanguageToolkit roomId={roomId} />
      case 'geogebra':
        return <GeoGebraPanel roomId={roomId} />
      case 'templates':
        return <TemplatesWidget roomId={roomId} />
      case 'analytics':
        return <AnalyticsWidget roomId={roomId} />
      case 'parents':
        return <ParentPortalWidget roomId={roomId} />
      case 'scheduling':
        return <SchedulingWidget roomId={roomId} />
      case 'agency':
        return <AgencyWidget roomId={roomId} />
      case 'breakout':
        return <BreakoutRoomsWidget roomId={roomId} />
      default:
        return null
    }
  }

  return (
    <div className={panelClassName}>
      {/* Tab bar */}
      <div className={`widget-tab-bar ${isDark ? '' : 'widget-tab-bar-light'}`} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as WidgetId)}
            className={[
              `widget-tab ${isDark ? '' : 'widget-tab-light'}`,
              activeTab === tab.id ? `widget-tab-active ${isDark ? '' : 'widget-tab-active-light'}` : '',
            ].join(' ')}
          >
            <span className="widget-tab-label">{tab.label}</span>
            <button
              className={`widget-tab-close ${isDark ? '' : 'widget-tab-close-light'}`}
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
        <button
          className={`widget-mode-toggle ${isDark ? '' : 'widget-mode-toggle-light'}`}
          onClick={handleModeToggle}
          title={`Panel mode: ${panelMode} (click to switch)`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {panelMode === 'dock' && <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M15 3v18" /></>}
            {panelMode === 'float' && <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /><path d="M3 9h18" /></>}
            {panelMode === 'minimized' && <><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></>}
          </svg>
        </button>
      </div>

      {/* Active widget content (hidden in minimized mode) */}
      {!isMinimized && (
        <div className="widget-panel-body" role="tabpanel">
          {renderWidget()}
        </div>
      )}
    </div>
  )
}
