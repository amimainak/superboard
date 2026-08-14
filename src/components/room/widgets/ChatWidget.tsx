// ============================================================
// Superboard — Chat Widget
// Real-time chat using Supabase ChatMessage table
// ============================================================

'use client'

import { useEffect, useState, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface ChatMessage {
  id: string
  senderLabel: string
  content: string
  createdAt: string
}

interface ChatWidgetProps {
  roomId: string
}

export function ChatWidget({ roomId }: ChatWidgetProps) {
  const supabase = getSupabaseBrowserClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [senderName, setSenderName] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  // Subscribe to new messages in real-time
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${roomId}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('postgres_changes' as any, {
        event: 'INSERT',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        schema: 'public' as any,
        table: 'ChatMessage',
        filter: `roomId=eq.${roomId}`,
      }, (payload: { new: ChatMessage }) => {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !senderName) return
    const content = input.trim()
    setInput('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('ChatMessage').insert({
      roomId,
      senderLabel: senderName,
      content,
    })
  }

  return (
    <div className="widget-content widget-chat">
      <div className="widget-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={[
              'chat-bubble',
              msg.senderLabel === senderName ? 'chat-bubble-self' : 'chat-bubble-other',
            ].join(' ')}
          >
            <div className="chat-bubble-sender">{msg.senderLabel}</div>
            <div className="chat-bubble-text">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="chat-input-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn" disabled={!input.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
