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

// Built-in quick tools that work without external AI proxy
const BUILTIN_TOOLS = [
  {
    id: 'explain',
    label: 'Explain Concept',
    desc: 'Break down a topic into simple steps',
    icon: '💡',
  },
  {
    id: 'example',
    label: 'Generate Examples',
    desc: 'Create practice problems or examples',
    icon: '📝',
  },
  {
    id: 'quiz',
    label: 'Quick Quiz',
    desc: 'Generate quiz questions on a topic',
    icon: '🎯',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    desc: 'Create a concise summary of notes',
    icon: '📋',
  },
] as const

// Simple built-in response templates (no external API needed)
function getBuiltInResponse(toolId: string, topic: string): string {
  const t = topic.trim()
  if (!t) return 'Please specify a topic to work with.'

  switch (toolId) {
    case 'explain':
      return `Here's a structured breakdown of "${t}":\n\n**1. Definition**\n${t} is a fundamental concept that builds on foundational principles. Understanding it requires breaking it into core components.\n\n**2. Key Components**\n• The primary elements that define ${t}\n• How these elements interact with each other\n• The rules or principles that govern these interactions\n\n**3. Why It Matters**\nThis concept is important because it connects to broader themes and real-world applications. Students often find it easier to understand when they can see practical examples.\n\n**4. Common Misconceptions**\n• Confusing the definition with related but different concepts\n• Overlooking the conditions under which this applies\n• Assuming it works the same way in all contexts\n\n💡 **Teaching Tip:** Start with a concrete example before introducing the abstract definition. Use visual aids on the whiteboard to illustrate the key components.`

    case 'example':
      return `Here are practice exercises for "${t}":\n\n**Level 1 — Recall (Easy)**\n1. Identify the basic properties of ${t}.\n2. List three examples of ${t} in everyday life.\n3. True or False: [Basic statement about ${t}]. Explain your answer.\n\n**Level 2 — Application (Medium)**\n4. Given [scenario], apply your knowledge of ${t} to solve the problem.\n5. Compare and contrast ${t} with a related concept.\n6. Create a word problem that involves ${t}.\n\n**Level 3 — Analysis (Hard)**\n7. Explain why [common misconception about ${t}] is incorrect using evidence.\n8. Design an experiment to test a hypothesis about ${t}.\n9. Evaluate the following argument about ${t} — what are its strengths and weaknesses?\n\n💡 Use the whiteboard to work through these with your student!`

    case 'quiz':
      return `Quick Quiz on "${t}":\n\n**Q1.** What is the primary definition of ${t}?\n   a) [Option A]\n   b) [Option B]\n   c) [Option C]\n   d) [Option D]\n\n**Q2.** Which of the following is NOT related to ${t}?\n   a) [Related concept]\n   b) [Related concept]\n   c) [Unrelated concept]\n   d) [Related concept]\n\n**Q3.** Short Answer: Explain ${t} in your own words using an example.\n\n**Q4.** True or False: [Statement about ${t}].\n\n**Q5.** If [condition involving ${t}], then what happens? Explain your reasoning.\n\n💡 Tip: Use the Assessment widget to create a graded version of this quiz!`

    case 'summarize':
      return `Summary Notes — "${t}":\n\n**Key Points:**\n• ${t} involves several interconnected ideas\n• The main principle can be stated simply\n• Understanding builds from basic to advanced concepts\n\n**Important Terms:**\n• Term 1 — definition and relevance\n• Term 2 — definition and relevance\n• Term 3 — definition and relevance\n\n**Formulas / Key Relationships:**\n• [Primary formula or relationship]\n• [Secondary formula or relationship]\n\n**Things to Remember:**\n1. The most common mistake students make\n2. A helpful mnemonic or trick\n3. Connection to the next topic in the curriculum\n\n💡 Draw a concept map on the whiteboard to visually connect these ideas!`

    default:
      return 'Select a tool above and enter a topic to get started.'
  }
}

