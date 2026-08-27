// ============================================================
// Hocuspocus Yjs Sync Server (Mini Service)
// ============================================================
// SECURITY FIX (AUDIT-HIGH-2): The onAuthenticate hook now verifies
// that the connecting user is either the room tutor or a registered
// participant. Previously it trusted client-provided context
// without verification, and fell back to a random UUID.
//
// Authentication requires:
//   - context.token: A valid Supabase JWT (Bearer token from session)
//   - The JWT user must be the tutor or a participant in the room
// ============================================================

import { Server } from '@hocuspocus/server';
import * as Y from 'yjs';
import { createClient } from '@supabase/supabase-js';

const PORT = parseInt(process.env.HOCUSPOCUS_PORT || '3001', 10);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Hocuspocus] SUPABASE_URL and SUPABASE_ANON_KEY must be configured');
  process.exit(1);
}

// Supabase admin client for auth verification
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Supabase REST client for data queries (anon key + RLS)
const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

/** Verify a Supabase JWT and return the user ID */
async function verifyToken(token: string): Promise<string | null> {
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

/** Fetch a single room row from Supabase. */
async function fetchRoom(roomId: string) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/Room?id=eq.${roomId}&select=id,isActive,tutorId`;
    const res = await fetch(url, { headers: supabaseHeaders });
    if (!res.ok) return null;
    const rows: Array<{ id: string; isActive: boolean; tutorId: string }> = await res.json();
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error('[Hocuspocus] fetchRoom error:', err);
    return null;
  }
}

/** Check if a user is a participant in a room. */
async function checkParticipant(roomId: string, userId: string): Promise<boolean> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/RoomParticipant?roomId=eq.${roomId}&studentIdentity=eq.${userId}&select=id`;
    const res = await fetch(url, { headers: supabaseHeaders });
    if (!res.ok) return false;
    const rows: Array<{ id: string }> = await res.json();
    return rows.length > 0;
  } catch {
    return false;
  }
}

/** Fetch the snapshot for a given room / page index. */
async function fetchSnapshot(roomId: string, pageIndex = 0) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/BoardPage?roomId=eq.${roomId}&pageIndex=eq.${pageIndex}&select=snapshot`;
    const res = await fetch(url, { headers: supabaseHeaders });
    if (!res.ok) return null;
    const rows: { snapshot: string | null }[] = await res.json();
    return rows.length > 0 ? rows[0].snapshot : null;
  } catch (err) {
    console.error('[Hocuspocus] fetchSnapshot error:', err);
    return null;
  }
}

/** Upsert a snapshot for a given room / page index. */
async function upsertSnapshot(
  roomId: string,
  snapshotBase64: string,
  pageIndex = 0,
) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/BoardPage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...supabaseHeaders, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ roomId, pageIndex, snapshot: snapshotBase64 }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[Hocuspocus] upsertSnapshot ${res.status}:`, text);
    }
  } catch (err) {
    console.error('[Hocuspocus] upsertSnapshot error:', err);
  }
}

// --- Debounce map for onChange --------------------------------------------

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const DEBOUNCE_MS = 300;

function debounceSave(roomId: string, document: Y.Doc) {
  const existing = debounceTimers.get(roomId);
  if (existing) clearTimeout(existing);

  debounceTimers.set(
    roomId,
    setTimeout(() => {
      debounceTimers.delete(roomId);
      const update = Y.encodeStateAsUpdate(document);
      const base64 = Buffer.from(update).toString('base64');
      upsertSnapshot(roomId, base64, 0);
    }, DEBOUNCE_MS),
  );
}

// --- Server ----------------------------------------------------------------

const server = Server.configure({
  port: PORT,

  // SECURITY: Verify JWT + room membership before allowing connection
  async onAuthenticate({ documentName, context }) {
    const roomId = documentName.replace('room-', '');

    // 1. Verify JWT token (required — no more anonymous fallback)
    const token = context?.token;
    if (!token || typeof token !== 'string') {
      throw new Error('Authentication required: no token provided');
    }

    const userId = await verifyToken(token);
    if (!userId) {
      throw new Error('Authentication failed: invalid or expired token');
    }

    // 2. Verify room exists and is active
    const room = await fetchRoom(roomId);
    if (!room || !room.isActive) {
      throw new Error('Room not found or inactive');
    }

    // 3. Verify user has access to this room
    const isTutor = room.tutorId === userId;
    const isParticipant = await checkParticipant(roomId, userId);

    if (!isTutor && !isParticipant) {
      console.warn(`[Hocuspocus] REJECTED: User ${userId} has no access to room ${roomId}`);
      throw new Error('Access denied: you are not a participant in this room');
    }

    console.log(`[Hocuspocus] Authenticated ${isTutor ? 'tutor' : 'student'} ${userId} to room ${roomId}`);

    return {
      userId,
      role: isTutor ? 'tutor' : 'student',
      roomId,
    };
  },

  async onConnect({ documentName, context }) {
    console.log(`[Hocuspocus] Client connected to ${documentName} (userId: ${context?.userId})`);
  },

  async onDisconnect({ documentName, context }) {
    console.log(`[Hocuspocus] Client disconnected from ${documentName} (userId: ${context?.userId})`);
  },

  async onAwarenessUpdate({ awareness, documentName }) {
    const states = awareness.getStates();
    if (states.size > 0) {
      const participantCount = states.size;
      const participantList = Array.from(states.entries()).map(
        ([clientId, state]) => ({
          clientId,
          name: state?.user?.name || 'Anonymous',
          color: state?.user?.color || '#3b82f6',
          role: state?.user?.role || 'student',
        }),
      );
      console.log(
        `[Hocuspocus] ${documentName}: ${participantCount} participants`,
        participantList.map((p) => p.name),
      );
    }
  },

  async onLoadDocument({ documentName, document }) {
    const roomId = documentName.replace('room-', '');
    const snapshot = await fetchSnapshot(roomId, 0);
    if (snapshot) {
      try {
        const raw = Buffer.from(snapshot, 'base64');
        Y.applyUpdate(document, new Uint8Array(raw));
        console.log(`[Hocuspocus] Restored document for room: ${roomId} (${raw.length} bytes)`);
      } catch (err) {
        console.error(`[Hocuspocus] Failed to apply snapshot for room ${roomId}:`, err);
      }
    } else {
      console.log(`[Hocuspocus] No snapshot found, starting fresh: ${roomId}`);
    }
  },

  async onChange({ document, documentName }) {
    const roomId = documentName.replace('room-', '');
    debounceSave(roomId, document);
  },

  async onStoreDocument({ documentName, document }) {
    const roomId = documentName.replace('room-', '');
    const pending = debounceTimers.get(roomId);
    if (pending) {
      clearTimeout(pending);
      debounceTimers.delete(roomId);
    }
    const update = Y.encodeStateAsUpdate(document);
    const base64 = Buffer.from(update).toString('base64');
    await upsertSnapshot(roomId, base64, 0);
    console.log(`[Hocuspocus] Stored document for room: ${roomId}`);
  },
});

server.listen().then(() => {
  console.log(`[Hocuspocus] Yjs sync server running on port ${PORT}`);
});
