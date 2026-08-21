'use client'

import React, { useMemo, useCallback, useState } from 'react'

// ============================================================
// Types
// ============================================================

export interface SentenceCombiningExercise {
  id: string
  sentences: string[]
  instruction: string
  hint: string
  sampleAnswer: string
  keyWords: string[]
  explanation: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  type: 'conjunction' | 'semicolon' | 'relative-clause' | 'participle' | 'appositive'
}

export interface SentenceCombiningConfig {
  mode: 'student' | 'teacher'
  exerciseIdx: number
  checked: boolean
  score: number
  totalAttempted: number
  studentAnswer: string
  showHint: boolean
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  teacherSentences: string
  teacherHint: string
  teacherSampleAnswer: string
  teacherExplanation: string
  customExercises: SentenceCombiningExercise[]
}

export const DEFAULT_SENTENCE_COMBINING_CONFIG: SentenceCombiningConfig = {
  mode: 'student',
  exerciseIdx: 0,
  checked: false,
  score: 0,
  totalAttempted: 0,
  studentAnswer: '',
  showHint: false,
  difficulty: 'beginner',
  teacherSentences: '',
  teacherHint: '',
  teacherSampleAnswer: '',
  teacherExplanation: '',
  customExercises: [],
}

// ============================================================
// Exercises (20 total)
// ============================================================

