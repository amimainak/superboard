'use client'

// ============================================================
// BoardLibrary — Tutor's private board library
// Search, filter, archive, version history, open boards
// ============================================================

import React, { useState, useEffect, useCallback } from 'react'
import { useTutorPreferences } from '@/hooks/useTutorPreferences'
import { StartLessonDialog } from '@/components/dashboard/start-lesson/StartLessonDialog'
import { AssignHomeworkDialog } from '@/components/dashboard/start-lesson/AssignHomeworkDialog'

interface Board {
  id: string
  title: string | null
  subject: string
  studentName: string | null
  isArchived: boolean
  isActive: boolean
  createdAt: string
  lastOpenedAt: string | null
  tags: string[]
  durationMinutes: number
  _count: { pages: number; boardVersions: number }
}

interface LibraryResponse {
  boards: Board[]
  total: number
  activeCount: number
  freeTierLimit: number
  canCreateMore: boolean
}

export function BoardLibrary({ isDark }: { isDark: boolean }) {
  const { prefs } = useTutorPreferences()
  const [data, setData] = useState<LibraryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null)
  const [versions, setVersions] = useState<Array<{ id: string; versionNum: number; createdAt: string }>>([])
  const [showVersions, setShowVersions] = useState(false)
  const [startLessonBoard, setStartLessonBoard] = useState<Board | null>(null)
  const [assignHomeworkBoard, setAssignHomeworkBoard] = useState<Board | null>(null)

  const s = {
    bg: isDark ? '#0f172a' : '#ffffff',
    surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#94a3b8' : '#475569',
    bright: isDark ? '#e2e8f0' : '#1e293b',
    accent: '#3b82f6',
  }

  const fetchLibrary = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: statusFilter, limit: '100' })
      if (search) params.set('q', search)
      if (subjectFilter) params.set('subject', subjectFilter)
      const res = await fetch(`/api/library?${params}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error('[Library] Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, subjectFilter])

  useEffect(() => { fetchLibrary() }, [fetchLibrary])

  const handleArchive = async (boardId: string, archive: boolean) => {
    try {
      await fetch(`/api/library/${boardId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: archive ? 'archive' : 'unarchive' }),
      })
      fetchLibrary()
    } catch (err) {
      console.error('[Library] Archive failed:', err)
    }
  }

  const handleDuplicate = async (boardId: string) => {
    try {
      const res = await fetch(`/api/library/${boardId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate' }),
      })
      if (res.ok) {
        fetchLibrary()
      }
    } catch (err) {
      console.error('[Library] Duplicate failed:', err)
    }
  }

  const handleDelete = async (boardId: string) => {
    if (!confirm('Permanently delete this board? This cannot be undone.')) return
    try {
      await fetch(`/api/library/${boardId}`, { method: 'DELETE' })
      fetchLibrary()
    } catch (err) {
      console.error('[Library] Delete failed:', err)
    }
  }

  const handleSaveMetadata = async (boardId: string, field: string, value: string) => {
    try {
      await fetch('/api/library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, [field]: value }),
      })
      fetchLibrary()
    } catch (err) {
      console.error('[Library] Save failed:', err)
    }
  }

  const fetchVersions = async (boardId: string) => {
    try {
      const res = await fetch(`/api/library/${boardId}/versions`)
      if (res.ok) {
        const json = await res.json()
        setVersions(json.versions || [])
      }
    } catch (err) {
      console.error('[Library] Versions fetch failed:', err)
    }
  }

  const handleCheckpoint = async (boardId: string) => {
    try {
      const pages = await fetch(`/api/rooms/${boardId}/pages`).then(r => r.json())
      const snapshot = { pages: Array.isArray(pages) ? pages.map((p: { pageIndex: number; snapshot: unknown }) => ({ pageIndex: p.pageIndex, elements: (p.snapshot as { elements?: unknown[] })?.elements || [] })) : [] }
      await fetch(`/api/library/${boardId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      })
      fetchVersions(boardId)
    } catch (err) {
      console.error('[Library] Checkpoint failed:', err)
    }
  }

  const handleRestore = async (boardId: string, versionNum: number) => {
    if (!confirm(`Restore version ${versionNum}? This creates a new version — history is preserved.`)) return
    try {
      await fetch(`/api/library/${boardId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true, versionNum }),
      })
      fetchVersions(boardId)
    } catch (err) {
      console.error('[Library] Restore failed:', err)
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    const d = new Date(iso)
    const now = new Date()
    const diffH = (now.getTime() - d.getTime()) / 3600000
    if (diffH < 1) return 'Just now'
    if (diffH < 24) return `${Math.floor(diffH)}h ago`
    if (diffH < 168) return `${Math.floor(diffH / 24)}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const subjects = ['GENERAL', 'MATH', 'SCIENCE', 'LANGUAGE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'ENGLISH']

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', padding: 24, minHeight: '100vh', background: s.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: s.bright, margin: 0 }}>📚 My Library</h1>
          <p style={{ fontSize: 13, color: s.text, marginTop: 4 }}>
            {data ? `${data.total} boards · ${data.activeCount} active${data.freeTierLimit ? ` (limit: ${data.freeTierLimit})` : ''}` : 'Loading...'}
          </p>
        </div>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search boards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 200px', padding: '8px 12px', borderRadius: 8,
            border: `1px solid ${s.border}`, background: s.surface,
            color: s.bright, fontSize: 13, outline: 'none',
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'active' | 'archived' | 'all')}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${s.border}`, background: s.surface, color: s.bright, fontSize: 13 }}
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${s.border}`, background: s.surface, color: s.bright, fontSize: 13 }}
        >
          <option value="">All subjects</option>
          {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
        </select>
      </div>

      {/* Board list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: s.text }}>Loading...</div>
      ) : !data || data.boards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: s.text }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <p>No boards found. Create a room to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.boards.map(board => (
            <div
              key={board.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderRadius: 10, border: `1px solid ${s.border}`, background: s.surface,
                cursor: 'pointer', transition: 'border-color 0.15s',
                opacity: board.isArchived ? 0.6 : 1,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = s.accent }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = s.border }}
            >
              {/* Click to open */}
              <div
                style={{ flex: 1, minWidth: 0 }}
                onClick={() => { window.open(`/room/${board.id}`, '_blank'); handleSaveMetadata(board.id, 'lastOpenedAt', new Date().toISOString()) }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: s.bright }}>
                    {board.title || 'Untitled Board'}
                  </span>
                  {board.isActive && (
                    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 600 }}>LIVE</span>
                  )}
                  {board.isArchived && (
                    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(100,116,139,0.15)', color: s.text, fontWeight: 600 }}>ARCHIVED</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: s.text }}>
                  <span>{board.subject}</span>
                  {board.studentName && <span>· {board.studentName}</span>}
                  <span>· {board._count.pages} pages</span>
                  <span>· {formatDate(board.lastOpenedAt || board.createdAt)}</span>
                  {board._count.boardVersions > 0 && <span>· {board._count.boardVersions} versions</span>}
                </div>
                {board.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {board.tags.map(tag => (
                      <span key={tag} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.1)', color: s.accent }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                {/* Start Lesson — gated by preference, primary action */}
                {prefs.startLessonFromLibrary && !board.isArchived && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setStartLessonBoard(board) }}
                    title="Start a new lesson from this board"
                    style={{
                      ...btnStyle(s),
                      background: 'linear-gradient(135deg, #059669, #0891b2)',
                      color: 'white',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    Start
                  </button>
                )}
                {/* Assign Homework — always available, secondary action */}
                {!board.isArchived && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setAssignHomeworkBoard(board) }}
                    title="Assign this board as homework"
                    style={{
                      ...btnStyle(s),
                      background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                      color: 'white',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                    HW
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedBoard(board); setShowVersions(true); fetchVersions(board.id) }}
                  title="Version history"
                  style={btnStyle(s)}
                >📋</button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDuplicate(board.id) }}
                  title="Duplicate"
                  style={btnStyle(s)}
                >⯑</button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleArchive(board.id, !board.isArchived) }}
                  title={board.isArchived ? 'Unarchive' : 'Archive'}
                  style={btnStyle(s)}
                >{board.isArchived ? '📤' : '📥'}</button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(board.id) }}
                  title="Delete"
                  style={{ ...btnStyle(s), color: '#f87171' }}
                >🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Version history panel */}
      {showVersions && selectedBoard && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowVersions(false)}
        >
          <div
            style={{ background: s.bg, borderRadius: 12, padding: 24, maxWidth: 400, width: '90%', maxHeight: '80vh', overflowY: 'auto', border: `1px solid ${s.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: s.bright, margin: 0 }}>Version History</h2>
              <button onClick={() => setShowVersions(false)} style={{ background: 'none', border: 'none', color: s.text, cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <p style={{ fontSize: 11, color: s.text, marginBottom: 16 }}>
              {selectedBoard.title || 'Untitled Board'} — max 10 versions, oldest auto-deleted
            </p>

            <button
              onClick={() => handleCheckpoint(selectedBoard.id)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${s.border}`, background: s.surface, color: s.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}
            >
              💾 Save checkpoint now
            </button>

            {versions.length === 0 ? (
              <p style={{ textAlign: 'center', color: s.text, fontSize: 12, padding: 24 }}>No saved versions yet. Click "Save checkpoint" to create one.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {versions.map(v => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 6, background: s.surface, border: `1px solid ${s.border}` }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: s.bright }}>v{v.versionNum}</span>
                      <span style={{ fontSize: 11, color: s.text, marginLeft: 8 }}>{formatDate(v.createdAt)}</span>
                    </div>
                    <button
                      onClick={() => handleRestore(selectedBoard.id, v.versionNum)}
                      style={{ padding: '4px 10px', borderRadius: 5, border: `1px solid ${s.border}`, background: 'transparent', color: s.accent, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start Lesson Dialog (library mode) */}
      {startLessonBoard && (
        <StartLessonDialog
          mode="library"
          open={!!startLessonBoard}
          onOpenChange={(open) => { if (!open) setStartLessonBoard(null) }}
          boardId={startLessonBoard.id}
          boardTitle={startLessonBoard.title || 'Untitled board'}
        />
      )}

      {/* Assign Homework Dialog (library mode) */}
      {assignHomeworkBoard && (
        <AssignHomeworkDialog
          mode="library"
          open={!!assignHomeworkBoard}
          onOpenChange={(open) => { if (!open) setAssignHomeworkBoard(null) }}
          boardId={assignHomeworkBoard.id}
          boardTitle={assignHomeworkBoard.title || 'Untitled board'}
        />
      )}
    </div>
  )
}

function btnStyle(s: { surface: string; border: string; text: string }): React.CSSProperties {
  return {
    padding: '4px 8px', borderRadius: 6, border: 'none', background: 'transparent',
    color: s.text, cursor: 'pointer', fontSize: 14, lineHeight: 1,
  }
}
