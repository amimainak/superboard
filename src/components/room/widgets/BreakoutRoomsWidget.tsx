// ============================================================
// Superboard — Breakout Rooms Widget
// UI-only widget for splitting a class into smaller groups.
// Actual room splitting requires Hocuspocus server support.
// ============================================================

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useCollabStore, type RemoteUser } from '@/lib/collab/store'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface BreakoutRoom {
  id: string
  name: string
  members: string[] // user ids
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

export function BreakoutRoomsWidget({ roomId }: { roomId: string }) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const remoteUsers = useCollabStore((s) => s.remoteUsers)
  const [rooms, setRooms] = useState<BreakoutRoom[]>([])
  const [numRooms, setNumRooms] = useState(3)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [roomBroadcastMsg, setRoomBroadcastMsg] = useState<Record<string, string>>({})
  const [showRoomBroadcast, setShowRoomBroadcast] = useState<string | null>(null)
  const isActive = rooms.length > 0

  // All participants: tutor ("You") + remote users
  const allParticipants = useMemo(() => {
    const participants: { id: string; name: string }[] = [
      { id: '__tutor__', name: 'You (Tutor)' },
    ]
    for (const u of remoteUsers) {
      participants.push({ id: u.id, name: u.name || 'Anonymous' })
    }
    return participants
  }, [remoteUsers])

  const createRooms = useCallback((strategy: 'random' | 'auto') => {
    const students = allParticipants.filter(p => p.id !== '__tutor__')
    if (students.length === 0) {
      alert('No students in the room to assign to breakout rooms.')
      return
    }

    const count = Math.min(numRooms, students.length)
    let assignedStudents: { id: string; name: string }[]

    if (strategy === 'random') {
      assignedStudents = shuffleArray(students)
    } else {
      // auto: just use the current order
      assignedStudents = [...students]
    }

    const newRooms: BreakoutRoom[] = []
    for (let i = 0; i < count; i++) {
      newRooms.push({
        id: `room-${i}`,
        name: ROOM_NAMES[i] || `Room ${i + 1}`,
        members: [],
        color: ROOM_COLORS[i % ROOM_COLORS.length],
      })
    }

    // Distribute students round-robin
    assignedStudents.forEach((student, idx) => {
      newRooms[idx % count].members.push(student.id)
    })

    setRooms(newRooms)
  }, [allParticipants, numRooms])

  const endBreakout = useCallback(() => {
    setRooms([])
    setBroadcastMsg('')
    setRoomBroadcastMsg({})
    setShowRoomBroadcast(null)
  }, [])

  const getParticipantName = useCallback((id: string) => {
    if (id === '__tutor__') return 'You (Tutor)'
    const found = remoteUsers.find(u => u.id === id)
    return found?.name || 'Anonymous'
  }, [remoteUsers])

  const sendBroadcastToChat = useCallback(async (msg: string, target?: string) => {
    if (!msg.trim()) return
    const prefix = target ? `[Breakout - ${target}] ` : '[Broadcast to All] '
    const content = prefix + msg.trim()
    try {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client')
      const sb = getSupabaseBrowserClient()
      const { data: { user } } = await sb.auth.getUser()
      const label = user ? 'Tutor' : 'Host'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sb as any).from('ChatMessage').insert({
        roomId,
        senderLabel: label,
        content,
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

  return (
    <div className="widget-content breakout-widget">
      {/* Header */
      }
      <div style={{ padding: '12px 12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>{isActive ? '🏠' : '🚪'}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Breakout Rooms</span>
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          {isActive
            ? `${rooms.length} active rooms · ${allParticipants.length - 1} students`
            : `${allParticipants.length - 1} students in session`
          }
        </div>
      </div>

      {/* Controls — only when not active */
      }
      {!isActive && (
        <div style={{ padding: '0 12px 8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
          }}>
            <label style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
              Number of rooms:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setNumRooms(n => Math.max(2, n - 1))}
                style={{
                  width: 26, height: 26, borderRadius: 6, fontSize: 14, fontWeight: 700,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                −
              </button>
              <span style={{
                width: 28, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#f1f5f9',
              }}>
                {numRooms}
              </span>
              <button
                onClick={() => setNumRooms(n => Math.min(10, n + 1))}
                style={{
                  width: 26, height: 26, borderRadius: 6, fontSize: 14, fontWeight: 700,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                +
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => createRooms('random')}
              style={{
                flex: 1, padding: '7px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                color: '#a5b4fc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" />
              </svg>
              Assign Randomly
            </button>
            <button
              onClick={() => createRooms('auto')}
              style={{
                flex: 1, padding: '7px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                color: '#4ade80', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
              Auto
            </button>
          </div>
        </div>
      )}

      {/* Active Breakout Rooms */
      }
      {isActive && (
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rooms.map((room, idx) => (
            <div
              key={room.id}
              style={{
                padding: '10px', borderRadius: 8,
                background: 'rgba(15,23,42,0.5)',
                border: `1px solid ${room.color}33`,
                borderLeft: `3px solid ${room.color}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: room.color,
                    background: `${room.color}1a`, padding: '2px 8px', borderRadius: 4,
                  }}>
                    Room {idx + 1}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{room.name}</span>
                </div>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {room.members.length} student{room.members.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Members */
              }
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {room.members.map(memberId => (
                  <span
                    key={memberId}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11, color: '#cbd5e1',
                      background: 'rgba(255,255,255,0.04)',
                      padding: '3px 8px', borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    👤 {getParticipantName(memberId)}
                  </span>
                ))}
                {room.members.length === 0 && (
                  <span style={{ fontSize: 11, color: '#475569', fontStyle: 'italic' }}>No students assigned</span>
                )}
              </div>

              {/* Room Actions */
              }
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  onClick={() => setShowRoomBroadcast(showRoomBroadcast === room.id ? null : room.id)}
                  style={{
                    padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                    background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
                    color: '#60a5fa', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  Broadcast Message
                </button>
              </div>

              {/* Room broadcast input */
              }
              {showRoomBroadcast === room.id && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  <input
                    value={roomBroadcastMsg[room.id] || ''}
                    onChange={(e) => setRoomBroadcastMsg(prev => ({ ...prev, [room.id]: e.target.value }))}
                    placeholder={`Message to ${room.name}...`}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRoomBroadcast(room) }}
                    style={{
                      flex: 1, padding: '5px 8px', borderRadius: 5, fontSize: 11,
                      background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#e2e8f0', outline: 'none', minWidth: 0,
                    }}
                  />
                  <button
                    onClick={() => handleRoomBroadcast(room)}
                    style={{
                      padding: '5px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                      background: 'rgba(59,130,246,0.25)', border: '1px solid rgba(59,130,246,0.3)',
                      color: '#93c5fd', cursor: 'pointer',
                    }}
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Broadcast to All */
          }
          <div style={{
            padding: '10px', borderRadius: 8,
            background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Broadcast to All Rooms
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="Message to all breakout rooms..."
                onKeyDown={(e) => { if (e.key === 'Enter') handleBroadcastAll() }}
                style={{
                  flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 12,
                  background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0', outline: 'none', minWidth: 0,
                }}
              />
              <button
                onClick={handleBroadcastAll}
                disabled={!broadcastMsg.trim()}
                style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)',
                  color: '#60a5fa', cursor: broadcastMsg.trim() ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                }}
              >
                Send
              </button>
            </div>
          </div>

          {/* End controls */
          }
          <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
            <button
              onClick={endBreakout}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" /><path d="M6 6l12 12" />
              </svg>
              End Breakout
            </button>
            <button
              onClick={endBreakout}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                color: '#4ade80', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Bring All Back
            </button>
          </div>
        </div>
      )}

      {/* Empty state */
      }
      {!isActive && allParticipants.length <= 1 && (
        <div style={{ padding: '0 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#64748b', padding: '20px 0' }}>
            Waiting for students to join before creating breakout rooms.
          </div>
        </div>
      )}
    </div>
  )
}
