// ============================================================
// Phonics Exercises — organized by category, difficulty, grade band
// Architecture: data-file-based, consumed by unified widget component
// ============================================================

export type PhonicsCategory = 'word-family' | 'syllable-type' | 'digraph-blend' | 'sound-pattern'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type GradeBand = 'K-5' | '6-8'

export interface PhonicsExercise {
  id: string
  category: PhonicsCategory
  difficulty: Difficulty
  band: GradeBand
  question: string
  options: [string, string, string]
  correctIndex: 0 | 1 | 2
  explanations: [string, string, string]
}

export const PHONICS_CATEGORIES: { id: PhonicsCategory; label: string; description: string }[] = [
  { id: 'word-family', label: 'Word Family', description: 'Words that share rimes and spelling patterns' },
  { id: 'syllable-type', label: 'Syllable Type', description: 'Open, closed, vowel-team, r-controlled, consonant-le, final-e' },
  { id: 'digraph-blend', label: 'Digraph & Blend', description: 'Consonant digraphs, blends, and vowel digraphs' },
  { id: 'sound-pattern', label: 'Sound Pattern', description: 'Vowel sounds, diphthongs, and rhyming patterns' },
]

// ============================================================
// Exercises — 40 across 4 categories, 3 difficulties, 2 grade bands
// ============================================================

