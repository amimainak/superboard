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
    // Phase 4 English widgets
    case 'lang-sight-words': return { grade: 'Pre-Primer', search: '', highlighted: [] }
    case 'lang-cvc-sort': return { sorted: {}, unsorted: [] }
    case 'lang-fluency-timer': return { wordCount: 0, elapsed: 0, running: false, history: [] }
    case 'lang-argument-organizer': return { claim: '', evidence: ['','',''], counterclaim: '', rebuttal: '', conclusion: '' }
    case 'lang-text-evidence': return { passage: '', highlights: [], activeColor: 0 }
    case 'lang-semicolon-punct': return { ruleIdx: 0, answers: [], checked: [] }
    case 'lang-context-clues-exp': return { idx: 0, guess: '', revealed: false }
    case 'lang-rhetorical-analysis': return { speaker: '', occasion: '', audience: '', purpose: '', subject: '', ethos: '', pathos: '', logos: '', devices: '' }
    case 'lang-logical-fallacies': return { selected: -1, showExample: false, quizMode: false, quizAnswer: '', quizResult: '' }
    case 'lang-citation-gen': return { style: 'MLA', sourceType: 'book', fields: { author: '', title: '', container: '', publisher: '', year: '', pages: '', url: '', accessDate: '' } }
    case 'lang-essay-outline': return { template: '5para', thesis: '', points: ['','',''], conclusion: '' }
    case 'lang-tts-preview': return { text: '', rate: 1, playing: false }
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
    // Phase 4 English widgets
    case 'lang-sight-words': return { width: 400, height: 500 }
    case 'lang-cvc-sort': return { width: 420, height: 480 }
    case 'lang-fluency-timer': return { width: 350, height: 400 }
    case 'lang-argument-organizer': return { width: 420, height: 550 }
    case 'lang-text-evidence': return { width: 440, height: 520 }
    case 'lang-semicolon-punct': return { width: 400, height: 480 }
    case 'lang-context-clues-exp': return { width: 400, height: 450 }
    case 'lang-rhetorical-analysis': return { width: 420, height: 550 }
    case 'lang-logical-fallacies': return { width: 440, height: 580 }
    case 'lang-citation-gen': return { width: 420, height: 500 }
    case 'lang-essay-outline': return { width: 420, height: 560 }
    case 'lang-tts-preview': return { width: 400, height: 350 }
    default: return { width: 420, height: 470 }
  }
}

// ============================================================
// Phase 4: New English/ELA Canvas Widgets
// ============================================================

// --- Sight Word Bank ---
const DOLCH_WORDS: Record<string, string[]> = {
  'Pre-Primer': ['the','to','and','a','I','you','it','in','said','for','up','look','is','go','we','little','run','down','can','not','one','my','me','big','come','blue','red','jump','away','here','help','make','yellow','two','play','run','find','three','funny','come','blue','red'],
  'Primer': ['he','was','for','on','are','as','with','his','they','at','be','this','have','from','or','one','had','by','words','but','not','what','all','were','we','when','your','can','said','there','use','an','each','which','she','do','how','their','if'],
  '1st Grade': ['of','his','had','him','her','some','as','then','could','when','were','them','ask','an','over','just','from','know','take','every','good','give','long','about','got','play','day','look','come','made','find','some','after','back','also','new','want','only'],
  '2nd Grade': ['always','around','because','been','before','best','both','buy','call','cold','does','don','fast','first','found','gave','goes','green','its','made','many','off','or','pull','read','right','sing','sleep','tell','these','those','upon','us','use','very','wash','which','why','wish','work','would','write','your'],
  '3rd Grade': ['about','better','bring','carry','clean','cut','done','draw','drink','eight','fall','far','full','got','grow','hold','hot','hurt','if','keep','kind','laugh','light','much','myself','never','only','own','pick','seven','shall','show','six','small','start','ten','today','together','try','warm'],
}

