// ============================================================
// FabricCanvas — Interactive Whiteboard Canvas
// ============================================================
// Purpose-built for K-12 online tutoring with Fabric.js + perfect-freehand.
//
// Architecture:
//   Fabric.js canvas (bottom layer) — shape rendering engine
//   DOM overlay layers — UI components, text editing, cursor rendering
//
// Features:
//   - Smooth freehand drawing via perfect-freehand → Fabric Path
//   - Shape tools: rectangle, ellipse, line, arrow
//   - IText for inline text editing
//   - Object eraser (click to remove)
//   - Pan/zoom via mouse wheel + hand tool
//   - Undo/redo with keyboard shortcuts
//   - Per-object Yjs CRDT sync via useYjsCanvasSync
//   - Read-only mode for student lockout
//   - Multi-page support (one canvas state per page)
// ============================================================

'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
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
  type Object as FabricObject,
} from 'fabric';
import getStroke from 'perfect-freehand';
import { useCanvasTools, useCanvasHistory, useKeyboardShortcuts, type FabricCanvas } from './hooks';
import { useYjsCanvasSync } from './useYjsCanvasSync';

// ---- Types ----

interface Point {
  x: number;
  y: number;
}

export interface FabricCanvasProps {
  ydoc: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  pageIndex: number;
  isTutor: boolean;
  readOnly: boolean;
  onCanvasReady?: (canvas: FabricCanvas) => void;
}

// ---- Perfect-Freehand → SVG Path String ----

function freehandStrokeToSvgPath(
  points: { x: number; y: number; pressure?: number }[],
  strokeWidth: number
): string {
  const outline = getStroke(points, {
    size: strokeWidth * 3,
    thinning: 0.5,
    smoothing: 0.6,
    streamline: 0.5,
    simulatePressure: true,
  });

  if (outline.length < 2) return '';

  let d = `M ${outline[0][0].toFixed(1)} ${outline[0][1].toFixed(1)}`;
  for (let i = 1; i < outline.length; i++) {
    d += ` L ${outline[i][0].toFixed(1)} ${outline[i][1].toFixed(1)}`;
  }
  d += ' Z';
  return d;
}

// ---- Main Component ----

export default function FabricCanvas({
  ydoc,
  pageIndex,
  isTutor,
  readOnly,
  onCanvasReady,
}: FabricCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fcanvasRef = useRef<FabricCanvas | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  // Drawing state for shapes
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<Point | null>(null);
  const tempShapeRef = useRef<FabricObject | null>(null);

  // ---- Hooks ----
  const tools = useCanvasTools(fcanvasRef);
  const history = useCanvasHistory(fcanvasRef);

  const sync = useYjsCanvasSync({
    ydoc,
    fcanvasRef,
    pageIndex,
    onRemoteChange: () => {},
  });

  // ============================================================
  // Canvas Initialization
  // ============================================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const fc = new Canvas('fabric-whiteboard', {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: '#ffffff',
      selection: false,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
      fireMiddleClick: true,
    });

    const brush = new PencilBrush(fc);
    brush.color = tools.strokeColor;
    brush.width = tools.strokeWidth;
    fc.freeDrawingBrush = brush;
    fc.isDrawingMode = false;

    fcanvasRef.current = fc;
    setIsReady(true);

    sync.loadInitialState(fc);
    sync.wireCanvasEvents(fc);
    sync.setupRemoteObserver();
    onCanvasReady?.(fc);

    return () => {
      sync.flushPending();
      fc.dispose();
      fcanvasRef.current = null;
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // Resize Handler
  // ============================================================
  useEffect(() => {
    const container = containerRef.current;
    const fc = fcanvasRef.current;
    if (!container || !fc) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        fc.setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
        fc.requestRenderAll();
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
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
    };
    fc.on('mouse:wheel', handleWheel);

    // ---- Mouse interactions ----
    let panningActive = false;
    let lastPosX = 0;
    let lastPosY = 0;
    let beforeState = '';

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
        return;
      }
    };

    const handleMouseMove = (opt: any) => {
      const e = opt.e as MouseEvent;

      // Panning
      if (panningActive) {
        const vpt = fc.viewportTransform!;
        vpt[4] += e.clientX - lastPosX;
        vpt[5] += e.clientY - lastPosY;
        lastPosX = e.clientX;
        lastPosY = e.clientY;
        fc.requestRenderAll();
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
          t.set({ left, top, width: Math.abs(pointer.x - start.x), height: Math.abs(pointer.y - start.y) });
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
              angle: Math.atan2(pointer.y - start.y, pointer.x - start.x) * (180 / Math.PI) + 90,
            });
          }
          t.setCoords();
        }

        fc.requestRenderAll();
      }
    };

    const handleMouseUp = () => {
      // Stop panning
      if (panningActive) {
        panningActive = false;
        setIsPanning(false);
        (fc as any).defaultCursor = tools.tool === 'hand' ? 'grab' : 'default';
        return;
      }

      // Finalize shape
      if (isDrawingRef.current && tempShapeRef.current) {
        tempShapeRef.current.set({
          selectable: tools.tool === 'select',
          evented: tools.tool === 'select' || tools.tool === 'eraser',
        });

        history.pushState(`draw-${tools.tool}`, beforeState, fc.toJSON().toString());
        tempShapeRef.current = null;
        isDrawingRef.current = false;
        startPointRef.current = null;
      }
    };

    fc.on('mouse:down', handleMouseDown);
    fc.on('mouse:move', handleMouseMove);
    fc.on('mouse:up', handleMouseUp);

    // Track undo state: capture before-state when user starts modifying
    const undoBeforeRef = useRef('');
    const captureBefore = () => { undoBeforeRef.current = fc.toJSON().toString(); };
    fc.on('object:moving', captureBefore);
    fc.on('object:scaling', captureBefore);
    fc.on('object:rotating', captureBefore);
    fc.on('object:modified', () => {
      if (undoBeforeRef.current) {
        history.pushState('modify', undoBeforeRef.current, fc.toJSON().toString());
        undoBeforeRef.current = '';
      }
    });

    return () => {
      fc.off('mouse:wheel', handleWheel);
      fc.off('mouse:down', handleMouseDown);
      fc.off('mouse:move', handleMouseMove);
      fc.off('mouse:up', handleMouseUp);
    };
  }, [isReady, tools.tool, tools.strokeColor, tools.strokeWidth, tools.fillColor, tools.fontSize, readOnly, history]);

  // ============================================================
  // Keyboard Shortcuts
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
    disabled: readOnly,
  });

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
              : 'default',
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
      <canvas id="fabric-whiteboard" />
    </div>
  );
}
