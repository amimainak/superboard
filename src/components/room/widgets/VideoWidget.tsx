// ============================================================
// Superboard — Video Widget (Placeholder)
// Will be wired to LiveKit once VPS is deployed.
// ============================================================

'use client'

interface VideoWidgetProps {
  roomId: string
}

export function VideoWidget({ roomId }: VideoWidgetProps) {
  return (
    <div className="widget-content widget-video">
      <div className="video-placeholder">
        <div className="video-placeholder-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15.6 11.6L22 7v10l-6.4-4.5v-1zM4 5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
          </svg>
        </div>
        <div className="video-placeholder-title">Video Call</div>
        <div className="video-placeholder-desc">
          Live video, audio &amp; screen sharing via LiveKit
        </div>
        <div className="video-placeholder-status">
          Requires VPS setup (LiveKit Server)
        </div>
        <button className="video-placeholder-btn" disabled>
          Coming Soon
        </button>
      </div>
    </div>
  )
}
