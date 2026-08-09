// ============================================================
// StudentProgressPanel — Detailed student progress view
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { subjectMeta } from '@/lib/subject-meta';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  GraduationCap,
  Star,
  ClipboardList,
  Clock,
  Mail,
  Calendar,
  StickyNote,
  User,
  Activity,
  CheckCircle,
  BookOpen,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface LessonRecord {
  id: string;
  subject: string;
  date: string;
  durationMinutes: number;
  tutorName: string;
}

interface HomeworkRecord {
  id: string;
  title: string;
  subject: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'OVERDUE';
  grade: string | null;
  feedback: string | null;
  dueDate: string | null;
}

interface NoteRecord {
  id: string;
  content: string;
  tutorName: string | null;
  subject: string;
  createdAt: string;
  rating: number;
}

interface RecentActivity {
  id: string;
  type: 'lesson' | 'homework' | 'note';
  description: string;
  date: string;
  subject?: string;
}

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  grade: string | null;
  isActive: boolean;
  enrolledSince: string;
}

interface OverviewStats {
  totalLessons: number;
  avgRating: number;
  homeworkCompletionRate: number;
  lastActive: string | null;
}

// Raw API response from /api/student/[studentId]/progress
interface ProgressApiResponse {
  student: StudentInfo;
  lessons: {
    totalAttended: number;
    totalHours: number;
    subjectBreakdown: Record<string, { count: number; minutes: number }>;
    recentLessons: Array<{
      roomId: string;
      subject: string;
      durationMinutes: number;
      date: string;
      tutorName: string;
    }>;
  };
  homework: {
    total: number;
    pending: number;
    submitted: number;
    graded: number;
    overdue: number;
    completionRate: number;
    recent: Array<{
      id: string;
      title: string;
      subject: string;
      dueDate: string | null;
      status: string;
      grade: string | null;
      tutorFeedback: string | null;
      createdAt: string;
    }>;
  };
  notes: {
    totalWritten: number;
    averageRating: number | null;
    recent: Array<{
      id: string;
      content: string;
      tutorFeedback: string | null;
      topicsForNext: string | null;
      rating: number | null;
      subject: string | null;
      date: string;
      tutorName: string | null;
    }>;
  };
  lastActive?: string | null;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

function homeworkStatusBadge(status: string) {
  const map: Record<string, { cls: string; label: string }> = {
    PENDING: { cls: 'bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 rounded-full font-medium', label: 'Pending' },
    SUBMITTED: { cls: 'bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0 rounded-full font-medium', label: 'Submitted' },
    GRADED: { cls: 'bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 rounded-full font-medium', label: 'Graded' },
    OVERDUE: { cls: 'bg-red-100 text-red-600 text-[10px] px-1.5 py-0 rounded-full font-medium', label: 'Overdue' },
  };
  const entry = map[status] || map.PENDING;
  return <Badge className={entry.cls}>{entry.label}</Badge>;
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
type Props = {
  studentId: string;
  studentName: string;
  onBack: () => void;
};

export function StudentProgressPanel({ studentId, studentName, onBack }: Props) {
  const [raw, setRaw] = useState<ProgressApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- Fetch ----
  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/student/${studentId}/progress`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setRaw(json);
    } catch {
      toast({ title: 'Failed to load student progress', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // ---- Derived data ----
  const student = raw?.student ?? null;
  const overview: OverviewStats = raw
    ? {
        totalLessons: raw.lessons.totalAttended,
        avgRating: raw.notes.averageRating ?? 0,
        homeworkCompletionRate: raw.homework.completionRate,
        lastActive: raw.lastActive ?? null,
      }
    : { totalLessons: 0, avgRating: 0, homeworkCompletionRate: 0, lastActive: null };

  const lessons: LessonRecord[] = (raw?.lessons.recentLessons ?? []).map((l) => ({
    id: l.roomId,
    subject: l.subject,
    date: l.date,
    durationMinutes: l.durationMinutes,
    tutorName: l.tutorName,
  }));

  const homework: HomeworkRecord[] = (raw?.homework.recent ?? []).map((h) => ({
    id: h.id,
    title: h.title,
    subject: h.subject,
    status: h.status as HomeworkRecord['status'],
    grade: h.grade,
    feedback: h.tutorFeedback,
    dueDate: h.dueDate,
  }));

  const notes: NoteRecord[] = (raw?.notes.recent ?? []).map((n) => ({
    id: n.id,
    content: n.content,
    tutorName: n.tutorName,
    subject: n.subject ?? 'GENERAL',
    createdAt: n.date,
    rating: n.rating ?? 0,
  }));

  // Build recent activity feed
  const recentActivity: RecentActivity[] = [
    ...lessons.slice(0, 5).map((l) => ({
      id: `lesson-${l.id}`,
      type: 'lesson' as const,
      description: `${subjectMeta[l.subject]?.label ?? l.subject} lesson with ${l.tutorName}`,
      date: l.date,
      subject: l.subject,
    })),
    ...homework.filter((h) => h.status === 'GRADED').slice(0, 3).map((h) => ({
      id: `hw-${h.id}`,
      type: 'homework' as const,
      description: `Homework "${h.title}" graded${h.grade ? ` — ${h.grade}` : ''}`,
      date: h.dueDate ?? '',
      subject: h.subject,
    })),
    ...notes.slice(0, 3).map((n) => ({
      id: `note-${n.id}`,
      type: 'note' as const,
      description: `Lesson note added for ${subjectMeta[n.subject]?.label ?? n.subject}`,
      date: n.createdAt,
      subject: n.subject,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  // ---- Loading ----
  if (loading || !raw) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl text-muted-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Students
        </Button>
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-muted-foreground">Loading progress...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- Stat cards ----
  const statCards = [
    { label: 'Total Lessons', value: overview.totalLessons, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg Rating', value: overview.avgRating > 0 ? overview.avgRating.toFixed(1) : '—', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Homework %', value: `${overview.homeworkCompletionRate}%`, icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Last Active', value: overview.lastActive ? formatRelative(overview.lastActive) : 'Never', icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  // Activity icon by type
  const activityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'lesson': return <GraduationCap className="w-3.5 h-3.5 text-blue-500" />;
      case 'homework': return <ClipboardList className="w-3.5 h-3.5 text-amber-500" />;
      case 'note': return <StickyNote className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  // ---- Render ----
  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="rounded-xl text-muted-foreground hover:text-gray-900"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to Students
      </Button>

      {/* Student Header */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <User className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">{studentName}</h2>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {student?.email && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {student.email}
                  </span>
                )}
                {student?.grade && (
                  <Badge variant="secondary" className="text-[10px] rounded-full">Grade {student.grade}</Badge>
                )}
                <Badge className={student?.isActive
                  ? 'bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 rounded-full font-medium'
                  : 'bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0 rounded-full font-medium'
                }>
                  {student?.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="rounded-xl border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</span>
              </div>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Homework Completion Progress Bar */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-emerald-500" />
              Homework Completion
            </span>
            <span className="text-sm font-bold text-emerald-600">{overview.homeworkCompletionRate}%</span>
          </div>
          <Progress value={overview.homeworkCompletionRate} className="h-2.5" />
        </CardContent>
      </Card>

      {/* Detail Tabs */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-4 rounded-xl mb-4">
              <TabsTrigger value="overview" className="rounded-lg text-xs font-medium">Overview</TabsTrigger>
              <TabsTrigger value="lessons" className="rounded-lg text-xs font-medium">Lessons</TabsTrigger>
              <TabsTrigger value="homework" className="rounded-lg text-xs font-medium">Homework</TabsTrigger>
              <TabsTrigger value="notes" className="rounded-lg text-xs font-medium">Notes</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="space-y-4">
                {/* Quick Stats Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-blue-50/50 border border-blue-100/60">
                    <p className="text-xl font-bold text-blue-600">{overview.totalLessons}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Lessons</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-amber-50/50 border border-amber-100/60">
                    <p className="text-xl font-bold text-amber-600">{overview.avgRating > 0 ? overview.avgRating.toFixed(1) : '—'}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Avg Rating</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/60">
                    <p className="text-xl font-bold text-emerald-600">{overview.homeworkCompletionRate}%</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Homework</p>
                  </div>
                </div>

                {/* Subject Breakdown */}
                {raw.lessons.subjectBreakdown && Object.keys(raw.lessons.subjectBreakdown).length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                      Subjects Covered
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(raw.lessons.subjectBreakdown).map(([subj, data]) => {
                        const meta = subjectMeta[subj] || subjectMeta.GENERAL;
                        return (
                          <div key={subj} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                            <div className={`w-5 h-5 rounded ${meta.gradient} flex items-center justify-center`}>
                              <meta.icon className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-xs font-medium text-gray-700">{meta.label}</span>
                            <span className="text-[10px] text-muted-foreground">{data.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-gray-400" />
                    Recent Activity
                  </h4>
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-6">
                      <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No recent activity.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {recentActivity.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            {activityIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">{item.description}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">{formatRelative(item.date)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Lessons Tab */}
            <TabsContent value="lessons">
              {lessons.length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No lessons attended yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {lessons.map((lesson) => {
                    const meta = subjectMeta[lesson.subject] || subjectMeta.GENERAL;
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/30 transition-all"
                      >
                        <div className={`w-8 h-8 rounded-lg ${meta.gradient} flex items-center justify-center shrink-0`}>
                          <meta.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{meta.label} Lesson</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                            <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{formatDateTime(lesson.date)}</span>
                            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{lesson.durationMinutes} min</span>
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground hidden sm:block">{lesson.tutorName}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Homework Tab */}
            <TabsContent value="homework">
              {homework.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No homework assigned yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide pb-2 pr-3">Title</th>
                        <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide pb-2 pr-3">Status</th>
                        <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide pb-2 pr-3">Grade</th>
                        <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide pb-2 hidden sm:table-cell">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="max-h-96 overflow-y-auto">
                      {homework.map((hw) => (
                        <tr key={hw.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                          <td className="py-2.5 pr-3">
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate max-w-[160px]">{hw.title}</p>
                              {hw.feedback && (
                                <p className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[160px]" title={hw.feedback}>{hw.feedback}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 pr-3">{homeworkStatusBadge(hw.status)}</td>
                          <td className="py-2.5 pr-3">
                            {hw.grade ? (
                              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                                <Star className="w-3 h-3" />{hw.grade}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2.5 hidden sm:table-cell">
                            <span className="text-[11px] text-muted-foreground">
                              {hw.dueDate ? formatDate(hw.dueDate) : '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes">
              {notes.length === 0 ? (
                <div className="text-center py-8">
                  <StickyNote className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No lesson notes yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {notes.map((note) => {
                    const meta = subjectMeta[note.subject] || subjectMeta.GENERAL;
                    return (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl border border-gray-100 bg-gray-50/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-md ${meta.gradient} flex items-center justify-center`}>
                              <meta.icon className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-xs font-medium text-gray-700">{meta.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">{formatDateTime(note.createdAt)}</span>
                            {note.rating > 0 && (
                              <span className="flex items-center gap-0.5 text-amber-500">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-[10px] font-medium">{note.rating}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{note.content}</p>
                        {note.tutorName && (
                          <p className="text-[10px] text-muted-foreground mt-2">— {note.tutorName}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
