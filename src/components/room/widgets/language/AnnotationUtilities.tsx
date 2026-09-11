'use client'

import { useState, useCallback } from 'react'

// ============================================================
// English Annotation Utilities
// Writing rubric, grammar checklist, and writing prompt generator
// ============================================================

const RUBRIC_CRITERIA = ['Ideas / Content', 'Organization', 'Style / Voice', 'Conventions'] as const
const PROFICIENCY_LEVELS = ['Beginning', 'Developing', 'Proficient', 'Advanced'] as const

const RUBRIC_DESCRIPTORS: Record<string, string[]> = {
  'Ideas / Content': [
    'Minimal detail, unclear focus',
    'Some supporting details, topic mostly clear',
    'Clear focus, strong details and examples',
    'Rich, compelling details with deep insight',
  ],
  Organization: [
    'No clear structure, hard to follow',
    'Basic structure, some transitions',
    'Clear structure, smooth transitions',
    'Sophisticated structure, seamless flow',
  ],
  'Style / Voice': [
    'Flat tone, generic language',
    'Some voice, basic word choice',
    'Engaging voice, precise vocabulary',
    'Distinctive voice, masterful word choice',
  ],
  Conventions: [
    'Frequent errors impede meaning',
    'Several errors, meaning mostly clear',
    'Few minor errors, conventions followed',
    'Essentially error-free, polished writing',
  ],
}

const GRAMMAR_ITEMS = [
  'Capitalization (first word, proper nouns)',
  'End punctuation (period, question mark, exclamation)',
  'Comma usage (series, clauses, introductory elements)',
  'Spelling accuracy',
  'Subject-verb agreement',
  'Complete sentences (no fragments)',
  'No run-on sentences',
  'Verb tense consistency',
  'Pronoun agreement and clarity',
  'Apostrophe usage (possessives, contractions)',
  'Quotation marks for dialogue',
  'Paragraph indentation',
]

const PROMPTS: Record<string, string[]> = {
  Narrative: [
    'Write about a time you overcame a challenge. What did you learn?',
    'Tell a story from the perspective of an inanimate object in the classroom.',
    'Describe a memorable family tradition and why it matters to you.',
    'Write a story that begins with the sentence: "The door opened, but no one was there."',
    'Narrate an experience where you had to make a difficult choice.',
  ],
  Expository: [
    'Explain the water cycle to someone who has never heard of it.',
    'Describe the causes and effects of a historical event you studied.',
    'Explain how a bill becomes a law in the United States.',
    'Compare and contrast two ecosystems you have learned about.',
    'Describe the process of photosynthesis in your own words.',
  ],
  Persuasive: [
    'Should students have homework on weekends? Take a position and support it.',
    'Write a letter convincing your principal to add a new elective class.',
    'Should the school day be longer or shorter? Argue your position.',
    'Persuade your community to adopt a recycling program.',
    'Should animals be kept in zoos? State and defend your opinion.',
  ],
  Descriptive: [
    'Describe your favorite place in vivid detail using all five senses.',
    'Paint a word picture of a storm approaching your town.',
    'Describe a person who has influenced you, focusing on specific details.',
    'Write a detailed description of a marketplace you have visited.',
    'Describe the view from your classroom window at different times of day.',
  ],
}

type Theme = { bg: string; card: string; text: string; muted: string; border: string }

function getTheme(isDark: boolean): Theme {
  return isDark
    ? { bg: '#0f172a', card: '#1e293b', text: '#e2e8f0', muted: '#64748b', border: '#334155' }
    : { bg: '#ffffff', card: '#f8fafc', text: '#1e293b', muted: '#94a3b8', border: '#e2e8f0' }
}

// ============================================================
// Writing Annotation Rubric
// ============================================================

