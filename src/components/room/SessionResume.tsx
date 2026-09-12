// ============================================================
// SessionResume — Cross-Session Continuity Card
// ============================================================
// Task ID 44 — Milestone 2 / Feature 2
//
// Shows when a tutor opens a room with a student they've taught
// before. Surfaces the most recent lesson note, homework status,
// and a suggested starting widget, so the tutor can pick up right
// where the last session left off.
//
// Data source: GET /api/room/[roomId]/resume (which reuses the
// existing student-progress aggregation logic).
//
// Behavior:
//   - Hidden entirely if no student / no previous sessions / fetch
//     error (fail-open — never blocks the room).
//   - Collapsible (start expanded; ▼ collapses; ▲ expands).
//   - Dismissible (✕ hides the card for this session, in-memory).
//   - "Start with this widget →" calls onStartWidget(widgetKind).
// ============================================================

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { authFetch } from '@/lib/auth-fetch'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

// ---- Types matching the /api/room/[roomId]/resume response ----
interface ResumeStudent {
  id: string
  name: string
}

interface ResumeLastSession {
  subject: string
  date: string | null
  durationMinutes: number
}

interface ResumeNotes {
  content: string
  tutorFeedback: string | null
  topicsForNext: string | null
  rating: number | null
  subject: string | null
  date: string
}

interface ResumeHomework {
  title: string
  status: string
  grade: string | null
  tutorFeedback: string | null
  dueDate: string | null
}

interface ResumeSuggestedWidget {
  kind: string
  label: string
}

interface ResumeData {
  student: ResumeStudent | null
  lastSession: ResumeLastSession | null
  notes: ResumeNotes | null
  homework: ResumeHomework | null
  suggestedWidget: ResumeSuggestedWidget | null
}

interface SessionResumeProps {
  roomId: string
  /** Called when the tutor clicks "Start with this widget →". */
  onStartWidget?: (widgetKind: string) => void
}

