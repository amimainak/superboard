// ============================================================
// Room Page — [roomId]
// ============================================================
// Main Whiteboard / Waiting Room page.
// Determines if user is tutor or student, loads room data,
// applies branding, initializes real-time connections.
// ============================================================

'use client';

import Whiteboard from '@/components/canvas/Whiteboard';
import { useAppStore } from '@/store/app-store';
import { useEffect, useState, useMemo } from 'react';
import type { RoomData, BrandingConfig } from '@/types';

// Client component wrapper for the room page
function RoomPageContent({ roomId }: { roomId: string }) {
  const { setRoom, setBranding } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoom() {
      try {
        // Fetch room data from API
        const response = await fetch(`/api/room?roomId=${roomId}`);
        if (!response.ok) {
          if (response.status === 410) {
            setError('This lesson has ended. The link is no longer active.');
            return;
          }
          throw new Error('Failed to load room');
        }

        const roomData: RoomData = await response.json();

        // Set room state
        setRoom({
          roomId: roomData.id,
          subject: roomData.subject as 'MATH' | 'SCIENCE' | 'LANGUAGE' | 'GENERAL',
          isActive: roomData.isActive,
          brandingLogo: roomData.brandingLogo || null,
          brandingColor: roomData.brandingColor || null,
        });

        // Set branding config
        const branding: BrandingConfig = {
          logoUrl: roomData.brandingLogo,
          color: roomData.brandingColor,
          agencyName: roomData.tutor?.name || null,
          customDomain: null,
        };
        setBranding(branding);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load room');
        setLoading(false);
      }
    }

    if (roomId) {
      loadRoom();
    }
  }, [roomId, setRoom, setBranding]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Lesson Not Available</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return <Whiteboard />;
}

// Page component — uses params from the URL
export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  // Use a synchronous approach to extract roomId
  // In Next.js 16, we use React.use() to unwrap the Promise
  const roomId = useRoomId();

  if (!roomId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return <RoomPageContent roomId={roomId} />;
}

// Hook to extract roomId from URL without setState in effect
function useRoomId(): string | null {
  // Use useMemo with a function that reads window.location synchronously
  // This avoids the need for setState in an effect
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  return useMemo(() => {
    const match = pathname.match(/\/room\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);
}