export function CanvasSightWordBank({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const grade = (raw.grade as string) || 'Pre-Primer'
  const search = (raw.search as string) || ''
  const highlighted = (raw.highlighted as string[]) || []
  const words = DOLCH_WORDS[grade] || DOLCH_WORDS['Pre-Primer']
  const filtered = search ? words.filter(w => w.includes(search.toLowerCase())) : words
  const s = langStyles(isDark)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Sight Words</span>
        <span style={{ fontSize: 9, color: s.text }}>{words.length} words</span>
      </div>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {Object.keys(DOLCH_WORDS).map(g => (
          <button key={g} onClick={() => updateConfig({ grade: g, highlighted: [] })} style={s.tabBtn(grade === g)}>{g}</button>
        ))}
      </div>
      <input value={search} onChange={e => updateConfig({ search: e.target.value })} placeholder="Search words..." style={s.input} />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 4, alignContent: 'flex-start', padding: 4 }}>
        {filtered.map(w => {
          const isHl = highlighted.includes(w)
          return (
            <button key={w} onClick={() => updateConfig({ highlighted: isHl ? highlighted.filter(x => x !== w) : [...highlighted, w] })} style={{
              padding: '4px 8px', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid ' + (isHl ? 'rgba(5,150,105,0.5)' : s.border),
              background: isHl ? 'rgba(5,150,105,0.12)' : s.surface, color: isHl ? '#34d399' : s.bright, transition: 'all 0.15s',
            }}>{w}</button>
          )
        })}
      </div>
      {highlighted.length > 0 && <div style={{ fontSize: 9, color: s.text }}>{highlighted.length} highlighted · Click to toggle</div>}
    </div>
  )
}

// --- CVC Word Sort ---
const CVC_FAMILIES: Record<string, string[]> = {
  '-at': ['cat','bat','hat','mat','rat','sat','fat','pat'],
  '-an': ['can','fan','man','pan','ran','tan','van','ban'],
  '-ig': ['big','dig','fig','pig','wig','rig','jig'],
  '-op': ['hop','mop','top','pop','cop','bop','hop'],
  '-ug': ['bug','hug','mug','rug','jug','pug','tug'],
  '-ot': ['hot','pot','dot','not','got','lot','rot'],
}

