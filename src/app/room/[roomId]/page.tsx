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
import { LessonRecorder } from '@/components/room/recording/LessonRecorder'
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
  const [studentRecording, setStudentRecording] = useState(false)

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

        {/* Room Info Bar — top-left overlay */}
        <RoomInfoBar
          subject={room?.subject || 'Room'}
          isActive={room?.isActive ?? false}
        />

        {/* Connection Status — bottom-left overlay on whiteboard */}
        <ConnectionStatus />

        {/* Auto-Save Indicator — bottom-center overlay */}
        <AutoSaveIndicator status={autoSaveStatus} />

        {/* Widget Toggle Buttons — top-right overlay */}
        <WidgetToggleBar />

        {/* Lesson Recorder — top-right overlay (next to widget toggles) */}
        <div style={{
          position: 'absolute', top: 12, right: 200, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <LessonRecorder
            roomId={roomId}
            onRecordingStateChange={setStudentRecording}
          />
        </div>

        {/* Recording indicator — shown to tutor when student is recording */}
        {studentRecording && (
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 20,
            background: '#dc2626', color: 'white', fontSize: 12, fontWeight: 600,
            boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
            animation: 'pulse 2s infinite',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
            Student is recording
          </div>
        )}

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
