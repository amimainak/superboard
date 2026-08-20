'use client'

import React, { useMemo, useCallback } from 'react'
import {
  FIGLANG_EXERCISES, FIGLANG_TYPES, type FigLangExercise, type FigLangType,
  type Difficulty, type GradeBand,
  getExercisesByFilter, shuffleExercises, generateWrongVariants, getExerciseById,
} from '@/data/figurative-language-exercises'

// ============================================================
// Types
// ============================================================

export interface FigLangWidgetConfig {
  mode: 'student' | 'teacher'
  // Student mode state
  exerciseIds: string[]
  currentIndex: number
  selected: number | null
  checked: boolean
  score: number
  totalAttempted: number
  // Filter state
  filterTypes: FigLangType[]
  filterDifficulty: Difficulty | 'all'
  filterBand: GradeBand | 'all'
  // Teacher mode state
  teacherPassage: string
  teacherQuestion: string
  teacherOptions: [string, string, string]
  teacherCorrect: 0 | 1 | 2
  teacherType: FigLangType
  teacherExplanations: [string, string, string]
  teacherPreview: boolean
  // Custom exercises authored by teacher (persisted in config)
  customExercises: FigLangExercise[]
}

export const DEFAULT_FIGLANG_CONFIG: FigLangWidgetConfig = {
  mode: 'student',
  exerciseIds: [],
  currentIndex: 0,
  selected: null,
  checked: false,
  score: 0,
  totalAttempted: 0,
  filterTypes: [],
  filterDifficulty: 'all',
  filterBand: 'all',
  teacherPassage: '',
  teacherQuestion: '',
  teacherOptions: ['', '', ''],
  teacherCorrect: 0,
  teacherType: 'simile',
  teacherExplanations: ['', '', ''],
  teacherPreview: false,
  customExercises: [],
}

export interface FigLangWidgetProps {
  isDark: boolean
  config: FigLangWidgetConfig
  onConfigChange: (patch: Partial<FigLangWidgetConfig>) => void
  compact?: boolean
}

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
// Type color mapping
// ============================================================

const TYPE_COLORS: Record<string, string> = {
  simile: '#3b82f6',
  metaphor: '#8b5cf6',
  personification: '#ec4899',
  hyperbole: '#f59e0b',
  alliteration: '#10b981',
  onomatopoeia: '#06b6d4',
}

// ============================================================
// Main Component
// ============================================================

export function FigurativeLanguageWidget({ isDark, config, onConfigChange, compact }: FigLangWidgetProps) {
  const s = sh(isDark)
  const fs = compact ? 10 : 11 // font size scale

  // ============================================================
  // STUDENT MODE
  // ============================================================
  if (config.mode === 'student') {
    return <StudentMode isDark={isDark} config={config} onConfigChange={onConfigChange} fs={fs} s={s} compact={!!compact} />
  }

  // ============================================================
  // TEACHER MODE
  // ============================================================
  return <TeacherMode isDark={isDark} config={config} onConfigChange={onConfigChange} fs={fs} s={s} compact={!!compact} />
}

// ============================================================
// Student Mode Sub-Component
// ============================================================

