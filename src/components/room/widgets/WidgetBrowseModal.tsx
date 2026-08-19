'use client'

import { useState, useMemo } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { useWidgetStore, type MarketplaceToolId } from '@/lib/room/widget-store'
import { MARKETPLACE_WIDGETS, COMING_SOON_WIDGETS, type WidgetManifest, type WidgetSubject, type GradeBand } from '@/lib/room/widget-registry'

// ============================================================
// In-session widget marketplace browser
// ============================================================

const SUBJECT_LABELS: Record<WidgetSubject, string> = {
  communication: 'Collaborate',
  productivity: 'Productivity',
  math: 'Math',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  language: 'Language',
  statistics: 'Statistics',
  earthscience: 'Earth Science',
  classroom: 'Classroom',
  other: 'Other',
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  free: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', border: 'rgba(34,197,94,0.25)' },
  pro: { bg: 'rgba(168,85,247,0.12)', text: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  agency: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
}

export function WidgetBrowseModal() {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const isOpen = useWidgetStore((s) => s.browseModalOpen)
  const setOpen = useWidgetStore((s) => s.setBrowseModalOpen)
  const installedTools = useWidgetStore((s) => s.installedTools)
  const installTool = useWidgetStore((s) => s.installTool)
  const uninstallTool = useWidgetStore((s) => s.uninstallTool)

  const [search, setSearch] = useState('')
  const [filterSubject, setFilterSubject] = useState<WidgetSubject | 'all'>('all')
  const [filterGrade, setFilterGrade] = useState<GradeBand | 'all'>('all')
  const [tab, setTab] = useState<'available' | 'installed' | 'coming_soon'>('available')
  const [saving, setSaving] = useState<MarketplaceToolId | null>(null)

  const marketplace = MARKETPLACE_WIDGETS
  const comingSoon = COMING_SOON_WIDGETS

  // Filter logic (hooks before early return)
  const filteredAvailable = useMemo(() => {
    return marketplace.filter(w => {
      if (search) {
        const q = search.toLowerCase()
        if (!w.label.toLowerCase().includes(q) && !w.description.toLowerCase().includes(q)) return false
      }
      if (filterSubject !== 'all' && w.subject !== filterSubject) return false
      if (filterGrade !== 'all' && !w.gradeBands.includes(filterGrade)) return false
      return true
    })
  }, [search, filterSubject, filterGrade, marketplace])

  const filteredInstalled = useMemo(() => {
    return marketplace.filter(w => installedTools.has(w.id))
  }, [installedTools, marketplace])

  if (!isOpen) return null

  const handleToggle = async (id: MarketplaceToolId, isInstalled: boolean) => {
    setSaving(id)
    try {
      // Read latest state from store to avoid stale closure
      const currentInstalled = useWidgetStore.getState().installedTools
      if (isInstalled) {
        uninstallTool(id)
      } else {
        installTool(id)
      }
      // Persist to server — compute from latest store state
      const newSet = new Set(currentInstalled)
      if (isInstalled) newSet.delete(id)
      else newSet.add(id)
      const res = await fetch('/api/user/widgets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installedTools: Array.from(newSet) }),
      })
      if (!res.ok) {
        // Rollback on failure
        if (isInstalled) installTool(id)
        else uninstallTool(id)
      }
    } catch (err) {
      console.error('Failed to persist widget install:', err)
      // Rollback on network error
      if (isInstalled) installTool(id)
      else uninstallTool(id)
    } finally {
      setSaving(null)
    }
  }

  // Styles
  const bg = isDark ? '#0f172a' : '#f8fafc'
  const overlay = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)'
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : 'white'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const muted = isDark ? '#64748b' : '#94a3b8'

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: overlay, backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: bg, borderRadius: 12, border: '1px solid ' + border,
        width: '100%', maxWidth: 520, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid ' + border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: text, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#34d399' : '#059669'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              Widget Library
            </div>
            <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>Browse and install teaching tools</div>
          </div>
          <button onClick={() => setOpen(false)} style={{
            width: 28, height: 28, borderRadius: 6, border: '1px solid ' + border,
            background: 'none', color: muted, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Search + Filters */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + border }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            style={{
              width: '100%', padding: '8px 10px 8px 32px', borderRadius: 6, fontSize: 12,
              background: isDark ? 'rgba(255,255,255,0.05)' : 'white',
              border: '1px solid ' + border, color: text, outline: 'none',
              backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%2394a3b8\" stroke-width=\"2\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.3-4.3\"/></svg>')",
              backgroundRepeat: 'no-repeat', backgroundPosition: '10px center',
            }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value as WidgetSubject | 'all')} style={{
              padding: '4px 8px', borderRadius: 4, fontSize: 10, background: isDark ? 'rgba(255,255,255,0.05)' : 'white',
              border: '1px solid ' + border, color: text, cursor: 'pointer',
            }}>
              <option value="all">All Subjects</option>
              {Object.entries(SUBJECT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value as GradeBand | 'all')} style={{
              padding: '4px 8px', borderRadius: 4, fontSize: 10, background: isDark ? 'rgba(255,255,255,0.05)' : 'white',
              border: '1px solid ' + border, color: text, cursor: 'pointer',
            }}>
              <option value="all">All Grades</option>
              <option value="K-2">K-2</option>
              <option value="3-5">3-5</option>
              <option value="6-8">6-8</option>
              <option value="9-12">9-12</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid ' + border }}>
          {(['available', 'installed', 'coming_soon'] as const).map((t) => {
            const count = t === 'available' ? filteredAvailable.length : t === 'installed' ? filteredInstalled.length : comingSoon.length
            const active = tab === t
            return (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '8px 12px', fontSize: 11, fontWeight: active ? 600 : 500,
                color: active ? (isDark ? '#34d399' : '#059669') : muted,
                borderBottom: active ? '2px solid ' + (isDark ? '#34d399' : '#059669') : '2px solid transparent',
                background: 'none', border: 'none', borderBottomWidth: 2,
                borderBottomStyle: 'solid', borderBottomColor: active ? (isDark ? '#34d399' : '#059669') : 'transparent',
                cursor: 'pointer', textTransform: 'capitalize',
              }}>
                {t.replace('_', ' ')} ({count})
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tab === 'available' && (
            filteredAvailable.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: muted, fontSize: 12 }}>
                No tools match your filters. Try adjusting search or filters.
              </div>
            ) : (
              filteredAvailable.map(w => (
                <ToolCard
                  key={w.id}
                  manifest={w}
                  isDark={isDark}
                  isInstalled={installedTools.has(w.id)}
                  isSaving={saving === w.id}
                  onToggle={() => handleToggle(w.id, installedTools.has(w.id))}
                />
              ))
            )
          )}

          {tab === 'installed' && (
            filteredInstalled.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: muted, fontSize: 12 }}>
                No tools installed yet. Browse the Available tab to find tools.
              </div>
            ) : (
              filteredInstalled.map(w => (
                <ToolCard
                  key={w.id}
                  manifest={w}
                  isDark={isDark}
                  isInstalled={true}
                  isSaving={saving === w.id}
                  onToggle={() => handleToggle(w.id, true)}
                />
              ))
            )
          )}

          {tab === 'coming_soon' && (
            comingSoon.map(w => (
              <ToolCard key={w.id} manifest={w} isDark={isDark} isInstalled={false} isSaving={false} onToggle={() => {}} isComingSoon />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Tool Card Component
// ============================================================

function ToolCard({ manifest, isDark, isInstalled, isSaving, onToggle, isComingSoon = false }: {
  manifest: WidgetManifest
  isDark: boolean
  isInstalled: boolean
  isSaving: boolean
  onToggle: () => void
  isComingSoon?: boolean
}) {
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : 'white'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const muted = isDark ? '#64748b' : '#94a3b8'
  const tierColor = TIER_COLORS[manifest.tier] || TIER_COLORS.free

  return (
    <div style={{
      padding: 12, borderRadius: 8, background: cardBg,
      border: '1px solid ' + border, display: 'flex', gap: 12, alignItems: 'flex-start',
      opacity: isComingSoon ? 0.6 : 1,
    }}>
      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(5,150,105,0.15), rgba(8,145,178,0.15))',
        border: '1px solid rgba(5,150,105,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isDark ? '#34d399' : '#059669',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4Z" />
        </svg>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: text }}>{manifest.label}</span>
          <span style={{
            fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
            background: tierColor.bg, color: tierColor.text, border: '1px solid ' + tierColor.border,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>{manifest.tier}</span>
          <span style={{ fontSize: 9, color: muted }}>
            {manifest.gradeBands[0]}{manifest.gradeBands.length > 1 ? '-' + manifest.gradeBands[manifest.gradeBands.length - 1] : ''}
          </span>
        </div>
        <div style={{ fontSize: 11, color: muted, lineHeight: 1.4 }}>{manifest.description}</div>
        {manifest.fullDescription && isInstalled && (
          <div style={{ fontSize: 10, color: muted, lineHeight: 1.4, marginTop: 4, opacity: 0.8 }}>{manifest.fullDescription.slice(0, 150)}...</div>
        )}
      </div>

      {/* Action */}
      <div style={{ flexShrink: 0 }}>
        {isComingSoon ? (
          <span style={{
            fontSize: 10, fontWeight: 600, color: muted, padding: '5px 10px', borderRadius: 6,
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            border: '1px solid ' + border,
          }}>Soon</span>
        ) : isSaving ? (
          <span style={{ fontSize: 10, color: muted, padding: '5px 10px' }}>...</span>
        ) : isInstalled ? (
          <button onClick={onToggle} style={{
            padding: '5px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
            background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', cursor: 'pointer',
          }}>Remove</button>
        ) : (
          <button onClick={onToggle} style={{
            padding: '5px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
            background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)',
            color: isDark ? '#34d399' : '#059669', cursor: 'pointer',
          }}>Install</button>
        )}
      </div>
    </div>
  )
}