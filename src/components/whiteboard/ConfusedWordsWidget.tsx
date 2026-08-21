'use client'

import React, { useMemo, useCallback } from 'react'

// ============================================================
// Types
// ============================================================

export interface ConfusedWordExercise {
  id: string
  question: string
  options: [string, string, string, string]
  correctIndex: number
  explanation: string
  wordPair: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface ConfusedWordsConfig {
  mode: 'student' | 'teacher'
  exerciseIdx: number
  selected: number | null
  checked: boolean
  score: number
  totalAttempted: number
  difficulty: 'easy' | 'medium' | 'hard'
  teacherQuestion: string
  teacherOptions: [string, string, string, string]
  teacherCorrect: number
  teacherExplanation: string
  customExercises: ConfusedWordExercise[]
}

export const DEFAULT_CONFUSED_WORDS_CONFIG: ConfusedWordsConfig = {
  mode: 'student',
  exerciseIdx: 0,
  selected: null,
  checked: false,
  score: 0,
  totalAttempted: 0,
  difficulty: 'easy',
  teacherQuestion: '',
  teacherOptions: ['', '', '', ''],
  teacherCorrect: 0,
  teacherExplanation: '',
  customExercises: [],
}

export interface ConfusedWordsProps {
  isDark: boolean
  config: ConfusedWordsConfig
  onConfigChange: (patch: Partial<ConfusedWordsConfig>) => void
  compact?: boolean
}

// ============================================================
// Embedded Exercises
// ============================================================

const CONFUSED_WORDS_EXERCISES: ConfusedWordExercise[] = [
  // === their / there / they're ===
  {
    id: 'cw-01',
    question: '___ going to the park after school.',
    options: ['Their', 'There', "They're", 'Thier'],
    correctIndex: 2,
    explanation: '"They\'re" is a contraction of "they are". The sentence needs "they are going", so "they\'re" is correct.',
    wordPair: 'their/there/they\'re',
    difficulty: 'easy',
  },
  {
    id: 'cw-02',
    question: 'The dog chased ___ tail round and round.',
    options: ['its', "it's", 'their', "they're"],
    correctIndex: 2,
    explanation: '"Their" is the possessive form showing the tail belongs to the dog. "It\'s" is a contraction of "it is".',
    wordPair: 'their/there/they\'re',
    difficulty: 'easy',
  },
  {
    id: 'cw-03',
    question: 'Please put the book over ___.',
    options: ['their', "they're", 'there', 'thier'],
    correctIndex: 2,
    explanation: '"There" refers to a place or location. "Over there" means in that location.',
    wordPair: 'their/there/they\'re',
    difficulty: 'easy',
  },
  {
    id: 'cw-04',
    question: 'Which sentence is correct?',
    options: [
      'Their going to the cinema tonight.',
      'There going to the cinema tonight.',
      "They're going to the cinema tonight.",
      'Thier going to the cinema tonight.',
    ],
    correctIndex: 2,
    explanation: '"They\'re" = "they are", which is grammatically correct. "Their" is possessive and "there" is a place/adverb.',
    wordPair: 'their/there/they\'re',
    difficulty: 'hard',
  },
  // === your / you're ===
  {
    id: 'cw-05',
    question: 'Is this ___ jacket?',
    options: ['your', "you're", 'youre', 'yore'],
    correctIndex: 0,
    explanation: '"Your" is the possessive form, meaning "belonging to you". "You\'re" means "you are".',
    wordPair: 'your/you\'re',
    difficulty: 'easy',
  },
  {
    id: 'cw-06',
    question: '___ the best student in the class!',
    options: ['Your', "You're", 'Yore', 'Youre'],
    correctIndex: 1,
    explanation: '"You\'re" is a contraction of "you are". The sentence means "You are the best student!"',
    wordPair: 'your/you\'re',
    difficulty: 'easy',
  },
  {
    id: 'cw-07',
    question: '___ welcome to stay as long as ___ here.',
    options: ['Your / you\'re', "You're / your", 'Your / your', "You're / you're"],
    correctIndex: 0,
    explanation: '"Your" (possessive) + "you\'re" (you are). "You are welcome" and "as long as your [stay]" is wrong context.',
    wordPair: 'your/you\'re',
    difficulty: 'hard',
  },
  // === its / it's ===
  {
    id: 'cw-08',
    question: 'The cat licked ___ paws and went to sleep.',
    options: ['its', "it's", 'it\'s', 'its\''],
    correctIndex: 0,
    explanation: '"Its" (no apostrophe) is the possessive form. The paws belong to the cat.',
    wordPair: 'its/it\'s',
    difficulty: 'easy',
  },
  {
    id: 'cw-09',
    question: '___ a beautiful day for a picnic!',
    options: ['Its', "It's", 'Its\'', 'Its,'],
    correctIndex: 1,
    explanation: '"It\'s" is a contraction of "it is". The sentence means "It is a beautiful day!"',
    wordPair: 'its/it\'s',
    difficulty: 'easy',
  },
  {
    id: 'cw-10',
    question: 'The tree lost all of ___ leaves in autumn.',
    options: ["it's", 'its', 'its\'', 'it is'],
    correctIndex: 1,
    explanation: '"Its" (no apostrophe) shows possession. The leaves belong to the tree.',
    wordPair: 'its/it\'s',
    difficulty: 'medium',
  },
  // === affect / effect ===
  {
    id: 'cw-11',
    question: 'The cold weather will ___ the crops.',
    options: ['affect', 'effect', 'affekt', 'efect'],
    correctIndex: 0,
    explanation: '"Affect" is a verb meaning to influence. "Effect" is usually a noun meaning a result.',
    wordPair: 'affect/effect',
    difficulty: 'medium',
  },
  {
    id: 'cw-12',
    question: 'The new law had a positive ___ on the community.',
    options: ['affect', 'effect', 'affekt', 'efect'],
    correctIndex: 1,
    explanation: '"Effect" is a noun here, meaning "a result or outcome". The law produced a result.',
    wordPair: 'affect/effect',
    difficulty: 'medium',
  },
  {
    id: 'cw-13',
    question: 'Which sentence uses the correct word?',
    options: [
      'The medicine had no affect on him.',
      'The medicine had no effect on him.',
      'The medicine affected no effect on him.',
      'The medicine effected no affect on him.',
    ],
    correctIndex: 1,
    explanation: '"Effect" as a noun means result. "No effect" = no result. "Affect" is a verb.',
    wordPair: 'affect/effect',
    difficulty: 'hard',
  },
  // === whose / who's ===
  {
    id: 'cw-14',
    question: '___ book is this on the table?',
    options: ['Whose', "Who's", 'Whos', 'Hoose'],
    correctIndex: 0,
    explanation: '"Whose" is the possessive form, asking about ownership. "Who\'s" means "who is".',
    wordPair: 'whose/who\'s',
    difficulty: 'easy',
  },
  {
    id: 'cw-15',
    question: '___ coming to the party tonight?',
    options: ['Whose', "Who's", 'Whos', 'Whoes'],
    correctIndex: 1,
    explanation: '"Who\'s" is a contraction of "who is". The sentence asks "Who is coming?"',
    wordPair: 'whose/who\'s',
    difficulty: 'medium',
  },
  // === to / too / two ===
  {
    id: 'cw-16',
    question: 'I have ___ brothers and ___ sisters.',
    options: ['to / to', 'too / too', 'two / two', 'two / to'],
    correctIndex: 2,
    explanation: '"Two" is the number 2. Both blanks need the number word.',
    wordPair: 'to/too/two',
    difficulty: 'easy',
  },
  {
    id: 'cw-17',
    question: 'This soup is ___ hot ___ eat right now.',
    options: ['to / to', 'too / to', 'two / too', 'to / too'],
    correctIndex: 1,
    explanation: '"Too" means excessively. "Too hot to eat" = so hot that eating is not possible.',
    wordPair: 'to/too/two',
    difficulty: 'medium',
  },
  // === hear / here ===
  {
    id: 'cw-18',
    question: 'I can ___ the birds singing in the garden.',
    options: ['here', 'hear', 'hier', 'heer'],
    correctIndex: 1,
    explanation: '"Hear" means to perceive sound with your ears. "Here" refers to a place.',
    wordPair: 'hear/here',
    difficulty: 'easy',
  },
  {
    id: 'cw-19',
    question: 'Come ___ and sit down next to me.',
    options: ['hear', 'here', 'heer', 'hier'],
    correctIndex: 1,
    explanation: '"Here" refers to this place. "Come here" means come to this location.',
    wordPair: 'hear/here',
    difficulty: 'easy',
  },
  // === write / right ===
  {
    id: 'cw-20',
    question: 'Please ___ your name at the top of the page.',
    options: ['right', 'write', 'wright', 'rite'],
    correctIndex: 1,
    explanation: '"Write" means to put words on paper. "Right" means correct or a direction.',
    wordPair: 'write/right',
    difficulty: 'easy',
  },
  {
    id: 'cw-21',
    question: 'Turn ___ at the next traffic light.',
    options: ['write', 'wright', 'right', 'rite'],
    correctIndex: 2,
    explanation: '"Right" means the direction (opposite of left). "Write" means to put words on paper.',
    wordPair: 'write/right',
    difficulty: 'easy',
  },
  // === accept / except ===
  {
    id: 'cw-22',
    question: 'Everyone was invited ___ for Sam, who was sick.',
    options: ['accept', 'except', 'acscept', 'exsept'],
    correctIndex: 1,
    explanation: '"Except" means "not including" or "but". Everyone was invited but not Sam.',
    wordPair: 'accept/except',
    difficulty: 'medium',
  },
  {
    id: 'cw-23',
    question: 'She decided to ___ the job offer.',
    options: ['except', 'accept', 'ascept', 'exsept'],
    correctIndex: 1,
    explanation: '"Accept" means to receive or agree to something. She agreed to take the job.',
    wordPair: 'accept/except',
    difficulty: 'medium',
  },
  // === loose / lose ===
  {
    id: 'cw-24',
    question: 'Be careful not to ___ your keys!',
    options: ['loose', 'lose', 'loos', 'luze'],
    correctIndex: 1,
    explanation: '"Lose" is a verb meaning to misplace or fail to win. "Loose" means not tight.',
    wordPair: 'loose/lose',
    difficulty: 'medium',
  },
  {
    id: 'cw-25',
    question: 'The dog managed to break ___ from its leash.',
    options: ['lose', 'loose', 'loos', 'luze'],
    correctIndex: 1,
    explanation: '"Loose" means free or not firmly fixed. "Break loose" = break free.',
    wordPair: 'loose/lose',
    difficulty: 'medium',
  },
  // === then / than ===
  {
    id: 'cw-26',
    question: 'I would rather read a book ___ watch television.',
    options: ['then', 'than', 'thenn', 'thain'],
    correctIndex: 1,
    explanation: '"Than" is used for comparisons. "Rather...than" = prefer one thing over another.',
    wordPair: 'then/than',
    difficulty: 'medium',
  },
  {
    id: 'cw-27',
    question: 'We ate dinner, and ___ we went for a walk.',
    options: ['than', 'then', 'thain', 'thenn'],
    correctIndex: 1,
    explanation: '"Then" refers to time or sequence. "First we ate, then we walked."',
    wordPair: 'then/than',
    difficulty: 'medium',
  },
  // === weather / whether ===
  {
    id: 'cw-28',
    question: 'I am not sure ___ it will rain tomorrow.',
    options: ['weather', 'whether', 'wether', 'waether'],
    correctIndex: 1,
    explanation: '"Whether" introduces a choice or doubt. "Whether or not it will rain".',
    wordPair: 'weather/whether',
    difficulty: 'medium',
  },
  {
    id: 'cw-29',
    question: 'The ___ was sunny and warm all week.',
    options: ['whether', 'wether', 'weather', 'waether'],
    correctIndex: 2,
    explanation: '"Weather" refers to atmospheric conditions (rain, sun, temperature, etc.).',
    wordPair: 'weather/whether',
    difficulty: 'medium',
  },
  // === principle / principal ===
  {
    id: 'cw-30',
    question: 'The school ___ gave a speech at the assembly.',
    options: ['principle', 'principal', 'prinsiple', 'prinsipal'],
    correctIndex: 1,
    explanation: '"Principal" can mean the head of a school. "Principle" means a rule or belief.',
    wordPair: 'principle/principal',
    difficulty: 'hard',
  },
  {
    id: 'cw-31',
    question: 'She refused to compromise on her ___.',
    options: ['principal', 'principle', 'prinsipal', 'prinsiple'],
    correctIndex: 1,
    explanation: '"Principle" means a fundamental truth, belief, or rule of conduct.',
    wordPair: 'principle/principal',
    difficulty: 'hard',
  },
  // === compliment / complement ===
  {
    id: 'cw-32',
    question: 'The wine is a perfect ___ to this cheese.',
    options: ['compliment', 'complement', 'complimint', 'complemint'],
    correctIndex: 1,
    explanation: '"Complement" means something that completes or goes well with something else.',
    wordPair: 'compliment/complement',
    difficulty: 'hard',
  },
  {
    id: 'cw-33',
    question: 'He gave her a nice ___ on her painting.',
    options: ['complement', 'compliment', 'complemint', 'complimint'],
    correctIndex: 1,
    explanation: '"Compliment" means a polite expression of praise or admiration.',
    wordPair: 'compliment/complement',
    difficulty: 'hard',
  },
  // === dessert / desert ===
  {
    id: 'cw-34',
    question: 'After dinner, we had chocolate cake for ___.',
    options: ['desert', 'dessert', 'desart', 'dessart'],
    correctIndex: 1,
    explanation: '"Dessert" (with two s\'s) is the sweet course after a meal. "Desert" is a dry region.',
    wordPair: 'dessert/desert',
    difficulty: 'medium',
  },
  {
    id: 'cw-35',
    question: 'The Sahara is the largest hot ___ in the world.',
    options: ['dessert', 'desert', 'desart', 'dessart'],
    correctIndex: 1,
    explanation: '"Desert" (one s) is a dry, sandy region. "Dessert" (two s\'s) is a sweet treat.',
    wordPair: 'dessert/desert',
    difficulty: 'medium',
  },
  // === quiet / quite ===
  {
    id: 'cw-36',
    question: 'The library was very ___ during the exam period.',
    options: ['quite', 'quiet', 'qiet', 'quight'],
    correctIndex: 1,
    explanation: '"Quiet" means silent or with little noise. "Quite" means very or completely.',
    wordPair: 'quiet/quite',
    difficulty: 'medium',
  },
  {
    id: 'cw-37',
    question: 'That was ___ an impressive performance!',
    options: ['quiet', 'quite', 'qiet', 'quight'],
    correctIndex: 1,
    explanation: '"Quite" is an adverb meaning very or entirely. "Quite impressive" = very impressive.',
    wordPair: 'quiet/quite',
    difficulty: 'medium',
  },
  // Extra hard questions
  {
    id: 'cw-38',
    question: 'Which sentence is correct?',
    options: [
      'Their are many reasons to be happy.',
      'There are many reasons to be happy.',
      "They're are many reasons to be happy.",
      'Thier are many reasons to be happy.',
    ],
    correctIndex: 1,
    explanation: '"There" is used with the verb "are" as a dummy subject (there is/are). "Their" is possessive.',
    wordPair: 'their/there/they\'re',
    difficulty: 'hard',
  },
  {
    id: 'cw-39',
    question: 'Which sentence is correct?',
    options: [
      'The affects of the storm were devastating.',
      'The effects of the storm were devastating.',
      'The effcts of the storm were devastating.',
      'The affekts of the storm were devastating.',
    ],
    correctIndex: 1,
    explanation: '"Effects" (noun) means results. The storm\'s results were devastating.',
    wordPair: 'affect/effect',
    difficulty: 'hard',
  },
  {
    id: 'cw-40',
    question: 'Which sentence is correct?',
    options: [
      'Its going to be a great day tomorrow.',
      "It's going to be a great day tomorrow.",
      'Its\' going to be a great day tomorrow.',
      'It is\'s going to be a great day tomorrow.',
    ],
    correctIndex: 1,
    explanation: '"It\'s" = "It is". The sentence needs "It is going to be".',
    wordPair: 'its/it\'s',
    difficulty: 'hard',
  },
]

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
// Shuffle helper
// ============================================================

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
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

export function ConfusedWordsWidget({ isDark, config, onConfigChange, compact }: ConfusedWordsProps) {
  const s = sh(isDark)
  const fs = compact ? 10 : 11

  if (config.mode === 'student') {
    return <StudentMode isDark={isDark} config={config} onConfigChange={onConfigChange} fs={fs} s={s} compact={!!compact} />
  }
  return <TeacherMode isDark={isDark} config={config} onConfigChange={onConfigChange} fs={fs} s={s} compact={!!compact} />
}

// ============================================================
// Student Mode
// ============================================================

function StudentMode({ isDark, config, onConfigChange, fs, s, compact }: {
  isDark: boolean
  config: ConfusedWordsConfig
  onConfigChange: (p: Partial<ConfusedWordsConfig>) => void
  fs: number
  s: ReturnType<typeof sh>
  compact: boolean
}) {
  const allExercises = useMemo(() => {
    return [...CONFUSED_WORDS_EXERCISES, ...config.customExercises]
  }, [config.customExercises])

  const filteredExercises = useMemo(() => {
    if (config.difficulty === 'easy') return allExercises.filter(e => e.difficulty === 'easy')
    if (config.difficulty === 'medium') return allExercises.filter(e => e.difficulty === 'medium')
    if (config.difficulty === 'hard') return allExercises.filter(e => e.difficulty === 'hard')
    return allExercises
  }, [allExercises, config.difficulty])

  const currentExercise = useMemo((): ConfusedWordExercise | null => {
    if (filteredExercises.length === 0) return null
    const idx = config.exerciseIdx % filteredExercises.length
    return filteredExercises[idx] || null
  }, [filteredExercises, config.exerciseIdx])

  const isCorrect = config.checked && config.selected !== null && currentExercise !== null && config.selected === currentExercise.correctIndex

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
    onConfigChange({
      exerciseIdx: 0,
      selected: null,
      checked: false,
      score: 0,
      totalAttempted: 0,
      customExercises: shuffleArray(config.customExercises),
    })
  }, [config.customExercises, onConfigChange])

  const handleDifficultyChange = useCallback((d: 'easy' | 'medium' | 'hard') => {
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
    if (d === 'easy') return '#4ade80'
    if (d === 'medium') return '#facc15'
    return '#f87171'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={() => onConfigChange({ mode: 'student' })} style={{
            ...s.btn(true), padding: '2px 6px', fontSize: 9, fontWeight: 700 as const,
          }}>Practice</button>
          <button onClick={() => onConfigChange({ mode: 'teacher' })} style={{
            ...s.btn(false), padding: '2px 6px', fontSize: 9,
          }}>Author</button>
        </div>
        <div style={{ fontSize: 9, color: s.text }}>
          {displayIndex}/{totalExercises} | Score: {config.score}/{config.totalAttempted}
        </div>
      </div>

      {/* Filters */}
      {!compact && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '4px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 8, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Difficulty:</span>
            {(['easy', 'medium', 'hard'] as const).map(d => (
              <button key={d} onClick={() => handleDifficultyChange(d)} style={{
                ...s.btn(config.difficulty === d), fontSize: 8, padding: '1px 5px',
                border: config.difficulty === d ? '1px solid ' + diffColor(d) + '60' : undefined,
                color: config.difficulty === d ? diffColor(d) : undefined,
                background: config.difficulty === d ? diffColor(d) + '18' : undefined,
              }}>{d.charAt(0).toUpperCase() + d.slice(1)}</button>
            ))}
            <span style={{ fontSize: 8, color: s.text, margin: '0 2px' }}>|</span>
            <button onClick={handleShuffle} style={{ ...s.btn(false), fontSize: 8, padding: '1px 6px' }}>
              Shuffle
            </button>
          </div>
        </div>
      )}

      {/* Exercise */}
      {!currentExercise ? (
        <div style={{ padding: 20, textAlign: 'center' as const, color: s.text, fontSize: fs }}>
          No exercises available for this difficulty. Try a different level.
        </div>
      ) : (
        <React.Fragment>
          {/* Question */}
          <div style={{
            padding: '8px 10px', borderRadius: 6, background: s.bg,
            border: '1px solid ' + s.border, fontSize: fs + 1, lineHeight: 1.5, color: s.bright,
          }}>
            <div style={{ fontSize: 8, fontWeight: 700 as const, color: diffColor(currentExercise.difficulty), textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 3 }}>
              {currentExercise.wordPair} | {currentExercise.difficulty}
            </div>
            {currentExercise.question}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {currentExercise.options.map((opt, i) => {
              const isSel = config.selected === i
              const showCorrect = config.checked && i === currentExercise.correctIndex
              const showWrong = config.checked && isSel && i !== currentExercise.correctIndex
              return (
                <button key={i} onClick={() => handleSelect(i)} style={{
                  padding: '5px 8px', borderRadius: 5, fontSize: fs, cursor: 'pointer' as const,
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

          {/* Check / Next */}
          <div style={{ display: 'flex', gap: 4 }}>
            {!config.checked && (
              <button onClick={handleCheck} disabled={config.selected === null} style={{
                ...s.btnPrimary, opacity: config.selected === null ? 0.5 : 1, fontSize: fs,
              }}>Check</button>
            )}
            {config.checked && (
              <button onClick={handleNext} style={{ ...s.btnPrimary, fontSize: fs }}>Next</button>
            )}
          </div>

          {/* Feedback */}
          {config.checked && currentExercise && (
            <div style={{
              padding: '6px 8px', borderRadius: 5, fontSize: fs - 1, lineHeight: 1.5,
              background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: '1px solid ' + (isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'),
            }}>
              <div style={{ fontWeight: 700 as const, color: isCorrect ? '#4ade80' : '#f87171', marginBottom: 2 }}>
                {isCorrect ? 'Correct!' : 'Not quite.'}
              </div>
              <div style={{ color: s.bright }}>
                {currentExercise.explanation}
              </div>
              {!isCorrect && (
                <div style={{ marginTop: 3, color: '#4ade80' }}>
                  Correct answer: {currentExercise.options[currentExercise.correctIndex]}
                </div>
              )}
            </div>
          )}
        </React.Fragment>
      )}
    </div>
  )
}

// ============================================================
// Teacher Mode
// ============================================================

function TeacherMode({ isDark, config, onConfigChange, fs, s, compact }: {
  isDark: boolean
  config: ConfusedWordsConfig
  onConfigChange: (p: Partial<ConfusedWordsConfig>) => void
  fs: number
  s: ReturnType<typeof sh>
  compact: boolean
}) {
  const handleOptionEdit = useCallback((index: number, value: string) => {
    const newOptions: [string, string, string, string] = [config.teacherOptions[0], config.teacherOptions[1], config.teacherOptions[2], config.teacherOptions[3]]
    newOptions[index] = value
    onConfigChange({ teacherOptions: newOptions })
  }, [config.teacherOptions, onConfigChange])

  const handleSetCorrect = useCallback((index: number) => {
    onConfigChange({ teacherCorrect: index })
  }, [onConfigChange])

  const handleAddExercise = useCallback(() => {
    if (!config.teacherQuestion.trim() || !config.teacherOptions[0].trim() || !config.teacherExplanation.trim()) return
    const newExercise: ConfusedWordExercise = {
      id: 'cw-custom-' + Date.now(),
      question: config.teacherQuestion,
      options: [config.teacherOptions[0], config.teacherOptions[1], config.teacherOptions[2], config.teacherOptions[3]],
      correctIndex: config.teacherCorrect,
      explanation: config.teacherExplanation,
      wordPair: 'custom',
      difficulty: 'medium',
    }
    onConfigChange({
      customExercises: [...config.customExercises, newExercise],
      teacherQuestion: '',
      teacherOptions: ['', '', '', ''],
      teacherCorrect: 0,
      teacherExplanation: '',
    })
  }, [config.teacherQuestion, config.teacherOptions, config.teacherCorrect, config.teacherExplanation, config.customExercises, onConfigChange])

  const handleRemoveCustom = useCallback((idx: number) => {
    const updated = [...config.customExercises]
    updated.splice(idx, 1)
    onConfigChange({ customExercises: updated })
  }, [config.customExercises, onConfigChange])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={() => onConfigChange({ mode: 'student' })} style={{
            ...s.btn(false), padding: '2px 6px', fontSize: 9,
          }}>Practice</button>
          <button onClick={() => onConfigChange({ mode: 'teacher' })} style={{
            ...s.btn(true), padding: '2px 6px', fontSize: 9, fontWeight: 700 as const,
          }}>Author</button>
        </div>
        <div style={{ fontSize: 9, color: s.text }}>
          {config.customExercises.length} custom exercise{config.customExercises.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Create Exercise Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '6px 8px', borderRadius: 6, background: s.bg, border: '1px solid ' + s.border }}>
        <div style={{ fontSize: 9, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Create Exercise</div>

        <input
          placeholder="Question (e.g. '___ going to the park.')"
          value={config.teacherQuestion}
          onChange={e => onConfigChange({ teacherQuestion: e.target.value })}
          style={{ ...s.input, width: '100%', boxSizing: 'border-box' as const }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
        </div>

        <input
          placeholder="Explanation (why the correct answer is right)"
          value={config.teacherExplanation}
          onChange={e => onConfigChange({ teacherExplanation: e.target.value })}
          style={{ ...s.input, width: '100%', boxSizing: 'border-box' as const }}
        />

        <button onClick={handleAddExercise} style={{ ...s.btnPrimary, alignSelf: 'flex-start' as const, fontSize: 9 }}>
          + Add Exercise
        </button>
      </div>

      {/* Custom Exercises List */}
      {config.customExercises.length > 0 && !compact && (
        <div style={{
          maxHeight: 160, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column', gap: 2,
          padding: '4px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border,
        }}>
          <div style={{ fontSize: 8, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 1 }}>Custom Exercises</div>
          {config.customExercises.map((ex, i) => (
            <div key={ex.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '3px 6px', borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: '1px solid ' + s.border, fontSize: 9, color: s.bright,
            }}>
              <div style={{ flex: 1, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const }}>
                {ex.question}
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