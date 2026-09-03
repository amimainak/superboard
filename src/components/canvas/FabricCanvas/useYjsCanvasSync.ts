// ============================================================
// useYjsCanvasSync — Per-object Fabric.js ↔ Yjs CRDT sync
// ============================================================

'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import {
  Canvas,
  type Object as FabricObject,
  util,
  classRegistry,
} from 'fabric';

// `./hooks` is a sibling module that's not present in this codebase yet; we
// alias FabricCanvas to `any` so type-checking passes without the file.
type FabricCanvas = any;
const FabricCanvas: any = Canvas;

const SYNC_DEBOUNCE_MS = 200;

function pageShapesKey(pageIndex: number, prefix?: string): string {
  const pfx = prefix || 'page-shapes';
  return `${pfx}-${pageIndex}`;
}

interface ObjectRecord {
  json: string;
  version: number;
}

export function useYjsCanvasSync(options: {
  ydoc: Y.Doc | null;
  fcanvasRef: React.MutableRefObject<FabricCanvas | null>;
  pageIndex: number;
  mapKeyPrefix?: string;
  onRemoteChange?: () => void;
}) {
  const { ydoc, fcanvasRef, pageIndex, mapKeyPrefix, onRemoteChange } = options;

  const pendingWritesRef = useRef<Map<string, string>>(new Map());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localDirtyRef = useRef<Set<string>>(new Set());
  const versionRef = useRef<Map<string, number>>(new Map());
  const unobserveRef = useRef<(() => void) | null>(null);
  const applyingRemoteRef = useRef(false);

  const serializeObject = useCallback((obj: FabricObject): string => {
    const data = obj.toJSON() as any;
    data.name = (obj as any).name;
    return JSON.stringify(data);
  }, []);

  const deserializeObject = useCallback(
    (json: string): Promise<FabricObject> => {
      return new Promise((resolve, reject) => {
        const parsed = JSON.parse(json);
        const klass = classRegistry.getClass(parsed.type);
        if (!klass) {
          reject(new Error(`Unknown Fabric type: ${parsed.type}`));
          return;
        }
        (klass as any).fromObject(parsed)
          .then((obj: any) => resolve(obj as FabricObject))
          .catch(reject);
      });
    },
    []
  );

  const flushPending = useCallback(() => {
    if (!ydoc || pendingWritesRef.current.size === 0) return;

    const writes = new Map(pendingWritesRef.current);
    pendingWritesRef.current.clear();

    const key = pageShapesKey(pageIndex, mapKeyPrefix);
    const shapesMap = ydoc.getMap<string>(key);

    ydoc.transact(() => {
      writes.forEach((json, objId) => {
        const currentVersion = versionRef.current.get(objId) || 0;
        const record: ObjectRecord = {
          json,
          version: currentVersion + 1,
        };
        shapesMap.set(objId, JSON.stringify(record));
        versionRef.current.set(objId, currentVersion + 1);
        localDirtyRef.current.delete(objId);
      });
    });
  }, [ydoc, pageIndex, mapKeyPrefix]);

  const scheduleWrite = useCallback(
    (objId: string, json: string) => {
      pendingWritesRef.current.set(objId, json);
      localDirtyRef.current.add(objId);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(flushPending, SYNC_DEBOUNCE_MS);
    },
    [flushPending]
  );

  const scheduleRemove = useCallback(
    (objId: string) => {
      if (!ydoc) return;
      const key = pageShapesKey(pageIndex, mapKeyPrefix);
      const shapesMap = ydoc.getMap<string>(key);

      ydoc.transact(() => {
        shapesMap.delete(objId);
      });

      localDirtyRef.current.delete(objId);
      pendingWritesRef.current.delete(objId);
      versionRef.current.delete(objId);
    },
    [ydoc, pageIndex, mapKeyPrefix]
  );

  const loadInitialState = useCallback(
    (fc: FabricCanvas) => {
      if (!ydoc) return;

      const key = pageShapesKey(pageIndex, mapKeyPrefix);
      const shapesMap = ydoc.getMap<string>(key);

      fc.clear();

      const promises: Promise<void>[] = [];

      shapesMap.forEach((recordJson: string, objId: string) => {
        try {
          const record: ObjectRecord = JSON.parse(recordJson);
          versionRef.current.set(objId, record.version);
          promises.push(
            deserializeObject(record.json).then((obj: FabricObject) => {
              (obj as any).name = objId;
              fc.add(obj);
            })
          );
        } catch (e) {
          console.error(`[YjsCanvasSync] Failed to load object ${objId}:`, e);
        }
      });

      Promise.all(promises).then(() => {
        fc.renderAll();
        console.info(`[YjsCanvasSync] Loaded ${promises.length} objects from Yjs page ${pageIndex}`);
      });
    },
    [ydoc, pageIndex, mapKeyPrefix, deserializeObject]
  );

  const setupRemoteObserver = useCallback(() => {
    if (!ydoc) return;

    const key = pageShapesKey(pageIndex, mapKeyPrefix);
    const shapesMap = ydoc.getMap<string>(key);

    const observer = (event: Y.YMapEvent<string>) => {
      const fc = fcanvasRef.current;
      if (!fc) return;

      if (applyingRemoteRef.current) return;

      applyingRemoteRef.current = true;

      // Get all current keys to check what was deleted
      // Yjs v13: use event.changes.keys
      const changes = event.changes;
      changes.keys.forEach((change: any, objId: string) => {
        if (change.action === 'delete') {
          const objs = fc.getObjects().filter((o: FabricObject) => (o as any).name === objId);
          objs.forEach((o: FabricObject) => fc.remove(o));
          versionRef.current.delete(objId);
        } else if (change.action === 'add' || change.action === 'update') {
          if (localDirtyRef.current.has(objId)) return;

          const recordJson = shapesMap.get(objId);
          if (!recordJson) return;

          try {
            const record: ObjectRecord = JSON.parse(recordJson);
            const currentVersion = versionRef.current.get(objId) || 0;

            if (record.version <= currentVersion) return;

            versionRef.current.set(objId, record.version);

            deserializeObject(record.json).then((obj: FabricObject) => {
              (obj as any).name = objId;

              const existing = fc.getObjects().find((o: any) => o.name === objId);
              if (existing) fc.remove(existing);

              fc.add(obj);
              fc.renderAll();
              onRemoteChange?.();
            });
          } catch (e) {
            console.error(`[YjsCanvasSync] Failed to apply remote change for ${objId}:`, e);
          }
        }
      });

      setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 0);
    };

    shapesMap.observe(observer);
    unobserveRef.current = () => shapesMap.unobserve(observer);
  }, [ydoc, pageIndex, mapKeyPrefix, fcanvasRef, deserializeObject, onRemoteChange]);

  const wireCanvasEvents = useCallback(
    (fc: FabricCanvas) => {
      fc.on('object:added', ((e: any) => {
        if (applyingRemoteRef.current) return;
        const obj = e.target as FabricObject;
        if (!(obj as any).name) {
          (obj as any).name = `obj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        }
        const json = serializeObject(obj);
        scheduleWrite((obj as any).name, json);
      }) as any);

      fc.on('object:modified', ((e: any) => {
        if (applyingRemoteRef.current) return;
        const obj = e.target as FabricObject;
        const json = serializeObject(obj);
        scheduleWrite((obj as any).name!, json);
      }) as any);

      fc.on('object:removed', ((e: any) => {
        if (applyingRemoteRef.current) return;
        const obj = e.target as FabricObject;
        scheduleRemove((obj as any).name!);
      }) as any);
    },
    [serializeObject, scheduleWrite, scheduleRemove]
  );

  const saveSnapshot = useCallback(() => {
    const fc = fcanvasRef.current;
    if (!fc || !ydoc) return null;

    const objects = fc.getObjects().map((obj: FabricObject) => ({
      id: (obj as any).name,
      json: serializeObject(obj),
    }));

    return {
      pageIndex,
      objects,
      background: fc.backgroundColor || null,
      viewport: {
        vpt: fc.viewportTransform ? [...fc.viewportTransform] : [1, 0, 0, 1, 0, 0],
        zoom: fc.getZoom(),
      },
    };
  }, [fcanvasRef, ydoc, pageIndex, serializeObject]);

  const loadSnapshot = useCallback(
    (snapshot: { objects: Array<{ id: string; json: string }>; background?: string | null }) => {
      const fc = fcanvasRef.current;
      if (!fc) return;

      fc.clear();
      const promises = snapshot.objects.map(({ id, json }) =>
        deserializeObject(json).then((obj: FabricObject) => {
          (obj as any).name = id;
          fc.add(obj);
        })
      );

      Promise.all(promises).then(() => {
        if (snapshot.background) {
          fc.backgroundColor = snapshot.background;
        }
        fc.renderAll();
      });
    },
    [fcanvasRef, deserializeObject]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      flushPending();
      if (unobserveRef.current) {
        unobserveRef.current();
        unobserveRef.current = null;
      }
    };
  }, [flushPending]);

  return {
    loadInitialState,
    setupRemoteObserver,
    wireCanvasEvents,
    saveSnapshot,
    loadSnapshot,
    flushPending,
  };
}
