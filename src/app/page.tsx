// ============================================================
// Tutor Dashboard — Main Page (/)
// ============================================================
// Views Templates, Saved Boards, Billing, Agency Admin.
// This is the authenticated tutor's landing page.
// ============================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { useCredits } from '@/hooks/useCredits';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
  Clock,
  Sparkles,
  Palette,
  Globe,
  ChevronRight,
  Video,
  FileText,
} from 'lucide-react';
import type { Subject, Tier } from '@/types';

export default function Dashboard() {
  const { tier, setTier, setRoom } = useAppStore();
  const { brandColor, agencyName, setBrandColor } = useTheme();
  const {
    aiCreditsUsed,
    aiCreditsLimit,
    videoMinutesUsed,
    videoMinutesLimit,
    loading: usageLoading,
  } = useCredits();

  const [showNewLesson, setShowNewLesson] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject>('GENERAL');
  const [creating, setCreating] = useState(false);

  // Report fingerprint on dashboard load (Anti-Fraud)
  useEffect(() => {
    import('@/lib/fingerprint').then(({ reportFingerprint }) => {
      reportFingerprint().catch(console.error);
    });
  }, []);

  // Create new lesson
  const handleCreateLesson = useCallback(async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: 'current-user-id', // TODO: Replace with actual auth user ID
          subject: selectedSubject,
        }),
      });

      if (!response.ok) throw new Error('Failed to create room');

      const data = await response.json();
      // Navigate to the room
      window.location.href = `/room/${data.roomId}`;
    } catch (error) {
      console.error('[Dashboard] Failed to create lesson:', error);
      setCreating(false);
    }
  }, [selectedSubject]);

  const tierLabel = tier === 'AGENCY' ? 'Agency' : tier === 'PRO' ? 'Pro' : 'Free';
  const tierColor =
    tier === 'AGENCY' ? 'bg-amber-100 text-amber-800' : tier === 'PRO' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {agencyName || 'K-12 Superboard'}
              </h1>
              <p className="text-xs text-muted-foreground">
                AI-Assisted Tutoring Whiteboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className={tierColor}>
              {tierLabel}
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Usage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI Credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {aiCreditsUsed}
                {aiCreditsLimit !== Infinity ? ` / ${aiCreditsLimit}` : ' / ∞'}
              </div>
              {aiCreditsLimit !== Infinity && (
                <Progress value={(aiCreditsUsed / aiCreditsLimit) * 100} className="mt-2 h-2" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Video className="w-4 h-4" /> Video Minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {videoMinutesUsed}
                {videoMinutesLimit !== Infinity ? ` / ${videoMinutesLimit}` : ' / ∞'}
              </div>
              {videoMinutesLimit !== Infinity && (
                <Progress value={(videoMinutesUsed / videoMinutesLimit) * 100} className="mt-2 h-2" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <FileText className="w-4 h-4" /> Session Recordings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                {tier === 'FREE'
                  ? 'Requires Pro'
                  : tier === 'PRO'
                    ? '2 per month included'
                    : 'Unlimited'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions + Content Tabs */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Quick Actions */}
          <div className="lg:w-72 flex-shrink-0 space-y-4">
            {/* New Lesson Button */}
            <Dialog open={showNewLesson} onOpenChange={setShowNewLesson}>
              <DialogTrigger asChild>
                <Button className="w-full h-14 text-base" size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  New Lesson
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Lesson</DialogTitle>
                  <DialogDescription>
                    Select a subject for your lesson. This determines which
                    toolkit will be available on the whiteboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select
                      value={selectedSubject}
                      onValueChange={(v) => setSelectedSubject(v as Subject)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MATH">Mathematics</SelectItem>
                        <SelectItem value="SCIENCE">Science</SelectItem>
                        <SelectItem value="LANGUAGE">English & Language</SelectItem>
                        <SelectItem value="GENERAL">General / Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Agency branding selection (Agency tier only) */}
                  {tier === 'AGENCY' && (
                    <div className="space-y-2">
                      <Label>Branding</Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: brandColor || '#000' }}
                        />
                        <Input
                          value={brandColor || ''}
                          onChange={(e) => setBrandColor(e.target.value)}
                          placeholder="#FF5733"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleCreateLesson}
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Start Lesson'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Subject Quick Start */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quick Start</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(['MATH', 'SCIENCE', 'LANGUAGE', 'GENERAL'] as Subject[]).map(
                  (subj) => (
                    <Button
                      key={subj}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedSubject(subj);
                        setShowNewLesson(true);
                      }}
                    >
                      {subj === 'MATH' && '📐 Mathematics'}
                      {subj === 'SCIENCE' && '🔬 Science'}
                      {subj === 'LANGUAGE' && '📝 Language'}
                      {subj === 'GENERAL' && '📋 General'}
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                  )
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Tabs Content */}
          <div className="flex-1">
            <Tabs defaultValue="boards" className="w-full">
              <TabsList>
                <TabsTrigger value="boards" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Saved Boards
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="billing" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Billing
                </TabsTrigger>
                {tier === 'AGENCY' && (
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Admin
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="boards" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Saved Boards</CardTitle>
                    <CardDescription>
                      Your recent lesson boards. {tier === 'FREE' ? 'Save/Load requires Pro.' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No saved boards yet.</p>
                      <p className="text-sm mt-1">
                        Create a new lesson to get started.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="templates" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Templates</CardTitle>
                    <CardDescription>
                      Pre-built board layouts for different subjects.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <LayoutTemplate className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No templates yet.</p>
                      <p className="text-sm mt-1">
                        {tier === 'FREE'
                          ? 'Templates require Pro.'
                          : 'Save a board as a template from the whiteboard.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Billing & Subscription</CardTitle>
                    <CardDescription>
                      Manage your subscription and payment methods.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Current Plan */}
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium">Current Plan</p>
                        <p className="text-sm text-muted-foreground">
                          {tier === 'FREE' && 'Free tier — Limited features'}
                          {tier === 'PRO' && 'Pro Tutor — $15/month'}
                          {tier === 'AGENCY' && 'Agency — $39/month'}
                        </p>
                      </div>
                      <Badge className={tierColor}>{tierLabel}</Badge>
                    </div>

                    {/* Upgrade Options (hidden if Agency) */}
                    {tier !== 'AGENCY' && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="font-semibold">Upgrade Options</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tier === 'FREE' && (
                              <Card className="border-emerald-200">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg">Pro Tutor</CardTitle>
                                  <CardDescription>$15/month or $120/year</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <ul className="text-sm space-y-1 mb-4">
                                    <li>✅ Unlimited video</li>
                                    <li>✅ 100 AI credits/month</li>
                                    <li>✅ GeoGebra, Mathpix</li>
                                    <li>✅ Save/Load & Templates</li>
                                    <li>✅ 2 recordings/month</li>
                                  </ul>
                                  <Button className="w-full">
                                    Upgrade to Pro
                                  </Button>
                                </CardContent>
                              </Card>
                            )}

                            <Card className="border-amber-200">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Agency / Center</CardTitle>
                                <CardDescription>$39/month</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <ul className="text-sm space-y-1 mb-4">
                                  <li>✅ Everything in Pro</li>
                                  <li>✅ White-labeling</li>
                                  <li>✅ Custom domains</li>
                                  <li>✅ Unlimited recordings</li>
                                  <li>✅ Admin dashboard</li>
                                </ul>
                                <Button variant="outline" className="w-full">
                                  Contact Sales
                                </Button>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Agency Features */}
                    {tier === 'AGENCY' && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Palette className="w-4 h-4" /> White-Label Settings
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Brand Color</Label>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded border"
                                  style={{ backgroundColor: brandColor || '#000' }}
                                />
                                <Input
                                  value={brandColor || ''}
                                  onChange={(e) => setBrandColor(e.target.value)}
                                  placeholder="#FF5733"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Custom Domain</Label>
                              <Input
                                placeholder="classroom.yourcenter.com"
                                disabled
                              />
                              <p className="text-xs text-muted-foreground">
                                Configure via DNS settings
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Agency Admin Tab */}
              {tier === 'AGENCY' && (
                <TabsContent value="admin" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" /> Agency Admin Dashboard
                      </CardTitle>
                      <CardDescription>
                        View aggregate usage and students of sub-tutors.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No sub-tutors assigned yet.</p>
                        <p className="text-sm mt-1">
                          Add tutors to your agency to see their usage stats here.
                        </p>
                      </div>
                    </CardContent>
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
