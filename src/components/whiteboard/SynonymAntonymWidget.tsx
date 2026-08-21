'use client'

import React, { useState, useMemo, useCallback } from 'react'

// ============================================================
// Types
// ============================================================

export interface SynAntExercise {
  id: string
  word: string
  type: 'synonym' | 'antonym'
  question: string
  options: [string, string, string, string]
  correctIndex: number
  explanation: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface SynonymAntonymConfig {
  mode: 'student' | 'teacher'
  exerciseIdx: number
  selected: number | null
  checked: boolean
  score: number
  totalAttempted: number
  practiceType: 'synonym' | 'antonym' | 'both'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  teacherWord: string
  teacherOptions: [string, string, string, string]
  teacherCorrect: number
  teacherType: 'synonym' | 'antonym'
  teacherExplanation: string
  customExercises: SynAntExercise[]
}

// ============================================================
// Style Helper
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
// Embedded Exercises (35 total)
// ============================================================

const DEFAULT_EXERCISES: SynAntExercise[] = [
  // === BEGINNER SYNONYMS ===
  {
    id: 'syn-01',
    word: 'happy',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'happy'?",
    options: ['angry', 'glad', 'tired', 'quiet'],
    correctIndex: 1,
    explanation: "'Glad' means feeling pleasure or satisfaction, which is very similar in meaning to 'happy'. Both words describe a positive emotional state.",
    difficulty: 'beginner',
  },
  {
    id: 'syn-02',
    word: 'sad',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'sad'?",
    options: ['excited', 'bored', 'unhappy', 'hungry'],
    correctIndex: 2,
    explanation: "'Unhappy' means not happy or experiencing sorrow, which is essentially the same meaning as 'sad'.",
    difficulty: 'beginner',
  },
  {
    id: 'syn-03',
    word: 'big',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'big'?",
    options: ['tiny', 'narrow', 'large', 'short'],
    correctIndex: 2,
    explanation: "'Large' means of considerable or relatively great size, extent, or capacity, making it a direct synonym of 'big'.",
    difficulty: 'beginner',
  },
  {
    id: 'syn-04',
    word: 'small',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'small'?",
    options: ['huge', 'wide', 'tall', 'tiny'],
    correctIndex: 3,
    explanation: "'Tiny' means very small in size, making it a synonym of 'small'. Both words describe something of limited size.",
    difficulty: 'beginner',
  },
  {
    id: 'syn-05',
    word: 'fast',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'fast'?",
    options: ['quick', 'slow', 'heavy', 'lazy'],
    correctIndex: 0,
    explanation: "'Quick' means moving with speed or capable of moving with speed, which is the same as 'fast'.",
    difficulty: 'beginner',
  },
  {
    id: 'syn-06',
    word: 'beautiful',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'beautiful'?",
    options: ['ugly', 'plain', 'pretty', 'dull'],
    correctIndex: 2,
    explanation: "'Pretty' means pleasing to the senses or mind aesthetically, similar to 'beautiful'. Both describe attractiveness.",
    difficulty: 'beginner',
  },
  {
    id: 'syn-07',
    word: 'new',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'new'?",
    options: ['old', 'broken', 'fresh', 'used'],
    correctIndex: 2,
    explanation: "'Fresh' means recently made, obtained, or arrived, which is very close in meaning to 'new'.",
    difficulty: 'beginner',
  },

  // === INTERMEDIATE SYNONYMS ===
  {
    id: 'syn-08',
    word: 'slow',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'slow'?",
    options: ['rapid', 'bright', 'sluggish', 'sharp'],
    correctIndex: 2,
    explanation: "'Sluggish' means lacking energy or alertness, or moving slowly. It is a stronger, more descriptive synonym of 'slow'.",
    difficulty: 'intermediate',
  },
  {
    id: 'syn-09',
    word: 'smart',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'smart'?",
    options: ['foolish', 'clumsy', 'shy', 'intelligent'],
    correctIndex: 3,
    explanation: "'Intelligent' means having the ability to acquire and apply knowledge and skills, a formal synonym of 'smart'.",
    difficulty: 'intermediate',
  },
  {
    id: 'syn-10',
    word: 'angry',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'angry'?",
    options: ['calm', 'furious', 'joyful', 'gentle'],
    correctIndex: 1,
    explanation: "'Furious' means extremely angry or full of anger. It is an intensified synonym of 'angry'.",
    difficulty: 'intermediate',
  },
  {
    id: 'syn-11',
    word: 'scared',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'scared'?",
    options: ['terrified', 'brave', 'curious', 'relaxed'],
    correctIndex: 0,
    explanation: "'Terrified' means very afraid or frightened. It is a stronger synonym of 'scared'.",
    difficulty: 'intermediate',
  },
  {
    id: 'syn-12',
    word: 'kind',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'kind'?",
    options: ['rude', 'generous', 'harsh', 'selfish'],
    correctIndex: 1,
    explanation: "'Generous' means showing a readiness to give more of something than is expected. It shares the caring quality of 'kind'.",
    difficulty: 'intermediate',
  },
  {
    id: 'syn-13',
    word: 'brave',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'brave'?",
    options: ['timid', 'lazy', 'courageous', 'careless'],
    correctIndex: 2,
    explanation: "'Courageous' means showing bravery or determination. It is a formal synonym of 'brave'.",
    difficulty: 'intermediate',
  },
  {
    id: 'syn-14',
    word: 'old',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'old'?",
    options: ['modern', 'ancient', 'fresh', 'young'],
    correctIndex: 1,
    explanation: "'Ancient' means belonging to the very distant past. It is an extreme synonym of 'old' that implies great age.",
    difficulty: 'intermediate',
  },
  {
    id: 'syn-15',
    word: 'rich',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'rich'?",
    options: ['poor', 'cheap', 'simple', 'wealthy'],
    correctIndex: 3,
    explanation: "'Wealthy' means having a great deal of money, assets, or resources. It is a direct synonym of 'rich'.",
    difficulty: 'intermediate',
  },
  {
    id: 'syn-16',
    word: 'calm',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'calm'?",
    options: ['wild', 'noisy', 'peaceful', 'angry'],
    correctIndex: 2,
    explanation: "'Peaceful' means free from disturbance. It is a synonym of 'calm' as both describe a state of tranquility.",
    difficulty: 'intermediate',
  },

  // === ADVANCED SYNONYMS ===
  {
    id: 'syn-17',
    word: 'poor',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'poor'?",
    options: ['wealthy', 'destitute', 'average', 'comfortable'],
    correctIndex: 1,
    explanation: "'Destitute' means extremely poor and lacking the basic necessities of life, making it an intensified synonym of 'poor'.",
    difficulty: 'advanced',
  },
  {
    id: 'syn-18',
    word: 'eager',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'eager'?",
    options: ['reluctant', 'enthusiastic', 'bored', 'lazy'],
    correctIndex: 1,
    explanation: "'Enthusiastic' means having or showing intense and eager enjoyment, interest, or approval. It is a strong synonym of 'eager'.",
    difficulty: 'advanced',
  },
  {
    id: 'syn-19',
    word: 'affluent',
    type: 'synonym',
    question: "Which word is a SYNONYM of 'affluent'?",
    options: ['prosperous', 'impoverished', 'mediocre', 'stingy'],
    correctIndex: 0,
    explanation: "'Prosperous' means successful in material terms and financially flourishing, a direct synonym of 'affluent'.",
    difficulty: 'advanced',
  },

  // === BEGINNER ANTONYMS ===
  {
    id: 'ant-01',
    word: 'hot',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'hot'?",
    options: ['warm', 'mild', 'cool', 'cold'],
    correctIndex: 3,
    explanation: "'Cold' means having a low temperature, the direct opposite of 'hot'. They represent opposite ends of the temperature scale.",
    difficulty: 'beginner',
  },
  {
    id: 'ant-02',
    word: 'happy',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'happy'?",
    options: ['glad', 'sad', 'excited', 'cheerful'],
    correctIndex: 1,
    explanation: "'Sad' means feeling sorrow or unhappiness, the direct opposite of 'happy'.",
    difficulty: 'beginner',
  },
  {
    id: 'ant-03',
    word: 'big',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'big'?",
    options: ['large', 'huge', 'wide', 'small'],
    correctIndex: 3,
    explanation: "'Small' means of limited size, the direct opposite of 'big'.",
    difficulty: 'beginner',
  },
  {
    id: 'ant-04',
    word: 'fast',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'fast'?",
    options: ['quick', 'slow', 'rapid', 'swift'],
    correctIndex: 1,
    explanation: "'Slow' means moving or operating at a low speed, the opposite of 'fast'.",
    difficulty: 'beginner',
  },
  {
    id: 'ant-05',
    word: 'loud',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'loud'?",
    options: ['noisy', 'soft', 'quiet', 'gentle'],
    correctIndex: 2,
    explanation: "'Quiet' means making little or no noise, the direct opposite of 'loud'.",
    difficulty: 'beginner',
  },

  // === INTERMEDIATE ANTONYMS ===
  {
    id: 'ant-06',
    word: 'strong',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'strong'?",
    options: ['mighty', 'powerful', 'tough', 'weak'],
    correctIndex: 3,
    explanation: "'Weak' means lacking the power to perform physically demanding tasks, the opposite of 'strong'.",
    difficulty: 'intermediate',
  },
  {
    id: 'ant-07',
    word: 'light',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'light'?",
    options: ['bright', 'dark', 'dim', 'pale'],
    correctIndex: 1,
    explanation: "'Dark' means with little or no light, the direct opposite of 'light'.",
    difficulty: 'intermediate',
  },
  {
    id: 'ant-08',
    word: 'love',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'love'?",
    options: ['like', 'care', 'hate', 'adore'],
    correctIndex: 2,
    explanation: "'Hate' means to feel intense dislike for, the direct opposite of 'love'.",
    difficulty: 'intermediate',
  },
  {
    id: 'ant-09',
    word: 'rough',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'rough'?",
    options: ['smooth', 'bumpy', 'coarse', 'uneven'],
    correctIndex: 0,
    explanation: "'Smooth' means having an even and regular surface, the opposite of 'rough'.",
    difficulty: 'intermediate',
  },
  {
    id: 'ant-10',
    word: 'clean',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'clean'?",
    options: ['tidy', 'dirty', 'fresh', 'neat'],
    correctIndex: 1,
    explanation: "'Dirty' means not clean, the direct opposite of 'clean'.",
    difficulty: 'intermediate',
  },
  {
    id: 'ant-11',
    word: 'push',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'push'?",
    options: ['shove', 'drag', 'lift', 'pull'],
    correctIndex: 3,
    explanation: "'Pull' means to draw something toward oneself, the opposite of 'push' which means to move something away.",
    difficulty: 'intermediate',
  },
  {
    id: 'ant-12',
    word: 'noisy',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'noisy'?",
    options: ['loud', 'busy', 'silent', 'active'],
    correctIndex: 2,
    explanation: "'Silent' means completely quiet, making no sound at all, the opposite of 'noisy'.",
    difficulty: 'intermediate',
  },
  {
    id: 'ant-13',
    word: 'empty',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'empty'?",
    options: ['hollow', 'bare', 'full', 'vacant'],
    correctIndex: 2,
    explanation: "'Full' means containing as much as possible, the direct opposite of 'empty'.",
    difficulty: 'intermediate',
  },
  {
    id: 'ant-14',
    word: 'open',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'open'?",
    options: ['wide', 'free', 'closed', 'clear'],
    correctIndex: 2,
    explanation: "'Closed' means not open, the direct opposite of 'open'.",
    difficulty: 'intermediate',
  },
  {
    id: 'ant-15',
    word: 'hard',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'hard'?",
    options: ['firm', 'solid', 'tough', 'soft'],
    correctIndex: 3,
    explanation: "'Soft' means easy to press, squeeze, or deform, the opposite of 'hard' (firm and rigid).",
    difficulty: 'intermediate',
  },
  {
    id: 'ant-16',
    word: 'wet',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'wet'?",
    options: ['damp', 'dry', 'moist', 'soaked'],
    correctIndex: 1,
    explanation: "'Dry' means free from moisture or liquid, the direct opposite of 'wet'.",
    difficulty: 'intermediate',
  },

  // === ADVANCED ANTONYMS ===
  {
    id: 'ant-17',
    word: 'verbose',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'verbose'?",
    options: ['lengthy', 'detailed', 'concise', 'articulate'],
    correctIndex: 2,
    explanation: "'Concise' means giving a lot of information clearly and in few words, the opposite of 'verbose' (using more words than needed).",
    difficulty: 'advanced',
  },
  {
    id: 'ant-18',
    word: 'benevolent',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'benevolent'?",
    options: ['kind', 'generous', 'malevolent', 'charitable'],
    correctIndex: 2,
    explanation: "'Malevolent' means having or showing a wish to do evil to others, the opposite of 'benevolent' (well-meaning and kindly).",
    difficulty: 'advanced',
  },
  {
    id: 'ant-19',
    word: 'ephemeral',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'ephemeral'?",
    options: ['fleeting', 'enduring', 'temporary', 'fragile'],
    correctIndex: 1,
    explanation: "'Enduring' means lasting over a long period of time, the opposite of 'ephemeral' (lasting for a very short time).",
    difficulty: 'advanced',
  },
  {
    id: 'ant-20',
    word: 'candid',
    type: 'antonym',
    question: "Which word is an ANTONYM of 'candid'?",
    options: ['honest', 'evasive', 'straightforward', 'frank'],
    correctIndex: 1,
    explanation: "'Evasive' means tending to avoid commitment or direct answers, the opposite of 'candid' (truthful and straightforward).",
    difficulty: 'advanced',
  },
]

// ============================================================
// Defaults
// ============================================================

export const SYNONYM_ANTONYM_KIND = 'lang-synonym-antonym'

export const DEFAULT_SYNONYM_ANTONYM_CONFIG: SynonymAntonymConfig = {
  mode: 'student',
  exerciseIdx: 0,
  selected: null,
  checked: false,
  score: 0,
  totalAttempted: 0,
  practiceType: 'both',
  difficulty: 'beginner',
  teacherWord: '',
  teacherOptions: ['', '', '', ''],
  teacherCorrect: 0,
  teacherType: 'synonym',
  teacherExplanation: '',
  customExercises: [],
}

// ============================================================
// Helpers
// ============================================================

function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

// ============================================================
// Main Component
// ============================================================

export function SynonymAntonymWidget({ isDark, config, onConfigChange, compact }: {
  isDark: boolean
  config: SynonymAntonymConfig
  onConfigChange: (patch: Partial<SynonymAntonymConfig>) => void
  compact?: boolean
}) {
  const s = sh(isDark)
  if (config.mode === 'teacher') {
    return <TeacherMode isDark={isDark} config={config} onConfigChange={onConfigChange} compact={!!compact} />
  }
  return <StudentMode isDark={isDark} config={config} onConfigChange={onConfigChange} compact={!!compact} />
}

// ============================================================
// Student Mode
// ============================================================

function StudentMode({ isDark, config, onConfigChange, compact }: {
  isDark: boolean
  config: SynonymAntonymConfig
  onConfigChange: (p: Partial<SynonymAntonymConfig>) => void
  compact: boolean
}) {
  const s = sh(isDark)
  const fs = compact ? 10 : 12
  const [shuffleKey, setShuffleKey] = useState(0)

  const allExercises = useMemo(() => {
    return [...DEFAULT_EXERCISES, ...config.customExercises]
  }, [config.customExercises])

  const filteredExercises = useMemo(() => {
    const filtered = allExercises.filter(e => {
      if (config.practiceType !== 'both' && e.type !== config.practiceType) return false
      if (e.difficulty !== config.difficulty) return false
      return true
    })
    return shuffleArray(filtered)
  }, [allExercises, config.practiceType, config.difficulty, shuffleKey])

  const currentExercise = useMemo((): SynAntExercise | null => {
    if (filteredExercises.length === 0) return null
    const idx = config.exerciseIdx % filteredExercises.length
    return filteredExercises[idx] || null
  }, [filteredExercises, config.exerciseIdx])

  const handleSelect = useCallback((idx: number) => {
    if (config.checked) return
    onConfigChange({ selected: idx })
  }, [config.checked, onConfigChange])

  const handleCheck = useCallback(() => {
    if (config.selected === null || !currentExercise) return
    const correct = config.selected === currentExercise.correctIndex
    onConfigChange({
      checked: true,
      score: correct ? config.score + 1 : config.score,
      totalAttempted: config.totalAttempted + 1,
    })
  }, [config.selected, config.score, config.totalAttempted, currentExercise, onConfigChange])

  const handleNext = useCallback(() => {
    onConfigChange({
      exerciseIdx: config.exerciseIdx + 1,
      selected: null,
      checked: false,
    })
  }, [config.exerciseIdx, onConfigChange])

  const handleShuffle = useCallback(() => {
    setShuffleKey(k => k + 1)
    onConfigChange({
      exerciseIdx: 0,
      selected: null,
      checked: false,
      score: 0,
      totalAttempted: 0,
    })
  }, [onConfigChange])

  const handlePracticeTypeChange = useCallback((pt: 'synonym' | 'antonym' | 'both') => {
    setShuffleKey(k => k + 1)
    onConfigChange({
      practiceType: pt,
      exerciseIdx: 0,
      selected: null,
      checked: false,
      score: 0,
      totalAttempted: 0,
    })
  }, [onConfigChange])

  const handleDifficultyChange = useCallback((d: 'beginner' | 'intermediate' | 'advanced') => {
    setShuffleKey(k => k + 1)
    onConfigChange({
      difficulty: d,
      exerciseIdx: 0,
      selected: null,
      checked: false,
      score: 0,
      totalAttempted: 0,
    })
  }, [onConfigChange])

  const displayIndex = (config.exerciseIdx % Math.max(filteredExercises.length, 1)) + 1
  const totalExercises = filteredExercises.length

  const diffColor = (d: string) => {
    if (d === 'beginner') return '#4ade80'
    if (d === 'intermediate') return '#facc15'
    return '#f87171'
  }

  const typeColor = (t: string) => {
    if (t === 'synonym') return '#38bdf8'
    return '#fb923c'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={() => onConfigChange({ mode: 'student' })} style={{
            ...s.btn(true), padding: '2px 6px', fontSize: 9, fontWeight: 700 as const,
          }}>Practice</button>
          <button onClick={() => onConfigChange({ mode: 'teacher' })} style={{
            ...s.btn(false), padding: '2px 6px', fontSize: 9,
          }}>Author</button>
        </div>
        <div style={{ fontSize: 9, color: s.text }}>
          {displayIndex + '/' + totalExercises + ' | Score: ' + config.score + '/' + config.totalAttempted}
        </div>
      </div>

      {/* Filters */}
      {!compact && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 3, padding: '4px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
          {/* Practice Type */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: 8, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Type:</span>
            {(['synonym', 'antonym', 'both'] as const).map(pt => (
              <button key={pt} onClick={() => handlePracticeTypeChange(pt)} style={{
                ...s.btn(config.practiceType === pt), fontSize: 8, padding: '1px 5px',
                border: config.practiceType === pt ? '1px solid ' + typeColor(pt) + '60' : undefined,
                color: config.practiceType === pt ? typeColor(pt) : undefined,
                background: config.practiceType === pt ? typeColor(pt) + '18' : undefined,
              }}>{pt.charAt(0).toUpperCase() + pt.slice(1)}</button>
            ))}
            <span style={{ fontSize: 8, color: s.text, margin: '0 2px' }}>|</span>
            <button onClick={handleShuffle} style={{ ...s.btn(false), fontSize: 8, padding: '1px 6px' }}>
              Shuffle
            </button>
          </div>
          {/* Difficulty */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: 8, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Level:</span>
            {(['beginner', 'intermediate', 'advanced'] as const).map(d => (
              <button key={d} onClick={() => handleDifficultyChange(d)} style={{
                ...s.btn(config.difficulty === d), fontSize: 8, padding: '1px 5px',
                border: config.difficulty === d ? '1px solid ' + diffColor(d) + '60' : undefined,
                color: config.difficulty === d ? diffColor(d) : undefined,
                background: config.difficulty === d ? diffColor(d) + '18' : undefined,
              }}>{d.charAt(0).toUpperCase() + d.slice(1)}</button>
            ))}
          </div>
        </div>
      )}

      {/* Exercise */}
      {!currentExercise ? (
        <div style={{ padding: 20, textAlign: 'center' as const, color: s.text, fontSize: fs }}>
          No exercises available for this filter. Try a different type or level.
        </div>
      ) : (
        <React.Fragment>
          {/* Question */}
          <div style={{
            padding: '8px 10px', borderRadius: 6, background: s.bg,
            border: '1px solid ' + s.border, fontSize: fs + 1, lineHeight: 1.5, color: s.bright,
          }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 8, fontWeight: 700 as const, color: typeColor(currentExercise.type), textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                {currentExercise.type}
              </span>
              <span style={{ fontSize: 8, fontWeight: 700 as const, color: diffColor(currentExercise.difficulty), textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                {currentExercise.difficulty}
              </span>
            </div>
            {currentExercise.question}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
            {currentExercise.options.map((opt, i) => {
              const isSel = config.selected === i
              const showCorrect = config.checked && i === currentExercise.correctIndex
              const showWrong = config.checked && isSel && i !== currentExercise.correctIndex
              return (
                <button key={i} onClick={() => handleSelect(i)} style={{
                  padding: '6px 10px', borderRadius: 5, fontSize: fs, cursor: 'pointer' as const,
                  textAlign: 'left' as const, width: '100%',
                  border: '1px solid ' + (showCorrect ? '#4ade80' : showWrong ? '#f87171' : isSel ? '#34d399' : s.border),
                  background: showCorrect ? 'rgba(34,197,94,0.1)' : showWrong ? 'rgba(239,68,68,0.1)' : isSel ? 'rgba(5,150,105,0.08)' : s.bg,
                  color: showCorrect ? '#4ade80' : showWrong ? '#f87171' : isSel ? '#34d399' : s.bright,
                  fontWeight: isSel ? 600 : 400,
                }}>
                  {String.fromCharCode(65 + i) + '. ' + opt}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {config.checked && currentExercise && (
            <div style={{
              padding: '6px 10px', borderRadius: 5, fontSize: fs - 1, lineHeight: 1.5, color: s.text,
              background: config.selected === currentExercise.correctIndex ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
              border: '1px solid ' + (config.selected === currentExercise.correctIndex ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'),
            }}>
              <div style={{ fontSize: 8, fontWeight: 700 as const, color: config.selected === currentExercise.correctIndex ? '#4ade80' : '#f87171', marginBottom: 2, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                {config.selected === currentExercise.correctIndex ? 'Correct!' : 'Incorrect'}
              </div>
              {currentExercise.explanation}
            </div>
          )}

          {/* Check / Next */}
          <div style={{ display: 'flex', gap: 4 }}>
            {!config.checked && (
              <button onClick={handleCheck} disabled={config.selected === null} style={{
                ...s.btnPrimary, opacity: config.selected === null ? 0.5 : 1, fontSize: fs,
              }}>Check Answer</button>
            )}
            {config.checked && (
              <button onClick={handleNext} style={{ ...s.btnPrimary, fontSize: fs }}>Next</button>
            )}
          </div>
        </React.Fragment>
      )}
    </div>
  )
}

// ============================================================
// Teacher Mode
// ============================================================

function TeacherMode({ isDark, config, onConfigChange, compact }: {
  isDark: boolean
  config: SynonymAntonymConfig
  onConfigChange: (p: Partial<SynonymAntonymConfig>) => void
  compact: boolean
}) {
  const s = sh(isDark)

  const handleOptionEdit = useCallback((idx: number, val: string) => {
    const newOpts: [string, string, string, string] = [
      config.teacherOptions[0], config.teacherOptions[1],
      config.teacherOptions[2], config.teacherOptions[3],
    ]
    newOpts[idx] = val
    onConfigChange({ teacherOptions: newOpts })
  }, [config.teacherOptions, onConfigChange])

  const handleSetCorrect = useCallback((idx: number) => {
    onConfigChange({ teacherCorrect: idx })
  }, [onConfigChange])

  const handleAddExercise = useCallback(() => {
    if (!config.teacherWord.trim() || !config.teacherExplanation.trim()) return
    const hasEmpty = config.teacherOptions.some(o => !o.trim())
    if (hasEmpty) return
    const questionWord = config.teacherType === 'synonym' ? 'SYNONYM' : 'ANTONYM'
    const newExercise: SynAntExercise = {
      id: 'custom-' + Date.now(),
      word: config.teacherWord.trim(),
      type: config.teacherType,
      question: 'Which word is a ' + questionWord + ' of \'' + config.teacherWord.trim() + '\'?',
      options: [
        config.teacherOptions[0],
        config.teacherOptions[1],
        config.teacherOptions[2],
        config.teacherOptions[3],
      ],
      correctIndex: config.teacherCorrect,
      explanation: config.teacherExplanation.trim(),
      difficulty: 'intermediate',
    }
    onConfigChange({
      customExercises: [...config.customExercises, newExercise],
      teacherWord: '',
      teacherOptions: ['', '', '', ''],
      teacherCorrect: 0,
      teacherExplanation: '',
    })
  }, [config.teacherWord, config.teacherOptions, config.teacherCorrect, config.teacherType, config.teacherExplanation, config.customExercises, onConfigChange])

  const handleRemoveCustom = useCallback((idx: number) => {
    const updated = [...config.customExercises]
    updated.splice(idx, 1)
    onConfigChange({ customExercises: updated })
  }, [config.customExercises, onConfigChange])

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={() => onConfigChange({ mode: 'student' })} style={{
            ...s.btn(false), padding: '2px 6px', fontSize: 9,
          }}>Practice</button>
          <button onClick={() => onConfigChange({ mode: 'teacher' })} style={{
            ...s.btn(true), padding: '2px 6px', fontSize: 9, fontWeight: 700 as const,
          }}>Author</button>
        </div>
        <div style={{ fontSize: 9, color: s.text }}>
          {config.customExercises.length + ' custom exercise' + (config.customExercises.length !== 1 ? 's' : '')}
        </div>
      </div>

      {/* Create Exercise Form */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, padding: '6px 8px', borderRadius: 6, background: s.bg, border: '1px solid ' + s.border }}>
        <div style={{ fontSize: 9, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Create Exercise</div>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input
            placeholder="Target word (e.g. happy)"
            value={config.teacherWord}
            onChange={e => onConfigChange({ teacherWord: e.target.value })}
            style={{ ...s.input, flex: 1, boxSizing: 'border-box' as const, fontSize: 10 }}
          />
          <div style={{ display: 'flex', gap: 2 }}>
            {(['synonym', 'antonym'] as const).map(t => (
              <button key={t} onClick={() => onConfigChange({ teacherType: t })} style={{
                ...s.btn(config.teacherType === t), fontSize: 8, padding: '2px 6px',
              }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 8, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Options (click letter to set correct):</div>
        {config.teacherOptions.map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={() => handleSetCorrect(i)} style={{
              ...s.btn(config.teacherCorrect === i), fontSize: 8, padding: '1px 4px', minWidth: 18,
              color: config.teacherCorrect === i ? '#34d399' : s.text,
              border: config.teacherCorrect === i ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
              background: config.teacherCorrect === i ? 'rgba(5,150,105,0.15)' : s.bg,
            }}>{String.fromCharCode(65 + i)}</button>
            <input
              placeholder={'Option ' + String.fromCharCode(65 + i)}
              value={opt}
              onChange={e => handleOptionEdit(i, e.target.value)}
              style={{ ...s.input, flex: 1, boxSizing: 'border-box' as const, fontSize: 10 }}
            />
          </div>
        ))}

        <input
          placeholder="Explanation (why the answer is correct)"
          value={config.teacherExplanation}
          onChange={e => onConfigChange({ teacherExplanation: e.target.value })}
          style={{ ...s.input, width: '100%', boxSizing: 'border-box' as const, fontSize: 10 }}
        />

        <button onClick={handleAddExercise} style={{ ...s.btnPrimary, alignSelf: 'flex-start' as const, fontSize: 9 }}>
          + Add Exercise
        </button>
      </div>

      {/* Custom Exercises List */}
      {config.customExercises.length > 0 && !compact && (
        <div style={{
          maxHeight: 160, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: 2,
          padding: '4px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border,
        }}>
          <div style={{ fontSize: 8, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 1 }}>Custom Exercises</div>
          {config.customExercises.map((ex, i) => (
            <div key={ex.id} style={{
              display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center',
              padding: '3px 6px', borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: '1px solid ' + s.border, fontSize: 9, color: s.bright,
            }}>
              <div style={{ flex: 1, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const }}>
                <span style={{ color: ex.type === 'synonym' ? '#38bdf8' : '#fb923c', fontWeight: 600 }}>
                  {ex.type.charAt(0).toUpperCase() + ex.type.slice(1)}
                </span>
                {': ' + ex.word + ' (' + ex.options[ex.correctIndex] + ')'}
              </div>
              <button onClick={() => handleRemoveCustom(i)} style={{
                cursor: 'pointer' as const, fontSize: 9, color: '#f87171', background: 'none',
                border: 'none', padding: '0 2px', lineHeight: 1,
              }}>&times;</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
