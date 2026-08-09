// ============================================================
// Analytics Panel — Tutor Analytics Dashboard
// ============================================================
'use client';

import React, { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { subjectMeta } from '@/lib/subject-meta';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { BookOpen, Users, Clock, TrendingUp } from 'lucide-react';

interface AnalyticsData {
  totalRooms: number;
  totalStudents: number;
  totalMinutes: number;
  subjects: Record<string, number>;
  weeklyActivity: { date: string; rooms: number; minutes: number; students: number }[];
  monthlyTrend: { month: string; rooms: number; minutes: number }[];
  recentRooms: {
    id: string;
    subject: string;
    isActive: boolean;
    createdAt: string;
    durationMinutes: number;
    participants: number;
  }[];
}

const subjectColors: Record<string, string> = {
  MATH: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  SCIENCE: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  LANGUAGE: 'bg-sky-100 text-sky-700 border-sky-200',
  GENERAL: 'bg-lime-100 text-lime-700 border-lime-200',
};

export function AnalyticsPanel({ userId }: { userId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    authFetch('/api/analytics')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  // Loading state
  if (loading) {
    return (
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!data || data.totalRooms === 0) {
    return (
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Your teaching activity at a glance.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-muted-foreground font-medium">No data yet</p>
          <p className="text-sm text-muted-foreground mt-1">Start a lesson to see your analytics.</p>
        </CardContent>
      </Card>
    );
  }

  const totalHours = Math.round((data.totalMinutes / 60) * 10) / 10;
  const avgDuration = data.totalRooms > 0 ? Math.round(data.totalMinutes / data.totalRooms) : 0;

  // Format weekly date for display
  const weeklyDisplay = data.weeklyActivity.map((d) => ({
    ...d,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="space-y-4">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="rounded-2xl border-0 shadow-sm card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl stat-gradient-sparkles flex items-center justify-center shadow-sm">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Lessons</p>
                <p className="text-xl font-bold text-foreground">{data.totalRooms}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl stat-gradient-video flex items-center justify-center shadow-sm">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Students</p>
                <p className="text-xl font-bold text-foreground">{data.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl stat-gradient-recordings flex items-center justify-center shadow-sm">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Hours</p>
                <p className="text-xl font-bold text-foreground">{totalHours}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Avg Duration</p>
                <p className="text-xl font-bold text-foreground">{avgDuration}<span className="text-sm font-normal text-muted-foreground"> min</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart — Weekly */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly Activity</CardTitle>
          <CardDescription>Lessons created over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyDisplay} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Line type="monotone" dataKey="rooms" stroke="#059669" strokeWidth={2.5} dot={{ fill: '#059669', r: 4 }} activeDot={{ r: 6 }} name="Lessons" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bottom row: Subject Distribution + Monthly Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subject Distribution */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subject Distribution</CardTitle>
            <CardDescription>Breakdown by subject area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.subjects).map(([subject, count]) => {
                const meta = subjectMeta[subject] || subjectMeta.GENERAL;
                const colorClass = subjectColors[subject] || subjectColors.GENERAL;
                return (
                  <div key={subject} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${colorClass}`}>
                    <meta.icon className="w-3.5 h-3.5" />
                    <span>{meta.label}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Trend</CardTitle>
            <CardDescription>Lesson volume over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.monthlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                />
                <Bar dataKey="rooms" fill="#059669" radius={[6, 6, 0, 0]} name="Lessons" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Lessons */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Lessons</CardTitle>
          <CardDescription>Your last 5 sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recentRooms.map((room) => {
              const meta = subjectMeta[room.subject] || subjectMeta.GENERAL;
              return (
                <div key={room.id} className="flex items-center justify-between rounded-xl border border-emerald-100/40 px-4 py-3 hover:bg-emerald-50/40 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${meta.gradient} flex items-center justify-center shadow-sm`}>
                      <meta.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(room.createdAt).toLocaleDateString()} &middot; {room.durationMinutes} min &middot; {room.participants} student{room.participants !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant={room.isActive ? 'default' : 'secondary'} className="text-xs rounded-full">
                    {room.isActive ? 'Active' : 'Ended'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
