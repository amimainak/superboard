// ============================================================
// Superboard — Chat Widget
// Real-time chat using Supabase ChatMessage table
// Batch 4: file attachment, pin messages, unread count
// Batch 5: delete messages, mute indicator, relative timestamps
// ============================================================

// -- Chat message delete RLS:
// Add to setup_supabase.js CREATE_RLS:
// CREATE POLICY "chat_sender_delete" ON "ChatMessage" FOR DELETE USING (
//   "senderLabel" IN (
//     SELECT COALESCE(name, 'Tutor') FROM "User" WHERE "id" = auth.uid()::text
//   )
// );

'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface ChatMessage {
  id: string
  senderLabel: string
  content: string
  createdAt: string
  fileUrl?: string | null
  isPinned?: boolean | null
}

interface ChatWidgetProps {
  roomId: string
  onUnreadCount?: (count: number) => void
}

const sbAny = (sb: any) => sb as any

/** Convert an ISO date string to a relative time label (e.g. "2m ago", "just now") */
function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  if (diffMs < 0) return 'just now'
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 10) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function ChatWidget({ roomId, onUnreadCount }: ChatWidgetProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [senderName, setSenderName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [mutedUntil, setMutedUntil] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isAtBottomRef = useRef(true)

  // Tick every 30s so relative timestamps update
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(interval)
  }, [])

  // Prompt for display name once on mount
  useEffect(() => {
    const stored = localStorage.getItem('superboard-chat-name')
    if (stored) {
      setSenderName(stored)
    } else {
      const name = prompt('Enter your display name:', 'Tutor')
      const finalName = name?.trim() || 'Tutor'
      setSenderName(finalName)
      localStorage.setItem('superboard-chat-name', finalName)
    }
  }, [])

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await sbAny(supabase)
        .from('ChatMessage')
        .select('id, senderLabel, content, createdAt, fileUrl, isPinned')
        .eq('roomId', roomId)
        .order('createdAt', { ascending: true })
        .limit(100)
      if (data) {
        setMessages(data)
      }
    }
    loadMessages()
  }, [roomId, supabase])

  // Subscribe to new messages in real-time
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${roomId}`)
      .on('postgres_changes' as any, {
        event: 'INSERT',
        schema: 'public' as any,
        table: 'ChatMessage',
        filter: `roomId=eq.${roomId}`,
      }, (payload: { new: ChatMessage }) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
      })
      .on('postgres_changes' as any, {
        event: 'UPDATE',
        schema: 'public' as any,
        table: 'ChatMessage',
        filter: `roomId=eq.${roomId}`,
      }, (payload: { new: ChatMessage }) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === payload.new.id ? { ...m, isPinned: payload.new.isPinned } : m))
        )
      })
      .on('postgres_changes' as any, {
        event: 'DELETE',
        schema: 'public' as any,
        table: 'ChatMessage',
        filter: `roomId=eq.${roomId}`,
      }, (payload: { old: { id: string } }) => {
        setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  // Track scroll position to determine if user is at bottom
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const threshold = 60
    isAtBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    if (isAtBottomRef.current) {
      onUnreadCount?.(0)
    }
  }, [onUnreadCount])

  // Auto-scroll to bottom
  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const isMuted = mutedUntil !== null && Date.now() < mutedUntil
  const muteRemaining = isMuted ? Math.max(0, Math.ceil((mutedUntil! - Date.now()) / 1000)) : 0
  const muteDisplay = `${Math.floor(muteRemaining / 60)}:${String(muteRemaining % 60).padStart(2, '0')}`

  // Tick mute timer every second
  useEffect(() => {
    if (!isMuted) return
    const interval = setInterval(() => {
      setNow(Date.now()) // re-render to update timer
    }, 1000)
    return () => clearInterval(interval)
  }, [isMuted, mutedUntil])

  const handleMuteToggle = () => {
    if (isMuted) {
      setMutedUntil(null)
    } else {
      setMutedUntil(Date.now() + 5 * 60 * 1000)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !senderName || isMuted) return
    const content = input.trim()
    setInput('')
    await sbAny(supabase).from('ChatMessage').insert({
      roomId,
      senderLabel: senderName,
      content,
    })
  }

  // File upload handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (isMuted) {
      alert('You are currently muted and cannot send files.')
      e.target.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Only image files are supported for now.')
      e.target.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB.')
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      await sbAny(supabase).from('ChatMessage').insert({
        roomId,
        senderLabel: senderName,
        content: `📷 ${file.name}`,
        fileUrl: dataUrl,
      })
    } catch (err) {
      console.error('File upload failed:', err)
      alert('Failed to send image.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // Toggle pin on a message (tutor's own messages only)
  const handleTogglePin = async (msg: ChatMessage) => {
    const newPinned = !msg.isPinned
    await sbAny(supabase)
      .from('ChatMessage')
      .update({ isPinned: newPinned })
      .eq('id', msg.id)

    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, isPinned: newPinned } : m))
    )
  }

  // Delete own message
  const handleDeleteMessage = async (msg: ChatMessage) => {
    if (!confirm('Delete this message?')) return
    await sbAny(supabase).from('ChatMessage').delete().eq('id', msg.id)
    setMessages((prev) => prev.filter((m) => m.id !== msg.id))
  }

  const canSend = input.trim().length > 0 && !uploading && !isMuted

  return (
    <div className="widget-content widget-chat">
      {/* Mute banner */}
      {isMuted && (
        <div style={{
          padding: '6px 12px',
          background: 'rgba(239, 68, 68, 0.12)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 12, color: '#fca5a5', flexShrink: 0,
        }}>
          <span>🔇 You are muted for {muteDisplay}</span>
          <button
            onClick={handleMuteToggle}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 4, padding: '2px 8px', fontSize: 11,
              color: '#fca5a5', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Unmute
          </button>
        </div>
      )}
      <div className="widget-messages" ref={messagesContainerRef} onScroll={handleScroll}>
        {messages.map((msg) => {
          const isOwn = msg.senderLabel === senderName
          return (
            <div
              key={msg.id}
              className={[
                'chat-bubble',
                isOwn ? 'chat-bubble-self' : 'chat-bubble-other',
              ].join(' ')}
            >
              <div className="chat-bubble-header">
                <span className="chat-bubble-sender">{msg.senderLabel}</span>
                <span style={{ fontSize: 10, color: '#475569', marginLeft: 4 }}>
                  {timeAgo(msg.createdAt)}
                </span>
                {isOwn && (
                  <button
                    onClick={() => handleTogglePin(msg)}
                    className="chat-pin-btn"
                    title={msg.isPinned ? 'Unpin message' : 'Pin message'}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '0 2px', fontSize: 11, lineHeight: 1, opacity: 0.5,
                      transition: 'opacity 0.15s ease',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.5' }}
                  >
                    📌
                  </button>
                )}
                {isOwn && (
                  <button
                    onClick={() => handleDeleteMessage(msg)}
                    title="Delete message"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '0 2px', opacity: 0.4, transition: 'opacity 0.15s ease',
                      display: 'flex', alignItems: 'center',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.4' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                )}
                {msg.isPinned && (
                  <span className="chat-pinned-badge">Pinned</span>
                )}
              </div>
              <div className="chat-bubble-text">
                {msg.content}
                {msg.fileUrl && (
                  <div style={{ marginTop: 6 }}>
                    <img
                      src={msg.fileUrl}
                      alt="Shared image"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 200,
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="chat-input-form">
        <button
          type="button"
          onClick={handleMuteToggle}
          title={isMuted ? 'Unmute' : 'Mute for 5 minutes'}
          style={{
            width: 34, height: 34, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isMuted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)'}`,
            color: isMuted ? '#fca5a5' : '#94a3b8',
            cursor: 'pointer', transition: 'all 0.15s ease', flexShrink: 0,
            fontSize: 14,
          }}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="chat-file-btn"
          title="Attach image (max 10MB)"
          disabled={uploading || isMuted}
          style={{
            width: 34, height: 34, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: (uploading || isMuted) ? 'rgba(100,116,139,0.2)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: (uploading || isMuted) ? '#64748b' : '#94a3b8',
            cursor: (uploading || isMuted) ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease', flexShrink: 0,
          }}
        >
          {uploading ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={uploading ? 'Uploading...' : isMuted ? 'You are muted...' : 'Type a message...'}
          className="chat-input"
          disabled={uploading || isMuted}
        />
        <button type="submit" className="chat-send-btn" disabled={!canSend}>
          Send
        </button>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}