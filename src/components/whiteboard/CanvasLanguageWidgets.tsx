'use client'

import React, { useMemo, useCallback, useRef, useEffect } from 'react'
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
import {
  StoryElementsMapWidget,
  DEFAULT_STORY_MAP_CONFIG,
  type StoryMapWidgetConfig,
  type StoryMapExercise,
} from './StoryElementsMapWidget'
import {
  ParagraphOrganizerWidget,
  DEFAULT_PARAORG_CONFIG,
  type ParagraphOrganizerWidgetConfig,
  type ParaOrgExercise,
} from './ParagraphOrganizerWidget'
import {
  ConfusedWordsWidget,
  DEFAULT_CONFUSED_WORDS_CONFIG,
  type ConfusedWordsConfig,
} from './ConfusedWordsWidget'
import {
  HomophonesWidget,
  DEFAULT_HOMOPHONES_CONFIG,
  type HomophonesConfig,
} from './HomophonesWidget'
import {
  SynonymAntonymWidget,
  DEFAULT_SYNONYM_ANTONYM_CONFIG,
  type SynonymAntonymConfig,
} from './SynonymAntonymWidget'
import {
  IdiomExplorerWidget,
  DEFAULT_IDIOM_EXPLORER_CONFIG,
  type IdiomExplorerConfig,
} from './IdiomExplorerWidget'
import {
  PrefixSuffixWidget,
  DEFAULT_PREFIX_SUFFIX_CONFIG,
  type PrefixSuffixConfig,
} from './PrefixSuffixWidget'
import {
  WordSorterWidget,
  DEFAULT_WORD_SORTER_CONFIG,
  type WordSorterConfig,
} from './WordSorterWidget'
import {
  SentenceCombiningWidget,
  DEFAULT_SENTENCE_COMBINING_CONFIG,
  type SentenceCombiningConfig,
} from './SentenceCombiningWidget'
import {
  ProofreadingWidget,
  DEFAULT_PROOFREADING_CONFIG,
  type ProofreadingConfig,
} from './ProofreadingWidget'
import { ReadingPassageAnalyzer } from '@/components/room/widgets/language/LanguageUtilities'
import {
  RootMorphologyExplorer,
  ActivePassiveVoice,
  ReadingComprehensionStrategies,
  GrammarErrorDiagnostic,
  SpellingPatterns,
} from '@/components/room/widgets/language/LanguagePhase2Utilities'

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
// 3. STORY ELEMENTS MAP (unified component)
// ============================================================

