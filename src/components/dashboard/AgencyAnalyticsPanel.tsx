// ============================================================
// AgencyAnalyticsPanel — Enhanced analytics for agencies
// Works with the real /api/agency/analytics endpoint
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  CheckCircle,
  Users,
  GraduationCap,
  Clock,
  DollarSign,
  Star,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  BookOpen,
} from 'lucide-react';
import type { Tier } from '@/types';
import { useToast } from '@/hooks/use-toast';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface AgencyOverview {
  totalStudents: number;
  activeStudents: number;
  totalTutors: number;
  totalLessons: number;
  totalLessonHours: number;
  averageRating: number | null;
  lessonNotesWritten: number;
}

interface TutorPerf {
  tutorId: string;
  name: string;
  email: string;
  lessonsCompleted: number;
  lessonHours: number;
  scheduledCompleted: number;
  scheduledHours: number;
}

interface HomeworkStats {
  pending: number;
  submitted: number;
  graded: number;
  overdue: number;
}

interface RevenueInfo {
  totalCents: number;
  paidCents: number;
  outstandingCents: number;
  totalInvoices: number;
}

interface AnalyticsData {
  period: { from: string; to: string };
  overview: AgencyOverview;
  subjectBreakdown: Record<string, { count: number; hours: number }>;
  tutorPerformance: TutorPerf[];
  homework: HomeworkStats;
  revenue: RevenueInfo;
}

interface StudentRow {
  id: string;
  name: string;
  email: string;
  lessonsAttended?: number;
}

interface OverdueHWStudent {
  studentId: string;
  studentName: string;
  overdueCount: number;
}

const PERIODS = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'Last 3 Months' },
] as const;

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