function StudentMode({ isDark, config, onConfigChange, fs, s, compact }: {
  isDark: boolean; config: FigLangWidgetConfig; onConfigChange: (p: Partial<FigLangWidgetConfig>) => void; fs: number; s: ReturnType<typeof sh>; compact: boolean
}) {
  // Get exercises based on filter + custom exercises
  const allExercises = useMemo(() => {
    const filtered = getExercisesByFilter({
      types: config.filterTypes.length > 0 ? config.filterTypes : undefined,
      difficulty: config.filterDifficulty,
      band: config.filterBand,
    })
    return [...filtered, ...config.customExercises]
  }, [config.filterTypes, config.filterDifficulty, config.filterBand, config.customExercises])

  // Current exercise list (shuffled IDs)
  const exerciseList = useMemo(() => {
    if (config.exerciseIds.length > 0) {
      // Validate IDs still exist
      const validIds = config.exerciseIds.filter(id =>
        getExerciseById(id) || config.customExercises.some(e => e.id === id)
      )
      return validIds
    }
    // Initial shuffle
    return shuffleExercises(allExercises).map(e => e.id)
  }, [allExercises, config.exerciseIds, config.customExercises])

  // Current exercise
  const currentExercise = useMemo((): FigLangExercise | null => {
    if (exerciseList.length === 0) return null
    const idx = config.currentIndex % exerciseList.length
    const id = exerciseList[idx]
    return getExerciseById(id) || config.customExercises.find(e => e.id === id) || null
  }, [exerciseList, config.currentIndex, config.customExercises])

  const isCorrect = config.checked && config.selected !== null && currentExercise !== null && config.selected === currentExercise.correctIndex

  // Handlers
  const handleSelect = useCallback((idx: number) => {
    if (config.checked) return
    onConfigChange({ selected: idx })
  }, [config.checked, onConfigChange])

  const handleCheck = useCallback(() => {
    if (config.selected === null || !currentExercise) return
    const correct = config.selected === currentExercise.correctIndex
    onConfigChange({
      checked: true,
      score: correct ? config.score + 1 : config.score,
      totalAttempted: config.totalAttempted + 1,
    })
  }, [config.selected, config.score, config.totalAttempted, currentExercise, onConfigChange])

  const handleNext = useCallback(() => {
    onConfigChange({
      currentIndex: config.currentIndex + 1,
      selected: null,
      checked: false,
    })
  }, [config.currentIndex, onConfigChange])

  const handleShuffle = useCallback(() => {
    const shuffled = shuffleExercises(allExercises).map(e => e.id)
    onConfigChange({ exerciseIds: shuffled, currentIndex: 0, selected: null, checked: false, score: 0, totalAttempted: 0 })
  }, [allExercises, onConfigChange])

  const toggleFilterType = useCallback((type: FigLangType) => {
    const current = config.filterTypes
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type]
    // Re-shuffle when filter changes
    const filtered = getExercisesByFilter({
      types: next.length > 0 ? next : undefined,
      difficulty: config.filterDifficulty,
      band: config.filterBand,
    })
    const shuffled = shuffleExercises([...filtered, ...config.customExercises]).map(e => e.id)
    onConfigChange({ filterTypes: next, exerciseIds: shuffled, currentIndex: 0, selected: null, checked: false, score: 0, totalAttempted: 0 })
  }, [config.filterTypes, config.filterDifficulty, config.filterBand, config.customExercises, onConfigChange])

  const handleFilterChange = useCallback((key: 'filterDifficulty' | 'filterBand', value: string) => {
    const newDifficulty = key === 'filterDifficulty' ? (value as Difficulty | 'all') : config.filterDifficulty
    const newBand = key === 'filterBand' ? (value as GradeBand | 'all') : config.filterBand
    const filtered = getExercisesByFilter({
      types: config.filterTypes.length > 0 ? config.filterTypes : undefined,
      difficulty: newDifficulty,
      band: newBand,
    })
    const shuffled = shuffleExercises([...filtered, ...config.customExercises]).map(e => e.id)
    onConfigChange({
      [key]: value,
      exerciseIds: shuffled, currentIndex: 0, selected: null, checked: false, score: 0, totalAttempted: 0,
    })
  }, [config.filterTypes, config.filterDifficulty, config.filterBand, config.customExercises, onConfigChange])

  const displayIndex = (config.currentIndex % Math.max(exerciseList.length, 1)) + 1
  const totalExercises = exerciseList.length
  const typeColor = currentExercise ? (TYPE_COLORS[currentExercise.type] || '#94a3b8') : '#94a3b8'

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

      {/* Filters (collapsible) */}
      {!compact && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '4px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: s.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>Type:</span>
            {FIGLANG_TYPES.map(t => {
              const isActive = config.filterTypes.includes(t.id)
              const tc = TYPE_COLORS[t.id]
              return (
                <button key={t.id} onClick={() => toggleFilterType(t.id)} style={{
                  ...s.btn(false), fontSize: 8, padding: '1px 5px',
                  border: isActive ? '1px solid ' + tc + '60' : undefined,
                  color: isActive ? tc : undefined,
                  background: isActive ? tc + '18' : undefined,
                }}>{t.label}</button>
              )
            })}
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
          No exercises match your filters. Try adjusting the type or difficulty level.
        </div>
      ) : (
        <>
          {/* Passage box */}
          <div style={{
            padding: '8px 10px', borderRadius: 6, background: s.bg,
            border: '1px solid ' + s.border,
          }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: typeColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
              {currentExercise.type} | {currentExercise.difficulty} | {currentExercise.band}
            </div>
            <div style={{ fontSize: fs + 2, lineHeight: 1.6, color: s.bright, fontStyle: 'italic' }}>
              {currentExercise.passage}
            </div>
          </div>

          {/* Question */}
          <div style={{
            padding: '6px 10px', borderRadius: 6, background: s.bg,
            border: '1px solid ' + s.border, fontSize: fs + 1, lineHeight: 1.5, color: s.bright,
          }}>
            {currentExercise.question}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {currentExercise.options.map((opt, i) => {
              const isSel = config.selected === i
              const showCorrect = config.checked && i === currentExercise.correctIndex
              const showWrong = config.checked && isSel && i !== currentExercise.correctIndex
              return (
                <button key={i} onClick={() => handleSelect(i)} style={{
                  padding: '5px 8px', borderRadius: 5, fontSize: fs, cursor: 'pointer' as const,
                  textAlign: 'left' as const, width: '100%',
                  border: '1px solid ' + (showCorrect ? '#4ade80' : showWrong ? '#f87171' : isSel ? '#34d399' : s.border),
                  background: showCorrect ? 'rgba(34,197,94,0.1)' : showWrong ? 'rgba(239,68,68,0.1)' : isSel ? 'rgba(5,150,105,0.08)' : s.bg,
                  color: showCorrect ? '#4ade80' : showWrong ? '#f87171' : isSel ? '#34d399' : s.bright,
                  fontWeight: isSel ? 600 : 400,
                }}>
                  {String.fromCharCode(65 + i) + '. ' + opt}
                </button>
              )
            })}
          </div>

          {/* Check / Next buttons */}
          <div style={{ display: 'flex', gap: 4 }}>
            {!config.checked && (
              <button onClick={handleCheck} disabled={config.selected === null} style={{
                ...s.btnPrimary, opacity: config.selected === null ? 0.5 : 1, fontSize: fs,
              }}>Check</button>
            )}
            {config.checked && (
              <button onClick={handleNext} style={{ ...s.btnPrimary, fontSize: fs }}>Next</button>
            )}
          </div>

          {/* Feedback with explanation */}
          {config.checked && currentExercise && (
            <div style={{
              padding: '6px 8px', borderRadius: 5, fontSize: fs - 1, lineHeight: 1.5,
              background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: '1px solid ' + (isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'),
            }}>
              <div style={{ fontWeight: 700, color: isCorrect ? '#4ade80' : '#f87171', marginBottom: 2 }}>
                {isCorrect ? 'Correct!' : 'Not quite.'}
              </div>
              {/* Show explanation for the selected option */}
              {config.selected !== null && (
                <div style={{ color: s.bright }}>
                  {currentExercise.explanations[config.selected]}
                </div>
              )}
              {/* If wrong, also show the correct explanation */}
              {!isCorrect && (
                <div style={{ marginTop: 3, color: '#4ade80' }}>
                  Correct answer: {currentExercise.explanations[currentExercise.correctIndex]}
                </div>
              )}
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
  isDark: boolean; config: FigLangWidgetConfig; onConfigChange: (p: Partial<FigLangWidgetConfig>) => void; fs: number; s: ReturnType<typeof sh>; compact: boolean
}) {
  // When teacher types a passage and changes type, auto-generate wrong answer options
  const handlePassageChange = useCallback((passage: string) => {
    const wrongs = generateWrongVariants(passage, config.teacherType)
    const correctLabel = config.teacherType.charAt(0).toUpperCase() + config.teacherType.slice(1)
    const options: [string, string, string] = [correctLabel, wrongs[0], wrongs[1]]
    onConfigChange({
      teacherPassage: passage,
      teacherOptions: options,
      teacherCorrect: 0,
    })
  }, [config.teacherType, onConfigChange])

  const handleTypeChange = useCallback((type: FigLangType) => {
    const wrongs = generateWrongVariants(config.teacherPassage, type)
    const correctLabel = type.charAt(0).toUpperCase() + type.slice(1)
    const options: [string, string, string] = [correctLabel, wrongs[0], wrongs[1]]
    onConfigChange({
      teacherType: type,
      teacherOptions: options,
      teacherCorrect: 0,
    })
  }, [config.teacherPassage, onConfigChange])

  const handleOptionEdit = useCallback((index: number, value: string) => {
    const newOptions: [string, string, string] = [config.teacherOptions[0], config.teacherOptions[1], config.teacherOptions[2]]
    newOptions[index] = value
    // If editing the currently-correct option, or clearing it, reset correct
    const newCorrect = newOptions[config.teacherCorrect].trim() === '' ? 0 : config.teacherCorrect
    onConfigChange({ teacherOptions: newOptions, teacherCorrect: newCorrect as 0 | 1 | 2 })
  }, [config.teacherOptions, config.teacherCorrect, onConfigChange])

  const handleExplanationEdit = useCallback((index: number, value: string) => {
    const newExpl: [string, string, string] = [config.teacherExplanations[0], config.teacherExplanations[1], config.teacherExplanations[2]]
    newExpl[index] = value
    onConfigChange({ teacherExplanations: newExpl })
  }, [config.teacherExplanations, onConfigChange])

  const handleSetCorrect = useCallback((index: 0 | 1 | 2) => {
    onConfigChange({ teacherCorrect: index })
  }, [onConfigChange])

  const handleSaveExercise = useCallback(() => {
    if (!config.teacherPassage.trim()) return
    // Validate: all 3 options must be filled
    if (config.teacherOptions.some(o => !o.trim())) return

    const question = config.teacherQuestion.trim() || 'What type of figurative language is used?'

    const newExercise: FigLangExercise = {
      id: 'custom-fl-' + Date.now(),
      type: config.teacherType,
      difficulty: 'intermediate',
      band: '6-8',
      question: question,
      passage: config.teacherPassage,
      options: [config.teacherOptions[0], config.teacherOptions[1], config.teacherOptions[2]],
      correctIndex: config.teacherCorrect,
      explanations: [
        config.teacherExplanations[0] || (config.teacherCorrect === 0 ? 'This is the correct answer.' : 'This is incorrect.'),
        config.teacherExplanations[1] || (config.teacherCorrect === 1 ? 'This is the correct answer.' : 'This is incorrect.'),
        config.teacherExplanations[2] || (config.teacherCorrect === 2 ? 'This is the correct answer.' : 'This is incorrect.'),
      ],
    }

    const newCustom = [...config.customExercises, newExercise]
    onConfigChange({
      customExercises: newCustom,
      teacherPassage: '',
      teacherQuestion: '',
      teacherOptions: ['', '', ''],
      teacherCorrect: 0,
      teacherExplanations: ['', '', ''],
      teacherPreview: false,
    })
  }, [config, onConfigChange])

  const handleDeleteCustom = useCallback((idx: number) => {
    const newCustom = config.customExercises.filter((_, i) => i !== idx)
    onConfigChange({ customExercises: newCustom })
  }, [config.customExercises, onConfigChange])

  const selectStyle = {
    padding: '3px 6px', borderRadius: 4, fontSize: 9,
    border: '1px solid ' + s.border, background: s.bg,
    color: s.bright, cursor: 'pointer' as const, outline: 'none' as const,
  }

  const fieldStyle = { ...s.input, width: '100%', boxSizing: 'border-box' as const, fontFamily: 'inherit' as const }

  const currentTypeColor = TYPE_COLORS[config.teacherType] || '#94a3b8'

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
        {/* Figurative language type selector */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: s.text }}>Type:</span>
          <select value={config.teacherType} onChange={e => handleTypeChange(e.target.value as FigLangType)} style={selectStyle}>
            {FIGLANG_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Passage textarea */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, color: s.text, marginBottom: 2 }}>
            Type the passage containing figurative language:
          </div>
          <textarea
            value={config.teacherPassage}
            onChange={e => handlePassageChange(e.target.value)}
            placeholder={'e.g. Her eyes sparkled like diamonds.'}
            rows={2}
            style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        {/* Question textarea */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, color: s.text, marginBottom: 2 }}>
            Question (optional — defaults to "What type of figurative language is used?"):
          </div>
          <input
            value={config.teacherQuestion}
            onChange={e => onConfigChange({ teacherQuestion: e.target.value })}
            placeholder={'e.g. Which sentence contains a simile?'}
            style={fieldStyle}
          />
        </div>

        {/* Generated / editable options */}
        {config.teacherPassage.trim() && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: s.text }}>
              Options (click circle to mark correct, edit to customize):
            </div>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                <button
                  onClick={() => handleSetCorrect(i as 0 | 1 | 2)}
                  title='Mark as correct'
                  style={{
                    width: 18, height: 18, minWidth: 18, borderRadius: '50%',
                    border: '2px solid ' + (config.teacherCorrect === i ? '#4ade80' : s.border),
                    background: config.teacherCorrect === i ? '#4ade80' : 'transparent',
                    cursor: 'pointer' as const, padding: 0, marginTop: 2,
                  }}
                />
                <input
                  value={config.teacherOptions[i]}
                  onChange={e => handleOptionEdit(i, e.target.value)}
                  placeholder={i === 0 ? 'Correct option...' : 'Wrong option...'}
                  style={{ ...fieldStyle, fontSize: 10, flex: 1,
                    border: '1px solid ' + (config.teacherCorrect === i ? 'rgba(34,197,94,0.5)' : s.border),
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Explanations */}
        {config.teacherPassage.trim() && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: s.text }}>
              Explanations (optional, for each option):
            </div>
            {[0, 1, 2].map(i => (
              <input
                key={i}
                value={config.teacherExplanations[i]}
                onChange={e => handleExplanationEdit(i, e.target.value)}
                placeholder={'Why option ' + String.fromCharCode(65 + i) + ' is correct/wrong...'}
                style={{ ...fieldStyle, fontSize: 9 }}
              />
            ))}
          </div>
        )}

        {/* Preview toggle */}
        {config.teacherPassage.trim() && (
          <button onClick={() => onConfigChange({ teacherPreview: !config.teacherPreview })} style={s.btn(config.teacherPreview)}>
            {config.teacherPreview ? 'Hide Preview' : 'Preview as Student'}
          </button>
        )}

        {/* Student Preview */}
        {config.teacherPreview && config.teacherOptions.some(o => o.trim()) && (
          <div style={{ padding: '6px 8px', borderRadius: 6, background: isDark ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#3b82f6', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Student View Preview</div>
            <div style={{ padding: '4px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border, marginBottom: 4 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: currentTypeColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                {config.teacherType} | intermediate | 6-8
              </div>
              <div style={{ fontSize: fs, color: s.bright, fontStyle: 'italic' }}>{config.teacherPassage}</div>
            </div>
            <div style={{ fontSize: fs, color: s.bright, marginBottom: 4 }}>
              {config.teacherQuestion || 'What type of figurative language is used?'}
            </div>
            {config.teacherOptions.filter(o => o.trim()).map((opt, i) => (
              <div key={i} style={{
                padding: '3px 6px', marginBottom: 2, borderRadius: 4, fontSize: fs,
                border: '1px solid ' + (i === config.teacherCorrect ? 'rgba(34,197,94,0.3)' : s.border),
                background: i === config.teacherCorrect ? 'rgba(34,197,94,0.06)' : 'transparent',
                color: s.bright,
              }}>
                {String.fromCharCode(65 + i) + '. ' + opt}
              </div>
            ))}
          </div>
        )}

        {/* Save button */}
        {config.teacherPassage.trim() && config.teacherOptions.every(o => o.trim()) && (
          <button onClick={handleSaveExercise} style={s.btnPrimary}>
            + Add to Exercise Bank
          </button>
        )}
      </div>

      {/* Custom exercises list */}
      {config.customExercises.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: s.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Custom Exercises ({config.customExercises.length})
          </div>
          {config.customExercises.map((ex, i) => (
            <div key={ex.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4,
              padding: '3px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border,
            }}>
              <div style={{ fontSize: 9, color: s.bright, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ex.passage}
              </div>
              <div style={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 8, color: TYPE_COLORS[ex.type], fontWeight: 600 }}>{ex.type}</span>
                <button onClick={() => handleDeleteCustom(i)} style={{
                  fontSize: 9, padding: '1px 4px', borderRadius: 3, cursor: 'pointer' as const,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171',
                }}>x</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}