// ============================================================
// useLiveKitRoom Hook — LiveKit Room Lifecycle Management
// ============================================================
// Manages connection to a self-hosted LiveKit server.
// Handles token fetch, connect/disconnect, track subscriptions,
// and video minute heartbeat reporting.
//
// SECURITY: Token is obtained server-side via /api/livekit/token.
// Video minutes are tracked via heartbeat to /api/room/[roomId]/video-heartbeat.
// ============================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { authFetch } from '@/lib/auth-fetch';
import { Room as LiveKitRoom, RoomEvent, Track, RemoteParticipant, RemoteTrackPublication, ConnectionState } from 'livekit-client';

export interface LiveKitRoomState {
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
  participants: ParticipantInfo[];
  localParticipant: LocalParticipantInfo | null;
  error: string | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isDeafened: boolean;
}

export interface ParticipantInfo {
  identity: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  cameraTrack?: RemoteTrackPublication;
  micTrack?: RemoteTrackPublication;
}

export interface LocalParticipantInfo {
  identity: string;
  name: string;
  isMuted: boolean;
  isCameraOn: boolean;
}

/**
 * Get connection state from the LiveKit room
 */
function mapConnectionState(state: ConnectionState): LiveKitRoomState['connectionState'] {
  switch (state) {
    case ConnectionState.Connected: return 'connected';
    case ConnectionState.Connecting: return 'connecting';
    case ConnectionState.Reconnecting: return 'reconnecting';
    case ConnectionState.Disconnected: return 'disconnected';
    default: return 'disconnected';
  }
}

