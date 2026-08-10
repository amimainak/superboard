// ============================================================
// TldrawCanvas — Tldraw Editor with Yjs Real-Time Sync
// ============================================================
// Wraps the Tldraw editor and synchronizes state with Yjs
// via the Hocuspocus CRDT provider for multi-user collaboration.
//
// Sync strategy: Incremental per-record CRDT sync.
// - Each record (shape, camera, page-state, etc.) is stored as a
//   separate entry in a per-page Y.Map, keyed by record ID.
// - Local user edits are debounced (200ms) and batch-written to Yjs.
// - Remote Yjs changes are merged record-by-record into the editor
//   using store.mergeRemoteChanges(), which marks them source='remote'
//   so they don't trigger the local-sync listener (no echo loop).
// - A dirty-set tracks record IDs with unsynced local changes;
//   remote updates for dirty records are skipped (last-local-writer-wins).
// - A monotonic localChangeVersion counter is maintained per record
//   for diagnostics and future conflict-resolution extensions.
// - Backward compatibility: legacy full-snapshot format is detected
//   on first load and migrated to the per-record format.
// ============================================================

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Tldraw, Editor, TLStoreSnapshot } from 'tldraw';
import type { Map as YMap } from 'yjs';
import 'tldraw/tldraw.css';

// ---- Types ----

/** Shape of the RecordsDiff changes as delivered by store.listen in tldraw v5. */
interface RecordsDiffLike {
	added: Record<string, Record<string, unknown>>;
	updated: Record<string, [from: Record<string, unknown>, to: Record<string, unknown>]>;
	removed: Record<string, Record<string, unknown>>;
}

/** Shape of the history entry passed to store.listen callbacks in tldraw v5. */
interface HistoryEntryLike {
	changes: RecordsDiffLike;
	source: 'user' | 'remote';
}

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

/** Debounce Yjs writes to batch rapid edits into one transaction. */
const SYNC_DEBOUNCE_MS = 200;

/** Key of the legacy Y.Map that stored full page snapshots as JSON blobs. */
const YJS_LEGACY_MAP_KEY = 'page-snapshot';

/**
 * Prefix for per-page Y.Maps that store individual records.
 * E.g. pageIndex=3 → ydoc.getMap('page-shapes-3')
 */
const YJS_SHAPES_MAP_PREFIX = 'page-shapes-';

/**
 * Transaction origin symbol used to tag our own local writes.
 * The Yjs observer checks this to skip re-applying our own changes.
 */
