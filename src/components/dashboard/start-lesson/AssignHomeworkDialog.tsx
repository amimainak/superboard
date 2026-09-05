// ============================================================
// AssignHomeworkDialog — shared dialog for assigning any board
// as homework to a student
// ============================================================
// Two modes (mirrors StartLessonDialog):
//
//   mode='profile'  — used from the student profile Overview tab.
//     The student is fixed; the tutor picks which saved board to
//     assign. Calls POST /api/homework-assignments with the
//     board's snapshot + studentId.
//
//   mode='library'  — used from the Board Library. The board is
//     fixed; the tutor optionally picks a student to assign to.
//
// On success: copies the homework link to clipboard and shows a
// toast. The tutor can then paste it into whatever channel they
// use to reach the student/parent.
// ============================================================

'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Search, Loader2, ClipboardList, Check, AlertCircle } from 'lucide-react'
import { authFetch } from '@/lib/auth-fetch'
import { subjectMeta } from '@/lib/subject-meta'
import { useToast } from '@/hooks/use-toast'

interface BoardListItem {
  id: string
  title: string | null
  subject: string
  _count?: { pages: number }
  lastOpenedAt: string | null
}

interface StudentListItem {
  id: string
  name: string | null
  email: string
}

interface BaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ProfileModeProps extends BaseProps {
  mode: 'profile'
  studentId: string
  studentName: string
}

interface LibraryModeProps extends BaseProps {
  mode: 'library'
  boardId: string
  boardTitle: string
}

type Props = ProfileModeProps | LibraryModeProps

