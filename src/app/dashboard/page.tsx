'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { MARKETPLACE_WIDGETS, COMING_SOON_WIDGETS } from '@/lib/room/widget-registry'

interface Room {
  id: string
  subject: string
  isActive: boolean
  startedAt: string
  endedAt: string | null
  durationMinutes: number
  createdAt: string
}

interface Template {
  id: string
  name: string
  subject: string
  createdAt: string
}

interface Profile {
  id: string
  email: string
  name: string | null
  tier: string
  createdAt: string
}

const FREE_ROOM_LIMIT = 3

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  free: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', border: 'rgba(34,197,94,0.25)' },
  pro: { bg: 'rgba(168,85,247,0.12)', text: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  agency: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
}

function UpgradePrompt() {
  return (
    <div style={{
      padding: 20, borderRadius: 12, marginBottom: 32,
      border: '1px solid rgba(5,150,105,0.3)',
      background: 'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(8,145,178,0.08))',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>
          Unlock more with Pro
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          Get PDF exports, templates, file uploads, GeoGebra, and more for $19/mo.
        </div>
      </div>
      <button
        onClick={() => window.location.href = '/pricing'}
        style={{
          padding: '10px 20px', borderRadius: 8,
          background: 'linear-gradient(135deg, #059669, #0891b2)',
          color: 'white', fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        View Plans
      </button>
    </div>
  )
}

function UpgradeSuccessBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div style={{
      padding: 20, borderRadius: 12, marginBottom: 32,
      border: '1px solid rgba(34,197,94,0.4)',
      background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(5,150,105,0.1))',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(34,197,94,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 2 }}>
            Welcome to Pro! 🎉
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            Your upgrade is active. All premium features are now unlocked.
          </div>
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          padding: '8px 16px', borderRadius: 8,
          background: 'rgba(255,255,255,0.06)',
          color: '#94a3b8', fontSize: 12, fontWeight: 500,
          border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
        }}
      >
        Dismiss
      </button>
    </div>
  )
}

function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showNewRoom, setShowNewRoom] = useState(false)
  const [subject, setSubject] = useState('GENERAL')
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false)
  const [installedTools, setInstalledTools] = useState<string[]>([])
  const [widgetsSaving, setWidgetsSaving] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [profileRes, roomsRes, templatesRes, widgetsRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/rooms?status=active'),
        fetch('/api/templates'),
        fetch('/api/user/widgets'),
      ])
      setProfile(await profileRes.json())
      setRooms(await roomsRes.json())
      setTemplates(await templatesRes.json())
      const widgetsData = await widgetsRes.json()
      if (widgetsData.installedTools) setInstalledTools(widgetsData.installedTools)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Show success banner when redirected from Stripe checkout
  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setShowUpgradeSuccess(true)
      // Clean up URL without re-render
      const url = new URL(window.location.href)
      url.searchParams.delete('upgraded')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()

    // Enforce room limit for FREE tier
    if (profile?.tier === 'FREE' && rooms.length >= FREE_ROOM_LIMIT) {
      if (!confirm(`Free accounts are limited to ${FREE_ROOM_LIMIT} active rooms. Upgrade to Pro for unlimited rooms.\n\nGo to pricing page?`)) return
      router.push('/pricing')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject }),
      })
      const room = await res.json()
      if (room.id) {
        router.push(`/room/${room.id}`)
      }
    } catch (err) {
      console.error('Failed to create room:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleEndRoom = async (roomId: string) => {
    await fetch(`/api/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    })
    loadData()
  }

  const handleToggleWidget = async (toolId: string, isInstalled: boolean) => {
    setWidgetsSaving(toolId)
    try {
      const newTools = isInstalled
        ? installedTools.filter(id => id !== toolId)
        : [...installedTools, toolId]
      setInstalledTools(newTools)
      await fetch('/api/user/widgets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installedTools: newTools }),
      })
    } catch (err) {
      console.error('Failed to toggle widget:', err)
      setInstalledTools(installedTools)
    } finally {
      setWidgetsSaving(null)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    await fetch(`/api/templates/${templateId}`, { method: 'DELETE' })
    loadData()
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
      }}>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)',
      fontFamily: 'inherit',
    }}>
      {/* Top Nav */}
      <nav style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #059669, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Superboard</span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
            background: profile?.tier === 'PRO' ? 'rgba(168,85,247,0.2)' : profile?.tier === 'AGENCY' ? 'rgba(245,158,11,0.2)' : 'rgba(100,116,139,0.2)',
            color: profile?.tier === 'PRO' ? '#c084fc' : profile?.tier === 'AGENCY' ? '#fbbf24' : '#94a3b8',
          }}>
            {profile?.tier || 'FREE'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/dashboard/billing')}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#94a3b8', cursor: 'pointer',
            }}
          >
            Billing
          </button>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>
            {profile?.name || profile?.email}
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#94a3b8', cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Upgrade success banner (after Stripe checkout) */}
        {showUpgradeSuccess && (
          <UpgradeSuccessBanner onDismiss={() => setShowUpgradeSuccess(false)} />
        )}

        {/* Upgrade prompt for FREE users */}
        {profile?.tier === 'FREE' && <UpgradePrompt />}

        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' }}>
            Welcome back{profile?.name ? `, ${profile.name}` : ''}
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            Create a room to start a tutoring session, or load a template.
          </p>
        </div>

        {/* Action Row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowNewRoom(!showNewRoom)}
            style={{
              padding: '12px 24px', borderRadius: 10,
              background: 'linear-gradient(135deg, #059669, #0891b2)',
              color: 'white', fontSize: 14, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Room
          </button>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 24px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#e2e8f0', fontSize: 14, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Quick Whiteboard
          </button>
        </div>

        {/* New Room Form */}
        {showNewRoom && (
          <form onSubmit={handleCreateRoom} style={{
            padding: 20, borderRadius: 12, marginBottom: 32,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
            display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#f1f5f9', fontSize: 14,
                }}
              >
                <option value="GENERAL">General</option>
                <option value="MATH">Mathematics</option>
                <option value="SCIENCE">Science</option>
                <option value="LANGUAGE">Language</option>
                <option value="PHYSICS">Physics</option>
                <option value="CHEMISTRY">Chemistry</option>
                <option value="BIOLOGY">Biology</option>
                <option value="ENGLISH">English</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={creating}
              style={{
                padding: '10px 24px', borderRadius: 8,
                background: creating ? 'rgba(5,150,105,0.5)' : '#059669',
                color: 'white', fontSize: 14, fontWeight: 600,
                border: 'none', cursor: creating ? 'not-allowed' : 'pointer',
              }}
            >
              {creating ? 'Creating...' : 'Start Session'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewRoom(false)}
              style={{
                padding: '10px 16px', borderRadius: 8,
                background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8', fontSize: 13, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </form>
        )}

        {/* Widget Library — Marketplace */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            Widget Library
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)' }}>Marketplace</span>
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
            Install additional teaching tools. They appear inside subject toolkits during sessions.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {MARKETPLACE_WIDGETS.map((w) => {
              const isInstalled = installedTools.includes(w.id)
              const tierColor = TIER_COLORS[w.tier] || TIER_COLORS.free
              const isSaving = widgetsSaving === w.id
              return (
                <div key={w.id} style={{
                  padding: 14, borderRadius: 10,
                  border: '1px solid ' + (isInstalled ? 'rgba(5,150,105,0.3)' : 'rgba(255,255,255,0.06)'),
                  background: isInstalled ? 'rgba(5,150,105,0.04)' : 'rgba(255,255,255,0.02)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{w.label}</span>
                        <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: tierColor.bg, color: tierColor.text, border: '1px solid ' + tierColor.border, textTransform: 'uppercase', letterSpacing: 0.5 }}>{w.tier}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4, marginBottom: 6 }}>{w.description}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {w.gradeBands.map(gb => (
                          <span key={gb} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>{gb}</span>
                        ))}
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: w.toolType === 'diagnostic' ? 'rgba(245,158,11,0.1)' : 'rgba(8,145,178,0.1)', border: w.toolType === 'diagnostic' ? 'rgba(245,158,11,0.2)' : 'rgba(8,145,178,0.2)', color: w.toolType === 'diagnostic' ? '#fbbf24' : '#38bdf8' }}>{w.toolType}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleWidget(w.id, isInstalled)}
                      disabled={isSaving || (w.tier === 'pro' && profile?.tier === 'FREE')}
                      style={{
                        padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        whiteSpace: 'nowrap', cursor: isSaving ? 'not-allowed' : 'pointer', flexShrink: 0,
                        ...(isInstalled
                          ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }
                          : w.tier === 'pro' && profile?.tier === 'FREE'
                            ? { background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', color: '#64748b', cursor: 'not-allowed' }
                            : { background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }
                        ),
                      }}
                    >
                      {isSaving ? '...' : isInstalled ? 'Remove' : w.tier === 'pro' && profile?.tier === 'FREE' ? 'Pro Only' : 'Install'}
                    </button>
                  </div>
                </div>
              )
            })}
            {/* Coming Soon */}
            {COMING_SOON_WIDGETS.map((w) => (
              <div key={w.id} style={{
                padding: 14, borderRadius: 10, opacity: 0.5,
                border: '1px dashed rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.01)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{w.label}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(100,116,139,0.15)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' }}>Coming Soon</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{w.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Two Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Active Rooms */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              Active Rooms
            </h2>
            {rooms.length === 0 ? (
              <div style={{
                padding: 32, borderRadius: 12, textAlign: 'center',
                border: '1px dashed rgba(255,255,255,0.1)',
                color: '#64748b', fontSize: 13,
              }}>
                No active rooms. Create one to get started.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    style={{
                      padding: 16, borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.02)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0', marginBottom: 2 }}>
                        {room.subject}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        Started {new Date(room.startedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => router.push(`/room/${room.id}`)}
                        style={{
                          padding: '6px 14px', borderRadius: 6,
                          background: 'linear-gradient(135deg, #059669, #0891b2)',
                          color: 'white', fontSize: 12, fontWeight: 500,
                          border: 'none', cursor: 'pointer',
                        }}
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleEndRoom(room.id)}
                        style={{
                          padding: '6px 14px', borderRadius: 6,
                          border: '1px solid rgba(239,68,68,0.3)',
                          background: 'rgba(239,68,68,0.1)',
                          color: '#fca5a5', fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        End
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Templates */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Templates
            </h2>
            {templates.length === 0 ? (
              <div style={{
                padding: 32, borderRadius: 12, textAlign: 'center',
                border: '1px dashed rgba(255,255,255,0.1)',
                color: '#64748b', fontSize: 13,
              }}>
                No templates yet. Save a whiteboard as a template.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {templates.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: 16, borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.02)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0', marginBottom: 2 }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {t.subject} · {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(t.id)}
                      style={{
                        padding: '4px 10px', borderRadius: 4,
                        border: '1px solid rgba(239,68,68,0.2)',
                        background: 'none', color: '#f87171',
                        fontSize: 11, cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPageWithSuspense() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading dashboard...</div>}>
      <DashboardPage />
    </Suspense>
  )
}
