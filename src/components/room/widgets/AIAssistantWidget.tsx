'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { getDefaultWidgetConfig, getWidgetDefaultSize, WIDGET_KIND_LABELS } from '@/components/whiteboard/CanvasWidgets'
import { generateId } from '@/lib/whiteboard/utils'
import type { WidgetElement } from '@/lib/whiteboard/types'

interface AIAssistantWidgetProps {
  roomId?: string
}

const AI_CANVAS_WIDGETS = [
  { kind: 'ai-generate-similar', desc: 'Get alternative versions with different wording or examples' },
  { kind: 'ai-reading-level', desc: 'Adapt text complexity for different grade levels' },
  { kind: 'ai-draft-feedback', desc: 'AI-powered writing feedback with scores' },
] as const

export function AIAssistantWidget({ roomId: _roomId }: AIAssistantWidgetProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const addElement = useWhiteboardStore((s) => s.addElement)
  const camera = useWhiteboardStore((s) => s.camera)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const AI_URL = process.env.NEXT_PUBLIC_AI_PROXY_URL

  const addToBoard = useCallback((widgetKind: string) => {
    const size = getWidgetDefaultSize(widgetKind)
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    const cx = (vw / 2 - camera.x) / camera.zoom
    const cy = ((vh / 2 - 44) - camera.y) / camera.zoom
    const el: WidgetElement = {
      id: generateId(), type: 'widget', widgetKind,
      config: getDefaultWidgetConfig(widgetKind),
      x: cx - size.width / 2, y: cy - size.height / 2,
      width: size.width, height: size.height,
      rotation: 0, opacity: 1,
      strokeColor: isDark ? '#334155' : '#e2e8f0',
      fillColor: isDark ? '#0f172a' : '#ffffff',
      strokeWidth: 1, locked: false, pageIndex: 0,
    }
    addElement(el)
  }, [addElement, camera, isDark])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    const content = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content }])
    setIsThinking(true)
    setError(null)
    if (!AI_URL) {
      setIsThinking(false)
      setMessages(prev => [...prev, { role: 'assistant', content: 'AI chat is not configured yet. Coming soon!' }])
      return
    }
    try {
      const res = await fetch(AI_URL + '/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, context: 'tutoring-assistant' }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.message || 'No response' }])
    } catch { setError('Failed to reach AI proxy') } finally { setIsThinking(false) }
  }

  const dkBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const dkText = isDark ? '#94a3b8' : '#475569'
  const rootCls = 'widget-content widget-ai ' + (isDark ? '' : 'widget-ai-light')

  return (
    <div className={rootCls} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 8 }}>
          AI Canvas Tools
        </div>
        {AI_CANVAS_WIDGETS.map(w => (
          <div key={w.kind} style={{ padding: '8px 10px', borderRadius: 6, marginBottom: 4, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: 2 }}>
                  {WIDGET_KIND_LABELS[w.kind] || w.kind}
                </div>
                <div style={{ fontSize: 10, color: dkText, lineHeight: 1.4 }}>{w.desc}</div>
              </div>
              <button
                onClick={() => addToBoard(w.kind)}
                style={{ padding: '3px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 10 }}
                title={'Place ' + (WIDGET_KIND_LABELS[w.kind] || w.kind) + ' on the board'}
              >+ Board</button>
            </div>
          </div>
        ))}
      </div>
      <div className={'ai-messages ' + (isDark ? '' : 'ai-messages-light')} style={{ flex: 1, minHeight: 0 }}>
        {messages.length === 0 && (
          <div className={'ai-empty ' + (isDark ? '' : 'ai-empty-light')}>
            <div className="ai-empty-icon" style={{ fontSize: 24, lineHeight: 1 }}>AI</div>
            <div className={'ai-empty-title ' + (isDark ? '' : 'ai-empty-title-light')}>AI Tutoring Assistant</div>
            <div className={'ai-empty-desc ' + (isDark ? '' : 'ai-empty-desc-light')}>Ask me about equations, concepts, or get help explaining topics to your student.</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={['ai-bubble', msg.role === 'user' ? ('ai-bubble-user ' + (isDark ? '' : 'ai-bubble-user-light')) : ('ai-bubble-assistant ' + (isDark ? '' : 'ai-bubble-assistant-light'))].join(' ')}>
            <div className="ai-bubble-content">{msg.content}</div>
          </div>
        ))}
        {isThinking && (
          <div className={'ai-bubble ai-bubble-assistant ' + (isDark ? '' : 'ai-bubble-assistant-light')}>
            <div className={'ai-thinking ' + (isDark ? '' : 'ai-thinking-light')}>Thinking...</div>
          </div>
        )}
        {error && <div className="ai-error">{error}</div>}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className={'chat-input-form ' + (isDark ? '' : 'chat-input-form-light')}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask the AI assistant..." className={'chat-input ' + (isDark ? '' : 'chat-input-light')} disabled={isThinking} />
        <button type="submit" className={'chat-send-btn ' + (isDark ? '' : 'chat-send-btn-light')} disabled={!input.trim() || isThinking}>{isThinking ? '...' : 'Send'}</button>
      </form>
    </div>
  )
}
