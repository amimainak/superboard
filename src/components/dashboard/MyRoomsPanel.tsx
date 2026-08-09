// ============================================================
// MyRoomsPanel — List of tutor's lessons (active & ended)
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { subjectMeta } from '@/lib/subject-meta';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Copy,
  LogOut,
  Plus,
  ExternalLink,
  Loader2,
  BookX,
} from 'lucide-react';
import type { Subject } from '@/types';

type Props = {
  userId: string;
  onCreateLesson: () => void;
};

interface RoomRow {
  id: string;
  subject: string;
  isActive: boolean;
  brandingLogo: string | null;
  brandingColor: string | null;
  createdAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
}

export function MyRoomsPanel({ userId, onCreateLesson }: Props) {
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [endingId, setEndingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/room/list?tutorId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch rooms');
      const data = await res.json();
      setRooms(data.rooms ?? []);
    } catch {
      toast({ title: 'Failed to load lessons', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCopyLink = (roomId: string) => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: 'Link copied!', description: 'Share this link with your student.' });
    }).catch(() => {
      toast({ title: 'Failed to copy link', variant: 'destructive' });
    });
  };

  const handleEndRoom = async (roomId: string) => {
    setEndingId(roomId);
    try {
      const res = await authFetch(`/api/room/${roomId}`, { method: 'PATCH' });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(body || 'Failed to end lesson');
      }
      toast({ title: 'Lesson ended', description: 'The lesson has been marked as ended.' });
      fetchRooms(); // refresh
    } catch (err: any) {
      toast({ title: 'Failed to end lesson', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setEndingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    if (isToday) return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    if (isYesterday) return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Loading skeleton
  if (loading) {
    return (
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-500" />
            My Lessons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-500" />
          My Lessons
          {rooms.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs font-medium">
              {rooms.filter((r) => r.isActive).length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rooms.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <BookX className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Welcome to Superboard!</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first lesson to get started.</p>
            <Button
              onClick={onCreateLesson}
              className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create Lesson
            </Button>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            {rooms.map((room) => {
              const meta = subjectMeta[room.subject] || subjectMeta.GENERAL;
              return (
                <div
                  key={room.id}
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
                        {meta.label} Lesson
                      </span>
                      {room.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] px-1.5 py-0 rounded-full font-medium">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 text-[10px] px-1.5 py-0 rounded-full font-medium">
                          Ended
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatDate(room.createdAt)}
                      {!room.isActive && room.durationMinutes != null && room.durationMinutes > 0 && (
                        <span className="ml-1.5">· {room.durationMinutes} min</span>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-100 hover:text-emerald-700"
                      title={room.isActive ? 'Join lesson' : 'View lesson'}
                      asChild
                    >
                      <a href={`/room/${room.id}`}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                      title="Copy link"
                      onClick={() => handleCopyLink(room.id)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    {room.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg hover:bg-rose-50 hover:text-rose-600"
                        title="End lesson"
                        disabled={endingId === room.id}
                        onClick={() => handleEndRoom(room.id)}
                      >
                        {endingId === room.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <LogOut className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