export function CanvasCVCWordSort({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const sorted = (raw.sorted as Record<string, string[]>) || {}
  const unsorted = (raw.unsorted as string[]) || Object.values(CVC_FAMILIES).flat().sort(() => Math.random() - 0.5).slice(0, 12)
  const s = langStyles(isDark)
  const bins = Object.keys(CVC_FAMILIES)

  const handleDrop = (word: string, bin: string) => {
    const newSorted = { ...sorted, [bin]: [...(sorted[bin] || []), word] }
    const newUnsorted = unsorted.filter(w => w !== word)
    updateConfig({ sorted: newSorted, unsorted: newUnsorted })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>CVC Word Sort</span>
      {unsorted.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 4, minHeight: 36, background: s.surface, borderRadius: 6, border: '1px solid ' + s.border }}>
          {unsorted.map(w => (
            <span key={w} style={{ fontSize: 11, fontWeight: 600, color: '#34d399' }}>{w}</span>
          ))}
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        {bins.map(bin => (
          <div key={bin} style={{ padding: 6, borderRadius: 6, border: '1px solid ' + s.border, background: s.surface }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: s.bright, marginBottom: 4 }}>{bin} Family</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, minHeight: 24 }}>
              {(sorted[bin] || []).map(w => <span key={w} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'rgba(5,150,105,0.1)', color: '#34d399', fontWeight: 500 }}>{w}</span>)}
            </div>
            {unsorted.map(w => (
              CVC_FAMILIES[bin]?.includes(w) ? <button key={w} onClick={() => handleDrop(w, bin)} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: s.surface, border: '1px dashed ' + s.border, color: s.text, cursor: 'pointer', marginTop: 2 }}>+ {w}</button> : null
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Fluency Timer ---
export function CanvasFluencyTimer({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const wordCount = (raw.wordCount as number) || 0
  const elapsed = (raw.elapsed as number) || 0
  const running = (raw.running as boolean) || false
  const history = (raw.history as number[]) || []
  const s = langStyles(isDark)
  const wpm = elapsed > 0 ? Math.round((wordCount / elapsed) * 60) : 0

  React.useEffect(() => {
    if (!running) return
    const t = setTimeout(() => updateConfig({ elapsed: elapsed + 1 }), 1000)
    return () => clearTimeout(t)
  }, [running, elapsed, updateConfig])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', fontFamily: 'inherit' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Fluency Timer</span>
      <div style={{ fontSize: 36, fontWeight: 700, color: s.bright, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
      {wpm > 0 && <div style={{ fontSize: 18, fontWeight: 600, color: '#34d399', textAlign: 'center' }}>{wpm} WPM</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: s.text }}>Words read:</span>
        <input type="number" value={wordCount || ''} onChange={e => updateConfig({ wordCount: parseInt(e.target.value) || 0 })} style={{ ...s.input, width: 80 }} min={0} />
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => updateConfig({ running: !running })} style={{ flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: running ? 'rgba(239,68,68,0.12)' : 'rgba(5,150,105,0.12)', border: '1px solid ' + (running ? 'rgba(239,68,68,0.3)' : 'rgba(5,150,105,0.3)'), color: running ? '#f87171' : '#34d399' }}>{running ? 'Stop' : 'Start'}</button>
        <button onClick={() => { if (wpm > 0) updateConfig({ history: [...history, wpm], elapsed: 0, running: false, wordCount: 0 }); else updateConfig({ elapsed: 0, running: false, wordCount: 0 }) }} style={{ flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: s.surface, border: '1px solid ' + s.border, color: s.text }}>Reset</button>
      </div>
      {history.length > 0 && (
        <div style={{ fontSize: 10, color: s.text }}>History: {history.map(w => w + ' WPM').join(' · ')}</div>
      )}
    </div>
  )
}

// --- Argument Organizer ---
export function CanvasArgumentOrganizer({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const claim = (raw.claim as string) || ''
  const evidence = (raw.evidence as string[]) || ['','','']
  const counterclaim = (raw.counterclaim as string) || ''
  const rebuttal = (raw.rebuttal as string) || ''
  const conclusion = (raw.conclusion as string) || ''
  const s = langStyles(isDark)

  const setEvi = (i: number, v: string) => { const e = [...evidence]; e[i] = v; updateConfig({ evidence: e }) }
  const transitions = ['Furthermore,', 'In addition,', 'Moreover,', 'Similarly,', 'For example,', 'Specifically,', 'As evidence,', 'Research shows,']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit', overflowY: 'auto' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Argumentative Writing</span>
      <div><div style={{ fontSize: 10, fontWeight: 700, color: '#34d399' }}>Claim / Thesis</div><textarea value={claim} onChange={e => updateConfig({ claim: e.target.value })} rows={2} style={s.input} placeholder="Your main argument..." /></div>
      {evidence.map((ev, i) => (
        <div key={i}><div style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa' }}>Evidence {i + 1}</div><textarea value={ev} onChange={e => setEvi(i, e.target.value)} rows={2} style={s.input} placeholder="Supporting evidence..." /><div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>{transitions.slice(i * 2, i * 2 + 2).map(t => <span key={t} style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: s.surface, color: s.text }}>{t}</span>)}</div></div>
      ))}
      <div><div style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24' }}>Counterclaim</div><textarea value={counterclaim} onChange={e => updateConfig({ counterclaim: e.target.value })} rows={2} style={s.input} placeholder="Opposing view..." /></div>
      <div><div style={{ fontSize: 10, fontWeight: 700, color: '#f87171' }}>Rebuttal</div><textarea value={rebuttal} onChange={e => updateConfig({ rebuttal: e.target.value })} rows={2} style={s.input} placeholder="Why counterclaim is wrong..." /></div>
      <div><div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa' }}>Conclusion</div><textarea value={conclusion} onChange={e => updateConfig({ conclusion: e.target.value })} rows={2} style={s.input} placeholder="Restate claim + significance..." /></div>
    </div>
  )
}

// --- Text Evidence Highlighter ---
const HIGHLIGHT_COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa']
const HIGHLIGHT_LABELS = ['Claim', 'Evidence', 'Reasoning', 'Counter', 'Analysis']

export function CanvasTextEvidence({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const passage = (raw.passage as string) || ''
  const highlights = (raw.highlights as Array<{start: number, end: number, color: string}>) || []
  const activeColor = (raw.activeColor as number) || 0
  const s = langStyles(isDark)

  const handleMouseUp = () => {
    const sel = window.getSelection()
    if (!sel || !sel.toString().trim() || !passage) return
    const anchor = sel.anchorNode?.textContent || ''
    const idx = passage.indexOf(anchor)
    if (idx < 0) return
    const start = idx + sel.anchorOffset
    const end = start + sel.toString().length
    updateConfig({ highlights: [...highlights, { start, end, color: HIGHLIGHT_COLORS[activeColor] }] })
    sel.removeAllRanges()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Text Evidence</span>
        <button onClick={() => updateConfig({ highlights: [] })} style={{ fontSize: 9, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
      </div>
      <div style={{ display: 'flex', gap: 3 }}>{HIGHLIGHT_LABELS.map((l, i) => (
        <button key={l} onClick={() => updateConfig({ activeColor: i })} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 6px', borderRadius: 4, fontSize: 9, cursor: 'pointer', border: '1px solid ' + (activeColor === i ? HIGHLIGHT_COLORS[i] : s.border), background: activeColor === i ? HIGHLIGHT_COLORS[i] + '22' : s.surface }}><span style={{ width: 8, height: 8, borderRadius: 2, background: HIGHLIGHT_COLORS[i] }} />{l}</button>
      ))}</div>
      {!passage ? <textarea value={passage} onChange={e => updateConfig({ passage: e.target.value })} placeholder="Paste a passage here, then select text to highlight..." rows={3} style={s.input} /> : (
        <div onMouseUp={handleMouseUp} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid ' + s.border, background: s.surface, fontSize: 12, lineHeight: 1.7, color: s.bright, overflowY: 'auto', cursor: 'text', whiteSpace: 'pre-wrap', position: 'relative' }}>
          {highlights.sort((a, b) => a.start - b.start).map((h, i) => (
            <span key={i} style={{ background: h.color + '44', borderRadius: 2, padding: '0 1px' }} />
          ))}
          {passage}
        </div>
      )}
      <button onClick={() => updateConfig({ passage: '', highlights: [] })} style={{ fontSize: 9, color: s.text, background: s.surface, border: '1px solid ' + s.border, borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>{passage ? 'Edit Passage' : 'New Passage'}</button>
    </div>
  )
}

// --- Logical Fallacies Reference ---
const FALLACIES = [
  { name: 'Ad Hominem', desc: 'Attacking the person instead of the argument', example: '"You can\'t trust John\'s opinion on climate change — he\'s not a scientist."' },
  { name: 'Straw Man', desc: 'Misrepresenting someone\'s argument to make it easier to attack', example: '"So you\'re saying we should have no laws at all?"' },
  { name: 'False Dichotomy', desc: 'Presenting only two options when more exist', example: '"Either you\'re with us or against us."' },
  { name: 'Slippery Slope', desc: 'Claiming a small step will lead to extreme consequences', example: '"If we allow homework extensions, soon no one will do any work."' },
  { name: 'Circular Reasoning', desc: 'The conclusion is assumed in the premise', example: '"The Bible is true because it says so in the Bible."' },
  { name: 'Bandwagon', desc: 'Claiming something is true because many believe it', example: '"Everyone is buying this stock, so it must be good."' },
  { name: 'Appeal to Authority', desc: 'Using an authority figure\'s opinion as evidence', example: '"Dr. Smith says this diet works, so it must be true."' },
  { name: 'Red Herring', desc: 'Introducing irrelevant information to distract', example: '"Sure the policy has flaws, but think about the children!"' },
  { name: 'Tu Quoque', desc: '"You too" — deflecting criticism by accusing the other', example: '"You say I litter, but you jaywalk!"' },
  { name: 'Non Sequitur', desc: 'Conclusion does not follow from the premise', example: '"I like soup, so I\'ll be a good doctor."' },
  { name: 'Post Hoc', desc: 'Assuming causation from correlation', example: '"I wore my lucky socks and we won, so they work."' },
  { name: 'Hasty Generalization', desc: 'Drawing a conclusion from insufficient evidence', example: '"I met two rude people from that city, so everyone there is rude."' },
  { name: 'False Cause', desc: 'Assuming two events have a cause-effect relationship', example: '"Roosters crow before sunrise, so they cause the sun to rise."' },
  { name: 'Begging the Question', desc: 'The argument assumes what it\'s trying to prove', example: '"Freedom is good because having freedom is the best."' },
  { name: 'Guilt by Association', desc: 'Discrediting an idea by associating it with something negative', example: '"Vegetarianism is just like those extreme cult diets."' },
]

export function CanvasLogicalFallacies({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const selected = (raw.selected as number) || -1
  const showExample = (raw.showExample as boolean) || false
  const quizMode = (raw.quizMode as boolean) || false
  const quizAnswer = (raw.quizAnswer as string) || ''
  const quizResult = (raw.quizResult as string) || ''
  const s = langStyles(isDark)

  const currentQuiz = quizMode ? FALLACIES[Math.abs(selected) % FALLACIES.length] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Logical Fallacies</span>
        <button onClick={() => { updateConfig({ quizMode: !quizMode, selected: -1, quizAnswer: '', quizResult: '' }) }} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: quizMode ? 'rgba(99,102,241,0.12)' : s.surface, border: '1px solid ' + (quizMode ? 'rgba(99,102,241,0.3)' : s.border), color: quizMode ? '#a5b4fc' : s.text, cursor: 'pointer', fontWeight: 600 }}>Quiz</button>
      </div>
      {quizMode && currentQuiz ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <div style={{ fontSize: 11, color: s.bright, lineHeight: 1.5, padding: 8, background: s.surface, borderRadius: 6, border: '1px solid ' + s.border }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: '#fbbf24' }}>Example:</div>{currentQuiz.example}
          </div>
          <input value={quizAnswer} onChange={e => updateConfig({ quizAnswer: e.target.value })} placeholder="Name the fallacy..." style={s.input} />
          <button onClick={() => updateConfig({ quizResult: quizAnswer.toLowerCase().includes(currentQuiz.name.toLowerCase().split(' ')[0]) ? 'Correct!' : 'Try again. Hint: ' + currentQuiz.name })} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>Check Answer</button>
          {quizResult && <div style={{ fontSize: 11, fontWeight: 600, color: quizResult.startsWith('Correct') ? '#34d399' : '#fbbf24' }}>{quizResult}</div>}
          <button onClick={() => updateConfig({ selected: (selected + 1) % FALLACIES.length, quizAnswer: '', quizResult: '' })} style={{ fontSize: 10, color: s.text, background: 'none', border: 'none', cursor: 'pointer' }}>Next Question →</button>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {FALLACIES.map((f, i) => (
            <div key={f.name} onClick={() => updateConfig({ selected: selected === i ? -1 : i, showExample: selected === i ? false : showExample })} style={{ padding: '6px 8px', borderRadius: 6, cursor: 'pointer', border: '1px solid ' + (selected === i ? 'rgba(99,102,241,0.3)' : s.border), background: selected === i ? 'rgba(99,102,241,0.06)' : s.surface }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: selected === i ? '#a5b4fc' : s.bright }}>{f.name}</div>
              <div style={{ fontSize: 9, color: s.text, lineHeight: 1.4 }}>{f.desc}</div>
              {selected === i && showExample && <div style={{ fontSize: 9, color: '#fbbf24', marginTop: 4, fontStyle: 'italic' }}>"{f.example}"</div>}
            </div>
          ))}
        </div>
      )}
      {selected >= 0 && !quizMode && <button onClick={() => updateConfig({ showExample: !showExample })} style={{ fontSize: 9, color: s.text, background: 'none', border: 'none', cursor: 'pointer' }}>{showExample ? 'Hide' : 'Show'} Examples</button>}
    </div>
  )
}

// --- Citation Generator ---
export function CanvasCitationGenerator({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const style = (raw.style as string) || 'MLA'
  const sourceType = (raw.sourceType as string) || 'book'
  const fields = (raw.fields as Record<string, string>) || { author: '', title: '', container: '', publisher: '', year: '', pages: '', url: '', accessDate: '' }
  const s = langStyles(isDark)

  const setField = (k: string, v: string) => updateConfig({ fields: { ...fields, [k]: v } })

  const generateCitation = () => {
    const a = fields.author?.split(' ').pop() || 'Unknown'
    const first = fields.author?.split(' ').slice(0, -1).join(' ') || ''
    if (style === 'MLA') {
      if (sourceType === 'book') return `${first} ${a.charAt(0).toUpperCase() + a.slice(1)}. <i>${fields.title}</i>. ${fields.publisher}, ${fields.year}.`
      if (sourceType === 'website') return `${first} ${a.charAt(0).toUpperCase() + a.slice(1)}. "${fields.title}." <i>${fields.container}</i>, ${fields.accessDate}, ${fields.url}.`
      return `${first} ${a.charAt(0).toUpperCase() + a.slice(1)}. "${fields.title}." <i>${fields.container}</i>, vol. ${fields.pages}, ${fields.year}.`
    } else {
      if (sourceType === 'book') return `${a.charAt(0).toUpperCase() + a.slice(1)}, ${first.charAt(0)}.. (${fields.year}). <i>${fields.title}</i>. ${fields.publisher}.`
      if (sourceType === 'website') return `${a.charAt(0).toUpperCase() + a.slice(1)}, ${first.charAt(0)}.. (${fields.year}). ${fields.title}. ${fields.container}. ${fields.url}`
      return `${a.charAt(0).toUpperCase() + a.slice(1)}, ${first.charAt(0)}.. (${fields.year}). ${fields.title}. <i>${fields.container}</i>, ${fields.pages}.`
    }
  }

  const citation = generateCitation()
  const fieldLabels: Record<string, string> = { author: 'Author', title: 'Title', container: 'Container/Website', publisher: 'Publisher', year: 'Year', pages: 'Pages', url: 'URL', accessDate: 'Access Date' }
  const fieldOrder = ['author', 'title', 'container', 'publisher', 'year', 'pages', 'url', 'accessDate']
  const visibleFields = sourceType === 'book' ? ['author','title','publisher','year','pages'] : sourceType === 'website' ? ['author','title','container','url','accessDate','year'] : ['author','title','container','year','pages']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Citation Generator</span>
      <div style={{ display: 'flex', gap: 3 }}>{['MLA', 'APA'].map(st => (
        <button key={st} onClick={() => updateConfig({ style: st })} style={s.tabBtn(style === st)}>{st}</button>
      ))}<span style={{ width: 1, background: s.border, margin: '0 4px' }} />{['book', 'website', 'journal'].map(t => (
        <button key={t} onClick={() => updateConfig({ sourceType: t })} style={s.tabBtn(sourceType === t)}>{t}</button>
      ))}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
        {visibleFields.map(k => (
          <div key={k}><span style={{ fontSize: 9, color: s.text }}>{fieldLabels[k]}</span><input value={fields[k] || ''} onChange={e => setField(k, e.target.value)} style={{ ...s.input, marginTop: 2 }} placeholder={fieldLabels[k] + '...'} /></div>
        ))}
      </div>
      <div style={{ padding: 8, borderRadius: 6, background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)', fontSize: 11, color: s.bright, lineHeight: 1.5 }}>{citation}</div>
    </div>
  )
}

// --- Essay Outline Builder ---
export function CanvasEssayOutline({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const template = (raw.template as string) || '5para'
  const thesis = (raw.thesis as string) || ''
  const points = (raw.points as string[]) || ['','','']
  const conclusion = (raw.conclusion as string) || ''
  const s = langStyles(isDark)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Essay Outline</span>
        <div style={{ display: 'flex', gap: 3 }}>{['5para', 'research'].map(t => (
          <button key={t} onClick={() => updateConfig({ template: t, points: t === 'research' ? ['','','','',''] : ['','',''] })} style={s.tabBtn(template === t)}>{t === '5para' ? '5-Paragraph' : 'Research'}</button>
        ))}</div>
      </div>
      <div><div style={{ fontSize: 10, fontWeight: 700, color: '#34d399' }}>Thesis Statement</div><textarea value={thesis} onChange={e => updateConfig({ thesis: e.target.value })} rows={2} style={s.input} placeholder="Your thesis..." /></div>
      {points.map((p, i) => (
        <div key={i}><div style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa' }}>Body Paragraph {i + 1} {template === 'research' ? '(Source: _______)' : ''}</div><textarea value={p} onChange={e => { const np = [...points]; np[i] = e.target.value; updateConfig({ points: np }) }} rows={2} style={s.input} placeholder={i === 0 ? 'Strongest point...' : i === points.length - 1 ? 'Final point...' : 'Supporting point...'} /></div>
      ))}
      <div><div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa' }}>Conclusion</div><textarea value={conclusion} onChange={e => updateConfig({ conclusion: e.target.value })} rows={2} style={s.input} placeholder="Restate thesis + significance..." /></div>
      {template === '5para' && <div style={{ fontSize: 8, color: s.text, padding: '4px 6px', background: s.surface, borderRadius: 4, border: '1px solid ' + s.border }}>Hook → Thesis → Point 1 → Point 2 → Point 3 → Restate Thesis → Clincher</div>}
    </div>
  )
}

// --- Context Clues Explorer ---
const CONTEXT_CLUE_EXAMPLES = [
  { sentence: 'The arboretum was filled with towering oaks and blooming cherry trees.', unknown: 'arboretum', clues: ['towering oaks', 'blooming cherry trees'], answer: 'A place where trees are grown for display' },
  { sentence: 'She was very loquacious at dinner, talking non-stop about her vacation.', unknown: 'loquacious', clues: ['talking non-stop'], answer: 'Very talkative' },
  { sentence: 'The frigid wind cut through my jacket like a knife.', unknown: 'frigid', clues: ['cut through my jacket like a knife'], answer: 'Extremely cold' },
  { sentence: 'His lethargic behavior worried his parents — he slept all day.', unknown: 'lethargic', clues: ['slept all day'], answer: 'Lacking energy; sluggish' },
  { sentence: 'The meticulous artist spent hours on each tiny detail of the painting.', unknown: 'meticulous', clues: ['spent hours on each tiny detail'], answer: 'Very careful and precise' },
  { sentence: 'Due to the deluge, the streets flooded and school was cancelled.', unknown: 'deluge', clues: ['streets flooded'], answer: 'A heavy rainstorm or flood' },
]

export function CanvasContextCluesExplorer({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const idx = (raw.idx as number) || 0
  const guess = (raw.guess as string) || ''
  const revealed = (raw.revealed as boolean) || false
  const ex = CONTEXT_CLUE_EXAMPLES[idx % CONTEXT_CLUE_EXAMPLES.length]
  const s = langStyles(isDark)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Context Clues</span>
        <span style={{ fontSize: 9, color: s.text }}>{idx + 1}/{CONTEXT_CLUE_EXAMPLES.length}</span>
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.6, color: s.bright, padding: 8, background: s.surface, borderRadius: 6, border: '1px solid ' + s.border }}>
        {ex.sentence.replace(ex.unknown, <span key="uw" style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24', fontWeight: 700, padding: '0 2px', borderRadius: 3 }}>{ex.unknown}</span> as unknown as string)}
      </div>
      {!revealed ? <>
        <div style={{ fontSize: 9, color: s.text }}>Look at the words around the highlighted word. What clues help you figure out its meaning?</div>
        <div style={{ fontSize: 9, color: '#60a5fa' }}>Clue words: {ex.clues.join(', ')}</div>
        <input value={guess} onChange={e => updateConfig({ guess: e.target.value })} placeholder="What does the highlighted word mean?" style={s.input} />
        <button onClick={() => updateConfig({ revealed: true })} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>Reveal Answer</button>
      </> : <>
        <div style={{ padding: 8, borderRadius: 6, background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)' }}><div style={{ fontSize: 10, fontWeight: 700, color: '#34d399' }}>Meaning:</div><div style={{ fontSize: 11, color: s.bright, marginTop: 2 }}>{ex.answer}</div></div>
        <button onClick={() => updateConfig({ idx: (idx + 1) % CONTEXT_CLUE_EXAMPLES.length, guess: '', revealed: false })} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: s.surface, border: '1px solid ' + s.border, color: s.text }}>Next →</button>
      </>}
    </div>
  )
}

// --- Semicolon & Advanced Punctuation ---
const PUNCT_RULES = [
  { rule: 'Semicolon (;)', desc: 'Joins two related independent clauses.', example: 'I love coffee; she prefers tea.', practice: ['The sun was setting____ the sky turned orange.', 'Study hard____ you will pass.'] },
  { rule: 'Colon (:)', desc: 'Introduces a list, explanation, or quote.', example: 'Bring three things: pen, paper, and a pencil.', practice: ['There are three primary colors____ red, blue, and yellow.'] },
  { rule: 'Em Dash (—)', desc: 'Sets off an interruption or emphasis.', example: 'The concert — which was sold out — started at 8.', practice: ['My dog____ a golden retriever____ loves to swim.'] },
  { rule: 'Parentheses ()', desc: 'Adds extra information that can be removed.', example: 'The meeting (originally scheduled for Monday) moved.', practice: ['The new student____ from Chicago____ joined our class.'] },
]

export function CanvasSemicolonPunctuation({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const ruleIdx = (raw.ruleIdx as number) || 0
  const answers = (raw.answers as string[]) || PUNCT_RULES.map(() => '')
  const checked = (raw.checked as boolean[]) || PUNCT_RULES.map(() => false)
  const s = langStyles(isDark)
  const rule = PUNCT_RULES[ruleIdx % PUNCT_RULES.length]
  const correctPuncts = [';', ':', '—', '()']

  const checkAnswer = (i: number) => {
    const ca = new Array(checked.length); ca.fill(false); ca[i] = true
    updateConfig({ checked: ca })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Advanced Punctuation</span>
      </div>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>{PUNCT_RULES.map((r, i) => (
        <button key={r.rule} onClick={() => updateConfig({ ruleIdx: i })} style={s.tabBtn(ruleIdx === i)}>{r.rule}</button>
      ))}</div>
      <div style={{ padding: 8, borderRadius: 6, background: s.surface, border: '1px solid ' + s.border }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: s.bright }}>{rule.rule}</div>
        <div style={{ fontSize: 10, color: s.text, marginTop: 2, lineHeight: 1.4 }}>{rule.desc}</div>
        <div style={{ fontSize: 10, color: '#60a5fa', marginTop: 4, fontStyle: 'italic' }}>{rule.example}</div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: s.bright }}>Practice: Fill in ____ with {rule.rule}</div>
      {rule.practice.map((p, i) => {
        const blanks = p.split('____')
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: s.bright }}>
            <span>{blanks[0]}</span>
            <input value={answers[ruleIdx * rule.practice.length + i] || ''} onChange={e => { const a = [...answers]; a[ruleIdx * rule.practice.length + i] = e.target.value; updateConfig({ answers: a }) }} style={{ width: 60, padding: '2px 6px', borderRadius: 4, fontSize: 11, border: '1px solid ' + s.border, background: s.surface, color: s.bright, outline: 'none' }} />
            {blanks[1] && <span>{blanks[1]}</span>}
            <button onClick={() => checkAnswer(ruleIdx * rule.practice.length + i)} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: 'rgba(5,150,105,0.12)', border: 'none', color: '#34d399', cursor: 'pointer', fontWeight: 600 }}>Check</button>
            {checked[ruleIdx * rule.practice.length + i] && <span style={{ fontSize: 9, color: '#34d399' }}>✓ {correctPuncts[ruleIdx]}</span>}
          </div>
        )
      })}
    </div>
  )
}

