// ============================================================
// Landing Page — Superboard marketing page at /
// ============================================================
// Server Component. Renders marketing content (hero, features,
// grade bands, subjects, CTA, footer) with zero client-side JS.
// The interactive whiteboard lives at /whiteboard.
// ============================================================

import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------
// Page-level metadata (overrides the root layout default for `/`)
// ---------------------------------------------------------------
export const metadata: Metadata = {
  title: 'Superboard — Interactive Whiteboard for Tutors',
  description:
    '120+ interactive instructional widgets for Math, Science, Language Arts, and more. Built for tutors who want to show the HOW and WHY, not just the answer.',
  alternates: { canonical: '/' },
}

// ---------------------------------------------------------------
// Static content tables — kept at module scope so they're built
// once and never re-rendered on the client.
// ---------------------------------------------------------------

interface Feature {
  title: string
  description: string
  icon: ReactNode
}

const FEATURES: Feature[] = [
  {
    title: 'Interactive Widgets',
    description:
      'Every widget shows the HOW and WHY, not just the answer. Dynamic step-by-step derivations update in real time.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <path d="M14 17.5h7M17.5 14v7" />
      </svg>
    ),
  },
  {
    title: 'All Subjects, All Grades',
    description:
      'Math, Physics, Chemistry, Biology, Statistics, Language Arts, Earth Science, Arts & Music, and Classroom Tools — K-5 through 9-12.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    title: 'Real-Time Collaboration',
    description:
      'Draw together, share your screen, and guide students through concepts with live cursors and chat.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
]

interface GradeBand {
  band: string
  blurb: string
  examples: string
}

const GRADE_BANDS: GradeBand[] = [
  {
    band: 'K–5',
    blurb: 'Foundations & manipulatives',
    examples: 'Base-10 blocks, fraction circles, phonics builder, weather observer, rock sorter',
  },
  {
    band: '6–8',
    blurb: 'Concept builders & models',
    examples: 'Layered Earth cross-section, Moon phase simulator, sentence combining, story elements map',
  },
  {
    band: '9–12',
    blurb: 'Advanced derivations & labs',
    examples: 'Confidence interval builder, hypothesis test explorer, PCR gel electrophoresis, seismograph reader',
  },
  {
    band: 'All Grades',
    blurb: 'Cross-cutting classroom tools',
    examples: 'Quiz builder, flashcards, timers, raise hand, breakout rooms, session notes, parent portal',
  },
]

interface Subject {
  name: string
  emoji: string
  blurb: string
}

const SUBJECTS: Subject[] = [
  { name: 'Math', emoji: '➗', blurb: 'Function plotter, base-10 blocks, fraction circles, algebra tiles, equation stepper.' },
  { name: 'Physics', emoji: '⚛️', blurb: 'Projectile motion, circuit builder, free-body diagrams, wave simulator, optics bench.' },
  { name: 'Chemistry', emoji: '🧪', blurb: 'Periodic table explorer, balance equations, Lewis structures, pH simulator, gas laws.' },
  { name: 'Biology', emoji: '🧬', blurb: 'Microscope simulator, photosynthesis builder, dihybrid crosses, PCR electrophoresis, cladograms.' },
  { name: 'Language Arts', emoji: '📖', blurb: 'Sentence combining, story elements map, phonics builder, figurative language, vocab cards.' },
  { name: 'Statistics', emoji: '📊', blurb: 'Confidence intervals, hypothesis testing, central limit theorem demo, chi-square explorer.' },
  { name: 'Earth Science', emoji: '🌍', blurb: 'Layered Earth, Moon phases, eclipse models, atmospheric layers, Coriolis simulator, star life cycle.' },
  { name: 'Arts & Music', emoji: '🎨', blurb: 'Color wheel, note value trainer, rhythm builder, scale explorer, composition grid.' },
  { name: 'Classroom Tools', emoji: '🧰', blurb: 'Quizzes, flashcards, polls, breakout rooms, session notes, parent portal, scheduling.' },
]

