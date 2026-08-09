// ============================================================
// StudentDashboard — Dedicated student learning experience
// ============================================================
// A lightweight, student-friendly dashboard that shows:
//   1. Personalized greeting
//   2. Quick join input (paste room URL or room code)
//   3. Recent lessons history (with graceful empty state)
//   4. Getting started guide (shown when no lessons exist)
//
// Students may be:
//   - Logged-in Supabase users who are participants (not tutors)
//   - Anonymous visitors identified by fingerprint / session name
//
// Design: Clean, minimal, mobile-first. Emerald/teal green accents.
// ============================================================
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/auth-fetch';
import { subjectMeta } from '@/lib/subject-meta';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GraduationCap,
  Link2,
  ClipboardPaste,
  Rocket,
  BookOpen,
  ExternalLink,
  Clock,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  BookX,
} from 'lucide-react';

// ============================================================
// Props
// ============================================================
interface StudentDashboardProps {
  userId: string;
  userName: string | null;
  userEmail: string | null;
}

// ============================================================
// Types for room history response
// ============================================================
interface RecentLesson {
  id: string;
  subject: string;
  isActive: boolean;
  createdAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  /** Tutor's display name, if available */
  tutorName?: string | null;
  /** Branding color of the room */
  brandingColor?: string | null;
}

// ============================================================
// Helpers
// ============================================================

/**
 * Extract a room ID from user input.
 * Accepts:
 *   - A bare room ID (e.g. "abc123")
 *   - A full URL (e.g. "https://superboard.live/room/abc123")
 *   - A relative path (e.g. "/room/abc123")
 * Returns the extracted ID, or null if nothing valid was found.
 */
function extractRoomId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Full URL match — extract the path segment after /room/
  const urlMatch = trimmed.match(/\/room\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];

  // If it looks like a room ID on its own (alphanumeric, 6+ chars)
  if (/^[a-zA-Z0-9_-]{6,}$/.test(trimmed)) return trimmed;

  return null;
}

