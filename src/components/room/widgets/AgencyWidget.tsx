// ============================================================
// Superboard — Agency Management Widget
// Dashboard for agency owners to manage tutors, invites, and links.
// ============================================================

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface AgencyInfo {
  id: string
  name: string
}

interface AgencyMember {
  id: string
  tutorId: string
  name: string
  email: string | null
  role: 'Owner' | 'Tutor'
  sessions: number
  joinedAt: string
  isActive: boolean
}

interface AgencyInvite {
  id: string
  code: string
  invitedEmail: string | null
  status: string
  expiresAt: string
  createdAt: string
}

interface AgencyData {
  agency: AgencyInfo
  members: AgencyMember[]
  invites: AgencyInvite[]
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  if (diffMs < 0) return 'just now'
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function AgencyWidget({ roomId }: { roomId: string }) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const [data, setData] = useState<AgencyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)

  const fetchAgency = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/agency')
      if (res.status === 403) {
        setError('Agency tier required. Upgrade to manage a team.')
        return
      }
      if (!res.ok) throw new Error('Failed to load agency data')
      const json = await res.json()
      setData(json)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgency()
  }, [fetchAgency, roomId])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      const res = await fetch('/api/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to send invite')
        return
      }
      setInviteEmail('')
      setShowInviteForm(false)
      fetchAgency()
    } catch {
      alert('Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this tutor from the agency?')) return
    try {
      await fetch(`/api/agency?memberId=${memberId}`, { method: 'DELETE' })
      fetchAgency()
    } catch {
      alert('Failed to remove member')
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await fetch(`/api/agency?inviteId=${inviteId}`, { method: 'DELETE' })
      fetchAgency()
    } catch {
      alert('Failed to revoke invite')
    }
  }

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/join/${code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="widget-content agency-widget">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <div style={{ width: 24, height: 24, border: '3px solid rgba(148,163,184,0.3)', borderTopColor: isDark ? '#94a3b8' : '#475569', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div className="widget-content agency-widget">
        <div style={{ padding: 16, textAlign: 'center', color: '#f87171' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🏢</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: 4 }}>Agency Management</div>
          <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#475569' }}>{error}</div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const latestInvite = data.invites.length > 0 ? data.invites[0] : null
  const dividerBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'

  return (
    <div className="widget-content agency-widget">
      {/* Header */}
      <div style={{ padding: '12px 12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>🏢</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>Agency Management</span>
        </div>
        <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#475569' }}>
          Agency: <span style={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 500 }}>{data.agency.name}</span>
        </div>
        <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#475569', marginTop: 2 }}>
          Members: <span style={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 500 }}>{data.members.length} tutors</span>
        </div>
      </div>

      {/* Invite button */}
      <div style={{ padding: '0 12px 8px' }}>
        {!showInviteForm ? (
          <button
            onClick={() => setShowInviteForm(true)}
            style={{
              width: '100%', padding: '7px 12px', borderRadius: 6,
              background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.25)',
              color: '#4ade80', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Invite Tutor
          </button>
        ) : (
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: 6 }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="tutor@email.com"
              required
              style={{
                flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 12,
                background: isDark ? 'rgba(15,23,42,0.6)' : '#ffffff', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'),
                color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none', minWidth: 0,
              }}
            />
            <button
              type="submit"
              disabled={inviting}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)',
                color: '#4ade80', cursor: inviting ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {inviting ? '...' : 'Send'}
            </button>
            <button
              type="button"
              onClick={() => { setShowInviteForm(false); setInviteEmail('') }}
              style={{
                padding: '6px 8px', borderRadius: 6, fontSize: 12,
                background: 'rgba(100,116,139,0.2)', border: '1px solid rgba(100,116,139,0.3)',
                color: isDark ? '#94a3b8' : '#475569', cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </form>
        )}
      </div>

      {/* Divider */}
      <div style={{ margin: '0 12px', height: 1, background: dividerBg }} />

      {/* Team Members */}
      <div style={{ padding: '8px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
          Team
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.members.map((member) => (
            <div
              key={member.id}
              style={{
                padding: '8px 10px', borderRadius: 8,
                background: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(241,245,249,0.8)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'),
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: member.role === 'Owner'
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, color: '#fff', fontWeight: 700, flexShrink: 0,
                  }}>
                    👤
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {member.name}
                      {member.role === 'Owner' && (
                        <span style={{ color: '#f59e0b', marginLeft: 6, fontSize: 10, fontWeight: 700 }}>(Owner)</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      Active · {member.sessions} session{member.sessions !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                {member.role !== 'Owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    style={{
                      padding: '3px 8px', borderRadius: 4, fontSize: 11,
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                      color: '#f87171', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invites */}
      {data.invites.length > 0 && (
        <>
          <div style={{ margin: '0 12px', height: 1, background: dividerBg }} />
          <div style={{ padding: '8px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Pending Invites
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.invites.map((invite) => (
                <div
                  key={invite.id}
                  style={{
                    padding: '8px 10px', borderRadius: 8,
                    background: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(241,245,249,0.8)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'),
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 13 }}>✉</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: isDark ? '#e2e8f0' : '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {invite.invitedEmail || 'No email'}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          Sent {timeAgo(invite.createdAt)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokeInvite(invite.id)}
                      style={{
                        padding: '3px 8px', borderRadius: 4, fontSize: 11,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        color: '#f87171', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      }}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Invite Link */}
      {latestInvite && (
        <>
          <div style={{ margin: '0 12px', height: 1, background: dividerBg }} />
          <div style={{ padding: '8px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Invite Link
            </div>
            <div style={{
              padding: '8px 10px', borderRadius: 8,
              background: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(241,245,249,0.8)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'),
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                fontSize: 11, color: isDark ? '#94a3b8' : '#475569', flex: 1, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace',
              }}>
                {window.location.origin}/join/{latestInvite.code}
              </div>
              <button
                onClick={() => handleCopyLink(latestInvite.code)}
                style={{
                  padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                  color: '#a5b4fc', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