const LOCAL_SYNC_ORIGIN = Symbol('tldraw-local-sync');

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
	// ---- Core state & refs ----
	const editorRef = useRef<Editor | null>(null);
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(true);

	/**
	 * Mirror of isReady as a ref so that closures inside setTimeout/
	 * store listeners always see the current value without being
	 * captured at creation time.
	 */
	const isReadyRef = useRef(false);

	// ---- Incremental sync refs (stable across renders) ----

	/** Records that changed locally and are awaiting debounce flush to Yjs. */
	const pendingWritesRef = useRef<Map<string, Record<string, unknown>>>(new Map());

	/** Record IDs that were deleted locally and are awaiting debounce flush. */
	const pendingDeletesRef = useRef<Set<string>>(new Set());

	/**
	 * Record IDs with unsynced local changes.
	 * Remote updates for these IDs are skipped to prevent overwriting
	 * concurrent local edits (last-local-writer-wins).  IDs are removed
	 * after the corresponding write/delete is flushed to Yjs.
	 */
	const localDirtyRef = useRef<Set<string>>(new Set());

	/** Monotonically increasing version counter for local edits. */
	const localChangeVersionRef = useRef(0);

	/** Per-record version: the localChangeVersion at which it was last edited locally. */
	const recordVersionsRef = useRef<Map<string, number>>(new Map());

	/** True while the initial snapshot is being loaded (suppresses sync-to-Yjs). */
	const isInitialLoadRef = useRef(false);

	/** Set of page indices that have already been migrated from legacy format. */
	const migratedPagesRef = useRef<Set<number>>(new Set());

	/** Cleanup function for the tldraw store listener. */
	const unlistenStoreRef = useRef<(() => void) | null>(null);

	/** Cleanup function for the Yjs shapes-map observer. */
	const unobserveYjsRef = useRef<(() => void) | null>(null);

	/**
	 * Ref to the Y.Map currently being used for this page's shapes.
	 * Updated explicitly on page switch so we can flush the OLD map
	 * before swapping to the new one.
	 */
	const shapesMapRef = useRef<YMap<string> | null>(null);

	/** Track the previous page index to detect page switches. */
	const prevPageIndexRef = useRef(pageIndex);

	/** Keep callback refs up-to-date without re-registering listeners. */
	const onStoreChangeRef = useRef(onStoreChange);
	onStoreChangeRef.current = onStoreChange;

	// ----------------------------------------------------------------
	// Core: process a RecordsDiff into pending writes/deletes & schedule sync
	// ----------------------------------------------------------------

	const processLocalDiff = useCallback((entry: HistoryEntryLike) => {
		if (isInitialLoadRef.current) return;
		if (!isReadyRef.current) return;

		const { changes } = entry;

		// Increment the global local version counter.
		localChangeVersionRef.current++;
		const version = localChangeVersionRef.current;

		// Collect added records.
		for (const [id, record] of Object.entries(changes.added)) {
			pendingWritesRef.current.set(id, record);
			pendingDeletesRef.current.delete(id);
			localDirtyRef.current.add(id);
			recordVersionsRef.current.set(id, version);
		}

		// Collect updated records (use the "to" value — index 1).
		for (const [id, pair] of Object.entries(changes.updated)) {
			pendingWritesRef.current.set(id, pair[1]);
			pendingDeletesRef.current.delete(id);
			localDirtyRef.current.add(id);
			recordVersionsRef.current.set(id, version);
		}

		// Collect removed records.
		for (const id of Object.keys(changes.removed)) {
			pendingDeletesRef.current.add(id);
			pendingWritesRef.current.delete(id);
			localDirtyRef.current.add(id);
			recordVersionsRef.current.set(id, version);
		}

		scheduleSyncRef.current();
	}, []);

	// ---- Ref-stable scheduleSync (never recreated) ----
	const scheduleSyncRef = useRef<() => void>(() => {});

	// ---- Ref-stable flushPendingToYjs (never recreated) ----
	const flushPendingRef = useRef<() => void>(() => {});

	// ----------------------------------------------------------------
	// Flush pending changes to the current shapes Y.Map
	// ----------------------------------------------------------------

	const buildFlush = useCallback(() => {
		return () => {
			const map = shapesMapRef.current;
			if (!map || !ydoc) return;

			// Nothing to flush?
			if (pendingWritesRef.current.size === 0 && pendingDeletesRef.current.size === 0) return;

			// Snapshot the pending state so new changes accumulate independently.
			const writes = new Map(pendingWritesRef.current);
			const deletes = new Set(pendingDeletesRef.current);
			pendingWritesRef.current = new Map();
			pendingDeletesRef.current = new Set();

			// Check total serialized size (5 MB limit matches DB constraint).
			let totalSize = 0;
			for (const record of writes.values()) {
				totalSize += JSON.stringify(record).length;
			}
			if (totalSize > 5_000_000) {
				console.warn(
					`[TldrawCanvas] Pending sync too large (${(totalSize / 1_000_000).toFixed(1)}MB) — skipping`
				);
				return;
			}

			// Batch all writes/deletes into a single Yjs transaction tagged
			// with our origin so the observer can skip re-applying them.
			ydoc.transact(() => {
				for (const [id, record] of writes) {
					map.set(id, JSON.stringify(record));
				}
				for (const id of deletes) {
					map.delete(id);
				}
			}, LOCAL_SYNC_ORIGIN);

			// Clear dirty flags for the records we just synced.
			for (const id of writes.keys()) {
				localDirtyRef.current.delete(id);
			}
			for (const id of deletes) {
				localDirtyRef.current.delete(id);
			}

			onStoreChangeRef.current?.();
		};
	}, [ydoc]);

	// Keep flushPendingRef up-to-date.
	flushPendingRef.current = buildFlush();

	// ----------------------------------------------------------------
	// Schedule a debounced flush
	// ----------------------------------------------------------------

	const buildScheduleSync = useCallback(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
			debounceTimerRef.current = setTimeout(() => {
				flushPendingRef.current();
			}, SYNC_DEBOUNCE_MS);
		};
	}, []);

	// Keep scheduleSyncRef up-to-date.
	scheduleSyncRef.current = buildScheduleSync();

	// ----------------------------------------------------------------
	// Load initial state from Yjs into the editor
	// ----------------------------------------------------------------

	const loadInitialState = useCallback(() => {
		const editor = editorRef.current;
		if (!editor || !ydoc) return;

		isInitialLoadRef.current = true;

		const shapesMap = ydoc.getMap<string>(`${YJS_SHAPES_MAP_PREFIX}${pageIndex}`);
		shapesMapRef.current = shapesMap;

		// --- Try legacy full-snapshot format first ---
		const legacyMap = ydoc.getMap<string>(YJS_LEGACY_MAP_KEY);
		const legacyKey = `page-${pageIndex}`;
		const legacyJson = legacyMap.get(legacyKey);

		if (legacyJson && !migratedPagesRef.current.has(pageIndex)) {
			try {
				const storeSnapshot = JSON.parse(legacyJson) as TLStoreSnapshot;

				// editor.loadSnapshot accepts Partial<TLEditorSnapshot> | TLStoreSnapshot
				editor.loadSnapshot({ document: storeSnapshot });
				console.log(`[TldrawCanvas] Loaded legacy snapshot for page ${pageIndex}`);

				// Migrate the legacy snapshot into per-record Y.Map entries.
				// TLStoreSnapshot has { store: Record<string, TLRecord>, schema: ... }
				const records = (storeSnapshot as any).store;
				if (records) {
					ydoc.transact(() => {
						for (const [id, record] of Object.entries(records)) {
							shapesMap.set(id, JSON.stringify(record));
						}
					}, LOCAL_SYNC_ORIGIN);
					console.log(
						`[TldrawCanvas] Migrated ${Object.keys(records).length} records to per-record format for page ${pageIndex}`
					);
				}

				migratedPagesRef.current.add(pageIndex);
			} catch (err) {
				console.error(
					`[TldrawCanvas] Failed to load/parse legacy snapshot for page ${pageIndex}:`,
					err
				);
			}
		} else {
			// --- Load from per-record format ---
			const recordsToLoad: Record<string, unknown>[] = [];
			shapesMap.forEach((json, id) => {
				try {
					recordsToLoad.push(JSON.parse(json));
				} catch (err) {
					console.error(`[TldrawCanvas] Failed to parse record ${id}:`, err);
				}
			});

			if (recordsToLoad.length > 0) {
				// Use mergeRemoteChanges so these are tagged source='remote'
				// and won't trigger our local-sync listener.
				editor.store.mergeRemoteChanges(() => {
					editor.store.put(recordsToLoad as any);
				});
				console.log(
					`[TldrawCanvas] Loaded ${recordsToLoad.length} records from per-record format for page ${pageIndex}`
				);
			} else if (!legacyJson) {
				console.log(`[TldrawCanvas] No saved data for page ${pageIndex} — starting fresh`);
			}
		}

		isInitialLoadRef.current = false;
		setIsLoadingSnapshot(false);
	}, [ydoc, pageIndex]);

	// ----------------------------------------------------------------
	// Set up the Yjs remote-change observer for the shapes map
	// ----------------------------------------------------------------

	const setupRemoteObserver = useCallback(() => {
		const shapesMap = shapesMapRef.current;
		if (!shapesMap) return () => {};

		const observer = (event: any, transaction: any) => {
			// Skip our own local writes (tagged with LOCAL_SYNC_ORIGIN).
			if (transaction.origin === LOCAL_SYNC_ORIGIN) return;

			const editor = editorRef.current;
			if (!editor) return;
			if (isInitialLoadRef.current) return;

			const toPut: Record<string, unknown>[] = [];
			const toRemove: string[] = [];

			// Determine which keys changed.
			// YMapEvent extends YEvent which has `changes.keys` (Map<string, {action, oldValue}>).
			// It also has `keysChanged` (Set<string>) which is a simpler set of changed keys.
			const changedKeys: Set<string> | undefined = event.keysChanged;
			if (!changedKeys) return;

			for (const id of changedKeys) {
				// Skip records with pending local changes — our local edit wins.
				if (localDirtyRef.current.has(id)) {
					continue;
				}

				// Check if the key still exists in the map (add/update) or was deleted.
				if (shapesMap.has(id)) {
					try {
						toPut.push(JSON.parse(shapesMap.get(id)!));
					} catch (err) {
						console.error(`[TldrawCanvas] Failed to parse remote record ${id}:`, err);
					}
				} else {
					toRemove.push(id);
				}
			}

			if (toPut.length > 0 || toRemove.length > 0) {
				editor.store.mergeRemoteChanges(() => {
					if (toPut.length > 0) {
						editor.store.put(toPut as any);
					}
					if (toRemove.length > 0) {
						editor.store.remove(toRemove as any);
					}
				});
				console.log(
					`[TldrawCanvas] Applied remote changes for page ${pageIndex}: ${toPut.length} puts, ${toRemove.length} removes`
				);
			}
		};

		shapesMap.observe(observer);
		return () => {
			shapesMap.unobserve(observer);
		};
	}, [pageIndex]);

	// ----------------------------------------------------------------
	// Register the store listener with { source: 'user', scope: 'document' }
	// so it only fires for local user edits (not for remote-applied changes).
	// ----------------------------------------------------------------

	const registerStoreListener = useCallback(() => {
		const editor = editorRef.current;
		if (!editor) return;

		// Clean up previous listener if any.
		unlistenStoreRef.current?.();

		unlistenStoreRef.current = (editor.store as any).listen(
			(entry: HistoryEntryLike) => {
				processLocalDiff(entry);
			},
			{ source: 'user', scope: 'document' } as any
		);
	}, [processLocalDiff]);

	// ----------------------------------------------------------------
	// Handle editor mount (called once by Tldraw)
	// ----------------------------------------------------------------

	const handleMount = useCallback(
		(editor: Editor) => {
			editorRef.current = editor;
			prevPageIndexRef.current = pageIndex;

			// Notify parent with the editor ref.
			onEditorReady?.(editor);

			// Short delay lets the editor finish its internal initialization
			// before we start loading external data.
			setTimeout(() => {
				// 1. Load initial state (legacy snapshot or per-record format).
				loadInitialState();

				// 2. Register the store listener for user-initiated changes.
				registerStoreListener();

				// 3. Set up the Yjs remote observer.
				unobserveYjsRef.current = setupRemoteObserver();

				// 4. Mark as ready — enables the store listener's isReadyRef check.
				isReadyRef.current = true;
				setIsReady(true);
			}, 100);
		},
		[onEditorReady, pageIndex, loadInitialState, registerStoreListener, setupRemoteObserver]
	);

	// ----------------------------------------------------------------
	// Handle page changes: flush old page, load new page
	// ----------------------------------------------------------------

	useEffect(() => {
		if (!editorRef.current || !ydoc) return;
		if (prevPageIndexRef.current === pageIndex) return;

		// 1. Cancel any pending debounce.
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
			debounceTimerRef.current = null;
		}

		// 2. Mark as not-ready to suppress store listener during transition.
		isReadyRef.current = false;

		// 3. Flush pending changes for the OLD page (shapesMapRef still points to old map).
		flushPendingRef.current();

		// 4. Clean up old Yjs observer.
		unobserveYjsRef.current?.();
		unobserveYjsRef.current = null;

		// 5. Reset all pending/dirty state for the new page.
		pendingWritesRef.current = new Map();
		pendingDeletesRef.current = new Set();
		localDirtyRef.current = new Set();

		// 6. Update page tracking.
		prevPageIndexRef.current = pageIndex;

		// 7. Load the new page's state.
		setIsLoadingSnapshot(true);
		loadInitialState();

		// 8. Set up new Yjs observer for the new page's map.
		unobserveYjsRef.current = setupRemoteObserver();

		// 9. Re-enable the store listener.
		//    (registerStoreListener is idempotent — it cleans up the old one first.)
		registerStoreListener();

		// 10. Mark as ready again.
		isReadyRef.current = true;
		setIsReady(true);
	}, [pageIndex, ydoc, loadInitialState, setupRemoteObserver, registerStoreListener]);

	// ----------------------------------------------------------------
	// Cleanup on unmount
	// ----------------------------------------------------------------

	useEffect(() => {
		return () => {
			// Cancel pending debounce.
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
				debounceTimerRef.current = null;
			}

			// Flush any remaining pending changes immediately.
			flushPendingRef.current();

			// Clean up listeners.
			unlistenStoreRef.current?.();
			unobserveYjsRef.current?.();

			editorRef.current = null;
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// ----------------------------------------------------------------
	// Render
	// ----------------------------------------------------------------

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
