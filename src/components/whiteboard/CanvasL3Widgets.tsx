'use client'

import React, { useState, useCallback, useMemo } from 'react'
import type { WidgetElement } from '@/lib/whiteboard/types'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

// ============================================================
// L3 Interactive Canvas Widgets — Quiz, Enhanced Flashcards
// These are "fully interactive on canvas" widgets that sync
// all state via element.config so changes propagate to
// collaborators in real-time.
// ============================================================

interface CanvasWidgetProps {
  element: WidgetElement
  isDark: boolean
}

/** Immediate config updater (no debounce — click interactions need instant feedback) */
function useConfigUpdater(elementId: string) {
  const updateElement = useWhiteboardStore((s) => s.updateElement)
  const pendingRef = useRef<Record<string, unknown>>({})
  const rafRef = useRef<number>(0)

  const updateConfig = useCallback((patch: Record<string, unknown>) => {
    Object.assign(pendingRef.current, patch)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      updateElement(elementId, { config: { ...pendingRef.current } } as Partial<WidgetElement>)
      pendingRef.current = {}
    })
  }, [updateElement, elementId])

  React.useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  return updateConfig
}

import { useRef, useEffect } from 'react'

// ============================================================
// L3 QUIZ WIDGET
// Full quiz system on the canvas: create MC/TF/SA questions,
// take quizzes, view results — all state in element.config.
// ============================================================

type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer'
type QuizMode = 'list' | 'take' | 'results' | 'create-q'

interface CanvasQuestion {
  id: string
  type: QuestionType
  text: string
  options: string[]
  correctAnswer: string
  explanation: string
}

interface CanvasQuizResult {
  studentName: string
  answers: Record<string, { answer: string; isCorrect: boolean; timeSpent: number }>
  score: number
  total: number
  timestamp: number
}

interface CanvasQuizData {
  title: string
  questions: CanvasQuestion[]
  results: CanvasQuizResult[]
  mode: QuizMode
  activeQuestionIdx: number
  currentAnswers: Record<string, string>
  studentName: string
  qStartTime: number
}

let _uid = 0
function quizUid() { return 'cq_' + Date.now().toString(36) + '_' + (++_uid) }

const Q_TYPE_LABELS: Record<QuestionType, string> = {
  'multiple-choice': 'MC',
  'true-false': 'T/F',
  'short-answer': 'SA',
}

const QUICK_QUIZZES: Record<string, { title: string; questions: CanvasQuestion[] }> = {
  math: {
    title: 'Quick Math Check',
    questions: [
      { id: quizUid(), type: 'multiple-choice', text: 'What is 7 x 8?', options: ['54', '56', '58', '64'], correctAnswer: '1', explanation: '7 x 8 = 56' },
      { id: quizUid(), type: 'true-false', text: 'A triangle with all equal sides is equilateral.', options: [], correctAnswer: 'true', explanation: 'Correct!' },
      { id: quizUid(), type: 'short-answer', text: 'What is 15% of 200?', options: [], correctAnswer: '30', explanation: '15/100 x 200 = 30' },
    ],
  },
  tf: {
    title: 'True or False',
    questions: [
      { id: quizUid(), type: 'true-false', text: 'The Earth revolves around the Sun.', options: [], correctAnswer: 'true', explanation: 'Correct!' },
      { id: quizUid(), type: 'true-false', text: 'Water boils at 90 C at sea level.', options: [], correctAnswer: 'false', explanation: 'Water boils at 100 C.' },
      { id: quizUid(), type: 'true-false', text: 'Photosynthesis produces oxygen.', options: [], correctAnswer: 'true', explanation: 'Correct!' },
    ],
  },
}

const DEFAULT_QUIZ: CanvasQuizData = {
  title: '',
  questions: [],
  results: [],
  mode: 'list',
  activeQuestionIdx: 0,
  currentAnswers: {},
  studentName: '',
  qStartTime: Date.now(),
}

