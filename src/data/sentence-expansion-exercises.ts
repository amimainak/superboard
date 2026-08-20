// ============================================================
// Sentence Expansion Exercises — organized by type, difficulty, grade band
// Architecture: data-file-based, consumed by unified widget component
// ============================================================

export type ExpansionType = 'add-adjectives' | 'add-adverbs' | 'add-prepositional' | 'combine-sentences' | 'add-clause'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type GradeBand = 'K-5' | '6-8' | '9-12'

export interface ExpansionExercise {
  id: string
  type: ExpansionType
  difficulty: Difficulty
  band: GradeBand
  baseSentence: string
  question: string
  options: [string, string, string]
  correctIndex: 0 | 1 | 2
  explanations: [string, string, string]
}

export const EXPANSION_TYPES: { id: ExpansionType; label: string; description: string }[] = [
  { id: 'add-adjectives', label: 'Add Adjectives', description: 'Expand sentences by adding descriptive adjectives' },
  { id: 'add-adverbs', label: 'Add Adverbs', description: 'Expand sentences by adding adverbs that modify verbs' },
  { id: 'add-prepositional', label: 'Add Prepositional', description: 'Expand sentences by adding prepositional phrases' },
  { id: 'combine-sentences', label: 'Combine Sentences', description: 'Combine two simple sentences into one expanded sentence' },
  { id: 'add-clause', label: 'Add Clause', description: 'Expand sentences by adding dependent or subordinate clauses' },
]

// ============================================================
// Exercises: add-adjectives
// ============================================================

