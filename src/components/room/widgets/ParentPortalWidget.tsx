// ============================================================
// Superboard — Parent Portal Widget
// Shows session history, progress summary, and billing info
// for parents to view their child's tutoring activity.
// ============================================================

'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { getTierLabel, getTierPrice } from '@/lib/features'
import type { Tier } from '@/lib/validations'

interface SessionRoom {
  id: string
  subject: string
  durationMinutes: number
  createdAt: string
  endedAt: string | null
  isActive: boolean
  pages?: { count: number }[]
}

interface TutorProfile {
  id: string
  name: string | null
  tier: string
}

interface SessionWithNotes extends SessionRoom {
  hasNotes: boolean
}

export function ParentPortalWidget({ roomId }: { roomId: string }) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const [sessions, setSessions] = useState<SessionWithNotes[]>([])
  const [tutor, setTutor] = useState<TutorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentName, setStudentName] = useState<string>('Student')
  const [currentSubject, setCurrentSubject] = useState<string>('')

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms?status=inactive')
      if (!res.ok) throw new Error('Failed to load sessions')
      const data: SessionRoom[] = await res.json()

      // Check localStorage for notes for each session
      const withNotes: SessionWithNotes[] = data.map((room) => {
        const notesKey = `sb-notes-${room.id}`
        let hasNotes = false
        try {
          const stored = localStorage.getItem(notesKey)
          if (stored) {
            const parsed = JSON.parse(stored)
            hasNotes = parsed && parsed.content && parsed.content.trim().length > 0
          }
        } catch {
          // ignore parse errors
        }
        return { ...room, hasNotes }
      })

      setSessions(withNotes)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    }
  }, [])

  const fetchTutor = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get tutor profile
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const profile = await res.json()
        setTutor(profile)
        if (profile.name) {
          setStudentName(profile.name)
        }
      }
    } catch {
      // Silently fail for tutor info
    }
  }, [])

  const fetchCurrentRoom = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = await (supabase as any)
        .from('Room')
        .select('subject, tutorId, id')
        .eq('id', roomId)
        .single()
      if (data) {
        setCurrentSubject(data.subject || 'General')
        // If there's a different tutorId, try to get their name
        if (data.tutorId) {
          const { data: tutorData } = await (supabase as any)
            .from('User')
            .select('name')
            .eq('id', data.tutorId)
            .single()
          if (tutorData?.name) {
            setTutor((prev) => prev ? { ...prev, name: tutorData.name } : { id: data.tutorId, name: tutorData.name, tier: 'FREE' })
          }
        }
      }
    } catch {
      // ignore
    }
  }, [roomId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      await Promise.all([fetchSessions(), fetchTutor(), fetchCurrentRoom()])
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [fetchSessions, fetchTutor, fetchCurrentRoom])

  if (loading) {
    return (
      <div className={`parent-portal-widget ${isDark ? '' : 'parent-portal-widget-light'}`}>
        <div className={`parent-portal-loading ${isDark ? '' : 'parent-portal-loading-light'}`}>
          <div className="analytics-spinner" />
          <span>Loading session history...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`parent-portal-widget ${isDark ? '' : 'parent-portal-widget-light'}`}>
        <div className="parent-portal-error">{error}</div>
      </div>
    )
  }

  // Compute summary stats
  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10
  const avgMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0
  // Attendance is always 100% since we only show completed sessions
  const attendance = 100

  const tier = (tutor?.tier || 'FREE') as Tier

  return (
    <div className={`parent-portal-widget ${isDark ? '' : 'parent-portal-widget-light'}`}>
      {/* Context info */}
      <div className="parent-portal-info">
        <div className="parent-portal-info-row">
          <span className={`parent-portal-info-label ${isDark ? '' : 'parent-portal-info-label-light'}`}>Student</span>
          <span className={`parent-portal-info-value ${isDark ? '' : 'parent-portal-info-value-light'}`}>{studentName}</span>
        </div>
        <div className="parent-portal-info-row">
          <span className={`parent-portal-info-label ${isDark ? '' : 'parent-portal-info-label-light'}`}>Tutor</span>
          <span className={`parent-portal-info-value ${isDark ? '' : 'parent-portal-info-value-light'}`}>{tutor?.name || 'Unknown'}</span>
        </div>
        <div className="parent-portal-info-row">
          <span className={`parent-portal-info-label ${isDark ? '' : 'parent-portal-info-label-light'}`}>Subject</span>
          <span className={`parent-portal-info-value ${isDark ? '' : 'parent-portal-info-value-light'}`}>
            {currentSubject ? currentSubject.charAt(0) + currentSubject.slice(1).toLowerCase() : 'General'}
          </span>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="parent-portal-section">
        <div className={`parent-portal-section-title ${isDark ? '' : 'parent-portal-section-title-light'}`}>Recent Sessions</div>
        <div className="parent-portal-sessions">
          {sessions.length === 0 && (
            <div className={`parent-portal-empty ${isDark ? '' : 'parent-portal-empty-light'}`}>No completed sessions yet</div>
          )}
          {sessions.slice(0, 10).map((session) => {
            const date = new Date(session.createdAt)
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const pageCount = Array.isArray(session.pages) && session.pages[0]
              ? session.pages[0].count
              : 0
            return (
              <div key={session.id} className={`parent-portal-session-card ${isDark ? '' : 'parent-portal-session-card-light'}`}>
                <div className="parent-portal-session-header">
                  <span className={`parent-portal-session-date ${isDark ? '' : 'parent-portal-session-date-light'}`}>{dateStr}</span>
                  <span className="parent-portal-session-subject">
                    {session.subject.charAt(0) + session.subject.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className={`parent-portal-session-meta ${isDark ? '' : 'parent-portal-session-meta-light'}`}>
                  <span>Duration: {session.durationMinutes || 0} min</span>
                  <span>Pages: {pageCount}</span>
                  <span className={session.hasNotes ? 'parent-portal-notes-available' : ''}>
                    Notes: {session.hasNotes ? 'Available' : 'None'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      {sessions.length > 0 && (
        <div className="parent-portal-section">
          <div className={`parent-portal-section-title ${isDark ? '' : 'parent-portal-section-title-light'}`}>Summary</div>
          <div className="parent-portal-summary">
            <div className="parent-portal-summary-item">
              <span className={`parent-portal-summary-label ${isDark ? '' : 'parent-portal-summary-label-light'}`}>Total</span>
              <span className={`parent-portal-summary-value ${isDark ? '' : 'parent-portal-summary-value-light'}`}>
                {totalSessions} sessions · {totalHours} hours
              </span>
            </div>
            <div className="parent-portal-summary-item">
              <span className={`parent-portal-summary-label ${isDark ? '' : 'parent-portal-summary-label-light'}`}>Attendance</span>
              <span className={`parent-portal-summary-value ${isDark ? '' : 'parent-portal-summary-value-light'}`}>{attendance}%</span>
            </div>
            <div className="parent-portal-summary-item">
              <span className={`parent-portal-summary-label ${isDark ? '' : 'parent-portal-summary-label-light'}`}>Avg session</span>
              <span className={`parent-portal-summary-value ${isDark ? '' : 'parent-portal-summary-value-light'}`}>{avgMinutes} min</span>
            </div>
          </div>
        </div>
      )}

      {/* Billing */}
      <div className="parent-portal-section">
        <div className={`parent-portal-section-title ${isDark ? '' : 'parent-portal-section-title-light'}`}>Billing</div>
        <div className="parent-portal-billing">
          <div className={`parent-portal-billing-plan ${isDark ? '' : 'parent-portal-billing-plan-light'}`}>
            Current plan: <strong>{getTierLabel(tier)} ({getTierPrice(tier)})</strong>
          </div>
          <a href="/pricing" className="parent-portal-billing-btn">
            Manage Billing
          </a>
        </div>
      </div>
    </div>
  )
}
