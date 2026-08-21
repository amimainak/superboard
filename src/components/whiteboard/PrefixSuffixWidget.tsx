'use client'

import React, { useMemo, useCallback } from 'react'

// ============================================================
// Types
// ============================================================

export interface PrefixSuffixExercise {
  id: string
  wordPart: string
  type: 'prefix' | 'suffix'
  question: string
  options: [string, string, string, string]
  correctIndex: number
  explanation: string
  examples: string[]
}

export interface PrefixSuffixConfig {
  mode: 'student' | 'teacher'
  exerciseIdx: number
  selected: number | null
  checked: boolean
  score: number
  totalAttempted: number
  focusArea: 'prefix' | 'suffix' | 'both'
  teacherQuestion: string
  teacherOptions: [string, string, string, string]
  teacherCorrect: number
  teacherExplanation: string
  teacherType: 'prefix' | 'suffix'
  customExercises: PrefixSuffixExercise[]
}

export const DEFAULT_PREFIX_SUFFIX_CONFIG: PrefixSuffixConfig = {
  mode: 'student',
  exerciseIdx: 0,
  selected: null,
  checked: false,
  score: 0,
  totalAttempted: 0,
  focusArea: 'both',
  teacherQuestion: '',
  teacherOptions: ['', '', '', ''],
  teacherCorrect: 0,
  teacherExplanation: '',
  teacherType: 'prefix',
  customExercises: [],
}

