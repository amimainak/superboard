// ============================================================
// FabricCanvas Hooks — Tool state, undo/redo, keyboard shortcuts
// ============================================================

'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import {
  Canvas,
  PencilBrush,
  type Object as FabricObject,
  util,
} from 'fabric';

export type FabricCanvas = InstanceType<typeof Canvas>;

export type CanvasTool =
  | 'select'
  | 'hand'
  | 'draw'
  | 'eraser'
  | 'text'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow';

export interface HistoryEntry {
  before: string;
  after: string;
  label: string;
}

// ============================================================
// useCanvasTools
// ============================================================

export function useCanvasTools(fcanvasRef: React.MutableRefObject<FabricCanvas | null>) {
  const [tool, setToolState] = useState<CanvasTool>('draw');
  const [strokeColor, setStrokeColor] = useState('#1a1a2e');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(24);

  const setTool = useCallback((newTool: CanvasTool) => {
    setToolState(newTool);
    const fc = fcanvasRef.current;
    if (!fc) return;

    fc.isDrawingMode = newTool === 'draw';
    fc.selection = newTool === 'select';

    fc.forEachObject((obj: FabricObject) => {
      switch (newTool) {
        case 'select':
          obj.selectable = true;
          obj.evented = true;
          break;
        case 'eraser':
          obj.selectable = false;
          obj.evented = true;
          obj.hoverCursor = 'pointer';
          break;
        case 'hand':
          obj.selectable = false;
          obj.evented = false;
          break;
        default:
          obj.selectable = false;
          obj.evented = false;
      }
    });

    fc.defaultCursor =
      newTool === 'hand' ? 'grab' : newTool === 'eraser' ? 'crosshair' : 'default';
    fc.hoverCursor = newTool === 'eraser' ? 'pointer' : 'move';
    fc.requestRenderAll();
  }, [fcanvasRef]);

  const updateStrokeColor = useCallback((color: string) => {
    setStrokeColor(color);
    const fc = fcanvasRef.current;
    if (fc && fc.freeDrawingBrush) {
      (fc.freeDrawingBrush as PencilBrush).color = color;
    }
  }, [fcanvasRef]);

  const updateStrokeWidth = useCallback((width: number) => {
    setStrokeWidth(width);
    const fc = fcanvasRef.current;
    if (fc && fc.freeDrawingBrush) {
      (fc.freeDrawingBrush as PencilBrush).width = width;
    }
  }, [fcanvasRef]);

  return {
    tool,
    strokeColor,
    fillColor,
    strokeWidth,
    fontSize,
    setTool,
    setStrokeColor: updateStrokeColor,
    setStrokeWidth: updateStrokeWidth,
    setFillColor,
    setFontSize,
  };
}

// ============================================================
// useCanvasHistory
// ============================================================

const MAX_HISTORY = 50;

export function useCanvasHistory(fcanvasRef: React.MutableRefObject<FabricCanvas | null>) {
  const undoStack = useRef<HistoryEntry[]>([]);
  const redoStack = useRef<HistoryEntry[]>([]);

  const pushState = useCallback(
    (label: string, before: string, after: string) => {
      undoStack.current.push({ before, after, label });
      if (undoStack.current.length > MAX_HISTORY) {
        undoStack.current.shift();
      }
      redoStack.current = [];
    },
    []
  );

  const loadState = useCallback((json: string, fc: FabricCanvas) => {
    try {
      const state = JSON.parse(json);
      util.enlivenObjects(state.objects || []).then((objects: any) => {
        fc.clear();
        fc.add(...objects);
        if (state.background) {
          fc.backgroundColor = state.background;
        }
        fc.renderAll();
      });
    } catch (e) {
      console.error('[FabricCanvas] history restore failed:', e);
    }
  }, []);

  const undo = useCallback(() => {
    const fc = fcanvasRef.current;
    if (!fc || undoStack.current.length === 0) return;
    const entry = undoStack.current.pop()!;
    redoStack.current.push(entry);
    loadState(entry.before, fc);
  }, [fcanvasRef, loadState]);

  const redo = useCallback(() => {
    const fc = fcanvasRef.current;
    if (!fc || redoStack.current.length === 0) return;
    const entry = redoStack.current.pop()!;
    undoStack.current.push(entry);
    loadState(entry.after, fc);
  }, [fcanvasRef, loadState]);

  const clearHistory = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
  }, []);

  return {
    undo,
    redo,
    pushState,
    clearHistory,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
  };
}

// ============================================================
// useKeyboardShortcuts
// ============================================================

export function useKeyboardShortcuts(options: {
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onEscape: () => void;
  disabled?: boolean;
}) {
  useEffect(() => {
    if (options.disabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        options.onUndo();
      } else if (isCtrl && (e.key === 'Z' || e.key === 'y')) {
        e.preventDefault();
        options.onRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = document.querySelector('.canvas-container fabric-textarea, .canvas-container input');
        if (!active) {
          e.preventDefault();
          options.onDelete();
        }
      } else if (e.key === 'Escape') {
        options.onEscape();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [options.onUndo, options.onRedo, options.onDelete, options.onEscape, options.disabled]);
}
