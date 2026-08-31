// ============================================================
// Superboard — Video Widget (LiveKit)
// Real-time video/audio via self-hosted LiveKit SFU
// ============================================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useTracks,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
} from '@livekit/components-react'
import { Track, ConnectionState } from 'livekit-client'
import '@/components/room/widgets/widgets.css'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface VideoWidgetProps {
  roomId: string
  userName?: string
}

// Inner component that uses LiveKit hooks
function VideoRoomContent({ roomId }: { roomId: string }) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )

  const connectionState = useConnectionState()
  const localParticipant = useLocalParticipant()
  const participants = useParticipants()

  if (connectionState === ConnectionState.Disconnected) {
    return (
      <div className={`video-placeholder ${isDark ? '' : 'video-placeholder-light'}`}>
        <div className={`video-placeholder-icon ${isDark ? '' : 'video-placeholder-icon-light'}`} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15.6 11.6L22 7v10l-6.4-4.5v-1zM4 5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
            <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2" />
          </svg>
        </div>
        <div className={`video-placeholder-title ${isDark ? '' : 'video-placeholder-title-light'}`}>Disconnected</div>
        <div className={`video-placeholder-desc ${isDark ? '' : 'video-placeholder-desc-light'}`}>Click "Join Call" to reconnect</div>
      </div>
    )
  }

  return (
    <div className={`video-content ${isDark ? '' : 'video-content-light'}`}>
      <div className="video-grid">
        {tracks.map((track) => (
          <div key={track.participant.identity} className={`video-tile ${isDark ? '' : 'video-tile-light'}`}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <VideoTrack trackRef={track as any} className="video-track" />
            <div className={`video-tile-name ${isDark ? '' : 'video-tile-name-light'}`}>
              {track.participant.name || track.participant.identity}
              {track.participant.isLocal && ' (You)'}
            </div>
          </div>
        ))}
      </div>
      <div className={`video-info ${isDark ? '' : 'video-info-light'}`}>
        {participants.length} participant{participants.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

// Controls component
function VideoControls() {
  const isDark = useWhiteboardStore((s) => s.isDark)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = useRoomContext() as any
  const room = ctx?.room
  const localParticipant = ctx?.localParticipant
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)

  const toggleMic = useCallback(() => {
    if (localParticipant) {
      if (isMuted) {
        localParticipant.microphone.track?.unmute()
      } else {
        localParticipant.microphone.track?.mute()
      }
      setIsMuted(!isMuted)
    }
  }, [localParticipant, isMuted])

  const toggleCamera = useCallback(() => {
    if (localParticipant) {
      localParticipant.setCameraEnabled(isCameraOff)
      setIsCameraOff(!isCameraOff)
    }
  }, [localParticipant, isCameraOff])

  const leave = useCallback(() => {
    room?.disconnect()
  }, [room])

  return (
    <div className={`video-controls ${isDark ? '' : 'video-controls-light'}`}>
      <button className={`video-ctrl-btn ${isDark ? '' : 'video-ctrl-btn-light'}`} onClick={toggleMic} title={isMuted ? 'Unmute' : 'Mute'}>
        {isMuted ? '🔇' : '🎤'}
      </button>
      <button className={`video-ctrl-btn ${isDark ? '' : 'video-ctrl-btn-light'}`} onClick={toggleCamera} title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}>
        {isCameraOff ? '📷' : '📹'}
      </button>
      <button className={`video-ctrl-btn video-ctrl-btn-danger ${isDark ? '' : 'video-ctrl-btn-light'}`} onClick={leave} title="Leave call">
        📞
      </button>
    </div>
  )
}