function getDateRange(period: string) {
  const now = new Date();
  if (isNaN(now.getTime())) return { from: '', to: '' };

  let from: Date;

  if (period === 'week') {
    const dayOfWeek = now.getDay() || 7;
    from = new Date(now);
    from.setDate(now.getDate() - dayOfWeek + 1);
    from.setHours(0, 0, 0, 0);
  } else if (period === 'quarter') {
    from = new Date(now);
    from.setMonth(now.getMonth() - 3);
    from.setHours(0, 0, 0, 0);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (isNaN(from.getTime())) return { from: '', to: '' };

  return {
    from: from.toISOString(),
    to: now.toISOString(),
  };
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
// Inline to avoid importing from @/lib/usage (which pulls in Prisma, server-only)
function getEstimatedAgencyCost(totalHours: number, tier: string): number {
  const rate = tier === 'AGENCY_PREMIUM' ? 2 : 3;
  return totalHours * rate;
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
type Props = { userId: string; userTier?: Tier };

export function AgencyAnalyticsPanel({ userId, userTier }: Props) {
  const { toast } = useToast();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('month');

  // Supplemental data for student engagement
  const [topStudents, setTopStudents] = useState<StudentRow[]>([]);
  const [overdueStudents, setOverdueStudents] = useState<OverdueHWStudent[]>([]);

  // ---- Fetch analytics ----
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const { from, to } = getDateRange(period);
      if (!from || !to || isNaN(new Date(from).getTime()) || isNaN(new Date(to).getTime())) {
        throw new Error('Invalid date range. Please try a different period.');
      }
      const params = new URLSearchParams({ from, to });
      const res = await authFetch(`/api/agency/analytics?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch {
      toast({ title: 'Failed to load analytics', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [period, toast]);

  // ---- Fetch student engagement data ----
  const fetchStudentData = useCallback(async () => {
    try {
      // Fetch students sorted by lessons
      const studentsRes = await authFetch('/api/agency/students?limit=100&sort=lessons');
      if (studentsRes.ok) {
        const sData = await studentsRes.json();
        const allStudents: StudentRow[] = (sData.students || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          lessonsAttended: s.lessonsAttended || 0,
        }));
        // Top 5 by lesson count
        const sorted = [...allStudents].sort((a, b) => (b.lessonsAttended || 0) - (a.lessonsAttended || 0));
        setTopStudents(sorted.slice(0, 5));
      }

      // Fetch overdue homework for student list
      const hwRes = await authFetch('/api/homework?status=OVERDUE&limit=100');
      if (hwRes.ok) {
        const hwData = await hwRes.json();
        const homeworks = hwData.homeworks || [];
        const studentMap: Record<string, { name: string; count: number }> = {};
        for (const hw of homeworks) {
          const sid = hw.student?.id;
          if (!sid) continue;
          if (!studentMap[sid]) studentMap[sid] = { name: hw.student?.name || 'Unknown', count: 0 };
          studentMap[sid].count += 1;
        }
        setOverdueStudents(
          Object.entries(studentMap)
            .map(([studentId, info]) => ({ studentId, studentName: info.name, overdueCount: info.count }))
            .sort((a, b) => b.overdueCount - a.overdueCount)
        );
      }
    } catch (err: any) {
      console.warn('[AgencyAnalytics] Failed to load student data:', err);
      toast({ title: 'Could not load student data', description: err?.message || 'Student engagement data is unavailable.', variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    fetchAnalytics();
    fetchStudentData();
  }, [fetchAnalytics, fetchStudentData]);

  // ---- Loading ----
  if (loading || !data) {
    return (
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            Agency Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-muted/50 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
                <div className="h-6 bg-gray-200 rounded w-12" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---- Stats ----
  const statCards = [
    { label: 'Total Tutors', value: formatNumber(data.overview.totalTutors), icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Students', value: formatNumber(data.overview.totalStudents), icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Lessons This Month', value: formatNumber(data.overview.totalLessons), icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Hours', value: formatNumber(Math.round(data.overview.totalLessonHours)), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Monthly Revenue', value: formatCurrency(data.revenue.totalCents), icon: DollarSign, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  // ---- Subject breakdown chart data ----
  const subjectEntries = Object.entries(data.subjectBreakdown || {});
  const maxSubjectCount = Math.max(...subjectEntries.map(([, v]) => v.count), 1);

  // ---- Homework stats ----
  const hwStats = data.homework;

  // ---- Render ----
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-rose-600" />
            </div>
            Agency Analytics
          </CardTitle>

          {/* Period selector as button group */}
          <div className="flex items-center bg-muted/50 rounded-xl p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === p.value
                    ? 'gradient-primary border-0 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/80'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Usage Alert Banner */}
        {(() => {
          const totalHours = data.overview.totalLessonHours;
          if (totalHours > 40) {
            const est = getEstimatedAgencyCost(totalHours, userTier || 'AGENCY_STANDARD');
            return (
              <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 mb-6">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">High usage: {totalHours} hours this month (~${est} estimated)</p>
                  <p className="text-xs text-red-700 mt-1">Your next invoice will include these hours.</p>
                </div>
              </div>
            );
          }
          if (totalHours > 20) {
            const est = getEstimatedAgencyCost(totalHours, userTier || 'AGENCY_STANDARD');
            return (
              <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">You&apos;ve used {totalHours} hours this month (~${est} estimated). Consider buying prepaid hours to manage costs.</p>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Agency Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {statCards.map((stat) => (
            <div key={stat.label} className={`rounded-xl p-4 ${stat.bg}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</span>
              </div>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="tutors" className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-xl mb-4">
            <TabsTrigger value="tutors" className="rounded-lg text-xs font-medium">Tutor Performance</TabsTrigger>
            <TabsTrigger value="students" className="rounded-lg text-xs font-medium">Student Engagement</TabsTrigger>
            <TabsTrigger value="trends" className="rounded-lg text-xs font-medium">Trends</TabsTrigger>
          </TabsList>

          {/* Tutor Performance */}
          <TabsContent value="tutors">
            {data.tutorPerformance.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No tutor data available.</p>
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold text-xs">Name</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-xs">Lessons</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-xs hidden sm:table-cell">Hours</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-xs hidden md:table-cell">Avg Rating</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-xs hidden lg:table-cell">Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tutorPerformance.map((t) => (
                      <tr key={t.tutorId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-xs">{t.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{t.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-medium">{t.lessonsCompleted}</td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden sm:table-cell">{t.lessonHours}</td>
                        <td className="px-4 py-3 text-right text-xs hidden md:table-cell">
                          <span className="flex items-center gap-1 justify-end">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            {data.overview.averageRating?.toFixed(1) || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden lg:table-cell">
                          {Math.round(data.overview.totalStudents / Math.max(data.overview.totalTutors, 1))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Student Engagement */}
          <TabsContent value="students">
            <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
              {/* Top Students */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Top Students by Lessons
                </h4>
                {topStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {topStudents.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.name}</p>
                          <p className="text-[11px] text-muted-foreground">{s.email}</p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 rounded-full font-medium">
                          {s.lessonsAttended || 0} lessons
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Overdue Homework */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Students with Overdue Homework
                </h4>
                {overdueStudents.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                    <p className="text-sm text-muted-foreground">All caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {overdueStudents.map((s) => (
                      <div key={s.studentId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-50/50 transition-colors">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.studentName}</p>
                        </div>
                        <Badge className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0 rounded-full font-medium">
                          {s.overdueCount} overdue
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Monthly Trends - CSS Bar Charts */}
          <TabsContent value="trends">
            <div className="space-y-6">
              {/* Subject Breakdown Bar Chart */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Lessons by Subject
                </h4>
                {subjectEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No subject data available.</p>
                  </div>
                ) : (
                  <div className="flex items-end gap-3 h-40">
                    {subjectEntries.map(([subject, info]) => {
                      const height = (info.count / maxSubjectCount) * 100;
                      const colors: Record<string, string> = {
                        MATH: 'from-emerald-500 to-emerald-400',
                        SCIENCE: 'from-blue-500 to-blue-400',
                        LANGUAGE: 'from-amber-500 to-amber-400',
                        GENERAL: 'from-gray-400 to-gray-300',
                      };
                      return (
                        <div key={subject} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] font-medium text-gray-600">{info.count}</span>
                          <div
                            className={`w-full rounded-t-md bg-gradient-to-t ${colors[subject] || colors.GENERAL} transition-all duration-500 min-h-[4px]`}
                            style={{ height: `${Math.max(height, 3)}%` }}
                          />
                          <span className="text-[9px] text-muted-foreground text-center leading-tight font-medium">{subject}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Homework Status Bar Chart */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Homework Status Breakdown
                </h4>
                {(() => {
                  const hwEntries = [
                    { label: 'Pending', value: hwStats.pending, color: 'bg-amber-400' },
                    { label: 'Submitted', value: hwStats.submitted, color: 'bg-blue-400' },
                    { label: 'Graded', value: hwStats.graded, color: 'bg-emerald-400' },
                    { label: 'Overdue', value: hwStats.overdue, color: 'bg-red-400' },
                  ];
                  const maxHw = Math.max(...hwEntries.map((e) => e.value), 1);
                  const total = hwEntries.reduce((s, e) => s + e.value, 0);
                  if (total === 0) {
                    return (
                      <div className="text-center py-8">
                        <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No homework data available.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-end gap-3 h-40">
                      {hwEntries.map((entry) => {
                        const height = (entry.value / maxHw) * 100;
                        return (
                          <div key={entry.label} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-medium text-gray-600">{entry.value}</span>
                            <div
                              className={`w-full rounded-t-md ${entry.color} transition-all duration-500 min-h-[4px]`}
                              style={{ height: `${Math.max(height, 3)}%` }}
                            />\n                            <span className="text-[9px] text-muted-foreground text-center leading-tight font-medium">{entry.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Revenue summary row */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  Revenue Summary
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-emerald-50 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Invoiced</p>
                    <p className="text-base font-bold text-emerald-600 mt-1">{formatCurrency(data.revenue.totalCents)}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Paid</p>
                    <p className="text-base font-bold text-blue-600 mt-1">{formatCurrency(data.revenue.paidCents)}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Outstanding</p>
                    <p className="text-base font-bold text-amber-600 mt-1">{formatCurrency(data.revenue.outstandingCents)}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