export function CanvasQuiz({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const cfg: CanvasQuizData = {
    ...DEFAULT_QUIZ,
    ...raw,
    questions: (raw.questions as CanvasQuestion[]) || [],
    results: (raw.results as CanvasQuizResult[]) || [],
    currentAnswers: (raw.currentAnswers as Record<string, string>) || {},
  }

  const { mode, questions, results, title, activeQuestionIdx, currentAnswers, studentName, qStartTime } = cfg
  const s = styles(isDark)

  // ---- Mode switchers ----
  const setMode = useCallback((m: QuizMode) => updateConfig({ mode: m }), [updateConfig])
  const setTitle = useCallback((t: string) => updateConfig({ title: t }), [updateConfig])
  const setStudentName = useCallback((n: string) => updateConfig({ studentName: n }), [updateConfig])

  // ---- Question management ----
  const addQuestion = useCallback((type: QuestionType) => {
    const q: CanvasQuestion = {
      id: quizUid(), type, text: '',
      options: type === 'multiple-choice' ? ['A', 'B', 'C', 'D'] : [],
      correctAnswer: type === 'true-false' ? 'true' : (type === 'multiple-choice' ? '0' : ''),
      explanation: '',
    }
    const newQs = [...questions, q]
    updateConfig({ questions: newQs, mode: 'create-q', activeQuestionIdx: newQs.length - 1 })
  }, [questions, updateConfig])

  const updateQuestion = useCallback((idx: number, patch: Partial<CanvasQuestion>) => {
    const newQs = questions.map((q, i) => i === idx ? { ...q, ...patch } : q)
    updateConfig({ questions: newQs })
  }, [questions, updateConfig])

  const removeQuestion = useCallback((idx: number) => {
    const newQs = questions.filter((_, i) => i !== idx)
    updateConfig({ questions: newQs, activeQuestionIdx: Math.max(0, Math.min(activeQuestionIdx, newQs.length - 1)) })
  }, [questions, activeQuestionIdx, updateConfig])

  // ---- Quick quiz creation ----
  const createQuickQuiz = useCallback((key: string) => {
    const tmpl = QUICK_QUIZZES[key]
    if (!tmpl) return
    updateConfig({
      title: tmpl.title,
      questions: tmpl.questions,
      results: [],
      mode: 'list',
      activeQuestionIdx: 0,
      currentAnswers: {},
      studentName: '',
      qStartTime: Date.now(),
    })
  }, [updateConfig])

  // ---- Take quiz ----
  const startTake = useCallback(() => {
    updateConfig({ mode: 'take', currentAnswers: {}, activeQuestionIdx: 0, studentName: '', qStartTime: Date.now() })
  }, [updateConfig])

  const submitAnswer = useCallback((qId: string, answer: string) => {
    const newAnswers = { ...currentAnswers, [qId]: answer }
    updateConfig({ currentAnswers: newAnswers, qStartTime: Date.now() })
  }, [currentAnswers, updateConfig])

  const finishQuiz = useCallback(() => {
    const qResults = questions.map(q => {
      const ans = currentAnswers[q.id] || ''
      let isCorrect = false
      if (q.type === 'short-answer') {
        isCorrect = ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
      } else {
        isCorrect = ans === q.correctAnswer
      }
      return { questionId: q.id, answer: ans, isCorrect, timeSpent: 0 }
    })
    const score = qResults.filter(r => r.isCorrect).length
    const newResult: CanvasQuizResult = {
      studentName: studentName || 'Student',
      answers: Object.fromEntries(qResults.map(r => [r.questionId, r])),
      score, total: questions.length, timestamp: Date.now(),
    }
    updateConfig({
      results: [...results, newResult],
      mode: 'results',
      activeQuestionIdx: 0,
    })
  }, [questions, currentAnswers, studentName, results, updateConfig])

  // ---- Delete quiz ----
  const clearQuiz = useCallback(() => {
    updateConfig({
      title: '', questions: [], results: [], mode: 'list',
      activeQuestionIdx: 0, currentAnswers: {}, studentName: '', qStartTime: Date.now(),
    })
  }, [updateConfig])

  // ============================================================
  // RENDER: List mode
  // ============================================================
  if (mode === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Quiz</span>
          {title && <span style={{ fontSize: 10, color: s.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>- {title}</span>}
        </div>

        {questions.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 10, color: s.text, textAlign: 'center', lineHeight: 1.5 }}>
              No quiz created yet.<br />Use quick start or build custom.
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: 10, color: s.text, marginBottom: 6 }}>{questions.length} question{questions.length !== 1 ? 's' : ''} | {results.length} attempt{results.length !== 1 ? 's' : ''}</div>
            {questions.map((q, i) => (
              <div key={q.id} style={{ padding: '4px 6px', borderRadius: 4, marginBottom: 3, background: s.surface, border: '1px solid ' + s.border, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: s.accent, width: 16 }}>{i + 1}</span>
                <span style={{ fontSize: 8, fontWeight: 600, color: s.text, padding: '1px 4px', borderRadius: 2, background: s.surface, border: '1px solid ' + s.border }}>{Q_TYPE_LABELS[q.type]}</span>
                <span style={{ fontSize: 10, color: s.bright, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.text || '...'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Quick start buttons */}
          <div style={{ display: 'flex', gap: 3 }}>
            <button onClick={() => createQuickQuiz('math')} style={s.btnSm('#a5b4fc', 'rgba(99,102,241,0.12)', 'rgba(99,102,241,0.3)')}>+ Math</button>
            <button onClick={() => createQuickQuiz('tf')} style={s.btnSm('#fbbf24', 'rgba(245,158,11,0.12)', 'rgba(245,158,11,0.3)')}>+ T/F</button>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {['multiple-choice', 'true-false', 'short-answer'].map((type) => (
              <button key={type} onClick={() => addQuestion(type as QuestionType)} style={s.btnSm()}>+ {Q_TYPE_LABELS[type as QuestionType]}</button>
            ))}
          </div>
          {questions.length > 0 && (
            <div style={{ display: 'flex', gap: 3 }}>
              <button onClick={() => { setMode('create-q'); updateConfig({ activeQuestionIdx: 0 }) }} style={s.btnSm('#60a5fa', 'rgba(59,130,246,0.12)', 'rgba(59,130,246,0.3)')}>Edit</button>
              <button onClick={startTake} style={s.btnSm('#34d399', 'rgba(5,150,105,0.12)', 'rgba(5,150,105,0.3)')}>Take</button>
              {results.length > 0 && (
                <button onClick={() => { setMode('results'); updateConfig({ activeQuestionIdx: 0 }) }} style={s.btnSm('#f59e0b', 'rgba(245,158,11,0.12)', 'rgba(245,158,11,0.3)')}>Results ({results.length})</button>
              )}
              <button onClick={clearQuiz} style={s.btnSm('#f87171', 'rgba(239,68,68,0.08)', 'rgba(239,68,68,0.2)')}>Clear</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER: Create/Edit question mode
  // ============================================================
  if (mode === 'create-q') {
    const q = questions[activeQuestionIdx]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setMode('list')} style={{ background: 'none', border: 'none', color: s.text, cursor: 'pointer', padding: '0 2px', fontSize: 14 }}>&larr;</button>
          <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Edit Quiz</span>
          {title && <span style={{ fontSize: 10, color: s.text }}>- {title}</span>}
        </div>

        {/* Title input */}
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz title..." style={s.input} />

        {/* Question tabs */}
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {questions.map((qq, i) => (
            <button key={qq.id} onClick={() => updateConfig({ activeQuestionIdx: i })} style={s.tabBtn(i === activeQuestionIdx)}>
              Q{i + 1}
            </button>
          ))}
          <button onClick={() => addQuestion('multiple-choice')} style={{ ...s.tabBtn(false), borderStyle: 'dashed' }}>+</button>
        </div>

        {q && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: s.text }}>{Q_TYPE_LABELS[q.type]} Question</span>
              <button onClick={() => removeQuestion(activeQuestionIdx)} style={{ fontSize: 10, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
            </div>

            <textarea value={q.text} onChange={(e) => updateQuestion(activeQuestionIdx, { text: e.target.value })} placeholder="Question text..." rows={2} style={{ ...s.input, resize: 'vertical', minHeight: 40 }} />

            {/* MC options */}
            {q.type === 'multiple-choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 9, color: s.text }}>Click to set correct answer</span>
                {q.options.map((opt, oi) => (
                  <div key={oi} onClick={() => updateQuestion(activeQuestionIdx, { correctAnswer: String(oi) })} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 5, cursor: 'pointer',
                    background: q.correctAnswer === String(oi) ? 'rgba(34,197,94,0.1)' : s.surface,
                    border: '1px solid ' + (q.correctAnswer === String(oi) ? 'rgba(34,197,94,0.4)' : s.border),
                  }}>
                    <span style={{
                      width: 16, height: 16, borderRadius: '50%', fontSize: 9, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: q.correctAnswer === String(oi) ? 'rgba(34,197,94,0.3)' : s.surface,
                      color: q.correctAnswer === String(oi) ? '#4ade80' : s.text,
                    }}>{String.fromCharCode(65 + oi)}</span>
                    <input value={opt} onChange={(e) => {
                      const newOpts = [...q.options]; newOpts[oi] = e.target.value
                      updateQuestion(activeQuestionIdx, { options: newOpts })
                    }} onClick={(e) => e.stopPropagation()} style={{ flex: 1, background: 'none', border: 'none', color: s.bright, fontSize: 11, outline: 'none', padding: 0 }} />
                  </div>
                ))}
              </div>
            )}

            {/* T/F */}
            {q.type === 'true-false' && (
              <div style={{ display: 'flex', gap: 6 }}>
                {['true', 'false'].map(v => (
                  <button key={v} onClick={() => updateQuestion(activeQuestionIdx, { correctAnswer: v })} style={{
                    flex: 1, padding: '6px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'center',
                    background: q.correctAnswer === v ? 'rgba(34,197,94,0.12)' : s.surface,
                    border: '1px solid ' + (q.correctAnswer === v ? 'rgba(34,197,94,0.4)' : s.border),
                    color: q.correctAnswer === v ? '#4ade80' : s.text,
                  }}>{v === 'true' ? 'True' : 'False'}</button>
                ))}
              </div>
            )}

            {/* Short answer */}
            {q.type === 'short-answer' && (
              <div>
                <span style={{ fontSize: 9, color: s.text }}>Correct answer (case-insensitive)</span>
                <input value={q.correctAnswer} onChange={(e) => updateQuestion(activeQuestionIdx, { correctAnswer: e.target.value })} placeholder="Expected answer..." style={{ ...s.input, marginTop: 3 }} />
              </div>
            )}

            {/* Explanation */}
            <div>
              <span style={{ fontSize: 9, color: s.text }}>Explanation (optional)</span>
              <input value={q.explanation || ''} onChange={(e) => updateQuestion(activeQuestionIdx, { explanation: e.target.value })} placeholder="Why is this correct?" style={{ ...s.input, marginTop: 3 }} />
            </div>
          </div>
        )}

        <button onClick={() => setMode('list')} style={s.primaryBtn}>Done Editing</button>
      </div>
    )
  }

  // ============================================================
  // RENDER: Take quiz mode
  // ============================================================
  if (mode === 'take') {
    const q = questions[activeQuestionIdx]
    const answeredCount = questions.filter(qq => currentAnswers[qq.id]).length
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setMode('list')} style={{ background: 'none', border: 'none', color: s.text, cursor: 'pointer', padding: '0 2px', fontSize: 14 }}>&larr;</button>
          <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>{title || 'Quiz'}</span>
          <span style={{ fontSize: 10, color: s.text, marginLeft: 'auto' }}>{answeredCount}/{questions.length}</span>
        </div>

        {/* Student name (if not set) */}
        {!studentName && (
          <div style={{ display: 'flex', gap: 4 }}>
            <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Your name..." style={{ ...s.input, flex: 1 }} />
          </div>
        )}

        {/* Progress bar */}
        <div style={{ height: 3, borderRadius: 2, background: s.surface }}>
          <div style={{ height: '100%', borderRadius: 2, background: s.accent, width: (answeredCount / questions.length * 100) + '%', transition: 'width 0.2s' }} />
        </div>

        {q && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 9, color: s.text, fontWeight: 600 }}>Question {activeQuestionIdx + 1} of {questions.length} ({Q_TYPE_LABELS[q.type]})</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.bright, lineHeight: 1.4 }}>{q.text}</div>

            {/* MC options */}
            {q.type === 'multiple-choice' && q.options.map((opt, oi) => {
              const selected = currentAnswers[q.id] === String(oi)
              return (
                <div key={oi} onClick={() => submitAnswer(q.id, String(oi))} style={{
                  padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                  background: selected ? 'rgba(59,130,246,0.12)' : s.surface,
                  border: '1px solid ' + (selected ? 'rgba(59,130,246,0.4)' : s.border),
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: selected ? 'rgba(59,130,246,0.3)' : s.surface,
                    border: '1px solid ' + (selected ? 'rgba(59,130,246,0.5)' : s.border),
                    color: selected ? '#60a5fa' : s.text,
                  }}>{String.fromCharCode(65 + oi)}</span>
                  <span style={{ fontSize: 11, color: s.bright }}>{opt}</span>
                </div>
              )
            })}

            {/* T/F */}
            {q.type === 'true-false' && (
              <div style={{ display: 'flex', gap: 8 }}>
                {['true', 'false'].map(v => {
                  const selected = currentAnswers[q.id] === v
                  return (
                    <button key={v} onClick={() => submitAnswer(q.id, v)} style={{
                      flex: 1, padding: '10px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center',
                      background: selected ? 'rgba(59,130,246,0.12)' : s.surface,
                      border: '1px solid ' + (selected ? 'rgba(59,130,246,0.4)' : s.border),
                      color: selected ? '#60a5fa' : s.bright,
                    }}>{v === 'true' ? 'True' : 'False'}</button>
                  )
                })}
              </div>
            )}

            {/* Short answer */}
            {q.type === 'short-answer' && (
              <input value={currentAnswers[q.id] || ''} onChange={(e) => submitAnswer(q.id, e.target.value)} placeholder="Type your answer..." style={s.input} />
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
          <button onClick={() => updateConfig({ activeQuestionIdx: Math.max(0, activeQuestionIdx - 1) })} disabled={activeQuestionIdx === 0} style={s.btnSm()}>Prev</button>
          {activeQuestionIdx < questions.length - 1 ? (
            <button onClick={() => updateConfig({ activeQuestionIdx: activeQuestionIdx + 1 })} style={s.btnSm('#60a5fa', 'rgba(59,130,246,0.12)', 'rgba(59,130,246,0.3)')}>Next</button>
          ) : (
            <button onClick={finishQuiz} disabled={answeredCount < questions.length} style={s.primaryBtn}>Finish ({answeredCount}/{questions.length})</button>
          )}
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER: Results mode
  // ============================================================
  if (mode === 'results') {
    const result = results[activeQuestionIdx]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setMode('list')} style={{ background: 'none', border: 'none', color: s.text, cursor: 'pointer', padding: '0 2px', fontSize: 14 }}>&larr;</button>
          <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Results</span>
          <span style={{ fontSize: 10, color: s.text }}>- {title}</span>
        </div>

        {/* Result tabs */}
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {results.map((r, i) => (
            <button key={i} onClick={() => updateConfig({ activeQuestionIdx: i })} style={s.tabBtn(i === activeQuestionIdx)}>
              {r.studentName} ({r.score}/{r.total})
            </button>
          ))}
        </div>

        {result && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Score summary */}
            <div style={{ padding: '8px 10px', borderRadius: 6, background: result.score === result.total ? 'rgba(34,197,94,0.1)' : result.score >= result.total * 0.7 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', border: '1px solid ' + (result.score === result.total ? 'rgba(34,197,94,0.3)' : result.score >= result.total * 0.7 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)') }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: result.score === result.total ? '#4ade80' : result.score >= result.total * 0.7 ? '#fbbf24' : '#f87171' }}>{result.score}/{result.total}</div>
              <div style={{ fontSize: 10, color: s.text }}>{Math.round(result.score / result.total * 100)}% correct</div>
            </div>

            {/* Per-question breakdown */}
            {questions.map((q, i) => {
              const a = result.answers[q.id]
              if (!a) return null
              return (
                <div key={q.id} style={{ padding: '6px 8px', borderRadius: 5, background: s.surface, border: '1px solid ' + s.border }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: a.isCorrect ? '#4ade80' : '#f87171' }}>{a.isCorrect ? '✓' : '✗'}</span>
                    <span style={{ fontSize: 10, color: s.text, fontWeight: 600 }}>Q{i + 1}</span>
                    <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 2, background: s.surface, border: '1px solid ' + s.border, color: s.text }}>{Q_TYPE_LABELS[q.type]}</span>
                  </div>
                  <div style={{ fontSize: 10, color: s.bright, marginBottom: 2 }}>{q.text}</div>
                  {q.type === 'multiple-choice' && (
                    <div style={{ fontSize: 9, color: s.text }}>Answer: {q.options[parseInt(a.answer)] || a.answer}</div>
                  )}
                  {q.type === 'short-answer' && (
                    <div style={{ fontSize: 9, color: s.text }}>Answer: {a.answer}</div>
                  )}
                  {q.type === 'true-false' && (
                    <div style={{ fontSize: 9, color: s.text }}>Answer: {a.answer}</div>
                  )}
                  {!a.isCorrect && q.explanation && (
                    <div style={{ fontSize: 9, color: '#34d399', marginTop: 2, fontStyle: 'italic' }}>{q.explanation}</div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {results.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: s.text }}>No results yet. Take the quiz first.</span>
          </div>
        )}
      </div>
    )
  }

  return null
}

