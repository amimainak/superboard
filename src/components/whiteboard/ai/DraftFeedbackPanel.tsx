'use client'

import { useState } from 'react'

interface Props {
  content: string
  isDark: boolean
  onClose: () => void
}

interface FeedbackItem {
  type: string
  message: string
  detail: string
}

export default function DraftFeedbackPanel({ content, isDark, onClose }: Props) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bg = isDark ? '#1e293b' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const textCol = isDark ? '#f1f5f9' : '#0f172a'
  const subCol = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'

  const handleCheck = async () => {
    setLoading(true)
    setError(null)
    setFeedback([])
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_work', content }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error) }
      else if (data.result && Array.isArray(data.result.feedback)) {
        setFeedback(data.result.feedback)
      } else if (data.result && data.result.raw) {
        // Parse raw text into feedback items
        const lines = data.result.raw.split('\n').filter((l: string) => l.trim())
        setFeedback(lines.map((l: string) => ({ type: 'suggestion', message: l.replace(/^[-*]\s*/, ''), detail: '' })))
      } else {
        setError('Unexpected response format')
      }
    } catch {
      setError('Failed to check work')
    }
    setLoading(false)
  }

  const typeConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
    error: { color: '#fca5a5', bg: 'rgba(239,68,68,0.1)', icon: '✕', label: 'Error' },
    suggestion: { color: '#fcd34d', bg: 'rgba(234,179,8,0.1)', icon: '!', label: 'Suggestion' },
    praise: { color: '#86efac', bg: 'rgba(34,197,94,0.1)', icon: '✓', label: 'Well Done' },
  }

  const counts = { error: feedback.filter(f => f.type === 'error').length, suggestion: feedback.filter(f => f.type === 'suggestion').length, praise: feedback.filter(f => f.type === 'praise').length }

  return (
    <div style={{
      position: 'absolute', bottom: '100%', right: 0, marginBottom: 6,
      background: bg, border: '1px solid ' + border,
      borderRadius: 12, padding: 16, width: 400,
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 1001,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: textCol }}>Check Work</div>
          <div style={{ fontSize: 11, color: subCol, marginTop: 2 }}>AI reviews the selected content for errors and improvements</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: subCol, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>&times;</button>
      </div>

      {!feedback.length && (
        <button
          onClick={handleCheck}
          disabled={loading}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8,
            background: loading ? 'rgba(5,150,105,0.5)' : 'linear-gradient(135deg, #059669, #0891b2)',
            color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >{loading ? 'Analyzing...' : 'Check Work'}</button>
      )}

      {error && <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: 12, marginBottom: 8 }}>{error}</div>}

      {feedback.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button onClick={handleCheck} disabled={loading} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid ' + border, background: 'transparent', color: textCol, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Rechecking...' : 'Recheck'}
            </button>
            <div style={{ flex: 1, display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
              {counts.error > 0 && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>{counts.error} error{counts.error !== 1 ? 's' : ''}</span>}
              {counts.suggestion > 0 && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(234,179,8,0.1)', color: '#fcd34d' }}>{counts.suggestion} suggestion{counts.suggestion !== 1 ? 's' : ''}</span>}
              {counts.praise > 0 && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.1)', color: '#86efac' }}>{counts.praise} praise</span>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
            {feedback.map((item, i) => {
              const config = typeConfig[item.type] || typeConfig.suggestion
              return (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: config.bg, borderLeft: '3px solid ' + config.color }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: item.detail ? 4 : 0 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 4, background: config.color + '22', color: config.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{config.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: config.color, textTransform: 'uppercase', letterSpacing: 0.3 }}>{config.label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: textCol, lineHeight: 1.5, marginLeft: 28 }}>{item.message}</div>
                  {item.detail && <div style={{ fontSize: 12, color: subCol, lineHeight: 1.4, marginLeft: 28, marginTop: 4 }}>{item.detail}</div>}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}