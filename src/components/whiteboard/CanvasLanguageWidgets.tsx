'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { WidgetElement } from '@/lib/whiteboard/types'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import {
  PunctuationPracticeWidget,
  DEFAULT_PUNCT_CONFIG,
  type PunctWidgetConfig,
} from './PunctuationPracticeWidget'
import {
  VocabFlashcardsWidget,
  DEFAULT_VOCAB_CONFIG,
  type VocabWidgetConfig,
} from './VocabFlashcardsWidget'
import {
  POSTaggerWidget,
  DEFAULT_POS_CONFIG,
  type POSWidgetConfig,
} from './POSTaggerWidget'
import type { PunctRule, PunctExercise } from '@/data/punctuation-exercises'
import type { VocabCard, PosTag, CardLevel } from '@/data/vocab-cards'

// ============================================================
// On-Canvas Language Widgets
// Compact, self-contained versions of language tools
// designed for the whiteboard canvas (foreignObject).
// Each reads from element.config and writes back via updateElement.
// ============================================================

interface CanvasWidgetProps {
  element: WidgetElement
  isDark: boolean
}

/** Debounced config updater */
function useConfigUpdater(elementId: string) {
  const updateElement = useWhiteboardStore((s) => s.updateElement)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<Record<string, unknown>>({})

  const updateConfig = useCallback((patch: Record<string, unknown>) => {
    Object.assign(pendingRef.current, patch)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      updateElement(elementId, { config: { ...pendingRef.current } } as Partial<WidgetElement>)
      pendingRef.current = {}
    }, 200)
  }, [updateElement, elementId])

  React.useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return updateConfig
}

// ---- Shared styles ----

