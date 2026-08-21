'use client'

import React, { useMemo, useCallback, useState } from 'react'

// ============================================================
// Types
// ============================================================

export interface WordSortExercise {
  id: string
  title: string
  words: string[]
  categories: { key: string; label: string; color: string }[]
  correctAnswers: Record<string, string>
  hint: string
}

export interface WordSorterConfig {
  mode: 'student' | 'teacher'
  exerciseIdx: number
  checked: boolean
  score: number
  totalAttempted: number
  sortBy: 'pos' | 'syllable' | 'prefix' | 'suffix' | 'custom'
  selections: Record<string, string>
  customExercises: WordSortExercise[]
}

export const DEFAULT_WORD_SORTER_CONFIG: WordSorterConfig = {
  mode: 'student',
  exerciseIdx: 0,
  checked: false,
  score: 0,
  totalAttempted: 0,
  sortBy: 'pos',
  selections: {},
  customExercises: [],
}

export interface WordSorterProps {
  isDark: boolean
  config: WordSorterConfig
  onConfigChange: (patch: Partial<WordSorterConfig>) => void
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
// Embedded Exercises (20+)
// ============================================================

const BUILT_IN_EXERCISES: WordSortExercise[] = [
  // --- Sort by POS: 5 exercises ---
  {
    id: 'ws-01',
    title: 'Sort by Part of Speech',
    words: ['run', 'fast', 'dog', 'beautiful', 'jump', 'house', 'tall', 'sing', 'car', 'green'],
    categories: [
      { key: 'noun', label: 'Noun', color: '#60a5fa' },
      { key: 'verb', label: 'Verb', color: '#34d399' },
      { key: 'adjective', label: 'Adjective', color: '#c084fc' },
    ],
    correctAnswers: { dog: 'noun', house: 'noun', car: 'noun', run: 'verb', jump: 'verb', sing: 'verb', fast: 'adjective', beautiful: 'adjective', tall: 'adjective', green: 'adjective' },
    hint: 'Think about what each word does in a sentence. Nouns name things, verbs show actions, adjectives describe.',
  },
  {
    id: 'ws-02',
    title: 'Nouns, Adverbs & Verbs',
    words: ['quickly', 'think', 'happiness', 'loudly', 'create', 'mountain', 'softly', 'write', 'freedom', 'gently'],
    categories: [
      { key: 'noun', label: 'Noun', color: '#60a5fa' },
      { key: 'verb', label: 'Verb', color: '#34d399' },
      { key: 'adverb', label: 'Adverb', color: '#fbbf24' },
    ],
    correctAnswers: { happiness: 'noun', mountain: 'noun', freedom: 'noun', think: 'verb', create: 'verb', write: 'verb', quickly: 'adverb', loudly: 'adverb', softly: 'adverb', gently: 'adverb' },
    hint: 'Adverbs often end in -ly and describe how an action is done. Nouns name things. Verbs are actions.',
  },
  {
    id: 'ws-03',
    title: 'Nouns, Verbs & Adjectives',
    words: ['ocean', 'dance', 'bright', 'teacher', 'study', 'brave', 'garden', 'paint', 'smooth', 'student'],
    categories: [
      { key: 'noun', label: 'Noun', color: '#60a5fa' },
      { key: 'verb', label: 'Verb', color: '#34d399' },
      { key: 'adjective', label: 'Adjective', color: '#c084fc' },
    ],
    correctAnswers: { ocean: 'noun', teacher: 'noun', garden: 'noun', student: 'noun', dance: 'verb', study: 'verb', paint: 'verb', bright: 'adjective', brave: 'adjective', smooth: 'adjective' },
    hint: 'A noun names a person, place or thing. A verb is an action. An adjective describes a noun.',
  },
  {
    id: 'ws-04',
    title: 'Verbs, Adjectives & Adverbs',
    words: ['swim', 'calm', 'slowly', 'eat', 'colorful', 'quietly', 'read', 'gentle', 'rapidly', 'write'],
    categories: [
      { key: 'verb', label: 'Verb', color: '#34d399' },
      { key: 'adjective', label: 'Adjective', color: '#c084fc' },
      { key: 'adverb', label: 'Adverb', color: '#fbbf24' },
    ],
    correctAnswers: { swim: 'verb', eat: 'verb', read: 'verb', write: 'verb', calm: 'adjective', colorful: 'adjective', gentle: 'adjective', slowly: 'adverb', quietly: 'adverb', rapidly: 'adverb' },
    hint: 'Look for -ly endings for adverbs. Adjectives describe nouns. Verbs are actions you can do.',
  },
  {
    id: 'ws-05',
    title: 'Nouns, Verbs, Adjectives & Adverbs',
    words: ['book', 'run', 'happy', 'quickly', 'school', 'write', 'kind', 'carefully', 'river', 'jump', 'loud', 'softly'],
    categories: [
      { key: 'noun', label: 'Noun', color: '#60a5fa' },
      { key: 'verb', label: 'Verb', color: '#34d399' },
      { key: 'adjective', label: 'Adjective', color: '#c084fc' },
      { key: 'adverb', label: 'Adverb', color: '#fbbf24' },
    ],
    correctAnswers: { book: 'noun', school: 'noun', river: 'noun', run: 'verb', write: 'verb', jump: 'verb', happy: 'adjective', kind: 'adjective', loud: 'adjective', quickly: 'adverb', carefully: 'adverb', softly: 'adverb' },
    hint: 'Name the word type: Noun (thing), Verb (action), Adjective (description), Adverb (how something is done).',
  },

  // --- Sort by Syllable Count: 4 exercises ---
  {
    id: 'ws-06',
    title: 'Sort by Syllable Count',
    words: ['cat', 'banana', 'water', 'elephant', 'run', 'beautiful', 'apple', 'computer', 'book', 'wonderful'],
    categories: [
      { key: '1', label: '1 Syllable', color: '#f87171' },
      { key: '2', label: '2 Syllables', color: '#34d399' },
      { key: '3', label: '3+ Syllables', color: '#60a5fa' },
    ],
    correctAnswers: { cat: '1', run: '1', book: '1', banana: '2', water: '2', apple: '2', elephant: '3', beautiful: '3', computer: '3', wonderful: '3' },
    hint: 'Clap once for each syllable. Cat has 1 clap, ba-na-na has 3 claps.',
  },
  {
    id: 'ws-07',
    title: 'Syllable Sort: Animals',
    words: ['dog', 'tiger', 'giraffe', 'bird', 'monkey', 'hippopotamus', 'fish', 'penguin', 'lion', 'crocodile'],
    categories: [
      { key: '1', label: '1 Syllable', color: '#f87171' },
      { key: '2', label: '2 Syllables', color: '#34d399' },
      { key: '3', label: '3+ Syllables', color: '#60a5fa' },
    ],
    correctAnswers: { dog: '1', bird: '1', fish: '1', tiger: '2', monkey: '2', penguin: '2', lion: '2', giraffe: '2', hippopotamus: '3', crocodile: '3' },
    hint: 'Say each word slowly and count how many beats you hear.',
  },
  {
    id: 'ws-08',
    title: 'Syllable Sort: Food',
    words: ['rice', 'noodle', 'strawberry', 'bread', 'pizza', 'watermelon', 'soup', 'banana', 'chocolate', 'cake'],
    categories: [
      { key: '1', label: '1 Syllable', color: '#f87171' },
      { key: '2', label: '2 Syllables', color: '#34d399' },
      { key: '3', label: '3+ Syllables', color: '#60a5fa' },
    ],
    correctAnswers: { rice: '1', bread: '1', soup: '1', cake: '1', noodle: '2', pizza: '2', banana: '3', strawberry: '3', watermelon: '3', chocolate: '3' },
    hint: 'Put your hand under your chin and count how many times it drops when you say the word.',
  },
  {
    id: 'ws-09',
    title: 'Syllable Sort: Actions',
    words: ['sit', 'jumping', 'understanding', 'walk', 'running', 'investigating', 'eat', 'cooking', 'celebrating', 'sleep'],
    categories: [
      { key: '1', label: '1 Syllable', color: '#f87171' },
      { key: '2', label: '2 Syllables', color: '#34d399' },
      { key: '3', label: '3+ Syllables', color: '#60a5fa' },
    ],
    correctAnswers: { sit: '1', walk: '1', eat: '1', sleep: '1', jumping: '2', running: '2', cooking: '2', understanding: '3', investigating: '4', celebrating: '4' },
    hint: 'Break the word into smaller sounds. Un-der-stand-ing has 4 syllables!',
  },

  // --- Sort by Prefix: 4 exercises ---
  {
    id: 'ws-10',
    title: 'Sort by Prefix',
    words: ['unhappy', 'rewrite', 'preview', 'disconnect', 'unfair', 'return', 'prefix', 'disagree', 'undo', 'rebuild'],
    categories: [
      { key: 'un', label: 'un-', color: '#f87171' },
      { key: 're', label: 're-', color: '#34d399' },
      { key: 'pre', label: 'pre-', color: '#60a5fa' },
      { key: 'dis', label: 'dis-', color: '#fbbf24' },
    ],
    correctAnswers: { unhappy: 'un', unfair: 'un', undo: 'un', rewrite: 're', return: 're', rebuild: 're', preview: 'pre', prefix: 'pre', disconnect: 'dis', disagree: 'dis' },
    hint: 'Look at the beginning of each word. Which prefix does it start with?',
  },
  {
    id: 'ws-11',
    title: 'Prefix Sort: More Prefixes',
    words: ['misbehave', 'overcook', 'submarine', 'interact', 'misunderstand', 'overload', 'subway', 'international', 'misspell', 'oversleep'],
    categories: [
      { key: 'mis', label: 'mis-', color: '#f87171' },
      { key: 'over', label: 'over-', color: '#34d399' },
      { key: 'sub', label: 'sub-', color: '#60a5fa' },
      { key: 'inter', label: 'inter-', color: '#c084fc' },
    ],
    correctAnswers: { misbehave: 'mis', misunderstand: 'mis', misspell: 'mis', overcook: 'over', overload: 'over', oversleep: 'over', submarine: 'sub', subway: 'sub', interact: 'inter', international: 'inter' },
    hint: 'mis- means wrong, over- means too much, sub- means under, inter- means between.',
  },
  {
    id: 'ws-12',
    title: 'Prefix Sort: Advanced',
    words: ['transform', 'superhero', 'antibody', 'automatic', 'transport', 'superior', 'antisocial', 'autobiography', 'translate', 'supermarket'],
    categories: [
      { key: 'trans', label: 'trans-', color: '#f87171' },
      { key: 'super', label: 'super-', color: '#34d399' },
      { key: 'anti', label: 'anti-', color: '#60a5fa' },
      { key: 'auto', label: 'auto-', color: '#fbbf24' },
    ],
    correctAnswers: { transform: 'trans', transport: 'trans', translate: 'trans', superhero: 'super', superior: 'super', supermarket: 'super', antibody: 'anti', antisocial: 'anti', automatic: 'auto', autobiography: 'auto' },
    hint: 'trans- means across, super- means above, anti- means against, auto- means self.',
  },
  {
    id: 'ws-13',
    title: 'Prefix Sort: Number Prefixes',
    words: ['bicycle', 'triangle', 'multicolour', 'bilingual', 'tricycle', 'multipurpose', 'biweekly', 'triple', 'multimedia', 'bipolar'],
    categories: [
      { key: 'bi', label: 'bi- (two)', color: '#60a5fa' },
      { key: 'tri', label: 'tri- (three)', color: '#34d399' },
      { key: 'multi', label: 'multi- (many)', color: '#c084fc' },
    ],
    correctAnswers: { bicycle: 'bi', bilingual: 'bi', biweekly: 'bi', bipolar: 'bi', triangle: 'tri', tricycle: 'tri', triple: 'tri', multicolour: 'multi', multipurpose: 'multi', multimedia: 'multi' },
    hint: 'bi- means two, tri- means three, multi- means many. Look at the start of each word.',
  },

  // --- Sort by Suffix: 4 exercises ---
  {
    id: 'ws-14',
    title: 'Sort by Suffix',
    words: ['careful', 'careless', 'happiness', 'enjoyment', 'playful', 'useless', 'darkness', 'movement', 'thoughtful', 'fearless'],
    categories: [
      { key: 'ful', label: '-ful', color: '#34d399' },
      { key: 'less', label: '-less', color: '#f87171' },
      { key: 'ness', label: '-ness', color: '#60a5fa' },
      { key: 'ment', label: '-ment', color: '#fbbf24' },
    ],
    correctAnswers: { careful: 'ful', playful: 'ful', thoughtful: 'ful', careless: 'less', useless: 'less', fearless: 'less', happiness: 'ness', darkness: 'ness', enjoyment: 'ment', movement: 'ment' },
    hint: '-ful means full of, -less means without, -ness is a state, -ment is an action/result.',
  },
  {
    id: 'ws-15',
    title: 'Suffix Sort: More Suffixes',
    words: ['teacher', 'comfortable', 'slowly', 'education', 'actor', 'readable', 'happily', 'creation', 'helper', 'visible'],
    categories: [
      { key: 'eror', label: '-er / -or', color: '#34d399' },
      { key: 'ableible', label: '-able / -ible', color: '#60a5fa' },
      { key: 'ly', label: '-ly', color: '#c084fc' },
      { key: 'tionsion', label: '-tion / -sion', color: '#fbbf24' },
    ],
    correctAnswers: { teacher: 'eror', helper: 'eror', actor: 'eror', comfortable: 'ableible', readable: 'ableible', visible: 'ableible', slowly: 'ly', happily: 'ly', education: 'tionsion', creation: 'tionsion' },
    hint: '-er/-or = person who, -able/-ible = can do, -ly = in a way, -tion = action/state.',
  },
  {
    id: 'ws-16',
    title: 'Suffix Sort: Adjective Makers',
    words: ['dangerous', 'active', 'personal', 'sunny', 'nervous', 'creative', 'musical', 'funny', 'famous', 'national'],
    categories: [
      { key: 'ous', label: '-ous', color: '#f87171' },
      { key: 'ive', label: '-ive', color: '#34d399' },
      { key: 'al', label: '-al', color: '#60a5fa' },
      { key: 'y', label: '-y', color: '#fbbf24' },
    ],
    correctAnswers: { dangerous: 'ous', nervous: 'ous', famous: 'ous', active: 'ive', creative: 'ive', personal: 'al', musical: 'al', national: 'al', sunny: 'y', funny: 'y' },
    hint: '-ous = having, -ive = tending to, -al = relating to, -y = characterised by.',
  },
  {
    id: 'ws-17',
    title: 'Suffix Sort: Mixed',
    words: ['kindness', 'wonderful', 'sadness', 'helpful', 'amusement', 'playful', 'darkness', 'excitement', 'cheerful', 'illness'],
    categories: [
      { key: 'ness', label: '-ness', color: '#60a5fa' },
      { key: 'ful', label: '-ful', color: '#34d399' },
      { key: 'ment', label: '-ment', color: '#fbbf24' },
    ],
    correctAnswers: { kindness: 'ness', sadness: 'ness', darkness: 'ness', illness: 'ness', wonderful: 'ful', helpful: 'ful', playful: 'ful', cheerful: 'ful', amusement: 'ment', excitement: 'ment' },
    hint: 'Check the ending of each word carefully. -ness vs -ful vs -ment.',
  },

  // --- Sort by Consonant/Vowel Start: 3 exercises ---
  {
    id: 'ws-18',
    title: 'Consonant or Vowel Start?',
    words: ['apple', 'banana', 'cat', 'elephant', 'orange', 'igloo', 'umbrella', 'tree', 'ice', 'octopus'],
    categories: [
      { key: 'vowel', label: 'Vowel Start', color: '#c084fc' },
      { key: 'consonant', label: 'Consonant Start', color: '#60a5fa' },
    ],
    correctAnswers: { apple: 'vowel', elephant: 'vowel', orange: 'vowel', igloo: 'vowel', umbrella: 'vowel', ice: 'vowel', octopus: 'vowel', banana: 'consonant', cat: 'consonant', tree: 'consonant' },
    hint: 'Vowels are A, E, I, O, U. All other letters are consonants. Look at the first letter.',
  },
  {
    id: 'ws-19',
    title: 'Vowel vs Consonant Start: Animals',
    words: ['ant', 'bear', 'eagle', 'frog', 'owl', 'tiger', 'iguana', 'monkey', 'elephant', 'rabbit'],
    categories: [
      { key: 'vowel', label: 'Vowel Start', color: '#c084fc' },
      { key: 'consonant', label: 'Consonant Start', color: '#60a5fa' },
    ],
    correctAnswers: { ant: 'vowel', eagle: 'vowel', owl: 'vowel', iguana: 'vowel', elephant: 'vowel', bear: 'consonant', frog: 'consonant', tiger: 'consonant', monkey: 'consonant', rabbit: 'consonant' },
    hint: 'Remember: A, E, I, O, U are vowels. Everything else is a consonant.',
  },
  {
    id: 'ws-20',
    title: 'Vowel vs Consonant Start: Food',
    words: ['apple', 'bread', 'egg', 'grape', 'orange', 'milk', 'onion', 'rice', 'avocado', 'cheese'],
    categories: [
      { key: 'vowel', label: 'Vowel Start', color: '#c084fc' },
      { key: 'consonant', label: 'Consonant Start', color: '#60a5fa' },
    ],
    correctAnswers: { apple: 'vowel', egg: 'vowel', orange: 'vowel', onion: 'vowel', avocado: 'vowel', bread: 'consonant', grape: 'consonant', milk: 'consonant', rice: 'consonant', cheese: 'consonant' },
    hint: 'A, E, I, O, U start with a vowel sound. Check the first letter of each food word.',
  },
]

// ============================================================
// Helper: get exercises filtered by sortBy
// ============================================================

function getExercisesBySort(sortBy: string, customExercises: WordSortExercise[]): WordSortExercise[] {
  if (sortBy === 'custom') return customExercises
  return BUILT_IN_EXERCISES.filter((ex) => {
    if (sortBy === 'pos') return ['ws-01', 'ws-02', 'ws-03', 'ws-04', 'ws-05'].indexOf(ex.id) !== -1
    if (sortBy === 'syllable') return ['ws-06', 'ws-07', 'ws-08', 'ws-09'].indexOf(ex.id) !== -1
    if (sortBy === 'prefix') return ['ws-10', 'ws-11', 'ws-12', 'ws-13'].indexOf(ex.id) !== -1
    if (sortBy === 'suffix') return ['ws-14', 'ws-15', 'ws-16', 'ws-17'].indexOf(ex.id) !== -1
    return true
  })
}

// ============================================================
// Component
// ============================================================

export function WordSorterWidget({ isDark, config, onConfigChange }: WordSorterProps) {
  const s = useMemo(() => sh(isDark), [isDark])
  const [selectedWord, setSelectedWord] = useState<string | null>(null)

  const allExercises = useMemo(() => {
    return getExercisesBySort(config.sortBy, config.customExercises)
  }, [config.sortBy, config.customExercises])

  const currentExercise = allExercises[config.exerciseIdx] || null

  const handleWordClick = useCallback((word: string) => {
    if (config.checked) return
    if (selectedWord === word) {
      setSelectedWord(null)
    } else {
      setSelectedWord(word)
    }
  }, [config.checked, selectedWord])

  const handleCategoryClick = useCallback((catKey: string) => {
    if (config.checked || !selectedWord) return
    const newSelections = { ...config.selections }
    newSelections[selectedWord] = catKey
    onConfigChange({ selections: newSelections })
    setSelectedWord(null)
  }, [config.checked, selectedWord, config.selections, onConfigChange])

  const handleCheck = useCallback(() => {
    if (!currentExercise) return
    const placedWords = currentExercise.words.filter((w) => config.selections[w])
    if (placedWords.length === 0) return
    let correct = 0
    for (const word of placedWords) {
      if (config.selections[word] === currentExercise.correctAnswers[word]) {
        correct++
      }
    }
    onConfigChange({
      checked: true,
      score: config.score + correct,
      totalAttempted: config.totalAttempted + placedWords.length,
    })
  }, [currentExercise, config.selections, config.score, config.totalAttempted, onConfigChange])

  const handleNext = useCallback(() => {
    const nextIdx = (config.exerciseIdx + 1) % allExercises.length
    onConfigChange({ exerciseIdx: nextIdx, checked: false, selections: {} })
    setSelectedWord(null)
  }, [config.exerciseIdx, allExercises.length, onConfigChange])

  const handlePrev = useCallback(() => {
    const prevIdx = (config.exerciseIdx - 1 + allExercises.length) % allExercises.length
    onConfigChange({ exerciseIdx: prevIdx, checked: false, selections: {} })
    setSelectedWord(null)
  }, [config.exerciseIdx, allExercises.length, onConfigChange])

  const handleShuffle = useCallback(() => {
    if (!currentExercise) return
    const shuffled = [...currentExercise.words]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = shuffled[i]
      shuffled[i] = shuffled[j]
      shuffled[j] = tmp
    }
    // We need to create a modified exercise with shuffled words
    const shuffledEx: WordSortExercise = { ...currentExercise, words: shuffled }
    // Place shuffled exercise into custom for this session
    const existing = config.customExercises.filter((e) => e.id !== 'shuffled-' + currentExercise.id)
    onConfigChange({
      customExercises: [...existing, { ...shuffledEx, id: 'shuffled-' + currentExercise.id }],
      selections: {},
      checked: false,
    })
    setSelectedWord(null)
  }, [currentExercise, config.customExercises, onConfigChange])