export function WritingAnnotationRubric({ isDark }: { isDark: boolean }) {
  const [selected, setSelected] = useState<Record<string, number>>({})
  const t = getTheme(isDark)

  const toggle = (criterion: string, level: number) => {
    setSelected(prev => {
      const key = `${criterion}-${level}`
      if (prev[criterion] === level) {
        const next = { ...prev }
        delete next[criterion]
        return next
      }
      return { ...prev, [criterion]: level }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '130px repeat(4, 1fr)', gap: 1, borderRadius: 8, overflow: 'hidden', border: `1px solid ${t.border}` }}>
        {/* Header row */}
        <div style={{ padding: '6px 8px', background: t.card, fontWeight: 700, fontSize: 10, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Criterion</div>
        {PROFICIENCY_LEVELS.map(level => (
          <div key={level} style={{ padding: '6px 4px', background: t.card, fontWeight: 600, fontSize: 10, color: t.muted, textAlign: 'center' }}>{level.slice(0, 4)}</div>
        ))}
        {/* Data rows */}
        {RUBRIC_CRITERIA.map(criterion => (
          <>
            <div key={criterion + '-label'} style={{ padding: '6px 8px', background: t.card, fontWeight: 600, fontSize: 10, color: t.text, display: 'flex', alignItems: 'center' }}>{criterion}</div>
            {PROFICIENCY_LEVELS.map((_, li) => {
              const isActive = selected[criterion] === li
              return (
                <button
                  key={li}
                  onClick={() => toggle(criterion, li)}
                  style={{
                    padding: '4px 4px', background: isActive ? 'rgba(5,150,105,0.15)' : t.bg,
                    border: isActive ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + t.border,
                    color: isActive ? '#34d399' : t.muted, fontSize: 9, cursor: 'pointer', textAlign: 'center',
                    lineHeight: 1.3, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {RUBRIC_DESCRIPTORS[criterion]?.[li] || ''}
                </button>
              )
            })}
          </>
        ))}
      </div>
      <div style={{ fontSize: 10, color: t.muted, textAlign: 'center' }}>
        Click cells to highlight proficiency level for each criterion
      </div>
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Read the rubric criteria before writing</div>
          <div>Step 2: Content — is the main idea clear and developed?</div>
          <div>Step 3: Organization — logical flow with transitions?</div>
          <div>Step 4: Language — varied vocabulary and sentence structure?</div>
          <div>Step 5: Mechanics — correct spelling, grammar, punctuation?</div>
          <div>Step 6: Self-assess using the rubric before submitting</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Rubrics make expectations explicit. Specific criteria, not vague "write well." Makes grading fair and feedback actionable.
      </div>
</div>
  )
}

// ============================================================
// Grammar Checklist
// ============================================================

export function GrammarChecklist({ isDark }: { isDark: boolean }) {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const t = getTheme(isDark)

  const toggle = (idx: number) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const handleCheckAll = () => {
    if (checked.size === GRAMMAR_ITEMS.length) setChecked(new Set())
    else setChecked(new Set(GRAMMAR_ITEMS.map((_, i) => i)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: t.muted, fontWeight: 600 }}>
          {checked.size} of {GRAMMAR_ITEMS.length} checked
        </span>
        <button
          onClick={handleCheckAll}
          style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.25)', color: '#34d399', cursor: 'pointer' }}
        >
          {checked.size === GRAMMAR_ITEMS.length ? 'Uncheck All' : 'Check All'}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {GRAMMAR_ITEMS.map((item, i) => (
          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, background: checked.has(i) ? 'rgba(5,150,105,0.08)' : t.card, border: '1px solid ' + (checked.has(i) ? 'rgba(5,150,105,0.2)' : t.border), cursor: 'pointer', fontSize: 11, color: t.text, transition: 'background 0.15s' }}>
            <input type="checkbox" checked={checked.has(i)} onChange={() => toggle(i)} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#10b981' }} />
            {item}
          </label>
        ))}
      </div>
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Check subject-verb agreement (he runs, they run)</div>
          <div>Step 2: Check pronoun case (I vs me, who vs whom)</div>
          <div>Step 3: Check for fragments (incomplete sentences)</div>
          <div>Step 4: Check for run-ons (two sentences joined incorrectly)</div>
          <div>Step 5: Check homophones (their/there/they're, its/it's)</div>
          <div>Step 6: Read aloud — errors often sound wrong</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Grammar rules exist for clarity. Subject-verb agreement prevents confusion. Each rule solves a specific communication problem.
      </div>
</div>
  )
}

// ============================================================
// Writing Prompt Generator
// ============================================================

export function WritingPromptGenerator({ isDark }: { isDark: boolean }) {
  const [category, setCategory] = useState<string>('Narrative')
  const [promptIdx, setPromptIdx] = useState(0)
  const t = getTheme(isDark)
  const categories = Object.keys(PROMPTS)
  const currentPrompts = PROMPTS[category] || []
  const currentPrompt = currentPrompts[promptIdx % currentPrompts.length] || 'Select a category and generate.'

  const generate = useCallback(() => {
    setPromptIdx(prev => prev + 1)
  }, [])

  const changeCategory = (cat: string) => {
    setCategory(cat)
    setPromptIdx(0)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Category selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => changeCategory(cat)}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: category === cat ? 700 : 500,
              background: category === cat ? 'rgba(5,150,105,0.15)' : t.card,
              border: category === cat ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + t.border,
              color: category === cat ? '#34d399' : t.muted, cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>
      {/* Prompt display */}
      <div style={{ padding: 12, borderRadius: 8, background: t.card, border: '1px solid ' + t.border, minHeight: 60, display: 'flex', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: t.text, fontStyle: 'italic' }}>{currentPrompt}</p>
      </div>
      {/* Generate button */}
      <button
        onClick={generate}
        style={{
          padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
          background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.25)',
          color: '#34d399', cursor: 'pointer', alignSelf: 'flex-start',
        }}
      >
        Generate Prompt
      </button>
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Read the prompt carefully</div>
          <div>Step 2: Identify the task (describe, argue, narrate, explain)</div>
          <div>Step 3: Brainstorm ideas related to the prompt</div>
          <div>Step 4: Choose your strongest idea</div>
          <div>Step 5: Plan your structure (introduction, body, conclusion)</div>
          <div>Step 6: The best prompts have tension — conflict, choice, or mystery</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Good prompts have tension: conflict, choice, or mystery. They give enough context to start, but leave room for creativity.
      </div>
</div>
  )
}
