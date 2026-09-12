'use client'

import React from 'react'

// ============================================================
// UploadProgressBar — overlay progress bar for image / PDF
// uploads (Task 42 / Fix #30). Reads are done client-side via
// FileReader, so "progress" is the local file-read progress.
// ============================================================

export interface UploadProgress {
  fileName: string
  loaded: number
  total: number
}

interface UploadProgressBarProps {
  progress: UploadProgress | null
  isDark?: boolean
}

export function UploadProgressBar({ progress, isDark = true }: UploadProgressBarProps) {
  if (!progress) return null
  const pct = progress.total > 0
    ? Math.min(100, Math.round((progress.loaded / progress.total) * 100))
    : 0
  const bg = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const muted = isDark ? '#94a3b8' : '#64748b'
  const fileName = progress.fileName.length > 32
    ? progress.fileName.slice(0, 29) + '…'
    : progress.fileName
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9000,
        width: 'min(360px, calc(100% - 32px))',
        padding: 14,
        borderRadius: 12,
        background: bg,
        border: `1px solid ${border}`,
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(8px)',
        pointerEvents: 'none',
        animation: 'superboard-upload-fade-in 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div
          aria-hidden="true"
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: '2px solid rgba(52,211,153,0.25)',
            borderTopColor: '#34d399',
            animation: 'superboard-upload-spin 0.8s linear infinite',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Uploading {fileName}
          </div>
          <div style={{ fontSize: 10, color: muted, marginTop: 1 }}>
            {pct < 100 ? `${pct}% · reading file…` : 'Processing…'}
          </div>
        </div>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(2, pct)}%`,
            background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
            borderRadius: 3,
            transition: 'width 0.12s ease-out',
          }}
        />
      </div>
      <style>{`
        @keyframes superboard-upload-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes superboard-upload-fade-in {
          from { opacity: 0; transform: translate(-50%, -48%); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </div>
  )
}

export default UploadProgressBar