const addAdjectives: ExpansionExercise[] = [
  {
    id: 'adj-1',
    type: 'add-adjectives',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'The dog ran.',
    question: 'Which is the best way to expand "The dog ran." by adding adjectives?',
    options: [
      'The big brown dog ran.',
      'The dog ran the big.',
      'The dog big ran brown.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Big" and "brown" are adjectives placed before the noun "dog," making the sentence more descriptive.',
      'Incorrect. "The dog ran the big" does not make sense grammatically.',
      'Incorrect. Adjectives should come before the noun they describe, not after the verb.',
    ],
  },
  {
    id: 'adj-2',
    type: 'add-adjectives',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'I saw a cat.',
    question: 'Which expanded version of "I saw a cat." uses adjectives correctly?',
    options: [
      'I saw a fluffy orange cat.',
      'I saw a cat fluffy.',
      'I saw a cat the fluffy.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Fluffy" and "orange" are adjectives placed before the noun "cat."',
      'Incorrect. The adjective "fluffy" should come before "cat," not after it.',
      'Incorrect. Adding "the" before "fluffy" breaks the sentence structure.',
    ],
  },
  {
    id: 'adj-3',
    type: 'add-adjectives',
    difficulty: 'intermediate',
    band: 'K-5',
    baseSentence: 'The tree stood.',
    question: 'Which is the best adjective expansion of "The tree stood."?',
    options: [
      'The old, twisted oak tree stood.',
      'The tree stood old twisted.',
      'The stood old tree twisted.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! Multiple adjectives are properly placed before the noun with a comma between coordinate adjectives.',
      'Incorrect. Adjectives go before the noun, not after the verb.',
      'Incorrect. The word order is scrambled.',
    ],
  },
  {
    id: 'adj-4',
    type: 'add-adjectives',
    difficulty: 'intermediate',
    band: '6-8',
    baseSentence: 'She found a book.',
    question: 'How can you best expand "She found a book." using adjectives?',
    options: [
      'She found a dusty, leather-bound book.',
      'She found a book dusty leather.',
      'She dusty found a book leather-bound.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Dusty" and "leather-bound" are descriptive adjectives placed before the noun.',
      'Incorrect. Adjectives should come before the noun, not in a list after it.',
      'Incorrect. Adjectives modify nouns, so they must be placed near the noun "book."',
    ],
  },
  {
    id: 'adj-5',
    type: 'add-adjectives',
    difficulty: 'advanced',
    band: '6-8',
    baseSentence: 'The car sped away.',
    question: 'Which is the most vivid adjective expansion of "The car sped away."?',
    options: [
      'The sleek, midnight-black sports car sped away.',
      'The car sleek sped away midnight-black.',
      'The sped car sleek away midnight-black.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! Multiple vivid adjectives create a clear picture and are properly placed before the noun.',
      'Incorrect. The adjectives are in the wrong position.',
      'Incorrect. This scrambles the entire sentence structure.',
    ],
  },
  {
    id: 'adj-6',
    type: 'add-adjectives',
    difficulty: 'advanced',
    band: '9-12',
    baseSentence: 'The house sat on the hill.',
    question: 'Which expanded version best enhances "The house sat on the hill." with adjectives?',
    options: [
      'The dilapidated Victorian house sat on the hill.',
      'The house dilapidated sat on the Victorian hill.',
      'The sat dilapidated house on Victorian the hill.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Dilapidated" and "Victorian" add vivid description and are correctly placed before the noun.',
      'Incorrect. "Dilapidated" modifies "house," not the verb "sat."',
      'Incorrect. This completely disrupts the sentence grammar.',
    ],
  },
  {
    id: 'adj-7',
    type: 'add-adjectives',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'A bird flew.',
    question: 'Which is the best adjective expansion of "A bird flew."?',
    options: [
      'A colorful little bird flew.',
      'A bird colorful little flew.',
      'A flew colorful little bird.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Colorful" and "little" are adjectives placed before the noun "bird."',
      'Incorrect. Adjectives go before the noun, not after it.',
      'Incorrect. "Flew" is a verb and cannot have adjectives placed before it like this.',
    ],
  },
  {
    id: 'adj-8',
    type: 'add-adjectives',
    difficulty: 'intermediate',
    band: '6-8',
    baseSentence: 'He wore a jacket.',
    question: 'Which adjective expansion best enhances "He wore a jacket."?',
    options: [
      'He wore a warm, waterproof jacket.',
      'He wore a jacket warm waterproof.',
      'He warm wore a waterproof jacket.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Warm" and "waterproof" are coordinate adjectives correctly placed before the noun with a comma.',
      'Incorrect. Adjectives must come before the noun they modify.',
      'Incorrect. "Warm" cannot be placed between the subject and verb like this.',
    ],
  },
  // --- NEW EXERCISES adj-9 through adj-40 ---
  {
    id: 'adj-9',
    type: 'add-adjectives',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'The girl smiled.',
    question: 'Which option adds detail correctly to "The girl smiled."?',
    options: [
      'The girl smiled happy.',
      'The happy, little girl smiled.',
      'The smiled happy girl little.',
    ],
    correctIndex: 1,
    explanations: [
      'Incorrect. "Happy" is an adjective and cannot modify the verb "smiled" directly without becoming an adverb ("happily").',
      'Correct! "Happy" and "little" are adjectives placed before the noun "girl" to describe her.',
      'Incorrect. The sentence structure is scrambled — adjectives must go before the noun.',
    ],
  },
  {
    id: 'adj-10',
    type: 'add-adjectives',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'A rabbit hopped.',
    question: 'Which expanded sentence sounds most natural?',
    options: [
      'A rabbit small hopped fluffy.',
      'A hopped rabbit small fluffy.',
      'A small, fluffy rabbit hopped.',
    ],
    correctIndex: 2,
    explanations: [
      'Incorrect. The adjectives "small" and "fluffy" should come before the noun, not after the verb.',
      'Incorrect. "Hopped" is a verb and cannot have adjectives placed right after it like this.',
      'Correct! "Small" and "fluffy" are adjectives correctly placed before the noun "rabbit."',
    ],
  },
  {
    id: 'adj-11',
    type: 'add-adjectives',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'The man walked.',
    question: 'How can you best expand "The man walked." using adjectives?',
    options: [
      'The tall, kind man walked.',
      'The man walked tall kind.',
      'The tall man walked kind.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Tall" and "kind" are adjectives placed before the noun "man" to describe him.',
      'Incorrect. Adjectives go before the noun, not after the verb.',
      'Incorrect. "Kind" is an adjective modifying a person, so it belongs before "man," not after the verb.',
    ],
  },
  {
    id: 'adj-12',
    type: 'add-adjectives',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'I ate a sandwich.',
    question: 'Which is the best way to expand "I ate a sandwich." by adding adjectives?',
    options: [
      'I ate a sandwich big and tasty.',
      'I ate a big, tasty sandwich.',
      'I big ate a tasty sandwich.',
    ],
    correctIndex: 1,
    explanations: [
      'Incorrect. The adjectives should come before the noun "sandwich," not after it.',
      'Correct! "Big" and "tasty" are adjectives properly placed before the noun with a comma between them.',
      'Incorrect. "Big" is placed between the subject and verb, which does not work grammatically.',
    ],
  },
  {
    id: 'adj-13',
    type: 'add-adjectives',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'The flower grew.',
    question: 'Which expanded version of "The flower grew." uses adjectives correctly?',
    options: [
      'The beautiful, red flower grew.',
      'The flower grew beautiful red.',
      'The grew beautiful red flower.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Beautiful" and "red" are adjectives placed before the noun "flower."',
      'Incorrect. Adjectives belong before the noun, not after the verb.',
      'Incorrect. The verb "grew" cannot be followed directly by adjectives in this way.',
    ],
  },
  {
    id: 'adj-14',
    type: 'add-adjectives',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'A train arrived.',
    question: 'Which option correctly expands "A train arrived." with adjectives?',
    options: [
      'A arrived train long and loud.',
      'A long, loud train arrived.',
      'A train arrived long loud.',
    ],
    correctIndex: 1,
    explanations: [
      'Incorrect. Adjectives should be placed before the noun, not after the verb.',
      'Correct! "Long" and "loud" are adjectives placed before the noun "train" to create a vivid image.',
      'Incorrect. Adjectives cannot be placed after the verb in this manner.',
    ],
  },
  {
    id: 'adj-15',
    type: 'add-adjectives',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'The baby cried.',
    question: 'Which is the best adjective expansion of "The baby cried."?',
    options: [
      'The baby cried tiny hungry.',
      'The tiny, hungry baby cried.',
      'The cried tiny hungry baby.',
    ],
    correctIndex: 1,
    explanations: [
      'Incorrect. "Tiny" and "hungry" are adjectives and should go before the noun "baby."',
      'Correct! "Tiny" and "hungry" are adjectives correctly placed before the noun "baby."',
      'Incorrect. Starting the sentence with the verb makes the sentence ungrammatical.',
    ],
  },
  {
    id: 'adj-16',
    type: 'add-adjectives',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'We saw a fish.',
    question: 'Which expanded sentence sounds most natural?',
    options: [
      'We saw a shiny, silver fish.',
      'We saw a fish shiny silver.',
      'We shiny saw a silver fish.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Shiny" and "silver" are adjectives placed before the noun "fish."',
      'Incorrect. Adjectives need to come before the noun they describe.',
      'Incorrect. "Shiny" cannot be placed between the subject and verb.',
    ],
  },
  {
    id: 'adj-17',
    type: 'add-adjectives',
    difficulty: 'beginner',
    band: '6-8',
    baseSentence: 'The student answered.',
    question: 'Which adds detail correctly to "The student answered."?',
    options: [
      'The confident student answered the question correctly.',
      'The student answered confident.',
      'The answered confident student.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Confident" is an adjective describing the student, placed before the noun.',
      'Incorrect. "Confident" is an adjective and needs to be before a noun, not after a verb.',
      'Incorrect. Starting with the verb followed by an adjective does not form a valid sentence.',
    ],
  },
  {
    id: 'adj-18',
    type: 'add-adjectives',
    difficulty: 'intermediate',
    band: 'K-5',
    baseSentence: 'The cake tasted good.',
    question: 'Which expanded sentence sounds most natural for "The cake tasted good."?',
    options: [
      'The chocolate, creamy cake tasted good.',
      'The cake tasted good chocolate creamy.',
      'The chocolate cake tasted good creamy.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Chocolate" and "creamy" are adjectives that describe what kind of cake it is.',
      'Incorrect. These adjectives need to come before the noun "cake," not at the end.',
      'Incorrect. "Creamy" as an adjective should be grouped with the other adjectives before "cake."',
    ],
  },
  {
    id: 'adj-19',
    type: 'add-adjectives',
    difficulty: 'intermediate',
    band: 'K-5',
    baseSentence: 'The monkey swung.',
    question: 'Which option correctly expands "The monkey swung." with adjectives?',
    options: [
      'The monkey swung playful little.',
      'The playful, little monkey swung.',
      'The playful monkey swung little.',
    ],
    correctIndex: 1,
    explanations: [
      'Incorrect. Adjectives should be placed before the noun, not after the verb.',
      'Correct! "Playful" and "little" are adjectives placed before the noun "monkey."',
      'Incorrect. "Little" is an adjective and should be with the other adjectives before "monkey."',
    ],
  },
  {
    id: 'adj-20',
    type: 'add-adjectives',
    difficulty: 'intermediate',
    band: 'K-5',
    baseSentence: 'A storm came.',
    question: 'How can you best expand "A storm came." using adjectives?',
    options: [
      'A fierce, sudden storm came.',
      'A storm came fierce sudden.',
      'A fierce storm came sudden.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Fierce" and "sudden" are adjectives that describe the storm, placed before the noun.',
      'Incorrect. Adjectives need to go before the noun "storm," not after the verb.',
      'Incorrect. "Sudden" should be before "storm" along with the other adjective.',
    ],
  },
  {
    id: 'adj-21',
    type: 'add-adjectives',
    difficulty: 'intermediate',
    band: 'K-5',
    baseSentence: 'The horse galloped.',
    question: 'Which is the best way to expand "The horse galloped." by adding adjectives?',
    options: [
      'The galloped horse powerful brown.',
      'The horse galloped powerful brown.',
      'The powerful, brown horse galloped.',
    ],
    correctIndex: 2,
    explanations: [
      'Incorrect. Starting with the verb and following it with adjectives is not correct sentence structure.',
      'Incorrect. Adjectives go before the noun, not after the verb.',
      'Correct! "Powerful" and "brown" are adjectives correctly placed before the noun "horse."',
    ],
  },
  {
    id: 'adj-22',
    type: 'add-adjectives',
    difficulty: 'intermediate',
    band: 'K-5',
    baseSentence: 'The owl hooted.',
    question: 'Which expanded version of "The owl hooted." uses adjectives correctly?',
    options: [
      'The wise, old owl hooted.',
      'The owl hooted wise old.',
      'The wise owl hooted old.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Wise" and "old" are adjectives placed before the noun "owl" to create a vivid image.',
      'Incorrect. Adjectives belong before the noun, not after the verb.',
      'Incorrect. "Old" should be placed with "wise" before "owl," not after the verb.',
    ],
  },
]