export interface PrefixSuffixProps {
  isDark: boolean
  config: PrefixSuffixConfig
  onConfigChange: (patch: Partial<PrefixSuffixConfig>) => void
  compact?: boolean
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
// Embedded Exercises (30+)
// ============================================================

const BUILT_IN_EXERCISES: PrefixSuffixExercise[] = [
  // --- Prefixes (16) ---
  {
    id: 'ps-01', wordPart: 'un-', type: 'prefix',
    question: 'What does the prefix un- mean?',
    options: ['not', 'again', 'before', 'wrong'],
    correctIndex: 0,
    explanation: 'The prefix un- means "not" or "opposite of". It turns a word into its opposite.',
    examples: ['unhappy', 'undo', 'unfair', 'unknown', 'unable'],
  },
  {
    id: 'ps-02', wordPart: 're-', type: 'prefix',
    question: 'What does the prefix re- mean?',
    options: ['again', 'not', 'before', 'after'],
    correctIndex: 0,
    explanation: 'The prefix re- means "again" or "back". It indicates repetition of an action.',
    examples: ['rewrite', 'return', 'rebuild', 'reread', 'replace'],
  },
  {
    id: 'ps-03', wordPart: 'pre-', type: 'prefix',
    question: 'What does the prefix pre- mean?',
    options: ['before', 'after', 'not', 'again'],
    correctIndex: 0,
    explanation: 'The prefix pre- means "before" or "prior to". It shows something happens ahead of time.',
    examples: ['preview', 'prefix', 'preheat', 'pretest', 'prepay'],
  },
  {
    id: 'ps-04', wordPart: 'mis-', type: 'prefix',
    question: 'What does the prefix mis- mean?',
    options: ['wrong', 'not', 'before', 'after'],
    correctIndex: 0,
    explanation: 'The prefix mis- means "wrong" or "badly". It shows something was done incorrectly.',
    examples: ['misunderstand', 'misplace', 'mislead', 'misbehave', 'misspell'],
  },
  {
    id: 'ps-05', wordPart: 'dis-', type: 'prefix',
    question: 'What does the prefix dis- mean?',
    options: ['not / opposite', 'before', 'again', 'too much'],
    correctIndex: 0,
    explanation: 'The prefix dis- means "not" or "opposite of". It reverses or negates the meaning.',
    examples: ['disagree', 'disconnect', 'disappear', 'dislike', 'disapprove'],
  },
  {
    id: 'ps-06', wordPart: 'over-', type: 'prefix',
    question: 'What does the prefix over- mean?',
    options: ['too much', 'too little', 'not', 'again'],
    correctIndex: 0,
    explanation: 'The prefix over- means "too much" or "above". It indicates an excessive amount.',
    examples: ['overcook', 'overeat', 'overload', 'oversleep', 'overwork'],
  },
  {
    id: 'ps-07', wordPart: 'under-', type: 'prefix',
    question: 'What does the prefix under- mean?',
    options: ['not enough', 'too much', 'above', 'again'],
    correctIndex: 0,
    explanation: 'The prefix under- means "not enough" or "below". It indicates insufficient amount or position.',
    examples: ['underestimate', 'undercook', 'underpaid', 'underground', 'understand'],
  },
  {
    id: 'ps-08', wordPart: 'sub-', type: 'prefix',
    question: 'What does the prefix sub- mean?',
    options: ['under / below', 'above', 'not', 'again'],
    correctIndex: 0,
    explanation: 'The prefix sub- means "under" or "below". It indicates a lower position or level.',
    examples: ['submarine', 'subway', 'substitute', 'subtitle', 'subdivide'],
  },
  {
    id: 'ps-09', wordPart: 'inter-', type: 'prefix',
    question: 'What does the prefix inter- mean?',
    options: ['between', 'across', 'not', 'above'],
    correctIndex: 0,
    explanation: 'The prefix inter- means "between" or "among". It shows a connection between things.',
    examples: ['interact', 'international', 'interrupt', 'internet', 'interchange'],
  },
  {
    id: 'ps-10', wordPart: 'trans-', type: 'prefix',
    question: 'What does the prefix trans- mean?',
    options: ['across', 'between', 'before', 'not'],
    correctIndex: 0,
    explanation: 'The prefix trans- means "across" or "beyond". It indicates movement from one place to another.',
    examples: ['transport', 'transfer', 'translate', 'transform', 'transplant'],
  },
  {
    id: 'ps-11', wordPart: 'super-', type: 'prefix',
    question: 'What does the prefix super- mean?',
    options: ['above / beyond', 'below', 'not', 'wrong'],
    correctIndex: 0,
    explanation: 'The prefix super- means "above" or "beyond". It indicates something is beyond the ordinary.',
    examples: ['superhero', 'supermarket', 'supernatural', 'supervise', 'superior'],
  },
  {
    id: 'ps-12', wordPart: 'anti-', type: 'prefix',
    question: 'What does the prefix anti- mean?',
    options: ['against', 'before', 'after', 'with'],
    correctIndex: 0,
    explanation: 'The prefix anti- means "against" or "opposed to". It shows opposition to something.',
    examples: ['antibody', 'antisocial', 'antihero', 'antifreeze', 'antidote'],
  },
  {
    id: 'ps-13', wordPart: 'auto-', type: 'prefix',
    question: 'What does the prefix auto- mean?',
    options: ['self', 'not', 'before', 'two'],
    correctIndex: 0,
    explanation: 'The prefix auto- means "self" or "automatic". It indicates something happens by itself.',
    examples: ['automatic', 'autobiography', 'autofocus', 'autograph', 'autopilot'],
  },
  {
    id: 'ps-14', wordPart: 'bi-', type: 'prefix',
    question: 'What does the prefix bi- mean?',
    options: ['two', 'three', 'one', 'many'],
    correctIndex: 0,
    explanation: 'The prefix bi- means "two" or "twice". It indicates two of something.',
    examples: ['bicycle', 'bilingual', 'biweekly', 'bipolar', 'biceps'],
  },
  {
    id: 'ps-15', wordPart: 'tri-', type: 'prefix',
    question: 'What does the prefix tri- mean?',
    options: ['three', 'two', 'one', 'many'],
    correctIndex: 0,
    explanation: 'The prefix tri- means "three". It indicates three of something.',
    examples: ['triangle', 'tricycle', 'triple', 'trio', 'trilingual'],
  },
  {
    id: 'ps-16', wordPart: 'multi-', type: 'prefix',
    question: 'What does the prefix multi- mean?',
    options: ['many', 'one', 'two', 'not'],
    correctIndex: 0,
    explanation: 'The prefix multi- means "many" or "much". It indicates a large number or variety.',
    examples: ['multicoloured', 'multitask', 'multimedia', 'multipurpose', 'multinational'],
  },
  // --- Suffixes (16) ---
  {
    id: 'ps-17', wordPart: '-ful', type: 'suffix',
    question: 'What does the suffix -ful mean?',
    options: ['full of', 'without', 'can do', 'person who'],
    correctIndex: 0,
    explanation: 'The suffix -ful means "full of" or "characterised by". It describes something that has a lot of a quality.',
    examples: ['beautiful', 'careful', 'helpful', 'wonderful', 'grateful'],
  },
  {
    id: 'ps-18', wordPart: '-less', type: 'suffix',
    question: 'What does the suffix -less mean?',
    options: ['without', 'full of', 'can do', 'state of'],
    correctIndex: 0,
    explanation: 'The suffix -less means "without" or "lacking". It describes the absence of something.',
    examples: ['careless', 'fearless', 'hopeless', 'endless', 'helpless'],
  },
  {
    id: 'ps-19', wordPart: '-ness', type: 'suffix',
    question: 'What does the suffix -ness mean?',
    options: ['state of', 'without', 'person who', 'full of'],
    correctIndex: 0,
    explanation: 'The suffix -ness means "state of" or "condition of". It turns an adjective into a noun.',
    examples: ['happiness', 'sadness', 'darkness', 'kindness', 'fitness'],
  },
  {
    id: 'ps-20', wordPart: '-ment', type: 'suffix',
    question: 'What does the suffix -ment mean?',
    options: ['action / result', 'without', 'state of', 'person who'],
    correctIndex: 0,
    explanation: 'The suffix -ment means "action" or "result of". It often turns a verb into a noun.',
    examples: ['enjoyment', 'movement', 'achievement', 'excitement', 'agreement'],
  },
  {
    id: 'ps-21', wordPart: '-able', type: 'suffix',
    question: 'What does the suffix -able mean?',
    options: ['can do', 'without', 'full of', 'person who'],
    correctIndex: 0,
    explanation: 'The suffix -able means "able to be" or "can do". It shows something is possible.',
    examples: ['comfortable', 'enjoyable', 'readable', 'believable', 'washable'],
  },
  {
    id: 'ps-22', wordPart: '-ible', type: 'suffix',
    question: 'What does the suffix -ible mean?',
    options: ['can do', 'without', 'person who', 'state of'],
    correctIndex: 0,
    explanation: 'The suffix -ible also means "able to be". It has the same meaning as -able but is used after different base words.',
    examples: ['visible', 'possible', 'incredible', 'sensible', 'flexible'],
  },
  {
    id: 'ps-23', wordPart: '-er', type: 'suffix',
    question: 'What does the suffix -er mean?',
    options: ['person who', 'can do', 'without', 'state of'],
    correctIndex: 0,
    explanation: 'The suffix -er means "person who" or "thing that". It can also mean "more" when comparing.',
    examples: ['teacher', 'writer', 'builder', 'driver', 'helper'],
  },
  {
    id: 'ps-24', wordPart: '-or', type: 'suffix',
    question: 'What does the suffix -or mean?',
    options: ['person who', 'can do', 'without', 'full of'],
    correctIndex: 0,
    explanation: 'The suffix -or means "person who" or "thing that". It is used after Latin-based words.',
    examples: ['actor', 'doctor', 'director', 'inventor', 'visitor'],
  },
  {
    id: 'ps-25', wordPart: '-ly', type: 'suffix',
    question: 'What does the suffix -ly mean?',
    options: ['in a way', 'person who', 'without', 'full of'],
    correctIndex: 0,
    explanation: 'The suffix -ly means "in a ___ way". It turns an adjective into an adverb.',
    examples: ['quickly', 'slowly', 'happily', 'loudly', 'carefully'],
  },
  {
    id: 'ps-26', wordPart: '-tion', type: 'suffix',
    question: 'What does the suffix -tion mean?',
    options: ['action / state', 'person who', 'without', 'in a way'],
    correctIndex: 0,
    explanation: 'The suffix -tion means "action" or "state of". It turns a verb into a noun.',
    examples: ['education', 'creation', 'information', 'celebration', 'imagination'],
  },
  {
    id: 'ps-27', wordPart: '-sion', type: 'suffix',
    question: 'What does the suffix -sion mean?',
    options: ['action / state', 'can do', 'person who', 'full of'],
    correctIndex: 0,
    explanation: 'The suffix -sion also means "action" or "state". It is used after verbs ending in -d, -de, -s, or -ss.',
    examples: ['discussion', 'decision', 'expansion', 'television', 'confusion'],
  },
  {
    id: 'ps-28', wordPart: '-ous', type: 'suffix',
    question: 'What does the suffix -ous mean?',
    options: ['having / full of', 'without', 'can do', 'person who'],
    correctIndex: 0,
    explanation: 'The suffix -ous means "having" or "full of" a quality. It turns a noun into an adjective.',
    examples: ['dangerous', 'famous', 'generous', 'nervous', 'curious'],
  },
  {
    id: 'ps-29', wordPart: '-ive', type: 'suffix',
    question: 'What does the suffix -ive mean?',
    options: ['tending to', 'without', 'can do', 'person who'],
    correctIndex: 0,
    explanation: 'The suffix -ive means "tending to" or "having the quality of". It often turns a verb into an adjective.',
    examples: ['active', 'creative', 'attractive', 'expensive', 'talkative'],
  },
  {
    id: 'ps-30', wordPart: '-al', type: 'suffix',
    question: 'What does the suffix -al mean?',
    options: ['relating to', 'without', 'can do', 'in a way'],
    correctIndex: 0,
    explanation: 'The suffix -al means "relating to" or "of the kind of". It turns a noun into an adjective.',
    examples: ['personal', 'national', 'musical', 'traditional', 'educational'],
  },
  {
    id: 'ps-31', wordPart: '-y', type: 'suffix',
    question: 'What does the suffix -y mean?',
    options: ['characterised by', 'without', 'can do', 'person who'],
    correctIndex: 0,
    explanation: 'The suffix -y means "characterised by" or "having the quality of". It often turns a noun into an adjective.',
    examples: ['sunny', 'funny', 'rainy', 'hungry', 'angry'],
  },
  {
    id: 'ps-32', wordPart: 'un-', type: 'prefix',
    question: 'Which word uses the prefix un- correctly to mean "not happy"?',
    options: ['unhappy', 'rehappy', 'dishappy', 'misshappy'],
    correctIndex: 0,
    explanation: 'The prefix un- means "not", so unhappy means "not happy".',
    examples: ['unhappy', 'undo', 'unfair', 'unknown', 'unable'],
  },
  {
    id: 'ps-33', wordPart: '-ful', type: 'suffix',
    question: 'Which word means "full of wonder"?',
    options: ['wonderful', 'wonderless', 'wonderness', 'wonderable'],
    correctIndex: 0,
    explanation: 'The suffix -ful means "full of", so wonderful means "full of wonder".',
    examples: ['wonderful', 'beautiful', 'careful', 'helpful', 'grateful'],
  },
  {
    id: 'ps-34', wordPart: 're-', type: 'prefix',
    question: 'Which word means "to write again"?',
    options: ['rewrite', 'unwrite', 'miswrite', 'overwrite'],
    correctIndex: 0,
    explanation: 'The prefix re- means "again", so rewrite means "to write again".',
    examples: ['rewrite', 'return', 'rebuild', 'reread', 'replace'],
  },
  {
    id: 'ps-35', wordPart: '-ness', type: 'suffix',
    question: 'Which word means "the state of being happy"?',
    options: ['happiness', 'happiful', 'happiless', 'happyment'],
    correctIndex: 0,
    explanation: 'The suffix -ness means "state of", so happiness means "the state of being happy".',
    examples: ['happiness', 'sadness', 'darkness', 'kindness', 'fitness'],
  },
]

// ============================================================
// Component
// ============================================================

export function PrefixSuffixWidget({ isDark, config, onConfigChange }: PrefixSuffixProps) {
  const s = useMemo(() => sh(isDark), [isDark])

  const allExercises = useMemo(() => {
    const filtered = BUILT_IN_EXERCISES.filter((ex) => {
      if (config.focusArea === 'prefix') return ex.type === 'prefix'
      if (config.focusArea === 'suffix') return ex.type === 'suffix'
      return true
    })
    return filtered.concat(config.customExercises)
  }, [config.focusArea, config.customExercises])

  const currentExercise = allExercises[config.exerciseIdx] || null

  const handleSelect = useCallback((idx: number) => {
    if (config.checked) return
    onConfigChange({ selected: idx, checked: false })
  }, [config.checked, onConfigChange])

  const handleCheck = useCallback(() => {
    if (config.selected === null || !currentExercise) return
    const isCorrect = config.selected === currentExercise.correctIndex
    onConfigChange({
      checked: true,
      score: isCorrect ? config.score + 1 : config.score,
      totalAttempted: config.totalAttempted + 1,
    })
  }, [config.selected, config.score, config.totalAttempted, currentExercise, onConfigChange])

  const handleNext = useCallback(() => {
    const nextIdx = (config.exerciseIdx + 1) % allExercises.length
    onConfigChange({ exerciseIdx: nextIdx, selected: null, checked: false })
  }, [config.exerciseIdx, allExercises.length, onConfigChange])

  const handlePrev = useCallback(() => {
    const prevIdx = (config.exerciseIdx - 1 + allExercises.length) % allExercises.length
    onConfigChange({ exerciseIdx: prevIdx, selected: null, checked: false })
  }, [config.exerciseIdx, allExercises.length, onConfigChange])

  const handleShuffle = useCallback(() => {
    const shuffled = [...allExercises]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = shuffled[i]
      shuffled[i] = shuffled[j]
      shuffled[j] = tmp
    }
    onConfigChange({ exerciseIdx: 0, selected: null, checked: false, customExercises: shuffled.filter((e) => config.customExercises.some((c) => c.id === e.id)) })
  }, [allExercises, config.customExercises, onConfigChange])

