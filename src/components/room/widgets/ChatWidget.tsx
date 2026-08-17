// ============================================================
// Superboard — Chat Widget
// Real-time chat using Supabase ChatMessage table
// Batch 4: file attachment, pin messages, unread count
// ============================================================

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

export function ChatWidget({ roomId, onUnreadCount }: ChatWidgetProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [senderName, setSenderName] = useState('')
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isAtBottomRef = useRef(true)

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !senderName) return
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

  const canSend = input.trim().length > 0 && !uploading

  return (
    <div className="widget-content widget-chat">
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
          onClick={() => fileInputRef.current?.click()}
          className="chat-file-btn"
          title="Attach image (max 10MB)"
          disabled={uploading}
          style={{
            width: 34, height: 34, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: uploading ? 'rgba(100,116,139,0.2)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: uploading ? '#64748b' : '#94a3b8',
            cursor: uploading ? 'not-allowed' : 'pointer',
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
          placeholder={uploading ? 'Uploading...' : 'Type a message...'}
          className="chat-input"
          disabled={uploading}
        />
        <button type="submit" className="chat-send-btn" disabled={!canSend}>
          Send
        </button>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