/**
 * Format a date string into a human-friendly relative format.
 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();

  if (d.toDateString() === now.toDateString()) {
    return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format duration in minutes to a human-readable string.
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

// ============================================================
// Component
// ============================================================
export default function StudentDashboard({
  userId,
  userName,
  userEmail,
}: StudentDashboardProps) {
  const router = useRouter();
  const { toast } = useToast();

  // ---- Quick join state ----
  const [joinInput, setJoinInput] = useState('');
  const [joining, setJoining] = useState(false);

  // ---- Recent lessons state ----
  const [lessons, setLessons] = useState<RecentLesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [lessonsError, setLessonsError] = useState<string | null>(null);

  // ============================================================
  // Fetch recent lessons
  // ============================================================
  const fetchLessons = useCallback(async () => {
    try {
      setLessonsLoading(true);
      setLessonsError(null);

      // Attempt to fetch participant history. This endpoint may not
      // exist yet — we handle failures gracefully with an empty state.
      const res = await authFetch(
        `/api/room/participants/history?userId=${encodeURIComponent(userId)}`,
      );

      if (!res.ok) {
        // Endpoint likely doesn't exist yet or returned an error.
        // Silently show empty state rather than an error.
        if (res.status !== 404) {
          console.warn(
            '[StudentDashboard] Failed to fetch lesson history:',
            res.status,
          );
        }
        setLessons([]);
        return;
      }

      const data = await res.json();
      setLessons(Array.isArray(data.lessons) ? data.lessons : []);
    } catch (err) {
      console.warn('[StudentDashboard] Lesson history fetch error:', err);
      setLessons([]);
    } finally {
      setLessonsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // ============================================================
  // Join lesson handler
  // ============================================================
  const handleJoinLesson = useCallback(async () => {
    const roomId = extractRoomId(joinInput);

    if (!roomId) {
      toast({
        title: 'Invalid link or room code',
        description: 'Please paste a lesson link (e.g. superboard.live/room/abc123) or a room code.',
        variant: 'destructive',
      });
      return;
    }

    setJoining(true);
    try {
      // Verify the room exists before navigating
      const res = await authFetch(`/api/room?roomId=${encodeURIComponent(roomId)}`);
      if (!res.ok) {
        if (res.status === 410) {
          toast({
            title: 'Lesson has ended',
            description: 'This lesson is no longer active. Ask your tutor for a new link.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Room not found',
            description: 'Could not find a lesson with that code. Please check and try again.',
            variant: 'destructive',
          });
        }
        return;
      }

      // Navigate to the room
      router.push(`/room/${roomId}`);
    } catch (err) {
      console.error('[StudentDashboard] Failed to join lesson:', err);
      toast({
        title: 'Something went wrong',
        description: 'Unable to join the lesson right now. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setJoining(false);
    }
  }, [joinInput, router, toast]);

  // Handle Enter key in the join input
  const handleJoinKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && joinInput.trim()) {
        handleJoinLesson();
      }
    },
    [joinInput, handleJoinLesson],
  );

  // ============================================================
  // Derived values
  // ============================================================
  const displayName =
    userName ||
    userEmail?.split('@')[0] ||
    'there';

  const hasLessons = lessons.length > 0;
  const activeLessons = lessons.filter((l) => l.isActive);

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="min-h-screen bg-background">
      {/* ============================================================
          Header
          ============================================================ */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-emerald-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900">
                My Learning
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium">
                Superboard Student
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground hidden sm:flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>{displayName}</span>
            </div>
            {activeLessons.length > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[11px] px-2 py-0.5 rounded-full font-medium border-0">
                {activeLessons.length} active
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================
          Main Content
          ============================================================ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* ----------------------------------------------------------
            Welcome Banner
            ---------------------------------------------------------- */}
        <div
          className="rounded-2xl gradient-hero p-5 sm:p-7 animate-fade-in-up"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Hi, {displayName}! 👋
              </h2>
              <p className="text-gray-600 mt-1.5 text-sm sm:text-base max-w-lg">
                Ready to learn? Join a lesson below, or paste a link from your tutor.
              </p>
            </div>
            <div className="hidden sm:flex shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-sm animate-float">
                <span className="text-4xl" role="img" aria-label="Learning">
                  📚
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------
            Quick Access — Join a Lesson
            ---------------------------------------------------------- */}
        <Card
          className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-fade-in-up-delay-1`}
        >
          {/* Gradient accent strip at the top */}
          <div className="h-1 gradient-primary" />
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-500" />
              Join a Lesson
            </CardTitle>
            <CardDescription className="text-sm">
              Paste the lesson link your tutor shared, or enter the room code directly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Input
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                  onKeyDown={handleJoinKeyDown}
                  placeholder="e.g. https://superboard.live/room/abc123"
                  className="h-11 rounded-xl border-gray-200 text-sm pr-10 placeholder:text-gray-400 focus:ring-emerald-500/20 focus:border-emerald-500"
                  disabled={joining}
                  aria-label="Lesson link or room code"
                />
                {/* Paste icon indicator */}
                <ClipboardPaste className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              </div>
              <Button
                onClick={handleJoinLesson}
                disabled={!joinInput.trim() || joining}
                className="h-11 px-6 rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all text-sm shrink-0 disabled:opacity-50"
              >
                {joining ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-1.5" />
                )}
                Join Lesson
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ----------------------------------------------------------
            Recent Lessons
            ---------------------------------------------------------- */}
        <section className="animate-fade-in-up-delay-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold flex items-center gap-2 text-gray-900">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              Recent Lessons
            </h2>
            {hasLessons && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                onClick={fetchLessons}
              >
                Refresh
              </Button>
            )}
          </div>

          {/* Loading skeleton */}
          {lessonsLoading && (
            <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <CardContent className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 animate-pulse"
                  >
                    <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-3 w-40 rounded" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Error state (non-critical — endpoint may not exist) */}
          {!lessonsLoading && lessonsError && (
            <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  Couldn&apos;t load lesson history
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This feature is coming soon. For now, use the join input above.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Empty state — no lessons yet */}
          {!lessonsLoading && !lessonsError && !hasLessons && (
            <div className="space-y-4">
              {/* Getting Started Card */}
              <Card className="rounded-2xl border border-dashed border-gray-300 bg-gradient-to-b from-white to-emerald-50/30">
                <CardContent className="p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4 animate-float-slow">
                    <BookX className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No lessons yet
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
                    Your lesson history will appear here once you join your first session.
                  </p>
                </CardContent>
              </Card>

              {/* Getting Started Guide — 3 Steps */}
              <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-emerald-500" />
                    Getting Started
                  </CardTitle>
                  <CardDescription>
                    Follow these simple steps to start learning with your tutor.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-0">
                  {/* Step 1 */}
                  <div className="flex gap-4 pb-5 relative">
                    {/* Connector line */}
                    <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gradient-to-b from-emerald-200 to-teal-200" />
                    <div className="shrink-0 w-10 h-10 rounded-full stat-gradient-sparkles flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-emerald-500/20">
                      1
                    </div>
                    <div className="pt-1.5">
                      <p className="text-sm font-medium text-gray-900">
                        Ask your tutor for a lesson link
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your tutor will share a unique link like{" "}
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-700">
                          superboard.live/room/abc123
                        </code>
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4 pb-5 relative">
                    <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gradient-to-b from-teal-200 to-cyan-200" />
                    <div className="shrink-0 w-10 h-10 rounded-full stat-gradient-video flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-teal-500/20">
                      2
                    </div>
                    <div className="pt-1.5">
                      <p className="text-sm font-medium text-gray-900">
                        Click the link or paste it above
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        You can click directly from your messages, or copy-paste the code
                        into the &quot;Join a Lesson&quot; input.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full stat-gradient-recordings flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-sky-500/20">
                      3
                    </div>
                    <div className="pt-1.5">
                      <p className="text-sm font-medium text-gray-900">
                        Start learning together!
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Draw, write, and collaborate on the interactive whiteboard
                        with your tutor in real time.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Lesson list */}
          {!lessonsLoading && !lessonsError && hasLessons && (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {lessons.map((lesson, idx) => {
                const meta =
                  subjectMeta[lesson.subject] || subjectMeta.GENERAL;
                const MetaIcon = meta.icon;

                return (
                  <div
                    key={lesson.id}
                    className={`group flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-gray-100 bg-white hover:bg-emerald-50/40 hover:border-emerald-200/60 transition-all card-hover ${idx < 3 ? 'animate-fade-in-up' : ''}`}
                    style={idx >= 3 ? { animationDelay: `${(idx - 3) * 60}ms`, opacity: 0 } : undefined}
                  >
                    {/* Subject icon */}
                    <div
                      className={`w-10 h-10 rounded-xl ${meta.gradient} flex items-center justify-center shadow-sm shrink-0`}
                    >
                      <MetaIcon className="w-5 h-5 text-white" />
                    </div>

                    {/* Lesson info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {meta.label} Lesson
                        </span>
                        {lesson.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] px-1.5 py-0 rounded-full font-medium border-0">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 text-[10px] px-1.5 py-0 rounded-full font-medium border-0">
                            Ended
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                        <span>{formatDate(lesson.createdAt)}</span>
                        {!lesson.isActive &&
                          lesson.durationMinutes != null &&
                          lesson.durationMinutes > 0 && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {formatDuration(lesson.durationMinutes)}
                              </span>
                            </>
                          )}
                        {lesson.tutorName && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span>with {lesson.tutorName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    <Button
                      size="sm"
                      className={`h-8 px-3 rounded-lg text-xs font-medium shrink-0 transition-all ${
                        lesson.isActive
                          ? 'gradient-primary border-0 text-white shadow-sm shadow-emerald-500/20 hover:shadow-emerald-500/30'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-0'
                      }`}
                      asChild
                    >
                      <a href={`/room/${lesson.id}`}>
                        {lesson.isActive ? (
                          <>
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            Join
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-3.5 h-3.5 mr-1" />
                            Review
                          </>
                        )}
                      </a>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
