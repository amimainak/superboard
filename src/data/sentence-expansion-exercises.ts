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
]

// ============================================================
// Exercises: add-adverbs
// ============================================================

const addAdverbs: ExpansionExercise[] = [
  {
    id: 'adv-1',
    type: 'add-adverbs',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'She read the book.',
    question: 'Which expanded version of "She read the book." correctly adds an adverb?',
    options: [
      'She read the book carefully.',
      'She read the careful book.',
      'She careful read the book.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Carefully" is an adverb that tells how she read. It ends in -ly and modifies the verb.',
      'Incorrect. "Careful" is an adjective, not an adverb. Adverbs modify verbs.',
      'Incorrect. "Careful" is an adjective form. The adverb form is "carefully."',
    ],
  },
  {
    id: 'adv-2',
    type: 'add-adverbs',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'The boy jumped.',
    question: 'Which is the best way to add an adverb to "The boy jumped."?',
    options: [
      'The boy jumped high.',
      'The boy high jumped.',
      'The high boy jumped.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "High" is an adverb here telling how the boy jumped.',
      'Incorrect. "High jumped" changes the meaning to a sport (high jump).',
      'Incorrect. "High" as an adjective before "boy" describes the boy, not how he jumped.',
    ],
  },
  {
    id: 'adv-3',
    type: 'add-adverbs',
    difficulty: 'intermediate',
    band: 'K-5',
    baseSentence: 'The team won.',
    question: 'Which expanded version of "The team won." uses an adverb correctly?',
    options: [
      'The team won easily.',
      'The team won easy.',
      'The easy team won.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Easily" is an adverb that tells how the team won.',
      'Incorrect. "Easy" is an adjective. You need the adverb form "easily" to modify the verb.',
      'Incorrect. "Easy" as an adjective describes the team, not how they won.',
    ],
  },
  {
    id: 'adv-4',
    type: 'add-adverbs',
    difficulty: 'intermediate',
    band: '6-8',
    baseSentence: 'The singer performed.',
    question: 'Which is the best adverb expansion of "The singer performed."?',
    options: [
      'The singer performed beautifully.',
      'The beautiful singer performed.',
      'The singer beautiful performed.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Beautifully" is an adverb modifying the verb "performed," telling how she performed.',
      'Incorrect. "Beautiful" is an adjective modifying the noun "singer," not the verb.',
      'Incorrect. "Beautiful" is the adjective form; the adverb form is "beautifully."',
    ],
  },
  {
    id: 'adv-5',
    type: 'add-adverbs',
    difficulty: 'advanced',
    band: '6-8',
    baseSentence: 'He finished the test.',
    question: 'Which expanded sentence correctly adds an adverb to "He finished the test."?',
    options: [
      'He finished the test remarkably quickly.',
      'He remarkable finished the test quickly.',
      'He finished remarkable the test quick.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Remarkably" and "quickly" are both adverbs properly modifying the verb.',
      'Incorrect. "Remarkable" is an adjective, not an adverb.',
      'Incorrect. "Remarkable" is an adjective and "quick" should be "quickly" as an adverb.',
    ],
  },
  {
    id: 'adv-6',
    type: 'add-adverbs',
    difficulty: 'advanced',
    band: '9-12',
    baseSentence: 'The scientist spoke.',
    question: 'Which adverb expansion best enhances "The scientist spoke."?',
    options: [
      'The scientist spoke eloquently and persuasively.',
      'The scientist spoke eloquent and persuasive.',
      'The eloquent scientist spoke persuasive.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Eloquently" and "persuasively" are adverbs modifying the verb "spoke."',
      'Incorrect. "Eloquent" and "persuasive" are adjectives. Use the -ly adverb forms.',
      'Incorrect. These are adjectives modifying nouns, not adverbs modifying the verb.',
    ],
  },
  {
    id: 'adv-7',
    type: 'add-adverbs',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'The rain fell.',
    question: 'Which is the best adverb expansion of "The rain fell."?',
    options: [
      'The rain fell softly.',
      'The soft rain fell.',
      'The rain fell soft.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Softly" is an adverb telling how the rain fell.',
      'Incorrect. "Soft" is an adjective modifying "rain," not an adverb modifying "fell."',
      'Incorrect. "Soft" is the adjective form. The adverb is "softly."',
    ],
  },
  {
    id: 'adv-8',
    type: 'add-adverbs',
    difficulty: 'intermediate',
    band: '6-8',
    baseSentence: 'The students worked.',
    question: 'Which expanded version of "The students worked." correctly uses adverbs?',
    options: [
      'The students worked diligently together.',
      'The diligent students worked together.',
      'The students diligent worked togetherly.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Diligently" and "together" are adverbs modifying the verb "worked."',
      'Incorrect. "Diligent" is an adjective describing students, not an adverb modifying the verb.',
      'Incorrect. "Diligent" is an adjective and "togetherly" is not a word.',
    ],
  },
]

