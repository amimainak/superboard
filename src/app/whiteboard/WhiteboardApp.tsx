// ============================================================
// WhiteboardApp — Client wrapper for the whiteboard
// ============================================================
// Keeps the ErrorBoundary + dynamic import pattern that
// previously lived in src/app/page.tsx. Extracted so that
// src/app/whiteboard/page.tsx can be a Server Component
// (server components cannot use next/dynamic with ssr:false).
//
// Task #41 — Accessibility + auth UX fixes applied here:
//   - Fix #10: user-friendly ErrorBoundary with Try Again / Reload
//              buttons + collapsible Technical Details section
//   - Fix #12: semantic sr-only headings (h1/h2) for screen readers
//   - Fix #13: skip-to-content link (focuses #main-canvas)
//   - Fix #14: aria-live region (#announcements) for dynamic
//              notifications driven from WhiteboardClient

'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import {
  WidgetPanel,
  WidgetToggleBar,
  ConnectionStatus,
} from '@/components/room/widgets'
import { OnboardingModal } from '@/components/room/OnboardingModal'
import '@/components/room/widgets/widgets.css'

const WhiteboardClient = dynamic(() => import('../WhiteboardClient'), {
  ssr: false,
  loading: () => (
    <div className="skeleton-page">
      <div className="skeleton-center">
        <div className="skeleton-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
        </div>
        <div className="skeleton-text">Loading Whiteboard...</div>
      </div>
    </div>
  ),
})

// ============================================================
// Error Boundary — user-friendly message (Fix #10)
// Replaces the raw stack trace with a friendly message and a
// collapsible "Technical Details" section (collapsed by default).
// ============================================================
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null; showDetails: boolean }
> {
  state: { error: Error | null; showDetails: boolean } = {
    error: null,
    showDetails: false,
  }

  static getDerivedStateFromError(error: Error) {
    return { error, showDetails: false }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Whiteboard Error:', error, info)
  }

  handleTryAgain = () => {
    this.setState({ error: null, showDetails: false })
  }

  handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload()
  }

  toggleDetails = () => {
    this.setState((s) => ({ showDetails: !s.showDetails }))
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#fef2f2',
            fontFamily: 'inherit',
            padding: 24,
          }}
        >
          {/* Icon — warning in red circle */}
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              color: 'white',
              fontSize: 28,
              lineHeight: 1,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            }}
          >
            ⚠️
          </div>

          {/* Title */}
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: 22,
              fontWeight: 600,
              color: '#991b1b',
            }}
          >
            Something went wrong
          </h2>

          {/* Message */}
          <p
            style={{
              margin: '0 0 24px',
              fontSize: 14,
              color: '#b91c1c',
              maxWidth: 440,
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            We&apos;re sorry — an unexpected error occurred. Your work has been
            auto-saved.
          </p>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button
              onClick={this.handleTryAgain}
              style={{
                padding: '10px 22px',
                borderRadius: 8,
                border: 'none',
                background: '#ef4444',
                color: 'white',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                boxShadow: '0 1px 3px rgba(239, 68, 68, 0.4)',
              }}
            >
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 22px',
                borderRadius: 8,
                border: '1px solid #fecaca',
                background: 'white',
                color: '#991b1b',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Reload Page
            </button>
          </div>

          {/* Collapsible Technical Details (collapsed by default) */}
          <div style={{ width: '100%', maxWidth: 640 }}>
            <button
              onClick={this.toggleDetails}
              aria-expanded={this.state.showDetails}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                border: '1px solid #fecaca',
                borderRadius: 6,
                background: 'transparent',
                color: '#991b1b',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <span aria-hidden="true">
                {this.state.showDetails ? '▾' : '▸'}
              </span>
              Technical Details
            </button>
            {this.state.showDetails && (
              <pre
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: '#7f1d1d',
                  background: '#fff1f2',
                  padding: 12,
                  borderRadius: 8,
                  maxWidth: 640,
                  overflow: 'auto',
                  maxHeight: 200,
                  border: '1px solid #fecaca',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function WhiteboardApp() {
  return (
    <ErrorBoundary>
      <div className="room-layout">
        {/* Fix #13: Skip-to-content link — visible only when focused */}
        <a href="#main-canvas" className="skip-link">
          Skip to main content
        </a>

        <div className="room-main">
          {/* Fix #12: Semantic headings for screen readers */}
          <h1 className="sr-only">Superboard Whiteboard</h1>
          <h2 className="sr-only">Drawing Tools</h2>

          <WhiteboardClient />

          {/* Fix #12: Heading for the subject widget panel */}
          <h2 className="sr-only">Subject Widgets</h2>
          <WidgetToggleBar />
        </div>

        {/* Fix #14: aria-live region for dynamic screen-reader announcements */}
        <div aria-live="polite" className="sr-only" id="announcements"></div>

        <WidgetPanel roomId="home" />

        {/* Connection status indicator (Fix #20) */}
        <ConnectionStatus />

        {/* Fix #3 — Onboarding modal (first visit only).
            Rendered here at the wrapper layer so it shows even before the
            dynamically-imported WhiteboardClient chunk finishes loading. */}
        <OnboardingModal />
      </div>
    </ErrorBoundary>
  )
}
