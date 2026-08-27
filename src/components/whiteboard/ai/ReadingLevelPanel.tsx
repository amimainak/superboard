'use client'

import { useState } from 'react'

interface Props {
  content: string
  isDark: boolean
  onClose: () => void
  onAddToCanvas: (text: string) => void
}

type LevelMode = 'simpler' | 'bullets' | 'advanced'

export default function ReadingLevelPanel({ content, isDark, onClose, onAddToCanvas }: Props) {
  const [mode, setMode] = useState<LevelMode | null>(null)
  const [adapted, setAdapted] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [added, setAdded] = useState(false)

  const bg = isDark ? '#1e293b' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const textCol = isDark ? '#f1f5f9' : '#0f172a'
  const subCol = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'

  const modes: { id: LevelMode; label: string; desc: string; icon: string }[] = [
    { id: 'simpler', label: 'Simplify', desc: '6th-grade reading level', icon: '↓' },
    { id: 'bullets', label: 'Key Bullets', desc: 'Concise bulleted summary', icon: '•' },
    { id: 'advanced', label: 'More Advanced', desc: '10th-12th grade level', icon: '↑' },
  ]

  const handleAdapt = async (selectedMode: LevelMode) => {
    setMode(selectedMode)
    setLoading(true)
    setError(null)
    setAdapted('')
    setAdded(false)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'adapt_reading_level', content, options: { level: selectedMode } }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error) }
      else if (data.result && data.result.adapted) {
        setAdapted(data.result.adapted)
      } else if (data.result && data.result.raw) {
        setAdapted(data.result.raw)
      } else {
        setError('Unexpected response format')
      }
    } catch {
      setError('Failed to adapt text')
    }
    setLoading(false)
  }

  const handleAdd = () => {
    onAddToCanvas(adapted)
    setAdded(true)
  }

  return (
    <div style={{
      position: 'absolute', bottom: '100%', right: 0, marginBottom: 6,
      background: bg, border: '1px solid ' + border,
      borderRadius: 12, padding: 16, width: 380,
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 1001,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: textCol }}>Adapt Reading Level</div>
          <div style={{ fontSize: 11, color: subCol, marginTop: 2 }}>Transform text for different reading levels</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: subCol, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>&times;</button>
      </div>

      {!mode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {modes.map(m => (
            <button
              key={m.id}
              onClick={() => handleAdapt(m.id)}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8, border: '1px solid ' + border,
                background: 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = cardBg}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(5,150,105,0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{m.icon}</span>
              <span style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: textCol }}>{m.label}</div>
                <div style={{ fontSize: 11, color: subCol }}>{m.desc}</div>
              </span>
            </button>
          ))}
        </div>
      )}

      {mode && loading && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid ' + border, borderTopColor: '#059669', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
          <div style={{ fontSize: 13, color: subCol }}>Adapting text...</div>
          <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
        </div>
      )}

      {error && <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: 12, marginBottom: 8 }}>{error}</div>}

      {mode && adapted && !loading && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button onClick={() => setMode(null)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid ' + border, background: 'transparent', color: textCol, fontSize: 12, cursor: 'pointer' }}>
              Back
            </button>
            <button onClick={handleAdd} disabled={added} style={{ flex: 1, padding: 8, borderRadius: 8, border: 'none', background: added ? 'rgba(5,150,105,0.2)' : '#059669', color: added ? '#34d399' : '#fff', fontSize: 12, fontWeight: 600, cursor: added ? 'default' : 'pointer' }}>
              {added ? 'Added to Board' : 'Add to Board'}
            </button>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: cardBg, border: '1px solid ' + border, maxHeight: 250, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#059669', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {mode === 'simpler' ? 'Simplified Version' : mode === 'bullets' ? 'Bullet Summary' : 'Advanced Version'}
            </div>
            <div style={{ fontSize: 13, color: textCol, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{adapted}</div>
          </div>
        </>
      )}
    </div>
  )
}