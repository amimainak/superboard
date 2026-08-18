'use client'

import React, { useState, useMemo, useCallback } from 'react'

// ============================================================
// Shared style factory
// ============================================================

const styles = (isDark: boolean) => ({
  bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
  text: isDark ? '#94a3b8' : '#475569',
  bright: isDark ? '#e2e8f0' : '#1e293b',
  input: {
    padding: '3px 6px', borderRadius: 4, fontSize: 11,
    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none' as const,
  },
  btn: (active: boolean) => ({
    padding: '2px 6px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
    background: active ? 'rgba(5,150,105,0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
    border: active ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
    color: active ? '#34d399' : (isDark ? '#94a3b8' : '#475569'),
  }),
})

// ============================================================
// 1. VocabularyFlashcards
// ============================================================

interface FlashCard {
  word: string
  definition: string
  example: string
  pos: string
  level: 'K-5' | '6-12'
}

const SAMPLE_CARDS: FlashCard[] = [
  { word: 'Abundant', definition: 'Existing in large amounts; plentiful', example: 'The garden had an abundant supply of fresh vegetables.', pos: 'adj', level: '6-12' },
  { word: 'Curious', definition: 'Eager to know or learn something', example: 'The curious cat explored every corner of the room.', pos: 'adj', level: 'K-5' },
  { word: 'Persuade', definition: 'To convince someone to do or believe something', example: 'She tried to persuade her friend to join the club.', pos: 'verb', level: '6-12' },
  { word: 'Enormous', definition: 'Very large in size or amount', example: 'The enormous elephant drank from the river.', pos: 'adj', level: 'K-5' },
  { word: 'Narrative', definition: 'A spoken or written account of connected events; a story', example: 'The narrative of the hero\'s journey captivated the audience.', pos: 'noun', level: '6-12' },
  { word: 'Beneath', definition: 'Extending or directly underneath', example: 'The treasure was buried beneath the old oak tree.', pos: 'prep', level: 'K-5' },
  { word: 'Meticulous', definition: 'Showing great attention to detail; very careful', example: 'The meticulous artist spent hours on each brushstroke.', pos: 'adj', level: '6-12' },
  { word: 'Giggle', definition: 'To laugh in a silly, high-pitched way', example: 'The children began to giggle during the funny story.', pos: 'verb', level: 'K-5' },
  { word: 'Hypothesize', definition: 'To propose an explanation that can be tested', example: 'Scientists hypothesize that the disease spreads through water.', pos: 'verb', level: '6-12' },
  { word: 'Scamper', definition: 'To run with quick, short steps', example: 'The squirrels scamper across the yard every morning.', pos: 'verb', level: 'K-5' },
]

