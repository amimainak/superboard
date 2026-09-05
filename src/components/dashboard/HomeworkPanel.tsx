// ============================================================
// HomeworkPanel — Full homework management (F-04+ unified)
// ============================================================
// Migrated from the old /api/homework system to /api/homework-assignments
// which has the full state machine, board snapshots, and token-based
// student access.
//
// Status flow: assigned → in_progress → submitted → returned → reviewed
// The tutor can:
//   • Create a new assignment from a saved board (picks board + student)
//   • View all assignments with status filter
//   • Open the homework review view (the /hw/[token] page in tutor mode)
//   • Mark reviewed or return with one click
// ============================================================

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { authFetch } from '@/lib/auth-fetch'
import { subjectMeta } from '@/lib/subject-meta'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  BookOpen, Plus, Loader2, CheckCircle, Clock, Eye, Send, RotateCcw, Check, ExternalLink, Search,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { StartLessonDialog } from './start-lesson/StartLessonDialog'

// ----------------------------------------------------------------
// Types — match /api/homework-assignments response
// ----------------------------------------------------------------
interface Assignment {
  id: string
  assignmentToken: string
  title: string
  description: string | null
  status: string  // assigned | in_progress | submitted | returned | reviewed
  late: boolean
  dueAt: string | null
  submitUntil: string
  viewUntil: string
  openedAt: string | null
  submittedAt: string | null
  createdAt: string
  student: { id: string; name: string | null; email: string } | null
}

interface StudentOption {
  id: string
  name: string | null
  email: string
}

interface BoardOption {
  id: string
  title: string | null
  subject: string
  _count?: { pages: number }
  lastOpenedAt: string | null
}

// Status display config
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  assigned:     { label: 'Assigned',   cls: 'bg-slate-100 text-slate-700' },
  in_progress:  { label: 'In progress', cls: 'bg-amber-100 text-amber-700' },
  submitted:    { label: 'Submitted',  cls: 'bg-blue-100 text-blue-700' },
  returned:     { label: 'Returned',   cls: 'bg-purple-100 text-purple-700' },
  reviewed:     { label: 'Reviewed',   cls: 'bg-emerald-100 text-emerald-700' },
}

const STATUS_FILTERS = ['ALL', 'assigned', 'in_progress', 'submitted', 'returned', 'reviewed'] as const

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
type Props = { userId: string; agencyId?: string; userTier?: string }

