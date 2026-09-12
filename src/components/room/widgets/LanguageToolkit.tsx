'use client'

import { useState, lazy, Suspense, useCallback, useRef } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { useWidgetStore } from '@/lib/room/widget-store'
import { getDefaultWidgetConfig, getWidgetDefaultSize, WIDGET_KIND_LABELS } from '@/components/whiteboard/CanvasWidgets'
import { generateId } from '@/lib/whiteboard/utils'
import type { WidgetElement } from '@/lib/whiteboard/types'
import { WidgetLoadingSkeleton } from './shared/WidgetLoadingSkeleton'
import { WidgetSearchBar, FavoritesAndRecent } from './WidgetSearchBar'
import { useFavorites, useRecentWidgets } from './widgetFavorites'
import {
  PunctuationPracticeWidget,
  DEFAULT_PUNCT_CONFIG,
  type PunctWidgetConfig,
} from '@/components/whiteboard/PunctuationPracticeWidget'
import {
  VocabFlashcardsWidget,
  DEFAULT_VOCAB_CONFIG,
  type VocabWidgetConfig,
} from '@/components/whiteboard/VocabFlashcardsWidget'
import {
  POSTaggerWidget,
  DEFAULT_POS_CONFIG,
  type POSWidgetConfig,
} from '@/components/whiteboard/POSTaggerWidget'
import {
  SentenceStructureWidget,
  DEFAULT_SENTENCE_CONFIG,
  type SentenceStructureWidgetConfig,
} from '@/components/whiteboard/SentenceStructureWidget'
import {
  PhonicsBuilderWidget,
  DEFAULT_PHONICS_CONFIG,
  type PhonicsWidgetConfig,
} from '@/components/whiteboard/PhonicsBuilderWidget'
import {
  SentenceExpansionWidget,
  DEFAULT_EXPANSION_CONFIG,
  type ExpansionWidgetConfig,
} from '@/components/whiteboard/SentenceExpansionWidget'
import {
  FigurativeLanguageWidget,
  DEFAULT_FIGLANG_CONFIG,
  type FigLangWidgetConfig,
} from '@/components/whiteboard/FigurativeLanguageWidget'
import {
  StoryElementsMapWidget,
  DEFAULT_STORY_MAP_CONFIG,
  type StoryMapWidgetConfig,
} from '@/components/whiteboard/StoryElementsMapWidget'
import {
  ParagraphOrganizerWidget,
  DEFAULT_PARAORG_CONFIG,
  type ParagraphOrganizerWidgetConfig,
} from '@/components/whiteboard/ParagraphOrganizerWidget'

// Phase 1 — Core tools
// Only lazy-load panel tools that don't have unified components
const ReadingPassageAnalyzerLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.ReadingPassageAnalyzer })))

// Phase 3 — Annotation tools
const WritingRubricLazy = lazy(() => import('./language/AnnotationUtilities').then(m => ({ default: m.WritingAnnotationRubric })))
const GrammarChecklistLazy = lazy(() => import('./language/AnnotationUtilities').then(m => ({ default: m.GrammarChecklist })))
const WritingPromptLazy = lazy(() => import('./language/AnnotationUtilities').then(m => ({ default: m.WritingPromptGenerator })))

// Phase 2 — Marketplace tools
const RootMorphologyExplorerLazy = lazy(() => import('./language/LanguagePhase2Utilities').then(m => ({ default: m.RootMorphologyExplorer })))
const ActivePassiveVoiceLazy = lazy(() => import('./language/LanguagePhase2Utilities').then(m => ({ default: m.ActivePassiveVoice })))
const ReadingComprehensionStrategiesLazy = lazy(() => import('./language/LanguagePhase2Utilities').then(m => ({ default: m.ReadingComprehensionStrategies })))
const GrammarErrorDiagnosticLazy = lazy(() => import('./language/LanguagePhase2Utilities').then(m => ({ default: m.GrammarErrorDiagnostic })))
const SpellingPatternsLazy = lazy(() => import('./language/LanguagePhase2Utilities').then(m => ({ default: m.SpellingPatterns })))

// Phase 4 — K-5 Interactive Manipulatives
const SoundWallBuilderLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.SoundWallBuilder })))
const DecodableTextReaderLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.DecodableTextReader })))
const SightWordOrthographicMapLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.SightWordOrthographicMap })))
// Phase 4 — 6-8 Reading & Writing
const DigitalAnnotationToolLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.DigitalAnnotationTool })))
const CitationGeneratorIntroLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.CitationGeneratorIntro })))
const PeerReviewChecklistLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.PeerReviewChecklist })))
// Phase 4 — 9-12 Composition & Analysis
const ThesisStatementBuilderLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.ThesisStatementBuilder })))
const CounterargumentBuilderLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.CounterargumentBuilder })))
const CloseReadingFrameworkLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.CloseReadingFramework })))
const EssayOutlineBuilderLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.EssayOutlineBuilder })))

// ============================================================
// Stable wrappers (prevent remount on re-render)
// ============================================================

function P1Panel({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}>{children}</Suspense>
}

