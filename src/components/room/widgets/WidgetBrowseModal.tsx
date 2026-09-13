'use client'

import { useState, useMemo } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { useWidgetStore, type MarketplaceToolId, SUBJECT_TOOLKIT_IDS, type WidgetId, DEFAULT_INSTALLED_SUBJECTS } from '@/lib/room/widget-store'
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

// Task 46 / Fix #1 — Subject-toolkit metadata for the "My Subjects"
// section shown at the top of the browse modal. The 9 subject toolkits
// a tutor can pin to their toggle bar (when the session subject is
// GENERAL). Icons match the WidgetToggleBar inline SVG renderer so the
// browse modal's toggles look identical to the toggle bar's.
const SUBJECT_TOOLKIT_META: { id: WidgetId; label: string; description: string; icon: string }[] = [
  { id: 'math',         label: 'Math Tools',   description: 'Algebra, geometry, graphing, equations',         icon: 'Calculator' },
  { id: 'physics',      label: 'Physics',      description: 'Forces, motion, energy, waves',                  icon: 'Zap' },
  { id: 'chemistry',    label: 'Chemistry',    description: 'Molecules, reactions, periodic table',          icon: 'Atom' },
  { id: 'biology',      label: 'Biology',      description: 'Cells, genetics, ecology',                       icon: 'Leaf' },
  { id: 'language',     label: 'Language',     description: 'Phonics, grammar, reading, writing (ELA)',       icon: 'Languages' },
  { id: 'statistics',   label: 'Statistics',   description: 'Data analysis, probability',                    icon: 'BarChart3' },
  { id: 'earthscience', label: 'Earth Science',description: 'Geology, weather, astronomy',                   icon: 'Globe' },
  { id: 'arts',         label: 'Arts & Music', description: 'Drawing, music, creative tools',                icon: 'Palette' },
  { id: 'classroom',    label: 'Classroom',    description: 'Timers, pickers, classroom management',         icon: 'Timer' },
]

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  free: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', border: 'rgba(34,197,94,0.25)' },
  pro: { bg: 'rgba(168,85,247,0.12)', text: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  agency: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
}

const SUBJECTS_STORAGE_KEY = 'superboard_installed_subjects'