  const handleAddCustomExercise = useCallback(() => {
    if (!config.teacherQuestion || config.teacherOptions.some((o) => !o.trim())) return
    const newEx: PrefixSuffixExercise = {
      id: 'custom-' + Date.now(),
      wordPart: config.teacherType === 'prefix' ? 'custom-' : '-custom',
      type: config.teacherType,
      question: config.teacherQuestion,
      options: [...config.teacherOptions],
      correctIndex: config.teacherCorrect,
      explanation: config.teacherExplanation || 'No explanation provided.',
      examples: [],
    }
    onConfigChange({
      customExercises: [...config.customExercises, newEx],
      teacherQuestion: '',
      teacherOptions: ['', '', '', ''],
      teacherCorrect: 0,
      teacherExplanation: '',
    })
  }, [config, onConfigChange])

  // ---- Render ----

  if (config.mode === 'teacher') {
    return (
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11, color: s.bright, height: '100%', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Prefix & Suffix</span>
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'rgba(5,150,105,0.12)', color: '#34d399' }}>Teacher</span>
          </div>
          <button style={s.btn(false)} onClick={() => onConfigChange({ mode: 'student' })}>Student Mode</button>
        </div>

        {/* Type selector */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={s.btn(config.teacherType === 'prefix')} onClick={() => onConfigChange({ teacherType: 'prefix' })}>Prefix</button>
          <button style={s.btn(config.teacherType === 'suffix')} onClick={() => onConfigChange({ teacherType: 'suffix' })}>Suffix</button>
        </div>

        {/* Question input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ color: s.text, fontSize: 10 }}>Question</label>
          <input style={s.input} value={config.teacherQuestion} onChange={(e) => onConfigChange({ teacherQuestion: e.target.value })} placeholder="e.g. What does the prefix un- mean?" />
        </div>

        {/* Options */}
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="radio" checked={config.teacherCorrect === i} onChange={() => onConfigChange({ teacherCorrect: i })} style={{ accentColor: '#34d399' }} />
            <span style={{ color: s.text, fontSize: 9, width: 12 }}>{String.fromCharCode(65 + i)}</span>
            <input style={{ ...s.input, flex: 1 }} value={config.teacherOptions[i]} onChange={(e) => {
              const opts: [string, string, string, string] = [...config.teacherOptions] as [string, string, string, string]
              opts[i] = e.target.value
              onConfigChange({ teacherOptions: opts })
            }} placeholder={'Option ' + String.fromCharCode(65 + i)} />
          </div>
        ))}

        {/* Explanation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ color: s.text, fontSize: 10 }}>Explanation</label>
          <textarea style={{ ...s.input, minHeight: 40, resize: 'vertical' as const }} value={config.teacherExplanation} onChange={(e) => onConfigChange({ teacherExplanation: e.target.value })} placeholder="Explain the answer..." />
        </div>

        <button style={s.btnPrimary} onClick={handleAddCustomExercise}>Add Exercise</button>

        {/* Custom exercises list */}
        {config.customExercises.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: s.text, fontSize: 10 }}>Custom Exercises ({config.customExercises.length})</span>
            <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {config.customExercises.map((ex, i) => (
                <div key={ex.id} style={{ padding: '4px 8px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border, fontSize: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: s.bright, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{ex.question}</span>
                  <span style={{ color: s.text, fontSize: 9, flexShrink: 0 }}>{ex.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Student mode
  if (!currentExercise) {
    return (
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: s.text, fontSize: 11 }}>
        <div>No exercises available for this filter.</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={s.btn(config.focusArea === 'prefix')} onClick={() => onConfigChange({ focusArea: 'prefix', exerciseIdx: 0, selected: null, checked: false })}>Prefix</button>
          <button style={s.btn(config.focusArea === 'suffix')} onClick={() => onConfigChange({ focusArea: 'suffix', exerciseIdx: 0, selected: null, checked: false })}>Suffix</button>
          <button style={s.btn(config.focusArea === 'both')} onClick={() => onConfigChange({ focusArea: 'both', exerciseIdx: 0, selected: null, checked: false })}>Both</button>
        </div>
      </div>
    )
  }

  const isCorrect = config.checked && config.selected === currentExercise.correctIndex
  const isWrong = config.checked && config.selected !== null && config.selected !== currentExercise.correctIndex

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11, color: s.bright, height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Prefix & Suffix</span>
          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: currentExercise.type === 'prefix' ? 'rgba(59,130,246,0.12)' : 'rgba(168,85,247,0.12)', color: currentExercise.type === 'prefix' ? '#60a5fa' : '#c084fc' }}>{currentExercise.type === 'prefix' ? 'Prefix' : 'Suffix'}</span>
        </div>
        <button style={s.btn(false)} onClick={() => onConfigChange({ mode: 'teacher' })}>Teacher</button>
      </div>

      {/* Focus area toggle */}
      <div style={{ display: 'flex', gap: 4 }}>
        {(['prefix', 'suffix', 'both'] as const).map((area) => (
          <button key={area} style={s.btn(config.focusArea === area)} onClick={() => onConfigChange({ focusArea: area, exerciseIdx: 0, selected: null, checked: false })}>{area.charAt(0).toUpperCase() + area.slice(1)}</button>
        ))}
      </div>

      {/* Score bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid ' + s.border }}>
        <span style={{ color: s.text, fontSize: 10 }}>{config.exerciseIdx + 1} / {allExercises.length}</span>
        <span style={{ color: '#34d399', fontSize: 10, fontWeight: 600 }}>{config.score} / {config.totalAttempted} correct</span>
      </div>

      {/* Word Part highlight */}
      <div style={{ textAlign: 'center' as const, padding: '8px 0' }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: currentExercise.type === 'prefix' ? '#60a5fa' : '#c084fc' }}>{currentExercise.wordPart}</span>
      </div>

      {/* Question */}
      <div style={{ padding: '8px 10px', borderRadius: 6, background: s.bg, border: '1px solid ' + s.border, lineHeight: 1.5 }}>
        {currentExercise.question}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {currentExercise.options.map((opt, i) => {
          const isThisCorrect = config.checked && i === currentExercise.correctIndex
          const isThisWrong = config.checked && config.selected === i && i !== currentExercise.correctIndex
          const isSelected = config.selected === i && !config.checked
          let optBg = s.bg
          let optBorder = s.border
          let optColor = s.bright
          if (isThisCorrect) { optBg = 'rgba(5,150,105,0.12)'; optBorder = 'rgba(5,150,105,0.4)'; optColor = '#34d399' }
          if (isThisWrong) { optBg = 'rgba(239,68,68,0.12)'; optBorder = 'rgba(239,68,68,0.4)'; optColor = '#f87171' }
          if (isSelected) { optBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'; optBorder = 'rgba(5,150,105,0.3)'; optColor = '#34d399' }
          return (
            <button key={i} style={{ padding: '7px 10px', borderRadius: 5, border: '1px solid ' + optBorder, background: optBg, color: optColor, fontSize: 11, cursor: 'pointer' as const, textAlign: 'left' as const, display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => handleSelect(i)}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid ' + optBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, flexShrink: 0, background: isSelected || isThisCorrect ? 'rgba(5,150,105,0.2)' : 'transparent' }}>
                {isThisCorrect ? '\u2713' : isThisWrong ? '\u2717' : String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          )
        })}
      </div>

      {/* Feedback after checking */}
      {config.checked && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8, borderRadius: 6, background: isCorrect ? 'rgba(5,150,105,0.08)' : 'rgba(239,68,68,0.08)', border: '1px solid ' + (isCorrect ? 'rgba(5,150,105,0.2)' : 'rgba(239,68,68,0.2)') }}>
          <span style={{ fontWeight: 600, color: isCorrect ? '#34d399' : '#f87171', fontSize: 11 }}>{isCorrect ? 'Correct!' : 'Incorrect'}</span>
          <span style={{ color: s.text, fontSize: 10, lineHeight: 1.5 }}>{currentExercise.explanation}</span>
          {currentExercise.examples.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginTop: 2 }}>
              <span style={{ color: s.text, fontSize: 9 }}>Examples: </span>
              {currentExercise.examples.map((ex, i) => (
                <span key={i} style={{ padding: '2px 6px', borderRadius: 3, background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.15)', color: '#34d399', fontSize: 9 }}>{ex}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 6, borderTop: '1px solid ' + s.border }}>
        <button style={s.btn(false)} onClick={handlePrev}>&larr; Prev</button>
        <div style={{ display: 'flex', gap: 4 }}>
          {!config.checked && config.selected !== null && (
            <button style={s.btnPrimary} onClick={handleCheck}>Check</button>
          )}
          {config.checked && (
            <button style={s.btnPrimary} onClick={handleNext}>Next &rarr;</button>
          )}
          <button style={s.btn(false)} onClick={handleShuffle}>Shuffle</button>
        </div>
      </div>
    </div>
  )
}
