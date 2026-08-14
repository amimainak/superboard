'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

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

// Chat message widget
function ChatWidget({ roomId }: { roomId: string }) {
  const supabase = getSupabaseBrowserClient()
  const [messages, setMessages] = useState<Array<{ id: string; senderLabel: string; content: string; createdAt: string }>>([])
  const [input, setInput] = useState('')
  const [senderName, setSenderName] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const name = prompt('Enter your display name:', 'Tutor')
    setSenderName(name || 'Tutor')
  }, [])

  useEffect(() => {
    const loadMessages = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('ChatMessage')
        .select('id, senderLabel, content, createdAt')
        .eq('roomId', roomId)
        .order('createdAt', { ascending: true })
        .limit(100)
      if (data) setMessages(data)
    }
    loadMessages()
  }, [roomId, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setInput('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('ChatMessage').insert({
      roomId,
      senderLabel: senderName,
      content: input.trim(),
    })
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderLabel: senderName,
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }])
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      <div style={{
        padding: '12px 16px', fontSize: 13, fontWeight: 600,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        color: '#e2e8f0',
      }}>
        Chat
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            padding: '6px 10px', borderRadius: 8, maxWidth: '85%',
            background: msg.senderLabel === senderName
              ? 'rgba(5,150,105,0.15)'
              : 'rgba(255,255,255,0.05)',
            alignSelf: msg.senderLabel === senderName ? 'flex-end' : 'flex-start',
          }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2, fontWeight: 600 }}>
              {msg.senderLabel}
            </div>
            <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.4 }}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{
        padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', gap: 8,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#f1f5f9', fontSize: 13, outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 14px', borderRadius: 8,
            background: '#059669', color: 'white',
            fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeWidgets, setActiveWidgets] = useState<string[]>([])
  const [saveStatus, setSaveStatus] = useState<string>('')

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

  const toggleWidget = (widget: string) => {
    setActiveWidgets(prev =>
      prev.includes(widget) ? prev.filter(w => w !== widget) : [...prev, widget]
    )
  }

  const handleSave = useCallback(async () => {
    setSaveStatus('Saving...')
    try {
      const res = await fetch(`/api/rooms/${roomId}/pages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: [] }), // Will be filled by whiteboard store
      })
      if (res.ok) {
        setSaveStatus('Saved')
        setTimeout(() => setSaveStatus(''), 2000)
      } else {
        setSaveStatus('Save failed')
      }
    } catch {
      setSaveStatus('Save failed')
    }
  }, [roomId])

  const handleEndSession = async () => {
    if (!confirm('End this session? The room will be deactivated.')) return
    await fetch(`/api/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    })
    router.push('/dashboard')
  }

  if (loading) return null

  const isChatOpen = activeWidgets.includes('chat')
  const isParticipantsOpen = activeWidgets.includes('participants')

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#0f172a',
    }}>
      {/* Main whiteboard area */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <WhiteboardClient roomId={roomId} onSave={handleSave} saveStatus={saveStatus} />

        {/* Widget Toggle Bar — floating on right side */}
        <div style={{
          position: 'absolute', top: 52, right: 8, zIndex: 1000,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <WidgetToggle
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
            active={isChatOpen}
            onClick={() => toggleWidget('chat')}
            title="Chat"
          />
          <WidgetToggle
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
            active={isParticipantsOpen}
            onClick={() => toggleWidget('participants')}
            title="Participants"
          />
        </div>

        {/* Session Controls — floating bottom-right */}
        <div style={{
          position: 'absolute', bottom: 52, right: 8, zIndex: 1000,
          display: 'flex', gap: 6,
        }}>
          <button
            onClick={handleEndSession}
            style={{
              padding: '8px 16px', borderRadius: 8,
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', fontSize: 12, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            End Session
          </button>
        </div>

        {/* Room Info Bar */}
        <div style={{
          position: 'absolute', top: 52, left: 56, zIndex: 999,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 12px', borderRadius: 6,
          background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: room?.isActive ? '#22c55e' : '#64748b',
          }} />
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            {room?.subject || 'Room'}
          </span>
        </div>
      </div>

      {/* Right Widget Panel */}
      {(isChatOpen || isParticipantsOpen) && (
        <div style={{
          width: 320, minWidth: 320,
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column',
        }}>
          {isChatOpen && <ChatWidget roomId={roomId} />}
          {isParticipantsOpen && (
            <div style={{ padding: 20, color: '#94a3b8', fontSize: 13 }}>
              <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0' }}>
                Participants
              </div>
              <div style={{ padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
                <div style={{ color: '#e2e8f0', fontWeight: 500 }}>You (Tutor)</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  Real-time participant sync requires Hocuspocus (coming soon)
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function WidgetToggle({ icon, active, onClick, title }: {
  icon: React.ReactNode
  active: boolean
  onClick: () => void
  title: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36, height: 36, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'rgba(5,150,105,0.2)' : 'rgba(15,23,42,0.8)',
        border: active ? '1px solid rgba(5,150,105,0.4)' : '1px solid rgba(255,255,255,0.08)',
        color: active ? '#34d399' : '#94a3b8',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.15s ease',
      }}
    >
      {icon}
    </button>
  )
}
