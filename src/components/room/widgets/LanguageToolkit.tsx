'use client'

import { useState, lazy, Suspense } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

// Lazy-load each tool — only parsed when the grade tab renders it
const VocabularyFlashcardsLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.VocabularyFlashcards })))
const ReadingPassageAnalyzerLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.ReadingPassageAnalyzer })))
const StoryElementsMapLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.StoryElementsMap })))
const SentenceStructureBuilderLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.SentenceStructureBuilder })))
const FigurativeLanguageFinderLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.FigurativeLanguageFinder })))
const PhonicsDecodingBuilderLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.PhonicsDecodingBuilder })))
const PartsOfSpeechTaggerLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.PartsOfSpeechTagger })))
const SentenceExpansionToolLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.SentenceExpansionTool })))
const PunctuationInteractiveLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.PunctuationInteractive })))
const ParagraphOrganizerLazy = lazy(() => import('./language/LanguageUtilities').then(m => ({ default: m.ParagraphOrganizer })))

// Stable wrapper components (no remount on re-render)
function VocabularyFlashcardsPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><VocabularyFlashcardsLazy isDark={isDark} /></Suspense>
}
function ReadingPassageAnalyzerPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><ReadingPassageAnalyzerLazy isDark={isDark} /></Suspense>
}
function StoryElementsMapPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><StoryElementsMapLazy isDark={isDark} /></Suspense>
}
function SentenceStructureBuilderPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><SentenceStructureBuilderLazy isDark={isDark} /></Suspense>
}
function FigurativeLanguageFinderPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><FigurativeLanguageFinderLazy isDark={isDark} /></Suspense>
}
function PhonicsDecodingBuilderPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><PhonicsDecodingBuilderLazy isDark={isDark} /></Suspense>
}
function PartsOfSpeechTaggerPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><PartsOfSpeechTaggerLazy isDark={isDark} /></Suspense>
}
function SentenceExpansionToolPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><SentenceExpansionToolLazy isDark={isDark} /></Suspense>
}
function PunctuationInteractivePanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><PunctuationInteractiveLazy isDark={isDark} /></Suspense>
}
function ParagraphOrganizerPanel({ isDark }: { isDark: boolean }) {
  return <Suspense fallback={null}><ParagraphOrganizerLazy isDark={isDark} /></Suspense>
}

// ============================================================
// Types
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

// ============================================================
// Component
// ============================================================

