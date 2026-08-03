// ============================================================
// useFocusMode Hook
// ============================================================
// Syncs viewport/pan/zoom between tutor and student.
// When tutor enables Focus Mode, broadcasts their camera state
// to all students via Yjs presence.
// ============================================================

'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/store/app-store';

interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export function useFocusMode() {
  const { room, toggleFocusMode } = useAppStore();
  const { focusMode, isTutor, participants } = room;

  /**
   * Broadcast viewport state to students.
   * Called on every camera change when focus mode is active.
   * Uses Yjs awareness/presence under the hood.
   */
  const broadcastViewport = useCallback(
    (viewport: ViewportState) => {
      if (!focusMode || !isTutor) return;

      // TODO: Send viewport state via Yjs awareness
      // The Hocuspocus server will broadcast this to all connected clients.
      // In the whiteboard component, students will receive this and
      // set their camera to match.
      console.log('[FocusMode] Broadcasting viewport:', viewport);
    },
    [focusMode, isTutor]
  );

  /**
   * Receive viewport state from tutor (student side).
   * Locks the student's viewport to match.
   */
  const applyViewport = useCallback((viewport: ViewportState) => {
    if (focusMode) {
      // TODO: Apply viewport to the Tldraw canvas
      // editor.camera = { x: viewport.x, y: viewport.y, z: viewport.zoom }
      console.log('[FocusMode] Applying viewport:', viewport);
    }
  }, [focusMode]);

  /**
   * Toggle focus mode on/off (tutor only).
   */
  const toggle = useCallback(() => {
    if (isTutor) {
      toggleFocusMode();
    }
  }, [isTutor, toggleFocusMode]);

  return {
    focusMode,
    isFocusModeAvailable: isTutor,
    broadcastViewport,
    applyViewport,
    toggle,
  };
}
