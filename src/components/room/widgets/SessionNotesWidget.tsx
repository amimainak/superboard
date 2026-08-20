// ============================================================
// Superboard — Session Notes Widget
// Rich text editor with auto-save to Supabase.
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
  if (minutes < 60) return minutes + 'm ago'
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  return days + 'd ago'
}

export function SessionNotesWidget({ roomId }: SessionNotesWidgetProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<number | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [loading, setLoading] = useState(true)

  // Tick every 10s to update "auto-saved Xs ago" display
  useEffect(function () {
    const interval = setInterval(function () { setNow(Date.now()) }, 10_000)
    return function () { clearInterval(interval) }
  }, [])

  // Load saved notes from Supabase on mount
  useEffect(function () {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/rooms/' + roomId + '/notes')
        if (!res.ok) return
        const json = await res.json()
        if (cancelled) return
        if (json.content && editorRef.current) {
          editorRef.current.innerHTML = json.content
        }
        if (json.updatedAt) {
          const ts = new Date(json.updatedAt).getTime()
          lastSavedRef.current = ts
          setSavedAt(ts)
        }
      } catch {
        // network error — silent
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return function () { cancelled = true }
  }, [roomId])

  // Save to Supabase (debounced)
  const saveToSupabase = useCallback(async function () {
    const html = editorRef.current?.innerHTML ?? ''
    try {
      const res = await fetch('/api/rooms/' + roomId + '/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: html }),
      })
      if (res.ok) {
        const json = await res.json()
        const ts = new Date(json.updatedAt).getTime()
        lastSavedRef.current = ts
        setSavedAt(ts)
      }
    } catch {
      // network error — silent
    }
  }, [roomId])

  // Debounced save on input
  const handleInput = useCallback(function () {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(function () {
      saveToSupabase()
    }, 1500)
  }, [saveToSupabase])

  // Save on unmount
  useEffect(function () {
    return function () {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      // Fire-and-forget save
      const html = editorRef.current?.innerHTML ?? ''
      fetch('/api/rooms/' + roomId + '/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: html }),
      }).catch(function () { /* silent */ })
    }
  }, [roomId])

  // Keyboard shortcuts: Ctrl+B, Ctrl+I
  const handleKeyDown = useCallback(function (e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      document.execCommand('bold', false)
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      document.execCommand('italic', false)
    }
  }, [])

  // Format button handler
  const handleFormat = useCallback(function (command: string) {
    editorRef.current?.focus()
    document.execCommand(command, false)
  }, [])

  // Compute save label
  const saveLabel = savedAt !== null
    ? 'Auto-saved ' + timeAgoShort(now - savedAt)
    : 'Not yet saved'

  return (
    <div className={"widget-content widget-notes " + (isDark ? '' : 'widget-notes-light')}>
      {/* Format toolbar */}
      <div className={"notes-format-bar " + (isDark ? '' : 'notes-format-bar-light')}>
        <button
          className={"notes-format-btn " + (isDark ? '' : 'notes-format-btn-light')}
          onClick={function () { handleFormat('bold') }}
          title="Bold (Ctrl+B)"
          type="button"
        >
          <strong>B</strong>
        </button>
        <button
          className={"notes-format-btn " + (isDark ? '' : 'notes-format-btn-light')}
          onClick={function () { handleFormat('italic') }}
          title="Italic (Ctrl+I)"
          type="button"
        >
          <em>I</em>
        </button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        className={"notes-editor " + (isDark ? '' : 'notes-editor-light')}
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
      <div className={"notes-footer " + (isDark ? '' : 'notes-footer-light')}>
        <span className={"notes-save-status " + (isDark ? '' : 'notes-save-status-light')}>
          {loading ? 'Loading...' : (savedAt !== null ? 'Saved' : 'Not yet saved')} - {saveLabel}
        </span>
      </div>
    </div>
  )
}
