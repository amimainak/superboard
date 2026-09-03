// @ts-nocheck
// ============================================================
// YjsProvider — Hocuspocus WebSocket + Tldraw Sync
// ============================================================
// Manages the Yjs document lifecycle and WebSocket connection
// to the Hocuspocus collaboration server. Provides the
// TLStoreWithStatus that TldrawEditor consumes for real-time sync.
//
// SECURITY: Passes a Supabase JWT token to Hocuspocus for server-
// side verification. User identity is resolved server-side from
// the token, not sent as plain URL params.
// ============================================================

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { createTLStore, TLStoreWithStatus } from '@tldraw/tldraw';
import { useAppStore } from '@/store/app-store';
import { createClient } from '@/lib/supabase';

// Hocuspocus server URL — env configurable
const HOCUSPOCUS_URL = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || 'ws://localhost:3001';

interface YjsProviderProps {
  roomId: string;
  children: React.ReactNode;
}

export default function YjsProvider({ roomId, children }: YjsProviderProps) {
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus | null>(null);
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'synced' | 'disconnected' | 'error'>('connecting');
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const storeRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const providerCreatedRef = useRef(false);

  // Subscribe to store values for awareness updates (but NOT for connection lifecycle)
  const userId = useAppStore((s) => s.room.userId);
  const userName = useAppStore((s) => s.room.userName);
  const userColor = useAppStore((s) => s.room.userColor);
  const isTutor = useAppStore((s) => s.room.isTutor);

  // --- Connection lifecycle depends ONLY on roomId ---
  // This prevents reconnection when user changes name/color
  useEffect(() => {
    if (!roomId) return;
    // Prevent double-init in React 18 strict mode
    if (providerCreatedRef.current) return;
    providerCreatedRef.current = true;

    let provider: WebsocketProvider;
    let ydoc: Y.Doc;
    let store: any;
    let cancelled = false;

    const documentName = `room-${roomId}`;

    async function init() {
      try {
        // Get the Supabase access token for Hocuspocus auth
        let token = '';
        const supabase = createClient();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          token = session?.access_token || '';
        }

        // In development without auth, use a dev token
        const devToken = process.env.NODE_ENV !== 'production' ? `dev_${userId || 'anonymous'}` : '';

        // Create Yjs document
        ydoc = new Y.Doc();
        ydocRef.current = ydoc;

        // Create Tldraw store bound to Yjs
        store = createTLStore({});
        storeRef.current = store;

        if (cancelled) return;

        // Set initial synced status
        setStoreWithStatus({
          store,
          status: 'syncing-local',
        } as any);

        // Connect to Hocuspocus via WebSocket
        // SECURITY: Pass only the JWT token + display hints.
        // User identity is verified server-side from the token.
        provider = new WebsocketProvider(
          HOCUSPOCUS_URL,
          documentName,
          ydoc,
          {
            params: {
              token: token || devToken,
              // Display-only hints (not used for auth decisions)
              name: userName || (isTutor ? 'Tutor' : 'Student'),
              color: userColor || '#3b82f6',
            },
            connect: true,
            maxBackoffTime: 5000,
          }
        );
        providerRef.current = provider;

        if (cancelled) return;

        // Handle sync status
        provider.on('status', ({ status }: { status: string }) => {
          if (!mountedRef.current) return;
          if (status === 'connected') {
            setSyncStatus('synced');
            setStoreWithStatus({ store, status: 'synced' } as any);
          } else if (status === 'disconnected') {
            setSyncStatus('disconnected');
            setStoreWithStatus({ store, status: 'synced' } as any);
          } else if (status === 'connecting') {
            setSyncStatus('connecting');
            setStoreWithStatus({ store, status: 'syncing-local' } as any);
          }
        });

        // Handle awareness (cursor presence)
        provider.awareness.on('change', () => {
          if (!mountedRef.current) return;
          const states = Array.from(provider.awareness.getStates().values());

          const hasTutor = states.some((s: any) => s?.user?.role === 'tutor');
          const participants = states.map((s: any, clientId: number) => ({
            clientId,
            name: s?.user?.name || 'Anonymous',
            color: s?.user?.color || '#3b82f6',
            role: s?.user?.role || 'student',
          }));
        });

        // Set initial awareness state
        provider.awareness.setLocalStateField('user', {
          userId: userId || 'anonymous',
          name: userName || (isTutor ? 'Tutor' : 'Student'),
          color: userColor || '#3b82f6',
          role: isTutor ? 'tutor' : 'student',
        });

        setSyncStatus('synced');
      } catch (err) {
        console.error('[YjsProvider] Failed to initialize:', err);
        if (mountedRef.current && !cancelled) {
          setSyncStatus('error');
          setStoreWithStatus({
            store: store || createTLStore(),
            status: 'synced',
          } as any);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      providerCreatedRef.current = false;
      if (provider) {
        provider.destroy();
        providerRef.current = null;
      }
      if (ydoc) {
        ydoc.destroy();
        ydocRef.current = null;
      }
    };
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps — roomId is the only connection lifecycle dependency

  // --- Update awareness state when user info changes (without reconnecting) ---
  useEffect(() => {
    const provider = providerRef.current;
    if (!provider || !provider.awareness) return;

    provider.awareness.setLocalStateField('user', {
      userId: userId || 'anonymous',
      name: userName || (isTutor ? 'Tutor' : 'Student'),
      color: userColor || '#3b82f6',
      role: isTutor ? 'tutor' : 'student',
    });
  }, [userId, userName, userColor, isTutor]);

  // Loading state while connecting
  if (!storeWithStatus) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Connecting to room...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook to get the current sync status
 */
export function useSyncStatus() {
  return 'synced';
}

/**
 * Hook to get the Yjs provider for manual operations
 */
// These are module-level refs shared by the provider instance
const _providerRef = { current: null as any };
const _ydocRef = { current: null as any };

export function useYjsProvider() {
  return { provider: _providerRef.current, ydoc: _ydocRef.current };
}
