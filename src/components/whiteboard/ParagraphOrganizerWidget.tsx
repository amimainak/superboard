'use client'

import React, { useMemo, useCallback } from 'react'
import {
  PARAORG_EXERCISES, getParaOrgExercisesByFilter, shuffleParaOrgExercises, getParaOrgExerciseById,
} from '@/data/paragraph-organizer-exercises'

// ============================================================
// Types
// ============================================================

export interface ParaOrgExercise {
  id: string
  paragraphType: 'narrative' | 'expository' | 'persuasive' | 'descriptive'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  band: 'K-5' | '6-8' | '9-12'
  prompt: string
  sentences: string[]  // correct order
  scrambledIndices: number[]  // display order
  correctExplanation: string
}

export interface ParagraphOrganizerWidgetConfig {
  mode: 'student' | 'teacher'
  exerciseIds: string[]
  currentIndex: number
  selectedOrder: number[]  // indices the student clicked in order
  checked: boolean
  score: number
  totalAttempted: number
  filterTypes: string[]
  filterDifficulty: 'beginner' | 'intermediate' | 'advanced' | 'all'
  filterBand: 'K-5' | '6-8' | '9-12' | 'all'
  // Teacher
  teacherParagraphType: 'narrative' | 'expository' | 'persuasive' | 'descriptive'
  teacherSentences: string[]
  teacherExplanation: string
  teacherPreview: boolean
  customExercises: ParaOrgExercise[]
}

export const DEFAULT_PARAORG_CONFIG: ParagraphOrganizerWidgetConfig = {
  mode: 'student',
  exerciseIds: [],
  currentIndex: 0,
  selectedOrder: [],
  checked: false,
  score: 0,
  totalAttempted: 0,
  filterTypes: [],
  filterDifficulty: 'all',
  filterBand: 'all',
  teacherParagraphType: 'narrative',
  teacherSentences: [],
  teacherExplanation: '',
  teacherPreview: false,
  customExercises: [],
}

export interface ParagraphOrganizerProps {
  isDark: boolean
  config: ParagraphOrganizerWidgetConfig
  onConfigChange: (patch: Partial<ParagraphOrganizerWidgetConfig>) => void
  compact?: boolean
}

// ============================================================
// Paragraph type definitions (mirrors CanvasLanguageWidgets)
// ============================================================

const PARAGRAPH_TYPES = [
  { id: 'narrative' as const, label: 'Narrative', color: '#60a5fa', sections: ['Setting','Characters','Problem','Events','Climax','Resolution','Lesson'] },
  { id: 'expository' as const, label: 'Expository', color: '#4ade80', sections: ['Topic Sentence','Fact 1','Fact 2','Fact 3','Conclusion'] },
  { id: 'persuasive' as const, label: 'Persuasive', color: '#f87171', sections: ['Claim','Reason 1','Reason 2','Counterargument','Rebuttal','Call to Action'] },
  { id: 'descriptive' as const, label: 'Descriptive', color: '#c084fc', sections: ['Topic','Sight','Sound','Touch','Smell','Conclusion'] },
]

// ============================================================
// Style helpers (NO backtick templates, minimal as const)
// ============================================================

