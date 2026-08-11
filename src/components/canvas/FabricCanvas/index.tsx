// ============================================================
// FabricCanvas — Interactive Whiteboard Canvas (Phase 4)
// ============================================================
// Purpose-built for K-12 online tutoring with Fabric.js + perfect-freehand.
//
// Architecture:
//   Fabric.js canvas (bottom layer) — shape rendering engine
//   DOM overlay layers — UI components, text editing, cursor rendering
//
// Phase 1: Freehand, shapes, text, eraser, pan/zoom, undo/redo
// Phase 2: Yjs per-object CRDT sync, awareness cursors, read-only
// Phase 3: Multi-page, image upload, PNG export, templates
// Phase 4: Touch gestures, pinch-zoom, remote cursors, copy/paste,
//          keyboard shortcuts, performance optimization, zoom-to-fit
// ============================================================

'use client';

import React, { useEffect, useRef, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import {
  Canvas,
  PencilBrush,
  Rect,
  Ellipse,
  Line,
  Triangle,
  IText,
  Group,
  Point as FabricPoint,
  Circle,
  Path,
  type Object as FabricObject,
} from 'fabric';
import getStroke from 'perfect-freehand';
import { useCanvasTools, useCanvasHistory, useKeyboardShortcuts, setKeyboardCanvasRef, type FabricCanvas, type CanvasTool } from './hooks';
import { useYjsCanvasSync } from './useYjsCanvasSync';

// ---- Types ----

interface Point {
  x: number;
  y: number;
}

interface FreehandPoint {
  x: number;
  y: number;
  pressure?: number;
}

interface RemoteCursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

export interface FabricCanvasProps {
  ydoc: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  pageIndex: number;
  isTutor: boolean;
  readOnly: boolean;
  activeTool?: string;
  onCanvasReady?: (canvas: FabricCanvas) => void;
  awareness?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  // Sprint 1: Viewport sync (student side — received from tutor)
  appliedViewport?: { x: number; y: number; zoom: number } | null;
  // Sprint 1: Focus mode flag (tutor broadcasts viewport when true)
  focusMode?: boolean;
  // Sprint 1: Scratchpad mode — uses separate Yjs map key
  isScratchpad?: boolean;
}

// ---- Perfect-Freehand → Fabric.js Path ----

function createFreehandPath(
  points: FreehandPoint[],
  strokeColor: string,
  strokeWidth: number
): Path | null {
  if (points.length < 2) return null;

  const outline = getStroke(points, {
    size: strokeWidth * 3,
    thinning: 0.5,
    smoothing: 0.6,
    streamline: 0.5,
    simulatePressure: true,
  });

  if (outline.length < 2) return null;

  // Build SVG path string from the outline points
  let d = `M ${outline[0][0].toFixed(1)} ${outline[0][1].toFixed(1)}`;
  for (let i = 1; i < outline.length; i++) {
    d += ` L ${outline[i][0].toFixed(1)} ${outline[i][1].toFixed(1)}`;
  }
  d += ' Z';

  try {
    const path = new Path(d, {
      fill: strokeColor,
      stroke: strokeColor,
      strokeWidth: 0.5,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
    } as any);
    return path;
  } catch {
    return null;
  }
}

// ---- Canvas ID for uniqueness ----
let canvasInstanceId = 0;
function getNextCanvasId() {
  canvasInstanceId++;
  return `fabric-whiteboard-${canvasInstanceId}`;
}

// ---- Main Component ----

const FabricCanvasComponent = forwardRef<FabricCanvas, FabricCanvasProps>(
  function FabricCanvasInner(
    {
      ydoc,
      pageIndex,
      isTutor,
      readOnly,
      activeTool,
      onCanvasReady,
      awareness,
      appliedViewport,
      focusMode,
      isScratchpad,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const fcanvasRef = useRef<FabricCanvas | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const canvasIdRef = useRef(getNextCanvasId());

    // Drawing state for shapes
    const isDrawingRef = useRef(false);
    const startPointRef = useRef<Point | null>(null);
    const tempShapeRef = useRef<FabricObject | null>(null);

    // Freehand points buffer for perfect-freehand
    const freehandPointsRef = useRef<FreehandPoint[]>([]);
    const freehandTempPathRef = useRef<Path | null>(null);

    // Touch state for pinch-to-zoom
    const touchStateRef = useRef<{
      isPinching: boolean;
      lastDist: number;
      lastCenter: { x: number; y: number };
      touchCount: number;
    }>({ isPinching: false, lastDist: 0, lastCenter: { x: 0, y: 0 }, touchCount: 0 });

    // Remote cursors state
    const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
    const cursorOverlayRef = useRef<HTMLDivElement>(null);

    // Render throttle
    const renderQueuedRef = useRef(false);
    const requestRenderThrottled = useCallback(() => {
      if (renderQueuedRef.current) return;
      renderQueuedRef.current = true;
      requestAnimationFrame(() => {
        fcanvasRef.current?.requestRenderAll();
        renderQueuedRef.current = false;
      });
    }, []);

    // ---- Expose canvas ref via forwardRef ----
    useImperativeHandle(ref, () => fcanvasRef.current!, []);

    // ---- Hooks ----
    const tools = useCanvasTools(fcanvasRef);
    const history = useCanvasHistory(fcanvasRef);

    // Register canvas ref for keyboard shortcuts
    useEffect(() => {
      setKeyboardCanvasRef(fcanvasRef);
      return () => setKeyboardCanvasRef({ current: null } as React.MutableRefObject<FabricCanvas | null>);
    }, []);

    // ============================================================
    // Sync external tool changes (from toolbar) to canvas
    // ============================================================
    const prevActiveToolRef = useRef(activeTool);
    useEffect(() => {
      if (activeTool && activeTool !== prevActiveToolRef.current) {
        prevActiveToolRef.current = activeTool;
        tools.setTool(activeTool as CanvasTool);
      }
    }, [activeTool, tools]);

    const sync = useYjsCanvasSync({
      ydoc,
      fcanvasRef,
      pageIndex: isScratchpad ? -1 : pageIndex,
      mapKeyPrefix: isScratchpad ? 'scratchpad-shapes' : 'page-shapes',
      onRemoteChange: () => {},
    });

    // ============================================================
    // Canvas Initialization
    // ============================================================
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const canvasId = canvasIdRef.current;
      const fc = new Canvas(canvasId, {
        width: container.clientWidth,
        height: container.clientHeight,
        backgroundColor: '#ffffff',
        selection: false,
        preserveObjectStacking: true,
        stopContextMenu: true,
        fireRightClick: true,
        fireMiddleClick: true,
        enableRetinaScaling: true,
        renderOnAddRemove: false, // Performance: batch renders
      });

      // Configure PencilBrush for freehand (fallback / raw path mode)
      const brush = new PencilBrush(fc);
      brush.color = tools.strokeColor;
      brush.width = tools.strokeWidth;
      brush.decimate = 2; // Reduce point density for performance
      fc.freeDrawingBrush = brush;
      fc.isDrawingMode = false;

      fcanvasRef.current = fc;
      setIsReady(true);

      sync.loadInitialState(fc);
      sync.wireCanvasEvents(fc);
      sync.setupRemoteObserver();
      onCanvasReady?.(fc);

      // Initial render
      fc.requestRenderAll();

      return () => {
        sync.flushPending();
        fc.dispose();
        fcanvasRef.current = null;
        setIsReady(false);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ============================================================
    // Resize Handler (performance: debounced)
    // ============================================================
    useEffect(() => {
      const container = containerRef.current;
      const fc = fcanvasRef.current;
      if (!container || !fc) return;

      let rafId: number;
      const observer = new ResizeObserver(() => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          fc.setDimensions({
            width: container.clientWidth,
            height: container.clientHeight,
          });
          fc.requestRenderAll();
        });
      });

      observer.observe(container);
      return () => {
        observer.disconnect();
        if (rafId) cancelAnimationFrame(rafId);
      };
    }, [isReady]);

    // ============================================================
    // Page Change — reload from Yjs
    // ============================================================
    const prevPageIndexRef = useRef(pageIndex);
    useEffect(() => {
      if (pageIndex !== prevPageIndexRef.current) {
        const fc = fcanvasRef.current;
        if (fc && ydoc) {
          sync.flushPending();
          history.clearHistory();
          sync.loadInitialState(fc);
        }
        prevPageIndexRef.current = pageIndex;
      }
    }, [pageIndex, ydoc, sync, history]);

    // ============================================================
    // Read-only mode
    // ============================================================
    useEffect(() => {
      const fc = fcanvasRef.current;
      if (!fc) return;

      if (readOnly) {
        fc.selection = false;
        fc.isDrawingMode = false;
        fc.forEachObject((obj: FabricObject) => {
          obj.selectable = false;
          obj.evented = false;
        });
      } else {
        tools.setTool(tools.tool);
      }
      fc.requestRenderAll();
    }, [readOnly, tools]);

    // ============================================================
    // Awareness Cursor Tracking — broadcast local cursor, render remote
    // ============================================================
    useEffect(() => {
      if (!awareness || !fcanvasRef.current) return;

      const fc = fcanvasRef.current;
      const localUserId = awareness.clientId;

      // Broadcast cursor position on mouse move
      const handleMouseMoveAwareness = (opt: any) => {
        const e = opt.e as MouseEvent;
        const pointer = fc.getScenePoint(e) as unknown as FabricPoint;
        awareness.setLocalStateField('cursor', {
          x: pointer.x,
          y: pointer.y,
        });
      };

      fc.on('mouse:move', handleMouseMoveAwareness);

      // Observe remote awareness states for cursors
      const handleAwarenessChange = () => {
        const states = awareness.getStates() as Map<number, any>;
        const cursors: RemoteCursor[] = [];

        states.forEach((state: any, clientId: number) => {
          if (clientId === localUserId) return; // Skip own cursor
          const cursor = state?.cursor;
          const user = state?.user;
          if (cursor && user) {
            cursors.push({
              id: String(clientId),
              name: user.name || 'Anonymous',
              color: user.color || '#6366f1',
              x: cursor.x,
              y: cursor.y,
            });
          }
        });

        setRemoteCursors(cursors);
      };

      awareness.on('change', handleAwarenessChange);

      return () => {
        fc.off('mouse:move', handleMouseMoveAwareness);
        awareness.off('change', handleAwarenessChange);
      };
    }, [awareness, isReady]);

    // ============================================================
    // Sprint 1: Viewport Broadcast (Tutor Side — Focus Mode)
    // Broadcasts viewport (x, y, zoom) via awareness when focus mode is on.
    // ============================================================
    useEffect(() => {
      const fc = fcanvasRef.current;
      if (!fc || !awareness || !isTutor || !focusMode) return;

      let lastKey = '';
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;

      const broadcastCurrentViewport = () => {
        const vpt = fc.viewportTransform;
        if (!vpt) return;
        const zoom = parseFloat((vpt[0] || 1).toFixed(2));
        const x = Math.round(vpt[4] || 0);
        const y = Math.round(vpt[5] || 0);
        const key = `${x},${y},${zoom}`;

        if (key !== lastKey) {
          lastKey = key;
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            awareness.setLocalStateField('viewport', { x, y, zoom });
          }, 60);
        }
      };

      // Broadcast on zoom (wheel) and pan (after:render when panning)
      const handleAfterRender = () => {
        if (isPanning) broadcastCurrentViewport();
      };

      const handleZoom = () => {
        broadcastCurrentViewport();
      };

      fc.on('after:render', handleAfterRender);
      fc.on('mouse:wheel', handleZoom);

      // Initial broadcast
      broadcastCurrentViewport();

      return () => {
        fc.off('after:render', handleAfterRender);
        fc.off('mouse:wheel', handleZoom);
        if (debounceTimer) clearTimeout(debounceTimer);
        // Clear viewport when focus mode changes or component unmounts
        awareness.setLocalStateField('viewport', null);
      };
    }, [awareness, isTutor, focusMode, isReady, isPanning]);

    // ============================================================
    // Sprint 1: Viewport Receive (Student Side — Focus Mode)
    // Applies viewport broadcasted by tutor.
    // ============================================================
    useEffect(() => {
      const fc = fcanvasRef.current;
      if (!fc || !appliedViewport || isTutor) return;

      const vpt = [...(fc.viewportTransform || [1, 0, 0, 1, 0, 0])];
      vpt[0] = appliedViewport.zoom;
      vpt[3] = appliedViewport.zoom;
      vpt[4] = appliedViewport.x;
      vpt[5] = appliedViewport.y;
      fc.setViewportTransform(vpt as any);
      requestRenderThrottled();
    }, [appliedViewport, isTutor, isReady]); // eslint-disable-line react-hooks/exhaustive-deps

    // ============================================================
    // Canvas Interaction — Pan, Zoom, Draw, Erase, Text, Shapes
    // ============================================================
    useEffect(() => {
      const fc = fcanvasRef.current;
      if (!fc || readOnly) return;

      // ---- Zoom (mouse wheel) ----
      const handleWheel = (opt: any) => {
        const e = opt.e as WheelEvent;
        e.preventDefault();
        e.stopPropagation();

        const delta = e.deltaY;
        let zoom = fc.getZoom();
        zoom *= 0.999 ** delta;
        zoom = Math.min(Math.max(0.1, zoom), 10);
        fc.zoomToPoint(new FabricPoint(e.offsetX, e.offsetY), zoom);
        requestRenderThrottled();
      };
      fc.on('mouse:wheel', handleWheel);

      // ---- Mouse interactions ----
      let panningActive = false;
      let lastPosX = 0;
      let lastPosY = 0;
      let beforeState = '';

      // ---- Mouse Down ----
      const handleMouseDown = (opt: any) => {
        const e = opt.e as MouseEvent;

        // Hand tool: left click pans
        if (tools.tool === 'hand' && e.button === 0) {
          panningActive = true;
          setIsPanning(true);
          lastPosX = e.clientX;
          lastPosY = e.clientY;
          (fc as any).defaultCursor = 'grabbing';
          return;
        }

        // Middle click pans
        if (e.button === 1) {
          panningActive = true;
          setIsPanning(true);
          lastPosX = e.clientX;
          lastPosY = e.clientY;
          return;
        }

        // Eraser: click to delete
        if (tools.tool === 'eraser' && e.button === 0) {
          const target = opt.target as FabricObject | undefined;
          if (target) {
            beforeState = fc.toJSON().toString();
            fc.remove(target);
            fc.renderAll();
            history.pushState('erase', beforeState, fc.toJSON().toString());
          }
          return;
        }

        // Text: click empty space to place IText
        if (tools.tool === 'text' && e.button === 0 && !opt.target) {
          const pointer = fc.getScenePoint(e) as unknown as FabricPoint;
          beforeState = fc.toJSON().toString();

          const text = new IText('Type here', {
            left: pointer.x,
            top: pointer.y,
            fontSize: tools.fontSize,
            fill: tools.strokeColor,
            fontFamily: 'Inter, system-ui, sans-serif',
            selectable: true,
            evented: true,
          } as any);
          (text as any).name = `obj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

          fc.add(text);
          fc.setActiveObject(text);
          text.enterEditing();
          text.selectAll();
          fc.renderAll();

          history.pushState('add-text', beforeState, fc.toJSON().toString());
          return;
        }

        // Freehand (draw tool): start collecting points for perfect-freehand
        if (tools.tool === 'draw' && e.button === 0 && !opt.target) {
          // We use Fabric's built-in freeDrawingMode but with perfect-freehand
          // post-processing. The PencilBrush collects points; on path:created
          // we replace it with a smooth perfect-freehand path.
          // But for real-time preview, we track raw points ourselves.
          const pointer = fc.getScenePoint(e) as unknown as FabricPoint;
          freehandPointsRef.current = [{ x: pointer.x, y: pointer.y, pressure: 0.5 }];
          isDrawingRef.current = true;
          beforeState = fc.toJSON().toString();
          return;
        }

        // Shape tools: start drawing
        if (['rectangle', 'ellipse', 'line', 'arrow'].includes(tools.tool) && e.button === 0 && !opt.target) {
          const pointer = fc.getScenePoint(e) as unknown as FabricPoint;
          isDrawingRef.current = true;
          startPointRef.current = pointer;
          beforeState = fc.toJSON().toString();

          const objName = `obj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          let shape: FabricObject;

          switch (tools.tool) {
            case 'rectangle':
              shape = new Rect({
                left: pointer.x,
                top: pointer.y,
                width: 1,
                height: 1,
                fill: tools.fillColor === 'transparent' ? 'transparent' : tools.fillColor,
                stroke: tools.strokeColor,
                strokeWidth: tools.strokeWidth,
                selectable: false,
                evented: false,
              } as any);
              break;

            case 'ellipse':
              shape = new Ellipse({
                left: pointer.x,
                top: pointer.y,
                rx: 1,
                ry: 1,
                fill: tools.fillColor === 'transparent' ? 'transparent' : tools.fillColor,
                stroke: tools.strokeColor,
                strokeWidth: tools.strokeWidth,
                selectable: false,
                evented: false,
              } as any);
              break;

            case 'line':
              shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                stroke: tools.strokeColor,
                strokeWidth: tools.strokeWidth,
                selectable: false,
                evented: false,
              } as any);
              break;

            case 'arrow': {
              const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                stroke: tools.strokeColor,
                strokeWidth: tools.strokeWidth,
                selectable: false,
                evented: false,
              } as any);
              const headSize = Math.max(10, tools.strokeWidth * 4);
              const arrowhead = new Triangle({
                left: pointer.x,
                top: pointer.y,
                width: headSize,
                height: headSize,
                fill: tools.strokeColor,
                angle: 90,
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
              } as any);
              shape = new Group([line, arrowhead], {
                selectable: false,
                evented: false,
              } as any);
              break;
            }

            default:
              return;
          }

          (shape as any).name = objName;
          fc.add(shape);
          tempShapeRef.current = shape;
          requestRenderThrottled();
          return;
        }
      };

      // ---- Mouse Move ----
      const handleMouseMove = (opt: any) => {
        const e = opt.e as MouseEvent;

        // Panning
        if (panningActive) {
          const vpt = fc.viewportTransform!;
          vpt[4] += e.clientX - lastPosX;
          vpt[5] += e.clientY - lastPosY;
          lastPosX = e.clientX;
          lastPosY = e.clientY;
          requestRenderThrottled();
          return;
        }

        // Freehand drawing — collect points
        if (isDrawingRef.current && tools.tool === 'draw') {
          const pointer = fc.getScenePoint(e) as unknown as FabricPoint;
          freehandPointsRef.current.push({
            x: pointer.x,
            y: pointer.y,
            pressure: 0.5,
          });

          // Real-time preview with perfect-freehand
          if (freehandTempPathRef.current) {
            fc.remove(freehandTempPathRef.current);
          }

          const previewPath = createFreehandPath(
            freehandPointsRef.current,
            tools.strokeColor,
            tools.strokeWidth
          );
          if (previewPath) {
            (previewPath as any).name = '__freehand_temp__';
            freehandTempPathRef.current = previewPath;
            fc.add(previewPath);
          }

          requestRenderThrottled();
          return;
        }

        // Shape drawing
        if (isDrawingRef.current && tempShapeRef.current && startPointRef.current) {
          const pointer = fc.getScenePoint(e) as unknown as FabricPoint;
          const start = startPointRef.current;
          const t = tempShapeRef.current;

          if (t instanceof Rect) {
            const left = Math.min(start.x, pointer.x);
            const top = Math.min(start.y, pointer.y);
            t.set({
              left,
              top,
              width: Math.abs(pointer.x - start.x),
              height: Math.abs(pointer.y - start.y),
            });
          } else if (t instanceof Ellipse) {
            const left = Math.min(start.x, pointer.x);
            const top = Math.min(start.y, pointer.y);
            const rx = Math.max(1, Math.abs(pointer.x - start.x) / 2);
            const ry = Math.max(1, Math.abs(pointer.y - start.y) / 2);
            t.set({ left: left + rx, top: top + ry, rx, ry });
          } else if (t instanceof Line) {
            t.set({ x2: pointer.x, y2: pointer.y });
          } else if (t instanceof Group) {
            const objs = t.getObjects();
            const line = objs[0] as Line;
            const head = objs[1] as Triangle;
            if (line && head) {
              line.set({ x2: pointer.x - start.x, y2: pointer.y - start.y });
              head.set({
                left: pointer.x - start.x,
                top: pointer.y - start.y,
                angle:
                  Math.atan2(pointer.y - start.y, pointer.x - start.x) *
                    (180 / Math.PI) +
                  90,
              });
            }
            t.setCoords();
          }

          requestRenderThrottled();
        }
      };

      // ---- Mouse Up ----
      const handleMouseUp = () => {
        // Stop panning
        if (panningActive) {
          panningActive = false;
          setIsPanning(false);
          (fc as any).defaultCursor =
            tools.tool === 'hand' ? 'grab' : 'default';
          return;
        }

        // Finalize freehand
        if (isDrawingRef.current && tools.tool === 'draw') {
          isDrawingRef.current = false;

          // Remove preview path
          if (freehandTempPathRef.current) {
            fc.remove(freehandTempPathRef.current);
            freehandTempPathRef.current = null;
          }

          // Create final perfect-freehand path
          const points = freehandPointsRef.current;
          if (points.length >= 2) {
            const finalPath = createFreehandPath(
              points,
              tools.strokeColor,
              tools.strokeWidth
            );
            if (finalPath) {
              (finalPath as any).name = `obj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
              fc.add(finalPath);
            }
          }

          freehandPointsRef.current = [];
          history.pushState('draw', beforeState, fc.toJSON().toString());
          fc.renderAll();
          return;
        }

        // Finalize shape
        if (isDrawingRef.current && tempShapeRef.current) {
          tempShapeRef.current.set({
            selectable: true,
            evented: true,
          });

          history.pushState(
            `draw-${tools.tool}`,
            beforeState,
            fc.toJSON().toString()
          );
          tempShapeRef.current = null;
          isDrawingRef.current = false;
          startPointRef.current = null;
          fc.renderAll();
        }
      };

      fc.on('mouse:down', handleMouseDown);
      fc.on('mouse:move', handleMouseMove);
      fc.on('mouse:up', handleMouseUp);

      // Track undo state: capture before-state when user starts modifying
      const undoBeforeRef = useRef('');
      const captureBefore = () => {
        undoBeforeRef.current = fc.toJSON().toString();
      };
      fc.on('object:moving', captureBefore);
      fc.on('object:scaling', captureBefore);
      fc.on('object:rotating', captureBefore);
      fc.on('object:modified', () => {
        if (undoBeforeRef.current) {
          history.pushState(
            'modify',
            undoBeforeRef.current,
            fc.toJSON().toString()
          );
          undoBeforeRef.current = '';
        }
      });

      // Filter out temp freehand paths from sync
      const origBeforeAdd = fc.on;
      fc.on('object:added', ((e: any) => {
        const obj = e.target as FabricObject;
        const name = (obj as any).name;
        if (name === '__freehand_temp__') {
          // Don't sync temp paths
          return;
        }
      }) as any);

      return () => {
        fc.off('mouse:wheel', handleWheel);
        fc.off('mouse:down', handleMouseDown);
        fc.off('mouse:move', handleMouseMove);
        fc.off('mouse:up', handleMouseUp);
      };
    }, [isReady, tools.tool, tools.strokeColor, tools.strokeWidth, tools.fillColor, tools.fontSize, readOnly, history, requestRenderThrottled]);

    // ============================================================
    // Touch: Pinch-to-zoom via native DOM events on container
    // ============================================================
    useEffect(() => {
      const container = containerRef.current;
      const fc = fcanvasRef.current;
      if (!container || !fc) return;

      const domTouchStart = (e: TouchEvent) => {
        const touches = e.touches;
        if (touches.length === 2) {
          e.preventDefault();
          e.stopPropagation();

          const dx = touches[0].clientX - touches[1].clientX;
          const dy = touches[0].clientY - touches[1].clientY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const centerX = (touches[0].clientX + touches[1].clientX) / 2;
          const centerY = (touches[0].clientY + touches[1].clientY) / 2;

          touchStateRef.current = {
            isPinching: true,
            lastDist: dist,
            lastCenter: { x: centerX, y: centerY },
            touchCount: 2,
          };

          // Cancel any active drawing
          isDrawingRef.current = false;
          tempShapeRef.current = null;
          freehandPointsRef.current = [];
          if (freehandTempPathRef.current) {
            fc.remove(freehandTempPathRef.current);
            freehandTempPathRef.current = null;
          }
        }
      };

      const domTouchMove = (e: TouchEvent) => {
        const touches = e.touches;
        if (touches.length === 2 && touchStateRef.current.isPinching) {
          e.preventDefault();
          e.stopPropagation();

          const dx = touches[0].clientX - touches[1].clientX;
          const dy = touches[0].clientY - touches[1].clientY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const centerX = (touches[0].clientX + touches[1].clientX) / 2;
          const centerY = (touches[0].clientY + touches[1].clientY) / 2;

          const prev = touchStateRef.current;

          // Zoom
          const scale = dist / Math.max(prev.lastDist, 1);
          let zoom = fc.getZoom() * scale;
          zoom = Math.min(Math.max(0.1, zoom), 10);

          // Pan
          const vpt = fc.viewportTransform!;
          vpt[4] += centerX - prev.lastCenter.x;
          vpt[5] += centerY - prev.lastCenter.y;

          // Apply zoom to center of pinch
          fc.zoomToPoint(new FabricPoint(centerX, centerY), zoom);

          touchStateRef.current = {
            isPinching: true,
            lastDist: dist,
            lastCenter: { x: centerX, y: centerY },
            touchCount: 2,
          };

          requestRenderThrottled();
        }
      };

      const domTouchEnd = (e: TouchEvent) => {
        if (e.touches.length < 2) {
          touchStateRef.current.isPinching = false;
          touchStateRef.current.touchCount = e.touches.length;
        }
      };

      container.addEventListener('touchstart', domTouchStart, { passive: false });
      container.addEventListener('touchmove', domTouchMove, { passive: false });
      container.addEventListener('touchend', domTouchEnd, { passive: false });

      return () => {
        container.removeEventListener('touchstart', domTouchStart);
        container.removeEventListener('touchmove', domTouchMove);
        container.removeEventListener('touchend', domTouchEnd);
      };
    }, [isReady, requestRenderThrottled]);

    // ============================================================
    // Keyboard Shortcuts (Phase 4: extended)
    // ============================================================
    useKeyboardShortcuts({
      onUndo: history.undo,
      onRedo: history.redo,
      onDelete: () => {
        const fc = fcanvasRef.current;
        if (!fc || readOnly) return;
        const active = fc.getActiveObject();
        if (active) {
          const before = fc.toJSON().toString();
          fc.remove(active);
          fc.renderAll();
          history.pushState('delete', before, fc.toJSON().toString());
          fc.discardActiveObject();
        }
      },
      onEscape: () => {
        const fc = fcanvasRef.current;
        if (fc) {
          fc.discardActiveObject();
          fc.requestRenderAll();
        }
      },
      onToolChange: (tool: CanvasTool) => {
        tools.setTool(tool);
      },
      onZoomToFit: () => {
        const fc = fcanvasRef.current;
        if (!fc || fc.getObjects().length === 0) return;
        // Calculate bounding rect of all objects
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        fc.getObjects().forEach((obj: FabricObject) => {
          const bound = obj.getBoundingRect();
          minX = Math.min(minX, bound.left);
          minY = Math.min(minY, bound.top);
          maxX = Math.max(maxX, bound.left + bound.width);
          maxY = Math.max(maxY, bound.top + bound.height);
        });

        const padding = 60;
        const contentWidth = maxX - minX + padding * 2;
        const contentHeight = maxY - minY + padding * 2;
        const scaleX = fc.getWidth() / contentWidth;
        const scaleY = fc.getHeight() / contentHeight;
        const zoom = Math.min(scaleX, scaleY, 2); // Cap at 2x

        fc.setViewportTransform([1, 0, 0, 1, 0, 0]);
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const vptCenterX = fc.getWidth() / 2;
        const vptCenterY = fc.getHeight() / 2;

        fc.zoomToPoint(
          new FabricPoint(vptCenterX, vptCenterY),
          zoom
        );

        // Pan to center content
        const vpt = fc.viewportTransform!;
        vpt[4] = vptCenterX - centerX * zoom;
        vpt[5] = vptCenterY - centerY * zoom;

        fc.requestRenderAll();
      },
      disabled: readOnly,
      readOnly,
    });

    // ============================================================
    // Compute viewport transform for remote cursor rendering
    // ============================================================
    const vpt = fcanvasRef.current?.viewportTransform;

    // ============================================================
    // Render
    // ============================================================
    return (
      <div
        ref={containerRef}
        className="w-full h-full relative"
        style={{
          cursor: isPanning
            ? 'grabbing'
            : tools.tool === 'hand'
              ? 'grab'
              : tools.tool === 'eraser'
                ? 'crosshair'
                : tools.tool === 'text'
                  ? 'text'
                  : tools.tool === 'draw'
                    ? 'crosshair'
                    : 'default',
          touchAction: 'none', // Prevent browser touch defaults for pinch-zoom
        }}
      >
        {!isReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading canvas...</span>
            </div>
          </div>
        )}
        <canvas id={canvasIdRef.current} />

        {/* Remote Cursors Overlay */}
        {remoteCursors.length > 0 && vpt && (
          <div
            ref={cursorOverlayRef}
            className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
            style={{ touchAction: 'none' }}
          >
            {remoteCursors.map((cursor) => (
              <div
                key={cursor.id}
                className="absolute transition-transform duration-75 ease-out"
                style={{
                  left: cursor.x * vpt[0] + vpt[4],
                  top: cursor.y * vpt[3] + vpt[5],
                  transform: 'translate(-2px, -2px)',
                }}
              >
                {/* Cursor dot */}
                <svg
                  width="12"
                  height="18"
                  viewBox="0 0 12 18"
                  fill="none"
                  className="drop-shadow-sm"
                >
                  <path
                    d="M1 1L6 16L7.5 10.5L12 9L1 1Z"
                    fill={cursor.color}
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
                {/* Name label */}
                <div
                  className="absolute left-3 top-3 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap shadow-sm"
                  style={{
                    backgroundColor: cursor.color,
                    color: 'white',
                  }}
                >
                  {cursor.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Zoom indicator */}
        <div className="absolute bottom-2 right-2 z-20 px-2 py-0.5 rounded-md bg-black/50 text-white text-[10px] font-mono">
          {Math.round((fcanvasRef.current?.getZoom() || 1) * 100)}%
        </div>
      </div>
    );
  }
);

FabricCanvasComponent.displayName = 'FabricCanvas';
export default FabricCanvasComponent;
