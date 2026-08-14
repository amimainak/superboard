'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

export default function DashboardPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showNewRoom, setShowNewRoom] = useState(false)
  const [subject, setSubject] = useState('GENERAL')

  const loadData = useCallback(async () => {
    try {
      const [profileRes, roomsRes, templatesRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/rooms?status=active'),
        fetch('/api/templates'),
      ])
      setProfile(await profileRes.json())
      setRooms(await roomsRes.json())
      setTemplates(await templatesRes.json())
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
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

        {/* Two Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
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
