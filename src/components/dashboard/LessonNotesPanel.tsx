// ============================================================
// LessonNotesPanel — Post-lesson notes management
// Fetches completed rooms, then per-room note lookups
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { subjectMeta } from '@/lib/subject-meta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  StickyNote,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  Star,
  FileText,
  MessageSquare,
  BookOpenCheck,
  PenLine,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface EndedRoom {
  id: string;
  subject: string;
  endedAt: string | null;
  durationMinutes: number | null;
  createdAt: string;
}

interface LessonNote {
  id: string;
  roomId: string;
  content: string;
  tutorFeedback: string | null;
  topicsForNext: string | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

interface RoomWithNote {
  room: EndedRoom;
  note: LessonNote | null;
  loading: boolean;
}

interface NoteForm {
  content: string;
  tutorFeedback: string;
  topicsForNext: string;
  rating: number;
}

const EMPTY_FORM: NoteForm = {
  content: '',
  tutorFeedback: '',
  topicsForNext: '',
  rating: 5,
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          onClick={() => onChange?.(star)}
        >
          <Star
            className={`w-5 h-5 ${
              star <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
type Props = { userId: string };

export function LessonNotesPanel({ userId }: Props) {
  const { toast } = useToast();

  const [roomsWithNotes, setRoomsWithNotes] = useState<RoomWithNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [noteForm, setNoteForm] = useState<NoteForm>(EMPTY_FORM);
  const [editingNote, setEditingNote] = useState<LessonNote | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ---- Fetch ended rooms, then per-room notes ----
  const fetchRoomsAndNotes = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch all rooms for this tutor
      const roomsRes = await authFetch(`/api/room/list?tutorId=${userId}`);
      if (!roomsRes.ok) throw new Error('Failed to fetch rooms');
      const roomsData = await roomsRes.json();

      // 2. Filter to ended rooms only
      const endedRooms: EndedRoom[] = (roomsData.rooms || [])
        .filter((r: any) => !r.isActive && r.endedAt)
        .map((r: any) => ({
          id: r.id,
          subject: r.subject || 'GENERAL',
          endedAt: r.endedAt,
          durationMinutes: r.durationMinutes || null,
          createdAt: r.createdAt,
        }));

      // 3. Create initial room entries
      const initial: RoomWithNote[] = endedRooms.map((r) => ({
        room: r,
        note: null,
        loading: true,
      }));
      setRoomsWithNotes(initial);

      // 4. Fetch notes for each room
      const notePromises = endedRooms.map(async (room) => {
        try {
          const noteRes = await authFetch(`/api/lesson-notes?roomId=${room.id}`);
          if (!noteRes.ok) return null;
          const noteData = await noteRes.json();
          // The API returns { notes: [...] }, find matching room note
          const matching = (noteData.notes || []).find((n: any) => n.roomId === room.id);
          return matching || null;
        } catch {
          return null;
        }
      });

      const noteResults = await Promise.all(notePromises);

      setRoomsWithNotes((prev) =>
        prev.map((entry, i) => ({
          ...entry,
          note: noteResults[i],
          loading: false,
        }))
      );
    } catch {
      toast({ title: 'Failed to load lessons', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchRoomsAndNotes();
  }, [fetchRoomsAndNotes]);

  const openAddNote = (room: EndedRoom) => {
    setCurrentRoomId(room.id);
    setEditingNote(null);
    setNoteForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditNote = (room: EndedRoom, note: LessonNote) => {
    setCurrentRoomId(room.id);
    setEditingNote(note);
    setNoteForm({
      content: note.content,
      tutorFeedback: note.tutorFeedback || '',
      topicsForNext: note.topicsForNext || '',
      rating: note.rating || 5,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentRoomId || !noteForm.content.trim()) {
      toast({ title: 'Please add notes content', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/lesson-notes', {
        method: 'POST',
        body: JSON.stringify({
          roomId: currentRoomId,
          content: noteForm.content,
          tutorFeedback: noteForm.tutorFeedback || null,
          topicsForNext: noteForm.topicsForNext || null,
          rating: noteForm.rating,
        }),
      });
      if (!res.ok) throw new Error('Failed to save note');
      toast({ title: editingNote ? 'Notes updated!' : 'Notes saved!' });
      setDialogOpen(false);
      fetchRoomsAndNotes();
    } catch {
      toast({ title: 'Failed to save notes', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ---- Counts ----
  const totalRooms = roomsWithNotes.length;
  const notedRooms = roomsWithNotes.filter((r) => r.note).length;

  // ---- Loading ----
  if (loading) {
    return (
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-emerald-500" />
            Lesson Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-gray-50 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---- Render ----
  return (
    <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <StickyNote className="w-4 h-4 text-amber-600" />
          </div>
          Lesson Notes
          {totalRooms > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs font-medium">
              {notedRooms}/{totalRooms}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {totalRooms === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <StickyNote className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No completed lessons yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Notes will appear here after you end a lesson.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {roomsWithNotes.map((entry) => {
              const meta = subjectMeta[entry.room.subject] || subjectMeta.GENERAL;
              const isExpanded = expandedId === entry.room.id;
              const endedDate = entry.room.endedAt || entry.room.createdAt;

              return (
                <div
                  key={entry.room.id}
                  className="rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/30 transition-all"
                >
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : entry.room.id)}
                  >
                    <div className={`w-8 h-8 rounded-lg ${meta.gradient} flex items-center justify-center shadow-sm shrink-0`}>
                      <meta.icon className="w-4 h-4 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{meta.label} Lesson</span>
                        {entry.loading ? (
                          <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                        ) : entry.note ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] px-1.5 py-0 rounded-full font-medium">
                            <StickyNote className="w-2.5 h-2.5 mr-0.5" />
                            Notes
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 text-[10px] px-1.5 py-0 rounded-full font-medium">
                            No notes
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatDateTime(endedDate)}
                        {entry.room.durationMinutes != null && entry.room.durationMinutes > 0 && (
                          <span className="ml-1.5">· {entry.room.durationMinutes} min</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-gray-100">
                      {entry.loading ? (
                        <div className="pt-4 text-center">
                          <Loader2 className="w-5 h-5 animate-spin text-emerald-500 mx-auto" />
                          <p className="text-xs text-muted-foreground mt-2">Loading notes...</p>
                        </div>
                      ) : entry.note ? (
                        <div className="pt-3 space-y-3">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <FileText className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-xs font-semibold text-gray-700">Notes</span>
                            </div>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap bg-white rounded-lg p-3 border border-gray-100">{entry.note.content}</p>
                          </div>

                          {entry.note.tutorFeedback && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-xs font-semibold text-gray-700">Feedback</span>
                              </div>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-white rounded-lg p-3 border border-gray-100">{entry.note.tutorFeedback}</p>
                            </div>
                          )}

                          {entry.note.topicsForNext && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <BookOpenCheck className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-xs font-semibold text-gray-700">Topics for Next Time</span>
                              </div>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-white rounded-lg p-3 border border-gray-100">{entry.note.topicsForNext}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Rating:</span>
                              <StarRating value={entry.note.rating || 0} readonly />
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-emerald-600 hover:bg-emerald-50"
                              onClick={(e) => { e.stopPropagation(); openEditNote(entry.room, entry.note!); }}
                            >
                              <PenLine className="w-3 h-3 mr-1" />
                              Edit Notes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-4 pb-2 text-center">
                          <p className="text-sm text-muted-foreground mb-3">No notes for this lesson yet.</p>
                          <Button
                            size="sm"
                            className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm gap-2"
                            onClick={(e) => { e.stopPropagation(); openAddNote(entry.room); }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Write Notes
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Write/Edit Notes Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-emerald-500" />
              {editingNote ? 'Edit Lesson Notes' : 'Write Lesson Notes'}
            </DialogTitle>
            <DialogDescription>
              {editingNote ? 'Update your notes for this lesson.' : 'Add post-lesson notes and feedback.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Notes Content *</Label>
              <Textarea
                placeholder="What was covered in this lesson? Key takeaways..."
                value={noteForm.content}
                onChange={(e) => setNoteForm((p) => ({ ...p, content: e.target.value }))}
                className="rounded-xl min-h-[100px]"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Feedback for Student</Label>
              <Textarea
                placeholder="How did the student do? Areas for improvement..."
                value={noteForm.tutorFeedback}
                onChange={(e) => setNoteForm((p) => ({ ...p, tutorFeedback: e.target.value }))}
                className="rounded-xl min-h-[80px]"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Topics for Next Time</Label>
              <Textarea
                placeholder="What should be covered next lesson?"
                value={noteForm.topicsForNext}
                onChange={(e) => setNoteForm((p) => ({ ...p, topicsForNext: e.target.value }))}
                className="rounded-xl min-h-[60px]"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Lesson Rating</Label>
              <StarRating value={noteForm.rating} onChange={(v) => setNoteForm((p) => ({ ...p, rating: v }))} />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !noteForm.content.trim()}
              className="w-full rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingNote ? 'Update Notes' : 'Save Notes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
