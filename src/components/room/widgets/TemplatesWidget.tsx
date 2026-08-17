// ============================================================
// Superboard — Templates Library Widget
// Browse, search, and load saved whiteboard templates.
// ============================================================

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface Template {
  id: string
  name: string
  subject: string
  snapshot: {
    pages?: Array<{
      pageIndex: number
      elements: any[] // eslint-disable-line
    }>
  }
  createdAt: string
}

const SUBJECT_ICONS: Record<string, string> = {
  GENERAL: '📋',
  MATH: '📐',
  SCIENCE: '🧪',
  LANGUAGE: '📖',
  HISTORY: '🏛️',
  ART: '🎨',
  MUSIC: '🎵',
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function TemplatesWidget({ roomId }: { roomId: string }) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadState = useWhiteboardStore((s) => s.loadState)
  const setPages = useWhiteboardStore((s) => s.setPages)
  const elements = useWhiteboardStore((s) => s.elements)
  const pages = useWhiteboardStore((s) => s.pages)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const filtered = templates.filter((t) => {
    const q = search.toLowerCase()
    return t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q)
  })

  const handleLoadTemplate = (template: Template) => {
    const snapshotPages = template.snapshot?.pages || []

    // Build pages array
    const storePages = snapshotPages.map((p, i) => ({
      id: `page-${p.pageIndex ?? i}`,
      name: `Page ${(p.pageIndex ?? i) + 1}`,
      index: p.pageIndex ?? i,
    }))

    // Build all elements
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allElements: any[] = []
    for (const p of snapshotPages) {
      const pageEls = (p.elements || []).map((el: any) => ({
        ...el,
        pageIndex: p.pageIndex ?? 0,
      }))
      allElements.push(...pageEls)
    }

    if (storePages.length > 0) {
      setPages(storePages)
    }
    loadState(allElements)
  }

  const handleSaveCurrentAsTemplate = async () => {
    const name = prompt('Template name:')
    if (!name) return
    const subject = prompt('Subject (GENERAL, MATH, SCIENCE, etc.):', 'GENERAL') || 'GENERAL'

    setSaving(true)
    try {
      const pagesToSave = pages.map((page, index) => {
        const pageElements = elements.filter((el) => el.pageIndex === index)
        return {
          pageIndex: index,
          elements: pageElements,
        }
      })

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.slice(0, 50),
          subject,
          snapshot: { pages: pagesToSave },
        }),
      })

      if (res.ok) {
        // Refresh the template list
        fetchTemplates()
      } else {
        alert('Failed to save template')
      }
    } catch (err) {
      console.error('Failed to save template:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="widget-content">
      {/* Search */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ position: 'relative' }}>
          <svg
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="templates-search-input"
          />
        </div>
      </div>

      {/* Template list */}
      <div className="templates-list">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: '#475569', fontSize: 13 }}>
            Loading templates...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', color: '#475569', textAlign: 'center', gap: 8 }}>
            <div style={{ fontSize: 28 }}>📋</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>No templates found</div>
            <div style={{ fontSize: 11 }}>Save your current board as a template to see it here.</div>
          </div>
        ) : (
          filtered.map((t) => {
            const pageCount = t.snapshot?.pages?.length || 0
            const icon = SUBJECT_ICONS[t.subject] || '📋'
            return (
              <button
                key={t.id}
                className="template-card"
                onClick={() => handleLoadTemplate(t)}
              >
                <div className="template-card-header">
                  <span className="template-card-icon">{icon}</span>
                  <span className="template-card-name">{t.name}</span>
                </div>
                <div className="template-card-meta">
                  <span>{icon} {pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
                  <span>&middot;</span>
                  <span>{formatDate(t.createdAt)}</span>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Save current as template button */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          className="templates-save-btn"
          onClick={handleSaveCurrentAsTemplate}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Current as Template'}
        </button>
      </div>
    </div>
  )
}