export function VocabularyFlashcards({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [cards, setCards] = useState<FlashCard[]>(SAMPLE_CARDS)
  const [mode, setMode] = useState<'study' | 'create'>('study')
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const newWord = useInputState('')
  const newDef = useInputState('')
  const newEx = useInputState('')
  const newPos = useState('noun')

  const current = cards[index]
  const total = cards.length

  const goNext = useCallback(() => {
    setFlipped(false)
    setIndex((i) => Math.min(i + 1, total - 1))
  }, [total])

  const goPrev = useCallback(() => {
    setFlipped(false)
    setIndex((i) => Math.max(i - 1, 0))
  }, [])

  const shuffle = useCallback(() => {
    setFlipped(false)
    setCards((prev) => {
      const arr = [...prev]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    })
    setIndex(0)
  }, [])

  const addCard = useCallback(() => {
    if (!newWord[0].trim() || !newDef[0].trim()) return
    setCards((prev) => [
      ...prev,
      { word: newWord[0].trim(), definition: newDef[0].trim(), example: newEx[0].trim(), pos: newPos[0], level: '6-12' },
    ])
    newWord[1]('')
    newDef[1]('')
    newEx[1]('')
  }, [newWord, newDef, newEx, newPos])

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
        <button onClick={() => setMode('study')} style={s.btn(mode === 'study')}>Study</button>
        <button onClick={() => setMode('create')} style={s.btn(mode === 'create')}>Create</button>
      </div>

      {mode === 'study' && (
        <div>
          {total === 0 ? (
            <div style={{ color: s.text, fontSize: 11 }}>No cards yet. Create some!</div>
          ) : (
            <>
              {/* Card */}
              <div
                onClick={() => setFlipped((f) => !f)}
                style={{
                  minHeight: 90, padding: '10px 8px', borderRadius: 6, cursor: 'pointer',
                  background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                  border: '1px solid ' + s.border, textAlign: 'center',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                  transition: 'background 0.15s',
                }}
              >
                {flipped ? (
                  <>
                    <div style={{ fontSize: 9, color: s.text, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{current.pos}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.bright, marginBottom: 4 }}>{current.word}</div>
                    <div style={{ fontSize: 11, color: s.text, marginBottom: 4 }}>{current.definition}</div>
                    <div style={{ fontSize: 10, color: s.text, opacity: 0.75, fontStyle: 'italic' }}>&quot;{current.example}&quot;</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 9, color: s.text, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{current.pos} &middot; {current.level}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.bright }}>{current.word}</div>
                    <div style={{ fontSize: 9, color: s.text, marginTop: 6, opacity: 0.6 }}>Click to flip</div>
                  </>
                )}
              </div>

              {/* Counter & Nav */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <button onClick={goPrev} disabled={index === 0} style={{ ...s.btn(false), opacity: index === 0 ? 0.4 : 1 }}>&larr; Prev</button>
                <span style={{ fontSize: 11, color: s.text, fontWeight: 600 }}>{index + 1}/{total}</span>
                <button onClick={goNext} disabled={index === total - 1} style={{ ...s.btn(false), opacity: index === total - 1 ? 0.4 : 1 }}>Next &rarr;</button>
              </div>
              <div style={{ marginTop: 4, textAlign: 'center' }}>
                <button onClick={shuffle} style={s.btn(false)}>Shuffle</button>
              </div>
            </>
          )}
        </div>
      )}

      {mode === 'create' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input placeholder="Word" value={newWord[0]} onChange={(e) => newWord[1](e.target.value)} style={s.input} />
          <input placeholder="Definition" value={newDef[0]} onChange={(e) => newDef[1](e.target.value)} style={s.input} />
          <input placeholder="Example sentence" value={newEx[0]} onChange={(e) => newEx[1](e.target.value)} style={s.input} />
          <select value={newPos[0]} onChange={(e) => newPos[1](e.target.value)} style={s.input}>
            <option value="noun">Noun</option>
            <option value="verb">Verb</option>
            <option value="adj">Adjective</option>
            <option value="adv">Adverb</option>
            <option value="other">Other</option>
          </select>
          <button onClick={addCard} style={{ ...s.btn(true), marginTop: 2, padding: '4px 8px', fontWeight: 600 }}>+ Add Card</button>
        </div>
      )}
    </div>
  )
}

/** Tiny helper to pair a useState value with its setter in an array */
function useInputState(init: string): [string, React.Dispatch<React.SetStateAction<string>>] {
  const s = useState(init)
  return s
}

// ============================================================
// 2. ReadingPassageAnalyzer
// ============================================================

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
  'from', 'it', 'this', 'that', 'and', 'or', 'but', 'not', 'as', 'be', 'been', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'can', 'could', 'shall', 'should', 'may', 'might', 'must',
  'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
  'its', 'our', 'their',
])

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length <= 3) return 1
  let count = 0
  let prevVowel = false
  for (let i = 0; i < w.length; i++) {
    const c = w[i]
    const isVowel = c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u' || c === 'y'
    if (isVowel && !prevVowel) count++
    prevVowel = isVowel
  }
  // silent e at end
  if (w.endsWith('e') && count > 1) count--
  return Math.max(count, 1)
}

