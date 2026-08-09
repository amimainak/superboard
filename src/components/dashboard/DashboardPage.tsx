// ============================================================
// Authenticated Dashboard — Logged-in tutor view
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { useCredits } from '@/hooks/useCredits';
import { useTheme } from '@/hooks/useTheme';
import { createClient } from '@/lib/supabase';
import { subjectMeta } from '@/lib/subject-meta';
import type { Subject, Tier } from '@/types';
import { isAgencyTier } from '@/types';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  BookOpen,
  LayoutTemplate,
  CreditCard,
  Settings,
  Users,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Video,
  FileText,
  LogOut,
  Zap,
  Crown,
  Mail,
  BadgeInfo,
} from 'lucide-react';
import { BillingPanel } from './BillingPanel';
import { SavedBoardsPanel } from './SavedBoardsPanel';
import { TemplatesPanel } from './TemplatesPanel';
import { AgencyAdminPanel } from './AgencyAdminPanel';

export function AuthenticatedDashboard({ user, userName, tierLoading }: { user: User; userName: string | null; tierLoading: boolean }) {
  const { tier, setTier, setRoom } = useAppStore();
  const { brandColor, agencyName, setBrandColor } = useTheme();
  const {
    aiCreditsUsed,
    aiCreditsLimit,
    videoMinutesUsed,
    videoMinutesLimit,
    recordingsUsed,
    recordingsLimit,
    loading: usageLoading,
  } = useCredits(user.id);

  const [showNewLesson, setShowNewLesson] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject>('GENERAL');
  const [creating, setCreating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    import('@/lib/fingerprint').then(({ reportFingerprint }) => {
      if (user?.id) {
        reportFingerprint(user.id).catch(console.error);
      }
    });
  }, [user?.id]);

  const handleCreateLesson = useCallback(async () => {
    setCreating(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase!.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        console.error('[Dashboard] No session token available — are you logged in?');
        setCreating(false);
        return;
      }

      const response = await fetch('/api/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tutorId: user?.id, subject: selectedSubject }),
      });
      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.error('[Dashboard] Room creation failed:', response.status, errBody);
        throw new Error(`Failed to create room (${response.status}): ${errBody}`);
      }
      const data = await response.json();
      window.location.href = `/room/${data.roomId}`;
    } catch (error) {
      console.error('[Dashboard] Failed to create lesson:', error);
      setCreating(false);
    }
  }, [selectedSubject, user?.id]);

  const handleSaveBrandColor = useCallback(async () => {
    setSaveLoading(true);
    setSaveSuccess(false);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase!.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ brandingColor: brandColor || null }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch { /* silent */ }
    setSaveLoading(false);
  }, [brandColor]);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setTier('FREE');
    window.location.href = '/';
  }, [setTier]);

  const tierLabel = isAgencyTier(tier)
    ? tier === 'AGENCY_PREMIUM' ? 'Agency Premium'
    : tier === 'AGENCY_STANDARD' ? 'Agency Standard'
    : 'Agency'
    : tier === 'PRO' ? 'Pro' : 'Free';
  const tierColor =
    tier === 'AGENCY_PREMIUM' ? 'bg-purple-100 text-purple-800'
    : tier === 'AGENCY_STANDARD' || tier === 'AGENCY' ? 'bg-amber-100 text-amber-800'
    : tier === 'PRO' ? 'bg-emerald-100 text-emerald-800'
    : 'bg-teal-50 text-teal-700';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-emerald-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{agencyName || 'Superboard'}</h1>
              <p className="text-[11px] text-muted-foreground font-medium">Smart Tutoring Whiteboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline mr-1">{user.email}</span>
            {!tierLoading && (
              <Badge variant="outline" className={`rounded-full px-3 py-0.5 font-medium ${tierColor}`}>
                {isAgencyTier(tier) && <Crown className="w-3 h-3 mr-1" />}
                {tierLabel}
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Settings" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors" onClick={handleLogout} title="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Settings</DialogTitle>
          <div className="gradient-primary px-6 pt-8 pb-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/90 flex items-center justify-center mx-auto mb-4">
              <Settings className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-white">Settings</h2>
            <p className="text-sm text-white/70 mt-1">Manage your account preferences</p>
          </div>
          <div className="px-6 pb-6 pt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <div className="h-11 rounded-xl bg-gray-50 border border-gray-200 px-3 flex items-center text-sm text-gray-600">{user.email || ''}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Plan</Label>
              <Badge variant="outline" className={`rounded-full px-3 py-0.5 font-medium ${tierColor}`}>{tierLabel}</Badge>
            </div>
            {isAgencyTier(tier) && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Brand Color</Label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg border shadow-sm" style={{ backgroundColor: brandColor || '#000' }} />
                  <Input value={brandColor || ''} onChange={(e) => setBrandColor(e.target.value)} placeholder="#FF5733" className="flex-1 rounded-xl" />
                </div>
              </div>
            )}
            <Separator />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Need to change your email or password?</p>
              <a href="mailto:support@superboard.live" className="text-xs text-primary hover:underline mt-1 inline-block">Contact Support</a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div className="mb-8 rounded-2xl gradient-hero p-6 md:p-8 animate-fade-in-up">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome back! {userName || user.user_metadata?.name || user.email?.split('@')[0]}</h2>
          <p className="text-gray-700 mt-2 max-w-xl">Create interactive lessons with smart tools, video calling, and real-time collaboration. Your students will love the experience.</p>
        </div>

        {/* Usage Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl p-6 text-white stat-gradient-sparkles shadow-lg shadow-emerald-500/15 card-hover animate-fade-in-up">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1"><Sparkles className="w-5 h-5 text-white/80" /><span className="text-sm font-medium text-white/80">Smart Credits</span></div>
              <div className="text-3xl font-bold mt-2">{aiCreditsUsed}{aiCreditsLimit !== Infinity ? ` / ${aiCreditsLimit}` : ' / \u221E'}</div>
              {aiCreditsLimit !== Infinity && <Progress value={(aiCreditsUsed / aiCreditsLimit) * 100} className="mt-3 h-2 bg-white/20 [&>div]:bg-white/90" />}
            </div>
          </div>
          <div className="rounded-2xl p-6 text-white stat-gradient-video shadow-lg shadow-sky-500/15 card-hover animate-fade-in-up-delay-1">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1"><Video className="w-5 h-5 text-white/80" /><span className="text-sm font-medium text-white/80">Video Minutes</span></div>
              <div className="text-3xl font-bold mt-2">{videoMinutesUsed}{videoMinutesLimit !== Infinity ? ` / ${videoMinutesLimit}` : ' / \u221E'}</div>
              {videoMinutesLimit !== Infinity && <Progress value={(videoMinutesUsed / videoMinutesLimit) * 100} className="mt-3 h-2 bg-white/20 [&>div]:bg-white/90" />}
            </div>
          </div>
          <div className="rounded-2xl p-6 text-white stat-gradient-recordings shadow-lg shadow-emerald-500/15 card-hover animate-fade-in-up-delay-2">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1"><FileText className="w-5 h-5 text-white/80" /><span className="text-sm font-medium text-white/80">Session Recordings</span></div>
              <div className="text-3xl font-bold mt-2">{recordingsUsed}{recordingsLimit !== Infinity ? ` / ${recordingsLimit}` : ''}</div>
              <p className="text-sm text-white/70 mt-2">{tier === 'FREE' ? 'Requires Pro' : tier === 'PRO' ? `${recordingsLimit} per month included` : 'Unlimited'}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions + Content Tabs */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Quick Actions */}
          <div className="lg:w-72 flex-shrink-0 space-y-4 animate-fade-in-up-delay-3">
            <Dialog open={showNewLesson} onOpenChange={setShowNewLesson}>
              <DialogTrigger asChild>
                <Button className="w-full h-14 text-base rounded-2xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-[15px]">
                  <Plus className="w-5 h-5 mr-2" />New Lesson
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl">Create New Lesson</DialogTitle>
                  <DialogDescription>Select a subject for your lesson. This determines which toolkit will be available on the whiteboard.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={selectedSubject} onValueChange={(v) => setSelectedSubject(v as Subject)}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MATH">Mathematics</SelectItem>
                        <SelectItem value="SCIENCE">Science</SelectItem>
                        <SelectItem value="LANGUAGE">English &amp; Language</SelectItem>
                        <SelectItem value="GENERAL">General / Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {isAgencyTier(tier) && (
                    <div className="space-y-2">
                      <Label>Branding</Label>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg border shadow-sm" style={{ backgroundColor: brandColor || '#000' }} />
                        <Input value={brandColor || ''} onChange={(e) => setBrandColor(e.target.value)} placeholder="#FF5733" className="flex-1 rounded-xl" />
                      </div>
                    </div>
                  )}
                  <Button className="w-full rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25" onClick={handleCreateLesson} disabled={creating}>
                    {creating ? 'Creating...' : 'Start Lesson'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" />Quick Start</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {(['MATH', 'SCIENCE', 'LANGUAGE', 'GENERAL'] as Subject[]).map((subj) => {
                  const meta = subjectMeta[subj];
                  return (
                    <button key={subj} onClick={() => { setSelectedSubject(subj); setShowNewLesson(true); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-emerald-50 transition-colors group">
                      <div className={`w-9 h-9 rounded-lg ${meta.gradient} flex items-center justify-center shadow-sm`}><meta.icon className="w-4 h-4 text-white" /></div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium">{meta.label}</p><p className="text-[11px] text-muted-foreground">Quick start</p></div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right: Tabs Content */}
          <div className="flex-1 animate-fade-in-up-delay-2">
            <Tabs defaultValue="billing" className="w-full">
              <TabsList className="bg-gray-100 rounded-xl p-1 h-auto">
                {isAgencyTier(tier) && (
                  <TabsTrigger value="boards" className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium text-sm"><BookOpen className="w-4 h-4" />Saved Boards</TabsTrigger>
                )}
                {isAgencyTier(tier) && (
                  <TabsTrigger value="templates" className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium text-sm"><LayoutTemplate className="w-4 h-4" />Templates</TabsTrigger>
                )}
                <TabsTrigger value="billing" className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium text-sm"><CreditCard className="w-4 h-4" />Billing</TabsTrigger>
                {isAgencyTier(tier) && (
                  <TabsTrigger value="admin" className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium text-sm"><Users className="w-4 h-4" />Admin</TabsTrigger>
                )}
              </TabsList>
              {isAgencyTier(tier) && <TabsContent value="boards" className="mt-6"><SavedBoardsPanel userId={user?.id || ''} tier={tier} /></TabsContent>}
              {isAgencyTier(tier) && <TabsContent value="templates" className="mt-6"><TemplatesPanel userId={user?.id || ''} tier={tier} /></TabsContent>}
              <TabsContent value="billing" className="mt-6"><BillingPanel tier={tier} brandColor={brandColor || ''} setBrandColor={setBrandColor} onSaveBrandColor={handleSaveBrandColor} /></TabsContent>
              {isAgencyTier(tier) && (
                <TabsContent value="admin" className="mt-6">
                  <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500" />Agency Admin Dashboard</CardTitle>
                      <CardDescription>Manage sub-tutors, student roster, and view usage.</CardDescription>
                    </CardHeader>
                    <CardContent><AgencyAdminPanel agencyUserId={user?.id || ''} userTier={tier} /></CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
