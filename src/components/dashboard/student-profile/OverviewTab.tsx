// ============================================================
// OverviewTab — stat cards + subject breakdown + recent activity
// ============================================================

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Clock, ClipboardList, Activity, Calendar, Play, Sparkles, ClipboardCheck } from 'lucide-react'
import { subjectMeta } from '@/lib/subject-meta'
import { useTutorPreferences } from '@/hooks/useTutorPreferences'
import { StartLessonDialog } from '../start-lesson/StartLessonDialog'
import { AssignHomeworkDialog } from '../start-lesson/AssignHomeworkDialog'
import type { StudentProfile, StudentStats, TimelineEvent } from '../StudentProfilePanel'

interface Props {
  student: StudentProfile
  stats: StudentStats
  timeline: TimelineEvent[]
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function eventIcon(kind: TimelineEvent['kind']) {
  switch (kind) {
    case 'lesson': return <BookOpen className="w-3.5 h-3.5" />
    case 'homework_assigned': return <ClipboardList className="w-3.5 h-3.5" />
    case 'homework_submitted': return <Check className="w-3.5 h-3.5" />
    case 'homework_returned': return <RefreshCw className="w-3.5 h-3.5" />
    case 'note': return <StickyNote className="w-3.5 h-3.5" />
  }
}

function eventDescription(e: TimelineEvent): string {
  switch (e.kind) {
    case 'lesson':
      return `${subjectMeta[e.subject]?.label ?? e.subject} lesson${e.durationMinutes ? ` · ${e.durationMinutes} min` : ''}`
    case 'homework_assigned':
      return `Homework assigned: "${e.title}"`
    case 'homework_submitted':
      return `Homework submitted: "${e.title}"`
    case 'homework_returned':
      return `Homework returned: "${e.title}"`
    case 'note':
      return e.content.length > 100 ? e.content.slice(0, 100) + '...' : e.content
  }
}

// We need to import these here for the icon function
import { Check, RefreshCw, StickyNote } from 'lucide-react'

export function OverviewTab({ student, stats, timeline }: Props) {
  const { prefs } = useTutorPreferences()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [homeworkDialogOpen, setHomeworkDialogOpen] = useState(false)

  const homeworkCompletionRate = stats.homework.total > 0
    ? Math.round(((stats.homework.submitted + stats.homework.reviewed) / stats.homework.total) * 100)
    : 0

  const recentActivity = timeline.slice(0, 8)

  return (
    <div className="space-y-5">
      {/* Action buttons — Start Next Lesson (primary) + Assign Homework (secondary).
          Start Next Lesson is gated by the startLessonFromProfile preference. */}
      <div className="flex flex-col sm:flex-row gap-3">
        {prefs.startLessonFromProfile && (
          <button
            onClick={() => setDialogOpen(true)}
            className="flex-1 group relative overflow-hidden rounded-2xl p-5 text-left transition-all hover:shadow-lg hover:shadow-emerald-500/10 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform flex-shrink-0">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  Start Next Lesson
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Pick a saved board and begin today&apos;s lesson — pre-filled with your choice.
                </p>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  A copy is made — your original board stays untouched.
                </p>
              </div>
              <div className="text-emerald-600 group-hover:translate-x-1 transition-transform flex-shrink-0 mt-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        )}

        {/* Assign Homework — secondary action, always available */}
        <button
          onClick={() => setHomeworkDialogOpen(true)}
          className="flex-1 group relative overflow-hidden rounded-2xl p-5 text-left transition-all hover:shadow-lg hover:shadow-purple-500/10 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/30 group-hover:scale-105 transition-transform flex-shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900">
                Assign Homework
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Send {student.name || 'this student'} a board to work on at home.
              </p>
              <p className="text-[11px] text-gray-500 mt-1.5">
                They get a personal link — no account needed.
              </p>
            </div>
            <div className="text-purple-600 group-hover:translate-x-1 transition-transform flex-shrink-0 mt-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium uppercase tracking-wide">Lessons</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalLessons}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">attended</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium uppercase tracking-wide">Hours</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalHours}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">total</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <ClipboardList className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium uppercase tracking-wide">Homework</span>
            </div>
            <p className="text-2xl font-bold">{stats.homework.submitted + stats.homework.reviewed}<span className="text-base text-muted-foreground">/{stats.homework.total}</span></p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{homeworkCompletionRate}% submitted</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium uppercase tracking-wide">Last Active</span>
            </div>
            <p className="text-2xl font-bold">{formatRelative(stats.lastActive)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stats.notesCount} notes</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject breakdown */}
      {Object.keys(stats.subjectBreakdown).length > 0 && (
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              Subjects
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.subjectBreakdown)
                .sort(([, a], [, b]) => b.minutes - a.minutes)
                .map(([subj, data]) => {
                  const totalMinutes = Object.values(stats.subjectBreakdown).reduce((s, x) => s + x.minutes, 0)
                  const pct = totalMinutes > 0 ? Math.round((data.minutes / totalMinutes) * 100) : 0
                  return (
                    <div key={subj}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{subjectMeta[subj]?.label ?? subj}</span>
                        <span className="text-muted-foreground text-xs">
                          {data.count} lesson{data.count !== 1 ? 's' : ''} · {(data.minutes / 60).toFixed(1)}h
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            Recent Activity
          </h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((e) => (
                <div key={e.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0 mt-0.5">
                    {eventIcon(e.kind)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{eventDescription(e)}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{formatRelative(e.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start Lesson Dialog */}
      <StartLessonDialog
        mode="profile"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        studentId={student.id}
        studentName={student.name || 'this student'}
      />

      {/* Assign Homework Dialog */}
      <AssignHomeworkDialog
        mode="profile"
        open={homeworkDialogOpen}
        onOpenChange={setHomeworkDialogOpen}
        studentId={student.id}
        studentName={student.name || 'this student'}
      />
    </div>
  )
}
