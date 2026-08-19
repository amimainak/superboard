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
import {
  SentenceStructureWidget,
  DEFAULT_SENTENCE_CONFIG,
  type SentenceStructureWidgetConfig,
} from './SentenceStructureWidget'
import {
  PhonicsBuilderWidget,
  DEFAULT_PHONICS_CONFIG,
  type PhonicsWidgetConfig,
} from './PhonicsBuilderWidget'
import {
  SentenceExpansionWidget,
  DEFAULT_EXPANSION_CONFIG,
  type ExpansionWidgetConfig,
} from './SentenceExpansionWidget'
import {
  FigurativeLanguageWidget,
  DEFAULT_FIGLANG_CONFIG,
  type FigLangWidgetConfig,
} from './FigurativeLanguageWidget'
import type { PunctRule, PunctExercise } from '@/data/punctuation-exercises'
import type { VocabCard, PosTag, CardLevel } from '@/data/vocab-cards'
import type { SentenceType, SentenceExercise } from '@/data/sentence-structure-exercises'
import type { PhonicsCategory, PhonicsExercise } from '@/data/phonics-exercises'
import type { ExpansionType, ExpansionExercise } from '@/data/sentence-expansion-exercises'
import type { FigLangType, FigLangExercise } from '@/data/figurative-language-exercises'

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
// 2. SENTENCE STRUCTURE PRACTICE (unified component)
// ============================================================

