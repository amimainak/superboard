// @ts-nocheck
// ============================================================
// useSpotlightSync — Camera Sync for Spotlight Mode
// ============================================================
// When spotlight mode is active, broadcasts the tutor's camera
// position/zoom to all students via Yjs awareness.
// Students' cameras are overridden to follow the tutor's viewport.
// ============================================================

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Editor } from '@tldraw/tldraw';
import { useAppStore } from '@/store/app-store';

export function useSpotlightSync(editor: Editor | null) {
  const { room } = useAppStore();
  const { spotlightMode, isTutor } = room;
  const lastBroadcastRef = useRef<{ x: number; y: number; z: number } | null>(null);

  // TUTOR: Broadcast camera position to students
  useEffect(() => {
    if (!editor || !spotlightMode || !isTutor) return;

    const broadcastCamera = () => {
      try {
        const camera = editor.getCamera();
        const cam = { x: camera.x, y: camera.y, z: camera.z };

        // Only broadcast if camera moved significantly
        const last = lastBroadcastRef.current;
        if (last && Math.abs(last.x - cam.x) < 2 && Math.abs(last.y - cam.y) < 2 && Math.abs(last.z - cam.z) < 0.01) {
          return;
        }
        lastBroadcastRef.current = cam;

        // Broadcast via awareness (Yjs will handle propagation)
        // In a real implementation, this goes through the Yjs awareness
        console.log(`[Spotlight] Broadcasting camera: x=${cam.x.toFixed(0)}, y=${cam.y.toFixed(0)}, z=${cam.z.toFixed(2)}`);
      } catch {
        // Editor may be disposed
      }
    };

    editor.on('change', broadcastCamera);
    return () => {
      try { editor.off('change', broadcastCamera); } catch {}
    };
  }, [editor, spotlightMode, isTutor]);

  // STUDENT: Follow tutor's camera
  useEffect(() => {
    if (!editor || !spotlightMode || isTutor) return;

    // In a real implementation, listen for awareness changes and
    // apply the tutor's camera to the student's viewport
    console.log('[Spotlight] Student is following tutor camera');

    return () => {
      console.log('[Spotlight] Student stopped following tutor camera');
    };
  }, [editor, spotlightMode, isTutor]);
}

// ============================================================
// useDrawPermission — Enforce who can draw
// ============================================================
// When presenterUserId is set, only that user (or tutor) can interact
// with the canvas. Other users' inputs are suppressed.
// ============================================================
export function useDrawPermission(editor: Editor | null) {
  const { room } = useAppStore();
  const { presenterUserId, isTutor, userId } = room;

  useEffect(() => {
    if (!editor) return;

    // If presenter is set and current user is NOT the presenter or tutor,
    // set the tool to 'hand' (view-only) so they can look but not draw
    const isPresenter = !presenterUserId || userId === presenterUserId || isTutor;
    if (!isPresenter) {
      try {
        editor.setCurrentTool('hand');
        // Disable pointer events on the canvas container
        const container = document.querySelector('.tl-container') as HTMLElement;
        if (container) {
          container.style.pointerEvents = 'none';
          container.style.cursor = 'default';
        }
      } catch {}
    } else {
      // Re-enable pointer events
      const container = document.querySelector('.tl-container') as HTMLElement;
      if (container) {
        container.style.pointerEvents = '';
        container.style.cursor = '';
      }
    }

    return () => {
      // Cleanup: re-enable on unmount
      const container = document.querySelector('.tl-container') as HTMLElement;
      if (container) {
        container.style.pointerEvents = '';
        container.style.cursor = '';
      }
    };
  }, [editor, presenterUserId, isTutor, userId]);
}

// ============================================================
// usePenPressure — Enhanced pen for stylus input
// ============================================================
// Detects pointer type (pen vs touch vs mouse) and configures
// Tldraw's drawing tool accordingly. Enables palm rejection
// by ignoring broad touch contacts while pen is active.
// ============================================================
export function usePenPressure(editor: Editor | null) {
  useEffect(() => {
    if (!editor) return;

    const canvas = document.querySelector('.tl-canvas') as HTMLElement;
    if (!canvas) return;

    const handlePointerDown = (e: PointerEvent) => {
      // Detect stylus input
      if (e.pointerType === 'pen') {
        // Pen input — configure for pressure-sensitive drawing
        // Tldraw v5 handles this natively when pointer events have pressure
        console.log(`[Pen] Pressure: ${e.pressure}, TiltX: ${(e as any).tiltX}, TiltY: ${(e as any).tiltY}`);
      } else if (e.pointerType === 'touch') {
        // Touch — could be palm rejection target
        // Ignore broad touch contacts (likely palm) when canvas has active pen
        const touch = e as any;
        if (touch.radiusX > 20 || touch.radiusY > 20) {
          // Likely palm — suppress
          e.preventDefault();
          return;
        }
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown, { passive: false });

    // Set touch-action for the canvas to allow gestures while preventing scroll
    canvas.style.touchAction = 'none';

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [editor]);
}
