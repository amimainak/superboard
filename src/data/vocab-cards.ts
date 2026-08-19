// ============================================================
// Vocabulary Cards — organized by grade band and POS
// Architecture: data-file-based, consumed by unified widget
// ============================================================

export type PosTag = 'noun' | 'verb' | 'adj' | 'adv' | 'prep' | 'other'
export type CardLevel = 'K-5' | '6-8' | '9-12'

export interface VocabCard {
  id: string
  word: string
  definition: string
  example: string
  pos: PosTag
  level: CardLevel
}

export const VOCAB_CARDS: VocabCard[] = [
  // K-5 Nouns
  { id: 'v-k5-n-001', word: 'Courage', definition: 'Bravery; the ability to do something even when scared', example: 'It took courage to speak in front of the class.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-002', word: 'Journey', definition: 'A long trip from one place to another', example: 'The journey across the mountains took three days.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-003', word: 'Neighbor', definition: 'A person who lives near you', example: 'Our neighbor brought us cookies.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-004', word: 'Treasure', definition: 'Something very valuable or precious', example: 'The pirates found a chest full of treasure.', pos: 'noun', level: 'K-5' },

  // K-5 Verbs
  { id: 'v-k5-v-001', word: 'Explore', definition: 'To travel to or around a new place to learn about it', example: 'The scientists will explore the deep ocean.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-002', word: 'Imagine', definition: 'To form a picture in your mind', example: 'Imagine a world where everyone is kind.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-003', word: 'Scamper', definition: 'To run with quick, short steps', example: 'The squirrels scamper across the yard every morning.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-004', word: 'Whisper', definition: 'To speak very softly', example: 'Please whisper so you do not wake the baby.', pos: 'verb', level: 'K-5' },

  // K-5 Adjectives
  { id: 'v-k5-a-001', word: 'Curious', definition: 'Eager to know or learn something', example: 'The curious cat explored every corner of the room.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-002', word: 'Enormous', definition: 'Very large in size or amount', example: 'The enormous elephant drank from the river.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-003', word: 'Gentle', definition: 'Kind and soft; not rough or harsh', example: 'She gave the kitten a gentle pat.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-004', word: 'Sparkling', definition: 'Shining with small flashes of light', example: 'The sparkling river reflected the sunlight.', pos: 'adj', level: 'K-5' },

  // K-5 Adverbs
  { id: 'v-k5-d-001', word: 'Carefully', definition: 'In a way that avoids danger or mistakes', example: 'She carefully carried the glass of water.', pos: 'adv', level: 'K-5' },
  { id: 'v-k5-d-002', word: 'Quickly', definition: 'In a fast way; with speed', example: 'He quickly finished his homework.', pos: 'adv', level: 'K-5' },
  { id: 'v-k5-d-003', word: 'Silently', definition: 'In a way that makes no sound', example: 'The cat silently crept up on the mouse.', pos: 'adv', level: 'K-5' },

  // 6-8 Nouns
  { id: 'v-68-n-001', word: 'Narrative', definition: 'A spoken or written account of connected events; a story', example: 'The narrative of the hero\'s journey captivated the audience.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-002', word: 'Hypothesis', definition: 'A proposed explanation that can be tested', example: 'The scientist formed a hypothesis about why the plant grew.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-003', word: 'Evidence', definition: 'Facts or signs that show something is true', example: 'The detective found evidence that proved the suspect was innocent.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-004', word: 'Metaphor', definition: 'A comparison between two unlike things without using like or as', example: 'The classroom was a zoo after the announcement.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-005', word: 'Perseverance', definition: 'Continuing to try even when things are difficult', example: 'Her perseverance helped her pass the difficult exam.', pos: 'noun', level: '6-8' },

  // 6-8 Verbs
  { id: 'v-68-v-001', word: 'Persuade', definition: 'To convince someone to do or believe something', example: 'She tried to persuade her friend to join the club.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-002', word: 'Analyze', definition: 'To examine something carefully to understand it', example: 'We will analyze the poem line by line.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-003', word: 'Illustrate', definition: 'To provide examples that make something clear', example: 'The teacher used a chart to illustrate the concept.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-004', word: 'Summarize', definition: 'To give a brief statement of the main points', example: 'Can you summarize the story in two sentences?', pos: 'verb', level: '6-8' },

  // 6-8 Adjectives
  { id: 'v-68-a-001', word: 'Abundant', definition: 'Existing in large amounts; plentiful', example: 'The garden had an abundant supply of fresh vegetables.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-002', word: 'Meticulous', definition: 'Showing great attention to detail; very careful', example: 'The meticulous artist spent hours on each brushstroke.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-003', word: 'Reluctant', definition: 'Not willing to do something; hesitant', example: 'He was reluctant to give his presentation.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-004', word: 'Vivid', definition: 'Producing strong, clear images in the mind', example: 'The author used vivid descriptions to bring the scene to life.', pos: 'adj', level: '6-8' },

  // 6-8 Adverbs
  { id: 'v-68-d-001', word: 'Deliberately', definition: 'In a way that is intentional, not accidental', example: 'She deliberately ignored the alarm and went back to sleep.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-002', word: 'Frequently', definition: 'Often; happening many times', example: 'He frequently visits the library after school.', pos: 'adv', level: '6-8' },

  // 9-12 Nouns
  { id: 'v-912-n-001', word: 'Allegory', definition: 'A story with a hidden meaning, often moral or political', example: 'Animal Farm is an allegory about the Russian Revolution.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-002', word: 'Catalyst', definition: 'Something that causes a major change or action', example: 'The protest was a catalyst for new legislation.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-003', word: 'Dichotomy', definition: 'A division into two very different or opposite things', example: 'There is a dichotomy between rich and poor in the city.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-004', word: 'Juxtaposition', definition: 'Placing two things side by side to highlight contrast', example: 'The juxtaposition of wealth and poverty was striking.', pos: 'noun', level: '9-12' },

  // 9-12 Verbs
  { id: 'v-912-v-001', word: 'Hypothesize', definition: 'To propose an explanation that can be tested', example: 'Scientists hypothesize that the disease spreads through water.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-002', word: 'Extrapolate', definition: 'To extend known information to make a guess about the unknown', example: 'We can extrapolate from the data to predict next year\'s results.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-003', word: 'Advocate', definition: 'To publicly support or recommend a particular cause', example: 'She advocates for better school funding.', pos: 'verb', level: '9-12' },

  // 9-12 Adjectives
  { id: 'v-912-a-001', word: 'Ephemeral', definition: 'Lasting for a very short time', example: 'The ephemeral beauty of the sunset lasted only minutes.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-002', word: 'Pragmatic', definition: 'Dealing with things in a practical, realistic way', example: 'She took a pragmatic approach to solving the budget problem.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-003', word: 'Ubiquitous', definition: 'Found everywhere; very common', example: 'Smartphones have become ubiquitous in modern society.', pos: 'adj', level: '9-12' },

  // 9-12 Adverbs
  { id: 'v-912-d-001', word: 'Inadvertently', definition: 'Without meaning to; by accident', example: 'She inadvertently revealed the surprise party.', pos: 'adv', level: '9-12' },
  { id: 'v-912-d-002', word: 'Simultaneously', definition: 'At the same time', example: 'Both teams scored simultaneously, creating a tie.', pos: 'adv', level: '9-12' },
]

// ============================================================
// Helper Functions
// ============================================================

export function getCardsByFilter(filter: {
  pos?: PosTag[]
  level?: CardLevel | 'all'
}): VocabCard[] {
  let result = VOCAB_CARDS
  if (filter.pos && filter.pos.length > 0) {
    result = result.filter(c => filter.pos!.includes(c.pos))
  }
  if (filter.level && filter.level !== 'all') {
    result = result.filter(c => c.level === filter.level)
  }
  return result
}

export function shuffleCards(cards: VocabCard[]): VocabCard[] {
  const arr = [...cards]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
