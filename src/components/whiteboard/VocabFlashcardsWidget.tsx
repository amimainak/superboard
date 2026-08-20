'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { VOCAB_CARDS, type VocabCard, type PosTag, type CardLevel, getCardsByFilter, shuffleCards } from '@/data/vocab-cards'

// ============================================================
// Types
// ============================================================

export interface VocabWidgetConfig {
  mode: 'study' | 'create'
  cardIndex: number
  flipped: boolean
  // Filter
  filterPos: PosTag[]
  filterLevel: CardLevel | 'all'
  // Custom cards (teacher-authored)
  customCards: VocabCard[]
  // Create form
  newWord: string
  newDefinition: string
  newExample: string
  newPos: PosTag
}

export const DEFAULT_VOCAB_CONFIG: VocabWidgetConfig = {
  mode: 'study',
  cardIndex: 0,
  flipped: false,
  filterPos: [],
  filterLevel: 'all',
  customCards: [],
  newWord: '',
  newDefinition: '',
  newExample: '',
  newPos: 'noun',
}

export interface VocabFlashcardsProps {
  isDark: boolean
  config: VocabWidgetConfig
  onConfigChange: (patch: Partial<VocabWidgetConfig>) => void
  compact?: boolean
}

// ============================================================
// Style helpers
// ============================================================

const sh = (isDark: boolean) => ({
  bg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
  border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
  text: isDark ? '#94a3b8' : '#64748b',
  bright: isDark ? '#e2e8f0' : '#1e293b',
  input: {
    padding: '4px 8px', borderRadius: 5, fontSize: 11,
    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'),
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none' as const,
  },
  btn: (active: boolean) => ({
    padding: '3px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer' as const,
    background: active ? 'rgba(5,150,105,0.15)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
    border: active ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
    color: active ? '#34d399' : (isDark ? '#94a3b8' : '#64748b'),
  }),
  btnPrimary: {
    padding: '4px 12px', borderRadius: 5, fontSize: 10, fontWeight: 600 as const,
    cursor: 'pointer' as const, background: 'rgba(5,150,105,0.15)',
    border: '1px solid rgba(5,150,105,0.4)', color: '#34d399',
  },
})

const POS_COLORS: Record<string, string> = {
  noun: '#60a5fa', verb: '#f87171', adj: '#4ade80', adv: '#fb923c', prep: '#2dd4bf', other: '#94a3b8',
}

// ============================================================
// Main Component
// ============================================================