// --- Rhetorical Analysis Framework ---
export function CanvasRhetoricalAnalysis({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const speaker = (raw.speaker as string) || ''
  const occasion = (raw.occasion as string) || ''
  const audience = (raw.audience as string) || ''
  const purpose = (raw.purpose as string) || ''
  const subject = (raw.subject as string) || ''
  const ethos = (raw.ethos as string) || ''
  const pathos = (raw.pathos as string) || ''
  const logos = (raw.logos as string) || ''
  const devices = (raw.devices as string) || ''
  const s = langStyles(isDark)

  const field = (label: string, color: string, key: string, val: string, rows = 2) => (
    <div key={key}><div style={{ fontSize: 10, fontWeight: 700, color }}>{label}</div><textarea value={val} onChange={e => updateConfig({ [key]: e.target.value })} rows={rows} style={s.input} /></div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, height: '100%', fontFamily: 'inherit', overflowY: 'auto' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Rhetorical Analysis (SOAPS + Appeals)</span>
      {field('Speaker', '#34d399', 'speaker', speaker, 1)}
      {field('Occasion', '#60a5fa', 'occasion', occasion, 1)}
      {field('Audience', '#fbbf24', 'audience', audience, 1)}
      {field('Purpose', '#f87171', 'purpose', purpose, 1)}
      {field('Subject', '#a78bfa', 'subject', subject, 1)}
      <div style={{ height: 1, background: s.border }} />
      {field('Ethos (Credibility)', '#34d399', 'ethos', ethos)}
      {field('Pathos (Emotion)', '#f87171', 'pathos', pathos)}
      {field('Logos (Logic)', '#60a5fa', 'logos', logos)}
      {field('Rhetorical Devices Used', '#fbbf24', 'devices', devices)}
    </div>
  )
}

// --- TTS Preview ---
export function CanvasTTSPreview({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const text = (raw.text as string) || ''
  const rate = (raw.rate as number) || 1
  const playing = (raw.playing as boolean) || false
  const s = langStyles(isDark)

  const speak = () => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = rate
    u.onend = () => updateConfig({ playing: false })
    window.speechSynthesis.speak(u)
    updateConfig({ playing: true })
  }

  const stop = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    updateConfig({ playing: false })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Text-to-Speech</span>
      <textarea value={text} onChange={e => updateConfig({ text: e.target.value })} placeholder="Paste text to hear it read aloud..." rows={5} style={{ ...s.input, flex: 1, resize: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: s.text }}>Speed:</span>
        <input type="range" min={0.5} max={2} step={0.1} value={rate} onChange={e => updateConfig({ rate: parseFloat(e.target.value) })} style={{ flex: 1, accentColor: '#34d399' }} />
        <span style={{ fontSize: 9, color: s.text, minWidth: 30 }}>{rate}x</span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={playing ? stop : speak} style={{ flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: playing ? 'rgba(239,68,68,0.12)' : 'rgba(5,150,105,0.12)', border: '1px solid ' + (playing ? 'rgba(239,68,68,0.3)' : 'rgba(5,150,105,0.3)'), color: playing ? '#f87171' : '#34d399' }}>{playing ? 'Stop' : 'Play'}</button>
      </div>
    </div>
  )
}