// ============================================================
// Exercises: add-prepositional
// ============================================================

const addPrepositional: ExpansionExercise[] = [
  {
    id: 'prep-1',
    type: 'add-prepositional',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'The bird sang.',
    question: 'Which is the best way to expand "The bird sang." with a prepositional phrase?',
    options: [
      'The bird sang on the branch.',
      'The on the branch bird sang.',
      'The bird on branch the sang.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "On the branch" is a prepositional phrase (preposition + object) that tells where the bird sang.',
      'Incorrect. The prepositional phrase should come after the verb, not before the noun.',
      'Incorrect. The prepositional phrase is broken.',
    ],
  },
  {
    id: 'prep-2',
    type: 'add-prepositional',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'The cat sat.',
    question: 'Which expanded version of "The cat sat." adds a prepositional phrase correctly?',
    options: [
      'The cat sat on the mat.',
      'The on the mat cat sat.',
      'The cat sat mat on the.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "On the mat" is a prepositional phrase that tells where the cat sat.',
      'Incorrect. The prepositional phrase is in the wrong position.',
      'Incorrect. The words in the prepositional phrase are scrambled.',
    ],
  },
  {
    id: 'prep-3',
    type: 'add-prepositional',
    difficulty: 'intermediate',
    band: 'K-5',
    baseSentence: 'The children played.',
    question: 'Which is the best prepositional phrase expansion of "The children played."?',
    options: [
      'The children played in the park after school.',
      'The children played park in the after school.',
      'The in the park after school children played.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "In the park" and "after school" are two prepositional phrases adding where and when.',
      'Incorrect. The prepositional phrases are mixed into the sentence incorrectly.',
      'Incorrect. Prepositional phrases should not separate the article from the noun like this.',
    ],
  },
  {
    id: 'prep-4',
    type: 'add-prepositional',
    difficulty: 'intermediate',
    band: '6-8',
    baseSentence: 'The treasure was hidden.',
    question: 'Which prepositional phrase best expands "The treasure was hidden."?',
    options: [
      'The treasure was hidden beneath the old oak tree.',
      'The treasure was hidden beneath old the oak tree.',
      'The beneath the old oak tree treasure was hidden.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Beneath the old oak tree" is a prepositional phrase that tells where.',
      'Incorrect. The word order within the prepositional phrase is wrong.',
      'Incorrect. The prepositional phrase cannot come before the subject like this.',
    ],
  },
  {
    id: 'prep-5',
    type: 'add-prepositional',
    difficulty: 'advanced',
    band: '6-8',
    baseSentence: 'The hikers rested.',
    question: 'Which is the most effective prepositional expansion of "The hikers rested."?',
    options: [
      'The hikers rested by the stream at the base of the mountain.',
      'The hikers rested stream by the at the base mountain of.',
      'The by the stream at the base of the mountain hikers rested.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! Multiple prepositional phrases stack naturally to give detail about where.',
      'Incorrect. The prepositional phrases are scrambled and nonsensical.',
      'Incorrect. This places all prepositional phrases before the subject, which is awkward.',
    ],
  },
  {
    id: 'prep-6',
    type: 'add-prepositional',
    difficulty: 'advanced',
    band: '9-12',
    baseSentence: 'The painting hung.',
    question: 'Which prepositional phrase expansion best enhances "The painting hung."?',
    options: [
      'The painting hung above the fireplace in the grand hallway of the museum.',
      'The painting hung fireplace above the in the grand hallway museum of.',
      'The above the fireplace painting hung in the grand hallway.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! A chain of prepositional phrases creates rich spatial detail.',
      'Incorrect. The prepositional phrases are completely scrambled.',
      'Incorrect. Splitting the prepositional phrase mid-way is wrong.',
    ],
  },
  {
    id: 'prep-7',
    type: 'add-prepositional',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'The frog jumped.',
    question: 'Which expanded version of "The frog jumped." correctly adds a prepositional phrase?',
    options: [
      'The frog jumped into the pond.',
      'The into the pond frog jumped.',
      'The frog jumped pond into the.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Into the pond" is a prepositional phrase telling where the frog jumped.',
      'Incorrect. The prepositional phrase should follow the verb, not come before the subject.',
      'Incorrect. The words in the phrase are in the wrong order.',
    ],
  },
  {
    id: 'prep-8',
    type: 'add-prepositional',
    difficulty: 'intermediate',
    band: '6-8',
    baseSentence: 'The moon glowed.',
    question: 'Which is the best prepositional phrase expansion of "The moon glowed."?',
    options: [
      'The moon glowed through the clouds over the quiet ocean.',
      'The moon glowed clouds through the over the quiet ocean.',
      'The through the clouds moon glowed over the ocean.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! Two prepositional phrases add detail about how and where the moon glowed.',
      'Incorrect. The prepositional phrases are mixed into the sentence incorrectly.',
      'Incorrect. Placing the prepositional phrase between subject and verb is awkward.',
    ],
  },
]

