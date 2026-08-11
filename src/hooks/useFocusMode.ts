// ============================================================
// useFocusMode Hook
// ============================================================
// Syncs viewport/pan/zoom between tutor and student.
// When tutor enables Focus Mode, broadcasts their viewport state
// to all students via Yjs awareness. Students receive and apply.
//
// Sprint 1: Fully wired viewport broadcast + receive.
// ============================================================

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import type { Awareness } from 'y-protocols/awareness';

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

interface UseFocusModeOptions {
  /** Yjs awareness instance for broadcasting viewport */
  awareness?: Awareness | null;
  /** Called when a remote viewport is received (student side) */
  onViewportReceived?: (viewport: ViewportState) => void;
  /** Called when the tutor's viewport changes (to broadcast) */
  getViewport?: () => ViewportState | null;
}

export function useFocusMode(options: UseFocusModeOptions = {}) {
  const { awareness, onViewportReceived, getViewport } = options;
  const { room, toggleFocusMode } = useAppStore();
  const { focusMode, isTutor } = room;
  const lastBroadcastRef = useRef<string>('');
  const debouncedBroadcastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Broadcast viewport state to students via Yjs awareness.
   * Debounced to avoid flooding on continuous pan/zoom.
   */
  const broadcastViewport = useCallback(
    (viewport: ViewportState) => {
      if (!focusMode || !isTutor || !awareness) return;

      // Throttle: skip if viewport hasn't changed meaningfully (rounded to 1px / 0.01 zoom)
      const key = `${Math.round(viewport.x)},${Math.round(viewport.y)},${viewport.zoom.toFixed(2)}`;
      if (key === lastBroadcastRef.current) return;
      lastBroadcastRef.current = key;

      // Debounce broadcast by 50ms to batch rapid changes
      if (debouncedBroadcastRef.current) {
        clearTimeout(debouncedBroadcastRef.current);
      }
      debouncedBroadcastRef.current = setTimeout(() => {
        awareness.setLocalStateField('viewport', {
          x: viewport.x,
          y: viewport.y,
          zoom: viewport.zoom,
        });
      }, 50);
    },
    [focusMode, isTutor, awareness]
  );

  /**
   * Receive viewport state from tutor (student side).
   * Applies the viewport via the callback.
   */
  const applyViewport = useCallback(
    (viewport: ViewportState) => {
      if (!focusMode) return;
      onViewportReceived?.(viewport);
    },
    [focusMode, onViewportReceived]
  );

  /**
   * Toggle focus mode on/off (tutor only).
   * When turning off, clear the broadcasted viewport so students regain control.
   */
  const toggle = useCallback(() => {
    if (isTutor) {
      // Clear viewport from awareness when disabling focus mode
      if (focusMode && awareness) {
        awareness.setLocalStateField('viewport', null);
      }
      toggleFocusMode();
    }
  }, [isTutor, focusMode, awareness, toggleFocusMode]);

  // ============================================================
  // Student side: Listen for tutor's viewport in awareness
  // ============================================================
  useEffect(() => {
    if (!awareness || isTutor) return;

    const handleAwarenessChange = () => {
      const states = awareness.getStates() as Map<number, Record<string, unknown>>;
      states.forEach((state, clientId) => {
        if (clientId === awareness.clientId) return;
        const user = state.user as { role?: string } | undefined;
        const viewport = state.viewport as ViewportState | null | undefined;

        // Only apply viewport from tutor
        if (user?.role === 'tutor' && viewport && focusMode) {
          applyViewport(viewport);
        }
      });
    };

    awareness.on('change', handleAwarenessChange);
    return () => {
      awareness.off('change', handleAwarenessChange);
    };
  }, [awareness, isTutor, focusMode, applyViewport]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debouncedBroadcastRef.current) {
        clearTimeout(debouncedBroadcastRef.current);
      }
    };
  }, []);

  return {
    focusMode,
    isFocusModeAvailable: isTutor,
    broadcastViewport,
    applyViewport,
    toggle,
  };
}
