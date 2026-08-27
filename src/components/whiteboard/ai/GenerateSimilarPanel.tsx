'use client'

import { useState } from 'react'

interface Props {
  content: string
  subject: string
  isDark: boolean
  onClose: () => void
  onAddToCanvas: (text: string) => void
}

interface Variation {
  content: string
  label: string
}

export default function GenerateSimilarPanel({ content, subject, isDark, onClose, onAddToCanvas }: Props) {
  const [variations, setVariations] = useState<Variation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [added, setAdded] = useState<Set<number>>(new Set())

  const bg = isDark ? '#1e293b' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const textCol = isDark ? '#f1f5f9' : '#0f172a'
  const subCol = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_similar', content, options: { subject } }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error) }
      else if (data.result && data.result.variations) {
        setVariations(data.result.variations)
      } else if (data.result && data.result.raw) {
        // Fallback: try to parse raw text into variations
        const lines = data.result.raw.split('\n').filter((l: string) => l.trim())
        setVariations(lines.slice(0, 3).map((l: string, i: number) => ({ content: l.replace(/^\d+[.\)]\s*/, ''), label: 'Variation ' + (i + 1) })))
      } else {
        setError('Unexpected response format')
      }
    } catch {
      setError('Failed to generate variations')
    }
    setLoading(false)
  }

  const handleAdd = (v: Variation, index: number) => {
    onAddToCanvas(v.content)
    setAdded(prev => new Set([...prev, index]))
  }

  const handleAddAll = () => {
    variations.forEach((v, i) => onAddToCanvas(v.content))
    setAdded(new Set(variations.map((_, i) => i)))
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
          <div style={{ fontSize: 15, fontWeight: 600, color: textCol }}>Generate Similar</div>
          <div style={{ fontSize: 11, color: subCol, marginTop: 2 }}>Creates practice variations at the same difficulty</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: subCol, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>&times;</button>
      </div>

      {!variations.length && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8,
            background: loading ? 'rgba(5,150,105,0.5)' : 'linear-gradient(135deg, #059669, #0891b2)',
            color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >{loading ? 'Generating...' : 'Generate 3 Variations'}</button>
      )}

      {error && <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: 12, marginBottom: 8 }}>{error}</div>}

      {variations.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button onClick={handleGenerate} disabled={loading} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid ' + border, background: 'transparent', color: textCol, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Regenerating...' : 'Regenerate'}
            </button>
            <button onClick={handleAddAll} disabled={added.size === variations.length} style={{ flex: 1, padding: 8, borderRadius: 8, border: 'none', background: added.size === variations.length ? 'rgba(5,150,105,0.3)' : 'linear-gradient(135deg, #059669, #0891b2)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: added.size === variations.length ? 'not-allowed' : 'pointer' }}>
              {added.size === variations.length ? 'All Added' : 'Add All to Board'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
            {variations.map((v, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 8, background: cardBg, border: '1px solid ' + border }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#059669', marginBottom: 4, flexShrink: 0 }}>{v.label}</div>
                  <button
                    onClick={() => handleAdd(v, i)}
                    disabled={added.has(i)}
                    style={{
                      padding: '3px 10px', borderRadius: 6, flexShrink: 0, fontSize: 11, fontWeight: 600,
                      border: 'none',
                      background: added.has(i) ? 'rgba(5,150,105,0.2)' : '#059669',
                      color: added.has(i) ? '#34d399' : '#fff',
                      cursor: added.has(i) ? 'default' : 'pointer',
                    }}
                  >{added.has(i) ? 'Added' : '+ Add'}</button>
                </div>
                <div style={{ fontSize: 13, color: textCol, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{v.content}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}