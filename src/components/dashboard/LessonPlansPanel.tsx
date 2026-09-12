// ============================================================
// Lesson Plans Panel (Milestone 2 — Dashboard Tab)
// ============================================================
// Lists saved LessonPlan records with edit/play/delete actions.
// "Edit" opens the whiteboard's Lesson Builder; "Play" opens the
// Lesson Player. Both actions require navigating to the whiteboard
// (since the builder/player live in the whiteboard client). For
// convenience we pass lesson data via sessionStorage so the
// whiteboard can pick it up on mount.
// ============================================================

'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { authFetch } from '@/lib/auth-fetch'
import { subjectMeta } from '@/lib/subject-meta'
import type { LessonPlanFull, LessonPlanRow, Tier } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ListChecks, Play, Pencil, Trash2, Globe, Lock, Loader2, Plus } from 'lucide-react'

interface LessonPlansPanelProps {
  userId: string
  tier: Tier
}

export function LessonPlansPanel({ userId, tier }: LessonPlansPanelProps) {
  const [lessons, setLessons] = useState<LessonPlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchLessons = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch('/api/lessons')
      if (!res.ok) throw new Error('Failed to fetch lesson plans')
      const data = await res.json()
      setLessons(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || 'Failed to load lesson plans')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (userId) fetchLessons()
  }, [userId, fetchLessons])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this lesson plan? This cannot be undone.')) return
    setBusyId(id)
    try {
      const res = await authFetch(`/api/lessons/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setLessons((prev) => prev.filter((l) => l.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete lesson plan')
    } finally {
      setBusyId(null)
    }
  }, [])

  // Fetch full lesson (with steps) then stash it in sessionStorage and
  // navigate to the whiteboard, where WhiteboardClient will pick it up
  // and open the appropriate panel.
  const launchLesson = useCallback(async (lesson: LessonPlanRow, mode: 'edit' | 'play') => {
    setBusyId(lesson.id)
    try {
      const res = await authFetch(`/api/lessons/${lesson.id}`)
      if (!res.ok) throw new Error('Failed to load lesson plan')
      const full = (await res.json()) as LessonPlanFull
      try {
        sessionStorage.setItem(
          'superboard_pending_lesson',
          JSON.stringify({ lesson: full, mode })
        )
      } catch { /* sessionStorage may be unavailable; ignore */ }
      window.location.href = '/whiteboard'
    } catch (err: any) {
      alert(err.message || 'Failed to open lesson plan')
      setBusyId(null)
    }
  }, [])

  const canAccess = tier === 'PRO' || tier === 'AGENCY' || tier === 'AGENCY_STANDARD' || tier === 'AGENCY_PREMIUM'

  if (!canAccess) {
    return (
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Lesson Plans</CardTitle>
          <CardDescription>Sequenced lessons are a Pro feature.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center">
            <ListChecks className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-muted-foreground font-medium">Upgrade to Pro to compose lesson plans</p>
          <p className="text-sm text-muted-foreground mt-1">Build sequenced, widget-driven lessons you can replay.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-emerald-500" />
            Lesson Plans
          </CardTitle>
          <CardDescription>Sequenced, widget-driven lessons you can replay during sessions.</CardDescription>
        </div>
        <a
          href="/whiteboard"
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl gradient-primary text-white text-xs font-semibold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
          title="Open Lesson Builder on the whiteboard"
        >
          <Plus className="w-3.5 h-3.5" /> New Lesson
        </a>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-sm text-rose-600">{error}</div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <ListChecks className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-muted-foreground font-medium">No lesson plans yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Open the whiteboard and use the Lesson Builder (Ctrl+Shift+L) to compose your first sequenced lesson.
            </p>
            <a
              href="/whiteboard"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl gradient-primary text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Open Whiteboard
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson) => {
              const meta = subjectMeta[lesson.subject] || subjectMeta.GENERAL
              const isBusy = busyId === lesson.id
              return (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between rounded-xl border border-emerald-100/40 px-4 py-3.5 hover:bg-emerald-50/40 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-lg ${meta.gradient} flex items-center justify-center shadow-sm shrink-0`}>
                      <meta.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate flex items-center gap-1.5">
                        {lesson.title}
                        {lesson.isPublic ? (
                          <Globe className="w-3 h-3 text-emerald-500" aria-label="Public" />
                        ) : (
                          <Lock className="w-3 h-3 text-gray-300" aria-label="Private" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {meta.label}
                        {lesson.gradeBand && ` · ${lesson.gradeBand}`}
                        {` · Updated ${new Date(lesson.updatedAt).toLocaleDateString()}`}
                      </p>
                      {lesson.description && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{lesson.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {lesson.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] rounded-full hidden sm:inline-flex">
                        {tag}
                      </Badge>
                    ))}
                    <button
                      onClick={() => launchLesson(lesson, 'play')}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-lg gradient-primary text-white text-xs font-semibold disabled:opacity-50"
                      title="Play this lesson on the whiteboard"
                    >
                      {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      <span className="hidden sm:inline">Play</span>
                    </button>
                    <button
                      onClick={() => launchLesson(lesson, 'edit')}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-50 disabled:opacity-50"
                      title="Edit this lesson in the Lesson Builder"
                    >
                      <Pencil className="w-3 h-3" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(lesson.id)}
                      disabled={isBusy}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      title="Delete this lesson"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
