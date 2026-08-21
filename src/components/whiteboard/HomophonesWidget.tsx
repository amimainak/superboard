'use client'

import React, { useMemo, useCallback } from 'react'

// ============================================================
// Types
// ============================================================

export interface HomophoneExercise {
  id: string
  homophonePair: string
  question: string
  options: [string, string, string, string]
  correctIndex: number
  meanings: [string, string]
  exampleSentences: [string, string]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface HomophonesConfig {
  mode: 'student' | 'teacher'
  exerciseIdx: number
  selected: number | null
  checked: boolean
  score: number
  totalAttempted: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  teacherHomophone: string
  teacherMeanings: [string, string]
  teacherQuestion: string
  teacherOptions: [string, string, string, string]
  teacherCorrect: number
  customExercises: HomophoneExercise[]
}

export const DEFAULT_HOMOPHONES_CONFIG: HomophonesConfig = {
  mode: 'student',
  exerciseIdx: 0,
  selected: null,
  checked: false,
  score: 0,
  totalAttempted: 0,
  difficulty: 'beginner',
  teacherHomophone: '',
  teacherMeanings: ['', ''],
  teacherQuestion: '',
  teacherOptions: ['', '', '', ''],
  teacherCorrect: 0,
  customExercises: [],
}

export interface HomophonesProps {
  isDark: boolean
  config: HomophonesConfig
  onConfigChange: (patch: Partial<HomophonesConfig>) => void
  compact?: boolean
}

// ============================================================
// Embedded Exercises
// ============================================================

const HOMOPHONE_EXERCISES: HomophoneExercise[] = [
  // === bare / bear ===
  {
    id: 'hp-01',
    homophonePair: 'bare / bear',
    question: 'The grizzly ___ roamed through the dense forest.',
    options: ['bare', 'bear', 'bair', 'beer'],
    correctIndex: 1,
    meanings: ['bare: not covered or clothed; exposed', 'bear: a large, heavy mammal with thick fur'],
    exampleSentences: ['The ground was completely bare after the fire.', 'We saw a brown bear fishing in the river.'],
    difficulty: 'beginner',
  },
  {
    id: 'hp-02',
    homophonePair: 'bare / bear',
    question: 'She walked on the ___ ground with no shoes on.',
    options: ['bear', 'bare', 'bair', 'bar'],
    correctIndex: 1,
    meanings: ['bare: not covered or clothed; exposed', 'bear: a large, heavy mammal with thick fur'],
    exampleSentences: ['The ground was completely bare after the fire.', 'We saw a brown bear fishing in the river.'],
    difficulty: 'beginner',
  },
  // === board / bored ===
  {
    id: 'hp-03',
    homophonePair: 'board / bored',
    question: 'The students were ___ during the long lecture.',
    options: ['board', 'bored', 'bord', 'baored'],
    correctIndex: 1,
    meanings: ['board: a flat piece of wood or a group managing an organisation', 'bored: feeling weary because one is unoccupied'],
    exampleSentences: ['Please write your answer on the board.', 'The children were bored with nothing to do.'],
    difficulty: 'beginner',
  },
  {
    id: 'hp-04',
    homophonePair: 'board / bored',
    question: 'She pinned the notice to the wooden ___.',
    options: ['bored', 'board', 'bord', 'baord'],
    correctIndex: 1,
    meanings: ['board: a flat piece of wood or a group managing an organisation', 'bored: feeling weary because one is unoccupied'],
    exampleSentences: ['Please write your answer on the board.', 'The children were bored with nothing to do.'],
    difficulty: 'beginner',
  },
  // === brake / break ===
  {
    id: 'hp-05',
    homophonePair: 'brake / break',
    question: 'The driver had to slam on the ___ to avoid the cat.',
    options: ['break', 'brake', 'braik', 'breaik'],
    correctIndex: 1,
    meanings: ['brake: a device for slowing or stopping a vehicle', 'break: to separate into pieces; a pause or rest'],
    exampleSentences: ['Check your brakes before a long drive.', 'Be careful not to break the glass.'],
    difficulty: 'beginner',
  },
  {
    id: 'hp-06',
    homophonePair: 'brake / break',
    question: 'Let us take a short ___ before continuing the hike.',
    options: ['brake', 'break', 'braik', 'breaik'],
    correctIndex: 1,
    meanings: ['brake: a device for slowing or stopping a vehicle', 'break: to separate into pieces; a pause or rest'],
    exampleSentences: ['Check your brakes before a long drive.', 'Be careful not to break the glass.'],
    difficulty: 'beginner',
  },
  // === buy / by / bye ===
  {
    id: 'hp-07',
    homophonePair: 'buy / by / bye',
    question: 'I want to ___ a new book from the shop.',
    options: ['by', 'bye', 'buy', 'bi'],
    correctIndex: 2,
    meanings: ['buy: to purchase something with money', 'by: next to; through; before a deadline'],
    exampleSentences: ['I need to buy milk from the shop.', 'The house by the lake is very pretty.'],
    difficulty: 'beginner',
  },
  {
    id: 'hp-08',
    homophonePair: 'buy / by / bye',
    question: 'The letter must be posted ___ Friday at the latest.',
    options: ['buy', 'bye', 'bi', 'by'],
    correctIndex: 3,
    meanings: ['buy: to purchase something with money', 'by: next to; through; before a deadline'],
    exampleSentences: ['I need to buy milk from the shop.', 'The house by the lake is very pretty.'],
    difficulty: 'beginner',
  },
  // === cell / sell ===
  {
    id: 'hp-09',
    homophonePair: 'cell / sell',
    question: 'The scientist examined the plant ___ under a microscope.',
    options: ['sell', 'cell', 'sal', 'cel'],
    correctIndex: 1,
    meanings: ['cell: the smallest structural and functional unit of an organism', 'sell: to exchange goods or services for money'],
    exampleSentences: ['The red blood cell carries oxygen.', 'They sell fresh fruit at the market.'],
    difficulty: 'intermediate',
  },
  {
    id: 'hp-10',
    homophonePair: 'cell / sell',
    question: 'They plan to ___ their old car and buy a new one.',
    options: ['cell', 'sell', 'sal', 'cel'],
    correctIndex: 1,
    meanings: ['cell: the smallest structural and functional unit of an organism', 'sell: to exchange goods or services for money'],
    exampleSentences: ['The red blood cell carries oxygen.', 'They sell fresh fruit at the market.'],
    difficulty: 'intermediate',
  },
  // === flour / flower ===
  {
    id: 'hp-11',
    homophonePair: 'flour / flower',
    question: 'She used two cups of ___ to bake the cake.',
    options: ['flower', 'flour', 'flaur', 'flouer'],
    correctIndex: 1,
    meanings: ['flour: a powder obtained by grinding grain, used for baking', 'flower: the seed-bearing part of a plant, consisting of reproductive organs'],
    exampleSentences: ['Add the flour gradually to the mixture.', 'The garden was full of colourful flowers.'],
    difficulty: 'intermediate',
  },
  {
    id: 'hp-12',
    homophonePair: 'flour / flower',
    question: 'He picked a beautiful ___ from the garden for her.',
    options: ['flour', 'flower', 'flaur', 'flouer'],
    correctIndex: 1,
    meanings: ['flour: a powder obtained by grinding grain, used for baking', 'flower: the seed-bearing part of a plant, consisting of reproductive organs'],
    exampleSentences: ['Add the flour gradually to the mixture.', 'The garden was full of colourful flowers.'],
    difficulty: 'intermediate',
  },
  // === hair / hare ===
  {
    id: 'hp-13',
    homophonePair: 'hair / hare',
    question: 'The swift ___ dashed across the meadow before the hounds.',
    options: ['hair', 'hare', 'heir', 'haur'],
    correctIndex: 1,
    meanings: ['hair: any of the fine threadlike strands growing from the skin', 'hare: a fast-running mammal that resembles a large rabbit'],
    exampleSentences: ['She brushed her long hair carefully.', 'The hare ran faster than the tortoise.'],
    difficulty: 'intermediate',
  },
  {
    id: 'hp-14',
    homophonePair: 'hair / hare',
    question: 'The wind blew her ___ into her face as she walked.',
    options: ['hare', 'hair', 'heir', 'haur'],
    correctIndex: 1,
    meanings: ['hair: any of the fine threadlike strands growing from the skin', 'hare: a fast-running mammal that resembles a large rabbit'],
    exampleSentences: ['She brushed her long hair carefully.', 'The hare ran faster than the tortoise.'],
    difficulty: 'intermediate',
  },
  // === heal / heel ===
  {
    id: 'hp-15',
    homophonePair: 'heal / heel',
    question: 'It takes time for a broken bone to ___.',
    options: ['heel', 'heal', 'heal', 'heil'],
    correctIndex: 1,
    meanings: ['heal: to become healthy again; to cure', 'heel: the back part of the human foot below the ankle'],
    exampleSentences: ['The wound will heal within a week.', 'She wore high heels to the party.'],
    difficulty: 'intermediate',
  },
  {
    id: 'hp-16',
    homophonePair: 'heal / heel',
    question: 'She twisted her ___ when running on the uneven path.',
    options: ['heal', 'heel', 'heal', 'heil'],
    correctIndex: 1,
    meanings: ['heal: to become healthy again; to cure', 'heel: the back part of the human foot below the ankle'],
    exampleSentences: ['The wound will heal within a week.', 'She wore high heels to the party.'],
    difficulty: 'intermediate',
  },
  // === hole / whole ===
  {
    id: 'hp-17',
    homophonePair: 'hole / whole',
    question: 'The ___ cake was eaten by the children in minutes.',
    options: ['hole', 'whole', 'hoal', 'whol'],
    correctIndex: 1,
    meanings: ['hole: a hollow place in a solid body or surface', 'whole: complete; not divided or broken; entire'],
    exampleSentences: ['There was a hole in my sock.', 'The whole class passed the exam.'],
    difficulty: 'beginner',
  },
  {
    id: 'hp-18',
    homophonePair: 'hole / whole',
    question: 'The gardener dug a ___ to plant the tree.',
    options: ['whole', 'hole', 'hoal', 'whol'],
    correctIndex: 1,
    meanings: ['hole: a hollow place in a solid body or surface', 'whole: complete; not divided or broken; entire'],
    exampleSentences: ['There was a hole in my sock.', 'The whole class passed the exam.'],
    difficulty: 'beginner',
  },
  // === hour / our ===
  {
    id: 'hp-19',
    homophonePair: 'hour / our',
    question: 'The journey takes about one ___ by train.',
    options: ['our', 'hour', 'are', 'owr'],
    correctIndex: 1,
    meanings: ['hour: a period of sixty minutes', 'our: belonging to or associated with us'],
    exampleSentences: ['The shop is open for one more hour.', 'Our team won the match yesterday.'],
    difficulty: 'beginner',
  },
  {
    id: 'hp-20',
    homophonePair: 'hour / our',
    question: '___ school has a beautiful playground.',
    options: ['Hour', 'Our', 'Are', 'Owr'],
    correctIndex: 1,
    meanings: ['hour: a period of sixty minutes', 'our: belonging to or associated with us'],
    exampleSentences: ['The shop is open for one more hour.', 'Our team won the match yesterday.'],
    difficulty: 'beginner',
  },
  // === knight / night ===
  {
    id: 'hp-21',
    homophonePair: 'knight / night',
    question: 'The brave ___ rode his horse into battle.',
    options: ['night', 'knight', 'nigt', 'niht'],
    correctIndex: 1,
    meanings: ['knight: a man who served his sovereign or lord as a mounted soldier in armour', 'night: the period of darkness in each twenty-four hours'],
    exampleSentences: ['The knight wore shining armour.', 'The stars are bright at night.'],
    difficulty: 'intermediate',
  },
  {
    id: 'hp-22',
    homophonePair: 'knight / night',
    question: 'Owls hunt their prey during the ___.',
    options: ['knight', 'night', 'nigt', 'niht'],
    correctIndex: 1,
    meanings: ['knight: a man who served his sovereign or lord as a mounted soldier in armour', 'night: the period of darkness in each twenty-four hours'],
    exampleSentences: ['The knight wore shining armour.', 'The stars are bright at night.'],
    difficulty: 'intermediate',
  },
  // === knew / new ===
  {
    id: 'hp-23',
    homophonePair: 'knew / new',
    question: 'She ___ the answer to every question in the test.',
    options: ['new', 'knew', 'neu', 'gnu'],
    correctIndex: 1,
    meanings: ['knew: past tense of know; to have been aware of', 'new: recently made, discovered, or created'],
    exampleSentences: ['I knew he would arrive late.', 'She bought a new dress for the party.'],
    difficulty: 'beginner',
  },
  {
    id: 'hp-24',
    homophonePair: 'knew / new',
    question: 'The school opened a ___ library last month.',
    options: ['knew', 'new', 'neu', 'gnu'],
    correctIndex: 1,
    meanings: ['knew: past tense of know; to have been aware of', 'new: recently made, discovered, or created'],
    exampleSentences: ['I knew he would arrive late.', 'She bought a new dress for the party.'],
    difficulty: 'beginner',
  },
  // === made / maid ===
  {
    id: 'hp-25',
    homophonePair: 'made / maid',
    question: 'She ___ a delicious dinner for the family.',
    options: ['maid', 'made', 'mayd', 'maed'],
    correctIndex: 1,
    meanings: ['made: past tense of make; to create or construct something', 'maid: a female domestic servant'],
    exampleSentences: ['He made a beautiful painting.', 'The maid cleaned the entire house.'],
    difficulty: 'intermediate',
  },
  {
    id: 'hp-26',
    homophonePair: 'made / maid',
    question: 'The ___ polished every surface until it shone.',
    options: ['made', 'maid', 'mayd', 'maed'],
    correctIndex: 1,
    meanings: ['made: past tense of make; to create or construct something', 'maid: a female domestic servant'],
    exampleSentences: ['He made a beautiful painting.', 'The maid cleaned the entire house.'],
    difficulty: 'intermediate',
  },
  // === pair / pear ===
  {
    id: 'hp-27',
    homophonePair: 'pair / pear',
    question: 'I bought a new ___ of shoes for the wedding.',
    options: ['pear', 'pair', 'pare', 'peir'],
    correctIndex: 1,
    meanings: ['pair: a set of two things used together or regarded as a unit', 'pear: a sweet, juicy fruit that is narrow near the stem'],
    exampleSentences: ['I need a pair of gloves for winter.', 'She ate a ripe pear for dessert.'],
    difficulty: 'beginner',
  },
  {
    id: 'hp-28',
    homophonePair: 'pair / pear',
    question: 'The ___ was ripe and sweet, perfect for a snack.',
    options: ['pair', 'pear', 'pare', 'peir'],
    correctIndex: 1,
    meanings: ['pair: a set of two things used together or regarded as a unit', 'pear: a sweet, juicy fruit that is narrow near the stem'],
    exampleSentences: ['I need a pair of gloves for winter.', 'She ate a ripe pear for dessert.'],
    difficulty: 'beginner',
  },
  // === peace / piece ===
  {
    id: 'hp-29',
    homophonePair: 'peace / piece',
    question: 'The two nations signed a ___ agreement after years of conflict.',
    options: ['piece', 'peace', 'peas', 'peese'],
    correctIndex: 1,
    meanings: ['peace: freedom from disturbance; a state of tranquillity or quiet', 'piece: a portion of an object or of material, produced by cutting or tearing'],
    exampleSentences: ['We all want world peace.', 'Can I have a piece of cake?'],
    difficulty: 'intermediate',
  },
  {
    id: 'hp-30',
    homophonePair: 'peace / piece',
    question: 'Would you like another ___ of chocolate?',
    options: ['peace', 'piece', 'peas', 'peese'],
    correctIndex: 1,
    meanings: ['peace: freedom from disturbance; a state of tranquillity or quiet', 'piece: a portion of an object or of material, produced by cutting or tearing'],
    exampleSentences: ['We all want world peace.', 'Can I have a piece of cake?'],
    difficulty: 'intermediate',
  },
  // === plain / plane ===
  {
    id: 'hp-31',
    homophonePair: 'plain / plane',
    question: 'The ___ flew smoothly through the clouds.',
    options: ['plain', 'plane', 'plaine', 'plaine'],
    correctIndex: 1,
    meanings: ['plain: not decorated or elaborate; simple', 'plane: a flying vehicle with fixed wings and a weight greater than air'],
    exampleSentences: ['She wore a plain white dress.', 'The plane landed on time.'],
    difficulty: 'intermediate',
  },
  {
    id: 'hp-32',
    homophonePair: 'plain / plane',
    question: 'The truth was ___ for everyone to see.',
    options: ['plane', 'plain', 'plaine', 'plaine'],
    correctIndex: 1,
    meanings: ['plain: not decorated or elaborate; simple', 'plane: a flying vehicle with fixed wings and a weight greater than air'],
    exampleSentences: ['She wore a plain white dress.', 'The plane landed on time.'],
    difficulty: 'intermediate',
  },
  // === poor / pour ===
  {
    id: 'hp-33',
    homophonePair: 'poor / pour',
    question: 'Please ___ me a glass of water.',
    options: ['poor', 'pour', 'pore', 'poar'],
    correctIndex: 1,
    meanings: ['poor: lacking sufficient money to live comfortably', 'pour: to flow rapidly in a steady stream'],
    exampleSentences: ['The poor family needed help.', 'Pour the milk into the bowl.'],
    difficulty: 'beginner',
  },
  {
    id: 'hp-34',
    homophonePair: 'poor / pour',
    question: 'The ___ family received food from the charity.',
    options: ['pour', 'poor', 'pore', 'poar'],
    correctIndex: 1,
    meanings: ['poor: lacking sufficient money to live comfortably', 'pour: to flow rapidly in a steady stream'],
    exampleSentences: ['The poor family needed help.', 'Pour the milk into the bowl.'],
    difficulty: 'beginner',
  },
  // === read / red (tricky) ===
  {
    id: 'hp-35',
    homophonePair: 'read / red',
    question: 'She ___ the entire book in one sitting.',
    options: ['red', 'read', 'reed', 'raid'],
    correctIndex: 1,
    meanings: ['read: to look at and comprehend the meaning of written or printed words', 'red: the colour at the long-wavelength end of the visible spectrum'],
    exampleSentences: ['I read a story every night before bed.', 'She wore a beautiful red dress.'],
    difficulty: 'advanced',
  },
  {
    id: 'hp-36',
    homophonePair: 'read / red',
    question: 'The ___ light flashed, and the car stopped.',
    options: ['read', 'red', 'reed', 'raid'],
    correctIndex: 1,
    meanings: ['read: to look at and comprehend the meaning of written or printed words', 'red: the colour at the long-wavelength end of the visible spectrum'],
    exampleSentences: ['I read a story every night before bed.', 'She wore a beautiful red dress.'],
    difficulty: 'advanced',
  },
  // === sail / sale ===
  {
    id: 'hp-37',
    homophonePair: 'sail / sale',
    question: 'The shop is having a big ___ this weekend.',
    options: ['sail', 'sale', 'sal', 'saile'],
    correctIndex: 1,
    meanings: ['sail: a piece of material extended on a mast to catch the wind and propel a boat', 'sale: the exchange of a commodity for money; an event where goods are sold at reduced prices'],
    exampleSentences: ['The ship set sail at dawn.', 'There is a sale on shoes at the shop.'],
    difficulty: 'intermediate',
  },
  {
    id: 'hp-38',
    homophonePair: 'sail / sale',
    question: 'The boat will ___ across the lake tomorrow morning.',
    options: ['sale', 'sail', 'sal', 'saile'],
    correctIndex: 1,
    meanings: ['sail: a piece of material extended on a mast to catch the wind and propel a boat', 'sale: the exchange of a commodity for money; an event where goods are sold at reduced prices'],
    exampleSentences: ['The ship set sail at dawn.', 'There is a sale on shoes at the shop.'],
    difficulty: 'intermediate',
  },
  // === sea / see ===
  {
    id: 'hp-39',
    homophonePair: 'sea / see',
    question: 'The children loved playing by the ___.',
    options: ['see', 'sea', 'se', 'sei'],
    correctIndex: 1,
    meanings: ['sea: the expanse of salt water that covers most of the earth', 'see: to perceive with the eyes; to understand or realise'],
    exampleSentences: ['The sea was calm and blue today.', 'I can see the mountains from here.'],
    difficulty: 'beginner',
  },
  {
    id: 'hp-40',
    homophonePair: 'sea / see',
    question: 'Can you ___ the bird in that tall tree?',
    options: ['sea', 'see', 'se', 'sei'],
    correctIndex: 1,
    meanings: ['sea: the expanse of salt water that covers most of the earth', 'see: to perceive with the eyes; to understand or realise'],
    exampleSentences: ['The sea was calm and blue today.', 'I can see the mountains from here.'],
    difficulty: 'beginner',
  },
  // === son / sun ===
  {
    id: 'hp-41',
    homophonePair: 'son / sun',
    question: 'The ___ rose at six in the morning.',
    options: ['son', 'sun', 'sin', 'san'],
    correctIndex: 1,
    meanings: ['son: a boy or man in relation to either or both of his parents', 'sun: the star around which the earth orbits'],
    exampleSentences: ['Their son graduated from university.', 'The sun is very bright today.'],
    difficulty: 'beginner',
  },
  {
    id: 'hp-42',
    homophonePair: 'son / sun',
    question: 'Mr and Mrs Lee were proud of their ___.',
    options: ['sun', 'son', 'sin', 'san'],
    correctIndex: 1,
    meanings: ['son: a boy or man in relation to either or both of his parents', 'sun: the star around which the earth orbits'],
    exampleSentences: ['Their son graduated from university.', 'The sun is very bright today.'],
    difficulty: 'beginner',
  },
  // === steal / steel ===
  {
    id: 'hp-43',
    homophonePair: 'steal / steel',
    question: 'The bridge was made of strong ___.',
    options: ['steal', 'steel', 'stael', 'steal'],
    correctIndex: 1,
    meanings: ['steal: to take another person\'s property without permission', 'steel: a hard, strong alloy of iron and carbon'],
    exampleSentences: ['Thieves tried to steal the painting.', 'The building has a steel frame.'],
    difficulty: 'intermediate',
  },
  {
    id: 'hp-44',
    homophonePair: 'steal / steel',
    question: 'Someone tried to ___ her bicycle from the rack.',
    options: ['steel', 'steal', 'stael', 'steal'],
    correctIndex: 1,
    meanings: ['steal: to take another person\'s property without permission', 'steel: a hard, strong alloy of iron and carbon'],
    exampleSentences: ['Thieves tried to steal the painting.', 'The building has a steel frame.'],
    difficulty: 'intermediate',
  },
  // === tail / tale ===
  {
    id: 'hp-45',
    homophonePair: 'tail / tale',
    question: 'The cat wagged its ___ happily.',
    options: ['tale', 'tail', 'tail', 'tale'],
    correctIndex: 1,
    meanings: ['tail: the hindmost part of an animal', 'tale: a fictitious or true narrative or story'],
    exampleSentences: ['The dog wagged its tail.', 'She told a fascinating tale about her travels.'],
    difficulty: 'beginner',
  },
  {
    id: 'hp-46',
    homophonePair: 'tail / tale',
    question: 'Grandma told us a wonderful ___ about her childhood.',
    options: ['tail', 'tale', 'tail', 'tale'],
    correctIndex: 1,
    meanings: ['tail: the hindmost part of an animal', 'tale: a fictitious or true narrative or story'],
    exampleSentences: ['The dog wagged its tail.', 'She told a fascinating tale about her travels.'],
    difficulty: 'beginner',
  },
  // === weak / week ===
  {
    id: 'hp-47',
    homophonePair: 'weak / week',
    question: 'After being ill for a ___, she finally recovered.',
    options: ['weak', 'week', 'wek', 'waek'],
    correctIndex: 1,
    meanings: ['weak: lacking the power to perform physically demanding tasks', 'week: a period of seven days'],
    exampleSentences: ['He felt too weak to walk.', 'We go to the park every week.'],
    difficulty: 'beginner',
  },
  {
    id: 'hp-48',
    homophonePair: 'weak / week',
    question: 'The old bridge was too ___ to support heavy trucks.',
    options: ['week', 'weak', 'wek', 'waek'],
    correctIndex: 1,
    meanings: ['weak: lacking the power to perform physically demanding tasks', 'week: a period of seven days'],
    exampleSentences: ['He felt too weak to walk.', 'We go to the park every week.'],
    difficulty: 'beginner',
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

export function HomophonesWidget({ isDark, config, onConfigChange, compact }: HomophonesProps) {
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
  config: HomophonesConfig
  onConfigChange: (p: Partial<HomophonesConfig>) => void
  fs: number
  s: ReturnType<typeof sh>
  compact: boolean
}) {
  const allExercises = useMemo(() => {
    return [...HOMOPHONE_EXERCISES, ...config.customExercises]
  }, [config.customExercises])

  const filteredExercises = useMemo(() => {
    if (config.difficulty === 'beginner') return allExercises.filter(e => e.difficulty === 'beginner')
    if (config.difficulty === 'intermediate') return allExercises.filter(e => e.difficulty === 'intermediate')
    if (config.difficulty === 'advanced') return allExercises.filter(e => e.difficulty === 'advanced')
    return allExercises
  }, [allExercises, config.difficulty])

  const currentExercise = useMemo((): HomophoneExercise | null => {
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

  const handleDifficultyChange = useCallback((d: 'beginner' | 'intermediate' | 'advanced') => {
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
          No exercises available for this level. Try a different difficulty.
        </div>
      ) : (
        <React.Fragment>
          {/* Question */}
          <div style={{
            padding: '8px 10px', borderRadius: 6, background: s.bg,
            border: '1px solid ' + s.border, fontSize: fs + 1, lineHeight: 1.5, color: s.bright,
          }}>
            <div style={{ fontSize: 8, fontWeight: 700 as const, color: diffColor(currentExercise.difficulty), textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 3 }}>
              {currentExercise.homophonePair} | {currentExercise.difficulty}
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
              {!isCorrect && (
                <div style={{ marginTop: 2, color: '#4ade80' }}>
                  Correct answer: {currentExercise.options[currentExercise.correctIndex]}
                </div>
              )}
            </div>
          )}

          {/* Homophone meanings (shown after answering) */}
          {config.checked && currentExercise && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 2,
              padding: '6px 8px', borderRadius: 5, fontSize: fs - 1, lineHeight: 1.5,
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.2)',
            }}>
              <div style={{ fontSize: 8, fontWeight: 700 as const, color: '#60a5fa', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 1 }}>
                Homophone Reference
              </div>
              {currentExercise.meanings.map((m, i) => (
                <div key={i} style={{ color: s.bright }}>
                  <div style={{ fontWeight: 600 as const, color: '#93c5fd', marginBottom: 1 }}>{currentExercise.homophonePair.split(' / ')[i] || ''}</div>
                  <div style={{ color: s.text, marginBottom: 1 }}>{m}</div>
                  <div style={{ fontStyle: 'italic' as const, color: s.text }}>{currentExercise.exampleSentences[i]}</div>
                </div>
              ))}
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
  config: HomophonesConfig
  onConfigChange: (p: Partial<HomophonesConfig>) => void
  fs: number
  s: ReturnType<typeof sh>
  compact: boolean
}) {
  const handleOptionEdit = useCallback((index: number, value: string) => {
    const newOptions: [string, string, string, string] = [config.teacherOptions[0], config.teacherOptions[1], config.teacherOptions[2], config.teacherOptions[3]]
    newOptions[index] = value
    onConfigChange({ teacherOptions: newOptions })
  }, [config.teacherOptions, onConfigChange])

  const handleMeaningEdit = useCallback((index: number, value: string) => {
    const newMeanings: [string, string] = [config.teacherMeanings[0], config.teacherMeanings[1]]
    newMeanings[index] = value
    onConfigChange({ teacherMeanings: newMeanings })
  }, [config.teacherMeanings, onConfigChange])

  const handleSetCorrect = useCallback((index: number) => {
    onConfigChange({ teacherCorrect: index })
  }, [onConfigChange])

  const handleAddExercise = useCallback(() => {
    if (!config.teacherQuestion.trim() || !config.teacherOptions[0].trim() || !config.teacherHomophone.trim()) return
    const newExercise: HomophoneExercise = {
      id: 'hp-custom-' + Date.now(),
      homophonePair: config.teacherHomophone,
      question: config.teacherQuestion,
      options: [config.teacherOptions[0], config.teacherOptions[1], config.teacherOptions[2], config.teacherOptions[3]],
      correctIndex: config.teacherCorrect,
      meanings: [config.teacherMeanings[0], config.teacherMeanings[1]],
      exampleSentences: ['', ''],
      difficulty: 'intermediate',
    }
    onConfigChange({
      customExercises: [...config.customExercises, newExercise],
      teacherHomophone: '',
      teacherMeanings: ['', ''],
      teacherQuestion: '',
      teacherOptions: ['', '', '', ''],
      teacherCorrect: 0,
    })
  }, [config.teacherQuestion, config.teacherOptions, config.teacherCorrect, config.teacherHomophone, config.teacherMeanings, config.customExercises, onConfigChange])

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
          placeholder="Homophone pair (e.g. bare / bear)"
          value={config.teacherHomophone}
          onChange={e => onConfigChange({ teacherHomophone: e.target.value })}
          style={{ ...s.input, width: '100%', boxSizing: 'border-box' as const }}
        />

        <input
          placeholder="Question (e.g. The grizzly ___ roamed the forest.)"
          value={config.teacherQuestion}
          onChange={e => onConfigChange({ teacherQuestion: e.target.value })}
          style={{ ...s.input, width: '100%', boxSizing: 'border-box' as const }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
        </div>

        <div style={{ fontSize: 8, fontWeight: 700 as const, color: s.text, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Meanings:</div>
        {config.teacherMeanings.map((m, i) => (
          <input
            key={i}
            placeholder={'Meaning of homophone ' + (i + 1)}
            value={m}
            onChange={e => handleMeaningEdit(i, e.target.value)}
            style={{ ...s.input, width: '100%', boxSizing: 'border-box' as const, fontSize: 10 }}
          />
        ))}

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
                {ex.homophonePair + ': ' + ex.question}
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