// ============================================================
// ReplayPanel — lets tutors pick a past lesson and watch the replay
// ============================================================
// Shows a list of the tutor's past lessons (rooms with endedAt).
// Clicking one opens the BoardReplay component for that room.
// ============================================================

'use client'

import { useEffect, useState, useCallback } from 'react'
import { authFetch } from '@/lib/auth-fetch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play, ArrowLeft, Clock } from 'lucide-react'
import { subjectMeta } from '@/lib/subject-meta'
import { BoardReplay } from '@/components/room/BoardReplay'

interface RoomListItem {
  id: string
  subject: string
  studentName: string | null
  endedAt: string | null
  durationMinutes: number
  title: string | null
}

export function ReplayPanel() {
  const [rooms, setRooms] = useState<RoomListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  const fetchRooms = useCallback(async () => {
    try {
      // Fetch rooms that have ended (past lessons with replay data)
      const res = await authFetch('/api/rooms?status=inactive')
      if (!res.ok) return
      const data = await res.json()
      // Filter to rooms with endedAt (completed lessons)
      const completed = (Array.isArray(data) ? data : data.rooms || [])
        .filter((r: RoomListItem) => r.endedAt)
      setRooms(completed)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchRooms().finally(() => setLoading(false))
  }, [fetchRooms])

  // If a room is selected, show the replay
  if (selectedRoomId) {
    const room = rooms.find(r => r.id === selectedRoomId)
    return (
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-500" />
              Replay: {room?.title || subjectMeta[room?.subject || 'GENERAL']?.label || 'Lesson'}
            </CardTitle>
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs" onClick={() => setSelectedRoomId(null)}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back to list
            </Button>
          </div>
          {room && (
            <p className="text-xs text-muted-foreground mt-1">
              {room.studentName && `${room.studentName} · `}
              {new Date(room.endedAt!).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {room.durationMinutes > 0 && ` · ${room.durationMinutes} min`}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <BoardReplay roomId={selectedRoomId} />
        </CardContent>
      </Card>
    )
  }

  // Otherwise show the list of past lessons
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Play className="w-5 h-5 text-emerald-500" />
          Lesson Replay
          {rooms.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{rooms.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-8">
            <Play className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No completed lessons yet.</p>
            <p className="text-xs text-muted-foreground mt-1">End a lesson to generate replay data.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.map(room => {
              const meta = subjectMeta[room.subject] || subjectMeta.GENERAL
              return (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors text-left"
                >
                  <div className={`w-9 h-9 rounded-lg ${meta.gradient} flex items-center justify-center flex-shrink-0`}>
                    <meta.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {room.title || `${meta.label} lesson`}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {room.studentName && `${room.studentName} · `}
                      {new Date(room.endedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {room.durationMinutes > 0 && ` · ${room.durationMinutes} min`}
                    </p>
                  </div>
                  <Play className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