// ---- Date helpers (mirrors StudentProgressPanel conventions) ----
function formatRelative(iso: string | null): string {
  if (!iso) return 'unknown date'
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatShortDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function homeworkStatusLabel(status: string): string {
  const s = status.toUpperCase()
  if (s === 'SUBMITTED') return 'Submitted'
  if (s === 'GRADED') return 'Graded'
  if (s === 'PENDING' || s === 'ASSIGNED') return 'Pending'
  if (s === 'OVERDUE') return 'Overdue'
  return status
}

// ---- Component ----
export function SessionResume({ roomId, onStartWidget }: SessionResumeProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const [data, setData] = useState<ResumeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(true)

  // Ref to the collapsible body — used to set max-height dynamically
  // so the CSS transition animates smoothly regardless of content size.
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const [bodyHeight, setBodyHeight] = useState<number | null>(null)

  const fetchResume = useCallback(async () => {
    try {
      setLoading(true)
      const res = await authFetch(`/api/room/${roomId}/resume`)
      if (!res.ok) {
        // Fail-open: just don't show the card.
        setData(null)
        return
      }
      const json: ResumeData = await res.json()
      setData(json)
    } catch {
      // Fail-open on network error too.
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [roomId])

  useEffect(() => {
    fetchResume()
  }, [fetchResume])

  // Measure the natural height of the body for the max-height transition.
  useEffect(() => {
    if (!bodyRef.current) return
    const measure = () => {
      if (!bodyRef.current) return
      // Temporarily set auto to measure natural height
      const el = bodyRef.current
      const prev = el.style.maxHeight
      el.style.maxHeight = 'none'
      const h = el.scrollHeight
      el.style.maxHeight = prev
      setBodyHeight(h)
    }
    measure()
    // Re-measure on resize in case content reflows
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [data, expanded])

  // ---- Decide whether to show ----
  if (loading) return null
  if (dismissed) return null
  if (!data) return null
  if (!data.student) return null
  // "No previous sessions" → hide card entirely
  if (!data.lastSession && !data.notes) return null

  // ---- Style helpers (match room-info-bar / room-breadcrumb palette) ----
  const cardBg = isDark ? 'rgba(14, 14, 16, 0.92)' : 'rgba(255, 255, 255, 0.95)'
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
  const textPrimary = isDark ? '#e2e8f0' : '#1e293b'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const textMuted = isDark ? '#71717a' : '#94a3b8'
  const sectionBg = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'
  const accentBg = 'rgba(5, 150, 105, 0.15)'
  const accentBorder = 'rgba(5, 150, 105, 0.3)'
  const accentText = '#34d399'

  const handleStartWidget = () => {
    if (data.suggestedWidget) {
      onStartWidget?.(data.suggestedWidget.kind)
    }
  }

  return (
    <div
      className={`session-resume-card ${isDark ? '' : 'session-resume-card-light'}`}
      style={{
        position: 'absolute',
        top: 96,
        left: 60,
        zIndex: 997,
        width: 380,
        maxWidth: 'calc(100% - 76px)',
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 10,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: isDark
          ? '0 8px 24px rgba(0, 0, 0, 0.4)'
          : '0 8px 24px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        color: textPrimary,
        fontSize: 12,
        lineHeight: 1.5,
      }}
      role="region"
      aria-label={`Session resume for ${data.student.name}`}
    >
      {/* ---- Header ---- */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          borderBottom: expanded ? `1px solid ${cardBorder}` : 'none',
          background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <span style={{ fontSize: 14 }} aria-hidden>📋</span>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: textPrimary }}>
          Session Resume — {data.student.name}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Collapse session resume' : 'Expand session resume'}
          aria-expanded={expanded}
          title={expanded ? 'Collapse' : 'Expand'}
          style={{
            padding: '2px 6px',
            borderRadius: 4,
            background: 'transparent',
            border: `1px solid ${cardBorder}`,
            color: textSecondary,
            cursor: 'pointer',
            fontSize: 11,
            lineHeight: 1,
            transition: 'transform 0.2s ease',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        >
          ▼
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss session resume for this room"
          title="Hide for this session"
          style={{
            padding: '2px 6px',
            borderRadius: 4,
            background: 'transparent',
            border: `1px solid ${cardBorder}`,
            color: textSecondary,
            cursor: 'pointer',
            fontSize: 11,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* ---- Body (collapsible via max-height transition) ---- */}
      <div
        ref={bodyRef}
        style={{
          maxHeight: expanded ? (bodyHeight !== null ? `${bodyHeight}px` : '1000px') : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* ---- Last session summary ---- */}
          {data.lastSession && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', alignItems: 'center', fontSize: 11, color: textSecondary }}>
              <span>
                <strong style={{ color: textPrimary, fontWeight: 600 }}>Last session:</strong>{' '}
                {formatRelative(data.lastSession.date)} ({formatShortDate(data.lastSession.date)})
              </span>
              <span>
                <strong style={{ color: textPrimary, fontWeight: 600 }}>Subject:</strong>{' '}
                {data.lastSession.subject}
              </span>
              <span>
                <strong style={{ color: textPrimary, fontWeight: 600 }}>Duration:</strong>{' '}
                {data.lastSession.durationMinutes} min
              </span>
            </div>
          )}

          {/* ---- Lesson notes ---- */}
          {data.notes && (
            <div style={{ background: sectionBg, borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span aria-hidden>📝</span>
                <span style={{ fontWeight: 600, color: textPrimary, fontSize: 11 }}>Lesson Notes</span>
                {data.notes.rating !== null && data.notes.rating !== undefined && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      padding: '1px 6px',
                      borderRadius: 8,
                      background: accentBg,
                      border: `1px solid ${accentBorder}`,
                      color: accentText,
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                    title="Rating from last session"
                  >
                    ★ {data.notes.rating}/5
                  </span>
                )}
              </div>
              {data.notes.content ? (
                <div style={{ color: textSecondary, fontStyle: 'italic' }}>
                  &ldquo;{data.notes.content}&rdquo;
                </div>
              ) : (
                <div style={{ color: textMuted, fontStyle: 'italic' }}>No notes recorded.</div>
              )}
              {data.notes.tutorFeedback && (
                <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${cardBorder}`, color: textSecondary, fontSize: 11 }}>
                  <strong style={{ color: textPrimary }}>Tutor feedback:</strong>{' '}
                  {data.notes.tutorFeedback}
                </div>
              )}
            </div>
          )}

          {/* ---- Homework ---- */}
          {data.homework && (
            <div style={{ background: sectionBg, borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span aria-hidden>📚</span>
                <span style={{ fontWeight: 600, color: textPrimary, fontSize: 11 }}>Homework</span>
              </div>
              <div style={{ color: textPrimary, fontWeight: 500 }}>
                &ldquo;{data.homework.title}&rdquo;
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '2px 10px',
                  marginTop: 4,
                  fontSize: 11,
                  color: textSecondary,
                  alignItems: 'center',
                }}
              >
                <span>
                  <strong style={{ color: textPrimary }}>Status:</strong>{' '}
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '1px 6px',
                      borderRadius: 8,
                      fontSize: 10,
                      fontWeight: 600,
                      background:
                        data.homework.status === 'GRADED'
                          ? 'rgba(34, 197, 94, 0.15)'
                          : data.homework.status === 'SUBMITTED'
                            ? 'rgba(59, 130, 246, 0.15)'
                            : data.homework.status === 'OVERDUE'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                      color:
                        data.homework.status === 'GRADED'
                          ? '#22c55e'
                          : data.homework.status === 'SUBMITTED'
                            ? '#3b82f6'
                            : data.homework.status === 'OVERDUE'
                              ? '#ef4444'
                              : '#f59e0b',
                    }}
                  >
                    {homeworkStatusLabel(data.homework.status)}
                  </span>
                </span>
                {data.homework.grade && (
                  <span>
                    <strong style={{ color: textPrimary }}>Grade:</strong> {data.homework.grade}
                  </span>
                )}
              </div>
              {data.homework.tutorFeedback && (
                <div style={{ marginTop: 4, color: textSecondary, fontSize: 11 }}>
                  <strong style={{ color: textPrimary }}>Feedback:</strong>{' '}
                  {data.homework.tutorFeedback}
                </div>
              )}
            </div>
          )}

          {/* ---- Suggested starting point ---- */}
          <div style={{ background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span aria-hidden>💡</span>
              <span style={{ fontWeight: 600, color: accentText, fontSize: 11 }}>
                Suggested starting point
              </span>
            </div>
            {data.suggestedWidget ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ color: textPrimary, fontStyle: 'italic' }}>
                  &ldquo;{data.suggestedWidget.label}&rdquo;
                </span>
                <button
                  type="button"
                  onClick={handleStartWidget}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    background: 'rgba(5, 150, 105, 0.25)',
                    border: `1px solid ${accentBorder}`,
                    color: accentText,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginLeft: 'auto',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(5, 150, 105, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(5, 150, 105, 0.25)'
                  }}
                >
                  Start with this widget →
                </button>
              </div>
            ) : (
              <div style={{ color: textSecondary, fontStyle: 'italic' }}>
                No specific recommendation — pick a widget from the toolkit.
              </div>
            )}
          </div>

          {/* ---- Topics for next ---- */}
          {data.notes?.topicsForNext && (
            <div style={{ fontSize: 11, color: textSecondary, paddingTop: 4 }}>
              <strong style={{ color: textPrimary }}>Topics for next:</strong>{' '}
              <span style={{ fontStyle: 'italic' }}>&ldquo;{data.notes.topicsForNext}&rdquo;</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
