'use client'

import React, { useState, useMemo, useCallback } from 'react'
// Data file will be created later — for now import an empty array
import { STORY_MAP_EXERCISES as PREBUILT_EXERCISES } from '@/data/story-elements-exercises'

// ============================================================
// Types
// ============================================================

export interface StoryMapExercise {
  id: string
  title: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  band: 'K-5' | '6-8' | '9-12'
  question: string
  excerpt: string
  options: [string, string, string]
  correctIndex: 0 | 1 | 2
  explanations: [string, string, string]
}

export interface StoryMapWidgetConfig {
  mode: 'student' | 'teacher'
  exerciseIds: string[]
  currentIndex: number
  selected: number | null
  checked: boolean
  score: number
  totalAttempted: number
  filterDifficulty: 'beginner' | 'intermediate' | 'advanced' | 'all'
  filterBand: 'K-5' | '6-8' | '9-12' | 'all'
  // Teacher mode
  teacherTitle: string
  teacherAuthor: string
  teacherProtagonist: string
  teacherAntagonist: string
  teacherSettingTime: string
  teacherSettingPlace: string
  teacherConflictType: string
  teacherRisingAction: string
  teacherClimax: string
  teacherFallingAction: string
  teacherResolution: string
  teacherTheme: string
  teacherOptions: [string, string, string]
  teacherCorrect: 0 | 1 | 2
  teacherExplanations: [string, string, string]
  teacherPreview: boolean
  customExercises: StoryMapExercise[]
}

export const DEFAULT_STORY_MAP_CONFIG: StoryMapWidgetConfig = {
  mode: 'student',
  exerciseIds: [],
  currentIndex: 0,
  selected: null,
  checked: false,
  score: 0,
  totalAttempted: 0,
  filterDifficulty: 'all',
  filterBand: 'all',
  teacherTitle: '',
  teacherAuthor: '',
  teacherProtagonist: '',
  teacherAntagonist: '',
  teacherSettingTime: '',
  teacherSettingPlace: '',
  teacherConflictType: 'Man vs Man',
  teacherRisingAction: '',
  teacherClimax: '',
  teacherFallingAction: '',
  teacherResolution: '',
  teacherTheme: '',
  teacherOptions: ['', '', ''],
  teacherCorrect: 0,
  teacherExplanations: ['', '', ''],
  teacherPreview: false,
  customExercises: [],
}

export interface StoryMapProps {
  isDark: boolean
  config: StoryMapWidgetConfig
  onConfigChange: (patch: Partial<StoryMapWidgetConfig>) => void
  compact?: boolean
}

// ============================================================
// Constants
// ============================================================

const CONFLICT_TYPES = ['Man vs Man', 'Man vs Nature', 'Man vs Self', 'Man vs Society', 'Man vs Technology']

const ELEMENT_COLORS: Record<string, string> = {
  'Protagonist': '#60a5fa',
  'Antagonist': '#f87171',
  'Setting': '#fbbf24',
  'Conflict': '#fb923c',
  'Rising Action': '#34d399',
  'Climax': '#f87171',
  'Falling Action': '#60a5fa',
  'Resolution': '#a78bfa',
  'Theme': '#c084fc',
  'Exposition': '#94a3b8',
}

// ============================================================
// Style helpers (NO backtick templates, minimal as const)
// ============================================================

