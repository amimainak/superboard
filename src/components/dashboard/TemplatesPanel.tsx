// ============================================================
// Templates Panel
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { subjectMeta } from '@/lib/subject-meta';
import type { Tier, Subject, TemplateRow } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, LayoutTemplate, Play } from 'lucide-react';

export function TemplatesPanel({ userId, tier }: { userId: string; tier: Tier }) {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newSubject, setNewSubject] = useState<Subject>('GENERAL');
  const [saving, setSaving] = useState(false);
  const canAccess = tier === 'PRO' || tier === 'AGENCY';

  const fetchTemplates = useCallback(() => {
    if (!userId || !canAccess) return;
    setLoading(true);
    authFetch(`/api/room/templates?tutorId=${userId}`).then((res) => res.json()).then((data) => setTemplates(Array.isArray(data) ? data : [])).catch(() => {}).finally(() => setLoading(false));
  }, [userId, canAccess]);
  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim() || !userId) return;
    setSaving(true);
    try { await authFetch('/api/room/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tutorId: userId, name: newName.trim(), subject: newSubject }) }); setNewName(''); fetchTemplates(); } catch { /* */ }
    setSaving(false);
  }, [newName, newSubject, userId, fetchTemplates]);

  if (!canAccess) return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader><CardTitle>Templates</CardTitle><CardDescription>Templates require Pro or Agency tier.</CardDescription></CardHeader>
      <CardContent className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sky-50 flex items-center justify-center"><LayoutTemplate className="w-8 h-8 text-sky-400" /></div>
        <p className="text-muted-foreground font-medium">Upgrade to create templates</p>
      </CardContent>
    </Card>
  );

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader><CardTitle>Templates</CardTitle><CardDescription>Save board layouts as reusable templates.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Template name (e.g., 'Algebra Review')" className="flex-1 rounded-xl h-11" />
          <Select value={newSubject} onValueChange={(v) => setNewSubject(v as Subject)}>
            <SelectTrigger className="w-32 rounded-xl h-11"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="MATH">Math</SelectItem><SelectItem value="SCIENCE">Science</SelectItem><SelectItem value="LANGUAGE">Language</SelectItem><SelectItem value="GENERAL">General</SelectItem></SelectContent>
          </Select>
          <Button onClick={handleCreate} disabled={saving || !newName.trim()} size="icon" className="rounded-xl h-11 w-11 gradient-primary border-0 text-white shadow-md shadow-emerald-500/20"><Plus className="w-4 h-4" /></Button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center"><LayoutTemplate className="w-8 h-8 text-emerald-400" /></div>
            <p className="text-muted-foreground font-medium">No templates yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => {
              const meta = subjectMeta[t.subject] || subjectMeta.GENERAL;
              return (
                <div key={t.id} className="flex items-center justify-between rounded-xl border border-emerald-100/40 px-4 py-3 hover:bg-emerald-50/40 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${meta.gradient} flex items-center justify-center shadow-sm`}><meta.icon className="w-4 h-4 text-white" /></div>
                    <div><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.subject} &middot; {new Date(t.createdAt).toLocaleDateString()}</p></div>
                  </div>
                  <Button variant="ghost" size="sm" disabled className="rounded-lg opacity-0 group-hover:opacity-100"><Play className="w-4 h-4" /></Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
