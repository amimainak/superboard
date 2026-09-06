'use client'

// ============================================================
// BoardReplay — replay player for board events
// ============================================================
// Loads BoardEvents from /api/rooms/[roomId]/events and plays them
// back on a whiteboard canvas. The replay consumes events from a
// queue — adding/updating/removing elements as they happened.
//
// Controls: play/pause, speed (1x/2x/4x), scrub bar, restart.
// ============================================================

import { useEffect, useState, useRef, useCallback } from 'react'
import { authFetch } from '@/lib/auth-fetch'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, RotateCcw, Loader2 } from 'lucide-react'
import type { WhiteboardElement } from '@/lib/whiteboard/types'

interface BoardEvent {
  id: string
  pageIndex: number
  eventType: 'add' | 'update' | 'remove'
  elementId: string
  elementData: unknown
  timestamp: string
}

interface Props {
  roomId: string
}

export function BoardReplay({ roomId }: Props) {
  const [events, setEvents] = useState<BoardEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(2) // 1x, 2x, 4x
  const [currentIdx, setCurrentIdx] = useState(0)
  const [elements, setElements] = useState<Map<string, WhiteboardElement>>(new Map())

  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load events
  useEffect(() => {
    authFetch(`/api/rooms/${roomId}/events`)
      .then(r => r.json())
      .then(data => {
        setEvents(data.events || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [roomId])

  // Apply a single event to the elements map
  const applyEvent = useCallback((event: BoardEvent, currentElements: Map<string, WhiteboardElement>) => {
    const newElements = new Map(currentElements)
    switch (event.eventType) {
      case 'add':
      case 'update':
        if (event.elementData) {
          newElements.set(event.elementId, event.elementData as WhiteboardElement)
        }
        break
      case 'remove':
        newElements.delete(event.elementId)
        break
    }
    return newElements
  }, [])

  // Playback loop — apply events one by one with a delay
  useEffect(() => {
    if (!playing || currentIdx >= events.length) {
      if (currentIdx >= events.length) setPlaying(false)
      return
    }

    const event = events[currentIdx]
    setElements(prev => applyEvent(event, prev))

    // Calculate delay to next event (capped at 200ms for speed)
    const nextEvent = events[currentIdx + 1]
    const delay = nextEvent
      ? Math.min(200, Math.max(10, (new Date(nextEvent.timestamp).getTime() - new Date(event.timestamp).getTime()) / speed))
      : 100

    playTimerRef.current = setTimeout(() => {
      setCurrentIdx(prev => prev + 1)
    }, delay)

    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current)
    }
  }, [playing, currentIdx, events, speed, applyEvent])

  const handlePlay = () => {
    if (currentIdx >= events.length) {
      // Restart from beginning
      setCurrentIdx(0)
      setElements(new Map())
    }
    setPlaying(true)
  }

  const handlePause = () => {
    setPlaying(false)
  }

  const handleRestart = () => {
    setPlaying(false)
    setCurrentIdx(0)
    setElements(new Map())
  }

  const handleScrub = (value: number) => {
    setPlaying(false)
    const newIdx = Math.floor((value / 100) * events.length)
    setCurrentIdx(newIdx)
    // Rebuild elements up to this point
    const newElements = new Map<string, WhiteboardElement>()
    for (let i = 0; i < newIdx; i++) {
      const updated = applyEvent(events[i], newElements)
      newElements.clear()
      updated.forEach((v, k) => newElements.set(k, v))
    }
    setElements(newElements)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No replay data for this lesson.</p>
        <p className="text-xs text-muted-foreground mt-1">Replay data is collected during active lessons.</p>
      </div>
    )
  }

  const progress = events.length > 0 ? (currentIdx / events.length) * 100 : 0
  const elementList = Array.from(elements.values())

  return (
    <div className="space-y-3">
      {/* Canvas preview — render elements as SVG */}
      <div className="rounded-xl border border-border overflow-hidden bg-slate-50" style={{ aspectRatio: '16/10' }}>
        <svg width="100%" height="100%" viewBox="0 0 1200 750" style={{ background: '#f8fafc' }}>
          {/* Render elements — simplified, just show that something is happening */}
          {elementList.map((el) => {
            // Basic rendering — in production, use ElementRenderer
            if (el.type === 'rectangle') {
              return <rect key={el.id} x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fillColor || 'none'} stroke={el.strokeColor} strokeWidth={el.strokeWidth} opacity={el.opacity} />
            }
            if (el.type === 'ellipse') {
              return <ellipse key={el.id} cx={el.x + el.width / 2} cy={el.y + el.height / 2} rx={el.width / 2} ry={el.height / 2} fill={el.fillColor || 'none'} stroke={el.strokeColor} strokeWidth={el.strokeWidth} opacity={el.opacity} />
            }
            if (el.type === 'text' && el.text) {
              return <text key={el.id} x={el.x} y={el.y + 20} fill={el.strokeColor} fontSize={el.fontSize || 14} opacity={el.opacity}>{el.text}</text>
            }
            return null
          })}
        </svg>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" className="rounded-xl h-8 w-8 p-0" onClick={playing ? handlePause : handlePlay}>
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl h-8 w-8 p-0" onClick={handleRestart}>
          <RotateCcw className="w-4 h-4" />
        </Button>

        {/* Scrub bar */}
        <div className="flex-1">
          <Slider
            value={[progress]}
            onValueChange={(v) => handleScrub(v[0])}
            max={100}
            step={0.1}
            className="cursor-pointer"
          />
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-1">
          {[1, 2, 4].map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`text-xs px-2 py-1 rounded-md font-medium ${speed === s ? 'bg-emerald-100 text-emerald-700' : 'text-muted-foreground hover:bg-muted'}`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Event counter */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{currentIdx} / {events.length} events</span>
        <span>{elementList.length} elements on board</span>
      </div>
    </div>
  )
}
