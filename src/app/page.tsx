// ============================================================
// K-12 AI Superboard — Landing Page + Dashboard
// ============================================================
// Unauthenticated visitors see a marketing landing page.
// Authenticated tutors see the full dashboard.
// ============================================================

'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { useCredits } from '@/hooks/useCredits';
import { useTheme } from '@/hooks/useTheme';
import { createClient } from '@/lib/supabase';
import { authFetch, initAuthFetch } from '@/lib/auth-fetch';
import { TIER_LIMITS } from '@/types';
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
  LogOut,
  Calculator,
  FlaskConical,
  Languages,
  ClipboardList,
  Zap,
  Star,
  Crown,
  TrendingUp,
  Play,
  ArrowRight,
  Check,
  Monitor,
  Brain,
  Mic,
  PenTool,
  Download,
  Shield,
  MousePointerClick,
} from 'lucide-react';
import type { Subject, Tier } from '@/types';
import type { User } from '@supabase/supabase-js';

// ============================================================
// Shared subject metadata
// ============================================================
const subjectMeta: Record<string, { icon: React.ElementType; gradient: string; emoji: string; label: string }> = {
  MATH: { icon: Calculator, gradient: 'stat-gradient-sparkles', emoji: '\u{1F4D0}', label: 'Mathematics' },
  SCIENCE: { icon: FlaskConical, gradient: 'stat-gradient-video', emoji: '\u{1F52C}', label: 'Science' },
  LANGUAGE: { icon: Languages, gradient: 'stat-gradient-recordings', emoji: '\u270D\uFE0F', label: 'Language' },
  GENERAL: { icon: ClipboardList, gradient: 'stat-gradient-sparkles', emoji: '\u{1F4CB}', label: 'General' },
};

// ============================================================
// MAIN EXPORT — Auth Gate → Landing or Dashboard
// ============================================================
export default function Dashboard() {
  const { tier, setTier, setRoom } = useAppStore();
  const { brandColor, agencyName, setBrandColor } = useTheme();
  const {
    aiCreditsUsed,
    aiCreditsLimit,
    videoMinutesUsed,
    videoMinutesLimit,
    loading: usageLoading,
  } = useCredits(null);

  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tierLoading, setTierLoading] = useState(true);

  // --- Auth check on mount ---
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setAuthLoading(false); return; }

    // Initialize auth fetch token caching
    initAuthFetch();

    let mounted = true;

    // Listen for auth state changes FIRST to catch any race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (!mounted) return;
      const user = session?.user ?? null;
      setUser(user);
      if (user) {
        try {
          const tierRes = await authFetch(`/api/auth/profile?userId=${user.id}`);
          if (tierRes.ok) {
            const profileData = await tierRes.json();
            if (profileData.tier) setTier(profileData.tier as Tier);
            if (profileData.name) setUserName(profileData.name);
          }
        } catch { /* ignore */ }
      }
      setAuthLoading(false);
      setTierLoading(false);
    });

    // Then check for existing session
    supabase.auth.getUser().then(async ({ data: { user } }: any) => {
      if (!mounted) return;
      if (user) {
        setUser(user);
        try {
          const tierRes = await authFetch(`/api/auth/profile?userId=${user.id}`);
          if (tierRes.ok) {
            const profileData = await tierRes.json();
            if (profileData.tier) setTier(profileData.tier as Tier);
            if (profileData.name) setUserName(profileData.name);
          }
        } catch { /* ignore */ }
      }
      setAuthLoading(false);
      setTierLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- Loading state ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-pulse-glow">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading Superboard...</p>
        </div>
      </div>
    );
  }

  // --- Not logged in → Show Landing Page ---
  if (!user) {
    return <LandingPage />;
  }

  // --- Logged in → Show Dashboard ---
  return <AuthenticatedDashboard user={user} userName={userName} tierLoading={tierLoading} />;
}

