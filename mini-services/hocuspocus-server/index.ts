// ============================================================
// Hocuspocus Yjs Sync Server (Mini Service)
// ============================================================
// Handles real-time drawing sync and cursor presence.
// Connects to Supabase PostgreSQL for document persistence
// and Supabase Auth for JWT verification.
//
// Required environment variables:
//   - DATABASE_URL              (Supabase PostgreSQL connection string)
//   - NEXT_PUBLIC_SUPABASE_URL   (Supabase project URL)
//   - SUPABASE_SERVICE_ROLE_KEY (Supabase service role key)
//   - HOCUSPOCUS_PORT            (optional, default: 3001)
// ============================================================

import { Server } from '@hocuspocus/server';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { onLoadDocument, onStoreDocument } from './persistence';
import http from 'http';

const PORT = parseInt(process.env.HOCUSPOCUS_PORT || '3001', 10);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// SECURITY FIX (RT-C02): Prisma client for room membership verification
const db = new PrismaClient();

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error('[Hocuspocus] FATAL: DATABASE_URL is not set. Document persistence requires a Supabase PostgreSQL connection.');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[Hocuspocus] FATAL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for JWT authentication.');
  process.exit(1);
}

// Create Supabase admin client for JWT verification
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Simple in-memory rate limiter for connection attempts
const connectionAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_CONNECTIONS_PER_MINUTE = 30;

// SECURITY FIX (RT-H01): Per-connection message rate limiting
const messageCounts = new Map<string, { count: number; resetAt: number }>();
const MAX_MESSAGES_PER_SECOND = 100;
const MAX_DOCUMENT_SIZE = 10_000_000; // 10MB

const server = Server.configure({
  port: PORT,
  maxDocumentSize: MAX_DOCUMENT_SIZE,

  // SECURITY FIX (RT-H01): Per-connection message rate limiting
  async onBeforeHandleMessage({ context, connectionId }) {
    const now = Date.now();
    const entry = messageCounts.get(connectionId);
    if (entry && now - entry.resetAt < 1000 && entry.count >= MAX_MESSAGES_PER_SECOND) {
      console.warn(`[Hocuspocus] Rate limited connection ${connectionId}: ${entry.count} msgs/sec`);
      return false; // Reject: rate exceeded
    }
    if (!entry || now - entry.resetAt >= 1000) {
      messageCounts.set(connectionId, { count: 1, resetAt: now });
    } else {
      entry.count++;
    }
    return true;
  },

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

  // Authentication hook — verify JWT token and room access
  async onAuthenticate({ documentName, context }) {
    // documentName = room-${roomId}
    // context should contain a valid JWT token and userId

    const roomId = documentName.replace('room-', '');

    // SECURITY: Validate roomId format to prevent path traversal
    if (!roomId || !/^[a-zA-Z0-9-]{1,100}$/.test(roomId)) {
      throw new Error('Invalid room ID format');
    }

    // SECURITY: Require JWT token for authentication
    const token = (context as any)?.token;
    const userId = (context as any)?.userId;

    if (!token || !userId || typeof userId !== 'string') {
      throw new Error('Authentication required — valid token and userId needed');
    }

    // SECURITY: Verify JWT token against Supabase Auth
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user || user.id !== userId) {
        throw new Error('Invalid or expired authentication token');
      }
    } catch (err) {
      throw new Error('Token verification failed');
    }

    // SECURITY FIX (RT-C02): Verify room access — check that the room exists,
    // is active, and the user is either the tutor or a registered participant.
    try {
      const room = await db.room.findUnique({
        where: { id: roomId },
        select: { id: true, isActive: true, tutorId: true },
      });
      if (!room || !room.isActive) {
        throw new Error('Room not found or inactive');
      }

      // Verify the user is either:
      //   - The room tutor (always has access)
      //   - A registered participant in the room
      if (room.tutorId !== userId) {
        const participant = await db.roomParticipant.findUnique({
          where: { roomId_studentIdentity: { roomId, studentIdentity: userId } },
        });
        if (!participant) {
          // Also check if user is agency owner of the tutor
          const tutor = await db.user.findUnique({
            where: { id: room.tutorId },
            select: { parentAgencyId: true },
          });
          if (!tutor || tutor.parentAgencyId !== userId) {
            throw new Error('Access denied — you are not a participant in this room');
          }
        }
      }
    } catch (accessErr) {
      throw new Error(`Room access check failed: ${accessErr instanceof Error ? accessErr.message : 'Unknown error'}`);
    }

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
  async onLoadDocument(args) {
    const roomId = args.documentName.replace('room-', '');
    console.log(`[Hocuspocus] Loading document for room: ${roomId}`);
    await onLoadDocument(args);
  },

  // Store hook — save document state to database
  async onStoreDocument(args) {
    const roomId = args.documentName.replace('room-', '');
    console.log(`[Hocuspocus] Storing document for room: ${roomId}`);
    await onStoreDocument(args);
  },
});

server.listen().then(() => {
  console.log(`[Hocuspocus] Yjs sync server running on port ${PORT}`);

  // ============================================================
  // HTTP Health Check Server (separate from WebSocket)
  // ============================================================
  // Provides /health endpoint for Docker HEALTHCHECK and load balancers
  const healthServer = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'hocuspocus', timestamp: new Date().toISOString() }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
  healthServer.listen(PORT + 1, () => {
    console.log(`[Hocuspocus] Health check server running on port ${PORT + 1}`);
  });

  // ============================================================
  // Background Task: Invite Auto-Expire Cleanup
  // ============================================================
  // Runs every 15 minutes to proactively mark expired PENDING invites.
  // Complements the lazy cleanup in GET /api/agency/invite.
  // ============================================================
  const INVITE_CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

  async function expireStaleInvites() {
    try {
      // Use Supabase client to batch-update expired PENDING invites
      const { error } = await supabaseAdmin
        .from('AgencyInvite')
        .update({ status: 'EXPIRED', updatedAt: new Date().toISOString() })
        .eq('status', 'PENDING')
        .lt('expiresAt', new Date().toISOString());

      if (error) {
        console.error('[InviteCleanup] Error expiring invites:', error.message);
      } else {
        console.log(`[InviteCleanup] Completed at ${new Date().toISOString()}`);
      }
    } catch (err) {
      console.error('[InviteCleanup] Unexpected error:', err);
    }
  }

  // Run first cleanup after 30 seconds, then every 15 minutes
  setTimeout(() => {
    expireStaleInvites();
    setInterval(expireStaleInvites, INVITE_CLEANUP_INTERVAL_MS);
  }, 30_000);
});