// ============================================================
// L3 FLASHCARDS WIDGET
// Custom cards with categories, config-synced state.
// ============================================================

interface FlashcardData {
  front: string
  back: string
  category: string
}

interface CanvasFlashcardsConfig {
  cards: FlashcardData[]
  index: number
  flipped: boolean
  mode: 'browse' | 'edit' | 'add'
  editFront: string
  editBack: string
  editCategory: string
  filterCategory: string
}

const DEFAULT_FLASHCARD_CONFIG: CanvasFlashcardsConfig = {
  cards: [
    { front: '2 x 7', back: '14', category: 'Multiplication' },
    { front: '8 x 6', back: '48', category: 'Multiplication' },
    { front: '9 x 7', back: '63', category: 'Multiplication' },
    { front: '12 / 4', back: '3', category: 'Division' },
    { front: '1/2 + 1/4', back: '3/4', category: 'Fractions' },
    { front: '3/5 of 20', back: '12', category: 'Fractions' },
    { front: 'Perimeter: 5x3 rect', back: '16', category: 'Geometry' },
    { front: 'Area: 5x3 rect', back: '15 sq units', category: 'Geometry' },
  ],
  index: 0,
  flipped: false,
  mode: 'browse',
  editFront: '',
  editBack: '',
  editCategory: 'Custom',
  filterCategory: 'All',
}

