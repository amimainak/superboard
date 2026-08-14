'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  WidgetPanel,
  WidgetToggleBar,
  SessionControls,
  RoomInfoBar,
} from '@/components/room/widgets'
import '@/components/room/widgets/widgets.css'
import { useWidgetStore } from '@/lib/room/widget-store'

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

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveTrigger, setSaveTrigger] = useState(0)

  // Widget panel state (from Zustand)
  const panelVisible = useWidgetStore((s) => s.panelVisible)

  useEffect(() => {
    const loadRoom = async () => {
      const res = await fetch(`/api/rooms/${roomId}`)
      const data = await res.json()
      if (data.error) {
        router.push('/dashboard')
        return
      }
      setRoom(data)
      setLoading(false)
    }
    loadRoom()
  }, [roomId, router])

  const handleSave = useCallback(() => {
    setSaveTrigger(prev => prev + 1)
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

  return (
    <div className="room-layout">
      {/* Main whiteboard area */}
      <div className="room-main">
        <WhiteboardClient
          roomId={roomId}
          onSaveRequest={handleSave}
          saveStatus={saveTrigger > 0 ? `Save #${saveTrigger}` : ''}
        />

        {/* Room Info Bar — top-left overlay */}
        <RoomInfoBar
          subject={room?.subject || 'Room'}
          isActive={room?.isActive ?? false}
        />

        {/* Widget Toggle Buttons — top-right overlay */}
        <WidgetToggleBar />

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
