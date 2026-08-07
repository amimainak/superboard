// ============================================================
// TldrawCanvas — Tldraw Editor with Yjs Real-Time Sync
// ============================================================
// Wraps the Tldraw editor and synchronizes state with Yjs
// via the Hocuspocus CRDT provider for multi-user collaboration.
//
// Sync strategy: Snapshot-based (debounced writes, eager reads).
// On mount: loads snapshot from Yjs document.
// On change: debounced save to Yjs (avoids excessive writes).
// On remote Yjs change: applies to local editor.
// ============================================================

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Tldraw, Editor, TLStoreSnapshot } from 'tldraw';
import type { Map as YMap } from 'yjs';
import 'tldraw/tldraw.css';

// ---- Types ----

export interface TldrawCanvasProps {
  /** Yjs document (from useYjsProvider) */
  ydoc: import('yjs').Doc | null;
  /** Called when the editor mounts — provides the Editor ref */
  onEditorReady?: (editor: Editor) => void;
  /** Called when editor store changes (for external sync triggers) */
  onStoreChange?: () => void;
  /** Current page index (for multi-page support) */
  pageIndex: number;
  /** Whether the user is a tutor (controls UI permissions) */
  isTutor: boolean;
  /** Whether the canvas is read-only (e.g., student in focus mode) */
  readOnly?: boolean;
}

// ---- Constants ----

const SYNC_DEBOUNCE_MS = 500; // Debounce Yjs writes to avoid excessive updates
const YJS_SNAPSHOT_KEY = `page-snapshot`; // Key within Y.Map for this page's data

// ============================================================
// Component
// ============================================================

export default function TldrawCanvas({
  ydoc,
  onEditorReady,
  onStoreChange,
  pageIndex,
  isTutor,
  readOnly = false,
}: TldrawCanvasProps) {
  const editorRef = useRef<Editor | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(true);

  // ---- Get Yjs shared type for page snapshots ----
  const getYjsPageMap = useCallback((): YMap<string> | null => {
    if (!ydoc) return null;
    return ydoc.getMap<string>(YJS_SNAPSHOT_KEY);
  }, [ydoc]);

  // ---- Load snapshot from Yjs into the editor ----
  const loadSnapshotFromYjs = useCallback(() => {
    const editor = editorRef.current;
    const yjsMap = getYjsPageMap();
    if (!editor || !yjsMap) return;

    const key = `page-${pageIndex}`;
    const snapshotJson = yjsMap.get(key);

    if (snapshotJson) {
      try {
        const storeSnapshot = JSON.parse(snapshotJson) as TLStoreSnapshot;
        // Use editor.loadSnapshot with the document part
        editor.loadSnapshot({ document: storeSnapshot });
        console.log(`[TldrawCanvas] Loaded snapshot for page ${pageIndex} (${(snapshotJson.length / 1024).toFixed(1)}KB)`);
      } catch (err) {
        console.error(`[TldrawCanvas] Failed to parse snapshot for page ${pageIndex}:`, err);
      }
    } else {
      // No saved data — start with a fresh canvas
      console.log(`[TldrawCanvas] No saved snapshot for page ${pageIndex} — starting fresh`);
    }

    setIsLoadingSnapshot(false);
  }, [pageIndex, getYjsPageMap]);

  // ---- Save snapshot from editor to Yjs (debounced) ----
  const saveSnapshotToYjs = useCallback(() => {
    const editor = editorRef.current;
    const yjsMap = getYjsPageMap();
    if (!editor || !yjsMap) return;

    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const snapshot = editor.getSnapshot();
        const key = `page-${pageIndex}`;
        // Store only the document (TLStoreSnapshot) — session state is ephemeral
        const json = JSON.stringify(snapshot.document);

        // Check size before saving (5MB limit matches DB constraint)
        if (json.length > 5_000_000) {
          console.warn(
            `[TldrawCanvas] Snapshot too large for page ${pageIndex} (${(json.length / 1_000_000).toFixed(1)}MB) — skipping save`
          );
          return;
        }

        yjsMap.set(key, json);
        onStoreChange?.();
      } catch (err) {
        console.error(`[TldrawCanvas] Failed to save snapshot for page ${pageIndex}:`, err);
      }
    }, SYNC_DEBOUNCE_MS);
  }, [pageIndex, getYjsPageMap, onStoreChange]);

  // ---- Handle editor mount ----
  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      // Notify parent with the editor ref
      onEditorReady?.(editor);

      // Load snapshot from Yjs after a short delay (let editor initialize)
      setTimeout(() => {
        loadSnapshotFromYjs();
        setIsReady(true);
      }, 100);

      // Listen for store changes and sync to Yjs
      const unlisten = editor.store.listen(() => {
        if (isReady) {
          saveSnapshotToYjs();
        }
      });

      // Cleanup on unmount
      return () => {
        unlisten();
        // Save final snapshot immediately (no debounce)
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        try {
          const yjsMap = getYjsPageMap();
          if (yjsMap && editorRef.current) {
            const snapshot = editorRef.current.getSnapshot();
            const key = `page-${pageIndex}`;
            const json = JSON.stringify(snapshot.document);
            if (json.length <= 5_000_000) {
              yjsMap.set(key, json);
            }
          }
        } catch {
          // Silently ignore save errors on unmount
        }
        editorRef.current = null;
      };
    },
    [onEditorReady, loadSnapshotFromYjs, saveSnapshotToYjs, isReady, pageIndex, getYjsPageMap]
  );

  // ---- Listen for remote Yjs changes ----
  useEffect(() => {
    if (!ydoc) return;

    const yjsMap = ydoc.getMap<string>(YJS_SNAPSHOT_KEY);
    const key = `page-${pageIndex}`;

    // Observe changes to this page's snapshot from remote clients
    const observer = () => {
      // Remote client updated this page — reload snapshot
      const editor = editorRef.current;
      if (!editor) return;

      const newJson = yjsMap.get(key);
      if (newJson) {
        try {
          const storeSnapshot = JSON.parse(newJson) as TLStoreSnapshot;
          editor.loadSnapshot({ document: storeSnapshot });
          console.log(`[TldrawCanvas] Applied remote snapshot for page ${pageIndex}`);
        } catch (err) {
          console.error(`[TldrawCanvas] Failed to apply remote snapshot:`, err);
        }
      }
    };

    yjsMap.observe(observer);
    return () => {
      yjsMap.unobserve(observer);
    };
  }, [ydoc, pageIndex]);

  // ---- Re-load snapshot when page changes ----
  useEffect(() => {
    if (editorRef.current && ydoc) {
      setIsLoadingSnapshot(true);
      loadSnapshotFromYjs();
    }
  }, [pageIndex, ydoc, loadSnapshotFromYjs]);

  // ---- Cleanup debounce on unmount ----
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      {/* Loading overlay while snapshot is being loaded */}
      {isLoadingSnapshot && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading canvas...</span>
          </div>
        </div>
      )}

      {/* Tldraw Editor */}
      <Tldraw
        onMount={handleMount}
        options={{
          maxPages: 50,
          maxShapesPerPage: 500,
        }}
      />
    </div>
  );
}
