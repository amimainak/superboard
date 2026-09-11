'use client'

import React, { useState, useMemo, useCallback } from 'react'
import nlp from 'compromise'
import { TutorReveal } from '../shared/TutorReveal'

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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Card {index + 1} of {total}{mode === 'study' && total > 0 ? <> — front: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{current.word}</b> ({current.pos})</> : ' — no cards yet'}</div>
          <div>Step 2: {!flipped ? 'Try to recall the meaning before flipping' : <>Flipped — definition: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{current.definition}</b></>}</div>
          <div>Step 3: {!flipped ? 'Click the card to flip and check' : <>Example: &quot;{current.example}&quot;</>}</div>
          <div>Step 4: Break <b style={{ color: isDark ? '#34d399' : '#059669' }}>{current.word}</b> into parts (prefix + root + suffix)</div>
          <div>Step 5: Use the roots to infer meaning, then verify against the definition above</div>
          <div>Step 6: Use <b style={{ color: isDark ? '#34d399' : '#059669' }}>{current.word}</b> in your own sentence to cement it</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Vocabulary builds through exposure. Learn word parts (prefix/root/suffix). Read widely — context is how the brain learns best.
      </div>
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Input — {text.trim() ? <>{text.trim().split(/\s+/).length} words pasted</> : <span style={{ opacity: 0.6 }}>no text yet</span>}</div>
          <div>Step 2: {analysis ? <>Counts: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{analysis.wordCount}</b> words / {analysis.sentenceCount} sentences / {analysis.paragraphCount} paragraphs</> : 'Paste text to analyze'}</div>
          <div>Step 3: {analysis ? <>Avg {analysis.avgWordsPerSentence.toFixed(1)} words per sentence</> : '?'}</div>
          <div>Step 4: {analysis ? <>Flesch-Kincaid grade level: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{analysis.fleschKincaid.toFixed(1)}</b> GL</> : '?'}</div>
          <div>Step 5: {analysis && analysis.topWords.length > 0 ? <>Top words: {analysis.topWords.map(([w, c]) => w + ' (' + c + ')').join(', ')}</> : 'No top words yet'}</div>
          <div>Step 6: Read literally first, then infer, then evaluate — don&apos;t skip to evaluation</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Literal (what happened), inferential (what it means), evaluative (is it good). Don't skip to evaluation.
      </div>
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: {data.title || data.author ? <>Title: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{data.title || '?'}</b>{data.author ? <> by {data.author}</> : null}</> : 'Title/author not specified'}</div>
          <div>Step 2: {data.protagonist || data.antagonist ? <>Characters: {data.protagonist || '?'} (protagonist) vs {data.antagonist || '?'} (antagonist)</> : 'Characters not specified'}</div>
          <div>Step 3: {data.settingTime || data.settingPlace ? <>Setting: {data.settingTime || '?'} @ {data.settingPlace || '?'}</> : 'Setting not specified'}</div>
          <div>Step 4: Conflict — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{data.conflictType}</b></div>
          <div>Step 5: Plot — Rising: {data.risingAction ? truncate(data.risingAction, 30) : '?'} | Climax: {data.climax ? truncate(data.climax, 30) : '?'} | Resolution: {data.resolution ? truncate(data.resolution, 30) : '?'}</div>
          <div>Step 6: Theme — {data.theme ? <b style={{ color: isDark ? '#34d399' : '#059669' }}>{data.theme}</b> : <span style={{ opacity: 0.6 }}>not specified</span>}{showViz ? ' (mountain visualized above)' : ' — click "Visualize Story Mountain"'}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Characters (who), setting (where/when), plot (what), conflict (problem), theme (message). Map these to understand the story's construction.
      </div>
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Structure type — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{bank.label}</b></div>
          <div>Step 2: Built sentence — {built.length > 0 ? <b style={{ color: isDark ? '#34d399' : '#059669' }}>{built.join(' ')}</b> : <span style={{ opacity: 0.6 }}>no words added yet</span>}</div>
          <div>Step 3: Word count: {built.length} {built.length === 1 ? 'token' : 'tokens'}</div>
          <div>Step 4: {breakdown ? <span style={{ color: isDark ? '#34d399' : '#059669' }}>{breakdown}</span> : 'Add words to see structure analysis'}</div>
          <div>Step 5: One independent clause = Simple sentence</div>
          <div>Step 6: Two independent + FANBOYS = Compound</div>
          <div>Step 7: Independent + dependent = Complex</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Sentence = subject + predicate. "The cat sat." Add adjectives, adverbs, phrases to expand. Same structure, more detail.
      </div>
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Input — {text.trim() ? <>{text.trim().split(/\s+/).length} words pasted</> : <span style={{ opacity: 0.6 }}>no text yet</span>}</div>
          <div>Step 2: Active types: {activeTypes.size === 0 ? <span style={{ opacity: 0.6 }}>none selected — toggle types above</span> : <b style={{ color: isDark ? '#34d399' : '#059669' }}>{Array.from(activeTypes).join(', ')}</b>}</div>
          <div>Step 3: Findings: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{findings.length}</b> {findings.length === 1 ? 'match' : 'matches'}</div>
          <div>Step 4: {findings.length > 0 ? <>Found types: {Array.from(new Set(findings.map((f) => f.type))).join(', ')}</> : 'No matches yet'}</div>
          <div>Step 5: &quot;like&quot;/&quot;as&quot; → SIMILE; X IS Y → METAPHOR; non-human doing human actions → PERSONIFICATION</div>
          <div>Step 6: Extreme exaggeration → HYPERBOLE; word sounds like its meaning → ONOMATOPOEIA; same starting sound → ALLITERATION</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Simile (like/as), Metaphor (is), Personification (human qualities), Hyperbole (exaggeration). Look for signal words.
      </div>
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

// ============================================================
// Phonics & Decoding Builder (K-3)
// ============================================================

const PHONEME_HL = [
  { bg: 'rgba(239,68,68,0.18)', bd: 'rgba(239,68,68,0.5)', tx: '#f87171' },
  { bg: 'rgba(34,197,94,0.18)', bd: 'rgba(34,197,94,0.5)', tx: '#4ade80' },
  { bg: 'rgba(249,115,22,0.18)', bd: 'rgba(249,115,22,0.5)', tx: '#fb923c' },
  { bg: 'rgba(168,85,247,0.18)', bd: 'rgba(168,85,247,0.5)', tx: '#c084fc' },
  { bg: 'rgba(236,72,153,0.18)', bd: 'rgba(236,72,153,0.5)', tx: '#f472b6' },
  { bg: 'rgba(20,184,166,0.18)', bd: 'rgba(20,184,166,0.5)', tx: '#2dd4bf' },
]

const P_CONS = ['b','c','d','f','g','h','j','k','l','m','n','p','r','s','t','v','w','x','y','z']
const P_VOW = ['a','e','i','o','u']

const P_DIGRAPH = [
  { t: 'ch', snd: '/ch/', ex: 'chip, chat, chop' },
  { t: 'sh', snd: '/sh/', ex: 'ship, shop, shut' },
  { t: 'th', snd: '/th/', ex: 'that, them, thin' },
  { t: 'wh', snd: '/wh/', ex: 'when, what, why' },
  { t: 'ph', snd: '/f/', ex: 'phone, photo, graph' },
  { t: 'ck', snd: '/k/', ex: 'duck, lock, sock' },
  { t: 'ng', snd: '/ng/', ex: 'sing, ring, long' },
  { t: 'qu', snd: '/kw/', ex: 'quit, quiz, queen' },
]

const P_BLEND = [
  { t: 'bl', w: 'blow, blue, blob' }, { t: 'br', w: 'bread, bring, broom' },
  { t: 'cl', w: 'clap, clip, clue' }, { t: 'cr', w: 'crab, crop, crew' },
  { t: 'dr', w: 'drop, drum, draw' }, { t: 'fl', w: 'flag, flip, flow' },
  { t: 'fr', w: 'frog, from, frost' }, { t: 'gl', w: 'glow, glide, glass' },
  { t: 'gr', w: 'grab, green, grin' }, { t: 'pl', w: 'play, plug, plot' },
  { t: 'pr', w: 'pray, press, prize' }, { t: 'sc', w: 'scan, scam, scoop' },
  { t: 'sk', w: 'skip, skin, skate' }, { t: 'sl', w: 'slip, slug, slam' },
  { t: 'sm', w: 'smile, smell, small' }, { t: 'sn', w: 'snap, snip, snail' },
  { t: 'sp', w: 'spin, spot, spoon' }, { t: 'st', w: 'stop, step, star' },
  { t: 'sw', w: 'swim, swing, sweet' }, { t: 'tr', w: 'trip, tree, trap' },
  { t: 'tw', w: 'twin, two, twist' },
]

const SYLL_DATA = [
  { name: 'Closed', pat: 'CVC', col: '#f87171', bg: 'rgba(239,68,68,0.08)', bd: 'rgba(239,68,68,0.3)', ex: 'cat', ph: '/k/ /a/ /t/', desc: 'Short vowel sound, closed in by a consonant. The vowel makes its short sound.' },
  { name: 'Open', pat: 'CV', col: '#4ade80', bg: 'rgba(34,197,94,0.08)', bd: 'rgba(34,197,94,0.3)', ex: 'me', ph: '/m/ /e/', desc: 'Ends with a single vowel that says its name (long sound). The syllable is open.' },
  { name: 'Silent-E', pat: 'CVCe', col: '#fb923c', bg: 'rgba(249,115,22,0.08)', bd: 'rgba(249,115,22,0.3)', ex: 'cake', ph: '/k/ /a/ /k/', desc: 'The final e is silent and makes the preceding vowel say its long sound.' },
  { name: 'Vowel Team', pat: 'VV', col: '#c084fc', bg: 'rgba(168,85,247,0.08)', bd: 'rgba(168,85,247,0.3)', ex: 'boat', ph: '/b/ /o/ /t/', desc: 'Two vowels work together to make one sound. Often the first vowel is long.' },
  { name: 'R-Controlled', pat: 'VR', col: '#f472b6', bg: 'rgba(236,72,153,0.08)', bd: 'rgba(236,72,153,0.3)', ex: 'car', ph: '/k/ /ar/', desc: 'A vowel followed by r makes a special sound. The r controls the vowel sound.' },
  { name: 'Consonant-le', pat: '-cle', col: '#2dd4bf', bg: 'rgba(20,184,166,0.08)', bd: 'rgba(20,184,166,0.3)', ex: 'ta-ble', ph: '/t/ /a/ /b/ /l/', desc: 'An unaccented final syllable with a consonant + le. The e is silent.' },
]

const FAM_DATA = [
  { rime: '-at', words: ['cat','bat','hat','mat','sat','rat'] },
  { rime: '-an', words: ['can','fan','man','pan','ran','van'] },
  { rime: '-ig', words: ['pig','dig','big','wig','rig','fig'] },
  { rime: '-og', words: ['dog','log','fog','hog','jog','bog'] },
  { rime: '-op', words: ['hop','top','mop','pop','cop','bop'] },
  { rime: '-ug', words: ['bug','hug','rug','mug','jug','dug'] },
  { rime: '-et', words: ['pet','wet','get','set','bet','met'] },
  { rime: '-in', words: ['pin','win','fin','bin','tin','kin'] },
]

function segPhonemes(word: string): Array<{ t: string; ci: number }> {
  const res: Array<{ t: string; ci: number }> = []
  let i = 0
  const w = word.toLowerCase()
  const dgs = ['ch','sh','th','wh','ph','ck','ng','qu']
  while (i < w.length) {
    let found = false
    if (i + 1 < w.length) {
      const pr = w[i] + w[i + 1]
      for (let d = 0; d < dgs.length; d++) {
        if (dgs[d] === pr) {
          res.push({ t: pr, ci: res.length % PHONEME_HL.length })
          i += 2
          found = true
          break
        }
      }
    }
    if (!found) {
      res.push({ t: w[i], ci: res.length % PHONEME_HL.length })
      i++
    }
  }
  return res
}

function segOnsetRime(word: string): { onset: string; rime: string } | null {
  const w = word.toLowerCase()
  if (w.length < 2) return null
  const ons = ['sch','scr','spr','str','squ','thr','chr','shr','ch','sh','th','wh','ph','bl','br','cl','cr','dr','fl','fr','gl','gr','pl','pr','sc','sk','sl','sm','sn','sp','st','sw','tr','tw','qu','kn','wr']
  for (let o = 0; o < ons.length; o++) {
    if (w.indexOf(ons[o]) === 0 && w.length > ons[o].length) {
      return { onset: ons[o], rime: w.slice(ons[o].length) }
    }
  }
  const vw = 'aeiouy'
  let vi = -1
  for (let j = 0; j < w.length; j++) {
    if (vw.indexOf(w[j]) !== -1) { vi = j; break }
  }
  if (vi > 0) return { onset: w.slice(0, vi), rime: w.slice(vi) }
  return null
}