const sh = (isDark: boolean) => ({
  bg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
  border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
  text: isDark ? '#94a3b8' : '#64748b',
  bright: isDark ? '#e2e8f0' : '#1e293b',
  surface: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
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
// Helpers
// ============================================================

function getExerciseById(id: string, customs: StoryMapExercise[]): StoryMapExercise | null {
  if (id.startsWith('custom-')) {
    return customs.find(function (e) { return e.id === id }) || null
  }
  return PREBUILT_EXERCISES.find(function (e) { return e.id === id }) || null
}

function filterExercises(
  exercises: StoryMapExercise[],
  difficulty: string,
  band: string,
): StoryMapExercise[] {
  let result = exercises
  if (difficulty !== 'all') {
    result = result.filter(function (e) { return e.difficulty === difficulty })
  }
  if (band !== 'all') {
    result = result.filter(function (e) { return e.band === band })
  }
  return result
}

function shuffleArray(arr: StoryMapExercise[]): StoryMapExercise[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

// Auto-generate a story excerpt from teacher input
function generateExcerpt(cfg: StoryMapWidgetConfig): string {
  const parts: string[] = []
  if (cfg.teacherProtagonist) {
    parts.push(cfg.teacherProtagonist + ' faced an impossible challenge.')
  }
  if (cfg.teacherAntagonist) {
    parts.push('Standing in the way was ' + cfg.teacherAntagonist + ', who seemed unstoppable.')
  }
  if (cfg.teacherSettingTime || cfg.teacherSettingPlace) {
    const whenPart = cfg.teacherSettingTime ? 'in ' + cfg.teacherSettingTime : ''
    const wherePart = cfg.teacherSettingPlace ? ' at ' + cfg.teacherSettingPlace : ''
    parts.push('The story unfolds ' + whenPart + wherePart + '.')
  }
  if (cfg.teacherRisingAction) {
    const lowered = cfg.teacherRisingAction.charAt(0).toLowerCase() + cfg.teacherRisingAction.slice(1)
    parts.push('As tensions built, ' + lowered + '.')
  }
  if (cfg.teacherClimax) {
    const lowered2 = cfg.teacherClimax.charAt(0).toLowerCase() + cfg.teacherClimax.slice(1)
    parts.push('At the peak of the story, ' + lowered2 + '.')
  }
  if (cfg.teacherResolution) {
    const lowered3 = cfg.teacherResolution.charAt(0).toLowerCase() + cfg.teacherResolution.slice(1)
    parts.push('In the end, ' + lowered3 + '.')
  }
  return parts.length > 0 ? parts.join(' ') : ''
}

// Auto-generate 3 options from teacher input, with the most detailed element first
function generateOptions(cfg: StoryMapWidgetConfig): [string, string, string] {
  const elements: { name: string; len: number }[] = []
  if (cfg.teacherClimax) elements.push({ name: 'Climax', len: cfg.teacherClimax.length })
  if (cfg.teacherRisingAction) elements.push({ name: 'Rising Action', len: cfg.teacherRisingAction.length })
  if (cfg.teacherResolution) elements.push({ name: 'Resolution', len: cfg.teacherResolution.length })
  if (cfg.teacherProtagonist) elements.push({ name: 'Protagonist', len: cfg.teacherProtagonist.length })
  if (cfg.teacherAntagonist) elements.push({ name: 'Antagonist', len: cfg.teacherAntagonist.length })
  if (cfg.teacherTheme) elements.push({ name: 'Theme', len: cfg.teacherTheme.length })
  if (cfg.teacherSettingTime || cfg.teacherSettingPlace) elements.push({ name: 'Setting', len: (cfg.teacherSettingTime + cfg.teacherSettingPlace).length })
  if (cfg.teacherFallingAction) elements.push({ name: 'Falling Action', len: cfg.teacherFallingAction.length })

  elements.sort(function (a, b) { return b.len - a.len })

  let picked = elements.slice(0, 3).map(function (e) { return e.name })
  while (picked.length < 3) {
    picked.push('Theme')
  }
  return [picked[0], picked[1], picked[2]] as [string, string, string]
}

// CSS-based story arc visualization (no SVG)
function StoryArcViz({ isDark, config }: { isDark: boolean; config: StoryMapWidgetConfig }) {
  const hasRising = !!(config.teacherRisingAction)
  const hasClimax = !!(config.teacherClimax)
  const hasFalling = !!(config.teacherFallingAction)
  const hasResolution = !!(config.teacherResolution)
  const hasExposition = !!(config.teacherProtagonist || config.teacherSettingTime || config.teacherSettingPlace)
  const anyData = hasRising || hasClimax || hasFalling || hasResolution || hasExposition

  if (!anyData) {
    return (
      <div style={{
        padding: 12, borderRadius: 6, textAlign: 'center' as const,
        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
        color: isDark ? '#94a3b8' : '#64748b', fontSize: 10,
      }}>
        Fill in story elements below to see the arc visualization
      </div>
    )
  }

  const lineColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'

  return (
    <div style={{ position: 'relative', height: 100, marginTop: 4, borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', overflow: 'hidden' }}>
      {/* Arc line using border trick */}
      <div style={{
        position: 'absolute', bottom: 22, left: '8%', right: '8%', height: 44,
        borderTop: '2px solid ' + lineColor,
        borderRadius: '999px 999px 0 0',
      }} />
      {/* Plot points */}
      {hasExposition && (
        <div style={{
          position: 'absolute', left: '12%', bottom: 24, width: 8, height: 8,
          borderRadius: '50%', background: '#94a3b8',
        }} />
      )}
      {hasRising && (
        <div style={{
          position: 'absolute', left: '35%', top: 32, width: 8, height: 8,
          borderRadius: '50%', background: '#34d399',
        }} />
      )}
      {hasClimax && (
        <div style={{
          position: 'absolute', left: '48%', top: 8, width: 10, height: 10,
          borderRadius: '50%', background: '#f87171',
        }} />
      )}
      {hasFalling && (
        <div style={{
          position: 'absolute', left: '62%', top: 32, width: 8, height: 8,
          borderRadius: '50%', background: '#60a5fa',
        }} />
      )}
      {hasResolution && (
        <div style={{
          position: 'absolute', right: '12%', bottom: 24, width: 8, height: 8,
          borderRadius: '50%', background: '#a78bfa',
        }} />
      )}
      {/* Labels */}
      <div style={{ position: 'absolute', bottom: 2, left: '6%', fontSize: 8, color: hasExposition ? '#94a3b8' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') }}>Exposition</div>
      <div style={{ position: 'absolute', bottom: 2, left: '32%', fontSize: 8, color: hasRising ? '#34d399' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') }}>Rising</div>
      <div style={{ position: 'absolute', top: 2, left: '44%', fontSize: 8, color: hasClimax ? '#f87171' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'), fontWeight: 700 }}>Climax</div>
      <div style={{ position: 'absolute', bottom: 2, right: '22%', fontSize: 8, color: hasFalling ? '#60a5fa' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') }}>Falling</div>
      <div style={{ position: 'absolute', bottom: 2, right: '6%', fontSize: 8, color: hasResolution ? '#a78bfa' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') }}>Resolution</div>
    </div>
  )
}

// ============================================================
// Main Component
// ============================================================

export function StoryElementsMapWidget({ isDark, config, onConfigChange, compact }: StoryMapProps) {
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
  isDark: boolean
  config: StoryMapWidgetConfig
  onConfigChange: (p: Partial<StoryMapWidgetConfig>) => void
  fs: number
  s: ReturnType<typeof sh>
  compact: boolean
}) {
  const allExercises = useMemo(function () {
    const filtered = filterExercises(PREBUILT_EXERCISES, config.filterDifficulty, config.filterBand)
    return filtered.concat(config.customExercises)
  }, [config.filterDifficulty, config.filterBand, config.customExercises])

  const exerciseList = useMemo(function () {
    if (config.exerciseIds.length > 0) {
      const validIds = config.exerciseIds.filter(function (id) {
        return getExerciseById(id, config.customExercises) !== null
      })
      return validIds
    }
    return shuffleArray(allExercises).map(function (e) { return e.id })
  }, [allExercises, config.exerciseIds, config.customExercises])

  const currentExercise = useMemo(function (): StoryMapExercise | null {
    if (exerciseList.length === 0) return null
    const idx = config.currentIndex % exerciseList.length
    const id = exerciseList[idx]
    return getExerciseById(id, config.customExercises)
  }, [exerciseList, config.currentIndex, config.customExercises])

  const isCorrect = config.checked && config.selected !== null && currentExercise !== null && config.selected === currentExercise.correctIndex

  const handleSelect = useCallback(function (idx: number) {
    if (config.checked) return
    onConfigChange({ selected: idx })
  }, [config.checked, onConfigChange])

  const handleCheck = useCallback(function () {
    if (config.selected === null || !currentExercise) return
    const correct = config.selected === currentExercise.correctIndex
    onConfigChange({
      checked: true,
      score: correct ? config.score + 1 : config.score,
      totalAttempted: config.totalAttempted + 1,
    })
  }, [config.selected, config.score, config.totalAttempted, currentExercise, onConfigChange])

  const handleNext = useCallback(function () {
    onConfigChange({
      currentIndex: config.currentIndex + 1,
      selected: null,
      checked: false,
    })
  }, [config.currentIndex, onConfigChange])

  const handleShuffle = useCallback(function () {
    const shuffled = shuffleArray(allExercises).map(function (e) { return e.id })
    onConfigChange({ exerciseIds: shuffled, currentIndex: 0, selected: null, checked: false, score: 0, totalAttempted: 0 })
  }, [allExercises, onConfigChange])

  const handleFilterChange = useCallback(function (key: 'filterDifficulty' | 'filterBand', value: string) {
    const newDifficulty = key === 'filterDifficulty' ? value : config.filterDifficulty
    const newBand = key === 'filterBand' ? value : config.filterBand
    const filtered = filterExercises(PREBUILT_EXERCISES, newDifficulty, newBand)
    const shuffled = shuffleArray(filtered.concat(config.customExercises)).map(function (e) { return e.id })
    onConfigChange({
      [key]: value,
      exerciseIds: shuffled, currentIndex: 0, selected: null, checked: false, score: 0, totalAttempted: 0,
    })
  }, [config.filterDifficulty, config.filterBand, config.customExercises, onConfigChange])

  const displayIndex = (config.currentIndex % Math.max(exerciseList.length, 1)) + 1
  const totalExercises = exerciseList.length

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
          <button onClick={function () { onConfigChange({ mode: 'student' }) }} style={{
            ...s.btn(true), padding: '2px 6px', fontSize: 9, fontWeight: 700,
          }}>Practice</button>
          <button onClick={function () { onConfigChange({ mode: 'teacher' }) }} style={{
            ...s.btn(false), padding: '2px 6px', fontSize: 9,
          }}>Author</button>
        </div>
        <div style={{ fontSize: 9, color: s.text }}>
          {displayIndex}/{totalExercises} | Score: {config.score}/{config.totalAttempted}
        </div>
      </div>

      {/* Filters (collapsible in non-compact) */}
      {!compact && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '4px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: s.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>Level:</span>
            {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(function (d) {
              return (
                <button key={d} onClick={function () { handleFilterChange('filterDifficulty', d) }} style={s.btn(config.filterDifficulty === d)}>
                  {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              )
            })}
            <span style={{ fontSize: 8, color: s.text, margin: '0 2px' }}>|</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: s.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>Band:</span>
            <select value={config.filterBand} onChange={function (e) { handleFilterChange('filterBand', e.target.value) }} style={selectStyle}>
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
          No exercises match your filters. Try adjusting the difficulty or grade band.
        </div>
      ) : (
        <React.Fragment>
          {/* Question */}
          <div style={{
            padding: '8px 10px', borderRadius: 6, background: s.bg,
            border: '1px solid ' + s.border, fontSize: fs + 1, lineHeight: 1.5, color: s.bright,
          }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
              {currentExercise.difficulty} | {currentExercise.band} | {currentExercise.title}
            </div>
            {currentExercise.question}
          </div>

          {/* Excerpt */}
          {currentExercise.excerpt && (
            <div style={{
              padding: '6px 10px', borderRadius: 5,
              background: isDark ? 'rgba(192,132,252,0.06)' : 'rgba(192,132,252,0.04)',
              border: '1px solid rgba(192,132,252,0.15)',
              fontStyle: 'italic' as const, fontSize: fs, lineHeight: 1.6, color: s.bright,
            }}>
              {currentExercise.excerpt}
            </div>
          )}

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {currentExercise.options.map(function (opt, i) {
              const isSel = config.selected === i
              const showCorrect = config.checked && i === currentExercise.correctIndex
              const showWrong = config.checked && isSel && i !== currentExercise.correctIndex
              const elColor = ELEMENT_COLORS[opt] || '#94a3b8'
              return (
                <button key={i} onClick={function () { handleSelect(i) }} style={{
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
              {config.selected !== null && (
                <div style={{ color: s.bright }}>
                  {currentExercise.explanations[config.selected]}
                </div>
              )}
              {!isCorrect && (
                <div style={{ marginTop: 3, color: '#4ade80' }}>
                  Correct answer: {currentExercise.explanations[currentExercise.correctIndex]}
                </div>
              )}
            </div>
          )}
        </React.Fragment>
      )}
    </div>
  )
}

// ============================================================
// Teacher Mode Sub-Component
// ============================================================

function TeacherMode({ isDark, config, onConfigChange, fs, s, compact }: {
  isDark: boolean
  config: StoryMapWidgetConfig
  onConfigChange: (p: Partial<StoryMapWidgetConfig>) => void
  fs: number
  s: ReturnType<typeof sh>
  compact: boolean
}) {
  const fieldStyle: React.CSSProperties = { ...s.input, width: '100%', boxSizing: 'border-box' as const, fontFamily: 'inherit' as const }
  const labelStyle: React.CSSProperties = { fontSize: 9, fontWeight: 600, color: s.text, marginBottom: 1, display: 'block' }

  const selectStyle = {
    padding: '3px 6px', borderRadius: 4, fontSize: 9,
    border: '1px solid ' + s.border, background: s.bg,
    color: s.bright, cursor: 'pointer' as const, outline: 'none' as const,
  }

  // Auto-generate options when any story element changes
  const handleFieldChange = useCallback(function (key: string, value: string) {
    const patch: Record<string, unknown> = {}
    patch[key] = value
    onConfigChange(patch as Partial<StoryMapWidgetConfig>)
  }, [onConfigChange])

  const handleOptionEdit = useCallback(function (index: number, value: string) {
    const newOptions: [string, string, string] = [config.teacherOptions[0], config.teacherOptions[1], config.teacherOptions[2]]
    newOptions[index] = value
    const newCorrect = newOptions[config.teacherCorrect].trim() === '' ? 0 : config.teacherCorrect
    onConfigChange({ teacherOptions: newOptions, teacherCorrect: newCorrect as 0 | 1 | 2 })
  }, [config.teacherOptions, config.teacherCorrect, onConfigChange])

  const handleExplanationEdit = useCallback(function (index: number, value: string) {
    const newExpl: [string, string, string] = [config.teacherExplanations[0], config.teacherExplanations[1], config.teacherExplanations[2]]
    newExpl[index] = value
    onConfigChange({ teacherExplanations: newExpl })
  }, [config.teacherExplanations, onConfigChange])

  const handleSetCorrect = useCallback(function (index: 0 | 1 | 2) {
    onConfigChange({ teacherCorrect: index })
  }, [onConfigChange])

  // Generate exercise from story elements
  const handleCreateExercise = useCallback(function () {
    if (!config.teacherTitle.trim()) return
    if (config.teacherOptions.some(function (o) { return !o.trim() })) return

    const excerpt = generateExcerpt(config)
    const question = 'In the story \'' + config.teacherTitle + '\', which plot element does this excerpt represent?'

    const newExercise: StoryMapExercise = {
      id: 'custom-' + Date.now(),
      title: config.teacherTitle,
      difficulty: 'intermediate',
      band: '6-8',
      question: question,
      excerpt: excerpt,
      options: [config.teacherOptions[0], config.teacherOptions[1], config.teacherOptions[2]],
      correctIndex: config.teacherCorrect,
      explanations: [
        config.teacherExplanations[0] || (config.teacherCorrect === 0 ? 'This is the correct answer.' : 'This is incorrect.'),
        config.teacherExplanations[1] || (config.teacherCorrect === 1 ? 'This is the correct answer.' : 'This is incorrect.'),
        config.teacherExplanations[2] || (config.teacherCorrect === 2 ? 'This is the correct answer.' : 'This is incorrect.'),
      ],
    }

    const newCustom = config.customExercises.concat([newExercise])
    onConfigChange({
      customExercises: newCustom,
      teacherTitle: '',
      teacherAuthor: '',
      teacherProtagonist: '',
      teacherAntagonist: '',
      teacherSettingTime: '',
      teacherSettingPlace: '',
      teacherConflictType: 'Man vs Man',
      teacherRisingAction: '',
      teacherClimax: '',
      teacherFallingAction: '',
      teacherResolution: '',
      teacherTheme: '',
      teacherOptions: ['', '', ''],
      teacherCorrect: 0,
      teacherExplanations: ['', '', ''],
      teacherPreview: false,
    })
  }, [config, onConfigChange])

  const handleDeleteCustom = useCallback(function (idx: number) {
    const newCustom = config.customExercises.filter(function (_, i) { return i !== idx })
    onConfigChange({ customExercises: newCustom })
  }, [config.customExercises, onConfigChange])

  // Auto-generate button
  const handleAutoGenerate = useCallback(function () {
    const opts = generateOptions(config)
    onConfigChange({ teacherOptions: opts, teacherCorrect: 0 as 0 | 1 | 2 })
  }, [config, onConfigChange])

  const hasAnyElement = config.teacherProtagonist || config.teacherClimax || config.teacherTheme || config.teacherRisingAction

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'inherit' }}>
      {/* Header: Mode toggle */}
      <div style={{ display: 'flex', gap: 2 }}>
        <button onClick={function () { onConfigChange({ mode: 'student' }) }} style={{
          ...s.btn(false), padding: '2px 6px', fontSize: 9,
        }}>Practice</button>
        <button onClick={function () { onConfigChange({ mode: 'teacher' }) }} style={{
          ...s.btn(true), padding: '2px 6px', fontSize: 9, fontWeight: 700,
        }}>Author</button>
      </div>

      {/* Story arc preview */}
      <StoryArcViz isDark={isDark} config={config} />

      {/* Authoring form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Title & Author */}
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ flex: '1 1 45%' }}>
            <label style={labelStyle}>Title *</label>
            <input
              value={config.teacherTitle}
              onChange={function (e) { handleFieldChange('teacherTitle', e.target.value) }}
              style={fieldStyle}
              placeholder='Story title'
            />
          </div>
          <div style={{ flex: '1 1 45%' }}>
            <label style={labelStyle}>Author</label>
            <input
              value={config.teacherAuthor}
              onChange={function (e) { handleFieldChange('teacherAuthor', e.target.value) }}
              style={fieldStyle}
              placeholder='Author name'
            />
          </div>
        </div>

        {/* Protagonist & Antagonist */}
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ flex: '1 1 45%' }}>
            <label style={labelStyle}>Protagonist</label>
            <input
              value={config.teacherProtagonist}
              onChange={function (e) { handleFieldChange('teacherProtagonist', e.target.value) }}
              style={fieldStyle}
              placeholder='Main character'
            />
          </div>
          <div style={{ flex: '1 1 45%' }}>
            <label style={labelStyle}>Antagonist</label>
            <input
              value={config.teacherAntagonist}
              onChange={function (e) { handleFieldChange('teacherAntagonist', e.target.value) }}
              style={fieldStyle}
              placeholder='Opposing force'
            />
          </div>
        </div>

        {/* Setting: Time, Place, Conflict Type */}
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ flex: '1 1 30%' }}>
            <label style={labelStyle}>Time</label>
            <input
              value={config.teacherSettingTime}
              onChange={function (e) { handleFieldChange('teacherSettingTime', e.target.value) }}
              style={fieldStyle}
              placeholder='When?'
            />
          </div>
          <div style={{ flex: '1 1 30%' }}>
            <label style={labelStyle}>Place</label>
            <input
              value={config.teacherSettingPlace}
              onChange={function (e) { handleFieldChange('teacherSettingPlace', e.target.value) }}
              style={fieldStyle}
              placeholder='Where?'
            />
          </div>
          <div style={{ flex: '1 1 30%' }}>
            <label style={labelStyle}>Conflict</label>
            <select value={config.teacherConflictType} onChange={function (e) { handleFieldChange('teacherConflictType', e.target.value) }} style={{ ...fieldStyle, cursor: 'pointer' as const }}>
              {CONFLICT_TYPES.map(function (c) {
                return <option key={c} value={c}>{c}</option>
              })}
            </select>
          </div>
        </div>

        {/* Rising Action */}
        <div>
          <label style={labelStyle}>Rising Action</label>
          <input
            value={config.teacherRisingAction}
            onChange={function (e) { handleFieldChange('teacherRisingAction', e.target.value) }}
            style={fieldStyle}
            placeholder='Events building tension...'
          />
        </div>

        {/* Climax */}
        <div>
          <label style={labelStyle}>Climax</label>
          <input
            value={config.teacherClimax}
            onChange={function (e) { handleFieldChange('teacherClimax', e.target.value) }}
            style={fieldStyle}
            placeholder='The turning point...'
          />
        </div>

        {/* Falling Action */}
        <div>
          <label style={labelStyle}>Falling Action</label>
          <input
            value={config.teacherFallingAction}
            onChange={function (e) { handleFieldChange('teacherFallingAction', e.target.value) }}
            style={fieldStyle}
            placeholder='Events after the climax...'
          />
        </div>

        {/* Resolution */}
        <div>
          <label style={labelStyle}>Resolution</label>
          <input
            value={config.teacherResolution}
            onChange={function (e) { handleFieldChange('teacherResolution', e.target.value) }}
            style={fieldStyle}
            placeholder='How the story concludes...'
          />
        </div>

        {/* Theme */}
        <div>
          <label style={labelStyle}>Theme</label>
          <input
            value={config.teacherTheme}
            onChange={function (e) { handleFieldChange('teacherTheme', e.target.value) }}
            style={fieldStyle}
            placeholder='Central message or lesson...'
          />
        </div>

        {/* Divider when elements are filled */}
        {hasAnyElement && (
          <div style={{ borderTop: '1px solid ' + s.border, margin: '2px 0' }} />
        )}

        {/* Exercise Options (shown when elements are filled) */}
        {hasAnyElement && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: s.text }}>
                Answer Options (click circle to mark correct):
              </div>
              <button onClick={handleAutoGenerate} style={{ ...s.btn(false), fontSize: 8, padding: '1px 6px' }}>
                Auto-fill Options
              </button>
            </div>
            {[0, 1, 2].map(function (i) {
              return (
                <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                  <button
                    onClick={function () { handleSetCorrect(i as 0 | 1 | 2) }}
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
                    onChange={function (e) { handleOptionEdit(i, e.target.value) }}
                    placeholder={i === 0 ? 'Correct plot element...' : 'Distractor element...'}
                    style={{
                      ...fieldStyle, fontSize: 10, flex: 1,
                      border: '1px solid ' + (config.teacherCorrect === i ? 'rgba(34,197,94,0.5)' : s.border),
                    }}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* Explanations */}
        {hasAnyElement && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: s.text }}>
              Explanations (optional, for each option):
            </div>
            {[0, 1, 2].map(function (i) {
              return (
                <input
                  key={i}
                  value={config.teacherExplanations[i]}
                  onChange={function (e) { handleExplanationEdit(i, e.target.value) }}
                  placeholder={'Why option ' + String.fromCharCode(65 + i) + ' is correct/wrong...'}
                  style={{ ...fieldStyle, fontSize: 9 }}
                />
              )
            })}
          </div>
        )}

        {/* Preview toggle */}
        {hasAnyElement && (
          <button onClick={function () { onConfigChange({ teacherPreview: !config.teacherPreview }) }} style={s.btn(config.teacherPreview)}>
            {config.teacherPreview ? 'Hide Preview' : 'Preview as Student'}
          </button>
        )}

        {/* Student Preview */}
        {config.teacherPreview && config.teacherOptions.some(function (o) { return o.trim() }) && (
          <div style={{ padding: '6px 8px', borderRadius: 6, background: isDark ? 'rgba(192,132,252,0.06)' : 'rgba(192,132,252,0.04)', border: '1px solid rgba(192,132,252,0.2)' }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#c084fc', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Student View Preview</div>
            <div style={{ fontSize: fs, color: s.bright, marginBottom: 4 }}>
              In the story '{config.teacherTitle}', which plot element does this excerpt represent?
            </div>
            <div style={{ fontSize: fs - 1, fontStyle: 'italic', color: s.text, marginBottom: 4, padding: '4px 6px', borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              {generateExcerpt(config) || '(No excerpt generated yet — fill in more story elements)'}
            </div>
            {config.teacherOptions.filter(function (o) { return o.trim() }).map(function (opt, i) {
              return (
                <div key={i} style={{
                  padding: '3px 6px', marginBottom: 2, borderRadius: 4, fontSize: fs,
                  border: '1px solid ' + (i === config.teacherCorrect ? 'rgba(34,197,94,0.3)' : s.border),
                  background: i === config.teacherCorrect ? 'rgba(34,197,94,0.06)' : 'transparent',
                  color: s.bright,
                }}>
                  {String.fromCharCode(65 + i) + '. ' + opt}
                </div>
              )
            })}
          </div>
        )}

        {/* Create Exercise button */}
        {config.teacherTitle.trim() && config.teacherOptions.every(function (o) { return o.trim() }) && (
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
          {config.customExercises.map(function (ex, i) {
            return (
              <div key={ex.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4,
                padding: '3px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border,
              }}>
                <div style={{ fontSize: 9, color: s.bright, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ex.title} — {ex.options[ex.correctIndex]}
                </div>
                <div style={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 8, color: '#c084fc', fontWeight: 600 }}>{ex.band}</span>
                  <button onClick={function () { handleDeleteCustom(i) }} style={{
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
