'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

/* ------------------------------------------------------------------
   Types
   ------------------------------------------------------------------ */

interface AdminStats {
  users: { total: number; byTier: Record<string, number>; dailySignups: Array<{ date: string; count: number }> }
  rooms: { total: number; active: number; today: number; recent: Array<{ id: string; subject: string; isActive: boolean; tutorId: string; createdAt: string }> }
  messages: number
  templates: number
  bookings: number
  recentUsers: Array<{ id: string; email: string; name: string | null; tier: string; role: string; isAdmin: boolean; createdAt: string }>
}

interface AdminUser {
  id: string
  email: string
  name: string | null
  tier: string
  role: string
  isAdmin: boolean
  stripeCustomerId: string | null
  parentAgencyId: string | null
  agencyName: string | null
  createdAt: string
  updatedAt: string
  banned?: boolean
}

// Compute display role from isAdmin when role column doesn't exist in DB
function getDisplayRole(u: { role?: string; isAdmin?: boolean; tier?: string }): string {
  if (u.role && ['owner', 'admin', 'tutor', 'student'].includes(u.role)) return u.role
  if (u.isAdmin) return 'owner'
  if (u.tier === 'AGENCY') return 'admin'
  return 'tutor'
}

type Tab = 'overview' | 'users' | 'system'

/* ------------------------------------------------------------------
   Color constants
   ------------------------------------------------------------------ */

const C = {
  bg: '#0a0a0f',
  surface: '#12121a',
  surfaceHover: '#1a1a25',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.12)',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  textMuted: '#64748b',
  accent: '#3b82f6',
  accentDim: 'rgba(59,130,246,0.15)',
  green: '#22c55e',
  greenDim: 'rgba(34,197,94,0.15)',
  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.15)',
  amber: '#f59e0b',
  amberDim: 'rgba(245,158,11,0.15)',
  purple: '#a855f7',
  purpleDim: 'rgba(168,85,247,0.15)',
  cyan: '#06b6d4',
  cyanDim: 'rgba(6,182,212,0.15)',
}

const TIER_STYLES: Record<string, { bg: string; fg: string }> = {
  FREE: { bg: C.greenDim, fg: C.green },
  PRO: { bg: C.purpleDim, fg: C.purple },
  AGENCY: { bg: C.amberDim, fg: C.amber },
}

const ROLE_STYLES: Record<string, { bg: string; fg: string }> = {
  owner: { bg: C.amberDim, fg: C.amber },
  admin: { bg: C.accentDim, fg: C.accent },
  tutor: { bg: 'rgba(255,255,255,0.06)', fg: C.textDim },
  student: { bg: 'rgba(255,255,255,0.04)', fg: C.textMuted },
}

/* ------------------------------------------------------------------
   Mini chart component (daily signups)
   ------------------------------------------------------------------ */

function MiniBarChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const maxVal = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
      {data.map((d, i) => {
        const h = Math.max((d.count / maxVal) * 72, 2)
        return (
          <div
            key={d.date}
            title={d.date + ': ' + d.count + ' signups'}
            style={{
              flex: 1,
              height: h,
              borderRadius: 3,
              background: i === data.length - 1
                ? 'linear-gradient(180deg, #3b82f6, #2563eb)'
                : 'rgba(59,130,246,0.25)',
              transition: 'height 0.3s ease',
              minWidth: 0,
            }}
          />
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------
   Stat Card
   ------------------------------------------------------------------ */

function StatCard({ label, value, sub, accentColor, icon }: {
  label: string; value: string | number; sub?: string; accentColor: string; icon: string
}) {
  return (
    <div style={{
      background: C.surface, border: '1px solid ' + C.border,
      borderRadius: 12, padding: '20px 24px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    }}>
      <div>
        <div style={{ fontSize: 12, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>{sub}</div>}
      </div>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: accentColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
   Badge
   ------------------------------------------------------------------ */

function Badge({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 6,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
      background: bg, color: fg,
    }}>
      {label}
    </span>
  )
}

/* ------------------------------------------------------------------
   Edit User Modal
   ------------------------------------------------------------------ */

function EditUserModal({ user, onSave, onClose }: {
  user: AdminUser; onSave: (userId: string, data: Record<string, unknown>) => Promise<void>; onClose: () => void
}) {
  const [tier, setTier] = useState(user.tier)
  const [role, setRole] = useState(getDisplayRole(user))
  const [ban, setBan] = useState(!!user.banned)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await onSave(user.id, { tier, role, ban })
      onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update user'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, border: '1px solid ' + C.borderLight,
        borderRadius: 16, padding: 32, width: 420, maxWidth: '90vw',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Edit User</h3>
        <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>{user.email}</p>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: C.textDim, marginBottom: 6, fontWeight: 500 }}>Tier</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['FREE', 'PRO', 'AGENCY'].map(t => (
              <button key={t} onClick={() => setTier(t)} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: '1px solid ' + (tier === t ? C.accent : C.border),
                background: tier === t ? C.accentDim : 'transparent',
                color: tier === t ? C.accent : C.textDim,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: C.textDim, marginBottom: 6, fontWeight: 500 }}>Role</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['owner', 'admin', 'tutor', 'student'].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: '1px solid ' + (role === r ? C.accent : C.border),
                background: role === r ? C.accentDim : 'transparent',
                color: role === r ? C.accent : C.textDim,
                cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
              }}>{r}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 12, color: C.textDim, fontWeight: 500 }}>Banned</label>
          <button onClick={() => setBan(!ban)} style={{
            width: 44, height: 24, borderRadius: 12, border: 'none',
            background: ban ? C.red : 'rgba(255,255,255,0.1)',
            cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 9, background: 'white',
              position: 'absolute', top: 3, left: ban ? 23 : 3,
              transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {error && <div style={{ color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            border: '1px solid ' + C.border, background: 'transparent', color: C.textDim, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: 'none', background: C.accent, color: 'white', cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
   Main Admin Page
   ------------------------------------------------------------------ */

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersPage, setUsersPage] = useState(1)
  const [usersSearch, setUsersSearch] = useState('')
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  /* --- Auth check --- */
  useEffect(() => {
    fetch('/api/user/role').then(res => {
      if (!res.ok) { setAccessDenied(true); return }
      return res.json()
    }).then(data => {
      if (data && !data.isAdmin && data.role !== 'owner' && data.role !== 'admin') {
        setAccessDenied(true)
      }
    }).catch(() => setAccessDenied(true))
  }, [])

  /* --- Load stats --- */
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.status === 403) { setAccessDenied(true); return }
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }, [])

  /* --- Load users --- */
  const loadUsers = useCallback(async (page: number, search: string) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      const res = await fetch('/api/admin/users?' + params)
      if (res.status === 403) { setAccessDenied(true); return }
      const data = await res.json()
      setUsers(data.users || [])
      setUsersTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }, [])

  /* --- Initial load --- */
  useEffect(() => {
    if (accessDenied) return
    const load = async () => {
      setLoading(true)
      await Promise.all([loadStats(), loadUsers(1, '')])
      setLoading(false)
    }
    load()
  }, [accessDenied, loadStats, loadUsers])

  /* --- Search users --- */
  useEffect(() => {
    if (accessDenied) return
    const timeout = setTimeout(() => {
      setUsersPage(1)
      loadUsers(1, usersSearch)
    }, 300)
    return () => clearTimeout(timeout)
  }, [usersSearch, accessDenied, loadUsers])

  /* --- Save user --- */
  const handleSaveUser = async (userId: string, data: Record<string, unknown>) => {
    setSaveError('')
    setSaveSuccess('')
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...data }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Update failed')
    }
    setSaveSuccess('User updated successfully')
    setTimeout(() => setSaveSuccess(''), 3000)
    loadStats()
    loadUsers(usersPage, usersSearch)
  }

  /* --- Access denied --- */
  if (accessDenied) {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Access Denied</h1>
        <p style={{ fontSize: 14, color: C.textMuted }}>You do not have permission to view this page.</p>
        <button onClick={() => router.push('/dashboard')} style={{
          padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          border: 'none', background: C.accent, color: 'white', cursor: 'pointer', marginTop: 8,
        }}>Back to Dashboard</button>
      </div>
    )
  }

  /* --- Loading --- */
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid ' + C.border, borderTopColor: C.accent,
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
      </div>
    )
  }

  /* --- Sidebar button --- */
  const sidebarItem = (id: Tab, label: string, icon: string) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '10px 16px', borderRadius: 8,
        border: 'none', cursor: 'pointer', textAlign: 'left',
        fontSize: 13, fontWeight: tab === id ? 600 : 400,
        background: tab === id ? C.accentDim : 'transparent',
        color: tab === id ? C.accent : C.textDim,
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
      {label}
    </button>
  )

  /* ===================== OVERVIEW TAB ===================== */
  const overviewTab = stats && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast */}
      {saveSuccess && (
        <div style={{
          padding: '12px 20px', borderRadius: 8,
          background: C.greenDim, border: '1px solid rgba(34,197,94,0.3)',
          color: C.green, fontSize: 13, fontWeight: 500,
        }}>{saveSuccess}</div>
      )}
      {saveError && (
        <div style={{
          padding: '12px 20px', borderRadius: 8,
          background: C.redDim, border: '1px solid rgba(239,68,68,0.3)',
          color: C.red, fontSize: 13, fontWeight: 500,
        }}>{saveError}</div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard label="Total Users" value={stats.users.total} sub={
          Object.entries(stats.users.byTier).map(([k, v]) => k + ': ' + v).join(' | ')
        } accentColor={C.accent} icon="👥" />
        <StatCard label="Active Rooms" value={stats.rooms.active} sub={stats.rooms.today + ' created today'} accentColor={C.green} icon="📐" />
        <StatCard label="Total Rooms" value={stats.rooms.total} accentColor={C.cyan} icon="📁" />
        <StatCard label="Messages" value={stats.messages} accentColor={C.purple} icon="💬" />
        <StatCard label="Templates" value={stats.templates} accentColor={C.amber} icon="📋" />
        <StatCard label="Bookings" value={stats.bookings} accentColor={C.green} icon="📅" />
      </div>

      {/* Daily Signups Chart */}
      <div style={{
        background: C.surface, border: '1px solid ' + C.border,
        borderRadius: 12, padding: '20px 24px',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>Daily Signups</h3>
        <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Last 14 days</p>
        <MiniBarChart data={stats.users.dailySignups} />
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 10, color: C.textMuted, marginTop: 8,
        }}>
          <span>{stats.users.dailySignups[0]?.date}</span>
          <span>{stats.users.dailySignups[stats.users.dailySignups.length - 1]?.date}</span>
        </div>
      </div>

      {/* Recent Users */}
      <div style={{
        background: C.surface, border: '1px solid ' + C.border,
        borderRadius: 12, padding: '20px 24px',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 16 }}>Recent Users</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stats.recentUsers.map(u => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, ' + C.accent + ', ' + C.cyan + ')',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: 'white',
                }}>{(u.name || u.email || '?')[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{u.name || u.email}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{u.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge label={u.tier} {...(TIER_STYLES[u.tier] || TIER_STYLES.FREE)} />
                <Badge label={getDisplayRole(u).toUpperCase()} {...(ROLE_STYLES[getDisplayRole(u)] || ROLE_STYLES.tutor)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Rooms */}
      <div style={{
        background: C.surface, border: '1px solid ' + C.border,
        borderRadius: 12, padding: '20px 24px',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 16 }}>Recent Rooms</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {stats.rooms.recent.map(r => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{r.subject || 'Untitled'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge label={r.isActive ? 'Active' : 'Ended'} bg={r.isActive ? C.greenDim : 'rgba(255,255,255,0.04)'} fg={r.isActive ? C.green : C.textMuted} />
                <span style={{ fontSize: 11, color: C.textMuted }}>{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  /* ===================== USERS TAB ===================== */
  const usersTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toast */}
      {saveSuccess && (
        <div style={{
          padding: '12px 20px', borderRadius: 8,
          background: C.greenDim, border: '1px solid rgba(34,197,94,0.3)',
          color: C.green, fontSize: 13, fontWeight: 500,
        }}>{saveSuccess}</div>
      )}

      {/* Search */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 14, color: C.textMuted,
          }}>🔍</span>
          <input
            type="text"
            placeholder="Search by email or name..."
            value={usersSearch}
            onChange={e => setUsersSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 40',
              borderRadius: 8, border: '1px solid ' + C.border,
              background: C.surface, color: C.text, fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: C.textMuted }}>
          {usersTotal} user{usersTotal !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: C.surface, border: '1px solid ' + C.border,
        borderRadius: 12, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px',
          padding: '12px 20px', borderBottom: '1px solid ' + C.border,
          fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          <span>User</span>
          <span>Tier</span>
          <span>Role</span>
          <span>Agency</span>
          <span>Joined</span>
          <span></span>
        </div>

        {/* Rows */}
        {users.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            No users found
          </div>
        )}
        {users.map(u => (
          <div key={u.id} style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px',
            padding: '14px 20px', borderBottom: '1px solid ' + C.border,
            alignItems: 'center',
            transition: 'background 0.1s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: u.banned ? C.redDim : 'linear-gradient(135deg, ' + C.accent + ', ' + C.purple + ')',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'white',
              }}>{(u.name || u.email || '?')[0].toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.name || '—'}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email}
                </div>
              </div>
            </div>
            <Badge label={u.tier} {...(TIER_STYLES[u.tier] || TIER_STYLES.FREE)} />
            <Badge label={getDisplayRole(u).toUpperCase()} {...(ROLE_STYLES[getDisplayRole(u)] || ROLE_STYLES.tutor)} />
            <span style={{ fontSize: 12, color: C.textDim }}>{u.agencyName || '—'}</span>
            <span style={{ fontSize: 12, color: C.textMuted }}>{new Date(u.createdAt).toLocaleDateString()}</span>
            <button onClick={() => setEditingUser(u)} style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              border: '1px solid ' + C.border, background: 'transparent',
              color: C.textDim, cursor: 'pointer',
            }}>Edit</button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {usersTotal > 20 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <button
            onClick={() => { setUsersPage(p => Math.max(1, p - 1)); loadUsers(Math.max(1, usersPage - 1), usersSearch) }}
            disabled={usersPage <= 1}
            style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              border: '1px solid ' + C.border, background: 'transparent',
              color: usersPage <= 1 ? C.textMuted : C.textDim, cursor: usersPage <= 1 ? 'default' : 'pointer',
            }}
          >Previous</button>
          <span style={{ fontSize: 12, color: C.textMuted, padding: '0 12px' }}>
            Page {usersPage} of {Math.ceil(usersTotal / 20)}
          </span>
          <button
            onClick={() => { setUsersPage(p => p + 1); loadUsers(usersPage + 1, usersSearch) }}
            disabled={usersPage >= Math.ceil(usersTotal / 20)}
            style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              border: '1px solid ' + C.border, background: 'transparent',
              color: usersPage >= Math.ceil(usersTotal / 20) ? C.textMuted : C.textDim,
              cursor: usersPage >= Math.ceil(usersTotal / 20) ? 'default' : 'pointer',
            }}
          >Next</button>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  )

  /* ===================== SYSTEM TAB ===================== */
  const systemTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{
        background: C.surface, border: '1px solid ' + C.border,
        borderRadius: 12, padding: '24px',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>System Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          <InfoRow label="Platform" value="Superboard" />
          <InfoRow label="Environment" value={process.env.NODE_ENV === 'production' ? 'Production' : 'Development'} />
          <InfoRow label="Auth Provider" value="Supabase Auth" />
          <InfoRow label="Database" value="Supabase PostgreSQL" />
          <InfoRow label="Realtime" value="Hocuspocus / LiveKit" />
          <InfoRow label="Payments" value="Stripe" />
        </div>
      </div>

      <div style={{
        background: C.surface, border: '1px solid ' + C.border,
        borderRadius: 12, padding: '24px',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>Quick Actions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ActionCard
            title="Manage Users"
            description="Search, edit roles, change tiers, and ban users"
            onClick={() => setTab('users')}
            icon="👥"
          />
          <ActionCard
            title="View Dashboard"
            description="Go back to the main dashboard overview"
            onClick={() => setTab('overview')}
            icon="📊"
          />
          <ActionCard
            title="Back to App"
            description="Return to the main application dashboard"
            onClick={() => router.push('/dashboard')}
            icon="🏠"
          />
        </div>
      </div>

      <div style={{
        background: C.surface, border: '1px solid ' + C.border,
        borderRadius: 12, padding: '24px',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 12 }}>Security Notes</h3>
        <ul style={{ fontSize: 13, color: C.textDim, lineHeight: 2, paddingLeft: 20 }}>
          <li>All admin API routes require owner or admin role verification</li>
          <li>Role changes can only be performed by the platform owner</li>
          <li>Authentication is handled by Supabase Auth with JWT tokens</li>
          <li>Database triggers prevent tier/role escalation via client requests</li>
          <li>API key authentication is available for LMS integrations</li>
        </ul>
      </div>
    </div>
  )

  /* ===================== LAYOUT ===================== */
  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, borderRight: '1px solid ' + C.border,
        padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: 4,
        background: C.surface,
      }}>
        <div style={{ padding: '8px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Superboard</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Admin Panel</div>
        </div>

        {sidebarItem('overview', 'Overview', '📊')}
        {sidebarItem('users', 'Users', '👥')}
        {sidebarItem('system', 'System', '⚙️')}

        <div style={{ flex: 1 }} />

        <button onClick={() => router.push('/dashboard')} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '10px 16px', borderRadius: 8,
          border: 'none', cursor: 'pointer', textAlign: 'left',
          fontSize: 13, fontWeight: 400,
          background: 'transparent', color: C.textMuted, transition: 'color 0.15s',
        }}>
          <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>←</span>
          Back to App
        </button>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1, padding: '32px 40px', overflowY: 'auto',
        minWidth: 0,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 32,
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>
              {tab === 'overview' ? 'Overview' : tab === 'users' ? 'User Management' : 'System'}
            </h1>
            <p style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              {tab === 'overview' && 'Platform analytics and recent activity'}
              {tab === 'users' && 'Manage user accounts, roles, and permissions'}
              {tab === 'system' && 'System information and configuration'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['overview', 'users', 'system'] as Tab[]).filter(t => t !== tab).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                border: '1px solid ' + C.border, background: 'transparent',
                color: C.textDim, cursor: 'pointer', textTransform: 'capitalize',
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {tab === 'overview' && overviewTab}
        {tab === 'users' && usersTab}
        {tab === 'system' && systemTab}
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------
   Helper sub-components
   ------------------------------------------------------------------ */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid ' + C.border,
    }}>
      <span style={{ fontSize: 13, color: C.textMuted }}>{label}</span>
      <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function ActionCard({ title, description, onClick, icon }: {
  title: string; description: string; onClick: () => void; icon: string
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 16,
      width: '100%', padding: '16px 20px', borderRadius: 10,
      border: '1px solid ' + C.border, background: 'transparent',
      cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: C.textMuted }}>{description}</div>
      </div>
    </button>
  )
}