export function VocabFlashcardsWidget({ isDark, config, onConfigChange, compact }: VocabFlashcardsProps) {
  const s = sh(isDark)
  const fs = compact ? 10 : 11

  // Get cards based on filter + custom
  const allCards = useMemo(() => {
    const filtered = getCardsByFilter({
      pos: config.filterPos.length > 0 ? config.filterPos : undefined,
      level: config.filterLevel,
    })
    return [...filtered, ...config.customCards]
  }, [config.filterPos, config.filterLevel, config.customCards])

  const total = allCards.length
  const current = total > 0 ? allCards[config.cardIndex % total] : null
  const displayIdx = total > 0 ? (config.cardIndex % total) + 1 : 0

  const goNext = useCallback(() => {
    onConfigChange({ cardIndex: config.cardIndex + 1, flipped: false })
  }, [config.cardIndex, onConfigChange])

  const goPrev = useCallback(() => {
    onConfigChange({ cardIndex: Math.max(0, config.cardIndex - 1), flipped: false })
  }, [config.cardIndex, onConfigChange])

  const handleShuffle = useCallback(() => {
    // Shuffle is visual only - randomize the starting index
    const startIdx = Math.floor(Math.random() * Math.max(total, 1))
    onConfigChange({ cardIndex: startIdx, flipped: false })
  }, [total, onConfigChange])

  const togglePos = useCallback((pos: PosTag) => {
    const current = config.filterPos
    const next = current.includes(pos) ? current.filter(p => p !== pos) : [...current, pos]
    onConfigChange({ filterPos: next, cardIndex: 0, flipped: false })
  }, [config.filterPos, onConfigChange])

  const addCard = useCallback(() => {
    if (!config.newWord.trim() || !config.newDefinition.trim()) return
    const newCard: VocabCard = {
      id: 'custom-' + Date.now(),
      word: config.newWord.trim(),
      definition: config.newDefinition.trim(),
      example: config.newExample.trim(),
      pos: config.newPos,
      level: '6-8',
    }
    onConfigChange({
      customCards: [...config.customCards, newCard],
      newWord: '', newDefinition: '', newExample: '',
    })
  }, [config.newWord, config.newDefinition, config.newExample, config.newPos, config.customCards, onConfigChange])

  const deleteCustomCard = useCallback((idx: number) => {
    onConfigChange({ customCards: config.customCards.filter((_, i) => i !== idx) })
  }, [config.customCards, onConfigChange])

  const selectStyle = {
    padding: '3px 6px', borderRadius: 4, fontSize: 9,
    border: '1px solid ' + s.border, background: s.bg,
    color: s.bright, cursor: 'pointer' as const, outline: 'none' as const,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'inherit' }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={() => onConfigChange({ mode: 'study' })} style={{
            ...s.btn(config.mode === 'study'), padding: '2px 6px', fontSize: 9,
            fontWeight: config.mode === 'study' ? 700 : 400,
          }}>Study</button>
          <button onClick={() => onConfigChange({ mode: 'create' })} style={{
            ...s.btn(config.mode === 'create'), padding: '2px 6px', fontSize: 9,
          }}>Create</button>
        </div>
        {config.customCards.length > 0 && (
          <span style={{ fontSize: 8, color: '#34d399' }}>+{config.customCards.length} custom</span>
        )}
      </div>

      {/* STUDY MODE */}
      {config.mode === 'study' && (
        <>
          {/* Filters */}
          {!compact && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', padding: '3px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
              {(['noun', 'verb', 'adj', 'adv'] as const).map(pos => (
                <button key={pos} onClick={() => togglePos(pos)} style={{
                  ...s.btn(config.filterPos.includes(pos)), fontSize: 8, padding: '1px 5px',
                  border: config.filterPos.includes(pos) ? '1px solid ' + POS_COLORS[pos] + '60' : undefined,
                  color: config.filterPos.includes(pos) ? POS_COLORS[pos] : undefined,
                  background: config.filterPos.includes(pos) ? POS_COLORS[pos] + '18' : undefined,
                }}>{pos}</button>
              ))}
              <select value={config.filterLevel} onChange={e => onConfigChange({ filterLevel: e.target.value as CardLevel | 'all', cardIndex: 0 })} style={selectStyle}>
                <option value="all">All Levels</option>
                <option value="K-5">K-5</option>
                <option value="6-8">6-8</option>
                <option value="9-12">9-12</option>
              </select>
            </div>
          )}

          {total === 0 ? (
            <div style={{ padding: 20, textAlign: 'center' as const, color: s.text, fontSize: fs }}>
              No cards match your filters.
            </div>
          ) : (
            <>
              {/* Card */}
              <div
                onClick={() => onConfigChange({ flipped: !config.flipped })}
                style={{
                  minHeight: compact ? 70 : 90, padding: '10px 14px', borderRadius: 8, cursor: 'pointer' as const,
                  background: config.flipped
                    ? (isDark ? 'rgba(5,150,105,0.08)' : 'rgba(5,150,105,0.05)')
                    : (isDark ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.05)'),
                  border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                }}
              >
                {!config.flipped ? (
                  <div style={{ textAlign: 'center' as const }}>
                    <div style={{
                      fontSize: 8, fontWeight: 600, padding: '1px 6px', borderRadius: 3, display: 'inline-block', marginBottom: 4,
                      background: (POS_COLORS[current!.pos] || '#94a3b8') + '20',
                      color: POS_COLORS[current!.pos] || '#94a3b8',
                    }}>{current!.pos} - {current!.level}</div>
                    <div style={{ fontSize: compact ? 18 : 22, fontWeight: 700, color: s.bright }}>{current!.word}</div>
                    <div style={{ fontSize: 9, color: s.text, marginTop: 6, opacity: 0.6 }}>Click to flip</div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' as const }}>
                    <div style={{ fontSize: fs + 1, fontWeight: 600, color: s.bright, marginBottom: 4 }}>{current!.word}</div>
                    <div style={{ fontSize: fs, color: s.text, marginBottom: 4, lineHeight: 1.5 }}>{current!.definition}</div>
                    {current!.example && (
                      <div style={{ fontSize: fs - 1, color: s.text, opacity: 0.75, fontStyle: 'italic' }}>&ldquo;{current!.example}&rdquo;</div>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={goPrev} disabled={config.cardIndex === 0} style={{
                  ...s.btn(false), opacity: config.cardIndex === 0 ? 0.4 : 1,
                }}>{'< Prev'}</button>
                <span style={{ fontSize: 10, color: s.text, fontWeight: 600 }}>{displayIdx} / {total}</span>
                <button onClick={goNext} style={s.btn(false)}>{'Next >'}</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button onClick={handleShuffle} style={{ ...s.btn(false), fontSize: 8, padding: '1px 6px' }}>Shuffle</button>
              </div>
            </>
          )}
        </>
      )}

      {/* CREATE MODE */}
      {config.mode === 'create' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <input
            value={config.newWord}
            onChange={e => onConfigChange({ newWord: e.target.value })}
            placeholder="Word"
            style={{ ...s.input, width: '100%', boxSizing: 'border-box' as const, fontFamily: 'inherit' as const }}
          />
          <input
            value={config.newDefinition}
            onChange={e => onConfigChange({ newDefinition: e.target.value })}
            placeholder="Definition"
            style={{ ...s.input, width: '100%', boxSizing: 'border-box' as const, fontFamily: 'inherit' as const }}
          />
          <input
            value={config.newExample}
            onChange={e => onConfigChange({ newExample: e.target.value })}
            placeholder="Example sentence (optional)"
            style={{ ...s.input, width: '100%', boxSizing: 'border-box' as const, fontFamily: 'inherit' as const }}
          />
          <select
            value={config.newPos}
            onChange={e => onConfigChange({ newPos: e.target.value as PosTag })}
            style={selectStyle}
          >
            <option value="noun">Noun</option>
            <option value="verb">Verb</option>
            <option value="adj">Adjective</option>
            <option value="adv">Adverb</option>
            <option value="prep">Preposition</option>
            <option value="other">Other</option>
          </select>
          <button
            onClick={addCard}
            disabled={!config.newWord.trim() || !config.newDefinition.trim()}
            style={{
              ...s.btnPrimary, width: '100%',
              opacity: (!config.newWord.trim() || !config.newDefinition.trim()) ? 0.5 : 1,
            }}
          >+ Add Card</button>

          {/* Custom cards list */}
          {config.customCards.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: s.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Custom Cards ({config.customCards.length})
              </div>
              {config.customCards.map((card, i) => (
                <div key={card.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4,
                  padding: '2px 6px', borderRadius: 3, background: s.bg, border: '1px solid ' + s.border,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      fontSize: 8, padding: '0 3px', borderRadius: 2,
                      background: (POS_COLORS[card.pos] || '#94a3b8') + '20',
                      color: POS_COLORS[card.pos] || '#94a3b8', fontWeight: 600,
                    }}>{card.pos}</div>
                    <span style={{ fontSize: 10, color: s.bright }}>{card.word}</span>
                  </div>
                  <button onClick={() => deleteCustomCard(i)} style={{
                    fontSize: 9, padding: '0 4px', borderRadius: 3, cursor: 'pointer' as const,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171',
                  }}>x</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
