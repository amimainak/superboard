'use client'

import React from 'react'
import dynamic from 'next/dynamic'

const WhiteboardClient = dynamic(() => import('./WhiteboardClient'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f8fafc',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #059669, #0891b2)',
            margin: '0 auto 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
          Loading Whiteboard...
        </div>
      </div>
    </div>
  ),
})

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Whiteboard Error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#fef2f2',
          fontFamily: 'inherit',
          padding: 24,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: '#ef4444', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, color: 'white', fontSize: 24,
          }}>!</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, color: '#991b1b' }}>
            Something went wrong
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#b91c1c', maxWidth: 400, textAlign: 'center' }}>
            {this.state.error.message}
          </p>
          <pre style={{
            fontSize: 11, color: '#7f1d1d', background: '#fff1f2',
            padding: 12, borderRadius: 8, maxWidth: 600,
            overflow: 'auto', maxHeight: 200, border: '1px solid #fecaca',
          }}>
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 16, padding: '8px 20px', borderRadius: 8,
              border: 'none', background: '#ef4444', color: 'white',
              cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Home() {
  return (
    <ErrorBoundary>
      <WhiteboardClient />
    </ErrorBoundary>
  )
}
