'use client'

import { useEffect, useState } from 'react'
import { useCollabStore } from '@/lib/collab/store'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

// ============================================================
// ConnectionStatus — top-bar dot + dismissible "lost" banner.
// Task 42 / Fix #20.
//
//  · Green dot  → connected
//  · Yellow dot → connecting
//  · Red dot    → disconnected
//
// When disconnected, a banner slides down from the top of the
// room area. Dismissing it hides the banner for 10 seconds; if
// still disconnected after that window, the banner reappears.
// ============================================================

type ConnState = 'connected' | 'connecting' | 'disconnected'

function deriveState(isConnected: boolean, statusMessage: string): ConnState {
  if (isConnected) return 'connected'
  // The collab store initial statusMessage is 'Connecting...' and flips to
  // 'Disconnected' when setConnected(false) is called. Treat any non-final
  // message as "connecting".
  if (/disconnect/i.test(statusMessage)) return 'disconnected'
  return 'connecting'
}

const DOT_COLOR: Record<ConnState, string> = {
  connected: '#22c55e',
  connecting: '#f59e0b',
  disconnected: '#ef4444',
}

const DOT_GLOW: Record<ConnState, string> = {
  connected: 'rgba(34,197,94,0.55)',
  connecting: 'rgba(245,158,11,0.55)',
  disconnected: 'rgba(239,68,68,0.55)',
}

export function ConnectionStatus() {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const isConnected = useCollabStore((s) => s.isConnected)
  const statusMessage = useCollabStore((s) => s.statusMessage)
  const remoteCount = useCollabStore((s) => s.remoteUsers.length)

  const connState = deriveState(isConnected, statusMessage)

  // ---- Banner dismissal logic (Task 42 / Fix #20) ----
  // Banner shows whenever connState === 'disconnected'. Dismissing sets a
  // 10s cooldown; if still disconnected after the cooldown, the banner
  // reappears.
  const [bannerDismissedAt, setBannerDismissedAt] = useState<number | null>(null)
  const [nowTick, setNowTick] = useState(0)

  // Re-evaluate the cooldown every 2 seconds while disconnected.
  useEffect(() => {
    if (connState !== 'disconnected') return
    const id = window.setInterval(() => setNowTick((t) => t + 1), 2000)
    return () => window.clearInterval(id)
  }, [connState])

  // Reset the dismissal whenever we transition INTO disconnected (so the
  // banner shows immediately on a fresh disconnect).
  useEffect(() => {
    if (connState === 'disconnected') {
      // Only reset on entry — don't keep resetting the cooldown every render.
      // Using a ref-like guard via state setter functional update.
    } else {
      // When connection is restored, clear any dismissal so a future drop
      // shows the banner immediately.
      setBannerDismissedAt(null)
    }
  }, [connState])

  const dismissBanner = () => setBannerDismissedAt(Date.now())

  // Determine whether the banner should currently be visible.
  let bannerVisible = false
  if (connState === 'disconnected') {
    if (bannerDismissedAt === null) {
      bannerVisible = true
    } else {
      // Re-show after 10s
      // (nowTick is just a re-render trigger; we read Date.now() directly)
      bannerVisible = Date.now() - bannerDismissedAt >= 10_000
    }
  }

  const dotClass =
    connState === 'connecting'
      ? 'connection-status-dot connection-status-dot-pulse'
      : 'connection-status-dot'

  // Aria-friendly state label for the top-bar dot.
  const stateLabel =
    connState === 'connected' ? 'Connected'
      : connState === 'connecting' ? 'Connecting'
      : 'Disconnected'

  return (
    <>
      {/* Top-bar colored dot (Task 42 / Fix #20) — small floating
          indicator at the top-right of the whiteboard area so the
          connection state is always glanceable, not just from the
          bottom-left pill. Hidden on narrow screens (CSS) to avoid
          crowding the top-right widget toggle bar. */}
      <div
        className={"connection-status-topdot" + (isDark ? '' : ' connection-status-topdot-light')}
        role="status"
        aria-label={`Connection: ${stateLabel}`}
        title={`Connection: ${stateLabel}${remoteCount > 0 ? ` · ${remoteCount} ${remoteCount === 1 ? 'other' : 'others'} online` : ''}`}
      >
        <span
          className={dotClass}
          style={{
            background: DOT_COLOR[connState],
            boxShadow: `0 0 6px ${DOT_GLOW[connState]}`,
            width: 10,
            height: 10,
          }}
          aria-hidden="true"
        />
      </div>

      {/* Inline status pill (bottom-left, original placement) */}
      <div className={"connection-status" + (isDark ? '' : ' connection-status-light')}>
        <span
          className={dotClass}
          style={{
            background: DOT_COLOR[connState],
            boxShadow: `0 0 4px ${DOT_GLOW[connState]}`,
          }}
          aria-label={`Connection: ${connState}`}
        />
        <span>{statusMessage}</span>
        {remoteCount > 0 && (
          <span className="connection-status-count">
            ({remoteCount} {remoteCount === 1 ? 'other' : 'others'})
          </span>
        )}
      </div>

      {/* Dismissible disconnect banner (top of room area) */}
      {bannerVisible && (
        <div
          className="connection-lost-banner"
          role="status"
          aria-live="assertive"
          data-tick={nowTick}
        >
          <span className="connection-lost-banner-icon" aria-hidden="true">⚠</span>
          <span className="connection-lost-banner-text">
            Connection lost — changes will sync when reconnected
          </span>
          <button
            type="button"
            className="connection-lost-banner-close"
            aria-label="Dismiss connection-lost banner"
            onClick={dismissBanner}
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  )
}
