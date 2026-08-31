// ============================================================
// Superboard — Breakout Rooms Widget
// Create and manage breakout rooms with timer, assignment options.
// Broadcasts to chat (full isolation requires Hocuspocus server).
// ============================================================

'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useCollabStore } from '@/lib/collab/store'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface BreakoutRoom {
  id: string
  name: string
  members: string[]
  color: string
}

const ROOM_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#6366f1',
]

const ROOM_NAMES = [
  'Group A', 'Group B', 'Group C', 'Group D', 'Group E',
  'Group F', 'Group G', 'Group H', 'Group I', 'Group J',
]

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function BreakoutRoomsWidget({ roomId }: { roomId: string }) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const remoteUsers = useCollabStore((s) => s.remoteUsers)
  const [rooms, setRooms] = useState<BreakoutRoom[]>([])
  const [numRooms, setNumRooms] = useState(3)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [roomBroadcastMsg, setRoomBroadcastMsg] = useState<Record<string, string>>({})
  const [showRoomBroadcast, setShowRoomBroadcast] = useState<string | null>(null)
  const [timerMinutes, setTimerMinutes] = useState(10)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [timerDone, setTimerDone] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [unassigned, setUnassigned] = useState<string[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isActive = rooms.length > 0

  const allParticipants = useMemo(() => {
    const participants: { id: string; name: string }[] = [
      { id: '__tutor__', name: 'You (Tutor)' },
    ]
    for (const u of remoteUsers) {
      participants.push({ id: u.id, name: u.name || 'Anonymous' })
    }
    return participants
  }, [remoteUsers])

  const students = useMemo(() => allParticipants.filter(p => p.id !== '__tutor__'), [allParticipants])

  // Timer logic
  useEffect(() => {
    if (timerActive && (timerSeconds > 0 || timerMinutes > 0)) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev > 0) return prev - 1
          setTimerMinutes(m => {
            if (m > 0) {
              setTimerSeconds(59)
              return m - 1
            }
            setTimerActive(false)
            setTimerDone(true)
            return 0
          })
          return 0
        })
      }, 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [timerActive, timerSeconds, timerMinutes])

  const createRooms = useCallback((strategy: 'random' | 'auto') => {
    if (students.length === 0) return
    const count = Math.min(numRooms, students.length)
    let assignedStudents: typeof students
    if (strategy === 'random') {
      assignedStudents = shuffleArray(students)
    } else {
      assignedStudents = [...students]
    }
    const newRooms: BreakoutRoom[] = []
    for (let i = 0; i < count; i++) {
      newRooms.push({ id: `room-${i}`, name: ROOM_NAMES[i] || `Room ${i + 1}`, members: [], color: ROOM_COLORS[i % ROOM_COLORS.length] })
    }
    assignedStudents.forEach((student, idx) => {
      newRooms[idx % count].members.push(student.id)
    })
    setRooms(newRooms)
    setUnassigned([])
    setManualMode(strategy === 'auto')
  }, [students, numRooms])

  const endBreakout = useCallback(() => {
    setRooms([])
    setBroadcastMsg('')
    setRoomBroadcastMsg({})
    setShowRoomBroadcast(null)
    setTimerActive(false)
    setTimerDone(false)
    setTimerSeconds(0)
    setManualMode(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const getParticipantName = useCallback((id: string) => {
    if (id === '__tutor__') return 'You (Tutor)'
    const found = remoteUsers.find(u => u.id === id)
    return found?.name || 'Anonymous'
  }, [remoteUsers])

  const moveStudent = useCallback((studentId: string, fromRoomId: string | null, toRoomId: string | null) => {
    if (fromRoomId === toRoomId) return
    setRooms(prev => {
      const next = prev.map(r => ({ ...r, members: r.members.filter(m => m !== studentId) }))
      if (toRoomId) {
        const ri = next.findIndex(r => r.id === toRoomId)
        if (ri >= 0) next[ri] = { ...next[ri], members: [...next[ri].members, studentId] }
      }
      return next
    })
    setUnassigned(prev => {
      if (toRoomId === null) {
        if (fromRoomId !== null) return [...prev, studentId]
        return prev
      }
      return prev.filter(id => id !== studentId)
    })
  }, [])

  const sendBroadcastToChat = useCallback(async (msg: string, target?: string) => {
    if (!msg.trim()) return
    const prefix = target ? `[Breakout - ${target}] ` : '[Broadcast to All] '
    const content = prefix + msg.trim()
    try {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client')
      const sb = getSupabaseBrowserClient()
      const { data: { user } } = await sb.auth.getUser()
      const label = user ? 'Tutor' : 'Host'
      await (sb as any).from('ChatMessage').insert({
        roomId, senderLabel: label, content,
        senderId: user?.id || null,
      })
    } catch (err) {
      console.error('Failed to send broadcast:', err)
    }
  }, [roomId])

  const handleBroadcastAll = () => {
    sendBroadcastToChat(broadcastMsg)
    setBroadcastMsg('')
  }

  const handleRoomBroadcast = (room: BreakoutRoom) => {
    const msg = roomBroadcastMsg[room.id] || ''
    sendBroadcastToChat(msg, room.name)
    setRoomBroadcastMsg(prev => ({ ...prev, [room.id]: '' }))
    setShowRoomBroadcast(null)
  }

  const dk = (light: string, dark: string) => isDark ? dark : light
  const dkBorder = dk('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.08)')
  const dkText = dk('#475569', '#94a3b8')
  const dkTextStrong = dk('#0f172a', '#f1f5f9')
  const dkBg = dk('rgba(241,245,249,0.8)', 'rgba(15,23,42,0.5)')
  const dkInputBg = dk('#f8fafc', 'rgba(15,23,42,0.6)')
  const dkInputBorder = dk('rgba(0,0,0,0.12)', 'rgba(255,255,255,0.1)')

  const totalSeconds = timerMinutes * 60 + timerSeconds

  return (
    <div className="widget-content breakout-widget" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 12px 8px', borderBottom: `1px solid ${dkBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dk('#475569', '#94a3b8')} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: dkTextStrong }}>Breakout Rooms</span>
        </div>
        <div style={{ fontSize: 12, color: dkText }}>
          {isActive
            ? `${rooms.length} active rooms · ${students.length} students`
            : `${students.length} student${students.length !== 1 ? 's' : ''} in session`
          }
        </div>
      </div>

      {/* Controls — when not active */}
      {!isActive && (
        <div style={{ padding: '0 12px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: dkText, whiteSpace: 'nowrap' }}>Rooms:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => setNumRooms(n => Math.max(2, n - 1))} style={{ width: 26, height: 26, borderRadius: 6, fontSize: 14, fontWeight: 700, background: dk('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.05)'), border: `1px solid ${dkBorder}`, color: dkTextStrong, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ width: 28, textAlign: 'center', fontSize: 14, fontWeight: 700, color: dkTextStrong }}>{numRooms}</span>
              <button onClick={() => setNumRooms(n => Math.min(10, n + 1))} style={{ width: 26, height: 26, borderRadius: 6, fontSize: 14, fontWeight: 700, background: dk('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.05)'), border: `1px solid ${dkBorder}`, color: dkTextStrong, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <label style={{ fontSize: 11, color: dkText, whiteSpace: 'nowrap' }}>Timer:</label>
              <select value={timerMinutes} onChange={(e) => setTimerMinutes(Number(e.target.value))} style={{ padding: '3px 6px', borderRadius: 5, fontSize: 11, background: dkInputBg, border: `1px solid ${dkInputBorder}`, color: dkTextStrong, outline: 'none' }}>
                {[5, 10, 15, 20, 30, 45, 60].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => createRooms('random')} style={{ flex: 1, padding: '7px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" /></svg>
              Random
            </button>
            <button onClick={() => createRooms('auto')} style={{ flex: 1, padding: '7px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>
              Auto
            </button>
          </div>
        </div>
      )}

      {/* Active Breakout Rooms */}
      {isActive && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Timer display */}
          <div style={{ padding: '10px 12px', borderRadius: 8, background: dkBg, border: `1px solid ${dkBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={timerDone ? '#f59e0b' : timerActive ? '#22c55e' : dkText} strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: timerDone ? '#f59e0b' : timerActive ? '#4ade80' : dkTextStrong, letterSpacing: 1 }}>
                {formatTime(totalSeconds)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {!timerDone && (
                <button onClick={() => setTimerActive(!timerActive)} style={{ padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: timerActive ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)', border: `1px solid ${timerActive ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.25)'}`, color: timerActive ? '#fbbf24' : '#4ade80', cursor: 'pointer' }}>
                  {timerActive ? 'Pause' : 'Start'}
                </button>
              )}
              {timerDone && (
                <span style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b' }}>Time&apos;s up!</span>
              )}
              <button onClick={() => { setTimerDone(false); setTimerSeconds(0); setTimerMinutes(10); setTimerActive(false); if (timerRef.current) clearInterval(timerRef.current) }} style={{ padding: '4px 8px', borderRadius: 5, fontSize: 10, background: 'none', border: `1px solid ${dkBorder}`, color: dkText, cursor: 'pointer' }}>Reset</button>
            </div>
          </div>

          {/* Manual mode toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: dkText }}>Enable manual reassignment</span>
            <button onClick={() => setManualMode(!manualMode)} style={{ width: 36, height: 20, borderRadius: 10, padding: 2, background: manualMode ? 'rgba(99,102,241,0.4)' : dk('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)'), border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: manualMode ? '#a5b4fc' : dk('#94a3b8', '#64748b'), transition: 'transform 0.2s', transform: manualMode ? 'translateX(16px)' : 'translateX(0)' }} />
            </button>
          </div>

          {/* Room cards */}
          {rooms.map((room, idx) => (
            <div key={room.id} style={{ padding: '10px', borderRadius: 8, background: dkBg, border: `1px solid ${room.color}33`, borderLeft: `3px solid ${room.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: room.color, background: `${room.color}1a`, padding: '2px 8px', borderRadius: 4 }}>R{idx + 1}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: dkTextStrong }}>{room.name}</span>
                </div>
                <span style={{ fontSize: 11, color: dkText }}>{room.members.length} student{room.members.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Members */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {room.members.map(memberId => (
                  <span key={memberId} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: dkTextStrong, background: dk('rgba(0,0,0,0.03)', 'rgba(255,255,255,0.04)'), padding: '3px 8px', borderRadius: 12, border: `1px solid ${dkBorder}` }}>
                    👤 {getParticipantName(memberId)}
                    {manualMode && (
                      <button onClick={() => moveStudent(memberId, room.id, null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1, marginLeft: 2 }} title="Remove from room">×</button>
                    )}
                  </span>
                ))}
                {room.members.length === 0 && (
                  <span style={{ fontSize: 11, color: dkText, fontStyle: 'italic' }}>No students assigned</span>
                )}
              </div>

              {/* Manual: dropdown to add student */}
              {manualMode && unassigned.length > 0 && (
                <select onChange={(e) => { if (e.target.value) { moveStudent(e.target.value, null, room.id); e.target.value = '' } }} value="" style={{ width: '100%', padding: '4px 8px', borderRadius: 5, fontSize: 11, marginBottom: 6, background: dkInputBg, border: `1px solid ${dkInputBorder}`, color: dkTextStrong, outline: 'none' }}>
                  <option value="">+ Add student...</option>
                  {unassigned.map(id => <option key={id} value={id}>{getParticipantName(id)}</option>)}
                </select>
              )}

              {/* Room actions */}
              <button onClick={() => setShowRoomBroadcast(showRoomBroadcast === room.id ? null : room.id)} style={{ padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Broadcast Message
              </button>

              {showRoomBroadcast === room.id && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  <input value={roomBroadcastMsg[room.id] || ''} onChange={(e) => setRoomBroadcastMsg(prev => ({ ...prev, [room.id]: e.target.value }))} placeholder={`Message to ${room.name}...`} onKeyDown={(e) => { if (e.key === 'Enter') handleRoomBroadcast(room) }} style={{ flex: 1, padding: '5px 8px', borderRadius: 5, fontSize: 11, background: dkInputBg, border: `1px solid ${dkInputBorder}`, color: dkTextStrong, outline: 'none', minWidth: 0 }} />
                  <button onClick={() => handleRoomBroadcast(room)} style={{ padding: '5px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'rgba(59,130,246,0.25)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd', cursor: 'pointer' }}>Send</button>
                </div>
              )}
            </div>
          ))}

          {/* Unassigned students (manual mode) */}
          {manualMode && unassigned.length > 0 && (
            <div style={{ padding: '10px', borderRadius: 8, background: dk('rgba(245,158,11,0.05)', 'rgba(245,158,11,0.08)'), border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 6 }}>Unassigned ({unassigned.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {unassigned.map(id => (
                  <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: dkTextStrong, padding: '3px 8px', borderRadius: 12, background: dk('rgba(245,158,11,0.1)', 'rgba(245,158,11,0.15)'), border: '1px solid rgba(245,158,11,0.2)' }}>
                    👤 {getParticipantName(id)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Broadcast to All */}
          <div style={{ padding: '10px', borderRadius: 8, background: dkBg, border: `1px solid ${dkBorder}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: dkText, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Broadcast to All Rooms</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <input value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="Message to all breakout rooms..." onKeyDown={(e) => { if (e.key === 'Enter') handleBroadcastAll() }} style={{ flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 12, background: dkInputBg, border: `1px solid ${dkInputBorder}`, color: dkTextStrong, outline: 'none', minWidth: 0 }} />
              <button onClick={handleBroadcastAll} disabled={!broadcastMsg.trim()} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', cursor: broadcastMsg.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>Send</button>
            </div>
          </div>

          {/* End controls */}
          <div style={{ display: 'flex', gap: 6, paddingTop: 4, paddingBottom: 8 }}>
            <button onClick={endBreakout} style={{ flex: 1, padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
              End
            </button>
            <button onClick={endBreakout} style={{ flex: 1, padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              Bring All Back
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isActive && students.length === 0 && (
        <div style={{ padding: '0 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: dkText, padding: '20px 0' }}>
            Waiting for students to join before creating breakout rooms.
          </div>
        </div>
      )}
    </div>
  )
}