// ============================================================
// Exercises: combine-sentences
// ============================================================

const combineSentences: ExpansionExercise[] = [
  {
    id: 'comb-1',
    type: 'combine-sentences',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'It was raining. We stayed inside.',
    question: 'What is the best way to combine "It was raining. We stayed inside."?',
    options: [
      'Because it was raining, we stayed inside.',
      'It was raining we stayed inside.',
      'We stayed inside because it raining.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Because" is a subordinating conjunction that shows cause and effect.',
      'Incorrect. You need a conjunction or punctuation to properly join two independent clauses.',
      'Incorrect. "Because it raining" is missing the verb "was."',
    ],
  },
  {
    id: 'comb-2',
    type: 'combine-sentences',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'The sun set. The sky turned orange.',
    question: 'Which is the best way to combine "The sun set. The sky turned orange."?',
    options: [
      'When the sun set, the sky turned orange.',
      'The sun set the sky turned orange.',
      'The sun set and orange the sky turned.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "When" connects the two events with a time relationship.',
      'Incorrect. Two independent clauses need a conjunction or proper punctuation.',
      'Incorrect. The word order in the second clause is scrambled.',
    ],
  },
  {
    id: 'comb-3',
    type: 'combine-sentences',
    difficulty: 'intermediate',
    band: 'K-5',
    baseSentence: 'She studied hard. She passed the test.',
    question: 'Which combined sentence best joins "She studied hard. She passed the test."?',
    options: [
      'She studied hard, so she passed the test.',
      'She studied hard she passed the test.',
      'She studied hard and passed she the test.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "So" is a coordinating conjunction showing the result of her studying.',
      'Incorrect. A comma and conjunction are needed to join these independent clauses.',
      'Incorrect. The word order in the second clause is wrong.',
    ],
  },
  {
    id: 'comb-4',
    type: 'combine-sentences',
    difficulty: 'intermediate',
    band: '6-8',
    baseSentence: 'The movie was long. It was very entertaining.',
    question: 'Which is the best way to combine "The movie was long. It was very entertaining."?',
    options: [
      'Although the movie was long, it was very entertaining.',
      'The movie was long it was very entertaining.',
      'Although it was very entertaining the movie was long it.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Although" shows contrast.',
      'Incorrect. You need a conjunction to connect these contrasting ideas.',
      'Incorrect. This sentence has broken structure and extra words.',
    ],
  },
  {
    id: 'comb-5',
    type: 'combine-sentences',
    difficulty: 'advanced',
    band: '6-8',
    baseSentence: 'The bridge was old. It was still strong.',
    question: 'Which combined sentence best joins "The bridge was old. It was still strong."?',
    options: [
      'Even though the bridge was old, it was still strong.',
      'The bridge was old it was still strong.',
      'Even though old the bridge was it was still strong.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Even though" shows concession.',
      'Incorrect. A conjunction is needed to connect these contrasting ideas.',
      'Incorrect. The clause structure is scrambled and ungrammatical.',
    ],
  },
  {
    id: 'comb-6',
    type: 'combine-sentences',
    difficulty: 'advanced',
    band: '9-12',
    baseSentence: 'The storm raged. The sailors remained calm.',
    question: 'Which is the most effective combination of "The storm raged. The sailors remained calm."?',
    options: [
      'While the storm raged, the sailors remained calm.',
      'The storm raged the sailors remained calm.',
      'While raged the storm calm remained the sailors.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "While" effectively contrasts the chaos of the storm with the calm of the sailors.',
      'Incorrect. A comma and conjunction are needed between the independent clauses.',
      'Incorrect. The word order in both clauses is scrambled.',
    ],
  },
  {
    id: 'comb-7',
    type: 'combine-sentences',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'I was tired. I went to bed.',
    question: 'Which is the best way to combine "I was tired. I went to bed."?',
    options: [
      'Since I was tired, I went to bed.',
      'I was tired I went to bed.',
      'Since tired I was I went to bed.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Since" shows the reason.',
      'Incorrect. These two clauses need a conjunction to be properly joined.',
      'Incorrect. The word order "tired I was" is inverted and incorrect.',
    ],
  },
  {
    id: 'comb-8',
    type: 'combine-sentences',
    difficulty: 'intermediate',
    band: '6-8',
    baseSentence: 'He forgot his umbrella. He got soaked.',
    question: 'Which combined sentence best joins "He forgot his umbrella. He got soaked."?',
    options: [
      'Because he forgot his umbrella, he got soaked.',
      'He forgot his umbrella he got soaked.',
      'Because forgot his umbrella he got soaked he.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Because" clearly shows cause and effect.',
      'Incorrect. A conjunction is needed to join these cause-and-effect clauses.',
      'Incorrect. The subject "he" is missing from the first clause.',
    ],
  },
]

