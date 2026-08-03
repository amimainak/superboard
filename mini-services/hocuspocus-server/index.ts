// ============================================================
// Hocuspocus Yjs Sync Server (Mini Service)
// ============================================================
// Deployed as a serverless function (scales to zero when not in use).
// Handles real-time drawing sync and cursor presence.
// ============================================================

import { Server } from '@hocuspocus/server';
import { v4 as uuidv4 } from 'uuid';

const PORT = parseInt(process.env.HOCUSPOCUS_PORT || '3001', 10);

const server = Server.configure({
  port: PORT,

  // Authentication hook — verify room access
  async onAuthenticate({ documentName, context }) {
    // documentName = room-${roomId}
    // context should contain userId and role (tutor/student)

    const roomId = documentName.replace('room-', '');

    // TODO: Verify room exists and is active
    // const room = await db.room.findUnique({ where: { id: roomId } });
    // if (!room || !room.isActive) {
    //   throw new Error('Room not found or inactive');
    // }

    // TODO: Verify user has access (tutor always, student via link)

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
      `[Hocuspocus] Client connected to ${documentName} (userId: ${context?.userId})`
    );
  },

  // Called when a client disconnects
  async onDisconnect({ documentName, context }) {
    console.log(
      `[Hocuspocus] Client disconnected from ${documentName} (userId: ${context?.userId})`
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
    // This enables save/load and page management
    // const update = Y.encodeStateAsUpdate(document);
    // await db.boardPage.upsert({
    //   where: { roomId_pageIndex: { roomId, pageIndex: currentPage } },
    //   data: { snapshot: Buffer.from(update).toString('base64') },
    // });
  },

  // Storage hook — load document state from database
  async onLoadDocument({ documentName, document }) {
    const roomId = documentName.replace('room-', '');

    // TODO: Load initial document state from database
    // const pages = await db.boardPage.findMany({
    //   where: { roomId },
    //   orderBy: { pageIndex: 'asc' },
    // });
    //
    // if (pages.length > 0 && pages[0].snapshot) {
    //   const update = Buffer.from(pages[0].snapshot, 'base64');
    //   Y.applyUpdate(document, new Uint8Array(update));
    // }

    console.log(`[Hocuspocus] Loaded document for room: ${roomId}`);
  },

  // Store hook — save document state to database
  async onStoreDocument({ documentName, document }) {
    const roomId = documentName.replace('room-', '');

    // TODO: Save document state to database for persistence
    // const update = Y.encodeStateAsUpdate(document);
    // await db.boardPage.upsert({
    //   where: { roomId_pageIndex: { roomId, pageIndex: 0 } },
    //   create: { roomId, pageIndex: 0, snapshot: Buffer.from(update).toString('base64') },
    //   update: { snapshot: Buffer.from(update).toString('base64') },
    // });

    console.log(`[Hocuspocus] Stored document for room: ${roomId}`);
  },
});

server.listen().then(() => {
  console.log(`[Hocuspocus] Yjs sync server running on port ${PORT}`);
});