function VocabularyFlashcardsPanel({ isDark }: { isDark: boolean }) {
  // Panel uses the SAME unified component as canvas, with local state
  const [config, setConfig] = useState<VocabWidgetConfig>({ ...DEFAULT_VOCAB_CONFIG })
  return (
    <>
      <P1Panel isDark={isDark}>
        <VocabFlashcardsWidget
          isDark={isDark}
          config={config}
          onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
          compact
        />
      </P1Panel>
      {/* Dynamic How It Works — references actual config state */}
      <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Mode: <b style={{ color: '#34d399' }}>{config.mode}</b> | Card {config.cardIndex + 1}</div>
        <div>Step 2: {!config.flipped ? 'Read the word, try to recall the meaning' : 'Flipped — check the definition'}</div>
        <div>Step 3: {!config.flipped ? 'Click card to flip and verify' : 'Were you right? Click Next to continue'}</div>
        <div>Step 4: Level: {config.filterLevel} | {config.filterPos.length} POS filter{config.filterPos.length !== 1 ? 's' : ''}</div>
        <div>Step 5: Use the word in your own sentence to remember it</div>
      </div>
      <div style={{ padding: '6px 8px', margin: '0 12px 12px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Vocabulary builds through exposure, not memorization. Learn word parts (prefix/root/suffix). Read widely — context is how the brain learns best. Spaced repetition strengthens memory.
      </div>
    </>
  )
}
function ReadingPassageAnalyzerPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel isDark={isDark}><ReadingPassageAnalyzerLazy isDark={isDark} /></P1Panel>
}
function StoryElementsMapPanel({ isDark }: { isDark: boolean }) {
  const [config, setConfig] = useState<StoryMapWidgetConfig>({ ...DEFAULT_STORY_MAP_CONFIG })
  return (
    <>
      <P1Panel isDark={isDark}>
        <StoryElementsMapWidget
          isDark={isDark}
          config={config}
          onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
          compact
        />
      </P1Panel>
      {/* Dynamic How It Works — references actual config state */}
      <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Exercise {config.currentIndex + 1} | Mode: <b style={{ color: '#34d399' }}>{config.mode}</b></div>
        <div>Step 2: {config.selected !== null ? 'Answer selected — click Check' : 'Click an answer choice'}</div>
        <div>Step 3: {config.checked ? 'Checked — see result' : 'Click Check to verify'}</div>
        <div>Step 4: Score: <b style={{ color: '#34d399' }}>{config.score}</b>/{config.totalAttempted}</div>
        <div>Step 5: Theme — what is the message or lesson?</div>
      </div>
      <div style={{ padding: '6px 8px', margin: '0 12px 12px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Every story has: characters (who), setting (where/when), plot (what happens), conflict (the problem), theme (the message). Map these to understand HOW the author constructed the story.
      </div>
    </>
  )
}
function SentenceStructureBuilderPanel({ isDark }: { isDark: boolean }) {
  const [config, setConfig] = useState<SentenceStructureWidgetConfig>({ ...DEFAULT_SENTENCE_CONFIG })
  return (
    <>
      <P1Panel isDark={isDark}>
        <SentenceStructureWidget
          isDark={isDark}
          config={config}
          onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
          compact
        />
      </P1Panel>
      {/* Dynamic How It Works — references actual config state */}
      <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Exercise {config.currentIndex + 1} | Mode: <b style={{ color: '#34d399' }}>{config.mode}</b></div>
        <div>Step 2: {config.selected !== null ? 'Answer selected' : 'Click an answer'}</div>
        <div>Step 3: {config.checked ? 'Checked — see result' : 'Click Check to verify'}</div>
        <div>Step 4: Score: <b style={{ color: '#34d399' }}>{config.score}</b>/{config.totalAttempted}</div>
        <div>Step 5: One independent = Simple; two + FANBOYS = Compound</div>
      </div>
      <div style={{ padding: '6px 8px', margin: '0 12px 12px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> A sentence = subject + predicate. One independent clause = Simple. Two + FANBOYS = Compound. Independent + dependent = Complex. Good writers mix all types for variety.
      </div>
    </>
  )
}
function FigurativeLanguageFinderPanel({ isDark }: { isDark: boolean }) {
  const [config, setConfig] = useState<FigLangWidgetConfig>({ ...DEFAULT_FIGLANG_CONFIG })
  return (
    <>
      <P1Panel isDark={isDark}>
        <FigurativeLanguageWidget
          isDark={isDark}
          config={config}
          onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
          compact
        />
      </P1Panel>
      {/* Dynamic How It Works — references actual config state */}
      <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Exercise {config.currentIndex + 1} | Mode: <b style={{ color: '#34d399' }}>{config.mode}</b></div>
        <div>Step 2: {config.selected !== null ? 'Answer selected' : 'Click an answer'}</div>
        <div>Step 3: {config.checked ? 'Checked — see result' : 'Click Check to verify'}</div>
        <div>Step 4: Score: <b style={{ color: '#34d399' }}>{config.score}</b>/{config.totalAttempted}</div>
        <div>Step 5: Word sounds like its meaning (buzz)? → ONOMATOPOEIA</div>
      </div>
      <div style={{ padding: '6px 8px', margin: '0 12px 12px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Figurative language creates vivid images. Simile (like/as), Metaphor (is), Personification (human qualities), Hyperbole (exaggeration). Identification: look for signal words, then check if comparison/exaggeration is happening.
      </div>
    </>
  )
}
function PhonicsDecodingBuilderPanel({ isDark }: { isDark: boolean }) {
  const [config, setConfig] = useState<PhonicsWidgetConfig>({ ...DEFAULT_PHONICS_CONFIG })
  return (
    <>
      <P1Panel isDark={isDark}>
        <PhonicsBuilderWidget
          isDark={isDark}
          config={config}
          onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
          compact
        />
      </P1Panel>
      {/* Dynamic How It Works — references actual config state */}
      <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Exercise {config.currentIndex + 1} | Mode: <b style={{ color: '#34d399' }}>{config.mode}</b></div>
        <div>Step 2: {config.selected !== null ? 'Answer selected — click Check' : 'Click an answer choice'}</div>
        <div>Step 3: {config.checked ? 'Checked — see if you were right' : 'Click Check to verify your answer'}</div>
        <div>Step 4: Score: <b style={{ color: '#34d399' }}>{config.score}</b>/{config.totalAttempted}</div>
        <div>Step 5: Sound out each syllable left to right</div>
      </div>
      <div style={{ padding: '6px 8px', margin: '0 12px 12px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> English spelling follows patterns, not random rules. Digraphs (sh, ch) = one sound. Blends (st, bl) = two sounds. Silent letters (kn, wr) = written but not spoken. Teach the pattern, not each word.
      </div>
    </>
  )
}
function PartsOfSpeechTaggerPanel({ isDark }: { isDark: boolean }) {
  // Panel uses the SAME unified component as canvas, with local state
  const [config, setConfig] = useState<POSWidgetConfig>({ ...DEFAULT_POS_CONFIG })
  return (
    <>
      <P1Panel isDark={isDark}>
        <POSTaggerWidget
          isDark={isDark}
          config={config}
          onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
          compact
        />
      </P1Panel>
      {/* Dynamic How It Works — references actual config state */}
      <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Sentence: "{config.sentence.substring(0, 40)}{config.sentence.length > 40 ? '...' : ''}"</div>
        <div>Step 2: Tagged: <b style={{ color: '#34d399' }}>{config.tagged.length}</b> words</div>
        <div>Step 3: {config.selectedIdx !== null ? 'Selected: ' + (config.tagged[config.selectedIdx]?.text ?? '') + ' → ' + (config.tagged[config.selectedIdx]?.pos ?? '') : 'Click a word to see its part of speech'}</div>
        <div>Step 4: Mode: {config.advanced ? 'Advanced' : 'Basic'} tagging</div>
        <div>Step 5: Replaces a noun (he, she, it)? → PRONOUN</div>
        <div>Step 6: Shows relationship (in, on, under)? → PREPOSITION</div>
      </div>
      <div style={{ padding: '6px 8px', margin: '0 12px 12px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Don't memorize word lists — use test questions. "The" before a word → likely noun. Takes "-ed" → likely verb. Answers "what kind?" → likely adjective. Context matters — "run" can be both!
      </div>
    </>
  )
}
function SentenceExpansionToolPanel({ isDark }: { isDark: boolean }) {
  const [config, setConfig] = useState<ExpansionWidgetConfig>({ ...DEFAULT_EXPANSION_CONFIG })
  return (
    <>
      <P1Panel isDark={isDark}>
        <SentenceExpansionWidget
          isDark={isDark}
          config={config}
          onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
          compact
        />
      </P1Panel>
      {/* Dynamic How It Works — references actual config state */}
      <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Exercise {config.currentIndex + 1} | Mode: <b style={{ color: '#34d399' }}>{config.mode}</b></div>
        <div>Step 2: {config.selected !== null ? 'Answer selected' : 'Click an answer'}</div>
        <div>Step 3: {config.checked ? 'Checked — see result' : 'Click Check to verify'}</div>
        <div>Step 4: Score: <b style={{ color: '#34d399' }}>{config.score}</b>/{config.totalAttempted}</div>
        <div>Step 5: Check: does each addition add meaning or just clutter?</div>
      </div>
      <div style={{ padding: '6px 8px', margin: '0 12px 12px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Expand by adding: adjectives (what kind), adverbs (how), phrases (where/when). "Dog ran" → "The excited dog ran quickly across the park." Each addition should add meaning, not clutter.
      </div>
    </>
  )
}
function PunctuationInteractivePanel({ isDark }: { isDark: boolean }) {
  // Panel uses the SAME unified component as canvas, with local state
  const [config, setConfig] = useState<PunctWidgetConfig>({ ...DEFAULT_PUNCT_CONFIG })
  return (
    <>
      <P1Panel isDark={isDark}>
        <PunctuationPracticeWidget
          isDark={isDark}
          config={config}
          onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
          compact
        />
      </P1Panel>
      {/* Dynamic How It Works — references actual config state */}
      <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Exercise {config.currentIndex + 1} | Mode: <b style={{ color: '#34d399' }}>{config.mode}</b></div>
        <div>Step 2: {config.selected !== null ? 'Answer selected — click Check' : 'Click an answer choice'}</div>
        <div>Step 3: {config.checked ? 'Checked — see result' : 'Click Check to verify'}</div>
        <div>Step 4: Score: <b style={{ color: '#34d399' }}>{config.score}</b>/{config.totalAttempted}</div>
        <div>Step 5: Two complete sentences? → Semicolon (;)</div>
        <div>Step 6: Possession or contraction? → Apostrophe (')</div>
      </div>
      <div style={{ padding: '6px 8px', margin: '0 12px 12px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Punctuation follows rules, not pauses. Each mark has a specific job: period = complete thought, comma = separates, semicolon = joins related sentences, apostrophe = possession/contraction.
      </div>
    </>
  )
}
function ParagraphOrganizerPanel({ isDark }: { isDark: boolean }) {
  const [config, setConfig] = useState<ParagraphOrganizerWidgetConfig>({ ...DEFAULT_PARAORG_CONFIG })
  return (
    <>
      <P1Panel isDark={isDark}>
        <ParagraphOrganizerWidget
          isDark={isDark}
          config={config}
          onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
          compact
        />
      </P1Panel>
      {/* Dynamic How It Works — references actual config state */}
      <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Exercise {config.currentIndex + 1} | Mode: <b style={{ color: '#34d399' }}>{config.mode}</b></div>
        <div>Step 2: {config.selectedOrder.length > 0 ? config.selectedOrder.length + ' step' + (config.selectedOrder.length !== 1 ? 's' : '') + ' ordered' : 'Click steps in order'}</div>
        <div>Step 3: {config.checked ? 'Checked — see result' : 'Click Check to verify'}</div>
        <div>Step 4: Score: <b style={{ color: '#34d399' }}>{config.score}</b>/{config.totalAttempted}</div>
        <div>Step 5: Conclude — restate or extend the main idea</div>
      </div>
      <div style={{ padding: '6px 8px', margin: '0 12px 12px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> A paragraph = topic sentence + evidence + explanation + conclusion. Like a mini-essay: introduce, prove, explain, wrap up. Every sentence must serve the topic — if it doesn't, cut it.
      </div>
    </>
  )
}

// Phase 2 wrappers
function RootMorphologyExplorerPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel isDark={isDark}><RootMorphologyExplorerLazy isDark={isDark} /></P1Panel>
}
function ActivePassiveVoicePanel({ isDark }: { isDark: boolean }) {
  return <P1Panel isDark={isDark}><ActivePassiveVoiceLazy isDark={isDark} /></P1Panel>
}
function ReadingComprehensionStrategiesPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel isDark={isDark}><ReadingComprehensionStrategiesLazy isDark={isDark} /></P1Panel>
}
function GrammarErrorDiagnosticPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel isDark={isDark}><GrammarErrorDiagnosticLazy isDark={isDark} /></P1Panel>
}
function SpellingPatternsPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel isDark={isDark}><SpellingPatternsLazy isDark={isDark} /></P1Panel>
}

// Phase 4 wrappers — K-5
function SoundWallBuilderPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel isDark={isDark}><SoundWallBuilderLazy isDark={isDark} /></P1Panel>
}
function DecodableTextReaderPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel isDark={isDark}><DecodableTextReaderLazy isDark={isDark} /></P1Panel>
}
function SightWordOrthographicMapPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel isDark={isDark}><SightWordOrthographicMapLazy isDark={isDark} /></P1Panel>
}
// Phase 4 wrappers — 6-8
function DigitalAnnotationToolPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel isDark={isDark}><DigitalAnnotationToolLazy isDark={isDark} /></P1Panel>
}
function CitationGeneratorIntroPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel isDark={isDark}><CitationGeneratorIntroLazy isDark={isDark} /></P1Panel>
}
function PeerReviewChecklistPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel isDark={isDark}><PeerReviewChecklistLazy isDark={isDark} /></P1Panel>
}
// Phase 4 wrappers — 9-12
function ThesisStatementBuilderPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel isDark={isDark}><ThesisStatementBuilderLazy isDark={isDark} /></P1Panel>
}
function CounterargumentBuilderPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel isDark={isDark}><CounterargumentBuilderLazy isDark={isDark} /></P1Panel>
}
function CloseReadingFrameworkPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel isDark={isDark}><CloseReadingFrameworkLazy isDark={isDark} /></P1Panel>
}
function EssayOutlineBuilderPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel isDark={isDark}><EssayOutlineBuilderLazy isDark={isDark} /></P1Panel>
}

// ============================================================
// Types & Constants
// ============================================================

type GradeBand = 'all' | 'k5' | '68' | '912'

interface LanguageToolkitProps {
  roomId: string
}

const GRADE_BANDS: { id: GradeBand; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '#' },
  { id: 'k5', label: 'K-5', icon: '*' },
  { id: '68', label: '6-8', icon: '^' },
  { id: '912', label: '9-12', icon: '!' },
]

// Phase 2 tool IDs and their grade eligibility
const PHASE2_TOOLS: { id: string; label: string; gradeBands: GradeBand[] }[] = [
  { id: 'lang-root-morphology', label: 'Root & Morphology Explorer', gradeBands: ['68', '912', 'all'] },
  { id: 'lang-active-passive', label: 'Active & Passive Voice', gradeBands: ['68', '912', 'all'] },
  { id: 'lang-reading-strategies', label: 'Reading Comprehension Strategies', gradeBands: ['68', '912', 'all'] },
  { id: 'lang-grammar-diagnostic', label: 'Grammar Error Diagnostic', gradeBands: ['68', '912', 'all'] },
  { id: 'lang-spelling-patterns', label: 'Spelling Patterns', gradeBands: ['k5', '68', 'all'] },
]

// ============================================================
// Component
// ============================================================

export function LanguageToolkit({ roomId: _roomId }: LanguageToolkitProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const installedTools = useWidgetStore((s) => s.installedTools)
  const addElement = useWhiteboardStore((s) => s.addElement)
  const camera = useWhiteboardStore((s) => s.camera)

  const [activeBand, setActiveBand] = useState<GradeBand>('all')

  // ---- Fix #4/#6/#24/#25: search + favorites + recents ----
  const TOOLKIT_NAME = 'language'
  const containerRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { favorites, isFavorite, toggleFavorite } = useFavorites(TOOLKIT_NAME)
  const { recent, addRecent } = useRecentWidgets(TOOLKIT_NAME)

  const addToBoard = useCallback((widgetKind: string) => {
    const size = getWidgetDefaultSize(widgetKind)
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    const cx = (vw / 2 - camera.x) / camera.zoom
    const cy = ((vh / 2 - 44) - camera.y) / camera.zoom
    const el: WidgetElement = {
      id: generateId(),
      type: 'widget',
      widgetKind,
      config: getDefaultWidgetConfig(widgetKind),
      x: cx - size.width / 2,
      y: cy - size.height / 2,
      width: size.width,
      height: size.height,
      rotation: 0,
      opacity: 1,
      strokeColor: isDark ? '#334155' : '#e2e8f0',
      fillColor: isDark ? '#0f172a' : '#ffffff',
      strokeWidth: 1,
      locked: false,
      pageIndex: 0,
    }
    addElement(el)
  }, [addElement, camera, isDark])

  // Wrap addToBoard so we also record the widget in the recents list (Fix #24)
  const handleAddToBoard = useCallback((widgetKind: string, title: string) => {
    addToBoard(widgetKind)
    addRecent({ id: widgetKind, title, toolkit: TOOLKIT_NAME })
  }, [addToBoard, addRecent])
  const [visibleBands, setVisibleBands] = useState<Set<GradeBand>>(new Set(['all', 'k5', '68', '912']))

  const toggleBand = (band: GradeBand) => {
    setVisibleBands(prev => {
      const next = new Set(prev)
      if (next.has(band)) next.delete(band)
      else next.add(band)
      return next
    })
  }

  // Determine which Phase 2 tools are installed AND visible for current band
  const visibleP2 = PHASE2_TOOLS.filter(t =>
    installedTools.has(t.id) && t.gradeBands.includes(activeBand)
  )

  // ---- Style helpers ----
  const dkBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const dkBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const dkText = isDark ? '#94a3b8' : '#475569'
  const actBg = 'rgba(5,150,105,0.15)'
  const actBorder = 'rgba(5,150,105,0.3)'
  const actText = '#34d399'

  const sectionTitle = (text: string, isMarketplace = false, widgetKind?: string) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 12 }} data-search-title={text.toLowerCase()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className={'toolkit-section-title' + (isDark ? '' : ' toolkit-section-title-light')}>{text}</div>
        {isMarketplace && (
          <span style={{
            fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
            background: 'rgba(168,85,247,0.15)', color: '#c084fc',
            border: '1px solid rgba(168,85,247,0.25)', textTransform: 'uppercase', letterSpacing: 0.5,
          }}>PRO</span>
        )}
      </div>
      {widgetKind && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => toggleFavorite({ id: widgetKind, title: text, toolkit: TOOLKIT_NAME })}
            style={{
              padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600,
              background: isFavorite(widgetKind) ? 'rgba(251,191,36,0.15)' : 'transparent',
              border: isFavorite(widgetKind) ? '1px solid rgba(251,191,36,0.3)' : '1px solid ' + dkBorder,
              color: isFavorite(widgetKind) ? '#fbbf24' : dkText,
              cursor: 'pointer', lineHeight: 1,
            }}
            title={isFavorite(widgetKind) ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={isFavorite(widgetKind) ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite(widgetKind) ? '⭐' : '☆'}
          </button>
          <button
            onClick={() => handleAddToBoard(widgetKind, text)}
            style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600,
              background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)',
              color: '#34d399', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
            title={'Place ' + (WIDGET_KIND_LABELS[widgetKind] || widgetKind) + ' on the board'}
          >
            + Add to Board
          </button>
        </div>
      )}
    </div>
  )

  // Phase 2 component renderers
  const renderP2Tool = (toolId: string, label: string) => {
    switch (toolId) {
      case 'lang-root-morphology': return <div style={{ padding: '0 12px 12px' }}><RootMorphologyExplorerPanel isDark={isDark} /></div>
      case 'lang-active-passive': return <div style={{ padding: '0 12px 12px' }}><ActivePassiveVoicePanel isDark={isDark} /></div>
      case 'lang-reading-strategies': return <div style={{ padding: '0 12px 12px' }}><ReadingComprehensionStrategiesPanel isDark={isDark} /></div>
      case 'lang-grammar-diagnostic': return <div style={{ padding: '0 12px 12px' }}><GrammarErrorDiagnosticPanel isDark={isDark} /></div>
      case 'lang-spelling-patterns': return <div style={{ padding: '0 12px 12px' }}><SpellingPatternsPanel isDark={isDark} /></div>
      default: return null
    }
  }

  return (
    <div ref={containerRef} className="widget-content toolkit-language" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
      {/* ---- Fix #24/#25: Favorites + Recently Used ---- */}
      <FavoritesAndRecent
        isDark={isDark}
        favorites={favorites}
        recent={recent}
        onSelect={(wk, title) => handleAddToBoard(wk, title)}
        onRemoveFavorite={(id) => toggleFavorite({ id, title: '', toolkit: TOOLKIT_NAME })}
        onClearRecent={() => {
          if (typeof window === 'undefined') return
          try {
            const raw = window.localStorage.getItem('superboard_recent_widgets')
            if (raw) {
              const all = JSON.parse(raw)
              const next = all.filter((e: { id: string; title: string; toolkit: string }) => e.toolkit !== TOOLKIT_NAME)
              window.localStorage.setItem('superboard_recent_widgets', JSON.stringify(next))
              window.dispatchEvent(new Event('superboard-recent-changed'))
            }
          } catch { /* ignore */ }
        }}
      />

      {/* ---- Fix #4/#6: Search Bar ---- */}
      <WidgetSearchBar
        isDark={isDark}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        containerRef={containerRef}
      />

      {/* ---- Grade Band Tabs ---- */}
      <div style={{ display: 'flex', gap: 2, padding: '8px 12px 4px', flexWrap: 'wrap' }}>
        {GRADE_BANDS.filter(b => b.id === 'all' || visibleBands.has(b.id)).map((band) => {
          const active = activeBand === band.id
          return (
            <button key={band.id} onClick={() => setActiveBand(band.id)}
              style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: active ? 700 : 500, background: active ? actBg : dkBg, border: active ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: active ? actText : dkText, cursor: 'pointer', flex: '1 1 auto', textAlign: 'center' as const, minWidth: 0 }}>
              {band.icon} {band.label}
            </button>
          )
        })}
      </div>

      {/* ---- Band Visibility Toggles ---- */}
      <div style={{ display: 'flex', gap: 4, padding: '2px 12px 8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, opacity: 0.6 }}>Show:</span>
        {GRADE_BANDS.filter(b => b.id !== 'all').map((band) => (
          <label key={band.id} style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', fontSize: 10, color: dkText }}>
            <input type="checkbox" checked={visibleBands.has(band.id)} onChange={() => toggleBand(band.id)} style={{ width: 12, height: 12, cursor: 'pointer' }} />
            {band.label}
          </label>
        ))}
      </div>

      {/* ============================================================ */}
      {/* ALL TAB — Grouped by skill level, curated */}
      {/* ============================================================ */}
      {activeBand === 'all' && (
        <>
          {/* --- Foundation Skills --- */}
          <div style={{ padding: '6px 12px 2px', fontSize: 10, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Foundation Skills
          </div>
          <div className="toolkit-section">
            {sectionTitle('Phonics & Decoding', false, 'lang-phonics')}
            <div style={{ padding: '0 12px 12px' }}><PhonicsDecodingBuilderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Vocabulary Flashcards', false, 'lang-vocab-flashcards')}
            <div style={{ padding: '0 12px 12px' }}><VocabularyFlashcardsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Punctuation Practice', false, 'lang-punctuation')}
            <div style={{ padding: '0 12px 12px' }}><PunctuationInteractivePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Sight Word Bank', false, 'lang-sight-words')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('CVC Word Sort', false, 'lang-cvc-sort')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Fluency Timer', false, 'lang-fluency-timer')}
          </div>

          {/* --- Sentence Level --- */}
          <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Sentence Level
          </div>
          <div className="toolkit-section">
            {sectionTitle('Parts of Speech Tagger', false, 'lang-pos-tagger')}
            <div style={{ padding: '0 12px 12px' }}><PartsOfSpeechTaggerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Sentence Structure', false, 'lang-sentence-structure')}
            <div style={{ padding: '0 12px 12px' }}><SentenceStructureBuilderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Sentence Expansion', false, 'lang-sentence-expansion')}
            <div style={{ padding: '0 12px 12px' }}><SentenceExpansionToolPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Semicolon & Advanced Punctuation', false, 'lang-semicolon-punct')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Context Clues Explorer', false, 'lang-context-clues-exp')}
          </div>

          {/* --- Text Level --- */}
          <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Text Level
          </div>
          <div className="toolkit-section">
            {sectionTitle('Figurative Language', false, 'lang-figurative-language')}
            <div style={{ padding: '0 12px 12px' }}><FigurativeLanguageFinderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Paragraph Organizer', false, 'lang-paragraph-organizer')}
            <div style={{ padding: '0 12px 12px' }}><ParagraphOrganizerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Story Elements Map', false, 'lang-story-elements')}
            <div style={{ padding: '0 12px 12px' }}><StoryElementsMapPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Reading Passage Analyzer', false, 'lang-reading-analyzer')}
            <div style={{ padding: '0 12px 12px' }}><ReadingPassageAnalyzerPanel isDark={isDark} /></div>
            <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div>
              <div>Step 1: Read for literal meaning — what does it say?</div>

            <div style={{ padding: '6px 8px', margin: '0 12px 12px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
              💡 <b>Insight:</b> Good readers are metacognitive: they predict, question, clarify, and summarize WHILE reading. Start with literal (what it says), then inferential (what it means), then evaluative (is it good). Don't skip to evaluation.
            </div>
              <div>Step 2: Infer — what does it imply between the lines?</div>
              <div>Step 3: Evaluate — is the argument valid?</div>
              <div>Step 4: Identify the author's purpose</div>
              <div>Step 5: Find main idea and supporting details</div>
            </div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Text Evidence Highlighter', false, 'lang-text-evidence')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Argumentative Writing Organizer', false, 'lang-argument-organizer')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Rhetorical Analysis Framework', false, 'lang-rhetorical-analysis')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Logical Fallacies Reference', false, 'lang-logical-fallacies')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('MLA/APA Citation Generator', false, 'lang-citation-gen')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Essay Outline Builder', false, 'lang-essay-outline')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Text-to-Speech Preview', false, 'lang-tts-preview')}
          </div>

          {/* --- Phase 4 Tools (K-5 / 6-8 / 9-12 grouped) --- */}
          <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            K-5 Interactive Manipulatives
          </div>
          <div className="toolkit-section">
            {sectionTitle('Sound Wall Builder', false, 'lang-sound-wall')}
            <div style={{ padding: '0 12px 12px' }}><SoundWallBuilderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Decodable Text Reader', false, 'lang-decodable-reader')}
            <div style={{ padding: '0 12px 12px' }}><DecodableTextReaderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Sight Word Orthographic Map', false, 'lang-sight-word-ortho')}
            <div style={{ padding: '0 12px 12px' }}><SightWordOrthographicMapPanel isDark={isDark} /></div>
          </div>
          <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            6-8 Reading & Writing
          </div>
          <div className="toolkit-section">
            {sectionTitle('Digital Annotation Tool', false, 'lang-digital-annotation')}
            <div style={{ padding: '0 12px 12px' }}><DigitalAnnotationToolPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Citation Generator (Intro)', false, 'lang-citation-intro')}
            <div style={{ padding: '0 12px 12px' }}><CitationGeneratorIntroPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Peer Review Checklist', false, 'lang-peer-review')}
            <div style={{ padding: '0 12px 12px' }}><PeerReviewChecklistPanel isDark={isDark} /></div>
          </div>
          <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            9-12 Composition & Analysis
          </div>
          <div className="toolkit-section">
            {sectionTitle('Thesis Statement Builder', false, 'lang-thesis-builder')}
            <div style={{ padding: '0 12px 12px' }}><ThesisStatementBuilderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Counterargument Builder', false, 'lang-counterargument')}
            <div style={{ padding: '0 12px 12px' }}><CounterargumentBuilderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Close Reading Framework (TP-CASTT)', false, 'lang-close-reading')}
            <div style={{ padding: '0 12px 12px' }}><CloseReadingFrameworkPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Essay Outline Builder (5-Paragraph)', false, 'lang-essay-outline-builder')}
            <div style={{ padding: '0 12px 12px' }}><EssayOutlineBuilderPanel isDark={isDark} /></div>
          </div>

          {/* Phase 2: Marketplace (installed only) */}
          {visibleP2.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Marketplace Tools
              </div>
              {visibleP2.map(tool => (
                <div key={tool.id} className="toolkit-section">
                  {sectionTitle(tool.label, true, tool.id)}
                  {renderP2Tool(tool.id, tool.label)}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* K-5 TAB — Curated: only foundational tools */}
      {/* ============================================================ */}
      {activeBand === 'k5' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Phonics & Decoding', false, 'lang-phonics')}
            <div style={{ padding: '0 12px 12px' }}><PhonicsDecodingBuilderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Vocabulary Flashcards', false, 'lang-vocab-flashcards')}
            <div style={{ padding: '0 12px 12px' }}><VocabularyFlashcardsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Punctuation Practice', false, 'lang-punctuation')}
            <div style={{ padding: '0 12px 12px' }}><PunctuationInteractivePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Story Elements Map', false, 'lang-story-elements')}
            <div style={{ padding: '0 12px 12px' }}><StoryElementsMapPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Sight Word Bank', false, 'lang-sight-words')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('CVC Word Sort', false, 'lang-cvc-sort')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Fluency Timer', false, 'lang-fluency-timer')}
          </div>

          {/* --- K-5 Interactive Manipulatives (Phase 4) --- */}
          <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            K-5 Interactive Manipulatives
          </div>
          <div className="toolkit-section">
            {sectionTitle('Sound Wall Builder', false, 'lang-sound-wall')}
            <div style={{ padding: '0 12px 12px' }}><SoundWallBuilderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Decodable Text Reader', false, 'lang-decodable-reader')}
            <div style={{ padding: '0 12px 12px' }}><DecodableTextReaderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Sight Word Orthographic Map', false, 'lang-sight-word-ortho')}
            <div style={{ padding: '0 12px 12px' }}><SightWordOrthographicMapPanel isDark={isDark} /></div>
          </div>
          {visibleP2.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: 0.8 }}>Marketplace Tools</div>
              {visibleP2.map(tool => (
                <div key={tool.id} className="toolkit-section">
                  {sectionTitle(tool.label, true, tool.id)}
                  {renderP2Tool(tool.id, tool.label)}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* 6-8 TAB — Curated: sentence-level focus */}
      {/* ============================================================ */}
      {activeBand === '68' && (
        <>
          <div style={{ padding: '6px 12px 2px', fontSize: 10, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 0.8 }}>Word & Sentence</div>
          <div className="toolkit-section">
            {sectionTitle('Parts of Speech Tagger', false, 'lang-pos-tagger')}
            <div style={{ padding: '0 12px 12px' }}><PartsOfSpeechTaggerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Sentence Structure', false, 'lang-sentence-structure')}
            <div style={{ padding: '0 12px 12px' }}><SentenceStructureBuilderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Sentence Expansion', false, 'lang-sentence-expansion')}
            <div style={{ padding: '0 12px 12px' }}><SentenceExpansionToolPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Semicolon & Advanced Punctuation', false, 'lang-semicolon-punct')}
          </div>
          <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: 0.8 }}>Text & Vocabulary</div>
          <div className="toolkit-section">
            {sectionTitle('Vocabulary Flashcards', false, 'lang-vocab-flashcards')}
            <div style={{ padding: '0 12px 12px' }}><VocabularyFlashcardsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Punctuation Practice', false, 'lang-punctuation')}
            <div style={{ padding: '0 12px 12px' }}><PunctuationInteractivePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Paragraph Organizer', false, 'lang-paragraph-organizer')}
            <div style={{ padding: '0 12px 12px' }}><ParagraphOrganizerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Figurative Language', false, 'lang-figurative-language')}
            <div style={{ padding: '0 12px 12px' }}><FigurativeLanguageFinderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Context Clues Explorer', false, 'lang-context-clues-exp')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Text Evidence Highlighter', false, 'lang-text-evidence')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Argumentative Writing Organizer', false, 'lang-argument-organizer')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Text-to-Speech Preview', false, 'lang-tts-preview')}
          </div>

          {/* --- 6-8 Reading & Writing (Phase 4) --- */}
          <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            6-8 Reading & Writing
          </div>
          <div className="toolkit-section">
            {sectionTitle('Digital Annotation Tool', false, 'lang-digital-annotation')}
            <div style={{ padding: '0 12px 12px' }}><DigitalAnnotationToolPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Citation Generator (Intro)', false, 'lang-citation-intro')}
            <div style={{ padding: '0 12px 12px' }}><CitationGeneratorIntroPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Peer Review Checklist', false, 'lang-peer-review')}
            <div style={{ padding: '0 12px 12px' }}><PeerReviewChecklistPanel isDark={isDark} /></div>
          </div>
          {visibleP2.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: 0.8 }}>Marketplace Tools</div>
              {visibleP2.map(tool => (
                <div key={tool.id} className="toolkit-section">
                  {sectionTitle(tool.label, true, tool.id)}
                  {renderP2Tool(tool.id, tool.label)}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* 9-12 TAB — Curated: text-level analysis & composition */}
      {/* ============================================================ */}
      {activeBand === '912' && (
        <>
          <div style={{ padding: '6px 12px 2px', fontSize: 10, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 0.8 }}>Analysis</div>
          <div className="toolkit-section">
            {sectionTitle('Parts of Speech Tagger', false, 'lang-pos-tagger')}
            <div style={{ padding: '0 12px 12px' }}><PartsOfSpeechTaggerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Figurative Language', false, 'lang-figurative-language')}
            <div style={{ padding: '0 12px 12px' }}><FigurativeLanguageFinderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Rhetorical Analysis Framework', false, 'lang-rhetorical-analysis')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Logical Fallacies Reference', false, 'lang-logical-fallacies')}
          </div>
          <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 0.8 }}>Composition</div>
          <div className="toolkit-section">
            {sectionTitle('Sentence Expansion', false, 'lang-sentence-expansion')}
            <div style={{ padding: '0 12px 12px' }}><SentenceExpansionToolPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Paragraph Organizer', false, 'lang-paragraph-organizer')}
            <div style={{ padding: '0 12px 12px' }}><ParagraphOrganizerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Vocabulary Flashcards', false, 'lang-vocab-flashcards')}
            <div style={{ padding: '0 12px 12px' }}><VocabularyFlashcardsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Reading Passage Analyzer', false, 'lang-reading-analyzer')}
            <div style={{ padding: '0 12px 12px' }}><ReadingPassageAnalyzerPanel isDark={isDark} /></div>
            <div style={{ padding: '6px 8px', margin: '0 12px 4px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + dkBorder, color: isDark ? '#e2e8f0' : '#1e293b' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: dkText, marginBottom: 3 }}>How It Works</div>
              <div>Step 1: Read for literal meaning — what does it say?</div>
              <div>Step 2: Infer — what does it imply between the lines?</div>
              <div>Step 3: Evaluate — is the argument valid?</div>
              <div>Step 4: Identify the author's purpose</div>
              <div>Step 5: Find main idea and supporting details</div>
            </div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Semicolon & Advanced Punctuation', false, 'lang-semicolon-punct')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Argumentative Writing Organizer', false, 'lang-argument-organizer')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Essay Outline Builder', false, 'lang-essay-outline')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('MLA/APA Citation Generator', false, 'lang-citation-gen')}
          </div>
          <div className="toolkit-section">
            {sectionTitle('Text-to-Speech Preview', false, 'lang-tts-preview')}
          </div>

          {/* --- 9-12 Composition & Analysis (Phase 4) --- */}
          <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            9-12 Composition & Analysis
          </div>
          <div className="toolkit-section">
            {sectionTitle('Thesis Statement Builder', false, 'lang-thesis-builder')}
            <div style={{ padding: '0 12px 12px' }}><ThesisStatementBuilderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Counterargument Builder', false, 'lang-counterargument')}
            <div style={{ padding: '0 12px 12px' }}><CounterargumentBuilderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Close Reading Framework (TP-CASTT)', false, 'lang-close-reading')}
            <div style={{ padding: '0 12px 12px' }}><CloseReadingFrameworkPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Essay Outline Builder (5-Paragraph)', false, 'lang-essay-outline-builder')}
            <div style={{ padding: '0 12px 12px' }}><EssayOutlineBuilderPanel isDark={isDark} /></div>
          </div>
          {visibleP2.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <div style={{ padding: '10px 12px 2px', fontSize: 10, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: 0.8 }}>Marketplace Tools</div>
              {visibleP2.map(tool => (
                <div key={tool.id} className="toolkit-section">
                  {sectionTitle(tool.label, true, tool.id)}
                  {renderP2Tool(tool.id, tool.label)}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}