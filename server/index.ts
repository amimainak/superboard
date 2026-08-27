// ============================================================
// Hocuspocus Yjs Sync Server (Mini Service)
// ============================================================
// Deployed as a serverless function (scales to zero when not in use).
// Handles real-time drawing sync and cursor presence.
// ============================================================

import { Server } from '@hocuspocus/server';
import * as Y from 'yjs';
import { v4 as uuidv4 } from 'uuid';

const PORT = parseInt(process.env.HOCUSPOCUS_PORT || '3001', 10);

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// --- Supabase REST helpers ------------------------------------------------

const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

/** Fetch a single room row from Supabase. Returns null on 404 or error. */
async function fetchRoom(roomId: string) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/Room?id=eq.${roomId}&select=id,isActive`;
    const res = await fetch(url, { headers: supabaseHeaders });
    if (!res.ok) return null;
    const rows: { id: string; isActive: boolean }[] = await res.json();
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error('[Hocuspocus] fetchRoom error:', err);
    return null;
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
      headers: {
        ...supabaseHeaders,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        roomId,
        pageIndex,
        snapshot: snapshotBase64,
      }),
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

  // Authentication hook — verify room access
  async onAuthenticate({ documentName, context }) {
    // documentName = room-${roomId}
    // context should contain userId and role (tutor/student)

    const roomId = documentName.replace('room-', '');

    // Verify room exists and is active via Supabase REST API
    const room = await fetchRoom(roomId);
    if (!room || !room.isActive) {
      throw new Error('Room not found or inactive');
    }

    console.log(`[Hocuspocus] Authenticated connection to room: ${roomId}`);

    return {
      userId: context?.userId || uuidv4(),
      role: context?.role || 'student',
      roomId,
    };
  },

  // Called when a client connects
  async onConnect({ documentName, context, connection }) {
    console.log(
      `[Hocuspocus] Client connected to ${documentName} (userId: ${context?.userId})`,
    );
  },

  // Called when a client disconnects
  async onDisconnect({ documentName, context }) {
    console.log(
      `[Hocuspocus] Client disconnected from ${documentName} (userId: ${context?.userId})`,
    );

    // TODO: Check if tutor disconnected → handle reconnection logic
    // TODO: Broadcast updated participant list via awareness
  },

  // Awareness change — cursor presence updates
  async onAwarenessUpdate({ awareness, documentName }) {
    const states = awareness.getStates();
    const participantCount = states.size;

    if (participantCount > 0) {
      // Broadcast presence to all connected clients
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

  // Storage hook — load document state from database
  async onLoadDocument({ documentName, document }) {
    const roomId = documentName.replace('room-', '');

    // Load initial document state from Supabase
    const snapshot = await fetchSnapshot(roomId, 0);
    if (snapshot) {
      try {
        // snapshot is a JSON-serialized base64 string of the Yjs update
        const raw = Buffer.from(snapshot, 'base64');
        Y.applyUpdate(document, new Uint8Array(raw));
        console.log(
          `[Hocuspocus] Restored document for room: ${roomId} (${raw.length} bytes)`,
        );
      } catch (err) {
        console.error(
          `[Hocuspocus] Failed to apply snapshot for room ${roomId}:`,
          err,
        );
      }
    } else {
      console.log(`[Hocuspocus] No snapshot found, starting fresh: ${roomId}`);
    }
  },

  // Called when the document changes (drawing operations)
  async onChange({ document, documentName }) {
    const roomId = documentName.replace('room-', '');
    debounceSave(roomId, document);
  },

  // Store hook — save document state to database (server shutdown)
  async onStoreDocument({ documentName, document }) {
    const roomId = documentName.replace('room-', '');

    // Flush any pending debounced save
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
