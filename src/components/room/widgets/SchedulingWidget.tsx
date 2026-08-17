// ============================================================
// Superboard — Scheduling Widget
// Calendly-style scheduling: set weekly availability, share booking link,
// view and manage upcoming bookings.
// ============================================================

'use client'

import { useEffect, useState, useCallback } from 'react'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface ScheduleSlot {
  id: string
  tutorId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  timezone: string
  isActive: boolean
}

interface Booking {
  id: string
  tutorId: string
  studentName: string
  studentEmail: string | null
  bookingDate: string
  startTime: string
  endTime: string
  status: 'upcoming' | 'completed' | 'cancelled'
  roomId: string | null
  notes: string | null
  createdAt: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function SchedulingWidget({ roomId }: { roomId: string }) {
  const [slots, setSlots] = useState<ScheduleSlot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [addingDay, setAddingDay] = useState<number | null>(null)
  const [newStart, setNewStart] = useState('09:00')
  const [newEnd, setNewEnd] = useState('17:00')

  // Fetch slots and bookings on mount
  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        const [slotRes, bookingRes] = await Promise.all([
          fetch('/api/schedule'),
          fetch('/api/bookings'),
        ])
        if (!cancelled) {
          if (slotRes.ok) {
            const slotData = await slotRes.json()
            setSlots(Array.isArray(slotData) ? slotData : [])
          }
          if (bookingRes.ok) {
            const bookingData = await bookingRes.json()
            setBookings(Array.isArray(bookingData) ? bookingData : [])
          }
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load schedule data:', err)
          setLoading(false)
        }
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [])

  const refreshSlots = useCallback(async () => {
    try {
      const res = await fetch('/api/schedule')
      if (res.ok) {
        const data = await res.json()
        setSlots(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err)
    }
  }, [])

  const handleAddSlot = async (dayOfWeek: number) => {
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek, startTime: newStart, endTime: newEnd }),
      })
      if (res.ok) {
        await refreshSlots()
        setAddingDay(null)
      }
    } catch (err) {
      console.error('Failed to add slot:', err)
    }
  }

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const res = await fetch(`/api/schedule/${slotId}`, { method: 'DELETE' })
      if (res.ok) {
        await refreshSlots()
      }
    } catch (err) {
      console.error('Failed to delete slot:', err)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bookingId,
          action: 'cancel',
        }),
      })
      if (res.ok) {
        setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: 'cancelled' as const } : b))
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err)
    }
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/book/${roomId}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = link
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Organize slots by day
  const slotsByDay: Record<number, ScheduleSlot[]> = {}
  for (let i = 0; i < 7; i++) slotsByDay[i] = []
  for (const slot of slots) {
    if (slotsByDay[slot.dayOfWeek]) {
      slotsByDay[slot.dayOfWeek].push(slot)
    }
  }

  // Upcoming bookings (sorted by date)
  const upcomingBookings = bookings
    .filter((b) => b.status === 'upcoming')
    .sort((a, b) => {
      const da = a.bookingDate + 'T' + a.startTime
      const db = b.bookingDate + 'T' + b.startTime
      return da.localeCompare(db)
    })

  if (loading) {
    return (
      <div className="widget-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: '#475569', fontSize: 13 }}>
          Loading schedule...
        </div>
      </div>
    )
  }

  return (
    <div className="widget-content">
      {/* Header */}
      <div className="sched-header">
        <span className="sched-header-icon">📅</span>
        <span className="sched-header-title">Availability</span>
      </div>

      {/* Weekly slots */}
      <div className="sched-section-label">Set your weekly hours:</div>
      <div className="sched-slots-list">
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <div key={day} className="sched-day-row">
            <span className="sched-day-name">{DAY_NAMES[day]}</span>
            {slotsByDay[day].length > 0 ? (
              slotsByDay[day].map((slot) => (
                <div key={slot.id} className="sched-slot">
                  <span className="sched-slot-time">{slot.startTime} – {slot.endTime}</span>
                  <button
                    className="sched-slot-remove"
                    onClick={() => handleDeleteSlot(slot.id)}
                    title="Remove"
                    aria-label={`Remove ${DAY_LABELS[day]} slot`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ))
            ) : addingDay === day ? (
              <div className="sched-add-form">
                <input
                  type="time"
                  className="sched-time-input"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                />
                <span className="sched-time-sep">–</span>
                <input
                  type="time"
                  className="sched-time-input"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                />
                <button className="sched-add-confirm" onClick={() => handleAddSlot(day)} title="Add">✓</button>
                <button className="sched-add-cancel" onClick={() => setAddingDay(null)} title="Cancel">✕</button>
              </div>
            ) : (
              <span className="sched-day-off">off</span>
            )}
          </div>
        ))}
      </div>

      <button className="sched-add-slot-btn" onClick={() => {
        const emptyDay = [1, 2, 3, 4, 5, 6, 0].find((d) => slotsByDay[d].length === 0)
        setAddingDay(emptyDay ?? 0)
      }}>
        + Add time slot
      </button>

      {/* Upcoming bookings */}
      <div className="sched-section-label" style={{ marginTop: 12 }}>Upcoming Bookings:</div>
      <div className="sched-bookings-list">
        {upcomingBookings.length === 0 ? (
          <div className="sched-empty">No upcoming bookings</div>
        ) : (
          upcomingBookings.map((booking) => (
            <div key={booking.id} className="sched-booking-card">
              <div className="sched-booking-date">
                {formatDate(booking.bookingDate)}, {booking.startTime}–{booking.endTime}
              </div>
              <div className="sched-booking-student">
                Student: {booking.studentName}
                {booking.studentEmail && (
                  <span className="sched-booking-email"> ({booking.studentEmail})</span>
                )}
              </div>
              {booking.roomId && (
                <div className="sched-booking-actions">
                  <a
                    href={`/room/${booking.roomId}`}
                    className="sched-join-btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Join
                  </a>
                  <button
                    className="sched-cancel-btn"
                    onClick={() => handleCancelBooking(booking.id)}
                  >
                    Cancel
                  </button>
                </div>
              )}
              {booking.notes && (
                <div className="sched-booking-notes">{booking.notes}</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Share booking link */}
      <div className="sched-share-section">
        <div className="sched-share-label">📋 Share booking link:</div>
        <button className="sched-copy-btn" onClick={handleCopyLink}>
          {copied ? '✓ Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  )
}