const FOOTER_LINKS: { label: string; href: string }[] = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Login', href: '/login' },
  { label: 'Sign Up', href: '/signup' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: '/contact' },
]

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* ============================ NAV ============================ */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav
          className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6"
          aria-label="Primary"
        >
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-foreground"
            aria-label="Superboard home"
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-600 to-cyan-600 text-white shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
            </span>
            Superboard
          </Link>

          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="/pricing" className="hover:text-foreground transition-colors" aria-label="View pricing">
              Pricing
            </Link>
            <Link href="/whiteboard" className="hover:text-foreground transition-colors" aria-label="Open the whiteboard">
              Whiteboard
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors" aria-label="Contact us">
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Sign in to your account"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              aria-label="Start teaching free — create an account"
            >
              Start Free
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* ============================ HERO ============================ */}
        <section
          className="relative overflow-hidden"
          aria-labelledby="hero-heading"
        >
          {/* Ambient gradient backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-background to-background" />
            <div className="absolute -top-24 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute -right-24 top-32 h-[320px] w-[320px] rounded-full bg-cyan-400/20 blur-3xl" />
            {/* Dot-grid brand pattern */}
            <div
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #059669 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                maskImage:
                  'linear-gradient(to bottom, black 0%, transparent 70%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, black 0%, transparent 70%)',
              }}
            />
          </div>

          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <span aria-hidden="true">●</span>
                120+ interactive widgets across 9 subjects
              </div>

              <h1
                id="hero-heading"
                className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
              >
                The whiteboard that{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                  teaches with you
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-slate-600 sm:text-xl">
                120+ interactive instructional widgets for Math, Science,
                Language Arts, and more. Built for tutors, loved by students.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-600/30 sm:w-auto"
                  aria-label="Start teaching free — create a free tutor account"
                >
                  Start Teaching Free
                  <svg
                    className="ml-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
                <Link
                  href="/whiteboard"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
                  aria-label="See how it works — open the live whiteboard"
                >
                  See How It Works
                </Link>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                No credit card required. Free forever for individual tutors.
              </p>
            </div>

            {/* Hero illustration — stylized whiteboard mockup */}
            <div className="relative mx-auto mt-16 max-w-4xl">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                {/* Window chrome */}
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-red-400" aria-hidden="true" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" aria-hidden="true" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" aria-hidden="true" />
                  <span className="ml-3 text-xs font-medium text-slate-400">
                    superboard.live/whiteboard
                  </span>
                </div>

                {/* Canvas mockup */}
                <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-50 to-emerald-50/40">
                  <svg
                    viewBox="0 0 640 360"
                    className="absolute inset-0 h-full w-full"
                    role="img"
                    aria-label="Illustration of the Superboard whiteboard with subject toolkits, a function plotter, and a periodic table widget open on an infinite canvas"
                  >
                    {/* faint dot grid */}
                    <defs>
                      <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r="1" fill="#059669" opacity="0.18" />
                      </pattern>
                      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                    </defs>
                    <rect width="640" height="360" fill="url(#dots)" />

                    {/* Left toolbar */}
                    <g>
                      <rect x="16" y="24" width="44" height="312" rx="10" fill="white" stroke="#e2e8f0" />
                      <rect x="28" y="40" width="20" height="20" rx="5" fill="#ecfdf5" stroke="#059669" />
                      <circle cx="50" cy="82" r="8" fill="#f1f5f9" />
                      <rect x="32" y="108" width="16" height="16" rx="3" fill="#f1f5f9" />
                      <path d="M34 140 L48 148 L34 156 Z" fill="#f1f5f9" />
                      <rect x="30" y="172" width="20" height="14" rx="2" fill="#f1f5f9" />
                    </g>

                    {/* Function plotter widget */}
                    <g>
                      <rect x="92" y="40" width="280" height="170" rx="12" fill="white" stroke="#e2e8f0" />
                      <rect x="92" y="40" width="280" height="28" rx="12" fill="#f8fafc" />
                      <circle cx="106" cy="54" r="4" fill="#059669" />
                      <text x="118" y="58" fontFamily="sans-serif" fontSize="11" fill="#475569" fontWeight="600">
                        Function Plotter
                      </text>
                      {/* axes */}
                      <line x1="120" y1="180" x2="340" y2="180" stroke="#cbd5e1" strokeWidth="1" />
                      <line x1="230" y1="60" x2="230" y2="190" stroke="#cbd5e1" strokeWidth="1" />
                      {/* curve y = sin(x) */}
                      <path
                        d="M120 130 Q155 70 190 130 T260 130 T330 130"
                        fill="none"
                        stroke="url(#g1)"
                        strokeWidth="2.5"
                      />
                      <text x="316" y="200" fontFamily="monospace" fontSize="10" fill="#94a3b8">
                        y = sin(x)
                      </text>
                    </g>

                    {/* Periodic table widget */}
                    <g>
                      <rect x="92" y="226" width="200" height="110" rx="12" fill="white" stroke="#e2e8f0" />
                      <rect x="92" y="226" width="200" height="24" rx="12" fill="#f8fafc" />
                      <text x="104" y="242" fontFamily="sans-serif" fontSize="10" fill="#475569" fontWeight="600">
                        Periodic Table
                      </text>
                      {[
                        [104, 258], [128, 258], [152, 258], [176, 258], [200, 258], [224, 258], [248, 258], [272, 258],
                        [104, 282], [128, 282], [152, 282], [176, 282], [200, 282], [224, 282], [248, 282], [272, 282],
                        [104, 306], [128, 306], [152, 306], [176, 306], [200, 306], [224, 306], [248, 306], [272, 306],
                      ].map(([x, y], i) => (
                        <rect
                          key={i}
                          x={x}
                          y={y}
                          width="18"
                          height="18"
                          rx="3"
                          fill={i % 5 === 0 ? '#10b981' : i % 3 === 0 ? '#fde68a' : '#f1f5f9'}
                        />
                      ))}
                    </g>

                    {/* Sentence builder widget */}
                    <g>
                      <rect x="392" y="40" width="232" height="130" rx="12" fill="white" stroke="#e2e8f0" />
                      <rect x="392" y="40" width="232" height="28" rx="12" fill="#f8fafc" />
                      <text x="404" y="58" fontFamily="sans-serif" fontSize="11" fill="#475569" fontWeight="600">
                        Sentence Builder
                      </text>
                      {['The', 'fox', 'jumps', 'over'].map((w, i) => (
                        <g key={w}>
                          <rect
                            x={404 + i * 52}
                            y="84"
                            width="44"
                            height="22"
                            rx="6"
                            fill={i === 2 ? '#ecfdf5' : '#f8fafc'}
                            stroke={i === 2 ? '#059669' : '#e2e8f0'}
                          />
                          <text
                            x={426 + i * 52}
                            y="99"
                            fontFamily="sans-serif"
                            fontSize="10"
                            fill={i === 2 ? '#059669' : '#475569'}
                            textAnchor="middle"
                            fontWeight={i === 2 ? '600' : '400'}
                          >
                            {w}
                          </text>
                        </g>
                      ))}
                      <text x="404" y="138" fontFamily="sans-serif" fontSize="10" fill="#94a3b8">
                        Tap a word to highlight its role
                      </text>
                    </g>

                    {/* Live cursors */}
                    <g>
                      <path d="M340 220 L340 240 L346 234 L350 244 L354 242 L350 232 L358 232 Z" fill="#0891b2" />
                      <rect x="356" y="240" width="46" height="14" rx="3" fill="#0891b2" />
                      <text x="379" y="250" fontFamily="sans-serif" fontSize="9" fill="white" textAnchor="middle" fontWeight="600">
                        Mia
                      </text>

                      <path d="M260 120 L260 140 L266 134 L270 144 L274 142 L270 132 L278 132 Z" fill="#059669" />
                      <rect x="276" y="140" width="40" height="14" rx="3" fill="#059669" />
                      <text x="296" y="150" fontFamily="sans-serif" fontSize="9" fill="white" textAnchor="middle" fontWeight="600">
                        You
                      </text>
                    </g>
                  </svg>
                </div>
              </div>

              {/* Floating subject badges */}
              <div className="absolute -left-3 top-24 hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-lg sm:block">
                🧪 Chemistry
              </div>
              <div className="absolute -right-3 top-44 hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-lg sm:block">
                📊 Statistics
              </div>
              <div className="absolute -right-6 bottom-12 hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-lg md:block">
                🎨 Arts & Music
              </div>
            </div>
          </div>
        </section>

        {/* ============================ FEATURES ============================ */}
        <section
          className="border-t border-border/60 bg-card/30"
          aria-labelledby="features-heading"
        >
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                id="features-heading"
                className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
              >
                Built for tutors who teach the how and why
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Not just another drawing app. Superboard ships with the
                instructional widgets you actually use in a tutoring session —
                ready to drop on the canvas and adapt in real time.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5"
                >
                  <div
                    className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100"
                    aria-hidden="true"
                  >
                    <span className="h-5 w-5">{feature.icon}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================ GRADE BANDS ============================ */}
        <section aria-labelledby="grades-heading">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                id="grades-heading"
                className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
              >
                From kindergarten to AP Chemistry
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Every widget is tagged by grade band so you can find what you
                need in seconds — and reuse it across students.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {GRADE_BANDS.map((band) => (
                <div
                  key={band.band}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="mb-3 inline-flex w-fit items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {band.band}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {band.blurb}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    {band.examples}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================ SUBJECTS ============================ */}
        <section
          className="border-t border-border/60 bg-gradient-to-b from-background to-emerald-50/30"
          aria-labelledby="subjects-heading"
        >
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                id="subjects-heading"
                className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
              >
                Nine subjects. One canvas.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Each subject ships with its own toolkit of interactive
                widgets — built by educators, refined with students.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SUBJECTS.map((subject) => (
                <div
                  key={subject.name}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-emerald-200 hover:shadow-md"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-2xl"
                    aria-hidden="true"
                  >
                    {subject.emoji}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {subject.name}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {subject.blurb}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/whiteboard"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50/40"
                aria-label="Open the whiteboard and explore all subjects"
              >
                Explore all widgets on the canvas
                <svg
                  className="ml-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ============================ CTA ============================ */}
        <section
          className="relative overflow-hidden"
          aria-labelledby="cta-heading"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-emerald-400/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-cyan-400/30 blur-3xl"
          />

          <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-24">
            <h2
              id="cta-heading"
              className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              Ready to transform your tutoring?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-emerald-50/90">
              Spin up a board in seconds. Drop in a widget. Invite a student
              with a link. That&apos;s it.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
                aria-label="Start free — create your tutor account"
              >
                Start Free
                <svg
                  className="ml-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link
                href="/whiteboard"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/20 sm:w-auto"
                aria-label="Try the whiteboard without an account"
              >
                Try the Whiteboard
              </Link>
            </div>

            <p className="mt-5 text-sm text-emerald-50/80">
              No credit card required. Free forever for individual tutors.
            </p>
          </div>
        </section>
      </main>

      {/* ============================ FOOTER ============================ */}
      <footer className="border-t border-border bg-background" aria-labelledby="footer-heading">
        <h2 id="footer-heading" className="sr-only">
          Footer
        </h2>
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
            <div className="max-w-xs">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-semibold text-foreground"
                aria-label="Superboard home"
              >
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-600 to-cyan-600 text-white shadow-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19l7-7 3 3-7 7-3-3z" />
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                    <path d="M2 2l7.586 7.586" />
                    <circle cx="11" cy="11" r="2" />
                  </svg>
                </span>
                Superboard
              </Link>
              <p className="mt-3 text-sm text-muted-foreground">
                The interactive whiteboard built for tutors who want to show
                the how and why, not just the answer.
              </p>
            </div>

            <nav aria-label="Footer">
              <ul className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={`${link.label} — Superboard`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="mt-10 border-t border-border/60 pt-6">
            <p className="text-xs text-muted-foreground">
              © 2026 Superboard. Built for tutors.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
