// ============================================================
// /your-data — Public trust page (F-07 Phase 4)
// ============================================================
// The marketing surface of the data export feature. Linked from
// the landing page footer, this page explains the data philosophy
// in plain language and points tutors to the in-app export button.
//
// Public route — no auth required.
// ============================================================

import Link from 'next/link'
import { Download, Shield, Eye, Heart } from 'lucide-react'

export const metadata = {
  title: 'Your data is yours — Superboard',
  description: 'Export everything from Superboard in one click. Every board as a PDF, plus a portable JSON of your students, homework, and notes.',
}

export default function YourDataPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900">Superboard</span>
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
            Go to dashboard →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium mb-6">
          <Shield className="w-3.5 h-3.5" />
          No lock-in. No hostages.
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">
          Your data is yours.
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Export everything — every board as a PDF, plus a portable JSON of your students, homework, and notes — in one click. We never delete anything when you export. This is a copy, not a migration.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white font-semibold shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            Export my data
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            How it works
          </a>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          The export button is in your dashboard → Settings → Your Data.
        </p>
      </section>

      {/* What you get */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">What&apos;s in the export</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
              <Download className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Every board as PDF</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Each of your saved boards becomes a multi-page PDF — one page per board page. Crisp, printable, shareable with parents.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Portable JSON</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your student roster, homework assignments, and lesson notes as structured JSON. Importable into any other system if you ever leave.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">No tokens, no secrets</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Join tokens, assignment tokens, and auth credentials are stripped from the export. Only what you created — never the keys to the kingdom.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">How it works</h2>
        <div className="space-y-4">
          {[
            { n: 1, title: 'Click export', body: 'Settings → Your Data → Export all my data. One click.' },
            { n: 2, title: 'We build it in the background', body: 'A background job renders every board to PDF and packages everything into a ZIP. Usually ready in a few minutes.' },
            { n: 3, title: 'Get an email', body: 'We email you when it\'s ready, with a download link. The link works for 7 days.' },
            { n: 4, title: 'Your data stays put', body: 'Nothing is deleted. Your boards, students, and history stay right where they are. The export is a copy.' },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-white font-bold flex items-center justify-center flex-shrink-0">
                {step.n}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{step.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Philosophy */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-center">
          <Heart className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Why we built this</h2>
          <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">
            We&apos;ve seen too many tools that behave like hostage-takers — your work goes in, but it never comes out. That fear stops tutors from committing to any platform. We want to remove the brake before it even gets pressed. Our real hold is the accumulated value and the daily habits — not the exit door. If we ever stop being useful, you should be able to leave with everything intact.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-slate-500">
            Questions? <a href="mailto:support@superboard.live" className="text-emerald-600 hover:underline">support@superboard.live</a>
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Link href="/privacy" className="hover:text-slate-700">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-700">Terms</Link>
            <Link href="/" className="hover:text-slate-700">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
