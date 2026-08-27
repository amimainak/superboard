// ============================================================
// LiveKit Client Configuration (Self-Hosted)
// ============================================================
// Connects to a SELF-HOSTED LiveKit server.
// Secrets are accessed via env vars ONLY — never exported.
// ============================================================

import { Room as LiveKitRoom, RoomEvent, Track, RemoteParticipant, RemoteTrackPublication } from 'livekit-client';

// NOTE: LIVEKIT_URL is needed client-side for LiveKit Room.connect() — this is expected.
const LIVEKIT_URL = process.env.LIVEKIT_URL || '';

/**
 * Create a LiveKit Room instance for the client.
 * The token must be obtained from /api/livekit/token (server-side).
 */
export function createLiveKitRoom(token: string): LiveKitRoom {
  return new LiveKitRoom({
    token: token as any,
    adaptiveStream: true,
    dynacast: true,
  } as any);
}

/**
 * Connect to a LiveKit room.
 * @param token - JWT token obtained from /api/livekit/token
 */
export async function connectToRoom(
  token: string,
  options?: {
    audioEnabled?: boolean;
    videoEnabled?: boolean;
    onConnected?: () => void;
    onDisconnected?: () => void;
    onTrackSubscribed?: (track: Track, publication: RemoteTrackPublication, participant: RemoteParticipant) => void;
  }
): Promise<LiveKitRoom> {
  const room = createLiveKitRoom(token);

  if (options?.onConnected) {
    room.on(RoomEvent.Connected, options.onConnected);
  }
  if (options?.onDisconnected) {
    room.on(RoomEvent.Disconnected, options.onDisconnected);
  }
  if (options?.onTrackSubscribed) {
    // LiveKit v2: TrackSubscribed fires with (track, publication, participant)
    room.on(RoomEvent.TrackSubscribed, options.onTrackSubscribed as any);
  }

  await room.connect(LIVEKIT_URL, token, {
    autoSubscribe: true,
  });

  // Publish local audio/video based on options
  if (options?.audioEnabled !== false) {
    await room.localParticipant.setMicrophoneEnabled(true);
  }
  if (options?.videoEnabled !== false) {
    await room.localParticipant.setCameraEnabled(true);
  }

  return room;
}

export { LIVEKIT_URL };
export type { LiveKitRoom };

// Re-export LiveKit components for convenience
export { RoomEvent, Track, RemoteParticipant, RemoteTrackPublication };
