// ============================================================
// Authenticated Dashboard — Restructured with Sidebar Navigation
// ============================================================
// Phase 2: Dashboard IA Reorganization
// - Collapsible sidebar with categorized navigation
// - Views: Overview, Lessons, Resources (saved boards + templates),
//   Agency (admin + students), Billing, Settings
// - Onboarding wizard for first-time tutors
// - Student experience toggle
// ============================================================
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  ChevronLeft,
  Video,
  FileText,
  LogOut,
  Zap,
  Crown,
  Shield,
  LayoutDashboard,
  Home,
  FolderOpen,
  BarChart3,
  Palette,
  Building2,
  Calendar,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  Receipt,
  ClipboardList,
  Award,
  FileBarChart,
  Play,
  Library,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BillingPanel } from './BillingPanel';
import { SavedBoardsPanel } from './SavedBoardsPanel';
import { TemplatesPanel } from './TemplatesPanel';
import { AgencyAdminPanel } from './AgencyAdminPanel';
import { MyRoomsPanel } from './MyRoomsPanel';
import OnboardingWizard from './OnboardingWizard';
import StudentDashboard from './StudentDashboard';
import { AnalyticsPanel } from './AnalyticsPanel';
import { SchedulePanel } from './SchedulePanel';
import { RecordingsPanel } from './RecordingsPanel';
import { TemplateGallery, type TemplateInfo } from './TemplateGallery';
import { HomeworkPanel } from './HomeworkPanel';
import { LessonNotesPanel } from './LessonNotesPanel';
import { ResourceLibraryPanel } from './ResourceLibraryPanel';
import { InvoicePanel } from './InvoicePanel';
import { AgencyAnalyticsPanel } from './AgencyAnalyticsPanel';
import { StudentProfilePanel } from './StudentProfilePanel';
import { RecapPanel } from './RecapPanel';
import { CertificatePanel } from './CertificatePanel';
import { TermReportPanel } from './TermReportPanel';
import { ReplayPanel } from './ReplayPanel';

// ============================================================
// Types
// ============================================================

type DashboardView =
  | 'overview'
  | 'analytics'
  | 'lessons'
  | 'schedule'
  | 'resources'
  | 'recordings'
  | 'agency'
  | 'students'
  | 'billing'
  | 'settings'
  | 'homework'
  | 'lesson-notes'
  | 'invoices'
  | 'student-progress'
  | 'recaps'
  | 'certificates'
  | 'reports'
  | 'replay';

// ============================================================
// Navigation Items
// ============================================================

interface NavItem {
  id: DashboardView;
  label: string;
  icon: React.ElementType;
  description: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

function getNavItems(tier: Tier, isAdmin: boolean): NavGroup[] {
  const common: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: Home, description: 'Dashboard overview' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Usage analytics & insights' },
    { id: 'lessons', label: 'My Lessons', icon: BookOpen, description: 'Active and past lessons' },
  ];

  const workspace: NavItem[] = [
    { id: 'schedule', label: 'Schedule', icon: Calendar, description: 'Upcoming & past lessons' },
    { id: 'recordings', label: 'Recordings', icon: Video, description: 'Lesson recordings' },
    { id: 'homework', label: 'Homework', icon: GraduationCap, description: 'Assignments & grading' },
    { id: 'lesson-notes', label: 'Lesson Notes', icon: FileText, description: 'Post-lesson notes & feedback' },
    { id: 'recaps', label: 'Recaps', icon: ClipboardList, description: 'Session recaps & review' },
    { id: 'certificates', label: 'Certificates', icon: Award, description: 'Issue achievement certificates' },
    { id: 'reports', label: 'Term Reports', icon: FileBarChart, description: 'Compile & send progress reports' },
    { id: 'replay', label: 'Replay', icon: Play, description: 'Watch past lesson replays' },
  ];

