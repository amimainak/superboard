'use client'

import React, { useState, useCallback, useMemo, useRef } from 'react'
import nlp from 'compromise'

// ============================================================
// Types
// ============================================================

interface TaggedTerm {
  text: string
  pos: string
  allTags: string[]
}

interface ClauseSpan {
  start: number
  end: number
  type: 'independent' | 'dependent'
}

interface AnnotationGroup {
  words: { term: TaggedTerm; originalIdx: number }[]
  labels: { text: string; color: string }[]
  bgColor: string | undefined
  underlineColor: string | undefined
}

export interface POSWidgetConfig {
  sentence: string
  tagged: TaggedTerm[]
  selectedIdx: number | null
  advanced: boolean
  wordOrder: string[]
  showSubjectPredicate: boolean
  showClauses: boolean
}

export const DEFAULT_POS_CONFIG: POSWidgetConfig = {
  sentence: '',
  tagged: [],
  selectedIdx: null,
  advanced: false,
  wordOrder: [],
  showSubjectPredicate: false,
  showClauses: false,
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
// Clause & Annotation Helpers
// ============================================================

function identifyClauses(tagged: TaggedTerm[]): ClauseSpan[] {
  const SUBORD_CONJ: Record<string, boolean> = {}
  const subList = ['after', 'although', 'because', 'before', 'even', 'if', 'once', 'since', 'so', 'than', 'that', 'though', 'unless', 'until', 'when', 'where', 'whereas', 'wherever', 'whether', 'while']
  for (let si = 0; si < subList.length; si++) SUBORD_CONJ[subList[si]] = true

  const COORD_CONJ: Record<string, boolean> = {}
  const coordList = ['and', 'but', 'or', 'nor', 'yet', 'for']
  for (let ci = 0; ci < coordList.length; ci++) COORD_CONJ[coordList[ci]] = true

  const boundaries: { idx: number; type: 'independent' | 'dependent' }[] = [{ idx: 0, type: 'independent' }]

  for (let i = 1; i < tagged.length; i++) {
    const text = tagged[i].text.toLowerCase().replace(/[^a-z]/g, '')
    if (tagged[i].pos === 'Conjunction' && SUBORD_CONJ[text]) {
      boundaries.push({ idx: i, type: 'dependent' })
    } else if (tagged[i].pos === 'Conjunction' && COORD_CONJ[text]) {
      boundaries.push({ idx: i, type: 'independent' })
    }
  }

  const spans: ClauseSpan[] = []
  for (let bi = 0; bi < boundaries.length; bi++) {
    const start = boundaries[bi].idx
    const end = bi + 1 < boundaries.length ? boundaries[bi + 1].idx : tagged.length
    spans.push({ start: start, end: end, type: boundaries[bi].type })
  }

  return spans
}

function computeAnnotationGroups(
  tagged: TaggedTerm[],
  showSP: boolean,
  showCl: boolean,
): AnnotationGroup[] {
  if (!showSP && !showCl) {
    const plainWords: { term: TaggedTerm; originalIdx: number }[] = []
    for (let pi = 0; pi < tagged.length; pi++) {
      plainWords.push({ term: tagged[pi], originalIdx: pi })
    }
    return [{ words: plainWords, labels: [], bgColor: undefined, underlineColor: undefined }]
  }

  // Find main verb for subject/predicate split
  let mainVerbIdx = -1
  if (showSP) {
    mainVerbIdx = -1
    for (let vi = 0; vi < tagged.length; vi++) {
      if (tagged[vi].pos === 'Verb' && tagged[vi].allTags.indexOf('Auxiliary') === -1) {
        mainVerbIdx = vi
        break
      }
    }
    if (mainVerbIdx === -1) {
      for (let vi2 = 0; vi2 < tagged.length; vi2++) {
        if (tagged[vi2].pos === 'Verb') {
          mainVerbIdx = vi2
          break
        }
      }
    }
  }

  // Get clause spans
  const clauseSpans = showCl ? identifyClauses(tagged) : []

  // Collect all boundary points
  const boundarySet: Record<string, boolean> = { '0': true }

  if (showSP && mainVerbIdx !== -1) {
    boundarySet[String(mainVerbIdx)] = true
  }

  if (showCl) {
    for (let cs = 0; cs < clauseSpans.length; cs++) {
      if (clauseSpans[cs].start > 0) {
        boundarySet[String(clauseSpans[cs].start)] = true
      }
    }
  }

  const boundKeys = Object.keys(boundarySet)
  const sortedBounds: number[] = []
  for (let bk = 0; bk < boundKeys.length; bk++) {
    sortedBounds.push(Number(boundKeys[bk]))
  }
  sortedBounds.sort(function (a, b) { return a - b })

  const groups: AnnotationGroup[] = []
  for (let gi = 0; gi < sortedBounds.length; gi++) {
    const gStart = sortedBounds[gi]
    const gEnd = gi + 1 < sortedBounds.length ? sortedBounds[gi + 1] : tagged.length
    if (gStart >= tagged.length) continue

    const labels: { text: string; color: string }[] = []
    let bgColor: string | undefined
    let underlineColor: string | undefined

    // Subject/Predicate
    if (showSP && mainVerbIdx !== -1) {
      if (gStart < mainVerbIdx) {
        labels.push({ text: 'SUBJECT', color: '#2dd4bf' })
        bgColor = 'rgba(45,212,191,0.12)'
      } else {
        labels.push({ text: 'PREDICATE', color: '#fb923c' })
        bgColor = 'rgba(251,146,60,0.12)'
      }
    }

    // Clauses
    if (showCl) {
      for (let cc = 0; cc < clauseSpans.length; cc++) {
        if (gStart >= clauseSpans[cc].start && gStart < clauseSpans[cc].end) {
          if (clauseSpans[cc].type === 'independent') {
            labels.push({ text: 'INDEPENDENT', color: '#60a5fa' })
            underlineColor = '#60a5fa'
          } else {
            labels.push({ text: 'DEPENDENT', color: '#f472b6' })
            underlineColor = '#f472b6'
          }
          break
        }
      }
    }

    const gWords: { term: TaggedTerm; originalIdx: number }[] = []
    for (let wi = gStart; wi < gEnd; wi++) {
      gWords.push({ term: tagged[wi], originalIdx: wi })
    }

    groups.push({ words: gWords, labels: labels, bgColor: bgColor, underlineColor: underlineColor })
  }

  return groups
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

  // Drag state (useState for visual feedback, useRef for drag data)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const dragSourceIdx = useRef<number | null>(null)

  const handleTag = useCallback(() => {
    if (!config.sentence.trim()) return
    const doc = nlp(config.sentence)
    const data = doc.json()
    if (!data || !data[0] || !data[0].terms) return
    const terms = data[0].terms
    const result: TaggedTerm[] = []
    const wordOrder: string[] = []
    for (let i = 0; i < terms.length; i++) {
      result.push({
        text: terms[i].text,
        pos: getPrimaryPOS(terms[i].tags),
        allTags: terms[i].tags,
      })
      wordOrder.push(terms[i].text)
    }
    onConfigChange({ tagged: result, selectedIdx: null, wordOrder: wordOrder })
  }, [config.sentence, onConfigChange])

  const handleSentenceChange = useCallback((v: string) => {
    const patch: Partial<POSWidgetConfig> = { sentence: v, wordOrder: [] }
    if (config.tagged.length > 0) { patch.tagged = []; patch.selectedIdx = null }
    onConfigChange(patch)
  }, [config.tagged, onConfigChange])

  // --- Drag handlers ---
  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    dragSourceIdx.current = idx
    setDraggingIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIdx(idx)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverIdx(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, dropIdx: number) => {
    e.preventDefault()
    const sourceIdx = dragSourceIdx.current
    setDragOverIdx(null)
    setDraggingIdx(null)
    if (sourceIdx === null || sourceIdx === dropIdx) {
      dragSourceIdx.current = null
      return
    }

    // Reorder tagged array
    let newTagged = config.tagged.slice()
    const removed = newTagged.splice(sourceIdx, 1)[0]
    newTagged.splice(dropIdx, 0, removed)

    // Rebuild sentence from reordered words
    const newSentence = newTagged.map(function (t) { return t.text }).join(' ')

    // Re-tag with nlp
    const doc = nlp(newSentence)
    const data = doc.json()
    const newResults: TaggedTerm[] = []
    const newWordOrder: string[] = []
    if (data && data[0] && data[0].terms) {
      const terms = data[0].terms
      for (let ri = 0; ri < terms.length; ri++) {
        newResults.push({
          text: terms[ri].text,
          pos: getPrimaryPOS(terms[ri].tags),
          allTags: terms[ri].tags,
        })
        newWordOrder.push(terms[ri].text)
      }
    }

    onConfigChange({
      tagged: newResults,
      sentence: newSentence,
      wordOrder: newWordOrder,
      selectedIdx: null,
    })

    dragSourceIdx.current = null
  }, [config.tagged, onConfigChange])

  const handleDragEnd = useCallback(() => {
    setDragOverIdx(null)
    setDraggingIdx(null)
    dragSourceIdx.current = null
  }, [])

  // --- Computed annotation groups ---
  const annotationGroups = useMemo(function () {
    if (config.tagged.length === 0) return []
    return computeAnnotationGroups(config.tagged, config.showSubjectPredicate, config.showClauses)
  }, [config.tagged, config.showSubjectPredicate, config.showClauses])

  const showAnnotations = config.showSubjectPredicate || config.showClauses

  const activePOS = config.advanced
    ? Object.keys(POS_COLORS)
    : BEGINNER_POS

  // --- Render a single word chip (reused across both rendering paths) ---
  function renderWordChip(t: TaggedTerm, idx: number) {
    const colors = POS_COLORS[t.pos]
    if (!colors) {
      return (
        <span
          key={idx}
          draggable={true}
          onDragStart={function (e) { handleDragStart(e, idx) }}
          onDragOver={function (e) { handleDragOver(e, idx) }}
          onDragLeave={handleDragLeave}
          onDrop={function (e) { handleDrop(e, idx) }}
          onDragEnd={handleDragEnd}
          style={{
            marginRight: 4, fontSize: fs + 2, opacity: draggingIdx === idx ? 0.35 : 1,
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
            borderLeft: dragOverIdx === idx ? '2px solid #34d399' : '2px solid transparent',
            paddingLeft: dragOverIdx === idx ? 2 : 0,
          }}
        >{t.text} </span>
      )
    }
    const isSel = config.selectedIdx === idx
    return (
      <span
        key={idx}
        draggable={true}
        onDragStart={function (e) { handleDragStart(e, idx) }}
        onDragOver={function (e) { handleDragOver(e, idx) }}
        onDragLeave={handleDragLeave}
        onDrop={function (e) { handleDrop(e, idx) }}
        onDragEnd={handleDragEnd}
        onClick={function () { onConfigChange({ selectedIdx: isSel ? null : idx }) }}
        style={{
          display: 'inline-block', padding: '1px 5px', margin: '1px 1px', borderRadius: 3,
          background: isSel ? colors.bd : colors.bg,
          border: '1px solid ' + colors.bd,
          color: colors.tx, fontSize: fs + 2, fontWeight: 600,
          cursor: 'pointer' as const,
          opacity: draggingIdx === idx ? 0.35 : 1,
          borderLeft: dragOverIdx === idx ? '3px solid #34d399' : undefined,
          marginLeft: dragOverIdx === idx ? 3 : undefined,
        }}
      >{t.text}</span>
    )
  }

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
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={handleTag} style={s.btnPrimary}>Tag Sentence</button>
        <button onClick={() => onConfigChange({ advanced: !config.advanced })} style={s.btn(config.advanced)}>
          {config.advanced ? 'Advanced' : 'Basic'}
        </button>
        {config.tagged.length > 0 && (
          <>
            <button
              onClick={() => onConfigChange({ showSubjectPredicate: !config.showSubjectPredicate })}
              style={s.btn(config.showSubjectPredicate)}
            >
              Subject vs Predicate
            </button>
            <button
              onClick={() => onConfigChange({ showClauses: !config.showClauses })}
              style={s.btn(config.showClauses)}
            >
              Clauses
            </button>
          </>
        )}
      </div>
      {config.tagged.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ lineHeight: 2.2 }}>
            {showAnnotations
              ? (
                annotationGroups.map(function (group, groupIdx) {
                  return (
                    <span
                      key={groupIdx}
                      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', verticalAlign: 'top' }}
                    >
                      {group.labels.length > 0 && (
                        <span style={{ display: 'flex', gap: 6, marginTop: 2, marginBottom: -1 }}>
                          {group.labels.map(function (label, li) {
                            return (
                              <span
                                key={li}
                                style={{ fontSize: 8, fontWeight: 700, color: label.color, letterSpacing: 0.5 }}
                              >{label.text}</span>
                            )
                          })}
                        </span>
                      )}
                      <span style={{
                        backgroundColor: group.bgColor,
                        borderRadius: group.bgColor ? 2 : undefined,
                        borderBottom: group.underlineColor ? '2px solid ' + group.underlineColor : undefined,
                        paddingBottom: group.underlineColor ? 1 : undefined,
                      }}>
                        {group.words.map(function (w) {
                          return renderWordChip(w.term, w.originalIdx)
                        })}
                      </span>
                    </span>
                  )
                })
              )
              : (
                config.tagged.map(function (t, i) {
                  return renderWordChip(t, i)
                })
              )
            }
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