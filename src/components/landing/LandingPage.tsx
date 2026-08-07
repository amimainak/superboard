// ============================================================
// Landing Page — Marketing / Auth Gate
// ============================================================
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
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
  Star,
  Crown,
  TrendingUp,
  Play,
  ArrowRight,
  Check,
  Monitor,
  Brain,
  PenTool,
  Download,
  MousePointerClick,
} from 'lucide-react';

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
                The AI-powered whiteboard built for K-12 tutors. Draw, graph, use smart tools, and video-call your students — all on one infinite canvas. No student sign-up required.
              </p>

              <div className="flex flex-wrap gap-3 mt-8 animate-fade-in-up-delay-2">
                <Button className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-[15px] px-6 h-12" onClick={() => setShowAuth('register')}>
                  Start Teaching Free <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <Button variant="outline" className="rounded-xl border-gray-200 font-medium text-[15px] px-6 h-12" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Play className="w-4 h-4 mr-1.5" /> See How It Works
                </Button>
              </div>

              {/* Trust signals */}
              <div className="mt-10 flex flex-wrap gap-4 text-sm text-gray-500 animate-fade-in-up-delay-3">
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> No student sign-up</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> AI-powered tools</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Free to start</span>
              </div>
            </div>

            {/* Right: Hero Illustration */}
            <div className="hidden md:flex justify-center animate-fade-in-up-delay-1">
              <div className="relative w-full max-w-lg">
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
                <div className="absolute -top-3 -right-3 w-24 h-24 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 -z-10 rotate-6 opacity-60" />
                <div className="absolute -bottom-3 -left-3 w-20 h-20 rounded-xl bg-gradient-to-br from-sky-100 to-blue-50 -z-10 -rotate-6 opacity-60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 md:py-28 bg-white">
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: PenTool, title: 'Infinite Whiteboard', desc: 'Draw, write, and collaborate on an unlimited canvas. Zoom in for detail or zoom out for the big picture.', gradient: 'from-emerald-500 to-teal-500' },
              { icon: Video, title: 'Built-in Video Call', desc: 'Face-to-face tutoring without leaving the app. Crystal-clear video with zero student setup.', gradient: 'from-sky-500 to-blue-500' },
              { icon: Brain, title: 'AI-Powered Tools', desc: 'Auto-generate quizzes, plot graphs, balance equations, and summarize notes — all from your board.', gradient: 'from-purple-500 to-violet-500' },
              { icon: Calculator, title: 'Math Toolkit', desc: 'Graph functions, solve equations, and visualize geometry. Purpose-built for math tutoring.', gradient: 'from-amber-500 to-orange-500' },
              { icon: FlaskConical, title: 'Science Lab Tools', desc: 'Chemical equation balancer, lab report generators, and diagram tools for science tutors.', gradient: 'from-rose-500 to-pink-500' },
              { icon: Languages, title: 'Language Arts', desc: 'Grammar checks, phonics helpers, vocabulary quizzes, and writing prompts for ELA tutors.', gradient: 'from-indigo-500 to-blue-500' },
            ].map((item) => (
              <div key={item.title} className="group rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-lg hover:border-emerald-100 transition-all hover:-translate-y-1">
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

      {/* ===== STATS ===== */}
      <section className="py-16 bg-gray-50/80 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10,000+', label: 'Lessons Taught' },
              { value: '500+', label: 'Active Tutors' },
              { value: '50,000+', label: 'AI Tools Used' },
              { value: '4.9/5', label: 'Tutor Rating' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-sky-500 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
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
                <div className="absolute -top-3 -left-2 text-7xl font-black text-gray-100 group-hover:text-emerald-100 transition-colors select-none">{item.step}</div>
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

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
              Loved by <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent">Tutors Everywhere</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah Chen', role: 'Math Tutor, NYC', text: 'Superboard replaced my physical whiteboard, Zoom, and three different math tools. My students are more engaged than ever.', rating: 5 },
              { name: 'James Rodriguez', role: 'Science Teacher, LA', text: 'The chemical equation balancer and diagram generator save me 30 minutes per lesson. This is what edtech should be.', rating: 5 },
              { name: 'Emily Park', role: 'ELA Tutor, Chicago', text: 'I love that my students don\'t need to create accounts. I just send a link and we\'re drawing together in seconds.', rating: 5 },
            ].map((item) => (
              <div key={item.name} className="rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">&ldquo;{item.text}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-20 md:py-28 bg-gray-50/80">
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

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Free</h3>
                <p className="text-sm text-gray-500 mt-1">Get started with the basics</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">$0</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>
              <Button className="w-full rounded-xl border-gray-200 font-semibold text-sm h-11" variant="outline" onClick={() => setShowAuth('register')}>
                Get Started
              </Button>
              <ul className="mt-6 space-y-3">
                {['1 active room', '25 AI credits/week', '120 min video/week', 'Basic whiteboard'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />{f}</li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-emerald-500 bg-white p-6 shadow-lg shadow-emerald-500/10 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full gradient-primary text-white text-xs font-semibold">Most Popular</div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Pro Tutor</h3>
                <p className="text-sm text-gray-500 mt-1">For serious educators</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">$10</span>
                <span className="text-gray-500 text-sm">/month</span>
                <p className="text-xs text-emerald-600 mt-1">Or $96/year (save 20%)</p>
              </div>
              <Button className="w-full rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 text-sm h-11" onClick={() => setShowAuth('register')}>
                Upgrade to Pro
              </Button>
              <ul className="mt-6 space-y-3">
                {['Unlimited rooms', '500 AI credits/month', 'Unlimited video', 'Save/Load boards', 'Templates', 'PDF export', 'GeoGebra integration', '2 recordings/month'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />{f}</li>
                ))}
              </ul>
            </div>

            {/* Agency */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Agency</h3>
                <p className="text-sm text-gray-500 mt-1">For tutoring centers</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">$39</span>
                <span className="text-gray-500 text-sm">/month + $1.50/student</span>
              </div>
              <Button className="w-full rounded-xl border-gray-200 font-semibold text-sm h-11" variant="outline" onClick={() => setShowAuth('register')}>
                Contact Sales
              </Button>
              <ul className="mt-6 space-y-3">
                {['Everything in Pro', '5,000 AI credits/month', 'Unlimited recordings', 'White-label branding', 'Admin dashboard', 'Sub-tutor management', 'Custom domain', 'Priority support'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
            Ready to Transform Your Tutoring?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
            Join hundreds of tutors who have already made the switch. Your first lesson is free.
          </p>
          <Button className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-[15px] px-8 h-12" onClick={() => setShowAuth('register')}>
            Get Started Free <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-50 border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Superboard</span>
          </div>
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Superboard. Built for K-12 tutors.</p>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">Features</a>
            <a href="#pricing" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">Pricing</a>
          </div>
        </div>
      </footer>

      {/* ===== AUTH DIALOG ===== */}
      <Dialog open={showAuth !== null} onOpenChange={(open) => { if (!open) closeAuth(); }}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          {showAuth === 'login' ? (
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
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                  <Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                  <Input id="login-password" type="password" placeholder="Your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="rounded-xl" required />
                </div>
                {authError && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{authError}</p>}
                <Button type="submit" className="w-full rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">Sign In</Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <button type="button" className="text-emerald-600 font-medium hover:underline" onClick={() => setShowAuth('register')}>Sign up</button>
                </p>
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
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-sm font-medium">Email</Label>
                  <Input id="register-email" type="email" placeholder="you@example.com" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} className="rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-sm font-medium">Password</Label>
                  <Input id="register-password" type="password" placeholder="Min. 6 characters" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className="rounded-xl" required />
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
    </main>
  );
}

export default LandingPage;
