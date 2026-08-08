// ============================================================
// Legal Page Layout — Shared chrome for all legal pages
// ============================================================
'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, ArrowLeft } from 'lucide-react';

export default function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Superboard</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">{title}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last updated: {lastUpdated}</p>
        </div>
        <div className="prose prose-gray dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900 dark:prose-headings:text-gray-50
          prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
          prose-li:text-gray-600 dark:prose-li:text-gray-300 prose-li:leading-relaxed
          prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-gray-900 dark:prose-strong:text-gray-100
          prose-ul:my-4 prose-ol:my-4
          prose-table:text-sm prose-th:font-semibold prose-th:text-gray-900 dark:prose-th:text-gray-100 prose-th:bg-gray-50 dark:prose-th:bg-gray-800/50 prose-th:px-3 prose-th:py-2 prose-th:border prose-th:border-gray-200 dark:prose-th:border-gray-700 prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-gray-200 dark:prose-td:border-gray-700"
        >
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} Superboard. All rights reserved.</p>
          <nav className="flex items-center gap-5">
            <Link href="/terms" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Terms</Link>
            <Link href="/privacy" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Privacy</Link>
            <Link href="/refund" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Refund Policy</Link>
            <Link href="/cookies" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Cookies</Link>
            <Link href="/contact" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
