'use client'

import React, { useState, useCallback, useMemo } from 'react'
import nlp from 'compromise'

// ============================================================
// Types
// ============================================================

interface TaggedTerm {
  text: string
  pos: string
  allTags: string[]
}

export interface POSWidgetConfig {
  sentence: string
  tagged: TaggedTerm[]
  selectedIdx: number | null
  advanced: boolean
}

export const DEFAULT_POS_CONFIG: POSWidgetConfig = {
  sentence: '',
  tagged: [],
  selectedIdx: null,
  advanced: false,
}

export interface POSTaggerProps {
  isDark: boolean
  config: POSWidgetConfig
  onConfigChange: (patch: Partial<POSWidgetConfig>) => void
  compact?: boolean
}

// ============================================================
// POS Colors & Helpers
// ============================================================

const POS_COLORS: Record<string, { bg: string; bd: string; tx: string }> = {
  Noun: { bg: 'rgba(59,130,246,0.18)', bd: 'rgba(59,130,246,0.5)', tx: '#60a5fa' },
  Verb: { bg: 'rgba(239,68,68,0.18)', bd: 'rgba(239,68,68,0.5)', tx: '#f87171' },
  Adjective: { bg: 'rgba(34,197,94,0.18)', bd: 'rgba(34,197,94,0.5)', tx: '#4ade80' },
  Adverb: { bg: 'rgba(249,115,22,0.18)', bd: 'rgba(249,115,22,0.5)', tx: '#fb923c' },
  Pronoun: { bg: 'rgba(168,85,247,0.18)', bd: 'rgba(168,85,247,0.5)', tx: '#c084fc' },
  Preposition: { bg: 'rgba(20,184,166,0.18)', bd: 'rgba(20,184,166,0.5)', tx: '#2dd4bf' },
  Conjunction: { bg: 'rgba(236,72,153,0.18)', bd: 'rgba(236,72,153,0.5)', tx: '#f472b6' },
  Interjection: { bg: 'rgba(234,179,8,0.18)', bd: 'rgba(234,179,8,0.5)', tx: '#fbbf24' },
  Determiner: { bg: 'rgba(148,163,184,0.18)', bd: 'rgba(148,163,184,0.5)', tx: '#94a3b8' },
  Auxiliary: { bg: 'rgba(251,146,60,0.18)', bd: 'rgba(251,146,60,0.5)', tx: '#fb923c' },
}

const BEGINNER_POS = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Pronoun', 'Preposition', 'Conjunction', 'Interjection']

function getPrimaryPOS(tags: string[]): string {
  const priority = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Pronoun', 'Preposition', 'Conjunction', 'Determiner', 'Auxiliary', 'Interjection', 'Particle']
  for (let i = 0; i < priority.length; i++) {
    for (let j = 0; j < tags.length; j++) {
      if (tags[j] === priority[i]) return priority[i]
    }
  }
  return 'Unknown'
}

