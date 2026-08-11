// ============================================================
// RecordingsPanel — List of lesson recordings with playback
// ============================================================
// Fetches all ended rooms, then queries recordings for each.
// Displays a consolidated, chronologically sorted list.
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { subjectMeta } from '@/lib/subject-meta';
import type { Tier } from '@/types';
import { TIER_LIMITS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Video,
  Play,
  Download,
  Clock,
  AlertCircle,
  Loader2,
  VideoOff,
  ExternalLink,
  X,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

type Props = {
  userId: string;
  tier: Tier;
};

// No longer needed — batch endpoint returns all data in one call

interface RecordingInfo {
  id: string;
  roomId: string;
  url: string | null;
  status: string;
  duration: number;       // seconds
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

interface RecordingWithRoom extends RecordingInfo {
  roomSubject: string;
  roomCreatedAt: string;
}

// ============================================================
// Helpers
// ============================================================

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}:${String(s).padStart(2, '0')}`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}:${String(rm).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  if (isYesterday) return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusBadge(status: string) {
  switch (status) {
    case 'STARTED':
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] px-1.5 py-0 rounded-full font-medium">
          Recording
        </Badge>
      );
    case 'STOPPED':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] px-1.5 py-0 rounded-full font-medium">
          Completed
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 text-[10px] px-1.5 py-0 rounded-full font-medium">
          Failed
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 text-[10px] px-1.5 py-0 rounded-full font-medium">
          {status}
        </Badge>
      );
  }
}

// ============================================================
// Component
// ============================================================

export function RecordingsPanel({ userId, tier }: Props) {
  const [recordings, setRecordings] = useState<RecordingWithRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  const hasRecordingsFeature = TIER_LIMITS[tier]?.features?.recordings ?? false;

  const fetchRecordings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Single batch endpoint — no N+1
      const res = await authFetch('/api/recordings');
      if (!res.ok) throw new Error('Failed to fetch recordings');
      const data = await res.json();
      const recs: RecordingWithRoom[] = (data.recordings ?? []).map((rec: any) => ({
        id: rec.id,
        roomId: rec.roomId,
        url: rec.url,
        status: rec.status,
        duration: rec.duration,
        startedAt: rec.startedAt,
        endedAt: rec.endedAt,
        createdAt: rec.createdAt,
        roomSubject: rec.roomSubject,
        roomCreatedAt: rec.roomCreatedAt,
      }));

      setRecordings(recs);
    } catch (err: any) {
      setError(err?.message || 'Failed to load recordings');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (hasRecordingsFeature) {
      fetchRecordings();
    } else {
      setLoading(false);
    }
  }, [fetchRecordings, hasRecordingsFeature]);

  // ---- Paywall: no recordings feature ----
  if (!hasRecordingsFeature) {
    return (
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-500" />
            Recordings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <VideoOff className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-card-foreground">Recordings Unavailable</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Upgrade to Pro or Agency to access lesson recordings.
            </p>
            <Button
              className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30"
              size="sm"
              onClick={() => {
                // Navigate to billing view — dispatch a custom event that DashboardPage listens for
                window.dispatchEvent(new CustomEvent('dashboard:navigate', { detail: 'billing' }));
              }}
            >
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---- Loading skeleton ----
  if (loading) {
    return (
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-500" />
            Recordings
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 animate-pulse"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-200" />\n                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32" />\n                  <div className="h-3 bg-gray-200 rounded w-24" />\n                </div>
                <div className="h-8 w-20 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---- Error state ----
  if (error) {
    return (
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-500" />
            Recordings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-rose-400" />
            </div>
            <h3 className="text-sm font-semibold text-card-foreground">Something went wrong</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">{error}</p>
            <Button
              variant="outline"
              className="rounded-xl text-xs"
              onClick={fetchRecordings}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---- Inline video player overlay ----
  const VideoPlayerOverlay = playingUrl ? (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={() => setPlayingUrl(null)}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <video
          src={playingUrl}
          controls
          autoPlay
          className="w-full aspect-video bg-black"
        >
          Your browser does not support video playback.
        </video>
      </div>
    </div>
  ) : null;

  // ---- Main render ----
  return (
    <>
      {VideoPlayerOverlay}
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-500" />
            Recordings
            {recordings.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs font-medium">
                {recordings.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recordings.length === 0 ? (
            /* ---- Empty state ---- */
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <Video className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-card-foreground">No recordings yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Recordings from your ended lessons will appear here.
              </p>
            </div>
          ) : (
            /* ---- Recordings list ---- */
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {recordings.map((rec) => {
                const meta = subjectMeta[rec.roomSubject] || subjectMeta.GENERAL;
                const hasUrl = !!rec.url;
                const displayDate = rec.startedAt || rec.createdAt;

                return (
                  <div
                    key={rec.id}
                    className="group flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-emerald-50/50 hover:border-emerald-200/60 transition-all"
                  >
                    {/* Subject icon */}
                    <div
                      className={`w-9 h-9 rounded-lg ${meta.gradient} flex items-center justify-center shadow-sm shrink-0`}
                    >
                      <meta.icon className="w-4 h-4 text-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-card-foreground truncate">
                          {meta.label} Lesson
                        </span>
                        {statusBadge(rec.status)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(displayDate)}</span>
                        {rec.duration > 0 && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span>{formatDuration(rec.duration)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                      {hasUrl ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 rounded-lg hover:bg-emerald-100 hover:text-emerald-700 text-xs font-medium gap-1"
                            title="Play recording"
                            onClick={() => setPlayingUrl(rec.url)}
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Play</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                            title="Download recording"
                            asChild
                          >
                            <a href={rec.url ?? ''} download target="_blank" rel="noopener noreferrer">
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 rounded-lg text-xs text-muted-foreground"
                          disabled
                        >
                          {rec.status === 'STARTED' ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                              <span>Processing…</span>
                            </>
                          ) : rec.status === 'FAILED' ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 mr-1" />
                              <span>Unavailable</span>
                            </>
                          ) : (
                            <>
                              <VideoOff className="w-3.5 h-3.5 mr-1" />
                              <span>No file</span>
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 hover:text-gray-600"
                        title="View lesson room"
                        asChild
                      >
                        <a href={`/room/${rec.roomId}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