export function VideoWidget({ roomId, userName }: VideoWidgetProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isJoined, setIsJoined] = useState(false)

  const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || ''

  const joinCall = useCallback(async () => {
    if (!LIVEKIT_URL) {
      setError('LiveKit not configured. VPS setup required.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: roomId,
          participantName: userName || 'Tutor',
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        return
      }
      setToken(data.token)
      setIsJoined(true)
    } catch (err) {
      setError('Failed to get video token')
    } finally {
      setLoading(false)
    }
  }, [roomId, userName, LIVEKIT_URL])

  if (!LIVEKIT_URL) {
    const dkText = isDark ? '#94a3b8' : '#475569'
    const dkTextStrong = isDark ? '#e2e8f0' : '#1e293b'
    const dkBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
    const dkBg = isDark ? 'rgba(15,23,42,0.5)' : 'rgba(241,245,249,0.8)'
    const roomIdValue = typeof window !== 'undefined' ? window.location.pathname.split('/room/')[1]?.split('/')[0] || '' : ''

    const copyRoomLink = () => {
      const url = window.location.href
      navigator.clipboard?.writeText(url)
      const btn = document.getElementById('copy-link-btn')
      if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy Room Link' }, 2000) }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '12px 12px 8px', borderBottom: `1px solid ${dkBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.6 11.6L22 7v10l-6.4-4.5v-1zM4 5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 700, color: dkTextStrong }}>Video Call</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {/* Setup status */}
          <div style={{ padding: '12px', borderRadius: 8, background: dkBg, border: `1px solid ${dkBorder}`, marginBottom: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📹</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: dkTextStrong, marginBottom: 4 }}>Video Setup Required</div>
            <div style={{ fontSize: 11, color: dkText, lineHeight: 1.5 }}>
              Live video requires a LiveKit server. Contact your administrator or use an external video call while using the whiteboard.
            </div>
          </div>

          {/* Alternative: Share room link */}
          <div style={{ fontSize: 11, fontWeight: 700, color: dkText, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            While waiting, you can:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ padding: '10px', borderRadius: 8, background: dkBg, border: `1px solid ${dkBorder}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: dkTextStrong, marginBottom: 4 }}>Share This Whiteboard</div>
              <div style={{ fontSize: 11, color: dkText, marginBottom: 8, lineHeight: 1.4 }}>
                Send the room link so others can collaborate on the whiteboard in real time.
              </div>
              <button
                id="copy-link-btn"
                onClick={copyRoomLink}
                style={{
                  width: '100%', padding: '7px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)',
                  color: '#38bdf8', cursor: 'pointer',
                }}
              >Copy Room Link</button>
            </div>

            <div style={{ padding: '10px', borderRadius: 8, background: dkBg, border: `1px solid ${dkBorder}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: dkTextStrong, marginBottom: 4 }}>Use External Video</div>
              <div style={{ fontSize: 11, color: dkText, lineHeight: 1.4 }}>
                Start a Zoom, Google Meet, or FaceTime call, then share your screen showing the whiteboard. Students see your drawings in real time.
              </div>
            </div>

            <div style={{ padding: '10px', borderRadius: 8, background: dkBg, border: `1px solid ${dkBorder}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: dkTextStrong, marginBottom: 4 }}>Use the Chat Widget</div>
              <div style={{ fontSize: 11, color: dkText, lineHeight: 1.4 }}>
                The chat widget supports text, pinned messages, and image attachments for text-based collaboration.
              </div>
            </div>
          </div>

          {/* Setup guide for admins */}
          <details style={{ marginTop: 12 }}>
            <summary style={{ fontSize: 11, fontWeight: 600, color: '#64748b', cursor: 'pointer', userSelect: 'none' }}>
              Setup Guide for Administrators
            </summary>
            <div style={{
              marginTop: 6, padding: '10px', borderRadius: 6, fontSize: 10, color: dkText, lineHeight: 1.6,
              background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${dkBorder}`,
            }}>
              <strong>1.</strong> Deploy a LiveKit server (Docker recommended):<br />
              <code style={{ fontSize: 9, color: '#a5b4fc', wordBreak: 'break-all' }}>docker run -d --name livekit -p 7880:7880 -p 7881:7881 -p 7882:7882/udp livekit/livekit-server</code><br /><br />
              <strong>2.</strong> Set environment variables:<br />
              <code style={{ fontSize: 9, color: '#a5b4fc' }}>NEXT_PUBLIC_LIVEKIT_URL=wss://your-server:7880</code><br />
              <code style={{ fontSize: 9, color: '#a5b4fc' }}>LIVEKIT_API_KEY=your-key</code><br />
              <code style={{ fontSize: 9, color: '#a5b4fc' }}>LIVEKIT_API_SECRET=your-secret</code><br /><br />
              <strong>3.</strong> Redeploy the application.
            </div>
          </details>
        </div>
      </div>
    )
  }

  // Joined — render LiveKit room
  if (isJoined && token) {
    return (
      <div className={`widget-content widget-video ${isDark ? '' : 'widget-video-light'}`}>
        <LiveKitRoom
          token={token}
          serverUrl={LIVEKIT_URL}
          connect={true}
          audio={true}
          video={true}
          style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          <VideoRoomContent roomId={roomId} />
          <RoomAudioRenderer />
          <VideoControls />
        </LiveKitRoom>
      </div>
    )
  }

  // Pre-join state
  return (
    <div className={`video-placeholder ${isDark ? '' : 'video-placeholder-light'}`}>
      <div className={`video-placeholder-icon ${isDark ? '' : 'video-placeholder-icon-light'}`}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M15.6 11.6L22 7v10l-6.4-4.5v-1zM4 5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
        </svg>
      </div>
      <div className={`video-placeholder-title ${isDark ? '' : 'video-placeholder-title-light'}`}>Video Call</div>
      <div className={`video-placeholder-desc ${isDark ? '' : 'video-placeholder-desc-light'}`}>
        Join with camera and microphone
      </div>
      <button
        className={`video-join-btn ${isDark ? '' : 'video-join-btn-light'}`}
        onClick={joinCall}
        disabled={loading}
        style={{
          margin: '8px 0',
          padding: '10px 24px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          background: loading ? 'rgba(56,189,248,0.1)' : 'rgba(56,189,248,0.2)',
          border: '1px solid rgba(56,189,248,0.3)',
          color: '#38bdf8',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Connecting...' : 'Join Call'}
      </button>
      {error && (
        <div style={{ fontSize: 11, color: '#f87171', marginTop: 8 }}>{error}</div>
      )}
    </div>
  )
}
