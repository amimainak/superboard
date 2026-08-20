// ============================================================
// Seed Script: Upload language exercise data to Supabase
// Uses REST API (anon key) to bulk-insert all static data.
// Run: npx tsx scripts/seed-language-data.ts
// ============================================================

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, ANON_KEY)

// Import all static data
import { PUNCT_EXERCISES } from '../src/data/punctuation-exercises'
import { VOCAB_CARDS } from '../src/data/vocab-cards'
import { SENTENCE_EXERCISES } from '../src/data/sentence-structure-exercises'
import { PHONICS_EXERCISES } from '../src/data/phonics-exercises'
import { EXPANSION_EXERCISES } from '../src/data/sentence-expansion-exercises'
import { FIGLANG_EXERCISES } from '../src/data/figurative-language-exercises'

async function seedExercises() {
  console.log('=== Seeding Language Exercises to Supabase ===')

  // 1. Punctuation exercises
  console.log('\n1/6 Seeding punctuation exercises...')
  const punctRows = PUNCT_EXERCISES.map(ex => ({
    id: ex.id,
    widget_kind: 'lang-punctuation',
    discriminator: ex.rule,
    difficulty: ex.difficulty,
    band: ex.band,
    question: ex.question,
    options: JSON.stringify(ex.options),
    correct_index: ex.correctIndex,
    explanations: JSON.stringify(ex.explanations),
    base_sentence: null,
    passage: null,
  }))
  const { error: pErr } = await supabase.from('language_exercises').upsert(punctRows, { onConflict: 'id' })
  if (pErr) console.error('  Punctuation error:', pErr.message)
  else console.log('  Inserted', punctRows.length, 'punctuation exercises')

  // 2. Sentence structure exercises
  console.log('2/6 Seeding sentence structure exercises...')
  const ssRows = SENTENCE_EXERCISES.map(ex => ({
    id: ex.id,
    widget_kind: 'lang-sentence-structure',
    discriminator: ex.type,
    difficulty: ex.difficulty,
    band: ex.band,
    question: ex.question,
    options: JSON.stringify(ex.options),
    correct_index: ex.correctIndex,
    explanations: JSON.stringify(ex.explanations),
    base_sentence: null,
    passage: null,
  }))
  const { error: ssErr } = await supabase.from('language_exercises').upsert(ssRows, { onConflict: 'id' })
  if (ssErr) console.error('  Sentence structure error:', ssErr.message)
  else console.log('  Inserted', ssRows.length, 'sentence structure exercises')

  // 3. Phonics exercises
  console.log('3/6 Seeding phonics exercises...')
  const phRows = PHONICS_EXERCISES.map(ex => ({
    id: ex.id,
    widget_kind: 'lang-phonics',
    discriminator: ex.category,
    difficulty: ex.difficulty,
    band: ex.band,
    question: ex.question,
    options: JSON.stringify(ex.options),
    correct_index: ex.correctIndex,
    explanations: JSON.stringify(ex.explanations),
    base_sentence: null,
    passage: null,
  }))
  const { error: phErr } = await supabase.from('language_exercises').upsert(phRows, { onConflict: 'id' })
  if (phErr) console.error('  Phonics error:', phErr.message)
  else console.log('  Inserted', phRows.length, 'phonics exercises')

  // 4. Sentence expansion exercises
  console.log('4/6 Seeding sentence expansion exercises...')
  const seRows = EXPANSION_EXERCISES.map(ex => ({
    id: ex.id,
    widget_kind: 'lang-sentence-expansion',
    discriminator: ex.type,
    difficulty: ex.difficulty,
    band: ex.band,
    question: ex.question,
    options: JSON.stringify(ex.options),
    correct_index: ex.correctIndex,
    explanations: JSON.stringify(ex.explanations),
    base_sentence: ex.baseSentence || null,
    passage: null,
  }))
  const { error: seErr } = await supabase.from('language_exercises').upsert(seRows, { onConflict: 'id' })
  if (seErr) console.error('  Sentence expansion error:', seErr.message)
  else console.log('  Inserted', seRows.length, 'sentence expansion exercises')

  // 5. Figurative language exercises
  console.log('5/6 Seeding figurative language exercises...')
  const flRows = FIGLANG_EXERCISES.map(ex => ({
    id: ex.id,
    widget_kind: 'lang-figurative-language',
    discriminator: ex.type,
    difficulty: ex.difficulty,
    band: ex.band,
    question: ex.question,
    options: JSON.stringify(ex.options),
    correct_index: ex.correctIndex,
    explanations: JSON.stringify(ex.explanations),
    base_sentence: null,
    passage: ex.passage || null,
  }))
  const { error: flErr } = await supabase.from('language_exercises').upsert(flRows, { onConflict: 'id' })
  if (flErr) console.error('  Figurative language error:', flErr.message)
  else console.log('  Inserted', flRows.length, 'figurative language exercises')

  // 6. Vocab cards
  console.log('6/6 Seeding vocab cards...')
  const vRows = VOCAB_CARDS.map(c => ({
    id: c.id,
    word: c.word,
    definition: c.definition,
    example: c.example,
    pos: c.pos,
    level: c.level,
  }))
  const { error: vErr } = await supabase.from('vocab_cards').upsert(vRows, { onConflict: 'id' })
  if (vErr) console.error('  Vocab error:', vErr.message)
  else console.log('  Inserted', vRows.length, 'vocab cards')

  // Verify
  const { count: exCount } = await supabase.from('language_exercises').select('*', { count: 'exact', head: true })
  const { count: vcCount } = await supabase.from('vocab_cards').select('*', { count: 'exact', head: true })
  console.log('\n=== Verification ===')
  console.log('language_exercises:', exCount, 'rows')
  console.log('vocab_cards:', vcCount, 'rows')
  console.log('Done!')
}

seedExercises().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