export const PHONICS_EXERCISES: PhonicsExercise[] = [
  // ---- WORD FAMILY (10) ----
  { id: 'ph-wf-001', category: 'word-family', difficulty: 'beginner', band: 'K-5',
    question: 'Which word belongs to the same word family as "cat"?',
    options: ['hat', 'cut', 'cot'], correctIndex: 0,
    explanations: ['Correct! "hat" shares the -at rime with "cat".', '"cut" has the short u sound, not the -at pattern.', '"cot" has the short o sound, not the -at pattern.'] },
  { id: 'ph-wf-002', category: 'word-family', difficulty: 'beginner', band: 'K-5',
    question: 'Which word belongs to the same word family as "bike"?',
    options: ['back', 'like', 'bake'], correctIndex: 1,
    explanations: ['Correct! "like" shares the -ike rime with "bike".', '"back" has the -ack pattern, not -ike.', '"bake" shares the -ake pattern, not -ike.'] },
  { id: 'ph-wf-003', category: 'word-family', difficulty: 'beginner', band: 'K-5',
    question: 'Which word belongs to the same word family as "ring"?',
    options: ['rang', 'sing', 'rung'], correctIndex: 1,
    explanations: ['Correct! "sing" shares the -ing rime with "ring".', '"rang" is the past tense of ring but has the -ang rime.', '"rung" has the -ung rime, different from -ing.'] },
  { id: 'ph-wf-004', category: 'word-family', difficulty: 'intermediate', band: 'K-5',
    question: 'Which word belongs to the same word family as "float"?',
    options: ['flat', 'bloat', 'flout'], correctIndex: 1,
    explanations: ['Correct! "bloat" shares the -loat rime with "float".', '"flat" has the short a sound with -at, not -loat.', '"flout" has the -out rime, not -loat.'] },
  { id: 'ph-wf-005', category: 'word-family', difficulty: 'intermediate', band: 'K-5',
    question: 'Which word belongs to the same word family as "train"?',
    options: ['tried', 'brain', 'truck'], correctIndex: 1,
    explanations: ['Correct! "brain" shares the -rain rime with "train".', '"tried" has the -ied rime, not -rain.', '"truck" has the -uck rime, not -rain.'] },
  { id: 'ph-wf-006', category: 'word-family', difficulty: 'intermediate', band: '6-8',
    question: 'Which word belongs to the same word family as "compete"?',
    options: ['complete', 'compose', 'comply'], correctIndex: 0,
    explanations: ['Correct! "complete" shares the -ete rime with "compete".', '"compose" shares the -ose rime, not -ete.', '"comply" shares the -ly ending, not the -ete rime.'] },
  { id: 'ph-wf-007', category: 'word-family', difficulty: 'advanced', band: '6-8',
    question: 'Which word belongs to the same word family as "vision"?',
    options: ['version', 'visual', 'visit'], correctIndex: 0,
    explanations: ['Correct! "version" shares the -sion rime with "vision".', '"visual" has a different ending pattern (-ual), not -sion.', '"visit" has the -it rime, not -sion.'] },
  { id: 'ph-wf-008', category: 'word-family', difficulty: 'advanced', band: '6-8',
    question: 'Which word belongs to the same word family as "straight"?',
    options: ['weight', 'freight', 'string'], correctIndex: 0,
    explanations: ['Correct! "weight" shares the -eight rime with "straight".', '"freight" also shares -eight, but its onset differs and it is a compound form.', '"string" has the -ing rime, completely different from -eight.'] },
  { id: 'ph-wf-009', category: 'word-family', difficulty: 'beginner', band: 'K-5',
    question: 'Which word belongs to the same word family as "make"?',
    options: ['milk', 'lake', 'mask'], correctIndex: 1,
    explanations: ['Correct! "lake" shares the -ake rime with "make".', '"milk" has the -ilk rime, not -ake.', '"mask" has the -ask rime, not -ake.'] },
  { id: 'ph-wf-010', category: 'word-family', difficulty: 'advanced', band: '6-8',
    question: 'Which word belongs to the same word family as "rough"?',
    options: ['through', 'tough', 'cough'], correctIndex: 1,
    explanations: ['Correct! "tough" shares the -ough rime with "rough".', '"through" has the same -ough spelling but pronounced differently as /oo/.', '"cough" has the -ough spelling but pronounced as /off/.'] },

  // ---- SYLLABLE TYPE (10) ----
  { id: 'ph-st-001', category: 'syllable-type', difficulty: 'beginner', band: 'K-5',
    question: 'What type of syllable is "cat"?',
    options: ['Closed syllable', 'Open syllable', 'Vowel team syllable'], correctIndex: 0,
    explanations: ['Correct! "cat" has a short vowel closed in by the consonant "t" — a closed syllable.', 'An open syllable ends with a vowel sound, like "me".', 'A vowel team syllable has two vowels working together, like "boat".'] },
  { id: 'ph-st-002', category: 'syllable-type', difficulty: 'beginner', band: 'K-5',
    question: 'What type of syllable is "go"?',
    options: ['Closed syllable', 'Open syllable', 'R-controlled syllable'], correctIndex: 1,
    explanations: ['A closed syllable has a consonant closing in the vowel, like "bed".', 'Correct! "go" ends with the vowel "o" making its long sound — an open syllable.', 'An r-controlled syllable has a vowel followed by r, like "car".'] },
  { id: 'ph-st-003', category: 'syllable-type', difficulty: 'beginner', band: 'K-5',
    question: 'What type of syllable is "rain"?',
    options: ['Closed syllable', 'Consonant-le syllable', 'Vowel team syllable'], correctIndex: 2,
    explanations: ['A closed syllable has a single vowel closed by a consonant, like "hat".', 'A consonant-le syllable ends in consonant + le, like "table".', 'Correct! "rain" has the vowel team "ai" — a vowel team syllable.'] },
  { id: 'ph-st-004', category: 'syllable-type', difficulty: 'intermediate', band: 'K-5',
    question: 'What type of syllable is "car"?',
    options: ['R-controlled syllable', 'Open syllable', 'Closed syllable'], correctIndex: 0,
    explanations: ['Correct! "car" has the vowel "a" followed by "r" — an r-controlled syllable.', 'An open syllable ends with a vowel, not a consonant.', 'A closed syllable has a single vowel closed by a consonant, but "r" changes the vowel sound.'] },
  { id: 'ph-st-005', category: 'syllable-type', difficulty: 'intermediate', band: 'K-5',
    question: 'What type of syllable is "apple" (the second syllable "-ple")?',
    options: ['Vowel team syllable', 'Consonant-le syllable', 'Closed syllable'], correctIndex: 1,
    explanations: ['A vowel team has two vowels together, like "see".', 'Correct! The "-ple" in "apple" follows the consonant + le pattern.', 'A closed syllable has a short vowel closed by a consonant, like "at".'] },
  { id: 'ph-st-006', category: 'syllable-type', difficulty: 'intermediate', band: '6-8',
    question: 'What type of syllable is "kite"?',
    options: ['Closed syllable', 'Vowel-consonant-e syllable', 'Open syllable'], correctIndex: 1,
    explanations: ['A closed syllable has a short vowel, like "kit".', 'Correct! "kite" follows the vowel-consonant-e (silent e) pattern.', 'An open syllable ends with a vowel without a silent e, like "ki".'] },
  { id: 'ph-st-007', category: 'syllable-type', difficulty: 'advanced', band: '6-8',
    question: 'How many syllable types are in the word "independent"?',
    options: ['3 syllable types', '2 syllable types', '4 syllable types'], correctIndex: 0,
    explanations: ['Correct! in-de-pen-dent: open (in), closed (pen), closed (dent) — but the varied patterns give 3 distinct types across its 4 syllables.', 'There are more than 2 distinct syllable types in this word.', 'The word has 4 syllables but they cluster into about 3 types.'] },
  { id: 'ph-st-008', category: 'syllable-type', difficulty: 'advanced', band: '6-8',
    question: 'What type of syllable is "shield"?',
    options: ['Closed syllable', 'R-controlled syllable', 'Vowel team syllable'], correctIndex: 2,
    explanations: ['"shield" does not have a simple short vowel closed by a consonant.', '"shield" does not contain an r-controlled vowel.', 'Correct! "ie" acts as a vowel team making the long e sound in "shield".'] },
  { id: 'ph-st-009', category: 'syllable-type', difficulty: 'beginner', band: 'K-5',
    question: 'What type of syllable is "me"?',
    options: ['Open syllable', 'Closed syllable', 'Vowel-consonant-e syllable'], correctIndex: 0,
    explanations: ['Correct! "me" ends with the vowel "e" making its long sound — an open syllable.', 'A closed syllable has a consonant after the vowel, like "met".', 'A VCe syllable has a consonant between a vowel and silent e, like "mice".'] },
  { id: 'ph-st-010', category: 'syllable-type', difficulty: 'intermediate', band: 'K-5',
    question: 'What type of syllable is "corn"?',
    options: ['Closed syllable', 'R-controlled syllable', 'Vowel team syllable'], correctIndex: 1,
    explanations: ['A closed syllable has a short vowel sound, but "or" makes a different sound.', 'Correct! "or" is an r-controlled vowel pair — an r-controlled syllable.', 'A vowel team has two vowels working together, which is not the case here.'] },

  // ---- DIGRAPH & BLEND (10) ----
  { id: 'ph-db-001', category: 'digraph-blend', difficulty: 'beginner', band: 'K-5',
    question: 'Which digraph is in the word "ship"?',
    options: ['sh', 'ch', 'th'], correctIndex: 0,
    explanations: ['Correct! "sh" is a consonant digraph in "ship".', '"ch" is a digraph found in words like "chip".', '"th" is a digraph found in words like "thin".'] },
  { id: 'ph-db-002', category: 'digraph-blend', difficulty: 'beginner', band: 'K-5',
    question: 'Which blend is in the word "frog"?',
    options: ['fr', 'fl', 'gr'], correctIndex: 0,
    explanations: ['Correct! "fr" is the initial consonant blend in "frog".', '"fl" is a blend in words like "flip".', '"gr" is a blend in words like "grab".'] },
  { id: 'ph-db-003', category: 'digraph-blend', difficulty: 'beginner', band: 'K-5',
    question: 'Which digraph is in the word "when"?',
    options: ['wh', 'th', 'ch'], correctIndex: 0,
    explanations: ['Correct! "wh" is the consonant digraph at the start of "when".', '"th" is a digraph found in words like "then".', '"ch" is a digraph found in words like "chin".'] },
  { id: 'ph-db-004', category: 'digraph-blend', difficulty: 'intermediate', band: 'K-5',
    question: 'Which word contains a vowel digraph?',
    options: ['book', 'cat', 'bed'], correctIndex: 0,
    explanations: ['Correct! "book" contains the vowel digraph "oo".', '"cat" has a single short vowel, not a digraph.', '"bed" has a single short vowel, not a digraph.'] },
  { id: 'ph-db-005', category: 'digraph-blend', difficulty: 'intermediate', band: 'K-5',
    question: 'Which word contains a final consonant blend?',
    options: ['milk', 'cat', 'rain'], correctIndex: 0,
    explanations: ['Correct! "milk" ends with the blend "lk" — two consonant sounds blended together.', '"cat" ends with a single consonant "t", not a blend.', '"rain" ends with a single consonant "n", not a blend.'] },
  { id: 'ph-db-006', category: 'digraph-blend', difficulty: 'intermediate', band: '6-8',
    question: 'Which word contains the digraph "ph"?',
    options: ['phone', 'fun', 'pan'], correctIndex: 0,
    explanations: ['Correct! "phone" contains the digraph "ph" which makes the /f/ sound.', '"fun" starts with the single consonant "f", not a digraph.', '"pan" starts with the single consonant "p", not a digraph.'] },
  { id: 'ph-db-007', category: 'digraph-blend', difficulty: 'advanced', band: '6-8',
    question: 'Which word contains both a digraph and a blend?',
    options: ['splash', 'ship', 'black'], correctIndex: 0,
    explanations: ['Correct! "splash" has the blend "spl" and the digraph "sh".', '"ship" has the digraph "sh" but no blend.', '"black" has the blend "bl" but no digraph.'] },
  { id: 'ph-db-008', category: 'digraph-blend', difficulty: 'advanced', band: '6-8',
    question: 'Which digraph makes the /k/ sound in "chemistry"?',
    options: ['ch', 'ck', 'kn'], correctIndex: 0,
    explanations: ['Correct! In "chemistry", the digraph "ch" makes the /k/ sound.', '"ck" makes the /k/ sound in words like "back", but is not in "chemistry".', '"kn" makes the /n/ sound in words like "knee".'] },
  { id: 'ph-db-009', category: 'digraph-blend', difficulty: 'beginner', band: 'K-5',
    question: 'Which word has the "th" digraph?',
    options: ['bath', 'bat', 'best'], correctIndex: 0,
    explanations: ['Correct! "bath" contains the "th" digraph.', '"bat" has no digraph — just the single consonant "b" and short a.', '"best" has no digraph — it starts with the consonant blend "st".'] },
  { id: 'ph-db-010', category: 'digraph-blend', difficulty: 'intermediate', band: 'K-5',
    question: 'Which word contains a triple consonant blend?',
    options: ['scrub', 'snip', 'skip'], correctIndex: 0,
    explanations: ['Correct! "scrub" begins with the triple blend "scr".', '"snip" has only a two-consonant blend "sn".', '"skip" has only a two-consonant blend "sk".'] },

  // ---- SOUND PATTERN (10) ----
  { id: 'ph-sp-001', category: 'sound-pattern', difficulty: 'beginner', band: 'K-5',
    question: 'Which word has the same vowel sound as "cake"?',
    options: ['bake', 'back', 'book'], correctIndex: 0,
    explanations: ['Correct! "bake" has the same long a sound as "cake".', '"back" has the short a sound, not the long a.', '"book" has the /oo/ vowel sound.'] },
  { id: 'ph-sp-002', category: 'sound-pattern', difficulty: 'beginner', band: 'K-5',
    question: 'Which word has the same vowel sound as "moon"?',
    options: ['man', 'soon', 'moan'], correctIndex: 1,
    explanations: ['"man" has the short a sound.', 'Correct! "soon" has the same /oo/ sound as "moon".', '"moan" has the long o sound, not /oo/.'] },
  { id: 'ph-sp-003', category: 'sound-pattern', difficulty: 'beginner', band: 'K-5',
    question: 'Which word has the same vowel sound as "feet"?',
    options: ['fit', 'seat', 'fat'], correctIndex: 1,
    explanations: ['"fit" has the short i sound.', 'Correct! "seat" has the same long e sound as "feet".', '"fat" has the short a sound.'] },
  { id: 'ph-sp-004', category: 'sound-pattern', difficulty: 'intermediate', band: 'K-5',
    question: 'Which word has the same vowel sound as "how"?',
    options: ['show', 'cow', 'hoe'], correctIndex: 1,
    explanations: ['"show" has the long o sound, not the /ow/ diphthong.', 'Correct! "cow" has the same /ow/ diphthong sound as "how".', '"hoe" has the long o sound.'] },
  { id: 'ph-sp-005', category: 'sound-pattern', difficulty: 'intermediate', band: 'K-5',
    question: 'Which word has the same vowel sound as "boy"?',
    options: ['toy', 'boy', 'buy'], correctIndex: 0,
    explanations: ['Correct! "toy" has the same /oi/ diphthong as "boy".', '"boy" is the same word — look for a different word with the same sound.', '"buy" has the long i sound, not the /oi/ diphthong.'] },
  { id: 'ph-sp-006', category: 'sound-pattern', difficulty: 'intermediate', band: '6-8',
    question: 'Which word has the same vowel sound as "heart"?',
    options: ['hurt', 'part', 'heat'], correctIndex: 1,
    explanations: ['"hurt" has the /er/ r-controlled sound.', 'Correct! "part" has the same r-controlled /ar/ sound as "heart".', '"heat" has the long e sound.'] },
  { id: 'ph-sp-007', category: 'sound-pattern', difficulty: 'advanced', band: '6-8',
    question: 'Which word has the same vowel sound as "through"?',
    options: ['tough', 'threw', 'thought'], correctIndex: 1,
    explanations: ['"tough" has the /uf/ sound, different from /oo/.', 'Correct! "threw" has the same /oo/ sound as "through".', '"thought" has the /aw/ sound, not /oo/.'] },
  { id: 'ph-sp-008', category: 'sound-pattern', difficulty: 'advanced', band: '6-8',
    question: 'Which word has the same schwa sound as "about"?',
    options: ['above', 'boot', 'bite'], correctIndex: 0,
    explanations: ['Correct! "above" has the same schwa /ə/ sound in its first syllable as "about".', '"boot" has the /oo/ vowel sound, not schwa.', '"bite" has the long i sound.'] },
  { id: 'ph-sp-009', category: 'sound-pattern', difficulty: 'beginner', band: 'K-5',
    question: 'Which word rhymes with "sing"?',
    options: ['ring', 'sang', 'song'], correctIndex: 0,
    explanations: ['Correct! "ring" rhymes with "sing" — both end in -ing.', '"sang" does not rhyme; it ends in -ang.', '"song" does not rhyme; it ends in -ong.'] },
  { id: 'ph-sp-010', category: 'sound-pattern', difficulty: 'intermediate', band: '6-8',
    question: 'Which word has the same short vowel sound pattern as "bread"?',
    options: ['breed', 'head', 'braid'], correctIndex: 1,
    explanations: ['"breed" has the long e sound, not short e.', 'Correct! "head" has the same short e sound (ea making /e/) as "bread".', '"braid" has the long a sound.'] },
]