// ============================================================
// Exercises: add-clause
// ============================================================

const addClause: ExpansionExercise[] = [
  {
    id: 'clau-1',
    type: 'add-clause',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'The student passed.',
    question: 'Which is the best way to expand "The student passed." by adding a clause?',
    options: [
      'The student passed because she studied hard.',
      'The student passed because studied hard.',
      'Because she studied the student passed hard.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Because she studied hard" is a dependent clause that explains why the student passed.',
      'Incorrect. The dependent clause is missing its subject "she."',
      'Incorrect. The clause is broken up and placed in the wrong position.',
    ],
  },
  {
    id: 'clau-2',
    type: 'add-clause',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'We will go to the park.',
    question: 'Which expanded version of "We will go to the park." correctly adds a clause?',
    options: [
      'We will go to the park if it does not rain.',
      'We will go to the park if does not rain.',
      'If it does not rain we will go park the to.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "If it does not rain" is a dependent (conditional) clause that adds a condition.',
      'Incorrect. The clause is missing the subject "it."',
      'Incorrect. The word order in both clauses is scrambled.',
    ],
  },
  {
    id: 'clau-3',
    type: 'add-clause',
    difficulty: 'intermediate',
    band: 'K-5',
    baseSentence: 'The dog barked.',
    question: 'Which clause expansion best enhances "The dog barked."?',
    options: [
      'The dog barked when the mailman approached the house.',
      'The dog barked when approached the house.',
      'When the mailman the dog barked approached the house.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "When the mailman approached the house" is a dependent clause that tells when.',
      'Incorrect. The dependent clause is missing its subject "the mailman."',
      'Incorrect. The words from both clauses are mixed together incorrectly.',
    ],
  },
  {
    id: 'clau-4',
    type: 'add-clause',
    difficulty: 'intermediate',
    band: '6-8',
    baseSentence: 'She smiled.',
    question: 'Which is the best clause expansion of "She smiled."?',
    options: [
      'She smiled as she remembered the kind gesture.',
      'She smiled as remembered the kind gesture.',
      'As she remembered the smiled she kind gesture.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "As she remembered the kind gesture" is a dependent clause explaining when and why.',
      'Incorrect. The dependent clause needs a subject.',
      'Incorrect. The clause structure is completely scrambled.',
    ],
  },
  {
    id: 'clau-5',
    type: 'add-clause',
    difficulty: 'advanced',
    band: '6-8',
    baseSentence: 'The garden flourished.',
    question: 'Which expanded sentence best adds a clause to "The garden flourished."?',
    options: [
      'The garden flourished after the spring rains finally arrived.',
      'The garden flourished after the spring rains arrived finally.',
      'After the spring rains the garden finally arrived flourished.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "After the spring rains finally arrived" is a dependent clause with a clear subject and verb.',
      'Incorrect. The adverb placement is awkward.',
      'Incorrect. The words from both clauses are scrambled into nonsense.',
    ],
  },
  {
    id: 'clau-6',
    type: 'add-clause',
    difficulty: 'advanced',
    band: '9-12',
    baseSentence: 'The experiment succeeded.',
    question: 'Which clause expansion best enhances "The experiment succeeded."?',
    options: [
      'The experiment succeeded although the initial results had been disappointing.',
      'The experiment succeeded although the initial results disappointing.',
      'Although the initial results the experiment succeeded had been disappointing.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Although the initial results had been disappointing" is a full dependent clause with subject and verb.',
      'Incorrect. The dependent clause is missing the helping verb.',
      'Incorrect. The clause structure is broken and words are misplaced.',
    ],
  },
  {
    id: 'clau-7',
    type: 'add-clause',
    difficulty: 'beginner',
    band: 'K-5',
    baseSentence: 'The cookies smelled good.',
    question: 'Which is the best way to expand "The cookies smelled good." with a clause?',
    options: [
      'The cookies smelled good because Grandma had just baked them.',
      'The cookies smelled good because had just baked them.',
      'Because had just baked them the cookies smelled good.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Because Grandma had just baked them" is a dependent clause that explains why.',
      'Incorrect. The clause is missing its subject "Grandma."',
      'Incorrect. The clause is missing its subject.',
    ],
  },
  {
    id: 'clau-8',
    type: 'add-clause',
    difficulty: 'intermediate',
    band: '6-8',
    baseSentence: 'The team celebrated.',
    question: 'Which clause expansion best enhances "The team celebrated."?',
    options: [
      'The team celebrated because they had won the championship game.',
      'The team celebrated because had won the championship game.',
      'Because they had won the championship the team celebrated game.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Because they had won the championship game" is a complete dependent clause.',
      'Incorrect. The clause is missing the subject "they."',
      'Incorrect. The clause structure is broken.',
    ],
  },
]

