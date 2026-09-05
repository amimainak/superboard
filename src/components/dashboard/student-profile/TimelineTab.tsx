// ============================================================
// TimelineTab — full chronological feed, filterable
// ============================================================

'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, ClipboardList, Check, RefreshCw, StickyNote, ExternalLink } from 'lucide-react'
import { subjectMeta } from '@/lib/subject-meta'
import type { TimelineEvent } from '../StudentProfilePanel'

interface Props {
  timeline: TimelineEvent[]
}

type Filter = 'all' | 'lesson' | 'homework' | 'note'

function formatDateHeader(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function eventIcon(kind: TimelineEvent['kind']) {
  const cls = "w-3.5 h-3.5"
  switch (kind) {
    case 'lesson': return <BookOpen className={cls} />
    case 'homework_assigned': return <ClipboardList className={cls} />
    case 'homework_submitted': return <Check className={cls} />
    case 'homework_returned': return <RefreshCw className={cls} />
    case 'note': return <StickyNote className={cls} />
  }
}

function eventColor(kind: TimelineEvent['kind']): string {
  switch (kind) {
    case 'lesson': return 'bg-emerald-100 text-emerald-700'
    case 'homework_assigned': return 'bg-amber-100 text-amber-700'
    case 'homework_submitted': return 'bg-blue-100 text-blue-700'
    case 'homework_returned': return 'bg-purple-100 text-purple-700'
    case 'note': return 'bg-gray-100 text-gray-700'
  }
}

function eventTitle(e: TimelineEvent): string {
  switch (e.kind) {
    case 'lesson':
      return `${subjectMeta[e.subject]?.label ?? e.subject} Lesson`
    case 'homework_assigned':
      return 'Homework Assigned'
    case 'homework_submitted':
      return 'Homework Submitted'
    case 'homework_returned':
      return e.status === 'reviewed' ? 'Homework Reviewed' : 'Homework Returned'
    case 'note':
      return 'Lesson Note'
  }
}

function eventBody(e: TimelineEvent): React.ReactNode {
  switch (e.kind) {
    case 'lesson':
      return (
        <span>
          {e.durationMinutes > 0 && <span className="text-muted-foreground">{e.durationMinutes} min · </span>}
          {e.tutorName && <span className="text-muted-foreground">with {e.tutorName}</span>}
        </span>
      )
    case 'homework_assigned':
      return (
        <span>
          &ldquo;{e.title}&rdquo;
          {e.dueAt && <span className="text-muted-foreground"> · due {new Date(e.dueAt).toLocaleDateString()}</span>}
        </span>
      )
    case 'homework_submitted':
    case 'homework_returned':
      return <span>&ldquo;{e.title}&rdquo;</span>
    case 'note':
      return (
        <span className="text-muted-foreground italic">
          &ldquo;{e.content.length > 200 ? e.content.slice(0, 200) + '...' : e.content}&rdquo;
          {e.tutorName && <span className="not-italic"> — {e.tutorName}</span>}
        </span>
      )
  }
}

function eventLink(e: TimelineEvent): { href: string; label: string } | null {
  switch (e.kind) {
    case 'lesson':
      return { href: `/room/${e.roomId}`, label: 'Open board' }
    case 'homework_assigned':
    case 'homework_submitted':
    case 'homework_returned':
      return { href: `/hw/${e.assignmentId}`, label: 'Open assignment' }
    case 'note':
      return e.roomId ? { href: `/room/${e.roomId}`, label: 'Open board' } : null
  }
}

export function TimelineTab({ timeline }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [visibleCount, setVisibleCount] = useState(50)

  const filtered = useMemo(() => {
    if (filter === 'all') return timeline
    if (filter === 'homework') {
      return timeline.filter((e) => e.kind === 'homework_assigned' || e.kind === 'homework_submitted' || e.kind === 'homework_returned')
    }
    return timeline.filter((e) => e.kind === filter)
  }, [timeline, filter])

  // Group by day
  const grouped = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>()
    for (const e of filtered) {
      const date = new Date(e.date)
      const key = date.toISOString().split('T')[0]
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return Array.from(map.entries())
  }, [filtered])

  const visible = grouped.slice(0, Math.ceil(visibleCount / 5)) // approximate day grouping
  const hasMore = grouped.length > visible.length

  if (timeline.length === 0) {
    return (
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-10 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No activity yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Lessons, homework, and notes will appear here as they happen.
          </p>
        </CardContent>
      </Card>
    )
  }

  const filterChips: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'lesson', label: 'Lessons' },
    { id: 'homework', label: 'Homework' },
    { id: 'note', label: 'Notes' },
  ]

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterChips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => { setFilter(chip.id); setVisibleCount(50) }}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filter === chip.id
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
            }`}
          >
            {chip.label}
          </button>
        ))}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {visible.map(([dateKey, events]) => (
          <div key={dateKey}>
            <div className="sticky top-0 bg-gradient-to-b from-white via-white to-transparent pb-2 z-10">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {formatDateHeader(events[0].date)}
              </p>
            </div>
            <div className="space-y-2.5 mt-2">
              {events.map((e) => {
                const link = eventLink(e)
                return (
                  <Card key={e.id} className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3.5 flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${eventColor(e.kind)}`}>
                        {eventIcon(e.kind)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{eventTitle(e)}</p>
                          <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatTime(e.date)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5 leading-snug">
                          {eventBody(e)}
                        </div>
                        {link && (
                          <a
                            href={link.href}
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 mt-1.5 font-medium"
                          >
                            {link.label}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center pt-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setVisibleCount((c) => c + 50)}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
