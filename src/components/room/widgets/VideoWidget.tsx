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
    return (
      <div className={`video-placeholder ${isDark ? '' : 'video-placeholder-light'}`}>
        <div className={`video-placeholder-icon ${isDark ? '' : 'video-placeholder-icon-light'}`}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15.6 11.6L22 7v10l-6.4-4.5v-1zM4 5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
          </svg>
        </div>
        <div className={`video-placeholder-title ${isDark ? '' : 'video-placeholder-title-light'}`}>Video Call</div>
        <div className={`video-placeholder-desc ${isDark ? '' : 'video-placeholder-desc-light'}`}>
          Live video, audio &amp; screen sharing via LiveKit
        </div>
        <div className={`video-placeholder-status ${isDark ? '' : 'video-placeholder-status-light'}`}>
          Requires VPS setup (LiveKit Server)
        </div>
        <button className="video-placeholder-btn" disabled>
          Coming Soon
        </button>
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