// ============================================================
// LANDING PAGE — Marketing / Auth Gate
// ============================================================
function LandingPage() {
  const { setTier } = useAppStore();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    try {
      const supabase = createClient();
      if (!supabase) { setAuthError('Authentication is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'); return; }
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (error) { setAuthError(error.message); return; }
      initAuthFetch(); // Refresh token cache after login
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        try {
          const tierRes = await authFetch(`/api/auth/profile?userId=${u.id}`);
          if (tierRes.ok) { const d = await tierRes.json(); if (d.tier) setTier(d.tier as Tier); }
        } catch { /* ignore */ }
      }
      setLoginEmail(''); setLoginPassword('');
      closeAuth(); // Close the login dialog on success
    } catch { setAuthError('Network error'); }
  }, [loginEmail, loginPassword, setTier]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    try {
      const supabase = createClient();
      if (!supabase) { setAuthError('Authentication is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'); return; }
      const { data, error } = await supabase.auth.signUp({ email: registerEmail, password: registerPassword });
      if (error) { setAuthError(error.message); return; }
      if (data.user && data.session) {
        try { await authFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ id: data.user.id, email: registerEmail }) }); } catch { /* */ }
      } else {
        setAuthMessage('Check your email for a confirmation link.');
      }
      setRegisterEmail(''); setRegisterPassword('');
    } catch { setAuthError('Network error'); }
  }, [registerEmail, registerPassword]);

  const closeAuth = () => { setShowAuth(null); setAuthError(''); setAuthMessage(''); };

  return (
    <main className="min-h-screen bg-white">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-emerald-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">Superboard</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-sm font-medium text-gray-700 hover:text-gray-900 hidden sm:inline-flex" onClick={() => setShowAuth('login')}>
              Sign In
            </Button>
            <Button className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm px-5" onClick={() => setShowAuth('register')}>
              Get Started Free
            </Button>
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="md:hidden border-t border-gray-200 bg-white px-6 py-4 space-y-3 animate-fade-in-up">
            <a href="#features" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#pricing" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <Button variant="ghost" className="text-sm font-medium text-gray-700 justify-start" onClick={() => { setShowAuth('login'); setMobileMenuOpen(false); }}>Sign In</Button>
              <Button className="w-full rounded-xl gradient-primary border-0 text-white font-semibold text-sm" onClick={() => { setShowAuth('register'); setMobileMenuOpen(false); }}>Get Started Free</Button>
            </div>
          </div>
        )}
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-white">
        {/* Subtle grid — no blur blobs */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.035]" style={{ backgroundImage: 'radial-gradient(circle, #059669 0.6px, transparent 0.6px)', backgroundSize: '24px 24px' }} />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-6 animate-fade-in-up">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700">Smart Tutoring Platform</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight text-gray-900 animate-fade-in-up">
                Turn Every Lesson Into an{' '}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-500 bg-clip-text text-transparent">
                  Interactive Experience
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-600 leading-relaxed animate-fade-in-up-delay-1">
                The all-in-one whiteboard that combines real-time collaboration, instant quiz and worksheet generation, built-in video calling, and GeoGebra graphing — designed for tutors who want to teach better, not harder.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 animate-fade-in-up-delay-2">
                <Button size="lg" className="h-[52px] rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-[15px] px-7" onClick={() => setShowAuth('register')}>
                  Start Teaching for Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="h-[52px] rounded-xl border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all text-[15px] px-7" onClick={() => { document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  See How It Works
                  <Play className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Social proof */}
              <div className="mt-10 flex items-center gap-6 animate-fade-in-up-delay-3">
                <div className="flex -space-x-2">
                  {['bg-emerald-400', 'bg-sky-400', 'bg-emerald-400', 'bg-amber-400'].map((bg, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-white flex items-center justify-center text-white text-[10px] font-bold`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">2,000+ tutors</p>
                  <p className="text-xs text-gray-500">already teaching on Superboard</p>
                </div>
              </div>
            </div>

            {/* Right: Hero Visual — Interactive whiteboard mockup */}
            <div className="relative animate-fade-in-up-delay-1">
              <div className="relative rounded-2xl bg-gray-50 border border-gray-200 shadow-2xl shadow-emerald-500/10 overflow-hidden">
                {/* Fake toolbar */}
                <div className="bg-white border-b border-gray-100 px-4 py-2.5 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="ml-3 flex-1 h-6 rounded-lg bg-gray-100 flex items-center px-3">
                    <span className="text-[10px] text-gray-500 font-medium">superboard.app/room/abc123</span>
                  </div>
                </div>
                {/* Mock whiteboard content */}
                <div className="p-6 bg-white min-h-[320px] relative">
                  {/* Grid background */}
                  <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                  {/* Mock math equation */}
                  <div className="relative z-10 flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-md">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                      <p className="text-xs font-medium text-emerald-600 mb-1">Smart Generated</p>
                      <p className="text-sm text-gray-700 font-medium">Solve for x: 3x + 7 = 22</p>
                      <p className="text-sm text-gray-500 mt-1">x = 5 (subtract 7, divide by 3)</p>
                    </div>
                  </div>

                  {/* Mock graph */}
                  <div className="relative z-10 bg-sky-50 rounded-xl p-4 border border-sky-100 mb-6">
                    <p className="text-xs font-medium text-sky-600 mb-2">GeoGebra Graph</p>
                    <svg viewBox="0 0 200 80" className="w-full h-20">
                      <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="0.5" />
                      <line x1="100" y1="10" x2="100" y2="70" stroke="#94a3b8" strokeWidth="0.5" />
                      <path d="M 20 65 Q 60 60 100 35 Q 140 10 180 20" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="100" cy="35" r="3" fill="#0ea5e9" />
                    </svg>
                  </div>

                  {/* Mock shapes */}
                  <div className="relative z-10 flex gap-3">
                    <div className="w-16 h-16 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-sm bg-emerald-300 rotate-45" />
                    </div>
                    <div className="w-16 h-16 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-amber-300" />
                    </div>
                    <div className="w-16 h-16 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-b-[28px] border-l-transparent border-r-transparent border-b-rose-300" />
                    </div>
                  </div>

                  {/* Floating video PiP */}
                  <div className="absolute bottom-4 right-4 w-24 h-16 rounded-lg bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden z-20">
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center">
                      <Video className="w-5 h-5 text-white/80" />
                    </div>
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg px-4 py-3 border border-gray-100 animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Quiz Generated</p>
                    <p className="text-[10px] text-gray-500">5 questions in 2.3s</p>
                  </div>
                </div>
              </div>
              {/* Floating badge 2 */}
              <div className="absolute -top-3 -right-3 bg-white rounded-xl shadow-lg px-4 py-3 border border-gray-100 animate-float-delay">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Smart Tools Active</p>
                    <p className="text-[10px] text-gray-500">Ready</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF BAR ===== */}
      <section className="border-y border-gray-100 bg-gray-50/50 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '2,000+', label: 'Active Tutors', sub: 'and growing' },
              { value: '50,000+', label: 'Lessons Taught', sub: 'on Superboard' },
              { value: '4.9/5', label: 'Average Rating', sub: 'from tutor reviews' },
              { value: '< 2s', label: 'Response Time', sub: 'for quiz generation' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{stat.label}</p>
                <p className="text-xs text-gray-500">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 mb-4">
              <Zap className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-xs font-semibold text-sky-700">Everything You Need</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
              One whiteboard.{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-sky-500 bg-clip-text text-transparent">Endless possibilities.</span>
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              With dedicated K-12 support and tools for every subject, grade level, and learning style.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: 'Smart Quiz & Worksheet Generator', desc: 'Generate topic-specific quizzes, worksheets, and step-by-step solutions in seconds. Supports every subject and grade level.', color: 'emerald' },
              { icon: Monitor, title: 'Real-Time Collaborative Whiteboard', desc: 'Unlimited canvas with shape tools, handwriting, sticky notes, and real-time cursor sync. Students see your strokes instantly.', color: 'sky' },
              { icon: Video, title: 'Built-In Video Calling', desc: 'No need for Zoom or Meet. Face-to-face video with PiP mode so you can teach and see your student at the same time.', color: 'emerald' },
              { icon: Calculator, title: 'GeoGebra Math Tools', desc: 'Interactive graphing calculator, function plotting, sliders for parameters, and geometry constructions — all inside the board.', color: 'amber' },
              { icon: PenTool, title: 'Subject-Specific Toolkits', desc: 'Math rulers & protractors, science lab diagrams, language annotations & mind maps. Switch toolkits based on your subject.', color: 'rose' },
              { icon: Download, title: 'Branded PDF Exports', desc: 'Export your lesson as a beautiful PDF with your agency branding, logo, and student name. Perfect for record-keeping.', color: 'teal' },
            ].map((feature) => {
              const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
                emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
                sky: { bg: 'bg-sky-50', text: 'text-sky-600', iconBg: 'bg-sky-100' },
                amber: { bg: 'bg-amber-50', text: 'text-amber-600', iconBg: 'bg-amber-100' },
                rose: { bg: 'bg-rose-50', text: 'text-rose-600', iconBg: 'bg-rose-100' },
                teal: { bg: 'bg-teal-50', text: 'text-teal-600', iconBg: 'bg-teal-100' },
              };
              const c = colorMap[feature.color];
              return (
                <div key={feature.title} className={`group rounded-2xl ${c.bg} border border-transparent hover:border-gray-200 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                  <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-6 h-6 ${c.text}`} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 md:py-28 bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-4">
              <MousePointerClick className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">Simple Setup</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
              Start teaching in{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">under 60 seconds</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create a Room', desc: 'Pick a subject and click "Start Lesson." Share the room link with your student — no sign-up required for them.', icon: Plus },
              { step: '02', title: 'Teach & Collaborate', desc: 'Draw, write, use smart tools, graph functions, and talk face-to-face. Everything happens on one infinite canvas.', icon: Monitor },
              { step: '03', title: 'Save & Share', desc: 'Export branded PDFs, save board templates, and review recordings. Your students get a polished takeaway.', icon: Download },
            ].map((item) => (
              <div key={item.step} className="relative text-center group">
                {/* Step number */}
                <div className="text-6xl font-black text-gray-100 group-hover:text-emerald-100 transition-colors duration-300 mb-4">{item.step}</div>
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 mb-5 -mt-10 relative z-10">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
              Loved by tutors{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-rose-500 bg-clip-text text-transparent">everywhere</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah M.', role: 'Math Tutor, 8 years', quote: 'The quiz generator saves me 30 minutes per lesson. My students love the instant feedback and the interactive graphs.', color: 'emerald' },
              { name: 'David K.', role: 'Science Tutor, 5 years', quote: 'Having video, whiteboard, and smart tools in one place means zero app-switching. It just works. My students are more engaged than ever.', color: 'sky' },
              { name: 'Priya R.', role: 'Language Tutor, 12 years', quote: 'The mind map tool and annotation features are perfect for essay planning. The branded PDFs make me look incredibly professional.', color: 'rose' },
            ].map((t) => {
              const colorClasses: Record<string, { bg: string; text: string }> = {
                emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
                sky: { bg: 'bg-sky-100', text: 'text-sky-600' },
                rose: { bg: 'bg-rose-100', text: 'text-rose-600' },
                amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
                violet: { bg: 'bg-violet-100', text: 'text-violet-600' },
              };
              const colors = colorClasses[t.color] || colorClasses.emerald;
              return (
              <div key={t.name} className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center ${colors.text} font-bold text-sm`}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-20 md:py-28 bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-500">Start free. Upgrade when you&apos;re ready.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Free', price: '$0', period: 'forever', desc: 'Perfect for trying out Superboard', features: ['25 smart credits/week', 'Basic whiteboard tools', '1 active room', 'Student join via link'], cta: 'Get Started', ctaStyle: 'outline', badge: null },
              { name: 'Pro Tutor', price: '$10', period: '/month', desc: 'For serious tutors who want more', features: ['500 smart credits/month', 'Unlimited rooms & templates', 'Built-in video calling', 'GeoGebra & Mathpix', '2 recordings/month', 'Save/Load & PDF export'], cta: 'Start Free Trial', ctaStyle: 'primary', badge: 'Most Popular' },
              { name: 'Agency', price: '$39', period: '/month + per student', desc: 'For tutoring centers & teams', features: ['$39/mo base fee', 'Up to 5 sub-tutors included', 'White-label branding', 'Custom domains', 'Unlimited recordings', 'Admin dashboard & analytics'], cta: 'Contact Sales', ctaStyle: 'outline', badge: 'Best Value' },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl bg-white p-6 md:p-8 relative ${plan.ctaStyle === 'primary' ? 'border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 scale-[1.02]' : 'border border-gray-200 shadow-sm hover:shadow-md'} transition-shadow duration-300`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full text-white ${plan.ctaStyle === 'primary' ? 'bg-emerald-500' : 'bg-amber-500'}`}>{plan.badge}</span>
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{plan.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-6 rounded-xl font-semibold transition-all ${plan.ctaStyle === 'primary' ? 'gradient-primary border-0 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setShowAuth('register')}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-[0.03]" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <GraduationCap className="w-14 h-14 mx-auto mb-6 text-emerald-500" />
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
            Ready to transform your tutoring?
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
            Join thousands of tutors who&apos;ve made their lessons more engaging, more productive, and more fun with Superboard.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-[52px] rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-[15px] px-8" onClick={() => setShowAuth('register')}>
              Create Your Free Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <p className="mt-4 text-xs text-gray-500">No credit card required. Set up in under 60 seconds.</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Superboard</span>
          </div>
          <p className="text-xs text-gray-500">&copy; 2025 Superboard. Built for tutors, by tutors.</p>
          <div className="flex gap-6">
            <a href="#pricing" className="text-xs text-gray-500 hover:text-gray-600 transition-colors">Pricing</a>
            <a href="#features" className="text-xs text-gray-500 hover:text-gray-600 transition-colors">Features</a>
            <a href="mailto:hello@superboard.app" className="text-xs text-gray-500 hover:text-gray-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* ===== AUTH DIALOG ===== */}
      <Dialog open={showAuth !== null} onOpenChange={(open) => { if (!open) closeAuth(); }}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{showAuth === 'login' ? 'Sign In' : 'Create Account'}</DialogTitle>
          {/* Gradient header */}
          <div className="gradient-primary px-6 pt-8 pb-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/90 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {showAuth === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-white/70 mt-1">
              {showAuth === 'login' ? 'Sign in to your tutor dashboard' : 'Start teaching in under 60 seconds'}
            </p>
          </div>

          <div className="px-6 pb-6 pt-4">
            {/* Tab switcher */}
            <div className="flex mb-5 rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => { setShowAuth('login'); setAuthError(''); setAuthMessage(''); }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${showAuth === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setShowAuth('register'); setAuthError(''); setAuthMessage(''); }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${showAuth === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                Register
              </button>
            </div>

            {authError && (
              <div role="alert" className="rounded-lg bg-rose-50 border border-rose-100 px-4 py-3 mb-4">
                <p className="text-sm text-rose-600">{authError}</p>
              </div>
            )}
            {authMessage && (
              <div aria-live="polite" className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 mb-4">
                <p className="text-sm text-emerald-600">{authMessage}</p>
              </div>
            )}

            {showAuth === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                  <Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                  <Input id="login-password" type="password" placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className="h-11 rounded-xl" />
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25">
                  Sign In
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email" className="text-sm font-medium">Email</Label>
                  <Input id="reg-email" type="email" placeholder="you@example.com" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-password" className="text-sm font-medium">Password</Label>
                  <Input id="reg-password" type="password" placeholder="Min. 6 characters" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required minLength={6} className="h-11 rounded-xl" />
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25">
                  Create Free Account
                </Button>
              </form>
            )}

            <p className="text-center text-[11px] text-gray-500 mt-4">
              {showAuth === 'register' ? 'No credit card required' : 'Forgot password? Contact support'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

// ============================================================
// AUTHENTICATED DASHBOARD
// ============================================================
function AuthenticatedDashboard({ user, userName, tierLoading }: { user: User; userName: string | null; tierLoading: boolean }) {
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
      // Directly get session token from Supabase client
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

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setTier('FREE');
  }, [setTier]);

  const tierLabel = tier === 'AGENCY' ? 'Agency' : tier === 'PRO' ? 'Pro' : 'Free';
  const tierColor =
    tier === 'AGENCY' ? 'bg-amber-100 text-amber-800' : tier === 'PRO' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-50 text-teal-700';

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
                {tier === 'AGENCY' && <Crown className="w-3 h-3 mr-1" />}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Banner — sharp gradient, no blur blobs */}
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
                  {tier === 'AGENCY' && (
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
                {(tier === 'PRO' || tier === 'AGENCY') && (
                  <TabsTrigger value="boards" className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium text-sm"><BookOpen className="w-4 h-4" />Saved Boards</TabsTrigger>
                )}
                {(tier === 'PRO' || tier === 'AGENCY') && (
                  <TabsTrigger value="templates" className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium text-sm"><LayoutTemplate className="w-4 h-4" />Templates</TabsTrigger>
                )}
                <TabsTrigger value="billing" className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium text-sm"><CreditCard className="w-4 h-4" />Billing</TabsTrigger>
                {tier === 'AGENCY' && (
                  <TabsTrigger value="admin" className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium text-sm"><Users className="w-4 h-4" />Admin</TabsTrigger>
                )}
              </TabsList>
              {(tier === 'PRO' || tier === 'AGENCY') && <TabsContent value="boards" className="mt-6"><SavedBoardsPanel userId={user?.id || ''} tier={tier} /></TabsContent>}
              {(tier === 'PRO' || tier === 'AGENCY') && <TabsContent value="templates" className="mt-6"><TemplatesPanel userId={user?.id || ''} tier={tier} /></TabsContent>}
              <TabsContent value="billing" className="mt-6"><BillingPanel tier={tier} brandColor={brandColor || ''} setBrandColor={setBrandColor} /></TabsContent>
              {tier === 'AGENCY' && (
                <TabsContent value="admin" className="mt-6">
                  <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500" />Agency Admin Dashboard</CardTitle>
                      <CardDescription>View aggregate usage and students of sub-tutors.</CardDescription>
                    </CardHeader>
                    <CardContent><AgencyAdminPanel agencyUserId={user?.id || ''} /></CardContent>
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

// ============================================================
// Billing Panel
// ============================================================
function BillingPanel({ tier, brandColor, setBrandColor }: { tier: Tier; brandColor: string; setBrandColor: (c: string) => void }) {
  const tierLabel = tier === 'AGENCY' ? 'Agency' : tier === 'PRO' ? 'Pro' : 'Free';
  const tierColor = tier === 'AGENCY' ? 'bg-amber-100 text-amber-800' : tier === 'PRO' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-50 text-teal-700';

  return (
    <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Billing &amp; Subscription</CardTitle>
        <CardDescription>Manage your subscription and payment methods.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              {tier === 'AGENCY' ? <Crown className="w-5 h-5 text-white" /> : tier === 'PRO' ? <Star className="w-5 h-5 text-white" /> : <Zap className="w-5 h-5 text-white" />}
            </div>
            <div>
              <p className="font-semibold">Current Plan</p>
              <p className="text-sm text-muted-foreground">{tier === 'FREE' && 'Free tier \u2014 Limited features'}{tier === 'PRO' && 'Pro Tutor \u2014 $10/month'}{tier === 'AGENCY' && 'Agency \u2014 $39/month + per student'}</p>
            </div>
          </div>
          <Badge className={`rounded-full px-3 font-semibold ${tierColor}`}>{tierLabel}</Badge>
        </div>

        {tier !== 'AGENCY' && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" />Upgrade Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tier === 'FREE' && (
                  <Card className="rounded-2xl border-2 border-emerald-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-3 right-3"><Badge className="bg-emerald-500 text-white rounded-full text-[10px]">Popular</Badge></div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Star className="w-4 h-4 text-emerald-600" /></div>Pro Tutor</CardTitle>
                      <CardDescription className="text-base font-semibold text-foreground">$10/month or $96/year</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-2 mb-4">
                        {['Unlimited video calls', '500 smart credits/month', 'GeoGebra & Mathpix', 'Save/Load & Templates', '2 recordings/month'].map((f) => (
                          <li key={f} className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-emerald-600" /></div>{f}</li>
                        ))}
                      </ul>
                      <Button className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-500/20">Upgrade to Pro</Button>
                    </CardContent>
                  </Card>
                )}
                <Card className="rounded-2xl border-2 border-amber-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-3 right-3"><Badge className="bg-amber-500 text-white rounded-full text-[10px]">Best Value</Badge></div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Crown className="w-4 h-4 text-amber-600" /></div>Agency / Center</CardTitle>
                    <CardDescription className="text-base font-semibold text-foreground">$39/month + per student</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2 mb-4">
                      {['Everything in Pro', '$39/mo base fee', 'White-labeling & branding', 'Custom domains', 'Unlimited recordings', 'Admin dashboard & analytics'].map((f) => (
                        <li key={f} className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-amber-600" /></div>{f}</li>
                      ))}
                    </ul>
                    <Button variant="outline" className="w-full rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold">Contact Sales</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {tier === 'AGENCY' && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Palette className="w-4 h-4 text-emerald-500" />White-Label Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border shadow-sm" style={{ backgroundColor: brandColor || '#000' }} />
                    <Input value={brandColor || ''} onChange={(e) => setBrandColor(e.target.value)} placeholder="#FF5733" className="flex-1 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Custom Domain</Label>
                  <Input placeholder="classroom.yourcenter.com" disabled className="rounded-xl" />
                  <p className="text-xs text-muted-foreground">Configure via DNS settings</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// SavedBoardsPanel
// ============================================================
interface BoardRow { id: string; subject: string; isActive: boolean; createdAt: string; brandingColor: string | null; }

function SavedBoardsPanel({ userId, tier }: { userId: string; tier: Tier }) {
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

// ============================================================
// TemplatesPanel
// ============================================================
interface TemplateRow { id: string; name: string; subject: string; createdAt: string; }

function TemplatesPanel({ userId, tier }: { userId: string; tier: Tier }) {
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

// ============================================================
// AgencyAdminPanel
// ============================================================
interface SubTutorRow { id: string; email: string; name: string | null; tier: string; activeRooms: number; videoMinutesUsed: number; aiCreditsUsed: number; joinedAt: string | null; }
interface InviteRow { id: string; code: string; invitedEmail: string; status: string; expiresAt: string; acceptedAt: string | null; createdAt: string; recipient: { id: string; name: string | null; email: string | null } | null; }

function AgencyAdminPanel({ agencyUserId }: { agencyUserId: string }) {
  const [subTutors, setSubTutors] = useState<SubTutorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string>('AGENCY');

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState<{ code: string; expiresAt: string; warning?: string } | null>(null);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

  // Remove confirmation state
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const loadSubTutors = useCallback(() => {
    if (!agencyUserId) return;
    setLoading(true);
    authFetch(`/api/usage/agency?agencyId=${agencyUserId}`).then((res) => res.json()).then((data) => setSubTutors(data.subTutors || [])).catch(() => {}).finally(() => setLoading(false));
  }, [agencyUserId]);

  const loadInvites = useCallback(() => {
    if (!agencyUserId) return;
    setInvitesLoading(true);
    authFetch('/api/agency/invite').then((res) => res.json()).then((data) => setInvites(data.invites || [])).catch(() => {}).finally(() => setInvitesLoading(false));
  }, [agencyUserId]);

  useEffect(() => {
    loadSubTutors();
    loadInvites();
  }, [loadSubTutors, loadInvites]);

  const handleSendInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setInviteError('');
    setInviteSuccess(null);
    setInviteSending(true);
    try {
      const res = await authFetch('/api/agency/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.message || data.error || 'Failed to send invite');
        return;
      }
      setInviteSuccess({ code: data.code, expiresAt: data.expiresAt, warning: data.warning });
      setInviteEmail('');
      loadInvites();
      loadSubTutors();
    } catch {
      setInviteError('Network error. Please try again.');
    } finally {
      setInviteSending(false);
    }
  };

  const handleCancelInvite = async (code: string) => {
    try {
      await authFetch(`/api/agency/invite/${code}/cancel`, { method: 'POST' });
      loadInvites();
    } catch { /* silent */ }
  };

  const handleRemoveTutor = async (tutorId: string) => {
    setRemoving(true);
    try {
      const res = await authFetch(`/api/agency/subtutors/${tutorId}`, { method: 'DELETE' });
      if (res.ok) {
        loadSubTutors();
        loadInvites();
      }
    } catch { /* silent */ }
    setRemoving(false);
    setRemoveConfirmId(null);
  };

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(link).then(() => {
      setInviteLinkCopied(true);
      setTimeout(() => setInviteLinkCopied(false), 2000);
    }).catch(() => { /* clipboard may be blocked */ });
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /><span className="ml-3 text-sm text-muted-foreground">Loading...</span></div>;

  const totalVideo = subTutors.reduce((sum, t) => sum + t.videoMinutesUsed, 0);
  const totalCredits = subTutors.reduce((sum, t) => sum + t.aiCreditsUsed, 0);
  const totalRooms = subTutors.reduce((sum, t) => sum + t.activeRooms, 0);
  const pendingInvites = invites.filter((i) => i.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Invite Sub-Tutor Button */}
      <div className="flex items-center justify-between">
        <div />
        <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) { setInviteError(''); setInviteSuccess(null); setInviteEmail(''); } }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm gap-2">
              <Plus className="w-4 h-4" /> Invite Sub-Tutor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg">Invite a Sub-Tutor</DialogTitle>
              <DialogDescription>Send an invite link to a tutor you&apos;d like to add to your agency.</DialogDescription>
            </DialogHeader>
            {inviteSuccess ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"><Check className="w-4 h-4 text-emerald-600" /></div>
                  <div><p className="text-sm font-medium text-emerald-800">Invite sent successfully!</p><p className="text-xs text-emerald-600">Link expires in 7 days</p></div>
                </div>
                {inviteSuccess.warning && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <Crown className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">{inviteSuccess.warning}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Invite link</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted rounded-lg px-3 py-2 truncate block">{window.location.origin}/invite/{inviteSuccess.code}</code>
                    <Button size="sm" variant="outline" className="flex-shrink-0 text-xs" onClick={() => copyInviteLink(inviteSuccess.code)}>
                      {inviteLinkCopied ? <Check className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                      {inviteLinkCopied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-2" onClick={() => setInviteSuccess(null)}>Send another invite</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email" className="text-sm font-medium">Email address</Label>
                  <Input id="invite-email" type="email" placeholder="tutor@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()} className="rounded-xl" />
                </div>
                {inviteError && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{inviteError}</p>
                )}
                <Button className="w-full rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all" onClick={handleSendInvite} disabled={inviteSending || !inviteEmail.trim()}>
                  {inviteSending ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Sending...</> : 'Send Invite'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl stat-gradient-sparkles p-5 text-white shadow-lg shadow-emerald-500/15 card-hover"><p className="text-3xl font-bold">{subTutors.length}</p><p className="text-sm text-white/80 mt-1">Sub-Tutors</p></div>
        <div className="rounded-2xl stat-gradient-video p-5 text-white shadow-lg shadow-sky-500/15 card-hover"><p className="text-3xl font-bold">{totalRooms}</p><p className="text-sm text-white/80 mt-1">Total Lessons</p></div>
        <div className="rounded-2xl stat-gradient-recordings p-5 text-white shadow-lg shadow-emerald-500/15 card-hover"><p className="text-3xl font-bold">{totalVideo} min</p><p className="text-sm text-white/80 mt-1">Video Used</p></div>
      </div>

      {/* Pending Invites */}
      {invitesLoading ? null : invites.length === 0 ? null : (
        <div className="rounded-2xl border overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-muted/50 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold">Invites ({pendingInvites.length} pending)</h3>
          </div>
          <div className="divide-y">
            {invites.map((invite) => {
              const isExpired = invite.status === 'EXPIRED' || (invite.status === 'PENDING' && new Date(invite.expiresAt) < new Date());
              const isAccepted = invite.status === 'ACCEPTED';
              const isCancelled = invite.status === 'CANCELLED';
              return (
                <div key={invite.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{invite.invitedEmail}</p>
                    <p className="text-xs text-muted-foreground">Expires {new Date(invite.expiresAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isAccepted && <Badge className="bg-emerald-100 text-emerald-700 text-[10px] rounded-full border-0">Accepted{invite.recipient?.name ? ` by ${invite.recipient.name}` : ''}</Badge>}
                    {isExpired && <Badge variant="secondary" className="text-[10px] rounded-full text-muted-foreground">Expired</Badge>}
                    {isCancelled && <Badge variant="secondary" className="text-[10px] rounded-full text-muted-foreground">Cancelled</Badge>}
                    {!isAccepted && !isExpired && !isCancelled && (
                      <>
                        <Badge className="bg-amber-100 text-amber-700 text-[10px] rounded-full border-0">Pending</Badge>
                        <Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-red-600 h-7 px-2" onClick={() => handleCancelInvite(invite.code)}>Cancel</Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tutors Table */}
      {subTutors.length === 0 && invites.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center"><Users className="w-8 h-8 text-emerald-400" /></div>
          <p className="text-muted-foreground font-medium">No sub-tutors assigned yet</p>
          <p className="text-xs text-muted-foreground mt-1">Invite a tutor to get started</p>
        </div>
      ) : subTutors.length === 0 ? null : (
        <div className="rounded-2xl border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b"><tr><th className="text-left px-4 py-3 font-semibold">Tutor</th><th className="text-left px-4 py-3 font-semibold">Tier</th><th className="text-right px-4 py-3 font-semibold">Lessons</th><th className="text-right px-4 py-3 font-semibold">Video</th><th className="text-right px-4 py-3 font-semibold">Smart Credits</th><th className="text-right px-4 py-3 font-semibold">Last Active</th><th className="px-4 py-3" /></tr></thead>
            <tbody>
              {subTutors.map((tutor) => (
                <tr key={tutor.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3"><p className="font-medium">{tutor.name || '\u2014'}</p><p className="text-xs text-muted-foreground">{tutor.email}</p></td>
                  <td className="px-4 py-3"><Badge variant={tutor.tier === 'AGENCY' ? 'default' : 'secondary'} className={`text-[10px] rounded-full ${tutor.tier === 'AGENCY' ? 'bg-amber-100 text-amber-700' : ''}`}>{tutor.tier}</Badge></td>
                  <td className="px-4 py-3 text-right font-medium">{tutor.activeRooms}</td>
                  <td className="px-4 py-3 text-right font-medium">{tutor.videoMinutesUsed}</td>
                  <td className="px-4 py-3 text-right font-medium">{tutor.aiCreditsUsed}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{tutor.joinedAt ? new Date(tutor.joinedAt).toLocaleDateString() : '\u2014'}</td>
                  <td className="px-4 py-3 text-right">
                    {removeConfirmId === tutor.id ? (
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-xs text-red-500 mr-1">Sure?</span>
                        <Button size="sm" variant="destructive" className="h-7 text-xs px-2" disabled={removing} onClick={() => handleRemoveTutor(tutor.id)}>{removing ? '...' : 'Yes'}</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setRemoveConfirmId(null)}>No</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-red-600" onClick={() => setRemoveConfirmId(tutor.id)}>Remove</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== SETTINGS DIALOG ===== */}
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
              <div className="h-11 rounded-xl bg-gray-50 border border-gray-200 px-3 flex items-center text-sm text-gray-600">{userEmail || ''}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Plan</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`rounded-full px-3 py-0.5 font-medium ${userTier === 'AGENCY' ? 'bg-purple-50 text-purple-600 border-purple-200' : userTier === 'PRO' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {userTier === 'AGENCY' ? 'Agency' : userTier === 'PRO' ? 'Pro' : 'Free'}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Need to change your email or password?</p>
              <Button variant="link" className="text-xs text-primary mt-1">Contact Support</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