// Combine all exercises into single export
export const EXPANSION_EXERCISES: ExpansionExercise[] = [
  ...addAdjectives,
]

export function getExercisesByFilter(filter: {
  types?: ExpansionType[]
  difficulty?: Difficulty | 'all'
  band?: GradeBand | 'all'
}): ExpansionExercise[] {
  return EXPANSION_EXERCISES.filter(e => {
    if (filter.types && filter.types.length > 0 && !filter.types.includes(e.type)) return false
    if (filter.difficulty && filter.difficulty !== 'all' && e.difficulty !== filter.difficulty) return false
    if (filter.band && filter.band !== 'all' && e.band !== filter.band) return false
    return true
  })
}

export function shuffleExercises(exercises: ExpansionExercise[]): ExpansionExercise[] {
  const arr = [...exercises]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function getExerciseById(id: string): ExpansionExercise | undefined {
  return EXPANSION_EXERCISES.find(e => e.id === id)
}

export function generateWrongVariants(sentence: string, type: ExpansionType): [string, string] {
  if (type === 'add-adjectives') {
    const words = sentence.split(' ')
    const nounIdx = words.findIndex((w, i) => i > 0 && /^[a-z]/.test(w))
    if (nounIdx > 0) {
      const bad1 = words.slice(0, nounIdx).join(' ') + ' very ' + words.slice(nounIdx).join(' ')
      const bad2 = words.join(' ') + ' quickly'
      return [bad1, bad2]
    }
  }
  return [sentence + ' quickly', sentence + ' loudly']
}
    