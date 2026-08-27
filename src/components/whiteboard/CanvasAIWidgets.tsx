'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import type { WidgetElement } from '@/lib/whiteboard/types'

// ============================================================
// Shared types
// ============================================================

interface CanvasWidgetProps {
  element: WidgetElement
  isDark: boolean
}

// ============================================================
// Shared UI primitives (dark/light aware, no CSS modules)
// ============================================================

function AIWidgetShell({ isDark, title, children }: { isDark: boolean; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      height: '100%',
      display: 'flex', flexDirection: 'column',
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#e2e8f0' : '#1e293b',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 13, overflow: 'hidden', borderRadius: 8,
    }}>
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
        fontWeight: 600, fontSize: 12, letterSpacing: 0.3,
        display: 'flex', alignItems: 'center', gap: 6,
        color: isDark ? '#94a3b8' : '#64748b',
        flexShrink: 0,
      }}>
        <span style={{ color: '#34d399', fontSize: 14 }}>✨</span>
        {title}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
        {children}
      </div>
    </div>
  )
}

function AIButton({ onClick, disabled, isDark, variant = 'primary', children }: {
  onClick: () => void; disabled: boolean; isDark: boolean
  variant?: 'primary' | 'secondary'; children: React.ReactNode
}) {
  const isPrimary = variant === 'primary'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        border: isPrimary
          ? '1px solid rgba(5,150,105,0.4)'
          : '1px solid ' + (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'),
        background: isPrimary
          ? 'rgba(5,150,105,0.15)'
          : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        color: isPrimary ? '#34d399' : isDark ? '#cbd5e1' : '#475569',
        transition: 'opacity 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function AIError({ message, isDark }: { message: string; isDark: boolean }) {
  return (
    <div style={{
      padding: '8px 10px', borderRadius: 6, fontSize: 11, lineHeight: 1.5,
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
      color: '#f87171',
    }}>
      {message}
    </div>
  )
}

function AILoading({ isDark }: { isDark: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0', color: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }}>
      <div style={{ width: 16, height: 16, border: '2px solid ' + (isDark ? '#334155' : '#e2e8f0'), borderTopColor: '#34d399', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Generating with AI...
    </div>
  )
}

// ============================================================
// 1. Generate Similar Widget
// ============================================================

interface Variation {
  text: string
  label: string
}

function GenerateSimilarWidget({ element, isDark }: CanvasWidgetProps) {
  const [input, setInput] = useState('')
  const [variations, setVariations] = useState<Variation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const handleGenerate = async () => {
    if (!input.trim() || input.trim().length < 10) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/generate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.trim() }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setVariations(data.variations || [])
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    } catch { /* clipboard may not be available */ }
  }

  return (
    <AIWidgetShell isDark={isDark} title='Generate Similar'>
      <p style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', margin: '0 0 8px', lineHeight: 1.4 }}>
        Paste educational content below and get alternative versions with different wording, examples, or analogies.
      </p>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder='Paste or type content here...'
        rows={4}
        style={{
          width: '100%', boxSizing: 'border-box', padding: 8, borderRadius: 6, fontSize: 12, lineHeight: 1.5,
          resize: 'vertical', fontFamily: 'inherit',
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
          color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <AIButton onClick={handleGenerate} disabled={loading || input.trim().length < 10} isDark={isDark}>
          {loading ? 'Generating...' : 'Generate Variations'}
        </AIButton>
      </div>

      {error && <div style={{ marginTop: 8 }}><AIError message={error} isDark={isDark} /></div>}
      {loading && <AILoading isDark={isDark} />}

      {variations.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {variations.map((v, i) => (
            <div key={i} style={{
              padding: 10, borderRadius: 6,
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 11, color: '#34d399' }}>{v.label}</span>
                <button
                  onClick={() => handleCopy(v.text, i)}
                  style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                    color: copiedIdx === i ? '#34d399' : (isDark ? '#94a3b8' : '#64748b'),
                  }}
                >
                  {copiedIdx === i ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: isDark ? '#cbd5e1' : '#334155' }}>
                {v.text}
              </p>
            </div>
          ))}
        </div>
      )}
      <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
    </AIWidgetShell>
  )
}

