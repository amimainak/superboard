// ============================================================
// Landing Page — Marketing / Auth Gate
// ============================================================
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { createClient } from '@/lib/supabase';
import { authFetch, initAuthFetch } from '@/lib/auth-fetch';
import type { Tier } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SocialProofSection } from './SocialProofSection';
import { FeatureShowcase } from './FeatureShowcase';
import { FAQSection } from './FAQSection';
import {
  Plus,
  BookOpen,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Video,
  FileText,
  Calculator,
  FlaskConical,
  Languages,
  ClipboardList,
  Zap,
  Shield,
  Clock,
  Globe,
  Users,
  School,
  TrendingUp,
  ArrowRight,
  Check,
  Monitor,
  Brain,
  PenTool,
  Download,
  MousePointerClick,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react';

// Inline Google "G" SVG — avoids adding a dependency
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function LandingPage() {
  const { setTier } = useAppStore();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });
  const [showVerification, setShowVerification] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Read showAuth URL param from invite redirects + capture referral code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('showAuth') === 'login') {
      setShowAuth('login');
      // Clean the URL without reloading
      window.history.replaceState({}, '', '/');
    }
    if (params.get('showAuth') === 'register') {
      setShowAuth('register');
      window.history.replaceState({}, '', '/');
    }
    // Capture referral code from URL and store in localStorage
    const refCode = params.get('ref');
    if (refCode) {
      localStorage.setItem('sb_referral_code', refCode);
      // Clean the URL
      const cleanParams = new URLSearchParams(window.location.search);
      cleanParams.delete('ref');
      const qs = cleanParams.toString();
      window.history.replaceState({}, '', qs ? `?${qs}` : '/');
    }
  }, []);

  const handleForgotPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const supabase = createClient();
      if (!supabase) { setAuthError('Authentication is not configured.'); return; }
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
      if (error) throw error;
      setForgotSuccess(true);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to send reset email.');
    }
  }, [forgotEmail]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    try {
      const supabase = createClient();
      if (!supabase) { setAuthError('Authentication is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'); return; }
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (error) { setAuthError(error.message); return; }
      initAuthFetch();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        try {
          const tierRes = await authFetch(`/api/auth/profile?userId=${u.id}`);
          if (tierRes.ok) { const d = await tierRes.json(); if (d.tier) setTier(d.tier as Tier); }
        } catch { /* ignore */ }
      }
      setLoginEmail(''); setLoginPassword('');
      closeAuth();
    } catch { setAuthError('Network error'); }
  }, [loginEmail, loginPassword, setTier]);

  const evaluatePasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 4) return { score, label: 'Good', color: 'bg-emerald-400' };
    return { score, label: 'Strong', color: 'bg-emerald-600' };
  };

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
        try { await authFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ id: data.user.id, email: registerEmail, name: registerName }) }); } catch { /* */ }
        // Auto-apply referral code from localStorage
        const savedRef = localStorage.getItem('sb_referral_code');
        if (savedRef) {
          try { await authFetch('/api/referral/apply', { method: 'POST', body: JSON.stringify({ referralCode: savedRef }) }); } catch { /* */ }
          localStorage.removeItem('sb_referral_code');
        }
      } else {
        setAuthMessage('Check your email...');
        setShowVerification(true);
        setShowAuth(null);
      }
      setRegisterEmail(''); setRegisterPassword(''); setRegisterName('');
    } catch { setAuthError('Network error'); }
  }, [registerEmail, registerPassword, registerName]);

  const handleGoogleAuth = useCallback(async () => {
    setAuthError('');
    try {
      const supabase = createClient();
      if (!supabase) { setAuthError('Authentication is not configured.'); return; }
      // Build redirect URL — preserve invite code if present, drop auth params
      const params = new URLSearchParams(window.location.search);
      params.delete('showAuth');
      const qs = params.toString();
      const redirectTo = window.location.origin + (qs ? `?${qs}` : '');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });
      if (error) { setAuthError(error.message); }
    } catch { setAuthError('Failed to connect to Google.'); }
  }, []);

  const closeAuth = () => { setShowAuth(null); setAuthError(''); setAuthMessage(''); setShowForgotPassword(false); setForgotSuccess(false); setForgotEmail(''); };

  const scrollRef = useScrollReveal<HTMLDivElement>();

  return (
    <main ref={scrollRef} className="min-h-screen bg-white">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-glass">
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
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-section-warm">
        {/* Brand dot-grid pattern */}
        <div className="absolute inset-0 pointer-events-none bg-dot-grid" />
        {/* Ambient floating shapes */}
        <div className="ambient-shape ambient-shape-1" />
        <div className="ambient-shape ambient-shape-2" />
        <div className="ambient-shape ambient-shape-3" />
        {/* Ambient glow top-right */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(5,150,105,0.15) 0%, transparent 60%)' }} />

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
                Run your entire tutoring business{' '}
                <span className="gradient-text-brand">
                  from one screen
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-600 leading-relaxed animate-fade-in-up-delay-1">
                Video calls, AI lesson tools, homework, parent updates, and invoicing — all in one place. No student signup required.
              </p>

              <div className="flex flex-wrap gap-3 mt-8 animate-fade-in-up-delay-2">
                <Button className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-[15px] px-6 h-12" onClick={() => setShowAuth('register')}>
                  Start Teaching Free — No Credit Card <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <Button variant="outline" className="rounded-xl border-gray-200 font-medium text-[15px] px-6 h-12" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                  <ClipboardList className="w-4 h-4 mr-1.5" /> See Plans
                </Button>
              </div>

              {/* Trust signals */}
              <div className="mt-10 flex flex-wrap gap-4 text-sm text-gray-500 animate-fade-in-up-delay-3">
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> No student sign-up needed</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Free plan available</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Upgrade anytime</span>
              </div>
            </div>

            {/* Right: Hero Illustration */}
            <div className="hidden md:flex justify-center animate-fade-in-up-delay-1">
              <div className="relative w-full max-w-lg hero-card-glow">
                {/* Canvas card */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-xl p-4 relative z-10">
                  {/* Mini toolbar */}
                  <div className="flex items-center gap-2 mb-4 px-1">
                    {[
                      { icon: PenTool, color: 'text-emerald-600 bg-emerald-50' },
                      { icon: Calculator, color: 'text-blue-600 bg-blue-50' },
                      { icon: FlaskConical, color: 'text-purple-600 bg-purple-50' },
                      { icon: Brain, color: 'text-amber-600 bg-amber-50' },
                    ].map(({ icon: Icon, color }) => (
                      <div key={color} className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    ))}
                    <div className="flex-1" />
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><Video className="w-4 h-4" /></div>
                  </div>
                  {/* Mini canvas area */}
                  <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white h-52 relative overflow-hidden">
                    {/* Fake grid */}
                    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #000 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
                    {/* Fake math content */}
                    <div className="absolute top-4 left-4">
                      <div className="text-sm font-medium text-gray-700">f(x) = 2x + 3</div>
                      <div className="mt-2 text-xs text-gray-400">slope = 2, y-intercept = 3</div>
                    </div>
                    {/* Fake graph */}
                    <svg className="absolute bottom-4 right-4" width="140" height="100" viewBox="0 0 140 100">
                      <line x1="10" y1="90" x2="130" y2="10" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="10" y1="90" x2="130" y2="90" stroke="#d1d5db" strokeWidth="1" />
                      <line x1="10" y1="90" x2="10" y2="10" stroke="#d1d5db" strokeWidth="1" />
                      <circle cx="70" cy="50" r="4" fill="#059669" />
                      <text x="75" y="54" fontSize="10" fill="#059669" fontWeight="bold">x=35</text>
                    </svg>
                    {/* Cursor dot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-400/40 animate-pulse" />
                  </div>
                </div>
                {/* Decorative cards behind */}
                <div className="absolute -top-3 -right-3 w-24 h-24 rounded-xl bg-gradient-to-br from-emerald-200 to-teal-100 -z-10 rotate-6 opacity-50" />
                <div className="absolute -bottom-3 -left-3 w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-200 to-sky-100 -z-10 -rotate-6 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 md:py-28 bg-white reveal">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 mb-4">
              <Zap className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-xs font-semibold text-sky-700">Powerful Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
              Everything You Need,{' '}
              <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">Nothing You Don&apos;t</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 reveal-stagger">
            {[
              { icon: PenTool, title: 'Infinite Whiteboard', desc: 'Draw, write, and collaborate on an unlimited canvas. Zoom in for detail or zoom out for the big picture.', gradient: 'from-emerald-600 to-teal-500' },
              { icon: Video, title: 'Built-in Video Call', desc: 'Face-to-face tutoring without leaving the app. Crystal-clear video with zero student setup.', gradient: 'from-teal-500 to-cyan-500' },
              { icon: Brain, title: 'Smart Subject Tools', desc: 'Plot graphs, balance equations, generate quizzes, and use subject-specific tools — available on the Pro plan.', gradient: 'from-cyan-500 to-sky-500' },
              { icon: Calculator, title: 'Math Toolkit', desc: 'Graph functions, solve equations, and visualize geometry. Purpose-built for math tutoring.', gradient: 'from-emerald-500 to-emerald-400' },
              { icon: FlaskConical, title: 'Science Lab Tools', desc: 'Chemical equation balancer, lab report generators, and diagram tools for science tutors.', gradient: 'from-teal-500 to-emerald-400' },
              { icon: Languages, title: 'Language Arts', desc: 'Grammar checks, phonics helpers, vocabulary quizzes, and writing prompts for ELA tutors.', gradient: 'from-sky-500 to-cyan-500' },
            ].map((item) => (
              <div key={item.title} className="reveal landing-card p-6">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 shadow-sm`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUST SIGNALS ===== */}
      <section className="py-16 bg-section-cool border-y border-gray-100 reveal">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
            {[
              { icon: Check, text: 'No student sign-up required' },
              { icon: Shield, text: 'End-to-end encrypted' },
              { icon: Globe, text: 'Works on any device' },
              { icon: Zap, text: 'Free plan — no credit card' },
            ].map((item) => (
              <div key={item.text} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 md:py-28 bg-section-warm reveal">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-4">
              <MousePointerClick className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">Simple Setup</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
              Start tutoring in{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">minutes</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create a Lesson', desc: 'Pick a subject and click "Start Lesson." Your interactive whiteboard is ready in seconds.', icon: Plus },
              { step: '02', title: 'Invite Your Student', desc: 'Share the room link — they join instantly with video, no account needed. Just click and teach.', icon: Users },
              { step: '03', title: 'Upgrade When Ready', desc: 'Free gives you video calling and the whiteboard. Upgrade to Pro for AI tools, homework, parent updates, and invoicing.', icon: Download },
            ].map((item) => (
              <div key={item.step} className="relative text-center group">
                {/* Step number */}
                <div className="absolute -top-3 -left-2 text-5xl md:text-7xl font-black text-gray-100 group-hover:text-emerald-100 transition-colors select-none">{item.step}</div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PERFECT FOR EVERY TUTOR ===== */}
      <section className="py-20 md:py-28 bg-section-cool reveal">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
              Perfect for <span className="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">Every Tutor</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 reveal-stagger">
            {[
              { icon: GraduationCap, title: 'Individual Tutors', desc: 'Freelance tutors who want a professional whiteboard without juggling multiple tools.', gradient: 'from-emerald-600 to-teal-500' },
              { icon: Users, title: 'Tutoring Centers', desc: 'Agencies that need branding, sub-tutor management, and per-hour billing.', gradient: 'from-amber-500 to-amber-400' },
              { icon: School, title: 'School Teachers', desc: 'K-12 educators looking for interactive math, science, and language tools.', gradient: 'from-teal-500 to-cyan-500' },
            ].map((item) => (
              <div key={item.title} className="reveal landing-card p-6">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 shadow-sm`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-20 md:py-28 bg-section-warm reveal">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 mb-4">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">Simple Pricing</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
              Plans That <span className="bg-gradient-to-r from-emerald-500 to-amber-500 bg-clip-text text-transparent">Grow With You</span>
            </h2>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${isAnnual ? 'bg-emerald-500' : 'bg-gray-300'}`}
              aria-label="Toggle annual pricing"
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isAnnual ? 'translate-x-6' : ''}`} />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-400'}`}>
              Annual <span className="text-emerald-600 font-semibold">Save 20%</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Free</h3>
                <p className="text-sm text-gray-500 mt-1">Try it out with the basics</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">$0</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>
              <Button className="w-full rounded-xl border-gray-200 font-semibold text-sm h-11" variant="outline" onClick={() => setShowAuth('register')}>
                Get Started
              </Button>
              <ul className="mt-6 space-y-3">
                {[
                  '1 active room',
                  '120 min video calling/week',
                  '10 smart credits/week',
                  'Smart tools (quiz, graph, shapes)',
                  'Basic whiteboard & drawing',
                  'Share room link with students',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Save/load, templates, PDF export, recordings, and advanced tools (lesson plans, rubrics, flashcards) require Pro.
                </p>
              </div>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-emerald-500 bg-white p-6 shadow-lg shadow-emerald-500/10 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full gradient-primary text-white text-xs font-semibold">Most Popular</div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Pro Tutor</h3>
                <p className="text-sm text-gray-500 mt-1">For serious educators</p>
              </div>
              <div className="mb-6">
                {isAnnual ? (
                  <>
                    <span className="text-4xl font-extrabold text-gray-900">$96</span>
                    <span className="text-gray-500 text-sm">/year</span>
                    <p className="text-xs text-emerald-600 mt-1">Save 20% vs monthly</p>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-extrabold text-gray-900">$10</span>
                    <span className="text-gray-500 text-sm">/month</span>
                    <p className="text-xs text-emerald-600 mt-1">Or $96/year (save 20%)</p>
                  </>
                )}
              </div>
              <Button className="w-full rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 text-sm h-11" onClick={() => setShowAuth('register')}>
                Start Free, Upgrade Later
              </Button>
              <ul className="mt-6 space-y-3">
                {['Unlimited rooms', '500 smart credits/month', 'Unlimited video calling', 'Save/Load boards', 'Templates', 'PDF export', 'Graphing & geometry tools', '2 recordings/month'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />{f}</li>
                ))}
              </ul>
            </div>

            {/* Agency Standard */}
            <div className="rounded-2xl border-2 border-amber-500 bg-white p-6 hover:shadow-lg transition-shadow relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-semibold">Best Value</div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Agency Standard</h3>
                <p className="text-sm text-gray-500 mt-1">For growing centers</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">$39</span>
                <span className="text-gray-500 text-sm">/month + $3/hr</span>
                {isAnnual && <p className="text-xs text-amber-600 mt-1">Contact for annual pricing</p>}
              </div>
              <Button className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-lg shadow-amber-500/25 text-sm h-11" onClick={() => setShowAuth('register')}>
                Start Free, Upgrade Later
              </Button>
              <ul className="mt-6 space-y-3">
                {['Everything in Pro', '5,000 smart credits/month', 'Unlimited recordings', 'White-label branding', 'Admin dashboard', 'Up to 5 sub-tutors', 'Student roster', 'Per-hour billing'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><Check className="w-4 h-4 text-amber-500 flex-shrink-0" />{f}</li>
                ))}
              </ul>
            </div>

            {/* Agency Premium */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Agency Premium</h3>
                <p className="text-sm text-gray-500 mt-1">For established centers</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">$79</span>
                <span className="text-gray-500 text-sm">/month + $2/hr</span>
                {isAnnual && <p className="text-xs text-amber-600 mt-1">Contact for annual pricing</p>}
              </div>
              <Button className="w-full rounded-xl border-gray-200 font-semibold text-sm h-11" variant="outline" onClick={() => setShowAuth('register')}>
                Contact Sales
              </Button>
              <ul className="mt-6 space-y-3">
                {['Everything in Standard', 'Unlimited sub-tutors', '$2/hr volume discount', 'Priority support', 'Advanced analytics', 'Custom domain', 'Student roster', 'API access'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURE COMPARISON TABLE ===== */}
      <section className="py-12 px-6 bg-white border-t border-gray-100 reveal">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-lg font-bold text-gray-900 text-center mb-6">Feature comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Feature</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 w-24">Free</th>
                  <th className="text-center py-3 px-4 font-medium text-emerald-600 w-24">Pro</th>
                  <th className="text-center py-3 px-4 font-medium text-amber-600 w-24">Agency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { feature: 'Active rooms', free: '1', pro: 'Unlimited', agency: 'Unlimited' },
                  { feature: 'Video calling', free: '120 min/wk', pro: 'Unlimited', agency: 'Unlimited' },
                  { feature: 'Whiteboard & drawing', free: true, pro: true, agency: true },
                  { feature: 'Smart tools (quiz, graph)', free: '10 credits/wk', pro: '500/mo', agency: '5,000/mo' },
                  { feature: 'Advanced tools (plans, rubrics)', free: false, pro: true, agency: true },
                  { feature: 'Save & load boards', free: false, pro: true, agency: true },
                  { feature: 'Templates', free: false, pro: true, agency: true },
                  { feature: 'PDF export', free: false, pro: true, agency: true },
                  { feature: 'Image uploads', free: false, pro: true, agency: true },
                  { feature: 'Recordings', free: false, pro: '2/mo', agency: 'Unlimited' },
                  { feature: 'Handwriting recognition', free: false, pro: true, agency: true },
                  { feature: 'White-label branding', free: false, pro: false, agency: true },
                  { feature: 'Admin dashboard', free: false, pro: false, agency: true },
                  { feature: 'Sub-tutor management', free: false, pro: false, agency: true },
                ].map((row) => (
                  <tr key={row.feature} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 text-gray-700">{row.feature}</td>
                    {([row.free, row.pro, row.agency] as (boolean | string)[]).map((val, i) => (
                      <td key={i} className="text-center py-2.5 px-4">
                        {typeof val === 'boolean' ? (
                          val ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-gray-300">—</span>
                        ) : (
                          <span className="text-gray-600 text-xs">{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            Smart tools include quiz generation, graphing, equation balancing, grammar checks, and shape perfection. Advanced tools include lesson plans, rubrics, flashcards, differentiated instruction, and more. Video calling powered by LiveKit (self-hosted, no per-minute API fees).
          </p>
        </div>
      </section>

      {/* ===== SOCIAL PROOF (moved before FAQ for stronger impact) ===== */}
      <div className="reveal"><SocialProofSection /></div>

      {/* ===== FEATURE SHOWCASE ===== */}
      <div className="reveal"><FeatureShowcase /></div>

      {/* ===== FAQ ===== */}
      <div className="reveal"><FAQSection /></div>

      {/* ===== FINAL CTA — dark, dramatic, brand signature ===== */}
      <section className="py-20 md:py-28 bg-cta-dark reveal">
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 mb-6">
            <Check className="w-3.5 h-3.5 text-emerald-300" />
            <span className="text-xs font-semibold text-emerald-200">No credit card required to start</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
            Try the free plan today
          </h2>
          <p className="text-lg text-emerald-100/80 mb-8 max-w-xl mx-auto leading-relaxed">
            Create a room, share the link with your student, and start teaching on an interactive whiteboard with video calling. When you need more — save boards, export PDFs, or use smart tools — upgrade to Pro in one click.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button className="rounded-xl bg-white text-emerald-700 font-semibold shadow-lg shadow-black/20 hover:shadow-black/30 transition-all hover:-translate-y-0.5 text-[15px] px-8 h-12 hover:bg-white/95" onClick={() => setShowAuth('register')}>
              Start Teaching Free <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button variant="outline" className="rounded-xl border-white/20 text-white font-medium text-[15px] px-6 h-12 hover:bg-white/10 hover:border-white/30" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
              Compare Plans
            </Button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-50 border-t border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-6">
          {/* Top row: branding + nav */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Superboard</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <a href="#features" className="text-xs text-gray-500 hover:text-gray-700 transition-colors py-2 nav-link-animated">Features</a>
              <a href="#pricing" className="text-xs text-gray-500 hover:text-gray-700 transition-colors py-2 nav-link-animated">Pricing</a>
              <a href="/terms" className="text-xs text-gray-500 hover:text-gray-700 transition-colors py-2 nav-link-animated">Terms &amp; Conditions</a>
              <a href="/privacy" className="text-xs text-gray-500 hover:text-gray-700 transition-colors py-2 nav-link-animated">Privacy Policy</a>
              <a href="/refund" className="text-xs text-gray-500 hover:text-gray-700 transition-colors py-2 nav-link-animated">Refund Policy</a>
              <a href="/cookies" className="text-xs text-gray-500 hover:text-gray-700 transition-colors py-2 nav-link-animated">Cookie Policy</a>
              <a href="/contact" className="text-xs text-gray-500 hover:text-gray-700 transition-colors py-2 nav-link-animated">Contact</a>
            </div>
          </div>
          {/* Bottom row: copyright */}
          <div className="pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Superboard. All rights reserved. Built for K-12 tutors.</p>
          </div>
        </div>
      </footer>

      {/* ===== AUTH DIALOG ===== */}
      <Dialog open={showAuth !== null} onOpenChange={(open) => { if (!open) closeAuth(); }}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          {showForgotPassword ? (
            <>
              <DialogTitle className="sr-only">Reset Password</DialogTitle>
              <div className="gradient-primary px-6 pt-8 pb-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/90 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-white">Reset Password</h2>
                <p className="text-sm text-white/70 mt-1">We&apos;ll send you a reset link</p>
              </div>
              {forgotSuccess ? (
                <div className="px-6 pb-6 pt-6 space-y-4 text-center">
                  <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-4 py-3">Check your email for a reset link.</p>
                  <button type="button" className="text-sm text-emerald-600 hover:underline" onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); setForgotEmail(''); setAuthError(''); }}>Back to Sign In</button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="px-6 pb-6 pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-sm font-medium">Email</Label>
                    <Input id="forgot-email" type="email" placeholder="you@example.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="rounded-xl" required />
                  </div>
                  {authError && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{authError}</p>}
                  <Button type="submit" className="w-full rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">Send Reset Link</Button>
                  <p className="text-center">
                    <button type="button" className="text-sm text-emerald-600 hover:underline" onClick={() => { setShowForgotPassword(false); setForgotEmail(''); setAuthError(''); }}>Back to Sign In</button>
                  </p>
                </form>
              )}
            </>
          ) : showAuth === 'login' ? (
            <>
              <DialogTitle className="sr-only">Sign In</DialogTitle>
              <div className="gradient-primary px-6 pt-8 pb-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/90 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-7 h-7 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-white">Welcome Back</h2>
                <p className="text-sm text-white/70 mt-1">Sign in to continue teaching</p>
              </div>
              <form onSubmit={handleLogin} className="px-6 pb-6 pt-4 space-y-4">
                {/* Google OAuth */}
                <Button type="button" variant="outline" className="w-full rounded-xl font-medium text-sm h-11 gap-2 border-gray-200 hover:bg-gray-50" onClick={handleGoogleAuth}>
                  <GoogleIcon className="w-4 h-4" />
                  Continue with Google
                </Button>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">or sign in with email</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                  <Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input id="login-password" type={showLoginPassword ? 'text' : 'password'} placeholder="Your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="rounded-xl pr-10" required />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {authError && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{authError}</p>}
                <Button type="submit" className="w-full rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">Sign In</Button>
                <div className="text-center space-y-2">
                  <button type="button" className="text-xs text-emerald-600 hover:underline" onClick={() => { setShowForgotPassword(true); setForgotEmail(loginEmail); setAuthError(''); }}>Forgot password?</button>
                  <p className="text-sm text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <button type="button" className="text-emerald-600 font-medium hover:underline" onClick={() => setShowAuth('register')}>Sign up</button>
                  </p>
                </div>
              </form>
            </>
          ) : showAuth === 'register' ? (
            <>
              <DialogTitle className="sr-only">Create Account</DialogTitle>
              <div className="gradient-primary px-6 pt-8 pb-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/90 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-white">Create Your Account</h2>
                <p className="text-sm text-white/70 mt-1">Start teaching in under a minute</p>
              </div>
              <form onSubmit={handleRegister} className="px-6 pb-6 pt-4 space-y-4">
                {/* Google OAuth */}
                <Button type="button" variant="outline" className="w-full rounded-xl font-medium text-sm h-11 gap-2 border-gray-200 hover:bg-gray-50" onClick={handleGoogleAuth}>
                  <GoogleIcon className="w-4 h-4" />
                  Sign up with Google
                </Button>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">or register with email</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-sm font-medium">Full Name</Label>
                  <Input id="register-name" type="text" placeholder="Your name" value={registerName} onChange={(e) => setRegisterName(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-sm font-medium">Email</Label>
                  <Input id="register-email" type="email" placeholder="you@example.com" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} className="rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input id="register-password" type={showRegisterPassword ? 'text' : 'password'} placeholder="Create a strong password" value={registerPassword} onChange={(e) => { setRegisterPassword(e.target.value); setPasswordStrength(evaluatePasswordStrength(e.target.value)); }} className="rounded-xl pr-10" required />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {registerPassword && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'}`} />
                        ))}
                      </div>
                      <p className={`text-xs ${passwordStrength.score <= 1 ? 'text-red-500' : passwordStrength.score <= 3 ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>
                {authError && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{authError}</p>}
                {authMessage && <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">{authMessage}</p>}
                <Button type="submit" className="w-full rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">Create Account</Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button type="button" className="text-emerald-600 font-medium hover:underline" onClick={() => setShowAuth('login')}>Sign in</button>
                </p>
              </form>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ===== EMAIL VERIFICATION SCREEN ===== */}
      {showVerification && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
            <p className="text-gray-600 leading-relaxed">
              We&apos;ve sent a confirmation link to <strong>{registerEmail}</strong>. 
              Click the link to verify your account and start teaching.
            </p>
            <p className="text-sm text-gray-500">
              Didn&apos;t receive the email? Check your spam folder.
            </p>
            <Button variant="outline" className="rounded-xl" onClick={() => setShowVerification(false)}>
              Back to Sign In
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

export default LandingPage;
