'use client'

import React, { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  isDark?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Catches rendering errors inside the whiteboard canvas
 * without taking down the entire application.
 */
export class CanvasErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[CanvasErrorBoundary]', error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const isDark = this.props.isDark ?? false
      const bg = isDark ? '#0f172a' : '#f8fafc'
      const fg = isDark ? '#e5e7eb' : '#111827'
      const muted = isDark ? '#6b7280' : '#9ca3af'
      const cardBg = isDark ? '#1e293b' : '#ffffff'
      const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

      return (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: bg, color: fg, fontFamily: 'inherit', zIndex: 9999,
        }}>
          <div style={{
            maxWidth: 400, padding: 32, borderRadius: 12,
            background: cardBg, border: `1px solid ${border}`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{'⚠'}</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>Canvas Error</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: muted, lineHeight: 1.5 }}>
              Something went wrong while rendering the canvas.
              {this.state.error?.message && (
                <span style={{ display: 'block', marginTop: 8, fontSize: 11, fontFamily: 'monospace', opacity: 0.7 }}>
                  {this.state.error.message}
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                  background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)',
                  color: '#34d399', fontWeight: 500,
                }}
              >
                Retry
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                  background: 'rgba(100,116,139,0.1)', border: `1px solid ${border}`,
                  color: muted, fontWeight: 500,
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