// Helper for language widget styles
function langStyles(isDark: boolean) {
  return {
    surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
    text: isDark ? '#94a3b8' : '#64748b',
    bright: isDark ? '#e2e8f0' : '#1e293b',
    input: { padding: '4px 8px', borderRadius: 5, fontSize: 11, width: '100%', boxSizing: 'border-box' as const, border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'), background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none' },
    tabBtn: (active: boolean) => ({ padding: '2px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer' as const, fontWeight: 600 as const, background: active ? 'rgba(99,102,241,0.15)' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'), border: '1px solid ' + (active ? 'rgba(99,102,241,0.4)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)')), color: active ? '#a5b4fc' : (isDark ? '#94a3b8' : '#64748b') }),
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
  // Phase 4 English widgets
  'lang-sight-words': 'Sight Word Bank',
  'lang-cvc-sort': 'CVC Word Sort',
  'lang-fluency-timer': 'Fluency Timer',
  'lang-argument-organizer': 'Argumentative Writing Organizer',
  'lang-text-evidence': 'Text Evidence Highlighter',
  'lang-semicolon-punct': 'Semicolon & Advanced Punctuation',
  'lang-context-clues-exp': 'Context Clues Explorer',
  'lang-rhetorical-analysis': 'Rhetorical Analysis Framework',
  'lang-logical-fallacies': 'Logical Fallacies Reference',
  'lang-citation-gen': 'MLA/APA Citation Generator',
  'lang-essay-outline': 'Essay Outline Builder',
  'lang-tts-preview': 'Text-to-Speech Preview',
}
