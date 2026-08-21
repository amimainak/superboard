'use client'

import React, { useMemo, useCallback } from 'react'

// ============================================================
// Types
// ============================================================

export interface ProofreadingExercise {
  id: string
  title: string
  passage: string
  errors: {
    start: number
    end: number
    original: string
    correction: string
    type: string
    explanation: string
  }[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface ProofreadingConfig {
  mode: 'student' | 'teacher'
  exerciseIdx: number
  checked: boolean
  score: number
  totalAttempted: number
  clickedSpans: number[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export const DEFAULT_PROOFREADING_CONFIG: ProofreadingConfig = {
  mode: 'student',
  exerciseIdx: 0,
  checked: false,
  score: 0,
  totalAttempted: 0,
  clickedSpans: [],
  difficulty: 'beginner',
}

// ============================================================
// Exercises (indices verified against passage strings)
// ============================================================

const EXERCISES: ProofreadingExercise[] = [
  {
    id: 'p1',
    title: 'A Day at the Beach',
    difficulty: 'beginner',
    passage: 'Their going to the beech tommorow. The wether will be sunny. We will were our new swimsuits and bild sand castels.',
    errors: [
      { start: 0, end: 5, original: 'Their', correction: 'There', type: 'Spelling', explanation: "'Their' is possessive. 'There' refers to a place." },
      { start: 19, end: 24, original: 'beech', correction: 'beach', type: 'Spelling', explanation: "'Beech' is a type of tree. 'Beach' is sandy shore." },
      { start: 25, end: 33, original: 'tommorow', correction: 'tomorrow', type: 'Spelling', explanation: "Double 'r' in tomorrow." },
      { start: 39, end: 45, original: 'wether', correction: 'weather', type: 'Spelling', explanation: "'Weather' refers to climate conditions." },
      { start: 69, end: 73, original: 'were', correction: 'wear', type: 'Spelling', explanation: "'Were' is past tense of 'be'. 'Wear' means to put on." },
      { start: 96, end: 100, original: 'bild', correction: 'build', type: 'Spelling', explanation: "'Build' has a 'u' before the 'i'." },
      { start: 106, end: 113, original: 'castels', correction: 'castles', type: 'Spelling', explanation: "'Castles' has a 't' after 's'." },
    ],
  },
  {
    id: 'p2',
    title: 'My Favorite Pet',
    difficulty: 'beginner',
    passage: 'My dog max is very playfull. He loves to chace balls in the feild. Every moring he wakes me up by lickking my face.',
    errors: [
      { start: 7, end: 10, original: 'max', correction: 'Max', type: 'Capitalization', explanation: 'Names should be capitalized.' },
      { start: 19, end: 27, original: 'playfull', correction: 'playful', type: 'Spelling', explanation: "Only one 'l' in playful." },
      { start: 41, end: 46, original: 'chace', correction: 'chase', type: 'Spelling', explanation: "'Chase' is spelled with an 's'." },
      { start: 60, end: 65, original: 'feild', correction: 'field', type: 'Spelling', explanation: "'Field' is spelled i-before-e here." },
      { start: 73, end: 79, original: 'moring', correction: 'morning', type: 'Spelling', explanation: "'Morning' needs the 'n'." },
      { start: 98, end: 106, original: 'lickking', correction: 'licking', type: 'Spelling', explanation: "Only one 'k' in licking." },
    ],
  },
  {
    id: 'p3',
    title: 'School Lunch',
    difficulty: 'beginner',
    passage: 'I realy enjoy eating lunch with my freinds. We usally sit outside when its warm. My favrite food is pizza with cheeze.',
    errors: [
      { start: 2, end: 7, original: 'realy', correction: 'really', type: 'Spelling', explanation: "Double 'l' in really." },
      { start: 35, end: 42, original: 'freinds', correction: 'friends', type: 'Spelling', explanation: "'Friends' is spelled with 'ie' not 'ei'." },
      { start: 47, end: 53, original: 'usally', correction: 'usually', type: 'Spelling', explanation: "'Usually' has two 'l's and a 'u'." },
      { start: 71, end: 74, original: 'its', correction: "it's", type: 'Grammar', explanation: "'It's' with apostrophe means 'it is'." },
      { start: 84, end: 91, original: 'favrite', correction: 'favorite', type: 'Spelling', explanation: "'Favorite' has an 'o' after the 'v'." },
      { start: 111, end: 117, original: 'cheeze', correction: 'cheese', type: 'Spelling', explanation: "'Cheese' has two 'e's before 's'." },
    ],
  },
  {
    id: 'p4',
    title: 'The Science Fair',
    difficulty: 'intermediate',
    passage: 'Me and my partner worked hard on are project. We decided to build a volcano that errupts. The judge was very impressed by are presentation.',
    errors: [
      { start: 0, end: 2, original: 'Me', correction: 'My partner and I', type: 'Grammar', explanation: "'My partner and I' is the correct subject form." },
      { start: 33, end: 36, original: 'are', correction: 'our', type: 'Grammar', explanation: "'Are' is a verb. 'Our' is possessive." },
      { start: 81, end: 88, original: 'errupts', correction: 'erupts', type: 'Spelling', explanation: "'Erupts' has only one 'r'." },
      { start: 122, end: 125, original: 'are', correction: 'our', type: 'Grammar', explanation: "'Our' is possessive. 'Are' is a verb." },
    ],
  },
  {
    id: 'p5',
    title: 'The Library',
    difficulty: 'intermediate',
    passage: 'The librarian helped my friend and I find a book. She told us that the book were very popular. We took it to are house.',
    errors: [
      { start: 35, end: 36, original: 'I', correction: 'me', type: 'Grammar', explanation: "After a preposition, use the object form 'me'." },
      { start: 76, end: 80, original: 'were', correction: 'was', type: 'Grammar', explanation: "'Book' is singular, so use 'was'." },
      { start: 109, end: 112, original: 'are', correction: 'our', type: 'Grammar', explanation: "'Our' shows possession. 'Are' is a verb." },
    ],
  },
  {
    id: 'p6',
    title: 'Summer Vacation',
    difficulty: 'intermediate',
    passage: 'Last summer me and my family went to the mountians. We hiked up a steep trail wich was very challenging.',
    errors: [
      { start: 12, end: 14, original: 'me', correction: 'My family and I', type: 'Grammar', explanation: "Use subject pronoun 'I' not object 'me'." },
      { start: 41, end: 50, original: 'mountians', correction: 'mountains', type: 'Spelling', explanation: "'Mountains' has an 'ai' before 'ns'." },
      { start: 78, end: 82, original: 'wich', correction: 'which', type: 'Spelling', explanation: "'Which' has an 'h' after 'w'." },
    ],
  },
  {
    id: 'p7',
    title: 'The History Report',
    difficulty: 'advanced',
    passage: 'The students report on ancient egypt was well-researched, however it lacked a proper conclusion. They failed to explain there significance.',
    errors: [
      { start: 4, end: 12, original: 'students', correction: "student's", type: 'Grammar', explanation: 'Need apostrophe for possessive.' },
      { start: 31, end: 36, original: 'egypt', correction: 'Egypt', type: 'Capitalization', explanation: 'Country names must be capitalized.' },
      { start: 58, end: 65, original: 'however', correction: 'however;', type: 'Punctuation', explanation: "Use a semicolon before 'however' joining two independent clauses." },
      { start: 120, end: 125, original: 'there', correction: 'their', type: 'Grammar', explanation: "'Their' is possessive. 'There' refers to place." },
    ],
  },
  {
    id: 'p8',
    title: 'The Job Interview',
    difficulty: 'advanced',
    passage: "She arrived early for her interview, but she was'nt prepared for the difficult questions. The manager asked about her experiance.",
    errors: [
      { start: 45, end: 51, original: "was'nt", correction: "wasn't", type: 'Grammar', explanation: "The apostrophe goes after the 'n', not before." },
      { start: 118, end: 128, original: 'experiance', correction: 'experience', type: 'Spelling', explanation: "'Experience' is spelled with 'ie' not 'ia'." },
    ],
  },
  {
    id: 'p9',
    title: 'The Birthday Party',
    difficulty: 'beginner',
    passage: 'It was my BirthDay party. I invitted all my freinds. We had cake and ice creme. Every one had a grate time.',
    errors: [
      { start: 10, end: 18, original: 'BirthDay', correction: 'birthday', type: 'Capitalization', explanation: 'Only the first letter should be capitalized.' },
      { start: 28, end: 36, original: 'invitted', correction: 'invited', type: 'Spelling', explanation: "Only one 't' in invited." },
      { start: 44, end: 51, original: 'freinds', correction: 'friends', type: 'Spelling', explanation: "'Friends' has 'ie' not 'ei'." },
      { start: 73, end: 78, original: 'creme', correction: 'cream', type: 'Spelling', explanation: "'Cream' is spelled with 'ea'." },
      { start: 80, end: 89, original: 'Every one', correction: 'Everyone', type: 'Spelling', explanation: "'Everyone' is one word." },
      { start: 96, end: 101, original: 'grate', correction: 'great', type: 'Spelling', explanation: "'Great' means wonderful. 'Grate' is a metal grid." },
    ],
  },
  {
    id: 'p10',
    title: 'The Soccer Game',
    difficulty: 'intermediate',
    passage: 'Our team played aginst the champions yesterday. We tryed are best but lost the game. The refree made some bad calls.',
    errors: [
      { start: 16, end: 22, original: 'aginst', correction: 'against', type: 'Spelling', explanation: "'Against' has an 'a' after 'g'." },
      { start: 51, end: 56, original: 'tryed', correction: 'tried', type: 'Spelling', explanation: "Change 'y' to 'i' before adding 'ed'." },
      { start: 57, end: 60, original: 'are', correction: 'our', type: 'Grammar', explanation: "'Our' is possessive. 'Are' is a verb." },
      { start: 89, end: 95, original: 'refree', correction: 'referee', type: 'Spelling', explanation: "'Referee' has two 'e's in the middle." },
    ],
  },
  {
    id: 'p11',
    title: 'The Essay',
    difficulty: 'advanced',
    passage: 'The principle announced that their would be a assembly on friday. Students were told too bring there permission slips.',
    errors: [
      { start: 4, end: 13, original: 'principle', correction: 'principal', type: 'Grammar', explanation: "'Principal' is the school leader. 'Principle' means a rule." },
      { start: 29, end: 34, original: 'their', correction: 'there', type: 'Grammar', explanation: "'There' indicates place/existence. 'Their' is possessive." },
      { start: 44, end: 45, original: 'a', correction: 'an', type: 'Grammar', explanation: "Use 'an' before words starting with a vowel sound." },
      { start: 58, end: 64, original: 'friday', correction: 'Friday', type: 'Capitalization', explanation: 'Days of the week must be capitalized.' },
      { start: 85, end: 88, original: 'too', correction: 'to', type: 'Grammar', explanation: "'To' is the infinitive marker. 'Too' means also." },
      { start: 95, end: 100, original: 'there', correction: 'their', type: 'Grammar', explanation: "'Their' shows possession. 'There' refers to place." },
    ],
  },
  {
    id: 'p12',
    title: 'The News Article',
    difficulty: 'advanced',
    passage: 'The journalist writed an article about globel warming. She interviewed severel scientist who studies climate change. There findings will be published in a famus journal.',
    errors: [
      { start: 15, end: 21, original: 'writed', correction: 'wrote', type: 'Grammar', explanation: "'Write' is an irregular verb. Past tense is 'wrote'." },
      { start: 39, end: 45, original: 'globel', correction: 'global', type: 'Spelling', explanation: "'Global' has 'al' not 'el'." },
      { start: 71, end: 78, original: 'severel', correction: 'several', type: 'Spelling', explanation: "'Several' has 'al' not 'el'." },
      { start: 79, end: 88, original: 'scientist', correction: 'scientists', type: 'Grammar', explanation: "Should be plural to match 'several'." },
      { start: 93, end: 100, original: 'studies', correction: 'study', type: 'Grammar', explanation: "Subject-verb agreement: 'who study' not 'who studies'." },
      { start: 117, end: 122, original: 'There', correction: 'Their', type: 'Grammar', explanation: "'Their' shows possession. 'There' refers to place." },
      { start: 155, end: 160, original: 'famus', correction: 'famous', type: 'Spelling', explanation: "'Famous' has 'ou' not 'u'." },
    ],
  },
]

// ============================================================
// Style helper
// ============================================================

const sh = (isDark: boolean) => ({
  bg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
  border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
  text: isDark ? '#94a3b8' : '#64748b',
  bright: isDark ? '#e2e8f0' : '#1e293b',
  input: {
    padding: '4px 8px',
    borderRadius: 5,
    fontSize: 11,
    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'),
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    color: isDark ? '#e2e8f0' : '#1e293b',
    outline: 'none' as const,
  },
  btn: (active: boolean) => ({
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 10,
    cursor: 'pointer' as const,
    background: active
      ? 'rgba(5,150,105,0.15)'
      : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
    border: active
      ? '1px solid rgba(5,150,105,0.4)'
      : '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
    color: active ? '#34d399' : (isDark ? '#94a3b8' : '#64748b'),
  }),
  btnPrimary: {
    padding: '4px 12px',
    borderRadius: 5,
    fontSize: 10,
    fontWeight: 600 as const,
    cursor: 'pointer' as const,
    background: 'rgba(5,150,105,0.15)',
    border: '1px solid rgba(5,150,105,0.4)',
    color: '#34d399',
  },
})

// ============================================================
// Component
// ============================================================

interface ProofreadingProps {
  isDark: boolean
  config: ProofreadingConfig
  onConfigChange: (patch: Partial<ProofreadingConfig>) => void
  compact?: boolean
}

export function ProofreadingWidget({ isDark, config, onConfigChange, compact }: ProofreadingProps) {
  const s = sh(isDark)

  // Filter exercises by difficulty
  const filteredExercises = useMemo(() => {
    return EXERCISES.filter(function (e) {
      return e.difficulty === config.difficulty
    })
  }, [config.difficulty])

  const currentExercise = filteredExercises[config.exerciseIdx] || null

  // Build segments for rendering the passage
  const segments = useMemo(() => {
    if (!currentExercise) return []
    const passage = currentExercise.passage
    const errors = currentExercise.errors
    const result: { text: string; errorIdx: number | null; start: number; end: number }[] = []
    let pos = 0
    for (let i = 0; i < errors.length; i++) {
      const err = errors[i]
      if (err.start > pos) {
        result.push({ text: passage.substring(pos, err.start), errorIdx: null, start: pos, end: err.start })
      }
      result.push({ text: passage.substring(err.start, err.end), errorIdx: i, start: err.start, end: err.end })
      pos = err.end
    }
    if (pos < passage.length) {
      result.push({ text: passage.substring(pos), errorIdx: null, start: pos, end: passage.length })
    }
    return result
  }, [currentExercise])

  // Navigation
  const hasPrev = config.exerciseIdx > 0
  const hasNext = config.exerciseIdx < filteredExercises.length - 1

  const goPrev = useCallback(function () {
    if (hasPrev) {
      onConfigChange({ exerciseIdx: config.exerciseIdx - 1, checked: false, score: 0, totalAttempted: 0, clickedSpans: [] })
    }
  }, [hasPrev, config.exerciseIdx, onConfigChange])

  const goNext = useCallback(function () {
    if (hasNext) {
      onConfigChange({ exerciseIdx: config.exerciseIdx + 1, checked: false, score: 0, totalAttempted: 0, clickedSpans: [] })
    }
  }, [hasNext, config.exerciseIdx, onConfigChange])

  const shuffle = useCallback(function () {
    if (filteredExercises.length <= 1) return
    let newIdx = config.exerciseIdx
    while (newIdx === config.exerciseIdx) {
      newIdx = Math.floor(Math.random() * filteredExercises.length)
    }
    onConfigChange({ exerciseIdx: newIdx, checked: false, score: 0, totalAttempted: 0, clickedSpans: [] })
  }, [config.exerciseIdx, filteredExercises.length, onConfigChange])

  // Student: toggle click on error span
  const toggleError = useCallback(function (errorIdx: number) {
    if (config.checked) return
    const existing = config.clickedSpans.indexOf(errorIdx)
    const newClicked: number[] = existing >= 0
      ? config.clickedSpans.filter(function (_, i) { return i !== existing })
      : config.clickedSpans.concat([errorIdx])
    onConfigChange({ clickedSpans: newClicked })
  }, [config.checked, config.clickedSpans, onConfigChange])

  // Check answers
  const checkAnswers = useCallback(function () {
    if (!currentExercise || config.checked) return
    let correct = 0
    const attempted = config.clickedSpans.length
    for (let i = 0; i < config.clickedSpans.length; i++) {
      const ci = config.clickedSpans[i]
      if (ci >= 0 && ci < currentExercise.errors.length) {
        correct++
      }
    }
    const scoreVal = currentExercise.errors.length > 0 ? Math.round((correct / currentExercise.errors.length) * 100) : 0
    onConfigChange({ checked: true, score: scoreVal, totalAttempted: attempted })
  }, [currentExercise, config.checked, config.clickedSpans, onConfigChange])

  // Reset
  const resetExercise = useCallback(function () {
    onConfigChange({ checked: false, score: 0, totalAttempted: 0, clickedSpans: [] })
  }, [onConfigChange])

  // Get span style for error segments
  function getErrorSpanStyle(errorIdx: number): React.CSSProperties {
    const isClicked = config.clickedSpans.indexOf(errorIdx) >= 0
    if (config.checked) {
      if (isClicked) {
        return {
          backgroundColor: 'rgba(34,197,94,0.25)',
          borderBottom: '2px solid #22c55e',
          borderRadius: 2,
          padding: '0 1px',
          cursor: 'default' as const,
          fontWeight: 600 as const,
          color: '#22c55e',
        }
      }
      return {
        backgroundColor: 'rgba(251,146,60,0.2)',
        borderBottom: '2px dashed #fb923c',
        borderRadius: 2,
        padding: '0 1px',
        cursor: 'default' as const,
        color: isDark ? '#fdba74' : '#ea580c',
      }
    }
    if (isClicked) {
      return {
        backgroundColor: 'rgba(250,204,21,0.2)',
        borderBottom: '2px solid #facc15',
        borderRadius: 2,
        padding: '0 1px',
        cursor: 'pointer' as const,
      }
    }
    return {
      borderBottom: '1px solid transparent',
      cursor: 'pointer' as const,
      padding: '0 1px',
      borderRadius: 2,
      transition: 'background-color 0.15s',
    }
  }

  // Counters
  const totalErrors = currentExercise ? currentExercise.errors.length : 0
  const foundCount = config.clickedSpans.length

  // Container style
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 12,
    color: s.bright,
    background: isDark ? '#0f172a' : '#ffffff',
    overflow: 'hidden',
  }

  // ---- Teacher mode ----
  if (config.mode === 'teacher') {
    return (
      <div style={containerStyle}>
        {/* Header */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid ' + s.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: s.bright }}>✏️ Proofreading</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['beginner', 'intermediate', 'advanced'] as const).map(function (d) {
              return (
                <button
                  key={d}
                  style={s.btn(config.difficulty === d)}
                  onClick={function () { onConfigChange({ difficulty: d }) }}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Teacher info */}
        <div style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: s.text, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Teacher Mode</div>
            <div style={{ fontSize: 11, color: s.text, lineHeight: 1.5 }}>
              Students will see the passage with clickable error spans. They click on words they think contain errors, then press Check.
            </div>
          </div>

          <div style={{ marginBottom: 8, fontSize: 10, fontWeight: 600, color: s.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Exercises ({filteredExercises.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
            {filteredExercises.map(function (ex, idx) {
              return (
                <div
                  key={ex.id}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 5,
                    background: idx === config.exerciseIdx ? 'rgba(5,150,105,0.1)' : s.bg,
                    border: idx === config.exerciseIdx ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + s.border,
                    fontSize: 11,
                    color: s.bright,
                    cursor: 'pointer' as const,
                  }}
                  onClick={function () { onConfigChange({ exerciseIdx: idx }) }}
                >
                  <div style={{ fontWeight: 600 }}>{ex.title}</div>
                  <div style={{ fontSize: 10, color: s.text, marginTop: 2 }}>{ex.errors.length} errors &middot; {ex.difficulty}</div>
                </div>
              )
            })}
          </div>

          {currentExercise && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: s.text, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Passage Text</div>
              <textarea
                value={currentExercise.passage}
                readOnly
                rows={4}
                style={{
                  ...s.input,
                  width: '100%',
                  fontSize: 11,
                  lineHeight: 1.5,
                  resize: 'none' as const,
                }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // ---- Student mode ----
  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid ' + s.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: s.bright }}>📝 Proofreading</span>
          {currentExercise && (
            <span style={{ fontSize: 10, color: s.text, background: s.bg, padding: '1px 6px', borderRadius: 8 }}>
              {currentExercise.title}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['beginner', 'intermediate', 'advanced'] as const).map(function (d) {
            return (
              <button
                key={d}
                style={s.btn(config.difficulty === d)}
                onClick={function () {
                  onConfigChange({ difficulty: d, exerciseIdx: 0, checked: false, score: 0, totalAttempted: 0, clickedSpans: [] })
                }}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation bar */}
      <div style={{ padding: '6px 12px', borderBottom: '1px solid ' + s.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            style={{
              ...s.btn(false),
              opacity: hasPrev ? 1 : 0.4,
              cursor: hasPrev ? ('pointer' as const) : ('default' as const),
            }}
            onClick={goPrev}
            disabled={!hasPrev}
          >
            &#8592; Prev
          </button>
          <span style={{ fontSize: 10, color: s.text }}>
            {filteredExercises.length > 0 ? (config.exerciseIdx + 1) + ' / ' + filteredExercises.length : '0 / 0'}
          </span>
          <button
            style={{
              ...s.btn(false),
              opacity: hasNext ? 1 : 0.4,
              cursor: hasNext ? ('pointer' as const) : ('default' as const),
            }}
            onClick={goNext}
            disabled={!hasNext}
          >
            Next &#8594;
          </button>
        </div>
        <button style={s.btn(false)} onClick={shuffle}>
          &#128256; Shuffle
        </button>
      </div>

      {/* Status bar */}
      <div style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: s.text }}>
          Click on words with errors: <span style={{ color: foundCount > 0 ? '#facc15' : s.text, fontWeight: 600 }}>{foundCount}</span> / {totalErrors}
        </div>
        {config.checked && (
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: config.score >= 80 ? '#22c55e' : config.score >= 50 ? '#facc15' : '#ef4444',
          }}>
            Score: {config.score}%
          </div>
        )}
      </div>

      {/* Passage area */}
      <div style={{ flex: 1, padding: '8px 12px', overflowY: 'auto', minHeight: 0 }}>
        {currentExercise ? (
          <div>
            <div style={{
              fontSize: 12,
              lineHeight: 1.8,
              color: s.bright,
              padding: '10px 12px',
              background: s.bg,
              borderRadius: 6,
              border: '1px solid ' + s.border,
              marginBottom: 10,
            }}>
              {segments.map(function (seg, i) {
                if (seg.errorIdx === null) {
                  return <span key={i}>{seg.text}</span>
                }
                return (
                  <span
                    key={i}
                    style={getErrorSpanStyle(seg.errorIdx)}
                    onClick={function () { toggleError(seg.errorIdx!) }}
                    title={config.checked ? currentExercise.errors[seg.errorIdx].original + ' → ' + currentExercise.errors[seg.errorIdx].correction : undefined}
                  >
                    {seg.text}
                  </span>
                )
              })}
            </div>

            {/* Check / Reset button */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
              {!config.checked ? (
                <button style={s.btnPrimary} onClick={checkAnswers}>
                  &#10003; Check Answers
                </button>
              ) : (
                <button style={s.btn(false)} onClick={resetExercise}>
                  &#8634; Try Again
                </button>
              )}
            </div>

            {/* Error details after checking */}
            {config.checked && currentExercise.errors.length > 0 && (
              <div style={{
                maxHeight: 200,
                overflowY: 'auto',
                borderRadius: 6,
                border: '1px solid ' + s.border,
              }}>
                <div style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: s.text,
                  padding: '6px 8px',
                  borderBottom: '1px solid ' + s.border,
                  background: s.bg,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  position: 'sticky' as const,
                  top: 0,
                }}>
                  Error Details
                </div>
                {currentExercise.errors.map(function (err, idx) {
                  const isClicked = config.clickedSpans.indexOf(idx) >= 0
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '6px 8px',
                        borderBottom: idx < currentExercise.errors.length - 1 ? '1px solid ' + s.border : 'none',
                        borderLeft: '3px solid ' + (isClicked ? '#22c55e' : '#fb923c'),
                        background: isClicked ? 'rgba(34,197,94,0.04)' : 'rgba(251,146,60,0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{
                          fontSize: 9,
                          fontWeight: 600,
                          padding: '1px 4px',
                          borderRadius: 3,
                          background: err.type === 'Spelling' ? 'rgba(239,68,68,0.15)' : err.type === 'Grammar' ? 'rgba(59,130,246,0.15)' : err.type === 'Capitalization' ? 'rgba(168,85,247,0.15)' : 'rgba(251,146,60,0.15)',
                          color: err.type === 'Spelling' ? '#f87171' : err.type === 'Grammar' ? '#60a5fa' : err.type === 'Capitalization' ? '#c084fc' : '#fb923c',
                        }}>
                          {err.type}
                        </span>
                        <span style={{
                          fontSize: 11,
                          color: isClicked ? '#22c55e' : '#fb923c',
                          fontWeight: 600,
                        }}>
                          {isClicked ? '✓ Found' : '✗ Missed'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: s.bright, lineHeight: 1.4 }}>
                        <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{err.original}</span>
                        {' → '}
                        <span style={{ fontWeight: 600 }}>{err.correction}</span>
                      </div>
                      <div style={{ fontSize: 10, color: s.text, marginTop: 2, lineHeight: 1.3 }}>{err.explanation}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: s.text, fontSize: 12 }}>
            No exercises for this difficulty level.
          </div>
        )}
      </div>
    </div>
  )
}
