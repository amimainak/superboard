// Test compromise POS tagger with tricky sentences
// Run: node scripts/test-pos-tagger.js

const nlp = require('compromise');

const PRIORITY = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Pronoun', 'Preposition', 'Conjunction', 'Determiner', 'Auxiliary', 'Interjection', 'Particle'];

function getPrimaryPOS(tags) {
  for (const p of PRIORITY) {
    if (tags.includes(p)) return p;
  }
  return 'Unknown';
}

function tagSentence(sentence) {
  const doc = nlp(sentence);
  const data = doc.json();
  if (!data || !data[0] || !data[0].terms) return [];
  return data[0].terms.map(t => ({
    text: t.text,
    pos: getPrimaryPOS(t.tags),
    allTags: t.tags,
  }));
}

// Test cases designed by an experienced English tutor
const TEST_CASES = [
  // User's complaint: adjectives labeled as nouns
  { sentence: 'The quick brown fox jumps over the lazy dog.', expected: { quick: 'Adjective', brown: 'Adjective', lazy: 'Adjective' } },
  { sentence: 'She wore a beautiful red dress to the party.', expected: { beautiful: 'Adjective', red: 'Adjective' } },
  { sentence: 'The old man sat quietly on the bench.', expected: { old: 'Adjective', quietly: 'Adverb' } },
  
  // Tricky cases: words that change POS by context
  { sentence: 'They run every morning.', expected: { run: 'Verb' } },
  { sentence: 'The morning run was exhausting.', expected: { run: 'Noun', morning: 'Noun', exhausting: 'Adjective' } },
  { sentence: 'I will watch the game.', expected: { watch: 'Verb' } },
  { sentence: 'My watch is broken.', expected: { watch: 'Noun', broken: 'Adjective' } },
  { sentence: 'The light shines brightly.', expected: { light: 'Noun', brightly: 'Adverb' } },
  { sentence: 'She has light hair.', expected: { light: 'Adjective' } },
  
  // Tricky adjectives vs nouns
  { sentence: 'The American flag waved proudly.', expected: { American: 'Adjective' } },
  { sentence: 'The glass window shattered.', expected: { glass: 'Noun' } },
  { sentence: 'She drank from a glass.', expected: { glass: 'Noun' } },
  { sentence: 'The water is cold.', expected: { cold: 'Adjective' } },
  { sentence: 'She caught a cold.', expected: { cold: 'Noun' } },
  
  // Predicate adjectives after linking verbs
  { sentence: 'The soup tastes delicious.', expected: { tastes: 'Verb', delicious: 'Adjective' } },
  { sentence: 'He seems angry today.', expected: { seems: 'Verb', angry: 'Adjective' } },
  { sentence: 'The flowers smell wonderful.', expected: { smell: 'Verb', wonderful: 'Adjective' } },
  { sentence: 'She became famous.', expected: { became: 'Verb', famous: 'Adjective' } },
  
  // Possessive pronouns vs possessive adjectives (determiners)
  { sentence: 'Her book is on my desk.', expected: { Her: 'Determiner', my: 'Determiner' } },
  { sentence: 'The book is hers.', expected: { hers: 'Pronoun' } },
  
  // Adverbs vs adjectives confusion
  { sentence: 'He drives carefully.', expected: { carefully: 'Adverb' } },
  { sentence: 'He is a careful driver.', expected: { careful: 'Adjective' } },
  { sentence: 'She sings beautifully.', expected: { beautifully: 'Adverb' } },
  
  // Participle adjectives
  { sentence: 'The frightened child cried loudly.', expected: { frightened: 'Adjective', loudly: 'Adverb' } },
  { sentence: 'The breaking news shocked everyone.', expected: { breaking: 'Adjective' } },
  { sentence: 'The written report was thorough.', expected: { written: 'Adjective', thorough: 'Adjective' } },
  
  // Nouns used as adjectives (noun adjuncts)
  { sentence: 'The school bus arrived late.', expected: { school: 'Noun' } }, // "school" is technically a noun adjunct
  { sentence: 'The water bottle is empty.', expected: { water: 'Noun', empty: 'Adjective' } },
  
  // Common student confusions
  { sentence: 'The dog barked loudly at the mailman.', expected: { barked: 'Verb', loudly: 'Adverb' } },
  { sentence: 'There are seven days in a week.', expected: { seven: 'Determiner', days: 'Noun' } },
  { sentence: 'She gave me a gift.', expected: { me: 'Pronoun', gift: 'Noun' } },
  
  // Gerunds vs participles
  { sentence: 'Swimming is good exercise.', expected: { Swimming: 'Verb' } }, // gerund - compromise tags as Verb/Gerund
  { sentence: 'The swimming pool is closed.', expected: { swimming: 'Adjective' } }, // participle adjective
  
  // More real classroom sentences
  { sentence: 'The tall giraffe ate green leaves from the acacia tree.', expected: { tall: 'Adjective', green: 'Adjective', acacia: 'Noun' } },
  { sentence: 'Several students completed the difficult assignment.', expected: { Several: 'Determiner', difficult: 'Adjective' } },
  { sentence: 'The children played happily in the spacious garden.', expected: { happily: 'Adverb', spacious: 'Adjective' } },
];

let total = 0;
let correct = 0;
let wrong = 0;
const errors = [];

console.log('='.repeat(70));
console.log('POS TAGGER ACCURACY TEST');
console.log('Testing compromise.js library with tutor-level sentences');
console.log('='.repeat(70));

for (const tc of TEST_CASES) {
  const tagged = tagSentence(tc.sentence);
  console.log('\nSentence: "' + tc.sentence + '"');
  
  for (const word of Object.keys(tc.expected)) {
    total++;
    const expected = tc.expected[word];
    const found = tagged.find(t => t.text.toLowerCase() === word.toLowerCase());
    const actual = found ? found.pos : 'NOT FOUND';
    
    if (actual === expected) {
      correct++;
      console.log('  \u2713 "' + word + '" → ' + actual + ' (correct)');
    } else {
      wrong++;
      const allTags = found ? found.allTags.join(', ') : 'N/A';
      console.log('  \u2717 "' + word + '" → ' + actual + ' (expected ' + expected + ')  [tags: ' + allTags + ']');
      errors.push({ sentence: tc.sentence, word, expected, actual, allTags });
    }
  }
}

console.log('\n' + '='.repeat(70));
console.log('RESULTS: ' + correct + '/' + total + ' correct (' + (correct/total*100).toFixed(1) + '%)');
console.log('Errors: ' + wrong + '/' + total);
console.log('='.repeat(70));

if (errors.length > 0) {
  console.log('\nERROR SUMMARY (most impactful first):');
  const byType = {};
  for (const e of errors) {
    const key = e.expected + ' labeled as ' + e.actual;
    if (!byType[key]) byType[key] = [];
    byType[key].push(e.word + ' in "' + e.sentence + '"');
  }
  for (const [pattern, cases] of Object.entries(byType)) {
    console.log('\n  ' + pattern + ' (' + cases.length + 'x):');
    for (const c of cases) {
      console.log('    - ' + c);
    }
  }
}