export function ReadingPassageAnalyzer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [text, setText] = useState('')

  const analysis = useMemo(() => {
    if (!text.trim()) return null
    const words = text.trim().split(/\s+/).filter(Boolean)
    const wordCount = words.length
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    const sentenceCount = sentences.length
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
    const paragraphCount = Math.max(paragraphs.length, 1)
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0

    const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0)
    const avgSyllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 0
    const fleschKincaid = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59

    // Top 5 frequent words
    const freq = new Map<string, number>()
    for (const w of words) {
      const lower = w.toLowerCase().replace(/[^a-z]/g, '')
      if (!lower || STOP_WORDS.has(lower)) continue
      freq.set(lower, (freq.get(lower) || 0) + 1)
    }
    const topWords = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return { wordCount, sentenceCount, paragraphCount, avgWordsPerSentence, fleschKincaid, topWords }
  }, [text])

  const statBox = (label: string, value: string | number) => (
    <div style={{ background: s.bg, borderRadius: 4, padding: '6px 8px', border: '1px solid ' + s.border, flex: '1 1 45%', minWidth: 0 }}>
      <div style={{ fontSize: 9, color: s.text, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: s.bright, marginTop: 2 }}>{value}</div>
    </div>
  )

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a reading passage here to analyze..."
        rows={5}
        style={{
          ...s.input, width: '100%', resize: 'vertical', minHeight: 60, lineHeight: 1.5,
          fontFamily: 'inherit', boxSizing: 'border-box',
        }}
      />
      {analysis && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {statBox('Words', analysis.wordCount)}
          {statBox('Sentences', analysis.sentenceCount)}
          {statBox('Paragraphs', analysis.paragraphCount)}
          {statBox('Avg Words/Sent', analysis.avgWordsPerSentence.toFixed(1))}
          {statBox('Flesch-Kincaid', (analysis.fleschKincaid).toFixed(1) + ' GL')}
          <div style={{
            background: s.bg, borderRadius: 4, padding: '6px 8px', border: '1px solid ' + s.border,
            flex: '1 1 100%', minWidth: 0,
          }}>
            <div style={{ fontSize: 9, color: s.text, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.4 }}>Top Words</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              {analysis.topWords.map(([w, c]) => (
                <span key={w} style={{
                  fontSize: 10, color: s.bright, background: 'rgba(5,150,105,0.12)',
                  padding: '1px 5px', borderRadius: 3,
                }}>{w} ({c})</span>
              ))}
              {analysis.topWords.length === 0 && (
                <span style={{ fontSize: 10, color: s.text, opacity: 0.5 }}>Paste text to see top words</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 3. StoryElementsMap
// ============================================================

interface StoryData {
  title: string
  author: string
  protagonist: string
  antagonist: string
  settingTime: string
  settingPlace: string
  conflictType: string
  risingAction: string
  climax: string
  fallingAction: string
  resolution: string
  theme: string
}

const CONFLICT_TYPES = ['Man vs Man', 'Man vs Nature', 'Man vs Self', 'Man vs Society', 'Man vs Technology']

export function StoryElementsMap({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [data, setData] = useState<StoryData>({
    title: '', author: '', protagonist: '', antagonist: '',
    settingTime: '', settingPlace: '', conflictType: 'Man vs Man',
    risingAction: '', climax: '', fallingAction: '', resolution: '', theme: '',
  })
  const [showViz, setShowViz] = useState(false)

  const set = (key: keyof StoryData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setData((d) => ({ ...d, [key]: e.target.value }))

  const fieldStyle: React.CSSProperties = { ...s.input, width: '100%', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: s.text, marginBottom: 1, display: 'block' }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <div style={{ flex: '1 1 45%', minWidth: 0 }}>
          <label style={labelStyle}>Title</label>
          <input value={data.title} onChange={set('title')} style={fieldStyle} />
        </div>
        <div style={{ flex: '1 1 45%', minWidth: 0 }}>
          <label style={labelStyle}>Author</label>
          <input value={data.author} onChange={set('author')} style={fieldStyle} />
        </div>
        <div style={{ flex: '1 1 45%', minWidth: 0 }}>
          <label style={labelStyle}>Protagonist</label>
          <input value={data.protagonist} onChange={set('protagonist')} style={fieldStyle} />
        </div>
        <div style={{ flex: '1 1 45%', minWidth: 0 }}>
          <label style={labelStyle}>Antagonist</label>
          <input value={data.antagonist} onChange={set('antagonist')} style={fieldStyle} />
        </div>
        <div style={{ flex: '1 1 30%', minWidth: 0 }}>
          <label style={labelStyle}>Setting (Time)</label>
          <input value={data.settingTime} onChange={set('settingTime')} style={fieldStyle} />
        </div>
        <div style={{ flex: '1 1 45%', minWidth: 0 }}>
          <label style={labelStyle}>Setting (Place)</label>
          <input value={data.settingPlace} onChange={set('settingPlace')} style={fieldStyle} />
        </div>
        <div style={{ flex: '1 1 100%', minWidth: 0 }}>
          <label style={labelStyle}>Conflict Type</label>
          <select value={data.conflictType} onChange={set('conflictType')} style={fieldStyle}>
            {CONFLICT_TYPES.map((ct) => <option key={ct} value={ct}>{ct}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
        <div><label style={labelStyle}>Rising Action</label><textarea value={data.risingAction} onChange={set('risingAction')} rows={2} style={{ ...fieldStyle, resize: 'vertical' }} /></div>
        <div><label style={labelStyle}>Climax</label><textarea value={data.climax} onChange={set('climax')} rows={2} style={{ ...fieldStyle, resize: 'vertical' }} /></div>
        <div><label style={labelStyle}>Falling Action</label><textarea value={data.fallingAction} onChange={set('fallingAction')} rows={2} style={{ ...fieldStyle, resize: 'vertical' }} /></div>
        <div><label style={labelStyle}>Resolution</label><textarea value={data.resolution} onChange={set('resolution')} rows={2} style={{ ...fieldStyle, resize: 'vertical' }} /></div>
        <div><label style={labelStyle}>Theme</label><input value={data.theme} onChange={set('theme')} style={fieldStyle} /></div>
      </div>

      <div style={{ marginTop: 6, textAlign: 'center' }}>
        <button onClick={() => setShowViz((v) => !v)} style={s.btn(showViz)}>{showViz ? 'Hide Visualization' : 'Visualize Story Mountain'}</button>
      </div>

      {showViz && (
        <div style={{ marginTop: 6 }}>
          <svg viewBox="0 0 400 260" width="100%" style={{ display: 'block' }}>
            {/* Mountain shape */}
            <polygon
              points="40,230 200,30 360,230"
              fill="none"
              stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
              strokeWidth="1.5"
            />
            {/* Stage lines */}
            <line x1="40" y1="230" x2="130" y2="130" stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth="1" strokeDasharray="4,3" />
            <line x1="130" y1="130" x2="200" y2="30" stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth="1" strokeDasharray="4,3" />
            <line x1="200" y1="30" x2="280" y2="140" stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth="1" strokeDasharray="4,3" />
            <line x1="280" y1="140" x2="360" y2="230" stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth="1" strokeDasharray="4,3" />

            {/* Dots */}
            <circle cx="40" cy="230" r="4" fill="#34d399" />
            <circle cx="130" cy="130" r="4" fill="#34d399" />
            <circle cx="200" cy="30" r="5" fill="#f59e0b" />
            <circle cx="280" cy="140" r="4" fill="#34d399" />
            <circle cx="360" cy="230" r="4" fill="#34d399" />

            {/* Labels */}
            <text x="40" y="250" textAnchor="middle" fontSize="9" fill={s.text}>Exposition</text>
            <text x="110" y="110" textAnchor="end" fontSize="9" fill={s.text}>Rising Action</text>
            <text x="200" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#f59e0b">Climax</text>
            <text x="295" y="125" textAnchor="start" fontSize="9" fill={s.text}>Falling Action</text>
            <text x="360" y="250" textAnchor="middle" fontSize="9" fill={s.text}>Resolution</text>

            {/* User text annotations - exposition */}
            {data.title && <text x="85" y="244" textAnchor="middle" fontSize="8" fill={s.bright} fontStyle="italic">{truncate(data.title, 20)}</text>}

            {/* Rising action text */}
            {data.risingAction && (
              <text x="160" y="155" textAnchor="middle" fontSize="7" fill={s.bright}>
                {truncate(data.risingAction, 30)}
              </text>
            )}

            {/* Climax text */}
            {data.climax && (
              <text x="200" y="48" textAnchor="middle" fontSize="7" fill={s.bright}>
                {truncate(data.climax, 25)}
              </text>
            )}

            {/* Falling action */}
            {data.fallingAction && (
              <text x="320" y="160" textAnchor="middle" fontSize="7" fill={s.bright}>
                {truncate(data.fallingAction, 25)}
              </text>
            )}

            {/* Resolution text */}
            {data.resolution && (
              <text x="315" y="244" textAnchor="middle" fontSize="8" fill={s.bright} fontStyle="italic">
                {truncate(data.resolution, 20)}
              </text>
            )}

            {/* Theme bar at bottom */}
            {data.theme && (
              <>
                <rect x="20" y="256" width="360" height="0.5" fill={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} />
              </>
            )}
          </svg>
          {data.theme && (
            <div style={{ fontSize: 9, color: s.text, textAlign: 'center', marginTop: 2 }}>
              <span style={{ fontWeight: 600 }}>Theme:</span> {data.theme}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.substring(0, max - 1) + '\u2026'
}

// ============================================================
// 4. SentenceStructureBuilder
// ============================================================

interface WordBank {
  label: string
  description: string
  example: string
  words: string[]
}

const STRUCTURE_BANKS: Record<string, WordBank> = {
  simple: {
    label: 'Simple',
    description: 'One independent clause with a subject and predicate.',
    example: 'The cat sat on the mat.',
    words: ['The', 'cat', 'dog', 'boy', 'girl', 'ran', 'jumped', 'sat', 'ate', 'read', 'the', 'a', 'ball', 'book', 'quickly', 'happily', 'yesterday', 'park', 'house', 'big'],
  },
  compound: {
    label: 'Compound',
    description: 'Two independent clauses joined by a conjunction (and, but, or, so).',
    example: 'The sun set, and the stars appeared.',
    words: ['The', 'sun', 'moon', 'stars', 'set', 'rose', 'shone', 'appeared', 'faded', ',', 'and', 'but', 'or', 'so', 'the', 'wind', 'blew', 'night', 'was', 'beautiful'],
  },
  complex: {
    label: 'Complex',
    description: 'One independent clause and one or more dependent clauses.',
    example: 'Because it rained, we stayed inside.',
    words: ['Because', 'Although', 'If', 'When', 'While', 'it', 'we', 'they', 'rained', 'was', 'were', 'tired', 'stayed', 'went', 'inside', 'outside', 'the', 'test', 'finished', 'early'],
  },
  'compound-complex': {
    label: 'Compound-Complex',
    description: 'At least two independent clauses and one dependent clause.',
    example: 'Although it was late, we finished the project, and the teacher was pleased.',
    words: ['Although', 'Because', 'When', 'it', 'we', 'they', 'was', 'were', 'late', 'finished', 'started', 'the', 'project', 'game', 'and', 'but', 'the', 'teacher', 'team', 'pleased', 'won'],
  },
}

export function SentenceStructureBuilder({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [activeType, setActiveType] = useState('simple')
  const [built, setBuilt] = useState<string[]>([])

  const bank = STRUCTURE_BANKS[activeType]

  const addWord = useCallback((word: string) => {
    setBuilt((prev) => [...prev, word])
  }, [])

  const clearBuilt = useCallback(() => setBuilt([]), [])

  const removeWord = useCallback((idx: number) => {
    setBuilt((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const getStructureBreakdown = useCallback(() => {
    const sentence = built.join(' ')
    if (activeType === 'simple') {
      return 'Simple Sentence: One independent clause. Look for one subject-verb pair.'
    }
    if (activeType === 'compound') {
      const parts = sentence.split(/\b(and|but|or|so)\b/i)
      if (parts.length >= 3) {
        return 'Compound: "' + parts[0].trim() + '" [' + parts[1] + '] "' + parts[2].trim() + '"'
      }
      return 'Compound: Needs two independent clauses joined by a conjunction.'
    }
    if (activeType === 'complex') {
      const markers = ['because', 'although', 'if', 'when', 'while']
      for (const m of markers) {
        const idx = sentence.toLowerCase().indexOf(m)
        if (idx >= 0) {
          return 'Complex: Dependent clause starts with "' + m + '". Find the independent clause after the comma.'
        }
      }
      return 'Complex: Include a subordinating conjunction (because, although, if, when, while).'
    }
    return 'Compound-Complex: Needs 2+ independent clauses + 1 dependent clause.'
  }, [built, activeType])

  const breakdown = built.length > 0 ? getStructureBreakdown() : null

  return (
    <div>
      {/* Structure type tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 6 }}>
        {Object.keys(STRUCTURE_BANKS).map((key) => (
          <button key={key} onClick={() => { setActiveType(key); setBuilt([]) }} style={s.btn(activeType === key)}>
            {STRUCTURE_BANKS[key].label}
          </button>
        ))}
      </div>

      {/* Description & example */}
      <div style={{ fontSize: 10, color: s.text, marginBottom: 2, lineHeight: 1.4 }}>{bank.description}</div>
      <div style={{ fontSize: 10, color: s.bright, fontStyle: 'italic', marginBottom: 6, opacity: 0.8 }}>{bank.example}</div>

      {/* Word bank tiles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
        {bank.words.map((word, i) => (
          <button
            key={word + '-' + i}
            onClick={() => addWord(word)}
            style={{
              padding: '2px 6px', borderRadius: 3, fontSize: 10, cursor: 'pointer',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              border: '1px solid ' + s.border, color: s.bright,
              transition: 'background 0.1s',
            }}
          >
            {word}
          </button>
        ))}
      </div>

      {/* Sentence builder area */}
      <div style={{
        minHeight: 36, padding: '6px 8px', borderRadius: 4,
        background: isDark ? 'rgba(5,150,105,0.06)' : 'rgba(5,150,105,0.04)',
        border: '1px solid ' + (isDark ? 'rgba(5,150,105,0.15)' : 'rgba(5,150,105,0.12)'),
        display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', marginBottom: 6,
      }}>
        {built.length === 0 && <span style={{ fontSize: 10, color: s.text, opacity: 0.5 }}>Click words above to build a sentence...</span>}
        {built.map((w, i) => (
          <span
            key={i}
            onClick={() => removeWord(i)}
            style={{
              fontSize: 11, color: '#34d399', cursor: 'pointer', padding: '1px 3px', borderRadius: 2,
              background: 'rgba(5,150,105,0.12)',
            }}
            title="Click to remove"
          >
            {w}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={clearBuilt} style={s.btn(false)}>Clear</button>
        <button onClick={() => {}} style={s.btn(true)}>Check Structure</button>
      </div>

      {/* Breakdown */}
      {breakdown && (
        <div style={{
          marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 10, color: s.text, lineHeight: 1.4,
          background: isDark ? 'rgba(5,150,105,0.06)' : 'rgba(5,150,105,0.04)',
          border: '1px solid ' + (isDark ? 'rgba(5,150,105,0.15)' : 'rgba(5,150,105,0.12)'),
        }}>
          {breakdown}
        </div>
      )}
    </div>
  )
}

// ============================================================
// 5. FigurativeLanguageFinder
// ============================================================

type FigType = 'simile' | 'metaphor' | 'personification' | 'hyperbole' | 'alliteration' | 'onomatopoeia'

const FIG_TYPES: { id: FigType; label: string; color: string }[] = [
  { id: 'simile', label: 'Simile', color: '#3b82f6' },
  { id: 'metaphor', label: 'Metaphor', color: '#8b5cf6' },
  { id: 'personification', label: 'Personif.', color: '#ec4899' },
  { id: 'hyperbole', label: 'Hyperbole', color: '#f59e0b' },
  { id: 'alliteration', label: 'Alliter.', color: '#10b981' },
  { id: 'onomatopoeia', label: 'Onomatop.', color: '#06b6d4' },
]

const ONOMATOPOEIA_WORDS = ['bang', 'crash', 'buzz', 'hiss', 'pop', 'sizzle', 'roar', 'whisper', 'click', 'boom', 'splash', 'thud', 'crackle', 'clang', 'moo', 'oink', 'meow', 'bark', 'hoot', 'chirp']

const HUMAN_VERBS = ['whispered', 'danced', 'cried', 'sang', 'smiled', 'laughed', 'spoke', 'shouted', 'screamed', 'watched', 'listened', 'breathed', 'stared', 'frowned', 'smirked', 'grinned', 'wept', 'sighed', 'sleeping', 'running', 'walking', 'thinking', 'dreaming']

const NON_HUMAN_NOUNS = ['wind', 'sun', 'moon', 'tree', 'trees', 'river', 'ocean', 'mountain', 'mountains', 'cloud', 'clouds', 'rain', 'storm', 'fire', 'stars', 'sky', 'sea', 'flower', 'flowers', 'rock', 'rocks', 'wave', 'waves', 'forest', 'house', 'door', 'clock', 'road', 'city', 'garden', 'night', 'day', 'shadow', 'shadows', 'earth', 'world', 'heart', 'time']

interface FoundFig {
  start: number
  end: number
  type: FigType
  text: string
}

export function FigurativeLanguageFinder({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [text, setText] = useState('')
  const [activeTypes, setActiveTypes] = useState<Set<FigType>>(new Set())

  const toggleType = useCallback((t: FigType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }, [])

  const findings = useMemo((): FoundFig[] => {
    if (!text.trim() || activeTypes.size === 0) return []
    const results: FoundFig[] = []
    const sentences = text.match(/[^.!?]*[.!?]+/g) || [text]
    let offset = 0

    for (const sentence of sentences) {
      const sentStart = text.indexOf(sentence, offset)
      const sentEnd = sentStart + sentence.length
      offset = sentEnd
      const lower = sentence.toLowerCase()

      // Simile
      if (activeTypes.has('simile')) {
        const similePatterns = [/like a\s+\w+/gi, /as a\s+\w+/gi, /as\s+(\w+)\s+as\s+(\w+)/gi]
        for (const pat of similePatterns) {
          let m: RegExpExecArray | null
          while ((m = pat.exec(sentence)) !== null) {
            results.push({ start: sentStart + m.index, end: sentStart + m.index + m[0].length, type: 'simile', text: m[0] })
          }
        }
      }

      // Metaphor
      if (activeTypes.has('metaphor')) {
        const metPatterns = [/\b(he|she|it|they|this|that|love|life|time|world)\s+(is|was|were|are)\s+a\s+\w+/gi]
        for (const pat of metPatterns) {
          let m: RegExpExecArray | null
          while ((m = pat.exec(sentence)) !== null) {
            results.push({ start: sentStart + m.index, end: sentStart + m.index + m[0].length, type: 'metaphor', text: m[0] })
          }
        }
      }

      // Personification
      if (activeTypes.has('personification')) {
        for (const noun of NON_HUMAN_NOUNS) {
          for (const verb of HUMAN_VERBS) {
            const pattern = '\\b' + noun + '\\b.{0,20}\\b' + verb + '\\b'
            const re = new RegExp(pattern, 'gi')
            let m: RegExpExecArray | null
            while ((m = re.exec(sentence)) !== null) {
              results.push({ start: sentStart + m.index, end: sentStart + m.index + m[0].length, type: 'personification', text: m[0] })
            }
          }
        }
      }

      // Hyperbole
      if (activeTypes.has('hyperbole')) {
        const hyperPatterns = [/\b(million|billion|trillion)\b/gi, /\b(forever|infinity|never|always)\b/gi, /\btons? of\b/gi, /\bweigh\s+a\s+ton\b/gi]
        for (const pat of hyperPatterns) {
          let m: RegExpExecArray | null
          while ((m = pat.exec(sentence)) !== null) {
            results.push({ start: sentStart + m.index, end: sentStart + m.index + m[0].length, type: 'hyperbole', text: m[0] })
          }
        }
      }

      // Alliteration
      if (activeTypes.has('alliteration')) {
        const words = sentence.trim().split(/\s+/)
        for (let i = 0; i < words.length - 1; i++) {
          const w1 = words[i].replace(/[^a-z]/gi, '').toLowerCase()
          const w2 = words[i + 1].replace(/[^a-z]/gi, '').toLowerCase()
          if (w1.length > 0 && w2.length > 0 && w1[0] === w2[0]) {
            const matchText = w1 + ' ' + w2
            const idx = sentence.toLowerCase().indexOf(matchText)
            if (idx >= 0) {
              results.push({ start: sentStart + idx, end: sentStart + idx + matchText.length, type: 'alliteration', text: matchText })
            }
          }
        }
      }

      // Onomatopoeia
      if (activeTypes.has('onomatopoeia')) {
        for (const ow of ONOMATOPOEIA_WORDS) {
          const re = new RegExp('\\b' + ow + '\\b', 'gi')
          let m: RegExpExecArray | null
          while ((m = re.exec(sentence)) !== null) {
            results.push({ start: sentStart + m.index, end: sentStart + m.index + m[0].length, type: 'onomatopoeia', text: m[0] })
          }
        }
      }
    }

    // Sort by position and deduplicate overlapping
    results.sort((a, b) => a.start - b.start)
    return dedupFindings(results)
  }, [text, activeTypes])

  // Render highlighted text
  const renderHighlighted = useMemo(() => {
    if (findings.length === 0) return null
    const parts: React.ReactNode[] = []
    let cursor = 0
    for (const f of findings) {
      if (f.start > cursor) {
        parts.push(<span key={'t-' + cursor}>{text.substring(cursor, f.start)}</span>)
      }
      const color = FIG_TYPES.find((ft) => ft.id === f.type)?.color || '#94a3b8'
      parts.push(
        <span
          key={'f-' + f.start + '-' + f.type}
          style={{
            background: color + '30', borderBottom: '2px solid ' + color,
            padding: '0 2px', borderRadius: 2, position: 'relative',
          }}
          title={f.type + ': ' + f.text}
        >
          {text.substring(f.start, f.end)}
        </span>
      )
      cursor = f.end
    }
    if (cursor < text.length) {
      parts.push(<span key={'t-' + cursor}>{text.substring(cursor)}</span>)
    }
    return parts
  }, [text, findings])

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Paste text here to find figurative language...\n\nTry: \"The wind whispered through the trees like a ghost. The sun is a golden coin. I've told you a million times! The cat meowed and the crash echoed forever."}
        rows={5}
        style={{
          ...s.input, width: '100%', resize: 'vertical', minHeight: 60, lineHeight: 1.5,
          fontFamily: 'inherit', boxSizing: 'border-box',
        }}
      />

      {/* Type buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 6 }}>
        {FIG_TYPES.map((ft) => {
          const active = activeTypes.has(ft.id)
          return (
            <button
              key={ft.id}
              onClick={() => toggleType(ft.id)}
              style={{
                ...s.btn(active),
                borderLeft: active ? '3px solid ' + ft.color : '3px solid transparent',
              }}
            >
              {ft.label}
            </button>
          )
        })}
      </div>

      {/* Highlighted output */}
      {renderHighlighted && (
        <div style={{
          marginTop: 6, padding: '8px', borderRadius: 4, lineHeight: 1.6, fontSize: 11, color: s.bright,
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          border: '1px solid ' + s.border,
        }}>
          {renderHighlighted}
        </div>
      )}

      {/* Legend */}
      {findings.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {FIG_TYPES.filter((ft) => findings.some((f) => f.type === ft.id)).map((ft) => (
            <span key={ft.id} style={{ fontSize: 9, display: 'flex', alignItems: 'center', gap: 3, color: s.text }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: ft.color, display: 'inline-block' }} />
              {ft.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function dedupFindings(findings: FoundFig[]): FoundFig[] {
  const result: FoundFig[] = []
  for (const f of findings) {
    const overlaps = result.some((r) => f.start < r.end && f.end > r.start)
    if (!overlaps) result.push(f)
  }
  return result
}