export function WidgetBrowseModal() {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const isOpen = useWidgetStore((s) => s.browseModalOpen)
  const setOpen = useWidgetStore((s) => s.setBrowseModalOpen)
  const installedTools = useWidgetStore((s) => s.installedTools)
  const installTool = useWidgetStore((s) => s.installTool)
  const uninstallTool = useWidgetStore((s) => s.uninstallTool)
  const installedSubjects = useWidgetStore((s) => s.installedSubjects)
  const setInstalledSubjects = useWidgetStore((s) => s.setInstalledSubjects)

  const [search, setSearch] = useState('')
  const [filterSubject, setFilterSubject] = useState<WidgetSubject | 'all'>('all')
  const [filterGrade, setFilterGrade] = useState<GradeBand | 'all'>('all')
  const [tab, setTab] = useState<'available' | 'installed' | 'coming_soon'>('available')
  const [saving, setSaving] = useState<MarketplaceToolId | null>(null)
  const [subjectSaving, setSubjectSaving] = useState<string | null>(null)

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

  // Task 46 / Fix #1 — Toggle a subject toolkit on/off in the tutor's
  // pinned list. Persists to localStorage immediately for guests, and
  // also fires a PUT to /api/user/widgets so logged-in tutors get the
  // same selection on every device. The PUT is best-effort (no rollback
  // on failure — the localStorage value is the source of truth for
  // guests and the server is the source of truth for logged-in tutors,
  // but a transient network failure shouldn't revert the UI).
  const handleSubjectToggle = async (subjectId: string, isInstalled: boolean) => {
    setSubjectSaving(subjectId)
    try {
      const current = useWidgetStore.getState().installedSubjects
      const next = isInstalled
        ? current.filter((s) => s !== subjectId)
        : [...current, subjectId]
      // Always keep at least the user's explicit choice (even empty).
      // getWidgetsForSubject() handles the empty-array fallback to
      // "show all tool widgets" so the tutor never ends up with a
      // blank toggle bar.
      setInstalledSubjects(next)
      try {
        localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(next))
      } catch { /* ignore */ }

      // Best-effort server persist. The endpoint accepts both fields
      // and writes the structured shape. If the user is a guest, the
      // 401 is silently ignored — localStorage is the fallback.
      try {
        await fetch('/api/user/widgets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ installedSubjects: next }),
        })
      } catch { /* network error — localStorage is the fallback */ }
    } finally {
      setSubjectSaving(null)
    }
  }

  const handleResetSubjects = () => {
    setInstalledSubjects([...DEFAULT_INSTALLED_SUBJECTS])
    try { localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(DEFAULT_INSTALLED_SUBJECTS)) } catch {}
    try {
      fetch('/api/user/widgets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installedSubjects: DEFAULT_INSTALLED_SUBJECTS }),
      })
    } catch { /* network error — localStorage is the fallback */ }
  }

  // Styles
  const bg = isDark ? '#0f172a' : '#f8fafc'
  const overlay = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)'
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : 'white'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const muted = isDark ? '#64748b' : '#94a3b8'
  const accent = isDark ? '#34d399' : '#059669'

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
        width: '100%', maxWidth: 560, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid ' + border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: text, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              Widget Library
            </div>
            <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>Customize your tools and subjects</div>
          </div>
          <button onClick={() => setOpen(false)} style={{
            width: 28, height: 28, borderRadius: 6, border: '1px solid ' + border,
            background: 'none', color: muted, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* My Subjects section (Task 46 / Fix #1) — pinned at the top,
            above the marketplace search/filter/tabs. Lets a tutor
            toggle which subject toolkits appear in their toggle bar
            when the session subject is GENERAL. The "Manage" button in
            the WidgetToggleBar opens this modal — since the section is
            at the top, it's automatically in view on open. */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + border, background: isDark ? 'rgba(168,85,247,0.04)' : 'rgba(168,85,247,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: text, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#c084fc' : '#a855f7'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                My Subjects
              </div>
              <div style={{ fontSize: 10, color: muted, marginTop: 1 }}>Choose which subject toolkits appear in your toggle bar</div>
            </div>
            <button
              onClick={handleResetSubjects}
              title="Reset to defaults"
              style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 4,
                background: 'none', border: '1px solid ' + border, color: muted,
                cursor: 'pointer', fontWeight: 500,
              }}
            >
              Reset
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 }}>
            {SUBJECT_TOOLKIT_META.map((s) => {
              const isOn = installedSubjects.includes(s.id)
              const isBusy = subjectSaving === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => handleSubjectToggle(s.id, isOn)}
                  disabled={isBusy}
                  title={s.description}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 6, cursor: isBusy ? 'wait' : 'pointer',
                    background: isOn
                      ? (isDark ? 'rgba(52,211,153,0.10)' : 'rgba(5,150,105,0.08)')
                      : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,1)'),
                    border: '1px solid ' + (isOn
                      ? (isDark ? 'rgba(52,211,153,0.3)' : 'rgba(5,150,105,0.3)')
                      : border),
                    color: isOn ? accent : text,
                    textAlign: 'left', opacity: isBusy ? 0.6 : 1,
                  }}
                >
                  <SubjectIcon name={s.icon} />
                  <span style={{ fontSize: 11, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                  {isOn ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  )}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: 9.5, color: muted, marginTop: 8, lineHeight: 1.5 }}>
            {installedSubjects.length === 0
              ? 'No subjects selected — all tool widgets will show by default.'
              : `${installedSubjects.length} of ${SUBJECT_TOOLKIT_IDS.length} subject toolkits pinned.`}
            {' '}Applies when your session subject is General.
          </div>
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
                color: active ? accent : muted,
                borderBottom: active ? '2px solid ' + accent : '2px solid transparent',
                background: 'none', border: 'none', borderBottomWidth: 2,
                borderBottomStyle: 'solid', borderBottomColor: active ? accent : 'transparent',
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
// SubjectIcon — inline SVG renderer matching WidgetToggleBar's icons
// ============================================================

function SubjectIcon({ name }: { name: string }) {
  const stroke = 'currentColor'
  const icons: Record<string, React.ReactNode> = {
    Calculator: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="10" y2="10" />
        <line x1="14" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="10" y2="14" />
        <line x1="14" y1="14" x2="16" y2="14" />
        <line x1="8" y1="18" x2="10" y2="18" />
        <line x1="14" y1="18" x2="16" y2="18" />
      </svg>
    ),
    Zap: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    Atom: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2" />
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
      </svg>
    ),
    Leaf: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
    Languages: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 8l6 6" />
        <path d="M4 14l6-6 2-3" />
        <path d="M2 5h12" />
        <path d="M7 2h1" />
        <path d="M22 22l-5-10-5 10" />
        <path d="M14 18h6" />
      </svg>
    ),
    BarChart3: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </svg>
    ),
    Globe: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    Palette: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
      </svg>
    ),
    Timer: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="10" y1="2" x2="14" y2="2" />
        <line x1="12" y1="14" x2="12" y2="8" />
        <circle cx="12" cy="14" r="8" />
      </svg>
    ),
  }
  return <>{icons[name] || icons.Calculator}</>
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