  const resources: NavItem[] = isAgencyTier(tier) ? [
    { id: 'resources', label: 'Resources', icon: FolderOpen, description: 'Saved boards, templates & library' },
    { id: 'invoices', label: 'Invoices', icon: Receipt, description: 'Billing invoices & payments' },
  ] : [
    { id: 'resources', label: 'Resources', icon: FolderOpen, description: 'Saved boards & templates' },
  ];

  const agency: NavItem[] = isAgencyTier(tier) ? [
    { id: 'agency', label: 'Agency', icon: Users, description: 'Sub-tutors & students' },
  ] : [];

  const account: NavItem[] = [
    { id: 'billing', label: 'Billing', icon: CreditCard, description: 'Subscription & payments' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Account preferences' },
  ];

  return [
    { group: 'Main', items: common },
    ...(workspace.length ? [{ group: 'Workspace', items: workspace }] : []),
    ...(resources.length ? [{ group: 'Resources', items: resources }] : []),
    ...(agency.length ? [{ group: 'Team', items: agency }] : []),
    { group: 'Account', items: account },
  ];
}

// ============================================================
// Settings Panel (extracted inline)
// ============================================================

function SettingsPanel({
  user,
  tier,
  tierLabel,
  tierColor,
  isAdmin,
  isDark,
  toggleDark,
  onClose,
}: {
  user: User;
  tier: Tier;
  tierLabel: string;
  tierColor: string;
  isAdmin: boolean;
  isDark: boolean;
  toggleDark: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Account Information */}
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Email</Label>
            <div className="h-11 rounded-xl bg-muted/50 border border-border px-3 flex items-center text-sm text-muted-foreground">{user.email || ''}</div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Plan</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`rounded-full px-3 py-0.5 font-medium ${tierColor}`}>{tierLabel}</Badge>
              <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => onClose()}>Change Plan</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-500" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
            </div>
            <button
              type="button"
              onClick={toggleDark}
              className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-emerald-500' : 'bg-gray-300'}`}
              aria-label="Toggle dark mode"
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          <Separator />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Need to change your email or password?</p>
            <a href="mailto:support@superboard.live" className="text-xs text-primary hover:underline mt-1 inline-block">Contact Support</a>
          </div>
          {isAdmin && (
            <>
              <Separator />
              <Button variant="outline" className="w-full rounded-xl" onClick={() => { window.location.href = '/?admin=1'; }}>
                <Shield className="w-4 h-4 mr-2" /> Open Admin Panel
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Main Export — AuthenticatedDashboard
// ============================================================
export function AuthenticatedDashboard({ user, userName, tierLoading, isAdmin }: { user: User; userName: string | null; tierLoading: boolean; isAdmin?: boolean }) {
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

  // ---- State ----
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dialog state
  const [showNewLesson, setShowNewLesson] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject>('GENERAL');
  const [creating, setCreating] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Settings state
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Onboarding state — show wizard to first-time users (no rooms yet)
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [roomsFetched, setRoomsFetched] = useState(false);
  const [hasRooms, setHasRooms] = useState(false);

  // Student mode toggle
  const [isStudentMode, setIsStudentMode] = useState(false);

  // Student progress drill-down state
  const [progressStudentId, setProgressStudentId] = useState<string | null>(null);
  const [progressStudentName, setProgressStudentName] = useState<string | null>(null);

  const { toast } = useToast();

  // ---- Check if user has any rooms (for onboarding) ----
  useEffect(() => {
    if (!user?.id) return;
    const checkRooms = async () => {
      try {
        const { authFetch } = await import('@/lib/auth-fetch');
        const res = await authFetch(`/api/room/list?tutorId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          const rooms = data.rooms ?? [];
          setHasRooms(rooms.length > 0);
          if (rooms.length === 0) {
            setShowOnboarding(true);
          }
        }
      } catch { /* silent — proceed to dashboard */ }
      setRoomsFetched(true);
    };
    checkRooms();
  }, [user?.id]);

  // ---- Dark mode ----
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('superboard-theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleDark = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('superboard-theme', next ? 'dark' : 'light');
  }, [isDark]);

  // ---- Fingerprint reporting ----
  useEffect(() => {
    import('@/lib/fingerprint').then(({ reportFingerprint }) => {
      if (user?.id) reportFingerprint(user.id).catch(console.error);
    });
  }, [user?.id]);

  // ---- Create lesson handler ----
  const handleCreateLesson = useCallback(async () => {
    setCreating(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase!.auth.getSession();
      const token = session?.access_token;
      if (!token) { setCreating(false); return; }
      const response = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tutorId: user?.id, subject: selectedSubject }),
      });
      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(`Failed to create room (${response.status}): ${errBody}`);
      }
      const data = await response.json();
      window.location.href = `/room/${data.roomId}`;
    } catch (error: any) {
      toast({ title: 'Failed to create lesson', description: error?.message || 'Please try again.', variant: 'destructive' });
      setCreating(false);
    }
  }, [selectedSubject, user?.id, toast]);

  // ---- Save brand color handler ----
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

  // ---- Logout handler ----
  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setTier('FREE');
    window.location.href = '/';
  }, [setTier]);

  // ---- Onboarding complete handler ----
  const handleOnboardingComplete = useCallback((roomId: string) => {
    setShowOnboarding(false);
    setHasRooms(true);
    window.location.href = `/room/${roomId}`;
  }, []);

  const handleOnboardingSkip = useCallback(() => {
    setShowOnboarding(false);
    setHasRooms(false);
  }, []);

  // ---- Template gallery handler ----
  const handleTemplateSelect = useCallback((template: TemplateInfo) => {
    setShowTemplateGallery(false);
    setSelectedSubject(template.subject);
    setShowNewLesson(true);
  }, []);

  // ---- Derived values ----
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

  const navGroups = getNavItems(tier, !!isAdmin);

  // ---- Show onboarding for first-time users ----
  if (showOnboarding && roomsFetched) {
    return (
      <OnboardingWizard
        userId={user.id}
        userEmail={user.email || ''}
        userName={userName}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  // ---- Show student dashboard if in student mode ----
  if (isStudentMode) {
    return (
      <StudentDashboard
        userId={user.id}
        userName={userName}
        userEmail={user.email || null}
      />
    );
  }

  // ============================================================
  // RENDER — Dashboard with Sidebar
  // ============================================================
  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background flex">
        {/* ============================================================
            SIDEBAR — Collapsible on desktop, sheet on mobile
            ============================================================ */}
        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-50 lg:z-30
            h-screen flex flex-col
            bg-card border-r border-border
            transition-all duration-300 ease-in-out
            ${sidebarCollapsed ? 'w-[68px]' : 'w-64'}
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Sidebar Header / Logo */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="text-sm font-bold tracking-tight truncate">{agencyName || 'Superboard'}</h1>
                </div>
              )}
            </div>
            {/* Mobile close */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 shrink-0"
              aria-label="Close sidebar"
              onClick={() => setMobileMenuOpen(false)}
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-3 custom-scrollbar">
            {navGroups.map((group, gi) => (
              <div key={group.group} className={gi > 0 ? 'mt-4' : ''}>
                {!sidebarCollapsed && (
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1.5">
                    {group.group}
                  </p>
                )}
                {group.items.map((item) => {
                  const isActive = activeView === item.id;
                  const Icon = item.icon;
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            setActiveView(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`
                            w-full flex items-center gap-2.5 rounded-xl text-sm font-medium
                            transition-all duration-150
                            ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                            ${isActive
                              ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }
                          `}
                        >
                          <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                          {!sidebarCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                          {isActive && !sidebarCollapsed && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          )}
                        </button>
                      </TooltipTrigger>
                      {sidebarCollapsed && (
                        <TooltipContent side="right" className="text-xs font-medium">
                          {item.description}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Templates Button — opens Template Gallery dialog */}
          <div className="px-3 pb-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowTemplateGallery(true)}
                  className={`
                    w-full flex items-center gap-2.5 rounded-xl text-sm font-medium
                    transition-all duration-150
                    ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                    text-muted-foreground hover:bg-muted/50 hover:text-foreground
                  `}
                >
                  <LayoutTemplate className="w-4.5 h-4.5 shrink-0 text-gray-400" />
                  {!sidebarCollapsed && (
                    <span className="truncate">Templates</span>
                  )}
                </button>
              </TooltipTrigger>
              {sidebarCollapsed && (
                <TooltipContent side="right" className="text-xs font-medium">
                  Browse pre-built templates
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* Sidebar Footer — Collapse toggle + User info */}
          <div className="border-t border-border/50 px-3 py-3 shrink-0">
            {/* Collapse toggle (desktop only) */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex w-full items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted/50 hover:text-muted-foreground transition-colors mb-2"
            >
              {sidebarCollapsed ? <PanelLeft className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>

            {/* User email + tier */}
            <div className={`flex items-center gap-2.5 rounded-xl px-2 py-2 bg-muted/50 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(userName || user.email || '?').charAt(0).toUpperCase()}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{userName || user.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ============================================================
            MAIN CONTENT AREA
            ============================================================ */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top Bar */}
          <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/60">
            <div className="flex items-center justify-between px-4 sm:px-6 h-14">
              <div className="flex items-center gap-3">
                {/* Mobile menu toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-9 w-9 rounded-xl"
                  aria-label="Open sidebar"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <PanelLeft className="w-4 h-4" />
                </Button>
                {/* View title */}
                <h2 className="text-base font-semibold text-foreground">
                  {navGroups.flatMap(g => g.items).find(i => i.id === activeView)?.label || 'Dashboard'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Quick create button */}
                <Button
                  className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all text-xs h-9 px-3"
                  onClick={() => setShowNewLesson(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span className="hidden sm:inline">New Lesson</span>
                </Button>
                {/* Tier badge */}
                {!tierLoading && (
                  <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 font-medium text-[11px] ${tierColor}`}>
                    {isAgencyTier(tier) && <Crown className="w-3 h-3 mr-0.5" />}
                    {tierLabel}
                  </Badge>
                )}
                {/* Sign out */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  onClick={() => setShowSignOutConfirm(true)}
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">
            {/* ============================================================
                VIEW: Overview
                ============================================================ */}
            {activeView === 'overview' && (
              <div className="space-y-6">
                {/* Welcome Banner */}
                <div className="rounded-2xl gradient-hero p-5 sm:p-7 animate-fade-in-up">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                        Welcome back! {userName || user.user_metadata?.name || user.email?.split('@')[0]}
                      </h2>
                      <p className="text-gray-600 mt-1.5 max-w-xl text-sm sm:text-base">
                        Create interactive lessons with smart tools, video calling, and real-time collaboration.
                      </p>
                      <div className="flex items-center gap-3 mt-4">
                        <Button className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all text-sm" onClick={() => setShowNewLesson(true)}>
                          <Plus className="w-4 h-4 mr-1.5" />Create a Lesson
                        </Button>
                        <p className="text-sm text-gray-600">or use quick start below</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl p-5 text-white stat-gradient-sparkles shadow-lg shadow-emerald-500/15 card-hover animate-fade-in-up">
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-white/80" /><span className="text-xs font-medium text-white/80">Smart Credits</span></div>
                      <div className="text-2xl sm:text-3xl font-bold mt-1">{aiCreditsUsed}{aiCreditsLimit !== Infinity ? ` / ${aiCreditsLimit}` : ' / \u221E'}</div>
                      {aiCreditsLimit !== Infinity && <Progress value={(aiCreditsUsed / aiCreditsLimit) * 100} className="mt-2 h-1.5 bg-white/20 [&>div]:bg-white/90" />}
                    </div>
                  </div>
                  <div className="rounded-2xl p-5 text-white stat-gradient-video shadow-lg shadow-sky-500/15 card-hover animate-fade-in-up-delay-1">
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-1"><Video className="w-4 h-4 text-white/80" /><span className="text-xs font-medium text-white/80">Video Minutes</span></div>
                      <div className="text-2xl sm:text-3xl font-bold mt-1">{videoMinutesUsed}{videoMinutesLimit !== Infinity ? ` / ${videoMinutesLimit}` : ' / \u221E'}</div>
                      {videoMinutesLimit !== Infinity && <Progress value={(videoMinutesUsed / videoMinutesLimit) * 100} className="mt-2 h-1.5 bg-white/20 [&>div]:bg-white/90" />}
                    </div>
                  </div>
                  <div className="rounded-2xl p-5 text-white stat-gradient-recordings shadow-lg shadow-emerald-500/15 card-hover animate-fade-in-up-delay-2">
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4 text-white/80" /><span className="text-xs font-medium text-white/80">Recordings</span></div>
                      <div className="text-2xl sm:text-3xl font-bold mt-1">{recordingsUsed}{recordingsLimit !== Infinity ? ` / ${recordingsLimit}` : ''}</div>
                      <p className="text-xs text-white/70 mt-1.5">{tier === 'FREE' ? 'Requires Pro' : tier === 'PRO' ? `${recordingsLimit} per month` : 'Unlimited'}</p>
                    </div>
                  </div>
                </div>

                {/* My Lessons + Quick Start Grid */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* My Lessons */}
                  <div className="flex-1 animate-fade-in-up-delay-1">
                    <MyRoomsPanel
                      userId={user.id}
                      onCreateLesson={() => setShowNewLesson(true)}
                    />
                  </div>

                  {/* Quick Start */}
                  <div className="lg:w-64 flex-shrink-0 animate-fade-in-up-delay-2">
                    <Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" />Quick Start</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1.5">
                        {(['MATH', 'SCIENCE', 'LANGUAGE', 'GENERAL'] as Subject[]).map((subj) => {
                          const meta = subjectMeta[subj];
                          return (
                            <button key={subj} onClick={() => { setSelectedSubject(subj); setShowNewLesson(true); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-emerald-50 transition-colors group">
                              <div className={`w-8 h-8 rounded-lg ${meta.gradient} flex items-center justify-center shadow-sm`}><meta.icon className="w-4 h-4 text-white" /></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{meta.label}</p>
                                <p className="text-[10px] text-muted-foreground">Quick start</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Student Mode Toggle */}
                {!isAgencyTier(tier) && (
                  <Card className="rounded-2xl border border-dashed border-gray-300 bg-gradient-to-r from-emerald-50/30 to-teal-50/30 animate-fade-in-up-delay-3">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-card-foreground">Student View</p>
                            <p className="text-xs text-muted-foreground">Switch to a simplified view for joining lessons</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl text-xs"
                          onClick={() => setIsStudentMode(true)}
                        >
                          Switch to Student View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ============================================================
                VIEW: Lessons (full page rooms list)
                ============================================================ */}
            {activeView === 'lessons' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">All Lessons</h3>
                    <p className="text-sm text-muted-foreground">Manage your active and past lessons</p>
                  </div>
                  <Button className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-md shadow-emerald-500/20 text-sm" onClick={() => setShowNewLesson(true)}>
                    <Plus className="w-4 h-4 mr-1.5" />New Lesson
                  </Button>
                </div>
                <MyRoomsPanel userId={user.id} onCreateLesson={() => setShowNewLesson(true)} />
              </div>
            )}

            {/* ============================================================
                VIEW: Resources (Saved Boards + Templates)
                ============================================================ */}
            {activeView === 'resources' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-lg font-bold">Resources</h3>
                  <p className="text-sm text-muted-foreground">Your saved boards, templates, and shared library</p>
                </div>
                {isAgencyTier(tier) ? (
                <Tabs defaultValue="boards" className="w-full">
                  <TabsList className="bg-muted rounded-xl p-1 h-auto">
                    <TabsTrigger value="boards" className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium text-sm">
                      <BookOpen className="w-4 h-4" />Saved Boards
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium text-sm">
                      <LayoutTemplate className="w-4 h-4" />Templates
                    </TabsTrigger>
                    <TabsTrigger value="library" className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium text-sm">
                      <FolderOpen className="w-4 h-4" />Shared Library
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="boards" className="mt-6">
                    <SavedBoardsPanel userId={user?.id || ''} tier={tier} />
                  </TabsContent>
                  <TabsContent value="templates" className="mt-6">
                    <TemplatesPanel userId={user?.id || ''} tier={tier} />
                  </TabsContent>
                  <TabsContent value="library" className="mt-6">
                    <ResourceLibraryPanel agencyId={user?.id || ''} userId={user?.id || ''} />
                  </TabsContent>
                </Tabs>
                ) : (
                <Tabs defaultValue="boards" className="w-full">
                  <TabsList className="bg-muted rounded-xl p-1 h-auto">
                    <TabsTrigger value="boards" className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium text-sm">
                      <BookOpen className="w-4 h-4" />Saved Boards
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium text-sm">
                      <LayoutTemplate className="w-4 h-4" />Templates
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="boards" className="mt-6">
                    <SavedBoardsPanel userId={user?.id || ''} tier={tier} />
                  </TabsContent>
                  <TabsContent value="templates" className="mt-6">
                    <TemplatesPanel userId={user?.id || ''} tier={tier} />
                  </TabsContent>
                </Tabs>
                )}
              </div>
            )}

            {/* ============================================================
                VIEW: Analytics
                ============================================================ */}
            {activeView === 'analytics' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-lg font-bold">Analytics</h3>
                  <p className="text-sm text-muted-foreground">Usage analytics and insights across your lessons</p>
                </div>
                <AnalyticsPanel userId={user.id} />
              </div>
            )}

            {/* ============================================================
                VIEW: Schedule
                ============================================================ */}
            {activeView === 'schedule' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-lg font-bold">Schedule</h3>
                  <p className="text-sm text-muted-foreground">Upcoming and past scheduled lessons</p>
                </div>
                <SchedulePanel userId={user.id} />
              </div>
            )}

            {/* ============================================================
                VIEW: Recordings
                ============================================================ */}
            {activeView === 'recordings' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-lg font-bold">Recordings</h3>
                  <p className="text-sm text-muted-foreground">Playback and download lesson recordings</p>
                </div>
                <RecordingsPanel userId={user.id} tier={tier} />
              </div>
            )}

            {/* ============================================================
                VIEW: Homework
                ============================================================ */}
            {activeView === 'homework' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-lg font-bold">Homework</h3>
                  <p className="text-sm text-muted-foreground">Assign, track, and grade student homework</p>
                </div>
                <HomeworkPanel userId={user.id} agencyId={user?.id || ''} userTier={tier} />
              </div>
            )}

            {/* ============================================================
                VIEW: Lesson Notes
                ============================================================ */}
            {activeView === 'lesson-notes' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-lg font-bold">Lesson Notes</h3>
                  <p className="text-sm text-muted-foreground">Post-lesson notes, feedback, and topics for next session</p>
                </div>
                <LessonNotesPanel userId={user.id} />
              </div>
            )}

            {/* ============================================================
                VIEW: Recaps
                ============================================================ */}
            {activeView === 'recaps' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-lg font-bold">Session Recaps</h3>
                  <p className="text-sm text-muted-foreground">Auto-drafted after each lesson. Review, edit, and approve to make them available for term reports.</p>
                </div>
                <RecapPanel />
              </div>
            )}

            {/* ============================================================
                VIEW: Certificates
                ============================================================ */}
            {activeView === 'certificates' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-lg font-bold">Certificates</h3>
                  <p className="text-sm text-muted-foreground">Issue printable, branded achievement certificates for your students.</p>
                </div>
                <CertificatePanel />
              </div>
            )}

            {/* ============================================================
                VIEW: Term Reports
                ============================================================ */}
            {activeView === 'reports' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-lg font-bold">Term Reports</h3>
                  <p className="text-sm text-muted-foreground">Compile approved session recaps into a polished, branded PDF for parents.</p>
                </div>
                <TermReportPanel />
              </div>
            )}

            {/* ============================================================
                VIEW: Replay
                ============================================================ */}
            {activeView === 'replay' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-lg font-bold">Lesson Replay</h3>
                  <p className="text-sm text-muted-foreground">Watch past lessons unfold — the drawing, the writing, exactly as it happened.</p>
                </div>
                <ReplayPanel />
              </div>
            )}

            {/* ============================================================
                VIEW: Agency (Sub-tutors + Students)
                ============================================================ */}
            {activeView === 'agency' && isAgencyTier(tier) && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-lg font-bold">Agency Management</h3>
                  <p className="text-sm text-muted-foreground">Manage your sub-tutors, student roster, and usage</p>
                </div>
                <AgencyAdminPanel agencyUserId={user?.id || ''} userTier={tier} />
              </div>
            )}

            {/* ============================================================
                VIEW: Invoices
                ============================================================ */}
            {activeView === 'invoices' && isAgencyTier(tier) && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-lg font-bold">Invoices</h3>
                  <p className="text-sm text-muted-foreground">Create and manage invoices for your students</p>
                </div>
                <InvoicePanel agencyId={user?.id || ''} userId={user?.id || ''} />
              </div>
            )}

            {/* ============================================================
                VIEW: Student Profile (full page, replaces old StudentProgressPanel)
                ============================================================ */}
            {activeView === 'student-progress' && progressStudentId && (
              <div className="space-y-6 animate-fade-in-up">
                <StudentProfilePanel
                  studentId={progressStudentId}
                  studentName={progressStudentName || ''}
                  onBack={() => { setProgressStudentId(null); setProgressStudentName(null); setActiveView('students'); }}
                />
              </div>
            )}

            {/* ============================================================
                VIEW: Billing
                ============================================================ */}
            {activeView === 'billing' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-lg font-bold">Billing & Subscription</h3>
                  <p className="text-sm text-muted-foreground">Manage your plan, payments, and branding</p>
                </div>
                <BillingPanel
                  tier={tier}
                  brandColor={brandColor || ''}
                  setBrandColor={setBrandColor}
                  onSaveBrandColor={handleSaveBrandColor}
                />
              </div>
            )}

            {/* ============================================================
                VIEW: Settings
                ============================================================ */}
            {activeView === 'settings' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h3 className="text-lg font-bold">Settings</h3>
                  <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
                </div>
                <SettingsPanel
                  user={user}
                  tier={tier}
                  tierLabel={tierLabel}
                  tierColor={tierColor}
                  isAdmin={!!isAdmin}
                  isDark={isDark}
                  toggleDark={toggleDark}
                  onClose={() => setActiveView('billing')}
                />
              </div>
            )}
          </main>
        </div>

        {/* ============================================================
            DIALOGS (shared across views)
            ============================================================ */}

        {/* New Lesson Dialog */}
        <Dialog open={showNewLesson} onOpenChange={setShowNewLesson}>
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

        {/* Sign Out Confirmation Dialog */}
        <AlertDialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
              <AlertDialogDescription>You will need to sign in again to access your lessons and boards.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white">Sign Out</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Template Gallery Dialog */}
        <TemplateGallery
          open={showTemplateGallery}
          onOpenChange={setShowTemplateGallery}
          onSelectTemplate={handleTemplateSelect}
        />
      </div>
    </TooltipProvider>
  );
}
