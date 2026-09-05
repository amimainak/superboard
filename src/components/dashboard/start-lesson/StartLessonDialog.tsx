// ============================================================
// StartLessonDialog — shared board-picker + student-picker
// ============================================================
// Two modes:
//
//   mode='profile'  — used from the student profile Overview tab.
//     The student is fixed; the tutor picks which saved board to
//     start from. Calls POST /api/student/[studentId]/start-lesson
//     and redirects to /room/[roomId].
//
//   mode='library'  — used from the Board Library. The board is
//     fixed; the tutor optionally picks a student to link the
//     lesson to. Calls POST /api/library/[boardId]/start-lesson
//     and redirects to /room/[roomId].
//
// Both modes share the same UI shell (search, list, confirm) and
// the same loading/error states.
// ============================================================

'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Search, FileText, Loader2, Play, AlertCircle, Check } from 'lucide-react'
import { authFetch } from '@/lib/auth-fetch'
import { subjectMeta } from '@/lib/subject-meta'
import { useToast } from '@/hooks/use-toast'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface BoardListItem {
  id: string
  title: string | null
  subject: string
  studentName: string | null
  tags: string[]
  isArchived: boolean
  lastOpenedAt: string | null
  createdAt: string
  _count?: { pages: number }
}

interface StudentListItem {
  id: string
  name: string | null
  email: string
  isActive: boolean
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

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export function StartLessonDialog(props: Props) {
  const { open, onOpenChange, mode } = props
  const router = useRouter()
  const { toast } = useToast()

  // Shared state
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [search, setSearch] = useState('')

  // List data — boards (profile mode) or students (library mode)
  const [boards, setBoards] = useState<BoardListItem[]>([])
  const [students, setStudents] = useState<StudentListItem[]>([])

  // Selection
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')  // '' = no student (library mode only)

  // ----------------------------------------------------------------
  // Load list when dialog opens
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSelectedBoardId(null)
    setSelectedStudentId('')
    setSearch('')

    const endpoint = mode === 'profile'
      ? '/api/library?limit=100&sort=recent'  // tutor's saved boards
      : '/api/agency/students?status=active&limit=200'  // tutor's active students

    authFetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        if (mode === 'profile') {
          // Filter to non-archived boards (we still allow archived as source — see filtered list below)
          setBoards((data.boards || []).filter((b: BoardListItem) => !b.isArchived))
        } else {
          setStudents(data.students || [])
        }
      })
      .catch(() => {
        toast({ title: 'Failed to load', variant: 'destructive' })
      })
      .finally(() => setLoading(false))
  }, [open, mode, toast])

  // ----------------------------------------------------------------
  // Filtered list (search)
  // ----------------------------------------------------------------
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (mode === 'profile') {
      if (!q) return boards
      return boards.filter((b) =>
        (b.title || '').toLowerCase().includes(q) ||
        b.subject.toLowerCase().includes(q) ||
        (b.studentName || '').toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q))
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
  // Start the lesson
  // ----------------------------------------------------------------
  const handleStart = useCallback(async () => {
    setStarting(true)
    try {
      let res: Response
      if (mode === 'profile') {
        if (!selectedBoardId) return
        res = await authFetch(`/api/student/${props.studentId}/start-lesson`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceBoardId: selectedBoardId }),
        })
      } else {
        res = await authFetch(`/api/library/${props.boardId}/start-lesson`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selectedStudentId ? { studentId: selectedStudentId } : {}),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start lesson')
      }

      // Brief success flash, then redirect
      toast({
        title: 'Lesson ready',
        description: data.studentName
          ? `Starting lesson with ${data.studentName}...`
          : 'Redirecting to your lesson...',
      })

      onOpenChange(false)
      // Use a short timeout so the toast can paint before navigation
      setTimeout(() => {
        window.location.href = `/room/${data.roomId}`
      }, 200)
    } catch (e: unknown) {
      toast({
        title: 'Failed to start lesson',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setStarting(false)
    }
  }, [mode, selectedBoardId, selectedStudentId, props, onOpenChange, toast, router])

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  const dialogTitle = mode === 'profile'
    ? `Start Next Lesson with ${props.studentName}`
    : `Start Lesson from "${props.boardTitle}"`

  const dialogDescription = mode === 'profile'
    ? 'Pick a saved board — today\'s lesson will open pre-filled with its contents. A copy is made; your original board stays untouched.'
    : 'Optionally pick a student to link this lesson to. A copy of the board is made; the original stays untouched.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-500" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={mode === 'profile' ? 'Search boards...' : 'Search students...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl pl-9 h-9 text-sm"
          />
        </div>

        {/* List */}
        <div className="rounded-xl border border-border max-h-[320px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 px-4">
              {mode === 'profile' ? (
                <>
                  <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm font-medium">No saved boards yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Run a lesson first, then come back here to start future lessons from it.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">No students found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add students in the Students tab to link lessons to them.
                  </p>
                </>
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
                          {b._count?.pages ? ` · ${b._count.pages} page${b._count.pages !== 1 ? 's' : ''}` : ''}
                          {b.lastOpenedAt ? ` · opened ${formatRelative(b.lastOpenedAt)}` : ''}
                        </p>
                        {b.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {b.tags.slice(0, 4).map((t) => (
                              <span key={t} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0 rounded-full">{t}</span>
                            ))}
                          </div>
                        )}
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

        {/* Library mode: "no student" hint */}
        {mode === 'library' && !loading && (
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {selectedStudentId
              ? `Lesson will be linked to ${students.find((s) => s.id === selectedStudentId)?.name || 'the selected student'}.`
              : 'No student selected — lesson will start without a student link. You can still add one from the room later.'}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)} disabled={starting}>
            Cancel
          </Button>
          <Button
            className="rounded-xl gradient-primary border-0 text-white font-semibold gap-1.5"
            onClick={handleStart}
            disabled={starting || (mode === 'profile' && !selectedBoardId)}
          >
            {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {starting ? 'Starting...' : 'Start lesson'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
