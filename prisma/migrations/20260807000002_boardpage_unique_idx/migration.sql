-- ============================================================
-- Migration: Add unique constraint on BoardPage(roomId, pageIndex)
-- ============================================================
-- Required for CRDT persistence upsert operations.
-- Each room can only have one page per index.
-- ============================================================

CREATE UNIQUE INDEX "BoardPage_roomId_pageIndex_key" ON "BoardPage" ("roomId", "pageIndex");