function CanvasStoryMap({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: StoryMapWidgetConfig = useMemo(() => ({
    ...DEFAULT_STORY_MAP_CONFIG,
    ...(cfg as Partial<StoryMapWidgetConfig>),
    exerciseIds: (cfg.exerciseIds as string[] | undefined) || [],
    customExercises: (cfg.customExercises as StoryMapExercise[] | undefined) || [],
    teacherOptions: (cfg.teacherOptions as [string, string, string] | undefined) || ['', '', ''],
    teacherExplanations: (cfg.teacherExplanations as [string, string, string] | undefined) || ['', '', ''],
  }), [cfg])

  const handleChange = useCallback((patch: Partial<StoryMapWidgetConfig>) => {
    updateConfig(patch)
  }, [updateConfig])

  return <StoryElementsMapWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
}

// ============================================================
// 4. PARAGRAPH ORGANIZER (unified component)
// ============================================================

function CanvasParagraphOrganizer({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: ParagraphOrganizerWidgetConfig = useMemo(() => ({
    ...DEFAULT_PARAORG_CONFIG,
    ...(cfg as Partial<ParagraphOrganizerWidgetConfig>),
    filterTypes: (cfg.filterTypes as string[] | undefined) || [],
    exerciseIds: (cfg.exerciseIds as string[] | undefined) || [],
    customExercises: (cfg.customExercises as ParaOrgExercise[] | undefined) || [],
    teacherSentences: (cfg.teacherSentences as string[] | undefined) || [],
  }), [cfg])

  const handleChange = useCallback((patch: Partial<ParagraphOrganizerWidgetConfig>) => {
    updateConfig(patch)
  }, [updateConfig])

  return <ParagraphOrganizerWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
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
// 10. COMMONLY CONFUSED WORDS
// ============================================================

function CanvasConfusedWords({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: ConfusedWordsConfig = useMemo(() => ({
    ...DEFAULT_CONFUSED_WORDS_CONFIG,
    ...(cfg as Partial<ConfusedWordsConfig>),
    customExercises: (cfg.customExercises as ConfusedWordsConfig['customExercises'] | undefined) || [],
    teacherOptions: (cfg.teacherOptions as [string, string, string, string] | undefined) || ['', '', '', ''],
  }), [cfg])
  const handleChange = useCallback((patch: Partial<ConfusedWordsConfig>) => { updateConfig(patch) }, [updateConfig])
  return <ConfusedWordsWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
}

// ============================================================
// 11. HOMOPHONE PRACTICE
// ============================================================

function CanvasHomophones({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: HomophonesConfig = useMemo(() => ({
    ...DEFAULT_HOMOPHONES_CONFIG,
    ...(cfg as Partial<HomophonesConfig>),
    customExercises: (cfg.customExercises as HomophonesConfig['customExercises'] | undefined) || [],
    teacherOptions: (cfg.teacherOptions as [string, string, string, string] | undefined) || ['', '', '', ''],
    teacherMeanings: (cfg.teacherMeanings as [string, string] | undefined) || ['', ''],
  }), [cfg])
  const handleChange = useCallback((patch: Partial<HomophonesConfig>) => { updateConfig(patch) }, [updateConfig])
  return <HomophonesWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
}

// ============================================================
// 12. SYNONYM & ANTONYM PRACTICE
// ============================================================

function CanvasSynonymAntonym({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: SynonymAntonymConfig = useMemo(() => ({
    ...DEFAULT_SYNONYM_ANTONYM_CONFIG,
    ...(cfg as Partial<SynonymAntonymConfig>),
    customExercises: (cfg.customExercises as SynonymAntonymConfig['customExercises'] | undefined) || [],
    teacherOptions: (cfg.teacherOptions as [string, string, string, string] | undefined) || ['', '', '', ''],
  }), [cfg])
  const handleChange = useCallback((patch: Partial<SynonymAntonymConfig>) => { updateConfig(patch) }, [updateConfig])
  return <SynonymAntonymWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
}

// ============================================================
// 13. IDIOM EXPLORER
// ============================================================

function CanvasIdiomExplorer({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: IdiomExplorerConfig = useMemo(() => ({
    ...DEFAULT_IDIOM_EXPLORER_CONFIG,
    ...(cfg as Partial<IdiomExplorerConfig>),
    customExercises: (cfg.customExercises as IdiomExplorerConfig['customExercises'] | undefined) || [],
    teacherOptions: (cfg.teacherOptions as [string, string, string, string] | undefined) || ['', '', '', ''],
  }), [cfg])
  const handleChange = useCallback((patch: Partial<IdiomExplorerConfig>) => { updateConfig(patch) }, [updateConfig])
  return <IdiomExplorerWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
}

// ============================================================
// 14. PREFIX & SUFFIX BUILDER
// ============================================================

function CanvasPrefixSuffix({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: PrefixSuffixConfig = useMemo(() => ({
    ...DEFAULT_PREFIX_SUFFIX_CONFIG,
    ...(cfg as Partial<PrefixSuffixConfig>),
    customExercises: (cfg.customExercises as PrefixSuffixConfig['customExercises'] | undefined) || [],
    teacherOptions: (cfg.teacherOptions as [string, string, string, string] | undefined) || ['', '', '', ''],
  }), [cfg])
  const handleChange = useCallback((patch: Partial<PrefixSuffixConfig>) => { updateConfig(patch) }, [updateConfig])
  return <PrefixSuffixWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
}

// ============================================================
// 15. WORD SORTER
// ============================================================

function CanvasWordSorter({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: WordSorterConfig = useMemo(() => ({
    ...DEFAULT_WORD_SORTER_CONFIG,
    ...(cfg as Partial<WordSorterConfig>),
    customExercises: (cfg.customExercises as WordSorterConfig['customExercises'] | undefined) || [],
    selections: (cfg.selections as Record<string, string> | undefined) || {},
  }), [cfg])
  const handleChange = useCallback((patch: Partial<WordSorterConfig>) => { updateConfig(patch) }, [updateConfig])
  return <WordSorterWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
}

// ============================================================
// 16. SENTENCE COMBINING
// ============================================================

function CanvasSentenceCombining({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: SentenceCombiningConfig = useMemo(() => ({
    ...DEFAULT_SENTENCE_COMBINING_CONFIG,
    ...(cfg as Partial<SentenceCombiningConfig>),
    customExercises: (cfg.customExercises as SentenceCombiningConfig['customExercises'] | undefined) || [],
  }), [cfg])
  const handleChange = useCallback((patch: Partial<SentenceCombiningConfig>) => { updateConfig(patch) }, [updateConfig])
  return <SentenceCombiningWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
}

// ============================================================
// 17. PROOFREADING PRACTICE
// ============================================================

function CanvasProofreading({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config
  const widgetConfig: ProofreadingConfig = useMemo(() => ({
    ...DEFAULT_PROOFREADING_CONFIG,
    ...(cfg as Partial<ProofreadingConfig>),
    clickedSpans: (cfg.clickedSpans as number[] | undefined) || [],
  }), [cfg])
  const handleChange = useCallback((patch: Partial<ProofreadingConfig>) => { updateConfig(patch) }, [updateConfig])
  return <ProofreadingWidget isDark={isDark} config={widgetConfig} onConfigChange={handleChange} />
}

// ============================================================
// 18. READING PASSAGE ANALYZER (self-contained, no config sync)
// ============================================================

function CanvasReadingAnalyzer({ isDark }: CanvasWidgetProps) {
  return <ReadingPassageAnalyzer isDark={isDark} />
}

// ============================================================
// 19. ROOT & MORPHOLOGY EXPLORER (self-contained, no config sync)
// ============================================================

function CanvasRootMorphology({ isDark }: CanvasWidgetProps) {
  return <RootMorphologyExplorer isDark={isDark} />
}

// ============================================================
// 20. ACTIVE & PASSIVE VOICE (self-contained, no config sync)
// ============================================================

function CanvasActivePassive({ isDark }: CanvasWidgetProps) {
  return <ActivePassiveVoice isDark={isDark} />
}

// ============================================================
// 21. READING COMPREHENSION STRATEGIES (self-contained, no config sync)
// ============================================================

function CanvasReadingStrategies({ isDark }: CanvasWidgetProps) {
  return <ReadingComprehensionStrategies isDark={isDark} />
}

// ============================================================
// 22. GRAMMAR ERROR DIAGNOSTIC (self-contained, no config sync)
// ============================================================

function CanvasGrammarDiagnostic({ isDark }: CanvasWidgetProps) {
  return <GrammarErrorDiagnostic isDark={isDark} />
}

// ============================================================
// 23. SPELLING PATTERNS (self-contained, no config sync)
// ============================================================

function CanvasSpellingPatterns({ isDark }: CanvasWidgetProps) {
  return <SpellingPatterns isDark={isDark} />
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
  'lang-confused-words': CanvasConfusedWords,
  'lang-homophones': CanvasHomophones,
  'lang-synonym-antonym': CanvasSynonymAntonym,
  'lang-idiom-explorer': CanvasIdiomExplorer,
  'lang-prefix-suffix': CanvasPrefixSuffix,
  'lang-word-sorter': CanvasWordSorter,
  'lang-sentence-combining': CanvasSentenceCombining,
  'lang-proofreading': CanvasProofreading,
  'lang-reading-analyzer': CanvasReadingAnalyzer,
  'lang-root-morphology': CanvasRootMorphology,
  'lang-active-passive': CanvasActivePassive,
  'lang-reading-strategies': CanvasReadingStrategies,
  'lang-grammar-diagnostic': CanvasGrammarDiagnostic,
  'lang-spelling-patterns': CanvasSpellingPatterns,
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
    case 'lang-story-elements': return { ...DEFAULT_STORY_MAP_CONFIG }
    case 'lang-paragraph-organizer': return { ...DEFAULT_PARAORG_CONFIG }
    case 'lang-vocab-flashcards': return { ...DEFAULT_VOCAB_CONFIG }
    case 'lang-figurative-language': return { ...DEFAULT_FIGLANG_CONFIG }
    case 'lang-punctuation': return { ...DEFAULT_PUNCT_CONFIG }
    case 'lang-phonics': return { ...DEFAULT_PHONICS_CONFIG }
    case 'lang-sentence-expansion': return { ...DEFAULT_EXPANSION_CONFIG }
    case 'lang-confused-words': return { ...DEFAULT_CONFUSED_WORDS_CONFIG }
    case 'lang-homophones': return { ...DEFAULT_HOMOPHONES_CONFIG }
    case 'lang-synonym-antonym': return { ...DEFAULT_SYNONYM_ANTONYM_CONFIG }
    case 'lang-idiom-explorer': return { ...DEFAULT_IDIOM_EXPLORER_CONFIG }
    case 'lang-prefix-suffix': return { ...DEFAULT_PREFIX_SUFFIX_CONFIG }
    case 'lang-word-sorter': return { ...DEFAULT_WORD_SORTER_CONFIG }
    case 'lang-sentence-combining': return { ...DEFAULT_SENTENCE_COMBINING_CONFIG }
    case 'lang-proofreading': return { ...DEFAULT_PROOFREADING_CONFIG }
    case 'lang-reading-analyzer': return {}
    case 'lang-root-morphology': return {}
    case 'lang-active-passive': return {}
    case 'lang-reading-strategies': return {}
    case 'lang-grammar-diagnostic': return {}
    case 'lang-spelling-patterns': return {}
    default: return {}
  }
}

export function getLangWidgetDefaultSize(kind: string): { width: number; height: number } {
  switch (kind) {
    case 'lang-pos-tagger': return { width: 440, height: 550 }
    case 'lang-sentence-structure': return { width: 500, height: 680 }
    case 'lang-story-elements': return { width: 520, height: 730 }
    case 'lang-paragraph-organizer': return { width: 520, height: 730 }
    case 'lang-vocab-flashcards': return { width: 440, height: 600 }
    case 'lang-figurative-language': return { width: 500, height: 680 }
    case 'lang-punctuation': return { width: 500, height: 680 }
    case 'lang-phonics': return { width: 500, height: 680 }
    case 'lang-sentence-expansion': return { width: 500, height: 680 }
    case 'lang-confused-words': return { width: 500, height: 680 }
    case 'lang-homophones': return { width: 500, height: 680 }
    case 'lang-synonym-antonym': return { width: 470, height: 620 }
    case 'lang-idiom-explorer': return { width: 500, height: 680 }
    case 'lang-prefix-suffix': return { width: 500, height: 680 }
    case 'lang-word-sorter': return { width: 470, height: 620 }
    case 'lang-sentence-combining': return { width: 500, height: 680 }
    case 'lang-proofreading': return { width: 520, height: 730 }
    case 'lang-reading-analyzer': return { width: 500, height: 680 }
    case 'lang-root-morphology': return { width: 500, height: 680 }
    case 'lang-active-passive': return { width: 500, height: 680 }
    case 'lang-reading-strategies': return { width: 500, height: 680 }
    case 'lang-grammar-diagnostic': return { width: 500, height: 680 }
    case 'lang-spelling-patterns': return { width: 500, height: 680 }
    default: return { width: 420, height: 470 }
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
  'lang-confused-words': 'Commonly Confused Words',
  'lang-homophones': 'Homophone Practice',
  'lang-synonym-antonym': 'Synonym & Antonym Practice',
  'lang-idiom-explorer': 'Idiom Explorer',
  'lang-prefix-suffix': 'Prefix & Suffix Builder',
  'lang-word-sorter': 'Word Sorter',
  'lang-sentence-combining': 'Sentence Combining',
  'lang-proofreading': 'Proofreading Practice',
  'lang-reading-analyzer': 'Reading Passage Analyzer',
  'lang-root-morphology': 'Root & Morphology Explorer',
  'lang-active-passive': 'Active & Passive Voice',
  'lang-reading-strategies': 'Reading Comprehension Strategies',
  'lang-grammar-diagnostic': 'Grammar Error Diagnostic',
  'lang-spelling-patterns': 'Spelling Patterns',
}
