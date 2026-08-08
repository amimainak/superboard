// ============================================================
// Hocuspocus Persistence — Database Document Store
// ============================================================
// Provides onLoadDocument and onStoreDocument hooks for
// Hocuspocus to persist Yjs document state to PostgreSQL via
// Prisma. Each room page stores its own Yjs update.
//
// Usage: Import and pass these functions to Server.configure()
// ============================================================

import { encodeStateAsUpdate, applyUpdate } from 'yjs';
import { PrismaClient } from '@prisma/client';

// ============================================================
// Supabase PostgreSQL Connection via Prisma
// ============================================================
// Uses DATABASE_URL pointing to Supabase (with pgbouncer for
// connection pooling). Reuses the same connection pattern as
// the main app's src/lib/db.ts.
// ============================================================

// Prisma client singleton (cached across requests)
let _prisma: PrismaClient | null = null;
function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || '';
  if (!baseUrl) return baseUrl;
  // Append pgbouncer=true for Supabase connection pooling
  if (baseUrl.includes('pgbouncer=')) return baseUrl;
  const separator = baseUrl.includes('?') ? '&' : '?';
  return baseUrl + separator + 'pgbouncer=true';
}
function getPrisma(): PrismaClient {
  if (!_prisma) {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      console.error('[Persistence] DATABASE_URL not set — document persistence disabled');
      throw new Error('DATABASE_URL not set');
    }
    _prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
      log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    });
  }
  return _prisma;
}

const MAX_SNAPSHOT_SIZE = 5_000_000; // 5MB — matches DB CHECK constraint

/**
 * Load document state from the database.
 * Called by Hocuspocus when a client connects to a document.
 * If no saved state exists, returns a fresh (empty) document.
 */
export async function onLoadDocument({
  documentName,
  document,
}: {
  documentName: string;
  document: import('yjs').Doc;
}) {
  const roomId = documentName.replace('room-', '');
  if (!roomId || roomId === documentName) return;

  try {
    const prisma = getPrisma();

    // Load all pages for this room
    const pages = await prisma.boardPage.findMany({
      where: { roomId },
      orderBy: { pageIndex: 'asc' },
      select: { pageIndex: true, snapshot: true },
    });

    if (pages.length === 0) {
      console.log(`[Persistence] No saved pages for room ${roomId} — starting fresh`);
      return;
    }

    // Apply each page's saved Yjs state to the document
    // Pages are stored as separate Y.Doc snapshots keyed by pageIndex
    const yPagesMap = document.getMap<string>('pages');

    for (const page of pages) {
      if (!page.snapshot || page.snapshot === '{}') continue;

      try {
        const binaryUpdate = Uint8Array.from(
          atob(page.snapshot),
          (c) => c.charCodeAt(0)
        );

        if (binaryUpdate.length > MAX_SNAPSHOT_SIZE) {
          console.warn(
            `[Persistence] Skipping oversized page ${page.pageIndex} in room ${roomId} (${binaryUpdate.length} bytes)`
          );
          continue;
        }

        // Store the update as a base64 string in the Yjs document map
        yPagesMap.set(`page-${page.pageIndex}`, page.snapshot);
      } catch (err) {
        console.error(
          `[Persistence] Failed to decode page ${page.pageIndex} for room ${roomId}:`,
          err
        );
      }
    }

    console.log(`[Persistence] Loaded ${pages.length} pages for room ${roomId}`);
  } catch (err) {
    console.error(`[Persistence] Failed to load document for room ${roomId}:`, err);
  }
}

/**
 * Store document state to the database.
 * Called by Hocuspocus when the document changes and periodically.
 * Persists each page's Yjs state as a base64-encoded update.
 */
export async function onStoreDocument({
  documentName,
  document,
}: {
  documentName: string;
  document: import('yjs').Doc;
}) {
  const roomId = documentName.replace('room-', '');
  if (!roomId || roomId === documentName) return;

  try {
    const prisma = getPrisma();
    const yPagesMap = document.getMap<string>('pages');

    // Get all page keys
    const pageKeys: string[] = [];
    yPagesMap.forEach((_, key) => {
      if (key.startsWith('page-')) pageKeys.push(key);
    });

    if (pageKeys.length === 0) {
      console.log(`[Persistence] No pages to store for room ${roomId}`);
      return;
    }

    // Upsert each page
    for (const key of pageKeys) {
      const snapshotBase64 = yPagesMap.get(key) as string;
      if (!snapshotBase64) continue;

      const pageIndex = parseInt(key.replace('page-', ''), 10);
      if (isNaN(pageIndex)) continue;

      // Check size before storing
      const byteLength = atob(snapshotBase64).length;
      if (byteLength > MAX_SNAPSHOT_SIZE) {
        console.warn(
          `[Persistence] Skipping oversized page ${pageIndex} during store (${byteLength} bytes)`
        );
        continue;
      }

      await prisma.boardPage.upsert({
        where: {
          roomId_pageIndex: { roomId, pageIndex },
        },
        create: {
          roomId,
          pageIndex,
          snapshot: snapshotBase64,
        },
        update: {
          snapshot: snapshotBase64,
        },
      });
    }

    console.log(`[Persistence] Stored ${pageKeys.length} pages for room ${roomId}`);
  } catch (err) {
    console.error(`[Persistence] Failed to store document for room ${roomId}:`, err);
  }
}

/**
 * Cleanup function to close the Prisma connection.
 */
export async function closePersistence() {
  if (_prisma) {
    await _prisma.$disconnect();
    _prisma = null;
  }
}