const sh = (isDark: boolean) => ({
  bg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
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
// Shuffle helper
// ============================================================

function generateScrambledIndices(count: number): number[] {
  const indices: number[] = []
  for (let i = 0; i < count; i++) indices.push(i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = indices[i];
    indices[i] = indices[j];
    indices[j] = tmp
  }
  // Ensure at least some items are moved
  if (count > 1 && indices[0] === 0 && indices[indices.length - 1] === indices.length - 1) {
    const tmp = indices[0];
    indices[0] = indices[1];
    indices[1] = tmp
  }
  return indices
}

// ============================================================
// Main Component
// ============================================================

export function ParagraphOrganizerWidget({ isDark, config, onConfigChange, compact }: ParagraphOrganizerProps) {
  const s = sh(isDark)
  const fs = compact ? 10 : 11

  if (config.mode === 'student') {
    return <StudentMode isDark={isDark} config={config} onConfigChange={onConfigChange} fs={fs} s={s} compact={!!compact} />
  }

  return <TeacherMode isDark={isDark} config={config} onConfigChange={onConfigChange} fs={fs} s={s} compact={!!compact} />
}

// ============================================================
// Student Mode Sub-Component
// ============================================================

function StudentMode({ isDark, config, onConfigChange, fs, s, compact }: {
  isDark: boolean; config: ParagraphOrganizerWidgetConfig; onConfigChange: (p: Partial<ParagraphOrganizerWidgetConfig>) => void; fs: number; s: ReturnType<typeof sh>; compact: boolean
}) {
  // Merge built-in + custom exercises, apply filters
  const allExercises = useMemo(() => {
    const builtIn = getParaOrgExercisesByFilter({
      types: config.filterTypes.length > 0 ? config.filterTypes : undefined,
      difficulty: config.filterDifficulty,
      band: config.filterBand,
    })
    const customFiltered = config.customExercises.filter(e => {
      if (config.filterTypes.length > 0 && !config.filterTypes.includes(e.paragraphType)) return false
      if (config.filterDifficulty !== 'all' && e.difficulty !== config.filterDifficulty) return false
      if (config.filterBand !== 'all' && e.band !== config.filterBand) return false
      return true
    })
    // Convert built-in to ParaOrgExercise with scrambled indices
    const mapped: ParaOrgExercise[] = builtIn.map(e => ({
      id: e.id,
      paragraphType: e.paragraphType,
      difficulty: e.difficulty,
      band: e.band,
      prompt: e.prompt,
      sentences: e.sentences,
      scrambledIndices: generateScrambledIndices(e.sentences.length),
      correctExplanation: e.correctExplanation,
    }))
    return [...mapped, ...customFiltered]
  }, [config.filterTypes, config.filterDifficulty, config.filterBand, config.customExercises])

  // Current exercise list (shuffled IDs)
  const exerciseList = useMemo(() => {
    if (config.exerciseIds.length > 0) {
      const validIds = config.exerciseIds.filter(id =>
        allExercises.some(e => e.id === id)
      )
      return validIds
    }
    return shuffleParaOrgExercises(PARAORG_EXERCISES).map(e => e.id).concat(
      config.customExercises.map(e => e.id)
    )
  }, [allExercises, config.exerciseIds, config.customExercises])

  // Current exercise
  const currentExercise = useMemo((): ParaOrgExercise | null => {
    if (exerciseList.length === 0) return null
    const idx = config.currentIndex % exerciseList.length
    const id = exerciseList[idx]
    return allExercises.find(e => e.id === id) || null
  }, [exerciseList, config.currentIndex, allExercises])

  // Scrambled sentences for display
  const scrambledSentences = useMemo(() => {
    if (!currentExercise) return []
    return currentExercise.scrambledIndices.map(i => ({
      originalIndex: i,
      text: currentExercise.sentences[i],
    }))
  }, [currentExercise])

  // Per-sentence correctness after checking
  const sentenceCorrectness = useMemo(() => {
    if (!config.checked || !currentExercise) return null
    return config.selectedOrder.map((scrambledIdx, position) => {
      const actualSentenceIdx = currentExercise.scrambledIndices[scrambledIdx]
      return actualSentenceIdx === position
    })
  }, [config.checked, config.selectedOrder, currentExercise])

  const allCorrect = sentenceCorrectness
    ? sentenceCorrectness.every(c => c)
    : false

  // Handlers
  const handleSentenceClick = useCallback((scrambledIdx: number) => {
    if (config.checked) return
    const order = config.selectedOrder
    const idx = order.indexOf(scrambledIdx)
    if (idx >= 0) {
      // Deselect: remove from order
      onConfigChange({ selectedOrder: order.filter((_, i) => i !== idx) })
    } else {
      // Select: add to order
      onConfigChange({ selectedOrder: [...order, scrambledIdx] })
    }
  }, [config.checked, config.selectedOrder, onConfigChange])

  const handleCheck = useCallback(() => {
    if (config.selectedOrder.length === 0 || !currentExercise) return
    const correct = config.selectedOrder.every((scrambledIdx, position) => {
      return currentExercise.scrambledIndices[scrambledIdx] === position
    })
    onConfigChange({
      checked: true,
      score: correct ? config.score + 1 : config.score,
      totalAttempted: config.totalAttempted + 1,
    })
  }, [config.selectedOrder, config.score, config.totalAttempted, currentExercise, onConfigChange])

  const handleNext = useCallback(() => {
    onConfigChange({
      currentIndex: config.currentIndex + 1,
      selectedOrder: [],
      checked: false,
    })
  }, [config.currentIndex, onConfigChange])

  const handleShuffle = useCallback(() => {
    const shuffled = allExercises.map(e => e.id)
    // Fisher-Yates
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp
    }
    onConfigChange({ exerciseIds: shuffled, currentIndex: 0, selectedOrder: [], checked: false, score: 0, totalAttempted: 0 })
  }, [allExercises, onConfigChange])

  const toggleFilterType = useCallback((type: string) => {
    const current = config.filterTypes
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type]
    onConfigChange({
      filterTypes: next,
      exerciseIds: [],
      currentIndex: 0,
      selectedOrder: [],
      checked: false,
      score: 0,
      totalAttempted: 0,
    })
  }, [config.filterTypes, onConfigChange])

  const handleFilterChange = useCallback((key: 'filterDifficulty' | 'filterBand', value: string) => {
    onConfigChange({
      [key]: value,
      exerciseIds: [],
      currentIndex: 0,
      selectedOrder: [],
      checked: false,
      score: 0,
      totalAttempted: 0,
    })
  }, [onConfigChange])

  const displayIndex = (config.currentIndex % Math.max(exerciseList.length, 1)) + 1
  const totalExercises = exerciseList.length
  const ptInfo = currentExercise ? PARAGRAPH_TYPES.find(p => p.id === currentExercise.paragraphType) : null

  const selectStyle = {
    padding: '3px 6px', borderRadius: 4, fontSize: 9,
    border: '1px solid ' + s.border, background: s.bg,
    color: s.bright, cursor: 'pointer' as const, outline: 'none' as const,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'inherit' }}>
      {/* Header: Mode toggle + Score */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={() => onConfigChange({ mode: 'student' })} style={{
            ...s.btn(true), padding: '2px 6px', fontSize: 9, fontWeight: 700,
          }}>Practice</button>
          <button onClick={() => onConfigChange({ mode: 'teacher' })} style={{
            ...s.btn(false), padding: '2px 6px', fontSize: 9,
          }}>Author</button>
        </div>
        <div style={{ fontSize: 9, color: s.text }}>
          {displayIndex}/{totalExercises} | Score: {config.score}/{config.totalAttempted}
        </div>
      </div>

      {/* Filters */}
      {!compact && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '4px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: s.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>Type:</span>
            {PARAGRAPH_TYPES.map(pt => (
              <button key={pt.id} onClick={() => toggleFilterType(pt.id)} style={{
                ...s.btn(config.filterTypes.includes(pt.id)),
                fontSize: 8, padding: '1px 5px',
                border: config.filterTypes.includes(pt.id) ? '1px solid ' + pt.color + '60' : undefined,
                color: config.filterTypes.includes(pt.id) ? pt.color : undefined,
                background: config.filterTypes.includes(pt.id) ? pt.color + '18' : undefined,
              }}>{pt.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: s.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>Level:</span>
            {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(d => (
              <button key={d} onClick={() => handleFilterChange('filterDifficulty', d)} style={s.btn(config.filterDifficulty === d)}>
                {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
            <span style={{ fontSize: 8, color: s.text, margin: '0 2px' }}>|</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: s.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>Band:</span>
            <select value={config.filterBand} onChange={e => handleFilterChange('filterBand', e.target.value)} style={selectStyle}>
              <option value="all">All Grades</option>
              <option value="K-5">K-5</option>
              <option value="6-8">6-8</option>
              <option value="9-12">9-12</option>
            </select>
          </div>
          <button onClick={handleShuffle} style={{ ...s.btn(false), fontSize: 8, padding: '1px 6px', alignSelf: 'flex-end' }}>
            Shuffle
          </button>
        </div>
      )}

      {/* Exercise */}
      {!currentExercise ? (
        <div style={{ padding: 20, textAlign: 'center' as const, color: s.text, fontSize: fs }}>
          No exercises available. Use Author mode to create custom exercises.
        </div>
      ) : (
        <>
          {/* Prompt header */}
          <div style={{
            padding: '8px 10px', borderRadius: 6, background: s.bg,
            border: '1px solid ' + s.border, fontSize: fs + 1, lineHeight: 1.5, color: s.bright,
          }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: ptInfo ? ptInfo.color : s.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
              {ptInfo ? ptInfo.label : ''} | {currentExercise.difficulty} | {currentExercise.band}
            </div>
            {currentExercise.prompt}
          </div>

          {/* Selected order preview */}
          {config.selectedOrder.length > 0 && (
            <div style={{
              padding: '4px 8px', borderRadius: 4, fontSize: 8, color: s.text,
              background: isDark ? 'rgba(96,165,250,0.06)' : 'rgba(96,165,250,0.04)',
              border: '1px solid rgba(96,165,250,0.2)',
            }}>
              <span style={{ fontWeight: 700 }}>Your order:</span> {' '}
              {config.selectedOrder.map((si, pos) => {
                const isRight = sentenceCorrectness ? sentenceCorrectness[pos] : null
                const borderColor = isRight === true ? '#4ade80' : isRight === false ? '#f87171' : 'transparent'
                return (
                  <span key={pos} style={{
                    display: 'inline-block', padding: '1px 4px', margin: '0 1px', borderRadius: 3,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    border: '1px solid ' + (config.checked ? borderColor : 'transparent'),
                    color: isRight === true ? '#4ade80' : isRight === false ? '#f87171' : s.bright,
                  }}>
                    {pos + 1}. {scrambledSentences[si].text.length > 20
                      ? scrambledSentences[si].text.substring(0, 20) + '...'
                      : scrambledSentences[si].text}
                  </span>
                )
              })}
            </div>
          )}

          {/* Scrambled sentences */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {scrambledSentences.map((item, scrambledIdx) => {
              const selectionIdx = config.selectedOrder.indexOf(scrambledIdx)
              const isSelected = selectionIdx >= 0
              const isRight = sentenceCorrectness ? (sentenceCorrectness[selectionIdx] ?? null) : null
              const showGreen = config.checked && isSelected && isRight === true
              const showRed = config.checked && isSelected && isRight === false

              return (
                <button key={scrambledIdx} onClick={() => handleSentenceClick(scrambledIdx)} style={{
                  padding: '5px 8px', borderRadius: 5, fontSize: fs, cursor: 'pointer' as const,
                  textAlign: 'left' as const, width: '100%', lineHeight: 1.4,
                  border: '1px solid ' + (showGreen ? '#4ade80' : showRed ? '#f87171' : isSelected ? '#34d399' : s.border),
                  background: showGreen ? 'rgba(34,197,94,0.1)' : showRed ? 'rgba(239,68,68,0.1)' : isSelected ? 'rgba(5,150,105,0.08)' : s.bg,
                  color: showGreen ? '#4ade80' : showRed ? '#f87171' : isSelected ? '#34d399' : s.bright,
                  fontWeight: isSelected ? 600 : 400,
                }}>
                  <span style={{ fontSize: fs - 2, color: s.text, marginRight: 4 }}>
                    {isSelected ? String(selectionIdx + 1) + '.' : '\u2022'}
                  </span>
                  {item.text}
                </button>
              )
            })}
          </div>

          {/* Check / Next buttons */}
          <div style={{ display: 'flex', gap: 4 }}>
            {!config.checked && (
              <button onClick={handleCheck} disabled={config.selectedOrder.length === 0} style={{
                ...s.btnPrimary, opacity: config.selectedOrder.length === 0 ? 0.5 : 1, fontSize: fs,
              }}>Check Order</button>
            )}
            {config.checked && (
              <button onClick={handleNext} style={{ ...s.btnPrimary, fontSize: fs }}>Next</button>
            )}
          </div>

          {/* Feedback with explanation */}
          {config.checked && currentExercise && (
            <div style={{
              padding: '6px 8px', borderRadius: 5, fontSize: fs - 1, lineHeight: 1.5,
              background: allCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: '1px solid ' + (allCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'),
            }}>
              <div style={{ fontWeight: 700, color: allCorrect ? '#4ade80' : '#f87171', marginBottom: 2 }}>
                {allCorrect ? 'Correct! Perfect order.' : 'Not quite right.'}
              </div>
              <div style={{ color: s.bright }}>
                {currentExercise.correctExplanation}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ============================================================
// Teacher Mode Sub-Component
// ============================================================

function TeacherMode({ isDark, config, onConfigChange, fs, s, compact }: {
  isDark: boolean; config: ParagraphOrganizerWidgetConfig; onConfigChange: (p: Partial<ParagraphOrganizerWidgetConfig>) => void; fs: number; s: ReturnType<typeof sh>; compact: boolean
}) {
  const ptInfo = PARAGRAPH_TYPES.find(p => p.id === config.teacherParagraphType) || PARAGRAPH_TYPES[0]

  const handleTypeChange = useCallback((type: 'narrative' | 'expository' | 'persuasive' | 'descriptive') => {
    const pt = PARAGRAPH_TYPES.find(p => p.id === type) || PARAGRAPH_TYPES[0]
    // Initialize sentences for each section
    const newSentences = pt.sections.map(() => '')
    onConfigChange({
      teacherParagraphType: type,
      teacherSentences: newSentences,
      teacherExplanation: '',
      teacherPreview: false,
    })
  }, [onConfigChange])

  const handleSentenceChange = useCallback((index: number, value: string) => {
    const newSentences = config.teacherSentences.map((s, i) => i === index ? value : s)
    onConfigChange({ teacherSentences: newSentences, teacherPreview: false })
  }, [config.teacherSentences, onConfigChange])

  const handleAddSentence = useCallback(() => {
    onConfigChange({ teacherSentences: [...config.teacherSentences, ''] })
  }, [config.teacherSentences, onConfigChange])

  const handleRemoveSentence = useCallback((index: number) => {
    if (config.teacherSentences.length <= 2) return
    onConfigChange({ teacherSentences: config.teacherSentences.filter((_, i) => i !== index) })
  }, [config.teacherSentences, onConfigChange])

  const handleExplanationChange = useCallback((value: string) => {
    onConfigChange({ teacherExplanation: value })
  }, [onConfigChange])

  const handleCreateExercise = useCallback(() => {
    const filled = config.teacherSentences.filter(s => s.trim())
    if (filled.length < 2) return

    const validSentences = config.teacherSentences.filter(s => s.trim())
    const scrambledIndices = generateScrambledIndices(validSentences.length)

    const newExercise: ParaOrgExercise = {
      id: 'custom-paraorg-' + Date.now(),
      paragraphType: config.teacherParagraphType,
      difficulty: 'intermediate',
      band: '6-8',
      prompt: 'Put these sentences in the correct order to form a ' + config.teacherParagraphType + ' paragraph.',
      sentences: validSentences,
      scrambledIndices: scrambledIndices,
      correctExplanation: config.teacherExplanation || 'The sentences should follow the standard structure of a ' + config.teacherParagraphType + ' paragraph.',
    }

    onConfigChange({
      customExercises: [...config.customExercises, newExercise],
      teacherSentences: ptInfo.sections.map(() => ''),
      teacherExplanation: '',
      teacherPreview: false,
    })
  }, [config.teacherSentences, config.teacherParagraphType, config.teacherExplanation, config.customExercises, ptInfo.sections, onConfigChange])

  const handleDeleteCustom = useCallback((idx: number) => {
    onConfigChange({ customExercises: config.customExercises.filter((_, i) => i !== idx) })
  }, [config.customExercises, onConfigChange])

  const fieldStyle = { ...s.input, width: '100%', boxSizing: 'border-box' as const, fontFamily: 'inherit' as const }
  const hasFilledSentences = config.teacherSentences.some(s => s.trim())
  const filledCount = config.teacherSentences.filter(s => s.trim()).length

  // Preview scrambled sentences
  const previewScrambled = useMemo(() => {
    const filled = config.teacherSentences.map((s, i) => ({ text: s, originalIndex: i })).filter(s => s.text.trim())
    if (filled.length < 2) return null
    const indices = generateScrambledIndices(filled.length)
    return indices.map(i => filled[i])
  }, [config.teacherSentences])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'inherit' }}>
      {/* Header: Mode toggle */}
      <div style={{ display: 'flex', gap: 2 }}>
        <button onClick={() => onConfigChange({ mode: 'student' })} style={{
          ...s.btn(false), padding: '2px 6px', fontSize: 9,
        }}>Practice</button>
        <button onClick={() => onConfigChange({ mode: 'teacher' })} style={{
          ...s.btn(true), padding: '2px 6px', fontSize: 9, fontWeight: 700,
        }}>Author</button>
      </div>

      {/* Authoring form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Paragraph type selector */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: s.text }}>Type:</span>
          {PARAGRAPH_TYPES.map(pt => (
            <button key={pt.id} onClick={() => handleTypeChange(pt.id)} style={{
              padding: '3px 8px', borderRadius: 4, fontSize: 9,
              fontWeight: config.teacherParagraphType === pt.id ? 700 : 500,
              cursor: 'pointer' as const,
              border: '1px solid ' + (config.teacherParagraphType === pt.id ? pt.color : s.border),
              background: config.teacherParagraphType === pt.id ? pt.color + '18' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
              color: config.teacherParagraphType === pt.id ? pt.color : s.text,
            }}>{pt.label}</button>
          ))}
        </div>

        {/* Section labels + sentence inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 240, overflowY: 'auto' }}>
          {config.teacherSentences.map((sentence, i) => (
            <div key={i} style={{ borderLeft: '3px solid ' + ptInfo.color, paddingLeft: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: ptInfo.color }}>
                  {ptInfo.sections[i] || 'Sentence ' + (i + 1)}
                </div>
                {config.teacherSentences.length > 2 && (
                  <button onClick={() => handleRemoveSentence(i)} style={{
                    fontSize: 9, padding: '0 4px', borderRadius: 3, cursor: 'pointer' as const,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', lineHeight: '16px',
                  }}>x</button>
                )}
              </div>
              <textarea
                value={sentence}
                onChange={e => handleSentenceChange(i, e.target.value)}
                placeholder={'Write the ' + (ptInfo.sections[i] || 'sentence ' + (i + 1)).toLowerCase() + '...'}
                rows={2}
                style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.5, fontSize: 10, padding: '3px 6px', minHeight: 32 }}
              />
            </div>
          ))}
        </div>

        {/* Add sentence button */}
        <button onClick={handleAddSentence} style={{ ...s.btn(false), fontSize: 9, padding: '2px 6px', alignSelf: 'flex-start' }}>
          + Add Sentence
        </button>

        {/* Explanation input */}
        {hasFilledSentences && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, color: s.text, marginBottom: 2 }}>
              Why this order matters (explanation for students):
            </div>
            <textarea
              value={config.teacherExplanation}
              onChange={e => handleExplanationChange(e.target.value)}
              placeholder="Explain why these sentences must be in this order..."
              rows={2}
              style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.5, fontSize: 10, padding: '3px 6px' }}
            />
          </div>
        )}

        {/* Preview toggle */}
        {hasFilledSentences && filledCount >= 2 && (
          <button onClick={() => onConfigChange({ teacherPreview: !config.teacherPreview })} style={s.btn(config.teacherPreview)}>
            {config.teacherPreview ? 'Hide Preview' : 'Preview as Student'}
          </button>
        )}

        {/* Student Preview */}
        {config.teacherPreview && previewScrambled && (
          <div style={{ padding: '6px 8px', borderRadius: 6, background: isDark ? 'rgba(96,165,250,0.06)' : 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.2)' }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#60a5fa', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Student View Preview</div>
            <div style={{ fontSize: fs, color: s.bright, marginBottom: 4 }}>
              Put these sentences in the correct order to form a {config.teacherParagraphType} paragraph.
            </div>
            {previewScrambled.map((item, i) => (
              <div key={i} style={{
                padding: '4px 6px', marginBottom: 2, borderRadius: 4, fontSize: fs - 1,
                border: '1px solid ' + s.border, background: s.bg, color: s.bright, lineHeight: 1.4,
              }}>
                {'\u2022 ' + item.text}
              </div>
            ))}
          </div>
        )}

        {/* Create Exercise button */}
        {hasFilledSentences && filledCount >= 2 && (
          <button onClick={handleCreateExercise} style={s.btnPrimary}>
            + Create Exercise
          </button>
        )}
      </div>

      {/* Custom exercises list */}
      {config.customExercises.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: s.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Custom Exercises ({config.customExercises.length})
          </div>
          {config.customExercises.map((ex, i) => {
            const exPt = PARAGRAPH_TYPES.find(p => p.id === ex.paragraphType)
            return (
              <div key={ex.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4,
                padding: '3px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border,
              }}>
                <div style={{ fontSize: 9, color: s.bright, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ex.sentences[0] || 'Untitled'}
                </div>
                <div style={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 8, color: exPt ? exPt.color : s.text, fontWeight: 600 }}>{ex.paragraphType}</span>
                  <span style={{ fontSize: 8, color: s.text }}>{ex.sentences.length} sentences</span>
                  <button onClick={() => handleDeleteCustom(i)} style={{
                    fontSize: 9, padding: '1px 4px', borderRadius: 3, cursor: 'pointer' as const,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171',
                  }}>x</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}