const cs = (isDark: boolean) => ({
  surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
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
// 1. PARTS OF SPEECH TAGGER (unified, uses compromise)
// ============================================================

function CanvasPOSTagger({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: POSWidgetConfig = useMemo(() => ({
    ...DEFAULT_POS_CONFIG,
    ...(cfg as Partial<POSWidgetConfig>),
    tagged: (cfg.tagged as POSWidgetConfig['tagged'] | undefined) || [],
  }), [cfg])

  const handleChange = useCallback((patch: Partial<POSWidgetConfig>) => {
    updateConfig(patch)
  }, [updateConfig])

  return <POSTaggerWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
}

// ============================================================
// 2. SENTENCE STRUCTURE BUILDER (on-canvas)
// ============================================================

const STRUCTURE_BANKS: Record<string, { label: string; description: string; words: string[] }> = {
  simple: { label: 'Simple', description: 'One independent clause.', words: ['The','cat','dog','boy','girl','ran','jumped','sat','ate','read','the','a','ball','book','quickly','happily','yesterday','park','house','big'] },
  compound: { label: 'Compound', description: 'Two clauses joined by a conjunction.', words: ['The','sun','moon','stars','set','rose','shone','appeared','faded',',','and','but','or','so','the','wind','blew','night','was','beautiful'] },
  complex: { label: 'Complex', description: 'Independent + dependent clause.', words: ['Because','Although','If','When','While','it','we','they','rained','was','were','tired','stayed','went','inside','outside','the','test','finished','early'] },
  'compound-complex': { label: 'Comp-Complex', description: '2+ independent + 1 dependent clause.', words: ['Although','Because','When','it','we','they','was','were','late','finished','started','the','project','game','and','but','the','teacher','team','pleased','won'] },
}

function CanvasSentenceBuilder({ element, isDark }: CanvasWidgetProps) {
  const s = cs(isDark)
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const [activeType, setActiveType] = useState((cfg.activeType as string) || 'simple')
  const [built, setBuilt] = useState<string[]>((cfg.built as string[]) || [])

  const bank = STRUCTURE_BANKS[activeType] || STRUCTURE_BANKS['simple']

  const addWord = useCallback((word: string) => {
    setBuilt(prev => {
      const next = [...prev, word]
      updateConfig({ activeType, built: next })
      return next
    })
  }, [activeType, updateConfig])

  const removeWord = useCallback((idx: number) => {
    setBuilt(prev => {
      const next = prev.filter((_, i) => i !== idx)
      updateConfig({ activeType, built: next })
      return next
    })
  }, [activeType, updateConfig])

  const clearBuilt = useCallback(() => {
    setBuilt([])
    updateConfig({ activeType, built: [] })
  }, [activeType, updateConfig])

  const switchType = useCallback((t: string) => {
    setActiveType(t)
    setBuilt([])
    updateConfig({ activeType: t, built: [] })
  }, [updateConfig])

  const getBreakdown = () => {
    const sentence = built.join(' ')
    if (activeType === 'simple') return 'Simple: One subject-verb pair.'
    if (activeType === 'compound') {
      const parts = sentence.split(/\b(and|but|or|so)\b/i)
      if (parts.length >= 3) return 'Compound: "' + parts[0].trim() + '" [' + parts[1] + '] "' + parts[2].trim() + '"'
      return 'Compound: Add two clauses with and/but/or/so.'
    }
    if (activeType === 'complex') {
      const markers = ['because','although','if','when','while']
      for (const m of markers) {
        if (sentence.toLowerCase().indexOf(m) >= 0) return 'Complex: "' + m + '" starts the dependent clause.'
      }
      return 'Complex: Use a subordinating conjunction.'
    }
    return 'Compound-Complex: 2+ independent + 1 dependent clause.'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {Object.keys(STRUCTURE_BANKS).map(key => (
          <button key={key} onClick={() => switchType(key)} style={s.btn(activeType === key)}>
            {STRUCTURE_BANKS[key].label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: s.text, lineHeight: 1.3 }}>{bank.description}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {bank.words.map((word, i) => (
          <button key={word + '-' + i} onClick={() => addWord(word)} style={{
            padding: '2px 5px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            border: '1px solid ' + s.border, color: s.bright,
          }}>{word}</button>
        ))}
      </div>
      <div style={{
        minHeight: 30, padding: '4px 6px', borderRadius: 4,
        background: isDark ? 'rgba(5,150,105,0.06)' : 'rgba(5,150,105,0.04)',
        border: '1px solid ' + (isDark ? 'rgba(5,150,105,0.15)' : 'rgba(5,150,105,0.12)'),
        display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center',
      }}>
        {built.length === 0 && <span style={{ fontSize: 10, color: s.text, opacity: 0.5 }}>Click words to build...</span>}
        {built.map((w, i) => (
          <span key={i} onClick={() => removeWord(i)} style={{
            fontSize: 11, color: '#34d399', cursor: 'pointer' as const, padding: '1px 3px',
            borderRadius: 2, background: 'rgba(5,150,105,0.12)',
          }} title="Click to remove">{w}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={clearBuilt} style={s.btn(false)}>Clear</button>
      </div>
      {built.length > 0 && (
        <div style={{ padding: '4px 6px', borderRadius: 4, fontSize: 10, color: s.text, lineHeight: 1.4, background: s.surface, border: '1px solid ' + (isDark ? 'rgba(5,150,105,0.15)' : 'rgba(5,150,105,0.12)') }}>
          {getBreakdown()}
        </div>
      )}
    </div>
  )
}

// ============================================================
// 3. STORY ELEMENTS MAP (on-canvas)
// ============================================================

interface StoryData {
  title: string; author: string; protagonist: string; antagonist: string
  settingTime: string; settingPlace: string; conflictType: string
  risingAction: string; climax: string; fallingAction: string; resolution: string; theme: string
}

const DEFAULT_STORY: StoryData = {
  title: '', author: '', protagonist: '', antagonist: '',
  settingTime: '', settingPlace: '', conflictType: 'Man vs Man',
  risingAction: '', climax: '', fallingAction: '', resolution: '', theme: '',
}

const CONFLICT_TYPES = ['Man vs Man', 'Man vs Nature', 'Man vs Self', 'Man vs Society', 'Man vs Technology']

function CanvasStoryMap({ element, isDark }: CanvasWidgetProps) {
  const s = cs(isDark)
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const [data, setData] = useState<StoryData>({ ...DEFAULT_STORY, ...(cfg.storyData as Partial<StoryData> || {}) })
  const [showViz, setShowViz] = useState((cfg.showViz as boolean) || false)

  const set = (key: keyof StoryData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setData(prev => {
      const next = { ...prev, [key]: e.target.value }
      updateConfig({ storyData: next, showViz })
      return next
    })
  }

  const toggleViz = () => {
    const next = !showViz
    setShowViz(next)
    updateConfig({ storyData: data, showViz: next })
  }

  const fieldStyle: React.CSSProperties = { ...s.input, width: '100%', boxSizing: 'border-box', fontSize: 10, padding: '3px 6px' }
  const labelStyle: React.CSSProperties = { fontSize: 9, fontWeight: 600, color: s.text, marginBottom: 1, display: 'block' }

  const hasData = data.protagonist || data.climax || data.theme || data.risingAction

  // Compact story arc visualization (CSS-based, no SVG elements)
  const arcViz = () => (
    <div style={{ position: 'relative', height: 90, marginTop: 4, borderRadius: 6, background: s.surface, overflow: 'hidden' }}>
      {/* Arc line using border trick */}
      <div style={{ position: 'absolute', bottom: 20, left: '8%', right: '8%', height: 40, borderTop: '2px solid ' + (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'), borderRadius: '999px 999px 0 0' }} />
      {/* Plot points */}
      {data.risingAction && <div style={{ position: 'absolute', left: '35%', top: 30, width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />}
      {data.climax && <div style={{ position: 'absolute', left: '48%', top: 8, width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />}
      {data.fallingAction && <div style={{ position: 'absolute', left: '62%', top: 30, width: 8, height: 8, borderRadius: '50%', background: '#60a5fa' }} />}
      <div style={{ position: 'absolute', bottom: 2, left: 6, fontSize: 8, color: s.text }}>Exposition</div>
      <div style={{ position: 'absolute', bottom: 2, left: '35%', fontSize: 8, color: '#34d399' }}>Rising</div>
      <div style={{ position: 'absolute', top: 2, left: '48%', fontSize: 8, color: '#f87171', fontWeight: 700 }}>Climax</div>
      <div style={{ position: 'absolute', bottom: 2, right: '25%', fontSize: 8, color: '#60a5fa' }}>Falling</div>
      <div style={{ position: 'absolute', bottom: 2, right: 6, fontSize: 8, color: s.text }}>Resolution</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: s.bright }}>Story Elements Map</div>
        <button onClick={toggleViz} style={s.btn(showViz)}>{showViz ? 'Edit' : 'Arc View'}</button>
      </div>

      {showViz ? (
        <div>
          {arcViz()}
          <div style={{ marginTop: 4, padding: '4px 6px', borderRadius: 4, background: s.surface, fontSize: 10, lineHeight: 1.5 }}>
            {data.protagonist && <div><span style={{ color: '#60a5fa', fontWeight: 600 }}>Protagonist:</span> {data.protagonist}</div>}
            {data.antagonist && <div><span style={{ color: '#f87171', fontWeight: 600 }}>Antagonist:</span> {data.antagonist}</div>}
            {data.conflictType && <div><span style={{ fontWeight: 600 }}>Conflict:</span> {data.conflictType}</div>}
            {data.theme && <div><span style={{ color: '#c084fc', fontWeight: 600 }}>Theme:</span> {data.theme}</div>}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ flex: '1 1 45%' }}><label style={labelStyle}>Title</label><input value={data.title} onChange={set('title')} style={fieldStyle} /></div>
            <div style={{ flex: '1 1 45%' }}><label style={labelStyle}>Author</label><input value={data.author} onChange={set('author')} style={fieldStyle} /></div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ flex: '1 1 45%' }}><label style={labelStyle}>Protagonist</label><input value={data.protagonist} onChange={set('protagonist')} style={fieldStyle} /></div>
            <div style={{ flex: '1 1 45%' }}><label style={labelStyle}>Antagonist</label><input value={data.antagonist} onChange={set('antagonist')} style={fieldStyle} /></div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ flex: '1 1 30%' }}><label style={labelStyle}>Time</label><input value={data.settingTime} onChange={set('settingTime')} style={fieldStyle} placeholder="When?" /></div>
            <div style={{ flex: '1 1 30%' }}><label style={labelStyle}>Place</label><input value={data.settingPlace} onChange={set('settingPlace')} style={fieldStyle} placeholder="Where?" /></div>
            <div style={{ flex: '1 1 30%' }}><label style={labelStyle}>Conflict</label>
              <select value={data.conflictType} onChange={set('conflictType')} style={{ ...fieldStyle, cursor: 'pointer' as const }}>
                {CONFLICT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div><label style={labelStyle}>Rising Action</label><input value={data.risingAction} onChange={set('risingAction')} style={fieldStyle} /></div>
          <div><label style={labelStyle}>Climax</label><input value={data.climax} onChange={set('climax')} style={fieldStyle} /></div>
          <div><label style={labelStyle}>Resolution</label><input value={data.resolution} onChange={set('resolution')} style={fieldStyle} /></div>
          <div><label style={labelStyle}>Theme</label><input value={data.theme} onChange={set('theme')} style={fieldStyle} /></div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 4. PARAGRAPH ORGANIZER (on-canvas)
// ============================================================

const PARAGRAPH_TYPES_MINI = [
  { name: 'Narrative', color: '#60a5fa', keys: ['setting','characters','problem','events','climax','resolution','lesson'], labels: ['Setting','Characters','Problem','Events','Climax','Resolution','Lesson'], prompts: ['When/where?','Who?','What goes wrong?','What happens?','Most exciting moment','How solved?','What learned?'] },
  { name: 'Expository', color: '#4ade80', keys: ['topic','fact1','fact2','fact3','conclusion'], labels: ['Topic Sentence','Fact 1','Fact 2','Fact 3','Conclusion'], prompts: ['What is this about?','First detail','Second detail','Third detail','Summarize'] },
  { name: 'Persuasive', color: '#f87171', keys: ['claim','reason1','reason2','counter','rebuttal','action'], labels: ['Claim','Reason 1','Reason 2','Counterargument','Rebuttal','Call to Action'], prompts: ['What do you believe?','First reason','Second reason','Other side says?','Why wrong?','What should reader do?'] },
  { name: 'Descriptive', color: '#c084fc', keys: ['topic','sight','sound','touch','smell','conclusion'], labels: ['Topic','Sight','Sound','Touch','Smell','Conclusion'], prompts: ['Describing what?','Looks like?','Sounds like?','Feels like?','Smells like?','Final impression'] },
]

function CanvasParagraphOrganizer({ element, isDark }: CanvasWidgetProps) {
  const s = cs(isDark)
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const [typeIndex, setTypeIndex] = useState((cfg.typeIndex as number) || 0)
  const [values, setValues] = useState<Record<string, string>>((cfg.values as Record<string, string>) || {})
  const [showPreview, setShowPreview] = useState(false)

  const pt = PARAGRAPH_TYPES_MINI[typeIndex] || PARAGRAPH_TYPES_MINI[0]

  const switchType = (i: number) => {
    setTypeIndex(i)
    setValues({})
    setShowPreview(false)
    updateConfig({ typeIndex: i, values: {} })
  }

  const handleChange = (key: string, val: string) => {
    setValues(prev => {
      const next: Record<string, string> = {}
      for (const k in prev) next[k] = prev[k]
      next[key] = val
      updateConfig({ typeIndex, values: next })
      return next
    })
  }

  const previewText = useMemo(() => {
    return pt.keys.map(k => values[k]).filter(Boolean).map(v => v.trim()).join(' ')
  }, [pt, values])

  const hasContent = pt.keys.some(k => values[k] && values[k].trim())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: s.bright }}>Paragraph Organizer</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {PARAGRAPH_TYPES_MINI.map((p, i) => (
          <button key={p.name} onClick={() => switchType(i)} style={{
            padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: typeIndex === i ? 700 : 500,
            cursor: 'pointer' as const,
            border: '1px solid ' + (typeIndex === i ? p.color : s.border),
            background: typeIndex === i ? p.color + '18' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
            color: typeIndex === i ? p.color : s.text,
          }}>{p.name}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto' }}>
        {pt.keys.map((key, i) => (
          <div key={key} style={{ borderLeft: '3px solid ' + pt.color, paddingLeft: 6 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: pt.color }}>{pt.labels[i]}</div>
            <div style={{ fontSize: 8, color: s.text, fontStyle: 'italic', marginBottom: 1 }}>{pt.prompts[i]}</div>
            <textarea
              value={values[key] || ''}
              onChange={e => handleChange(key, e.target.value)}
              placeholder={pt.prompts[i]}
              style={{ ...s.input, width: '100%', minHeight: 32, resize: 'vertical', fontFamily: 'inherit', fontSize: 10, padding: '3px 6px' }}
            />
          </div>
        ))}
      </div>
      {hasContent && (
        <button onClick={() => setShowPreview(!showPreview)} style={{
          ...s.btn(showPreview), width: '100%', textAlign: 'center', fontSize: 9, fontWeight: 700,
        }}>
          {showPreview ? 'Hide Preview' : 'Show Paragraph Preview'}
        </button>
      )}
      {showPreview && hasContent && (
        <div style={{ padding: '6px 8px', borderRadius: 4, background: s.surface, fontSize: 11, lineHeight: 1.6, color: s.bright, border: '1px solid ' + s.border }}>
          {previewText || <span style={{ fontStyle: 'italic', color: s.text }}>Fill in sections above...</span>}
        </div>
      )}
    </div>
  )
}

// ============================================================
// 5. VOCABULARY FLASHCARDS (unified component)
// ============================================================

function CanvasVocabCards({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: VocabWidgetConfig = useMemo(() => ({
    ...DEFAULT_VOCAB_CONFIG,
    ...(cfg as Partial<VocabWidgetConfig>),
    filterPos: (cfg.filterPos as PosTag[] | undefined) || [],
    customCards: (cfg.customCards as VocabCard[] | undefined) || [],
  }), [cfg])

  const handleChange = useCallback((patch: Partial<VocabWidgetConfig>) => {
    updateConfig(patch)
  }, [updateConfig])

  return <VocabFlashcardsWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
}

// ============================================================
// 6. FIGURATIVE LANGUAGE FINDER (on-canvas)
// ============================================================

type FigType = 'simile' | 'metaphor' | 'personification' | 'hyperbole' | 'alliteration' | 'onomatopoeia'

const FIG_TYPES: { id: FigType; label: string; color: string }[] = [
  { id: 'simile', label: 'Simile', color: '#3b82f6' },
  { id: 'metaphor', label: 'Metaphor', color: '#8b5cf6' },
  { id: 'personification', label: 'Personif.', color: '#ec4899' },
  { id: 'hyperbole', label: 'Hyperbole', color: '#f59e0b' },
  { id: 'alliteration', label: 'Alliter.', color: '#10b981' },
  { id: 'onomatopoeia', label: 'Onomatop.', color: '#06b6d4' },
]

const ONOMATOPOEIA = new Set(['bang','crash','buzz','hiss','pop','sizzle','roar','whisper','click','boom','splash','thud','crackle','clang','moo','oink','meow','bark','hoot','chirp'])
const HUMAN_VERBS = new Set(['whispered','danced','cried','sang','smiled','laughed','spoke','shouted','screamed','watched','listened','breathed','stared','frowned','smirked','grinned','wept','sighed','sleeping','running','walking','thinking','dreaming'])
const NON_HUMAN = new Set(['wind','sun','moon','tree','trees','river','ocean','mountain','mountains','cloud','clouds','rain','storm','fire','stars','sky','sea','flower','flowers','rock','rocks','wave','waves','forest','house','door','clock','road','city','garden','night','day','shadow','shadows','earth','world','heart','time'])

interface FoundFig { start: number; end: number; type: FigType; text: string }

function findFigurativeLang(text: string, activeTypes: Set<FigType>): FoundFig[] {
  const results: FoundFig[] = []
  const lower = text.toLowerCase()

  // Simile: like/as + noun phrase
  if (activeTypes.has('simile')) {
    const simileRe = /\b(\w+)\s+(like|as)\s+(a|an|the)?\s*\w+/gi
    let m
    while ((m = simileRe.exec(text)) !== null) {
      results.push({ start: m.index, end: m.index + m[0].length, type: 'simile', text: m[0] })
    }
  }

  // Metaphor: is/was/were/are + article + noun (heuristic)
  if (activeTypes.has('metaphor')) {
    const metaphorRe = /\b(he|she|it|they|this|that|my|his|her|our)\s+(is|was|were|are)\s+(a|an|the)\s+\w+/gi
    let m
    while ((m = metaphorRe.exec(text)) !== null) {
      // Only add if not already a simile
      const overlap = results.some(r => m!.index >= r.start && m!.index + m![0].length <= r.end)
      if (!overlap) results.push({ start: m.index, end: m.index + m[0].length, type: 'metaphor', text: m[0] })
    }
  }

  // Personification: non-human noun + human verb
  if (activeTypes.has('personification')) {
    const words = text.split(/\s+/)
    for (let i = 0; i < words.length - 1; i++) {
      if (NON_HUMAN.has(words[i].toLowerCase()) && HUMAN_VERBS.has(words[i + 1].toLowerCase().replace(/[^a-z]/g, ''))) {
        const start = text.indexOf(words[i])
        const end = text.indexOf(words[i + 1]) + words[i + 1].length
        results.push({ start, end, type: 'personification', text: words[i] + ' ' + words[i + 1] })
      }
    }
  }

  // Hyperbole: extreme words
  if (activeTypes.has('hyperbole')) {
    const hyperWords = ['million','billion','infinity','forever','never','always','died','killed','exploded','mountain','ocean','universe','lightning','impossible','every single','the entire','the whole world']
    for (const hw of hyperWords) {
      const idx = lower.indexOf(hw)
      if (idx >= 0) results.push({ start: idx, end: idx + hw.length, type: 'hyperbole', text: text.substr(idx, hw.length) })
    }
  }

  // Alliteration: consecutive words starting with same sound
  if (activeTypes.has('alliteration')) {
    const words = text.split(/\s+/).filter(Boolean)
    for (let i = 0; i < words.length - 1; i++) {
      const w1 = words[i].replace(/[^a-z]/gi, '').toLowerCase()
      const w2 = words[i + 1].replace(/[^a-z]/gi, '').toLowerCase()
      if (w1.length > 0 && w2.length > 0 && w1[0] === w2[0] && w1.length > 2 && w2.length > 2) {
        const start = text.indexOf(words[i])
        const end = text.indexOf(words[i + 1]) + words[i + 1].length
        results.push({ start, end, type: 'alliteration', text: words[i] + ' ' + words[i + 1] })
      }
    }
  }

  // Onomatopoeia
  if (activeTypes.has('onomatopoeia')) {
    const words = text.split(/\s+/)
    for (const w of words) {
      const clean = w.replace(/[^a-z]/gi, '').toLowerCase()
      if (ONOMATOPOEIA.has(clean)) {
        const idx = lower.indexOf(clean)
        results.push({ start: idx, end: idx + clean.length, type: 'onomatopoeia', text: w })
      }
    }
  }

  return results.sort((a, b) => a.start - b.start)
}

function CanvasFigLangFinder({ element, isDark }: CanvasWidgetProps) {
  const s = cs(isDark)
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const [text, setText] = useState((cfg.text as string) || '')
  const [activeTypes, setActiveTypes] = useState<Set<FigType>>(() => {
    const saved = cfg.activeTypes as FigType[] | undefined
    return saved ? new Set(saved) : new Set<FigType>()
  })

  const toggleType = (t: FigType) => {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(t)) { next.delete(t) } else { next.add(t) }
      updateConfig({ text, activeTypes: [...next] as FigType[] })
      return next
    })
  }

  const handleTextChange = (v: string) => {
    setText(v)
    updateConfig({ text: v, activeTypes: [...activeTypes] as FigType[] })
  }

  const found = useMemo(() => {
    if (!text.trim() || activeTypes.size === 0) return []
    return findFigurativeLang(text, activeTypes)
  }, [text, activeTypes])

  const figColorMap: Record<string, string> = {}
  FIG_TYPES.forEach(f => { figColorMap[f.id] = f.color })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontFamily: 'inherit' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: s.bright }}>Figurative Language Finder</div>
      <textarea
        value={text}
        onChange={e => handleTextChange(e.target.value)}
        placeholder="Paste a passage to find figurative language..."
        rows={3}
        style={{ ...s.input, width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {FIG_TYPES.map(f => (
          <button key={f.id} onClick={() => toggleType(f.id)} style={{
            ...s.btn(activeTypes.has(f.id)),
            border: activeTypes.has(f.id) ? '1px solid ' + f.color + '60' : undefined,
            color: activeTypes.has(f.id) ? f.color : undefined,
            background: activeTypes.has(f.id) ? f.color + '18' : undefined,
          }}>{f.label}</button>
        ))}
      </div>
      {found.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: s.text }}>FOUND ({found.length})</div>
          {found.map((f, i) => (
            <div key={i} style={{
              padding: '3px 6px', borderRadius: 3, fontSize: 10, lineHeight: 1.4,
              background: (figColorMap[f.type] || '#94a3b8') + '15',
              borderLeft: '3px solid ' + (figColorMap[f.type] || '#94a3b8'),
              color: s.bright,
            }}>
              <span style={{ fontWeight: 600, color: figColorMap[f.type] || s.text, textTransform: 'uppercase', fontSize: 8, marginRight: 4 }}>
                {f.type}
              </span>
              "{f.text}"
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// 7. PUNCTUATION PRACTICE (unified component)
// ============================================================

function CanvasPunctuationPractice({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  // Merge defaults with persisted config
  const widgetConfig: PunctWidgetConfig = useMemo(() => ({
    ...DEFAULT_PUNCT_CONFIG,
    ...(cfg as Partial<PunctWidgetConfig>),
    // Ensure arrays are not undefined
    filterRules: (cfg.filterRules as PunctRule[] | undefined) || [],
    exerciseIds: (cfg.exerciseIds as string[] | undefined) || [],
    customExercises: (cfg.customExercises as PunctExercise[] | undefined) || [],
    teacherOptions: (cfg.teacherOptions as [string, string, string] | undefined) || ['', '', ''],
    teacherExplanations: (cfg.teacherExplanations as [string, string, string] | undefined) || ['', '', ''],
  }), [cfg])

  const handleChange = useCallback((patch: Partial<PunctWidgetConfig>) => {
    updateConfig(patch)
  }, [updateConfig])

  return <PunctuationPracticeWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
}

// ============================================================
// Component Registry & Exports
// ============================================================

const LANG_WIDGET_COMPONENTS: Record<string, React.ComponentType<CanvasWidgetProps>> = {
  'lang-pos-tagger': CanvasPOSTagger,
  'lang-sentence-structure': CanvasSentenceBuilder,
  'lang-story-elements': CanvasStoryMap,
  'lang-paragraph-organizer': CanvasParagraphOrganizer,
  'lang-vocab-flashcards': CanvasVocabCards,
  'lang-figurative-language': CanvasFigLangFinder,
  'lang-punctuation': CanvasPunctuationPractice,
}

export function CanvasLanguageWidgetRenderer({ element, isDark }: CanvasWidgetProps) {
  const Component = LANG_WIDGET_COMPONENTS[element.widgetKind]
  if (!Component) return <div style={{ padding: 12, color: '#f87171', fontSize: 12 }}>Unknown language widget: {element.widgetKind}</div>
  return <Component element={element} isDark={isDark} />
}

export function getLangWidgetDefaultConfig(kind: string): Record<string, unknown> {
  switch (kind) {
    case 'lang-pos-tagger': return { ...DEFAULT_POS_CONFIG }
    case 'lang-sentence-structure': return { activeType: 'simple', built: [] }
    case 'lang-story-elements': return { storyData: DEFAULT_STORY, showViz: false }
    case 'lang-paragraph-organizer': return { typeIndex: 0, values: {} }
    case 'lang-vocab-flashcards': return { ...DEFAULT_VOCAB_CONFIG }
    case 'lang-figurative-language': return { text: '', activeTypes: [] }
    case 'lang-punctuation': return { ...DEFAULT_PUNCT_CONFIG }
    default: return {}
  }
}

export function getLangWidgetDefaultSize(kind: string): { width: number; height: number } {
  switch (kind) {
    case 'lang-pos-tagger': return { width: 340, height: 420 }
    case 'lang-sentence-structure': return { width: 340, height: 380 }
    case 'lang-story-elements': return { width: 360, height: 440 }
    case 'lang-paragraph-organizer': return { width: 340, height: 480 }
    case 'lang-vocab-flashcards': return { width: 300, height: 400 }
    case 'lang-figurative-language': return { width: 340, height: 420 }
    case 'lang-punctuation': return { width: 380, height: 520 }
    default: return { width: 320, height: 360 }
  }
}

export const LANG_WIDGET_KIND_LABELS: Record<string, string> = {
  'lang-pos-tagger': 'Parts of Speech Tagger',
  'lang-sentence-structure': 'Sentence Structure Builder',
  'lang-story-elements': 'Story Elements Map',
  'lang-paragraph-organizer': 'Paragraph Organizer',
  'lang-vocab-flashcards': 'Vocabulary Flashcards',
  'lang-figurative-language': 'Figurative Language Finder',
  'lang-punctuation': 'Punctuation Practice',
}
