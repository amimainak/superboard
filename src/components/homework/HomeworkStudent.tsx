'use client'

// ============================================================
// HomeworkStudent — Student homework whiteboard client
// ============================================================
// A stripped-down whiteboard with only the tools a student needs:
// pen, highlighter, eraser, text, shapes, undo/redo, zoom.
// No sidebar, no chat, no video, no templates — just the canvas
// and a prominent "Submit to Tutor" button.
// ============================================================

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { WhiteboardCanvas } from '@/components/whiteboard/WhiteboardCanvas'
import { LeftToolbar } from '@/components/whiteboard/LeftToolbar'
import { StylePanel } from '@/components/whiteboard/StylePanel'
import { PageTabs } from '@/components/whiteboard/PageTabs'
import type { WhiteboardElement } from '@/lib/whiteboard/types'

interface HomeworkData {
  id: string
  token: string
  title: string
  description: string | null
  status: string
  late: boolean
  dueAt: string | null
  isViewOnly: boolean
  studentSnapshot: unknown
  feedbackSnapshot: unknown
  submittedAt: string | null
}

interface HomeworkStudentProps {
  initialData: HomeworkData
}

export default function HomeworkStudent({ initialData }: HomeworkStudentProps) {
  const [data, setData] = useState<HomeworkData>(initialData)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showReturnedBanner, setShowReturnedBanner] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(initialData.isViewOnly)
  const lastSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadState = useWhiteboardStore((s) => s.loadState)
  const elements = useWhiteboardStore((s) => s.elements)
  const isDark = useWhiteboardStore((s) => s.isDark)

  // Load the student snapshot into the store on mount
  useEffect(() => {
    const snapshot = initialData.studentSnapshot as { elements?: WhiteboardElement[] } | null
    if (snapshot?.elements && Array.isArray(snapshot.elements)) {
      loadState(snapshot.elements)
    }
    if (initialData.status === 'returned') {
      setShowReturnedBanner(true)
    }
  }, [initialData, loadState])

  // Autosave (3-second debounce)
  useEffect(() => {
    if (!data || isReadOnly) return
    if (elements.length === 0 && saveStatus === 'idle') return

    if (lastSaveRef.current) clearTimeout(lastSaveRef.current)
    setSaveStatus('saving')

    lastSaveRef.current = setTimeout(async () => {
      try {
        const snapshot = { elements, camera: { x: 0, y: 0, zoom: 1 } }
        const res = await fetch(`/api/homework-assignments/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: data.token,
            studentSnapshot: snapshot,
          }),
        })
        if (res.ok) {
          setSaveStatus('saved')
        } else {
          setSaveStatus('error')
        }
      } catch {
        setSaveStatus('error')
      }
    }, 3000)

    return () => {
      if (lastSaveRef.current) clearTimeout(lastSaveRef.current)
    }
  }, [elements, data, isReadOnly, saveStatus])

  // Submit homework
  const handleSubmit = useCallback(async () => {
    if (!data) return
    setSubmitting(true)

    try {
      const snapshot = { elements, camera: { x: 0, y: 0, zoom: 1 } }
      const res = await fetch(`/api/homework-assignments/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: data.token,
          action: 'submit',
          studentSnapshot: snapshot,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        setIsReadOnly(true)
        setShowSubmitDialog(false)
        setShowCelebration(true)
        setData(prev => ({ ...prev, status: "submitted", isViewOnly: true, submittedAt: result.submittedAt }))
      } else {
        alert('Couldn\'t submit — check your connection and try again.')
      }
    } catch {
      alert('Couldn\'t submit — check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }, [data, elements])

  const dueText = data.dueAt
    ? new Date(data.dueAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' at ' +
      new Date(data.dueAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: isDark ? '#0f172a' : '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
        background: isDark ? '#0f172a' : '#ffffff', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📝</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b' }}>{data.title}</div>
            {dueText && (
              <div style={{ fontSize: 11, color: data.late ? '#ef4444' : '#64748b' }}>
                {data.late ? 'Late — ' : 'Due '} {dueText}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Save status */}
          {!isReadOnly && (
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && 'Saved a moment ago'}
              {saveStatus === 'error' && <span style={{ color: '#ef4444' }}>Couldn't save — check connection</span>}
              {saveStatus === 'idle' && ''}
            </span>
          )}

          {/* Status badges */}
          {isReadOnly && data.status === 'submitted' && (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e', padding: '2px 10px', background: 'rgba(34,197,94,0.1)', borderRadius: 4 }}>
              ✓ Submitted
            </span>
          )}
          {isReadOnly && data.status === 'reviewed' && (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', padding: '2px 10px', background: 'rgba(59,130,246,0.1)', borderRadius: 4 }}>
              ✓ Reviewed
            </span>
          )}
        </div>
      </div>

      {/* Returned banner */}
      {showReturnedBanner && (
        <div style={{
          padding: '8px 16px', background: '#fef3c7', borderBottom: '1px solid #fde68a',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>✏️</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>Your tutor sent this back — keep going!</span>
        </div>
      )}

      {/* Celebration overlay */}
      {showCelebration && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowCelebration(false)}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Nice work! Sent to your tutor 🎉</h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>You can close this page. Your work has been saved.</p>
            <button onClick={() => setShowCelebration(false)}
              style={{ marginTop: 16, padding: '8px 24px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              View my work
            </button>
          </div>
        </div>
      )}

      {/* Submit confirmation dialog */}
      {showSubmitDialog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', maxWidth: 360,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Ready to hand in your work?</h2>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
              You won't be able to edit after this — your tutor can unlock it if needed.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => setShowSubmitDialog(false)}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Keep working
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: submitting ? '#94a3b8' : '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Submitting...' : 'Hand in'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main whiteboard area */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Left toolbar (student-safe tools only) */}
        {!isReadOnly && <LeftToolbar />}

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <WhiteboardCanvas />
        </div>

        {/* Style panel (bottom bar) */}
        {!isReadOnly && <StylePanel />}
      </div>

      {/* Page tabs */}
      <PageTabs />

      {/* Submit bar — tablet-friendly (44px min touch target) */}
      {!isReadOnly && data.status !== 'submitted' && data.status !== 'reviewed' && (
        <div style={{
          padding: '12px 16px', borderTop: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
          background: isDark ? '#0f172a' : '#ffffff', display: 'flex', justifyContent: 'center',
          // Safe area inset for iPhone home indicator + iPad bottom
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}>
          <button
            onClick={() => setShowSubmitDialog(true)}
            style={{
              padding: '14px 40px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
              minHeight: 48,  // Apple HIG touch target
              touchAction: 'manipulation',  // no double-tap zoom
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Submit to Tutor
          </button>
        </div>
      )}
    </div>
  )
}