// ============================================================
// Combined list
// ============================================================

export const EXPANSION_EXERCISES: ExpansionExercise[] = [
  ...addAdjectives,
  ...addAdverbs,
  ...addPrepositional,
  ...combineSentences,
  ...addClause,
]

// ============================================================
// Helper Functions
// ============================================================

export function getExercisesByFilter(filter: {
  types?: ExpansionType[]
  difficulty?: Difficulty | 'all'
  band?: GradeBand | 'all'
}): ExpansionExercise[] {
  let result = EXPANSION_EXERCISES
  if (filter.types && filter.types.length > 0) {
    result = result.filter(e => filter.types!.includes(e.type))
  }
  if (filter.difficulty && filter.difficulty !== 'all') {
    result = result.filter(e => e.difficulty === filter.difficulty)
  }
  if (filter.band && filter.band !== 'all') {
    result = result.filter(e => e.band === filter.band)
  }
  return result
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

export function generateWrongVariants(correctExpansion: string, type: ExpansionType): [string, string] {
  const s = correctExpansion
  switch (type) {
    case 'add-adjectives': {
      // Scramble the adjectives or move them after the noun
      const words = s.split(' ')
      const adjectives: number[] = []
      for (let i = 0; i < words.length - 1; i++) {
        const w = words[i].replace(/[^a-z]/gi, '')
        if (w.length >= 3 && (w.endsWith('ful') || w.endsWith('ous') || w.endsWith('ive') || w.endsWith('able') || w.endsWith('ible') || w.endsWith('al') || w.endsWith('ent') || w.endsWith('ant') || w.endsWith('ic') || w.endsWith('ish'))) {
          adjectives.push(i)
        }
      }
      if (adjectives.length >= 2) {
        const variant1 = [...words]
        const a = adjectives[0]
        variant1.splice(a, 1)
        variant1.push(words[a].endsWith(',') ? words[a].slice(0, -1) + '.' : words[a] + '.')
        const variant2 = [...words]
        const tmp = variant2[adjectives[0]]
        variant2[adjectives[0]] = variant2[adjectives[adjectives.length - 1]]
        variant2[adjectives[adjectives.length - 1]] = tmp
        return [variant1.join(' '), variant2.join(' ')]
      }
      return [s.replace(/,\s/g, ' '), s + ' very']
    }
    case 'add-adverbs': {
      // Remove the adverb or use adjective form
      const adverbMatch = s.match(/\b(\w+ly)\b/)
      if (adverbMatch) {
        const withoutAdv = s.replace(/\b\w+ly\s*/g, '').replace(/\s+/g, ' ').trim()
        const adjForm = adverbMatch[1].replace(/ly$/, '') || adverbMatch[1]
        const withAdj = s.replace(adverbMatch[1], adjForm)
        return [withoutAdv !== s ? withoutAdv : s + ' now', withAdj !== s ? withAdj : s + ' fast']
      }
      return [s + ' badly', s + ' never']
    }
    case 'add-prepositional': {
      // Scramble the prepositional phrase
      const prepMatch = s.match(/\b(on|in|at|to|from|by|with|under|over|above|below|beneath|behind|before|after|during|through|into|across|among|between|around|along|upon)\s+the\s+\w+(\s+\w+)*/i)
      if (prepMatch) {
        const phrase = prepMatch[0].split(' ')
        const scrambled = phrase.slice(1).reverse().join(' ')
        const variant1 = s.replace(prepMatch[0], scrambled)
        const words2 = s.split(' ')
        const idx = words2.indexOf(prepMatch[0].split(' ')[0])
        if (idx > 0) {
          const variant2Words = [...words2]
          variant2Words.splice(idx, prepMatch[0].split(' ').length)
          variant2Words.splice(1, 0, ...prepMatch[0].split(' '))
          return [variant1, variant2Words.join(' ')]
        }
        return [variant1, s.replace(prepMatch[0], 'somewhere')]
      }
      return [s + ' here', s + ' there']
    }
    case 'combine-sentences': {
      // Remove the conjunction or break the clauses
      const conjMatch = s.match(/\b(because|although|since|when|while|if|even though|so|and|but|or)\b/i)
      if (conjMatch) {
        const withoutConj = s.replace(conjMatch[0], '').replace(/^,\s*/, '').replace(/\s*,\s*$/, '')
        const wrongConj = s.replace(conjMatch[0], 'however')
        return [withoutConj, wrongConj]
      }
      return [s.replace(',', ''), s + '.']
    }
    case 'add-clause': {
      // Remove the subordinating conjunction or the clause subject
      const subConjMatch = s.match(/\b(because|although|since|when|while|if|after|before|until|unless|as|once)\s+(\w+)/i)
      if (subConjMatch) {
        const withoutSubject = s.replace(subConjMatch[0], subConjMatch[1] + ' ')
        const withoutClause = s.replace(/,?\s*(because|although|since|when|while|if|after|before|until|unless|as|once)[^.!?]*[.!?]?/i, '.')
        return [withoutSubject, withoutClause]
      }
      return [s.replace(/,\s.*$/, '.'), s + ' today']
    }
    default:
      return [s + '?', s + '!']
  }
}