export function CanvasL3Flashcards({ element, isDark }: CanvasWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const cfg: CanvasFlashcardsConfig = { ...DEFAULT_FLASHCARD_CONFIG, ...raw, cards: (raw.cards as FlashcardData[]) || DEFAULT_FLASHCARD_CONFIG.cards }
  const { cards, index, flipped, mode, editFront, editBack, editCategory, filterCategory } = cfg
  const s = styles(isDark)

  const filteredCards = filterCategory === 'All' ? cards : cards.filter(c => c.category === filterCategory)
  const card = filteredCards[index % Math.max(filteredCards.length, 1)]

  const categories = useMemo(() => {
    const cats = new Set(cards.map(c => c.category))
    return ['All', ...Array.from(cats)]
  }, [cards])

  const goNext = useCallback(() => updateConfig({ index: (index + 1) % Math.max(filteredCards.length, 1), flipped: false }), [index, filteredCards.length, updateConfig])
  const goPrev = useCallback(() => updateConfig({ index: (index - 1 + Math.max(filteredCards.length, 1)) % Math.max(filteredCards.length, 1), flipped: false }), [index, filteredCards.length, updateConfig])
  const toggleFlip = useCallback(() => updateConfig({ flipped: !flipped }), [flipped, updateConfig])
  const shuffle = useCallback(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    updateConfig({ cards: shuffled, index: 0, flipped: false })
  }, [cards, updateConfig])

  // Edit mode
  const saveCard = useCallback(() => {
    if (!editFront.trim() || !editBack.trim()) return
    const newCards = [...cards, { front: editFront.trim(), back: editBack.trim(), category: editCategory || 'Custom' }]
    updateConfig({ cards: newCards, mode: 'browse', editFront: '', editBack: '', index: newCards.length - 1, flipped: false })
  }, [cards, editFront, editBack, editCategory, updateConfig])

  const deleteCard = useCallback(() => {
    if (filteredCards.length <= 1) return
    const realIndex = cards.indexOf(card)
    const newCards = cards.filter((_, i) => i !== realIndex)
    updateConfig({ cards: newCards, index: Math.min(index, newCards.length - 1), flipped: false })
  }, [cards, card, index, updateConfig])

  const setFilter = useCallback((cat: string) => updateConfig({ filterCategory: cat, index: 0, flipped: false }), [updateConfig])

  // Edit mode
  if (mode === 'edit' || mode === 'add') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => updateConfig({ mode: 'browse' })} style={{ background: 'none', border: 'none', color: s.text, cursor: 'pointer', padding: '0 2px', fontSize: 14 }}>&larr;</button>
          <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>{mode === 'add' ? 'Add Card' : 'Edit Card'}</span>
        </div>
        <div>
          <span style={{ fontSize: 9, color: s.text }}>Front (question)</span>
          <input value={editFront} onChange={(e) => updateConfig({ editFront: e.target.value })} placeholder="Question..." style={{ ...s.input, marginTop: 3 }} />
        </div>
        <div>
          <span style={{ fontSize: 9, color: s.text }}>Back (answer)</span>
          <input value={editBack} onChange={(e) => updateConfig({ editBack: e.target.value })} placeholder="Answer..." style={{ ...s.input, marginTop: 3 }} />
        </div>
        <div>
          <span style={{ fontSize: 9, color: s.text }}>Category</span>
          <input value={editCategory} onChange={(e) => updateConfig({ editCategory: e.target.value })} placeholder="Category..." style={{ ...s.input, marginTop: 3 }} />
        </div>
        <button onClick={saveCard} disabled={!editFront.trim() || !editBack.trim()} style={s.primaryBtn}>Save Card</button>
      </div>
    )
  }

  // Browse mode
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.bright }}>Flashcards</span>
        <span style={{ fontSize: 10, color: s.text }}>{filteredCards.length} cards</span>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={s.tabBtn(filterCategory === cat)}>{cat}</button>
        ))}
      </div>

      {/* Card */}
      <div
        onClick={toggleFlip}
        style={{
          flex: 1, minHeight: 80, padding: '16px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: flipped ? 'rgba(5,150,105,0.1)' : s.surface,
          border: '1px solid ' + (flipped ? 'rgba(5,150,105,0.3)' : s.border),
        }}
      >
        <div style={{ fontSize: 9, color: s.text }}>{flipped ? 'Answer' : 'Question'}</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: flipped ? s.accent : s.bright, fontFamily: flipped ? 'monospace' : 'inherit' }}>
          {card ? (flipped ? card.back : card.front) : 'No cards'}
        </div>
        {card && <div style={{ fontSize: 8, color: s.text, padding: '1px 6px', borderRadius: 3, background: s.surface, border: '1px solid ' + s.border }}>{card.category}</div>}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={goPrev} style={s.btnSm()}>Prev</button>
        <span style={{ fontSize: 10, color: s.text, minWidth: 50, textAlign: 'center' }}>{filteredCards.length > 0 ? ((index % Math.max(filteredCards.length, 1)) + 1) + '/' + filteredCards.length : '0/0'}</span>
        <button onClick={goNext} style={s.btnSm()}>Next</button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
        <button onClick={shuffle} style={s.btnSm('#a5b4fc', 'rgba(99,102,241,0.12)', 'rgba(99,102,241,0.3)')}>Shuffle</button>
        <button onClick={() => updateConfig({ mode: 'add', editFront: '', editBack: '', editCategory: 'Custom' })} style={s.btnSm('#34d399', 'rgba(5,150,105,0.12)', 'rgba(5,150,105,0.3)')}>+ Add</button>
        <button onClick={deleteCard} disabled={filteredCards.length <= 1} style={s.btnSm('#f87171', 'rgba(239,68,68,0.08)', 'rgba(239,68,68,0.2)')}>Delete</button>
      </div>
    </div>
  )
}