  const handleSortChange = useCallback((sortBy: 'pos' | 'syllable' | 'prefix' | 'suffix' | 'custom') => {
    onConfigChange({ sortBy, exerciseIdx: 0, checked: false, selections: {} })
    setSelectedWord(null)
  }, [onConfigChange])

  // Teacher mode
  if (config.mode === 'teacher') {
    return (
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11, color: s.bright, height: '100%', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Word Sorter</span>
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'rgba(5,150,105,0.12)', color: '#34d399' }}>Teacher</span>
          </div>
          <button style={s.btn(false)} onClick={() => onConfigChange({ mode: 'student' })}>Student Mode</button>
        </div>
        <div style={{ color: s.text, fontSize: 10 }}>
          Use the Custom sort category to create exercises. Switch to Custom tab in student mode to use them.
        </div>
      </div>
    )
  }

  // Student mode - no exercises
  if (!currentExercise) {
    return (
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: s.text, fontSize: 11 }}>
        <div>No exercises available for this category.</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, justifyContent: 'center' as const }}>
          {(['pos', 'syllable', 'prefix', 'suffix', 'custom'] as const).map((cat) => (
            <button key={cat} style={s.btn(config.sortBy === cat)} onClick={() => handleSortChange(cat)}>
              {cat === 'pos' ? 'POS' : cat === 'custom' ? 'Custom' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Build word -> category mapping for display
  const wordsInCategories: Record<string, string[]> = {}
  for (const cat of currentExercise.categories) {
    wordsInCategories[cat.key] = []
  }
  const unplacedWords: string[] = []
  for (const word of currentExercise.words) {
    const catKey = config.selections[word]
    if (catKey && wordsInCategories[catKey]) {
      wordsInCategories[catKey].push(word)
    } else {
      unplacedWords.push(word)
    }
  }

  // Count correct
  let correctCount = 0
  let wrongCount = 0
  if (config.checked) {
    for (const word of currentExercise.words) {
      const sel = config.selections[word]
      if (sel) {
        if (sel === currentExercise.correctAnswers[word]) {
          correctCount++
        } else {
          wrongCount++
        }
      }
    }
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11, color: s.bright, height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Word Sorter</span>
        </div>
        <button style={s.btn(false)} onClick={() => onConfigChange({ mode: 'teacher' })}>Teacher</button>
      </div>

      {/* Sort category selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
        {(['pos', 'syllable', 'prefix', 'suffix', 'custom'] as const).map((cat) => (
          <button key={cat} style={s.btn(config.sortBy === cat)} onClick={() => handleSortChange(cat)}>
            {cat === 'pos' ? 'POS' : cat === 'custom' ? 'Custom' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Progress and score */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid ' + s.border }}>
        <span style={{ color: s.text, fontSize: 10 }}>{config.exerciseIdx + 1} / {allExercises.length}</span>
        <span style={{ color: '#34d399', fontSize: 10, fontWeight: 600 }}>{config.score} / {config.totalAttempted} correct</span>
      </div>

      {/* Exercise title */}
      <div style={{ fontSize: 12, fontWeight: 600, textAlign: 'center' as const }}>{currentExercise.title}</div>

      {/* Hint (before check) */}
      {!config.checked && (
        <div style={{ padding: '5px 8px', borderRadius: 4, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: 9, lineHeight: 1.4 }}>
          Hint: {currentExercise.hint}
        </div>
      )}

      {/* Unplaced words (word chips) */}
      {!config.checked && unplacedWords.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
          {unplacedWords.map((word) => {
            const isSelected = selectedWord === word
            return (
              <button key={word} style={{
                padding: '4px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer' as const,
                background: isSelected ? 'rgba(5,150,105,0.18)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                border: isSelected ? '1.5px solid rgba(5,150,105,0.5)' : '1px solid ' + (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'),
                color: isSelected ? '#34d399' : s.bright,
                fontWeight: isSelected ? 600 : 400,
              }} onClick={() => handleWordClick(word)}>
                {word}
              </button>
            )
          })}
        </div>
      )}

      {/* Category buckets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {currentExercise.categories.map((cat) => {
          const words = wordsInCategories[cat.key] || []
          const hasSelectedWord = selectedWord !== null
          const catBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
          return (
            <div key={cat.key} style={{
              borderRadius: 6, border: '1.5px dashed ' + cat.color + '40',
              background: hasSelectedWord && !config.checked ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)') : catBg,
              padding: '6px 8px', minHeight: 36,
              cursor: hasSelectedWord && !config.checked ? 'pointer' as const : 'default',
              transition: 'background 0.15s',
            }} onClick={() => handleCategoryClick(cat.key)}>
              <div style={{ fontSize: 9, fontWeight: 600, color: cat.color, marginBottom: words.length > 0 ? 4 : 0, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{cat.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 3 }}>
                {words.map((word) => {
                  const isCorrect = config.checked && config.selections[word] === currentExercise.correctAnswers[word]
                  const isWrong = config.checked && config.selections[word] !== currentExercise.correctAnswers[word]
                  let chipBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
                  let chipBorder = '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
                  let chipColor = s.bright
                  if (isCorrect) { chipBg = 'rgba(5,150,105,0.12)'; chipBorder = '1px solid rgba(5,150,105,0.4)'; chipColor = '#34d399' }
                  if (isWrong) { chipBg = 'rgba(239,68,68,0.12)'; chipBorder = '1px solid rgba(239,68,68,0.4)'; chipColor = '#f87171' }
                  return (
                    <span key={word} style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 10, background: chipBg,
                      border: chipBorder, color: chipColor, fontWeight: 500,
                    }}>{word}{isCorrect ? ' \u2713' : ''}{isWrong ? ' \u2717' : ''}</span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Results after checking */}
      {config.checked && (
        <div style={{ padding: '6px 8px', borderRadius: 5, background: correctCount === currentExercise.words.length ? 'rgba(5,150,105,0.08)' : 'rgba(251,191,36,0.08)', border: '1px solid ' + (correctCount === currentExercise.words.length ? 'rgba(5,150,105,0.2)' : 'rgba(251,191,36,0.2)') }}>
          <span style={{ fontWeight: 600, color: correctCount === currentExercise.words.length ? '#34d399' : '#fbbf24', fontSize: 11 }}>
            {correctCount === currentExercise.words.length ? 'Perfect! All correct!' : correctCount + ' correct, ' + wrongCount + ' wrong'}
          </span>
          {wrongCount > 0 && (
            <div style={{ color: s.text, fontSize: 9, marginTop: 4, lineHeight: 1.4 }}>{currentExercise.hint}</div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid ' + s.border }}>
        <button style={s.btn(false)} onClick={handlePrev}>&larr; Prev</button>
        <div style={{ display: 'flex', gap: 4 }}>
          {!config.checked && Object.keys(config.selections).length > 0 && (
            <button style={s.btnPrimary} onClick={handleCheck}>Check</button>
          )}
          {config.checked && (
            <button style={s.btnPrimary} onClick={handleNext}>Next &rarr;</button>
          )}
          {!config.checked && (
            <button style={s.btn(false)} onClick={handleShuffle}>Shuffle</button>
          )}
        </div>
      </div>
    </div>
  )
}