function getPOSExplanation(word: string, pos: string, tags: string[]): string {
  if (pos === 'Noun') {
    const kind = tags.indexOf('ProperNoun') !== -1 ? 'specific name (proper noun)' : tags.indexOf('Plural') !== -1 ? 'thing in plural form' : 'person, place, thing, or idea'
    return 'A noun names a person, place, thing, or idea. "' + word + '" functions as a noun here because it represents a ' + kind + ' in the sentence.'
  }
  if (pos === 'Verb') {
    const tense = tags.indexOf('PastTense') !== -1 ? 'past tense' : tags.indexOf('PresentTense') !== -1 ? 'present tense' : tags.indexOf('Infinitive') !== -1 ? 'base/to form (infinitive)' : tags.indexOf('Gerund') !== -1 ? '-ing form (gerund)' : tags.indexOf('Copula') !== -1 ? 'linking verb connecting subject to description' : 'an action or state of being'
    return 'A verb shows an action or a state of being. "' + word + '" is a verb because it describes ' + tense + '.'
  }
  if (pos === 'Adjective') {
    return 'An adjective describes or modifies a noun. "' + word + '" is an adjective because it tells us more about a noun in the sentence.'
  }
  if (pos === 'Adverb') {
    return 'An adverb describes a verb, adjective, or another adverb. "' + word + '" is an adverb because it modifies another word, often telling how, when, or where.'
  }
  if (pos === 'Pronoun') {
    return 'A pronoun replaces a noun. "' + word + '" is a pronoun because it takes the place of a noun in the sentence.'
  }
  if (pos === 'Preposition') {
    return 'A preposition shows the relationship between a noun and another word. "' + word + '" is a preposition because it links a noun phrase to another part of the sentence.'
  }
  if (pos === 'Conjunction') {
    return 'A conjunction joins words, phrases, or clauses. "' + word + '" is a conjunction because it connects parts of the sentence.'
  }
  if (pos === 'Interjection') {
    return 'An interjection expresses strong emotion. "' + word + '" is an interjection because it conveys feeling rather than meaning.'
  }
  if (pos === 'Determiner') {
    return 'A determiner introduces a noun and gives context like quantity or possession. "' + word + '" is a determiner because it specifies the noun that follows.'
  }
  if (pos === 'Auxiliary') {
    return 'An auxiliary (helping) verb works with a main verb. "' + word + '" is an auxiliary verb because it helps the main verb express tense, mood, or voice.'
  }
  return '"' + word + '" is tagged as ' + pos + '.'
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

// ============================================================
// Main Component
// ============================================================

export function POSTaggerWidget({ isDark, config, onConfigChange, compact }: POSTaggerProps) {
  const s = sh(isDark)
  const fs = compact ? 10 : 11

  const handleTag = useCallback(() => {
    if (!config.sentence.trim()) return
    const doc = nlp(config.sentence)
    const data = doc.json()
    if (!data || !data[0] || !data[0].terms) return
    const terms = data[0].terms
    const result: TaggedTerm[] = []
    for (let i = 0; i < terms.length; i++) {
      result.push({
        text: terms[i].text,
        pos: getPrimaryPOS(terms[i].tags),
        allTags: terms[i].tags,
      })
    }
    onConfigChange({ tagged: result, selectedIdx: null })
  }, [config.sentence, onConfigChange])

  const handleSentenceChange = useCallback((v: string) => {
 const patch: Partial<POSWidgetConfig> = { sentence: v }
    if (config.tagged.length > 0) { patch.tagged = []; patch.selectedIdx = null }
    onConfigChange(patch)
  }, [config.tagged, onConfigChange])

  const activePOS = config.advanced
    ? Object.keys(POS_COLORS)
    : BEGINNER_POS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontFamily: 'inherit' }}>
      <div style={{ fontSize: fs + 1, fontWeight: 700, color: s.bright }}>Parts of Speech Tagger</div>
      <textarea
        value={config.sentence}
        onChange={e => handleSentenceChange(e.target.value)}
        placeholder="Type a sentence to tag..."
        rows={2}
        style={{ ...s.input, width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
      />
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={handleTag} style={s.btnPrimary}>Tag Sentence</button>
        <button onClick={() => onConfigChange({ advanced: !config.advanced })} style={s.btn(config.advanced)}>
          {config.advanced ? 'Advanced' : 'Basic'}
        </button>
      </div>
      {config.tagged.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ lineHeight: 2.2 }}>
            {config.tagged.map((t, i) => {
              const colors = POS_COLORS[t.pos]
              if (!colors) return <span key={i} style={{ marginRight: 4, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)', fontSize: fs + 2 }}>{t.text} </span>
              const isSel = config.selectedIdx === i
              return (
                <span
                  key={i}
                  onClick={() => onConfigChange({ selectedIdx: isSel ? null : i })}
                  style={{
                    display: 'inline-block', padding: '1px 5px', margin: '1px 1px', borderRadius: 3,
                    background: isSel ? colors.bd : colors.bg, border: '1px solid ' + colors.bd,
                    color: colors.tx, fontSize: fs + 2, fontWeight: 600, cursor: 'pointer' as const,
                  }}
                >{t.text}</span>
              )
            })}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '3px 6px', borderRadius: 4, background: s.bg }}>
            {activePOS.map(pos => {
              const c = POS_COLORS[pos]
              if (!c) return null
              return <div key={pos} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: c.tx }} />
                <span style={{ fontSize: 9, color: s.text }}>{pos}</span>
              </div>
            })}
          </div>
          {config.selectedIdx !== null && config.tagged[config.selectedIdx] && (
            <div style={{
              padding: '5px 8px', borderRadius: 4, fontSize: fs - 1, color: s.text, lineHeight: 1.4,
              background: s.bg, border: '1px solid ' + s.border,
            }}>
              <span style={{ fontWeight: 700, color: (POS_COLORS[config.tagged[config.selectedIdx].pos] || {}).tx || s.bright }}>{config.tagged[config.selectedIdx].text}</span>
              {' -> '}{config.tagged[config.selectedIdx].pos}
              {config.advanced && (
                <div style={{ marginTop: 3, fontSize: 8, opacity: 0.7 }}>
                  All tags: {config.tagged[config.selectedIdx].allTags.join(', ')}
                </div>
              )}
              <div style={{ marginTop: 3, color: s.bright, fontSize: fs - 1, lineHeight: 1.5 }}>
                {getPOSExplanation(config.tagged[config.selectedIdx].text, config.tagged[config.selectedIdx].pos, config.tagged[config.selectedIdx].allTags)}
              </div>
            </div>
          )}
          <div style={{ padding: '5px 8px', borderRadius: 4, background: s.bg, lineHeight: 2 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 2 }}>SKELETON (Nouns & Verbs)</div>
            {config.tagged.map((t, i) => {
              const isCore = t.pos === 'Noun' || t.pos === 'Verb'
              const c = POS_COLORS[t.pos]
              if (isCore && c) {
                return <span key={i} style={{ display: 'inline-block', padding: '1px 5px', margin: '1px 1px', borderRadius: 3, background: c.bg, border: '1px solid ' + c.bd, color: c.tx, fontSize: fs + 2, fontWeight: 700, marginRight: 3 }}>{t.text} </span>
              }
              return <span key={i} style={{ color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', fontSize: fs + 2, marginRight: 5 }}>{t.text} </span>
            })}
          </div>
        </div>
      )}
    </div>
  )
}