export function HomeworkPanel({ userId }: Props) {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [students, setStudents] = useState<StudentOption[]>([])
  const [boards, setBoards] = useState<BoardOption[]>([])
  const [boardSearch, setBoardSearch] = useState('')
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    studentId: '',
    sourceBoardId: '',
    dueDate: '',
    parentNotifyOnReview: true,
  })

  // Action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ---- Fetch assignments ----
  const fetchAssignments = useCallback(async () => {
    try {
      const res = await authFetch('/api/homework-assignments?limit=100')
      if (!res.ok) return
      const data = await res.json()
      setAssignments(data.assignments || [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchAssignments().finally(() => setLoading(false))
  }, [fetchAssignments])

  // ---- Fetch students + boards when create dialog opens ----
  useEffect(() => {
    if (!createOpen) return
    // Load students
    authFetch('/api/agency/students?status=active&limit=200')
      .then((r) => r.json())
      .then((d) => setStudents(d.students || []))
      .catch(() => {})
    // Load boards
    authFetch('/api/library?limit=100&sort=recent')
      .then((r) => r.json())
      .then((d) => setBoards((d.boards || []).filter((b: BoardOption) => true)))
      .catch(() => {})
  }, [createOpen])

  // ---- Filtered assignments ----
  const filtered = statusFilter === 'ALL'
    ? assignments
    : assignments.filter((a) => a.status === statusFilter)

  // ---- Filtered boards (search) ----
  const filteredBoards = boardSearch.trim()
    ? boards.filter((b) =>
        (b.title || '').toLowerCase().includes(boardSearch.toLowerCase()) ||
        b.subject.toLowerCase().includes(boardSearch.toLowerCase())
      )
    : boards

  // ---- Create assignment ----
  const handleCreate = async () => {
    if (!createForm.title.trim()) {
      toast({ title: 'Please add a title', variant: 'destructive' })
      return
    }
    if (!createForm.sourceBoardId) {
      toast({ title: 'Please pick a board to assign', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      // Fetch the board's current snapshot
      const boardRes = await authFetch(`/api/room/export?roomId=${createForm.sourceBoardId}`)
      if (!boardRes.ok) throw new Error('Failed to load board contents')
      const boardData = await boardRes.json()

      // Build the snapshot in the format the homework system expects
      const snapshot = {
        elements: boardData.pages?.[0]?.snapshot?.elements || [],
        camera: boardData.pages?.[0]?.snapshot?.camera || { x: 0, y: 0, zoom: 1 },
        pages: (boardData.pages || []).map((p: { pageIndex: number; snapshot: { elements: unknown[]; camera: { x: number; y: number; zoom: number } } }, i: number) => ({
          ...p.snapshot,
          pageIndex: i,
        })),
      }

      const res = await authFetch('/api/homework-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSnapshot: snapshot,
          sourceRoomId: createForm.sourceBoardId,
          title: createForm.title,
          description: createForm.description || undefined,
          studentId: createForm.studentId || undefined,
          dueAt: createForm.dueDate ? new Date(createForm.dueDate).toISOString() : undefined,
          parentNotifyOnReview: createForm.parentNotifyOnReview,
          notify: true,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create assignment')
      }
      const { assignment } = await res.json()
      const link = `${window.location.origin}/hw/${assignment.assignmentToken}`
      toast({
        title: 'Homework assigned!',
        description: 'Link copied to clipboard — send it to the student.',
      })
      // Copy link to clipboard
      try { await navigator.clipboard.writeText(link) } catch { /* silent */ }
      setCreateForm({ title: '', description: '', studentId: '', sourceBoardId: '', dueDate: '', parentNotifyOnReview: true })
      setCreateOpen(false)
      fetchAssignments()
    } catch (e: unknown) {
      toast({
        title: 'Failed to create homework',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  // ---- Tutor actions: review / return ----
  const handleAction = async (id: string, action: 'review' | 'return') => {
    setActionLoading(`${id}-${action}`)
    try {
      const res = await authFetch(`/api/homework-assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: action === 'review' ? 'Marked as reviewed' : 'Returned to student' })
      fetchAssignments()
    } catch {
      toast({ title: 'Action failed', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  // ---- Copy link ----
  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/hw/${token}`
    try {
      await navigator.clipboard.writeText(link)
      toast({ title: 'Link copied', description: 'Send it to the student' })
    } catch {
      toast({ title: 'Copy failed — long-press the link', variant: 'destructive' })
    }
  }

  // ---- Loading state ----
  if (loading) {
    return (
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-500" />
            Homework
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-40" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // ---- Render ----
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-emerald-600" />
            </div>
            Homework
            {assignments.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs font-medium">{assignments.length}</Badge>
            )}
          </CardTitle>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm gap-2"
              >
                <Plus className="w-4 h-4" />
                Assign
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" />
                  Assign Homework
                </DialogTitle>
                <DialogDescription>Pick a saved board and a student. The student gets a personal link to work on at home.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {/* Title */}
                <div>
                  <Label className="text-sm font-medium mb-1 block">Title</Label>
                  <Input
                    placeholder="e.g. Fractions Practice — Chapter 5"
                    value={createForm.title}
                    onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label className="text-sm font-medium mb-1 block">Instructions (optional)</Label>
                  <Textarea
                    placeholder="Any instructions for the student..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                    className="rounded-xl min-h-[60px]"
                  />
                </div>

                {/* Student */}
                <div>
                  <Label className="text-sm font-medium mb-1 block">Student</Label>
                  <Select
                    value={createForm.studentId}
                    onValueChange={(v) => setCreateForm((p) => ({ ...p, studentId: v }))}
                  >
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pick a student (optional)" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name || s.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Linking a student lets you track their progress and sends them an email.</p>
                </div>

                {/* Board picker */}
                <div>
                  <Label className="text-sm font-medium mb-1 block">Pick a board to assign</Label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search boards..."
                      value={boardSearch}
                      onChange={(e) => setBoardSearch(e.target.value)}
                      className="rounded-xl pl-9 h-9 text-sm"
                    />
                  </div>
                  <div className="rounded-xl border max-h-[180px] overflow-y-auto">
                    {filteredBoards.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">No saved boards. Save a board first, then assign it as homework.</p>
                    ) : filteredBoards.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setCreateForm((p) => ({ ...p, sourceBoardId: b.id }))}
                        className={`w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors border-b last:border-0 ${createForm.sourceBoardId === b.id ? 'bg-emerald-50/50' : ''}`}
                      >
                        <p className="text-sm font-medium truncate">{b.title || 'Untitled board'}</p>
                        <p className="text-xs text-muted-foreground">
                          {subjectMeta[b.subject]?.label ?? b.subject}
                          {b._count?.pages ? ` · ${b._count.pages}p` : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Due date + notify */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium mb-1 block">Due date (optional)</Label>
                    <Input
                      type="date"
                      value={createForm.dueDate}
                      onChange={(e) => setCreateForm((p) => ({ ...p, dueDate: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
                      <input
                        type="checkbox"
                        checked={createForm.parentNotifyOnReview}
                        onChange={(e) => setCreateForm((p) => ({ ...p, parentNotifyOnReview: e.target.checked }))}
                        className="w-4 h-4 rounded"
                      />
                      Email parent when reviewed
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleCreate}
                  disabled={creating || !createForm.title.trim() || !createForm.sourceBoardId}
                  className="w-full rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {creating ? 'Creating...' : 'Assign homework'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                statusFilter === f
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
              }`}
            >
              {f === 'ALL' ? 'All' : STATUS_CONFIG[f]?.label || f}
            </button>
          ))}
        </div>

        {/* Assignment list */}
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {assignments.length === 0
                ? 'No homework yet. Click "Assign" to create your first.'
                : 'No homework matches this filter.'}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs">Title</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs hidden sm:table-cell">Student</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs hidden lg:table-cell">Due</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((hw) => {
                  const statusCfg = STATUS_CONFIG[hw.status] || STATUS_CONFIG.assigned
                  return (
                    <tr key={hw.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-xs truncate max-w-[160px]">{hw.title}</p>
                        {hw.late && (
                          <span className="text-[10px] text-red-600">Late</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs hidden sm:table-cell">
                        <p className="font-medium">{hw.student?.name || '—'}</p>
                        <p className="text-[10px] text-muted-foreground">{hw.student?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-[10px] rounded-full border-0 ${statusCfg.cls}`}>{statusCfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {hw.dueAt ? new Date(hw.dueAt).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {/* Open in new tab (tutor review view) */}
                          <a
                            href={`/hw/${hw.assignmentToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-emerald-600"
                            title="Open homework (review view)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>

                          {/* Copy link */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded-lg hover:bg-muted"
                            title="Copy student link"
                            onClick={() => handleCopyLink(hw.assignmentToken)}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>

                          {/* Review action */}
                          {hw.status === 'submitted' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded-lg hover:bg-emerald-50 hover:text-emerald-700"
                              title="Mark reviewed"
                              disabled={actionLoading === `${hw.id}-review`}
                              onClick={() => handleAction(hw.id, 'review')}
                            >
                              {actionLoading === `${hw.id}-review`
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Check className="w-3.5 h-3.5" />}
                            </Button>
                          )}

                          {/* Return action */}
                          {(hw.status === 'submitted' || hw.status === 'reviewed') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded-lg hover:bg-purple-50 hover:text-purple-700"
                              title="Return for edits"
                              disabled={actionLoading === `${hw.id}-return`}
                              onClick={() => handleAction(hw.id, 'return')}
                            >
                              {actionLoading === `${hw.id}-return`
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <RotateCcw className="w-3.5 h-3.5" />}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