function CanvasSentenceStructure({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: SentenceStructureWidgetConfig = useMemo(() => ({
    ...DEFAULT_SENTENCE_CONFIG,
    ...(cfg as Partial<SentenceStructureWidgetConfig>),
    filterTypes: (cfg.filterTypes as SentenceType[] | undefined) || [],
    exerciseIds: (cfg.exerciseIds as string[] | undefined) || [],
    customExercises: (cfg.customExercises as SentenceExercise[] | undefined) || [],
    teacherOptions: (cfg.teacherOptions as [string, string, string] | undefined) || ['', '', ''],
    teacherExplanations: (cfg.teacherExplanations as [string, string, string] | undefined) || ['', '', ''],
  }), [cfg])

  const handleChange = useCallback((patch: Partial<SentenceStructureWidgetConfig>) => {
    updateConfig(patch)
  }, [updateConfig])

  return <SentenceStructureWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
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
// 6. FIGURATIVE LANGUAGE PRACTICE (unified component)
// ============================================================

function CanvasFigurativeLanguage({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: FigLangWidgetConfig = useMemo(() => ({
    ...DEFAULT_FIGLANG_CONFIG,
    ...(cfg as Partial<FigLangWidgetConfig>),
    filterTypes: (cfg.filterTypes as FigLangType[] | undefined) || [],
    exerciseIds: (cfg.exerciseIds as string[] | undefined) || [],
    customExercises: (cfg.customExercises as FigLangExercise[] | undefined) || [],
    teacherOptions: (cfg.teacherOptions as [string, string, string] | undefined) || ['', '', ''],
    teacherExplanations: (cfg.teacherExplanations as [string, string, string] | undefined) || ['', '', ''],
  }), [cfg])

  const handleChange = useCallback((patch: Partial<FigLangWidgetConfig>) => {
    updateConfig(patch)
  }, [updateConfig])

  return <FigurativeLanguageWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
}

// ============================================================
// 7. PUNCTUATION PRACTICE (unified component)
// ============================================================

function CanvasPunctuationPractice({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: PunctWidgetConfig = useMemo(() => ({
    ...DEFAULT_PUNCT_CONFIG,
    ...(cfg as Partial<PunctWidgetConfig>),
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
// 8. PHONICS PRACTICE (unified component)
// ============================================================

function CanvasPhonicsPractice({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: PhonicsWidgetConfig = useMemo(() => ({
    ...DEFAULT_PHONICS_CONFIG,
    ...(cfg as Partial<PhonicsWidgetConfig>),
    filterCategories: (cfg.filterCategories as PhonicsCategory[] | undefined) || [],
    exerciseIds: (cfg.exerciseIds as string[] | undefined) || [],
    customExercises: (cfg.customExercises as PhonicsExercise[] | undefined) || [],
    teacherOptions: (cfg.teacherOptions as [string, string, string] | undefined) || ['', '', ''],
    teacherExplanations: (cfg.teacherExplanations as [string, string, string] | undefined) || ['', '', ''],
  }), [cfg])

  const handleChange = useCallback((patch: Partial<PhonicsWidgetConfig>) => {
    updateConfig(patch)
  }, [updateConfig])

  return <PhonicsBuilderWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
}

// ============================================================
// 9. SENTENCE EXPANSION PRACTICE (unified component)
// ============================================================

function CanvasSentenceExpansion({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: ExpansionWidgetConfig = useMemo(() => ({
    ...DEFAULT_EXPANSION_CONFIG,
    ...(cfg as Partial<ExpansionWidgetConfig>),
    filterTypes: (cfg.filterTypes as ExpansionType[] | undefined) || [],
    exerciseIds: (cfg.exerciseIds as string[] | undefined) || [],
    customExercises: (cfg.customExercises as ExpansionExercise[] | undefined) || [],
    teacherOptions: (cfg.teacherOptions as [string, string, string] | undefined) || ['', '', ''],
    teacherExplanations: (cfg.teacherExplanations as [string, string, string] | undefined) || ['', '', ''],
  }), [cfg])

  const handleChange = useCallback((patch: Partial<ExpansionWidgetConfig>) => {
    updateConfig(patch)
  }, [updateConfig])

  return <SentenceExpansionWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
}

// ============================================================
// Component Registry & Exports
// ============================================================

const LANG_WIDGET_COMPONENTS: Record<string, React.ComponentType<CanvasWidgetProps>> = {
  'lang-pos-tagger': CanvasPOSTagger,
  'lang-sentence-structure': CanvasSentenceStructure,
  'lang-story-elements': CanvasStoryMap,
  'lang-paragraph-organizer': CanvasParagraphOrganizer,
  'lang-vocab-flashcards': CanvasVocabCards,
  'lang-figurative-language': CanvasFigurativeLanguage,
  'lang-punctuation': CanvasPunctuationPractice,
  'lang-phonics': CanvasPhonicsPractice,
  'lang-sentence-expansion': CanvasSentenceExpansion,
}

export function CanvasLanguageWidgetRenderer({ element, isDark }: CanvasWidgetProps) {
  const Component = LANG_WIDGET_COMPONENTS[element.widgetKind]
  if (!Component) return <div style={{ padding: 12, color: '#f87171', fontSize: 12 }}>Unknown language widget: {element.widgetKind}</div>
  return <Component element={element} isDark={isDark} />
}

export function getLangWidgetDefaultConfig(kind: string): Record<string, unknown> {
  switch (kind) {
    case 'lang-pos-tagger': return { ...DEFAULT_POS_CONFIG }
    case 'lang-sentence-structure': return { ...DEFAULT_SENTENCE_CONFIG }
    case 'lang-story-elements': return { storyData: DEFAULT_STORY, showViz: false }
    case 'lang-paragraph-organizer': return { typeIndex: 0, values: {} }
    case 'lang-vocab-flashcards': return { ...DEFAULT_VOCAB_CONFIG }
    case 'lang-figurative-language': return { ...DEFAULT_FIGLANG_CONFIG }
    case 'lang-punctuation': return { ...DEFAULT_PUNCT_CONFIG }
    case 'lang-phonics': return { ...DEFAULT_PHONICS_CONFIG }
    case 'lang-sentence-expansion': return { ...DEFAULT_EXPANSION_CONFIG }
    default: return {}
  }
}

export function getLangWidgetDefaultSize(kind: string): { width: number; height: number } {
  switch (kind) {
    case 'lang-pos-tagger': return { width: 340, height: 420 }
    case 'lang-sentence-structure': return { width: 380, height: 520 }
    case 'lang-story-elements': return { width: 360, height: 440 }
    case 'lang-paragraph-organizer': return { width: 340, height: 480 }
    case 'lang-vocab-flashcards': return { width: 300, height: 400 }
    case 'lang-figurative-language': return { width: 380, height: 520 }
    case 'lang-punctuation': return { width: 380, height: 520 }
    case 'lang-phonics': return { width: 380, height: 520 }
    case 'lang-sentence-expansion': return { width: 380, height: 520 }
    default: return { width: 320, height: 360 }
  }
}

export const LANG_WIDGET_KIND_LABELS: Record<string, string> = {
  'lang-pos-tagger': 'Parts of Speech Tagger',
  'lang-sentence-structure': 'Sentence Structure Practice',
  'lang-story-elements': 'Story Elements Map',
  'lang-paragraph-organizer': 'Paragraph Organizer',
  'lang-vocab-flashcards': 'Vocabulary Flashcards',
  'lang-figurative-language': 'Figurative Language Practice',
  'lang-punctuation': 'Punctuation Practice',
  'lang-phonics': 'Phonics Practice',
  'lang-sentence-expansion': 'Sentence Expansion Practice',
}