export function PhonicsDecodingBuilder({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [tab, setTab] = useState('Build Words')
  const [built, setBuilt] = useState<string[]>([])
  const [famIdx, setFamIdx] = useState(0)
  const [sylIdx, setSylIdx] = useState(0)

  const word = built.join('')
  const phs = word.length > 0 ? segPhonemes(word) : []
  const wordOr = word.length > 1 ? segOnsetRime(word) : null

  const addL = useCallback((l: string) => setBuilt(function(p) { return [...p, l] }), [])
  const bksp = useCallback(function() { setBuilt(function(p) { return p.slice(0, -1) }) }, [])
  const clr = useCallback(function() { setBuilt([]) }, [])

  const tabs = ['Build Words', 'Word Families', 'Syllable Types', 'Digraphs & Blends']

  return (
    <div style={{ fontSize: 12, color: s.text }}>
      <div style={{ display: 'flex', gap: 2, marginBottom: 10, flexWrap: 'wrap' }}>
        {tabs.map(function(t, i) {
          return (
            <button key={i} onClick={function() { setTab(t) }} style={{
              ...s.btn(tab === t), fontSize: 10, padding: '3px 8px',
            }}>
              {t}
            </button>
          )
        })}
      </div>

      {tab === 'Build Words' && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, color: s.text, letterSpacing: 0.5, marginBottom: 3 }}>CONSONANTS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
            {P_CONS.map(function(c, i) {
              return (
                <button key={i} onClick={function() { addL(c) }} style={{
                  width: 30, height: 30, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer' as const,
                  background: isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.12)',
                  border: '1px solid ' + (isDark ? 'rgba(20,184,166,0.3)' : 'rgba(20,184,166,0.35)'),
                  color: '#2dd4bf',
                }}>{c}</button>
              )
            })}
          </div>

          <div style={{ fontSize: 9, fontWeight: 600, color: s.text, letterSpacing: 0.5, marginBottom: 3 }}>VOWELS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
            {P_VOW.map(function(v, i) {
              return (
                <button key={i} onClick={function() { addL(v) }} style={{
                  width: 34, height: 34, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer' as const,
                  background: isDark ? 'rgba(249,115,22,0.18)' : 'rgba(249,115,22,0.14)',
                  border: '1px solid ' + (isDark ? 'rgba(249,115,22,0.35)' : 'rgba(249,115,22,0.4)'),
                  color: '#fb923c',
                }}>{v}</button>
              )
            })}
          </div>

          <div style={{ fontSize: 9, fontWeight: 600, color: s.text, letterSpacing: 0.5, marginBottom: 3 }}>DIGRAPHS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 10 }}>
            {P_DIGRAPH.map(function(d, i) {
              return (
                <button key={i} onClick={function() { addL(d.t) }} style={{
                  width: 36, height: 30, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer' as const,
                  background: isDark ? 'rgba(168,85,247,0.18)' : 'rgba(168,85,247,0.14)',
                  border: '1px solid ' + (isDark ? 'rgba(168,85,247,0.35)' : 'rgba(168,85,247,0.4)'),
                  color: '#c084fc',
                }}>{d.t}</button>
              )
            })}
          </div>

          <div style={{ padding: 10, borderRadius: 6, background: s.bg, border: '1px solid ' + s.border }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: s.text, letterSpacing: 0.5, marginBottom: 6 }}>YOUR WORD</div>

            {word.length === 0 ? (
              <div style={{ fontSize: 12, color: s.text, fontStyle: 'italic' }}>Click tiles above to build a word!</div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 6 }}>
                  {phs.map(function(p, i) {
                    const c = PHONEME_HL[p.ci]
                    return (
                      <div key={i} style={{
                        padding: '6px 10px', borderRadius: 6, fontSize: 22, fontWeight: 700,
                        background: c.bg, border: '2px solid ' + c.bd, color: c.tx,
                      }}>{p.t}</div>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 8 }}>
                  {phs.map(function(p, i) {
                    const c = PHONEME_HL[p.ci]
                    return (
                      <div key={i} style={{ fontSize: 10, color: c.tx, fontWeight: 600, textAlign: 'center' as const, minWidth: 34 }}>
                        /{p.t}/
                      </div>
                    )
                  })}
                </div>

                {wordOr && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 6, paddingTop: 6, borderTop: '1px solid ' + s.border }}>
                    <div style={{ padding: '4px 10px', borderRadius: 4, fontSize: 14, fontWeight: 600, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                      {wordOr.onset}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: s.text }}>+</span>
                    <div style={{ padding: '4px 10px', borderRadius: 4, fontSize: 14, fontWeight: 600, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}>
                      {wordOr.rime}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: s.text }}>=</span>
                    <div style={{ padding: '4px 10px', borderRadius: 4, fontSize: 14, fontWeight: 700, background: s.bg, border: '1px solid ' + s.border, color: s.bright }}>
                      {word}
                    </div>
                  </div>
                )}
              </div>
            )}

            {word.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button onClick={clr} style={{ ...s.btn(false), fontSize: 10, padding: '3px 10px' }}>Clear</button>
                <button onClick={bksp} style={{ ...s.btn(false), fontSize: 10, padding: '3px 10px' }}>Backspace</button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'Word Families' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 10 }}>
            {FAM_DATA.map(function(f, i) {
              return (
                <button key={i} onClick={function() { setFamIdx(i) }} style={{ ...s.btn(i === famIdx), fontSize: 11, padding: '3px 8px' }}>
                  {f.rime}
                </button>
              )
            })}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: s.bright, marginBottom: 8 }}>
            The {FAM_DATA[famIdx].rime} Family
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {FAM_DATA[famIdx].words.map(function(w, i) {
              const wOr = segOnsetRime(w)
              const wPh = segPhonemes(w)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px', borderRadius: 5, background: s.bg, border: '1px solid ' + s.border }}>
                  {wOr && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ padding: '3px 7px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', minWidth: 24, textAlign: 'center' as const }}>
                        {wOr.onset}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: s.text }}>+</span>
                      <div style={{ padding: '3px 7px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', minWidth: 24, textAlign: 'center' as const }}>
                        {wOr.rime}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: s.text }}>=</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 2 }}>
                    {wPh.map(function(p, j) {
                      const c = PHONEME_HL[p.ci]
                      return (
                        <span key={j} style={{ padding: '2px 5px', borderRadius: 3, fontSize: 12, fontWeight: 600, background: c.bg, border: '1px solid ' + c.bd, color: c.tx }}>
                          {p.t}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'Syllable Types' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SYLL_DATA.map(function(st, i) {
              return (
                <div key={i} onClick={function() { setSylIdx(i) }} style={{
                  flex: '1 1 0%', minWidth: 130, padding: '8px', borderRadius: 6, cursor: 'pointer' as const,
                  background: i === sylIdx ? st.bg : s.bg,
                  border: '1px solid ' + (i === sylIdx ? st.bd : s.border),
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: i === sylIdx ? st.col : s.bright, marginBottom: 2 }}>{st.name}</div>
                  <div style={{ fontSize: 10, color: s.text }}>Pattern: <span style={{ fontWeight: 600, color: s.bright }}>{st.pat}</span></div>
                  <div style={{ fontSize: 10, color: s.text }}>Example: <span style={{ fontWeight: 700, color: st.col }}>{st.ex}</span></div>
                </div>
              )
            })}
          </div>

          {function() {
            const sd = SYLL_DATA[sylIdx]
            return (
              <div style={{ marginTop: 8, padding: 10, borderRadius: 6, background: sd.bg, border: '1px solid ' + sd.bd }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: sd.col, marginBottom: 4 }}>{sd.name} Syllable</div>
                <div style={{ fontSize: 11, color: s.text, marginBottom: 4 }}>
                  Pattern: <span style={{ fontWeight: 700, color: s.bright, fontSize: 13 }}>{sd.pat}</span>
                </div>
                <div style={{ fontSize: 11, color: s.text, marginBottom: 4 }}>
                  Example: <span style={{ fontWeight: 700, color: sd.col, fontSize: 15 }}>{sd.ex}</span>
                </div>
                <div style={{ fontSize: 11, color: s.text, marginBottom: 4 }}>
                  Phonemes: <span style={{ fontWeight: 600, color: s.bright }}>{sd.ph}</span>
                </div>
                <div style={{ fontSize: 11, color: s.text, lineHeight: 1.5, marginTop: 4 }}>{sd.desc}</div>
              </div>
            )
          }()}
        </div>
      )}

      {tab === 'Digraphs & Blends' && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, color: s.text, letterSpacing: 0.5, marginBottom: 4 }}>DIGRAPHS (two letters, one sound)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {P_DIGRAPH.map(function(d, i) {
              return (
                <div key={i} style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#c084fc' }}>{d.t}</div>
                  <div style={{ fontSize: 9, color: '#c084fc', fontWeight: 600 }}>{d.snd}</div>
                  <div style={{ fontSize: 9, color: s.text, marginTop: 2 }}>{d.ex}</div>
                </div>
              )
            })}
          </div>

          <div style={{ fontSize: 9, fontWeight: 600, color: s.text, letterSpacing: 0.5, marginBottom: 4 }}>BLENDS (two consonants, two sounds blended)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 384, overflowY: 'auto' }}>
            {P_BLEND.map(function(b, i) {
              return (
                <div key={i} style={{ padding: '4px 8px', borderRadius: 4, background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f472b6' }}>{b.t}</div>
                  <div style={{ fontSize: 9, color: s.text, marginTop: 1 }}>{b.w}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Active tab — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{tab}</b></div>
          <div>Step 2: {word ? <>Word built: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{word}</b> ({phs.length} phoneme{phs.length === 1 ? '' : 's'})</> : <span style={{ opacity: 0.6 }}>click letter tiles to build a word</span>}</div>
          <div>Step 3: {phs.length > 0 ? <>Phonemes: {phs.map((p) => '/' + p.t + '/').join(' ')}</> : '?'}</div>
          <div>Step 4: {wordOr ? <>Onset + Rime: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{wordOr.onset}</b> + <b style={{ color: isDark ? '#34d399' : '#059669' }}>{wordOr.rime}</b></> : 'Word too short for onset-rime split'}</div>
          <div>Step 5: {tab === 'Syllable Types' ? <>Selected: {SYLL_DATA[sylIdx].name} ({SYLL_DATA[sylIdx].pat}) — ex: {SYLL_DATA[sylIdx].ex}</> : tab === 'Word Families' ? <>Family: {FAM_DATA[famIdx].rime} — {FAM_DATA[famIdx].words.length} words</> : 'Sound out each syllable from left to right'}</div>
          <div>Step 6: {tab === 'Digraphs & Blends' ? 'Digraphs = 1 sound (sh, ch); Blends = 2 sounds (st, bl)' : 'Blend the sounds together to read the whole word'}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Digraphs: two letters, one sound (sh, ch). Blends: two letters, two sounds (st, bl). Teach the pattern, not each word.
      </div>
</div>
  )
}

// ============================================================
// Parts of Speech Tagger (3-8)
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
  Determiner: { bg: 'rgba(156,163,175,0.15)', bd: 'rgba(156,163,175,0.4)', tx: '#9ca3af' },
  Auxiliary: { bg: 'rgba(244,114,182,0.15)', bd: 'rgba(244,114,182,0.4)', tx: '#f472b6' },
  Particle: { bg: 'rgba(251,191,36,0.15)', bd: 'rgba(251,191,36,0.4)', tx: '#fbbf24' },
}

const BEGINNER_POS = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Pronoun', 'Preposition', 'Conjunction', 'Interjection']

interface TaggedTerm {
  text: string
  pos: string
  allTags: string[]
}

function getPrimaryPOS(tags: string[], text: string, allTerms: Array<{text: string; tags: string[]}>, idx: number): string {
  const textLower = text.toLowerCase()

  // Cardinal/Value numbers (seven, ten, twenty) -> Determiner
  if (tags.indexOf('Value') !== -1 || tags.indexOf('Cardinal') !== -1) return 'Determiner'

  // Demonyms (American, British, Japanese) -> Adjective
  if (tags.indexOf('Demonym') !== -1) return 'Adjective'

  // Possessive pronouns: before-noun forms -> Determiner, standalone -> Pronoun
  if (tags.indexOf('Possessive') !== -1) {
    const detForms: Record<string, boolean> = {}
    const detList = ['my', 'your', 'his', 'her', 'its', 'our', 'their']
    for (let d = 0; d < detList.length; d++) detForms[detList[d]] = true
    if (detForms[textLower]) return 'Determiner'
    return 'Pronoun'
  }

  // Past participles as adjectives: if past tense verb appears after determiner and before noun
  if (tags.indexOf('PastTense') !== -1 && tags.indexOf('Verb') !== -1) {
    if (tags.indexOf('Adjective') !== -1) return 'Adjective'
    if (idx > 0 && idx + 1 < allTerms.length) {
      const prevTags = allTerms[idx - 1].tags
      const prevIsDet = prevTags.indexOf('Determiner') !== -1 || prevTags.indexOf('Article') !== -1
      if (prevIsDet) {
        const nextTags = allTerms[idx + 1].tags
        if (nextTags.indexOf('Noun') !== -1) return 'Adjective'
      }
    }
  }

  // Main priority: Determiner and Pronoun before Noun
  const priority = ['Determiner', 'Pronoun', 'Adjective', 'Verb', 'Noun', 'Adverb', 'Preposition', 'Conjunction', 'Auxiliary', 'Interjection', 'Particle']
  for (let i = 0; i < priority.length; i++) {
    for (let j = 0; j < tags.length; j++) {
      if (tags[j] === priority[i]) return priority[i]
    }
  }
  return 'Unknown'
}

function getPOSExplanation(word: string, pos: string, tags: string[]): string {
  if (pos === 'Noun') {
    return 'A noun names a person, place, thing, or idea. "' + word + '" functions as a noun here because it represents a ' + (tags.indexOf('ProperNoun') !== -1 ? 'specific name (proper noun)' : tags.indexOf('Plural') !== -1 ? 'thing in plural form' : 'person, place, thing, or idea') + ' in the sentence.'
  }
  if (pos === 'Verb') {
    return 'A verb shows an action or a state of being. "' + word + '" is a verb because it ' + (tags.indexOf('PastTense') !== -1 ? 'describes an action that already happened (past tense)' : tags.indexOf('PresentTense') !== -1 ? 'describes an action happening now (present tense)' : tags.indexOf('Infinitive') !== -1 ? 'is in its base/to form (infinitive)' : tags.indexOf('Gerund') !== -1 ? 'functions as a verb ending in -ing (gerund)' : tags.indexOf('Copula') !== -1 ? 'is a linking verb connecting subject to description' : 'expresses an action or state of being') + '.'
  }
  if (pos === 'Adjective') {
    return 'An adjective describes or modifies a noun. "' + word + '" is an adjective because it tells us more about a noun in the sentence.'
  }
  if (pos === 'Adverb') {
    return 'An adverb describes a verb, adjective, or another adverb. "' + word + '" is an adverb because it modifies another word, often telling how, when, or where.'
  }
  if (pos === 'Pronoun') {
    return 'A pronoun takes the place of a noun. "' + word + '" is a pronoun because it ' + (tags.indexOf('Subject') !== -1 ? 'replaces a subject noun' : tags.indexOf('Object') !== -1 ? 'replaces an object noun' : tags.indexOf('Possessive') !== -1 ? 'shows ownership, replacing a possessive noun' : 'replaces a noun to avoid repetition') + '.'
  }
  if (pos === 'Preposition') {
    return 'A preposition shows the relationship between a noun/pronoun and other words. "' + word + '" links its object to another part of the sentence.'
  }
  if (pos === 'Conjunction') {
    return 'A conjunction connects words, phrases, or clauses. "' + word + '" joins parts of the sentence together.'
  }
  if (pos === 'Interjection') {
    return 'An interjection expresses strong emotion or surprise. "' + word + '" conveys feeling and is usually followed by an exclamation mark or comma.'
  }
  if (pos === 'Determiner') {
    return 'A determiner introduces a noun and gives context. "' + word + '" is a determiner because it specifies which noun is being referred to (like a, an, the, this, some).'
  }
  if (pos === 'Auxiliary') {
    return 'An auxiliary (helping) verb helps the main verb. "' + word + '" works with a main verb to show tense, mood, or voice.'
  }
  if (pos === 'Particle') {
    return 'A particle is a small word that changes a verb\'s meaning. "' + word + '" combines with a verb to create a phrasal verb with a new meaning.'
  }
  return 'This word could not be classified into a standard part of speech category.'
}

export function PartsOfSpeechTagger({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [sentence, setSentence] = useState('')
  const [tagged, setTagged] = useState<TaggedTerm[]>([])
  const [advanced, setAdvanced] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const handleTag = useCallback(function() {
    if (!sentence.trim()) return
    const doc = nlp(sentence)
    const data = doc.json()
    if (!data || !data[0] || !data[0].terms) return
    const terms = data[0].terms
    const result: TaggedTerm[] = []
    for (let i = 0; i < terms.length; i++) {
      result.push({
        text: terms[i].text,
        pos: getPrimaryPOS(terms[i].tags, terms[i].text, terms, i),
        allTags: terms[i].tags,
      })
    }
    setTagged(result)
    setSelectedIdx(null)
  }, [sentence])

  const activePOS = advanced
    ? Object.keys(POS_COLORS)
    : BEGINNER_POS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: s.bright, marginBottom: 2 }}>Parts of Speech Tagger (Grades 3-8)</div>

      <textarea
        value={sentence}
        onChange={function(e) { setSentence(e.target.value) }}
        placeholder="Type or paste a sentence here..."
        rows={3}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 6,
          fontSize: 12,
          lineHeight: 1.5,
          border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          color: isDark ? '#e2e8f0' : '#1e293b',
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <button
          onClick={handleTag}
          style={{
            padding: '6px 14px',
            borderRadius: 5,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer' as const,
            background: 'rgba(5,150,105,0.15)',
            border: '1px solid rgba(5,150,105,0.3)',
            color: '#34d399',
          }}
        >
          Tag Sentence
        </button>

        <button
          onClick={function() { setAdvanced(!advanced) }}
          style={s.btn(advanced)}
        >
          {advanced ? 'Advanced Mode' : 'Beginner Mode'}
        </button>

        {tagged.length > 0 && (
          <span style={{ fontSize: 9, color: s.text, marginLeft: 'auto' }}>
            {advanced ? '11' : '8'} parts of speech
          </span>
        )}
      </div>

      {tagged.length > 0 && (
        <TutorReveal isDark={isDark} label="POS Analysis">
          <div style={{
            padding: 10,
            borderRadius: 6,
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'),
            lineHeight: 2.4,
            marginBottom: 8,
          }}>
            {tagged.map(function(t, i) {
              const colors = POS_COLORS[t.pos]
              const isActive = activePOS.indexOf(t.pos) !== -1
              const isSelected = selectedIdx === i
              if (!isActive || !colors) {
                return (
                  <span key={i} style={{ marginRight: 6, color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)', fontSize: 13 }}>
                    {t.text}
                  </span>
                )
              }
              return (
                <span
                  key={i}
                  onClick={function() { setSelectedIdx(isSelected ? null : i) }}
                  style={{
                    display: 'inline-block',
                    padding: '2px 6px',
                    margin: '2px 2px',
                    borderRadius: 4,
                    background: isSelected ? colors.bd : colors.bg,
                    border: '1px solid ' + colors.bd,
                    color: colors.tx,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer' as const,
                  }}
                >
                  {t.text}
                </span>
              )
            })}
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 10,
            padding: '6px 8px',
            borderRadius: 4,
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          }}>
            {activePOS.map(function(pos) {
              const c = POS_COLORS[pos]
              if (!c) return null
              return (
                <div key={pos} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c.tx }} />
                  <span style={{ fontSize: 9, color: s.text }}>{pos}</span>
                </div>
              )
            })}
          </div>

          <div style={{
            padding: 10,
            borderRadius: 6,
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'),
            marginBottom: 8,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 6 }}>
              SENTENCE SKELETON (NOUNS &amp; VERBS)
            </div>
            <div style={{ lineHeight: 2.2 }}>
              {tagged.map(function(t, i) {
                const isCore = t.pos === 'Noun' || t.pos === 'Verb'
                if (isCore) {
                  const c = POS_COLORS[t.pos]
                  return (
                    <span key={i} style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      margin: '2px 2px',
                      borderRadius: 4,
                      background: c.bg,
                      border: '1px solid ' + c.bd,
                      color: c.tx,
                      fontSize: 13,
                      fontWeight: 700,
                      marginRight: 4,
                    }}>
                      {t.text}
                    </span>
                  )
                }
                return (
                  <span key={i} style={{
                    color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                    fontSize: 13,
                    marginRight: 6,
                  }}>
                    {t.text}
                  </span>
                )
              })}
            </div>
            <div style={{ fontSize: 9, color: s.text, marginTop: 6, fontStyle: 'italic' }}>
              The subject and predicate core - nouns (blue) and verbs (red) carry the main meaning.
            </div>
          </div>

          {selectedIdx !== null && tagged[selectedIdx] && (
            <div style={{
              padding: 10,
              borderRadius: 6,
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'),
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: s.bright }}>{tagged[selectedIdx].text}</span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: 3,
                  fontSize: 10,
                  fontWeight: 600,
                  background: POS_COLORS[tagged[selectedIdx].pos] ? POS_COLORS[tagged[selectedIdx].pos].bg : 'transparent',
                  border: '1px solid ' + (POS_COLORS[tagged[selectedIdx].pos] ? POS_COLORS[tagged[selectedIdx].pos].bd : 'transparent'),
                  color: POS_COLORS[tagged[selectedIdx].pos] ? POS_COLORS[tagged[selectedIdx].pos].tx : s.text,
                }}>
                  {tagged[selectedIdx].pos}
                </span>
              </div>
              <div style={{ fontSize: 11, color: s.text, lineHeight: 1.5, marginBottom: 6 }}>
                {getPOSExplanation(tagged[selectedIdx].text, tagged[selectedIdx].pos, tagged[selectedIdx].allTags)}
              </div>
              <div style={{ fontSize: 9, color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }}>
                Parser tags: {tagged[selectedIdx].allTags.join(', ')}
              </div>
            </div>
          )}
        </TutorReveal>
      )}
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Input — {sentence.trim() ? <>{sentence.trim().split(/\s+/).length} words</> : <span style={{ opacity: 0.6 }}>type a sentence</span>}</div>
          <div>Step 2: Mode — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{advanced ? 'Advanced (11 POS)' : 'Beginner (8 POS)'}</b></div>
          <div>Step 3: {tagged.length > 0 ? <>Tagged: {tagged.length} terms</> : 'Click "Tag Sentence" to analyze'}</div>
          <div>Step 4: {tagged.length > 0 ? <>Skeleton (nouns+verbs): <b style={{ color: isDark ? '#34d399' : '#059669' }}>{tagged.filter((t) => t.pos === 'Noun' || t.pos === 'Verb').map((t) => t.text).join(' ') || 'none'}</b></> : '?'}</div>
          <div>Step 5: {selectedIdx !== null && tagged[selectedIdx] ? <>Selected: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{tagged[selectedIdx].text}</b> → {tagged[selectedIdx].pos}</> : 'Click a tagged word for its explanation'}</div>
          <div>Step 6: Test questions: &quot;the&quot; before = noun; takes &quot;-ed&quot; = verb; answers &quot;what kind?&quot; = adjective</div>
          <div>Step 7: Context matters — &quot;run&quot; can be noun or verb depending on use</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Don't memorize lists — use test questions. "The" before = noun. Takes "-ed" = verb. Answers "what kind?" = adjective.
      </div>
</div>
  )
}

// ============================================================
// Sentence Expansion & Variation Tool (Grades 3-8)
// ============================================================

const ADJ_BANK = [
  'big', 'small', 'fast', 'slow', 'lazy', 'happy', 'brave', 'gentle',
  'furry', 'tiny', 'huge', 'old', 'young', 'wild', 'quiet'
]

const ADV_BANK = [
  'quickly', 'slowly', 'happily', 'loudly', 'quietly', 'carefully',
  'eagerly', 'gracefully', 'suddenly', 'bravely'
]

const PREP_PHRASE_BANK = [
  'across the field', 'through the park', 'into the house', 'under the tree',
  'over the hill', 'around the corner', 'toward the lake', 'behind the fence'
]

const DEP_CLAUSE_BANK = [
  'when the sun rose', 'because it was hungry', 'although it was tired',
  'while the cat watched', 'after the rain stopped', 'before dinner time',
  'until it found home', 'even though it was scared'
]

const COMPOUND_CONJUNCTIONS = ['and', 'but', 'so', 'or']
const COMPLEX_CONJUNCTIONS = ['because', 'when', 'although', 'if', 'while']
const DEFAULT_COMPANION = 'the cat purred.'

interface ExpansionStep {
  type: string
  addedText: string
  sentence: string
}

interface TextPart {
  text: string
  highlight: boolean
}

interface NlpOffset {
  text: string
  offset: number
  length: number
}