export function useLiveKitRoom() {
  const roomId = useAppStore((s) => s.room.roomId);
  const isTutor = useAppStore((s) => s.room.isTutor);
  const userId = useAppStore((s) => s.room.userId);
  const userName = useAppStore((s) => s.room.userName);
  const roomActive = useAppStore((s) => s.room.isActive);

  const [state, setState] = useState<LiveKitRoomState>({
    connectionState: 'disconnected',
    participants: [],
    localParticipant: null,
    error: null,
    isMuted: false,
    isCameraOff: false,
    isDeafened: false,
  });

  const roomRef = useRef<LiveKitRoom | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectedAtRef = useRef<number>(0);

  // ---- Fetch token and connect ----
  const connect = useCallback(async () => {
    if (!roomId || !userId || !userName || roomRef.current) return;

    setState((prev) => ({ ...prev, connectionState: 'connecting', error: null }));

    try {
      // Get token from server
      const res = await authFetch('/api/livekit/token', {
        method: 'POST',
        body: JSON.stringify({
          roomId,
          userId,
          userName,
          isTutor,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === 'VIDEO_LIMIT_REACHED') {
          setState((prev) => ({ ...prev, connectionState: 'disconnected', error: 'Video limit reached for this billing period.' }));
          // Open paywall
          useAppStore.getState().openPaywall('Video minutes exhausted');
          return;
        }
        throw new Error(data.error || 'Failed to get video token');
      }

      const { token, url } = await res.json();

      // Create and connect LiveKit room
      const room = new LiveKitRoom({
        adaptiveStream: true,
        dynacast: true,
      });

      // Set up event handlers BEFORE connecting
      room.on(RoomEvent.Connected, () => {
        connectedAtRef.current = Date.now();
        setState((prev) => ({
          ...prev,
          connectionState: 'connected',
          localParticipant: {
            identity: room.localParticipant.identity,
            name: room.localParticipant.name || '',
            isMuted: !room.localParticipant.isMicrophoneEnabled,
            isCameraOn: room.localParticipant.isCameraEnabled,
          },
        }));
        // Start heartbeat
        startHeartbeat();
      });

      room.on(RoomEvent.Disconnected, () => {
        stopHeartbeat();
        setState((prev) => ({ ...prev, connectionState: 'disconnected', participants: [] }));
      });

      room.on(RoomEvent.Reconnecting, () => {
        setState((prev) => ({ ...prev, connectionState: 'reconnecting' }));
      });

      room.on(RoomEvent.Reconnected, () => {
        setState((prev) => ({ ...prev, connectionState: 'connected' }));
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        setState((prev) => {
          const existing = prev.participants.find((p) => p.identity === participant.identity);
          if (existing) {
            return {
              ...prev,
              participants: prev.participants.map((p) =>
                p.identity === participant.identity
                  ? {
                      ...p,
                      isCameraOn: p.isCameraOn || track.kind === Track.Kind.Video,
                      isMuted: track.kind === Track.Kind.Audio ? false : p.isMuted,
                      cameraTrack: track.kind === Track.Kind.Video ? publication : p.cameraTrack,
                      micTrack: track.kind === Track.Kind.Audio ? publication : p.micTrack,
                    }
                  : p
              ),
            };
          }
          return prev;
        });
      });

      room.on(RoomEvent.TrackUnsubscribed, (_track, _publication, participant) => {
        setState((prev) => {
          const existing = prev.participants.find((p) => p.identity === participant.identity);
          if (existing) {
            return {
              ...prev,
              participants: prev.participants.map((p) =>
                p.identity === participant.identity
                  ? {
                      ...p,
                      isCameraOn: false,
                      cameraTrack: undefined,
                      micTrack: undefined,
                    }
                  : p
              ),
            };
          }
          return prev;
        });
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        setState((prev) => ({
          ...prev,
          participants: [
            ...prev.participants,
            {
              identity: participant.identity,
              name: participant.name || participant.identity,
              isSpeaking: false,
              isMuted: !participant.isMicrophoneEnabled,
              isCameraOn: participant.isCameraEnabled,
            },
          ],
        }));
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        setState((prev) => ({
          ...prev,
          participants: prev.participants.filter((p) => p.identity !== participant.identity),
        }));
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const speakerIdentities = new Set(speakers.map((s) => s.identity));
        setState((prev) => ({
          ...prev,
          participants: prev.participants.map((p) => ({
            ...p,
            isSpeaking: speakerIdentities.has(p.identity),
          })),
        }));
      });

      // Track local participant mute/unmute events
      room.localParticipant.on(RoomEvent.TrackMuted, () => {
        setState((prev) => ({
          ...prev,
          localParticipant: prev.localParticipant
            ? {
                ...prev.localParticipant,
                isMuted: !room.localParticipant.isMicrophoneEnabled,
                isCameraOn: room.localParticipant.isCameraEnabled,
              }
            : null,
        }));
      });

      room.localParticipant.on(RoomEvent.TrackUnmuted, () => {
        setState((prev) => ({
          ...prev,
          localParticipant: prev.localParticipant
            ? {
                ...prev.localParticipant,
                isMuted: !room.localParticipant.isMicrophoneEnabled,
                isCameraOn: room.localParticipant.isCameraEnabled,
              }
            : null,
        }));
      });

      // Connect
      await room.connect(url, token, { autoSubscribe: true });
      roomRef.current = room;

      // Enable mic/camera by default for tutors, camera off for students
      if (isTutor) {
        await room.localParticipant.setMicrophoneEnabled(true);
        await room.localParticipant.setCameraEnabled(true);
      } else {
        await room.localParticipant.setMicrophoneEnabled(true);
        // Students start with camera off
      }
    } catch (err) {
      console.error('[useLiveKitRoom] Connection failed:', err);
      setState((prev) => ({
        ...prev,
        connectionState: 'failed',
        error: err instanceof Error ? err.message : 'Connection failed',
      }));
    }
  }, [roomId, userId, userName, isTutor]);

  // ---- Disconnect ----
  const disconnect = useCallback(async () => {
    stopHeartbeat();
    if (roomRef.current) {
      try {
        await roomRef.current.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      roomRef.current = null;
    }
    setState({
      connectionState: 'disconnected',
      participants: [],
      localParticipant: null,
      error: null,
      isMuted: false,
      isCameraOff: false,
      isDeafened: false,
    });
  }, []);

  // ---- Toggle mic ----
  const toggleMic = useCallback(async () => {
    if (!roomRef.current) return;
    const enabled = roomRef.current.localParticipant.isMicrophoneEnabled;
    await roomRef.current.localParticipant.setMicrophoneEnabled(!enabled);
    setState((prev) => ({ ...prev, isMuted: enabled })); // After toggle, isMuted = was it on before
  }, []);

  // ---- Toggle camera ----
  const toggleCamera = useCallback(async () => {
    if (!roomRef.current) return;
    const enabled = roomRef.current.localParticipant.isCameraEnabled;
    await roomRef.current.localParticipant.setCameraEnabled(!enabled);
    setState((prev) => ({ ...prev, isCameraOff: enabled }));
  }, []);

  // ---- Toggle deafen ----
  const toggleDeafen = useCallback(() => {
    setState((prev) => ({ ...prev, isDeafened: !prev.isDeafened }));
  }, []);

  // ---- Heartbeat: report video minutes every 60s ----
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) return;
    heartbeatIntervalRef.current = setInterval(async () => {
      const currentRoomId = useAppStore.getState().room.roomId;
      if (!currentRoomId) return;
      try {
        const res = await authFetch(`/api/room/${currentRoomId}/video-heartbeat`, {
          method: 'POST',
          body: JSON.stringify({ seconds: 60 }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data) {
            // Sync video limit state from heartbeat to store
            useAppStore.getState().setVideoLimitState({
              videoLimited: !!data.videoLimited,
              videoApproachingLimit: !!data.approachingLimit,
            });
            // Also update usage numbers for the UsageBar / PipVideoPanel
            if (typeof data.minutesUsed === 'number' && typeof data.minutesLimit === 'number') {
              useAppStore.getState().setUsage({
                videoMinutesUsed: data.minutesUsed,
                videoMinutesLimit: data.minutesLimit,
              });
            }
          }
        }
      } catch {
        // Silent — don't interrupt the lesson
      }
    }, 60_000);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    // Report final seconds on disconnect
    if (connectedAtRef.current > 0) {
      const elapsed = Math.floor((Date.now() - connectedAtRef.current) / 1000);
      if (elapsed > 10) {
        const currentRoomId = useAppStore.getState().room.roomId;
        if (currentRoomId) {
          authFetch(`/api/room/${currentRoomId}/video-heartbeat`, {
            method: 'POST',
            body: JSON.stringify({ seconds: elapsed % 60 }),
          }).then((res) => {
            // Sync final state on disconnect
            if (res.ok) {
              res.json().then((data) => {
                if (data) {
                  useAppStore.getState().setVideoLimitState({
                    videoLimited: !!data.videoLimited,
                    videoApproachingLimit: !!data.approachingLimit,
                  });
                }
              }).catch(() => {});
            }
          }).catch(() => {});
        }
      }
    }
  }, []);

  // ---- Auto-connect when room becomes active ----
  useEffect(() => {
    if (roomActive && roomId && userId && state.connectionState === 'disconnected') {
      // Delay connect slightly to ensure room state is fully set
      const timer = setTimeout(connect, 500);
      return () => clearTimeout(timer);
    }
  }, [roomActive, roomId, userId, connect, state.connectionState]);

  // ---- Auto-disconnect when room becomes inactive ----
  useEffect(() => {
    if (!roomActive && state.connectionState !== 'disconnected') {
      disconnect();
    }
  }, [roomActive, disconnect, state.connectionState]);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      stopHeartbeat();
      if (roomRef.current) {
        roomRef.current.disconnect().catch(() => {});
        roomRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
    toggleDeafen,
    liveKitRoom: roomRef.current,
  };
}
