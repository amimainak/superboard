// ============================================================
// SchedulePanel — Upcoming & past scheduled lessons
// ============================================================
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { subjectMeta } from '@/lib/subject-meta';
import type { Subject } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Clock, Video, Users, X, Edit2, Play, CheckCircle, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface ScheduledLesson {
  id: string;
  title: string;
  subject: string;
  scheduledAt: string;
  durationMinutes: number;
  studentEmail: string | null;
  studentName: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  roomId: string | null;
}

interface CreateForm {
  title: string;
  subject: string;
  studentEmail: string;
  scheduledAt: string;
  durationMinutes: number;
}

const DURATIONS = [15, 30, 45, 60, 90, 120];

const EMPTY_FORM: CreateForm = {
  title: '',
  subject: 'MATH',
  studentEmail: '',
  scheduledAt: '',
  durationMinutes: 60,
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function formatDateTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + `, ${time}`;
}

function statusBadge(status: ScheduledLesson['status']) {
  switch (status) {
    case 'SCHEDULED':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] px-1.5 py-0 rounded-full font-medium">
          Scheduled
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] px-1.5 py-0 rounded-full font-medium">
          Completed
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge className="bg-rose-100 text-rose-600 hover:bg-rose-100 text-[10px] px-1.5 py-0 rounded-full font-medium">
          Cancelled
        </Badge>
      );
  }
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
type Props = { userId: string };

