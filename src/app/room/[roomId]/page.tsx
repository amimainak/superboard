'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  WidgetPanel,
  WidgetToggleBar,
  SessionControls,
  RoomInfoBar,
  RaiseHandButton,
  ConnectionStatus,
  AutoSaveIndicator,
} from '@/components/room/widgets'
import { useWidgetStore } from '@/lib/room/widget-store'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { getDefaultWidgetConfig, getWidgetDefaultSize } from '@/components/whiteboard/CanvasWidgets'
import { generateId } from '@/lib/whiteboard/utils'
import type { WidgetElement } from '@/lib/whiteboard/types'
import { SessionResume } from '@/components/room/SessionResume'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import '@/components/room/widgets/widgets.css'

const WhiteboardClient = dynamic(() => import('@/components/room/RoomWhiteboard'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0f172a',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, #059669, #0891b2)',
          margin: '0 auto 12px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          </svg>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>Loading Room...</div>
      </div>
    </div>
  ),
})

interface RoomInfo {
  id: string
  tutorId: string
  subject: string
  isActive: boolean
}

type AutoSaveStatus = 'saved' | 'saving' | 'error' | 'unsaved'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveTrigger, setSaveTrigger] = useState(0)
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('saved')

  // ---- Task 44 — Cross-Session Continuity ----
  // Subscribe to the whiteboard store so the room page can place a
  // suggested widget onto the board when the tutor clicks the
  // "Start with this widget" button on the SessionResume card.
  // Mirrors the addToBoard pattern used inside the toolkit panels
  // (see StatToolkit.tsx / MathToolkit.tsx).
  const addElement = useWhiteboardStore((s) => s.addElement)
  const camera = useWhiteboardStore((s) => s.camera)
  const currentPageIndex = useWhiteboardStore((s) => s.currentPageIndex)
  const isDark = useWhiteboardStore((s) => s.isDark)

  const handleStartWidget = useCallback(
    (widgetKind: string) => {
      const size = getWidgetDefaultSize(widgetKind)
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800
      const cx = (vw / 2 - camera.x) / camera.zoom
      const cy = ((vh / 2 - 44) - camera.y) / camera.zoom
      const el: WidgetElement = {
        id: generateId(),
        type: 'widget',
        widgetKind,
        config: getDefaultWidgetConfig(widgetKind),
        x: cx - size.width / 2,
        y: cy - size.height / 2,
        width: size.width,
        height: size.height,
        rotation: 0,
        opacity: 1,
        strokeColor: isDark ? '#334155' : '#e2e8f0',
        fillColor: isDark ? '#0f172a' : '#ffffff',
        strokeWidth: 1,
        locked: false,
        pageIndex: currentPageIndex,
      }
      addElement(el)
    },
    [addElement, camera, isDark, currentPageIndex],
  )

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const res = await fetch('/api/rooms/' + roomId)
        const data = await res.json()
        if (data.error) {
          setError(data.error)
          setLoading(false)
          return
        }
        setRoom(data)
        setLoading(false)
        // Auto-open chat widget when room loads
        const store = useWidgetStore.getState()
        if (!store.panelVisible) store.openWidget('chat')
      } catch (err) {
        setError('Failed to load room. Please try again.')
        setLoading(false)
      }
    }
    loadRoom()
  }, [roomId])

  const handleSave = useCallback(() => {
    setSaveTrigger(prev => prev + 1)
  }, [])

  const handleSaved = useCallback((success: boolean) => {
    if (success) {
      setAutoSaveStatus('saved')
    } else {
      setAutoSaveStatus('error')
    }
  }, [])

  const handleEndSession = async () => {
    await fetch(`/api/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    })
    setRoom(prev => prev ? { ...prev, isActive: false } : prev)
    router.push('/dashboard')
  }

  if (loading) return null
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Room not found</h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ padding: '10px 24px', borderRadius: 8, background: 'linear-gradient(135deg, #059669, #0891b2)', color: 'white', border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="room-layout">
      {/* Main whiteboard area */}
      <div className="room-main">
        <WhiteboardClient
          roomId={roomId}
          onSaveRequest={handleSave}
          saveStatus={saveTrigger > 0 ? `Save #${saveTrigger}` : ''}
          onSaved={handleSaved}
        />

        {/* Task 42 / Fix #23 — breadcrumb (top-left, above the info bar) */}
        <nav
          aria-label="Breadcrumb"
          className="room-breadcrumb"
        >
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{`Room ${room?.subject || ''}`.trim()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </nav>

        {/* Room Info Bar — top-left overlay */}
        <RoomInfoBar
          subject={room?.subject || 'Room'}
          isActive={room?.isActive ?? false}
        />

        {/* Task 44 — Cross-Session Continuity: collapsible card showing
            the student's last lesson note, homework, and a suggested
            starting widget. Hidden automatically if the room has no
            student participant or no previous sessions. */}
        <SessionResume
          roomId={roomId}
          onStartWidget={handleStartWidget}
        />

        {/* Connection Status — bottom-left overlay on whiteboard */}
        <ConnectionStatus />

        {/* Auto-Save Indicator — bottom-center overlay */}
        <AutoSaveIndicator status={autoSaveStatus} />

        {/* Widget Toggle Buttons — top-right overlay */}
        <WidgetToggleBar />

        {/* Raise Hand — positioned via CSS (widgets.css responsive) */}
        <div className="raise-hand-wrapper">
          <RaiseHandButton />
        </div>

        {/* Session Controls — bottom-right overlay */}
        <SessionControls
          isActive={room?.isActive ?? false}
          onEndSession={handleEndSession}
        />
      </div>

      {/* Right Widget Panel */}
      <WidgetPanel roomId={roomId} />
    </div>
  )
}
