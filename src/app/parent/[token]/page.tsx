// ============================================================
// Parent Portal Page — No login required, uses parentAccessToken
// ============================================================
// Standalone page: no sidebar, no dashboard chrome.
// Agency branding header, student name, 4 tabs.
// Footer: "Powered by SuperBoard"
// ============================================================
'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  GraduationCap,
  ClipboardList,
  StickyNote,
  Clock,
  Star,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Loader2,
  User,
  Shield,
} from 'lucide-react';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface ParentData {
  studentName: string;
  studentEmail: string;
  agencyName: string;
  agencyLogo: string | null;
  schedule: ScheduleItem[];
  progress: {
    totalLessons: number;
    subjects: string[];
    lastActive: string | null;
  };
  homework: HomeworkItem[];
  notes: NoteItem[];
}

interface ScheduleItem {
  id: string;
  title: string;
  subject: string;
  scheduledAt: string;
  durationMinutes: number;
  tutorName: string;
}

interface HomeworkItem {
  id: string;
  title: string;
  subject: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'OVERDUE';
  grade: string | null;
  feedback: string | null;
  dueDate: string | null;
}

interface NoteItem {
  id: string;
  content: string;
  tutorName: string | null;
  subject: string;
  createdAt: string;
  rating: number;
}

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function homeworkBadge(status: HomeworkItem['status']) {
  const map: Record<HomeworkItem['status'], { cls: string; label: string }> = {
    PENDING: { cls: 'bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 rounded-full font-medium', label: 'Pending' },
    SUBMITTED: { cls: 'bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0 rounded-full font-medium', label: 'Submitted' },
    GRADED: { cls: 'bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 rounded-full font-medium', label: 'Graded' },
    OVERDUE: { cls: 'bg-red-100 text-red-600 text-[10px] px-1.5 py-0 rounded-full font-medium', label: 'Overdue' },
  };
  const { cls, label } = map[status];
  return <Badge className={cls}>{label}</Badge>;
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function ParentPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const [data, setData] = useState<ParentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    params.then((p) => {
      fetchParentData(p.token);
    });
  }, [params]);

  const fetchParentData = async (t: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/parent/${t}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          setError('This link is invalid or has expired.');
        } else {
          setError('Failed to load data. Please try again later.');
        }
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // ---- Loading ----
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col" aria-live="polite" aria-label="Loading portal...">
        <header className="bg-white border-b">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading portal...</p>
          </div>
        </main>
      </div>
    );
  }

  // ---- Error ----
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-500" />
              <span className="font-bold text-gray-900">Parent Portal</span>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm mx-auto px-4" role="alert">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Unable to Load</h2>
            <p className="text-sm text-muted-foreground">{error || 'This link is invalid or has expired.'}</p>
          </div>
        </main>
        <footer className="border-t bg-white mt-auto">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <p className="text-center text-[11px] text-muted-foreground">
              Powered by <span className="font-semibold text-emerald-600">SuperBoard</span>
            </p>
          </div>
        </footer>
      </div>
    );
  }

  const pendingHomework = data.homework.filter((h) => h.status === 'PENDING' || h.status === 'OVERDUE');
  const gradedHomework = data.homework.filter((h) => h.status === 'GRADED');

  // ---- Render ----
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header — Agency Branding */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {data.agencyLogo && !logoError ? (
                <img
                  src={data.agencyLogo}
                  alt={data.agencyName}
                  className="w-8 h-8 rounded-lg object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-600" />
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900 text-sm">{data.agencyName}</p>
                <p className="text-[11px] text-muted-foreground">Parent Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center" aria-label={data.studentName}>
                <User className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{data.studentName}</p>
                <p className="text-[11px] text-muted-foreground">{data.studentEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="w-full grid grid-cols-4 rounded-xl mb-6">
            <TabsTrigger value="schedule" className="rounded-lg text-xs font-medium">Schedule</TabsTrigger>
            <TabsTrigger value="progress" className="rounded-lg text-xs font-medium">Progress</TabsTrigger>
            <TabsTrigger value="homework" className="rounded-lg text-xs font-medium relative">
              Homework
              {pendingHomework.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingHomework.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-lg text-xs font-medium">Notes</TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  Upcoming Lessons
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.schedule.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming lessons scheduled.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.schedule.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/30 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                              <Calendar className="w-3 h-3" />
                              {formatDateTime(lesson.scheduledAt)}
                            </span>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {lesson.durationMinutes} min
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Tutor: {lesson.tutorName}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0 rounded-full font-medium shrink-0">
                          {lesson.subject}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="rounded-xl border border-gray-100 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Total Lessons</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{data.progress.totalLessons}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border border-gray-100 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Subjects Covered</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{data.progress.subjects.length}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{data.progress.subjects.join(', ') || '—'}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border border-gray-100 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Last Lesson</span>
                    </div>
                    <p className="text-sm font-bold text-amber-600 mt-1">{data.progress.lastActive ? formatDate(data.progress.lastActive) : '—'}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Homework Tab */}
          <TabsContent value="homework">
            <div className="space-y-4">
              {/* Pending */}
              <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-amber-500" />
                    Pending Homework
                    {pendingHomework.length > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 rounded-full font-medium">
                        {pendingHomework.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingHomework.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">All caught up! No pending homework.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingHomework.map((hw) => (
                        <div
                          key={hw.id}
                          className="p-3 rounded-xl border border-gray-100 bg-gray-50/50"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{hw.title}</span>
                            {homeworkBadge(hw.status)}
                          </div>
                          <p className="text-[11px] text-muted-foreground">Due: {hw.dueDate ? formatDate(hw.dueDate) : 'No date'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Graded */}
              <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Star className="w-4 h-4 text-emerald-500" />
                    Graded Homework
                    {gradedHomework.length > 0 && (
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 rounded-full font-medium">
                        {gradedHomework.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {gradedHomework.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">No graded homework yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {gradedHomework.map((hw) => (
                        <div
                          key={hw.id}
                          className="p-3 rounded-xl border border-gray-100 bg-gray-50/50"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{hw.title}</span>
                            {hw.grade && (
                              <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 rounded-full font-medium">
                                <Star className="w-2.5 h-2.5 mr-0.5" />
                                {hw.grade}
                              </Badge>
                            )}
                          </div>
                          {hw.feedback && (
                            <p className="text-xs text-gray-500 mt-1 bg-white rounded-lg p-2 border border-gray-100">
                              {hw.feedback}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-emerald-500" />
                  Recent Lesson Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.notes.length === 0 ? (
                  <div className="text-center py-8">
                    <StickyNote className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No lesson notes yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-4 rounded-xl border border-gray-100 bg-gray-50/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 rounded-full font-medium">
                              {note.subject}
                            </Badge>
                            {note.rating > 0 && (
                              <span className="flex items-center gap-0.5 text-amber-500">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-[10px] font-medium">{note.rating}</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{formatDateTime(note.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
                        {note.tutorName && (
                          <p className="text-[10px] text-muted-foreground mt-2">
                            — {note.tutorName}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <p className="text-center text-[11px] text-muted-foreground">
            Powered by <span className="font-semibold text-emerald-600">SuperBoard</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
