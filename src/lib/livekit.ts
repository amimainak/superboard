// ============================================================
// LiveKit Client Configuration (Self-Hosted)
// ============================================================
// Connects to a SELF-HOSTED LiveKit server.
// Do NOT use LiveKit Cloud.
// ============================================================

import { LiveKitClient, Room as LiveKitRoom, RoomEvent, Track } from 'livekit-client';

const LIVEKIT_URL = process.env.LIVEKIT_URL || '';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';

/**
 * Create a LiveKit Room instance for the client.
 * The token must be obtained from /api/livekit/token (server-side).
 */
export function createLiveKitRoom(token: string): LiveKitRoom {
  return new LiveKitRoom({
    token,
    adaptiveStream: true,
    dynacast: true,
  });
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
    onTrackSubscribed?: (track: Track, participant: LiveKitClient.RemoteParticipant) => void;
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
    room.on(RoomEvent.TrackSubscribed, options.onTrackSubscribed);
  }

  await room.connect(LIVEKIT_URL, token, {
    autoSubscribe: true,
  });

  // Publish local audio/video based on options
  if (options?.audioEnabled !== false) {
    await room.localParticipant.enableMicrophone();
  }
  if (options?.videoEnabled !== false) {
    await room.localParticipant.enableCamera();
  }

  return room;
}

export { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET };
export type { LiveKitRoom };

// Re-export LiveKit components for convenience
export { LiveKitClient, RoomEvent, Track };
