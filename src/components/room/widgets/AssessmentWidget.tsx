// ============================================================
// Superboard — Assessment / Quiz Widget
// Create quizzes, polls, and quick checks during tutoring sessions.
// Supports multiple choice, true/false, and short answer.
// Results tracked locally and can be shared via chat.
// ============================================================

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

// ---- Types ----
type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer'

interface Question {
  id: string
  type: QuestionType
  text: string
  options: string[]       // For multiple-choice (4 options max)
  correctAnswer: string   // For MC: index as string; for TF: "true"/"false"; for SA: answer text
  explanation?: string
}

interface QuizResult {
  questionId: string
  studentAnswer: string
  isCorrect: boolean
  timeSpentSec: number
}

interface QuizSession {
  id: string
  title: string
  questions: Question[]
  results: Record<string, QuizResult[]>  // keyed by student name
  createdAt: number
  isActive: boolean
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  'multiple-choice': 'Multiple Choice',
  'true-false': 'True / False',
  'short-answer': 'Short Answer',
}

const SUBJECT_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#3b82f6', '#f97316', '#06b6d4',
]

let _idCounter = 0
function uid() { return 'q_' + Date.now().toString(36) + '_' + (++_idCounter) }

// ---- Helpers ----
function generateId() { return uid() }

// ---- Main Component ----
export function AssessmentWidget({ roomId }: { roomId: string }) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const [quizzes, setQuizzes] = useState<QuizSession[]>([])
  const [activeQuizIdx, setActiveQuizIdx] = useState<number | null>(null)
  const [mode, setMode] = useState<'list' | 'create' | 'take' | 'results'>('list')

  // Create form state
  const [newTitle, setNewTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQIdx, setCurrentQIdx] = useState(0)

  // Take quiz state
  const [studentName, setStudentName] = useState('')
  const [answers, setAnswers] = useState<Record<string, { answer: string; time: number }>>({})
  const [qStartTime, setQStartTime] = useState(Date.now())

  // Results view
  const [selectedResultStudent, setSelectedResultStudent] = useState<string | null>(null)

  const dk = (light: string, dark: string) => isDark ? dark : light
  const dkBorder = dk('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.08)')
  const dkBg = dk('#ffffff', 'rgba(15,23,42,0.5)')
  const dkText = dk('#334155', '#94a3b8')
  const dkTextStrong = dk('#0f172a', '#f1f5f9')
  const dkInputBg = dk('#f8fafc', 'rgba(15,23,42,0.6)')
  const dkInputBorder = dk('rgba(0,0,0,0.12)', 'rgba(255,255,255,0.1)')

  const activeQuiz = activeQuizIdx !== null ? quizzes[activeQuizIdx] : null

  // ---- Quiz Creation ----
  const addQuestion = useCallback((type: QuestionType) => {
    const q: Question = {
      id: generateId(),
      type,
      text: '',
      options: type === 'multiple-choice' ? ['Option A', 'Option B', 'Option C', 'Option D'] : [],
      correctAnswer: type === 'true-false' ? 'true' : (type === 'multiple-choice' ? '0' : ''),
      explanation: '',
    }
    setQuestions(prev => [...prev, q])
    setCurrentQIdx(questions.length)
  }, [questions.length])

  const updateQuestion = useCallback((idx: number, patch: Partial<Question>) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...patch } : q))
  }, [])

  const removeQuestion = useCallback((idx: number) => {
    setQuestions(prev => {
      const next = prev.filter((_, i) => i !== idx)
      return next
    })
    setCurrentQIdx(prev => Math.max(0, Math.min(prev, questions.length - 2)))
  }, [questions.length])

  const saveQuiz = useCallback(() => {
    if (!newTitle.trim() || questions.length === 0) return
    const quiz: QuizSession = {
      id: generateId(),
      title: newTitle.trim(),
      questions: [...questions],
      results: {},
      createdAt: Date.now(),
      isActive: true,
    }
    setQuizzes(prev => [quiz, ...prev])
    setActiveQuizIdx(0)
    setMode('list')
    setNewTitle('')
    setQuestions([])
    setCurrentQIdx(0)
  }, [newTitle, questions])

  // ---- Taking Quiz ----
  const startTakeQuiz = useCallback((idx: number) => {
    setActiveQuizIdx(idx)
    setMode('take')
    setAnswers({})
    setQStartTime(Date.now())
    setSelectedResultStudent(null)
  }, [])

  const submitAnswer = useCallback((qId: string, answer: string) => {
    const timeSpent = Math.round((Date.now() - qStartTime) / 1000)
    setAnswers(prev => ({ ...prev, [qId]: { answer, time: timeSpent } }))
    setQStartTime(Date.now())
  }, [qStartTime])

  const finishQuiz = useCallback(() => {
    if (!activeQuiz || !studentName.trim()) return
    const results = activeQuiz.questions.map(q => {
      const a = answers[q.id]
      const studentAnswer = a?.answer || ''
      let isCorrect = false
      if (q.type === 'short-answer') {
        isCorrect = studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
      } else {
        isCorrect = studentAnswer === q.correctAnswer
      }
      return {
        questionId: q.id,
        studentAnswer,
        isCorrect,
        timeSpentSec: a?.time || 0,
      } as QuizResult
    })
    setQuizzes(prev => prev.map((quiz, i) => {
      if (i !== activeQuizIdx) return quiz
      return {
        ...quiz,
        results: { ...quiz.results, [studentName.trim()]: results },
      }
    }))
    setMode('results')
    setSelectedResultStudent(studentName.trim())
  }, [activeQuiz, activeQuizIdx, answers, studentName])

  // ---- Quick Templates ----
  const createQuickQuiz = useCallback((type: 'math' | 'vocab' | 'tf') => {
    const templates: Record<string, { title: string; questions: Question[] }> = {
      math: {
        title: 'Quick Math Check',
        questions: [
          { id: generateId(), type: 'multiple-choice', text: 'What is 7 x 8?', options: ['54', '56', '58', '64'], correctAnswer: '1', explanation: '7 x 8 = 56' },
          { id: generateId(), type: 'multiple-choice', text: 'What is the square root of 144?', options: ['10', '11', '12', '14'], correctAnswer: '2', explanation: '12 x 12 = 144' },
          { id: generateId(), type: 'true-false', text: 'A triangle with all equal sides is called equilateral.', options: [], correctAnswer: 'true', explanation: 'An equilateral triangle has all three sides equal.' },
        ],
      },
      vocab: {
        title: 'Vocabulary Quiz',
        questions: [
          { id: generateId(), type: 'multiple-choice', text: 'What does "benevolent" mean?', options: ['Cruel', 'Kind and generous', 'Angry', 'Confused'], correctAnswer: '1', explanation: 'Benevolent means well-meaning and kindly.' },
          { id: generateId(), type: 'short-answer', text: 'Give a synonym for "happy".', options: [], correctAnswer: 'joyful', explanation: 'Joyful is a common synonym for happy.' },
        ],
      },
      tf: {
        title: 'True or False Quiz',
        questions: [
          { id: generateId(), type: 'true-false', text: 'The Earth revolves around the Sun.', options: [], correctAnswer: 'true', explanation: 'The Earth orbits the Sun once every 365.25 days.' },
          { id: generateId(), type: 'true-false', text: 'Water boils at 90 degrees Celsius at sea level.', options: [], correctAnswer: 'false', explanation: 'Water boils at 100 degrees Celsius at sea level.' },
          { id: generateId(), type: 'true-false', text: 'Photosynthesis produces oxygen.', options: [], correctAnswer: 'true', explanation: 'Plants release oxygen as a byproduct of photosynthesis.' },
        ],
      },
    }
    const tmpl = templates[type]
    const quiz: QuizSession = {
      id: generateId(),
      title: tmpl.title,
      questions: tmpl.questions,
      results: {},
      createdAt: Date.now(),
      isActive: true,
    }
    setQuizzes(prev => [quiz, ...prev])
    setActiveQuizIdx(0)
    setMode('list')
  }, [])

  // ---- Render helpers ----
  const btnStyle = (color: string, bg: string, border: string) => ({
    padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
    background: bg, border: `1px solid ${border}`, color, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' as const,
  })

  const inputStyle = {
    width: '100%', padding: '6px 10px', borderRadius: 6, fontSize: 12,
    background: dkInputBg, border: `1px solid ${dkInputBorder}`, color: dkTextStrong, outline: 'none',
    boxSizing: 'border-box' as const,
  }

  // ---- Views ----

  // 1. Quiz List
  if (mode === 'list') {
    return (
      <div className="widget-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{ padding: '12px 12px 8px', borderBottom: `1px solid ${dkBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dk('#475569', '#94a3b8')} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 700, color: dkTextStrong }}>Assessments</span>
          </div>
          <div style={{ fontSize: 11, color: dkText, marginBottom: 10 }}>{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} created</div>

          {/* Quick templates */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            <button onClick={() => createQuickQuiz('math')} style={btnStyle('#a5b4fc', 'rgba(99,102,241,0.12)', 'rgba(99,102,241,0.25)')}>+ Math</button>
            <button onClick={() => createQuickQuiz('vocab')} style={btnStyle('#4ade80', 'rgba(34,197,94,0.12)', 'rgba(34,197,94,0.25)')}>+ Vocab</button>
            <button onClick={() => createQuickQuiz('tf')} style={btnStyle('#fbbf24', 'rgba(245,158,11,0.12)', 'rgba(245,158,11,0.25)')}>+ T/F</button>
            <button onClick={() => { setMode('create'); setNewTitle(''); setQuestions([]); setCurrentQIdx(0) }} style={btnStyle('#38bdf8', 'rgba(56,189,248,0.12)', 'rgba(56,189,248,0.25)')}>+ Custom</button>
          </div>
          {/* Phase 5: Add a fresh quiz widget to the canvas */}
          <button
            onClick={() => {
              const addElement = useWhiteboardStore.getState().addElement
              const camera = useWhiteboardStore.getState().camera
              const currentPageIndex = useWhiteboardStore.getState().currentPageIndex
              const isDarkNow = useWhiteboardStore.getState().isDark
              const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
              const vh = typeof window !== 'undefined' ? window.innerHeight : 800
              const cx = (vw / 2 - camera.x) / camera.zoom
              const cy = ((vh / 2 - 44) - camera.y) / camera.zoom
              addElement({
                id: 'wid_' + Math.random().toString(36).slice(2, 11),
                type: 'widget' as const,
                widgetKind: 'classroom-quiz',
                config: { title: '', questions: [], results: [], mode: 'list', activeQuestionIdx: 0, currentAnswers: {}, studentName: '', qStartTime: Date.now() },
                x: cx - 220, y: cy - 300,
                width: 440, height: 600,
                rotation: 0, opacity: 1,
                strokeColor: isDarkNow ? '#334155' : '#e2e8f0',
                fillColor: isDarkNow ? '#0f172a' : '#ffffff',
                strokeWidth: 1, locked: false,
                pageIndex: currentPageIndex,
              } as never)
            }}
            style={btnStyle('#34d399', 'rgba(5,150,105,0.12)', 'rgba(5,150,105,0.3)')}
            title="Place an interactive quiz widget on the canvas (supports MC, T/F, Short Answer, Matching, Ordering, Fill-in-the-blank, per-question timer, explanations)"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 13h6M9 17h4" /></svg>
            + Add Quiz to Board
          </button>
        </div>

        {/* Quiz list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {quizzes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>{'{ }'}</div>
              <div style={{ fontSize: 12, color: dkText, lineHeight: 1.5 }}>
                No assessments yet.<br />Create a quick quiz or build a custom one.
              </div>
            </div>
          )}
          {quizzes.map((quiz, idx) => {
            const color = SUBJECT_COLORS[idx % SUBJECT_COLORS.length]
            const studentCount = Object.keys(quiz.results).length
            const totalAttempts = Object.values(quiz.results).reduce((sum, r) => sum + r.length, 0)
            return (
              <div key={quiz.id} style={{
                padding: 10, borderRadius: 8, marginBottom: 6, background: dkBg,
                border: `1px solid ${dkBorder}`, borderLeft: `3px solid ${color}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: dkTextStrong, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quiz.title}</span>
                  <span style={{ fontSize: 10, color: dkText, marginLeft: 8 }}>{quiz.questions.length} Q</span>
                </div>
                <div style={{ fontSize: 11, color: dkText, marginBottom: 8 }}>
                  {studentCount} student{studentCount !== 1 ? 's' : ''} · {totalAttempts} attempt{totalAttempts !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => startTakeQuiz(idx)} style={btnStyle('#34d399', 'rgba(5,150,105,0.12)', 'rgba(5,150,105,0.25)')}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    Take
                  </button>
                  {studentCount > 0 && (
                    <button onClick={() => { setActiveQuizIdx(idx); setMode('results'); setSelectedResultStudent(null) }} style={btnStyle('#60a5fa', 'rgba(59,130,246,0.12)', 'rgba(59,130,246,0.25)')}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      Results
                    </button>
                  )}
                  <button onClick={() => { setQuizzes(prev => prev.filter((_, i) => i !== idx)); if (activeQuizIdx === idx) setActiveQuizIdx(null) }} style={btnStyle('#f87171', 'rgba(239,68,68,0.08)', 'rgba(239,68,68,0.2)')}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 2. Create Quiz
  if (mode === 'create') {
    const q = questions[currentQIdx]
    return (
      <div className="widget-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '12px 12px 8px', borderBottom: `1px solid ${dkBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <button onClick={() => setMode('list')} style={{ background: 'none', border: 'none', color: dkText, cursor: 'pointer', padding: 2 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
            </button>
            <span style={{ fontSize: 14, fontWeight: 700, color: dkTextStrong }}>Create Quiz</span>
          </div>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Quiz title..."
            style={{ ...inputStyle, fontWeight: 600, fontSize: 13, marginBottom: 8 }}
          />

          {/* Question type buttons */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, string][]).map(([type, label]) => (
              <button key={type} onClick={() => addQuestion(type)} style={btnStyle('#a5b4fc', 'rgba(99,102,241,0.1)', 'rgba(99,102,241,0.2)')}>+ {label}</button>
            ))}
          </div>
        </div>

        {/* Question editor */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {questions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: dkText, fontSize: 12 }}>
              Add questions using the buttons above.<br />Supports multiple choice, true/false, and short answer.
            </div>
          )}

          {/* Question tabs */}
          {questions.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
              {questions.map((qq, i) => (
                <button key={qq.id} onClick={() => setCurrentQIdx(i)} style={{
                  padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: i === currentQIdx ? 'rgba(99,102,241,0.2)' : dk('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.04)'),
                  border: `1px solid ${i === currentQIdx ? 'rgba(99,102,241,0.4)' : dkBorder}`,
                  color: i === currentQIdx ? '#a5b4fc' : dkText,
                }}>
                  Q{i + 1}
                </button>
              ))}
            </div>
          )}

          {q && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: dkText, textTransform: 'uppercase', letterSpacing: 0.5 }}>{QUESTION_TYPE_LABELS[q.type]}</span>
                <button onClick={() => removeQuestion(currentQIdx)} style={{ fontSize: 10, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
              </div>

              <textarea
                value={q.text}
                onChange={(e) => updateQuestion(currentQIdx, { text: e.target.value })}
                placeholder="Question text..."
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 48, fontFamily: 'inherit' }}
              />

              {/* Multiple choice options */}
              {q.type === 'multiple-choice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: dkText }}>Options (click to set correct answer)</span>
                  {q.options.map((opt, oi) => (
                    <div key={oi} onClick={() => updateQuestion(currentQIdx, { correctAnswer: String(oi) })} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6,
                      background: q.correctAnswer === String(oi) ? 'rgba(34,197,94,0.1)' : dkInputBg,
                      border: `1px solid ${q.correctAnswer === String(oi) ? 'rgba(34,197,94,0.4)' : dkInputBorder}`,
                      cursor: 'pointer',
                    }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%', fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: q.correctAnswer === String(oi) ? 'rgba(34,197,94,0.3)' : dk('rgba(0,0,0,0.06)', 'rgba(255,255,255,0.06)'),
                        color: q.correctAnswer === String(oi) ? '#4ade80' : dkText,
                      }}>{String.fromCharCode(65 + oi)}</span>
                      <input
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...q.options]
                          newOpts[oi] = e.target.value
                          updateQuestion(currentQIdx, { options: newOpts })
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ flex: 1, background: 'none', border: 'none', color: dkTextStrong, fontSize: 12, outline: 'none', padding: 0 }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* True/False */}
              {q.type === 'true-false' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {['true', 'false'].map(v => (
                    <button key={v} onClick={() => updateQuestion(currentQIdx, { correctAnswer: v })} style={{
                      flex: 1, padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center',
                      background: q.correctAnswer === v ? 'rgba(34,197,94,0.12)' : dkInputBg,
                      border: `1px solid ${q.correctAnswer === v ? 'rgba(34,197,94,0.4)' : dkInputBorder}`,
                      color: q.correctAnswer === v ? '#4ade80' : dkText,
                    }}>{v === 'true' ? 'True' : 'False'}</button>
                  ))}
                </div>
              )}

              {/* Short answer */}
              {q.type === 'short-answer' && (
                <div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: dkText }}>Correct answer (case-insensitive)</span>
                  <input
                    value={q.correctAnswer}
                    onChange={(e) => updateQuestion(currentQIdx, { correctAnswer: e.target.value })}
                    placeholder="Expected answer..."
                    style={{ ...inputStyle, marginTop: 4 }}
                  />
                </div>
              )}

              {/* Explanation */}
              <div>
                <span style={{ fontSize: 10, fontWeight: 600, color: dkText }}>Explanation (optional)</span>
                <input
                  value={q.explanation || ''}
                  onChange={(e) => updateQuestion(currentQIdx, { explanation: e.target.value })}
                  placeholder="Why is this the correct answer?"
                  style={{ ...inputStyle, marginTop: 4 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Save button */}
        {questions.length > 0 && (
          <div style={{ padding: '8px 12px', borderTop: `1px solid ${dkBorder}` }}>
            <button
              onClick={saveQuiz}
              disabled={!newTitle.trim() || questions.some(q => !q.text.trim())}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399',
                cursor: newTitle.trim() && questions.every(q => q.text.trim()) ? 'pointer' : 'not-allowed',
                opacity: newTitle.trim() && questions.every(q => q.text.trim()) ? 1 : 0.5,
              }}
            >Save Quiz ({questions.length} question{questions.length !== 1 ? 's' : ''})</button>
          </div>
        )}
      </div>
    )
  }

  // 3. Take Quiz
  if (mode === 'take' && activeQuiz) {
    const qIdx = Object.keys(answers).length
    const currentQ = activeQuiz.questions[qIdx]
    const isDone = qIdx >= activeQuiz.questions.length
    const currentAnswer = currentQ ? (answers[currentQ.id]?.answer || '') : ''

    if (isDone) {
      return (
        <div className="widget-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.5" style={{ marginBottom: 12 }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div style={{ fontSize: 16, fontWeight: 700, color: dkTextStrong, marginBottom: 8 }}>All Done!</div>
          <div style={{ fontSize: 12, color: dkText, marginBottom: 16 }}>You answered all {activeQuiz.questions.length} questions.</div>
          {!studentName.trim() && (
            <div style={{ width: '100%', marginBottom: 12 }}>
              <input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Your name to submit..."
                style={{ ...inputStyle, textAlign: 'center' }}
              />
            </div>
          )}
          <button
            onClick={finishQuiz}
            disabled={!studentName.trim()}
            style={{
              padding: '8px 24px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399',
              cursor: studentName.trim() ? 'pointer' : 'not-allowed',
              opacity: studentName.trim() ? 1 : 0.5,
            }}
          >Submit Answers</button>
          <button onClick={() => setMode('list')} style={{ marginTop: 8, background: 'none', border: 'none', color: dkText, cursor: 'pointer', fontSize: 11 }}>Back to list</button>
        </div>
      )
    }

    return (
      <div className="widget-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '12px 12px 8px', borderBottom: `1px solid ${dkBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <button onClick={() => setMode('list')} style={{ background: 'none', border: 'none', color: dkText, cursor: 'pointer', padding: 2 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: dkTextStrong, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeQuiz.title}</span>
          </div>
          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: dk('rgba(0,0,0,0.08)', 'rgba(255,255,255,0.08)') }}>
              <div style={{ height: '100%', borderRadius: 2, background: '#6366f1', width: `${((qIdx) / activeQuiz.questions.length) * 100}%`, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 10, color: dkText, fontWeight: 600, whiteSpace: 'nowrap' }}>{qIdx + 1}/{activeQuiz.questions.length}</span>
          </div>
        </div>

        {!studentName.trim() ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: dkTextStrong, marginBottom: 8 }}>Enter Your Name</div>
              <input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && studentName.trim()) setQStartTime(Date.now()) }}
                placeholder="Your name..."
                autoFocus
                style={{ ...inputStyle, textAlign: 'center', fontSize: 14, padding: '10px 14px' }}
              />
            </div>
          </div>
        ) : currentQ ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: dkText, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{QUESTION_TYPE_LABELS[currentQ.type]}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: dkTextStrong, lineHeight: 1.5, marginBottom: 16 }}>{currentQ.text}</div>

            {/* MC options */}
            {currentQ.type === 'multiple-choice' && currentQ.options.map((opt, oi) => (
              <div key={oi} onClick={() => { submitAnswer(currentQ.id, String(oi)); setQStartTime(Date.now()) }} style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                background: currentAnswer === String(oi) ? 'rgba(99,102,241,0.12)' : dkBg,
                border: `1px solid ${currentAnswer === String(oi) ? 'rgba(99,102,241,0.4)' : dkBorder}`,
                color: dkTextStrong, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: 700, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: currentAnswer === String(oi) ? 'rgba(99,102,241,0.3)' : dk('rgba(0,0,0,0.06)', 'rgba(255,255,255,0.06)'),
                  color: currentAnswer === String(oi) ? '#a5b4fc' : dkText,
                }}>{String.fromCharCode(65 + oi)}</span>
                {opt}
              </div>
            ))}

            {/* T/F */}
            {currentQ.type === 'true-false' && (
              <div style={{ display: 'flex', gap: 8 }}>
                {['true', 'false'].map(v => (
                  <button key={v} onClick={() => { submitAnswer(currentQ.id, v); setQStartTime(Date.now()) }} style={{
                    flex: 1, padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center',
                    background: currentAnswer === v ? 'rgba(99,102,241,0.12)' : dkBg,
                    border: `1px solid ${currentAnswer === v ? 'rgba(99,102,241,0.4)' : dkBorder}`,
                    color: currentAnswer === v ? '#a5b4fc' : dkTextStrong,
                  }}>{v === 'true' ? 'True' : 'False'}</button>
                ))}
              </div>
            )}

            {/* Short answer */}
            {currentQ.type === 'short-answer' && (
              <div>
                <input
                  value={currentAnswer}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: { answer: e.target.value, time: 0 } }))}
                  placeholder="Type your answer..."
                  onKeyDown={(e) => { if (e.key === 'Enter' && currentAnswer.trim()) { submitAnswer(currentQ.id, currentAnswer); setQStartTime(Date.now()) } }}
                  autoFocus
                  style={{ ...inputStyle, fontSize: 14, padding: '10px 14px' }}
                />
                <button
                  onClick={() => { submitAnswer(currentQ.id, currentAnswer); setQStartTime(Date.now()) }}
                  disabled={!currentAnswer.trim()}
                  style={{
                    marginTop: 8, width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc',
                    cursor: currentAnswer.trim() ? 'pointer' : 'not-allowed',
                  }}
                >Next Question</button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    )
  }

  // 4. Results View
  if (mode === 'results' && activeQuiz) {
    const students = Object.keys(activeQuiz.results)
    const selectedStudent = selectedResultStudent && activeQuiz.results[selectedResultStudent] ? selectedResultStudent : null

    const getAvgScore = (student: string) => {
      const r = activeQuiz.results[student]
      if (!r || r.length === 0) return 0
      const correct = r.filter(x => x.isCorrect).length
      return Math.round((correct / r.length) * 100)
    }

    return (
      <div className="widget-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '12px 12px 8px', borderBottom: `1px solid ${dkBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <button onClick={() => setMode('list')} style={{ background: 'none', border: 'none', color: dkText, cursor: 'pointer', padding: 2 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: dkTextStrong, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeQuiz.title} — Results</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: dkText, fontSize: 12 }}>No submissions yet.</div>
          ) : (
            <>
              {/* Student selector */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                {students.map(s => {
                  const score = getAvgScore(s)
                  const scoreColor = score >= 80 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171'
                  return (
                    <button key={s} onClick={() => setSelectedResultStudent(s)} style={{
                      padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: selectedStudent === s ? 'rgba(99,102,241,0.15)' : dk('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.04)'),
                      border: `1px solid ${selectedStudent === s ? 'rgba(99,102,241,0.4)' : dkBorder}`,
                      color: selectedStudent === s ? '#a5b4fc' : dkTextStrong,
                    }}>
                      {s} <span style={{ color: scoreColor, marginLeft: 4 }}>{score}%</span>
                    </button>
                  )
                })}
              </div>

              {/* Detailed results for selected student */}
              {selectedStudent && activeQuiz.results[selectedStudent] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activeQuiz.results[selectedStudent].map((r, ri) => {
                    const q = activeQuiz.questions.find(qq => qq.id === r.questionId)
                    if (!q) return null
                    return (
                      <div key={r.questionId} style={{
                        padding: 10, borderRadius: 8, background: dkBg, border: `1px solid ${dkBorder}`,
                        borderLeft: `3px solid ${r.isCorrect ? '#4ade80' : '#f87171'}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                          <span style={{
                            width: 20, height: 20, borderRadius: '50%', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: r.isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            color: r.isCorrect ? '#4ade80' : '#f87171',
                          }}>{r.isCorrect ? '✓' : '✗'}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: dkTextStrong, marginBottom: 2 }}>Q{ri + 1}: {q.text}</div>
                            {q.type !== 'short-answer' && (
                              <div style={{ fontSize: 11, color: dkText }}>Answer: {r.studentAnswer === 'true' ? 'True' : r.studentAnswer === 'false' ? 'False' : q.options[Number(r.studentAnswer)] || r.studentAnswer}</div>
                            )}
                            {q.type === 'short-answer' && (
                              <div style={{ fontSize: 11, color: dkText }}>Answer: &ldquo;{r.studentAnswer}&rdquo;</div>
                            )}
                            {!r.isCorrect && q.type === 'short-answer' && (
                              <div style={{ fontSize: 11, color: '#4ade80' }}>Correct: &ldquo;{q.correctAnswer}&rdquo;</div>
                            )}
                            {q.explanation && (
                              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>{q.explanation}</div>
                            )}
                          </div>
                          <span style={{ fontSize: 10, color: dkText, whiteSpace: 'nowrap' }}>{r.timeSpentSec}s</span>
                        </div>
                      </div>
                    )
                  })}

                  {/* Summary */}
                  <div style={{
                    padding: '10px 12px', borderRadius: 8, marginTop: 4,
                    background: dk('rgba(99,102,241,0.05)', 'rgba(99,102,241,0.08)'),
                    border: '1px solid rgba(99,102,241,0.15)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: dkTextStrong }}>{selectedStudent}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: getAvgScore(selectedStudent) >= 80 ? '#4ade80' : getAvgScore(selectedStudent) >= 50 ? '#fbbf24' : '#f87171' }}>{getAvgScore(selectedStudent)}%</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return null
}