// ============================================================
// Helper Functions
// ============================================================

export function getExercisesByFilter(filter: {
  categories?: PhonicsCategory[]
  difficulty?: Difficulty | 'all'
  band?: GradeBand | 'all'
}): PhonicsExercise[] {
  let result = PHONICS_EXERCISES
  if (filter.categories && filter.categories.length > 0) {
    result = result.filter(e => filter.categories!.includes(e.category))
  }
  if (filter.difficulty && filter.difficulty !== 'all') {
    result = result.filter(e => e.difficulty === filter.difficulty)
  }
  if (filter.band && filter.band !== 'all') {
    result = result.filter(e => e.band === filter.band)
  }
  return result
}

export function shuffleExercises(exercises: PhonicsExercise[]): PhonicsExercise[] {
  const arr = [...exercises]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function getExerciseById(id: string): PhonicsExercise | undefined {
  return PHONICS_EXERCISES.find(e => e.id === id)
}

export function generateWrongVariants(correctAnswer: string, category: PhonicsCategory): [string, string] {
  const s = correctAnswer
  switch (category) {
    case 'word-family': {
      // Change the rime while keeping the same onset
      const rimes = ['at', 'it', 'ot', 'ut', 'an', 'in', 'op', 'up', 'ack', 'ick', 'ock', 'ame', 'ime', 'ate', 'ite', 'ote']
      // Find the rime of the correct answer
      const cvPattern = s.match(/^([^aeiou]*)([aeiou].*)$/i)
      if (cvPattern) {
        const onset = cvPattern[1]
        const rime = cvPattern[2]
        const altRimes = rimes.filter(r => r !== rime).sort(() => Math.random() - 0.5).slice(0, 2)
        return [onset + altRimes[0], onset + altRimes[1]]
      }
      return ['cat', 'dog']
    }
    case 'syllable-type': {
      const types = ['Closed syllable', 'Open syllable', 'Vowel team syllable', 'R-controlled syllable', 'Consonant-le syllable', 'Vowel-consonant-e syllable']
      const others = types.filter(t => t !== s).sort(() => Math.random() - 0.5).slice(0, 2)
      return [others[0], others[1]]
    }
    case 'digraph-blend': {
      const digraphs = ['sh', 'ch', 'th', 'wh', 'ph', 'ck', 'ng', 'kn', 'wr', 'gh']
      const blends = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw', 'scr', 'spr', 'str']
      const all = [...digraphs, ...blends].filter(d => d !== s).sort(() => Math.random() - 0.5).slice(0, 2)
      return [all[0], all[1]]
    }
    case 'sound-pattern': {
      // Generate words with different vowel sounds
      const soundFamilies: Record<string, string[]> = {
        'long a': ['cake', 'make', 'bake', 'lake', 'rake', 'take', 'name', 'game'],
        'long e': ['feet', 'meet', 'seat', 'beet', 'heet', 'keep', 'deep'],
        'long i': ['bike', 'like', 'hike', 'mile', 'file', 'time', 'dime'],
        'long o': ['boat', 'coat', 'goat', 'moat', 'road', 'toad', 'home'],
        'long u': ['cute', 'mute', 'tube', 'cube', 'rule', 'mule', 'duke'],
        'short a': ['cat', 'hat', 'bat', 'sat', 'mat', 'ran', 'fan'],
        'short e': ['bed', 'red', 'fed', 'pen', 'ten', 'net', 'set'],
        'short i': ['sit', 'bit', 'hit', 'kit', 'pit', 'rim', 'dim'],
        'short o': ['hot', 'pot', 'dot', 'cot', 'not', 'log', 'dog'],
        'short u': ['cut', 'but', 'hut', 'nut', 'rut', 'bug', 'mug'],
        'oo': ['moon', 'soon', 'boot', 'root', 'cool', 'pool', 'tool'],
        'ow': ['how', 'cow', 'now', 'bow', 'wow', 'town', 'down'],
        'oi': ['boy', 'toy', 'joy', 'coin', 'join', 'soil', 'boil'],
        'ar': ['car', 'far', 'bar', 'star', 'part', 'heart', 'dart'],
        'er': ['her', 'per', 'term', 'fern', 'bird', 'turn', 'burn'],
      }
      const allWords = Object.values(soundFamilies).flat().filter(w => w !== s)
      const shuffled = allWords.sort(() => Math.random() - 0.5).slice(0, 2)
      return [shuffled[0], shuffled[1]]
    }
    default:
      return ['cat', 'dog']
  }
}
