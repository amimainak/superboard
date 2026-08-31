'use client'

import { useState, lazy, Suspense, useCallback } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { useWidgetStore } from '@/lib/room/widget-store'
import { getDefaultWidgetConfig, getWidgetDefaultSize, WIDGET_KIND_LABELS } from '@/components/whiteboard/CanvasWidgets'
import { generateId } from '@/lib/whiteboard/utils'
import type { WidgetElement } from '@/lib/whiteboard/types'
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

// ============================================================
// Stable wrappers (prevent remount on re-render)
// ============================================================

function P1Panel({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}

function VocabularyFlashcardsPanel({ isDark }: { isDark: boolean }) {
  // Panel uses the SAME unified component as canvas, with local state
  const [config, setConfig] = useState<VocabWidgetConfig>({ ...DEFAULT_VOCAB_CONFIG })
  return (
    <P1Panel>
      <VocabFlashcardsWidget
        isDark={isDark}
        config={config}
        onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
        compact
      />
    </P1Panel>
  )
}
function ReadingPassageAnalyzerPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel><ReadingPassageAnalyzerLazy isDark={isDark} /></P1Panel>
}
function StoryElementsMapPanel({ isDark }: { isDark: boolean }) {
  const [config, setConfig] = useState<StoryMapWidgetConfig>({ ...DEFAULT_STORY_MAP_CONFIG })
  return (
    <P1Panel>
      <StoryElementsMapWidget
        isDark={isDark}
        config={config}
        onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
        compact
      />
    </P1Panel>
  )
}
function SentenceStructureBuilderPanel({ isDark }: { isDark: boolean }) {
  const [config, setConfig] = useState<SentenceStructureWidgetConfig>({ ...DEFAULT_SENTENCE_CONFIG })
  return (
    <P1Panel>
      <SentenceStructureWidget
        isDark={isDark}
        config={config}
        onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
        compact
      />
    </P1Panel>
  )
}
function FigurativeLanguageFinderPanel({ isDark }: { isDark: boolean }) {
  const [config, setConfig] = useState<FigLangWidgetConfig>({ ...DEFAULT_FIGLANG_CONFIG })
  return (
    <P1Panel>
      <FigurativeLanguageWidget
        isDark={isDark}
        config={config}
        onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
        compact
      />
    </P1Panel>
  )
}
function PhonicsDecodingBuilderPanel({ isDark }: { isDark: boolean }) {
  const [config, setConfig] = useState<PhonicsWidgetConfig>({ ...DEFAULT_PHONICS_CONFIG })
  return (
    <P1Panel>
      <PhonicsBuilderWidget
        isDark={isDark}
        config={config}
        onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
        compact
      />
    </P1Panel>
  )
}
function PartsOfSpeechTaggerPanel({ isDark }: { isDark: boolean }) {
  // Panel uses the SAME unified component as canvas, with local state
  const [config, setConfig] = useState<POSWidgetConfig>({ ...DEFAULT_POS_CONFIG })
  return (
    <P1Panel>
      <POSTaggerWidget
        isDark={isDark}
        config={config}
        onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
        compact
      />
    </P1Panel>
  )
}
function SentenceExpansionToolPanel({ isDark }: { isDark: boolean }) {
  const [config, setConfig] = useState<ExpansionWidgetConfig>({ ...DEFAULT_EXPANSION_CONFIG })
  return (
    <P1Panel>
      <SentenceExpansionWidget
        isDark={isDark}
        config={config}
        onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
        compact
      />
    </P1Panel>
  )
}
function PunctuationInteractivePanel({ isDark }: { isDark: boolean }) {
  // Panel uses the SAME unified component as canvas, with local state
  const [config, setConfig] = useState<PunctWidgetConfig>({ ...DEFAULT_PUNCT_CONFIG })
  return (
    <P1Panel>
      <PunctuationPracticeWidget
        isDark={isDark}
        config={config}
        onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
        compact
      />
    </P1Panel>
  )
}
function ParagraphOrganizerPanel({ isDark }: { isDark: boolean }) {
  const [config, setConfig] = useState<ParagraphOrganizerWidgetConfig>({ ...DEFAULT_PARAORG_CONFIG })
  return (
    <P1Panel>
      <ParagraphOrganizerWidget
        isDark={isDark}
        config={config}
        onConfigChange={(patch) => setConfig(prev => ({ ...prev, ...patch }))}
        compact
      />
    </P1Panel>
  )
}

// Phase 2 wrappers
function RootMorphologyExplorerPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel><RootMorphologyExplorerLazy isDark={isDark} /></P1Panel>
}
function ActivePassiveVoicePanel({ isDark }: { isDark: boolean }) {
  return <P1Panel><ActivePassiveVoiceLazy isDark={isDark} /></P1Panel>
}
function ReadingComprehensionStrategiesPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel><ReadingComprehensionStrategiesLazy isDark={isDark} /></P1Panel>
}
function GrammarErrorDiagnosticPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel><GrammarErrorDiagnosticLazy isDark={isDark} /></P1Panel>
}
function SpellingPatternsPanel({ isDark }: { isDark: boolean }) {
  return <P1Panel><SpellingPatternsLazy isDark={isDark} /></P1Panel>
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 12 }}>
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
        <button
          onClick={() => addToBoard(widgetKind)}
          style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600,
            background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)',
            color: '#34d399', cursor: 'pointer', whiteSpace: 'nowrap',
          }}
          title={'Place ' + (WIDGET_KIND_LABELS[widgetKind] || widgetKind) + ' on the board'}
        >
          + Add to Board
        </button>
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
    <div className="widget-content toolkit-language" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
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