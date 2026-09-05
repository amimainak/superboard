// ============================================================
// StudentProfilePanel — F-05 Student Profiles with Timeline
// ============================================================
// Full-page panel shown when a tutor clicks "View Profile" on a
// student in the roster. Four tabs:
//
//   Overview  — stat cards + subject breakdown + recent activity
//   Timeline  — full chronological feed, filterable by event type
//   Profile   — editable parent contact, consent, grade, notes
//   Join Link — generate / regenerate / revoke the student's join URL
//
// All data comes from /api/student/[studentId]/profile — the panel
// is purely presentational and does not store anything locally
// beyond edit-form state.
// ============================================================

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { authFetch } from '@/lib/auth-fetch'
import { subjectMeta } from '@/lib/subject-meta'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Clock, BookOpen, ClipboardList, StickyNote, Mail, Phone, User,
  Calendar, Activity, GraduationCap, Link as LinkIcon, Copy, Check, RefreshCw,
  Trash2, AlertCircle, Loader2, ExternalLink,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { OverviewTab } from './student-profile/OverviewTab'
import { TimelineTab } from './student-profile/TimelineTab'
import { ProfileTab } from './student-profile/ProfileTab'
import { JoinLinkTab } from './student-profile/JoinLinkTab'

// ----------------------------------------------------------------
// Types — mirror the API response shape
// ----------------------------------------------------------------
export interface StudentProfile {
  id: string
  email: string
  name: string | null
  isActive: boolean
  createdAt: string
  deactivatedAt: string | null
  parentName: string | null
  parentEmail: string | null
  parentPhone: string | null
  consentPhoto: boolean
  consentVideo: boolean
  consentRecording: boolean
  consentMarketing: boolean
  consentAt: string | null
  gradeLevel: string | null
  subjects: string[]
  notes: string | null
  hasJoinToken: boolean
  joinTokenGeneratedAt: string | null
}

export interface StudentStats {
  totalLessons: number
  totalHours: number
  subjectBreakdown: Record<string, { count: number; minutes: number }>
  homework: {
    total: number
    assigned: number
    in_progress: number
    submitted: number
    returned: number
    reviewed: number
  }
  notesCount: number
  lastActive: string | null
}

export type TimelineEvent =
  | { kind: 'lesson'; id: string; date: string; subject: string; durationMinutes: number; tutorName: string | null; roomId: string }
  | { kind: 'homework_assigned'; id: string; date: string; title: string; dueAt: string | null; status: string; assignmentId: string }
  | { kind: 'homework_submitted'; id: string; date: string; title: string; status: string; assignmentId: string }
  | { kind: 'homework_returned'; id: string; date: string; title: string; status: string; assignmentId: string }
  | { kind: 'note'; id: string; date: string; content: string; subject: string | null; tutorName: string | null; roomId: string | null }

interface ProfileResponse {
  student: StudentProfile
  stats: StudentStats
  timeline: TimelineEvent[]
}

interface Props {
  studentId: string
  studentName: string
  onBack: () => void
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export function StudentProfilePanel({ studentId, studentName, onBack }: Props) {
  const { toast } = useToast()
  const [data, setData] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const res = await authFetch(`/api/student/${studentId}/profile`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json: ProfileResponse = await res.json()
      setData(json)
    } catch {
      toast({ title: 'Failed to load student profile', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [studentId, toast])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // ---- Loading state ----
  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Students
        </Button>
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
              <span className="ml-3 text-sm text-muted-foreground">Loading profile...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { student, stats, timeline } = data

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground -ml-2" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{student.name || student.email}</h2>
              {student.isActive ? (
                <Badge className="bg-emerald-100 text-emerald-700 text-[10px] rounded-full border-0">Active</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] rounded-full">Inactive</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {student.email}
              {student.gradeLevel && ` · ${student.gradeLevel}`}
              {student.parentEmail && ` · Parent: ${student.parentEmail}`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="rounded-xl bg-muted/50 p-1 h-auto">
          <TabsTrigger value="overview" className="rounded-lg text-sm px-4 py-1.5">Overview</TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-lg text-sm px-4 py-1.5">Timeline</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-lg text-sm px-4 py-1.5">Profile</TabsTrigger>
          <TabsTrigger value="join" className="rounded-lg text-sm px-4 py-1.5">Join Link</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <OverviewTab student={student} stats={stats} timeline={timeline} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-0">
          <TimelineTab timeline={timeline} />
        </TabsContent>

        <TabsContent value="profile" className="mt-0">
          <ProfileTab student={student} onUpdated={fetchProfile} />
        </TabsContent>

        <TabsContent value="join" className="mt-0">
          <JoinLinkTab student={student} onUpdated={fetchProfile} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