const BUILT_IN_EXERCISES: SentenceCombiningExercise[] = [
  // Beginner (conjunctions) - 8
  {
    id: 'ex1',
    sentences: ['The cat sat on the mat.', 'The dog lay on the rug.'],
    instruction: 'Combine using AND',
    hint: 'Use the word "and" to join the two sentences.',
    sampleAnswer: 'The cat sat on the mat and the dog lay on the rug.',
    keyWords: ['and'],
    explanation: 'Using "and" is the simplest way to combine two related sentences. Both actions happen independently but are connected.',
    difficulty: 'beginner',
    type: 'conjunction',
  },
  {
    id: 'ex2',
    sentences: ['I like apples.', 'I do not like oranges.'],
    instruction: 'Combine using BUT',
    hint: 'Use the word "but" to show contrast between the two ideas.',
    sampleAnswer: 'I like apples but I do not like oranges.',
    keyWords: ['but'],
    explanation: '"But" shows a contrast. The speaker likes one fruit but not the other.',
    difficulty: 'beginner',
    type: 'conjunction',
  },
  {
    id: 'ex3',
    sentences: ['She studied hard.', 'She passed the test.'],
    instruction: 'Combine using SO',
    hint: 'Use "so" to show that the first action caused the second.',
    sampleAnswer: 'She studied hard, so she passed the test.',
    keyWords: ['so'],
    explanation: '"So" shows cause and effect. Studying hard caused her to pass.',
    difficulty: 'beginner',
    type: 'conjunction',
  },
  {
    id: 'ex4',
    sentences: ['It was raining.', 'We stayed inside.'],
    instruction: 'Combine using BECAUSE',
    hint: 'Use "because" to explain the reason for staying inside.',
    sampleAnswer: 'We stayed inside because it was raining.',
    keyWords: ['because'],
    explanation: '"Because" introduces a reason. The rain was the reason for staying inside.',
    difficulty: 'beginner',
    type: 'conjunction',
  },
  {
    id: 'ex5',
    sentences: ['He was tired.', 'He went to bed early.'],
    instruction: 'Combine using SO',
    hint: 'Use "so" to connect being tired with going to bed early.',
    sampleAnswer: 'He was tired, so he went to bed early.',
    keyWords: ['so'],
    explanation: '"So" shows the result: being tired led to going to bed early.',
    difficulty: 'beginner',
    type: 'conjunction',
  },
  {
    id: 'ex6',
    sentences: ['The sun was shining.', 'The birds were singing.'],
    instruction: 'Combine using AND',
    hint: 'Use "and" to join these two pleasant observations.',
    sampleAnswer: 'The sun was shining and the birds were singing.',
    keyWords: ['and'],
    explanation: '"And" connects two simultaneous, positive observations about the scene.',
    difficulty: 'beginner',
    type: 'conjunction',
  },
  {
    id: 'ex7',
    sentences: ['I wanted to go outside.', 'It was too cold.'],
    instruction: 'Combine using BUT',
    hint: 'Use "but" to show the conflict between wanting to go out and the cold.',
    sampleAnswer: 'I wanted to go outside, but it was too cold.',
    keyWords: ['but'],
    explanation: '"But" highlights the contrast: desire versus the obstacle of cold weather.',
    difficulty: 'beginner',
    type: 'conjunction',
  },
  {
    id: 'ex8',
    sentences: ['She can play piano.', 'She can play guitar.'],
    instruction: 'Combine using BOTH...AND',
    hint: 'Use "both...and" to emphasize that she plays two instruments.',
    sampleAnswer: 'She can play both piano and guitar.',
    keyWords: ['both'],
    explanation: '"Both...and" is a correlative conjunction that emphasizes two equally true facts.',
    difficulty: 'beginner',
    type: 'conjunction',
  },

  // Intermediate (relative clauses, semicolons) - 7
  {
    id: 'ex9',
    sentences: ['The book was interesting.', 'I read it in one day.'],
    instruction: 'Combine using a relative clause (WHO/THAT)',
    hint: 'Start with "The book that..." or "The book which..."',
    sampleAnswer: 'The book that was interesting, I read in one day.',
    keyWords: ['which', 'that'],
    explanation: 'A relative clause with "that" or "which" gives more information about the noun. "That" is more common in American English.',
    difficulty: 'intermediate',
    type: 'relative-clause',
  },
  {
    id: 'ex10',
    sentences: ['The restaurant was expensive.', 'The food was excellent.'],
    instruction: 'Combine using ALTHOUGH',
    hint: 'Use "although" at the beginning or in the middle to show contrast.',
    sampleAnswer: 'Although the restaurant was expensive, the food was excellent.',
    keyWords: ['although', 'though'],
    explanation: '"Although" introduces a concessive clause, showing that despite the high price, the food quality was great.',
    difficulty: 'intermediate',
    type: 'conjunction',
  },
  {
    id: 'ex11',
    sentences: ['My sister is a doctor.', 'She works at the hospital.'],
    instruction: 'Combine using a relative clause',
    hint: 'Use "who" to give more information about your sister.',
    sampleAnswer: 'My sister, who is a doctor, works at the hospital.',
    keyWords: ['who', 'which', 'that'],
    explanation: 'A non-restrictive relative clause with "who" adds extra information about the subject.',
    difficulty: 'intermediate',
    type: 'relative-clause',
  },
  {
    id: 'ex12',
    sentences: ['The boy won the race.', 'He was very happy.'],
    instruction: 'Combine using a WHO clause',
    hint: 'Use "who" to connect the boy to his feeling of happiness.',
    sampleAnswer: 'The boy who won the race was very happy.',
    keyWords: ['who'],
    explanation: 'A restrictive relative clause with "who" identifies which boy was happy - the one who won.',
    difficulty: 'intermediate',
    type: 'relative-clause',
  },
  {
    id: 'ex13',
    sentences: ['We visited Paris.', 'It is the capital of France.'],
    instruction: 'Combine using a WHICH clause',
    hint: 'Use "which" to add information about Paris.',
    sampleAnswer: 'We visited Paris, which is the capital of France.',
    keyWords: ['which'],
    explanation: '"Which" introduces a non-restrictive relative clause adding background information about Paris.',
    difficulty: 'intermediate',
    type: 'relative-clause',
  },
  {
    id: 'ex14',
    sentences: ['The cake smelled delicious.', 'I could not resist it.'],
    instruction: 'Combine using a relative clause',
    hint: 'Try starting with "The cake, which..." or use "that".',
    sampleAnswer: 'The cake, which smelled delicious, could not be resisted by me.',
    keyWords: ['which', 'that'],
    explanation: 'A relative clause can describe the cake, making the sentence more descriptive and connected.',
    difficulty: 'intermediate',
    type: 'relative-clause',
  },
  {
    id: 'ex15',
    sentences: ['The teacher explained the concept.', 'Everyone understood.'],
    instruction: 'Combine using a connector',
    hint: 'Think about how the explanation led to understanding. Try "so", "and", or "since".',
    sampleAnswer: 'The teacher explained the concept, and everyone understood.',
    keyWords: ['so', 'and', 'since'],
    explanation: 'Multiple connectors can work here. The choice changes the nuance of the relationship between the clauses.',
    difficulty: 'intermediate',
    type: 'conjunction',
  },

  // Advanced (participle, appositive) - 5
  {
    id: 'ex16',
    sentences: ['The tiger was hungry.', 'It stalked its prey through the tall grass.'],
    instruction: 'Combine using a participial phrase',
    hint: 'Turn "was hungry" into a participial phrase: "Hungry, the tiger..." or "Being hungry, the tiger..."',
    sampleAnswer: 'Hungry, the tiger stalked its prey through the tall grass.',
    keyWords: ['stalking', 'hungry'],
    explanation: 'A participial phrase uses a present or past participle to modify the subject. "Hungry" acts as an adjective/participle here.',
    difficulty: 'advanced',
    type: 'participle',
  },
  {
    id: 'ex17',
    sentences: ['Marie Curie was a great scientist.', 'She discovered radium.'],
    instruction: 'Combine using an appositive',
    hint: 'An appositive renames or describes a noun. Try: "Marie Curie, a great scientist, ..."',
    sampleAnswer: 'Marie Curie, a great scientist, discovered radium.',
    keyWords: ['curie', 'scientist'],
    explanation: 'An appositive is a noun phrase that renames another noun. "A great scientist" renames Marie Curie.',
    difficulty: 'advanced',
    type: 'appositive',
  },
  {
    id: 'ex18',
    sentences: ['The storm destroyed the village.', 'The villagers had to rebuild.'],
    instruction: 'Combine using a participial phrase',
    hint: 'Turn "destroyed" into a participial phrase: "Having destroyed..." or "Destroying..."',
    sampleAnswer: 'Having destroyed the village, the storm left the villagers to rebuild.',
    keyWords: ['destroying', 'destroyed', 'having'],
    explanation: '"Having destroyed" is a perfect participial phrase showing the storm\'s action happened before the villagers needed to rebuild.',
    difficulty: 'advanced',
    type: 'participle',
  },
  {
    id: 'ex19',
    sentences: ['Shakespeare was a famous playwright.', 'He wrote Hamlet.'],
    instruction: 'Combine using an appositive',
    hint: 'Place the description of Shakespeare as an appositive: "Shakespeare, a famous playwright, ..."',
    sampleAnswer: 'Shakespeare, a famous playwright, wrote Hamlet.',
    keyWords: ['shakespeare', 'playwright', 'hamlet'],
    explanation: 'The appositive "a famous playwright" provides identifying information about Shakespeare within the same sentence.',
    difficulty: 'advanced',
    type: 'appositive',
  },
  {
    id: 'ex20',
    sentences: ['The athlete trained for years.', 'She finally won the gold medal.'],
    instruction: 'Combine the sentences',
    hint: 'Try using "after training" or "having trained" to show the sequence of events.',
    sampleAnswer: 'After training for years, the athlete finally won the gold medal.',
    keyWords: ['after', 'having', 'training'],
    explanation: 'Using "after" with a gerund or a participial phrase effectively shows the chronological relationship between training and winning.',
    difficulty: 'advanced',
    type: 'participle',
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
    background: active ? 'rgba(5,150,105,0.15)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
    border: active ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
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
// Utility: shuffle array
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
// Props
// ============================================================

interface SentenceCombiningProps {
  isDark: boolean
  config: SentenceCombiningConfig
  onConfigChange: (patch: Partial<SentenceCombiningConfig>) => void
  compact?: boolean
}

// ============================================================
// Component
// ============================================================

export function SentenceCombiningWidget({ isDark, config, onConfigChange, compact }: SentenceCombiningProps) {
  const s = sh(isDark)
  const [shuffledSeeds, setShuffledSeeds] = useState<number[]>(() =>
    BUILT_IN_EXERCISES.map((_, i) => i)
  )

  // Get all exercises: built-in + custom
  const allExercises = useMemo(() => {
    return BUILT_IN_EXERCISES.concat(config.customExercises)
  }, [config.customExercises])

  // Filter by difficulty
  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      const matchDifficulty = config.difficulty === ex.difficulty
      return matchDifficulty
    })
  }, [allExercises, config.difficulty])

  // Apply shuffle order
  const exercises = useMemo(() => {
    return filteredExercises.map((_, i) => {
      const seedIdx = shuffledSeeds[i % shuffledSeeds.length]
      return filteredExercises[seedIdx % filteredExercises.length]
    }).filter((ex, idx, arr) => arr.indexOf(ex) === idx)
  }, [filteredExercises, shuffledSeeds])

  const currentExercise = exercises[config.exerciseIdx] || null

  // Check answer: all keyWords must appear in the answer (case-insensitive)
  const checkAnswer = useCallback(() => {
    if (!currentExercise || !config.studentAnswer.trim()) return
    const answerLower = config.studentAnswer.toLowerCase()
    const allMatch = currentExercise.keyWords.every((kw) =>
      answerLower.indexOf(kw.toLowerCase()) !== -1
    )
    const newScore = allMatch ? config.score + 1 : config.score
    const newTotal = config.totalAttempted + 1
    onConfigChange({
      checked: true,
      score: newScore,
      totalAttempted: newTotal,
    })
  }, [currentExercise, config.studentAnswer, config.score, config.totalAttempted, onConfigChange])

  const goToExercise = useCallback(
    (idx: number) => {
      onConfigChange({
        exerciseIdx: idx,
        checked: false,
        studentAnswer: '',
        showHint: false,
      })
    },
    [onConfigChange]
  )

  const nextExercise = useCallback(() => {
    if (config.exerciseIdx < exercises.length - 1) {
      goToExercise(config.exerciseIdx + 1)
    }
  }, [config.exerciseIdx, exercises.length, goToExercise])

  const prevExercise = useCallback(() => {
    if (config.exerciseIdx > 0) {
      goToExercise(config.exerciseIdx - 1)
    }
  }, [config.exerciseIdx, goToExercise])

  const handleShuffle = useCallback(() => {
    const seeds = allExercises.map((_, i) => i)
    for (let i = seeds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = seeds[i]
      seeds[i] = seeds[j]
      seeds[j] = tmp
    }
    setShuffledSeeds(seeds)
    onConfigChange({ exerciseIdx: 0, checked: false, studentAnswer: '', showHint: false })
  }, [allExercises, onConfigChange])

  const addCustomExercise = useCallback(() => {
    if (!config.teacherSentences.trim()) return
    const sentences = config.teacherSentences
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    if (sentences.length < 2) return
    const newEx: SentenceCombiningExercise = {
      id: 'custom-' + Date.now(),
      sentences: sentences,
      instruction: config.teacherHint ? 'Hint: ' + config.teacherHint : 'Combine the sentences',
      hint: config.teacherHint,
      sampleAnswer: config.teacherSampleAnswer,
      keyWords: config.teacherSampleAnswer
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3)
        .slice(0, 5),
      explanation: config.teacherExplanation,
      difficulty: config.difficulty,
      type: 'conjunction',
    }
    onConfigChange({
      customExercises: config.customExercises.concat([newEx]),
      teacherSentences: '',
      teacherHint: '',
      teacherSampleAnswer: '',
      teacherExplanation: '',
    })
  }, [config, onConfigChange])

  const isCorrect =
    config.checked && currentExercise
      ? currentExercise.keyWords.every(
          (kw) => config.studentAnswer.toLowerCase().indexOf(kw.toLowerCase()) !== -1
        )
      : false

  // ============================================================
  // Render
  // ============================================================

  const w = compact ? 340 : 380
  //------------------------------------------------------------------------------
  // TEACHER MODE
  // ------------------------------------------------------------------------------
  if (config.mode === 'teacher') {
    return (
      <div
        style={{
          width: w,
          height: 520,
          background: s.bg,
          border: '1px solid ' + s.border,
          borderRadius: 8,
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>
            {'Sentence Combining - Teacher Mode'}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
              <button
                key={d}
                style={s.btn(config.difficulty === d)}
                onClick={() => onConfigChange({ difficulty: d })}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            height: 1,
            background: s.border,
            width: '100%',
          }}
        />

        {/* Instructions */}
        <span style={{ fontSize: 10, color: s.text }}>
          {'Enter each sentence on a new line (minimum 2). The sample answer keywords will be auto-extracted.'}
        </span>

        {/* Sentences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, color: s.text, fontWeight: 600 }}>{'Sentences (one per line):'}</label>
          <textarea
            value={config.teacherSentences}
            onChange={(e) => onConfigChange({ teacherSentences: e.target.value })}
            placeholder={'Sentence 1\nSentence 2\nSentence 3'}
            style={{
              ...s.input,
              minHeight: 56,
              resize: 'vertical' as const,
              fontFamily: 'inherit',
              width: '100%',
              boxSizing: 'border-box' as const,
            }}
          />
        </div>

        {/* Hint */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, color: s.text, fontWeight: 600 }}>{'Hint (optional):'}</label>
          <input
            value={config.teacherHint}
            onChange={(e) => onConfigChange({ teacherHint: e.target.value })}
            placeholder={'e.g., Use a relative clause with "who"'}
            style={{ ...s.input, width: '100%', boxSizing: 'border-box' as const }}
          />
        </div>

        {/* Sample Answer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, color: s.text, fontWeight: 600 }}>{'Sample Answer:'}</label>
          <input
            value={config.teacherSampleAnswer}
            onChange={(e) => onConfigChange({ teacherSampleAnswer: e.target.value })}
            placeholder={'The combined sentence...'}
            style={{ ...s.input, width: '100%', boxSizing: 'border-box' as const }}
          />
        </div>

        {/* Explanation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, color: s.text, fontWeight: 600 }}>{'Explanation (optional):'}</label>
          <input
            value={config.teacherExplanation}
            onChange={(e) => onConfigChange({ teacherExplanation: e.target.value })}
            placeholder={'Why this combination works...'}
            style={{ ...s.input, width: '100%', boxSizing: 'border-box' as const }}
          />
        </div>

        {/* Add Button */}
        <button style={s.btnPrimary} onClick={addCustomExercise}>
          {'+ Add Exercise'}
        </button>

        {/* Custom exercises count */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 10, color: s.text }}>
            {config.customExercises.length + ' custom exercises created'}
          </span>
        </div>

        {/* Mode Switch */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          <button style={s.btn((config.mode as string) === 'student')} onClick={() => onConfigChange({ mode: 'student' })}>
            {'Student Mode'}
          </button>
        </div>
      </div>
    )
  }

  // --------------------------------------------------------------------------------------
  // STUDENT MODE
  // --------------------------------------------------------------------------------------
  const difficultyLabel = config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1)

  return (
    <div
      style={{
        width: w,
        height: 520,
        background: s.bg,
        border: '1px solid ' + s.border,
        borderRadius: 8,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>
          {'Sentence Combining'}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={s.btn((config.mode as string) === 'teacher')} onClick={() => onConfigChange({ mode: 'teacher' })}>
            {'Teacher'}
          </button>
        </div>
      </div>

      {/* Score & Difficulty */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: s.text }}>
          {'Score: ' + config.score + '/' + config.totalAttempted}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
            <button
              key={d}
              style={s.btn(config.difficulty === d)}
              onClick={() =>
                onConfigChange({ difficulty: d, exerciseIdx: 0, checked: false, studentAnswer: '', showHint: false })
              }
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          height: 1,
          background: s.border,
          width: '100%',
        }}
      />

      {/* Exercise content */}
      {!currentExercise ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 11, color: s.text }}>{'No exercises for ' + difficultyLabel + ' difficulty.'}</span>
          <button style={s.btnPrimary} onClick={handleShuffle}>
            {'Shuffle & Reset'}
          </button>
        </div>
      ) : (
        <>
          {/* Exercise counter & type badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: s.text }}>
              {config.exerciseIdx + 1 + ' / ' + exercises.length}
            </span>
            <span
              style={{
                fontSize: 9,
                padding: '2px 6px',
                borderRadius: 3,
                background: 'rgba(5,150,105,0.1)',
                color: '#34d399',
                border: '1px solid rgba(5,150,105,0.2)',
              }}
            >
              {currentExercise.type.replace('-', ' ').toUpperCase()}
            </span>
          </div>

          {/* Instruction */}
          <div
            style={{
              padding: '6px 8px',
              borderRadius: 5,
              background: 'rgba(5,150,105,0.08)',
              border: '1px solid rgba(5,150,105,0.15)',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399' }}>
              {currentExercise.instruction}
            </span>
          </div>

          {/* Source sentences */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {currentExercise.sentences.map((sentence, i) => (
              <div
                key={i}
                style={{
                  padding: '5px 8px',
                  borderRadius: 4,
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: s.text,
                    minWidth: 14,
                    paddingTop: 1,
                  }}
                >
                  {String(i + 1) + '.'}
                </span>
                <span style={{ fontSize: 11, color: s.bright, lineHeight: 1.4 }}>{sentence}</span>
              </div>
            ))}
          </div>

          {/* Student Answer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: 10, color: s.text, fontWeight: 600 }}>{'Your combined sentence:'}</label>
            <textarea
              value={config.studentAnswer}
              onChange={(e) => onConfigChange({ studentAnswer: e.target.value })}
              placeholder={'Type your answer here...'}
              disabled={config.checked}
              style={{
                ...s.input,
                minHeight: 48,
                resize: 'none' as const,
                fontFamily: 'inherit',
                width: '100%',
                boxSizing: 'border-box' as const,
                opacity: config.checked ? 0.7 : 1,
              }}
            />
          </div>

          {/* Hint */}
          {config.showHint && currentExercise.hint && (
            <div
              style={{
                padding: '5px 8px',
                borderRadius: 4,
                background: 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.2)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 10, color: '#fbbf24', flexShrink: 0 }}>{'Hint:'}</span>
              <span style={{ fontSize: 10, color: s.text, lineHeight: 1.4 }}>{currentExercise.hint}</span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {!config.checked ? (
              <>
                <button
                  style={s.btnPrimary}
                  onClick={checkAnswer}
                  disabled={!config.studentAnswer.trim()}
                >
                  {'Check'}
                </button>
                <button
                  style={s.btn(config.showHint)}
                  onClick={() => onConfigChange({ showHint: !config.showHint })}
                >
                  {'Hint'}
                </button>
              </>
            ) : (
              <button style={s.btnPrimary} onClick={nextExercise}>
                {'Next'}
              </button>
            )}
          </div>

          {/* Feedback after check */}
          {config.checked && currentExercise && (
            <div
              style={{
                flex: 1,
                overflowY: 'auto' as const,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {/* Result indicator */}
              <div
                style={{
                  padding: '5px 8px',
                  borderRadius: 4,
                  background: isCorrect
                    ? 'rgba(5,150,105,0.1)'
                    : 'rgba(239,68,68,0.1)',
                  border: isCorrect
                    ? '1px solid rgba(5,150,105,0.25)'
                    : '1px solid rgba(239,68,68,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isCorrect ? '#34d399' : '#f87171',
                  }}
                >
                  {isCorrect ? '\u2713 Correct!' : '\u2717 Not quite'}
                </span>
              </div>

              {/* Missing keywords */}
              {!isCorrect && (
                <div style={{ padding: '4px 8px' }}>
                  <span style={{ fontSize: 10, color: '#f87171', fontWeight: 600 }}>{'Missing keywords: '}</span>
                  <span style={{ fontSize: 10, color: s.text }}>
                    {currentExercise.keyWords
                      .filter((kw) => config.studentAnswer.toLowerCase().indexOf(kw.toLowerCase()) === -1)
                      .join(', ')}
                  </span>
                </div>
              )}

              {/* Sample answer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: s.bright }}>{'Sample Answer:'}</span>
                <span style={{ fontSize: 10, color: s.text, lineHeight: 1.4 }}>
                  {currentExercise.sampleAnswer}
                </span>
              </div>

              {/* Explanation */}
              {currentExercise.explanation && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: s.bright }}>{'Explanation:'}</span>
                  <span style={{ fontSize: 10, color: s.text, lineHeight: 1.4 }}>
                    {currentExercise.explanation}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Navigation footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 4,
              borderTop: '1px solid ' + s.border,
            }}
          >
            <button
              style={{
                ...s.btn(false),
                opacity: config.exerciseIdx === 0 ? 0.3 : 1,
              }}
              onClick={prevExercise}
              disabled={config.exerciseIdx === 0}
            >
              {'\u2190 Prev'}
            </button>
            <button style={s.btn(false)} onClick={handleShuffle}>
              {'Shuffle'}
            </button>
            <button
              style={{
                ...s.btn(false),
                opacity: config.exerciseIdx >= exercises.length - 1 ? 0.3 : 1,
              }}
              onClick={nextExercise}
              disabled={config.exerciseIdx >= exercises.length - 1}
            >
              {'Next \u2192'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
