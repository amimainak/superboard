// ============================================================
// useYjsProvider — Yjs + Hocuspocus WebSocket hook
// ============================================================
// Manages the lifecycle of a Y.Doc connected to the Hocuspocus
// CRDT collaboration server. Handles awareness (cursor presence),
// document persistence, and connection state.
// ============================================================

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';
import { HocuspocusProvider } from '@hocuspocus/provider';

export interface UseYjsProviderOptions {
  roomId: string;
  /** User ID for awareness */
  userId: string;
  /** Display name for awareness cursors */
  userName: string;
  /** Color for awareness cursor */
  userColor: string;
  /** Role: 'tutor' or 'student' */
  userRole: 'tutor' | 'student';
  /** Called when awareness states change (e.g., tutor presence) */
  onAwarenessChange?: (states: Map<number, Record<string, unknown>>) => void;
  /** Called when document updates (for auto-save triggers) */
  onChange?: (ydoc: Y.Doc) => void;
}

export interface UseYjsProviderReturn {
  ydoc: Y.Doc | null;
  provider: HocuspocusProvider | null;
  isConnected: boolean;
  isSyncing: boolean;
  awareness: Awareness | null;
  /** Local awareness state setter */
  setLocalState: (state: Record<string, unknown>) => void;
}

export function useYjsProvider(options: UseYjsProviderOptions): UseYjsProviderReturn {
  const {
    roomId,
    userId,
    userName,
    userColor,
    userRole,
    onAwarenessChange,
    onChange,
  } = options;

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    // Create Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Get Hocuspocus server URL from env or derive from current origin
    const wsUrl = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL ||
      (typeof window !== 'undefined'
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/hocuspocus`
        : '');

    // SECURITY FIX (RT-C01): Wire auth token and user context into the
    // Hocuspocus WebSocket connection for server-side JWT verification.
    // We use an IIFE to handle async Supabase session retrieval inside useEffect.
    (async () => {
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      let sessionToken: string | undefined;
      try {
        if (supabaseUrl && supabaseAnonKey) {
          const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
          const { data: { session } } = await supabase.auth.getSession();
          sessionToken = session?.access_token || undefined;
        }
      } catch {
        // Session unavailable — connection will fail auth on server side
      }

      const providerOptions: Record<string, unknown> = {
        url: wsUrl,
        name: `room-${roomId}`,
        document: ydoc,
        token: sessionToken,
        parameters: {
          token: sessionToken,
          userId,
          role: userRole,
        },
      };

      const provider = new HocuspocusProvider(providerOptions as ConstructorParameters<typeof HocuspocusProvider>[0]);

      providerRef.current = provider;

      // Connection state events
      provider.on('status', (event: { status: string }) => {
        setIsConnected(event.status === 'connected');
        if (event.status === 'connected' || event.status === 'disconnected') {
          setIsSyncing(false);
        }
      });

      provider.on('sync', (event: boolean) => {
        setIsSyncing(!event);
      });

      // Awareness change — broadcast local state and notify parent
      provider.on('awareness-change', () => {
        if (provider.awareness) {
          const states = provider.awareness.getStates();
          onAwarenessChange?.(states as unknown as Map<number, Record<string, unknown>>);
        }
      });

      // Document change — notify parent for auto-save triggers
      ydoc.on('update', () => {
        onChange?.(ydoc);
      });

      // Set initial local awareness state
      if (provider.awareness) {
        provider.awareness.setLocalState({
          user: {
            id: userId,
            name: userName,
            color: userColor,
            role: userRole,
          },
        });
      }
    })();

    // Cleanup on unmount
    return () => {
      const provider = providerRef.current;
      if (provider) provider.destroy();
      const ydoc = ydocRef.current;
      if (ydoc) ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      setIsConnected(false);
      setIsSyncing(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const setLocalState = useCallback((state: Record<string, unknown>) => {
    const provider = providerRef.current;
    if (provider?.awareness) {
      provider.awareness.setLocalState(state);
    }
  }, []);

  return {
    ydoc: ydocRef.current,
    provider: providerRef.current,
    isConnected,
    isSyncing,
    awareness: providerRef.current?.awareness ?? null,
    setLocalState,
  };
}
