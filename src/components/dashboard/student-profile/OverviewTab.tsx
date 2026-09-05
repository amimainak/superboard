// ============================================================
// OverviewTab — stat cards + subject breakdown + recent activity
// ============================================================

'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Clock, ClipboardList, Activity, Calendar } from 'lucide-react'
import { subjectMeta } from '@/lib/subject-meta'
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
  const homeworkCompletionRate = stats.homework.total > 0
    ? Math.round(((stats.homework.submitted + stats.homework.reviewed) / stats.homework.total) * 100)
    : 0

  const recentActivity = timeline.slice(0, 8)

  return (
    <div className="space-y-5">
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
    </div>
  )
}