export function SchedulePanel({ userId }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [lessons, setLessons] = useState<ScheduledLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<CreateForm>(EMPTY_FORM);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // lesson id
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  // ---- Fetch ----
  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/schedule?tutorId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch schedule');
      const data = await res.json();
      setLessons(data.lessons ?? []);
    } catch {
      toast({ title: 'Failed to load schedule', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const upcoming = lessons.filter((l) => l.status === 'SCHEDULED');
  const past = lessons.filter((l) => l.status === 'COMPLETED' || l.status === 'CANCELLED');

  // ---- Create ----
  const handleCreate = async () => {
    if (!form.title.trim() || !form.scheduledAt) {
      toast({ title: 'Please fill in title and date/time', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const res = await authFetch('/api/schedule', {
        method: 'POST',
        body: JSON.stringify({ ...form, tutorId: userId }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(body || 'Failed to create lesson');
      }
      toast({ title: 'Lesson scheduled!', description: `${form.title} has been added to your schedule.` });
      setForm(EMPTY_FORM);
      setDialogOpen(false);
      fetchLessons();
    } catch (err: any) {
      toast({ title: 'Failed to schedule lesson', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  // ---- Cancel ----
  const handleCancel = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await authFetch(`/api/schedule/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'CANCELLED' }) });
      if (!res.ok) throw new Error('Failed to cancel');
      toast({ title: 'Lesson cancelled' });
      fetchLessons();
    } catch {
      toast({ title: 'Failed to cancel lesson', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Edit ----
  const openEdit = (lesson: ScheduledLesson) => {
    setEditId(lesson.id);
    setEditForm({
      title: lesson.title,
      subject: lesson.subject,
      studentEmail: lesson.studentEmail ?? '',
      scheduledAt: lesson.scheduledAt.slice(0, 16), // datetime-local format
      durationMinutes: lesson.durationMinutes,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!editId || !editForm.title.trim() || !editForm.scheduledAt) return;
    setCreating(true);
    try {
      const res = await authFetch(`/api/schedule/${editId}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast({ title: 'Lesson updated' });
      setEditDialogOpen(false);
      setEditId(null);
      fetchLessons();
    } catch {
      toast({ title: 'Failed to update lesson', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  // ---- Start Now ----
  const handleStartNow = async (lesson: ScheduledLesson) => {
    setActionLoading(lesson.id);
    try {
      // If room already exists, go there
      if (lesson.roomId) {
        router.push(`/room/${lesson.roomId}`);
        return;
      }
      // Create a room then open it
      const res = await authFetch('/api/room', {
        method: 'POST',
        body: JSON.stringify({
          tutorId: userId,
          subject: lesson.subject,
          scheduledLessonId: lesson.id,
        }),
      });
      if (!res.ok) throw new Error('Failed to create room');
      const data = await res.json();
      router.push(`/room/${data.room.id}`);
    } catch {
      toast({ title: 'Failed to start lesson', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Lesson Card ----
  const renderCard = (lesson: ScheduledLesson) => {
    const meta = subjectMeta[lesson.subject] || subjectMeta.GENERAL;
    const isUpcoming = lesson.status === 'SCHEDULED';
    return (
      <div
        key={lesson.id}
        className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/50 hover:border-emerald-200/60 transition-all"
      >
        {/* Subject icon */}
        <div className={`w-9 h-9 rounded-lg ${meta.gradient} flex items-center justify-center shadow-sm shrink-0`}>
          <meta.icon className="w-4 h-4 text-white" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">
              {lesson.title}
            </span>
            {statusBadge(lesson.status)}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDateTime(lesson.scheduledAt)}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lesson.durationMinutes} min
            </span>
          </div>
          {lesson.studentEmail && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Users className="w-3 h-3" />
              {lesson.studentName || lesson.studentEmail}
            </span>
          )}
        </div>

        {/* Actions (upcoming only) */}
        {isUpcoming && (
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-100 hover:text-emerald-700"
              title="Start Now"
              disabled={actionLoading === lesson.id}
              onClick={() => handleStartNow(lesson)}
            >
              {actionLoading === lesson.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
              title="Edit"
              onClick={() => openEdit(lesson)}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-rose-50 hover:text-rose-600"
              title="Cancel"
              disabled={actionLoading === lesson.id}
              onClick={() => setConfirmCancelId(lesson.id)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  // ---- Create / Edit Dialog Form ----
  const renderForm = (
    f: CreateForm,
    setF: React.Dispatch<React.SetStateAction<CreateForm>>,
    onSubmit: () => void,
    submitLabel: string,
  ) => (
    <div className="space-y-4 pt-2">
      <div>
        <Label className="text-gray-700 mb-1 block">Title</Label>
        <Input
          placeholder="e.g. Algebra Review"
          value={f.title}
          onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))}
          className="rounded-xl"
        />
      </div>
      <div>
        <Label className="text-gray-700 mb-1 block">Subject</Label>
        <Select value={f.subject} onValueChange={(v) => setF((p) => ({ ...p, subject: v }))}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(subjectMeta).map(([key, meta]) => (
              <SelectItem key={key} value={key}>{meta.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-gray-700 mb-1 block">Student Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input
          type="email"
          placeholder="student@example.com"
          value={f.studentEmail}
          onChange={(e) => setF((p) => ({ ...p, studentEmail: e.target.value }))}
          className="rounded-xl"
        />
      </div>
      <div>
        <Label className="text-gray-700 mb-1 block">Date & Time</Label>
        <Input
          type="datetime-local"
          value={f.scheduledAt}
          onChange={(e) => setF((p) => ({ ...p, scheduledAt: e.target.value }))}
          className="rounded-xl"
        />
      </div>
      <div>
        <Label className="text-gray-700 mb-1 block">Duration</Label>
        <Select value={String(f.durationMinutes)} onValueChange={(v) => setF((p) => ({ ...p, durationMinutes: Number(v) }))}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DURATIONS.map((d) => (
              <SelectItem key={d} value={String(d)}>{d} minutes</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={onSubmit}
        disabled={creating}
        className="w-full rounded-xl gradient-primary border-0 text-white font-semibold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30"
      >
        {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </div>
  );

  // ---- Loading State ----
  if (loading) {
    return (
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---- Main Render ----
  return (
    <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            Schedule
            {upcoming.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs font-medium">
                {upcoming.length} upcoming
              </Badge>
            )}
          </CardTitle>

          {/* New Lesson Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" />
                  Schedule New Lesson
                </DialogTitle>
              </DialogHeader>
              {renderForm(form, setForm, handleCreate, 'Schedule Lesson')}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {lessons.length === 0 ? (
          /* Empty State */
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No lessons scheduled</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Plan your upcoming tutoring sessions here.</p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Schedule First Lesson
            </Button>
          </div>
        ) : (
          /* Tabs: Upcoming / Past */
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="w-full grid grid-cols-2 rounded-xl mb-3">
              <TabsTrigger value="upcoming" className="rounded-lg text-xs font-medium">
                Upcoming ({upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="rounded-lg text-xs font-medium">
                Past ({past.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {upcoming.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All caught up! No upcoming lessons.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                  {upcoming.map(renderCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {past.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No past lessons yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                  {past.map(renderCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!confirmCancelId} onOpenChange={(open) => { if (!open) setConfirmCancelId(null); }}>
        <AlertDialogContent className="rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the scheduled lesson as cancelled. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" onClick={() => setConfirmCancelId(null)}>Keep It</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => {
                if (confirmCancelId) {
                  handleCancel(confirmCancelId);
                  setConfirmCancelId(null);
                }
              }}
            >
              Cancel Lesson
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-emerald-500" />
              Edit Lesson
            </DialogTitle>
          </DialogHeader>
          {renderForm(editForm, setEditForm, handleEdit, 'Save Changes')}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