export function LanguageToolkit({ roomId: _roomId }: LanguageToolkitProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)

  const [activeBand, setActiveBand] = useState<GradeBand>('all')
  const [visibleBands, setVisibleBands] = useState<Set<GradeBand>>(new Set(['all', 'k5', '68', '912']))

  const toggleBand = (band: GradeBand) => {
    setVisibleBands(prev => {
      const next = new Set(prev)
      if (next.has(band)) next.delete(band)
      else next.add(band)
      return next
    })
  }

  // ---- Style helpers ----
  const dkBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const dkBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const dkText = isDark ? '#94a3b8' : '#475569'
  const actBg = 'rgba(5,150,105,0.15)'
  const actBorder = 'rgba(5,150,105,0.3)'
  const actText = '#34d399'

  const sectionTitle = (text: string) => (
    <div className={'toolkit-section-title' + (isDark ? '' : ' toolkit-section-title-light')}>{text}</div>
  )

  return (
    <div className="widget-content toolkit-language" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
      {/* ---- Grade Band Tabs ---- */}
      <div style={{ display: 'flex', gap: 2, padding: '8px 12px 4px', flexWrap: 'wrap' }}>
        {GRADE_BANDS.filter(b => b.id === 'all' || visibleBands.has(b.id)).map((band) => {
          const active = activeBand === band.id
          return (
            <button key={band.id} onClick={() => setActiveBand(band.id)}
              style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: active ? 700 : 500, background: active ? actBg : dkBg, border: active ? '1px solid ' + actBorder : '1px solid ' + dkBorder, color: active ? actText : dkText, cursor: 'pointer', flex: '1 1 auto', textAlign: 'center', minWidth: 0 }}>
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
      {/* ALL TAB — All 10 tools */}
      {/* ============================================================ */}
      {activeBand === 'all' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Phonics & Decoding Builder')}
            <div style={{ padding: '0 12px 12px' }}><PhonicsDecodingBuilderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Parts of Speech Tagger')}
            <div style={{ padding: '0 12px 12px' }}><PartsOfSpeechTaggerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Sentence Expansion & Variation')}
            <div style={{ padding: '0 12px 12px' }}><SentenceExpansionToolPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Punctuation Rules Interactive')}
            <div style={{ padding: '0 12px 12px' }}><PunctuationInteractivePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Paragraph Organizer')}
            <div style={{ padding: '0 12px 12px' }}><ParagraphOrganizerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Vocabulary Flashcards')}
            <div style={{ padding: '0 12px 12px' }}><VocabularyFlashcardsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Reading Passage Analyzer')}
            <div style={{ padding: '0 12px 12px' }}><ReadingPassageAnalyzerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Story Elements Map')}
            <div style={{ padding: '0 12px 12px' }}><StoryElementsMapPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Sentence Structure Builder')}
            <div style={{ padding: '0 12px 12px' }}><SentenceStructureBuilderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Figurative Language Finder')}
            <div style={{ padding: '0 12px 12px' }}><FigurativeLanguageFinderPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* K-5 TAB — Phonics, Punctuation, Vocab Flashcards, Story Elements */}
      {/* ============================================================ */}
      {activeBand === 'k5' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Phonics & Decoding Builder')}
            <div style={{ padding: '0 12px 12px' }}><PhonicsDecodingBuilderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Punctuation Rules Interactive')}
            <div style={{ padding: '0 12px 12px' }}><PunctuationInteractivePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Vocabulary Flashcards')}
            <div style={{ padding: '0 12px 12px' }}><VocabularyFlashcardsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Story Elements Map')}
            <div style={{ padding: '0 12px 12px' }}><StoryElementsMapPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 6-8 TAB — All tools except Phonics (9 tools) */}
      {/* ============================================================ */}
      {activeBand === '68' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Parts of Speech Tagger')}
            <div style={{ padding: '0 12px 12px' }}><PartsOfSpeechTaggerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Sentence Expansion & Variation')}
            <div style={{ padding: '0 12px 12px' }}><SentenceExpansionToolPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Punctuation Rules Interactive')}
            <div style={{ padding: '0 12px 12px' }}><PunctuationInteractivePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Paragraph Organizer')}
            <div style={{ padding: '0 12px 12px' }}><ParagraphOrganizerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Vocabulary Flashcards')}
            <div style={{ padding: '0 12px 12px' }}><VocabularyFlashcardsPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Reading Passage Analyzer')}
            <div style={{ padding: '0 12px 12px' }}><ReadingPassageAnalyzerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Story Elements Map')}
            <div style={{ padding: '0 12px 12px' }}><StoryElementsMapPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Sentence Structure Builder')}
            <div style={{ padding: '0 12px 12px' }}><SentenceStructureBuilderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Figurative Language Finder')}
            <div style={{ padding: '0 12px 12px' }}><FigurativeLanguageFinderPanel isDark={isDark} /></div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 9-12 TAB — POS Tagger, Sentence Expansion, Punctuation, Paragraph, Reading, Figurative, Vocab */}
      {/* ============================================================ */}
      {activeBand === '912' && (
        <>
          <div className="toolkit-section">
            {sectionTitle('Parts of Speech Tagger')}
            <div style={{ padding: '0 12px 12px' }}><PartsOfSpeechTaggerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Sentence Expansion & Variation')}
            <div style={{ padding: '0 12px 12px' }}><SentenceExpansionToolPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Punctuation Rules Interactive')}
            <div style={{ padding: '0 12px 12px' }}><PunctuationInteractivePanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Paragraph Organizer')}
            <div style={{ padding: '0 12px 12px' }}><ParagraphOrganizerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Reading Passage Analyzer')}
            <div style={{ padding: '0 12px 12px' }}><ReadingPassageAnalyzerPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Figurative Language Finder')}
            <div style={{ padding: '0 12px 12px' }}><FigurativeLanguageFinderPanel isDark={isDark} /></div>
          </div>
          <div className="toolkit-section">
            {sectionTitle('Vocabulary Flashcards')}
            <div style={{ padding: '0 12px 12px' }}><VocabularyFlashcardsPanel isDark={isDark} /></div>
          </div>
        </>
      )}
    </div>
  )
}