export function AssignHomeworkDialog(props: Props) {
  const { open, onOpenChange, mode } = props
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')

  const [boards, setBoards] = useState<BoardListItem[]>([])
  const [students, setStudents] = useState<StudentListItem[]>([])

  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [parentNotify, setParentNotify] = useState(true)

  // ----------------------------------------------------------------
  // Load list when dialog opens
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSelectedBoardId(null)
    setSelectedStudentId('')
    setSearch('')
    setTitle('')
    setDescription('')
    setDueDate('')
    setParentNotify(true)

    // Pre-fill: library mode → board is fixed; profile mode → student is fixed
    if (mode === 'library') {
      setSelectedBoardId(props.boardId)
      setTitle(props.boardTitle ? `${props.boardTitle} — Homework` : 'Homework')
    }

    const endpoint = mode === 'profile'
      ? '/api/library?limit=100&sort=recent'
      : '/api/agency/students?status=active&limit=200'

    authFetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        if (mode === 'profile') {
          setBoards((data.boards || []).filter((b: BoardListItem) => true))
        } else {
          setStudents(data.students || [])
        }
      })
      .catch(() => toast({ title: 'Failed to load', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [open, mode, props, toast])

  // ----------------------------------------------------------------
  // Filtered list
  // ----------------------------------------------------------------
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (mode === 'profile') {
      if (!q) return boards
      return boards.filter((b) =>
        (b.title || '').toLowerCase().includes(q) ||
        b.subject.toLowerCase().includes(q)
      )
    } else {
      if (!q) return students
      return students.filter((s) =>
        (s.name || '').toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      )
    }
  }, [search, boards, students, mode])

  // ----------------------------------------------------------------
  // Auto-set title from selected board (profile mode)
  // ----------------------------------------------------------------
  useEffect(() => {
    if (mode === 'profile' && selectedBoardId && !title) {
      const board = boards.find((b) => b.id === selectedBoardId)
      if (board?.title) setTitle(`${board.title} — Homework`)
    }
  }, [selectedBoardId, boards, title, mode])

  // ----------------------------------------------------------------
  // Create assignment
  // ----------------------------------------------------------------
  const handleAssign = useCallback(async () => {
    if (!selectedBoardId) {
      toast({ title: 'Pick a board first', variant: 'destructive' })
      return
    }
    if (!title.trim()) {
      toast({ title: 'Add a title', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      // Fetch the board's snapshot
      const boardRes = await authFetch(`/api/room/export?roomId=${selectedBoardId}`)
      if (!boardRes.ok) throw new Error('Failed to load board contents')
      const boardData = await boardRes.json()

      const snapshot = {
        elements: boardData.pages?.[0]?.snapshot?.elements || [],
        camera: boardData.pages?.[0]?.snapshot?.camera || { x: 0, y: 0, zoom: 1 },
        pages: (boardData.pages || []).map((p: { pageIndex: number; snapshot: { elements: unknown[]; camera: { x: number; y: number; zoom: number } } }, i: number) => ({
          ...p.snapshot,
          pageIndex: i,
        })),
      }

      // Determine studentId
      const studentId = mode === 'profile' ? props.studentId : (selectedStudentId || undefined)

      const res = await authFetch('/api/homework-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSnapshot: snapshot,
          sourceRoomId: selectedBoardId,
          title,
          description: description || undefined,
          studentId,
          dueAt: dueDate ? new Date(dueDate).toISOString() : undefined,
          parentNotifyOnReview: parentNotify,
          notify: true,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create assignment')
      }
      const { assignment } = await res.json()
      const link = `${window.location.origin}/hw/${assignment.assignmentToken}`

      // Copy to clipboard
      try { await navigator.clipboard.writeText(link) } catch { /* silent */ }

      toast({
        title: 'Homework assigned!',
        description: 'Student link copied to clipboard — paste it wherever you reach them.',
      })
      onOpenChange(false)
    } catch (e: unknown) {
      toast({
        title: 'Failed to assign homework',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }, [selectedBoardId, title, description, dueDate, parentNotify, mode, props, selectedStudentId, onOpenChange, toast])

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  const dialogTitle = mode === 'profile'
    ? `Assign Homework to ${props.studentName}`
    : `Assign "${props.boardTitle}" as Homework`

  const dialogDescription = mode === 'profile'
    ? 'Pick a saved board — the student gets a personal link to work on at home. A copy is made; your original board stays untouched.'
    : 'Optionally pick a student to assign this to. The student gets a personal link to work on at home.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-emerald-500" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fractions Practice — Chapter 5"
              className="rounded-xl h-9 text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Instructions (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any instructions for the student..."
              className="rounded-xl text-sm min-h-[60px]"
            />
          </div>

          {/* Search + List */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              {mode === 'profile' ? 'Pick a board to assign' : 'Pick a student (optional)'}
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={mode === 'profile' ? 'Search boards...' : 'Search students...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl pl-9 h-9 text-sm"
              />
            </div>
            <div className="rounded-xl border border-border max-h-[200px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8 px-4">
                  {mode === 'profile' ? (
                    <>
                      <p className="text-sm font-medium">No saved boards yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Run a lesson first, then assign its board as homework.</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No students found. You can still assign without a student link.</p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {mode === 'profile'
                    ? (filteredItems as BoardListItem[]).map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setSelectedBoardId(b.id)}
                          className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-start gap-3 ${
                            selectedBoardId === b.id ? 'bg-emerald-50/50' : ''
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center ${
                            selectedBoardId === b.id ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                          }`}>
                            {selectedBoardId === b.id && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{b.title || 'Untitled board'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {subjectMeta[b.subject]?.label ?? b.subject}
                              {b._count?.pages ? ` · ${b._count.pages}p` : ''}
                            </p>
                          </div>
                        </button>
                      ))
                    : (filteredItems as StudentListItem[]).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedStudentId(selectedStudentId === s.id ? '' : s.id)}
                          className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-start gap-3 ${
                            selectedStudentId === s.id ? 'bg-emerald-50/50' : ''
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center ${
                            selectedStudentId === s.id ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                          }`}>
                            {selectedStudentId === s.id && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.name || s.email}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.email}</p>
                          </div>
                        </button>
                      ))
                  }
                </div>
              )}
            </div>
          </div>

          {/* Due date + notify */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Due date (optional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-xl h-9 text-sm"
              />
            </div>
            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={parentNotify}
                  onChange={(e) => setParentNotify(e.target.checked)}
                  className="w-3.5 h-3.5 rounded"
                />
                Email parent when reviewed
              </label>
            </div>
          </div>

          {/* Library mode hint */}
          {mode === 'library' && (
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {selectedStudentId
                ? `Homework will be assigned to ${students.find((s) => s.id === selectedStudentId)?.name || 'the selected student'} and they'll get an email with the link.`
                : 'No student selected — the homework will be created without a student link. You can still copy the link and send it manually.'}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancel
          </Button>
          <Button
            className="rounded-xl gradient-primary border-0 text-white font-semibold gap-1.5"
            onClick={handleAssign}
            disabled={creating || (mode === 'profile' && !selectedBoardId) || !title.trim()}
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
            {creating ? 'Assigning...' : 'Assign homework'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
