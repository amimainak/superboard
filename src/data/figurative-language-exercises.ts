// ============================================================
// Figurative Language Exercises — organized by type, difficulty, grade band
// Architecture: data-file-based, consumed by unified widget component
// ============================================================

export type FigLangType =
  | 'simile' | 'metaphor' | 'personification' | 'hyperbole' | 'alliteration' | 'onomatopoeia'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type GradeBand = 'K-5' | '6-8' | '9-12'

export interface FigLangExercise {
  id: string
  type: FigLangType
  difficulty: Difficulty
  band: GradeBand
  question: string
  passage: string
  options: [string, string, string]
  correctIndex: 0 | 1 | 2
  explanations: [string, string, string]
}

export const FIGLANG_TYPES: { id: FigLangType; label: string; description: string }[] = [
  { id: 'simile', label: 'Simile', description: 'Compares two things using "like" or "as"' },
  { id: 'metaphor', label: 'Metaphor', description: 'States one thing IS another without like/as' },
  { id: 'personification', label: 'Personification', description: 'Gives human qualities to non-human things' },
  { id: 'hyperbole', label: 'Hyperbole', description: 'Exaggeration for emphasis or effect' },
  { id: 'alliteration', label: 'Alliteration', description: 'Repetition of initial consonant sounds' },
  { id: 'onomatopoeia', label: 'Onomatopoeia', description: 'Words that imitate sounds' },
]

// ============================================================
// Exercises — 42 across 6 types, 3 difficulties, 3 grade bands
// ============================================================