// ============================================================
// Shared styles
// ============================================================

function styles(isDark: boolean) {
  const bg = isDark ? '#0f172a' : '#ffffff'
  const surface = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'
  const text = isDark ? '#94a3b8' : '#64748b'
  const bright = isDark ? '#e2e8f0' : '#1e293b'
  const accent = '#34d399'

  const input: React.CSSProperties = {
    padding: '4px 8px', borderRadius: 5, fontSize: 11, width: '100%', boxSizing: 'border-box' as const,
    border: '1px solid ' + border, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    color: bright, outline: 'none',
  }

  const btnSm = (color?: string, bg?: string, borderColor?: string) => ({
    padding: '3px 8px' as const, borderRadius: 4, fontSize: 10, cursor: 'pointer' as const, fontWeight: 600 as const,
    background: bg || surface, border: '1px solid ' + (borderColor || border), color: color || text,
  })

  const tabBtn = (active: boolean) => ({
    padding: '2px 8px' as const, borderRadius: 4, fontSize: 10, cursor: 'pointer' as const, fontWeight: 600 as const,
    background: active ? 'rgba(99,102,241,0.15)' : surface,
    border: '1px solid ' + (active ? 'rgba(99,102,241,0.4)' : border),
    color: active ? '#a5b4fc' : text,
  })

  const primaryBtn: React.CSSProperties = {
    padding: '6px 12px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer',
    background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.4)', color: '#34d399',
  }

  return { bg, surface, border, text, bright, accent, input, btnSm, tabBtn, primaryBtn }
}

// ============================================================
// Default config / size / labels for L3 widgets
// ============================================================

export function getL3WidgetDefaultConfig(kind: string): Record<string, unknown> {
  switch (kind) {
    case 'classroom-quiz': return { ...DEFAULT_QUIZ, qStartTime: Date.now() }
    case 'math-flashcards': return { ...DEFAULT_FLASHCARD_CONFIG }
    default: return {}
  }
}

export function getL3WidgetDefaultSize(kind: string): { width: number; height: number } {
  switch (kind) {
    case 'classroom-quiz': return { width: 440, height: 600 }
    case 'math-flashcards': return { width: 380, height: 480 }
    default: return { width: 360, height: 400 }
  }
}

export const L3_WIDGET_KIND_LABELS: Record<string, string> = {
  'classroom-quiz': 'Interactive Quiz',
  'math-flashcards': 'L3 Flashcards',
}
