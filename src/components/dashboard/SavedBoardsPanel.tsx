// ============================================================
// Saved Boards Panel
// ============================================================
'use client';

import React, { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { subjectMeta } from '@/lib/subject-meta';
import type { Tier, BoardRow } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Star, ChevronRight } from 'lucide-react';

export function SavedBoardsPanel({ userId, tier }: { userId: string; tier: Tier }) {
  const [boards, setBoards] = useState<BoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    authFetch(`/api/room?tutorId=${userId}`).then((res) => res.json()).then((data) => {
      if (Array.isArray(data)) setBoards(data.map((r: any) => ({ id: r.id, subject: r.subject, isActive: r.isActive, createdAt: r.createdAt, brandingColor: r.brandingColor })));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);
  const canAccess = tier === 'PRO' || tier === 'AGENCY';

  if (!canAccess) return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader><CardTitle>Saved Boards</CardTitle><CardDescription>Save/Load requires Pro or Agency tier.</CardDescription></CardHeader>
      <CardContent className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center"><Star className="w-8 h-8 text-amber-400" /></div>
        <p className="text-muted-foreground font-medium">Upgrade to access saved boards</p>
      </CardContent>
    </Card>
  );

  if (loading) return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader><CardTitle>Saved Boards</CardTitle></CardHeader>
      <CardContent><div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div></CardContent>
    </Card>
  );

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader><CardTitle>Saved Boards</CardTitle><CardDescription>Your lesson history. Click to reopen.</CardDescription></CardHeader>
      <CardContent>
        {boards.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center"><BookOpen className="w-8 h-8 text-emerald-400" /></div>
            <p className="text-muted-foreground font-medium">No boards yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first lesson to see it here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {boards.map((board) => {
              const meta = subjectMeta[board.subject] || subjectMeta.GENERAL;
              return (
                <div key={board.id} className="flex items-center justify-between rounded-xl border border-emerald-100/40 px-4 py-3.5 hover:bg-emerald-50/40 cursor-pointer transition-all group" onClick={() => (window.location.href = `/room/${board.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${meta.gradient} flex items-center justify-center shadow-sm`}><meta.icon className="w-5 h-5 text-white" /></div>
                    <div><p className="text-sm font-medium">{board.subject} Lesson</p><p className="text-xs text-muted-foreground">{new Date(board.createdAt).toLocaleDateString()}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={board.isActive ? 'default' : 'secondary'} className={`text-[10px] rounded-full ${board.isActive ? 'bg-emerald-100 text-emerald-700' : ''}`}>{board.isActive ? 'Active' : 'Ended'}</Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
