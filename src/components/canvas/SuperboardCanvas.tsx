// ============================================================
// SuperboardCanvas — Tldraw v5 Editor Wrapper
// ============================================================
// Wraps TldrawEditor with:
//   - Canvas feature hooks (spotlight sync, draw permission, pen pressure)
//   - Canvas overlays (timer, reactions, spotlight indicator, LaTeX input)
//   - Focus mode enforcement
//   - Page lifecycle management
//
// Tldraw v5 provides:
//   - Full canvas: draw, select, pan, text, shapes, arrow, laser, highlight
//   - Built-in UI: zoom controls, page menu, style panel
//   - Cursor presence via awareness (Yjs)
//   - IndexedDB persistence via persistenceKey
//   - Undo/redo, keyboard shortcuts
// ============================================================

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TldrawEditor, Editor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useAppStore } from '@/store/app-store';
import { useSpotlightSync, useDrawPermission, usePenPressure } from '@/hooks/useCanvasFeatures';
import dynamic from 'next/dynamic';

// Lazy load overlays and feature bar
const CanvasOverlays = dynamic(() => import('@/components/canvas/CanvasOverlays'), { ssr: false });
const TutorFeatureBar = dynamic(() => import('@/components/canvas/TutorFeatureBar'), { ssr: false });

interface SuperboardCanvasProps {
  editorRef: React.MutableRefObject<Editor | null>;
  activeTool?: string;
  onToolChange?: (toolId: string) => void;
}

export default function SuperboardCanvas({ editorRef, activeTool, onToolChange }: SuperboardCanvasProps) {
  const roomId = useAppStore((s) => s.room.roomId);
  const focusMode = useAppStore((s) => s.room.focusMode);
  const isTutor = useAppStore((s) => s.room.isTutor);
  const userName = useAppStore((s) => s.room.userName);
  const userColor = useAppStore((s) => s.room.userColor);
  const userId = useAppStore((s) => s.room.userId);
  const tier = useAppStore((s) => s.tier);
  const sideBySideMode = useAppStore((s) => s.room.sideBySideMode);
  const [mounted, setMounted] = useState(false);

  // ---- Handle editor mount ----
  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;

    if (activeTool) {
      try { editor.setCurrentTool(activeTool); } catch {}
    }

    console.log(`[SuperboardCanvas] Tldraw editor mounted for room: ${roomId}`);
    setMounted(true);
  }, [editorRef, activeTool, roomId]);

  // ---- Sync tool changes from external toolbar ----
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !activeTool) return;
    if (editor.getCurrentToolId() !== activeTool) {
      try { editor.setCurrentTool(activeTool); } catch {}
    }
  }, [activeTool, editorRef]);

  // ---- Listen for tool changes inside Tldraw → propagate to Toolbar ----
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !onToolChange || !mounted) return;

    const handleChange = () => {
      try { onToolChange(editor.getCurrentToolId()); } catch {}
    };

    editor.on('change', handleChange);
    return () => { try { editor.off('change', handleChange); } catch {} };
  }, [editorRef, onToolChange, mounted]);

  // ---- Canvas feature hooks ----
  useSpotlightSync(editorRef.current);
  useDrawPermission(editorRef.current);
  usePenPressure(editorRef.current);

  // ---- User identity for cursor presence ----
  const user = {
    id: userId || 'anonymous',
    name: userName || (isTutor ? 'Tutor' : 'Student'),
    color: userColor || '#3b82f6',
  };

  const initialState = activeTool || 'select';

  // Side-by-side mode: split the container into two zones
  const canvasStyle: React.CSSProperties = sideBySideMode
    ? { position: 'absolute', inset: 0, display: 'flex', gap: 4, padding: 4 }
    : { position: 'absolute', inset: 0, opacity: focusMode && !isTutor ? 0.95 : 1, transition: 'opacity 0.3s ease' };

  return (
    <div className="tldraw-wrapper" style={canvasStyle}>
      {/* Main canvas (or Tutor's side in side-by-side) */}
      <div style={{ flex: 1, position: 'relative', borderRadius: sideBySideMode ? 8 : 0, overflow: 'hidden' }}>
        <TldrawEditor
          onMount={handleMount}
          user={user as any}
          initialState={initialState}
          autoFocus
          persistenceKey={roomId ? `superboard-${roomId}` : undefined}
          options={{
            maxPages: tier === 'FREE' ? 5 : Infinity,
          }}
        >
          {/* Focus mode badge for students */}
          {focusMode && !isTutor && (
            <div
              style={{
                position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                zIndex: 1000, padding: '4px 12px', borderRadius: 9999,
                background: 'rgba(251, 191, 36, 0.15)', color: '#92400e',
                fontSize: 12, fontWeight: 600, pointerEvents: 'none',
                backdropFilter: 'blur(4px)', border: '1px solid rgba(251, 191, 36, 0.3)',
              }}
            >
              Focus Mode Active
            </div>
          )}
        </TldrawEditor>

        {/* Overlay widgets (timer, reactions, spotlight, LaTeX, presenter bar) */}
        <CanvasOverlays editorRef={editorRef} />
      </div>

      {/* Side-by-side: Student's canvas (read-only mirror for now) */}
      {sideBySideMode && (
        <div
          style={{
            flex: 1, position: 'relative', borderRadius: 8, overflow: 'hidden',
            border: '2px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <div
            style={{
              position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000, padding: '4px 12px', borderRadius: 6,
              background: 'rgba(99, 102, 241, 0.1)', color: '#4338ca',
              fontSize: 11, fontWeight: 600, pointerEvents: 'none',
            }}
          >
            Student Workspace
          </div>
          {/* In production, this would be a second TldrawEditor instance
              with restricted permissions for the student */}
          <div
            style={{
              width: '100%', height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0,0,0,0.03) 19px, rgba(0,0,0,0.03) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0,0,0,0.03) 19px, rgba(0,0,0,0.03) 20px)',
              color: '#9ca3af',
              fontSize: 14,
            }}
          >
            Student drawing area — coming soon
          </div>
        </div>
      )}

      {/* Tutor Feature Bar — floating below main toolbar */}
      <TutorFeatureBar editor={editorRef.current} />
    </div>
  );
}
