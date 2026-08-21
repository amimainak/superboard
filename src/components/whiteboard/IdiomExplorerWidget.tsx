'use client'

import React, { useState, useMemo, useCallback } from 'react'

// ============================================================
// Types
// ============================================================

export interface IdiomExercise {
  id: string
  idiom: string
  meaning: string
  origin: string
  example: string
  category: 'everyday' | 'animal' | 'body' | 'color' | 'number' | 'weather'
  question: string
  options: [string, string, string, string]
  correctIndex: number
}

export interface IdiomExplorerConfig {
  mode: 'student' | 'teacher'
  exerciseIdx: number
  selected: number | null
  checked: boolean
  score: number
  totalAttempted: number
  category: 'all' | 'everyday' | 'animal' | 'body' | 'color' | 'number' | 'weather'
  showMeaning: boolean
  teacherIdiom: string
  teacherMeaning: string
  teacherOrigin: string
  teacherExample: string
  teacherOptions: [string, string, string, string]
  teacherCorrect: number
  customExercises: IdiomExercise[]
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
// Embedded Exercises (30 idioms)
// ============================================================

const DEFAULT_EXERCISES: IdiomExercise[] = [
  // === EVERYDAY ===
  {
    id: 'id-e01',
    idiom: 'break a leg',
    meaning: 'Good luck! Usually said to someone who is about to perform on stage or take an exam.',
    origin: 'Theatre superstition — saying "good luck" was believed to actually bring bad luck, so actors wished each other the opposite.',
    example: 'Break a leg at your audition today — you will be brilliant!',
    category: 'everyday',
    question: "What does the idiom 'break a leg' mean?",
    options: ['Get injured badly', 'Good luck!', 'Run very fast', 'Be extremely careful'],
    correctIndex: 1,
  },
  {
    id: 'id-e02',
    idiom: 'piece of cake',
    meaning: 'Something that is very easy to do.',
    origin: '19th-century expression comparing an easy, enjoyable task to eating a slice of cake.',
    example: 'The maths test was a piece of cake — I finished in ten minutes.',
    category: 'everyday',
    question: "What does the idiom 'piece of cake' mean?",
    options: ['A delicious dessert', 'A big problem', 'Something very easy to do', 'A celebration'],
    correctIndex: 2,
  },
  {
    id: 'id-e03',
    idiom: 'hit the nail on the head',
    meaning: 'To describe exactly what is causing a situation or problem; to be exactly right.',
    origin: 'Carpentry — driving a nail precisely on its head is the perfect, accurate strike.',
    example: 'You hit the nail on the head with that analysis of the problem.',
    category: 'everyday',
    question: "What does 'hit the nail on the head' mean?",
    options: ['Build something from scratch', 'Describe exactly what is right', 'Make a careless mistake', 'Start a new project'],
    correctIndex: 1,
  },
  {
    id: 'id-e04',
    idiom: 'cost an arm and a leg',
    meaning: 'To be extremely expensive.',
    origin: 'After WWII, referring to soldiers who lost limbs — the highest possible cost.',
    example: 'That luxury car must have cost an arm and a leg.',
    category: 'everyday',
    question: "What does 'cost an arm and a leg' mean?",
    options: ['To be very expensive', 'To cause physical pain', 'To need urgent repair', 'To be old-fashioned'],
    correctIndex: 0,
  },
  {
    id: 'id-e05',
    idiom: 'under the weather',
    meaning: 'Feeling ill or sick.',
    origin: 'Sailors who felt unwell would go below deck (under the weather) to rest and recover.',
    example: 'I cannot come to work today, I am feeling under the weather.',
    category: 'everyday',
    question: "What does 'under the weather' mean?",
    options: ['Enjoying a rainy day', 'Feeling ill or sick', 'Being very cold outside', 'Hiding from a storm'],
    correctIndex: 1,
  },
  {
    id: 'id-e06',
    idiom: 'once in a blue moon',
    meaning: 'Something that happens very rarely.',
    origin: 'A "blue moon" is a second full moon in a single calendar month, a genuinely rare event.',
    example: 'I visit my hometown once in a blue moon.',
    category: 'everyday',
    question: "What does 'once in a blue moon' mean?",
    options: ['During the nighttime', 'On a clear sunny day', 'Something that happens very rarely', 'Every single month'],
    correctIndex: 2,
  },
  {
    id: 'id-e07',
    idiom: 'the ball is in your court',
    meaning: 'It is your turn to make a decision or take the next step.',
    origin: 'Tennis — when the ball lands on your side, it is your responsibility to return it.',
    example: 'I have made my offer — now the ball is in your court.',
    category: 'everyday',
    question: "What does 'the ball is in your court' mean?",
    options: ['It is time to play sports', 'You are in serious trouble', 'It is your turn to decide or act', 'The game is already over'],
    correctIndex: 2,
  },
  {
    id: 'id-e08',
    idiom: 'burn the midnight oil',
    meaning: 'To work or study late into the night.',
    origin: 'Before electric lights, people literally burned oil lamps to read or work after dark.',
    example: 'She burned the midnight oil to finish her essay before the deadline.',
    category: 'everyday',
    question: "What does 'burn the midnight oil' mean?",
    options: ['To waste energy needlessly', 'To work or study late into the night', 'To cook a late-night meal', 'To start a fire accidentally'],
    correctIndex: 1,
  },
  {
    id: 'id-e09',
    idiom: 'a blessing in disguise',
    meaning: 'Something that seems bad at first but actually turns out to be good.',
    origin: 'An 18th-century proverb about hidden fortune concealed within apparent misfortune.',
    example: 'Losing that job was a blessing in disguise — it pushed me to start my own business.',
    category: 'everyday',
    question: "What does 'a blessing in disguise' mean?",
    options: ['A hidden gift', 'Something bad that turns out to be good', 'A formal religious ceremony', 'An unexpected lucky break'],
    correctIndex: 1,
  },
  {
    id: 'id-e10',
    idiom: 'bite the bullet',
    meaning: 'To force yourself to endure a painful or difficult situation.',
    origin: 'Before anaesthesia, soldiers would bite on a bullet during surgery to cope with pain.',
    example: 'I do not want to go to the dentist, but I will just bite the bullet.',
    category: 'everyday',
    question: "What does 'bite the bullet' mean?",
    options: ['To endure a painful or difficult situation', 'To eat something very hard', 'To act bravely in battle', 'To chew food quickly'],
    correctIndex: 0,
  },

  // === ANIMAL ===
  {
    id: 'id-a01',
    idiom: 'let the cat out of the bag',
    meaning: 'To reveal a secret accidentally or without meaning to.',
    origin: 'Dishonest market sellers would substitute a cat for a pig in a bag; opening the bag revealed the trick.',
    example: 'She let the cat out of the bag about the surprise party.',
    category: 'animal',
    question: "What does 'let the cat out of the bag' mean?",
    options: ['To free a pet from a cage', 'To cause chaos and confusion', 'To reveal a secret accidentally', 'To play roughly with animals'],
    correctIndex: 2,
  },
  {
    id: 'id-a02',
    idiom: 'elephant in the room',
    meaning: 'A major problem or controversial issue that is obvious but everyone avoids discussing.',
    origin: 'The metaphor that an elephant in a small room would be impossible to overlook, yet no one mentions it.',
    example: 'The budget crisis was the elephant in the room during the meeting.',
    category: 'animal',
    question: "What does 'elephant in the room' mean?",
    options: ['A very large pet', 'An obvious problem everyone ignores', 'A completely messy room', 'An unexpected surprise guest'],
    correctIndex: 1,
  },
  {
    id: 'id-a03',
    idiom: 'hold your horses',
    meaning: 'To wait, slow down, or be patient; to stop rushing.',
    origin: 'Horse-drawn carriage drivers would physically hold the reins to stop or slow their horses.',
    example: 'Hold your horses, let me explain the situation first!',
    category: 'animal',
    question: "What does 'hold your horses' mean?",
    options: ['To stop riding a horse', 'To wait or be patient', 'To feed and care for animals', 'To run as fast as possible'],
    correctIndex: 1,
  },
  {
    id: 'id-a04',
    idiom: 'wild goose chase',
    meaning: 'A pointless or hopeless search for something that cannot be found.',
    origin: 'An old horse-racing term for a race where horses followed a leader at varying, unpredictable distances.',
    example: 'Looking for that old document was a complete wild goose chase.',
    category: 'animal',
    question: "What does 'wild goose chase' mean?",
    options: ['A bird-watching trip', 'An exciting outdoor adventure', 'A pointless or hopeless search', 'A traditional hunting trip'],
    correctIndex: 2,
  },
  {
    id: 'id-a05',
    idiom: 'when pigs fly',
    meaning: 'Something that will never happen; an impossibility.',
    origin: 'A Scottish proverb from the 16th century used to express that something is completely impossible.',
    example: 'He will clean his room when pigs fly!',
    category: 'animal',
    question: "What does 'when pigs fly' mean?",
    options: ['A fun farm event', 'A very strange dream', 'Something that will never happen', 'An amazing air show'],
    correctIndex: 2,
  },

  // === BODY ===
  {
    id: 'id-b01',
    idiom: 'keep your chin up',
    meaning: 'To remain cheerful and positive in difficult or challenging circumstances.',
    origin: 'The physical posture of lifting your chin suggests looking forward with optimism and confidence.',
    example: 'Keep your chin up — things will get better soon!',
    category: 'body',
    question: "What does 'keep your chin up' mean?",
    options: ['To remain cheerful in difficult times', 'To always look above you', 'To exercise your jaw muscles', 'To be overly proud of yourself'],
    correctIndex: 0,
  },
  {
    id: 'id-b02',
    idiom: 'see eye to eye',
    meaning: 'To agree completely with someone about something.',
    origin: 'When two people stand face to face at the same level, their eyes align — symbolising shared perspective.',
    example: 'We do not always see eye to eye on politics, but we respect each other.',
    category: 'body',
    question: "What does 'see eye to eye' mean?",
    options: ['To stare intensely at someone', 'To have excellent eyesight', 'To agree with someone completely', 'To be exactly the same height'],
    correctIndex: 2,
  },
  {
    id: 'id-b03',
    idiom: 'sweet tooth',
    meaning: 'A strong liking for sweet foods such as sweets, chocolate, and desserts.',
    origin: 'Dates back to the 14th century, referring to a craving or fondness for sugary things.',
    example: 'I have a sweet tooth, so I always order dessert after dinner.',
    category: 'body',
    question: "What does 'sweet tooth' mean?",
    options: ['A painful dental problem', 'A strong liking for sweet foods', 'A kind and gentle smile', 'A type of dental treatment'],
    correctIndex: 1,
  },

  // === COLOR ===
  {
    id: 'id-c01',
    idiom: 'green with envy',
    meaning: 'To be extremely jealous or envious of someone or something.',
    origin: 'Green has been associated with envy since Shakespearean times, possibly from the idea of being sick with jealousy.',
    example: 'She was green with envy when she saw my new bicycle.',
    category: 'color',
    question: "What does 'green with envy' mean?",
    options: ['Feeling physically sick', 'Wearing green-coloured clothes', 'To be extremely jealous or envious', 'Being very environmentally friendly'],
    correctIndex: 2,
  },
  {
    id: 'id-c02',
    idiom: 'see red',
    meaning: 'To become extremely angry or furious about something.',
    origin: 'Red has long been associated with anger and rage across many cultures and literary traditions.',
    example: 'When he insulted her family, she saw red.',
    category: 'color',
    question: "What does 'see red' mean?",
    options: ['To have vision problems', 'To stop at a red traffic light', 'To become extremely angry', 'To see imminent danger ahead'],
    correctIndex: 2,
  },
  {
    id: 'id-c03',
    idiom: 'feeling blue',
    meaning: 'To feel sad, depressed, or unhappy.',
    origin: 'Blue has been linked with sadness since the 14th century, possibly from the old custom of associating blue with rain and cold.',
    example: 'I have been feeling blue ever since my best friend moved away.',
    category: 'color',
    question: "What does 'feeling blue' mean?",
    options: ['Feeling very cold', 'Feeling sad or depressed', 'Wearing blue-coloured clothes', 'Feeling very brave and strong'],
    correctIndex: 1,
  },
  {
    id: 'id-c04',
    idiom: 'golden opportunity',
    meaning: 'An excellent and rare chance for success or achievement.',
    origin: 'Gold represents value, rarity, and preciousness — a "golden" chance is one of great worth.',
    example: 'This internship is a golden opportunity for your future career.',
    category: 'color',
    question: "What does 'golden opportunity' mean?",
    options: ['A chance to find real gold', 'An excellent chance for success', 'An organised treasure hunt', 'A large financial investment'],
    correctIndex: 1,
  },
  {
    id: 'id-c05',
    idiom: 'grey area',
    meaning: 'Something that is not clearly defined, decided, or falls between two categories.',
    origin: 'Grey represents the middle ground between the clarity of black and white (clear right and wrong).',
    example: 'The law has a grey area regarding online privacy and data protection.',
    category: 'color',
    question: "What does 'grey area' mean?",
    options: ['A very old building', 'Something not clearly defined', 'A dark and cloudy sky', 'A rather boring topic'],
    correctIndex: 1,
  },

  // === NUMBER ===
  {
    id: 'id-n01',
    idiom: 'back to square one',
    meaning: 'To start completely over from the beginning after a failure or setback.',
    origin: 'Board games where landing on a penalty square sends you back to the starting position.',
    example: 'Our plan failed completely, so we are back to square one.',
    category: 'number',
    question: "What does 'back to square one' mean?",
    options: ['To return to your home', 'To start over after a failure', 'To go to a city square', 'To solve a maths problem'],
    correctIndex: 1,
  },
  {
    id: 'id-n02',
    idiom: 'at sixes and sevens',
    meaning: 'In a state of total confusion, disorder, or uncertainty.',
    origin: 'Originally from a dice game where rolling a six or seven was a risky, chaotic combination.',
    example: 'The office was at sixes and sevens before the big merger announcement.',
    category: 'number',
    question: "What does 'at sixes and sevens' mean?",
    options: ['Feeling very lucky today', 'In a state of confusion or disorder', 'Being extremely well organised', 'A type of gambling game'],
    correctIndex: 1,
  },
  {
    id: 'id-n03',
    idiom: 'on cloud nine',
    meaning: 'To be extremely happy, elated, or overjoyed.',
    origin: 'The number nine was traditionally considered the highest cloud in a ten-level heavenly hierarchy.',
    example: 'She was on cloud nine after winning the national championship.',
    category: 'number',
    question: "What does 'on cloud nine' mean?",
    options: ['Flying high in an aeroplane', 'Being physically very high up', 'To be extremely happy', 'Having a vivid dream'],
    correctIndex: 2,
  },
  {
    id: 'id-n04',
    idiom: 'catch-22',
    meaning: 'A paradoxical situation from which there is no escape because of mutually conflicting conditions.',
    origin: 'Joseph Heller\'s 1961 novel of the same name about the impossible logic of military bureaucracy.',
    example: 'You need experience to get a job, but you need a job to get experience — it is a catch-22.',
    category: 'number',
    question: "What does 'catch-22' mean?",
    options: ['A baseball playing term', 'A paradoxical situation with no escape', 'A tricky number puzzle', 'An extremely lucky number'],
    correctIndex: 1,
  },

  // === WEATHER ===
  {
    id: 'id-w01',
    idiom: 'rain or shine',
    meaning: 'No matter what the weather is like; regardless of circumstances or conditions.',
    origin: 'An old English expression originally used for outdoor events that would proceed whatever the weather.',
    example: 'The school sports day will go ahead rain or shine.',
    category: 'weather',
    question: "What does 'rain or shine' mean?",
    options: ['A weather forecast report', 'No matter the weather or circumstances', 'You must carry an umbrella', 'A discussion about the weather'],
    correctIndex: 1,
  },
  {
    id: 'id-w02',
    idiom: 'every cloud has a silver lining',
    meaning: 'Every difficult or sad situation has a positive or hopeful aspect to it.',
    origin: 'John Milton\'s 1634 poem Comus, referring to the bright edge of a cloud lit by the sun behind it.',
    example: 'I lost my job, but every cloud has a silver lining — I can now pursue my dream career.',
    category: 'weather',
    question: "What does 'every cloud has a silver lining' mean?",
    options: ['Clouds are beautiful at sunset', 'Every difficult situation has a positive side', 'It will definitely rain soon', 'Silver is a very valuable metal'],
    correctIndex: 1,
  },
  {
    id: 'id-w03',
    idiom: 'storm in a teacup',
    meaning: 'A lot of unnecessary anger, worry, or fuss about something that is not really important.',
    origin: 'The Latin phrase "tempest in a teapot" from the 3rd century, describing disproportionate overreaction.',
    example: 'Their argument about the seating arrangement was just a storm in a teacup.',
    category: 'weather',
    question: "What does 'storm in a teacup' mean?",
    options: ['Making tea during bad weather', 'A powerful and dangerous storm', 'A lot of fuss about something unimportant', 'A terrible kitchen accident'],
    correctIndex: 2,
  },
]

// ============================================================
// Defaults
// ============================================================

export const IDIOM_EXPLORER_KIND = 'lang-idiom-explorer'

export const DEFAULT_IDIOM_EXPLORER_CONFIG: IdiomExplorerConfig = {
  mode: 'student',
  exerciseIdx: 0,
  selected: null,
  checked: false,
  score: 0,
  totalAttempted: 0,
  category: 'all',
  showMeaning: false,
  teacherIdiom: '',
  teacherMeaning: '',
  teacherOrigin: '',
  teacherExample: '',
  teacherOptions: ['', '', '', ''],
  teacherCorrect: 0,
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

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  everyday: 'Everyday',
  animal: 'Animal',
  body: 'Body',
  color: 'Colour',
  number: 'Number',
  weather: 'Weather',
}

const CATEGORY_COLORS: Record<string, string> = {
  all: '#94a3b8',
  everyday: '#f59e0b',
  animal: '#a78bfa',
  body: '#f472b6',
  color: '#38bdf8',
  number: '#34d399',
  weather: '#60a5fa',
}

// ============================================================
// Main Component
// ============================================================

export function IdiomExplorerWidget({ isDark, config, onConfigChange, compact }: {
  isDark: boolean
  config: IdiomExplorerConfig
  onConfigChange: (patch: Partial<IdiomExplorerConfig>) => void
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
  config: IdiomExplorerConfig
  onConfigChange: (p: Partial<IdiomExplorerConfig>) => void
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
      if (config.category !== 'all' && e.category !== config.category) return false
      return true
    })
    return shuffleArray(filtered)
  }, [allExercises, config.category, shuffleKey])

  const currentExercise = useMemo((): IdiomExercise | null => {
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

  const handleCategoryChange = useCallback((cat: 'all' | 'everyday' | 'animal' | 'body' | 'color' | 'number' | 'weather') => {
    setShuffleKey(k => k + 1)
    onConfigChange({
      category: cat,
      exerciseIdx: 0,
      selected: null,
      checked: false,
      score: 0,
      totalAttempted: 0,
    })
  }, [onConfigChange])

  const displayIndex = (config.exerciseIdx % Math.max(filteredExercises.length, 1)) + 1
  const totalExercises = filteredExercises.length

  const categories: Array<'all' | 'everyday' | 'animal' | 'body' | 'color' | 'number' | 'weather'> = [
    'all', 'everyday', 'animal', 'body', 'color', 'number', 'weather',
  ]

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
          <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: 8, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Category:</span>
            {categories.map(cat => (
              <button key={cat} onClick={() => handleCategoryChange(cat)} style={{
                ...s.btn(config.category === cat), fontSize: 8, padding: '1px 5px',
                border: config.category === cat ? '1px solid ' + CATEGORY_COLORS[cat] + '60' : undefined,
                color: config.category === cat ? CATEGORY_COLORS[cat] : undefined,
                background: config.category === cat ? CATEGORY_COLORS[cat] + '18' : undefined,
              }}>{CATEGORY_LABELS[cat]}</button>
            ))}
            <span style={{ fontSize: 8, color: s.text, margin: '0 2px' }}>|</span>
            <button onClick={handleShuffle} style={{ ...s.btn(false), fontSize: 8, padding: '1px 6px' }}>
              Shuffle
            </button>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={() => onConfigChange({ showMeaning: !config.showMeaning })} style={{
              ...s.btn(config.showMeaning), fontSize: 8, padding: '1px 6px',
            }}>
              {config.showMeaning ? 'Quiz Mode' : 'Study Mode'}
            </button>
            {config.showMeaning && (
              <span style={{ fontSize: 8, color: s.text, fontStyle: 'italic' as const }}>
                Showing meanings directly — no quiz
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {!currentExercise ? (
        <div style={{ padding: 20, textAlign: 'center' as const, color: s.text, fontSize: fs }}>
          No idioms available for this category.
        </div>
      ) : (
        <React.Fragment>
          {/* Idiom Title */}
          <div style={{
            padding: '8px 10px', borderRadius: 6, background: s.bg,
            border: '1px solid ' + s.border, fontSize: fs + 1, lineHeight: 1.5, color: s.bright,
          }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 3, alignItems: 'center' }}>
              <span style={{ fontSize: 8, fontWeight: 700 as const, color: CATEGORY_COLORS[currentExercise.category] || s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                {currentExercise.category}
              </span>
            </div>
            <div style={{ fontSize: fs + 3, fontWeight: 700, color: s.bright, marginBottom: 2 }}>
              &ldquo;{currentExercise.idiom}&rdquo;
            </div>
          </div>

          {/* Study Mode: Show card directly */}
          {config.showMeaning && !config.checked && (
            <div style={{
              display: 'flex', flexDirection: 'column' as const, gap: 3,
              padding: '8px 10px', borderRadius: 6, background: s.bg, border: '1px solid ' + s.border,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Meaning</div>
              <div style={{ fontSize: fs, lineHeight: 1.5, color: s.bright }}>{currentExercise.meaning}</div>
              <div style={{ fontSize: 9, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 2 }}>Origin</div>
              <div style={{ fontSize: fs - 1, lineHeight: 1.5, color: s.text }}>{currentExercise.origin}</div>
              <div style={{ fontSize: 9, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 2 }}>Example</div>
              <div style={{ fontSize: fs - 1, lineHeight: 1.5, color: s.bright, fontStyle: 'italic' as const }}>{currentExercise.example}</div>
            </div>
          )}

          {/* Quiz Mode: Question + Options */}
          {!config.showMeaning && (
            <React.Fragment>
              <div style={{
                padding: '6px 10px', borderRadius: 5, background: s.bg, border: '1px solid ' + s.border,
                fontSize: fs, lineHeight: 1.5, color: s.bright,
              }}>
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

          {/* After answering quiz: show full idiom card */}
          {config.checked && currentExercise && (
            <div style={{
              display: 'flex', flexDirection: 'column' as const, gap: 3,
              padding: '8px 10px', borderRadius: 6,
              background: config.selected === currentExercise.correctIndex ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)',
              border: '1px solid ' + (config.selected === currentExercise.correctIndex ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'),
            }}>
              <div style={{ fontSize: 8, fontWeight: 700 as const, color: config.selected === currentExercise.correctIndex ? '#4ade80' : '#f87171', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                {config.selected === currentExercise.correctIndex ? 'Correct!' : 'Incorrect'}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Meaning</div>
              <div style={{ fontSize: fs - 1, lineHeight: 1.5, color: s.bright }}>{currentExercise.meaning}</div>
              <div style={{ fontSize: 9, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 1 }}>Origin</div>
              <div style={{ fontSize: fs - 1, lineHeight: 1.5, color: s.text }}>{currentExercise.origin}</div>
              <div style={{ fontSize: 9, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 1 }}>Example</div>
              <div style={{ fontSize: fs - 1, lineHeight: 1.5, color: s.bright, fontStyle: 'italic' as const }}>{currentExercise.example}</div>
            </div>
          )}

          {/* Study mode next button */}
          {config.showMeaning && !config.checked && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={handleNext} style={{ ...s.btnPrimary, fontSize: fs }}>Next</button>
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

function TeacherMode({ isDark, config, onConfigChange, compact }: {
  isDark: boolean
  config: IdiomExplorerConfig
  onConfigChange: (p: Partial<IdiomExplorerConfig>) => void
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
    if (!config.teacherIdiom.trim() || !config.teacherMeaning.trim()) return
    const hasEmpty = config.teacherOptions.some(o => !o.trim())
    if (hasEmpty) return
    const newExercise: IdiomExercise = {
      id: 'custom-' + Date.now(),
      idiom: config.teacherIdiom.trim(),
      meaning: config.teacherMeaning.trim(),
      origin: config.teacherOrigin.trim(),
      example: config.teacherExample.trim(),
      category: 'everyday',
      question: 'What does the idiom \'' + config.teacherIdiom.trim() + '\' mean?',
      options: [
        config.teacherOptions[0],
        config.teacherOptions[1],
        config.teacherOptions[2],
        config.teacherOptions[3],
      ],
      correctIndex: config.teacherCorrect,
    }
    onConfigChange({
      customExercises: [...config.customExercises, newExercise],
      teacherIdiom: '',
      teacherMeaning: '',
      teacherOrigin: '',
      teacherExample: '',
      teacherOptions: ['', '', '', ''],
      teacherCorrect: 0,
    })
  }, [config.teacherIdiom, config.teacherMeaning, config.teacherOrigin, config.teacherExample, config.teacherOptions, config.teacherCorrect, config.customExercises, onConfigChange])

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
          {config.customExercises.length + ' custom idiom' + (config.customExercises.length !== 1 ? 's' : '')}
        </div>
      </div>

      {/* Create Idiom Form */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, padding: '6px 8px', borderRadius: 6, background: s.bg, border: '1px solid ' + s.border }}>
        <div style={{ fontSize: 9, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Create Idiom Exercise</div>

        <input
          placeholder="Idiom (e.g. break a leg)"
          value={config.teacherIdiom}
          onChange={e => onConfigChange({ teacherIdiom: e.target.value })}
          style={{ ...s.input, width: '100%', boxSizing: 'border-box' as const, fontSize: 10 }}
        />

        <input
          placeholder="Meaning"
          value={config.teacherMeaning}
          onChange={e => onConfigChange({ teacherMeaning: e.target.value })}
          style={{ ...s.input, width: '100%', boxSizing: 'border-box' as const, fontSize: 10 }}
        />

        <input
          placeholder="Origin / History (optional)"
          value={config.teacherOrigin}
          onChange={e => onConfigChange({ teacherOrigin: e.target.value })}
          style={{ ...s.input, width: '100%', boxSizing: 'border-box' as const, fontSize: 10 }}
        />

        <input
          placeholder="Example sentence (optional)"
          value={config.teacherExample}
          onChange={e => onConfigChange({ teacherExample: e.target.value })}
          style={{ ...s.input, width: '100%', boxSizing: 'border-box' as const, fontSize: 10 }}
        />

        <div style={{ fontSize: 8, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Quiz Options (click letter to set correct):</div>
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

        <button onClick={handleAddExercise} style={{ ...s.btnPrimary, alignSelf: 'flex-start' as const, fontSize: 9 }}>
          + Add Idiom
        </button>
      </div>

      {/* Custom Exercises List */}
      {config.customExercises.length > 0 && !compact && (
        <div style={{
          maxHeight: 160, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: 2,
          padding: '4px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border,
        }}>
          <div style={{ fontSize: 8, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 1 }}>Custom Idioms</div>
          {config.customExercises.map((ex, i) => (
            <div key={ex.id} style={{
              display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center',
              padding: '3px 6px', borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: '1px solid ' + s.border, fontSize: 9, color: s.bright,
            }}>
              <div style={{ flex: 1, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const }}>
                <span style={{ color: CATEGORY_COLORS[ex.category] || s.text, fontWeight: 600 }}>
                  {ex.category}
                </span>
                {': \'' + ex.idiom + '\' — ' + ex.meaning}
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
