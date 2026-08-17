// ============================================================
// Superboard — Session Notes Widget
// Rich text editor with auto-save to localStorage.
// Supports bold (Ctrl+B) and italic (Ctrl+I) formatting.
// ============================================================

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface SessionNotesWidgetProps {
  roomId: string
}

/** Simple relative time formatter */
function timeAgoShort(ms: number): string {
  if (ms < 0) return 'just now'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 10) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}s ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function SessionNotesWidget({ roomId }: SessionNotesWidgetProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const storageKey = `sb-notes-${roomId}`
  const editorRef = useRef<HTMLDivElement>(null)
  const lastSavedRef = useRef<number | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())

  // Tick every 10s to update "auto-saved Xs ago" display
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10_000)
    return () => clearInterval(interval)
  }, [])

  // Load saved notes from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved && editorRef.current) {
        editorRef.current.innerHTML = saved
      }
      // Load save timestamp from a separate key
      const ts = localStorage.getItem(`${storageKey}-ts`)
      if (ts) {
        const parsed = parseInt(ts, 10)
        if (!isNaN(parsed)) {
          lastSavedRef.current = parsed
          setSavedAt(parsed)
        }
      }
    } catch {
      // localStorage unavailable — silent fail
    }
  }, [storageKey])

  // Debounced save to localStorage on input
  const handleInput = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const html = editorRef.current?.innerHTML ?? ''
      try {
        localStorage.setItem(storageKey, html)
        const ts = Date.now()
        localStorage.setItem(`${storageKey}-ts`, String(ts))
        lastSavedRef.current = ts
        setSavedAt(ts)
      } catch {
        // localStorage full or unavailable
      }
    }, 1000)
  }, [storageKey])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      const html = editorRef.current?.innerHTML ?? ''
      try {
        localStorage.setItem(storageKey, html)
        const ts = Date.now()
        localStorage.setItem(`${storageKey}-ts`, String(ts))
      } catch {
        // silent
      }
    }
  }, [storageKey])

  // Keyboard shortcuts: Ctrl+B, Ctrl+I
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      document.execCommand('bold', false)
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      document.execCommand('italic', false)
    }
  }, [])

  // Format button handler
  const handleFormat = useCallback((command: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false)
  }, [])

  // Compute save label
  const saveLabel = savedAt !== null
    ? `Auto-saved ${timeAgoShort(now - savedAt)}`
    : 'Not yet saved'

  return (
    <div className={`widget-content widget-notes ${isDark ? '' : 'widget-notes-light'}`}>
      {/* Format toolbar */}
      <div className={`notes-format-bar ${isDark ? '' : 'notes-format-bar-light'}`}>
        <button
          className={`notes-format-btn ${isDark ? '' : 'notes-format-btn-light'}`}
          onClick={() => handleFormat('bold')}
          title="Bold (Ctrl+B)"
          type="button"
        >
          <strong>B</strong>
        </button>
        <button
          className={`notes-format-btn ${isDark ? '' : 'notes-format-btn-light'}`}
          onClick={() => handleFormat('italic')}
          title="Italic (Ctrl+I)"
          type="button"
        >
          <em>I</em>
        </button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        className={`notes-editor ${isDark ? '' : 'notes-editor-light'}`}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        role="textbox"
        aria-multiline="true"
        aria-label="Session notes"
        data-placeholder="Start taking notes..."
      />

      {/* Footer status */}
      <div className={`notes-footer ${isDark ? '' : 'notes-footer-light'}`}>
        <span className={`notes-save-status ${isDark ? '' : 'notes-save-status-light'}`}>
          {savedAt !== null ? '💾' : '📝'} {saveLabel}
        </span>
      </div>
  )
}
