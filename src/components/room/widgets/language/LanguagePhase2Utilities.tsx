'use client'

import React, { useState, useMemo, useCallback } from 'react'
import nlp from 'compromise'
import { TutorReveal } from '../shared/TutorReveal'

// ============================================================
// Style helper — consistent with Phase 1 tools
// ============================================================
function styles(isDark: boolean) {
  return {
    bg: isDark ? '#0f172a' : '#f8fafc',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    text: isDark ? '#e2e8f0' : '#1e293b',
    bright: isDark ? '#34d399' : '#059669',
    input: isDark ? 'rgba(255,255,255,0.05)' : 'white',
    btn: isDark ? 'rgba(5,150,105,0.15)' : 'rgba(5,150,105,0.1)',
    muted: isDark ? '#64748b' : '#94a3b8',
    cardBg: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    errorBg: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)',
    warnBg: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.08)',
    successBg: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)',
  }
}

function useInputState(defaultVal = '') {
  const [val, setVal] = useState(defaultVal)
  return [val, (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setVal(e.target.value), setVal] as const
}

// ============================================================
// 1. ROOT & MORPHOLOGY EXPLORER (Demonstration)
// ============================================================

const ROOT_DATABASE: Record<string, { origin: string; meaning: string; examples: string[] }> = {
  port: { origin: 'Latin', meaning: 'to carry', examples: ['transport', 'portable', 'export', 'import', 'support', 'deport'] },
  dict: { origin: 'Latin', meaning: 'to say/speak', examples: ['dictate', 'dictionary', 'predict', 'contradict', 'verdict', 'indicate'] },
  struct: { origin: 'Latin', meaning: 'to build', examples: ['structure', 'construct', 'destruct', 'instruction', 'obstruct', 'reconstruct'] },
  ject: { origin: 'Latin', meaning: 'to throw', examples: ['project', 'inject', 'reject', 'eject', 'object', 'subject'] },
  tract: { origin: 'Latin', meaning: 'to pull/drag', examples: ['tractor', 'attract', 'subtract', 'extract', 'contract', 'distract'] },
  spect: { origin: 'Latin', meaning: 'to look', examples: ['inspect', 'spectator', 'respect', 'expect', 'prospect', 'retrospect'] },
  scrib: { origin: 'Latin', meaning: 'to write', examples: ['scribe', 'describe', 'inscribe', 'prescribe', 'transcribe', 'manuscript'] },
  graph: { origin: 'Greek', meaning: 'to write/draw', examples: ['graphic', 'autograph', 'telegraph', 'photograph', 'paragraph', 'biography'] },
  cred: { origin: 'Latin', meaning: 'to believe', examples: ['credit', 'credible', 'incredible', 'creditor', 'discredit', 'credentials'] },
  vis: { origin: 'Latin', meaning: 'to see', examples: ['vision', 'visible', 'invisible', 'visual', 'visit', 'television'] },
  aud: { origin: 'Latin', meaning: 'to hear', examples: ['audio', 'audience', 'auditorium', 'audition', 'audible', 'inaudible'] },
  phon: { origin: 'Greek', meaning: 'sound', examples: ['phone', 'phonics', 'telephone', 'microphone', 'symphony', 'phonograph'] },
  meter: { origin: 'Greek', meaning: 'measure', examples: ['meter', 'thermometer', 'speedometer', 'perimeter', 'diameter', 'millimeter'] },
  bio: { origin: 'Greek', meaning: 'life', examples: ['biology', 'biography', 'biodegradable', 'biosphere', 'biopsy', 'symbiosis'] },
  geo: { origin: 'Greek', meaning: 'earth', examples: ['geography', 'geology', 'geometry', 'geothermal', 'geography', 'geocentric'] },
  chron: { origin: 'Greek', meaning: 'time', examples: ['chronological', 'chronicle', 'chronometer', 'synchronize', 'anachronism', 'chronic'] },
  log: { origin: 'Greek', meaning: 'word/study', examples: ['logic', 'dialogue', 'monologue', 'prologue', 'catalog', 'biological'] },
  morph: { origin: 'Greek', meaning: 'shape/form', examples: ['morphology', 'metamorphosis', 'amorphous', 'polymorph', 'morphine', 'anthropomorphize'] },
  path: { origin: 'Greek', meaning: 'feeling/disease', examples: ['sympathy', 'empathy', 'pathology', 'apathy', 'telepathy', 'sociopath'] },
  vac: { origin: 'Latin', meaning: 'empty', examples: ['vacuum', 'vacant', 'evacuate', 'vacation', 'vacuous', 'evacuation'] },
}

const COMMON_PREFIXES: Record<string, string> = {
  un: 'not', re: 'again', pre: 'before', mis: 'wrong', dis: 'not/away', over: 'too much',
  sub: 'under', inter: 'between', trans: 'across', super: 'above', semi: 'half',
  anti: 'against', auto: 'self', bi: 'two', co: 'together', de: 'down/from',
  ex: 'out of', fore: 'before', il: 'not', im: 'not', in: 'not/into',
  ir: 'not', macro: 'large', micro: 'small', mid: 'middle', non: 'not',
  post: 'after', pro: 'for/forward', retro: 'backward',
  tri: 'three', uni: 'one', under: 'below',
}

const COMMON_SUFFIXES: Record<string, string> = {
  tion: 'act/process', sion: 'act/process', ment: 'act/result', ness: 'state/quality',
  able: 'capable of', ible: 'capable of', ful: 'full of', less: 'without',
  ous: 'having', ious: 'having', ive: 'tending to', er: 'one who', or: 'one who',
  ist: 'one who', ism: 'belief/practice', ize: 'to make', ify: 'to make',
  en: 'to make', ly: 'in a manner', ward: 'direction', ship: 'state/condition',
  dom: 'state/condition', ity: 'state/quality', al: 'relating to', ial: 'relating to',
  ic: 'relating to', ical: 'relating to', esque: 'in the style of',
}

export function RootMorphologyExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [searchTerm, setSearchTerm] = useInputState('')
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null)

  const filteredRoots = useMemo(() => {
    if (!searchTerm.trim()) return Object.entries(ROOT_DATABASE)
    const term = searchTerm.toLowerCase().trim()
    return Object.entries(ROOT_DATABASE).filter(
      ([root, data]) =>
        root.includes(term) ||
        data.meaning.includes(term) ||
        data.examples.some((ex) => ex.includes(term))
    )
  }, [searchTerm])

  const selectedData = selectedRoot ? ROOT_DATABASE[selectedRoot] : null

  // Find which prefixes/suffixes apply to examples
  const analysis = useMemo(() => {
    if (!selectedRoot) return { prefixes: [] as string[], suffixes: [] as string[] }
    const data = ROOT_DATABASE[selectedRoot]
    if (!data) return { prefixes: [] as string[], suffixes: [] as string[] }
    const foundPrefixes = new Set<string>()
    const foundSuffixes = new Set<string>()
    for (const word of data.examples) {
      for (const [pfx] of Object.entries(COMMON_PREFIXES)) {
        if (word.startsWith(pfx) && pfx.length < word.length - selectedRoot.length) foundPrefixes.add(pfx)
      }
      for (const [sfx] of Object.entries(COMMON_SUFFIXES)) {
        if (word.endsWith(sfx) && sfx.length < word.length - selectedRoot.length) foundSuffixes.add(sfx)
      }
    }
    return { prefixes: Array.from(foundPrefixes), suffixes: Array.from(foundSuffixes) }
  }, [selectedRoot])

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Search */}
      <div style={{ padding: '0 12px 8px' }}>
        <input
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search roots, meanings, or words..."
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 12,
            background: s.input, border: '1px solid ' + s.border, color: s.text,
            outline: 'none',
          }}
        />
      </div>

      {/* Root list */}
      <div style={{ maxHeight: 120, overflowY: 'auto', padding: '0 12px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {filteredRoots.map(([root, data]) => (
          <button
            key={root}
            onClick={() => setSelectedRoot(root === selectedRoot ? null : root)}
            style={{
              padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
              background: selectedRoot === root ? 'rgba(5,150,105,0.2)' : s.cardBg,
              border: '1px solid ' + (selectedRoot === root ? 'rgba(5,150,105,0.4)' : s.border),
              color: selectedRoot === root ? s.bright : s.text,
              cursor: 'pointer',
            }}
          >
            {root} <span style={{ color: s.muted, fontWeight: 400 }}>({data.meaning})</span>
          </button>
        ))}
      </div>

      {/* Selected root detail */}
      {selectedData && (
        <div style={{ margin: '8px 12px', padding: 12, borderRadius: 8, background: s.cardBg, border: '1px solid ' + s.border }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: s.bright }}>{selectedRoot}</span>
            <span style={{ fontSize: 11, color: s.muted, padding: '2px 6px', borderRadius: 3, background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.2)' }}>{selectedData.origin}</span>
          </div>
          <div style={{ fontSize: 12, color: s.muted, marginBottom: 10 }}>{selectedData.meaning}</div>

          {/* Word tree */}
          <div style={{ fontSize: 11, fontWeight: 600, color: s.text, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Word Family</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {selectedData.examples.map((word) => {
              // selectedRoot is guaranteed non-null here (selectedData exists)
              const root: string = selectedRoot!
              const idx = word.toLowerCase().indexOf(root)
              const before = word.slice(0, idx)
              const after = word.slice(idx + root.length)
              return (
                <span key={word} style={{
                  padding: '3px 8px', borderRadius: 4, fontSize: 12,
                  background: s.input, border: '1px solid ' + s.border, color: s.text,
                }}>
                  {before}<span style={{ color: s.bright, fontWeight: 700 }}>{selectedRoot}</span>{after}
                </span>
              )
            })}
          </div>

          {/* Affixes found */}
          {analysis.prefixes.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: s.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Prefixes Found</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {analysis.prefixes.map((p) => (
                  <span key={p} style={{
                    padding: '2px 6px', borderRadius: 3, fontSize: 10,
                    background: 'rgba(8,145,178,0.15)', border: '1px solid rgba(8,145,178,0.25)',
                    color: '#38bdf8',
                  }}>{p}- ({COMMON_PREFIXES[p]})</span>
                ))}
              </div>
            </div>
          )}
          {analysis.suffixes.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: s.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Suffixes Found</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {analysis.suffixes.map((sfx) => (
                  <span key={sfx} style={{
                    padding: '2px 6px', borderRadius: 3, fontSize: 10,
                    background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)',
                    color: '#c084fc',
                  }}>-{sfx} ({COMMON_SUFFIXES[sfx]})</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// 2. ACTIVE & PASSIVE VOICE (Demonstration)
// ============================================================

interface VoiceTransformResult {
  original: string
  transformed: string
  voice: 'active' | 'passive'
  subject: string
  verb: string
  object: string
  agent: string
  tense: string
  steps: string[]
}

const TENSE_MAP: Record<string, { active: string; passive: string }> = {
  present: { active: 'V1/Vs', passive: 'am/is/are + V3' },
  past: { active: 'V2', passive: 'was/were + V3' },
  future: { active: 'will + V1', passive: 'will be + V3' },
  present_perfect: { active: 'has/have + V3', passive: 'has/have been + V3' },
  past_perfect: { active: 'had + V3', passive: 'had been + V3' },
}

const IRREGULAR_VERBS: Record<string, string> = {
  eat: 'eaten', write: 'written', speak: 'spoken', break: 'broken', choose: 'chosen',
  take: 'taken', make: 'made', give: 'given', see: 'seen', go: 'gone',
  come: 'come', know: 'known', think: 'thought', bring: 'brought', buy: 'bought',
  catch: 'caught', teach: 'taught', find: 'found', get: 'got', have: 'had',
  hear: 'heard', hold: 'held', keep: 'kept', leave: 'left', lose: 'lost',
  meet: 'met', read: 'read', run: 'run', say: 'said', sell: 'sold',
  send: 'sent', sit: 'sat', stand: 'stood', tell: 'told', win: 'won',
  build: 'built', draw: 'drawn', drive: 'driven', fall: 'fallen',
  feel: 'felt', fly: 'flown', forget: 'forgotten', hide: 'hidden', hit: 'hit',
  hurt: 'hurt', lay: 'laid', lend: 'lent', lie: 'lain', pay: 'paid',
  put: 'put', rise: 'risen', set: 'set', show: 'shown', sing: 'sung',
  sleep: 'slept', swim: 'swum', throw: 'thrown', understand: 'understood',
}

function getV3(verb: string): string {
  const lower = verb.toLowerCase()
  if (IRREGULAR_VERBS[lower]) return IRREGULAR_VERBS[lower]
  if (lower.endsWith('e')) return lower + 'd'
  if (lower.endsWith('y') && !'aeiou'.includes(lower[lower.length - 2])) return lower.slice(0, -1) + 'ied'
  return lower + 'ed'
}

function detectTense(verb: string): string {
  const lower = verb.toLowerCase()
  if (lower.startsWith('will ')) return 'future'
  if (lower.startsWith('has ') || lower.startsWith('have ')) return 'present_perfect'
  if (lower.startsWith('had ')) return 'past_perfect'
  if (lower.endsWith('ed') || IRREGULAR_VERBS[lower]) return 'past'
  return 'present'
}

function analyzeVoice(sentence: string, targetVoice: 'active' | 'passive'): VoiceTransformResult | null {
  const words = sentence.trim().split(/\s+/)
  if (words.length < 3) return null

  const isCurrentlyPassive = /(is|are|am|was|were|be|been|being)/i.test(sentence)
  const currentVoice: 'active' | 'passive' = isCurrentlyPassive ? 'passive' : 'active'

  if (currentVoice === targetVoice) {
    return {
      original: sentence, transformed: sentence, voice: currentVoice,
      subject: '', verb: '', object: '', agent: '',
      tense: detectTense(words.find(w => w !== words[0]) || ''),
      steps: ['This sentence is already in ' + targetVoice + ' voice.'],
    }
  }

  const steps: string[] = []
  const tense = detectTense(words.find(w => /\b(is|are|am|was|were|will|has|have|had)\b/i.test(w)) || words[words.length > 2 ? 2 : 1] || '')
  const tenseInfo = TENSE_MAP[tense] || TENSE_MAP.present

  if (currentVoice === 'active' && targetVoice === 'passive') {
    // Active to Passive
    const subject = words[0]
    const rest = words.slice(1).join(' ')
    // Find the verb phrase and object
    const verbMatch = rest.match(/^(will\s+)?(?:(has|have|had)\s+)?(\w+)(.*)/i)
    if (!verbMatch) return null
    const aux = (verbMatch[1] || '') + (verbMatch[2] ? verbMatch[2] + ' ' : '')
    const mainVerb = verbMatch[3]
    const objectPhrase = verbMatch[4].trim()
    if (!objectPhrase) return null

    const v3 = getV3(mainVerb)
    let beVerb = 'is'
    if (tense === 'past') beVerb = 'was'
    else if (tense === 'future') beVerb = 'will be'
    else if (tense === 'present_perfect') beVerb = 'has been'
    else if (tense === 'past_perfect') beVerb = 'had been'
    else if (words.length > 3) beVerb = 'are'

    steps.push('Step 1: Identify subject ("' + subject + '"), verb ("' + mainVerb + '"), and object ("' + objectPhrase + '")')
    steps.push('Step 2: Move object to subject position → "' + objectPhrase + '"')
    steps.push('Step 3: Change verb to ' + tenseInfo.passive + ' → "' + beVerb + ' ' + v3 + '"')
    steps.push('Step 4: Move original subject to agent ("by ' + subject + '")')

    const transformed = objectPhrase.charAt(0).toUpperCase() + objectPhrase.slice(1) + ' ' + beVerb + ' ' + v3 + ' by ' + subject + '.'

    return { original: sentence, transformed, voice: 'passive', subject, verb: mainVerb, object: objectPhrase, agent: subject, tense, steps }
  } else {
    // Passive to Active
    const byMatch = sentence.match(/\bby\s+(\w+)/i)
    const agent = byMatch ? byMatch[1] : 'someone'
    const withoutBy = sentence.replace(/\s*\bby\s+\w+(\.?)?$/i, '').replace(/[.,]$/, '').trim()
    const words2 = withoutBy.split(/\s+/)
    const newSubject = words2[0]
    const beMatch = withoutBy.match(/^(\w+\s+)?(is|are|am|was|were|will\s+be|has\s+been|have\s+been|had\s+been)\s+(\w+)/i)
    if (!beMatch) return null
    const v3 = beMatch[3]
    // Get V1 from V3
    let v1 = v3
    for (const [base, past] of Object.entries(IRREGULAR_VERBS)) {
      if (past === v3) { v1 = base; break }
    }
    if (v1 === v3 && v3.endsWith('ed')) v1 = v3.slice(0, -2)
    else if (v1 === v3 && v3.endsWith('en')) v1 = v3.slice(0, -2)

    steps.push('Step 1: Identify the agent ("' + agent + '") — this becomes the new subject')
    steps.push('Step 2: Remove "by" phrase and be-verb → extract main verb')
    steps.push('Step 3: Convert "' + v3 + '" to base form → "' + v1 + '"')
    steps.push('Step 4: New subject ("' + agent + '") + verb ("' + v1 + '") + object ("' + newSubject + '")')

    const transformed = agent.charAt(0).toUpperCase() + agent.slice(1) + ' ' + v1 + 's ' + newSubject.toLowerCase() + '.'

    return { original: sentence, transformed, voice: 'active', subject: agent, verb: v1, object: newSubject, agent, tense, steps }
  }
}

export function ActivePassiveVoice({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [input, setInput] = useInputState('The cat chased the mouse')
  const [result, setResult] = useState<VoiceTransformResult | null>(null)

  const handleTransform = useCallback(() => {
    if (!input.trim()) return
    // Detect current voice and transform to the other
    const isPassive = /\b(is|are|am|was|were|be|been|being)\b/i.test(input)
    const target: 'active' | 'passive' = isPassive ? 'active' : 'passive'
    setResult(analyzeVoice(input, target))
  }, [input])

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ padding: '0 12px 8px' }}>
        <textarea
          value={input}
          onChange={setInput}
          rows={2}
          placeholder="Enter a sentence to transform..."
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 12,
            background: s.input, border: '1px solid ' + s.border, color: s.text,
            outline: 'none', resize: 'vertical', fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button onClick={() => setResult(analyzeVoice(input, 'passive'))} style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: s.btn, border: '1px solid rgba(5,150,105,0.3)', color: s.bright, cursor: 'pointer',
          }}>→ Passive</button>
          <button onClick={() => setResult(analyzeVoice(input, 'active'))} style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: s.btn, border: '1px solid rgba(5,150,105,0.3)', color: s.bright, cursor: 'pointer',
          }}>→ Active</button>
        </div>
      </div>

      {result && (
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Original vs Transformed */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: 10, borderRadius: 6, background: s.cardBg, border: '1px solid ' + s.border }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: s.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Original</div>
              <div style={{ fontSize: 12, color: s.text }}>{result.original}</div>
            </div>
            <div style={{ padding: 10, borderRadius: 6, background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.2)' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: s.bright, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{result.voice === 'passive' ? 'Passive Voice' : 'Active Voice'}</div>
              <div style={{ fontSize: 12, color: s.text, fontWeight: 500 }}>{result.transformed}</div>
            </div>
          </div>

          {/* Analysis */}
          {result.subject && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {result.subject && <div style={{ padding: 6, borderRadius: 4, background: 'rgba(8,145,178,0.1)', border: '1px solid rgba(8,145,178,0.2)' }}>
                <div style={{ fontSize: 9, color: '#38bdf8', fontWeight: 600 }}>SUBJECT</div>
                <div style={{ fontSize: 11, color: s.text }}>{result.subject}</div>
              </div>}
              {result.verb && <div style={{ padding: 6, borderRadius: 4, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
                <div style={{ fontSize: 9, color: '#c084fc', fontWeight: 600 }}>VERB</div>
                <div style={{ fontSize: 11, color: s.text }}>{result.verb}</div>
              </div>}
              {result.object && <div style={{ padding: 6, borderRadius: 4, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ fontSize: 9, color: '#fbbf24', fontWeight: 600 }}>OBJECT</div>
                <div style={{ fontSize: 11, color: s.text }}>{result.object}</div>
              </div>}
            </div>
          )}

          {/* Steps */}
          <div style={{ padding: 10, borderRadius: 6, background: s.cardBg, border: '1px solid ' + s.border }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: s.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Transformation Steps</div>
            {result.steps.map((step, i) => (
              <div key={i} style={{ fontSize: 11, color: s.text, padding: '3px 0', display: 'flex', gap: 6 }}>
                <span style={{ color: s.bright, fontWeight: 600, fontSize: 10, minWidth: 16 }}>{i + 1}.</span>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 3. READING COMPREHENSION STRATEGIES (Demonstration)
// ============================================================

type StrategyType = 'sq3r' | '5w1h' | 'swbst' | 'kwl'

interface StrategyConfig {
  id: StrategyType
  label: string
  description: string
  steps: { label: string; prompt: string; placeholder: string }[]
}

const STRATEGIES: Record<StrategyType, StrategyConfig> = {
  sq3r: {
    id: 'sq3r',
    label: 'SQ3R',
    description: 'Survey, Question, Read, Recite, Review — a systematic approach to textbook reading',
    steps: [
      { label: 'Survey', prompt: 'What do you notice about the text structure? (headings, bold words, images, captions)', placeholder: 'The text has 3 sections with headings... The bold words suggest...' },
      { label: 'Question', prompt: 'Turn each heading into a question you want answered', placeholder: 'What causes...? How does...? Why is... important?' },
      { label: 'Read', prompt: 'Read actively to answer your questions. Note key details.', placeholder: 'The first section explains that... The author states...' },
      { label: 'Recite', prompt: 'Close the text. Can you answer your questions from memory?', placeholder: 'From memory, the answer to my first question is...' },
      { label: 'Review', prompt: 'Go back and check. What did you miss? What needs re-reading?', placeholder: 'I was correct about X but missed Y. I need to re-read page 2...' },
    ],
  },
  '5w1h': {
    id: '5w1h',
    label: '5W1H',
    description: 'Who, What, When, Where, Why, How — the journalist\'s framework for extracting key information',
    steps: [
      { label: 'Who', prompt: 'Who is the passage about? Who is involved?', placeholder: 'The main character is... The author is addressing...' },
      { label: 'What', prompt: 'What is happening? What is the main idea?', placeholder: 'The passage is about... The main event is...' },
      { label: 'When', prompt: 'When does this take place? What is the time frame?', placeholder: 'This happens during... The time period is...' },
      { label: 'Where', prompt: 'Where does this take place? What is the setting?', placeholder: 'The setting is... This occurs in...' },
      { label: 'Why', prompt: 'Why did this happen? What is the author\'s purpose?', placeholder: 'This happened because... The author wants to show...' },
      { label: 'How', prompt: 'How did it happen? How does the author explain it?', placeholder: 'The process involves... The author explains by...' },
    ],
  },
  swbst: {
    id: 'swbst',
    label: 'SWBST',
    description: 'Somebody, Wanted, But, So, Then — summarize narrative texts in 5 parts',
    steps: [
      { label: 'Somebody', prompt: 'Who is the main character?', placeholder: 'The main character is...' },
      { label: 'Wanted', prompt: 'What did they want or need?', placeholder: 'They wanted to... Their goal was...' },
      { label: 'But', prompt: 'What was the problem or obstacle?', placeholder: 'But then... The problem was...' },
      { label: 'So', prompt: 'What did they do about it?', placeholder: 'So they decided to... In response, they...' },
      { label: 'Then', prompt: 'How was it resolved? What happened in the end?', placeholder: 'Then finally... The resolution was...' },
    ],
  },
  kwl: {
    id: 'kwl',
    label: 'KWL',
    description: 'Know, Want to Know, Learned — activate prior knowledge and track new learning',
    steps: [
      { label: 'K (Know)', prompt: 'What do you already know about this topic?', placeholder: 'I already know that... From previous lessons, I remember...' },
      { label: 'W (Want to Know)', prompt: 'What do you want to learn? Write 2-3 questions.', placeholder: 'I wonder... I want to find out... My questions are...' },
      { label: 'L (Learned)', prompt: 'After reading, what did you learn? Answer your W questions.', placeholder: 'I learned that... Now I know the answer to... This surprised me...' },
    ],
  },
}

export function ReadingComprehensionStrategies({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [activeStrategy, setActiveStrategy] = useState<StrategyType | null>(null)
  const [answers, setAnswers] = useState<Record<string, Record<number, string>>>({})

  const currentStrategy = activeStrategy ? STRATEGIES[activeStrategy] : null

  const setAnswer = useCallback((strategyId: string, stepIdx: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [strategyId]: { ...(prev[strategyId] || {}), [stepIdx]: value },
    }))
  }, [])

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Strategy selector */}
      <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: s.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Choose a Framework</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {(Object.entries(STRATEGIES) as [StrategyType, StrategyConfig][]).map(([key, strat]) => (
            <button
              key={key}
              onClick={() => setActiveStrategy(activeStrategy === key ? null : key)}
              style={{
                padding: '8px 10px', borderRadius: 6, textAlign: 'left',
                background: activeStrategy === key ? 'rgba(5,150,105,0.12)' : s.cardBg,
                border: '1px solid ' + (activeStrategy === key ? 'rgba(5,150,105,0.3)' : s.border),
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: activeStrategy === key ? s.bright : s.text, marginBottom: 2 }}>{strat.label}</div>
              <div style={{ fontSize: 10, color: s.muted, lineHeight: 1.3 }}>{strat.description.slice(0, 60)}...</div>
            </button>
          ))}
        </div>
      </div>

      {/* Active strategy steps */}
      {currentStrategy && (
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            padding: '8px 10px', borderRadius: 6, fontSize: 11, color: s.muted,
            background: s.cardBg, border: '1px solid ' + s.border, lineHeight: 1.4,
          }}>
            {currentStrategy.description}
          </div>
          {currentStrategy.steps.map((step, idx) => {
            const val = answers[currentStrategy.id]?.[idx] || ''
            return (
              <div key={idx} style={{ padding: '10px', borderRadius: 6, background: s.cardBg, border: '1px solid ' + s.border }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 4, fontSize: 10, fontWeight: 700,
                    background: 'rgba(5,150,105,0.15)', color: s.bright,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{idx + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: s.text }}>{step.label}</span>
                </div>
                <div style={{ fontSize: 11, color: s.muted, marginBottom: 6, paddingLeft: 28 }}>{step.prompt}</div>
                <textarea
                  value={val}
                  onChange={(e) => setAnswer(currentStrategy.id, idx, e.target.value)}
                  placeholder={step.placeholder}
                  rows={2}
                  style={{
                    width: '100%', padding: '6px 8px', borderRadius: 4, fontSize: 11,
                    background: s.input, border: '1px solid ' + s.border, color: s.text,
                    outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginLeft: 28,
                  }}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================
// 4. GRAMMAR ERROR DIAGNOSTIC (Diagnostic + TutorReveal)
// ============================================================

interface GrammarIssue {
  type: string
  message: string
  index: number
  length: number
  severity: 'error' | 'warning' | 'info'
  suggestion?: string
}

function runGrammarChecks(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = []
  const sentences = text.split(/(?<=[.!?])\s+/)

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (!trimmed) continue

    // 1. Subject-verb agreement
    const svPatterns = [
      { pattern: /\b(he|she|it)\s+(have)\b/i, msg: 'Subject-verb agreement: Use "has" with he/she/it', fix: 'has' },
      { pattern: /\b(I)\s+(has)\b/i, msg: 'Subject-verb agreement: Use "have" with "I"', fix: 'have' },
      { pattern: /\b(they|we)\s+(has)\b/i, msg: 'Subject-verb agreement: Use "have" with they/we', fix: 'have' },
      { pattern: /\b(he|she|it)\s+(don't)\b/i, msg: 'Subject-verb agreement: Use "doesn\'t" with he/she/it', fix: "doesn't" },
      { pattern: /\b(I|they|we)\s+(doesn't)\b/i, msg: 'Subject-verb agreement: Use "don\'t" with I/they/we', fix: "don't" },
    ]
    for (const p of svPatterns) {
      const match = trimmed.match(p.pattern)
      if (match) {
        const idx = text.indexOf(match[0])
        issues.push({
          type: 'Subject-Verb Agreement',
          message: p.msg,
          index: idx >= 0 ? idx : 0,
          length: match[0].length,
          severity: 'error',
          suggestion: match[0].replace(match[2], p.fix),
        })
      }
    }

    // 2. Tense consistency — use compromise to find actual verbs and their tenses
    try {
      const doc = nlp(trimmed)
      const verbs = doc.verbs().json()
      let hasPastTense = false
      let hasPresentTense = false
      for (let vi = 0; vi < verbs.length; vi++) {
        const vtags = verbs[vi].tags || []
        if (vtags.indexOf('PastTense') !== -1) hasPastTense = true
        if (vtags.indexOf('PresentTense') !== -1) hasPresentTense = true
      }
      // Also check be-verb tenses
      const hasPastBe = /\b(was|were)\b/i.test(trimmed)
      const hasPresentBe = /\b(is|are|am)\b/i.test(trimmed)
      if (hasPastBe && hasPresentBe) {
        hasPastTense = true
        hasPresentTense = true
      }
      if (hasPastTense && hasPresentTense) {
        issues.push({
          type: 'Tense Consistency',
          message: 'Mixed tenses detected: past and present tense verbs in the same sentence',
          index: text.indexOf(trimmed),
          length: trimmed.length,
          severity: 'warning',
        })
      }
    } catch (_e) { /* compromise parse error, skip tense check */ }

    // 3. Comma splice detection
    if (/,[\s]*[a-z]/i.test(trimmed) && !/\b(and|but|or|so|yet|for|nor)\b/i.test(trimmed.split(',')[1] || '')) {
      const parts = trimmed.split(',')
      if (parts.length >= 2) {
        const secondClause = parts[1].trim()
        if (/^[a-z]/.test(secondClause) && /\b\w+\b/.test(secondClause)) {
          // Simple heuristic: if second part after comma starts with lowercase and has a verb
          const hasVerb = /\b(is|are|was|were|has|have|had|do|does|did|will|can|could|should|would|might|must)\b/i.test(secondClause)
          if (hasVerb) {
            issues.push({
              type: 'Comma Splice',
              message: 'Possible comma splice: two independent clauses joined by only a comma',
              index: text.indexOf(trimmed) + trimmed.indexOf(','),
              length: 1,
              severity: 'error',
              suggestion: 'Replace comma with a period, semicolon, or add a conjunction (and, but, so)',
            })
          }
        }
      }
    }

    // 4. Run-on sentence detection (very long sentence without punctuation)
    if (trimmed.length > 80 && !/[.,!?;:]/.test(trimmed.slice(-20))) {
      issues.push({
        type: 'Run-on Sentence',
        message: 'This sentence is very long and may be a run-on. Consider breaking it up.',
        index: text.indexOf(trimmed),
        length: trimmed.length,
        severity: 'warning',
      })
    }

    // 5. Article usage
    const articlePatterns = [
      { pattern: /\b(a)\s+([aeiou][a-z]*)/gi, check: (m: RegExpMatchArray) => !/^(uni|eu|one|us|uk)/i.test(m[2]), msg: 'Article check: Consider using "an" before words starting with a vowel sound' },
      { pattern: /\b(an)\s+([bcdfghjklmnpqrstvwxyz][a-z]*)/gi, check: (m: RegExpMatchArray) => !/^(hour|honest|honor|heir)/i.test(m[2]), msg: 'Article check: Consider using "a" before words starting with a consonant sound' },
    ]
    for (const ap of articlePatterns) {
      const match = trimmed.match(ap.pattern)
      if (match && ap.check(match)) {
        issues.push({
          type: 'Article Usage',
          message: ap.msg,
          index: text.indexOf(trimmed) + (match.index || 0),
          length: (match[0] || '').length,
          severity: 'info',
        })
      }
    }

    // 6. Double words
    const doubleWord = trimmed.match(/\b(\w+)\s+\1\b/i)
    if (doubleWord) {
      issues.push({
        type: 'Double Word',
        message: 'Repeated word: "' + doubleWord[1] + '" appears twice in a row',
        index: text.indexOf(trimmed) + (doubleWord.index || 0),
        length: (doubleWord[0] || '').length,
        severity: 'error',
        suggestion: doubleWord[1],
      })
    }

    // 7. Capitalization at start of sentence
    if (/^[a-z]/.test(trimmed)) {
      issues.push({
        type: 'Capitalization',
        message: 'Sentences should start with a capital letter',
        index: text.indexOf(trimmed),
        length: 1,
        severity: 'error',
        suggestion: trimmed[0].toUpperCase() + trimmed.slice(1),
      })
    }

    // 8. Missing end punctuation
    if (trimmed.length > 0 && !/[.!?]$/.test(trimmed)) {
      issues.push({
        type: 'Punctuation',
        message: 'Sentence appears to be missing end punctuation',
        index: text.indexOf(trimmed) + trimmed.length - 1,
        length: 1,
        severity: 'info',
      })
    }
  }

  return issues
}

export function GrammarErrorDiagnostic({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [input, setInput] = useInputState('')
  const [issues, setIssues] = useState<GrammarIssue[]>([])
  const [analyzed, setAnalyzed] = useState(false)

  const handleAnalyze = useCallback(() => {
    if (!input.trim()) return
    setIssues(runGrammarChecks(input))
    setAnalyzed(true)
  }, [input])

  const errorCount = issues.filter(i => i.severity === 'error').length
  const warnCount = issues.filter(i => i.severity === 'warning').length
  const infoCount = issues.filter(i => i.severity === 'info').length

  const severityColor = (sev: string) => {
    switch (sev) {
      case 'error': return isDark ? '#fca5a5' : '#dc2626'
      case 'warning': return isDark ? '#fbbf24' : '#d97706'
      default: return isDark ? '#94a3b8' : '#64748b'
    }
  }

  const severityBg = (sev: string) => {
    switch (sev) {
      case 'error': return s.errorBg
      case 'warning': return s.warnBg
      default: return s.cardBg
    }
  }

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ padding: '0 12px 8px' }}>
        <textarea
          value={input}
          onChange={setInput}
          rows={4}
          placeholder="Paste student writing here to check for common grammar errors..."
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 12,
            background: s.input, border: '1px solid ' + s.border, color: s.text,
            outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
          }}
        />
        <button onClick={handleAnalyze} style={{
          marginTop: 6, padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
          background: s.btn, border: '1px solid rgba(5,150,105,0.3)', color: s.bright, cursor: 'pointer',
        }}>Analyze Grammar</button>
      </div>

      {analyzed && (
        <TutorReveal isDark={isDark} label="Grammar Analysis">
          {/* Disclaimer */}
          <div style={{
            margin: '0 12px 8px', padding: '6px 10px', borderRadius: 4, fontSize: 10,
            background: s.warnBg, border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24',
          }}>
            Basic rule-based checker. May miss errors or flag correct text as issues. Use your professional judgment.
          </div>

          {/* Summary */}
          <div style={{ margin: '0 12px 8px', display: 'flex', gap: 6 }}>
            {errorCount > 0 && <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: s.errorBg, color: severityColor('error') }}>{errorCount} error{errorCount > 1 ? 's' : ''}</span>}
            {warnCount > 0 && <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: s.warnBg, color: severityColor('warning') }}>{warnCount} warning{warnCount > 1 ? 's' : ''}</span>}
            {infoCount > 0 && <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: s.cardBg, color: severityColor('info') }}>{infoCount} suggestion{infoCount > 1 ? 's' : ''}</span>}
            {issues.length === 0 && <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: s.successBg, color: '#22c55e' }}>No issues found</span>}
          </div>

          {/* Issues list */}
          <div style={{ margin: '0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {issues.map((issue, i) => (
              <div key={i} style={{
                padding: 8, borderRadius: 6, background: severityBg(issue.severity),
                border: '1px solid ' + (issue.severity === 'error' ? 'rgba(239,68,68,0.2)' : issue.severity === 'warning' ? 'rgba(245,158,11,0.2)' : s.border),
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: severityColor(issue.severity), textTransform: 'uppercase', letterSpacing: 0.5 }}>{issue.type}</span>
                  <span style={{ fontSize: 9, color: s.muted }}>({issue.severity})</span>
                </div>
                <div style={{ fontSize: 11, color: s.text, lineHeight: 1.4 }}>{issue.message}</div>
                {issue.suggestion && (
                  <div style={{ fontSize: 10, color: s.bright, marginTop: 3 }}>Suggestion: {issue.suggestion}</div>
                )}
              </div>
            ))}
          </div>
        </TutorReveal>
      )}
    </div>
  )
}

// ============================================================
// 5. SPELLING PATTERNS (Demonstration)
// ============================================================

interface SpellingPattern {
  id: string
  label: string
  rule: string
  examples: string[]
  exceptions: string[]
  gradeBands: string[]
}

const SPELLING_PATTERNS: SpellingPattern[] = [
  {
    id: 'consonant-double', label: 'Consonant Doubling',
    rule: 'When a one-syllable word ends in a single vowel + single consonant, double the consonant before adding -ed, -ing, -er, -est',
    examples: ['run → running', 'stop → stopped', 'big → bigger', 'hot → hottest', 'sit → sitting', 'plan → planned'],
    exceptions: ['fix → fixed (x = ks, not single consonant)', 'box → boxed'],
    gradeBands: ['2-3', '3-5'],
  },
  {
    id: 'silent-letters', label: 'Silent Letters',
    rule: 'Some letters are not pronounced in certain words. Common silent letters: k (knock), w (write), b (comb), g (gnaw), h (hour), t (listen)',
    examples: ['knock, knew, knee', 'write, wrong, wrap', 'comb, climb, lamb', 'gnaw, sign, design', 'hour, honest, rhyme', 'listen, castle, whistle'],
    exceptions: [],
    gradeBands: ['K-2', '2-3'],
  },
  {
    id: 'ie-ei', label: 'I Before E',
    rule: '"I before E, except after C, or when sounding like A as in neighbor and weigh"',
    examples: ['believe, piece, chief, thief, friend, view', 'receive, deceive, ceiling, perceive', 'weight, neighbor, freight, reign'],
    exceptions: ['weird, seize, foreign, leisure, neither, height, science'],
    gradeBands: ['3-5', '6-8'],
  },
  {
    id: 'plural-s-es', label: 'Plural Formation',
    rule: 'Most nouns add -s. Nouns ending in s, x, z, ch, sh add -es. Nouns ending in consonant + y change y to i and add -es.',
    examples: ['cat → cats', 'box → boxes', 'buzz → buzzes', 'watch → watches', 'baby → babies', 'party → parties'],
    exceptions: ['knife → knives', 'leaf → leaves', 'child → children', 'person → people', 'mouse → mice'],
    gradeBands: ['K-2', '2-3'],
  },
  {
    id: 'tion-sion', label: '-tion / -sion',
    rule: 'The suffix -tion (pronounced /shun/) is more common than -sion. Use -tion after most bases. Use -sion after verbs ending in -d, -de, -se, -ss.',
    examples: ['action, nation, station, education, fraction, multiplication', 'tension, expansion, comprehension, progression, discussion, vision'],
    exceptions: [],
    gradeBands: ['3-5', '6-8'],
  },
  {
    id: 'y-to-i', label: 'Y to I',
    rule: 'When a word ends in a consonant + y, change y to i before adding -es, -ed, -er, -est, or -ly',
    examples: ['happy → happier → happiest', 'carry → carried → carrying', 'easy → easily', 'funny → funnier', 'try → tried', 'cry → cried'],
    exceptions: ['play → played (vowel + y: keep the y)', 'enjoy → enjoyed', 'say → says'],
    gradeBands: ['2-3', '3-5'],
  },
  {
    id: 'dropping-e', label: 'Dropping Silent E',
    rule: 'When a base word ends in a silent e, drop the e before adding a suffix that starts with a vowel (-ing, -ed, -able, -ous)',
    examples: ['make → making', 'hope → hopeful', 'use → usable', 'care → caring', 'like → liked', 'write → writing'],
    exceptions: ['notice → noticeable (keep e to keep c soft)', 'manage → manageable', 'change → changeable'],
    gradeBands: ['2-3', '3-5'],
  },
  {
    id: 'hard-soft-c-g', label: 'Hard and Soft C/G',
    rule: 'C is soft (sounds like s) before e, i, y. C is hard (sounds like k) before a, o, u. Same pattern for G (soft = j, hard = g).',
    examples: ['Soft C: city, center, cycle, circle', 'Hard C: cat, cup, cold, class', 'Soft G: gym, giant, gentle, age', 'Hard G: go, game, good, great'],
    exceptions: ['get, give, girl (hard g before i/e)', 'gym (soft g before y is regular)'],
    gradeBands: ['K-2', '2-3', '3-5'],
  },
  {
    id: 'ough', label: 'The -ough Pattern',
    rule: '-ough can be pronounced many ways: /oh/ (though), /oo/ (through), /uf/ (rough, tough), /aw/ (thought, bought), /off/ (cough)',
    examples: ['though, although, dough (/oh/)', 'through, throughout (/oo/)', 'rough, tough, enough (/uf/)', 'thought, bought, fought (/aw/)', 'cough, trough (/off/)'],
    exceptions: ['Ought is pronounced /aw-t/'],
    gradeBands: ['3-5', '6-8'],
  },
  {
    id: 'prefix-spelling', label: 'Prefix Spelling Rules',
    rule: 'When adding a prefix, the base word spelling usually does not change. The prefix joins directly to the base.',
    examples: ['un + happy = unhappy', 're + write = rewrite', 'dis + agree = disagree', 'pre + test = pretest', 'mis + spell = misspell', 'over + cook = overcook'],
    exceptions: ['like → dislike (no change needed)', 'necessary → unnecessary'],
    gradeBands: ['3-5', '6-8'],
  },
]

export function SpellingPatterns({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [searchTerm, setSearchTerm] = useInputState('')
  const [selectedPattern, setSelectedPattern] = useState<SpellingPattern | null>(null)
  const [expandedExamples, setExpandedExamples] = useState<Set<string>>(new Set())

  const filteredPatterns = useMemo(() => {
    if (!searchTerm.trim()) return SPELLING_PATTERNS
    const term = searchTerm.toLowerCase()
    return SPELLING_PATTERNS.filter(
      (p) =>
        p.label.toLowerCase().includes(term) ||
        p.rule.toLowerCase().includes(term) ||
        p.examples.some((e) => e.toLowerCase().includes(term))
    )
  }, [searchTerm])

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ padding: '0 12px 8px' }}>
        <input
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search patterns..."
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 12,
            background: s.input, border: '1px solid ' + s.border, color: s.text,
            outline: 'none',
          }}
        />
      </div>

      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 400, overflowY: 'auto' }}>
        {filteredPatterns.map((pattern) => {
          const isExpanded = selectedPattern?.id === pattern.id
          return (
            <div key={pattern.id}>
              <button
                onClick={() => setSelectedPattern(isExpanded ? null : pattern)}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 6, textAlign: 'left',
                  background: isExpanded ? 'rgba(5,150,105,0.08)' : s.cardBg,
                  border: '1px solid ' + (isExpanded ? 'rgba(5,150,105,0.2)' : s.border),
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isExpanded ? s.bright : s.text }}>{pattern.label}</div>
                  <div style={{ fontSize: 10, color: s.muted, marginTop: 2, display: 'flex', gap: 4 }}>
                    {pattern.gradeBands.map((gb) => (
                      <span key={gb} style={{ padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.05)', border: '1px solid ' + s.border, fontSize: 9 }}>{gb}</span>
                    ))}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.muted} strokeWidth="2" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {isExpanded && (
                <div style={{ marginTop: 6, padding: 10, borderRadius: 6, background: s.cardBg, border: '1px solid ' + s.border }}>
                  {/* Rule */}
                  <div style={{ fontSize: 11, color: s.text, lineHeight: 1.5, marginBottom: 10 }}>{pattern.rule}</div>

                  {/* Examples */}
                  <div style={{ marginBottom: 8 }}>
                    <button
                      onClick={() => setExpandedExamples(prev => {
                        const next = new Set(prev)
                        if (next.has(pattern.id)) next.delete(pattern.id)
                        else next.add(pattern.id)
                        return next
                      })}
                      style={{ fontSize: 10, fontWeight: 600, color: s.bright, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 4, textAlign: 'left' }}
                    >
                      Examples {expandedExamples.has(pattern.id) ? '▼' : '▶'}
                    </button>
                    {expandedExamples.has(pattern.id) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                        {pattern.examples.map((ex, i) => (
                          <div key={i} style={{
                            padding: '4px 8px', borderRadius: 4, fontSize: 11, color: s.text,
                            background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.12)',
                          }}>
                            {ex}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Exceptions */}
                  {pattern.exceptions.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#fbbf24', marginBottom: 4 }}>Exceptions</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {pattern.exceptions.map((ex, i) => (
                          <div key={i} style={{ fontSize: 10, color: s.muted, paddingLeft: 8, borderLeft: '2px solid rgba(245,158,11,0.3)' }}>{ex}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
