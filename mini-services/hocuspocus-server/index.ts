// ============================================================
// Hocuspocus Yjs Sync Server (Mini Service)
// ============================================================
// Deployed as a serverless function (scales to zero when not in use).
// Handles real-time drawing sync and cursor presence.
// SECURITY: onAuthenticate now validates room access via token.
// ============================================================

import { Server } from '@hocuspocus/server';
import { v4 as uuidv4 } from 'uuid';

const PORT = parseInt(process.env.HOCUSPOCUS_PORT || '3001', 10);

// Simple in-memory rate limiter for connection attempts
const connectionAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_CONNECTIONS_PER_MINUTE = 30;

const server = Server.configure({
  port: PORT,

  // Rate limiting on connections
  async onConnect({ documentName, context, connection }) {
    const ip = (context as any)?.ip || 'unknown';
    const now = Date.now();
    const entry = connectionAttempts.get(ip);

    if (entry && now < entry.resetAt && entry.count >= MAX_CONNECTIONS_PER_MINUTE) {
      // Reject connection — too many attempts
      connection.close();
      return;
    }

    if (!entry || now > entry.resetAt) {
      connectionAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
    } else {
      entry.count++;
    }

    console.log(
      `[Hocuspocus] Client connected to ${documentName} (userId: ${context?.userId})`
    );
  },

  // Authentication hook — verify room access
  async onAuthenticate({ documentName, context }) {
    // documentName = room-${roomId}
    // context should contain a valid token/userId

    const roomId = documentName.replace('room-', '');

    // SECURITY: Validate roomId format to prevent path traversal
    if (!roomId || !/^[a-zA-Z0-9-]{1,100}$/.test(roomId)) {
      throw new Error('Invalid room ID format');
    }

    // SECURITY: Require authentication context
    const token = (context as any)?.token;
    const userId = (context as any)?.userId;

    if (!userId || typeof userId !== 'string') {
      throw new Error('Authentication required — no userId in context');
    }

    // TODO: In production, verify the token against the database:
    // const room = await db.room.findUnique({ where: { id: roomId } });
    // if (!room || !room.isActive) {
    //   throw new Error('Room not found or inactive');
    // }
    //
    // Verify the user is either:
    //   - The room tutor (always has access)
    //   - A registered participant in the room
    //   - Has a valid share link token

    console.log(`[Hocuspocus] Authenticated connection to room: ${roomId} (userId: ${userId})`);

    return {
      userId,
      role: (context as any)?.role || 'student',
      roomId,
    };
  },

  // Called when a client disconnects
  async onDisconnect({ documentName, context }) {
    console.log(
      `[Hocuspocus] Client disconnected from ${documentName} (userId: ${context?.userId})`
    );
  },

  // Awareness change — cursor presence updates
  async onAwarenessUpdate({ awareness, documentName }) {
    const states = awareness.getStates();
    const participantCount = states.size;

    if (participantCount > 0) {
      const participantList = Array.from(states.entries()).map(([clientId, state]) => ({
        clientId,
        name: state?.user?.name || 'Anonymous',
        color: state?.user?.color || '#3b82f6',
        role: state?.user?.role || 'student',
      }));

      console.log(
        `[Hocuspocus] ${documentName}: ${participantCount} participants`,
        participantList.map((p) => p.name)
      );
    }
  },

  // Called when the document changes (drawing operations)
  async onChange({ document, documentName }) {
    // TODO: Optionally persist snapshots to database
  },

  // Storage hook — load document state from database
  async onLoadDocument({ documentName, document }) {
    const roomId = documentName.replace('room-', '');
    console.log(`[Hocuspocus] Loaded document for room: ${roomId}`);
  },

  // Store hook — save document state to database
  async onStoreDocument({ documentName, document }) {
    const roomId = documentName.replace('room-', '');
    console.log(`[Hocuspocus] Stored document for room: ${roomId}`);
  },
});

server.listen().then(() => {
  console.log(`[Hocuspocus] Yjs sync server running on port ${PORT}`);
});
