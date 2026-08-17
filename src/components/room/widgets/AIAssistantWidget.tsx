'use client'

import { useState, useRef, useEffect } from 'react'

export function AIAssistantWidget() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const AI_URL = process.env.NEXT_PUBLIC_AI_PROXY_URL

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    const content = input.trim()
    setInput('')

    setMessages(prev => [...prev, { role: 'user', content }])
    setIsThinking(true)
    setError(null)

    if (!AI_URL) {
      setIsThinking(false)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'AI Assistant is not configured yet. The VPS AI proxy needs to be deployed first. Coming soon!',
      }])
      return
    }

    try {
      const res = await fetch(`${AI_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          context: 'tutoring-assistant',
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply || data.message || 'No response',
        }])
      }
    } catch {
      setError('Failed to reach AI proxy')
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <div className="widget-content widget-ai">
      <div className="ai-messages">
        {messages.length === 0 && (
          <div className="ai-empty">
            <div className="ai-empty-icon">🤖</div>
            <div className="ai-empty-title">AI Tutoring Assistant</div>
            <div className="ai-empty-desc">
              Ask me about equations, concepts, or get help explaining topics to your student.
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={['ai-bubble', msg.role === 'user' ? 'ai-bubble-user' : 'ai-bubble-assistant'].join(' ')}
          >
            <div className="ai-bubble-content">{msg.content}</div>
          </div>
        ))}
        {isThinking && (
          <div className="ai-bubble ai-bubble-assistant">
            <div className="ai-thinking">Thinking...</div>
          </div>
        )}
        {error && (
          <div className="ai-error">{error}</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="chat-input-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the AI assistant..."
          className="chat-input"
          disabled={isThinking}
        />
        <button type="submit" className="chat-send-btn" disabled={!input.trim() || isThinking}>
          {isThinking ? '...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