export function AIAssistantWidget({ roomId: _roomId }: AIAssistantWidgetProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const addElement = useWhiteboardStore((s) => s.addElement)
  const camera = useWhiteboardStore((s) => s.camera)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<string | null>(null)
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

  const handleBuiltInTool = (toolId: string) => {
    if (!input.trim()) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Type a topic in the input field below, then the tool will generate content for it.' }])
      return
    }
    const topic = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: `[${BUILTIN_TOOLS.find(t => t.id === toolId)?.label || toolId}] ${topic}` }])
    setIsThinking(true)
    setError(null)
    // Simulate thinking delay for natural feel
    setTimeout(() => {
      const response = getBuiltInResponse(toolId, topic)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
      setIsThinking(false)
      setActiveTool(null)
    }, 600 + Math.random() * 800)
  }

  const handleSend = async () => {
    if (!input.trim()) return
    const content = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content }])
    setIsThinking(true)
    setError(null)

    // If a built-in tool is active, use it
    if (activeTool) {
      const toolId = activeTool
      setActiveTool(null)
      setTimeout(() => {
        const response = getBuiltInResponse(toolId, content)
        setMessages(prev => [...prev, { role: 'assistant', content: response }])
        setIsThinking(false)
      }, 600 + Math.random() * 800)
      return
    }

    // Try external AI proxy
    if (!AI_URL) {
      setIsThinking(false)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Use the quick tools above to get instant help with explanations, examples, quizzes, and summaries — no setup required. For full AI chat, the AI proxy needs to be configured by your administrator.' }])
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
  const dkTextStrong = isDark ? '#e2e8f0' : '#1e293b'
  const rootCls = 'widget-content widget-ai ' + (isDark ? '' : 'widget-ai-light')

  return (
    <div className={rootCls} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Quick Tools Section */}
      <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 6 }}>
          Quick Tools (no setup needed)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
          {BUILTIN_TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(activeTool === tool.id ? null : tool.id)
              }}
              style={{
                padding: '6px 8px', borderRadius: 6, fontSize: 11, textAlign: 'left', cursor: 'pointer',
                background: activeTool === tool.id
                  ? 'rgba(99,102,241,0.15)'
                  : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${activeTool === tool.id ? 'rgba(99,102,241,0.4)' : dkBorder}`,
                color: activeTool === tool.id ? '#a5b4fc' : dkTextStrong,
                transition: 'all 0.15s',
              }}
              title={tool.desc}
            >
              <span style={{ marginRight: 4 }}>{tool.icon}</span> {tool.label}
            </button>
          ))}
        </div>
        {activeTool && (
          <div style={{ fontSize: 10, color: '#a5b4fc', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            Type a topic below and press Enter or Send
          </div>
        )}

        {/* AI Canvas Widgets */}
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 6, marginTop: 2 }}>
          AI Canvas Widgets
        </div>
        {AI_CANVAS_WIDGETS.map(w => (
          <div key={w.kind} style={{ padding: '8px 10px', borderRadius: 6, marginBottom: 4, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: dkTextStrong, marginBottom: 2 }}>
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

      {/* Messages area */}
      <div className={'ai-messages ' + (isDark ? '' : 'ai-messages-light')} style={{ flex: 1, minHeight: 0 }}>
        {messages.length === 0 && (
          <div className={'ai-empty ' + (isDark ? '' : 'ai-empty-light')}>
            <div className="ai-empty-icon" style={{ fontSize: 24, lineHeight: 1 }}>AI</div>
            <div className={'ai-empty-title ' + (isDark ? '' : 'ai-empty-title-light')}>AI Tutoring Assistant</div>
            <div className={'ai-empty-desc ' + (isDark ? '' : 'ai-empty-desc-light')}>
              {AI_URL
                ? 'Ask me about equations, concepts, or get help explaining topics to your student.'
                : 'Use the quick tools above for instant help. Select a tool, type a topic, and get structured content — no AI setup required.'
              }
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={['ai-bubble', msg.role === 'user' ? ('ai-bubble-user ' + (isDark ? '' : 'ai-bubble-user-light')) : ('ai-bubble-assistant ' + (isDark ? '' : 'ai-bubble-assistant-light'))].join(' ')}>
            <div className="ai-bubble-content" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
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

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className={'chat-input-form ' + (isDark ? '' : 'chat-input-form-light')}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={activeTool ? `Topic for ${BUILTIN_TOOLS.find(t => t.id === activeTool)?.label || 'tool'}...` : 'Ask the AI assistant...'} className={'chat-input ' + (isDark ? '' : 'chat-input-light')} disabled={isThinking} />
        <button type="submit" className={'chat-send-btn ' + (isDark ? '' : 'chat-send-btn-light')} disabled={!input.trim() || isThinking}>{isThinking ? '...' : 'Send'}</button>
      </form>
    </div>
  )
}