export const FIGLANG_EXERCISES: FigLangExercise[] = [
  // ---- SIMILE (7) ----
  { id: 'fl-sim-001', type: 'simile', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'Her eyes sparkled like diamonds.',
    options: ['Simile', 'Metaphor', 'Personification'],
    correctIndex: 0,
    explanations: [
      'Correct! This is a simile because it compares eyes to diamonds using the word "like".',
      'A metaphor would say "Her eyes were diamonds" without using "like" or "as".',
      'Personification gives human qualities to non-human things, which is not happening here.',
    ] },
  { id: 'fl-sim-002', type: 'simile', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'He ran as fast as a cheetah.',
    options: ['Hyperbole', 'Simile', 'Alliteration'],
    correctIndex: 1,
    explanations: [
      'Hyperbole is extreme exaggeration. While running fast, this uses a comparison, not exaggeration.',
      'Correct! This is a simile because it compares his speed to a cheetah using "as."',
      'Alliteration is the repetition of initial consonant sounds, like "Peter Piper picked."',
    ] },
  { id: 'fl-sim-003', type: 'simile', difficulty: 'intermediate', band: '6-8',
    question: 'What type of figurative language is used?',
    passage: 'The classroom was as quiet as a library after the announcement.',
    options: ['Metaphor', 'Hyperbole', 'Simile'],
    correctIndex: 2,
    explanations: [
      'A metaphor would say the classroom "was" a library, without using "as."',
      'Hyperbole is extreme exaggeration. This is a realistic comparison, not an exaggeration.',
      'Correct! This is a simile because it compares the classroom to a library using "as."',
    ] },
  { id: 'fl-sim-004', type: 'simile', difficulty: 'intermediate', band: '6-8',
    question: 'Which sentence contains a simile?',
    passage: 'Choose the correct sentence:',
    options: [
      'The sun is a golden coin in the sky.',
      'Her laughter was like a melody.',
      'The wind howled angrily through the night.',
    ],
    correctIndex: 1,
    explanations: [
      'This is a metaphor because it directly states the sun "is" a golden coin without like/as.',
      'Correct! "Her laughter was like a melody" compares laughter to a melody using "like."',
      'This is personification because it gives the wind the human ability to howl angrily.',
    ] },
  { id: 'fl-sim-005', type: 'simile', difficulty: 'advanced', band: '9-12',
    question: 'What type of figurative language is used?',
    passage: 'The old man\'s hands were like gnarled tree roots, trembling as he reached for the doorknob.',
    options: ['Personification', 'Simile', 'Metaphor'],
    correctIndex: 1,
    explanations: [
      'Personification gives human qualities to non-human things. Here, hands are compared to tree roots.',
      'Correct! This simile compares the man\'s hands to gnarled tree roots using "like."',
      'A metaphor would say his hands "were" tree roots, without using "like."',
    ] },
  { id: 'fl-sim-006', type: 'simile', difficulty: 'advanced', band: '9-12',
    question: 'Which sentence contains a simile?',
    passage: 'Choose the correct sentence:',
    options: [
      'The city streets breathed with the rhythm of a thousand footsteps.',
      'Time is a thief that steals our moments.',
      'The water reflected the sunset like a shattered mirror.',
    ],
    correctIndex: 2,
    explanations: [
      'This is personification — streets don\'t actually breathe.',
      'This is a metaphor — it directly states time "is" a thief.',
      'Correct! This simile compares the water\'s reflection to a shattered mirror using "like."',
    ] },
  { id: 'fl-sim-007', type: 'simile', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'The puppy was as soft as a cloud.',
    options: ['Simile', 'Hyperbole', 'Metaphor'],
    correctIndex: 0,
    explanations: [
      'Correct! This is a simile because it compares the puppy to a cloud using "as."',
      'Hyperbole is extreme exaggeration. This is a gentle comparison.',
      'A metaphor would say "The puppy was a cloud" without using "like" or "as."',
    ] },

  // ---- METAPHOR (7) ----
  { id: 'fl-met-001', type: 'metaphor', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'The classroom was a zoo.',
    options: ['Simile', 'Metaphor', 'Hyperbole'],
    correctIndex: 1,
    explanations: [
      'A simile would say the classroom was "like a zoo" using "like" or "as."',
      'Correct! This is a metaphor because it directly states the classroom "was" a zoo.',
      'Hyperbole is extreme exaggeration. This is a direct comparison, not an exaggeration.',
    ] },
  { id: 'fl-met-002', type: 'metaphor', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'The sun is a golden coin in the sky.',
    options: ['Metaphor', 'Simile', 'Personification'],
    correctIndex: 0,
    explanations: [
      'Correct! This is a metaphor — it directly states the sun "is" a golden coin.',
      'A simile would say the sun is "like" a golden coin.',
      'Personification gives human qualities to non-human things.',
    ] },
  { id: 'fl-met-003', type: 'metaphor', difficulty: 'intermediate', band: '6-8',
    question: 'What type of figurative language is used?',
    passage: 'Her words were sharp daggers that cut through his confidence.',
    options: ['Simile', 'Metaphor', 'Hyperbole'],
    correctIndex: 1,
    explanations: [
      'A simile would say her words were "like daggers" using "like" or "as."',
      'Correct! This is a metaphor — it directly states her words "were" sharp daggers.',
      'Hyperbole is extreme exaggeration. This is a symbolic comparison, not an exaggeration.',
    ] },
  { id: 'fl-met-004', type: 'metaphor', difficulty: 'intermediate', band: '6-8',
    question: 'Which sentence contains a metaphor?',
    passage: 'Choose the correct sentence:',
    options: [
      'The thunder sounded like a drumroll across the sky.',
      'The thunder was a drumroll across the sky.',
      'The thunder grumbled and rumbled all night.',
    ],
    correctIndex: 1,
    explanations: [
      'This is a simile because it uses "like" to compare thunder to a drumroll.',
      'Correct! This is a metaphor — it directly states the thunder "was" a drumroll.',
      'This is personification because grumbling and rumbling are human actions.',
    ] },
  { id: 'fl-met-005', type: 'metaphor', difficulty: 'advanced', band: '9-12',
    question: 'What type of figurative language is used?',
    passage: 'Time is a thief that steals our moments one by one.',
    options: ['Personification', 'Metaphor', 'Simile'],
    correctIndex: 1,
    explanations: [
      'While "steals" feels like personification, the primary device is the direct comparison of time to a thief.',
      'Correct! This is a metaphor — it directly states time "is" a thief.',
      'A simile would say time is "like a thief" using "like."',
    ] },
  { id: 'fl-met-006', type: 'metaphor', difficulty: 'advanced', band: '9-12',
    question: 'Which sentence contains a metaphor?',
    passage: 'Choose the correct sentence:',
    options: [
      'Her voice was honey, sweet and warm.',
      'Her voice sounded as sweet as honey.',
      'Her voice echoed like bells in the hall.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! This is a metaphor — it directly states her voice "was" honey.',
      'This is a simile because it uses "as" to compare her voice to honey.',
      'This is a simile because it uses "like" to compare her voice to bells.',
    ] },
  { id: 'fl-met-007', type: 'metaphor', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'His bedroom is a disaster zone.',
    options: ['Hyperbole', 'Metaphor', 'Simile'],
    correctIndex: 1,
    explanations: [
      'Hyperbole is extreme exaggeration. This is a comparison, not an exaggeration.',
      'Correct! This is a metaphor — it directly states the bedroom "is" a disaster zone.',
      'A simile would say his bedroom is "like" a disaster zone.',
    ] },

  // ---- PERSONIFICATION (7) ----
  { id: 'fl-per-001', type: 'personification', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'The wind whispered through the trees.',
    options: ['Onomatopoeia', 'Personification', 'Alliteration'],
    correctIndex: 1,
    explanations: [
      'Onomatopoeia is a word that imitates a sound, like "buzz" or "pop."',
      'Correct! This is personification because "whispering" is a human action given to the wind.',
      'Alliteration is the repetition of initial consonant sounds in nearby words.',
    ] },
  { id: 'fl-per-002', type: 'personification', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'The flowers danced in the breeze.',
    options: ['Personification', 'Simile', 'Metaphor'],
    correctIndex: 0,
    explanations: [
      'Correct! This is personification because "danced" is a human action given to flowers.',
      'A simile uses "like" or "as" to compare two things.',
      'A metaphor directly states one thing "is" another.',
    ] },
  { id: 'fl-per-003', type: 'personification', difficulty: 'intermediate', band: '6-8',
    question: 'What type of figurative language is used?',
    passage: 'The old house groaned and creaked as if it were tired from years of standing.',
    options: ['Onomatopoeia', 'Metaphor', 'Personification'],
    correctIndex: 2,
    explanations: [
      'Onomatopoeia is a word that imitates a sound. "Groaned" and "creaked" describe an action, not just a sound.',
      'A metaphor directly states one thing "is" another. This gives human qualities to a house.',
      'Correct! This is personification — the house "groaned" and was "tired," which are human traits.',
    ] },
  { id: 'fl-per-004', type: 'personification', difficulty: 'intermediate', band: '6-8',
    question: 'Which sentence contains personification?',
    passage: 'Choose the correct sentence:',
    options: [
      'The car engine roared like a lion.',
      'The car engine coughed and sputtered before finally giving up.',
      'The car engine made a loud popping sound.',
    ],
    correctIndex: 1,
    explanations: [
      'This is a simile because it compares the engine to a lion using "like."',
      'Correct! "Coughed," "sputtered," and "giving up" are human actions applied to a car engine.',
      'This is a literal description with no figurative language.',
    ] },
  { id: 'fl-per-005', type: 'personification', difficulty: 'advanced', band: '9-12',
    question: 'What type of figurative language is used?',
    passage: 'The fog crept silently through the streets, swallowing the lampposts one by one.',
    options: ['Hyperbole', 'Personification', 'Simile'],
    correctIndex: 1,
    explanations: [
      'Hyperbole is extreme exaggeration. This is a vivid comparison, not an overstatement.',
      'Correct! "Crept" and "swallowing" are human/animal actions given to the fog.',
      'A simile uses "like" or "as" to compare. There is no like/as here.',
    ] },
  { id: 'fl-per-006', type: 'personification', difficulty: 'advanced', band: '9-12',
    question: 'Which sentence contains personification?',
    passage: 'Choose the correct sentence:',
    options: [
      'The river flowed quickly over the rocks.',
      'The river sang a lullaby as it wound through the valley.',
      'The river was like a silver ribbon cutting through the land.',
    ],
    correctIndex: 1,
    explanations: [
      'This is a literal description — no figurative language is used.',
      'Correct! "Sang a lullaby" is a human action given to the river.',
      'This is a simile because it uses "like" to compare the river to a ribbon.',
    ] },
  { id: 'fl-per-007', type: 'personification', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'The stars winked at me from the dark sky.',
    options: ['Metaphor', 'Personification', 'Simile'],
    correctIndex: 1,
    explanations: [
      'A metaphor directly states one thing "is" another without like/as.',
      'Correct! "Winked" is a human action given to the stars.',
      'A simile uses "like" or "as" to make a comparison.',
    ] },

  // ---- HYPERBOLE (7) ----
  { id: 'fl-hyp-001', type: 'hyperbole', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'I\'ve told you a million times!',
    options: ['Hyperbole', 'Metaphor', 'Simile'],
    correctIndex: 0,
    explanations: [
      'Correct! This is hyperbole — an extreme exaggeration. No one has literally said something a million times.',
      'A metaphor directly states one thing "is" another.',
      'A simile uses "like" or "as" to compare two things.',
    ] },
  { id: 'fl-hyp-002', type: 'hyperbole', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'My backpack weighs a ton!',
    options: ['Simile', 'Hyperbole', 'Personification'],
    correctIndex: 1,
    explanations: [
      'A simile uses "like" or "as" to compare two things.',
      'Correct! This is hyperbole — the backpack doesn\'t literally weigh a ton. It\'s an exaggeration for emphasis.',
      'Personification gives human qualities to non-human things.',
    ] },
  { id: 'fl-hyp-003', type: 'hyperbole', difficulty: 'intermediate', band: '6-8',
    question: 'What type of figurative language is used?',
    passage: 'I\'m so hungry I could eat a horse.',
    options: ['Metaphor', 'Hyperbole', 'Personification'],
    correctIndex: 1,
    explanations: [
      'A metaphor directly states one thing "is" another. This is an exaggeration, not a comparison.',
      'Correct! This is hyperbole — eating a horse is an absurd exaggeration to show extreme hunger.',
      'Personification gives human qualities to non-human things.',
    ] },
  { id: 'fl-hyp-004', type: 'hyperbole', difficulty: 'intermediate', band: '6-8',
    question: 'Which sentence contains hyperbole?',
    passage: 'Choose the correct sentence:',
    options: [
      'She ran as fast as the wind.',
      'She cried an ocean of tears.',
      'She sang like a bird.',
    ],
    correctIndex: 1,
    explanations: [
      'This is a simile — it compares her speed to the wind using "as."',
      'Correct! "An ocean of tears" is hyperbole — it exaggerates the amount she cried.',
      'This is a simile — it compares her singing to a bird using "like."',
    ] },
  { id: 'fl-hyp-005', type: 'hyperbole', difficulty: 'advanced', band: '9-12',
    question: 'What type of figurative language is used?',
    passage: 'If I hear that song one more time, my head will literally explode.',
    options: ['Personification', 'Simile', 'Hyperbole'],
    correctIndex: 2,
    explanations: [
      'Personification gives human qualities to non-human things.',
      'A simile uses "like" or "as" to compare two things.',
      'Correct! This is hyperbole — a head exploding is an extreme exaggeration for frustration.',
    ] },
  { id: 'fl-hyp-006', type: 'hyperbole', difficulty: 'advanced', band: '9-12',
    question: 'Which sentence contains hyperbole?',
    passage: 'Choose the correct sentence:',
    options: [
      'The test was so long it took three days to finish.',
      'The test was as hard as stone.',
      'The test was a mountain I had to climb.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct! "Took three days" is an exaggeration — a school test doesn\'t literally take three days.',
      'This is a simile because it uses "as" to compare the test\'s difficulty to stone.',
      'This is a metaphor — it directly compares the test to a mountain.',
    ] },
  { id: 'fl-hyp-007', type: 'hyperbole', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'That was the funniest thing I\'ve ever heard in my entire life!',
    options: ['Hyperbole', 'Personification', 'Metaphor'],
    correctIndex: 0,
    explanations: [
      'Correct! "In my entire life" is an exaggeration for emphasis — it\'s hyperbole.',
      'Personification gives human qualities to non-human things.',
      'A metaphor directly states one thing "is" another.',
    ] },

  // ---- ALLITERATION (7) ----
  { id: 'fl-all-001', type: 'alliteration', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'Peter Piper picked a peck of pickled peppers.',
    options: ['Alliteration', 'Onomatopoeia', 'Simile'],
    correctIndex: 0,
    explanations: [
      'Correct! This is alliteration — the "P" sound is repeated at the beginning of many words.',
      'Onomatopoeia is a word that imitates a sound, like "buzz" or "pop."',
      'A simile uses "like" or "as" to compare two things.',
    ] },
  { id: 'fl-all-002', type: 'alliteration', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'Sally sells seashells by the seashore.',
    options: ['Simile', 'Hyperbole', 'Alliteration'],
    correctIndex: 2,
    explanations: [
      'A simile uses "like" or "as" to compare two things.',
      'Hyperbole is extreme exaggeration.',
      'Correct! This is alliteration — the "S" sound is repeated at the start of several words.',
    ] },
  { id: 'fl-all-003', type: 'alliteration', difficulty: 'intermediate', band: '6-8',
    question: 'What type of figurative language is used?',
    passage: 'The big brown bear bounced behind the bush.',
    options: ['Alliteration', 'Personification', 'Onomatopoeia'],
    correctIndex: 0,
    explanations: [
      'Correct! This is alliteration — the "B" sound is repeated at the beginning of many words.',
      'Personification gives human qualities to non-human things.',
      'Onomatopoeia is a word that imitates a sound.',
    ] },
  { id: 'fl-all-004', type: 'alliteration', difficulty: 'intermediate', band: '6-8',
    question: 'Which sentence contains alliteration?',
    passage: 'Choose the correct sentence:',
    options: [
      'The cat sat quietly on the windowsill.',
      'Five frantic frogs fled from the fox.',
      'The dog barked loudly at the mailman.',
    ],
    correctIndex: 1,
    explanations: [
      'This sentence has no repetition of initial consonant sounds.',
      'Correct! The "F" sound is repeated at the start of "Five," "frantic," "frogs," "fled," and "fox."',
      'This sentence has no significant repetition of initial consonant sounds.',
    ] },
  { id: 'fl-all-005', type: 'alliteration', difficulty: 'advanced', band: '9-12',
    question: 'What type of figurative language is used?',
    passage: 'The silent snake slithered swiftly through the silver sage.',
    options: ['Onomatopoeia', 'Alliteration', 'Personification'],
    correctIndex: 1,
    explanations: [
      'Onomatopoeia is a word that imitates a sound, like "hiss" or "sizzle."',
      'Correct! The "S" sound is repeated at the beginning of many words, creating alliteration.',
      'Personification gives human qualities to non-human things.',
    ] },
  { id: 'fl-all-006', type: 'alliteration', difficulty: 'advanced', band: '9-12',
    question: 'Which sentence contains alliteration?',
    passage: 'Choose the correct sentence:',
    options: [
      'She walked home in the rain without an umbrella.',
      'The wild winds whipped the weary wheat into waves.',
      'He spoke softly so as not to wake anyone.',
    ],
    correctIndex: 1,
    explanations: [
      'This sentence has no significant repetition of initial consonant sounds.',
      'Correct! The "W" sound is repeated at the start of "wild," "winds," "whipped," "weary," "wheat," and "waves."',
      'This sentence has no significant repetition of initial consonant sounds.',
    ] },
  { id: 'fl-all-007', type: 'alliteration', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'Betty Botter bought some butter, but she said the butter\'s bitter.',
    options: ['Hyperbole', 'Alliteration', 'Simile'],
    correctIndex: 1,
    explanations: [
      'Hyperbole is extreme exaggeration.',
      'Correct! This is alliteration — the "B" sound is repeated at the beginning of many words.',
      'A simile uses "like" or "as" to compare two things.',
    ] },

  // ---- ONOMATOPOEIA (7) ----
  { id: 'fl-ono-001', type: 'onomatopoeia', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'The bees buzzed around the garden.',
    options: ['Onomatopoeia', 'Alliteration', 'Personification'],
    correctIndex: 0,
    explanations: [
      'Correct! "Buzzed" is an onomatopoeia — it imitates the actual sound bees make.',
      'Alliteration is the repetition of initial consonant sounds in nearby words.',
      'Personification gives human qualities to non-human things.',
    ] },
  { id: 'fl-ono-002', type: 'onomatopoeia', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'The popcorn popped and crackled in the microwave.',
    options: ['Personification', 'Onomatopoeia', 'Alliteration'],
    correctIndex: 1,
    explanations: [
      'Personification gives human qualities to non-human things.',
      'Correct! "Popped" and "crackled" are onomatopoeia — they imitate the sounds they describe.',
      'Alliteration is the repetition of initial consonant sounds.',
    ] },
  { id: 'fl-ono-003', type: 'onomatopoeia', difficulty: 'intermediate', band: '6-8',
    question: 'What type of figurative language is used?',
    passage: 'The thunder boomed and the lightning sizzled across the dark sky.',
    options: ['Hyperbole', 'Onomatopoeia', 'Metaphor'],
    correctIndex: 1,
    explanations: [
      'Hyperbole is extreme exaggeration.',
      'Correct! "Boomed" and "sizzled" are onomatopoeia — they imitate real sounds.',
      'A metaphor directly states one thing "is" another.',
    ] },
  { id: 'fl-ono-004', type: 'onomatopoeia', difficulty: 'intermediate', band: '6-8',
    question: 'Which sentence contains onomatopoeia?',
    passage: 'Choose the correct sentence:',
    options: [
      'The dog barked at the stranger who knocked on the door.',
      'The dog barked, and the doorbell ding-donged.',
      'The dog barked like a lion at the stranger.',
    ],
    correctIndex: 1,
    explanations: [
      '"Barked" can be literal, and there is no clear sound-imitation word.',
      'Correct! "Ding-donged" is onomatopoeia — it imitates the sound of a doorbell.',
      'This is a simile because it uses "like" to compare the dog to a lion.',
    ] },
  { id: 'fl-ono-005', type: 'onomatopoeia', difficulty: 'advanced', band: '9-12',
    question: 'What type of figurative language is used?',
    passage: 'The clock tick-tocked rhythmically as the rain splashed against the windowpane.',
    options: ['Alliteration', 'Onomatopoeia', 'Personification'],
    correctIndex: 1,
    explanations: [
      'Alliteration is the repetition of initial consonant sounds. This focuses on sound imitation.',
      'Correct! "Tick-tocked" and "splashed" are onomatopoeia — they imitate sounds.',
      'Personification gives human qualities to non-human things.',
    ] },
  { id: 'fl-ono-006', type: 'onomatopoeia', difficulty: 'advanced', band: '9-12',
    question: 'Which sentence contains onomatopoeia?',
    passage: 'Choose the correct sentence:',
    options: [
      'The car drove quickly down the wet road.',
      'The car screeched to a halt, its tires squealing on the pavement.',
      'The car was a rocket shooting down the highway.',
    ],
    correctIndex: 1,
    explanations: [
      'This is a literal description with no figurative language.',
      'Correct! "Screeched" and "squealing" are onomatopoeia — they imitate actual sounds.',
      'This is a metaphor — it directly compares the car to a rocket.',
    ] },
  { id: 'fl-ono-007', type: 'onomatopoeia', difficulty: 'beginner', band: 'K-5',
    question: 'What type of figurative language is used?',
    passage: 'Snap, crackle, pop went the cereal in the bowl.',
    options: ['Alliteration', 'Onomatopoeia', 'Hyperbole'],
    correctIndex: 1,
    explanations: [
      'Alliteration is the repetition of initial consonant sounds in words.',
      'Correct! "Snap," "crackle," and "pop" are all onomatopoeia — they imitate sounds.',
      'Hyperbole is extreme exaggeration.',
    ] },
]

// ============================================================
// Helper Functions
// ============================================================

export function getExercisesByFilter(filter: {
  types?: FigLangType[]
  difficulty?: Difficulty | 'all'
  band?: GradeBand | 'all'
}): FigLangExercise[] {
  let result = FIGLANG_EXERCISES
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

export function shuffleExercises(exercises: FigLangExercise[]): FigLangExercise[] {
  const arr = [...exercises]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function getExerciseById(id: string): FigLangExercise | undefined {
  return FIGLANG_EXERCISES.find(e => e.id === id)
}

export function generateWrongVariants(passage: string, correctType: FigLangType): [string, string] {
  const allTypes: FigLangType[] = ['simile', 'metaphor', 'personification', 'hyperbole', 'alliteration', 'onomatopoeia']
  const others = allTypes.filter(t => t !== correctType)
  // Pick two different wrong types
  const wrong1 = others[Math.floor(Math.random() * others.length)]
  let wrong2 = others[Math.floor(Math.random() * others.length)]
  while (wrong2 === wrong1) {
    wrong2 = others[Math.floor(Math.random() * others.length)]
  }
  return [wrong1.charAt(0).toUpperCase() + wrong1.slice(1), wrong2.charAt(0).toUpperCase() + wrong2.slice(1)]
}