// ============================================================
// 2. Reading Level Adapter Widget
// ============================================================

const READING_LEVELS = [
  { value: 'elementary', label: 'Elementary (K-5)' },
  { value: 'middle-school', label: 'Middle School (6-8)' },
  { value: 'high-school', label: 'High School (9-12)' },
  { value: 'college', label: 'College' },
] as const

function ReadingLevelAdapterWidget({ element, isDark }: CanvasWidgetProps) {
  const [input, setInput] = useState('')
  const [targetLevel, setTargetLevel] = useState<string>('middle-school')
  const [mode, setMode] = useState<'simplify' | 'bulletize'>('simplify')
  const [result, setResult] = useState<{
    adapted: string; originalLevel: string; targetLevel: string
    wordCountBefore: number; wordCountAfter: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleAdapt = async () => {
    if (!input.trim() || input.trim().length < 10) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/ai/adapt-reading-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.trim(), targetLevel, mode }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setResult(data)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.adapted)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* */ }
  }

  const pillStyle = (active: boolean) => ({
    padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: active ? 600 : 500, cursor: 'pointer',
    border: active ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
    background: active ? 'rgba(5,150,105,0.15)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    color: active ? '#34d399' : isDark ? '#94a3b8' : '#64748b',
    transition: 'all 0.15s',
  })

  return (
    <AIWidgetShell isDark={isDark} title='Reading Level Adapter'>
      <p style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', margin: '0 0 8px', lineHeight: 1.4 }}>
        Paste text and adapt it to a different reading level. Use Simplify to rewrite, or Bulletize for scannable points.
      </p>

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder='Paste text to adapt...'
        rows={3}
        style={{
          width: '100%', boxSizing: 'border-box', padding: 8, borderRadius: 6, fontSize: 12, lineHeight: 1.5,
          resize: 'vertical', fontFamily: 'inherit',
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
          color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none',
        }}
      />

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button onClick={() => setMode('simplify')} style={pillStyle(mode === 'simplify')}>Simplify</button>
        <button onClick={() => setMode('bulletize')} style={pillStyle(mode === 'bulletize')}>Bulletize</button>
      </div>

      {/* Level selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
        {READING_LEVELS.map(l => (
          <button key={l.value} onClick={() => setTargetLevel(l.value)}
            style={pillStyle(targetLevel === l.value)}>
            {l.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <AIButton onClick={handleAdapt} disabled={loading || input.trim().length < 10} isDark={isDark}>
          {loading ? 'Adapting...' : 'Adapt Text'}
        </AIButton>
      </div>

      {error && <div style={{ marginTop: 8 }}><AIError message={error} isDark={isDark} /></div>}
      {loading && <AILoading isDark={isDark} />}

      {result && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: isDark ? '#64748b' : '#94a3b8' }}>
              {result.originalLevel} → {result.targetLevel}
              {'  |  '}{result.wordCountBefore} → {result.wordCountAfter} words
            </div>
            <button onClick={handleCopy}
              style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                color: copied ? '#34d399' : (isDark ? '#94a3b8' : '#64748b'),
              }}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div style={{
            padding: 10, borderRadius: 6, fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap',
            background: isDark ? 'rgba(5,150,105,0.05)' : 'rgba(5,150,105,0.03)',
            border: '1px solid rgba(5,150,105,0.15)',
            color: isDark ? '#cbd5e1' : '#334155',
          }}>
            {result.adapted}
          </div>
        </div>
      )}
      <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
    </AIWidgetShell>
  )
}

// ============================================================
// 3. Draft Feedback Widget
// ============================================================

function DraftFeedbackWidget({ element, isDark }: CanvasWidgetProps) {
  const [input, setInput] = useState('')
  const [context, setContext] = useState('')
  const [result, setResult] = useState<{
    overall: string; score: number
    items: Array<{ type: string; text: string; severity?: string }>
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!input.trim() || input.trim().length < 20) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/ai/draft-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.trim(), context: context.trim() || undefined }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setResult(data)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const severityColor = (s?: string) => {
    if (s === 'high') return '#f87171'
    if (s === 'medium') return '#fbbf24'
    return '#34d399'
  }

  const typeIcon = (t: string) => {
    if (t === 'strength') return '\u2705'
    if (t === 'improvement') return '\u26A0\uFE0F'
    return '\u{1F4A1}'
  }

  return (
    <AIWidgetShell isDark={isDark} title='Draft Feedback'>
      <p style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', margin: '0 0 8px', lineHeight: 1.4 }}>
        Paste a student draft to get AI-powered writing feedback. Visible to tutor only.
      </p>

      <input
        value={context}
        onChange={e => setContext(e.target.value)}
        placeholder='Assignment context (optional)'
        style={{
          width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: 6, fontSize: 11,
          marginBottom: 6, fontFamily: 'inherit',
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
          color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none',
        }}
      />

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder='Paste student draft here (at least 20 characters)...'
        rows={4}
        style={{
          width: '100%', boxSizing: 'border-box', padding: 8, borderRadius: 6, fontSize: 12, lineHeight: 1.5,
          resize: 'vertical', fontFamily: 'inherit',
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
          color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <AIButton onClick={handleAnalyze} disabled={loading || input.trim().length < 20} isDark={isDark}>
          {loading ? 'Analyzing...' : 'Analyze Draft'}
        </AIButton>
      </div>

      {error && <div style={{ marginTop: 8 }}><AIError message={error} isDark={isDark} /></div>}
      {loading && <AILoading isDark={isDark} />}

      {result && (
        <div style={{ marginTop: 12 }}>
          {/* Score + Overall */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 16, flexShrink: 0,
              background: result.score >= 7 ? 'rgba(5,150,105,0.15)' : result.score >= 4 ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.15)',
              color: result.score >= 7 ? '#34d399' : result.score >= 4 ? '#fbbf24' : '#f87171',
              border: '2px solid ' + (result.score >= 7 ? 'rgba(5,150,105,0.3)' : result.score >= 4 ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)'),
            }}>
              {result.score}/10
            </div>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: isDark ? '#cbd5e1' : '#475569' }}>
              {result.overall}
            </p>
          </div>

          {/* Feedback items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {result.items.map((item, i) => (
              <div key={i} style={{
                padding: '8px 10px', borderRadius: 6, fontSize: 11, lineHeight: 1.5,
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                borderLeft: '3px solid ' + severityColor(item.severity),
                color: isDark ? '#cbd5e1' : '#334155',
              }}>
                <span style={{ marginRight: 6 }}>{typeIcon(item.type)}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
    </AIWidgetShell>
  )
}

// ============================================================
// Exports
// ============================================================

export { GenerateSimilarWidget, ReadingLevelAdapterWidget, DraftFeedbackWidget }

export function getAIWidgetDefaultConfig(kind: string): Record<string, unknown> {
  switch (kind) {
    case 'ai-generate-similar': return { input: '', variations: [] }
    case 'ai-reading-level': return { input: '', targetLevel: 'middle-school', mode: 'simplify' }
    case 'ai-draft-feedback': return { input: '', context: '' }
    default: return {}
  }
}

export function getAIWidgetDefaultSize(kind: string): { width: number; height: number } {
  switch (kind) {
    case 'ai-generate-similar': return { width: 440, height: 520 }
    case 'ai-reading-level': return { width: 440, height: 560 }
    case 'ai-draft-feedback': return { width: 440, height: 580 }
    default: return { width: 400, height: 400 }
  }
}

export const AI_WIDGET_KIND_LABELS: Record<string, string> = {
  'ai-generate-similar': 'Generate Similar',
  'ai-reading-level': 'Reading Level Adapter',
  'ai-draft-feedback': 'Draft Feedback',
}
