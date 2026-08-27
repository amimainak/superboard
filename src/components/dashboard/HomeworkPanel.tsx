// ============================================================
// HomeworkPanel — Full homework management for tutors & agencies
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { subjectMeta } from '@/lib/subject-meta';
import { isAgencyTier } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Plus,
  Loader2,
  FileText,
  CheckCircle,
  Clock,
  Eye,
  Star,
  Send,
  ClipboardCheck,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface HomeworkItem {
  id: string;
  title: string;
  description: string | null;
  student: { id: string; name: string; email: string } | null;
  tutor: { id: string; name: string | null; email: string } | null;
  subject: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'OVERDUE';
  dueDate: string | null;
  grade: string | null;
  tutorFeedback: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StudentOption {
  id: string;
  name: string;
  email: string;
}

interface CreateForm {
  title: string;
  description: string;
  studentEmail: string;
  subject: string;
  dueDate: string;
}

interface GradeForm {
  tutorFeedback: string;
  grade: string;
}

const STATUS_OPTIONS = ['ALL', 'PENDING', 'SUBMITTED', 'GRADED', 'OVERDUE'] as const;

const EMPTY_CREATE: CreateForm = {
  title: '',
  description: '',
  studentEmail: '',
  subject: 'MATH',
  dueDate: '',
};

const EMPTY_GRADE: GradeForm = {
  tutorFeedback: '',
  grade: '',
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function statusBadge(status: HomeworkItem['status']) {
  const map: Record<HomeworkItem['status'], { cls: string; label: string }> = {
    PENDING: {
      cls: 'bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] px-2 py-0 rounded-full font-medium',
      label: 'Pending',
    },
    SUBMITTED: {
      cls: 'bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] px-2 py-0 rounded-full font-medium',
      label: 'Submitted',
    },
    GRADED: {
      cls: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] px-2 py-0 rounded-full font-medium',
      label: 'Graded',
    },
    OVERDUE: {
      cls: 'bg-red-100 text-red-600 hover:bg-red-100 text-[10px] px-2 py-0 rounded-full font-medium',
      label: 'Overdue',
    },
  };
  const { cls, label } = map[status];
  return <Badge className={cls}>{label}</Badge>;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === 'GRADED' || status === 'SUBMITTED') return false;
  return new Date(dueDate) < new Date();
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
type Props = { userId: string; agencyId?: string; userTier?: string };

export function HomeworkPanel({ userId, agencyId, userTier }: Props) {
  const isAgency = userTier ? isAgencyTier(userTier as any) : false;
  const { toast } = useToast();

  // My homework
  const [myHomework, setMyHomework] = useState<HomeworkItem[]>([]);
  // Agency all homework
  const [agencyHomework, setAgencyHomework] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [students, setStudents] = useState<StudentOption[]>([]);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [creating, setCreating] = useState(false);

  // Grade dialog
  const [gradeOpen, setGradeOpen] = useState(false);
  const [gradeForm, setGradeForm] = useState<GradeForm>(EMPTY_GRADE);
  const [gradingItem, setGradingItem] = useState<HomeworkItem | null>(null);
  const [grading, setGrading] = useState(false);

  // Action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ---- Fetch homework ----
  // The API automatically returns agency-wide data for agency owners,
  // and only own homework for tutors. We split on the client side.
  const fetchHomework = useCallback(async () => {
    try {
      const res = await authFetch('/api/homework?limit=100');
      if (!res.ok) return;
      const data = await res.json();
      const items: HomeworkItem[] = (data.homeworks || []).map((h: any) => {
        if (h.status === 'PENDING' && isOverdue(h.dueDate, h.status)) {
          return { ...h, status: 'OVERDUE' as const };
        }
        return h;
      });
      // For agency view: split into mine vs all
      if (isAgency) {
        setMyHomework(items.filter((h) => h.tutor?.id === userId));
        setAgencyHomework(items);
      } else {
        setMyHomework(items);
      }
    } catch {
      // silent
    }
  }, [userId, isAgency]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await fetchHomework();
    setLoading(false);
  }, [fetchHomework]);

  // ---- Fetch students ----
  const fetchStudents = useCallback(async () => {
    try {
      const res = await authFetch('/api/agency/students?status=active&limit=200');
      if (!res.ok) return;
      const data = await res.json();
      setStudents((data.students || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email,
      })));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchAll();
    fetchStudents();
  }, [fetchAll, fetchStudents]);

  // Re-filter when userId changes
  useEffect(() => {
    if (isAgency && agencyHomework.length > 0) {
      setMyHomework(agencyHomework.filter((h) => h.tutor?.id === userId));
    }
  }, [userId, isAgency, agencyHomework]);

  // ---- Get active list ----
  const homework = isAgency ? agencyHomework : myHomework;
  const filtered = statusFilter === 'ALL'
    ? homework
    : homework.filter((h) => h.status === statusFilter);

  // ---- Create ----
  const handleCreate = async () => {
    if (!createForm.title.trim() || !createForm.studentEmail.trim() || !createForm.dueDate) {
      toast({ title: 'Please fill in title, student email, and due date', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      // Find student by email
      const matchedStudent = students.find(
        (s) => s.email.toLowerCase() === createForm.studentEmail.trim().toLowerCase()
      );
      const body: Record<string, unknown> = {
        title: createForm.title,
        description: createForm.description || null,
        subject: createForm.subject,
        dueDate: new Date(createForm.dueDate).toISOString(),
        studentId: matchedStudent?.id || null,
      };
      const res = await authFetch('/api/homework', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        throw new Error(bodyText || 'Failed to create homework');
      }
      toast({ title: 'Homework assigned!', description: createForm.title });
      setCreateForm(EMPTY_CREATE);
      setCreateOpen(false);
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Failed to create homework', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  // ---- Grade ----
  const openGradeDialog = (item: HomeworkItem) => {
    setGradingItem(item);
    setGradeForm({
      tutorFeedback: item.tutorFeedback || '',
      grade: item.grade || '',
    });
    setGradeOpen(true);
  };

  const handleGrade = async () => {
    if (!gradingItem) return;
    setGrading(true);
    try {
      const res = await authFetch(`/api/homework/${gradingItem.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'GRADED', ...gradeForm }),
      });
      if (!res.ok) throw new Error('Failed to grade');
      toast({ title: 'Homework graded!', description: gradingItem.title });
      setGradeOpen(false);
      setGradingItem(null);
      fetchAll();
    } catch {
      toast({ title: 'Failed to grade homework', variant: 'destructive' });
    } finally {
      setGrading(false);
    }
  };

  // ---- Mark submitted ----
  const handleMarkSubmitted = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await authFetch(`/api/homework/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'SUBMITTED' }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast({ title: 'Marked as submitted' });
      fetchAll();
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Mark graded (quick action) ----
  const handleMarkGraded = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await authFetch(`/api/homework/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'GRADED' }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast({ title: 'Marked as graded' });
      fetchAll();
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Loading ----
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
    );
  }

  // ---- Render table ----
  const renderTable = (items: HomeworkItem[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8">
          <CheckCircle className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No homework matches this filter.</p>
        </div>
      );
    }
    return (
      <div className="rounded-xl border overflow-hidden max-h-[420px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b sticky top-0 z-10">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold text-xs">Title</th>
              <th className="text-left px-4 py-2.5 font-semibold text-xs hidden sm:table-cell">Student</th>
              <th className="text-left px-4 py-2.5 font-semibold text-xs hidden md:table-cell">Subject</th>
              <th className="text-left px-4 py-2.5 font-semibold text-xs">Status</th>
              <th className="text-left px-4 py-2.5 font-semibold text-xs hidden lg:table-cell">Due Date</th>
              <th className="text-left px-4 py-2.5 font-semibold text-xs hidden lg:table-cell">Grade</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {items.map((hw) => {
              const meta = subjectMeta[hw.subject] || subjectMeta.GENERAL;
              return (
                <tr key={hw.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-md ${meta.gradient} flex items-center justify-center shrink-0`}>
                        <meta.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-xs truncate max-w-[140px]">{hw.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs hidden sm:table-cell">
                    <div>
                      <p className="font-medium">{hw.student?.name || '—'}</p>
                      <p className="text-[10px] text-muted-foreground">{hw.student?.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{meta.label}</td>
                  <td className="px-4 py-3">{statusBadge(hw.status)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(hw.dueDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium hidden lg:table-cell">
                    {hw.grade ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Star className="w-3 h-3" />
                        {hw.grade}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {hw.status === 'SUBMITTED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded-lg hover:bg-emerald-100 hover:text-emerald-700"
                          title="Grade"
                          onClick={() => openGradeDialog(hw)}
                        >
                          <Star className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {hw.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                          title="Mark Submitted"
                          disabled={actionLoading === hw.id}
                          onClick={() => handleMarkSubmitted(hw.id)}
                        >
                          {actionLoading === hw.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      )}
                      {hw.status === 'OVERDUE' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                          title="Mark Submitted"
                          disabled={actionLoading === hw.id}
                          onClick={() => handleMarkSubmitted(hw.id)}
                        >
                          {actionLoading === hw.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      )}
                      {hw.status === 'SUBMITTED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded-lg hover:bg-emerald-50 hover:text-emerald-700"
                          title="Mark Graded"
                          disabled={actionLoading === hw.id}
                          onClick={() => handleMarkGraded(hw.id)}
                        >
                          {actionLoading === hw.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                          ) : (
                            <ClipboardCheck className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded-lg hover:bg-gray-100"
                        title="View details"
                        onClick={() => openGradeDialog(hw)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ---- Render ----
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-emerald-600" />
            </div>
            Homework
            {homework.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs font-medium">
                {homework.length}
              </Badge>
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
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" />
                  Assign Homework
                </DialogTitle>
                <DialogDescription>Create a new homework assignment for a student.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1 block">Title</Label>
                  <Input
                    placeholder="e.g. Chapter 5 Practice Problems"
                    value={createForm.title}
                    onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1 block">Description</Label>
                  <Textarea
                    placeholder="Instructions or details..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                    className="rounded-xl min-h-[80px]"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1 block">Student Email</Label>
                  <Input
                    type="email"
                    placeholder="student@example.com"
                    value={createForm.studentEmail}
                    onChange={(e) => setCreateForm((p) => ({ ...p, studentEmail: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1 block">Subject</Label>
                  <Select value={createForm.subject} onValueChange={(v) => setCreateForm((p) => ({ ...p, subject: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(subjectMeta).map(([key, meta]) => (
                        <SelectItem key={key} value={key}>{meta.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1 block">Due Date</Label>
                  <Input
                    type="date"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm((p) => ({ ...p, dueDate: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Assign Homework
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {homework.length === 0 && myHomework.length === 0 && (!isAgency || agencyHomework.length === 0) ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-card-foreground">No homework assigned</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first homework assignment.</p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Assign Homework
            </Button>
          </div>
        ) : (
          <>
            {/* Tabs for agency view */}
            {isAgency && (
              <Tabs
                defaultValue="mine"
                className="w-full mb-4"
                onValueChange={() => {
                  setStatusFilter('ALL');
                }}
              >
                <TabsList className="w-full grid grid-cols-2 rounded-xl">
                  <TabsTrigger value="mine" className="rounded-lg text-xs font-medium">
                    My Homework
                  </TabsTrigger>
                  <TabsTrigger value="agency" className="rounded-lg text-xs font-medium">
                    Agency All
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="mine" className="mt-3">
                  <StatusFilterButtons statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
                  {renderTable(
                    (statusFilter === 'ALL' ? myHomework : myHomework.filter((h) => h.status === statusFilter))
                  )}
                </TabsContent>
                <TabsContent value="agency" className="mt-3">
                  <StatusFilterButtons statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
                  {renderTable(
                    (statusFilter === 'ALL' ? agencyHomework : agencyHomework.filter((h) => h.status === statusFilter))
                  )}
                </TabsContent>
              </Tabs>
            )}

            {/* Non-agency: simple filter + table */}
            {!isAgency && (
              <>
                <StatusFilterButtons statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
                {renderTable(filtered)}
              </>
            )}
          </>
        )}
      </CardContent>

      {/* Grade Dialog */}
      <Dialog open={gradeOpen} onOpenChange={setGradeOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-emerald-500" />
              {gradingItem?.status === 'SUBMITTED' ? 'Grade Homework' : 'Homework Details'}
            </DialogTitle>
            <DialogDescription>
              {gradingItem?.title} — {gradingItem?.student?.name || 'Unknown'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {gradingItem?.description && (
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{gradingItem.description}</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-1 block">Grade</Label>
              <Input
                placeholder="e.g. A, 95%, 8/10"
                value={gradeForm.grade}
                onChange={(e) => setGradeForm((p) => ({ ...p, grade: e.target.value }))}
                className="rounded-xl"
                disabled={gradingItem?.status === 'GRADED'}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-1 block">Feedback</Label>
              <Textarea
                placeholder="Your feedback for the student..."
                value={gradeForm.tutorFeedback}
                onChange={(e) => setGradeForm((p) => ({ ...p, tutorFeedback: e.target.value }))}
                className="rounded-xl min-h-[100px]"
                disabled={gradingItem?.status === 'GRADED'}
              />
            </div>
            {gradingItem?.status !== 'GRADED' && (
              <Button
                onClick={handleGrade}
                disabled={grading}
                className="w-full rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm gap-2"
              >
                {grading && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Grade
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ------------------------------------------------------------------
// Status Filter Buttons (extracted for reuse in tabs)
// ------------------------------------------------------------------
function StatusFilterButtons({ statusFilter, setStatusFilter }: { statusFilter: string; setStatusFilter: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      {STATUS_OPTIONS.map((s) => (
        <Button
          key={s}
          variant={statusFilter === s ? 'default' : 'outline'}
          size="sm"
          className={`rounded-lg text-xs h-7 px-2.5 ${statusFilter === s ? 'gradient-primary border-0 text-white' : ''}`}
          onClick={() => setStatusFilter(s)}
        >
          {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
        </Button>
      ))}
    </div>
  );
}
