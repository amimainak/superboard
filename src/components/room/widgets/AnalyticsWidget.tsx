// ============================================================
// Superboard — Analytics Dashboard Widget
// Shows tutor analytics: session counts, time spent, subjects, usage
// ============================================================

'use client'

import { useEffect, useState } from 'react'
import { getFeatureLimit, getTierLabel } from '@/lib/features'
import type { Tier } from '@/lib/validations'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface AnalyticsData {
  totalRooms: number
  completedSessions: number
  totalMinutes: number
  subjectBreakdown: { subject: string; count: number }[]
  dailyTrend: { date: string; day?: string; count: number }[]
  usage: {
    videoMinutesUsed: number
    aiCreditsUsed: number
  }
  tier: string
}

const SUBJECT_COLORS: Record<string, string> = {
  MATH: '#22c55e',
  SCIENCE: '#38bdf8',
  LANGUAGE: '#f59e0b',
  ENGLISH: '#a78bfa',
  PHYSICS: '#fb7185',
  CHEMISTRY: '#2dd4bf',
  BIOLOGY: '#4ade80',
  GENERAL: '#64748b',
}

const FALLBACK_COLOR = '#64748b'

export function AnalyticsWidget({ roomId }: { roomId: string }) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchAnalytics() {
      try {
        setLoading(true)
        const res = await fetch('/api/analytics')
        if (!res.ok) throw new Error('Unable to load analytics. Please sign in and try again.')
        const text = await res.text()
        let json: AnalyticsData
        try { json = JSON.parse(text) } catch { throw new Error('Invalid response from server.') }
        if (!cancelled) setData(json)
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAnalytics()
    return () => { cancelled = true }
  }, [roomId])

  const tier = (data?.tier || 'FREE') as Tier
  const videoLimit = getFeatureLimit('video_call', tier) ?? 120
  const aiLimit = getFeatureLimit('ai_assistant', tier) ?? 10
  const videoUsed = data?.usage.videoMinutesUsed || 0
  const aiUsed = data?.usage.aiCreditsUsed || 0
  const totalSessionsThisWeek = (data?.dailyTrend || []).reduce((s, d) => s + d.count, 0)
  const maxDailySessions = Math.max(...(data?.dailyTrend || []).map(d => d.count), 1)

  if (loading) {
    return (
      <div className={`analytics-widget ${isDark ? '' : 'analytics-widget-light'}`}>
        <div className={`analytics-loading ${isDark ? '' : 'analytics-loading-light'}`}>
          <div className="analytics-spinner" />
          <span>Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`analytics-widget ${isDark ? '' : 'analytics-widget-light'}`}>
        <div className="analytics-error">{error}</div>
      </div>
    )
  }

  if (!data) return null

  const totalSubjectSessions = data.subjectBreakdown.reduce((s, b) => s + b.count, 0) || 1
  const hours = Math.round((data.totalMinutes / 60) * 10) / 10

  return (
    <div className={`analytics-widget ${isDark ? '' : 'analytics-widget-light'}`}>
      {/* Stats row */}
      <div className="analytics-stats-row">
        <div className={`analytics-stat-card ${isDark ? '' : 'analytics-stat-card-light'}`}>
          <div className={`analytics-stat-value ${isDark ? '' : 'analytics-stat-value-light'}`}>{data.totalRooms}</div>
          <div className={`analytics-stat-label ${isDark ? '' : 'analytics-stat-label-light'}`}>Rooms</div>
        </div>
        <div className={`analytics-stat-card ${isDark ? '' : 'analytics-stat-card-light'}`}>
          <div className={`analytics-stat-value ${isDark ? '' : 'analytics-stat-value-light'}`}>{hours}h</div>
          <div className={`analytics-stat-label ${isDark ? '' : 'analytics-stat-label-light'}`}>Hours</div>
        </div>
        <div className={`analytics-stat-card ${isDark ? '' : 'analytics-stat-card-light'}`}>
          <div className={`analytics-stat-value ${isDark ? '' : 'analytics-stat-value-light'}`}>{data.completedSessions}</div>
          <div className={`analytics-stat-label ${isDark ? '' : 'analytics-stat-label-light'}`}>Sessions</div>
        </div>
      </div>

      {/* This Week Trend */}
      <div className="analytics-section">
        <div className={`analytics-section-title ${isDark ? '' : 'analytics-section-title-light'}`}>This Week</div>
        <div className="analytics-trend-bars">
          {data.dailyTrend.map((day) => {
            const pct = maxDailySessions > 0 ? (day.count / maxDailySessions) * 100 : 0
            return (
              <div key={day.date} className="analytics-trend-day">
                <div className="analytics-trend-bar-track">
                  <div
                    className="analytics-trend-bar-fill"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                </div>
                <div className={`analytics-trend-label ${isDark ? '' : 'analytics-trend-label-light'}`}>{day.day || day.date.slice(5)}</div>
                <div className={`analytics-trend-count ${isDark ? '' : 'analytics-trend-count-light'}`}>{day.count}</div>
              </div>
            )
          })}
        </div>
        <div className={`analytics-trend-total ${isDark ? '' : 'analytics-trend-total-light'}`}>{totalSessionsThisWeek} sessions this week</div>
      </div>

      {/* Subject Breakdown */}
      {data.subjectBreakdown.length > 0 && (
        <div className="analytics-section">
          <div className={`analytics-section-title ${isDark ? '' : 'analytics-section-title-light'}`}>Subjects</div>
          <div className="analytics-subject-list">
            {data.subjectBreakdown.map((s) => {
              const pct = Math.round((s.count / totalSubjectSessions) * 100)
              const color = SUBJECT_COLORS[s.subject] || FALLBACK_COLOR
              return (
                <div key={s.subject} className="analytics-subject-row">
                  <div className="analytics-subject-info">
                    <span className={`analytics-subject-name ${isDark ? '' : 'analytics-subject-name-light'}`}>
                      {s.subject.charAt(0) + s.subject.slice(1).toLowerCase()}
                    </span>
                    <span className={`analytics-subject-pct ${isDark ? '' : 'analytics-subject-pct-light'}`}>{pct}%</span>
                  </div>
                  <div className={`analytics-subject-bar-track ${isDark ? '' : 'analytics-subject-bar-track-light'}`}>
                    <div
                      className="analytics-subject-bar-fill"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Usage */}
      <div className="analytics-section">
        <div className={`analytics-section-title ${isDark ? '' : 'analytics-section-title-light'}`}>
          Usage ({getTierLabel(tier)} tier)
        </div>
        <div className="analytics-usage-list">
          <div className="analytics-usage-row">
            <div className="analytics-usage-info">
              <span className={`analytics-usage-label ${isDark ? '' : 'analytics-usage-label-light'}`}>Video</span>
              <span className={`analytics-usage-value ${isDark ? '' : 'analytics-usage-value-light'}`}>
                {videoUsed}/{videoLimit} min
              </span>
            </div>
            <div className={`analytics-usage-bar-track ${isDark ? '' : 'analytics-usage-bar-track-light'}`}>
              <div
                className="analytics-usage-bar-fill"
                style={{
                  width: `${Math.min((videoUsed / videoLimit) * 100, 100)}%`,
                  background: videoUsed / videoLimit > 0.8 ? '#f59e0b' : '#22c55e',
                }}
              />
            </div>
          </div>
          <div className="analytics-usage-row">
            <div className="analytics-usage-info">
              <span className={`analytics-usage-label ${isDark ? '' : 'analytics-usage-label-light'}`}>AI</span>
              <span className={`analytics-usage-value ${isDark ? '' : 'analytics-usage-value-light'}`}>
                {aiUsed}/{aiLimit} credits
              </span>
            </div>
            <div className={`analytics-usage-bar-track ${isDark ? '' : 'analytics-usage-bar-track-light'}`}>
              <div
                className="analytics-usage-bar-fill"
                style={{
                  width: `${Math.min((aiUsed / aiLimit) * 100, 100)}%`,
                  background: aiUsed / aiLimit > 0.8 ? '#f59e0b' : '#22c55e',
                }}
              />
            </div>
          </div>
        </div>
        {tier === 'FREE' && (
          <a href="/pricing" className="analytics-upgrade-btn">
            Upgrade for more →
          </a>
        )}
      </div>
    </div>
  )
}