function capitalizeFirst(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function lowerFirstLetter(str: string): string {
  if (!str) return str
  return str.charAt(0).toLowerCase() + str.slice(1)
}

function pickRandom(bank: string[]): string {
  return bank[Math.floor(Math.random() * bank.length)]
}

function stripEndPeriod(str: string): string {
  return str.replace(/\.+$/, '').trim()
}

function renderHighlightedSentence(sentence: string, highlight: string, color: string) {
  if (!highlight) return <span>{sentence}</span>
  let idx = sentence.indexOf(highlight)
  if (idx === -1) return <span>{sentence}</span>
  return (
    <span>
      {sentence.substring(0, idx)}
      <span style={{ color: color, fontWeight: 600 }}>{highlight}</span>
      {sentence.substring(idx + highlight.length)}
    </span>
  )
}

function renderTextParts(parts: TextPart[]) {
  return parts.map(function (part, i) {
    if (part.highlight) {
      return <span key={i} style={{ color: '#fbbf24', fontWeight: 600 }}>{part.text}</span>
    }
    return <span key={i}>{part.text}</span>
  })
}

export function SentenceExpansionTool({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)

  const [tab, setTab] = useState<'expand' | 'transform'>('expand')
  const [baseSentence, setBaseSentence] = useState('The dog ran.')
  const [steps, setSteps] = useState<ExpansionStep[]>([])
  const [customAdj, setCustomAdj] = useState('')
  const [customAdv, setCustomAdv] = useState('')
  const [customPrep, setCustomPrep] = useState('')
  const [customDep, setCustomDep] = useState('')
  const [compoundConj, setCompoundConj] = useState('and')
  const [complexConj, setComplexConj] = useState('because')
  const [companion, setCompanion] = useState(DEFAULT_COMPANION)

  const currentSentence = steps.length > 0 ? steps[steps.length - 1].sentence : baseSentence

  const expansionTypes = [
    { type: 'Adjective', label: '+ Adjective', bank: ADJ_BANK, custom: customAdj, setCustom: setCustomAdj },
    { type: 'Adverb', label: '+ Adverb', bank: ADV_BANK, custom: customAdv, setCustom: setCustomAdv },
    { type: 'Prepositional Phrase', label: '+ Prep Phrase', bank: PREP_PHRASE_BANK, custom: customPrep, setCustom: setCustomPrep },
    { type: 'Dependent Clause', label: '+ Dep Clause', bank: DEP_CLAUSE_BANK, custom: customDep, setCustom: setCustomDep },
  ]

  const addExpansion = function (type: string, word: string) {
    if (!word || !word.trim()) return
    word = word.trim()
    const src = steps.length > 0 ? steps[steps.length - 1].sentence : baseSentence
    let newSentence = ''
    let insertedText = ''

    if (type === 'Adjective') {
      const nouns = nlp(src).match('#Noun').out('offset') as NlpOffset[]
      if (nouns && nouns.length > 0) {
        const n = nouns[0]
        const before = src.substring(0, n.offset).trimEnd()
        const rest = src.substring(n.offset)
        insertedText = word
        newSentence = (before + ' ' + insertedText + ' ' + rest).replace(/  +/g, ' ').trim()
      } else {
        return
      }
    } else if (type === 'Adverb') {
      const verbs = nlp(src).match('#Verb').out('offset') as NlpOffset[]
      if (verbs && verbs.length > 0) {
        const v = verbs[0]
        const pos = v.offset + v.length
        const before = src.substring(0, pos)
        const after = src.substring(pos)
        insertedText = word
        newSentence = (before + ' ' + insertedText + after).replace(/  +/g, ' ').trim()
      } else {
        return
      }
    } else if (type === 'Prepositional Phrase') {
      const clean = stripEndPeriod(src)
      insertedText = word
      newSentence = clean + ' ' + insertedText + '.'
    } else if (type === 'Dependent Clause') {
      insertedText = capitalizeFirst(word) + ', '
      newSentence = insertedText + lowerFirstLetter(src)
    }

    if (newSentence && newSentence !== src) {
      setSteps(function (prev) {
        return prev.concat([{ type: type, addedText: insertedText, sentence: newSentence }])
      })
    }
  }

  const handleReset = function () {
    setBaseSentence('The dog ran.')
    setSteps([])
    setCustomAdj('')
    setCustomAdv('')
    setCustomPrep('')
    setCustomDep('')
  }

  const handleBaseChange = function (val: string) {
    setBaseSentence(val)
    setSteps([])
  }

  const transformParts = useMemo(function () {
    const mainClean = stripEndPeriod(currentSentence)
    const compClean = stripEndPeriod(companion)
    const compLower = lowerFirstLetter(compClean)
    const secondLower = lowerFirstLetter(stripEndPeriod('the bird sang.'))

    return {
      simple: [{ text: currentSentence, highlight: false }] as TextPart[],
      compound: [
        { text: mainClean + ', ', highlight: false },
        { text: compoundConj, highlight: true },
        { text: ' ' + compLower + '.', highlight: false },
      ] as TextPart[],
      complex: [
        { text: capitalizeFirst(complexConj) + ' ', highlight: true },
        { text: compLower + ', ' + currentSentence, highlight: false },
      ] as TextPart[],
      compoundComplex: [
        { text: capitalizeFirst(complexConj) + ' ', highlight: true },
        { text: compLower + ', ' + mainClean + ', ', highlight: false },
        { text: compoundConj, highlight: true },
        { text: ' ' + secondLower + '.', highlight: false },
      ] as TextPart[],
    }
  }, [currentSentence, companion, compoundConj, complexConj])

  const expansionBtnStyle = {
    padding: '4px 10px',
    borderRadius: 4,
    fontSize: 11,
    cursor: 'pointer' as const,
    background: isDark ? 'rgba(74,222,128,0.1)' : 'rgba(74,222,128,0.08)',
    border: '1px solid ' + (isDark ? 'rgba(74,222,128,0.25)' : 'rgba(74,222,128,0.2)'),
    color: '#4ade80',
  }

  const addBtnStyle = s.btn(false)

  const resetBtnStyle = {
    ...s.btn(false),
    width: '100%',
    padding: '6px 12px',
    background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)',
    border: '1px solid ' + (isDark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.2)'),
    color: '#f87171',
  }

  const cardBase = {
    padding: '10px 12px',
    borderRadius: 6,
    background: s.bg,
    border: '1px solid ' + s.border,
  }

  return (
    <div style={{ fontSize: 12, color: s.text }}>
      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        <button
          onClick={function () { setTab('expand') }}
          style={s.btn(tab === 'expand')}
        >
          Expand
        </button>
        <button
          onClick={function () { setTab('transform') }}
          style={s.btn(tab === 'transform')}
        >
          Transform
        </button>
      </div>

      {/* ===================== EXPAND TAB ===================== */}
      {tab === 'expand' && (
        <div>
          {/* Current Expanded Sentence */}
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: isDark ? 'rgba(74,222,128,0.08)' : 'rgba(74,222,128,0.06)',
            border: '1px solid ' + (isDark ? 'rgba(74,222,128,0.2)' : 'rgba(74,222,128,0.15)'),
            marginBottom: 12,
          }}>
            <div style={{
              fontSize: 9, fontWeight: 600, color: '#4ade80', marginBottom: 4,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Expanded Sentence
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: s.bright, lineHeight: 1.4 }}>
              {currentSentence}
            </div>
          </div>

          {/* Expansion Timeline */}
          <div style={{ marginBottom: 12 }}>
            {steps.length === 0 ? (
              <div style={{
                fontSize: 11, color: s.text,
                textAlign: 'center' as const,
                padding: '16px 0',
                opacity: 0.5,
              }}>
                Click a button below to start expanding the sentence
              </div>
            ) : (
              <div style={{
                position: 'relative',
                paddingLeft: 26,
                maxHeight: 192,
                overflowY: 'auto',
                paddingRight: 4,
              }}>
                <div style={{
                  position: 'absolute',
                  left: 7,
                  top: 6,
                  bottom: 6,
                  width: 2,
                  background: isDark ? 'rgba(74,222,128,0.3)' : 'rgba(74,222,128,0.2)',
                  borderRadius: 1,
                }} />
                {steps.map(function (step, i) {
                  return (
                    <div key={i} style={{
                      position: 'relative',
                      marginBottom: i < steps.length - 1 ? 14 : 0,
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: -22,
                        top: 5,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#4ade80',
                        border: '2px solid ' + (isDark ? '#0f172a' : '#ffffff'),
                      }} />
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#4ade80', marginBottom: 2 }}>
                        {'Step ' + (i + 1) + ': +' + step.type}
                      </div>
                      <div style={{ fontSize: 11, color: s.text, lineHeight: 1.5 }}>
                        {renderHighlightedSentence(step.sentence, step.addedText, '#4ade80')}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Expansion Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {expansionTypes.map(function (exp) {
              return (
                <div key={exp.type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={function () { addExpansion(exp.type, pickRandom(exp.bank)) }}
                    style={expansionBtnStyle}
                  >
                    {exp.label}
                  </button>
                  <input
                    style={{ ...s.input, flex: 1, minWidth: 0 }}
                    placeholder={'custom ' + exp.type.toLowerCase() + '...'}
                    value={exp.custom}
                    onChange={function (e) { exp.setCustom(e.target.value) }}
                  />
                  <button
                    onClick={function () {
                      if (exp.custom.trim()) {
                        addExpansion(exp.type, exp.custom)
                        exp.setCustom('')
                      }
                    }}
                    style={addBtnStyle}
                  >
                    Add
                  </button>
                </div>
              )
            })}
          </div>

          {/* Base Sentence Textarea */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: s.text, marginBottom: 4 }}>Base Sentence</div>
            <textarea
              style={{
                ...s.input,
                width: '100%',
                minHeight: 44,
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
              value={baseSentence}
              onChange={function (e) { handleBaseChange(e.target.value) }}
            />
          </div>

          {/* Reset Button */}
          <button onClick={handleReset} style={resetBtnStyle}>
            Reset
          </button>
        </div>
      )}

      {/* ===================== TRANSFORM TAB ===================== */}
      {tab === 'transform' && (
        <div>
          {/* Compound Conjunction Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: s.text, fontWeight: 600, minWidth: 60 }}>Compound:</span>
            {COMPOUND_CONJUNCTIONS.map(function (c) {
              return (
                <button
                  key={c}
                  onClick={function () { setCompoundConj(c) }}
                  style={s.btn(compoundConj === c)}
                >
                  {c}
                </button>
              )
            })}
          </div>

          {/* Complex Conjunction Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: s.text, fontWeight: 600, minWidth: 60 }}>Complex:</span>
            {COMPLEX_CONJUNCTIONS.map(function (c) {
              return (
                <button
                  key={c}
                  onClick={function () { setComplexConj(c) }}
                  style={s.btn(complexConj === c)}
                >
                  {c}
                </button>
              )
            })}
          </div>

          {/* Companion Sentence Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 10, color: s.text, fontWeight: 600, minWidth: 60 }}>Companion:</span>
            <input
              style={{ ...s.input, flex: 1, minWidth: 0 }}
              value={companion}
              onChange={function (e) { setCompanion(e.target.value) }}
            />
          </div>

          {/* 4 Sentence Type Cards */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { label: 'Simple', desc: 'One independent clause', parts: transformParts.simple, accent: '#94a3b8' },
              { label: 'Compound', desc: 'Two independent clauses joined', parts: transformParts.compound, accent: '#4ade80' },
              { label: 'Complex', desc: 'One independent + one dependent clause', parts: transformParts.complex, accent: '#60a5fa' },
              { label: 'Compound-Complex', desc: 'Two independent + one dependent clause', parts: transformParts.compoundComplex, accent: '#c084fc' },
            ].map(function (card) {
              return (
                <div
                  key={card.label}
                  style={{
                    ...cardBase,
                    flex: '1 1 45%',
                    minWidth: 180,
                    borderTop: '2px solid ' + card.accent,
                  }}
                >
                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: card.accent,
                    marginBottom: 2,
                  }}>
                    {card.label}
                  </div>
                  <div style={{
                    fontSize: 9,
                    color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                    marginBottom: 6,
                  }}>
                    {card.desc}
                  </div>
                  <div style={{ fontSize: 12, color: s.bright, lineHeight: 1.5 }}>
                    {renderTextParts(card.parts)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{
            marginTop: 10,
            fontSize: 9,
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            textAlign: 'center' as const,
          }}>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>Yellow</span>
            {' = conjunctions/connectors'}
          </div>
        </div>
      )}
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Base sentence — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{baseSentence}</b></div>
          <div>Step 2: Active tab — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{tab === 'expand' ? 'Expand' : 'Transform'}</b></div>
          <div>Step 3: {tab === 'expand' ? (steps.length > 0 ? <>Expansions added: {steps.length}</> : 'No expansions yet — click "+ Adjective" etc.') : <>Compound conj: {compoundConj} | Complex conj: {complexConj}</>}</div>
          <div>Step 4: {tab === 'expand' && steps.length > 0 ? <>Latest: +{steps[steps.length - 1].type} (&quot;{steps[steps.length - 1].addedText}&quot;)</> : tab === 'transform' ? <>Companion: &quot;{companion}&quot;</> : '?'}</div>
          <div>Step 5: Current sentence — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{currentSentence}</b></div>
          <div>Step 6: Check — does each addition add meaning, or just clutter?</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Expand by adding: adjectives (what kind), adverbs (how), phrases (where/when). "Dog ran" → "The excited dog ran quickly across the park."
      </div>
</div>
  )
}

// ============================================================
// PunctuationInteractive
// ============================================================

type ExPart = [string, boolean]

interface PunctRuleData {
  name: string
  mark: string
  color: string
  rules: string[]
  examples: ExPart[][]
  mistake: { wrong: ExPart[]; correct: ExPart[]; tip: string }
}

interface ExerciseData {
  prompt: string
  sentence: string
  options: string[]
  correctIndex: number
  correctDisplay: string
  rule: string
  ruleLabel: string
  ruleColor: string
}

const PUNCT_RULES_DATA: PunctRuleData[] = [
  {
    name: 'Period', mark: '.', color: '#60a5fa',
    rules: [
      'Use at the end of a declarative sentence (a statement).',
      'Use at the end of an imperative sentence (a command).',
      'Use after abbreviations like Mr., Dr., and etc.',
    ],
    examples: [
      [['The cat slept on the couch', false], ['.', true]],
      [['Please close the door', false], ['.', true]],
    ],
    mistake: {
      wrong: [['What time is it', false], ['.', true]],
      correct: [['What time is it', false], ['?', true]],
      tip: 'Use a question mark, not a period, for questions.',
    },
  },
  {
    name: 'Comma', mark: ',', color: '#4ade80',
    rules: [
      'Use to separate items in a series of three or more.',
      'Use after introductory words, phrases, or clauses.',
      'Use before a coordinating conjunction joining two independent clauses.',
    ],
    examples: [
      [['I bought apples', false], [',', true], [' bananas', false], [',', true], [' and oranges.', false]],
      [['After school', false], [',', true], [' I went to practice.', false]],
      [['I was tired', false], [',', true], [' so I went to bed.', false]],
    ],
    mistake: {
      wrong: [['The flag is red white and blue.', false]],
      correct: [['The flag is red', false], [',', true], [' white', false], [',', true], [' and blue.', false]],
      tip: 'Use commas to separate items in a series of three or more.',
    },
  },
  {
    name: 'Semicolon', mark: ';', color: '#fb923c',
    rules: [
      'Use to join two closely related independent clauses without a conjunction.',
      'Use between items in a complex series that already contain commas.',
      'Place the semicolon outside quotation marks.',
    ],
    examples: [
      [['The sun was setting', false], [';', true], [' the sky turned orange.', false]],
      [['I was tired', false], [';', true], [' I went to bed.', false]],
    ],
    mistake: {
      wrong: [['She was happy', false], [';', true], [' and excited.', false]],
      correct: [['She was happy and excited.', false]],
      tip: 'Use a comma before a coordinating conjunction like and, but, or or.',
    },
  },
  {
    name: 'Colon', mark: ':', color: '#c084fc',
    rules: [
      'Use before a list when the sentence before it could stand alone.',
      'Use between hours and minutes in time (3:30).',
      'Use after the greeting in a formal letter (Dear Mr. Jones:).',
    ],
    examples: [
      [['I need three things', false], [':', true], [' milk, bread, and eggs.', false]],
      [['The meeting starts at 3', false], [':', true], ['30.', false]],
    ],
    mistake: {
      wrong: [['The items I need are', false], [':', true], [' milk and bread.', false]],
      correct: [['The items I need are milk and bread.', false]],
      tip: 'A colon should follow a complete thought, not come right after a verb.',
    },
  },
  {
    name: 'Dash', mark: '\u2014', color: '#f472b6',
    rules: [
      'Use an em dash to show a sudden break in thought.',
      'Use to emphasize information at the end of a sentence.',
      'Use to set off extra information within a sentence.',
    ],
    examples: [
      [['I was going to the store ', false], ['\u2014', true], [' but then it rained.', false]],
      [['The answer was simple ', false], ['\u2014', true], [' practice every day.', false]],
      [['My dog ', false], ['\u2014', true], [' a golden retriever ', false], ['\u2014', true], [' loves to swim.', false]],
    ],
    mistake: {
      wrong: [['a well ', false], ['\u2014', true], ['known author', false]],
      correct: [['a well', false], ['-', true], ['known author', false]],
      tip: 'Use a hyphen (-) for compound words, not an em dash.',
    },
  },
  {
    name: 'Apostrophe', mark: "'", color: '#fbbf24',
    rules: [
      'Use in contractions to show where letters have been left out.',
      'Use to show possession or ownership.',
      'Never use an apostrophe to make a regular word plural.',
    ],
    examples: [
      [['I can', false], ["'", true], ['t find my keys.', false]],
      [['The dog', false], ["'", true], ['s tail wagged.', false]],
      [['The students', false], ["'", true], [' projects were impressive.', false]],
    ],
    mistake: {
      wrong: [['I have two cat', false], ["'", true], ['s.', false]],
      correct: [['I have two cats.', false]],
      tip: 'Do not use an apostrophe to make a word plural.',
    },
  },
  {
    name: 'Quotation Marks', mark: '\u201C \u201D', color: '#2dd4bf',
    rules: [
      'Use to enclose the exact words a speaker says.',
      'Use around titles of short works like poems, articles, and songs.',
      'Place periods and commas inside the closing quotation mark.',
    ],
    examples: [
      [['She said, ', false], ['\u201C', true], ['I love reading.', false], ['\u201D', true]],
      [['My favorite poem is ', false], ['\u201C', true], ['The Raven.', false], ['\u201D', true]],
    ],
    mistake: {
      wrong: [['She said, ', false], ['\u201C', true], ['Hello', false]],
      correct: [['She said, ', false], ['\u201C', true], ['Hello.', false], ['\u201D', true]],
      tip: 'Always use both an opening and a closing quotation mark.',
    },
  },
  {
    name: 'Exclamation Mark', mark: '!', color: '#f87171',
    rules: [
      'Use at the end of an exclamatory sentence showing strong feeling.',
      'Use to show urgency or emphasis.',
      'Avoid overusing in formal writing; one is enough.',
    ],
    examples: [
      [['That was the best birthday ever', false], ['!', true]],
      [['Watch out for that car', false], ['!', true]],
      [['I can', false], ["'", true], ['t believe we won', false], ['!', true]],
    ],
    mistake: {
      wrong: [['Yes', false], ['!!!', true]],
      correct: [['Yes', false], ['!', true]],
      tip: 'Use only one exclamation mark in standard writing.',
    },
  },
  {
    name: 'Question Mark', mark: '?', color: '#818cf8',
    rules: [
      'Use at the end of a direct question.',
      'Do not use for indirect (reported) questions.',
      'Use inside quotation marks when the quoted sentence is a question.',
    ],
    examples: [
      [['Where is the library', false], ['?', true]],
      [['What time is it', false], ['?', true]],
    ],
    mistake: {
      wrong: [['I wonder what time it is', false], ['?', true]],
      correct: [['I wonder what time it is.', false]],
      tip: 'Do not use a question mark for indirect questions.',
    },
  },
  {
    name: 'Hyphen', mark: '-', color: '#a78bfa',
    rules: [
      'Use to join compound words like sister-in-law.',
      'Use with compound numbers from twenty-one to ninety-nine.',
      'Use to join a compound adjective before a noun (well-known author).',
    ],
    examples: [
      [['My sister', false], ['-', true], ['in', false], ['-', true], ['law is visiting.', false]],
      [['She gave a well', false], ['-', true], ['written essay.', false]],
      [['There are fifty', false], ['-', true], ['two students.', false]],
    ],
    mistake: {
      wrong: [['a well known author', false]],
      correct: [['a well', false], ['-', true], ['known author', false]],
      tip: 'Use a hyphen in compound adjectives that come before a noun.',
    },
  },
]

const EXERCISES_DATA: ExerciseData[] = [
  {
    prompt: 'What punctuation ends this statement?',
    sentence: 'The cat slept on the couch___',
    options: ['.', ',', '!', ';'],
    correctIndex: 0,
    correctDisplay: '.',
    rule: 'Use a period at the end of a declarative sentence (a statement).',
    ruleLabel: 'Period',
    ruleColor: '#60a5fa',
  },
  {
    prompt: 'What punctuation ends this question?',
    sentence: 'Where is the library___',
    options: ['.', '?', '!', ','],
    correctIndex: 1,
    correctDisplay: '?',
    rule: 'Use a question mark at the end of a direct question.',
    ruleLabel: 'Question Mark',
    ruleColor: '#818cf8',
  },
  {
    prompt: 'What punctuation ends this exclamation?',
    sentence: 'That was the best birthday ever___',
    options: ['.', ',', '?', '!'],
    correctIndex: 3,
    correctDisplay: '!',
    rule: 'Use an exclamation mark at the end of an exclamatory sentence.',
    ruleLabel: 'Exclamation Mark',
    ruleColor: '#f87171',
  },
  {
    prompt: 'Which punctuation belongs in the blank?',
    sentence: 'For lunch I had a sandwich___ an apple and juice.',
    options: ['.', ',', ';', '!'],
    correctIndex: 1,
    correctDisplay: ',',
    rule: 'Use a comma to separate items in a series of three or more.',
    ruleLabel: 'Comma',
    ruleColor: '#4ade80',
  },
  {
    prompt: 'Which punctuation belongs in the blank?',
    sentence: 'The flag is red___ white and blue.',
    options: ['.', ';', ',', '!'],
    correctIndex: 2,
    correctDisplay: ',',
    rule: 'Use commas to separate items in a series of three or more.',
    ruleLabel: 'Comma',
    ruleColor: '#4ade80',
  },
  {
    prompt: 'Which punctuation belongs in the blank?',
    sentence: 'After school___ I went to soccer practice.',
    options: ['!', '?', ';', ','],
    correctIndex: 3,
    correctDisplay: ',',
    rule: 'Use a comma after an introductory word or phrase.',
    ruleLabel: 'Comma',
    ruleColor: '#4ade80',
  },
  {
    prompt: 'Which punctuation belongs in the blank?',
    sentence: 'Yes___ I would love to come to your party.',
    options: ['.', '!', '?', ','],
    correctIndex: 3,
    correctDisplay: ',',
    rule: 'Use a comma after an introductory word like Yes, No, or Well.',
    ruleLabel: 'Comma',
    ruleColor: '#4ade80',
  },
  {
    prompt: 'Which punctuation makes this a contraction?',
    sentence: 'I___m going to the store later.',
    options: ['-', ',', "'", ';'],
    correctIndex: 2,
    correctDisplay: "'",
    rule: 'Use an apostrophe in contractions to show missing letters.',
    ruleLabel: 'Apostrophe',
    ruleColor: '#fbbf24',
  },
  {
    prompt: 'Which punctuation makes this a contraction?',
    sentence: 'They___re my best friends.',
    options: ['.', "'", ',', ';'],
    correctIndex: 1,
    correctDisplay: "'",
    rule: 'Use an apostrophe where letters have been left out of a word.',
    ruleLabel: 'Apostrophe',
    ruleColor: '#fbbf24',
  },
  {
    prompt: 'Which punctuation shows ownership?',
    sentence: 'The dog___s tail wagged happily.',
    options: ['-', ',', "'", ';'],
    correctIndex: 2,
    correctDisplay: "'",
    rule: 'Use an apostrophe to show possession or ownership.',
    ruleLabel: 'Apostrophe',
    ruleColor: '#fbbf24',
  },
  {
    prompt: 'Which punctuation shows ownership?',
    sentence: 'Maria___s project won first prize.',
    options: ['-', ';', ',', "'"],
    correctIndex: 3,
    correctDisplay: "'",
    rule: 'Add an apostrophe and s to a singular noun to show possession.',
    ruleLabel: 'Apostrophe',
    ruleColor: '#fbbf24',
  },
  {
    prompt: 'What punctuation sets off the spoken words?',
    sentence: 'She said, ___Hello, class.___',
    options: ['Parentheses ( )', 'Quotation marks', 'Brackets [ ]', 'Apostrophes'],
    correctIndex: 1,
    correctDisplay: '\u201C \u201D',
    rule: 'Use quotation marks to enclose the exact words a speaker says.',
    ruleLabel: 'Quotation Marks',
    ruleColor: '#2dd4bf',
  },
  {
    prompt: 'Which punctuation connects two related sentences?',
    sentence: 'The sun was setting___ the sky turned orange.',
    options: ['.', ',', ':', ';'],
    correctIndex: 3,
    correctDisplay: ';',
    rule: 'Use a semicolon to join two closely related independent clauses.',
    ruleLabel: 'Semicolon',
    ruleColor: '#fb923c',
  },
  {
    prompt: 'Which punctuation introduces a list?',
    sentence: 'I need three things___ milk, bread, and eggs.',
    options: ['-', ';', ':', ','],
    correctIndex: 2,
    correctDisplay: ':',
    rule: 'Use a colon before a list when the sentence before it is complete.',
    ruleLabel: 'Colon',
    ruleColor: '#c084fc',
  },
  {
    prompt: 'Which punctuation joins these words?',
    sentence: 'She gave a twenty___minute presentation.',
    options: ['_', '~', '/', '-'],
    correctIndex: 3,
    correctDisplay: '-',
    rule: 'Use a hyphen to join compound numbers and compound adjectives.',
    ruleLabel: 'Hyphen',
    ruleColor: '#a78bfa',
  },
]

function shuffleIndices(count: number): number[] {
  const arr: number[] = []
  for (let i = 0; i < count; i++) arr.push(i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

export function PunctuationInteractive({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [tab, setTab] = useState<'rules' | 'practice'>('rules')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [order, setOrder] = useState<number[]>(() => shuffleIndices(15))
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)

  const exercise = useMemo(() => {
    if (step >= order.length) return null
    return EXERCISES_DATA[order[step]]
  }, [step, order])

  const isCorrectAnswer = checked && selected !== null && exercise !== null && selected === exercise.correctIndex

  const handleCheck = useCallback(() => {
    if (selected === null || !exercise) return
    setChecked(true)
    if (selected === exercise.correctIndex) {
      setScore(prev => prev + 1)
    }
  }, [selected, exercise])

  const handleNext = useCallback(() => {
    setChecked(false)
    setSelected(null)
    setStep(prev => prev + 1)
  }, [])

  const handleShuffle = useCallback(() => {
    setOrder(shuffleIndices(15))
    setStep(0)
    setSelected(null)
    setChecked(false)
    setScore(0)
  }, [])

  const handleReset = useCallback(() => {
    setStep(0)
    setSelected(null)
    setChecked(false)
    setScore(0)
  }, [])

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '7px 0',
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer' as const,
    background: active
      ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)')
      : 'transparent',
    color: active ? s.bright : s.text,
    border: 'none',
    borderBottom: active
      ? '2px solid ' + (isDark ? '#94a3b8' : '#475569')
      : '2px solid transparent',
    textAlign: 'center' as const,
  })

  const renderRulesTab = () => (
    <div style={{ maxHeight: 420, overflowY: 'auto' }}>
      {PUNCT_RULES_DATA.map((rule, idx) => {
        const isOpen = expandedIdx === idx
        return (
          <div key={idx}>
            <div
              onClick={() => setExpandedIdx(isOpen ? null : idx)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px',
                cursor: 'pointer' as const,
                borderBottom: '1px solid ' + s.border,
                background: isOpen
                  ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)')
                  : 'transparent',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: rule.mark.length > 2 ? 11 : 16,
                fontWeight: 700, color: rule.color,
                background: rule.color + (isDark ? '15' : '20'),
                border: '1px solid ' + rule.color + '40',
                flexShrink: 0,
              }}>
                {rule.mark}
              </div>
              <div style={{
                flex: 1, fontSize: 12,
                fontWeight: isOpen ? 600 : 400,
                color: isOpen ? s.bright : s.text,
              }}>
                {rule.name}
              </div>
              <div style={{ fontSize: 10, color: s.text }}>
                {isOpen ? '\u25B2' : '\u25BC'}
              </div>
            </div>
            {isOpen && (
              <div style={{
                padding: '10px 12px 14px',
                borderBottom: '1px solid ' + s.border,
                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
              }}>
                <div style={{
                  fontSize: 32, fontWeight: 800, color: rule.color,
                  marginBottom: 8,
                  letterSpacing: rule.mark.length > 2 ? 2 : 0,
                }}>
                  {rule.mark}
                </div>
                {rule.rules.map((r, ri) => (
                  <div key={ri} style={{
                    fontSize: 11, color: s.text,
                    marginBottom: 3, paddingLeft: 10, lineHeight: 1.5,
                  }}>
                    <span style={{ color: rule.color, marginRight: 6 }}>{'\u2022'}</span>
                    {r}
                  </div>
                ))}
                <div style={{
                  marginTop: 8, marginBottom: 4, fontSize: 10,
                  fontWeight: 600, color: s.text,
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  Examples
                </div>
                {rule.examples.map((ex, ei) => (
                  <div key={ei} style={{
                    fontSize: 12, color: s.bright,
                    marginBottom: 3, paddingLeft: 10, lineHeight: 1.6,
                  }}>
                    {ex.map((part, pi) => (
                      <span key={pi} style={part[1] ? { color: rule.color, fontWeight: 700 } : undefined}>
                        {part[0]}
                      </span>
                    ))}
                  </div>
                ))}
                <div style={{
                  marginTop: 10, padding: '8px 10px', borderRadius: 6,
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                  border: '1px solid ' + s.border,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: s.text,
                    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>
                    Common Mistake
                  </div>
                  <div style={{ fontSize: 11, color: '#f87171', marginBottom: 3, paddingLeft: 6 }}>
                    <span style={{ marginRight: 6 }}>{'\u2717'}</span>
                    {rule.mistake.wrong.map((p, pi) => (
                      <span key={pi} style={p[1] ? { fontWeight: 700 } : undefined}>{p[0]}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#4ade80', marginBottom: 3, paddingLeft: 6 }}>
                    <span style={{ marginRight: 6 }}>{'\u2713'}</span>
                    {rule.mistake.correct.map((p, pi) => (
                      <span key={pi} style={p[1] ? { fontWeight: 700 } : undefined}>{p[0]}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: s.text, fontStyle: 'italic', marginTop: 4, paddingLeft: 6 }}>
                    {rule.mistake.tip}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  const renderPracticeTab = () => {
    if (!exercise) {
      const pct = Math.round(score / 15 * 100)
      let msg = ''
      if (score === 15) msg = 'Perfect! You are a punctuation pro!'
      else if (score >= 12) msg = 'Great job! You know your punctuation well!'
      else if (score >= 8) msg = 'Good effort! Keep practicing!'
      else msg = 'Keep learning! Review the rules and try again.'

      return (
        <div style={{ padding: 20, textAlign: 'center' as const }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{'\uD83C\uDFC6'}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: s.bright, marginBottom: 6 }}>
            Practice Complete!
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#60a5fa', marginBottom: 2 }}>
            {score} / 15
          </div>
          <div style={{ fontSize: 11, color: s.text, marginBottom: 16 }}>
            {pct + '% correct'}
          </div>
          <div style={{ fontSize: 12, color: s.bright, marginBottom: 18, lineHeight: 1.5 }}>{msg}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={handleReset} style={{
              padding: '7px 18px', borderRadius: 6, fontSize: 12,
              cursor: 'pointer' as const, fontWeight: 600,
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              border: '1px solid ' + s.border, color: s.bright,
            }}>
              Try Again
            </button>
            <button onClick={handleShuffle} style={{
              padding: '7px 18px', borderRadius: 6, fontSize: 12,
              cursor: 'pointer' as const, fontWeight: 600,
              background: 'rgba(96,165,250,0.15)',
              border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa',
            }}>
              {'\u21BB'} Shuffle & Retry
            </button>
          </div>
        </div>
      )
    }

    const sentenceParts = exercise.sentence.split('___')
    const blankFills = exercise.correctDisplay.split(' ')
    const progressPct = Math.round((step / 15) * 100)

    return (
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 11, color: s.text }}>
            Exercise {step + 1} of 15
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 11, color: s.text }}>
              Score: <span style={{ color: '#60a5fa', fontWeight: 700 }}>{score}</span>/{step + (checked ? 1 : 0)}
            </div>
            <button
              onClick={handleShuffle}
              title="Shuffle exercises"
              style={{
                fontSize: 15, cursor: 'pointer' as const,
                background: 'transparent', border: 'none',
                color: s.text, padding: 0, lineHeight: 1,
              }}
            >
              {'\u21BB'}
            </button>
          </div>
        </div>

        <div style={{
          height: 4,
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          borderRadius: 2, marginBottom: 14, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: progressPct + '%',
            background: '#60a5fa',
            borderRadius: 2,
            transition: 'width 0.3s',
          }} />
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: s.bright, marginBottom: 8, lineHeight: 1.5 }}>
          {exercise.prompt}
        </div>

        <div style={{
          fontSize: 14, color: s.bright, lineHeight: 1.8,
          padding: '10px 12px', borderRadius: 8,
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          border: '1px solid ' + s.border,
          marginBottom: 14,
        }}>
          {sentenceParts.map((part, i) => (
            <span key={i}>
              {part}
              {i < sentenceParts.length - 1 && (
                <span style={{
                  background: checked
                    ? (isCorrectAnswer ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)')
                    : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                  padding: '1px 6px', borderRadius: 3, fontWeight: 700,
                  color: checked
                    ? (isCorrectAnswer ? '#4ade80' : '#f87171')
                    : s.bright,
                }}>
                  {checked ? (blankFills[i] || exercise.correctDisplay) : '___'}
                </span>
              )}
            </span>
          ))}
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 8, marginBottom: 14,
        }}>
          {exercise.options.map((opt, oi) => {
            let bg = s.bg
            let bdr = '1px solid ' + s.border
            let col = s.text
            let fw = 400

            if (checked) {
              if (oi === exercise.correctIndex) {
                bg = 'rgba(74,222,128,0.12)'
                bdr = '1px solid rgba(74,222,128,0.4)'
                col = '#4ade80'
                fw = 700
              } else if (oi === selected) {
                bg = 'rgba(248,113,113,0.12)'
                bdr = '1px solid rgba(248,113,113,0.4)'
                col = '#f87171'
                fw = 700
              } else {
                col = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'
              }
            } else if (oi === selected) {
              bg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
              bdr = '1px solid ' + s.bright
              col = s.bright
              fw = 600
            }

            return (
              <button
                key={oi}
                onClick={() => { if (!checked) setSelected(oi) }}
                style={{
                  padding: '10px 8px', borderRadius: 8,
                  background: bg, border: bdr,
                  color: col, fontWeight: fw,
                  fontSize: 13, cursor: 'pointer' as const,
                  textAlign: 'center' as const,
                  transition: 'all 0.15s',
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {!checked ? (
          <button
            onClick={handleCheck}
            disabled={selected === null}
            style={{
              display: 'block', margin: '0 auto',
              padding: '7px 28px', borderRadius: 6,
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer' as const,
              background: selected === null
                ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)')
                : 'rgba(96,165,250,0.15)',
              border: selected === null
                ? '1px solid ' + s.border
                : '1px solid rgba(96,165,250,0.4)',
              color: selected === null ? s.text : '#60a5fa',
              opacity: selected === null ? 0.5 : 1,
            }}
          >
            Check
          </button>
        ) : (
          <div>
            <div style={{
              padding: '8px 12px', borderRadius: 8,
              background: isCorrectAnswer
                ? 'rgba(74,222,128,0.08)'
                : 'rgba(248,113,113,0.08)',
              border: '1px solid ' + (isCorrectAnswer
                ? 'rgba(74,222,128,0.2)'
                : 'rgba(248,113,113,0.2)'),
              marginBottom: 10,
            }}>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: isCorrectAnswer ? '#4ade80' : '#f87171',
                marginBottom: 4,
              }}>
                {isCorrectAnswer ? '\u2713 Correct!' : '\u2717 Not quite!'}
              </div>
              <div style={{ fontSize: 11, color: s.text, lineHeight: 1.5 }}>
                <span style={{ color: exercise.ruleColor, fontWeight: 600 }}>{exercise.ruleLabel}:</span>{' '}
                {exercise.rule}
              </div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <button
                onClick={handleNext}
                style={{
                  padding: '6px 20px', borderRadius: 6,
                  fontSize: 12, fontWeight: 600,
                  cursor: 'pointer' as const,
                  background: 'rgba(96,165,250,0.15)',
                  border: '1px solid rgba(96,165,250,0.4)',
                  color: '#60a5fa',
                }}
              >
                Next {'\u2192'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      borderRadius: 8,
      border: '1px solid ' + s.border,
      background: isDark ? 'rgba(15,23,42,0.6)' : '#ffffff',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', borderBottom: '1px solid ' + s.border }}>
        <button style={tabBtnStyle(tab === 'rules')} onClick={() => setTab('rules')}>
          Rules
        </button>
        <button style={tabBtnStyle(tab === 'practice')} onClick={() => setTab('practice')}>
          Practice
        </button>
      </div>
      {tab === 'rules' ? renderRulesTab() : renderPracticeTab()}
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Active tab — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{tab === 'rules' ? 'Rules' : 'Practice'}</b></div>
          <div>Step 2: {tab === 'rules' ? (expandedIdx !== null ? <>Viewing rule: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{PUNCT_RULES_DATA[expandedIdx].name}</b> ({PUNCT_RULES_DATA[expandedIdx].mark})</> : 'Click a punctuation rule above to expand') : <>Exercise {Math.min(step + 1, order.length)} of {order.length}</>}</div>
          <div>Step 3: {tab === 'practice' && exercise ? <>Prompt: &quot;{exercise.prompt}&quot; — sentence: &quot;{exercise.sentence}&quot;</> : tab === 'practice' ? <>Practice complete — final score: {score}/{order.length}</> : '?'}</div>
          <div>Step 4: {tab === 'practice' && exercise ? <>Selected: {selected !== null ? <b style={{ color: isDark ? '#34d399' : '#059669' }}>{exercise.options[selected]}</b> : 'none — pick an option'}</> : '?'}</div>
          <div>Step 5: {tab === 'practice' ? <>Score: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{score}</b>/{step + (checked ? 1 : 0)}{checked ? (isCorrectAnswer ? ' ✓' : ' ✗') : ''}</> : '?'}</div>
          <div>Step 6: Conceptual — two related sentences = SEMICOLON (;); introduces a list = COLON (:)</div>
          <div>Step 7: Conceptual — possession or contraction = APOSTROPHE (&apos;)</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Period = complete thought. Comma = separates. Semicolon = joins related sentences. Apostrophe = possession/contraction. Each has a job.
      </div>
</div>
  )
}

// ============================================================
// ParagraphOrganizer
// ============================================================

interface OrganizerSection {
  key: string
  label: string
  prompt: string
  transitions: string[]
}

interface ParagraphType {
  name: string
  color: string
  sections: OrganizerSection[]
}

const PARAGRAPH_TYPES: ParagraphType[] = [
  {
    name: 'Narrative',
    color: '#60a5fa',
    sections: [
      { key: 'setting', label: 'Setting', prompt: 'When and where does it happen?', transitions: ['Once upon a time...', 'One day...', 'On a bright morning...'] },
      { key: 'characters', label: 'Characters', prompt: 'Who is in the story?', transitions: [] },
      { key: 'problem', label: 'Problem', prompt: 'What goes wrong?', transitions: ['Suddenly...', 'But then...', 'Unexpectedly...'] },
      { key: 'events', label: 'Events', prompt: 'What happens? Rising action', transitions: ['First,...', 'Then,...', 'Next,...', 'After that,...'] },
      { key: 'climax', label: 'Climax', prompt: 'The most exciting moment', transitions: ['At that moment...', 'In the blink of an eye...', 'All at once...'] },
      { key: 'resolution', label: 'Resolution', prompt: 'How is it solved?', transitions: ['Finally,...', 'In the end,...', 'At last...'] },
      { key: 'lesson', label: 'Lesson', prompt: 'What did the character learn?', transitions: ['I learned that...', 'From that day on,...', 'This taught me...'] },
    ],
  },
  {
    name: 'Expository',
    color: '#4ade80',
    sections: [
      { key: 'topic', label: 'Topic Sentence', prompt: 'What is this paragraph about?', transitions: [] },
      { key: 'fact1', label: 'Fact 1 + Evidence', prompt: 'First supporting detail', transitions: ['First,...', 'To begin with,...', 'For one thing,...'] },
      { key: 'fact2', label: 'Fact 2 + Evidence', prompt: 'Second supporting detail', transitions: ['Additionally,...', 'Furthermore,...', 'Moreover,...'] },
      { key: 'fact3', label: 'Fact 3 + Evidence', prompt: 'Third supporting detail', transitions: ['In addition,...', 'Another reason is,...', 'Furthermore,...'] },
      { key: 'conclusion', label: 'Concluding Sentence', prompt: 'Summarize the main idea', transitions: ['In conclusion,...', 'To sum up,...', 'Overall,...'] },
    ],
  },
  {
    name: 'Persuasive',
    color: '#f87171',
    sections: [
      { key: 'claim', label: 'Claim/Opinion', prompt: 'What do you believe?', transitions: [] },
      { key: 'reason1', label: 'Reason 1 + Evidence', prompt: 'First reason supporting your claim', transitions: ['First,...', 'To start with,...', 'For example,...'] },
      { key: 'reason2', label: 'Reason 2 + Evidence', prompt: 'Second reason supporting your claim', transitions: ['Secondly,...', 'Another reason is,...', 'Furthermore,...'] },
      { key: 'counter', label: 'Counterargument', prompt: 'What would the other side say?', transitions: ['Some people might say...', 'Opponents argue...', 'On the other hand,...'] },
      { key: 'rebuttal', label: 'Rebuttal', prompt: 'Why are they wrong?', transitions: ['However,...', 'Despite this,...', 'Although that may seem true,...'] },
      { key: 'action', label: 'Call to Action', prompt: 'What should the reader do?', transitions: ['Therefore,...', 'I urge you to...', 'We must...'] },
    ],
  },
  {
    name: 'Descriptive',
    color: '#c084fc',
    sections: [
      { key: 'topic', label: 'Topic', prompt: 'What are you describing?', transitions: [] },
      { key: 'sight', label: 'Sight', prompt: 'What does it look like?', transitions: [] },
      { key: 'sound', label: 'Sound', prompt: 'What does it sound like?', transitions: ['I could hear...', 'The sound of... filled the air.'] },
      { key: 'touch', label: 'Touch', prompt: 'What does it feel like?', transitions: ['It felt...', 'The texture was...', 'Soft as...'] },
      { key: 'smell', label: 'Smell', prompt: 'What does it smell like?', transitions: ['A scent of...', 'The aroma of...', 'It smelled like...'] },
      { key: 'taste', label: 'Taste', prompt: 'What does it taste like?', transitions: ['It tasted...', 'The flavor of...', 'Sweet like...'] },
      { key: 'conclusion', label: 'Concluding Thought', prompt: 'Final impression', transitions: ['In all,...', 'Altogether,...', 'All in all,...'] },
    ],
  },
  {
    name: 'Compare-Contrast',
    color: '#fb923c',
    sections: [
      { key: 'topic', label: 'Topic', prompt: 'What two things are you comparing?', transitions: [] },
      { key: 'simA', label: 'Thing A: Similarity', prompt: 'How is Thing A similar?', transitions: ['Similarly,...', 'Like Thing A,...', 'Just like...'] },
      { key: 'simB', label: 'Thing B: Similarity', prompt: 'How is Thing B similar?', transitions: ['Likewise,...', 'In the same way,...', 'Similarly,...'] },
      { key: 'diffA', label: 'Thing A: Difference', prompt: 'How is Thing A different?', transitions: ['On the other hand,...', 'However,...', 'In contrast,...'] },
      { key: 'diffB', label: 'Thing B: Difference', prompt: 'How is Thing B different?', transitions: ['Conversely,...', 'Unlike Thing A,...', 'Whereas...'] },
      { key: 'conclusion', label: 'Conclusion', prompt: 'Overall comparison', transitions: ['In conclusion,...', 'Overall,...', 'To summarize,...'] },
    ],
  },
  {
    name: 'Cause-Effect',
    color: '#2dd4bf',
    sections: [
      { key: 'topic', label: 'Topic', prompt: 'What event are you analyzing?', transitions: [] },
      { key: 'cause1', label: 'Cause 1', prompt: 'What caused it first?', transitions: ['Because...', 'One cause was...', 'Due to...'] },
      { key: 'effect1', label: 'Effect 1', prompt: 'What happened as a result?', transitions: ['As a result,...', 'Consequently,...', 'This led to...'] },
      { key: 'cause2', label: 'Cause 2', prompt: 'Another cause?', transitions: ['Another factor was...', 'Additionally,...', 'Furthermore,...'] },
      { key: 'effect2', label: 'Effect 2', prompt: 'What else resulted?', transitions: ['Because of this,...', 'Therefore,...', 'This caused...'] },
      { key: 'conclusion', label: 'Conclusion', prompt: 'What did you learn about cause and effect?', transitions: ['In conclusion,...', 'Ultimately,...', 'This shows that...'] },
    ],
  },
]

export function ParagraphOrganizer({ isDark }: { isDark: boolean }) {
  const [typeIndex, setTypeIndex] = useState(0)
  const [values, setValues] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)

  const s = styles(isDark)
  const currentType = PARAGRAPH_TYPES[typeIndex]

  const handleTypeChange = useCallback(function(newIndex: number) {
    setTypeIndex(newIndex)
    setValues({})
    setShowPreview(false)
  }, [])

  const handleChange = useCallback(function(key: string, val: string) {
    setValues(function(prev) {
      const next: Record<string, string> = {}
      for (const k in prev) { next[k] = prev[k] }
      next[key] = val
      return next
    })
  }, [])

  const togglePreview = useCallback(function() {
    setShowPreview(function(prev) { return !prev })
  }, [])

  const previewText = useMemo(function() {
    const parts: string[] = []
    currentType.sections.forEach(function(sec) {
      const v = values[sec.key]
      if (v && v.trim()) { parts.push(v.trim()) }
    })
    return parts.join(' ')
  }, [currentType, values])

  const hasContent = useMemo(function() {
    return currentType.sections.some(function(sec) {
      const v = values[sec.key]
      return v && v.trim().length > 0
    })
  }, [currentType, values])

  const textareaStyle = {
    width: '100%',
    minHeight: 48,
    padding: '6px 8px',
    fontSize: 11,
    lineHeight: 1.5,
    border: '1px solid ' + s.border,
    borderRadius: 4,
    background: s.bg,
    color: s.bright,
    resize: 'vertical' as 'vertical' | 'horizontal' | 'both' | 'none',
    outline: 'none' as 'none',
    fontFamily: 'inherit',
  }

  return (
    <div style={{
      background: isDark ? 'rgba(15,23,42,0.6)' : '#ffffff',
      borderRadius: 8,
      border: '1px solid ' + s.border,
      overflow: 'hidden',
      fontSize: 12,
    }}>
      {/* Type Selector */}
      <div style={{
        padding: '8px 10px',
        borderBottom: '1px solid ' + s.border,
      }}>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          color: s.text,
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          Paragraph Type
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {PARAGRAPH_TYPES.map(function(pt, i) {
            const isActive = typeIndex === i
            return (
              <button
                key={pt.name}
                onClick={function() { handleTypeChange(i) }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer' as const,
                  border: '1px solid ' + (isActive ? pt.color : s.border),
                  background: isActive
                    ? pt.color + '18'
                    : s.bg,
                  color: isActive
                    ? pt.color
                    : s.text,
                  transition: 'all 0.15s ease',
                }}
              >
                {pt.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Organizer Sections */}
      <div style={{ padding: '8px 10px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
        }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: currentType.color,
            flexShrink: 0,
          }} />
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: s.bright,
          }}>
            {currentType.name + ' Paragraph'}
          </div>
        </div>

        {currentType.sections.map(function(sec) {
          const val = values[sec.key] || ''
          return (
            <div
              key={sec.key}
              style={{
                marginBottom: 8,
                borderLeft: '3px solid ' + currentType.color,
                paddingLeft: 8,
                paddingTop: 4,
                paddingBottom: 4,
              }}
            >
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                color: currentType.color,
                marginBottom: 1,
              }}>
                {sec.label}
              </div>
              <div style={{
                fontSize: 9,
                color: s.text,
                marginBottom: 3,
                fontStyle: 'italic',
              }}>
                {sec.prompt}
              </div>
              <textarea
                value={val}
                onChange={function(e) { handleChange(sec.key, e.target.value) }}
                placeholder={sec.prompt}
                style={textareaStyle}
              />
              {sec.transitions.length > 0 && (
                <div style={{
                  marginTop: 3,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 3,
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: 8,
                    color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                    fontStyle: 'italic',
                  }}>
                    {'Transitions: '}
                  </span>
                  {sec.transitions.map(function(t, ti) {
                    return (
                      <span
                        key={ti}
                        style={{
                          fontSize: 8,
                          color: currentType.color,
                          background: currentType.color + '15',
                          padding: '1px 5px',
                          borderRadius: 3,
                          cursor: 'pointer' as const,
                        }}
                        onClick={function() {
                          const newVal = val ? val + ' ' + t : t
                          handleChange(sec.key, newVal)
                        }}
                      >
                        {t}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Paragraph Preview */}
      <div style={{
        borderTop: '1px solid ' + s.border,
        padding: '8px 10px',
      }}>
        <button
          onClick={togglePreview}
          disabled={!hasContent}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 700,
            cursor: hasContent ? ('pointer' as const) : ('default' as 'default'),
            border: '1px solid ' + (hasContent ? currentType.color + '40' : s.border),
            background: hasContent ? currentType.color + '12' : s.bg,
            color: hasContent ? currentType.color : s.text,
            opacity: hasContent ? 1 : 0.5,
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <span style={{
            display: 'inline-block',
            transition: 'transform 0.2s ease',
            transform: showPreview ? 'rotate(90deg)' : 'rotate(0deg)',
          }}>
            {'\u25B6'}
          </span>
          {'Paragraph Preview'}
        </button>

        {showPreview && (
          <div style={{
            marginTop: 8,
            padding: '10px 12px',
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderRadius: 6,
            border: '1px solid ' + s.border,
            minHeight: 60,
          }}>
            {previewText ? (
              <div style={{
                fontSize: 12,
                lineHeight: 1.7,
                color: s.bright,
              }}>
                {previewText}
              </div>
            ) : (
              <div style={{
                fontSize: 11,
                color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
                fontStyle: 'italic',
                textAlign: 'center' as const,
              }}>
                Start filling in the sections above to see your paragraph take shape!
              </div>
            )}
          </div>
        )}
      </div>
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Paragraph type — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{currentType.name}</b> ({currentType.sections.length} sections)</div>
          <div>Step 2: Sections filled: {currentType.sections.filter((sec) => (values[sec.key] || '').trim()).length} / {currentType.sections.length}</div>
          <div>Step 3: {currentType.sections[0] ? <>Topic: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{(values[currentType.sections[0].key] || '').trim() || '?'}</b></> : '?'}</div>
          <div>Step 4: Evidence — fill in supporting sections with facts, examples, or quotes</div>
          <div>Step 5: {previewText ? <>Preview ready — {previewText.split(/\s+/).filter(Boolean).length} words</> : <span style={{ opacity: 0.6 }}>no preview yet (fill in sections)</span>}</div>
          <div>Step 6: {showPreview ? 'Preview shown above' : (hasContent ? 'Click "Paragraph Preview" to see the assembled paragraph' : 'Fill in sections to enable preview')}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Topic sentence + evidence + explanation + conclusion. Like a mini-essay: introduce, prove, explain, wrap up.
      </div>
</div>
  )
}


// ============================================================
// 11. SoundWallBuilder (K-5)
// ============================================================

interface PhonemeEntry {
  symbol: string
  label: string
  position: 'front' | 'mid' | 'back'
  description: string
  examples: string[]
  mouth: string
}

const PHONEME_WALL: PhonemeEntry[] = [
  { symbol: '/a/', label: 'short a', position: 'front', description: 'Open mouth, low vowel — like in "cat"', examples: ['cat', 'hat', 'map', 'bag'], mouth: 'Jaw drops, tongue low and forward' },
  { symbol: '/e/', label: 'short e', position: 'front', description: 'Relaxed front vowel — like in "bed"', examples: ['bed', 'red', 'net', 'leg'], mouth: 'Mouth slightly open, tongue forward' },
  { symbol: '/i/', label: 'short i', position: 'front', description: 'High front vowel — like in "pig"', examples: ['pig', 'sit', 'lid', 'fin'], mouth: 'Lips slightly spread, tongue high forward' },
  { symbol: '/o/', label: 'short o', position: 'back', description: 'Rounded open vowel — like in "dog"', examples: ['dog', 'log', 'pot', 'fox'], mouth: 'Jaw drops, lips slightly rounded' },
  { symbol: '/u/', label: 'short u', position: 'back', description: 'Relaxed back vowel — like in "sun"', examples: ['sun', 'bug', 'run', 'cup'], mouth: 'Mouth slightly open, tongue back' },
  { symbol: '/sh/', label: 'sh digraph', position: 'front', description: 'Quiet fricative — like in "ship"', examples: ['ship', 'fish', 'wash', 'shop'], mouth: 'Lips rounded and pushed out, teeth close' },
  { symbol: '/ch/', label: 'ch digraph', position: 'front', description: 'Affricate — like in "chip"', examples: ['chip', 'chin', 'chop', 'rich'], mouth: 'Tongue touches roof, then releases' },
  { symbol: '/th/', label: 'th digraph', position: 'front', description: 'Dental fricative — like in "thin" or "this"', examples: ['thin', 'this', 'bath', 'with'], mouth: 'Tongue tip between teeth' },
  { symbol: '/ng/', label: 'ng digraph', position: 'back', description: 'Nasal — like in "sing"', examples: ['sing', 'ring', 'long', 'king'], mouth: 'Back of tongue touches roof, air through nose' },
  { symbol: '/er/', label: 'r-controlled', position: 'mid', description: 'R-colored vowel — like in "her"', examples: ['her', 'bird', 'turn', 'fur'], mouth: 'Tongue pulled back and slightly up' },
]

const POSITION_COLOR: Record<'front' | 'mid' | 'back', { col: string, bg: string, bd: string }> = {
  front: { col: '#fb923c', bg: 'rgba(251,146,60,0.15)', bd: 'rgba(251,146,60,0.4)' },
  mid: { col: '#a78bfa', bg: 'rgba(167,139,250,0.15)', bd: 'rgba(167,139,250,0.4)' },
  back: { col: '#34d399', bg: 'rgba(52,211,153,0.15)', bd: 'rgba(52,211,153,0.4)' },
}

function segmentWord(word: string): string[] {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return []
  const known: Record<string, string[]> = {
    cat: ['c', 'a', 't'], dog: ['d', 'o', 'g'], ship: ['sh', 'i', 'p'], chip: ['ch', 'i', 'p'],
    fish: ['f', 'i', 'sh'], this: ['th', 'i', 's'], sing: ['s', 'i', 'ng'], her: ['h', 'er'],
    bird: ['b', 'ir', 'd'], sun: ['s', 'u', 'n'], hat: ['h', 'a', 't'], bed: ['b', 'e', 'd'],
    pig: ['p', 'i', 'g'], log: ['l', 'o', 'g'], ring: ['r', 'i', 'ng'], chop: ['ch', 'o', 'p'],
    thin: ['th', 'i', 'n'], shop: ['sh', 'o', 'p'], wash: ['w', 'a', 'sh'], chin: ['ch', 'i', 'n'],
    map: ['m', 'a', 'p'], bag: ['b', 'a', 'g'], red: ['r', 'e', 'd'], net: ['n', 'e', 't'],
    sit: ['s', 'i', 't'], lid: ['l', 'i', 'd'], fin: ['f', 'i', 'n'], pot: ['p', 'o', 't'],
    fox: ['f', 'o', 'x'], bug: ['b', 'u', 'g'], run: ['r', 'u', 'n'], cup: ['c', 'u', 'p'],
    frog: ['f', 'r', 'o', 'g'], truck: ['t', 'r', 'u', 'k'], flag: ['f', 'l', 'a', 'g'],
    grass: ['g', 'r', 'a', 's'], street: ['s', 't', 'r', 'ee', 't'], blue: ['b', 'l', 'oo'],
  }
  if (known[w]) return known[w]
  const phonemes: string[] = []
  let i = 0
  while (i < w.length) {
    const two = w.slice(i, i + 2)
    if (['sh', 'ch', 'th', 'ng', 'er', 'ir', 'ar', 'or', 'oo', 'ee', 'ea', 'ou', 'ow', 'ai', 'ay', 'oi', 'oy', 'ph', 'wh'].includes(two)) {
      phonemes.push(two)
      i += 2
    } else {
      phonemes.push(w[i])
      i += 1
    }
  }
  return phonemes
}

export function SoundWallBuilder({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [selected, setSelected] = useState<PhonemeEntry | null>(PHONEME_WALL[0])
  const [mode, setMode] = useState<'wall' | 'practice'>('wall')
  const [practiceWord, setPracticeWord] = useState('')
  const segmented = useMemo(() => practiceWord ? segmentWord(practiceWord) : [], [practiceWord])
  const posColor = selected ? POSITION_COLOR[selected.position] : POSITION_COLOR.front
  const mouthDotX = selected?.position === 'front' ? 80 : selected?.position === 'mid' ? 140 : 200
  const mouthDotY = selected?.position === 'back' ? 90 : 60

  return (
    <div>
      <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
        <button onClick={() => setMode('wall')} style={s.btn(mode === 'wall')}>Sound Wall</button>
        <button onClick={() => setMode('practice')} style={s.btn(mode === 'practice')}>Practice</button>
      </div>

      {mode === 'wall' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, marginBottom: 8 }}>
            {PHONEME_WALL.map((p, i) => {
              const c = POSITION_COLOR[p.position]
              const isActive = selected?.symbol === p.symbol
              return (
                <button key={i} onClick={() => setSelected(p)} style={{
                  padding: '4px 2px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer' as const,
                  background: isActive ? c.bg : s.bg,
                  border: '1px solid ' + (isActive ? c.bd : s.border),
                  color: isActive ? c.col : s.text,
                }}>{p.symbol}</button>
              )
            })}
          </div>

          {selected && (
            <>
              <div style={{ padding: 6, borderRadius: 6, background: s.bg, border: '1px solid ' + s.border, marginBottom: 6 }}>
                <svg width="100%" viewBox="0 0 280 130" style={{ display: 'block' }}>
                  <path d="M40 65 Q40 25 90 20 L200 20 Q240 25 240 65 L240 95 Q200 110 140 110 Q80 110 40 95 Z"
                    fill={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'} stroke={s.border} strokeWidth="1.5" />
                  <ellipse cx="140" cy="70" rx="55" ry="20" fill="none" stroke={posColor.col} strokeWidth="2" />
                  <circle cx={mouthDotX} cy={mouthDotY} r="7" fill={posColor.col} />
                  <text x={mouthDotX} y={mouthDotY - 12} fontSize="10" fill={posColor.col} textAnchor="middle" fontWeight="700">
                    {selected.position.toUpperCase()}
                  </text>
                  <text x="80" y="125" fontSize="8" fill={s.text} textAnchor="middle">FRONT</text>
                  <text x="140" y="125" fontSize="8" fill={s.text} textAnchor="middle">MID</text>
                  <text x="200" y="125" fontSize="8" fill={s.text} textAnchor="middle">BACK</text>
                </svg>
                <div style={{ fontSize: 10, color: s.bright, fontWeight: 600, textAlign: 'center' as const }}>
                  {selected.mouth}
                </div>
              </div>

              <div style={{ padding: '6px 8px', borderRadius: 4, background: posColor.bg, border: '1px solid ' + posColor.bd, marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: posColor.col }}>{selected.symbol} — {selected.label}</div>
                <div style={{ fontSize: 10, color: s.bright, marginTop: 3 }}>{selected.description}</div>
              </div>

              <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 3 }}>EXAMPLE WORDS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {selected.examples.map((w, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 600, color: posColor.col, background: posColor.bg, padding: '2px 7px', borderRadius: 3, border: '1px solid ' + posColor.bd }}>{w}</span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {mode === 'practice' && (
        <div>
          <div style={{ fontSize: 10, color: s.text, marginBottom: 4 }}>Type a word to break it into phonemes:</div>
          <input value={practiceWord} onChange={(e) => setPracticeWord(e.target.value)} placeholder="e.g. cat, ship, sing..." style={{ ...s.input, width: '100%', boxSizing: 'border-box' }} />
          {practiceWord && (
            <div style={{ marginTop: 8, padding: 8, borderRadius: 6, background: s.bg, border: '1px solid ' + s.border }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 6 }}>PHONEMES ({segmented.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                {segmented.map((ph, i) => {
                  const wall = PHONEME_WALL.find(p => p.symbol.replace(/\//g, '') === ph)
                  const c = wall ? POSITION_COLOR[wall.position] : { col: '#94a3b8', bg: 'rgba(148,163,184,0.12)', bd: 'rgba(148,163,184,0.3)' }
                  return (
                    <div key={i} style={{ padding: '6px 12px', borderRadius: 5, fontSize: 18, fontWeight: 700, background: c.bg, border: '2px solid ' + c.bd, color: c.col }}>
                      {ph}
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 6, fontSize: 10, color: s.text, textAlign: 'center' as const }}>
                {segmented.length > 0 ? <>{practiceWord} → {segmented.length} sounds: {segmented.join(' · ')}</> : 'Type a word above'}
              </div>
            </div>
          )}
          <div style={{ marginTop: 6, fontSize: 9, color: s.text, opacity: 0.7, fontStyle: 'italic' }}>
            Tip: Try short words like "cat", "ship", "sing", "this"
          </div>
        </div>
      )}

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Mode — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{mode === 'wall' ? 'Sound Wall' : 'Practice'}</b></div>
        <div>Step 2: {mode === 'wall' ? <>Selected sound: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{selected?.symbol}</b> ({selected?.label})</> : <>Word: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{practiceWord || '—'}</b></>}</div>
        <div>Step 3: {mode === 'wall' ? <>Tongue position: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{selected?.position}</b> of mouth</> : <>Phoneme count: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{segmented.length}</b></>}</div>
        <div>Step 4: {mode === 'wall' ? <>Say the sound while feeling where your tongue touches</> : <>Segmentation: {segmented.length > 0 ? <b style={{ color: isDark ? '#34d399' : '#059669' }}>{segmented.join(' · ')}</b> : '—'}</>}</div>
        <div>Step 5: {mode === 'wall' ? <>Examples: {selected?.examples.join(', ')}</> : <>Each phoneme is a separate sound to blend together</>}</div>
        <div>Step 6: Practice saying each sound slowly, then blend them together into the word</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Phonemes are the smallest sound units in speech. The mouth shape changes for each one. Hearing and producing sounds precisely is the foundation for reading and spelling.
      </div>
    </div>
  )
}

// ============================================================
// 12. DecodableTextReader (K-5)
// ============================================================

const DECODABLE_PRESETS = [
  { title: 'CVC Words', text: 'The cat sat on a mat. A dog ran to the log. The pig had a wig.' },
  { title: 'Digraphs', text: 'The ship went to the shop. A fish swam in the dish. The chin had a thin shell.' },
  { title: 'Blends', text: 'The frog jumped on the grass. A truck went down the street. The flag flew in the blue sky.' },
]

function classifyWord(word: string): 'cvc' | 'digraph' | 'blend' | 'other' {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length < 3) return 'other'
  const hasDigraph = /sh|ch|th|wh|ph/.test(w)
  const hasBlend = /^(bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|sc|sk|sl|sm|sn|sp|st|sw|tr|tw|scr|spr|str)/.test(w) ||
    /(nd|nt|st|sk|sp|mp|nk|ft|lt|pt|ct)$/.test(w)
  const isCVC = w.length === 3 && /[aeiou]/.test(w[1]) && !/[aeiou]/.test(w[0]) && !/[aeiou]/.test(w[2])
  if (hasDigraph) return 'digraph'
  if (hasBlend) return 'blend'
  if (isCVC) return 'cvc'
  return 'other'
}

const WORD_COLORS: Record<'cvc' | 'digraph' | 'blend' | 'other', { col: string, bg: string }> = {
  cvc: { col: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  digraph: { col: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  blend: { col: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  other: { col: '#94a3b8', bg: 'transparent' },
}

export function DecodableTextReader({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [presetIdx, setPresetIdx] = useState(0)
  const [text, setText] = useState(DECODABLE_PRESETS[0].text)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)

  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text])
  const stats = useMemo(() => {
    const c: Record<'cvc' | 'digraph' | 'blend' | 'other', number> = { cvc: 0, digraph: 0, blend: 0, other: 0 }
    for (const w of words) c[classifyWord(w)]++
    return c
  }, [words])

  const selectedSounds = useMemo(() => selectedWord ? segmentWord(selectedWord) : [], [selectedWord])

  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 3 }}>PRESETS</div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 6, flexWrap: 'wrap' }}>
        {DECODABLE_PRESETS.map((p, i) => (
          <button key={i} onClick={() => { setPresetIdx(i); setText(p.text); setSelectedWord(null) }} style={s.btn(presetIdx === i)}>{p.title}</button>
        ))}
      </div>

      <textarea value={text} onChange={(e) => { setText(e.target.value); setSelectedWord(null) }} rows={3} style={{ ...s.input, width: '100%', resize: 'vertical' as const, minHeight: 60, lineHeight: 1.5, fontFamily: 'inherit', boxSizing: 'border-box' }} />

      <div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 6, flexWrap: 'wrap', fontSize: 9 }}>
        <span style={{ color: WORD_COLORS.cvc.col, fontWeight: 600 }}>■ CVC ({stats.cvc})</span>
        <span style={{ color: WORD_COLORS.digraph.col, fontWeight: 600 }}>■ Digraph ({stats.digraph})</span>
        <span style={{ color: WORD_COLORS.blend.col, fontWeight: 600 }}>■ Blend ({stats.blend})</span>
      </div>

      <div style={{ padding: 8, borderRadius: 6, background: s.bg, border: '1px solid ' + s.border, fontSize: 13, lineHeight: 1.8 }}>
        {words.map((w, i) => {
          const type = classifyWord(w)
          const c = WORD_COLORS[type]
          const cleaned = w.replace(/[^a-zA-Z]/g, '')
          const isSelected = selectedWord === cleaned
          return (
            <span key={i} onClick={() => setSelectedWord(cleaned)} style={{
              color: type === 'other' ? s.bright : c.col,
              background: isSelected ? c.bg : (type === 'other' ? 'transparent' : c.bg),
              padding: '1px 3px', borderRadius: 2, cursor: 'pointer' as const,
              borderBottom: type === 'other' ? 'none' : '2px solid ' + c.col,
              fontWeight: type === 'other' ? 400 : 600,
            }}>{w} </span>
          )
        })}
      </div>

      {selectedWord && (
        <div style={{ marginTop: 6, padding: 8, borderRadius: 6, background: s.bg, border: '1px solid ' + s.border }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 6 }}>SEGMENTING: {selectedWord.toUpperCase()}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
            {selectedSounds.map((ph, i) => (
              <div key={i} style={{ padding: '4px 10px', borderRadius: 4, fontSize: 14, fontWeight: 700, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}>{ph}</div>
            ))}
            {selectedSounds.length === 0 && <div style={{ fontSize: 11, color: s.text }}>No segmentation available</div>}
          </div>
          <div style={{ marginTop: 4, fontSize: 10, color: s.text, textAlign: 'center' as const }}>
            Say each sound slowly: {selectedSounds.join(' — ')}
          </div>
        </div>
      )}

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Preset — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{DECODABLE_PRESETS[presetIdx].title}</b></div>
        <div>Step 2: Word count — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{words.length}</b> total words in passage</div>
        <div>Step 3: Pattern counts — <b style={{ color: '#3b82f6' }}>{stats.cvc}</b> CVC, <b style={{ color: '#22c55e' }}>{stats.digraph}</b> digraphs, <b style={{ color: '#a855f7' }}>{stats.blend}</b> blends</div>
        <div>Step 4: {selectedWord ? <>Selected word: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{selectedWord}</b></> : 'Click any word to segment it into sounds'}</div>
        <div>Step 5: {selectedWord ? <>Phonemes: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{selectedSounds.join(' · ') || '—'}</b></> : 'Highlighted by phonics pattern — blue=CVC, green=digraph, purple=blend'}</div>
        <div>Step 6: Read slowly, blending each sound: c-a-t → cat</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Decodable text uses patterns students have learned. CVC builds phoneme blending. Digraphs are two letters making one sound. Blends keep both sounds together.
      </div>
    </div>
  )
}

// ============================================================
// 13. SightWordOrthographicMap (K-5)
// ============================================================

const SIGHT_WORDS: { word: string, mapping: [string, string][] }[] = [
  { word: 'the', mapping: [['t', '/t/'], ['h', 'silent'], ['e', '/uh/']] },
  { word: 'said', mapping: [['s', '/s/'], ['ai', '/e/'], ['d', '/d/']] },
  { word: 'was', mapping: [['w', '/w/'], ['a', '/u/'], ['s', '/z/']] },
  { word: 'of', mapping: [['o', '/u/'], ['f', '/v/']] },
  { word: 'are', mapping: [['a', '/ah/'], ['r', '/r/'], ['e', 'silent']] },
]

type SightPhase = 'show' | 'cover' | 'type' | 'checked'

export function SightWordOrthographicMap({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [phase, setPhase] = useState<SightPhase>('show')
  const [typed, setTyped] = useState('')
  const [score, setScore] = useState({ correct: 0, attempts: 0 })

  const active = activeIdx !== null ? SIGHT_WORDS[activeIdx] : null
  const lastCorrect = phase === 'checked' && !!active && typed.trim().toLowerCase() === active.word.toLowerCase()

  const startPractice = (i: number) => {
    setActiveIdx(i)
    setPhase('show')
    setTyped('')
  }
  const check = () => {
    if (!active) return
    const correct = typed.trim().toLowerCase() === active.word.toLowerCase()
    setScore({ correct: score.correct + (correct ? 1 : 0), attempts: score.attempts + 1 })
    setPhase('checked')
  }
  const close = () => { setActiveIdx(null); setPhase('show'); setTyped('') }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, padding: '4px 8px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
        <div style={{ fontSize: 10, color: s.text }}>Score: <b style={{ color: '#34d399' }}>{score.correct}</b>/{score.attempts}</div>
        <div style={{ fontSize: 10, color: s.text }}>Accuracy: <b style={{ color: '#34d399' }}>{score.attempts === 0 ? '—' : Math.round(score.correct / score.attempts * 100) + '%'}</b></div>
      </div>

      <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 4 }}>CLICK A WORD TO PRACTICE</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
        {SIGHT_WORDS.map((sw, i) => (
          <button key={i} onClick={() => startPractice(i)} style={{
            padding: '6px 10px', borderRadius: 5, fontSize: 13, fontWeight: 700, cursor: 'pointer' as const,
            background: activeIdx === i ? 'rgba(34,197,94,0.12)' : s.bg,
            border: '1px solid ' + (activeIdx === i ? 'rgba(34,197,94,0.4)' : s.border),
            color: activeIdx === i ? '#34d399' : s.bright,
          }}>{sw.word}</button>
        ))}
      </div>

      {active && (
        <div style={{ padding: 8, borderRadius: 6, background: s.bg, border: '1px solid ' + s.border }}>
          {phase === 'show' && (
            <div>
              <div style={{ fontSize: 10, color: s.text, marginBottom: 6 }}>Look at the word and spell it out loud:</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.bright, textAlign: 'center' as const, letterSpacing: 4, marginBottom: 8 }}>{active.word}</div>
              <button onClick={() => setPhase('cover')} style={{ ...s.btn(true), width: '100%', padding: '6px', fontWeight: 600 }}>Cover It</button>
            </div>
          )}
          {phase === 'cover' && (
            <div>
              <div style={{ fontSize: 10, color: s.text, marginBottom: 6 }}>The word is covered. Picture it in your mind:</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.text, textAlign: 'center' as const, letterSpacing: 4, marginBottom: 8, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', padding: 6, borderRadius: 4 }}>▓▓▓▓</div>
              <button onClick={() => setPhase('type')} style={{ ...s.btn(true), width: '100%', padding: '6px', fontWeight: 600 }}>Write From Memory</button>
            </div>
          )}
          {phase === 'type' && (
            <div>
              <div style={{ fontSize: 10, color: s.text, marginBottom: 6 }}>Type the word you saw:</div>
              <input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus style={{ ...s.input, width: '100%', fontSize: 18, textAlign: 'center' as const, padding: '6px', boxSizing: 'border-box' }} />
              <button onClick={check} disabled={!typed.trim()} style={{ ...s.btn(true), width: '100%', padding: '6px', fontWeight: 600, marginTop: 6, opacity: typed.trim() ? 1 : 0.5 }}>Check</button>
            </div>
          )}
          {phase === 'checked' && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: lastCorrect ? '#34d399' : '#f87171', textAlign: 'center' as const, marginBottom: 6 }}>
                {lastCorrect ? '✓ Correct!' : '✗ Try Again'}
              </div>
              <div style={{ fontSize: 11, color: s.text, textAlign: 'center' as const, marginBottom: 4 }}>
                You wrote: <b style={{ color: lastCorrect ? '#34d399' : '#f87171' }}>{typed || '(blank)'}</b>
              </div>
              {!lastCorrect && <div style={{ fontSize: 11, color: s.bright, textAlign: 'center' as const, marginBottom: 6 }}>Correct: <b>{active.word}</b></div>}
              <button onClick={close} style={{ ...s.btn(false), width: '100%', padding: '6px', fontWeight: 600 }}>Done</button>
            </div>
          )}

          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid ' + s.border }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 5 }}>ORTHOGRAPHIC MAP</div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
              {active.mapping.map(([letter, sound], i) => (
                <div key={i} style={{ textAlign: 'center' as const }}>
                  <div style={{ padding: '4px 8px', borderRadius: 4, fontSize: 16, fontWeight: 700, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', marginBottom: 2 }}>{letter}</div>
                  <div style={{ fontSize: 9, color: sound === 'silent' ? '#f87171' : s.text, fontStyle: 'italic' }}>{sound}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Phase — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{phase}</b>{active ? <>, word: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{active.word}</b></> : ', no word selected'}</div>
        <div>Step 2: {active ? <>Look carefully at the word, say each letter aloud</> : 'Click a sight word above to begin'}</div>
        <div>Step 3: {active ? <>Cover it and try to picture it in your mind</> : '—'}</div>
        <div>Step 4: {active ? <>Type the word from memory: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{typed || '(not yet typed)'}</b></> : '—'}</div>
        <div>Step 5: {phase === 'checked' ? <>{lastCorrect ? '✓ Matched — orthographic map strengthening!' : '✗ Mismatch — study the letter-sound map below'}</> : 'Check verifies spelling against the original'}</div>
        <div>Step 6: Score so far — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{score.correct}</b> correct out of <b style={{ color: isDark ? '#34d399' : '#059669' }}>{score.attempts}</b></div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Sight words often break phonics rules. Cover-Write-Check builds the orthographic map — connecting letters to sounds in memory. Repeated retrieval makes them automatic.
      </div>
    </div>
  )
}

// ============================================================
// 14. DigitalAnnotationTool (6-8)
// ============================================================

const ANNOTATION_PRESETS = [
  { title: 'Fog', text: 'The fog crept in on cat feet. It covered the harbor and the city, then moved on. No one noticed when it left, but the air felt different — emptier, somehow.' },
  { title: 'Immigration', text: 'When we arrived, my grandmother held my hand tightly. The new city was loud and bright. She did not speak the language, but she knew the way. Every step was a small act of courage.' },
  { title: 'Climate', text: 'The ice melted faster this year. Scientists warned that the permafrost was collapsing. Villagers watched their homes sink into the ground. Something had to change, and soon.' },
]

type AnnotationType = 'question' | 'important' | 'connection' | 'vocabulary'

interface Annotation {
  start: number
  end: number
  text: string
  type: AnnotationType
}

const ANNOT_TYPES: { type: AnnotationType, label: string, icon: string, col: string, bg: string }[] = [
  { type: 'question', label: 'Question', icon: '?', col: '#3b82f6', bg: 'rgba(59,130,246,0.2)' },
  { type: 'important', label: 'Important', icon: '!', col: '#ef4444', bg: 'rgba(239,68,68,0.2)' },
  { type: 'connection', label: 'Connection', icon: '🔗', col: '#a855f7', bg: 'rgba(168,85,247,0.2)' },
  { type: 'vocabulary', label: 'Vocabulary', icon: '📖', col: '#f59e0b', bg: 'rgba(245,158,11,0.2)' },
]

export function DigitalAnnotationTool({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [presetIdx, setPresetIdx] = useState(0)
  const [text, setText] = useState(ANNOTATION_PRESETS[0].text)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [selection, setSelection] = useState<{ start: number, end: number, text: string } | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  const handleSelect = () => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    if (start === end) { setSelection(null); return }
    setSelection({ start, end, text: text.slice(start, end) })
  }

  const annotate = (type: AnnotationType) => {
    if (!selection) return
    setAnnotations([...annotations, { ...selection, type }])
    setSelection(null)
  }

  const removeAnno = (i: number) => {
    setAnnotations(annotations.filter((_, idx) => idx !== i))
  }

  const counts = useMemo(() => {
    const c: Record<AnnotationType, number> = { question: 0, important: 0, connection: 0, vocabulary: 0 }
    for (const a of annotations) c[a.type]++
    return c
  }, [annotations])

  const renderHighlighted = (): React.ReactNode => {
    if (annotations.length === 0) return <span style={{ color: s.bright }}>{text}</span>
    const sorted = [...annotations].sort((a, b) => a.start - b.start)
    const parts: React.ReactNode[] = []
    let cursor = 0
    sorted.forEach((a, i) => {
      if (a.start > cursor) parts.push(<span key={'p' + i} style={{ color: s.bright }}>{text.slice(cursor, a.start)}</span>)
      const def = ANNOT_TYPES.find(t => t.type === a.type)!
      parts.push(
        <span key={'a' + i} style={{
          background: def.bg, color: def.col, padding: '1px 2px', borderRadius: 2,
          borderBottom: '2px solid ' + def.col, fontWeight: 600,
        }} title={def.label}>{text.slice(a.start, a.end)}</span>
      )
      cursor = a.end
    })
    if (cursor < text.length) parts.push(<span key="end" style={{ color: s.bright }}>{text.slice(cursor)}</span>)
    return parts
  }

  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 3 }}>PRESETS</div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 6, flexWrap: 'wrap' }}>
        {ANNOTATION_PRESETS.map((p, i) => (
          <button key={i} onClick={() => { setPresetIdx(i); setText(p.text); setAnnotations([]); setSelection(null) }} style={s.btn(presetIdx === i)}>{p.title}</button>
        ))}
      </div>

      <div style={{ fontSize: 9, color: s.text, marginBottom: 3 }}>1. Select text below ↓  2. Pick an annotation type</div>
      <textarea ref={textareaRef} value={text} onChange={(e) => { setText(e.target.value); setAnnotations([]) }} onSelect={handleSelect} onMouseUp={handleSelect} onKeyUp={handleSelect}
        rows={4} style={{ ...s.input, width: '100%', resize: 'vertical' as const, minHeight: 70, lineHeight: 1.6, fontFamily: 'inherit', boxSizing: 'border-box' }} />

      {selection && (
        <div style={{ marginTop: 6, padding: 6, borderRadius: 4, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <div style={{ fontSize: 10, color: '#34d399', marginBottom: 4 }}>Selected: "{selection.text}"</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {ANNOT_TYPES.map(at => (
              <button key={at.type} onClick={() => annotate(at.type)} style={{
                padding: '3px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600, cursor: 'pointer' as const,
                background: at.bg, border: '1px solid ' + at.col, color: at.col,
              }}>{at.icon} {at.label}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 6, padding: 8, borderRadius: 4, background: s.bg, border: '1px solid ' + s.border, fontSize: 11, lineHeight: 1.8 }}>
        {renderHighlighted()}
      </div>

      <div style={{ marginTop: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 3 }}>ANNOTATIONS ({annotations.length})</div>
        {annotations.length === 0 ? (
          <div style={{ fontSize: 10, color: s.text, opacity: 0.7, fontStyle: 'italic' }}>No annotations yet. Select text above to start.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {annotations.map((a, i) => {
              const def = ANNOT_TYPES.find(t => t.type === a.type)!
              return (
                <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'flex-start', padding: '4px 6px', borderRadius: 3, background: def.bg, border: '1px solid ' + def.col }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: def.col }}>{def.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: s.bright, fontWeight: 600 }}>"{a.text.length > 30 ? a.text.slice(0, 30) + '…' : a.text}"</div>
                    <div style={{ fontSize: 9, color: def.col, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>{def.label}</div>
                  </div>
                  <button onClick={() => removeAnno(i)} style={{ fontSize: 10, color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer' as const, padding: '0 4px' }}>×</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 6, display: 'flex', gap: 5, flexWrap: 'wrap', fontSize: 9 }}>
        {ANNOT_TYPES.map(at => (
          <span key={at.type} style={{ color: at.col, fontWeight: 600 }}>{at.icon} {counts[at.type]}</span>
        ))}
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Preset — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{ANNOTATION_PRESETS[presetIdx].title}</b></div>
        <div>Step 2: {selection ? <>Text selected: "<b style={{ color: isDark ? '#34d399' : '#059669' }}>{selection.text}</b>"</> : 'Drag-select a phrase in the passage above'}</div>
        <div>Step 3: {selection ? 'Pick an annotation type (?/!/🔗/📖) to mark it' : 'Annotations so far — ' + annotations.length}</div>
        <div>Step 4: Counts — <b style={{ color: '#3b82f6' }}>?</b> {counts.question}, <b style={{ color: '#ef4444' }}>!</b> {counts.important}, <b style={{ color: '#a855f7' }}>🔗</b> {counts.connection}, <b style={{ color: '#f59e0b' }}>📖</b> {counts.vocabulary}</div>
        <div>Step 5: Each annotation appears in the margin sidebar with the highlighted quote</div>
        <div>Step 6: Use annotations to track thinking — questions for confusion, ! for key ideas, 🔗 for text-to-self/world, 📖 for new words</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Annotating is conversation with text. Questions reveal confusion. Marks flag importance. Connections build meaning. Active reading beats passive reading every time.
      </div>
    </div>
  )
}

// ============================================================
// 15. CitationGeneratorIntro (6-8)
// ============================================================

type SourceType = 'book' | 'website' | 'article'

const SOURCE_FIELDS: Record<SourceType, { key: string, label: string, placeholder: string }[]> = {
  book: [
    { key: 'author', label: 'Author', placeholder: 'Last, First' },
    { key: 'title', label: 'Title', placeholder: 'Book Title' },
    { key: 'publisher', label: 'Publisher', placeholder: 'Publisher Name' },
    { key: 'year', label: 'Year', placeholder: '2020' },
  ],
  website: [
    { key: 'author', label: 'Author', placeholder: 'Last, First (optional)' },
    { key: 'title', label: 'Page Title', placeholder: 'Article Title' },
    { key: 'site', label: 'Site Name', placeholder: 'Website Name' },
    { key: 'url', label: 'URL', placeholder: 'https://...' },
    { key: 'accessed', label: 'Accessed Date', placeholder: 'Day Mon. Year' },
  ],
  article: [
    { key: 'author', label: 'Author', placeholder: 'Last, First' },
    { key: 'title', label: 'Article Title', placeholder: 'Article Title' },
    { key: 'journal', label: 'Journal', placeholder: 'Journal Name' },
    { key: 'volume', label: 'Volume', placeholder: 'vol. 12' },
    { key: 'year', label: 'Year', placeholder: '2020' },
    { key: 'pages', label: 'Pages', placeholder: 'pp. 1-15' },
  ],
}

const SOURCE_EXAMPLES: Record<SourceType, Record<string, string>> = {
  book: { author: 'Smith, John', title: 'The History of Reading', publisher: 'Penguin Books', year: '2020' },
  website: { author: 'Jones, Mary', title: 'How to Cite Sources', site: 'Writing Center', url: 'https://example.com/cite', accessed: '15 Mar. 2024' },
  article: { author: 'Lee, Anna', title: 'Reading in the Digital Age', journal: 'Journal of Education', volume: 'vol. 12', year: '2021', pages: 'pp. 45-60' },
}

function buildCitation(type: SourceType, vals: Record<string, string>): string {
  const v = vals
  if (type === 'book') {
    const parts: string[] = []
    if (v.author) parts.push(v.author)
    if (v.title) parts.push(`<i>${v.title}</i>`)
    if (v.publisher) parts.push(v.publisher)
    if (v.year) parts.push(v.year)
    return parts.join('. ') + (parts.length ? '.' : '')
  }
  if (type === 'website') {
    const parts: string[] = []
    if (v.author) parts.push(v.author)
    if (v.title) parts.push(`"${v.title}"`)
    if (v.site) parts.push(`<i>${v.site}</i>`)
    const accessPart: string[] = []
    if (v.url) accessPart.push(v.url)
    if (v.accessed) accessPart.push(`Accessed ${v.accessed}`)
    if (accessPart.length) parts.push(accessPart.join(', '))
    return parts.join('. ') + (parts.length ? '.' : '')
  }
  const parts: string[] = []
  if (v.author) parts.push(v.author)
  if (v.title) parts.push(`"${v.title}"`)
  const journalPart: string[] = []
  if (v.journal) journalPart.push(`<i>${v.journal}</i>`)
  if (v.volume) journalPart.push(v.volume)
  if (v.year) journalPart.push(v.year)
  if (v.pages) journalPart.push(v.pages)
  if (journalPart.length) parts.push(journalPart.join(', '))
  return parts.join('. ') + (parts.length ? '.' : '')
}

function CitationDisplay({ html, isDark }: { html: string, isDark: boolean }) {
  const parts: React.ReactNode[] = []
  const regex = /<i>(.*?)<\/i>/g
  let lastIdx = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = regex.exec(html)) !== null) {
    if (m.index > lastIdx) parts.push(<span key={'t' + i}>{html.slice(lastIdx, m.index)}</span>)
    parts.push(<i key={'i' + i} style={{ fontStyle: 'italic' }}>{m[1]}</i>)
    lastIdx = m.index + m[0].length
    i++
  }
  if (lastIdx < html.length) parts.push(<span key="end">{html.slice(lastIdx)}</span>)
  if (parts.length === 0) return <span style={{ color: isDark ? '#94a3b8' : '#475569', fontStyle: 'italic' }}>Fill in fields to see citation...</span>
  return <span>{parts}</span>
}

export function CitationGeneratorIntro({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [sourceType, setSourceType] = useState<SourceType>('book')
  const [values, setValues] = useState<Record<string, string>>({})

  const fields = SOURCE_FIELDS[sourceType]
  const citation = useMemo(() => buildCitation(sourceType, values), [sourceType, values])
  const filledCount = fields.filter(f => (values[f.key] || '').trim()).length

  const loadExample = () => setValues(SOURCE_EXAMPLES[sourceType])
  const clearAll = () => setValues({})

  return (
    <div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 6, flexWrap: 'wrap' }}>
        {(['book', 'website', 'article'] as SourceType[]).map(t => (
          <button key={t} onClick={() => { setSourceType(t); setValues({}) }} style={s.btn(sourceType === t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        <button onClick={loadExample} style={{ ...s.btn(false), fontSize: 10 }}>Load Example</button>
        <button onClick={clearAll} style={{ ...s.btn(false), fontSize: 10 }}>Clear</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
        {fields.map(f => (
          <div key={f.key}>
            <div style={{ fontSize: 9, color: s.text, marginBottom: 1, fontWeight: 600 }}>{f.label}</div>
            <input value={values[f.key] || ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} placeholder={f.placeholder} style={{ ...s.input, width: '100%', boxSizing: 'border-box' }} />
          </div>
        ))}
      </div>

      <div style={{ padding: 8, borderRadius: 6, background: s.bg, border: '1px solid ' + s.border, marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 4 }}>MLA CITATION ({filledCount}/{fields.length} fields)</div>
        <div style={{ fontSize: 11, lineHeight: 1.6, color: s.bright, paddingLeft: 16, textIndent: -16 }}>
          <CitationDisplay html={citation} isDark={isDark} />
        </div>
      </div>

      <div style={{ padding: 6, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + s.border }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 4 }}>ANATOMY OF A CITATION</div>
        <div style={{ fontSize: 10, lineHeight: 1.7, color: s.bright }}>
          <div><b style={{ color: '#60a5fa' }}>Author</b> — who wrote it (gives credit)</div>
          <div><b style={{ color: '#34d399' }}>Title</b> — what it's called (italics for books, quotes for articles)</div>
          {sourceType === 'book' && <div><b style={{ color: '#fb923c' }}>Publisher</b> — who produced it</div>}
          {sourceType === 'website' && <div><b style={{ color: '#fb923c' }}>Site Name</b> — where it lives online</div>}
          {sourceType === 'article' && <div><b style={{ color: '#fb923c' }}>Journal</b> — the publication it appeared in</div>}
          <div><b style={{ color: '#a855f7' }}>Date/Year</b> — when it was published</div>
          {sourceType === 'website' && <div><b style={{ color: '#f87171' }}>URL + Accessed</b> — so readers can find it</div>}
          {sourceType === 'article' && <div><b style={{ color: '#f87171' }}>Volume + Pages</b> — where in the journal</div>}
        </div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Source type — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{sourceType}</b></div>
        <div>Step 2: Fields to fill — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{fields.length}</b>, completed: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{filledCount}</b></div>
        <div>Step 3: MLA format = Author. <i>Title</i>. Publisher, Year.</div>
        <div>Step 4: Each field has a slot — author first, then title (italics for books, quotes for articles)</div>
        <div>Step 5: Periods separate each piece; titles of long works (books, sites) are italicized</div>
        <div>Step 6: Live citation: {citation ? <i style={{ color: isDark ? '#34d399' : '#059669' }}>{citation.replace(/<[^>]+>/g, '')}</i> : '—'}</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Citations give credit and let readers find sources. MLA = Modern Language Association style — used in humanities. Consistency matters more than memorization.
      </div>
    </div>
  )
}

// ============================================================
// 16. PeerReviewChecklist (6-8)
// ============================================================

const ESSAY_PRESETS = [
  { title: 'Strong Essay', text: 'School uniforms should be required because they reduce bullying. When everyone wears the same clothes, students cannot judge each other by brands. For example, a 2018 study found bullying dropped 30% in uniform schools. Furthermore, uniforms save families money. Therefore, all schools should adopt uniforms to create a fairer environment.' },
  { title: 'Missing Thesis', text: 'I think school is okay. Some classes are fun. Lunch is the best part. My friends are there. The teachers are nice. We learn about history and math and science. Sometimes homework is hard but I get it done. School is just a part of life.' },
  { title: 'No Evidence', text: 'Homework should be banned. It is too much work. Kids are tired. We need time to play. Parents agree with me. Teachers should know better. Homework is bad for everyone. So it should stop.' },
]

interface ChecklistItem {
  key: string
  label: string
  description: string
}

const PEER_CHECKLIST: ChecklistItem[] = [
  { key: 'thesis', label: 'Clear Thesis', description: 'Is there a main claim in the introduction?' },
  { key: 'evidence', label: 'Evidence', description: 'Are there facts, examples, or quotes to support claims?' },
  { key: 'transitions', label: 'Transitions', description: 'Do sentences and paragraphs flow with linking words?' },
  { key: 'conclusion', label: 'Strong Conclusion', description: 'Does the ending wrap up and leave an impression?' },
]

export function PeerReviewChecklist({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [presetIdx, setPresetIdx] = useState(0)
  const [essay, setEssay] = useState(ESSAY_PRESETS[0].text)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, string>>({})

  const wordCount = useMemo(() => essay.split(/\s+/).filter(Boolean).length, [essay])
  const checkedCount = Object.values(checks).filter(Boolean).length
  const commentCount = Object.values(comments).filter(c => c && c.trim()).length

  const feedback = useMemo(() => {
    const lines: string[] = []
    if (checks.thesis) lines.push('✓ Strong thesis — reader knows your position')
    else lines.push('✗ Add a clear thesis stating your main claim')
    if (checks.evidence) lines.push('✓ Evidence present — claims are backed up')
    else lines.push('✗ Add evidence (facts, examples, quotes) to support each reason')
    if (checks.transitions) lines.push('✓ Smooth transitions — ideas connect')
    else lines.push('✗ Add transition words (furthermore, however, therefore)')
    if (checks.conclusion) lines.push('✓ Strong conclusion — wraps up effectively')
    else lines.push('✗ Strengthen the conclusion — restate and leave an impression')
    return lines
  }, [checks])

  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 3 }}>ESSAY PRESETS</div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 6, flexWrap: 'wrap' }}>
        {ESSAY_PRESETS.map((p, i) => (
          <button key={i} onClick={() => { setPresetIdx(i); setEssay(p.text); setChecks({}); setComments({}) }} style={s.btn(presetIdx === i)}>{p.title}</button>
        ))}
      </div>

      <textarea value={essay} onChange={(e) => setEssay(e.target.value)} rows={5} style={{ ...s.input, width: '100%', resize: 'vertical' as const, minHeight: 80, lineHeight: 1.6, fontFamily: 'inherit', boxSizing: 'border-box' }} />
      <div style={{ fontSize: 9, color: s.text, marginTop: 2, textAlign: 'right' as const }}>{wordCount} words</div>

      <div style={{ marginTop: 6, fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 4 }}>REVIEW CHECKLIST ({checkedCount}/{PEER_CHECKLIST.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {PEER_CHECKLIST.map(item => {
          const checked = !!checks[item.key]
          return (
            <div key={item.key} style={{ padding: 6, borderRadius: 4, background: checked ? 'rgba(34,197,94,0.08)' : s.bg, border: '1px solid ' + (checked ? 'rgba(34,197,94,0.3)' : s.border) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <button onClick={() => setChecks({ ...checks, [item.key]: !checked })} style={{
                  width: 18, height: 18, borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer' as const,
                  background: checked ? 'rgba(34,197,94,0.2)' : 'transparent',
                  border: '1.5px solid ' + (checked ? '#34d399' : s.border),
                  color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                }}>{checked ? '✓' : ''}</button>
                <div style={{ fontSize: 11, fontWeight: 700, color: checked ? '#34d399' : s.bright }}>{item.label}</div>
              </div>
              <div style={{ fontSize: 9, color: s.text, marginBottom: 4, fontStyle: 'italic' }}>{item.description}</div>
              <input value={comments[item.key] || ''} onChange={(e) => setComments({ ...comments, [item.key]: e.target.value })} placeholder="Add a comment for the author..." style={{ ...s.input, width: '100%', boxSizing: 'border-box', fontSize: 10 }} />
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 6, padding: 8, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + s.border }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 4 }}>FEEDBACK SUMMARY</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10, lineHeight: 1.5 }}>
          {feedback.map((line, i) => (
            <div key={i} style={{ color: line.startsWith('✓') ? '#34d399' : '#f87171', fontWeight: 600 }}>{line}</div>
          ))}
        </div>
        {commentCount > 0 && (
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid ' + s.border, fontSize: 9, color: s.text }}>
            Comments added on: {PEER_CHECKLIST.filter(c => (comments[c.key] || '').trim()).map(c => c.label).join(', ')}
          </div>
        )}
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Preset — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{ESSAY_PRESETS[presetIdx].title}</b></div>
        <div>Step 2: Essay length — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{wordCount}</b> words</div>
        <div>Step 3: Checklist progress — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{checkedCount}</b> of <b style={{ color: isDark ? '#34d399' : '#059669' }}>{PEER_CHECKLIST.length}</b> criteria met</div>
        <div>Step 4: Each item: read → check yes/no → leave specific feedback</div>
        <div>Step 5: Feedback auto-generates — {checkedCount}/{PEER_CHECKLIST.length} ✓, {PEER_CHECKLIST.length - checkedCount} ✗</div>
        <div>Step 6: Specific comments help the writer revise — be kind and concrete</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Good peer review is specific and kind. Don't just say "good job" — point to what works and what to improve. Writers grow from concrete feedback, not vague praise.
      </div>
    </div>
  )
}

// ============================================================
// 17. ThesisStatementBuilder (9-12)
// ============================================================

export function ThesisStatementBuilder({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [topic, setTopic] = useState('school uniforms')
  const [position, setPosition] = useState<'for' | 'against' | 'neutral'>('for')
  const [counter, setCounter] = useState('uniforms limit self-expression')
  const [reasons, setReasons] = useState(['reduce bullying', 'save families money', 'create equality'])

  const positionLabel = position === 'for' ? `${topic} should be required` : position === 'against' ? `${topic} should not be required` : `${topic} has both benefits and drawbacks`
  const filledReasons = reasons.filter(r => r.trim())
  const reasonStr = filledReasons.length === 1 ? filledReasons[0] : filledReasons.length > 1 ? filledReasons.slice(0, -1).join(', ') + ', and ' + filledReasons[filledReasons.length - 1] : ''

  const thesis = useMemo(() => {
    if (!topic || filledReasons.length < 1) return ''
    return `Although ${counter || '[counterargument]'}, ${positionLabel} because ${reasonStr}.`
  }, [topic, counter, positionLabel, reasonStr, filledReasons.length])

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 9, color: s.text, marginBottom: 1, fontWeight: 600 }}>TOPIC</div>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. school uniforms" style={{ ...s.input, width: '100%', boxSizing: 'border-box' }} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: s.text, marginBottom: 1, fontWeight: 600 }}>POSITION</div>
          <div style={{ display: 'flex', gap: 3 }}>
            {(['for', 'against', 'neutral'] as const).map(p => (
              <button key={p} onClick={() => setPosition(p)} style={s.btn(position === p)}>{p}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: s.text, marginBottom: 1, fontWeight: 600 }}>COUNTERARGUMENT (opposing view)</div>
          <input value={counter} onChange={(e) => setCounter(e.target.value)} placeholder="e.g. uniforms limit self-expression" style={{ ...s.input, width: '100%', boxSizing: 'border-box' }} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: s.text, marginBottom: 1, fontWeight: 600 }}>3 REASONS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {reasons.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#fb923c', minWidth: 14 }}>{i + 1}.</span>
                <input value={r} onChange={(e) => setReasons(reasons.map((rr, idx) => idx === i ? e.target.value : rr))} placeholder={`Reason ${i + 1}`} style={{ ...s.input, flex: 1, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 8, borderRadius: 6, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.3)', marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#34d399', letterSpacing: 0.5, marginBottom: 4 }}>DRAFT THESIS</div>
        <div style={{ fontSize: 12, lineHeight: 1.7, color: s.bright }}>
          {thesis ? (
            <>
              <span style={{ color: '#f87171', fontWeight: 600 }}>Although {counter || '[counterargument]'}</span>, <span style={{ color: '#60a5fa', fontWeight: 600 }}>{positionLabel}</span> <span style={{ color: '#34d399', fontWeight: 600 }}>because {reasonStr}</span>.
            </>
          ) : (
            <span style={{ color: s.text, fontStyle: 'italic' }}>Fill in fields to build your thesis...</span>
          )}
        </div>
      </div>

      <div style={{ padding: 6, borderRadius: 4, background: s.bg, border: '1px solid ' + s.border, marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 4 }}>PARTS OF A STRONG THESIS</div>
        <div style={{ fontSize: 10, lineHeight: 1.7, color: s.bright }}>
          <div><span style={{ color: '#f87171', fontWeight: 700 }}>● Counterargument</span> — acknowledges the other side (builds credibility)</div>
          <div><span style={{ color: '#60a5fa', fontWeight: 700 }}>● Claim</span> — your position on the topic (clear and debatable)</div>
          <div><span style={{ color: '#34d399', fontWeight: 700 }}>● Reasoning</span> — 2-3 reasons why (a roadmap for your essay)</div>
        </div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Topic — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{topic || '—'}</b></div>
        <div>Step 2: Position — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{position}</b> ({positionLabel})</div>
        <div>Step 3: Counterargument — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{counter || '—'}</b></div>
        <div>Step 4: Reasons filled — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{filledReasons.length}</b>/3</div>
        <div>Step 5: Pattern: "Although [counter], [claim] because [reasons]"</div>
        <div>Step 6: Thesis length — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{thesis ? thesis.split(/\s+/).length : 0}</b> words (aim for 1-2 sentences)</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> A strong thesis is debatable, specific, and previewable. Acknowledging the counterargument shows you've considered multiple views — it builds trust with the reader before you argue.
      </div>
    </div>
  )
}

// ============================================================
// 18. CounterargumentBuilder (9-12)
// ============================================================

export function CounterargumentBuilder({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [mainArg, setMainArg] = useState('School uniforms should be required in all public schools.')
  const [opposite, setOpposite] = useState('uniforms suppress student individuality and self-expression')
  const [rebuttal, setRebuttal] = useState('students express individuality through art, music, and ideas — not just clothing')

  const counterStmt = useMemo(() => {
    if (!opposite || !rebuttal) return ''
    return `Some might argue that ${opposite}. However, ${rebuttal}.`
  }, [opposite, rebuttal])

  const strengths = useMemo(() => {
    return [
      { label: 'Main argument stated', ok: mainArg.trim().length > 0 },
      { label: 'Opposite view acknowledged', ok: opposite.trim().length > 0 },
      { label: 'Rebuttal provided', ok: rebuttal.trim().length > 0 },
      { label: 'Rebuttal addresses the opposite view', ok: opposite.trim().length > 0 && rebuttal.trim().length > 0 },
    ]
  }, [mainArg, opposite, rebuttal])

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 9, color: s.text, marginBottom: 1, fontWeight: 600 }}>YOUR MAIN ARGUMENT</div>
          <textarea value={mainArg} onChange={(e) => setMainArg(e.target.value)} rows={2} placeholder="State your thesis..." style={{ ...s.input, width: '100%', resize: 'vertical' as const, minHeight: 40, fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#f87171', marginBottom: 1, fontWeight: 600 }}>OPPOSITE VIEW (steelman the other side)</div>
          <textarea value={opposite} onChange={(e) => setOpposite(e.target.value)} rows={2} placeholder="What would the other side say?" style={{ ...s.input, width: '100%', resize: 'vertical' as const, minHeight: 40, fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#34d399', marginBottom: 1, fontWeight: 600 }}>YOUR REBUTTAL (why the opposite is incomplete or wrong)</div>
          <textarea value={rebuttal} onChange={(e) => setRebuttal(e.target.value)} rows={2} placeholder="How do you respond?" style={{ ...s.input, width: '100%', resize: 'vertical' as const, minHeight: 40, fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ padding: 8, borderRadius: 6, background: s.bg, border: '1px solid ' + s.border, marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 4 }}>COUNTERARGUMENT PARAGRAPH</div>
        <div style={{ fontSize: 12, lineHeight: 1.7, color: s.bright }}>
          {counterStmt ? (
            <>
              <span style={{ color: '#f87171', fontWeight: 600 }}>Some might argue that {opposite}</span>. <span style={{ color: '#34d399', fontWeight: 600 }}>However, {rebuttal}</span>.
            </>
          ) : (
            <span style={{ color: s.text, fontStyle: 'italic' }}>Fill in the opposite view and your rebuttal...</span>
          )}
        </div>
      </div>

      <div style={{ padding: 6, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + s.border, marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 4 }}>STRENGTH CHECK</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {strengths.map((c, i) => (
            <div key={i} style={{ fontSize: 10, color: c.ok ? '#34d399' : '#f87171', fontWeight: 600 }}>
              {c.ok ? '✓' : '✗'} {c.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 6, borderRadius: 4, background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#60a5fa', letterSpacing: 0.5, marginBottom: 4 }}>WHY ACKNOWLEDGE COUNTERARGUMENTS?</div>
        <div style={{ fontSize: 10, lineHeight: 1.7, color: s.bright }}>
          <div>● Builds <b>credibility</b> — you've considered other views</div>
          <div>● Creates <b>tension</b> — makes your argument feel necessary</div>
          <div>● Strengthens <b>rebuttal</b> — preempts objections</div>
          <div>● Shows <b>nuance</b> — real issues have multiple sides</div>
        </div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Main argument — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{mainArg ? mainArg.slice(0, 40) + (mainArg.length > 40 ? '…' : '') : '—'}</b></div>
        <div>Step 2: Opposite view — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{opposite || '—'}</b></div>
        <div>Step 3: Rebuttal — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{rebuttal || '—'}</b></div>
        <div>Step 4: Pattern: "Some might argue [opposite]. However, [rebuttal]."</div>
        <div>Step 5: Strength checks passed — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{strengths.filter(c => c.ok).length}</b>/{strengths.length}</div>
        <div>Step 6: Steelman = present the other side fairly, then rebut — never strawman</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Acknowledging counterarguments doesn't weaken your case — it strengthens it. A "steelmanned" counter (the best version of the other side) makes your rebuttal more credible. Readers trust writers who engage seriously with opposing views.
      </div>
    </div>
  )
}

// ============================================================
// 19. CloseReadingFramework (9-12)
// ============================================================

const CLOSE_READING_PRESETS = [
  {
    title: 'Fire and Ice',
    author: 'Robert Frost',
    text: 'Some say the world will end in fire,\nSome say in ice.\nFrom what I\'ve tasted of desire\nI hold with those who favor fire.\nBut if it had to perish twice,\nI think I know enough of hate\nTo say that for destruction ice\nIs also great\nAnd would suffice.'
  },
  {
    title: 'Dreams',
    author: 'Langston Hughes',
    text: 'Hold fast to dreams\nFor if dreams die\nLife is a broken-winged bird\nThat cannot fly.\n\nHold fast to dreams\nFor when dreams go\nLife is a barren field\nFrozen with snow.'
  },
  {
    title: 'I Have a Dream (excerpt)',
    author: 'Martin Luther King Jr.',
    text: 'I have a dream that one day this nation will rise up and live out the true meaning of its creed: "We hold these truths to be self-evident, that all men are created equal."'
  },
]

interface TpcasttStep {
  key: string
  letter: string
  name: string
  prompt: string
}

const TPCASTT_STEPS: TpcasttStep[] = [
  { key: 'title1', letter: 'T', name: 'Title', prompt: 'Predict: What does the title suggest before reading?' },
  { key: 'paraphrase', letter: 'P', name: 'Paraphrase', prompt: 'Restate the text in your own words' },
  { key: 'connotation', letter: 'C', name: 'Connotation', prompt: 'Word choice — what feelings do specific words carry?' },
  { key: 'attitude', letter: 'A', name: 'Attitude', prompt: 'Tone — what is the speaker\'s attitude?' },
  { key: 'shifts', letter: 'S', name: 'Shifts', prompt: 'Where do changes occur — in tone, subject, or speaker?' },
  { key: 'title2', letter: 'T', name: 'Title (Revisit)', prompt: 'Now re-read the title — does it mean something new?' },
  { key: 'theme', letter: 'T', name: 'Theme', prompt: 'What is the central message about life or human nature?' },
]

export function CloseReadingFramework({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [presetIdx, setPresetIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})

  const current = CLOSE_READING_PRESETS[presetIdx]
  const step = TPCASTT_STEPS[stepIdx]
  const filledCount = TPCASTT_STEPS.filter(st => (responses[st.key] || '').trim()).length

  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: 0.5, marginBottom: 3 }}>CHOOSE A TEXT</div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 6, flexWrap: 'wrap' }}>
        {CLOSE_READING_PRESETS.map((p, i) => (
          <button key={i} onClick={() => { setPresetIdx(i); setResponses({}); setStepIdx(0) }} style={s.btn(presetIdx === i)}>{p.title}</button>
        ))}
      </div>

      <div style={{ padding: 8, borderRadius: 6, background: s.bg, border: '1px solid ' + s.border, marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: s.bright, marginBottom: 2 }}>{current.title}</div>
        <div style={{ fontSize: 9, color: s.text, marginBottom: 4, fontStyle: 'italic' }}>by {current.author}</div>
        <div style={{ fontSize: 11, lineHeight: 1.7, color: s.bright, whiteSpace: 'pre-wrap' as const }}>{current.text}</div>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 6, flexWrap: 'wrap' }}>
        {TPCASTT_STEPS.map((st, i) => {
          const filled = !!(responses[st.key] || '').trim()
          return (
            <button key={i} onClick={() => setStepIdx(i)} style={{
              width: 32, height: 28, borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer' as const,
              background: i === stepIdx ? 'rgba(96,165,250,0.15)' : (filled ? 'rgba(34,197,94,0.12)' : s.bg),
              border: '1px solid ' + (i === stepIdx ? 'rgba(96,165,250,0.4)' : (filled ? 'rgba(34,197,94,0.3)' : s.border)),
              color: i === stepIdx ? '#60a5fa' : (filled ? '#34d399' : s.text),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{st.letter}{filled ? '✓' : ''}</button>
          )
        })}
      </div>

      <div style={{ padding: 8, borderRadius: 6, background: s.bg, border: '1px solid ' + s.border, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)', color: '#60a5fa', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{step.letter}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: s.bright }}>{step.name}</div>
        </div>
        <div style={{ fontSize: 10, color: s.text, marginBottom: 4, fontStyle: 'italic' }}>{step.prompt}</div>
        <textarea value={responses[step.key] || ''} onChange={(e) => setResponses({ ...responses, [step.key]: e.target.value })} rows={3} placeholder="Type your analysis here..." style={{ ...s.input, width: '100%', resize: 'vertical' as const, minHeight: 50, fontFamily: 'inherit', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <button onClick={() => setStepIdx(Math.max(0, stepIdx - 1))} disabled={stepIdx === 0} style={{ ...s.btn(false), opacity: stepIdx === 0 ? 0.4 : 1 }}>← Prev</button>
          <span style={{ fontSize: 10, color: s.text, fontWeight: 600 }}>{stepIdx + 1}/{TPCASTT_STEPS.length}</span>
          <button onClick={() => setStepIdx(Math.min(TPCASTT_STEPS.length - 1, stepIdx + 1))} disabled={stepIdx === TPCASTT_STEPS.length - 1} style={{ ...s.btn(false), opacity: stepIdx === TPCASTT_STEPS.length - 1 ? 0.4 : 1 }}>Next →</button>
        </div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Text — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{current.title}</b> by {current.author}</div>
        <div>Step 2: Current step — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{step.letter}: {step.name}</b> ({stepIdx + 1}/{TPCASTT_STEPS.length})</div>
        <div>Step 3: Steps completed — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{filledCount}</b>/{TPCASTT_STEPS.length}</div>
        <div>Step 4: T = Title (predict), P = Paraphrase (restate), C = Connotation (word choice)</div>
        <div>Step 5: A = Attitude (tone), S = Shifts (changes), T = Title again, T = Theme</div>
        <div>Step 6: Close reading moves from surface (literal) to depth (interpretive) — each step peels a layer</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Close reading slows down to see how meaning is made. TP-CASTT forces attention to language, structure, and shifting perspective. The title often means something different after reading — that's the point.
      </div>
    </div>
  )
}

// ============================================================
// 20. EssayOutlineBuilder (9-12)
// ============================================================

interface BodyPara {
  topic: string
  evidence: string
  analysis: string
  transition: string
}

export function EssayOutlineBuilder({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [thesis, setThesis] = useState('School uniforms should be required because they reduce bullying, save families money, and create equality.')
  const [hook, setHook] = useState('Imagine waking up every morning and never worrying about what to wear.')
  const [context, setContext] = useState('Across the country, schools debate whether uniforms improve the learning environment.')
  const [bodies, setBodies] = useState<BodyPara[]>([
    { topic: 'Uniforms reduce bullying by removing brand-based judgments', evidence: 'A 2018 study found bullying dropped 30% in uniform schools', analysis: 'When clothes are equal, students focus on character not labels', transition: 'Beyond reducing bullying, uniforms also help families financially' },
    { topic: 'Uniforms save families money on school clothes', evidence: 'Parents spend an average of $200 less per child per year', analysis: 'This frees up money for educational expenses like books and field trips', transition: 'Financial relief is just one part of the broader equality uniforms create' },
    { topic: 'Uniforms create visual equality among students', evidence: 'In uniform schools, teachers report fewer instances of class-based teasing', analysis: 'When everyone looks the same, socioeconomic differences become invisible', transition: 'These three benefits together make a strong case for uniforms' },
  ])
  const [conclusionThought, setConclusionThought] = useState('School uniforms build a fairer, more focused community where students can thrive.')
  const [showExport, setShowExport] = useState(false)

  const outlineText = useMemo(() => {
    const lines: string[] = []
    lines.push('I. INTRODUCTION')
    lines.push(`   A. Hook: ${hook}`)
    lines.push(`   B. Context: ${context}`)
    lines.push(`   C. Thesis: ${thesis}`)
    lines.push('')
    bodies.forEach((b, i) => {
      lines.push(`${['II', 'III', 'IV'][i]}. BODY PARAGRAPH ${i + 1}`)
      lines.push(`   A. Topic Sentence: ${b.topic}`)
      lines.push(`   B. Evidence: ${b.evidence}`)
      lines.push(`   C. Analysis: ${b.analysis}`)
      lines.push(`   D. Transition: ${b.transition}`)
      lines.push('')
    })
    lines.push('V. CONCLUSION')
    lines.push('   A. Restate Thesis (in new words)')
    lines.push(`   B. Synthesize: ${conclusionThought}`)
    lines.push('   C. Call to Action / Final Thought')
    return lines.join('\n')
  }, [thesis, hook, context, bodies, conclusionThought])

  const updateBody = (i: number, field: keyof BodyPara, val: string) => {
    setBodies(bodies.map((b, idx) => idx === i ? { ...b, [field]: val } : b))
  }

  const bodiesComplete = bodies.filter(b => b.topic.trim() && b.evidence.trim() && b.analysis.trim()).length
  const filledCount = (thesis.trim() ? 1 : 0) + (hook.trim() ? 1 : 0) + (context.trim() ? 1 : 0) + bodiesComplete + (conclusionThought.trim() ? 1 : 0)

  return (
    <div>
      <div style={{ padding: 6, borderRadius: 4, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: 4 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#60a5fa', letterSpacing: 0.5, marginBottom: 3 }}>INTRODUCTION</div>
        <input value={hook} onChange={(e) => setHook(e.target.value)} placeholder="Hook (grab attention)..." style={{ ...s.input, width: '100%', boxSizing: 'border-box', marginBottom: 2 }} />
        <input value={context} onChange={(e) => setContext(e.target.value)} placeholder="Context (background info)..." style={{ ...s.input, width: '100%', boxSizing: 'border-box', marginBottom: 2 }} />
        <textarea value={thesis} onChange={(e) => setThesis(e.target.value)} rows={2} placeholder="Thesis (main claim + reasons)..." style={{ ...s.input, width: '100%', resize: 'vertical' as const, minHeight: 30, fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>

      {bodies.map((b, i) => (
        <div key={i} style={{ padding: 6, borderRadius: 4, background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', marginBottom: 4 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#a855f7', letterSpacing: 0.5, marginBottom: 3 }}>BODY {i + 1}</div>
          <input value={b.topic} onChange={(e) => updateBody(i, 'topic', e.target.value)} placeholder="Topic sentence..." style={{ ...s.input, width: '100%', boxSizing: 'border-box', marginBottom: 2 }} />
          <input value={b.evidence} onChange={(e) => updateBody(i, 'evidence', e.target.value)} placeholder="Evidence (fact/quote)..." style={{ ...s.input, width: '100%', boxSizing: 'border-box', marginBottom: 2 }} />
          <input value={b.analysis} onChange={(e) => updateBody(i, 'analysis', e.target.value)} placeholder="Analysis (why it matters)..." style={{ ...s.input, width: '100%', boxSizing: 'border-box', marginBottom: 2 }} />
          <input value={b.transition} onChange={(e) => updateBody(i, 'transition', e.target.value)} placeholder="Transition to next paragraph..." style={{ ...s.input, width: '100%', boxSizing: 'border-box' }} />
        </div>
      ))}

      <div style={{ padding: 6, borderRadius: 4, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#34d399', letterSpacing: 0.5, marginBottom: 3 }}>CONCLUSION</div>
        <textarea value={conclusionThought} onChange={(e) => setConclusionThought(e.target.value)} rows={2} placeholder="Final thought (synthesize + call to action)..." style={{ ...s.input, width: '100%', resize: 'vertical' as const, minHeight: 30, fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>

      <button onClick={() => setShowExport(!showExport)} style={{ ...s.btn(true), width: '100%', padding: '5px', fontWeight: 600, marginBottom: 6 }}>
        {showExport ? '▾ Hide' : '▸ Show'} Full Outline
      </button>

      {showExport && (
        <div style={{ padding: 8, borderRadius: 4, background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)', border: '1px solid ' + s.border, marginBottom: 6, maxHeight: 200, overflow: 'auto' }}>
          <pre style={{ fontSize: 10, lineHeight: 1.5, color: s.bright, margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap' as const }}>{outlineText}</pre>
        </div>
      )}

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Intro — Hook: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{hook ? '✓' : '✗'}</b>, Context: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{context ? '✓' : '✗'}</b>, Thesis: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{thesis ? '✓' : '✗'}</b></div>
        <div>Step 2: Body paragraphs — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{bodies.length}</b> total, fully filled: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{bodiesComplete}</b></div>
        <div>Step 3: Each body = Topic Sentence → Evidence → Analysis → Transition</div>
        <div>Step 4: Conclusion — Restate thesis → Synthesize main points → Call to action</div>
        <div>Step 5: Outline sections filled — <b style={{ color: isDark ? '#34d399' : '#059669' }}>{filledCount}</b>/6 main sections</div>
        <div>Step 6: {showExport ? 'Full outline shown above — copy into a doc to draft' : 'Toggle "Show Full Outline" to see/export the assembled outline'}</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> A 5-paragraph essay is a scaffold, not a formula. Intro sets up, bodies prove with evidence, conclusion synthesizes. The structure makes thinking visible — each part has a job.
      </div>
    </div>
  )
}
